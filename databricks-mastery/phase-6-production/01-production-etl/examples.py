# ============================================================================
# Examples 6.1 — Production ETL Patterns  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: idempotency, error handling, retries, checkpointing, schema validation
# ============================================================================

import os, json, time
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType, TimestampType
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("production-etl")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/prod_etl"
for p in ["bronze","silver","gold","checkpoints","audit","quarantine"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Production ETL principles
print("""Ex01 Production ETL principles:
  1. Idempotent   — run twice, same result. No duplicate rows.
  2. Atomic       — succeed fully or fail cleanly. No partial writes.
  3. Resilient    — retry on transient failures. Dead-letter bad records.
  4. Observable   — log row counts, durations, DQ results, errors.
  5. Versioned    — schema changes backward-compatible or migration-scripted.
""")

# 2. Idempotent write — overwrite with replaceWhere
df = spark.range(5).withColumn("day", F.lit("2024-01-10")).withColumn("val", F.rand())
df.write.format("delta") \
    .mode("overwrite") \
    .option("replaceWhere","day = '2024-01-10'") \
    .save(f"{BASE}/silver")
print("Ex02 idempotent replaceWhere write done")

# 3. Idempotent MERGE (upsert)
print("""Ex03 MERGE is idempotent by key:
DeltaTable.forPath(spark, path).alias('t')
  .merge(new_df.alias('s'), 't.id = s.id')
  .whenMatchedUpdateAll()
  .whenNotMatchedInsertAll()
  .execute()
Running twice produces same result — no phantom duplicates
""")

# 4. Watermark table for incremental processing
def load_watermark(key: str, default: str = "1970-01-01T00:00:00") -> str:
    path = f"{BASE}/checkpoints/{key}.wm"
    return open(path).read().strip() if os.path.exists(path) else default

def save_watermark(key: str, value: str) -> None:
    with open(f"{BASE}/checkpoints/{key}.wm","w") as f:
        f.write(value)

wm = load_watermark("orders_ingest")
print(f"Ex04 watermark: {wm}")

# 5. Schema validation at ETL entry point
ORDERS_SCHEMA = StructType([
    StructField("order_id",    StringType(),  False),
    StructField("customer_id", StringType(),  True),
    StructField("amount",      DoubleType(),  True),
    StructField("order_ts",    TimestampType(),True),
])
print(f"Ex05 expected schema fields: {[f.name for f in ORDERS_SCHEMA.fields]}")

# 6. Dead-letter queue (quarantine bad records)
raw = spark.createDataFrame([
    ("ord_001","cust_01", 999.99),
    ("ord_002", None,     699.00),  # bad: null customer
    ("ord_003","cust_01", -50.00),  # bad: negative amount
    ("ord_004","cust_02", 149.99),
], ["order_id","customer_id","amount"])

good = raw.filter(F.col("customer_id").isNotNull() & (F.col("amount") > 0))
bad  = raw.filter(F.col("customer_id").isNull() | (F.col("amount") <= 0)) \
    .withColumn("_error_reason",
        F.when(F.col("customer_id").isNull(), F.lit("null_customer"))
         .when(F.col("amount") <= 0,          F.lit("non_positive_amount"))
         .otherwise(F.lit("unknown")))

good.write.format("delta").mode("overwrite").save(f"{BASE}/silver")
bad.write.format("delta").mode("overwrite").save(f"{BASE}/quarantine")
print(f"Ex06 good={good.count()}  quarantine={bad.count()}")

# 7. Audit log
def write_audit(run_id: str, stage: str, rows_in: int, rows_out: int, status: str, duration_sec: float):
    log = spark.createDataFrame([(run_id, stage, rows_in, rows_out, status, duration_sec,
                                  datetime.utcnow().isoformat())],
                                 ["run_id","stage","rows_in","rows_out","status","duration_sec","logged_at"])
    log.write.format("delta").mode("append").save(f"{BASE}/audit")
    print(f"Ex07 audit: {run_id} | {stage} | rows_out={rows_out} | {status} | {duration_sec}s")

write_audit("run-001","silver_cleanse", 4, 2, "SUCCESS", 1.2)

# 8. Row count assertion (SLA check)
def assert_row_count(df, min_rows: int, max_rows: int = None, label: str = "df"):
    n = df.count()
    if n < min_rows:
        raise ValueError(f"SLA: {label} has {n} rows < min {min_rows}")
    if max_rows and n > max_rows:
        raise ValueError(f"SLA: {label} has {n} rows > max {max_rows}")
    print(f"Ex08 row count SLA OK: {label}={n} in [{min_rows},{max_rows or '∞'}]")
    return n

assert_row_count(good, min_rows=1, label="silver_orders")

# 9. Retry decorator
def with_retry(func, max_retries: int = 3, delay_sec: float = 1.0):
    def wrapper(*args, **kwargs):
        last_exc = None
        for attempt in range(1, max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exc = e
                print(f"  Attempt {attempt}/{max_retries} failed: {e}")
                if attempt < max_retries:
                    time.sleep(delay_sec)
        raise RuntimeError(f"All {max_retries} retries failed") from last_exc
    return wrapper

@with_retry
def unstable_operation():
    # Simulates success on first try
    return "SUCCESS"

result = unstable_operation()
print(f"Ex09 retry result: {result}")

# 10. Transient vs permanent failure classification
def classify_error(exc: Exception) -> str:
    transient_types = (ConnectionError, TimeoutError, OSError)
    if isinstance(exc, transient_types):
        return "TRANSIENT"
    return "PERMANENT"

print(f"Ex10 ConnectionError → {classify_error(ConnectionError())}")
print(f"Ex10 ValueError → {classify_error(ValueError())}")

# 11. Checkpoint for streaming
print("""Ex11 Streaming checkpoint:
query = df.writeStream.format('delta')
    .option('checkpointLocation', '/checkpoints/orders')
    .outputMode('append')
    .trigger(processingTime='5 minutes')
    .start('/silver/orders')
Checkpoint stores offsets + metadata → exact-once guarantee on restart
""")

# 12. Structured logging
def structured_log(level: str, msg: str, **context):
    entry = {"level": level, "message": msg, "ts": datetime.utcnow().isoformat(), **context}
    print(json.dumps(entry))

structured_log("INFO",  "Pipeline started", pipeline="orders_etl", run_id="run-001")
structured_log("WARN",  "Bad records quarantined", count=2,  run_id="run-001")
structured_log("INFO",  "Pipeline complete", rows_out=2, duration_sec=1.2, run_id="run-001")

# 13. Column null rate monitoring
def null_report(df, cols: list) -> dict:
    n = df.count()
    return {c: round(df.filter(F.col(c).isNull()).count() / n * 100, 1) for c in cols}

report = null_report(raw, ["order_id","customer_id","amount"])
print(f"Ex13 null rates (%): {report}")

# 14. Duplicate detection
dup_count = raw.groupBy("order_id").count().filter(F.col("count") > 1).count()
print(f"Ex14 duplicate order_ids: {dup_count}")

# 15. ETL pipeline run summary
print("""Ex15 Run summary template:
{
  "run_id":       "run-2024-01-15-001",
  "pipeline":     "orders_etl",
  "start_time":   "2024-01-15T04:00:00Z",
  "end_time":     "2024-01-15T04:08:32Z",
  "stages": {
    "ingest":   {"rows_in": 5000, "rows_out": 5000, "status": "SUCCESS"},
    "cleanse":  {"rows_in": 5000, "rows_out": 4892, "quarantined": 108, "status": "SUCCESS"},
    "gold_agg": {"rows_in": 4892, "rows_out": 365,  "status": "SUCCESS"}
  },
  "overall_status": "SUCCESS"
}
""")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. ETL class pattern
class OrdersETL:
    def __init__(self, spark, base_path: str, run_id: str):
        self.spark    = spark
        self.base     = base_path
        self.run_id   = run_id
        self._metrics = {}

    def extract(self, raw_df):
        self._metrics["rows_in"] = raw_df.count()
        return raw_df

    def transform(self, df):
        good = df.filter(F.col("customer_id").isNotNull() & (F.col("amount") > 0))
        bad  = df.subtract(good)
        self._metrics["rows_out"]      = good.count()
        self._metrics["quarantined"]   = bad.count()
        return good, bad

    def load(self, df, path: str, mode: str = "overwrite"):
        df.write.format("delta").mode(mode).save(path)
        return self

    def run(self, raw_df):
        df    = self.extract(raw_df)
        good, bad = self.transform(df)
        self.load(good, f"{self.base}/silver_class")
        self.load(bad,  f"{self.base}/quarantine_class")
        print(f"Ex16 ETL complete: {self._metrics}")
        return self._metrics

etl = OrdersETL(spark, BASE, "run-002")
metrics = etl.run(raw)
print(f"Ex16 metrics: {metrics}")

# 17. Context manager for run lifecycle
from contextlib import contextmanager

@contextmanager
def etl_run(run_id: str):
    start = time.time()
    print(f"Ex17 START run {run_id}")
    try:
        yield run_id
        duration = round(time.time() - start, 2)
        print(f"Ex17 SUCCESS run {run_id} duration={duration}s")
    except Exception as e:
        duration = round(time.time() - start, 2)
        print(f"Ex17 FAILED  run {run_id} after {duration}s: {e}")
        raise

with etl_run("run-003"):
    pass  # simulated pipeline work

# 18. Schema migration pattern
print("""Ex18 Schema migration:
# Step 1: add nullable column with default
ALTER TABLE silver.orders ADD COLUMNS (discount_pct DOUBLE DEFAULT 0.0);
# Step 2: backfill if needed
UPDATE silver.orders SET discount_pct = 0.0 WHERE discount_pct IS NULL;
# Step 3: update downstream jobs to handle new column
# Step 4: remove old column after all consumers updated
""")

# 19. Backward-compatible schema changes
print("""Ex19 Safe schema changes:
  SAFE:   Add nullable column with default
  SAFE:   Widen type (int → bigint, float → double)
  UNSAFE: Remove column (downstream breaks)
  UNSAFE: Rename column (downstream breaks)
  UNSAFE: Change semantics without changing name
For UNSAFE: use views to translate schema, migrate consumers first
""")

# 20. Delta constraint enforcement
print("""Ex20 CHECK constraints:
ALTER TABLE delta.`/silver/orders` ADD CONSTRAINT pos_amount CHECK (amount > 0);
ALTER TABLE delta.`/silver/orders` ADD CONSTRAINT valid_status
    CHECK (status IN ('completed','pending','refunded','shipped'));
→ Violations raise AnalysisException at write time
""")

# 21. Partition-aware incremental write
print("""Ex21 Partition-aware incremental:
df_new.write.format('delta')
    .partitionBy('order_date')
    .mode('overwrite')
    .option('replaceWhere', f"order_date = '{run_date}'")
    .save('/silver/orders')
Only the target date partition is rewritten → idempotent, fast, cheap
""")

# 22. Upsert with SCD1 (overwrite attributes, keep key)
print("""Ex22 SCD1 MERGE:
DeltaTable.forPath(spark, '/dim/customers').alias('t')
  .merge(new_customers.alias('s'), 't.customer_id = s.customer_id')
  .whenMatchedUpdateAll()  # overwrite all changed columns
  .whenNotMatchedInsertAll()
  .execute()
""")

# 23. Null coalescing for optional columns
raw2 = spark.createDataFrame([("ord_X", None, 100.0)], ["order_id","promo_code","amount"])
clean = raw2.withColumn("promo_code", F.coalesce(F.col("promo_code"), F.lit("NO_PROMO")))
clean.show()
print("Ex23 null coalescing done")

# 24. Type coercion safety
print("""Ex24 Safe cast with null on failure:
df.withColumn('amount', F.col('amount_str').cast('double'))
  .withColumn('amount_valid', F.col('amount').isNotNull())
Bad strings cast to null rather than raising an exception
""")

# 25. Deduplication strategies
print("""Ex25 Dedup strategies:
  dropDuplicates(['id'])           — keep first occurrence in DataFrame
  MERGE whenMatchedUpdate          — Delta idempotent upsert
  Window + row_number = 1          — keep latest based on timestamp
  group by + agg                   — aggregated dedup
""")

# 26. Late-arriving data strategy
print("""Ex26 Late arrivals:
  Streaming: withWatermark('event_ts','2 hours') — tolerate 2h late
  Batch:     use MERGE with event_ts — later run overwrites stale record
  Reporting: gold uses 'completed' status filter — refunds handled naturally
""")

# 27. Error propagation with custom exception
class ETLError(Exception):
    def __init__(self, stage: str, msg: str, run_id: str = None):
        super().__init__(f"[{run_id or 'unknown'}] {stage}: {msg}")
        self.stage  = stage
        self.run_id = run_id

try:
    raise ETLError("cleanse", "null rate exceeds 10%", run_id="run-004")
except ETLError as e:
    print(f"Ex27 caught ETLError: {e}  stage={e.stage}")

# 28. Graceful degradation
print("""Ex28 Graceful degradation:
try:
    enriched = orders.join(product_catalog, 'product_id', 'left')
except AnalysisException:
    print('WARNING: product catalog unavailable — proceeding without enrichment')
    enriched = orders.withColumn('category', lit('UNKNOWN'))
# Pipeline continues; alert fires; data still lands
""")

# 29. Pipeline dependency graph
print("""Ex29 Dependency graph:
  ingest_orders ──┐
                  ├──► cleanse_silver ──► build_gold_revenue
  ingest_products─┘                  ──► build_clv
  ingest_customers───► dim_customer  ──► star_join
""")

# 30. Rollback strategy
print("""Ex30 Rollback with Delta time travel:
# If gold build fails or produces wrong data:
RESTORE TABLE gold.daily_revenue TO VERSION AS OF 5;
-- Or:
RESTORE TABLE delta.`/gold/revenue` TO TIMESTAMP AS OF '2024-01-14T06:00:00';
-- Atomic and instant — no data movement needed
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. Two-phase commit pattern
print("""Ex31 Two-phase commit:
Phase 1: Write to _staging table (temporary)
Phase 2: Validate staging (row count, nulls, ranges)
  IF valid:   MERGE staging → production table (atomic)
  IF invalid: drop staging, alert, do NOT touch production
""")

# 32. Compensation transactions
print("""Ex32 Compensating transactions:
Step 3 failed after Steps 1+2 succeeded:
  Compensate Step 2: DeltaTable.delete(where f"batch_id = '{run_id}'")
  Compensate Step 1: spark.sql(f"RESTORE TABLE bronze TO VERSION AS OF {v}")
Saga pattern: each step has a defined compensation
""")

# 33. Data contract enforcement
EXPECTED_COLS = {"order_id": "string", "customer_id": "string", "amount": "double"}

def validate_schema(df, expected: dict) -> None:
    actual = {f.name: f.dataType.simpleString() for f in df.schema.fields}
    missing  = set(expected) - set(actual)
    type_err = {c: (expected[c], actual.get(c)) for c in expected if actual.get(c) != expected[c] and c in actual}
    if missing or type_err:
        raise ValueError(f"Schema contract violated: missing={missing} type_errors={type_err}")
    print("Ex33 schema contract validated")

validate_schema(raw, EXPECTED_COLS)

# 34. Multi-step transaction with savepoints
print("""Ex34 Delta transaction log as savepoint:
v_before = spark.sql("SELECT max(version) FROM (DESCRIBE HISTORY delta.`/silver`)").collect()[0][0]
# Run complex multi-step transform
try:
    step1(); step2(); step3()
except Exception:
    spark.sql(f"RESTORE TABLE delta.`/silver` TO VERSION AS OF {v_before}")
    raise
""")

# 35. Partition statistics for query planning
print("""Ex35 Partition stats:
spark.sql("ANALYZE TABLE silver.orders COMPUTE STATISTICS FOR ALL COLUMNS")
→ Spark uses column-level stats for better join ordering, filter pushdown
Run after bulk loads; Delta auto-collects basic min/max stats at write time
""")

# 36. Broadcast variable for large lookups
product_lookup = {"prod_A": "Electronics", "prod_B": "Electronics",
                  "prod_C": "Electronics", "prod_D": "Furniture"}
bc_lookup = spark.sparkContext.broadcast(product_lookup)

@F.udf(StringType())
def lookup_category(product_id):
    return bc_lookup.value.get(product_id, "Unknown")

df_with_cat = raw.withColumn("category", lookup_category(F.col("order_id")))
print(f"Ex36 broadcast lookup done: {df_with_cat.count()}")

# 37. Stage-level metrics collection
class PipelineMetrics:
    def __init__(self, run_id: str):
        self.run_id = run_id
        self.stages = {}

    def record(self, stage: str, rows_in: int, rows_out: int,
               duration_sec: float, status: str = "SUCCESS"):
        self.stages[stage] = {
            "rows_in": rows_in, "rows_out": rows_out,
            "duration_sec": duration_sec, "status": status
        }

    def summary(self) -> dict:
        overall = "SUCCESS" if all(v["status"] == "SUCCESS" for v in self.stages.values()) else "PARTIAL"
        return {"run_id": self.run_id, "stages": self.stages, "overall": overall}

pm = PipelineMetrics("run-005")
pm.record("ingest",   5000, 5000,  2.1)
pm.record("cleanse",  5000, 4892, 3.4)
pm.record("gold_agg", 4892,  365,  1.1)
print(f"Ex37 summary: {pm.summary()}")

# 38. Parameterized pipeline
class PipelineParams:
    def __init__(self, run_date: str, env: str = "prod",
                 batch_size: int = 10000, dry_run: bool = False):
        self.run_date   = run_date
        self.env        = env
        self.batch_size = batch_size
        self.dry_run    = dry_run
        self.catalog    = {"dev":"dev","staging":"staging","prod":"prod"}[env]

    def source_table(self): return f"{self.catalog}.bronze.orders"
    def target_table(self): return f"{self.catalog}.silver.orders"

params = PipelineParams("2024-01-15", env="prod")
print(f"Ex38 params: source={params.source_table()}  target={params.target_table()}")

# 39. Pre/post condition checks
def pre_check(df, label: str) -> None:
    assert df is not None, f"{label}: DataFrame is None"
    assert len(df.columns) > 0, f"{label}: no columns"
    print(f"Ex39 pre_check '{label}' passed")

def post_check(df, min_rows: int, label: str) -> None:
    n = df.count()
    assert n >= min_rows, f"{label}: {n} rows < min {min_rows}"
    print(f"Ex39 post_check '{label}' passed: {n} rows")

pre_check(good, "silver")
post_check(good, 1, "silver")

# 40. Monitoring hook — emit job metric
def emit_job_metric(metric: str, value: float, **tags):
    tag_str = " ".join(f"{k}={v}" for k, v in tags.items())
    print(f"JOB_METRIC {metric}={value} {tag_str}")

emit_job_metric("etl.rows_processed", 4892, job="orders_etl", env="prod", date="2024-01-15")
emit_job_metric("etl.quarantine_pct",  2.16, job="orders_etl", env="prod")

# 41. Handling schema drift at source
print("""Ex41 Schema drift at source (Auto Loader):
cloudFiles schema evolution:
  .option('cloudFiles.schemaEvolutionMode','addNewColumns')
  → New columns added to Bronze automatically
  → Schema is saved to schemaLocation
  → Silver pipeline gets explicit column select → no surprise columns in Silver
""")

# 42. Idempotency test pattern
def test_idempotency(run_fn, output_path: str) -> bool:
    """Verify pipeline produces same result on second run."""
    run_fn()
    count_1 = spark.read.format("delta").load(output_path).count()
    run_fn()
    count_2 = spark.read.format("delta").load(output_path).count()
    ok = count_1 == count_2
    print(f"Ex42 idempotency: run1={count_1}  run2={count_2}  ok={ok}")
    return ok

def write_silver():
    good.write.format("delta").mode("overwrite").save(f"{BASE}/idem_test")

test_idempotency(write_silver, f"{BASE}/idem_test")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Exactly-once ETL via run_id guard
print("""Ex43 Exactly-once guard:
# Before running, check if this run_id already completed successfully:
already_ran = spark.read.format('delta').load('/audit').filter(
    (col('run_id')==run_id) & (col('stage')=='silver_cleanse') & (col('status')=='SUCCESS')
).count() > 0
if already_ran:
    print(f'Run {run_id} already completed — skipping (idempotency guard)')
    sys.exit(0)
""")

# 44. Change data capture (CDC) pipeline
print("""Ex44 CDC pipeline:
Source:  database CDC stream (Debezium → Kafka → Bronze Delta with _op column: I/U/D)
Silver:  apply_changes via DLT or manual MERGE:
  - op='I' or op='U' → upsert into silver
  - op='D' → soft-delete: set is_deleted=True, deleted_at=now()
Gold:    filter is_deleted=False for current view
""")

# 45. Multi-source fan-in
print("""Ex45 Multi-source ETL:
sources = ['/landing/orders_region_a/', '/landing/orders_region_b/', '/landing/orders_region_c/']
dfs = [spark.read.format('json').load(s).withColumn('source', lit(s.split('/')[-2])) for s in sources]
from functools import reduce
combined = reduce(lambda a, b: a.union(b), dfs)
combined.write.format('delta').mode('append').save('/bronze/orders_global')
""")

# 46. Pipeline versioning
print("""Ex46 Pipeline versioning:
Every ETL job embeds:
  PIPELINE_VERSION = "2.3.0"
  SCHEMA_VERSION   = "3"
Logged to audit table → trace behavior of any historical run
Schema version bumped when breaking changes made; backward compat tested before deploy
""")

# 47. Blue-green pipeline deployment
print("""Ex47 Blue-green ETL:
Green = current production pipeline writing to /silver/orders
Blue  = new pipeline version writing to /silver/orders_v2

After validation (blue output ≈ green output):
  1. Cut dashboards/downstream to read /silver/orders_v2
  2. Rename: /silver/orders → /silver/orders_old, /silver/orders_v2 → /silver/orders
  3. Decommission green pipeline
""")

# 48. Cost attribution per pipeline
print("""Ex48 Cost attribution:
- Tag each cluster with: team=de, pipeline=orders_etl, env=prod
- Azure cost management / AWS Cost Explorer → filter by tag
- Per-table: track Delta file sizes in DESCRIBE DETAIL → alert on unexpected growth
- DBU tracking: Databricks billing API → per-job DBU consumption
""")

# 49. Production ETL runbook
print("""Ex49 ETL runbook:
COMMON FAILURES & REMEDIATION:
  Schema mismatch:  check source change → update transform → test → deploy
  High quarantine:  check DQ report → identify bad source → alert upstream
  SLA breach:       check cluster size, AQE settings, data volume change
  Failed MERGE:     check Delta lock contention → reschedule, or increase parallelism
  Out of disk:      VACUUM old Delta versions → check data growth → scale storage
  Stale watermark:  check Bronze table for new data → force re-run with reset watermark
""")

# 50. Production ETL checklist
print("""Ex50 Production ETL checklist:
✓ Idempotent: MERGE or replaceWhere — safe to re-run on failure
✓ Schema validated at pipeline entry (contract enforcement)
✓ Dead-letter queue (quarantine) for bad records with reason column
✓ Row count assertions before and after every stage
✓ Structured JSON logging (run_id, stage, rows, duration, status)
✓ Audit Delta table (permanent record of every run)
✓ Watermark table for incremental processing state
✓ Retry logic (3x with backoff) for transient external calls
✓ Rollback procedure (Delta RESTORE) documented and tested
✓ Idempotency test in CI/CD pipeline
✓ Blue-green or canary deployment for breaking changes
✓ Cost attribution tags on every cluster
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
