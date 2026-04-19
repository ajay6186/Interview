# ============================================================================
# Exercise 6.5 — Observability
# ============================================================================
# Build pipeline observability tools: structured logging, metrics emission,
# SLA checks, anomaly detection, DQ scoring, and a full run context manager.
#
# Instructions: Replace every None / "TODO" so assertions pass.
# Run with: python exercise.py  (requires PySpark installed)
# ============================================================================

import json, time, uuid
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder \
    .appName("observability-exercise") \
    .getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ---------------------------------------------------------------------------
# 1. Structured logging
# ---------------------------------------------------------------------------

# TODO: Implement `structured_log(level, msg, **context)` that:
#         - Builds: {"level":level, "message":msg, "ts":<ISO utcnow>, **context}
#         - Prints the dict as a single-line JSON string
#         - Returns the dict

def structured_log(level: str, msg: str, **context) -> dict:
    pass  # replace

entry = structured_log("INFO", "Pipeline started",
                       pipeline="orders_etl", run_id="run-001", env="prod")

assert entry is not None,                     "Must return a dict"
assert entry["level"]      == "INFO"
assert entry["message"]    == "Pipeline started"
assert entry["pipeline"]   == "orders_etl"
assert entry["run_id"]     == "run-001"
assert "ts" in entry,                         "Must have 'ts' key"
assert isinstance(entry["ts"], str)

# ---------------------------------------------------------------------------
# 2. Metrics emission
# ---------------------------------------------------------------------------

emitted_metrics = []   # capture for testing

# TODO: Implement `emit_metric(name, value, **tags)` that:
#         - Appends {"name": name, "value": value, "tags": tags,
#                    "ts": <ISO utcnow>} to `emitted_metrics`
#         - Prints a line: "METRIC name=value tag1=v1 tag2=v2"
#         - Returns the dict

def emit_metric(name: str, value: float, **tags) -> dict:
    pass  # replace

m = emit_metric("etl.rows_ingested", 5000, pipeline="orders_etl", env="prod")

assert m is not None,                      "Must return a dict"
assert m["name"]  == "etl.rows_ingested"
assert m["value"] == 5000
assert m["tags"]["pipeline"] == "orders_etl"
assert any(x["name"] == "etl.rows_ingested" for x in emitted_metrics), \
    "emit_metric must append to emitted_metrics list"

# ---------------------------------------------------------------------------
# 3. SLA freshness check
# ---------------------------------------------------------------------------

# TODO: Implement `check_freshness(last_updated: datetime,
#                                   max_age_sec: int, label: str)` that:
#         - Computes age = (utcnow - last_updated).total_seconds()
#         - Returns True if age <= max_age_sec
#         - Returns False if age > max_age_sec
#         - Does NOT raise an exception — caller decides what to do

def check_freshness(last_updated: datetime, max_age_sec: int, label: str = "") -> bool:
    pass  # replace

fresh = check_freshness(datetime.utcnow(), max_age_sec=300, label="silver_orders")
assert fresh is True,  f"Recent timestamp should be fresh, got {fresh}"

stale = check_freshness(datetime(2020, 1, 1), max_age_sec=300, label="old_table")
assert stale is False, f"2020 timestamp should be stale, got {stale}"

# ---------------------------------------------------------------------------
# 4. Null rate report
# ---------------------------------------------------------------------------

raw_df = spark.createDataFrame([
    ("o1", "c1", 999.99),
    ("o2",  None, 349.00),
    ("o3", "c3", None),
    ("o4",  None, None),
], ["order_id", "customer_id", "amount"])

# TODO: Implement `null_rate_report(df, cols: list) -> dict` that:
#         - For each column in cols, computes null % (0-100, rounded to 2dp)
#         - Returns {"col_name": null_pct, ...}
#         - Returns {col: None, ...} if df is empty

def null_rate_report(df, cols: list) -> dict:
    pass  # replace

report = null_rate_report(raw_df, ["order_id", "customer_id", "amount"])

assert report is not None,                      "Must return a dict"
assert report["order_id"]     == 0.0,          f"order_id null rate should be 0, got {report['order_id']}"
assert report["customer_id"]  == 50.0,         f"customer_id null rate should be 50%, got {report['customer_id']}"
assert report["amount"]       == 50.0,         f"amount null rate should be 50%, got {report['amount']}"

# Empty DataFrame case
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
empty_schema = StructType([
    StructField("order_id",    StringType(), True),
    StructField("customer_id", StringType(), True),
])
empty_df = spark.createDataFrame([], empty_schema)
empty_report = null_rate_report(empty_df, ["order_id","customer_id"])
assert empty_report["order_id"] is None, "Empty df should return None for null rates"

# ---------------------------------------------------------------------------
# 5. DQ score calculator
# ---------------------------------------------------------------------------

# TODO: Implement `dq_score(checks_passed: list[bool], weights: list[float]) -> float`
#         - Computes weighted score: sum(w_i for passing checks) / sum(all w_i) * 100
#         - Returns float 0.0 to 100.0, rounded to 1 dp
#         - If weights is empty, return 100.0

def dq_score(checks_passed: list, weights: list) -> float:
    pass  # replace

# All pass: score = 100
s1 = dq_score([True, True, True], [3.0, 2.0, 2.0])
assert s1 == 100.0, f"All pass: expected 100.0, got {s1}"

# None pass: score = 0
s2 = dq_score([False, False], [1.0, 1.0])
assert s2 == 0.0,   f"None pass: expected 0.0, got {s2}"

