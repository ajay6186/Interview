# ============================================================================
# Exercise 5.4 — Data Lakehouse Architecture
# ============================================================================
# Practice Delta Lake ACID operations, schema enforcement, time travel,
# Unity Catalog concepts, and the full Lakehouse pattern.
#
# Instructions: Replace every None / pass so all assertions pass.
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("lakehouse-exercise")
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

# ---------------------------------------------------------------------------
# 1. Write as Delta table
# ---------------------------------------------------------------------------
# TODO: Write products to f"{BASE}/silver/products" as delta, mode overwrite
#       Read back and store count in initial_count

initial_count = None  # replace

assert initial_count == 5
print(f"[1] initial_count={initial_count}")

# ---------------------------------------------------------------------------
# 2. ACID UPDATE — price change
# ---------------------------------------------------------------------------
# TODO: Use DeltaTable.forPath to update "Laptop" price to 1099.99
#       Read back, filter product_id == "p1", get price → updated_price

updated_price = None  # replace

assert abs(updated_price - 1099.99) < 0.01, f"Expected 1099.99, got {updated_price}"
print(f"[2] updated_price={updated_price}")

# ---------------------------------------------------------------------------
# 3. ACID DELETE
# ---------------------------------------------------------------------------
# TODO: Delete all products in category == "Furniture"
#       Read back count → after_delete_count

after_delete_count = None  # replace

assert after_delete_count == 3, f"After deleting Furniture (2 rows), expected 3, got {after_delete_count}"
print(f"[3] after_delete_count={after_delete_count}")

# ---------------------------------------------------------------------------
# 4. Time travel — read version 0
# ---------------------------------------------------------------------------
# TODO: Read f"{BASE}/silver/products" at versionAsOf=0
#       Store count in v0_count (should be original 5 rows)

v0_count = None  # replace

assert v0_count == 5, f"Version 0 should have 5 rows, got {v0_count}"
print(f"[4] v0_count={v0_count}")

# ---------------------------------------------------------------------------
# 5. MERGE upsert
# ---------------------------------------------------------------------------
updates = spark.createDataFrame([
    ("p2","Phone",       "Electronics", 649.00),  # price change
    ("p6","Keyboard",    "Electronics", 129.99),  # new product
], ["product_id","name","category","price"])

# TODO: MERGE updates into silver/products:
#       - on match: update all columns
#       - no match: insert all
#       Read back, store count in after_merge_count

after_merge_count = None  # replace

assert after_merge_count == 4, f"After MERGE (3 existing + 1 new p6), expected 4, got {after_merge_count}"
p2_price = spark.read.format("delta").load(f"{BASE}/silver/products") \
    .filter(F.col("product_id") == "p2").select("price").collect()[0][0]
assert abs(p2_price - 649.00) < 0.01, f"p2 price should be 649.00, got {p2_price}"
print(f"[5] after_merge_count={after_merge_count}  p2_price={p2_price}")

# ---------------------------------------------------------------------------
# 6. Schema evolution — add discount_pct column
# ---------------------------------------------------------------------------
# TODO: Add a new column discount_pct=0.0 to ALL existing rows using mergeSchema
#       Write with mode="overwrite" and option("mergeSchema","true")
#       Read back schema and verify discount_pct exists

has_discount_col = None  # replace with True/False

assert has_discount_col is True
print(f"[6] discount_pct column exists: {has_discount_col}")

# ---------------------------------------------------------------------------
# 7. Schema enforcement — reject incompatible write
# ---------------------------------------------------------------------------
# TODO: Try to write a DataFrame with completely different columns to silver/products
#       WITHOUT mergeSchema → catch the exception
#       Set caught_error = True if exception was raised

caught_error = None  # replace

bad_df = spark.createDataFrame([(1, "totally_wrong")], ["id", "bad_col"])
try:
    bad_df.write.format("delta").mode("append").save(f"{BASE}/silver/products")
    caught_error = False
except Exception:
    caught_error = True

assert caught_error is True
print(f"[7] schema enforcement blocked write: {caught_error}")

# ---------------------------------------------------------------------------
# 8. DESCRIBE HISTORY — check operation log
# ---------------------------------------------------------------------------
# TODO: Run DESCRIBE HISTORY on silver/products
#       Count number of versions → store in num_versions
#       Should be >= 4 (initial write + update + delete + merge)

num_versions = None  # replace

assert num_versions >= 4, f"Expected >= 4 versions, got {num_versions}"
print(f"[8] num_versions={num_versions}")

# ---------------------------------------------------------------------------
# 9. Aggregate gold table (category revenue)
# ---------------------------------------------------------------------------
# TODO: From the current silver/products, compute:
#       groupBy category → sum(price) as total_catalog_value, count(*) as product_count
#       Write to f"{BASE}/gold/product_revenue" as delta overwrite
#       Store row count in gold_count

gold_count = None  # replace

assert gold_count >= 1
electronics = spark.read.format("delta").load(f"{BASE}/gold/product_revenue") \
    .filter(F.col("category") == "Electronics").first()
assert electronics is not None
print(f"[9] gold categories={gold_count}  Electronics count={electronics['product_count']}")

# ---------------------------------------------------------------------------
# 10. Explain lakehouse concept
# ---------------------------------------------------------------------------
# TODO: Set lakehouse_definition to a string that contains:
#   - "ACID" (Delta transactions)
#   - "open" (open file formats)
#   - at least 20 characters

lakehouse_definition = None  # replace

assert lakehouse_definition is not None
assert "ACID" in lakehouse_definition, "Definition must mention ACID"
assert "open" in lakehouse_definition.lower(), "Definition must mention open formats"
assert len(lakehouse_definition) >= 20
print(f"[10] definition: {lakehouse_definition[:80]}")

print("\nAll assertions passed!")
spark.stop()
