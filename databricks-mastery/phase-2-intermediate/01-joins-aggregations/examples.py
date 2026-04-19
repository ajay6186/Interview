# ============================================================================
# Examples 2.1 — Joins & Aggregations  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("joins-agg-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

employees = spark.createDataFrame([
    (1,"Alice","Engineering",95000),(2,"Bob","Marketing",72000),
    (3,"Carol","Engineering",105000),(4,"Dave","Marketing",68000),
    (5,"Eve","HR",60000),(6,"Frank","Engineering",88000),
], ["emp_id","name","dept","salary"])

departments = spark.createDataFrame([
    ("Engineering","NYC","Tech"),("Marketing","LA","Business"),
    ("HR","Chicago","Support"),("Finance","Boston","Business"),
], ["dept","city","division"])

orders = spark.createDataFrame([
    (101,1,500.0,"2024-01-10"),(102,2,300.0,"2024-01-15"),
    (103,1,750.0,"2024-02-01"),(104,3,1200.0,"2024-02-10"),
    (105,2,150.0,"2024-03-05"),(106,6,900.0,"2024-03-20"),
    (107,1,200.0,"2024-04-01"),
], ["order_id","emp_id","amount","order_date"])

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. INNER JOIN — only matching rows
inner = employees.join(departments, on="dept", how="inner")
inner.show()

# 2. LEFT JOIN — all employees, matched dept or null
left = employees.join(departments, on="dept", how="left")
left.show()

# 3. RIGHT JOIN — all departments, matched employees or null
right = employees.join(departments, on="dept", how="right")
right.show()

# 4. FULL OUTER JOIN
outer = employees.join(departments, on="dept", how="outer")
outer.show()

# 5. LEFT ANTI JOIN — employees with no department match
anti = employees.join(departments, on="dept", how="left_anti")
anti.show()

# 6. LEFT SEMI JOIN — employees that have a dept match (like EXISTS)
semi = employees.join(departments, on="dept", how="left_semi")
semi.show()

# 7. Cross join
small1 = spark.createDataFrame([("A",),("B",)],["x"])
small2 = spark.createDataFrame([(1,),(2,)],["y"])
small1.crossJoin(small2).show()

# 8. Join on multiple conditions
orders2 = orders.withColumn("emp_id2", F.col("emp_id"))
cond = (employees.emp_id == orders.emp_id) & (employees.salary > 70000)
employees.join(orders, cond, how="inner").show()

# 9. groupBy + count
employees.groupBy("dept").count().show()

# 10. groupBy + sum
employees.groupBy("dept").sum("salary").show()

# 11. groupBy + avg
employees.groupBy("dept").avg("salary").show()

# 12. groupBy + max/min
employees.groupBy("dept").agg(F.max("salary").alias("max_sal"), F.min("salary").alias("min_sal")).show()

# 13. Multiple agg functions
employees.groupBy("dept").agg(
    F.count("emp_id").alias("headcount"),
    F.sum("salary").alias("total_payroll"),
    F.avg("salary").alias("avg_salary"),
).show()

# 14. orderBy after groupBy
employees.groupBy("dept").sum("salary").orderBy(F.col("sum(salary)").desc()).show()

# 15. Global aggregate (no groupBy)
employees.agg(F.sum("salary").alias("company_payroll"), F.count("*").alias("total_emp")).show()

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Join then aggregate
employees.join(orders, on="emp_id", how="left") \
    .groupBy("dept") \
    .agg(F.sum("amount").alias("dept_revenue")) \
    .show()

# 17. Resolve ambiguous column after join
df_joined = employees.join(orders, on="emp_id")
df_joined.select(employees.emp_id, "name", "amount").show()

# 18. Alias tables before join to avoid ambiguity
e = employees.alias("e")
o = orders.alias("o")
e.join(o, F.col("e.emp_id") == F.col("o.emp_id")).select("e.name","o.amount").show()

# 19. Broadcast join for small table
employees.join(F.broadcast(departments), on="dept").show()

# 20. F.countDistinct
employees.groupBy("dept").agg(F.countDistinct("emp_id").alias("unique_emps")).show()

# 21. F.sumDistinct (deprecated in newer Spark; use sum(distinct col))
employees.groupBy("dept").agg(F.sum(F.col("salary").cast("double")).alias("total")).show()

# 22. F.stddev and F.variance
employees.groupBy("dept").agg(
    F.stddev("salary").alias("stddev_sal"),
    F.variance("salary").alias("var_sal"),
).show()

# 23. F.first / F.last
employees.groupBy("dept").agg(F.first("name").alias("first_emp"),
                               F.last("name").alias("last_emp")).show()

# 24. F.collect_list
employees.groupBy("dept").agg(F.collect_list("name").alias("members")).show()

# 25. F.collect_set
employees.groupBy("dept").agg(F.collect_set("name").alias("unique_members")).show()

# 26. pivot table
employees.groupBy("dept").pivot("dept").agg(F.avg("salary")).show()

# 27. pivot with explicit values (faster)
orders.join(employees, on="emp_id") \
    .groupBy("emp_id") \
    .pivot("dept", ["Engineering","Marketing","HR"]) \
    .sum("amount").show()

# 28. ROLLUP
employees.rollup("dept").agg(F.sum("salary").alias("total")).show()

# 29. CUBE
employees.cube("dept").agg(F.avg("salary").alias("avg")).show()

# 30. GROUPING SETS (via SQL)
employees.createOrReplaceTempView("emp")
spark.sql("""
    SELECT dept, SUM(salary) as total
    FROM emp
    GROUP BY GROUPING SETS ((dept), ())
""").show()

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Chained joins
employees.join(departments, on="dept") \
         .join(orders, on="emp_id", how="left") \
         .select("name","city","amount") \
         .show()