# First passes (weight=3), second fails (weight=2): 3/(3+2)*100 = 60.0
s3 = dq_score([True, False], [3.0, 2.0])
assert s3 == 60.0,  f"Expected 60.0, got {s3}"

# Empty: 100.0
s4 = dq_score([], [])
assert s4 == 100.0, f"Empty checks: expected 100.0, got {s4}"

# ---------------------------------------------------------------------------
# 6. Z-score anomaly detection
# ---------------------------------------------------------------------------

# TODO: Implement `is_anomaly(history: list[float], new_val: float,
#                              threshold: float = 2.0) -> bool`
#         - Computes mean and std of history
#         - Returns True if |new_val - mean| / std > threshold
#         - Returns False if len(history) < 3 or std == 0

def is_anomaly(history: list, new_val: float, threshold: float = 2.0) -> bool:
    pass  # replace

baseline = [5000.0, 5100.0, 4950.0, 5200.0, 4900.0, 5050.0]

normal   = is_anomaly(baseline, new_val=5000.0)
assert normal is False, f"5000 is within baseline, should not be anomaly, got {normal}"

anomaly  = is_anomaly(baseline, new_val=500.0)   # 10× drop
assert anomaly is True, f"500 should be a clear anomaly, got {anomaly}"

# Short history: return False
short    = is_anomaly([5000.0, 5000.0], new_val=1.0)
assert short is False, f"Short history should return False, got {short}"

# Zero std: return False
flat     = is_anomaly([5000.0]*5, new_val=9999.0)
assert flat is False,  f"Zero std should return False, got {flat}"

# ---------------------------------------------------------------------------
# 7. Pipeline run context manager
# ---------------------------------------------------------------------------

# TODO: Implement `PipelineRun` as a context manager that:
#         - __enter__: calls structured_log("INFO","Run started", pipeline, run_id)
#                      returns self
#         - record_stage(stage, rows_in, rows_out): calls structured_log + emit_metric
#                      stores stage in self.stages dict
#         - __exit__: on success: logs "Run finished" at INFO with status="SUCCESS"
#                     on exception: logs "Run finished" at ERROR with status="FAILED"
#                     does NOT suppress exceptions (return False)
#         - self.stages: dict mapping stage_name → {"rows_in":..., "rows_out":...}

class PipelineRun:
    def __init__(self, pipeline: str, run_id: str):
        self.pipeline = pipeline
        self.run_id   = run_id
        self.stages   = {}
        self._start   = None

    def __enter__(self):
        pass  # TODO

    def record_stage(self, stage: str, rows_in: int, rows_out: int):
        pass  # TODO

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass  # TODO — return False

run_id = f"run-{uuid.uuid4().hex[:8]}"

with PipelineRun("orders_etl", run_id) as run:
    run.record_stage("ingest",   5000, 5000)
    run.record_stage("cleanse",  5000, 4892)
    run.record_stage("gold_agg", 4892,  365)

assert run is not None,                          "PipelineRun must be usable as context manager"
assert "ingest"   in run.stages,                 "stages must record 'ingest'"
assert "cleanse"  in run.stages,                 "stages must record 'cleanse'"
assert "gold_agg" in run.stages,                 "stages must record 'gold_agg'"
assert run.stages["ingest"]["rows_in"]    == 5000
assert run.stages["cleanse"]["rows_out"]  == 4892
assert run.stages["gold_agg"]["rows_out"] == 365

# Verify failure path (exception is NOT suppressed)
try:
    with PipelineRun("orders_etl", "run-fail") as failing_run:
        failing_run.record_stage("ingest", 5000, 5000)
        raise ValueError("Simulated stage failure")
except ValueError as e:
    assert "Simulated stage failure" in str(e), \
        "Exception should propagate out of context manager"
    assert "ingest" in failing_run.stages, \
        "Stages recorded before failure should still be present"

# ---------------------------------------------------------------------------
# 8. Pipeline summary report
# ---------------------------------------------------------------------------

# TODO: Implement `pipeline_summary(run_id, stages, status, duration_sec) -> dict`
#         - stages: dict mapping stage_name → {"rows_in":int, "rows_out":int}
#         - Returns dict with keys:
#           run_id, status, duration_sec, stages,
#           total_rows_in  (sum of all rows_in),
#           total_rows_out (sum of all rows_out),
#           drop_rate_pct  (round((1 - total_out/total_in)*100, 1) or 0.0 if no input)

def pipeline_summary(run_id: str, stages: dict, status: str, duration_sec: float) -> dict:
    pass  # replace

summary = pipeline_summary(
    run_id="run-001",
    stages={
        "ingest":   {"rows_in": 5000, "rows_out": 5000},
        "cleanse":  {"rows_in": 5000, "rows_out": 4892},
        "gold_agg": {"rows_in": 4892, "rows_out":  365},
    },
    status="SUCCESS",
    duration_sec=12.3,
)

assert summary is not None,                           "Must return a dict"
assert summary["run_id"]          == "run-001"
assert summary["status"]          == "SUCCESS"
assert summary["duration_sec"]    == 12.3
assert summary["total_rows_in"]   == 14892,          f"Expected 14892, got {summary['total_rows_in']}"
assert summary["total_rows_out"]  == 10257,          f"Expected 10257, got {summary['total_rows_out']}"
assert 0 < summary["drop_rate_pct"] < 100,           f"drop_rate_pct out of range: {summary['drop_rate_pct']}"

# Zero input edge case
empty_summary = pipeline_summary("x", {}, "SUCCESS", 0.0)
assert empty_summary["drop_rate_pct"] == 0.0,        "No input → drop_rate_pct = 0.0"

print("\nAll assertions passed!")
spark.stop()
