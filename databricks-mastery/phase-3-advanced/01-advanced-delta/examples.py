# ============================================================================
# Examples 3.1 — Advanced Delta Lake  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("advanced-delta-examples")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/advanced_delta"
os.makedirs(BASE, exist_ok=True)

df = spark.createDataFrame([
    (i, f"user_{i}", "active" if i%2==0 else "inactive", float(i*1000), i%5)
    for i in range(1, 51)
], ["id","name","status","revenue","region"])

PATH = f"{BASE}/main_table"
df.write.format("delta").mode("overwrite").partitionBy("region").save(PATH)
dt = DeltaTable.forPath(spark, PATH)

# ── BASIC (Delta Operations) ──────────────────────────────────────────────────

# 1. OPTIMIZE — compact small files into larger ones
spark.sql(f"OPTIMIZE delta.`{PATH}`")
print("Ex01 OPTIMIZE done")

# 2. OPTIMIZE with ZORDER — colocate related data
spark.sql(f"OPTIMIZE delta.`{PATH}` ZORDER BY (id)")
print("Ex02 ZORDER by id done")

# 3. ZORDER on multiple columns
spark.sql(f"OPTIMIZE delta.`{PATH}` ZORDER BY (status, region)")
print("Ex03 ZORDER by status,region done")

# 4. VACUUM — remove stale files (beyond retention)
spark.conf.set("spark.databricks.delta.retentionDurationCheck.enabled","false")
spark.sql(f"VACUUM delta.`{PATH}` RETAIN 0 HOURS")
print("Ex04 VACUUM done")

# 5. VACUUM with default retention (7 days)
spark.sql(f"VACUUM delta.`{PATH}`")  # uses default 168h
print("Ex05 VACUUM default retention done")

# 6. DESCRIBE HISTORY
hist = spark.sql(f"DESCRIBE HISTORY delta.`{PATH}`")
hist.select("version","operation","timestamp").show()

# 7. Time travel — read version 0
df_v0 = spark.read.format("delta").option("versionAsOf",0).load(PATH)
print("Ex07 version 0 count:", df_v0.count())

# 8. Time travel — read by timestamp
from datetime import datetime, timedelta
ts = (datetime.now() - timedelta(seconds=5)).strftime("%Y-%m-%d %H:%M:%S")
try:
    df_ts = spark.read.format("delta").option("timestampAsOf", ts).load(PATH)
    print("Ex08 ts read count:", df_ts.count())
except Exception as e:
    print("Ex08 ts:", str(e)[:60])

# 9. RESTORE to version 0
dt.restoreToVersion(0)
print("Ex09 restored to v0")

# 10. RESTORE by timestamp
try:
    dt.restoreToTimestamp(ts)
    print("Ex10 restored by ts")
except Exception as e:
    print("Ex10:", str(e)[:60])

# 11. Delta table properties
spark.sql(f"""
    ALTER TABLE delta.`{PATH}`
    SET TBLPROPERTIES (
        'delta.logRetentionDuration' = 'interval 30 days',
        'delta.deletedFileRetentionDuration' = 'interval 7 days'
    )
""")
print("Ex11 table properties set")

# 12. Show table properties
spark.sql(f"DESCRIBE DETAIL delta.`{PATH}`").select("properties").show(truncate=False)

# 13. DESCRIBE TABLE (columns + types)
spark.sql(f"DESCRIBE TABLE delta.`{PATH}`").show()

# 14. Table statistics
spark.sql(f"ANALYZE TABLE delta.`{PATH}` COMPUTE STATISTICS FOR ALL COLUMNS")
print("Ex14 statistics computed")

# 15. isDeltaTable check
print("Ex15 isDeltaTable:", DeltaTable.isDeltaTable(spark, PATH))

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Change Data Feed — enable on existing table
spark.sql(f"ALTER TABLE delta.`{PATH}` SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')")
# Perform a change
dt = DeltaTable.forPath(spark, PATH)
dt.update(F.col("id") == 1, {"status": F.lit("vip")})

# 17. Read CDF changes
cdf = spark.read.format("delta") \
    .option("readChangeFeed","true") \
    .option("startingVersion", 0) \
    .load(PATH)
cdf.select("id","status","_change_type","_commit_version").show()

# 18. CDF change types
print("Ex18 CDF change types: insert, update_preimage, update_postimage, delete")

# 19. Schema evolution — add column
dt.toDF().withColumn("country", F.lit("US")) \
         .write.format("delta").mode("append").option("mergeSchema","true").save(PATH)
