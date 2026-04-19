# ============================================================================
# Exercise 6.2 — CI/CD & Testing
# ============================================================================
# Build a production-grade test suite: unit tests for transform functions,
# schema contract tests, Delta MERGE tests, and idempotency verification.
#
# Instructions: Replace every None / "TODO" so assertions pass.
# Run with: python exercise.py  (requires PySpark + delta-spark installed)
# ============================================================================

import tempfile
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType, IntegerType
)
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("cicd-testing-exercise")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

# ---------------------------------------------------------------------------
# Helper functions under test (do NOT modify these)
# ---------------------------------------------------------------------------

def add_line_total(df: DataFrame) -> DataFrame:
    """Multiply unit_price * quantity, round to 2 dp, store as line_total."""
    return df.withColumn("line_total", F.round(F.col("unit_price") * F.col("quantity"), 2))

def drop_null_customers(df: DataFrame) -> DataFrame:
    """Remove rows where customer_id is null."""
    return df.dropna(subset=["customer_id"])

def dedup_by_order_id(df: DataFrame) -> DataFrame:
    """Keep one row per order_id (first encountered wins)."""
    return df.dropDuplicates(["order_id"])

def apply_status_filter(df: DataFrame, keep_statuses: list) -> DataFrame:
    """Keep only rows whose status is in keep_statuses."""
    return df.filter(F.col("status").isin(keep_statuses))

# ---------------------------------------------------------------------------
# 1. Unit test — add_line_total correctness
# ---------------------------------------------------------------------------

# TODO: Build test_orders_df from this data:
#   order_id | customer_id | product_id | quantity | unit_price | status
#   ("o1",   "c1", "p1", 2,  99.99, "completed")
#   ("o2",   "c2", "p2", 1, 199.00, "completed")
#   ("o3",   "c1", "p3", 3,  29.99, "refunded")
#   ("o4",   "c3", "p1", 1,  99.99, "pending")

test_orders_df = None  # replace

assert test_orders_df is not None,              "test_orders_df must not be None"
assert test_orders_df.count() == 4,            f"Expected 4 rows, got {test_orders_df.count()}"

# TODO: Apply add_line_total to test_orders_df → result_line_total
result_line_total = None  # replace

assert result_line_total is not None,           "result_line_total must not be None"
assert "line_total" in result_line_total.columns, "line_total column missing"

# TODO: Collect the line_total for order "o1" into `o1_total` (float)
o1_total = None  # replace

assert o1_total == 199.98,  f"Expected 199.98 for o1 (2 * 99.99), got {o1_total}"

# TODO: Collect the line_total for order "o3" into `o3_total` (float)
o3_total = None  # replace

assert o3_total == 89.97,   f"Expected 89.97 for o3 (3 * 29.99), got {o3_total}"

# ---------------------------------------------------------------------------
# 2. Unit test — drop_null_customers
# ---------------------------------------------------------------------------

df_with_nulls = spark.createDataFrame([
    ("o1", "c1", 100.0),
    ("o2",  None, 200.0),
    ("o3", "c3",  50.0),
    ("o4",  None, 30.0),
], ["order_id", "customer_id", "amount"])

# TODO: Apply drop_null_customers → df_clean
df_clean = None  # replace

assert df_clean is not None,        "df_clean must not be None"
assert df_clean.count() == 2,      f"Expected 2 rows after null drop, got {df_clean.count()}"

null_remaining = df_clean.filter(F.col("customer_id").isNull()).count()
assert null_remaining == 0,        f"Expected 0 null customer_ids, got {null_remaining}"

# ---------------------------------------------------------------------------
# 3. Unit test — dedup_by_order_id
# ---------------------------------------------------------------------------

df_duplicates = spark.createDataFrame([
    ("o1", "c1", "completed"),
    ("o2", "c2", "pending"),
    ("o1", "c1", "completed"),   # exact dup
    ("o3", "c3", "refunded"),
], ["order_id", "customer_id", "status"])

# TODO: Apply dedup_by_order_id → df_deduped
df_deduped = None  # replace

assert df_deduped is not None,      "df_deduped must not be None"
assert df_deduped.count() == 3,    f"Expected 3 unique orders, got {df_deduped.count()}"

# ---------------------------------------------------------------------------
# 4. Schema contract assertion function
# ---------------------------------------------------------------------------

# TODO: Implement `assert_schema_contract(df, expected: dict, label)` that:
#         - expected maps column_name → dtype string (e.g. {"order_id": "string"})
#         - Raises AssertionError listing missing columns and type mismatches
#         - Prints a success message and returns True when contract is met

def assert_schema_contract(df, expected: dict, label: str = "df") -> bool:
    pass  # replace

SILVER_CONTRACT = {
    "order_id":    "string",
    "customer_id": "string",
    "quantity":    "bigint",
    "unit_price":  "double",
}

