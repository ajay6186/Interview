# ============================================================================
# Examples 1.1 — Spark Basics  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Run in Databricks notebook or spark-submit
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType,
    DoubleType, BooleanType, LongType, TimestampType
)
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("spark-basics-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Create SparkSession (already done above). Get Spark version.
print("Ex01 Spark version:", spark.version)

# 2. Create DataFrame from Python list of tuples
df = spark.createDataFrame([(1, "Alice", 30), (2, "Bob", 25)],
                           ["id", "name", "age"])
df.show()

# 3. Print schema
df.printSchema()

# 4. Count rows
print("Ex04 count:", df.count())

# 5. Show column names
print("Ex05 columns:", df.columns)

# 6. Show dtypes
print("Ex06 dtypes:", df.dtypes)

# 7. Select single column
df.select("name").show()

# 8. Select multiple columns
df.select("name", "age").show()

# 9. Filter rows
df.filter(df.age > 26).show()

# 10. Add a new column with withColumn
df2 = df.withColumn("age_plus_10", df.age + 10)
df2.show()

# 11. Rename a column
df3 = df.withColumnRenamed("name", "full_name")
df3.show()

# 12. Drop a column
df4 = df.drop("age")
df4.show()

# 13. orderBy ascending
df.orderBy("age").show()

# 14. orderBy descending
df.orderBy(df.age.desc()).show()

# 15. limit rows
df.limit(1).show()

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Define explicit schema with StructType
schema = StructType([
    StructField("id",    LongType(),   nullable=False),
    StructField("name",  StringType(), nullable=True),
    StructField("score", DoubleType(), nullable=True),
])
data = [(1, "Alice", 95.5), (2, "Bob", 87.0), (3, "Carol", None)]
df5 = spark.createDataFrame(data, schema)
df5.printSchema()
df5.show()

# 17. Access SparkContext
sc = spark.sparkContext
print("Ex17 appName:", sc.appName)

# 18. Create RDD and convert to DataFrame
rdd = sc.parallelize([(1, "x"), (2, "y")])
df_rdd = rdd.toDF(["id", "val"])
df_rdd.show()

# 19. collect() — bring all rows to driver
rows = df.collect()
print("Ex19 first row:", rows[0])

# 20. first() and head()
print("Ex20 first:", df.first())
print("Ex20 head(2):", df.head(2))

# 21. take(n)
print("Ex21 take(2):", df.take(2))

# 22. show with truncate=False
df5.show(truncate=False)

# 23. toPandas()
pdf = df.toPandas()
print("Ex23 pandas shape:", pdf.shape)

# 24. createDataFrame from pandas
import pandas as pd
pdf2 = pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})
df_pd = spark.createDataFrame(pdf2)
df_pd.show()

# 25. distinct()
df_dup = spark.createDataFrame([(1, "A"), (1, "A"), (2, "B")], ["id", "val"])
df_dup.distinct().show()

# 26. dropDuplicates()
df_dup.dropDuplicates(["id"]).show()

# 27. na.drop() — drop rows with any null
df5.na.drop().show()

# 28. na.fill() — fill nulls
df5.na.fill({"score": 0.0}).show()

# 29. describe() — summary statistics
df5.describe("score").show()

# 30. cache and unpersist
df.cache()
print("Ex30 count (cached):", df.count())
df.unpersist()

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. explain() — physical plan
df.filter(df.age > 25).explain()

# 32. spark.sql with registerTempTable
df.createOrReplaceTempView("people")
spark.sql("SELECT * FROM people WHERE age > 25").show()

# 33. Multiple withColumn chaining
df6 = (df
       .withColumn("age_sq", df.age ** 2)
       .withColumn("is_adult", df.age >= 18)
       .withColumn("label", F.lit("human")))
df6.show()

# 34. F.col() and F.lit()
df.select(F.col("name"), F.lit(42).alias("const")).show()

# 35. F.expr() for SQL-style expressions
df.withColumn("age_bucket", F.expr("CASE WHEN age < 30 THEN 'young' ELSE 'senior' END")).show()

# 36. alias()
df.select(df.name.alias("person_name")).show()

# 37. cast() — change column type
df.withColumn("age_str", df.age.cast(StringType())).printSchema()

# 38. isNull / isNotNull
df5.filter(F.col("score").isNull()).show()
df5.filter(F.col("score").isNotNull()).show()

# 39. isin()
df.filter(df.name.isin("Alice", "Carol")).show()

# 40. between()
df.filter(df.age.between(25, 30)).show()

# 41. like() — SQL LIKE pattern
df.filter(df.name.like("A%")).show()

# 42. Broadcast variable
lookup = sc.broadcast({"Alice": "admin", "Bob": "user"})
print("Ex42 broadcast lookup:", lookup.value)

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Accumulator
acc = sc.accumulator(0)
def add_acc(row):
    global acc
    acc += 1
df.foreach(lambda r: None)  # accumulators update in actions
print("Ex43 accumulator:", acc.value)

# 44. sparkContext.parallelize with partitions
rdd2 = sc.parallelize(range(100), numSlices=4)
print("Ex44 partitions:", rdd2.getNumPartitions())

# 45. repartition vs coalesce
df_rep = df.repartition(4)
print("Ex45 repartitions:", df_rep.rdd.getNumPartitions())
df_coal = df_rep.coalesce(2)
print("Ex45 coalesced:", df_coal.rdd.getNumPartitions())

# 46. persist with storage level
from pyspark import StorageLevel
df.persist(StorageLevel.MEMORY_AND_DISK)
df.count()
df.unpersist()

# 47. foreachPartition
def process_partition(rows):
    for row in rows:
        pass  # simulate partition-level processing
df.foreachPartition(process_partition)
print("Ex47 foreachPartition ok")

# 48. mapPartitions via RDD
result = df.rdd.mapPartitions(lambda rows: [sum(1 for _ in rows)]).collect()
print("Ex48 rows per partition:", result)

# 49. spark.conf — runtime configuration
spark.conf.set("spark.sql.shuffle.partitions", "8")
print("Ex49 shuffle partitions:", spark.conf.get("spark.sql.shuffle.partitions"))

# 50. Application ID and UI link
print("Ex50 App ID:", sc.applicationId)
# In Databricks: spark.sparkContext.uiWebUrl gives the Spark UI link


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