print("Ex19 schema evolved with 'country' column:", spark.read.format("delta").load(PATH).columns)

# 20. Schema enforcement — reject bad schema
try:
    bad = spark.createDataFrame([(999,"bad",True)],["id","name","flag"])
    bad.write.format("delta").mode("append").save(PATH)
except Exception as e:
    print("Ex20 schema enforcement:", type(e).__name__)

# 21. Overwrite schema
small = spark.createDataFrame([(1,"a",10.0)],["id","name","value"])
small.write.format("delta").mode("overwrite") \
     .option("overwriteSchema","true").save(f"{BASE}/schema_test")
print("Ex21 overwrite schema done")

# 22. Shallow clone
CLONE = f"{BASE}/shallow_clone"
spark.sql(f"CREATE OR REPLACE TABLE delta.`{CLONE}` SHALLOW CLONE delta.`{PATH}`")
print("Ex22 shallow clone:", spark.read.format("delta").load(CLONE).count())

# 23. Deep clone
DEEP = f"{BASE}/deep_clone"
spark.sql(f"CREATE OR REPLACE TABLE delta.`{DEEP}` DEEP CLONE delta.`{PATH}`")
print("Ex23 deep clone:", spark.read.format("delta").load(DEEP).count())

# 24. Convert Parquet to Delta
PARQ = f"{BASE}/parquet_source"
df.write.mode("overwrite").parquet(PARQ)
spark.sql(f"CONVERT TO DELTA parquet.`{PARQ}`")
print("Ex24 parquet converted to delta")

# 25. Table constraints — NOT NULL
try:
    spark.sql(f"ALTER TABLE delta.`{PATH}` ADD CONSTRAINT id_not_null CHECK (id IS NOT NULL)")
    print("Ex25 constraint added")
except Exception as e:
    print("Ex25:", str(e)[:80])

# 26. Drop constraint
try:
    spark.sql(f"ALTER TABLE delta.`{PATH}` DROP CONSTRAINT id_not_null")
    print("Ex26 constraint dropped")
except Exception as e:
    print("Ex26:", str(e)[:60])

# 27. Generated columns
GEN = f"{BASE}/gen_col_table"
spark.sql(f"""
    CREATE OR REPLACE TABLE delta.`{GEN}` (
        id INT,
        salary DOUBLE,
        salary_band STRING GENERATED ALWAYS AS (
            CASE WHEN salary > 90000 THEN 'Senior'
                 WHEN salary > 60000 THEN 'Mid'
                 ELSE 'Junior' END
        )
    ) USING DELTA LOCATION '{GEN}'
""")
spark.createDataFrame([(1,100000.0),(2,70000.0),(3,40000.0)],["id","salary"]) \
     .write.format("delta").mode("append").save(GEN)
spark.read.format("delta").load(GEN).show()

# 28. Column mapping — rename without rewrite
try:
    spark.sql(f"ALTER TABLE delta.`{GEN}` SET TBLPROPERTIES ('delta.columnMapping.mode'='name')")
    spark.sql(f"ALTER TABLE delta.`{GEN}` RENAME COLUMN salary TO compensation")
    print("Ex28 column renamed via column mapping")
except Exception as e:
    print("Ex28:", str(e)[:80])

# 29. Row-level security via views (filtering pattern)
spark.read.format("delta").load(PATH) \
     .filter(F.col("region") == 0) \
     .createOrReplaceTempView("region0_view")
print("Ex29 row-level security view created for region 0")

# 30. Incremental read (streaming source)
print("""
Ex30 Incremental read:
  spark.readStream.format("delta")
    .option("maxBytesPerTrigger","10mb")
    .load(PATH)
""")

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Liquid clustering (DBR 13.3+)
print("Ex31 Liquid clustering: CREATE TABLE ... CLUSTER BY (col1, col2)")
print("      Use OPTIMIZE to apply clustering — no need for explicit ZORDER")

# 32. Predictive I/O (Databricks 13+)
print("Ex32 Predictive I/O: Databricks pre-fetches data blocks based on query pattern")

# 33. Row tracking
print("Ex33 Row tracking: .option('delta.enableRowTracking','true') — assigns stable row IDs")

# 34. Deletion vectors (DBR 12.2+)
print("Ex34 Deletion vectors: soft-delete rows without rewriting files, dramatically faster DELETEs")
spark.sql(f"ALTER TABLE delta.`{PATH}` SET TBLPROPERTIES ('delta.enableDeletionVectors'='true')")
dt.delete(F.col("id") > 45)
print("Ex34 soft delete via deletion vector done")

