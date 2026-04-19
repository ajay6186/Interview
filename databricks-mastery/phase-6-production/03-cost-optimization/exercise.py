# ============================================================================
# Exercise 6.3 — Cost Optimization
# ============================================================================
# Practice cost-optimisation techniques: caching, partition tuning, broadcast
# joins, file compaction, and AQE configuration.
#
# Instructions: Replace every None / "TODO" so assertions pass.
# Run with: python exercise.py  (requires PySpark + delta-spark installed)
# ============================================================================

import os, tempfile
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = (SparkSession.builder
    .appName("cost-opt-exercise")
    .config("spark.sql.extensions",    "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/cost_ex"
os.makedirs(BASE, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. AQE configuration
# ---------------------------------------------------------------------------

# TODO: Enable AQE and adaptive shuffle coalescing by setting:
#   spark.sql.adaptive.enabled = "true"
#   spark.sql.adaptive.coalescePartitions.enabled = "true"
#   spark.sql.adaptive.skewJoin.enabled = "true"
# Then verify by reading the config back.

aqe_enabled   = None  # replace with spark.conf.get(...)
coalesce_on   = None  # replace
skew_on       = None  # replace

assert aqe_enabled == "true",   f"AQE must be enabled, got: {aqe_enabled}"
assert coalesce_on == "true",   f"coalescePartitions must be true, got: {coalesce_on}"
assert skew_on     == "true",   f"skewJoin must be true, got: {skew_on}"

# ---------------------------------------------------------------------------
# 2. Shuffle partitions tuning
# ---------------------------------------------------------------------------

# TODO: A shuffle will produce approximately 2 GB of data.
#       Target partition size: 100 MB each.
#       Calculate optimal_partitions (integer division is fine), then
#       set spark.sql.shuffle.partitions to that value.

data_size_mb      = 2000
target_mb_per_part = 100

optimal_partitions = None   # replace — int

assert optimal_partitions is not None,           "optimal_partitions must not be None"
assert isinstance(optimal_partitions, int),      "optimal_partitions must be an int"
assert optimal_partitions == 20,                f"Expected 20, got {optimal_partitions}"

# TODO: Set spark.sql.shuffle.partitions to the calculated value
# spark.conf.set(...)

actual_setting = spark.conf.get("spark.sql.shuffle.partitions")
assert actual_setting == "20", f"shuffle.partitions should be '20', got {actual_setting}"

# ---------------------------------------------------------------------------
# 3. Broadcast join
# ---------------------------------------------------------------------------

large_orders = spark.range(50000) \
    .withColumn("product_id", F.when(F.col("id") % 3 == 0, "p1")
                               .when(F.col("id") % 3 == 1, "p2")
                               .otherwise("p3"))

dim_products = spark.createDataFrame([
    ("p1", "Electronics", 999.99),
    ("p2", "Furniture",   349.00),
    ("p3", "Clothing",     49.99),
], ["product_id", "category", "price"])

# TODO: Join large_orders with dim_products using a broadcast hint on dim_products.
#       Store the joined DataFrame in `joined_df`.

from pyspark.sql.functions import broadcast

joined_df = None  # replace

assert joined_df is not None,                  "joined_df must not be None"
assert joined_df.count() == 50000,            f"Expected 50000 rows, got {joined_df.count()}"
assert "category" in joined_df.columns,       "joined_df must have 'category' column"

# Verify broadcast hint is in the query plan
plan = joined_df._jdf.queryExecution().toString()
assert "broadcast" in plan.lower(), "Broadcast hint should appear in query plan"

# ---------------------------------------------------------------------------
# 4. Partitioned Delta write
# ---------------------------------------------------------------------------

orders_data = spark.range(1000) \
    .withColumn("order_date", F.date_add(F.lit("2024-01-01"), (F.col("id") % 30).cast("int"))) \
    .withColumn("region",     F.when(F.col("id") % 2 == 0, "US").otherwise("EU")) \
    .withColumn("amount",     (F.rand() * 1000).cast("double"))

tmp_delta = tempfile.mkdtemp()

# TODO: Write orders_data to `tmp_delta` as Delta, partitioned by "order_date".
# HINT: .write.format("delta").partitionBy("order_date").mode("overwrite").save(...)

# TODO: Read back only rows where order_date = '2024-01-01' into `one_day`
one_day = None  # replace

assert one_day is not None,      "one_day must not be None"
assert one_day.count() > 0,    f"one_day must have rows, got {one_day.count()}"
assert one_day.count() < 100,  f"Partition filter should return < 100 rows, got {one_day.count()}"

# ---------------------------------------------------------------------------
# 5. OPTIMIZE the Delta table
# ---------------------------------------------------------------------------

# TODO: Run OPTIMIZE on the Delta table at `tmp_delta`.
# HINT: spark.sql(f"OPTIMIZE delta.`{tmp_delta}`")

# Verify: read the table and confirm data is still complete
optimized_count = spark.read.format("delta").load(tmp_delta).count()
assert optimized_count == 1000, f"After OPTIMIZE, table should still have 1000 rows, got {optimized_count}"

# ---------------------------------------------------------------------------
# 6. Coalesce before write
# ---------------------------------------------------------------------------

big_df = spark.range(100000)

# TODO: Coalesce big_df to 4 partitions → coalesced_df
coalesced_df = None  # replace

assert coalesced_df is not None,                  "coalesced_df must not be None"
assert coalesced_df.rdd.getNumPartitions() == 4, \
    f"Expected 4 partitions, got {coalesced_df.rdd.getNumPartitions()}"
assert coalesced_df.count() == 100000,           f"Data should be preserved, got {coalesced_df.count()}"

# ---------------------------------------------------------------------------
# 7. Avoid Python UDF — use native functions
# ---------------------------------------------------------------------------

df_phones = spark.createDataFrame([
    ("cust_01", " +1-800-555-0100 "),
    ("cust_02", "+44 20 7946-0001 "),
    ("cust_03", "  555.0199  "),
], ["customer_id", "phone_raw"])

# TODO: Create `df_cleaned` by adding a column "phone_clean" that:
#       - Strips leading/trailing whitespace from phone_raw
#       - Removes all hyphens (-), spaces, and dots (.) from the result
#       Use ONLY native PySpark functions (F.trim, F.regexp_replace). No UDFs.

df_cleaned = None  # replace

assert df_cleaned is not None,                     "df_cleaned must not be None"
assert "phone_clean" in df_cleaned.columns,        "Must have phone_clean column"

phones = {r["phone_clean"] for r in df_cleaned.select("phone_clean").collect()}
assert "+18005550100" in phones,  f"Expected cleaned phone '+18005550100', got {phones}"
assert "+442079460001" in phones, f"Expected '+442079460001', got {phones}"
assert "5550199" in phones,       f"Expected '5550199', got {phones}"

# No hyphens, dots, or spaces in any phone
for p in phones:
    assert "-" not in p and " " not in p and "." not in p, \
        f"Phone still has unwanted chars: {p}"

# ---------------------------------------------------------------------------
# 8. Cache a reused DataFrame
# ---------------------------------------------------------------------------

base_df = spark.range(5000).withColumn("val", F.rand())

# TODO: Cache `base_df`, then:
#         - count it once (triggers caching)
#         - compute sum_val = base_df.agg(F.sum("val")).collect()[0][0]
#         - compute max_val = base_df.agg(F.max("val")).collect()[0][0]
#         - unpersist base_df after use

sum_val = None   # replace
max_val = None   # replace

assert sum_val is not None, "sum_val must not be None"
assert max_val is not None, "max_val must not be None"
assert isinstance(sum_val, float), f"sum_val must be float, got {type(sum_val)}"
assert 0 < max_val <= 1,          f"max_val should be between 0 and 1, got {max_val}"
# Verify unpersisted (should not raise)

print("\nAll assertions passed!")
spark.stop()
