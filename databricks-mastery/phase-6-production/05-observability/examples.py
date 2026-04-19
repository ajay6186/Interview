# ============================================================================
# Examples 6.5 — Observability  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: structured logging, metrics, SLA monitoring, alerting,
#         Spark UI, Delta table health, pipeline dashboards
# ============================================================================

import os, json, time
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = (SparkSession.builder
    .appName("observability-examples")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/observability"
os.makedirs(BASE, exist_ok=True)

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. The three pillars of observability
print("""Ex01 Three pillars of observability:
  1. LOGS    — discrete events (what happened, when, who)
               Example: pipeline started, record quarantined, schema mismatch

  2. METRICS — numerical measurements over time (how many, how fast)
               Example: rows_processed/min, error_rate, job_duration_seconds

  3. TRACES  — request flow across services (which path did it take?)
               Example: Spark stage timing, task distribution, shuffle cost

  Good observability answers:
    "Is my pipeline running?"        → metrics (job success/failure rate)
    "Why did it fail?"               → logs (stack trace, stage failure)
    "Where is the bottleneck?"       → traces (Spark UI, stage durations)
""")

# 2. Structured logging
def log(level: str, msg: str, **ctx) -> dict:
    """Emit a structured JSON log entry."""
    entry = {
        "level":   level,
        "message": msg,
        "ts":      datetime.utcnow().isoformat(),
        **ctx
    }
    print(json.dumps(entry))
    return entry

e = log("INFO", "Pipeline started", pipeline="orders_etl", run_id="run-001", env="prod")
assert e["level"] == "INFO" and "ts" in e
print("Ex02 structured log emitted")

# 3. Log levels
print("""Ex03 Log levels:
  DEBUG  — detailed diagnostic info (only in dev/staging)
  INFO   — normal events (pipeline start, stage complete, row counts)
  WARN   — unexpected but recoverable (null values, retry triggered)
  ERROR  — failure that interrupted processing (schema mismatch, OOM)
  FATAL  — unrecoverable failure (data corruption, no fallback)

  In production: log at INFO+. Set DEBUG only for targeted troubleshooting.
  Spark: spark.sparkContext.setLogLevel("WARN") reduces Spark's own noise.
""")

# 4. Pipeline lifecycle logging
class PipelineLogger:
    def __init__(self, pipeline: str, run_id: str):
        self.pipeline = pipeline
        self.run_id   = run_id
        self._start   = None

    def start(self):
        self._start = time.time()
        log("INFO","Pipeline started", pipeline=self.pipeline, run_id=self.run_id)

    def stage(self, stage: str, rows_in: int, rows_out: int):
        log("INFO","Stage complete", pipeline=self.pipeline,
            run_id=self.run_id, stage=stage, rows_in=rows_in, rows_out=rows_out)

    def warn(self, msg: str, **ctx):
        log("WARN", msg, pipeline=self.pipeline, run_id=self.run_id, **ctx)

    def finish(self, status: str = "SUCCESS"):
        duration = round(time.time() - self._start, 2)
        log("INFO","Pipeline finished", pipeline=self.pipeline,
            run_id=self.run_id, status=status, duration_sec=duration)
        return duration

pl = PipelineLogger("orders_etl","run-001")
pl.start()
pl.stage("ingest",   5000, 5000)
pl.stage("cleanse",  5000, 4892)
pl.stage("gold_agg", 4892,  365)
dur = pl.finish("SUCCESS")
print(f"Ex04 pipeline logged, duration={dur}s")

# 5. Row count metrics
def emit_metric(name: str, value: float, **tags):
    """Emit a time-series metric (integrate with StatsD/Prometheus/DataDog)."""
    tag_str = ",".join(f"{k}={v}" for k,v in tags.items())
    print(f"METRIC {name}={value} {tag_str} ts={datetime.utcnow().isoformat()}")

raw_df = spark.createDataFrame([
    ("o1","c1",999.99), ("o2","c2",349.00), ("o3",None,149.99)
], ["order_id","customer_id","amount"])

emit_metric("etl.rows_ingested",   raw_df.count(),  pipeline="orders_etl", env="prod")
emit_metric("etl.rows_quarantined",
            raw_df.filter(F.col("customer_id").isNull()).count(),
            pipeline="orders_etl", env="prod")
print("Ex05 row count metrics emitted")

# 6. Duration metric
def timed(fn, label: str, **tags):
    t0 = time.time()
    result = fn()
    emit_metric(f"etl.stage_duration_sec", round(time.time()-t0, 3), stage=label, **tags)
    return result

result = timed(lambda: raw_df.count(), "count_action", pipeline="orders_etl")
print(f"Ex06 timed stage result={result}")

# 7. SLA assertion
def assert_freshness(last_updated_ts: datetime, max_age_seconds: int, label: str):
    age = (datetime.utcnow() - last_updated_ts).total_seconds()
    if age > max_age_seconds:
        raise ValueError(f"SLA breach: {label} is {age:.0f}s old (max {max_age_seconds}s)")
    print(f"Ex07 freshness OK: {label} age={age:.0f}s <= {max_age_seconds}s")

recent = datetime.utcnow()
assert_freshness(recent, max_age_seconds=300, label="silver_orders")

old_ts = datetime(2020,1,1)
try:
    assert_freshness(old_ts, max_age_seconds=300, label="stale_table")
except ValueError as e:
    print(f"Ex07 freshness SLA breach caught: {e}")

# 8. Null rate monitoring
def null_rate_report(df, cols: list) -> dict:
    n = df.count()
    if n == 0:
        return {c: None for c in cols}
    return {c: round(df.filter(F.col(c).isNull()).count() / n * 100, 2) for c in cols}

report = null_rate_report(raw_df, ["order_id","customer_id","amount"])
print(f"Ex08 null rates (%): {report}")

for col_name, rate in report.items():
    if rate is not None and rate > 10:
        print(f"  WARN: null rate for {col_name} = {rate}% > 10%")

# 9. Duplicate detection metric
dup_count = raw_df.groupBy("order_id").count().filter(F.col("count") > 1).count()
emit_metric("etl.duplicate_keys", dup_count, table="orders", pipeline="orders_etl")
print(f"Ex09 duplicate order_ids: {dup_count}")

# 10. Schema drift detection
def detect_schema_drift(current_df, expected_cols: list) -> list:
    """Return list of missing columns."""
    actual  = set(current_df.columns)
    missing = [c for c in expected_cols if c not in actual]
    extra   = [c for c in actual if c not in expected_cols]
    if missing:
        print(f"SCHEMA DRIFT: missing columns: {missing}")
    if extra:
        print(f"SCHEMA DRIFT: unexpected columns: {extra}")
    return missing

missing = detect_schema_drift(raw_df, ["order_id","customer_id","amount","status"])
print(f"Ex10 schema drift detected: missing={missing}")

# 11. Data completeness check
def completeness_check(df, required_cols: list, min_pct: float = 95.0) -> bool:
    n = df.count()
    if n == 0:
        return False
    ok = True
    for c in required_cols:
        pct = (1 - df.filter(F.col(c).isNull()).count() / n) * 100
        if pct < min_pct:
            print(f"  FAIL: {c} completeness={pct:.1f}% < {min_pct}%")
            ok = False
        else:
            print(f"  OK:   {c} completeness={pct:.1f}%")
    return ok

ok = completeness_check(raw_df, ["order_id","amount"], min_pct=90.0)
print(f"Ex11 completeness check result: {ok}")

# 12. Value range check
def range_check(df, col: str, min_val, max_val, label: str = "") -> int:
    out_of_range = df.filter((F.col(col) < min_val) | (F.col(col) > max_val)).count()
    if out_of_range > 0:
        print(f"WARN: {label or col} has {out_of_range} values outside [{min_val},{max_val}]")
    else:
        print(f"OK: {label or col} all values in [{min_val},{max_val}]")
    return out_of_range

violations = range_check(raw_df, "amount", 0, 100000, "order_amount")
print(f"Ex12 range violations: {violations}")

# 13. Delta table health
print("""Ex13 Delta table health checks:
  -- Check last modification time:
  DESCRIBE DETAIL delta.`/silver/orders`
  → shows lastModified, numFiles, sizeInBytes

  -- Check transaction history:
  DESCRIBE HISTORY delta.`/silver/orders` LIMIT 10

  -- Check file size distribution:
  SELECT stats_parsed.numRecords, stats_parsed.minValues, stats_parsed.maxValues
  FROM delta.`_delta_log/*.json`   (raw log — rarely needed)

  Key indicators:
    numFiles too large  → run VACUUM
    many tiny files     → run OPTIMIZE
    lastModified stale  → SLA breach
""")

# 14. Spark UI key metrics
print("""Ex14 Spark UI metrics:
  Jobs tab:       which stages are slow (red = skew/spill)
  Stages tab:     task distribution, max vs median task time
  Storage tab:    cached RDDs/DataFrames and memory usage
  SQL tab:        query plan, join strategy, rows scanned
  Executors tab:  GC time %, shuffle read/write, disk spill

  Red flags:
    Max task >> median task   → data skew
    GC time > 20%             → memory pressure
    Disk spill > 0            → OOM/insufficient memory
    'Exchange' nodes in plan  → shuffle (expected for groupBy/join)
""")

# 15. Run summary report
def pipeline_summary(run_id: str, stages: dict, status: str, duration_sec: float) -> dict:
    total_in  = sum(s["rows_in"]  for s in stages.values())
    total_out = sum(s["rows_out"] for s in stages.values())
    return {
        "run_id":       run_id,
        "status":       status,
        "duration_sec": duration_sec,
        "stages":       stages,
        "total_rows_in":  total_in,
        "total_rows_out": total_out,
        "drop_rate_pct":  round((1 - total_out / total_in) * 100, 1) if total_in else 0,
    }

summary = pipeline_summary(
    "run-001",
    stages={
        "ingest":   {"rows_in":5000,"rows_out":5000},
        "cleanse":  {"rows_in":5000,"rows_out":4892},
        "gold_agg": {"rows_in":4892,"rows_out":365},
    },
    status="SUCCESS",
    duration_sec=12.3
)
print(f"Ex15 pipeline summary: drop_rate={summary['drop_rate_pct']}%")
print(json.dumps(summary, indent=2))

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Delta DESCRIBE DETAIL
tmp_tbl = f"{BASE}/orders_delta"
raw_df.write.format("delta").mode("overwrite").save(tmp_tbl)

detail = spark.sql(f"DESCRIBE DETAIL delta.`{tmp_tbl}`")
detail.select("name","format","numFiles","sizeInBytes","lastModified").show(truncate=False)
print("Ex16 DESCRIBE DETAIL done")

# 17. Delta DESCRIBE HISTORY
history = spark.sql(f"DESCRIBE HISTORY delta.`{tmp_tbl}`")
history.select("version","timestamp","operation","operationMetrics").show(5, truncate=False)
print("Ex17 DESCRIBE HISTORY done")

# 18. Metrics accumulator
class PipelineMetrics:
    def __init__(self, run_id: str):
        self.run_id = run_id
        self._stages: dict = {}
        self._start = time.time()

    def record(self, stage: str, rows_in: int, rows_out: int, status: str = "SUCCESS"):
        self._stages[stage] = {
            "rows_in":  rows_in,
            "rows_out": rows_out,
            "status":   status,
            "ts":       datetime.utcnow().isoformat(),
        }

    @property
    def duration(self) -> float:
        return round(time.time() - self._start, 2)

    def summary(self) -> dict:
        overall = "SUCCESS" if all(v["status"]=="SUCCESS" for v in self._stages.values()) else "PARTIAL"
        return {"run_id": self.run_id, "stages": self._stages,
                "duration_sec": self.duration, "overall": overall}

pm = PipelineMetrics("run-002")
pm.record("ingest",   5000, 5000)
pm.record("cleanse",  5000, 4892)
pm.record("gold_agg", 4892,  365, "SUCCESS")
s = pm.summary()
print(f"Ex18 metrics summary: overall={s['overall']} duration={s['duration_sec']}s")

# 19. SLA monitoring table
print("""Ex19 SLA monitoring table design:
  Table: prod.ops.pipeline_sla
  Columns:
    pipeline_name STRING,
    sla_name      STRING,
    sla_value     DOUBLE,   -- e.g. max_duration_sec, min_rows, max_null_pct
    actual_value  DOUBLE,
    passed        BOOLEAN,
    run_id        STRING,
    checked_at    TIMESTAMP

  Example SLAs:
    orders_etl | max_duration_sec | 300  | 245 | true
    orders_etl | min_rows_silver  | 1000 | 4892| true
    orders_etl | max_null_pct_cid | 1.0  | 0.0 | true
""")

# 20. Alert function
def alert(level: str, msg: str, channel: str = "slack", **ctx):
    """Simulate alert emission (Slack/PagerDuty/Teams)."""
    entry = {"ALERT": level, "message": msg, "channel": channel,
             "ts": datetime.utcnow().isoformat(), **ctx}
    print(json.dumps(entry))

def check_and_alert(df, col: str, max_null_pct: float, label: str):
    n = df.count()
    if n == 0:
        return
    pct = df.filter(F.col(col).isNull()).count() / n * 100
    if pct > max_null_pct:
        alert("HIGH", f"Null rate breach: {label}.{col}={pct:.1f}% > {max_null_pct}%",
              pipeline="orders_etl", severity="HIGH")
    else:
        print(f"OK: {label}.{col} null_pct={pct:.1f}%")

check_and_alert(raw_df, "customer_id", max_null_pct=5.0, label="silver_orders")
print("Ex20 alert check done")

# 21. Heartbeat / liveness check
def heartbeat(pipeline: str, run_id: str):
    """Emit a heartbeat metric to detect stalled jobs."""
    emit_metric("etl.heartbeat", 1, pipeline=pipeline, run_id=run_id)

import threading
def start_heartbeat(pipeline: str, run_id: str, interval_sec: float = 30.0):
    """Start background heartbeat thread (stops when main thread ends)."""
    def _beat():
        while True:
            heartbeat(pipeline, run_id)
            time.sleep(interval_sec)
    t = threading.Thread(target=_beat, daemon=True)
    t.start()
    return t

hb = start_heartbeat("orders_etl","run-003", interval_sec=60)
print("Ex21 heartbeat thread started (daemon=True, stops with main)")

# 22. Dead-man switch
print("""Ex22 Dead-man switch:
  A scheduled job that should run every X minutes.
  If it doesn't run → the monitoring system alerts.

  Implementation:
    - Job writes a timestamp to: prod.ops.heartbeat (pipeline, last_success_ts)
    - External monitor (SQL alert or cron): check if last_success_ts > 2 hours ago
      SELECT pipeline
      FROM prod.ops.heartbeat
      WHERE TIMESTAMPDIFF(MINUTE, last_success_ts, NOW()) > 120
      → if rows returned → fire PagerDuty alert

  Databricks: Workflow + SQL Alert on heartbeat table.
""")

# 23. Quarantine monitoring
def quarantine_report(quarantine_path: str) -> dict:
    """Report quarantine metrics by error reason."""
    try:
        df = spark.read.format("delta").load(quarantine_path)
        report = {r["_error_reason"]: r["count"]
                  for r in df.groupBy("_error_reason").count().collect()}
        total  = sum(report.values())
        return {"total": total, "by_reason": report}
    except Exception:
        return {"total": 0, "by_reason": {}}

bad_df = raw_df.filter(F.col("customer_id").isNull()) \
    .withColumn("_error_reason", F.lit("null_customer"))
bad_df.write.format("delta").mode("overwrite").save(f"{BASE}/quarantine")

qr = quarantine_report(f"{BASE}/quarantine")
print(f"Ex23 quarantine: {qr}")

# 24. Data quality score
def dq_score(df, checks: dict) -> float:
    """
    checks = {"col": (check_fn, weight)}
    Returns weighted DQ score 0–100.
    """
    total_w, pass_w = 0.0, 0.0
    n = df.count()
    for label, (check_fn, weight) in checks.items():
        ok = check_fn(df, n)
        total_w += weight
        pass_w  += weight if ok else 0
        print(f"  DQ check '{label}': {'PASS' if ok else 'FAIL'} weight={weight}")
    score = round(pass_w / total_w * 100, 1) if total_w else 0
    print(f"Ex24 DQ score: {score}/100")
    return score

checks = {
    "no_null_order_id":     (lambda df,n: df.filter(F.col("order_id").isNull()).count()==0,   3),
    "positive_amount":      (lambda df,n: df.filter(F.col("amount") <= 0).count()==0,         2),
    "no_null_customer_id":  (lambda df,n: df.filter(F.col("customer_id").isNull()).count()==0, 2),
}
score = dq_score(raw_df, checks)
print(f"Ex24 final DQ score: {score}/100")

# 25. Row count trend alert
print("""Ex25 Row count trend:
  Store daily row counts in prod.ops.table_stats:
    (run_date, table_name, row_count)

  Alert when today's count drops > 20% vs 7-day average:
    SELECT table_name, today_count, avg_7d,
           (today_count - avg_7d) / avg_7d * 100 AS pct_change
    FROM (
      SELECT table_name,
             FIRST_VALUE(row_count) OVER (PARTITION BY table_name ORDER BY run_date DESC) today_count,
             AVG(row_count) OVER (PARTITION BY table_name ORDER BY run_date
                                  ROWS BETWEEN 7 PRECEDING AND 1 PRECEDING) avg_7d
      FROM prod.ops.table_stats
    )
    WHERE pct_change < -20;
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 26. Spark listener for task metrics
print("""Ex26 Spark Listener (custom metrics):
  Implement a SparkListener to capture task-level metrics:

  from pyspark import SparkContext
  from py4j.java_gateway import java_import
  java_import(sc._gateway.jvm, 'org.apache.spark.scheduler.*')

  class MetricsListener(sc._jvm.SparkListener):
    def onTaskEnd(self, event):
      metrics = event.taskMetrics()
      print(f"Task {event.taskInfo().taskId()} "
            f"records={metrics.outputMetrics().recordsWritten()} "
            f"shuffleWrite={metrics.shuffleWriteMetrics().bytesWritten()}")

  sc._jvm.SparkContext.getOrCreate().addSparkListener(MetricsListener())
""")

# 27. Ganglia / Prometheus integration
print("""Ex27 Metrics backends:
  Databricks + Prometheus:
    - Configure Prometheus endpoint in cluster init script
    - Scrape via Prometheus node exporter on driver
    - Dashboard in Grafana

  Databricks + DataDog:
    - Install DataDog agent via cluster init script
    - Emit custom metrics via DogStatsD:
      from datadog import statsd
      statsd.gauge('etl.rows_processed', count, tags=['pipeline:orders_etl'])

  Databricks native:
    - Cluster metrics visible in Ganglia (driver memory, GC, CPU)
    - Job metrics in Databricks UI → Jobs → Run → Task details
""")

# 28. Log aggregation and search
print("""Ex28 Log aggregation:
  Databricks logs → cluster log path (DBFS or S3):
    driver/  → stderr, stdout
    executor/→ per-executor logs

  Production pattern:
    1. Forward logs to: Splunk / ELK (Elasticsearch + Logstash + Kibana) / Azure Monitor
    2. Parse JSON structured logs → searchable fields
    3. Dashboards: pipeline error rate, run duration histogram, DQ score trends
    4. Retention: 30 days hot, 1 year cold

  JSON structured logs (from Ex02) are directly ingested by all log platforms.
""")

# 29. Databricks Jobs API for monitoring
print("""Ex29 Jobs API monitoring:
  GET /api/2.1/jobs/runs/list?job_id=123&limit=10
  → Returns last 10 runs with: run_id, state, start_time, end_time, result_state

  result_state values: SUCCESS, FAILED, TIMEDOUT, CANCELED

  Monitoring script:
    import requests
    r = requests.get(f'{DATABRICKS_HOST}/api/2.1/jobs/runs/get?run_id={run_id}',
                     headers={'Authorization': f'Bearer {TOKEN}'})
    state = r.json()['state']['result_state']
    if state == 'FAILED':
        alert('HIGH', f'Job {run_id} failed', ...)
""")

# 30. Pipeline observability dashboard (design)
print("""Ex30 Pipeline dashboard (Databricks SQL):
  Panel 1: Job success rate (% success over last 30 days)
    SELECT date(run_date), COUNT_IF(status='SUCCESS')/COUNT(*)*100 AS success_pct
    FROM prod.ops.pipeline_runs
    GROUP BY 1 ORDER BY 1;

  Panel 2: Average run duration trend
    SELECT date(run_date), AVG(duration_sec)
    FROM prod.ops.pipeline_runs GROUP BY 1 ORDER BY 1;

  Panel 3: Quarantine rate (bad records %)
    SELECT date(run_date),
           SUM(quarantined)/NULLIF(SUM(rows_in),0)*100 AS quarantine_pct
    FROM prod.ops.stage_metrics GROUP BY 1 ORDER BY 1;

  Panel 4: DQ score heatmap per table
  Panel 5: SLA breach count per pipeline
""")

# 31. Anomaly detection on metrics
def z_score_anomaly(values: list, new_val: float, threshold: float = 2.0) -> bool:
    if len(values) < 5:
        return False
    mean = sum(values) / len(values)
    std  = (sum((v-mean)**2 for v in values) / len(values)) ** 0.5
    if std == 0:
        return False
    z    = abs(new_val - mean) / std
    print(f"Ex31 z-score={z:.2f} (threshold={threshold}): {'ANOMALY' if z>threshold else 'normal'}")
    return z > threshold

history_counts = [5000, 5100, 4950, 5200, 4900, 5050]
is_anomaly = z_score_anomaly(history_counts, new_val=500)  # 10× drop
print(f"Ex31 anomaly detected: {is_anomaly}")

# 32. SLA tracking table writer
def write_sla_check(spark, pipeline: str, sla_name: str,
                    sla_value: float, actual_value: float, run_id: str, path: str):
    passed = actual_value >= sla_value
    row = spark.createDataFrame([(
        pipeline, sla_name, sla_value, actual_value, passed,
        run_id, datetime.utcnow().isoformat()
    )], ["pipeline_name","sla_name","sla_value","actual_value",
         "passed","run_id","checked_at"])
    row.write.format("delta").mode("append").save(path)
    status = "PASS" if passed else "FAIL"
    print(f"Ex32 SLA {sla_name}: {status} (expected>={sla_value}, got {actual_value})")
    return passed

sla_path = f"{BASE}/sla_checks"
write_sla_check(spark,"orders_etl","min_rows_silver",1000,4892,"run-001",sla_path)
write_sla_check(spark,"orders_etl","max_null_pct_cid",1.0, 2.5, "run-001",sla_path)  # fails
print(f"Ex32 SLA table: {spark.read.format('delta').load(sla_path).count()} records")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 33. Observability-driven pipeline design
print("""Ex33 Design for observability:
  Every pipeline stage should output:
    1. rows_in, rows_out, quarantined (count metrics)
    2. duration_sec (duration metric)
    3. status: SUCCESS / FAILED / PARTIAL
    4. run_id: unique ID for correlation across logs + metrics + alerts
    5. schema fingerprint (hash of column names+types) — detect drift

  Store per-run stage metrics in Delta audit table.
  Query to debug: WHERE run_id = 'failed-run-id' → see all stages + stats.
""")

# 34. Correlation IDs
import uuid

def new_run_id() -> str:
    return f"run-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"

run_id = new_run_id()
print(f"Ex34 run_id: {run_id}")

# Attach run_id to every log entry and metric
log("INFO", "Bronze ingest started", run_id=run_id, table="bronze.orders")
emit_metric("etl.rows_ingested", 5000, run_id=run_id, table="bronze.orders")
log("INFO", "Bronze ingest done",    run_id=run_id, rows_in=5000, rows_out=5000)

# 35. Canary metrics
print("""Ex35 Canary metrics:
  Run production pipeline + canary pipeline (new version) in parallel.
  Compare output metrics:
    - Row counts within X% of each other?
    - Revenue aggregates within 0.01% of each other?
    - Same quarantine rate?

  If canary output ≈ production → safe to cut over.
  If mismatch → investigate before deploying.

  Gate: canary vs prod comparison pass → enable new pipeline.
""")

# 36. Mean time to detect (MTTD) and repair (MTTR)
print("""Ex36 MTTD / MTTR:
  MTTD (Mean Time To Detect): time from failure to alert firing.
  Target: < 5 minutes for critical pipelines.

  How to reduce MTTD:
    - Heartbeat checks every 1 minute
    - Real-time SLA alerts on quarantine rate spike
    - Databricks Workflow alerting on job failure (webhook/email)

  MTTR (Mean Time To Repair): time from alert to fix deployed.
  Target: < 30 minutes for critical pipelines.

  How to reduce MTTR:
    - Runbook documented per failure mode
    - Delta time travel → fast rollback
    - Feature flags → disable problematic transformation without redeploy
""")

# 37. Feature flag for hot fixes
feature_flags = {
    "enable_enrichment_join": True,
    "use_new_gold_logic":     False,   # set False if new logic has a bug
    "quarantine_threshold_pct": 5.0,
}

def run_pipeline_with_flags(df, flags: dict):
    if flags.get("enable_enrichment_join", True):
        print("  Enrichment join: ON")
    else:
        print("  Enrichment join: SKIPPED (flag off)")

    threshold = flags.get("quarantine_threshold_pct", 5.0)
    qr = df.filter(F.col("customer_id").isNull()).count() / df.count() * 100
    if qr > threshold:
        alert("HIGH", f"Quarantine rate {qr:.1f}% > {threshold}%", pipeline="orders_etl")
    return df

run_pipeline_with_flags(raw_df, feature_flags)
print(f"Ex37 feature flags applied")

# 38. Incident response playbook
print("""Ex38 Incident playbook — pipeline failure:
  1. Check Databricks job run page → which task failed?
  2. View task logs (stderr) → Python traceback or Spark exception.
  3. Check Delta DESCRIBE HISTORY → any unexpected writes?
  4. Check audit log → schema drift? new source file format?
  5. Check row counts at failure stage vs previous successful run.

  Common failure modes:
    AnalysisException:  schema mismatch → check source change
    OutOfMemoryError:   data volume increase → scale cluster or fix skew
    MERGE conflict:     concurrent writers → check scheduling overlap
    Network timeout:    external API → check connectivity + retry config
    SLA breach:         data late → check upstream pipeline delays
""")

# 39. Observability for streaming pipelines
print("""Ex39 Streaming observability:
  Spark Structured Streaming metrics:
    - inputRowsPerSecond: source throughput
    - processedRowsPerSecond: pipeline throughput
    - latency: time from event to sink write
    - watermark: how far behind the stream is
    - batchDuration: how long each micro-batch takes

  Access: query.lastProgress (Python dict)
    batch_id    = query.lastProgress['batchId']
    input_rate  = query.lastProgress['inputRowsPerSecond']
    proc_rate   = query.lastProgress['processedRowsPerSecond']
    sources     = query.lastProgress['sources']

  Alert when: processedRowsPerSecond < expected → backlog building.
""")

# 40. Observability framework class
class ObservabilityContext:
    def __init__(self, pipeline: str, run_id: str):
        self.pipeline = pipeline
        self.run_id   = run_id
        self.stages   = {}
        self._start   = time.time()

    def __enter__(self):
        log("INFO","Run started", pipeline=self.pipeline, run_id=self.run_id)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        status   = "FAILED" if exc_type else "SUCCESS"
        duration = round(time.time() - self._start, 2)
        log(("ERROR" if exc_type else "INFO"), "Run finished",
            pipeline=self.pipeline, run_id=self.run_id,
            status=status, duration_sec=duration)
        if exc_type:
            alert("HIGH", f"Pipeline failed: {exc_val}",
                  pipeline=self.pipeline, run_id=self.run_id)
        return False  # do not suppress exception

    def record_stage(self, stage: str, rows_in: int, rows_out: int):
        self.stages[stage] = {"rows_in":rows_in,"rows_out":rows_out}
        log("INFO","Stage complete", pipeline=self.pipeline,
            run_id=self.run_id, stage=stage, rows_in=rows_in, rows_out=rows_out)
        emit_metric("etl.rows_out", rows_out, pipeline=self.pipeline,
                    stage=stage, run_id=self.run_id)

with ObservabilityContext("orders_etl","run-004") as obs:
    obs.record_stage("ingest",   5000, 5000)
    obs.record_stage("cleanse",  5000, 4892)
    obs.record_stage("gold_agg", 4892,  365)

print("Ex40 ObservabilityContext used successfully")

# 41. Golden signals for pipelines
print("""Ex41 Four Golden Signals (Google SRE):
  1. Latency     — how long does a pipeline run take?
                   Alert: duration > 2× 7-day p90
  2. Traffic     — how many records processed per run?
                   Alert: volume drop > 20% vs 7-day avg
  3. Errors      — what fraction of records are quarantined?
                   Alert: quarantine_pct > 5%
  4. Saturation  — is the cluster running out of memory/disk?
                   Alert: disk spill > 0, GC > 20%, OOM events

  Implement via: metrics to time-series DB → Grafana alerts → PagerDuty.
""")

# 42. Observability checklist
print("""Ex42 Observability implementation checklist:
  Logging:
    ✓ Structured JSON logs (level, message, ts, run_id, pipeline, stage)
    ✓ Log forwarded to centralised platform (Splunk/ELK/Azure Monitor)
    ✓ Retention policy in place (30 days hot, 1 year cold)

  Metrics:
    ✓ rows_ingested, rows_quarantined emitted per stage
    ✓ stage_duration_sec emitted per stage
    ✓ null_rate per key column emitted per run
    ✓ dq_score emitted per run

  Alerts:
    ✓ Job failure alert (Databricks Workflow webhook)
    ✓ SLA breach alert (SQL Alert on SLA table)
    ✓ Quarantine spike alert (> 5% bad records)
    ✓ Freshness alert (pipeline not run in > 2h)
    ✓ Volume anomaly alert (> 20% drop vs baseline)

  Dashboards:
    ✓ Pipeline success rate (30-day trend)
    ✓ Run duration histogram
    ✓ DQ score heatmap
    ✓ Cost per run trend
""")

# 43. SLA alerting with SQL Alerts (Databricks)
print("""Ex43 Databricks SQL Alerts:
  SQL Alert runs a query on a schedule:
    SELECT COUNT(*) AS breach_count
    FROM prod.ops.pipeline_sla
    WHERE passed = false
      AND checked_at > current_timestamp() - INTERVAL 1 HOUR;

  Alert trigger: breach_count > 0
  Notification: email, Slack webhook, PagerDuty

  Benefits:
    - No external monitoring infra needed
    - Lives inside Databricks (same governance)
    - Easy to add new SLA checks without code deploys
""")

# 44. Lineage-aware impact analysis
print("""Ex44 Lineage + Observability:
  When gold.daily_revenue fails:
    1. Query UC lineage: what are upstream dependencies?
       SELECT source_table FROM system.access.table_lineage
       WHERE target_table = 'prod.gold.daily_revenue'
    2. Check each upstream for SLA breach or recent failures
    3. Root cause: silver.orders hasn't been updated in 3 hours → source issue

  With lineage, MTTD drops from "check everything" to targeted checks.
""")

# 45. Chaos engineering for pipelines
print("""Ex45 Chaos engineering:
  Deliberately inject failures to verify observability + recovery:

  Test 1: Kill a Spark executor mid-job → verify task retries + alert fires
  Test 2: Introduce schema change at source → verify schema drift alert fires
  Test 3: Inject 20% null rate → verify DQ alert fires + quarantine fills
  Test 4: Stop upstream pipeline → verify freshness alert fires

  Run in staging environment on a schedule.
  Document results: "system correctly detected X within Y minutes".
  Improve MTTD where alerting was slow.
""")

# 46. Databricks Lakehouse Monitoring (MLflow Integration)
print("""Ex46 Lakehouse Monitoring:
  Databricks Lakehouse Monitoring (preview feature):
    - Automatically profiles Delta tables over time
    - Tracks schema drift, null rates, value distribution, freshness
    - Generates HTML reports per table

  CREATE MONITOR prod.silver.orders
  WITH (GRANULARITIES = ('1 hour', '1 day'),
        OUTPUT_SCHEMA_NAME = 'prod.monitoring');

  Generates tables: prod.monitoring.orders_profile_metrics
  Query to build dashboards or set alerts.
""")

# 47. Job-level SLA enforcement
print("""Ex47 Job-level timeout:
  Databricks Workflow timeout:
    job.settings.timeout_seconds = 1800  # 30-min hard limit

  If job exceeds timeout → status=TIMEDOUT → alert fires.

  Programmatic check:
    if duration_sec > 1800:
        alert("HIGH","Job SLA breach: duration={duration_sec}s > 1800s",
              pipeline=pipeline, run_id=run_id)
        sys.exit(1)   # fail loudly → triggers workflow retry/alert
""")

# 48. Multi-environment observability
print("""Ex48 Multi-environment monitoring:
  Tag all metrics and logs with env=dev|staging|prod.

  Grafana: env=prod filter → see only production metrics.
  Alerts:  only page on-call for env=prod failures.
           env=staging failures go to team Slack channel.
           env=dev failures silently logged.

  Shared dashboard: compare staging vs prod side-by-side → catch regressions
  before prod deployment.
""")

# 49. Observability for Delta MERGE
print("""Ex49 MERGE operation metrics:
  After every MERGE, inspect operationMetrics from Delta history:

  hist = spark.sql('DESCRIBE HISTORY delta.`/silver/orders` LIMIT 1')
  metrics = hist.select('operationMetrics').collect()[0][0]
  print(metrics)
  # {'numTargetRowsInserted': '3', 'numTargetRowsUpdated': '12',
  #  'numTargetRowsDeleted': '0', 'numSourceRows': '15'}

  Emit as metrics:
    emit_metric('delta.merge.inserted', int(metrics['numTargetRowsInserted']))
    emit_metric('delta.merge.updated',  int(metrics['numTargetRowsUpdated']))

  Alert: if numTargetRowsInserted is 0 when it should be > 0 → source data missing.
""")

# 50. Observability excellence checklist
print("""Ex50 Observability excellence:
  Foundations:
    ✓ Structured JSON logging with run_id on every entry
    ✓ Correlation IDs propagated through all stages
    ✓ Metrics emitted: rows, duration, error rate, DQ score
    ✓ Heartbeat / dead-man switch on all critical pipelines

  Alerting:
    ✓ Four Golden Signals: latency, traffic, errors, saturation
    ✓ MTTD target: < 5 min for P1 pipelines
    ✓ Runbook linked in every alert
    ✓ On-call rotation defined + escalation path

  Dashboards:
    ✓ Executive: pipeline health at a glance (green/yellow/red)
    ✓ Engineering: run duration, DQ score, quarantine rate trends
    ✓ Cost: DBU/run, storage growth, cost anomalies

  Continuous improvement:
    ✓ Monthly MTTD/MTTR review
    ✓ Chaos engineering quarterly tests
    ✓ Observability coverage tracked (% of pipelines fully instrumented)
    ✓ Runbooks updated after every incident
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
