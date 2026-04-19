# ============================================================================
# Exercise 6.1 — Production ETL Patterns
# ============================================================================
# Build production-grade ETL: idempotency, retries, audit logging,
# dead-letter queues, schema validation, and watermark-based incremental loads.
#
# Instructions: Replace every None / "TODO" so assertions pass.
# Run with: python exercise.py  (requires PySpark + delta-spark installed)
# ============================================================================

import os, json, time
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType

spark = SparkSession.builder \
    .appName("prod-etl-exercise") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/prod_etl_ex"
for p in ["silver", "quarantine", "audit", "checkpoints"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

raw = spark.createDataFrame([
    ("ord_001", "cust_01", 499.99),
    ("ord_002",  None,     200.00),   # bad: null customer
    ("ord_003", "cust_02", -10.00),   # bad: negative amount
    ("ord_004", "cust_03", 150.00),
    ("ord_005", "cust_01", 300.00),
], ["order_id", "customer_id", "amount"])

# ---------------------------------------------------------------------------
# 1. Dead-letter queue — separate good from bad rows
# ---------------------------------------------------------------------------

# TODO: Filter `raw` into `good_df` (customer_id not null AND amount > 0)
# TODO: Filter `raw` into `bad_df` (customer_id is null OR amount <= 0)
# TODO: Add column "_error_reason" to bad_df:
#         "null_customer"       when customer_id is null
#         "non_positive_amount" when amount <= 0

good_df = None  # replace
bad_df  = None  # replace

assert good_df is not None, "good_df must not be None"
assert bad_df  is not None, "bad_df must not be None"
assert good_df.count() == 3,                   f"Expected 3 good rows, got {good_df.count()}"
assert bad_df.count()  == 2,                   f"Expected 2 bad rows, got {bad_df.count()}"
assert "_error_reason" in bad_df.columns,      "bad_df must have _error_reason column"

reasons = {r["_error_reason"] for r in bad_df.select("_error_reason").collect()}
assert "null_customer"       in reasons, f"Expected 'null_customer' in reasons, got {reasons}"
assert "non_positive_amount" in reasons, f"Expected 'non_positive_amount' in reasons, got {reasons}"

# ---------------------------------------------------------------------------
# 2. Row-count SLA assertion
# ---------------------------------------------------------------------------

# TODO: Implement `assert_row_count(df, min_rows, label)` that:
#         - Calls df.count()
#         - Raises ValueError if count < min_rows with message:
#           "SLA: <label> has <n> rows < min <min_rows>"
#         - Returns the count when OK

def assert_row_count(df, min_rows: int, label: str = "df"):
    pass  # replace

result = assert_row_count(good_df, min_rows=1, label="silver_orders")
assert isinstance(result, int), "assert_row_count must return an int"
assert result == 3

try:
    assert_row_count(good_df, min_rows=100, label="too_few")
    raise AssertionError("Should have raised ValueError")
except ValueError as e:
    assert "100" in str(e), f"Error message should mention min_rows: {e}"

# ---------------------------------------------------------------------------
# 3. Retry decorator
# ---------------------------------------------------------------------------

# TODO: Implement `with_retry(func, max_retries, delay_sec)` that:
#         - Tries func() up to max_retries times
#         - On success, returns the result immediately
#         - On failure, waits delay_sec seconds between retries
#         - After all retries exhausted, raises RuntimeError wrapping the last exception

def with_retry(func, max_retries: int = 3, delay_sec: float = 0.0):
    pass  # replace

call_count = {"n": 0}

def flaky_on_first():
    call_count["n"] += 1
    if call_count["n"] < 2:
        raise ConnectionError("transient failure")
    return "ok"

result = with_retry(flaky_on_first, max_retries=3, delay_sec=0)
assert result == "ok",          f"Expected 'ok', got {result}"
assert call_count["n"] == 2,   f"Expected 2 calls, got {call_count['n']}"

try:
    with_retry(lambda: (_ for _ in ()).throw(OSError("always fail")), max_retries=2, delay_sec=0)
    raise AssertionError("Should have raised RuntimeError")
except RuntimeError:
    pass

# ---------------------------------------------------------------------------
# 4. Structured logging
# ---------------------------------------------------------------------------

# TODO: Implement `structured_log(level, msg, **context)` that:
#         - Builds a dict: {"level": level, "message": msg, "ts": <ISO timestamp>, **context}
#         - Prints it as a single-line JSON string
#         - Returns the dict

def structured_log(level: str, msg: str, **context) -> dict:
    pass  # replace

log_entry = structured_log("INFO", "Pipeline started", run_id="run-001", pipeline="orders_etl")

assert log_entry is not None,               "structured_log must return a dict"
assert log_entry["level"]   == "INFO",      f"level mismatch: {log_entry.get('level')}"
assert log_entry["message"] == "Pipeline started"
assert log_entry["run_id"]  == "run-001"
assert "ts" in log_entry,                   "log entry must have 'ts' field"

# ---------------------------------------------------------------------------
# 5. ETL class — extract / transform / load
# ---------------------------------------------------------------------------

# TODO: Complete the OrdersETL class:
#         extract(raw_df)  → stores rows_in metric, returns df
#         transform(df)    → splits into (good, bad) DataFrames (same logic as task 1)
#         load(df, path)   → writes df as delta (mode='overwrite')
#         run(raw_df)      → calls extract → transform → load(good) → returns metrics dict
#
# metrics dict must have keys: "rows_in", "rows_out", "quarantined"

class OrdersETL:
    def __init__(self, spark, base_path: str, run_id: str):
        self.spark   = spark
        self.base    = base_path
        self.run_id  = run_id
        self._metrics = {}

    def extract(self, raw_df):
        pass  # TODO

    def transform(self, df):
        pass  # TODO: return (good_df, bad_df)

    def load(self, df, path: str):
        pass  # TODO

    def run(self, raw_df):
        pass  # TODO: orchestrate extract → transform → load → return metrics

etl     = OrdersETL(spark, BASE, "run-001")
metrics = etl.run(raw)

assert metrics is not None,                "run() must return a metrics dict"
assert metrics.get("rows_in")    == 5,    f"rows_in expected 5, got {metrics.get('rows_in')}"
assert metrics.get("rows_out")   == 3,    f"rows_out expected 3, got {metrics.get('rows_out')}"
assert metrics.get("quarantined")== 2,    f"quarantined expected 2, got {metrics.get('quarantined')}"

# ---------------------------------------------------------------------------
# 6. Watermark helpers (file-based state store)
# ---------------------------------------------------------------------------

# TODO: Implement load_watermark(key, default) that:
#         - Returns contents of {BASE}/checkpoints/{key}.wm if file exists
#         - Returns `default` if file does not exist

# TODO: Implement save_watermark(key, value) that:
#         - Writes value to {BASE}/checkpoints/{key}.wm

def load_watermark(key: str, default: str = "1970-01-01T00:00:00") -> str:
    pass  # replace

def save_watermark(key: str, value: str) -> None:
    pass  # replace

wm_key = "orders_test_wm"
wm1 = load_watermark(wm_key)
assert wm1 == "1970-01-01T00:00:00", f"Default watermark mismatch: {wm1}"

save_watermark(wm_key, "2024-01-15T08:00:00")
wm2 = load_watermark(wm_key)
assert wm2 == "2024-01-15T08:00:00", f"Saved watermark mismatch: {wm2}"

# ---------------------------------------------------------------------------
# 7. Schema contract validator
# ---------------------------------------------------------------------------

# TODO: Implement validate_schema(df, expected: dict) that:
#         - expected maps column_name → simple type string e.g. {"order_id": "string"}
#         - Raises ValueError listing missing columns AND type mismatches
#         - Returns True if contract is satisfied

def validate_schema(df, expected: dict) -> bool:
    pass  # replace

ORDERS_CONTRACT = {"order_id": "string", "customer_id": "string", "amount": "double"}

ok = validate_schema(raw, ORDERS_CONTRACT)
assert ok is True, "validate_schema should return True for valid df"

bad_schema_df = spark.createDataFrame([("x", 1)], ["order_id", "amount"])
try:
    validate_schema(bad_schema_df, ORDERS_CONTRACT)
    raise AssertionError("Should have raised ValueError for missing customer_id")
except ValueError as e:
    assert "customer_id" in str(e), f"Error should mention missing column: {e}"

# ---------------------------------------------------------------------------
# 8. Audit log writer
# ---------------------------------------------------------------------------

# TODO: Implement write_audit(spark, run_id, stage, rows_in, rows_out, status, path)
#         - Creates a single-row DataFrame with those fields + "logged_at" (ISO string)
#         - Appends it as Delta to `path`
#         - Returns the row count of the audit table after appending

def write_audit(spark, run_id: str, stage: str, rows_in: int,
                rows_out: int, status: str, path: str) -> int:
    pass  # replace

audit_path = f"{BASE}/audit"
count1 = write_audit(spark, "run-001", "silver_cleanse", 5, 3, "SUCCESS", audit_path)
count2 = write_audit(spark, "run-001", "gold_agg",       3, 1, "SUCCESS", audit_path)

assert isinstance(count1, int),   "write_audit must return int"
assert count2 == count1 + 1,      f"Second audit write should increment by 1: {count1} → {count2}"

print("\nAll assertions passed!")
spark.stop()
