# ============================================================================
# Solution 2.3 — Delta Lake Basics
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("delta-basics-solution")
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

# 1. Write and read Delta
products.write.format("delta").mode("overwrite").save(PRODUCTS_PATH)
df_delta = spark.read.format("delta").load(PRODUCTS_PATH)
assert df_delta.count() == 5

# 2. Append
new_products = spark.createDataFrame([
    (6,"Keyboard","Electronics",49.99,300),
    (7,"Monitor","Electronics",399.00,75),
], ["id","name","category","price","stock"])
new_products.write.format("delta").mode("append").save(PRODUCTS_PATH)
df_after_append = spark.read.format("delta").load(PRODUCTS_PATH)
assert df_after_append.count() == 7

# 3. UPDATE electronics price +10%
dt = DeltaTable.forPath(spark, PRODUCTS_PATH)
dt.update(
    condition=F.col("category") == "Electronics",
    set={"price": F.round(F.col("price") * 1.10, 2)}
)
df_updated = spark.read.format("delta").load(PRODUCTS_PATH)
laptop_price = df_updated.filter(F.col("name")=="Laptop").select("price").first()["price"]
assert abs(laptop_price - 1099.99) < 1.0

# 4. DELETE stock < 60
dt.delete(condition=F.col("stock") < 60)
df_after_delete = spark.read.format("delta").load(PRODUCTS_PATH)
assert df_after_delete.filter(F.col("stock") < 60).count() == 0

# 5. MERGE upsert
upsert_data = spark.createDataFrame([
    (1,"Laptop","Electronics",1199.99,120),
    (8,"Webcam","Electronics",89.99,150),
], ["id","name","category","price","stock"])

dt.alias("t").merge(upsert_data.alias("s"), "t.id = s.id") \
  .whenMatchedUpdateAll() \
  .whenNotMatchedInsertAll() \
  .execute()

df_after_merge = spark.read.format("delta").load(PRODUCTS_PATH)
assert df_after_merge.filter(F.col("name")=="Webcam").count() == 1

# 6. Time travel
df_v0 = spark.read.format("delta").option("versionAsOf", 0).load(PRODUCTS_PATH)
assert df_v0.count() == 5

# 7. Describe history
history = spark.sql(f"DESCRIBE HISTORY delta.`{PRODUCTS_PATH}`")
assert history.count() >= 3

print("All assertions passed!")
spark.stop()
