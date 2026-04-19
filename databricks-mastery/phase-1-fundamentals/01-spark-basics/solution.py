# ============================================================================
# Solution 1.1 — Spark Basics
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("spark-basics-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# 1. Create DataFrame
data = [("Laptop", "Electronics", 999.99),
        ("Phone",  "Electronics", 699.00),
        ("Desk",   "Furniture",   249.50),
        ("Chair",  "Furniture",   149.00),
        ("Mouse",  "Electronics",  29.99)]

df = spark.createDataFrame(data, ["product", "category", "price"])

assert df.columns == ["product", "category", "price"]

# 2. Inspect
row_count = df.count()
col_names  = df.columns

assert row_count == 5
assert set(col_names) == {"product", "category", "price"}

# 3. Explicit schema
schema = StructType([
    StructField("id",   IntegerType(), nullable=False),
    StructField("item", StringType(),  nullable=True),
    StructField("qty",  IntegerType(), nullable=True),
])
orders_data = [(1, "Laptop", 2), (2, "Desk", 1), (3, None, 5)]
orders_df = spark.createDataFrame(orders_data, schema)

assert orders_df.schema["id"].nullable == False
assert orders_df.count() == 3

# 4. Select, filter, withColumn
df_selected = df.select("product", "price")
assert df_selected.columns == ["product", "price"]

df_expensive = df.filter(F.col("price") > 200)
assert df_expensive.count() == 3

df_tax = df.withColumn("price_with_tax", F.round(F.col("price") * 1.10, 2))
assert "price_with_tax" in df_tax.columns

# 5. Sorting and renaming
df_sorted = df.orderBy(F.col("price").desc())
top = df_sorted.first()
assert top["product"] == "Laptop"

df_renamed = df.withColumnRenamed("product", "item_name")
assert "item_name" in df_renamed.columns
assert "product" not in df_renamed.columns

# 6. Nulls and duplicates
df_nulls = spark.createDataFrame(
    [(1, "a"), (2, None), (3, "a"), (3, "a")],
    ["id", "val"]
)

df_no_null = df_nulls.na.drop(subset=["val"])
assert df_no_null.count() == 3

df_dedup = df_nulls.dropDuplicates()
assert df_dedup.count() == 3

# 7. Temp view + SQL
df.createOrReplaceTempView("products")
query_result = spark.sql("SELECT product, price FROM products WHERE category = 'Electronics'")
assert query_result.count() == 3

print("All assertions passed!")
spark.stop()
