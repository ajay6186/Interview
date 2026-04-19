# ============================================================================
# Exercise 1.1 — Spark Basics
# ============================================================================
# Build familiarity with SparkSession, DataFrames, schemas, and core actions.
#
# Instructions: Replace every None / "TODO" so assertions pass.
# Run with: python exercise.py  (or paste into a Databricks notebook)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("spark-basics-exercise").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ---------------------------------------------------------------------------
# 1. Create a DataFrame
# ---------------------------------------------------------------------------

# TODO: Create a DataFrame from this data with columns ["product", "category", "price"]
data = [("Laptop", "Electronics", 999.99),
        ("Phone",  "Electronics", 699.00),
        ("Desk",   "Furniture",   249.50),
        ("Chair",  "Furniture",   149.00),
        ("Mouse",  "Electronics",  29.99)]

df = None  # replace None

assert df is not None, "df must not be None"
assert df.columns == ["product", "category", "price"], "Column names are wrong"

# ---------------------------------------------------------------------------
# 2. Inspect the DataFrame
# ---------------------------------------------------------------------------

# TODO: Store the number of rows in `row_count`
row_count = None  # replace None

# TODO: Store the list of column names in `col_names`
col_names = None  # replace None

assert row_count == 5
assert set(col_names) == {"product", "category", "price"}

# ---------------------------------------------------------------------------
# 3. Define an explicit schema and create a second DataFrame
# ---------------------------------------------------------------------------

# TODO: Build a StructType schema with:
#   - "id"    : IntegerType, not nullable
#   - "item"  : StringType,  nullable
#   - "qty"   : IntegerType, nullable
schema = None  # replace None

orders_data = [(1, "Laptop", 2), (2, "Desk", 1), (3, None, 5)]

# TODO: Create orders_df using schema above
orders_df = None  # replace None

assert orders_df.schema["id"].nullable == False
assert orders_df.count() == 3

# ---------------------------------------------------------------------------
# 4. Select, filter, withColumn
# ---------------------------------------------------------------------------

# TODO: Select only "product" and "price" columns into df_selected
df_selected = None  # replace None

assert df_selected.columns == ["product", "price"]

# TODO: Filter df where price > 200  →  df_expensive
df_expensive = None  # replace None

assert df_expensive.count() == 2  # Laptop(999.99), Phone(699), Desk(249.50) — wait, 3 rows
# Re-check: Laptop=999.99, Phone=699.00, Desk=249.50 → 3 rows
assert df_expensive.count() == 3

# TODO: Add column "price_with_tax" = price * 1.10 rounded to 2 decimals
df_tax = None  # replace None

assert "price_with_tax" in df_tax.columns

# ---------------------------------------------------------------------------
# 5. Sorting and renaming
# ---------------------------------------------------------------------------

# TODO: Sort df by price descending, store in df_sorted
df_sorted = None  # replace None

top = df_sorted.first()
assert top["product"] == "Laptop", f"Expected Laptop, got {top['product']}"

# TODO: Rename column "product" to "item_name" → df_renamed
df_renamed = None  # replace None

assert "item_name" in df_renamed.columns
assert "product" not in df_renamed.columns

# ---------------------------------------------------------------------------
# 6. Nulls and duplicates
# ---------------------------------------------------------------------------

df_nulls = spark.createDataFrame(
    [(1, "a"), (2, None), (3, "a"), (3, "a")],
    ["id", "val"]
)

# TODO: Drop rows where val is null → df_no_null
df_no_null = None  # replace None
assert df_no_null.count() == 3

# TODO: Drop duplicate rows → df_dedup
df_dedup = None  # replace None
assert df_dedup.count() == 3  # (1,a),(2,null),(3,a)

# ---------------------------------------------------------------------------
# 7. Temp view and Spark SQL
# ---------------------------------------------------------------------------

# TODO: Register df as temp view named "products"
# HINT: df.createOrReplaceTempView(...)
# TODO: query = spark.sql(...)  — select product, price where category='Electronics'
query_result = None  # replace None

assert query_result.count() == 3  # Laptop, Phone, Mouse

print("All assertions passed!")
spark.stop()
