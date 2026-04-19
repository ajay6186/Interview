# ============================================================================
# Solution 6.5 — Observability
# ============================================================================

import json, time, uuid
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType

spark = SparkSession.builder \
    .appName("observability-solution") \
    .getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ---------------------------------------------------------------------------
# 1. Structured logging
# ---------------------------------------------------------------------------

def structured_log(level: str, msg: str, **context) -> dict:
    entry = {"level": level, "message": msg,
             "ts": datetime.utcnow().isoformat(), **context}
    print(json.dumps(entry))
    return entry

entry = structured_log("INFO", "Pipeline started",
                       pipeline="orders_etl", run_id="run-001", env="prod")
assert entry["level"]    == "INFO"
assert entry["message"]  == "Pipeline started"
assert entry["pipeline"] == "orders_etl"
assert "ts" in entry

# ---------------------------------------------------------------------------
# 2. Metrics emission
# ---------------------------------------------------------------------------

emitted_metrics = []

def emit_metric(name: str, value: float, **tags) -> dict:
    m = {"name": name, "value": value, "tags": tags, "ts": datetime.utcnow().isoformat()}
    emitted_metrics.append(m)
    tag_str = " ".join(f"{k}={v}" for k, v in tags.items())
    print(f"METRIC {name}={value} {tag_str}")
    return m

m = emit_metric("etl.rows_ingested", 5000, pipeline="orders_etl", env="prod")
assert m["name"]  == "etl.rows_ingested"
assert m["value"] == 5000
assert any(x["name"] == "etl.rows_ingested" for x in emitted_metrics)

# ---------------------------------------------------------------------------
# 3. SLA freshness check
# ---------------------------------------------------------------------------

def check_freshness(last_updated: datetime, max_age_sec: int, label: str = "") -> bool:
    age = (datetime.utcnow() - last_updated).total_seconds()
    ok  = age <= max_age_sec
    print(f"Freshness '{label}': age={age:.0f}s max={max_age_sec}s → {'OK' if ok else 'STALE'}")
    return ok

assert check_freshness(datetime.utcnow(), max_age_sec=300) is True
assert check_freshness(datetime(2020,1,1), max_age_sec=300) is False

# ---------------------------------------------------------------------------
# 4. Null rate report
# ---------------------------------------------------------------------------

raw_df = spark.createDataFrame([
    ("o1", "c1", 999.99),
    ("o2",  None, 349.00),
    ("o3", "c3", None),
    ("o4",  None, None),
], ["order_id", "customer_id", "amount"])

def null_rate_report(df, cols: list) -> dict:
    n = df.count()
    if n == 0:
        return {c: None for c in cols}
    return {c: round(df.filter(F.col(c).isNull()).count() / n * 100, 2) for c in cols}

report = null_rate_report(raw_df, ["order_id","customer_id","amount"])
assert report["order_id"]    == 0.0
assert report["customer_id"] == 50.0
assert report["amount"]      == 50.0

empty_schema = StructType([
    StructField("order_id",    StringType(), True),
    StructField("customer_id", StringType(), True),
])
empty_df = spark.createDataFrame([], empty_schema)
empty_report = null_rate_report(empty_df, ["order_id","customer_id"])
assert empty_report["order_id"] is None

# ---------------------------------------------------------------------------
# 5. DQ score calculator
# ---------------------------------------------------------------------------

def dq_score(checks_passed: list, weights: list) -> float:
    if not weights:
        return 100.0
    total_w = sum(weights)
    if total_w == 0:
        return 100.0
    pass_w = sum(w for ok, w in zip(checks_passed, weights) if ok)
    return round(pass_w / total_w * 100, 1)

assert dq_score([True, True, True], [3.0, 2.0, 2.0]) == 100.0
assert dq_score([False, False],     [1.0, 1.0])       == 0.0
assert dq_score([True, False],      [3.0, 2.0])       == 60.0
assert dq_score([], [])                                == 100.0

# ---------------------------------------------------------------------------
# 6. Z-score anomaly detection
# ---------------------------------------------------------------------------

