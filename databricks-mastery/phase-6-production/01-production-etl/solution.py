# ============================================================================
# Solution 6.1 — Production ETL Patterns
# ============================================================================

import os, json, time
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType

spark = SparkSession.builder \
    .appName("prod-etl-solution") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/prod_etl_sol"
for p in ["silver", "quarantine", "audit", "checkpoints"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

raw = spark.createDataFrame([
    ("ord_001", "cust_01", 499.99),
    ("ord_002",  None,     200.00),
    ("ord_003", "cust_02", -10.00),
    ("ord_004", "cust_03", 150.00),
    ("ord_005", "cust_01", 300.00),
], ["order_id", "customer_id", "amount"])

# ---------------------------------------------------------------------------
# 1. Dead-letter queue
# ---------------------------------------------------------------------------

good_df = raw.filter(
    F.col("customer_id").isNotNull() & (F.col("amount") > 0)
)
bad_df = raw.filter(
    F.col("customer_id").isNull() | (F.col("amount") <= 0)
).withColumn("_error_reason",
    F.when(F.col("customer_id").isNull(), F.lit("null_customer"))
     .when(F.col("amount") <= 0,         F.lit("non_positive_amount"))
     .otherwise(F.lit("unknown"))
)

assert good_df.count() == 3
assert bad_df.count()  == 2
assert "_error_reason" in bad_df.columns
reasons = {r["_error_reason"] for r in bad_df.select("_error_reason").collect()}
assert "null_customer"       in reasons
assert "non_positive_amount" in reasons

# ---------------------------------------------------------------------------
# 2. Row-count SLA assertion
# ---------------------------------------------------------------------------

def assert_row_count(df, min_rows: int, label: str = "df") -> int:
    n = df.count()
    if n < min_rows:
        raise ValueError(f"SLA: {label} has {n} rows < min {min_rows}")
    print(f"Row count SLA OK: {label}={n} >= min {min_rows}")
    return n

result = assert_row_count(good_df, min_rows=1, label="silver_orders")
assert isinstance(result, int)
assert result == 3

try:
    assert_row_count(good_df, min_rows=100, label="too_few")
    raise AssertionError("Should have raised ValueError")
except ValueError as e:
    assert "100" in str(e)

# ---------------------------------------------------------------------------
# 3. Retry decorator
# ---------------------------------------------------------------------------

def with_retry(func, max_retries: int = 3, delay_sec: float = 0.0):
    def wrapper(*args, **kwargs):
        last_exc = None
        for attempt in range(1, max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exc = e
                print(f"  Attempt {attempt}/{max_retries} failed: {e}")
                if attempt < max_retries and delay_sec > 0:
                    time.sleep(delay_sec)
        raise RuntimeError(f"All {max_retries} retries failed") from last_exc
    return wrapper

call_count = {"n": 0}

def flaky_on_first():
    call_count["n"] += 1
    if call_count["n"] < 2:
        raise ConnectionError("transient failure")
    return "ok"

result = with_retry(flaky_on_first, max_retries=3, delay_sec=0)
assert result == "ok"
assert call_count["n"] == 2

try:
    with_retry(lambda: (_ for _ in ()).throw(OSError("always fail")), max_retries=2, delay_sec=0)
    raise AssertionError("Should have raised RuntimeError")
except RuntimeError:
    pass

# ---------------------------------------------------------------------------
# 4. Structured logging
# ---------------------------------------------------------------------------

def structured_log(level: str, msg: str, **context) -> dict:
    entry = {"level": level, "message": msg,
             "ts": datetime.utcnow().isoformat(), **context}
    print(json.dumps(entry))
    return entry

log_entry = structured_log("INFO", "Pipeline started", run_id="run-001", pipeline="orders_etl")

assert log_entry["level"]   == "INFO"
assert log_entry["message"] == "Pipeline started"
assert log_entry["run_id"]  == "run-001"
assert "ts" in log_entry

# ---------------------------------------------------------------------------
# 5. ETL class
# ---------------------------------------------------------------------------

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
        good = df.filter(
            F.col("customer_id").isNotNull() & (F.col("amount") > 0)
        )
        bad = df.filter(
            F.col("customer_id").isNull() | (F.col("amount") <= 0)
        )
        self._metrics["rows_out"]    = good.count()
        self._metrics["quarantined"] = bad.count()
        return good, bad

    def load(self, df, path: str):
        df.write.format("delta").mode("overwrite").save(path)

    def run(self, raw_df):
        df         = self.extract(raw_df)
        good, bad  = self.transform(df)
        self.load(good, f"{self.base}/silver")
        self.load(bad,  f"{self.base}/quarantine")
        print(f"ETL complete: {self._metrics}")
        return self._metrics

etl     = OrdersETL(spark, BASE, "run-001")
metrics = etl.run(raw)

assert metrics.get("rows_in")    == 5
assert metrics.get("rows_out")   == 3
assert metrics.get("quarantined")== 2

# ---------------------------------------------------------------------------
# 6. Watermark helpers
# ---------------------------------------------------------------------------

def load_watermark(key: str, default: str = "1970-01-01T00:00:00") -> str:
    path = f"{BASE}/checkpoints/{key}.wm"
    return open(path).read().strip() if os.path.exists(path) else default

def save_watermark(key: str, value: str) -> None:
    with open(f"{BASE}/checkpoints/{key}.wm", "w") as f:
        f.write(value)

wm_key = "orders_test_wm"
wm1 = load_watermark(wm_key)
assert wm1 == "1970-01-01T00:00:00"

save_watermark(wm_key, "2024-01-15T08:00:00")
wm2 = load_watermark(wm_key)
assert wm2 == "2024-01-15T08:00:00"

# ---------------------------------------------------------------------------
# 7. Schema contract validator
# ---------------------------------------------------------------------------

def validate_schema(df, expected: dict) -> bool:
    actual    = {f.name: f.dataType.simpleString() for f in df.schema.fields}
    missing   = set(expected) - set(actual)
    type_err  = {c: (expected[c], actual.get(c))
                 for c in expected if c in actual and actual[c] != expected[c]}
    if missing or type_err:
        raise ValueError(f"Schema contract violated: missing={missing} type_errors={type_err}")
    print("Schema contract validated")
    return True

ORDERS_CONTRACT = {"order_id": "string", "customer_id": "string", "amount": "double"}

ok = validate_schema(raw, ORDERS_CONTRACT)
assert ok is True

bad_schema_df = spark.createDataFrame([("x", 1)], ["order_id", "amount"])
try:
    validate_schema(bad_schema_df, ORDERS_CONTRACT)
    raise AssertionError("Should have raised ValueError")
except ValueError as e:
    assert "customer_id" in str(e)

# ---------------------------------------------------------------------------
# 8. Audit log writer
# ---------------------------------------------------------------------------

def write_audit(spark, run_id: str, stage: str, rows_in: int,
                rows_out: int, status: str, path: str) -> int:
    log = spark.createDataFrame(
        [(run_id, stage, rows_in, rows_out, status, datetime.utcnow().isoformat())],
        ["run_id", "stage", "rows_in", "rows_out", "status", "logged_at"]
    )
    log.write.format("delta").mode("append").save(path)
    count = spark.read.format("delta").load(path).count()
    print(f"Audit: {run_id} | {stage} | {status} | total_entries={count}")
    return count

audit_path = f"{BASE}/audit"
count1 = write_audit(spark, "run-001", "silver_cleanse", 5, 3, "SUCCESS", audit_path)
count2 = write_audit(spark, "run-001", "gold_agg",       3, 1, "SUCCESS", audit_path)

assert isinstance(count1, int)
assert count2 == count1 + 1

print("\nAll assertions passed!")
spark.stop()
