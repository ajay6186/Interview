# ============================================================================
# Examples 5.4 — Data Lakehouse Architecture  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: Delta Lake full stack, Unity Catalog, ACID, multi-format, governance
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType, TimestampType
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("data-lakehouse")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/lakehouse"
for p in ["bronze","silver","gold","external/parquet","external/json","governance"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. What is a Lakehouse? (concept)
print("""Ex01 Lakehouse = Data Lake + Data Warehouse
  - Open file formats (Parquet, Delta) on cheap cloud storage
  - ACID transactions (Delta Lake)
  - Schema enforcement + evolution
  - BI, SQL, ML all on same data
  - No ETL copy into warehouse → reduced latency + cost
""")

# 2. Delta Lake vs plain Parquet
print("""Ex02 Delta vs Parquet:
  Delta   = Parquet files + _delta_log/ (transaction log JSON)
  _delta_log contains: added/removed files, schema, metadata, stats
  Enables: ACID, time-travel, upserts, schema evolution
  Parquet alone: no ACID, no schema enforcement, no time-travel
""")

# 3. Create a Delta table programmatically
orders = spark.createDataFrame([
    (1, "cust_01","prod_A", 2, 999.99, "2024-01-10"),
    (2, "cust_02","prod_B", 1, 699.00, "2024-01-11"),
    (3, "cust_01","prod_C", 3, 149.99, "2024-01-12"),
    (4, "cust_03","prod_A", 1, 999.99, "2024-01-13"),
    (5, "cust_02","prod_D", 2, 349.00, "2024-01-14"),
], ["order_id","customer_id","product_id","quantity","amount","order_date"])

orders.write.format("delta").mode("overwrite").save(f"{BASE}/silver/orders")
print("Ex03 Delta table created:", orders.count())

# 4. Read Delta table
df = spark.read.format("delta").load(f"{BASE}/silver/orders")
df.show()

# 5. DESCRIBE DETAIL — Delta table metadata
spark.sql(f"DESCRIBE DETAIL delta.`{BASE}/silver/orders`").select(
    "format","numFiles","sizeInBytes","numOutputRows"
).show()

# 6. DESCRIBE HISTORY — transaction log
spark.sql(f"DESCRIBE HISTORY delta.`{BASE}/silver/orders`") \
    .select("version","timestamp","operation").show()

# 7. Time travel — versionAsOf
v0 = spark.read.format("delta").option("versionAsOf", 0).load(f"{BASE}/silver/orders")
print(f"Ex07 version 0 count: {v0.count()}")

# 8. Time travel — timestampAsOf
print("Ex08 timestampAsOf: spark.read.format('delta').option('timestampAsOf','2024-01-01').load(path)")

# 9. Schema enforcement — reject bad schema write
try:
    bad = spark.createDataFrame([(999,"extra_col")],["order_id","bad_column"])
    bad.write.format("delta").mode("append").save(f"{BASE}/silver/orders")
    print("Ex09 write succeeded (unexpected)")
except Exception as e:
    print(f"Ex09 schema enforcement blocked: {type(e).__name__}")

# 10. Schema evolution — mergeSchema
new_col = orders.withColumn("discount_pct", F.lit(0.0))
new_col.write.format("delta").mode("append") \
    .option("mergeSchema","true").save(f"{BASE}/silver/orders")
print("Ex10 schema evolved with discount_pct")
spark.read.format("delta").load(f"{BASE}/silver/orders").printSchema()

# 11. ACID INSERT
spark.sql(f"INSERT INTO delta.`{BASE}/silver/orders` VALUES (6,'cust_04','prod_B',1,699.00,'2024-01-15',0.0)")
print(f"Ex11 after INSERT: {spark.read.format('delta').load(f'{BASE}/silver/orders').count()}")

# 12. ACID UPDATE
DeltaTable.forPath(spark, f"{BASE}/silver/orders") \
    .update(F.col("order_id") == 1, {"discount_pct": F.lit(10.0)})
print("Ex12 UPDATE applied")

# 13. ACID DELETE
DeltaTable.forPath(spark, f"{BASE}/silver/orders") \
    .delete(F.col("order_date") < "2024-01-11")
print(f"Ex13 after DELETE: {spark.read.format('delta').load(f'{BASE}/silver/orders').count()}")

# 14. UPSERT (MERGE)
new_orders = spark.createDataFrame([
    (2, "cust_02","prod_B", 1, 699.00, "2024-01-11", 5.0),
    (7, "cust_05","prod_A", 2, 999.99, "2024-01-15", 0.0),
], ["order_id","customer_id","product_id","quantity","amount","order_date","discount_pct"])

DeltaTable.forPath(spark, f"{BASE}/silver/orders").alias("t") \
    .merge(new_orders.alias("s"), "t.order_id = s.order_id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .execute()
print(f"Ex14 after MERGE: {spark.read.format('delta').load(f'{BASE}/silver/orders').count()}")

# 15. VACUUM — remove old data files
spark.sql(f"VACUUM delta.`{BASE}/silver/orders` RETAIN 0 HOURS")
print("Ex15 VACUUM complete")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Partitioned Delta table
orders_large = spark.range(100).select(
    F.col("id").alias("order_id"),
    (F.rand(seed=42) * 5).cast("int").alias("month"),
    (F.rand(seed=1) * 1000).alias("amount")
)
orders_large.write.format("delta").partitionBy("month") \
    .mode("overwrite").save(f"{BASE}/silver/orders_partitioned")
print("Ex16 partitioned table written")

# 17. Partition pruning
from datetime import datetime
spark.conf.set("spark.sql.hive.metastorePartitionPruning","true")
pruned = spark.read.format("delta").load(f"{BASE}/silver/orders_partitioned") \
    .filter(F.col("month") == 2)
print(f"Ex17 pruned to month=2: {pruned.count()}")

# 18. OPTIMIZE — compact small files
spark.sql(f"OPTIMIZE delta.`{BASE}/silver/orders`")
print("Ex18 OPTIMIZE done")

# 19. Z-ORDER — co-locate by frequently-filtered columns
spark.sql(f"OPTIMIZE delta.`{BASE}/silver/orders` ZORDER BY (customer_id, order_date)")
print("Ex19 Z-ORDER done")

# 20. Auto Optimize settings
spark.conf.set("spark.databricks.delta.autoCompact.enabled","true")
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled","true")
print("Ex20 autoCompact + optimizeWrite enabled")

# 21. Change Data Feed (CDF)
spark.sql(f"ALTER TABLE delta.`{BASE}/silver/orders` SET TBLPROPERTIES ('delta.enableChangeDataFeed'='true')")
print("Ex21 CDF enabled")

# Read CDF changes
try:
    cdf = (spark.read.format("delta")
        .option("readChangeFeed","true")
        .option("startingVersion",0)
        .load(f"{BASE}/silver/orders"))
    cdf.select("order_id","_change_type","_commit_version").show()
    print("Ex21 CDF read ok")
except Exception as e:
    print(f"Ex21 CDF read: {type(e).__name__}: {e}")

# 22. Deletion Vectors (Databricks 12.2+)
print("""Ex22 Deletion Vectors:
ALTER TABLE orders SET TBLPROPERTIES ('delta.enableDeletionVectors'='true')
→ soft-delete: marks rows without rewriting files → fast DELETE and MERGE
""")

# 23. Liquid Clustering (Databricks 13.3+)
print("""Ex23 Liquid Clustering:
CREATE TABLE orders CLUSTER BY (customer_id, order_date) ...
ALTER TABLE orders CLUSTER BY (customer_id, order_date)
OPTIMIZE orders  -- applies clustering incrementally
Advantage: no static partition layout, self-tuning
""")

# 24. External table vs managed table
print("""Ex24 Managed vs External:
Managed:  CREATE TABLE catalog.schema.orders USING delta
          Data stored in Unity Catalog default location
          DROP TABLE → data deleted

External: CREATE TABLE catalog.schema.orders USING delta LOCATION 'abfss://...'
          Data stored at specified path
          DROP TABLE → only metadata removed, data preserved
""")

# 25. Multi-format reading (Parquet, JSON, CSV)
orders.write.mode("overwrite").parquet(f"{BASE}/external/parquet/orders")
orders.write.mode("overwrite").json(f"{BASE}/external/json/orders")
df_parquet = spark.read.parquet(f"{BASE}/external/parquet/orders")
df_json    = spark.read.json(f"{BASE}/external/json/orders")
print(f"Ex25 parquet={df_parquet.count()}  json={df_json.count()}")

# 26. Convert Parquet to Delta
DeltaTable.convertToDelta(spark, f"parquet.`{BASE}/external/parquet/orders`")
print("Ex26 Parquet converted to Delta")

# 27. Unity Catalog hierarchy
print("""Ex27 Unity Catalog 3-level namespace:
  metastore (one per Databricks account)
  └── catalog  (e.g., 'prod', 'dev', 'staging')
      └── schema / database (e.g., 'raw', 'silver', 'gold')
          └── table / view / function / volume

Reference: prod.gold.customer_ltv
""")

# 28. Unity Catalog privileges
print("""Ex28 UC Grants:
GRANT USE CATALOG ON CATALOG prod TO `data-analysts`;
GRANT USE SCHEMA   ON SCHEMA prod.gold TO `data-analysts`;
GRANT SELECT       ON TABLE prod.gold.customer_ltv TO `data-analysts`;
GRANT MODIFY       ON TABLE prod.silver.orders TO `data-engineers`;
""")

# 29. Row-level security via view
print("""Ex29 Row-level security:
CREATE VIEW prod.gold.orders_rls AS
SELECT * FROM prod.silver.orders
WHERE customer_id = current_user()  -- or a group-based mapping table
;
GRANT SELECT ON VIEW prod.gold.orders_rls TO `customer-service`;
""")

# 30. Column masking
print("""Ex30 Column masking:
CREATE FUNCTION mask_email(email STRING)
RETURNS STRING
RETURN CASE WHEN is_account_group_member('pii-viewers')
            THEN email
            ELSE REGEXP_REPLACE(email, '(?<=.).(?=.*@)','*')
       END;

ALTER TABLE prod.silver.customers
ALTER COLUMN email SET MASK mask_email;
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. Lakehouse star schema design
print("""Ex31 Star schema on Delta:
  fact_orders     (order_id, customer_key, product_key, date_key, amount, quantity)
  dim_customer    (customer_key, customer_id, name, tier, city, is_current, effective_from)
  dim_product     (product_key, product_id, name, category, unit_price, is_current)
  dim_date        (date_key, full_date, year, quarter, month, week, is_weekend)
→ All tables are Delta, partitioned by appropriate column
""")

# 32. Slowly Changing Dimension Type 2
print("""Ex32 SCD2 MERGE:
DeltaTable.forPath(spark, '/dim/customer').alias('t')
  .merge(
    staged_updates.alias('s'),
    't.customer_id = s.customer_id AND t.is_current = True'
  )
  .whenMatchedUpdate(condition='t.tier != s.tier',
                     set={'is_current': 'false', 'effective_end': 'current_date()'})
  .whenNotMatchedInsertAll()
  .execute()
# Then INSERT new current rows
""")

# 33. COPY INTO for efficient batch loads
print("""Ex33 COPY INTO:
COPY INTO prod.bronze.orders
FROM 'abfss://landing@account.dfs.core.windows.net/orders/'
FILEFORMAT = JSON
FORMAT_OPTIONS ('inferSchema' = 'true', 'multiline' = 'false')
COPY_OPTIONS ('mergeSchema' = 'true', 'force' = 'false')  -- idempotent by default
""")

# 34. Delta Live Tables pipeline
print("""Ex34 DLT pipeline:
@dlt.table(comment='Bronze orders from landing zone')
def bronze_orders():
    return spark.readStream.format('cloudFiles') \\
        .option('cloudFiles.format','json').load('/landing/orders/')

@dlt.table(comment='Cleansed silver orders')
@dlt.expect_or_drop('non_null_amount','amount IS NOT NULL')
def silver_orders():
    return dlt.read_stream('bronze_orders') \\
        .withColumn('amount', col('amount').cast('double'))

@dlt.table(comment='Daily revenue gold aggregate')
def gold_revenue():
    return dlt.read('silver_orders') \\
        .groupBy('order_date').agg(sum('amount').alias('revenue'))
""")

# 35. Lakehouse vs Warehouse query performance
print("""Ex35 Lakehouse perf tips:
  - Delta caching (SSD): spark.conf.set('spark.databricks.io.cache.enabled','true')
  - Z-ORDER on high-cardinality filter columns
  - Liquid Clustering for multi-column workloads
  - Photon engine: vectorized C++ Spark engine (enable in cluster runtime)
  - Data skipping: per-file min/max stats in delta_log
  - OPTIMIZE before BI queries (compact small files)
""")

# 36. Incremental materialization pattern
print("""Ex36 Incremental Gold:
last_ts = gold_table.agg(max('_last_updated')).collect()[0][0]
incremental = silver_table.filter(col('_processed_at') > last_ts)
if incremental.count() > 0:
    gold_aggregates = incremental.groupBy('order_date') \\
        .agg(sum('amount').alias('new_revenue'))
    DeltaTable.forPath(spark,gold_path).alias('t') \\
        .merge(gold_aggregates.alias('s'),'t.order_date=s.order_date') \\
        .whenMatchedUpdate(set={'revenue':'t.revenue + s.new_revenue'}) \\
        .whenNotMatchedInsertAll().execute()
""")

# 37. Data sharing with Delta Sharing
print("""Ex37 Delta Sharing:
-- Provider: share a table externally (no data copy)
CREATE SHARE orders_share;
ALTER SHARE orders_share ADD TABLE prod.gold.daily_revenue;
CREATE RECIPIENT partner_company;
-- Recipient: read via open Delta Sharing protocol (Spark, pandas, Power BI, etc.)
""")

# 38. Lakehouse monitoring with INFORMATION_SCHEMA
print("""Ex38 INFORMATION_SCHEMA queries:
-- Table sizes
SELECT table_name, size_gb FROM prod.information_schema.tables
WHERE table_schema = 'gold' ORDER BY size_gb DESC;

-- Column lineage (UC Lineage)
SELECT * FROM prod.system.access.column_lineage WHERE target_table_name='daily_revenue';
""")

# 39. Photon engine enablement
print("""Ex39 Photon:
- Select Databricks Runtime with Photon (DBR 9.1+)
- No code changes required — transparent vectorized execution
- Best for: SQL aggregations, joins, scans on Delta tables
- Monitor: Spark UI → SQL → see 'WholeStageCodegen' replaced by 'PhotonSort', 'PhotonAggregate'
""")

# 40. Serverless compute for SQL
print("""Ex40 Serverless SQL Warehouse:
- Auto-scaling, sub-second startup
- No cluster management
- Best for: ad-hoc SQL, BI tools (Power BI, Tableau, Looker)
- Cost model: per-query DBU, not per-cluster-hour
- Enable: SQL Warehouses → Create → Type: Serverless
""")

# 41. Lineage tracking via Unity Catalog
print("""Ex41 UC Lineage:
- Automatic column-level lineage captured for SQL + Python DataFrames
- Query: SELECT * FROM system.access.column_lineage WHERE ...
- Table lineage: SELECT * FROM system.access.table_lineage WHERE ...
- Visualized in Catalog Explorer UI
""")

# 42. Data contracts with Delta constraints
spark.sql(f"""
    ALTER TABLE delta.`{BASE}/silver/orders`
    ADD CONSTRAINT order_amount_positive CHECK (amount > 0)
""")
print("Ex42 CHECK constraint added")

try:
    spark.createDataFrame([(-1,)], ["amount"]).write.format("delta").mode("append").save(f"{BASE}/silver/orders")
except Exception as e:
    print(f"Ex42 constraint blocked write: {type(e).__name__}")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Lakehouse architecture diagram
print("""Ex43 Full Lakehouse Architecture:
  ┌─────────────────────────────────────────────────────┐
  │                  Unity Catalog                      │
  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
  │  │  Bronze  │  │  Silver  │  │       Gold        │  │
  │  │  (raw)   │→ │(cleansed)│→ │  (aggregated)    │  │
  │  │  Delta   │  │  Delta   │  │    Delta/Views   │  │
  │  └──────────┘  └──────────┘  └──────────────────┘  │
  │         Auto Loader / DLT / Spark ETL               │
  └─────────────────────────────────────────────────────┘
  │  SQL Analytics  │  ML/AI  │  BI Tools (Tableau/PBI) │
  └─────────────────────────────────────────────────────┘
""")

# 44. Open table format comparison
print("""Ex44 Open formats:
  Delta Lake:  Databricks native. Best Spark integration. DeltaTable API.
               Z-ORDER, CDF, DV, Liquid Clustering, DLT, UC lineage
  Apache Iceberg: Strong Spark/Flink/Trino/Hive support. Partition evolution.
  Apache Hudi:   Streaming upserts (COW/MOR). Good Flink integration.
  UniForm:  Delta 3.0 — write Delta, read as Iceberg/Hudi without copy
""")

# 45. UniForm — multi-format compatibility
print("""Ex45 Delta UniForm:
ALTER TABLE orders SET TBLPROPERTIES (
    'delta.universalFormat.enabledFormats' = 'iceberg'
);
-- Now readable by Spark (Delta), Trino/Athena (Iceberg), Hive (Iceberg)
-- No data copy — Delta is the source of truth
""")

# 46. Lakehouse cost model
print("""Ex46 Cost model:
  Storage: S3/ADLS/GCS — very cheap (~$0.023/GB/month)
  Compute: DBU × cluster-hours → optimize with spot instances, auto-termination
  SQL Warehouse: serverless → pay per query, not idle cluster
  Key savings: OPTIMIZE reduces files → fewer S3 API calls; Delta caching → faster = shorter runtime
""")

# 47. Data vault pattern on Lakehouse
print("""Ex47 Data Vault 2.0 on Lakehouse:
  Hubs:      business keys (customer_hub: customer_id, load_ts, record_source)
  Links:     relationships between hubs (order_link: order_id, customer_hk, product_hk)
  Satellites: descriptive data (customer_sat: customer_hk, name, email, load_ts, hash_diff)
→ All append-only Delta tables; full history preserved
""")

# 48. Compliance: GDPR right-to-erasure
print("""Ex48 GDPR delete:
1. DELETE FROM silver.customers WHERE customer_id = 'cust_01'  (Delta ACID)
2. DeltaTable.forPath(spark,path).delete(col('customer_id')=='cust_01')
3. VACUUM → removes old Parquet files containing the row
4. For sub-7-day retention: use Deletion Vectors for immediate logical delete
5. Log deletion request + completion to audit table
""")

# 49. Lakehouse testing strategy
print("""Ex49 Testing:
  Unit tests:     pytest + pyspark-testing or chispa — test transform functions locally
  Integration:    pytest-delta — test full Bronze→Silver→Gold pipeline on sample data
  DQ assertions:  Great Expectations / custom DQ checks before gold write
  Schema tests:   assert df.schema == expected_schema after every major transform
  Volume tests:   assert row_count > 0 and within expected range
  Idempotency:    run pipeline twice, assert output identical (no duplicate rows)
""")

# 50. Production Lakehouse checklist
print("""Ex50 Production checklist:
✓ All tables in Unity Catalog with proper 3-level naming
✓ Column-level access controls (masking / row filters)
✓ Delta CDF enabled for incremental Silver and Gold
✓ Auto Loader for all external file ingestion
✓ DLT for pipeline orchestration with built-in expectations
✓ OPTIMIZE + Z-ORDER scheduled (weekly or post-bulk-load)
✓ Deletion Vectors enabled for fast DELETE/MERGE
✓ Liquid Clustering on high-churn Gold tables
✓ CHECK constraints on critical numeric columns
✓ VACUUM scheduled (retain 7 days for time-travel)
✓ Table and column lineage captured by Unity Catalog
✓ Data sharing via Delta Sharing for external partners
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
