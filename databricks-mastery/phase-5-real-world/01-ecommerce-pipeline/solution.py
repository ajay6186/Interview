# ============================================================================
# Solution 5.1 — E-Commerce Pipeline
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("ecommerce-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/ecomm_ex"
for p in ["bronze/orders","silver/orders","gold/revenue"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

raw_orders = spark.createDataFrame([
    ("ord_001","cust_01","prod_A","2","999.99","2024-01-10 09:00:00","completed"),
    ("ord_002","cust_02","prod_B","1","699.00","2024-01-10 10:00:00","completed"),
    ("ord_003","cust_01","prod_C","3","149.99","2024-01-11 14:00:00","refunded"),
    ("ord_004","cust_03","prod_A","1","999.99","2024-01-12 08:00:00","completed"),
    ("ord_005","cust_02","prod_D","2","349.00","2024-01-12 16:00:00","pending"),
    ("ord_001","cust_01","prod_A","2","999.99","2024-01-10 09:00:00","completed"),
], ["order_id","customer_id","product_id","qty_str","price_str","order_ts","status"])

products = spark.createDataFrame([
    ("prod_A","Laptop",      "Electronics"),
    ("prod_B","Phone",       "Electronics"),
    ("prod_C","Headphones",  "Electronics"),
    ("prod_D","Office Chair","Furniture"),
], ["product_id","product_name","category"])

# 1. Bronze ingest
bronze = raw_orders \
    .withColumn("_ingested_at", F.current_timestamp()) \
    .withColumn("_source",      F.lit("orders_api"))
bronze.write.format("delta").mode("overwrite").save(f"{BASE}/bronze/orders")
bronze_count = spark.read.format("delta").load(f"{BASE}/bronze/orders").count()
assert bronze_count == 6
print(f"[1] bronze_count={bronze_count}")

# 2. Silver cleanse
df_s = (spark.read.format("delta").load(f"{BASE}/bronze/orders")
    .dropDuplicates(["order_id"])
    .withColumn("order_ts",    F.to_timestamp("order_ts","yyyy-MM-dd HH:mm:ss"))
    .withColumn("order_date",  F.to_date("order_ts"))
    .withColumn("quantity",    F.col("qty_str").cast("int"))
    .withColumn("unit_price",  F.col("price_str").cast("double"))
    .filter(F.col("customer_id").isNotNull())
    .filter(F.col("quantity") > 0)
    .filter(F.col("unit_price") > 0)
    .withColumn("line_total",  F.round(F.col("unit_price") * F.col("quantity"), 2))
    .drop("qty_str","price_str","_ingested_at","_source"))
df_s.write.format("delta").mode("overwrite").save(f"{BASE}/silver/orders")
silver_count = spark.read.format("delta").load(f"{BASE}/silver/orders").count()
assert silver_count == 5
print(f"[2] silver_count={silver_count}")

# 3. Enrich
df_enriched = spark.read.format("delta").load(f"{BASE}/silver/orders") \
    .join(products, "product_id", "left")
assert "category" in df_enriched.columns
print(f"[3] enriched rows={df_enriched.count()}")

# 4. Gold daily revenue
gold_df = (df_enriched.filter(F.col("status") == "completed")
    .groupBy("order_date")
    .agg(F.sum("line_total").alias("revenue"),
         F.count("*").alias("order_count"),
         F.countDistinct("customer_id").alias("unique_customers")))
gold_df.write.format("delta").mode("overwrite").save(f"{BASE}/gold/revenue")
gold_count = spark.read.format("delta").load(f"{BASE}/gold/revenue").count()
assert gold_count >= 2
print(f"[4] gold_count={gold_count}")

# 5. Customer LTV
ltv_df = (df_enriched.filter(F.col("status") == "completed")
    .groupBy("customer_id")
    .agg(F.sum("line_total").alias("total_spend"),
         F.count("*").alias("order_count"))
    .withColumn("avg_order_value", F.round(F.col("total_spend") / F.col("order_count"), 2)))
top_customer = ltv_df.orderBy(F.desc("total_spend")).first()
assert top_customer is not None
print(f"[5] top LTV: {top_customer['customer_id']} spend={top_customer['total_spend']}")

# 6. MERGE incremental orders
new_orders = spark.createDataFrame([
    ("ord_006","cust_04","prod_B","1","699.00","2024-01-13 11:00:00","completed"),
    ("ord_002","cust_02","prod_B","1","699.00","2024-01-10 10:00:00","shipped"),
], ["order_id","customer_id","product_id","qty_str","price_str","order_ts","status"])

new_silver = (new_orders
    .withColumn("order_ts",   F.to_timestamp("order_ts","yyyy-MM-dd HH:mm:ss"))
    .withColumn("order_date", F.to_date("order_ts"))
    .withColumn("quantity",   F.col("qty_str").cast("int"))
    .withColumn("unit_price", F.col("price_str").cast("double"))
    .withColumn("line_total", F.round(F.col("unit_price") * F.col("quantity"), 2))
    .drop("qty_str","price_str"))

DeltaTable.forPath(spark, f"{BASE}/silver/orders").alias("t") \
    .merge(new_silver.alias("s"), "t.order_id = s.order_id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .execute()

merged_count = spark.read.format("delta").load(f"{BASE}/silver/orders").count()
assert merged_count == 6
ord_002_status = spark.read.format("delta").load(f"{BASE}/silver/orders") \
    .filter(F.col("order_id") == "ord_002").select("status").collect()[0][0]
assert ord_002_status == "shipped"
print(f"[6] merged_count={merged_count}  ord_002 status={ord_002_status}")

# 7. Time travel
v0_count = spark.read.format("delta").option("versionAsOf",0).load(f"{BASE}/bronze/orders").count()
assert v0_count == 6
print(f"[7] bronze v0 count={v0_count}")

# 8. DQ check
def run_dq(df, checks: dict) -> bool:
    failed = []
    for name, (fn, msg) in checks.items():
        if not fn(df):
            failed.append(f"{name}: {msg}")
    if failed:
        raise ValueError(f"DQ failed: {failed}")
    return True

silver_df = spark.read.format("delta").load(f"{BASE}/silver/orders")
result = run_dq(silver_df, {
    "no_null_order_id":  (lambda df: df.filter(F.col("order_id").isNull()).count() == 0, "Null order_id"),
    "no_negative_qty":   (lambda df: df.filter(F.col("quantity") < 0).count() == 0, "Negative qty"),
    "no_negative_price": (lambda df: df.filter(F.col("unit_price") <= 0).count() == 0, "Non-positive price"),
})
assert result is True
print("[8] DQ passed")

print("\nAll assertions passed!")
spark.stop()
