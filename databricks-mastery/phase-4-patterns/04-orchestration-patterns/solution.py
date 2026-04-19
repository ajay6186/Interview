# ============================================================================
# Solution 4.4 — Orchestration Patterns
# ============================================================================

import os, json, sys
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("orchestration-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/orch_ex"
os.makedirs(BASE, exist_ok=True)

# 1. Widget-style parameter with default
run_date = sys.argv[1] if len(sys.argv) > 1 else "2024-01-15"
assert run_date == "2024-01-15" or (len(sys.argv) > 1 and run_date == sys.argv[1])
print(f"[1] run_date={run_date}")

# 2. Watermark — read and write
def get_watermark(key: str) -> str:
    p = f"{BASE}/{key}.wm"
    return open(p).read().strip() if os.path.exists(p) else "1970-01-01"

def set_watermark(key: str, value: str) -> None:
    with open(f"{BASE}/{key}.wm", "w") as f:
        f.write(value)

wm_before = get_watermark("orders")
assert wm_before == "1970-01-01"
set_watermark("orders", "2024-01-10")
wm_after = get_watermark("orders")
assert wm_after == "2024-01-10"
print(f"[2] watermark: before={wm_before}  after={wm_after}")

# 3. Incremental filter using watermark
events = spark.createDataFrame([
    ("e001", "2024-01-08"),
    ("e002", "2024-01-10"),
    ("e003", "2024-01-12"),
    ("e004", "2024-01-15"),
], ["event_id", "event_date"])

df_new = events.filter(F.col("event_date") > wm_after)
assert df_new.count() == 2
print(f"[3] new events: {df_new.count()}")

# 4. SLA assertion
def assert_sla(actual_rows: int, min_rows: int, label: str = "rows") -> bool:
    if actual_rows < min_rows:
        raise RuntimeError(f"SLA BREACH: {label}={actual_rows} < min={min_rows}")
    return True

assert assert_sla(5000, 100, "orders") is True
try:
    assert_sla(10, 100, "orders")
    assert False
except RuntimeError as e:
    print(f"[4] SLA breach: {e}")

# 5. Config merging
def merge_configs(*dicts: dict) -> dict:
    out = {}
    for d in dicts:
        out.update(d)
    return out

base     = {"batch_size": 500, "retries": 3, "log_level": "INFO"}
prod_ovr = {"batch_size": 2000, "log_level": "WARN"}
hotfix   = {"retries": 5}
final = merge_configs(base, prod_ovr, hotfix)
assert final["batch_size"] == 2000
assert final["retries"] == 5
assert final["log_level"] == "WARN"
print(f"[5] merged: {final}")

# 6. Task values simulation
_task_store: dict = {}

def task_set(task_key: str, key: str, value) -> None:
    _task_store.setdefault(task_key, {})[key] = value

def task_get(task_key: str, key: str, default=None):
    return _task_store.get(task_key, {}).get(key, default)

task_set("ingest_task", "row_count", 42000)
task_set("ingest_task", "status", "SUCCESS")
rc = task_get("ingest_task", "row_count")
st = task_get("ingest_task", "status")
missing = task_get("ingest_task", "nonexistent", default=-1)
assert rc == 42000
assert st == "SUCCESS"
assert missing == -1
print(f"[6] row_count={rc} status={st} missing={missing}")

# 7. Job payload
job_payload = {
    "name": "daily_etl",
    "tasks": [
        {
            "task_key": "ingest",
            "spark_python_task": {"python_file": "s3://bucket/ingest.py"},
        }
    ],
    "schedule": {
        "quartz_cron_expression": "0 0 4 * * ?",
        "timezone_id": "UTC",
    },
}
assert job_payload["name"] == "daily_etl"
assert len(job_payload["tasks"]) == 1
assert job_payload["tasks"][0]["task_key"] == "ingest"
assert "schedule" in job_payload
print(f"[7] job_payload name={job_payload['name']}")

# 8. Circuit breaker
class CircuitBreaker:
    def __init__(self, max_failures: int = 3):
        self.failures = 0
        self.max_failures = max_failures

    def call(self, func, *args, **kwargs):
        if self.failures >= self.max_failures:
            raise RuntimeError(f"Circuit OPEN after {self.failures} failures")
        try:
            result = func(*args, **kwargs)
            self.failures = 0
            return result
        except Exception:
            self.failures += 1
            raise

cb = CircuitBreaker(max_failures=2)
cb.call(lambda: "ok")
assert cb.failures == 0

def fail(): raise ValueError("downstream error")
try: cb.call(fail)
except ValueError: pass
try: cb.call(fail)
except ValueError: pass
try:
    cb.call(fail)
    assert False
except RuntimeError as e:
    print(f"[8] circuit open: {e}")

print("\nAll assertions passed!")
spark.stop()