silver_df = spark.createDataFrame([
    ("o1", "c1", 2, 99.99),
    ("o2", "c2", 1, 199.00),
], ["order_id", "customer_id", "quantity", "unit_price"])

ok = assert_schema_contract(silver_df, SILVER_CONTRACT, "silver_orders")
assert ok is True, "Contract should pass for matching schema"

wrong_df = spark.createDataFrame([("o1", "c1")], ["order_id", "status"])
try:
    assert_schema_contract(wrong_df, SILVER_CONTRACT, "wrong_df")
    raise AssertionError("Should have raised AssertionError")
except AssertionError as e:
    assert "customer_id" in str(e) or "quantity" in str(e), \
        f"Error should mention missing columns: {e}"

# ---------------------------------------------------------------------------
# 5. Test Delta MERGE — upsert correctness
# ---------------------------------------------------------------------------

# TODO:
#   a) Write `existing_df` to `tmp_path` as Delta (mode="overwrite")
#   b) MERGE `updates_df` into the Delta table using order_id as key
#      - whenMatchedUpdateAll
#      - whenNotMatchedInsertAll
#   c) Read back the result into `after_merge`

existing_df = spark.createDataFrame([
    ("o1", "pending"),
    ("o2", "completed"),
], ["order_id", "status"])

updates_df = spark.createDataFrame([
    ("o2", "shipped"),    # update existing
    ("o3", "completed"),  # new row
], ["order_id", "status"])

tmp_path = tempfile.mkdtemp()
after_merge = None  # replace — read result after MERGE

assert after_merge is not None,              "after_merge must not be None"
assert after_merge.count() == 3,           f"Expected 3 rows after merge, got {after_merge.count()}"

o2_status = after_merge.filter(F.col("order_id") == "o2").select("status").collect()[0][0]
assert o2_status == "shipped",             f"o2 should be 'shipped' after update, got {o2_status}"

o1_status = after_merge.filter(F.col("order_id") == "o1").select("status").collect()[0][0]
assert o1_status == "pending",             f"o1 should remain 'pending', got {o1_status}"

# ---------------------------------------------------------------------------
# 6. Idempotency test
# ---------------------------------------------------------------------------

# TODO: Implement `test_idempotency(run_fn, output_path)` that:
#         - Calls run_fn() twice
#         - Reads the Delta table at output_path after each run
#         - Returns True if row counts are equal, False otherwise

def test_idempotency(run_fn, output_path: str) -> bool:
    pass  # replace

idem_path = tempfile.mkdtemp()

def idempotent_write():
    spark.range(10).write.format("delta").mode("overwrite").save(idem_path)

result = test_idempotency(idempotent_write, idem_path)
assert result is True,  f"Idempotent pipeline should return True, got {result}"

def non_idempotent_write():
    spark.range(10).write.format("delta").mode("append").save(idem_path)

# Reset
spark.range(10).write.format("delta").mode("overwrite").save(idem_path)
result2 = test_idempotency(non_idempotent_write, idem_path)
assert result2 is False, f"Append-mode pipeline is NOT idempotent, expected False, got {result2}"

# ---------------------------------------------------------------------------
# 7. Empty-input test (negative test)
# ---------------------------------------------------------------------------

ORDERS_SCHEMA = StructType([
    StructField("order_id",   StringType(),  True),
    StructField("quantity",   IntegerType(), True),
    StructField("unit_price", DoubleType(),  True),
])

empty_df = spark.createDataFrame([], ORDERS_SCHEMA)

# TODO: Apply add_line_total to empty_df → empty_result
empty_result = None  # replace

assert empty_result is not None,            "add_line_total must not return None on empty input"
assert empty_result.count() == 0,          f"Empty input should produce empty output, got {empty_result.count()}"
assert "line_total" in empty_result.columns, "line_total column must exist even for empty DataFrame"

# ---------------------------------------------------------------------------
# 8. Status filter — parameterised test simulation
# ---------------------------------------------------------------------------

orders_full = spark.createDataFrame([
    ("o1", "completed"),
    ("o2", "refunded"),
    ("o3", "pending"),
    ("o4", "completed"),
    ("o5", "shipped"),
], ["order_id", "status"])

# TODO: For each case below, apply apply_status_filter and verify count
test_cases = [
    (["completed"],              2),
    (["refunded"],               1),
    (["pending"],                1),
    (["completed", "refunded"],  3),
    (["shipped"],                1),
]

for keep, expected_count in test_cases:
    # TODO: Filter orders_full by keep list → filtered_df
    filtered_df = None  # replace

    assert filtered_df is not None,  f"filtered_df for {keep} must not be None"
    actual = filtered_df.count()
    assert actual == expected_count, \
        f"Filter {keep}: expected {expected_count} rows, got {actual}"

print("\nAll assertions passed!")
spark.stop()
