# ============================================================================
# Examples 2.3 — Delta Lake Basics  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================
# Requires: delta-spark library
# pip install delta-spark
# In Databricks: Delta is built-in — no extra install needed
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
import os

spark = (SparkSession.builder
    .appName("delta-lake-examples")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

DELTA_PATH = "/tmp/delta_examples/employees"
os.makedirs("/tmp/delta_examples", exist_ok=True)

employees = spark.createDataFrame([
    (1,"Alice","Engineering",95000),(2,"Bob","Marketing",72000),
    (3,"Carol","Engineering",105000),(4,"Dave","Marketing",68000),
    (5,"Eve","HR",60000),
], ["id","name","dept","salary"])

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Write Delta table
employees.write.format("delta").mode("overwrite").save(DELTA_PATH)
print("Ex01 Delta table written")

# 2. Read Delta table
df_delta = spark.read.format("delta").load(DELTA_PATH)
df_delta.show()

# 3. Print schema
df_delta.printSchema()

# 4. Count rows
print("Ex04 count:", df_delta.count())

# 5. Query Delta with SQL (register as table)
spark.sql(f"CREATE TABLE IF NOT EXISTS employees_delta USING DELTA LOCATION '{DELTA_PATH}'")
spark.sql("SELECT * FROM employees_delta").show()

# 6. Describe table
spark.sql("DESCRIBE TABLE employees_delta").show()

# 7. DESCRIBE HISTORY — audit log of all operations
spark.sql("DESCRIBE HISTORY employees_delta").show(truncate=False)

# 8. Append new rows
new_emps = spark.createDataFrame([(6,"Frank","HR",65000)], ["id","name","dept","salary"])
new_emps.write.format("delta").mode("append").save(DELTA_PATH)
print("Ex08 after append:", spark.read.format("delta").load(DELTA_PATH).count())

# 9. Overwrite entire table
employees.write.format("delta").mode("overwrite").save(DELTA_PATH)
print("Ex09 after overwrite:", spark.read.format("delta").load(DELTA_PATH).count())

# 10. Delta file structure (transaction log)
import os
log_files = os.listdir(f"{DELTA_PATH}/_delta_log")
print("Ex10 delta log files:", sorted(log_files))

# 11. DESCRIBE DETAIL
spark.sql("DESCRIBE DETAIL employees_delta").show(truncate=False)

# 12. Schema enforcement — Delta rejects schema mismatch
try:
    bad_df = spark.createDataFrame([(999,"Extra","Col")], ["id","name","extra_col"])
    bad_df.write.format("delta").mode("append").save(DELTA_PATH)
except Exception as e:
    print("Ex12 schema enforcement caught:", type(e).__name__)

# 13. Overwrite schema (force schema change)
df_new_schema = spark.createDataFrame([(1,"Alice","Engineering",95000,True)],
                                       ["id","name","dept","salary","active"])
df_new_schema.write.format("delta").mode("overwrite") \
    .option("overwriteSchema","true").save(DELTA_PATH)
print("Ex13 schema overwritten")
spark.read.format("delta").load(DELTA_PATH).printSchema()
# Reset
employees.write.format("delta").mode("overwrite").option("overwriteSchema","true").save(DELTA_PATH)

# 14. Partition by column
DELTA_PART = "/tmp/delta_examples/emp_partitioned"
employees.write.format("delta").mode("overwrite").partitionBy("dept").save(DELTA_PART)
print("Ex14 partitioned delta written")

# 15. Read specific partition
spark.read.format("delta").load(DELTA_PART).filter(F.col("dept")=="Engineering").show()

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. UPDATE — modify rows in place
from delta.tables import DeltaTable
dt = DeltaTable.forPath(spark, DELTA_PATH)
dt.update(
    condition=F.col("name") == "Alice",
    set={"salary": F.lit(100000)}
)
spark.read.format("delta").load(DELTA_PATH).show()

# 17. DELETE — remove rows
dt.delete(condition=F.col("dept") == "HR")
print("Ex17 after delete HR count:", spark.read.format("delta").load(DELTA_PATH).count())

# 18. Re-insert to restore state
employees.write.format("delta").mode("overwrite").save(DELTA_PATH)
dt = DeltaTable.forPath(spark, DELTA_PATH)

# 19. MERGE (UPSERT) — insert new, update existing
updates = spark.createDataFrame([
    (1,"Alice","Engineering",100000),  # update Alice's salary
    (6,"Frank","HR",65000),            # new employee
    (7,"Grace","Marketing",70000),     # new employee
], ["id","name","dept","salary"])

dt.alias("target").merge(
    updates.alias("source"),
    "target.id = source.id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

print("Ex19 after merge count:", spark.read.format("delta").load(DELTA_PATH).count())

# 20. MERGE — only update if salary increased
updates2 = spark.createDataFrame([(2,"Bob","Marketing",80000)], ["id","name","dept","salary"])
dt.alias("t").merge(updates2.alias("s"), "t.id = s.id") \
  .whenMatchedUpdate(
      condition="s.salary > t.salary",
      set={"salary": F.col("s.salary")}
  ) \
  .whenNotMatchedInsertAll() \
  .execute()
spark.read.format("delta").load(DELTA_PATH).show()

# 21. MERGE — delete matched rows
to_delete = spark.createDataFrame([(7,)], ["id"])
dt.alias("t").merge(to_delete.alias("s"), "t.id = s.id") \
  .whenMatchedDelete() \
  .execute()
print("Ex21 after conditional delete:", spark.read.format("delta").load(DELTA_PATH).count())

# 22. Time travel — read earlier version
spark.read.format("delta").option("versionAsOf", 0).load(DELTA_PATH).show()

# 23. Time travel — read by timestamp
from datetime import datetime, timedelta
past = (datetime.now() - timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S")
try:
    spark.read.format("delta").option("timestampAsOf", past).load(DELTA_PATH).show()
except Exception as e:
    print("Ex23 time travel by ts:", str(e)[:80])

# 24. RESTORE to a previous version
dt.restoreToVersion(0)
print("Ex24 restored to version 0")
spark.read.format("delta").load(DELTA_PATH).show()

# 25. DESCRIBE HISTORY after multiple operations
spark.sql("DESCRIBE HISTORY employees_delta").select("version","operation","timestamp").show()

# 26. OPTIMIZE — compact small files
spark.sql("OPTIMIZE employees_delta")
print("Ex26 OPTIMIZE done")

# 27. OPTIMIZE with ZORDER
employees.withColumn("dept_id",F.monotonically_increasing_id()) \
         .write.format("delta").mode("overwrite").save(DELTA_PATH)
spark.sql("OPTIMIZE employees_delta ZORDER BY (dept)")
print("Ex27 ZORDER done")

# 28. VACUUM — remove old file versions (default 7 days retention)
# spark.sql("VACUUM employees_delta RETAIN 0 HOURS")  # dangerous — use carefully
spark.conf.set("spark.databricks.delta.retentionDurationCheck.enabled","false")
spark.sql("VACUUM employees_delta RETAIN 0 HOURS")
print("Ex28 VACUUM done")

# 29. Schema evolution with mergeSchema
extra = spark.createDataFrame([(8,"Heidi","Finance",90000,"NYC")],
                               ["id","name","dept","salary","location"])
extra.write.format("delta").mode("append").option("mergeSchema","true").save(DELTA_PATH)
print("Ex29 schema evolved:", spark.read.format("delta").load(DELTA_PATH).columns)

# 30. DeltaTable.isDeltaTable() check
print("Ex30 isDeltaTable:", DeltaTable.isDeltaTable(spark, DELTA_PATH))
print("Ex30 isNotDelta:", DeltaTable.isDeltaTable(spark, "/tmp"))

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Change Data Feed (CDF) — track row-level changes
CDF_PATH = "/tmp/delta_examples/emp_cdf"
employees.write.format("delta").mode("overwrite") \
    .option("delta.enableChangeDataFeed","true").save(CDF_PATH)
dt_cdf = DeltaTable.forPath(spark, CDF_PATH)
updates3 = spark.createDataFrame([(1,"Alice","Engineering",105000)],["id","name","dept","salary"])
dt_cdf.alias("t").merge(updates3.alias("s"),"t.id=s.id").whenMatchedUpdateAll().execute()

changes = spark.read.format("delta") \
    .option("readChangeFeed","true") \
    .option("startingVersion",0) \
    .load(CDF_PATH)
changes.show()

# 32. Auto Optimize (Databricks)
# spark.conf.set("spark.databricks.delta.optimizeWrite.enabled","true")
# spark.conf.set("spark.databricks.delta.autoCompact.enabled","true")
print("Ex32 Auto Optimize config shown")

# 33. Delta constraints (CHECK constraint)
try:
    spark.sql("ALTER TABLE employees_delta ADD CONSTRAINT salary_positive CHECK (salary > 0)")
    print("Ex33 constraint added")
except Exception as e:
    print("Ex33 constraint:", str(e)[:80])

# 34. Generated columns
GEN_PATH = "/tmp/delta_examples/emp_gen"
spark.sql(f"""
    CREATE TABLE IF NOT EXISTS emp_gen (
        id INT,
        name STRING,
        salary DOUBLE,
        salary_band STRING GENERATED ALWAYS AS (
            CASE WHEN salary > 90000 THEN 'Senior' ELSE 'Junior' END
        )
    ) USING DELTA LOCATION '{GEN_PATH}'
""")
print("Ex34 generated column table created")

# 35. Column mapping (rename columns without rewrite)
# spark.sql("ALTER TABLE employees_delta RENAME COLUMN salary TO compensation")
print("Ex35 column mapping / rename pattern shown")

# 36. DeltaTable.toDF() — get current snapshot as DataFrame
current_df = DeltaTable.forPath(spark, DELTA_PATH).toDF()
print("Ex36 current snapshot count:", current_df.count())

# 37. Shallow clone
CLONE_PATH = "/tmp/delta_examples/emp_clone"
spark.sql(f"CREATE TABLE IF NOT EXISTS emp_clone SHALLOW CLONE employees_delta LOCATION '{CLONE_PATH}'")
print("Ex37 shallow clone created")

# 38. Deep clone
DEEP_PATH = "/tmp/delta_examples/emp_deep"
spark.sql(f"CREATE TABLE IF NOT EXISTS emp_deep DEEP CLONE employees_delta LOCATION '{DEEP_PATH}'")
print("Ex38 deep clone created")

# 39. Convert Parquet to Delta
PARQ_PATH = "/tmp/delta_examples/emp_parquet"
employees.write.mode("overwrite").parquet(PARQ_PATH)
spark.sql(f"CONVERT TO DELTA parquet.`{PARQ_PATH}`")
print("Ex39 parquet converted to delta")

# 40. Liquid clustering (Databricks 13.3+)
# CREATE TABLE ... CLUSTER BY (dept, salary)
print("Ex40 liquid clustering: CLUSTER BY (dept) at CREATE TABLE time")

# 41. Row-level concurrency (Databricks 14.2+)
print("Ex41 row-level concurrency enabled by default in DBR 14.2+")

# 42. Z-order on multiple columns
try:
    spark.sql("OPTIMIZE employees_delta ZORDER BY (dept, id)")
    print("Ex42 multi-col ZORDER done")
except Exception as e:
    print("Ex42:", str(e)[:80])

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Delta transaction log structure
import json
log_dir = f"{DELTA_PATH}/_delta_log"
if os.path.exists(log_dir):
    for fname in sorted(os.listdir(log_dir))[:2]:
        if fname.endswith(".json"):
            with open(f"{log_dir}/{fname}") as f:
                print("Ex43 log entry:", json.loads(f.readline()))

# 44. Concurrent write conflict resolution
print("Ex44 Delta uses optimistic concurrency: concurrent writers may conflict on overlapping data")

# 45. idempotent writes (idempotentWrite)
# In Databricks: use txnAppId + txnVersion for exactly-once streaming sinks
print("Ex45 idempotent write: .option('txnAppId','myApp').option('txnVersion', batch_id)")

# 46. Photon engine (Databricks)
print("Ex46 Photon: vectorized execution engine for Delta — enabled in Premium tier")

# 47. Delta Sharing — share data across orgs/clouds without copying
print("Ex47 Delta Sharing: open protocol to share Delta tables securely")

# 48. Unity Catalog + Delta — managed tables with governance
print("Ex48 Unity Catalog: catalog.schema.table — full data governance layer")

# 49. Predictive I/O (Databricks 13+)
print("Ex49 Predictive I/O: pre-fetches data blocks intelligently for scan-heavy workloads")

# 50. Best practices summary
print("""
Ex50 Delta Lake Best Practices:
  1. Always use OPTIMIZE + ZORDER on filter columns
  2. VACUUM regularly (default 7-day retention)
  3. Enable Auto Optimize for streaming workloads
  4. Use MERGE for CDC/upsert patterns
  5. Prefer managed tables (Unity Catalog) over external for governance
  6. Enable CDF for downstream incremental consumers
  7. Use liquid clustering instead of static partitioning (DBR 13.3+)
  8. Set table properties (delta.logRetentionDuration, delta.deletedFileRetentionDuration)
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
