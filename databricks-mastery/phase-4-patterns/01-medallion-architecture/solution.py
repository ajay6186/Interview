# ============================================================================
# Solution 4.1 — Medallion Architecture (Bronze → Silver → Gold)
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("medallion-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE   = "/tmp/medal_sol"
BRONZE = f"{BASE}/bronze"
SILVER = f"{BASE}/silver"
GOLD   = f"{BASE}/gold"
for p in [BRONZE, SILVER, GOLD]:
    os.makedirs(p, exist_ok=True)

raw = spark.createDataFrame([
    ("ord_001","2024-01-10","alice@x.com","Widget","29.99","2"),
    ("ord_002","2024-01-11","bob@x.com","Gadget","49.00","1"),
    ("ord_003","bad_date","carol@x.com","Gizmo","15.00","3"),
    ("ord_004","2024-01-13",None,"Thing","9.99","1"),
    ("ord_001","2024-01-10","alice@x.com","Widget","29.99","2"),
], ["order_id","order_date","customer_email","product","price_str","qty_str"])

# 1. Bronze
(raw
    .withColumn("_ingested_at", F.current_timestamp())
    .withColumn("_source", F.lit("orders_v1"))
    .write.format("delta").mode("overwrite").save(f"{BRONZE}/orders"))
bronze_count = spark.read.format("delta").load(f"{BRONZE}/orders").count()
assert bronze_count == 5

# 2. Silver
df_sil = (spark.read.format("delta").load(f"{BRONZE}/orders")
    .dropDuplicates(["order_id"])
    .withColumn("order_date", F.to_date("order_date","yyyy-MM-dd"))
    .withColumn("price",      F.col("price_str").cast("double"))
    .withColumn("quantity",   F.col("qty_str").cast("int"))
    .drop("price_str","qty_str","_ingested_at","_source")
    .filter(F.col("order_date").isNotNull())
    .filter(F.col("customer_email").isNotNull())
    .filter(F.col("price") > 0)
    .withColumn("total_amount", F.round(F.col("price") * F.col("quantity"), 2))
    .withColumn("_processed_at", F.current_timestamp()))
df_sil.write.format("delta").mode("overwrite").save(f"{SILVER}/orders")
silver_count = spark.read.format("delta").load(f"{SILVER}/orders").count()
assert silver_count == 2

# 3. Quarantine
bad = (spark.read.format("delta").load(f"{BRONZE}/orders")
    .filter(F.to_date("order_date","yyyy-MM-dd").isNull() | F.col("customer_email").isNull()))
bad.write.format("delta").mode("overwrite").save(f"{SILVER}/quarantine")
bad_count = bad.count()
assert bad_count == 2

# 4. Gold
gold = (spark.read.format("delta").load(f"{SILVER}/orders")
    .groupBy("order_date","product")
    .agg(F.sum("total_amount").alias("revenue"),
         F.count("*").alias("order_count")))
gold.write.format("delta").mode("overwrite").save(f"{GOLD}/daily_revenue")
gold_count = spark.read.format("delta").load(f"{GOLD}/daily_revenue").count()
assert gold_count >= 1

# 5. Time travel
v0_count = (spark.read.format("delta")
    .option("versionAsOf","0")
    .load(f"{BRONZE}/orders").count())
assert v0_count == 5

# 6. GDPR delete
dt = DeltaTable.forPath(spark, f"{SILVER}/orders")
dt.delete(F.col("customer_email") == "alice@x.com")
remaining_emails = [
    r.customer_email
    for r in spark.read.format("delta").load(f"{SILVER}/orders")
        .select("customer_email").collect()
]
assert "alice@x.com" not in remaining_emails

print("All assertions passed!")
spark.stop()
