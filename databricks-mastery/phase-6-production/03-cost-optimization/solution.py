# ============================================================================
# Solution 6.3 — Cost Optimization
# ============================================================================

import os, tempfile
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.functions import broadcast

spark = (SparkSession.builder
    .appName("cost-opt-solution")
    .config("spark.sql.extensions",    "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/cost_sol"
os.makedirs(BASE, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. AQE configuration
# ---------------------------------------------------------------------------

spark.conf.set("spark.sql.adaptive.enabled",                    "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled",           "true")

aqe_enabled = spark.conf.get("spark.sql.adaptive.enabled")
coalesce_on = spark.conf.get("spark.sql.adaptive.coalescePartitions.enabled")
skew_on     = spark.conf.get("spark.sql.adaptive.skewJoin.enabled")

assert aqe_enabled == "true"
assert coalesce_on == "true"
assert skew_on     == "true"

# ---------------------------------------------------------------------------
# 2. Shuffle partitions tuning
# ---------------------------------------------------------------------------

data_size_mb       = 2000
target_mb_per_part = 100
optimal_partitions = data_size_mb // target_mb_per_part   # 20

assert optimal_partitions == 20

spark.conf.set("spark.sql.shuffle.partitions", str(optimal_partitions))
actual_setting = spark.conf.get("spark.sql.shuffle.partitions")
assert actual_setting == "20"

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

joined_df = large_orders.join(broadcast(dim_products), "product_id")

assert joined_df.count() == 50000
assert "category" in joined_df.columns
plan = joined_df._jdf.queryExecution().toString()
assert "broadcast" in plan.lower()

# ---------------------------------------------------------------------------
# 4. Partitioned Delta write
# ---------------------------------------------------------------------------

orders_data = spark.range(1000) \
    .withColumn("order_date", F.date_add(F.lit("2024-01-01"), (F.col("id") % 30).cast("int"))) \
    .withColumn("region",     F.when(F.col("id") % 2 == 0, "US").otherwise("EU")) \
    .withColumn("amount",     (F.rand() * 1000).cast("double"))

tmp_delta = tempfile.mkdtemp()

orders_data.write.format("delta").partitionBy("order_date").mode("overwrite").save(tmp_delta)

one_day = spark.read.format("delta").load(tmp_delta).filter(F.col("order_date") == "2024-01-01")
assert one_day.count() > 0
assert one_day.count() < 100

# ---------------------------------------------------------------------------
# 5. OPTIMIZE
# ---------------------------------------------------------------------------

spark.sql(f"OPTIMIZE delta.`{tmp_delta}`")

optimized_count = spark.read.format("delta").load(tmp_delta).count()
assert optimized_count == 1000

# ---------------------------------------------------------------------------
# 6. Coalesce
# ---------------------------------------------------------------------------

big_df       = spark.range(100000)
coalesced_df = big_df.coalesce(4)

assert coalesced_df.rdd.getNumPartitions() == 4
assert coalesced_df.count() == 100000

# ---------------------------------------------------------------------------
# 7. Native functions instead of UDF
# ---------------------------------------------------------------------------

df_phones = spark.createDataFrame([
    ("cust_01", " +1-800-555-0100 "),
    ("cust_02", "+44 20 7946-0001 "),
    ("cust_03", "  555.0199  "),
], ["customer_id", "phone_raw"])

df_cleaned = df_phones.withColumn(
    "phone_clean",
    F.regexp_replace(F.trim(F.col("phone_raw")), r"[-\s.]", "")
)

phones = {r["phone_clean"] for r in df_cleaned.select("phone_clean").collect()}
assert "+18005550100"  in phones
assert "+442079460001" in phones
assert "5550199"       in phones

for p in phones:
    assert "-" not in p and " " not in p and "." not in p

# ---------------------------------------------------------------------------
# 8. Cache a reused DataFrame
# ---------------------------------------------------------------------------

base_df = spark.range(5000).withColumn("val", F.rand())
base_df.cache()
base_df.count()   # triggers caching

sum_val = base_df.agg(F.sum("val")).collect()[0][0]
max_val = base_df.agg(F.max("val")).collect()[0][0]

base_df.unpersist()

assert isinstance(sum_val, float)
assert 0 < max_val <= 1

print("\nAll assertions passed!")
spark.stop()
