# ============================================================================
# Examples 1.2 — DataFrame Operations  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

spark = SparkSession.builder.appName("df-operations-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

data = [
    (1, "Alice",   "Engineering", 95000.0, 5),
    (2, "Bob",     "Marketing",   72000.0, 3),
    (3, "Carol",   "Engineering", 105000.0, 8),
    (4, "Dave",    "Marketing",   68000.0, 2),
    (5, "Eve",     "Engineering", 88000.0, 4),
    (6, "Frank",   "HR",          60000.0, 1),
    (7, "Grace",   "HR",          64000.0, 3),
    (8, "Heidi",   "Engineering", 112000.0, 10),
]
df = spark.createDataFrame(data, ["id","name","dept","salary","yoe"])

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. select()
df.select("name","salary").show()

# 2. filter() / where() — same API
df.filter(F.col("salary") > 80000).show()
df.where(F.col("dept") == "Engineering").show()

# 3. groupBy + count
df.groupBy("dept").count().show()

# 4. groupBy + sum
df.groupBy("dept").sum("salary").show()

# 5. groupBy + avg
df.groupBy("dept").avg("salary").show()

# 6. groupBy + max / min
df.groupBy("dept").agg(F.max("salary"), F.min("salary")).show()

# 7. orderBy ascending
df.orderBy("salary").show()

# 8. orderBy multiple cols
df.orderBy(F.col("dept"), F.col("salary").desc()).show()

# 9. withColumn — arithmetic
df.withColumn("bonus", F.col("salary") * 0.10).show()

# 10. withColumn — string manipulation
df.withColumn("name_upper", F.upper(F.col("name"))).show()

# 11. drop()
df.drop("yoe").show()

# 12. distinct()
df.select("dept").distinct().show()

# 13. limit()
df.limit(3).show()

# 14. count()
print("Ex14 total rows:", df.count())

# 15. collect() — bring to driver
rows = df.select("name").collect()
names = [r["name"] for r in rows]
print("Ex15 names:", names)

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. agg() with multiple functions
df.groupBy("dept").agg(
    F.count("id").alias("headcount"),
    F.avg("salary").alias("avg_salary"),
    F.max("yoe").alias("max_experience")
).show()

# 17. F.round
df.withColumn("salary_k", F.round(F.col("salary") / 1000, 1)).show()

# 18. F.when / F.otherwise
df.withColumn("level",
    F.when(F.col("yoe") >= 7, "Senior")
     .when(F.col("yoe") >= 3, "Mid")
     .otherwise("Junior")
).show()

# 19. F.concat_ws
df.withColumn("info", F.concat_ws(" | ", F.col("name"), F.col("dept"))).show()

# 20. F.substring
df.withColumn("first3", F.substring(F.col("name"), 1, 3)).show()

# 21. F.length
df.withColumn("name_len", F.length(F.col("name"))).show()

# 22. F.trim / ltrim / rtrim
df.withColumn("name_trim", F.trim(F.col("name"))).show()

# 23. F.lower / upper
df.withColumn("dept_lower", F.lower(F.col("dept"))).show()

# 24. F.regexp_replace
df.withColumn("name_no_vowel",
    F.regexp_replace(F.col("name"), "[AEIOUaeiou]", "")).show()

# 25. F.split and getItem
df2 = spark.createDataFrame([("Alice Smith",), ("Bob Jones",)], ["full_name"])
df2.withColumn("first", F.split(F.col("full_name"), " ").getItem(0)).show()

# 26. F.to_date / F.to_timestamp
df3 = spark.createDataFrame([("2024-01-15",), ("2024-06-30",)], ["date_str"])
df3.withColumn("date", F.to_date(F.col("date_str"), "yyyy-MM-dd")).show()

# 27. F.year / month / dayofmonth
df3 = df3.withColumn("date", F.to_date(F.col("date_str")))
df3.withColumn("yr", F.year("date")).withColumn("mo", F.month("date")).show()

# 28. F.datediff
df4 = spark.createDataFrame([("2024-01-01", "2024-06-30")], ["start", "end"])
df4 = df4.withColumn("start_d", F.to_date("start")).withColumn("end_d", F.to_date("end"))
df4.withColumn("days_diff", F.datediff(F.col("end_d"), F.col("start_d"))).show()

# 29. F.coalesce — first non-null
df5 = spark.createDataFrame([(None, 5), (3, None), (None, None)], ["a","b"])
df5.withColumn("first_nn", F.coalesce(F.col("a"), F.col("b"), F.lit(0))).show()

# 30. pivot
pivot_data = [("Q1","A",100),("Q1","B",200),("Q2","A",150),("Q2","B",250)]
dfp = spark.createDataFrame(pivot_data, ["quarter","region","sales"])
dfp.groupBy("quarter").pivot("region").sum("sales").show()

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. F.struct — create struct column
df.withColumn("emp_info", F.struct("name","dept","salary")).printSchema()

# 32. F.array — create array column
df.withColumn("tags", F.array(F.lit("active"), F.col("dept"))).show()

# 33. F.explode
df_arr = spark.createDataFrame([([1,2,3],), ([4,5],)], ["nums"])
df_arr.withColumn("num", F.explode("nums")).show()

# 34. F.collect_list
df.groupBy("dept").agg(F.collect_list("name").alias("members")).show()

# 35. F.collect_set
df.groupBy("dept").agg(F.collect_set("dept").alias("unique_depts")).show()

# 36. F.flatten — flatten nested array
df_nest = spark.createDataFrame([([[1,2],[3,4]],)], ["nested"])
df_nest.withColumn("flat", F.flatten("nested")).show()

# 37. F.map_from_arrays
df_map = spark.createDataFrame([(["a","b"], [1,2]),], ["keys","vals"])
df_map.withColumn("m", F.map_from_arrays("keys","vals")).show()

# 38. F.size — length of array/map
df_arr.withColumn("arr_size", F.size("nums")).show()

# 39. F.array_contains
df_arr.withColumn("has_3", F.array_contains("nums", 3)).show()

# 40. F.sort_array
df_arr.withColumn("sorted", F.sort_array("nums", asc=False)).show()

# 41. dropDuplicates on specific columns
df.dropDuplicates(["dept"]).show()

# 42. F.monotonically_increasing_id
df.withColumn("row_id", F.monotonically_increasing_id()).show()

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. F.expr — inline SQL expression
df.withColumn("tax_salary", F.expr("salary * 0.7")).show()

# 44. selectExpr — SQL expressions as strings
df.selectExpr("name", "salary * 0.7 as net_salary", "dept").show()

# 45. transform() — apply lambda to array column
df_arr.withColumn("doubled", F.transform("nums", lambda x: x * 2)).show()

# 46. filter() on array column
df_arr.withColumn("gt2", F.filter("nums", lambda x: x > 2)).show()

# 47. aggregate() on array column
df_arr.withColumn("arr_sum",
    F.aggregate("nums", F.lit(0), lambda acc, x: acc + x)
).show()

# 48. F.percentile_approx
df.select(F.percentile_approx("salary", 0.5).alias("median_salary")).show()

# 49. F.skewness and F.kurtosis
df.select(F.skewness("salary"), F.kurtosis("salary")).show()

# 50. F.approx_count_distinct
df.select(F.approx_count_distinct("dept").alias("approx_depts")).show()


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