def is_anomaly(history: list, new_val: float, threshold: float = 2.0) -> bool:
    if len(history) < 3:
        return False
    mean = sum(history) / len(history)
    std  = (sum((v - mean) ** 2 for v in history) / len(history)) ** 0.5
    if std == 0:
        return False
    z = abs(new_val - mean) / std
    print(f"z-score={z:.2f} (threshold={threshold}): {'ANOMALY' if z > threshold else 'normal'}")
    return z > threshold

baseline = [5000.0, 5100.0, 4950.0, 5200.0, 4900.0, 5050.0]
assert is_anomaly(baseline, 5000.0) is False
assert is_anomaly(baseline, 500.0)  is True
assert is_anomaly([5000.0, 5000.0], 1.0)  is False
assert is_anomaly([5000.0]*5,       9999.0) is False

# ---------------------------------------------------------------------------
# 7. Pipeline run context manager
# ---------------------------------------------------------------------------

class PipelineRun:
    def __init__(self, pipeline: str, run_id: str):
        self.pipeline = pipeline
        self.run_id   = run_id
        self.stages   = {}
        self._start   = None

    def __enter__(self):
        self._start = time.time()
        structured_log("INFO","Run started", pipeline=self.pipeline, run_id=self.run_id)
        return self

    def record_stage(self, stage: str, rows_in: int, rows_out: int):
        self.stages[stage] = {"rows_in": rows_in, "rows_out": rows_out}
        structured_log("INFO","Stage complete", pipeline=self.pipeline,
                       run_id=self.run_id, stage=stage, rows_in=rows_in, rows_out=rows_out)
        emit_metric("etl.rows_out", rows_out, pipeline=self.pipeline,
                    stage=stage, run_id=self.run_id)

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = round(time.time() - self._start, 2)
        status   = "FAILED" if exc_type else "SUCCESS"
        level    = "ERROR"  if exc_type else "INFO"
        structured_log(level, "Run finished", pipeline=self.pipeline,
                       run_id=self.run_id, status=status, duration_sec=duration)
        return False

run_id = f"run-{uuid.uuid4().hex[:8]}"
with PipelineRun("orders_etl", run_id) as run:
    run.record_stage("ingest",   5000, 5000)
    run.record_stage("cleanse",  5000, 4892)
    run.record_stage("gold_agg", 4892,  365)

assert "ingest" in run.stages
assert run.stages["ingest"]["rows_in"]    == 5000
assert run.stages["cleanse"]["rows_out"]  == 4892
assert run.stages["gold_agg"]["rows_out"] == 365

try:
    with PipelineRun("orders_etl","run-fail") as failing_run:
        failing_run.record_stage("ingest", 5000, 5000)
        raise ValueError("Simulated stage failure")
except ValueError as e:
    assert "Simulated stage failure" in str(e)
    assert "ingest" in failing_run.stages

# ---------------------------------------------------------------------------
# 8. Pipeline summary report
# ---------------------------------------------------------------------------

def pipeline_summary(run_id: str, stages: dict, status: str, duration_sec: float) -> dict:
    total_in  = sum(s["rows_in"]  for s in stages.values()) if stages else 0
    total_out = sum(s["rows_out"] for s in stages.values()) if stages else 0
    drop_rate = round((1 - total_out / total_in) * 100, 1) if total_in > 0 else 0.0
    return {
        "run_id":         run_id,
        "status":         status,
        "duration_sec":   duration_sec,
        "stages":         stages,
        "total_rows_in":  total_in,
        "total_rows_out": total_out,
        "drop_rate_pct":  drop_rate,
    }

summary = pipeline_summary(
    "run-001",
    {"ingest":   {"rows_in":5000,"rows_out":5000},
     "cleanse":  {"rows_in":5000,"rows_out":4892},
     "gold_agg": {"rows_in":4892,"rows_out": 365}},
    "SUCCESS", 12.3
)
assert summary["total_rows_in"]  == 14892
assert summary["total_rows_out"] == 10257
assert 0 < summary["drop_rate_pct"] < 100

empty_summary = pipeline_summary("x", {}, "SUCCESS", 0.0)
assert empty_summary["drop_rate_pct"] == 0.0

print("\nAll assertions passed!")
spark.stop()