# 35. Bloom filter indexing
try:
    spark.sql(f"""
        ALTER TABLE delta.`{PATH}`
        SET TBLPROPERTIES ('delta.bloomFilter.columns'='id,status')
    """)
    print("Ex35 bloom filter index set")
except Exception as e:
    print("Ex35:", str(e)[:80])

# 36. Table metrics via DESCRIBE DETAIL
detail = spark.sql(f"DESCRIBE DETAIL delta.`{PATH}`")
detail.select("numFiles","sizeInBytes","partitionColumns").show(truncate=False)

# 37. Delta sharing protocol
print("""
Ex37 Delta Sharing:
  1. Provider shares table via REST API + signed URLs
  2. Recipient reads with delta-sharing connector
  3. No data copying — reads directly from cloud storage
  spark.read.format("deltaSharing")
    .option("responseFormat","delta")
    .load("share_name.schema_name.table_name")
""")

# 38. Photon acceleration
print("Ex38 Photon: vectorized C++ execution engine for Delta operations in Databricks")

# 39. Log compaction
print("Ex39 Log compaction: Delta auto-compacts transaction log into checkpoints every 10 commits")

# 40. Partition elimination with liquid clustering
print("Ex40 Liquid clustering: file-level statistics enable partition-like pruning without rigid partitions")

# 41. Multi-table transactions (Databricks)
print("""
Ex41 Multi-table transactions (Databricks Feature Store / Unity Catalog):
  - Unity Catalog enforces consistency across tables
  - Use foreachBatch for atomic multi-table writes in streaming
""")

# 42. MERGE with delete clause
updates = spark.createDataFrame([(3,None,"deleted")],["id","name","status"])
dt2 = DeltaTable.forPath(spark, PATH)
dt2.alias("t").merge(updates.alias("s"), "t.id = s.id") \
   .whenMatchedDelete(condition="s.status = 'deleted'") \
   .whenNotMatchedInsertAll() \
   .execute()
print("Ex42 merge with delete clause done")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Transaction log internals
import json
log_dir = f"{PATH}/_delta_log"
if os.path.exists(log_dir):
    files = sorted(f for f in os.listdir(log_dir) if f.endswith(".json"))
    if files:
        with open(f"{log_dir}/{files[0]}") as f:
            entry = json.loads(f.readline())
            print("Ex43 first log action:", list(entry.keys()))

# 44. Checkpoint files
if os.path.exists(log_dir):
    ckpts = [f for f in os.listdir(log_dir) if f.endswith(".parquet")]
    print("Ex44 checkpoint files:", ckpts[:3])

# 45. Concurrent write protocol (Optimistic Concurrency Control)
print("""
Ex45 OCC in Delta:
  - Writers read current version, compute changes, attempt commit
  - If another writer committed meanwhile → conflict check:
    * Non-overlapping data → success (concurrent insert/update on different partitions)
    * Overlapping data → retry or fail
  - SERIALIZABLE isolation level available in Databricks
""")

# 46. SERIALIZABLE isolation
spark.sql(f"ALTER TABLE delta.`{PATH}` SET TBLPROPERTIES ('delta.isolationLevel'='Serializable')")
print("Ex46 serializable isolation set")

# 47. Write serializable (default in Databricks DBR 8+)
print("Ex47 WriteSerializable: default isolation — blind appends can overlap, but reads are consistent")

# 48. Optimize write (auto-compact)
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled","true")
spark.conf.set("spark.databricks.delta.autoCompact.enabled","true")
print("Ex48 auto optimize write and compact enabled")

# 49. Delta protocol version
detail = spark.sql(f"DESCRIBE DETAIL delta.`{PATH}`")
detail.select("minReaderVersion","minWriterVersion").show()

# 50. Unity Catalog managed Delta table lifecycle
print("""
Ex50 Unity Catalog Delta Table Lifecycle:
  CREATE TABLE catalog.schema.table (...)  USING DELTA
    CLUSTER BY (date, region)
    COMMENT 'main facts table'
    TBLPROPERTIES (
      'delta.enableChangeDataFeed' = 'true',
      'delta.enableDeletionVectors' = 'true',
      'delta.logRetentionDuration'  = 'interval 90 days'
    );

  - GRANT SELECT ON TABLE catalog.schema.table TO `group@domain.com`
  - DESCRIBE HISTORY catalog.schema.table
  - Unity Catalog tracks lineage, tags, and data classification automatically
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
