# ============================================================================
# Solution 6.2 — CI/CD & Testing
# ============================================================================

import tempfile
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType, IntegerType
)
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("cicd-testing-solution")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

# ---------------------------------------------------------------------------
# Helper functions under test
# ---------------------------------------------------------------------------

def add_line_total(df: DataFrame) -> DataFrame:
    return df.withColumn("line_total", F.round(F.col("unit_price") * F.col("quantity"), 2))

def drop_null_customers(df: DataFrame) -> DataFrame:
    return df.dropna(subset=["customer_id"])

def dedup_by_order_id(df: DataFrame) -> DataFrame:
    return df.dropDuplicates(["order_id"])

def apply_status_filter(df: DataFrame, keep_statuses: list) -> DataFrame:
    return df.filter(F.col("status").isin(keep_statuses))

# ---------------------------------------------------------------------------
# 1. Unit test — add_line_total correctness
# ---------------------------------------------------------------------------

test_orders_df = spark.createDataFrame([
    ("o1", "c1", "p1", 2,  99.99, "completed"),
    ("o2", "c2", "p2", 1, 199.00, "completed"),
    ("o3", "c1", "p3", 3,  29.99, "refunded"),
    ("o4", "c3", "p1", 1,  99.99, "pending"),
], ["order_id", "customer_id", "product_id", "quantity", "unit_price", "status"])

assert test_orders_df.count() == 4

result_line_total = add_line_total(test_orders_df)
assert "line_total" in result_line_total.columns

o1_total = result_line_total.filter(F.col("order_id") == "o1").select("line_total").collect()[0][0]
assert o1_total == 199.98, f"Expected 199.98, got {o1_total}"

o3_total = result_line_total.filter(F.col("order_id") == "o3").select("line_total").collect()[0][0]
assert o3_total == 89.97, f"Expected 89.97, got {o3_total}"

# ---------------------------------------------------------------------------
# 2. Unit test — drop_null_customers
# ---------------------------------------------------------------------------

df_with_nulls = spark.createDataFrame([
    ("o1", "c1", 100.0),
    ("o2",  None, 200.0),
    ("o3", "c3",  50.0),
    ("o4",  None, 30.0),
], ["order_id", "customer_id", "amount"])

df_clean = drop_null_customers(df_with_nulls)
assert df_clean.count() == 2
assert df_clean.filter(F.col("customer_id").isNull()).count() == 0

# ---------------------------------------------------------------------------
# 3. Unit test — dedup_by_order_id
# ---------------------------------------------------------------------------

df_duplicates = spark.createDataFrame([
    ("o1", "c1", "completed"),
    ("o2", "c2", "pending"),
    ("o1", "c1", "completed"),
    ("o3", "c3", "refunded"),
], ["order_id", "customer_id", "status"])

df_deduped = dedup_by_order_id(df_duplicates)
assert df_deduped.count() == 3

# ---------------------------------------------------------------------------
# 4. Schema contract assertion function
# ---------------------------------------------------------------------------

def assert_schema_contract(df, expected: dict, label: str = "df") -> bool:
    actual   = dict(df.dtypes)
    missing  = [c for c in expected if c not in actual]
    mistyped = [f"{c}: want {expected[c]}, got {actual[c]}"
                for c in expected if c in actual and actual[c] != expected[c]]
    errors   = missing + mistyped
    if errors:
        raise AssertionError(f"Schema contract failed for '{label}': {errors}")
    print(f"Schema contract OK: {label}")
    return True

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
assert ok is True

wrong_df = spark.createDataFrame([("o1", "c1")], ["order_id", "status"])
try:
    assert_schema_contract(wrong_df, SILVER_CONTRACT, "wrong_df")
    raise AssertionError("Should have raised AssertionError")
except AssertionError as e:
    assert "customer_id" in str(e) or "quantity" in str(e)

# ---------------------------------------------------------------------------
# 5. Test Delta MERGE — upsert correctness
# ---------------------------------------------------------------------------

existing_df = spark.createDataFrame([
    ("o1", "pending"),
    ("o2", "completed"),
], ["order_id", "status"])

updates_df = spark.createDataFrame([
    ("o2", "shipped"),
    ("o3", "completed"),
], ["order_id", "status"])

tmp_path = tempfile.mkdtemp()

existing_df.write.format("delta").mode("overwrite").save(tmp_path)

DeltaTable.forPath(spark, tmp_path).alias("t") \
    .merge(updates_df.alias("s"), "t.order_id = s.order_id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .execute()

after_merge = spark.read.format("delta").load(tmp_path)

assert after_merge.count() == 3
o2_status = after_merge.filter(F.col("order_id") == "o2").select("status").collect()[0][0]
assert o2_status == "shipped"
o1_status = after_merge.filter(F.col("order_id") == "o1").select("status").collect()[0][0]
assert o1_status == "pending"

# ---------------------------------------------------------------------------
# 6. Idempotency test
# ---------------------------------------------------------------------------

def test_idempotency(run_fn, output_path: str) -> bool:
    run_fn()
    c1 = spark.read.format("delta").load(output_path).count()
    run_fn()
    c2 = spark.read.format("delta").load(output_path).count()
    ok = (c1 == c2)
    print(f"Idempotency: run1={c1}  run2={c2}  {'OK' if ok else 'FAIL'}")
    return ok

idem_path = tempfile.mkdtemp()

def idempotent_write():
    spark.range(10).write.format("delta").mode("overwrite").save(idem_path)

result = test_idempotency(idempotent_write, idem_path)
assert result is True

def non_idempotent_write():
    spark.range(10).write.format("delta").mode("append").save(idem_path)

spark.range(10).write.format("delta").mode("overwrite").save(idem_path)
result2 = test_idempotency(non_idempotent_write, idem_path)
assert result2 is False

# ---------------------------------------------------------------------------
# 7. Empty-input test
# ---------------------------------------------------------------------------

ORDERS_SCHEMA = StructType([
    StructField("order_id",   StringType(),  True),
    StructField("quantity",   IntegerType(), True),
    StructField("unit_price", DoubleType(),  True),
])

empty_df     = spark.createDataFrame([], ORDERS_SCHEMA)
empty_result = add_line_total(empty_df)

assert empty_result.count() == 0
assert "line_total" in empty_result.columns

# ---------------------------------------------------------------------------
# 8. Status filter — parameterised test
# ---------------------------------------------------------------------------

orders_full = spark.createDataFrame([
    ("o1", "completed"),
    ("o2", "refunded"),
    ("o3", "pending"),
    ("o4", "completed"),
    ("o5", "shipped"),
], ["order_id", "status"])

test_cases = [
    (["completed"],              2),
    (["refunded"],               1),
    (["pending"],                1),
    (["completed", "refunded"],  3),
    (["shipped"],                1),
]

for keep, expected_count in test_cases:
    filtered_df = apply_status_filter(orders_full, keep)
    actual = filtered_df.count()
    assert actual == expected_count, \
        f"Filter {keep}: expected {expected_count} rows, got {actual}"

print("\nAll assertions passed!")
spark.stop()
