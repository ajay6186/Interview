# ============================================================================
# Exercise 4.4 — Orchestration Patterns
# ============================================================================
# Build and reason about Databricks Workflows, DLT expectations, watermarks,
# task parameters, and idempotent pipeline design.
#
# Instructions: Replace every None / "TODO" so all assertions pass.
# Run with: python exercise.py
# ============================================================================

import os, json, sys
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("orchestration-exercise").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/orch_ex"
os.makedirs(BASE, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. Widget-style parameter with default
# ---------------------------------------------------------------------------
# Simulate reading a notebook widget with a fallback default.
# TODO: Assign run_date from sys.argv[1] if provided, else "2024-01-15"
run_date = None  # replace

assert run_date == "2024-01-15" or (len(sys.argv) > 1 and run_date == sys.argv[1])
print(f"[1] run_date={run_date}")

# ---------------------------------------------------------------------------
# 2. Watermark — read and write
# ---------------------------------------------------------------------------
# TODO: implement get_watermark(key) → reads /tmp/orch_ex/{key}.wm if exists else "1970-01-01"
# TODO: implement set_watermark(key, value) → writes value to /tmp/orch_ex/{key}.wm

def get_watermark(key: str) -> str:
    pass  # TODO

def set_watermark(key: str, value: str) -> None:
    pass  # TODO

# Initial read should return default
wm_before = get_watermark("orders")
assert wm_before == "1970-01-01", f"Expected '1970-01-01', got {wm_before!r}"

set_watermark("orders", "2024-01-10")
wm_after = get_watermark("orders")
assert wm_after == "2024-01-10", f"Expected '2024-01-10', got {wm_after!r}"
print(f"[2] watermark: before={wm_before}  after={wm_after}")

# ---------------------------------------------------------------------------
# 3. Incremental filter using watermark
# ---------------------------------------------------------------------------
events = spark.createDataFrame([
    ("e001", "2024-01-08"),
    ("e002", "2024-01-10"),
    ("e003", "2024-01-12"),
    ("e004", "2024-01-15"),
], ["event_id", "event_date"])

# TODO: filter events where event_date > wm_after (i.e., strictly after "2024-01-10")
df_new = None  # replace

assert df_new is not None
assert df_new.count() == 2, f"Expected 2 new events, got {df_new.count()}"
print(f"[3] new events after watermark: {df_new.count()}")

# ---------------------------------------------------------------------------
# 4. SLA assertion
# ---------------------------------------------------------------------------
# TODO: implement assert_sla(actual_rows, min_rows, label="rows")
#       raises RuntimeError if actual_rows < min_rows
#       returns True otherwise

def assert_sla(actual_rows: int, min_rows: int, label: str = "rows") -> bool:
    pass  # TODO

result = assert_sla(5000, 100, "orders")
assert result is True, "assert_sla should return True when SLA is met"

try:
    assert_sla(10, 100, "orders")
    assert False, "Should have raised RuntimeError on SLA breach"
except RuntimeError as e:
    print(f"[4] SLA breach correctly raised: {e}")

# ---------------------------------------------------------------------------
# 5. Config merging (base → env → override)
# ---------------------------------------------------------------------------
# TODO: implement merge_configs(*dicts) that merges dicts left to right
#       later dicts override earlier ones

def merge_configs(*dicts: dict) -> dict:
    pass  # TODO

base     = {"batch_size": 500, "retries": 3, "log_level": "INFO"}
prod_ovr = {"batch_size": 2000, "log_level": "WARN"}
hotfix   = {"retries": 5}

final = merge_configs(base, prod_ovr, hotfix)
assert final["batch_size"] == 2000
assert final["retries"] == 5
assert final["log_level"] == "WARN"
print(f"[5] merged config: {final}")

# ---------------------------------------------------------------------------
# 6. Task values simulation (inter-task communication)
# ---------------------------------------------------------------------------
# Simulate producer/consumer task value passing via a dict store.
_task_store: dict = {}

# TODO: implement task_set(task_key, key, value) → stores in _task_store
# TODO: implement task_get(task_key, key, default=None) → retrieves from _task_store

def task_set(task_key: str, key: str, value) -> None:
    pass  # TODO

def task_get(task_key: str, key: str, default=None):
    pass  # TODO

task_set("ingest_task", "row_count", 42000)
task_set("ingest_task", "status", "SUCCESS")

rc = task_get("ingest_task", "row_count")
st = task_get("ingest_task", "status")
missing = task_get("ingest_task", "nonexistent", default=-1)

assert rc == 42000, f"Expected 42000, got {rc}"
assert st == "SUCCESS"
assert missing == -1
print(f"[6] task_get row_count={rc} status={st} missing={missing}")

# ---------------------------------------------------------------------------
# 7. Job payload construction
# ---------------------------------------------------------------------------
# TODO: Build a minimal Databricks job payload dict with:
#   - name: "daily_etl"
#   - one task: task_key="ingest", python_file="s3://bucket/ingest.py"
#   - schedule: quartz_cron_expression="0 0 4 * * ?", timezone_id="UTC"
# Store in variable: job_payload

job_payload = None  # replace

assert job_payload is not None
assert job_payload.get("name") == "daily_etl"
assert len(job_payload.get("tasks", [])) == 1
assert job_payload["tasks"][0]["task_key"] == "ingest"
assert "schedule" in job_payload
print(f"[7] job_payload name={job_payload['name']} tasks={len(job_payload['tasks'])}")

# ---------------------------------------------------------------------------
# 8. Circuit breaker
# ---------------------------------------------------------------------------
# TODO: implement CircuitBreaker class with:
#   - __init__(self, max_failures=3)
#   - call(self, func, *args, **kwargs) → executes func; raises RuntimeError if failures >= max_failures
#   - on success: reset failures to 0; on exception: increment failures and re-raise

class CircuitBreaker:
    pass  # TODO

cb = CircuitBreaker(max_failures=2)

# Should succeed
cb.call(lambda: "ok")
assert cb.failures == 0

# Trigger failures
def fail(): raise ValueError("downstream error")

try: cb.call(fail)
except ValueError: pass
try: cb.call(fail)
except ValueError: pass

# Circuit should now be open
try:
    cb.call(fail)
    assert False, "Should have raised RuntimeError (circuit open)"
except RuntimeError as e:
    print(f"[8] circuit open: {e}")

print("All assertions passed!")
spark.stop()
