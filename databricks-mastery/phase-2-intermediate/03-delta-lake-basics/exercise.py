# ============================================================================
# Exercise 2.3 — Delta Lake Basics
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = (SparkSession.builder
    .appName("delta-basics-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/delta_exercise"
PRODUCTS_PATH = f"{BASE}/products"
os.makedirs(BASE, exist_ok=True)

products = spark.createDataFrame([
    (1,"Laptop","Electronics",999.99,100),
    (2,"Phone","Electronics",699.00,200),
    (3,"Desk","Furniture",249.50,50),
    (4,"Chair","Furniture",149.00,80),
    (5,"Mouse","Electronics",29.99,500),
], ["id","name","category","price","stock"])

# ---------------------------------------------------------------------------
# 1. Write products as Delta table to PRODUCTS_PATH
# ---------------------------------------------------------------------------
# TODO: write as delta, mode overwrite
# Then read back into df_delta and assert count == 5
df_delta = None  # replace None

assert df_delta is not None
assert df_delta.count() == 5

# ---------------------------------------------------------------------------
# 2. Append 2 new products
# ---------------------------------------------------------------------------
new_products = spark.createDataFrame([
    (6,"Keyboard","Electronics",49.99,300),
    (7,"Monitor","Electronics",399.00,75),
], ["id","name","category","price","stock"])

# TODO: append new_products to PRODUCTS_PATH
# Then read back → df_after_append, should have 7 rows
df_after_append = None  # replace None

assert df_after_append.count() == 7

# ---------------------------------------------------------------------------
# 3. UPDATE: increase price of all Electronics by 10%
# ---------------------------------------------------------------------------
from delta.tables import DeltaTable
# TODO: use DeltaTable.forPath(spark, PRODUCTS_PATH), call dt.update(...)
# Round price to 2 decimals

# Verify
df_updated = spark.read.format("delta").load(PRODUCTS_PATH)
laptop_price = df_updated.filter(F.col("name")=="Laptop").select("price").first()["price"]
assert abs(laptop_price - 1099.99) < 1.0, f"Expected ~1099.99, got {laptop_price}"

# ---------------------------------------------------------------------------
# 4. DELETE: remove products with stock < 60
# ---------------------------------------------------------------------------
# TODO: delete rows where stock < 60
df_after_delete = spark.read.format("delta").load(PRODUCTS_PATH)
# Chair (stock=80 after possibly being unchanged), Desk (stock=50) should be gone
assert df_after_delete.filter(F.col("stock") < 60).count() == 0

# ---------------------------------------------------------------------------
# 5. MERGE (upsert): update existing + insert new
# ---------------------------------------------------------------------------
upsert_data = spark.createDataFrame([
    (1,"Laptop","Electronics",1199.99,120),   # update Laptop
    (8,"Webcam","Electronics",89.99,150),      # new product
], ["id","name","category","price","stock"])

# TODO: merge upsert_data into the Delta table:
#   - whenMatchedUpdateAll
#   - whenNotMatchedInsertAll

df_after_merge = spark.read.format("delta").load(PRODUCTS_PATH)
webcam = df_after_merge.filter(F.col("name")=="Webcam")
assert webcam.count() == 1, "Webcam should have been inserted"

# ---------------------------------------------------------------------------
# 6. Time travel — read version 0 (original 5 products)
# ---------------------------------------------------------------------------
# TODO: df_v0 = read delta at versionAsOf=0
df_v0 = None  # replace None

assert df_v0.count() == 5

# ---------------------------------------------------------------------------
# 7. DESCRIBE HISTORY
# ---------------------------------------------------------------------------
# TODO: history = spark.sql("DESCRIBE HISTORY delta.`{PRODUCTS_PATH}`")
#       Assert at least 3 versions exist
history = None  # replace None

assert history.count() >= 3

print("All assertions passed!")
spark.stop()
