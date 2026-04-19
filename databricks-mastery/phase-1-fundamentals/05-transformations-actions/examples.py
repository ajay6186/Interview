# ============================================================================
# Examples 1.5 — Transformations & Actions  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

spark = SparkSession.builder.appName("transformations-actions-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

df = spark.createDataFrame([
    (1,"Alice",95000.0,"Engineering"),(2,"Bob",72000.0,"Marketing"),
    (3,"Carol",105000.0,"Engineering"),(4,"Dave",68000.0,"Marketing"),
    (5,"Eve",88000.0,"Engineering"),(6,"Frank",60000.0,"HR"),
], ["id","name","salary","dept"])

# ── BASIC (Transformations — lazy) ───────────────────────────────────────────

# 1. select — TRANSFORMATION
t1 = df.select("name","salary")
print("Ex01 type:", type(t1))  # DataFrame, not executed yet

# 2. filter — TRANSFORMATION
t2 = df.filter(F.col("salary") > 80000)

# 3. withColumn — TRANSFORMATION
t3 = df.withColumn("bonus", F.col("salary") * 0.1)

# 4. groupBy — TRANSFORMATION (returns GroupedData)
t4 = df.groupBy("dept")

# 5. orderBy — TRANSFORMATION
t5 = df.orderBy("salary")

# 6. join — TRANSFORMATION (not executed until action)
dept_info = spark.createDataFrame([("Engineering","NYC"),("Marketing","LA"),("HR","Chicago")],
                                  ["dept","city"])
t6 = df.join(dept_info, on="dept", how="inner")

# 7. union — TRANSFORMATION
extra = spark.createDataFrame([(7,"Grace",80000.0,"HR")],["id","name","salary","dept"])
t7 = df.union(extra)

# 8. distinct — TRANSFORMATION
t8 = df.select("dept").distinct()

# 9. dropDuplicates — TRANSFORMATION
t9 = df.dropDuplicates(["dept"])

# 10. limit — TRANSFORMATION
t10 = df.limit(3)

# 11. sample — TRANSFORMATION
t11 = df.sample(fraction=0.5, seed=42)

# 12. repartition — TRANSFORMATION (wide, causes shuffle)
t12 = df.repartition(4)

# 13. coalesce — TRANSFORMATION (narrow, no shuffle)
t13 = df.coalesce(1)

# 14. na.drop — TRANSFORMATION
t14 = df.na.drop()

# 15. na.fill — TRANSFORMATION
t15 = df.na.fill({"salary": 0.0})

# ── ACTIONS (trigger execution) ───────────────────────────────────────────────

# 16. count() — ACTION
print("Ex16 count:", df.count())

# 17. show() — ACTION
df.show(3)

# 18. collect() — ACTION
rows = df.collect()
print("Ex18 rows[0]:", rows[0])

# 19. first() — ACTION
print("Ex19 first:", df.first())

# 20. take(n) — ACTION
print("Ex20 take:", df.take(2))

# 21. head(n) — ACTION (alias for take)
print("Ex21 head:", df.head(2))

# 22. toPandas() — ACTION
pdf = df.toPandas()
print("Ex22 pandas shape:", pdf.shape)

# 23. write — ACTION
df.write.mode("overwrite").parquet("/tmp/actions_out")
print("Ex23 write done")

# 24. foreach — ACTION
def process(row):
    pass  # simulate side-effect
df.foreach(process)
print("Ex24 foreach done")

# 25. foreachPartition — ACTION
def process_partition(rows):
    for _ in rows:
        pass
df.foreachPartition(process_partition)
print("Ex25 foreachPartition done")

# 26. describe — ACTION (returns DataFrame with stats, show() triggers it)
df.describe("salary").show()

# 27. summary — ACTION
df.summary().show()

# 28. printSchema — ACTION-like (shows schema immediately)
df.printSchema()

# 29. explain — ACTION-like (shows plan)
df.filter(F.col("salary") > 80000).explain(extended=True)

# 30. isEmpty — ACTION
print("Ex30 isEmpty:", df.isEmpty())

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Lazy evaluation chain — no execution until action
chain = (df
    .filter(F.col("dept") == "Engineering")
    .withColumn("seniority", F.when(F.col("salary") > 90000, "Senior").otherwise("Mid"))
    .select("name","salary","seniority")
    .orderBy(F.col("salary").desc()))
chain.show()  # <- single execution plan

# 32. Logical vs Physical plan
chain.explain()         # physical plan
chain.explain("cost")   # cost-based optimizer output

# 33. Caching — avoids recomputation
df_cached = df.filter(F.col("dept") == "Engineering").cache()
print("Ex33 first call:", df_cached.count())   # triggers computation + caches
print("Ex33 second call:", df_cached.count())  # served from cache
df_cached.unpersist()

# 34. persist with storage level
from pyspark import StorageLevel
df.persist(StorageLevel.MEMORY_ONLY)
df.count()  # materialises
df.unpersist()

# 35. checkpoint (breaks lineage — useful for iterative algos)
sc = spark.sparkContext
sc.setCheckpointDir("/tmp/checkpoints")
df_check = df.filter(F.col("salary") > 0)
df_check = df_check.checkpoint()
print("Ex35 checkpoint count:", df_check.count())

# 36. Partition-level operations with RDD
rdd = df.rdd
part_sizes = rdd.mapPartitions(lambda rows: [sum(1 for _ in rows)]).collect()
print("Ex36 rows per partition:", part_sizes)

# 37. toLocalIterator — memory-efficient alternative to collect()
count = 0
for row in df.toLocalIterator():
    count += 1
print("Ex37 iterated rows:", count)

# 38. createOrReplaceTempView is a transformation-side effect
df.createOrReplaceTempView("emp")
result = spark.sql("SELECT COUNT(*) FROM emp").collect()[0][0]
print("Ex38 SQL count:", result)

# 39. Cross join (cartesian — use with care on large data)
small1 = spark.createDataFrame([("A",),("B",)],["x"])
small2 = spark.createDataFrame([(1,),(2,)],["y"])
small1.crossJoin(small2).show()

# 40. mapInPandas (Arrow-optimized group processing)
def double_salary(df_pd):
    df_pd["salary"] = df_pd["salary"] * 2
    return df_pd

schema = df.schema
df.mapInPandas(double_salary, schema=schema).show()

# 41. applyInPandas (grouped map)
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
out_schema = StructType([StructField("dept",StringType()),StructField("avg_sal",DoubleType())])
def dept_avg(key, group_df):
    import pandas as pd
    return pd.DataFrame([(key[0], group_df["salary"].mean())], columns=["dept","avg_sal"])
df.groupBy("dept").applyInPandas(dept_avg, schema=out_schema).show()

# 42. Barrier mode for co-ordinated distributed tasks
# df.rdd.barrier().mapPartitions(lambda itr: itr)  # used with ML training
print("Ex42 barrier mode pattern shown")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. AQE (Adaptive Query Execution) — Spark 3+
spark.conf.set("spark.sql.adaptive.enabled","true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled","true")
print("Ex43 AQE enabled")

# 44. Broadcast join hint
dept_small = dept_info
df.join(F.broadcast(dept_small), on="dept").explain()

# 45. Sort merge join hint
spark.conf.set("spark.sql.autoBroadcastJoinThreshold","-1")
df.join(dept_info, on="dept").explain()

# 46. Skew join hint (Databricks)
# df.join(df2.hint("skew","id"), on="id")
print("Ex46 skew hint pattern shown")

# 47. Streaming: transformations are the same API (select/filter/groupBy)
# df_stream = spark.readStream...
# transformed = df_stream.filter(...).groupBy(...)
# query = transformed.writeStream...start()
print("Ex47 streaming transformations same API")

# 48. mapPartitions for partition-level ML inference
def batch_predict(rows):
    # simulate model load once per partition, score batch
    import itertools
    rows_list = list(rows)
    for row in rows_list:
        yield (row["id"], row["salary"] * 1.05)
result_rdd = df.rdd.mapPartitions(batch_predict)
print("Ex48 predictions:", result_rdd.take(3))

# 49. Accumulate counts across partitions
from pyspark import AccumulatorParam
count_acc = sc.accumulator(0)
df.foreach(lambda r: count_acc.add(1))
print("Ex49 total rows via accumulator:", count_acc.value)

# 50. Catalyst optimizer — rule-based + cost-based
# Rules: predicate pushdown, column pruning, constant folding, join reordering
df.filter(F.col("salary") > 0 + 80000).select("name","salary").explain("extended")
print("Ex50 Catalyst optimizer rules shown in plan above")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
