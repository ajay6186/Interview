# ============================================================================
# Solution 5.4 — Data Lakehouse Architecture
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("lakehouse-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/lh_ex"
os.makedirs(f"{BASE}/silver/products", exist_ok=True)
os.makedirs(f"{BASE}/gold/product_revenue", exist_ok=True)

products = spark.createDataFrame([
    ("p1","Laptop",      "Electronics", 999.99),
    ("p2","Phone",       "Electronics", 699.00),
    ("p3","Headphones",  "Electronics", 149.99),
    ("p4","Office Chair","Furniture",   349.00),
    ("p5","Standing Desk","Furniture",  799.00),
], ["product_id","name","category","price"])

# 1. Write Delta table
products.write.format("delta").mode("overwrite").save(f"{BASE}/silver/products")
initial_count = spark.read.format("delta").load(f"{BASE}/silver/products").count()
assert initial_count == 5
print(f"[1] initial_count={initial_count}")

# 2. ACID UPDATE
DeltaTable.forPath(spark, f"{BASE}/silver/products") \
    .update(F.col("product_id") == "p1", {"price": F.lit(1099.99)})
updated_price = spark.read.format("delta").load(f"{BASE}/silver/products") \
    .filter(F.col("product_id") == "p1").select("price").collect()[0][0]
assert abs(updated_price - 1099.99) < 0.01
print(f"[2] updated_price={updated_price}")

# 3. ACID DELETE
DeltaTable.forPath(spark, f"{BASE}/silver/products") \
    .delete(F.col("category") == "Furniture")
after_delete_count = spark.read.format("delta").load(f"{BASE}/silver/products").count()
assert after_delete_count == 3
print(f"[3] after_delete_count={after_delete_count}")

# 4. Time travel v0
v0_count = spark.read.format("delta").option("versionAsOf",0).load(f"{BASE}/silver/products").count()
assert v0_count == 5
print(f"[4] v0_count={v0_count}")

# 5. MERGE upsert
updates = spark.createDataFrame([
    ("p2","Phone",       "Electronics", 649.00),
    ("p6","Keyboard",    "Electronics", 129.99),
], ["product_id","name","category","price"])

DeltaTable.forPath(spark, f"{BASE}/silver/products").alias("t") \
    .merge(updates.alias("s"), "t.product_id = s.product_id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .execute()
after_merge_count = spark.read.format("delta").load(f"{BASE}/silver/products").count()
assert after_merge_count == 4
p2_price = spark.read.format("delta").load(f"{BASE}/silver/products") \
    .filter(F.col("product_id") == "p2").select("price").collect()[0][0]
assert abs(p2_price - 649.00) < 0.01
print(f"[5] after_merge={after_merge_count}  p2_price={p2_price}")

# 6. Schema evolution
with_discount = spark.read.format("delta").load(f"{BASE}/silver/products") \
    .withColumn("discount_pct", F.lit(0.0))
with_discount.write.format("delta").mode("overwrite") \
    .option("mergeSchema","true").save(f"{BASE}/silver/products")
schema_cols = spark.read.format("delta").load(f"{BASE}/silver/products").columns
has_discount_col = "discount_pct" in schema_cols
assert has_discount_col is True
print(f"[6] discount_pct exists: {has_discount_col}")

# 7. Schema enforcement
bad_df = spark.createDataFrame([(1,"totally_wrong")], ["id","bad_col"])
try:
    bad_df.write.format("delta").mode("append").save(f"{BASE}/silver/products")
    caught_error = False
except Exception:
    caught_error = True
assert caught_error is True
print(f"[7] schema enforcement: {caught_error}")

# 8. DESCRIBE HISTORY
hist = spark.sql(f"DESCRIBE HISTORY delta.`{BASE}/silver/products`")
num_versions = hist.count()
assert num_versions >= 4
print(f"[8] num_versions={num_versions}")

# 9. Gold aggregate
gold_df = spark.read.format("delta").load(f"{BASE}/silver/products") \
    .groupBy("category") \
    .agg(F.round(F.sum("price"),2).alias("total_catalog_value"),
         F.count("*").alias("product_count"))
gold_df.write.format("delta").mode("overwrite").save(f"{BASE}/gold/product_revenue")
gold_count = spark.read.format("delta").load(f"{BASE}/gold/product_revenue").count()
assert gold_count >= 1
electronics = spark.read.format("delta").load(f"{BASE}/gold/product_revenue") \
    .filter(F.col("category") == "Electronics").first()
assert electronics is not None
print(f"[9] gold categories={gold_count} Electronics count={electronics['product_count']}")

# 10. Lakehouse definition
lakehouse_definition = (
    "A Lakehouse combines open file formats (Delta Parquet) with ACID transaction guarantees, "
    "enabling BI, ML, and streaming workloads directly on cheap cloud storage without copying data."
)
assert "ACID" in lakehouse_definition
assert "open" in lakehouse_definition.lower()
assert len(lakehouse_definition) >= 20
print(f"[10] {lakehouse_definition[:80]}")

print("\nAll assertions passed!")
spark.stop()