# 32. Self join (find employees in same dept)
e1 = employees.alias("e1")
e2 = employees.alias("e2")
e1.join(e2, (F.col("e1.dept") == F.col("e2.dept")) & (F.col("e1.emp_id") != F.col("e2.emp_id"))) \
  .select(F.col("e1.name").alias("emp1"), F.col("e2.name").alias("emp2"), F.col("e1.dept")) \
  .show()

# 33. Non-equi join (range join)
# Useful for event-time matching, sensor range lookups
salary_bands = spark.createDataFrame([
    (0,70000,"Low"),(70001,90000,"Mid"),(90001,200000,"High")
], ["min_sal","max_sal","band"])
cond2 = (employees.salary >= salary_bands.min_sal) & (employees.salary <= salary_bands.max_sal)
employees.join(salary_bands, cond2).select("name","salary","band").show()

# 34. Aggregation with filter (HAVING equivalent)
employees.groupBy("dept") \
    .agg(F.avg("salary").alias("avg_sal")) \
    .filter(F.col("avg_sal") > 80000) \
    .show()

# 35. Window-based aggregation alternative to groupBy
from pyspark.sql.window import Window
w = Window.partitionBy("dept")
employees.withColumn("dept_avg", F.avg("salary").over(w)).show()

# 36. percentile_approx in agg
employees.groupBy("dept").agg(
    F.percentile_approx("salary", 0.5).alias("median_sal")
).show()

# 37. Rank within group using window
w2 = Window.partitionBy("dept").orderBy(F.col("salary").desc())
employees.withColumn("rank", F.rank().over(w2)).show()

# 38. Running total per dept
w3 = Window.partitionBy("dept").orderBy("salary").rowsBetween(Window.unboundedPreceding, Window.currentRow)
employees.withColumn("running_total", F.sum("salary").over(w3)).show()

# 39. Join with null-safe equality (EqNullSafe: <==>)
df_nulls = spark.createDataFrame([(None,"a"),(1,"b")],["id","val"])
df_nulls2 = spark.createDataFrame([(None,"x"),(1,"y")],["id","val"])
df_nulls.join(df_nulls2, df_nulls.id.eqNullSafe(df_nulls2.id)).show()

# 40. Skew handling: salt key for skewed join
import random
N_BUCKETS = 4
# Add salt to large table
big_df = employees.withColumn("salt", (F.rand() * N_BUCKETS).cast("int"))
# Explode salt on small table
from pyspark.sql.functions import array, explode, lit
small_df = departments.withColumn("salt", explode(array([lit(i) for i in range(N_BUCKETS)])))
# Join on both key and salt
big_df.join(small_df,
    (big_df.dept == small_df.dept) & (big_df.salt == small_df.salt)
).drop(small_df.dept).show()

# 41. Union + aggregate across datasets
df_q1 = spark.createDataFrame([("Engineering",100000),("Marketing",50000)],["dept","revenue"])
df_q2 = spark.createDataFrame([("Engineering",120000),("HR",30000)],["dept","revenue"])
df_q1.union(df_q2).groupBy("dept").sum("revenue").show()

# 42. approx_count_distinct for large scale distinct counts
orders.agg(F.approx_count_distinct("emp_id", rsd=0.01).alias("approx_unique_customers")).show()

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Bucketed join (requires saveAsTable with bucketBy)
# In production: df.write.bucketBy(8,"emp_id").sortBy("emp_id").saveAsTable("emp_bucketed")
# Bucketed-to-bucketed join eliminates shuffle
print("Ex43 bucketed join pattern: use bucketBy + saveAsTable")

# 44. SortMergeJoin vs BroadcastHashJoin
spark.conf.set("spark.sql.autoBroadcastJoinThreshold","-1")
employees.join(departments, on="dept").explain()  # expect SortMergeJoin
spark.conf.set("spark.sql.autoBroadcastJoinThreshold","10485760")  # reset

# 45. AQE skew join optimization
spark.conf.set("spark.sql.adaptive.skewJoin.enabled","true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor","5")
print("Ex45 AQE skew join enabled")

# 46. Merge (ACID upsert) — Delta only
# deltaTable.alias("t").merge(source.alias("s"), "t.id = s.id")
#   .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()
print("Ex46 Delta MERGE pattern shown")

# 47. Multi-column pivot
orders.join(employees, on="emp_id") \
    .groupBy("dept") \
    .pivot("order_date") \
    .sum("amount") \
    .show()

# 48. Aggregate pushdown into data source
# When reading from Parquet/Delta, Spark can push COUNT/SUM down
df_parquet = spark.read.parquet("/tmp/actions_out") if True else employees
print("Ex48 aggregate pushdown: enabled by default for Parquet/Delta")

# 49. Custom aggregation with UDAF (User Defined Aggregate Function)
# In Spark 3.x prefer Pandas UDF with grouped map or use built-in agg
from pyspark.sql.functions import pandas_udf
import pandas as pd
@pandas_udf("double")
def weighted_avg(salary: pd.Series, weight: pd.Series) -> float:
    return (salary * weight).sum() / weight.sum() if weight.sum() != 0 else 0.0
print("Ex49 UDAF via pandas_udf shown")

# 50. Join order hints — BROADCAST, MERGE, SHUFFLE_HASH, SHUFFLE_REPLICATE_NL
employees.hint("broadcast").join(departments, on="dept").explain()
print("Ex50 join hints shown")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
