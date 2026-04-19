# ============================================================================
# Examples 6.3 — Cost Optimization  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: cluster sizing, AQE, caching, OPTIMIZE/VACUUM, Photon, DBU attribution
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = (SparkSession.builder
    .appName("cost-optimization")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/cost_opt"
os.makedirs(BASE, exist_ok=True)

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Databricks cost model overview
print("""Ex01 Databricks cost model:
  DBU (Databricks Unit) = unit of compute capacity per hour
  Cost = DBU rate × cluster_hours × workers

  Two dimensions to optimize:
    1. DBUs consumed  (cluster size, runtime, Photon)
    2. Clock hours    (job duration, idle time, auto-termination)
""")

# 2. Cluster types
print("""Ex02 Cluster types:
  All-Purpose:  dev notebooks, ad-hoc. Higher DBU rate. Use auto-termination.
  Job Cluster:  created per job, terminated after. ~2.5x cheaper than all-purpose.
  SQL Warehouse (Serverless): BI/SQL. Auto-scales to 0 when idle.

  Rule: ALL production ETL must run on job clusters, never all-purpose.
""")

# 3. Auto-termination
print("""Ex03 Auto-termination:
  Always set on dev clusters (30-60 min idle timeout).
  1 idle hour × 8 workers × $0.40/DBU ≈ $3.20 wasted.

  API config:  "autotermination_minutes": 30
  Cluster policy can enforce this for all users.
""")

# 4. Right-sizing workers
print("""Ex04 Right-sizing:
  1. Run on 4 workers, profile Spark UI → stage details.
  2. Look at max task duration, spill to disk, GC time.
  3. Scale only if CPU-bound or OOM.

  Memory-bound: increase worker memory (m-family).
  CPU-bound:    add workers or CPU-optimised instances.
  I/O-bound:    fix partitioning, not cluster size.
""")

# 5. Spot instances
print("""Ex05 Spot instances:
  Use spot for workers: 60-80% cheaper than on-demand.
  Always use on-demand for the driver (never lose it).

  Config: "availability": "SPOT_WITH_FALLBACK"
  Risk: ~5% task retry overhead on reclamation. Acceptable for batch ETL.
""")

# 6. Instance pools
print("""Ex06 Instance pools:
  Pre-warmed pool → cluster starts in 30s instead of 3-5 min.
  min_idle_instances: 2   max_capacity: 20

  Benefits: faster job starts + reduced spot reclamation risk.
""")

# 7. AQE — Adaptive Query Execution
print("""Ex07 Adaptive Query Execution (AQE):
  Enabled by default in Spark 3.x / Databricks Runtime 7+.

  Three runtime optimisations:
    1. Coalesce shuffle partitions → removes empty partitions
    2. Switch SortMerge join → Broadcast if build side turns out small
    3. Skew join split → breaks skewed partitions into sub-tasks

  Config (usually already on):
    spark.sql.adaptive.enabled = true
    spark.sql.adaptive.coalescePartitions.enabled = true
    spark.sql.adaptive.skewJoin.enabled = true
""")

# 8. Shuffle partitions tuning
print("""Ex08 Shuffle partitions:
  Default: 200.  Target: 100-200 MB of data per partition after shuffle.

  Example: 50 GB shuffle → 50,000 MB / 150 MB ≈ 333 partitions
    spark.conf.set('spark.sql.shuffle.partitions', '333')

  With AQE: start with 200; AQE auto-coalesces empty ones automatically.
""")

# 9. AQE in practice
spark.conf.set("spark.sql.adaptive.enabled",                    "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.shuffle.partitions",                  "200")

df  = spark.range(1000).withColumn("grp", (F.col("id") % 5).cast("string"))
agg = df.groupBy("grp").count()
print(f"Ex09 AQE on — actual partitions: {agg.rdd.getNumPartitions()}")

# 10. Broadcast join
from pyspark.sql.functions import broadcast

dim = spark.createDataFrame([("p1","Electronics"),("p2","Furniture")],["product_id","category"])
orders = spark.range(10000).withColumn("product_id",
    F.when(F.col("id") % 2 == 0, "p1").otherwise("p2"))
joined = orders.join(broadcast(dim), "product_id")
print(f"Ex10 broadcast join done: {joined.count()} rows, no shuffle on dim")

# 11. Cache strategically
print("""Ex11 Caching rules:
  Cache WHEN:  DataFrame used 2+ times in the same job.
  Do NOT cache: single-use DFs, large tables that don't fit in RAM, Delta tables.
  Always: df.unpersist() when done.
""")

# 12. Delta I/O cache
print("""Ex12 Delta I/O cache (Databricks):
  Automatically caches Parquet/Delta on local NVMe SSDs.
  Enable: spark.databricks.io.cache.enabled = true
  No code changes needed. Persists across Spark jobs on the same cluster.
  Best for: repeated reads (dashboards, iterative ML).
""")

# 13. Partition pruning
print("""Ex13 Partition pruning:
  Partitioned table: WHERE order_date='2024-01-15' scans 1 partition.
  Unpartitioned:     scans ALL files → massive I/O waste.

  Best partition columns: date, region — never high-cardinality like user_id.
""")

tmp_partitioned = f"{BASE}/partitioned_orders"
df_part = spark.range(1000) \
    .withColumn("order_date", F.date_add(F.lit("2024-01-01"), (F.col("id") % 30).cast("int"))) \
    .withColumn("region", F.when(F.col("id") % 2 == 0, "US").otherwise("EU"))
df_part.write.format("delta").partitionBy("order_date").mode("overwrite").save(tmp_partitioned)

one_day = spark.read.format("delta").load(tmp_partitioned).filter(F.col("order_date") == "2024-01-05")
print(f"Ex13 one-day partition read: {one_day.count()} rows")

# 14. OPTIMIZE — compact small files
spark.sql(f"OPTIMIZE delta.`{tmp_partitioned}`")
print("Ex14 OPTIMIZE complete — small files compacted into 1 GB targets")

# 15. VACUUM — remove stale Delta files
print("""Ex15 VACUUM:
  Removes files older than retention threshold (default 7 days).
  VACUUM delta.`/silver/orders` RETAIN 168 HOURS
  WARNING: never go below 7 days if concurrent DML or time-travel is used.
  Schedule: weekly Databricks Workflow task.
""")
spark.conf.set("spark.databricks.delta.retentionDurationCheck.enabled", "false")
spark.sql(f"VACUUM delta.`{tmp_partitioned}` RETAIN 0 HOURS")
print("Ex15 VACUUM complete")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Z-ORDER — data skipping
print("""Ex16 Z-ORDER:
  OPTIMIZE delta.`/silver/orders` ZORDER BY (customer_id)
  Co-locates rows with the same customer_id within Parquet files.
  Queries WHERE customer_id='c123' skip most files.
  Max 2-3 columns (diminishing returns beyond that).
""")
spark.sql(f"OPTIMIZE delta.`{tmp_partitioned}` ZORDER BY (region)")
print("Ex16 OPTIMIZE + ZORDER complete")

# 17. Liquid Clustering (DBR 13.3+)
print("""Ex17 Liquid Clustering:
  CREATE TABLE t CLUSTER BY (customer_id, order_date) USING DELTA ...
  OPTIMIZE t  -- incremental, no full rewrite

  Advantages over ZORDER: change cluster keys without rewriting table.
  Use for tables > 1 TB or complex multi-dimensional query patterns.
""")

# 18. Predicate pushdown
print("""Ex18 Predicate pushdown:
  Good:  spark.read.format('delta').load(p).filter(col('region')=='US')
         → filter runs at file reader level; unneeded files skipped.

  Check: df.explain() → look for 'PushedFilters' in FileScan.
""")
df_check = spark.read.format("delta").load(tmp_partitioned).filter(F.col("region") == "US")
df_check.explain()
print("Ex18 see PushedFilters in plan above")

# 19. Column pruning
print("""Ex19 Column pruning:
  Only read columns you need.
  .select('order_id','amount') before any action triggers column pruning.
  Delta/Parquet: columnar → reading 3 of 50 columns skips 94% of I/O.
""")
slim = spark.read.format("delta").load(tmp_partitioned).select("id","region")
print(f"Ex19 column-pruned read: {slim.count()} rows, 2 columns")

# 20. Wide vs narrow transformations
print("""Ex20 Transformation cost:
  Narrow (no shuffle):  filter, select, withColumn, map      → cheap
  Wide   (shuffle):     groupBy, join, distinct, orderBy     → expensive

  Optimise: filter BEFORE join, broadcast dims, avoid global sort.
""")

# 21. Coalesce vs repartition
print("""Ex21 coalesce vs repartition:
  repartition(N): full shuffle → balanced partitions. Use when skewed.
  coalesce(N):    no shuffle → reduces partition count only. Use before write.

  Before writing: .coalesce(ceil(bytes/128MB))  → right-sized output files.
""")
big  = spark.range(10000)
rep  = big.repartition(8)
coal = big.coalesce(4)
print(f"Ex21 repartition={rep.rdd.getNumPartitions()} coalesce={coal.rdd.getNumPartitions()}")

# 22. Skew handling
print("""Ex22 Skew handling:
  Symptom: 1 task takes 10× longer (Spark UI → stage details).
  Cause:   one join key has many more rows (NULL, 'UNKNOWN', top customer).

  Solutions:
    1. AQE skewJoin.enabled=true (automatic, recommended)
    2. Salt the skewed key: concat(key, '_', (rand()*10).cast('int'))
    3. Filter skewed value, process separately, union results.
    4. Broadcast the skewed key's partner if small enough.
""")

# 23. Avoid Python UDFs
print("""Ex23 UDF cost:
  Python UDF:  each row crosses JVM→Python boundary → 10-100× slower.
  Pandas UDF:  batched via Arrow → ~3-5× overhead.
  Native F.*:  compiled JVM/Photon → fastest.

  Rule: use UDF only when no native function exists.
  Bad:  @udf def strip(p): return p.strip()
  Good: F.trim(F.col('phone'))
""")

# 24. Checkpoint long lineage
print("""Ex24 Long lineage checkpoint:
  Very long DAG chains → slow planning, stack overflow risk.

  Fix:
    spark.sparkContext.setCheckpointDir('/tmp/ckpt')
    df = df.checkpoint()           # materialise + break lineage

  Or write to Delta:
    df.write.format('delta').mode('overwrite').save('/tmp/stage')
    df = spark.read.format('delta').load('/tmp/stage')
""")

# 25. Memory settings
print("""Ex25 Memory config:
  spark.executor.memory:          heap per executor
  spark.executor.memoryOverhead:  off-heap (network buffers, Python)
  spark.memory.fraction:          0.6  (exec+storage fraction of heap)

  Tune only if seeing OOM or GC > 20% in Spark UI.
  Start with instance defaults on Databricks.
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 26. Photon engine
print("""Ex26 Photon:
  C++ vectorised execution → 2-5× faster for SQL/aggregations/joins.
  Pricing: 2× DBU rate but 2-5× faster → 30-60% net cost reduction.
  Enable: select Photon runtime (DBR 9+ Photon edition). No code change.
""")

# 27. Serverless compute
print("""Ex27 Serverless:
  Serverless Jobs:    start in seconds, billed only for task time.
  Serverless SQL:     auto-scale to 0, per-query billing.

  Wins for: short jobs (< 20 min), bursty BI workloads.
  Cost: ~15-20% higher DBU rate but no idle/startup billing.
  Net saving: 20-40% for bursty patterns.
""")

# 28. Auto-scaling clusters
print("""Ex28 Auto-scaling:
  min_workers: 2  max_workers: 10
  Scale-up:   when task backlog grows.
  Scale-down: after N minutes of low utilisation.

  Best for: variable batch workloads.
  Not for:  streaming (constant load, scaling adds latency).
  Combine with: spot instances + job cluster.
""")

# 29. Delta log compaction
print("""Ex29 Delta log auto-checkpoint:
  Delta logs: JSON in _delta_log/ → reading 10,000 log files is slow.
  Delta auto-checkpoints every 10 transactions.

  For high-write tables: set delta.checkpointInterval=50 (TBLPROPERTIES).
  Rarely needs manual tuning; Databricks handles it automatically.
""")

# 30. Cost attribution tagging
print("""Ex30 Cost attribution:
  Tag clusters:
    {"team":"data-eng","pipeline":"orders_etl","env":"prod","cost_center":"DE-001"}

  AWS Cost Explorer / Azure Cost Management: filter by tag → cost per pipeline.
  Enforce via Cluster Policies (admin-only templates).
  Monthly cost review per team/pipeline.
""")

# 31. ANALYZE TABLE for CBO
print("""Ex31 ANALYZE TABLE:
  ANALYZE TABLE silver.orders COMPUTE STATISTICS FOR ALL COLUMNS
  → Spark uses min/max/null/distinct counts for better join ordering.

  Run after: bulk loads, major updates.
  Delta collects basic file-level stats at write time automatically.
  ANALYZE adds global stats used by Cost-Based Optimizer.
""")

# 32. Cluster policies
print("""Ex32 Cluster policies:
  Admin-defined JSON templates that restrict user cluster config.

  Enforce:
    - Spot workers (all non-prod)
    - Auto-termination < 60 min (all-purpose)
    - Max workers cap (prevent expensive oops)
    - Mandatory cost tags

  Example:
    {"autotermination_minutes":{"type":"fixed","value":30},
     "aws_attributes.availability":{"type":"fixed","value":"SPOT_WITH_FALLBACK"}}
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 33. DBU consumption analysis
print("""Ex33 DBU analysis:
  GET /api/2.0/accounts/{id}/usage/download → daily DBU report CSV

  Key metrics:
    - DBU/hour by cluster type
    - Idle time percentage (cluster running, no tasks)
    - Job duration trend (detect regression)
    - Spot vs on-demand ratio (target > 80% spot workers)
""")

# 34. Job cost estimation
print("""Ex34 Job cost formula:
  hourly_cost = workers × dbu_per_worker × dbu_price
  job_cost    = hourly_cost × duration_hours

  Example: 8 workers × 0.75 DBU × $0.40/DBU/hr × 0.5hr = $1.20/run
  Daily (2 runs): $2.40   Monthly: ~$72

  Optimise: cut duration (AQE, Z-ORDER) before scaling workers.
""")

# 35. Cost-aware design principles
print("""Ex35 Cost-aware design:
  1. Incremental > full re-scan (watermark / MERGE)
  2. Filter early (prune before join)
  3. Cache shared DataFrames (avoid recomputation)
  4. Right-size output files (avoid thousands of 1 KB files)
  5. Schedule off-peak (lower spot reclamation risk)
  6. Serverless for short jobs (no idle billing)
  7. OPTIMIZE + VACUUM on schedule (fast reads + low storage cost)
  8. Broadcast small dims (eliminate shuffle)
  9. Coalesce output (reduce S3/ADLS small file count)
 10. Profile first, then fix the real bottleneck
""")

# 36. File compaction strategy
print("""Ex36 Optimal file size:
  Target: 128 MB – 1 GB per Parquet file.
  Too small: metadata overhead → slow listings.
  Too large: coarse data skipping → reads too much per query.

  For streaming (many small files):
    delta.autoCompact.enabled = true      (TBLPROPERTIES)
    delta.autoCompact.minNumFiles = 50
    delta.targetFileSize = 134217728      (128 MB in bytes)
""")

# 37. Auto-optimize on Delta tables
print("""Ex37 Auto-optimize:
  1. Auto-compaction: compacts files after each write.
     delta.autoCompact.enabled = true
  2. Optimized writes: shuffles before write → right-sized files.
     delta.optimizeWrite.enabled = true  (default on DBR 9+)

  ALTER TABLE silver.orders SET TBLPROPERTIES (
    'delta.autoCompact.enabled' = 'true',
    'delta.optimizeWrite.enabled' = 'true'
  );
""")

# 38. Storage cost reduction
print("""Ex38 Storage cost:
  1. VACUUM regularly (remove stale Delta versions)
  2. Archive old data: S3 Glacier / Azure Cool after 90 days
  3. ZSTD compression: better ratio at same speed as Snappy:
       spark.conf.set('spark.sql.parquet.compression.codec','zstd')
  4. Delete unused test/dev data (enforce TTL)
  5. Use Delta sharing / views instead of data copies
""")

# 39. Dynamic allocation
print("""Ex39 Dynamic allocation + external shuffle:
  spark.dynamicAllocation.enabled = true
  spark.shuffle.service.enabled = true    # REQUIRED
  spark.dynamicAllocation.minExecutors = 1
  spark.dynamicAllocation.maxExecutors = 20

  Workers scale down when idle → saves cost.
  Shuffle service keeps shuffle data when workers are removed.
""")

# 40. Query result cache (SQL Warehouse)
print("""Ex40 Query result cache:
  SQL Warehouses cache results for 24 hours.
  Same query = instant return, zero compute.
  Invalidated automatically when underlying Delta table is modified.

  BI dashboards refreshing every hour pay compute only once per day
  (if underlying data hasn't changed).
""")

# 41. Cost monitoring alerts
print("""Ex41 Cost alerts:
  Databricks Budget Alerts: email/webhook at 80%/100% of monthly budget.

  Custom alerts:
    - Cost/day > threshold (Prometheus + Grafana)
    - Idle cluster > 2h (billing API poll)
    - Job duration > 2× baseline (regression alert)
    - Spot reclamation > 5% (cluster event log)
""")

# 42. Cost optimisation checklist
print("""Ex42 Cost optimisation checklist:
  Cluster:
    ✓ Job clusters for all ETL
    ✓ Spot workers + on-demand driver
    ✓ Auto-termination ≤ 30 min on dev clusters
    ✓ Right-sized instance type

  Query:
    ✓ AQE enabled + skew join enabled
    ✓ Predicate pushdown verified (explain())
    ✓ Broadcast join for dims < 200 MB
    ✓ Shuffle partitions tuned

  Storage:
    ✓ OPTIMIZE + ZORDER on hot tables
    ✓ VACUUM weekly (168h retention)
    ✓ Auto-compaction on high-write tables
    ✓ Partitioned writes for date queries
""")

# 43. Photon ROI calculation
print("""Ex43 Photon ROI:
  Standard: 8 workers × 1h × $0.40/DBU   = $3.20
  Photon:   8 workers × 0.4h × $0.80/DBU = $2.56  (runs 2.5× faster)
  Saving: 20% per run

  Photon shines: heavy aggregations, wide joins, Delta MERGE, window fns.
  Less impact: Python UDF-heavy pipelines (JVM→Python boundary unchanged).
""")

# 44. Serverless vs classic break-even
print("""Ex44 Serverless break-even:
  Classic job cluster: 4 min startup + 2 min teardown = 6 min idle billing.
  Serverless: billed from first task, stops at last task.

  Break-even ≈ 20-min jobs.
  Serverless wins: short/frequent jobs.
  Classic wins:    long-running jobs (2h+) — cheaper per DBU.
""")

# 45. Unity Catalog + storage stats
print("""Ex45 UC storage stats:
  SELECT table_catalog, table_schema, table_name, bytes_size
  FROM system.information_schema.tables
  ORDER BY bytes_size DESC LIMIT 20;

  → Find largest tables to target for VACUUM / archival / deletion.
  Combine with billing API to answer: "which pipeline costs the most?"
""")

# 46. Cluster log analysis
print("""Ex46 Cluster logs:
  High GC time (> 20%): reduce memory pressure or increase heap.
  High shuffle write:   improve join order, add broadcast, push predicates.
  Disk spill:           increase executor memory or reduce shuffle partitions.

  Access:
    dbutils.fs.ls('dbfs:/cluster-logs/<cluster-id>/driver/')
    spark.sparkContext.getConf().getAll()  # dump all config
""")

# 47. Multi-task job cluster reuse
print("""Ex47 Task cluster reuse:
  Pattern A: one job cluster per task → max isolation, max cost (4 startups).
  Pattern B: shared job cluster for sequential tasks → one startup.

  Define cluster once in job YAML, reference by key in later tasks.
  Saving: 3 × 4min startup × $0.40 ≈ $0.08 per run; $30/year for 2 daily runs.
""")

# 48. Data lifecycle tiering
print("""Ex48 Data lifecycle:
  Hot  (0–30 days):   Delta on standard storage
  Warm (30–90 days):  Delta on cool/infrequent-access tier
  Cold (90+ days):    archive to Glacier / cold storage
  Delete (> limit):   scheduled Databricks job

  DELETE FROM catalog.schema.events
  WHERE event_date < current_date() - INTERVAL 90 DAYS
""")

# 49. Spot interruption handling
print("""Ex49 Spot interruption:
  AWS gives 2-min warning; Databricks reschedules tasks automatically.
  Driver on spot → job fails if driver reclaimed. Always use on-demand driver.

  Best config:
    driver:  on-demand
    workers: SPOT_WITH_FALLBACK
  Set max_spot_bid_price to avoid overpaying during spot spikes.
""")

# 50. Expert cost checklist
print("""Ex50 Expert cost checklist:
  Cluster:
    ✓ Photon for SQL/Delta-heavy workloads
    ✓ Spot workers + on-demand driver
    ✓ Instance pools for fast restarts
    ✓ Dynamic allocation + external shuffle service
    ✓ Serverless for jobs < 20 min

  Query:
    ✓ AQE fully configured
    ✓ Broadcast joins where dim < 200 MB
    ✓ Z-ORDER / Liquid Clustering on filter columns
    ✓ Column + predicate pushdown verified

  Storage:
    ✓ Auto-compaction + optimized writes on write-heavy tables
    ✓ Weekly OPTIMIZE + VACUUM
    ✓ Data lifecycle policy (hot/warm/cold/delete)
    ✓ ZSTD compression for archival tables

  Governance:
    ✓ Cluster policies enforce spot + auto-termination
    ✓ Cost tags on every cluster
    ✓ Budget alerts at 80%/100%
    ✓ Monthly cost review per team/pipeline
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
