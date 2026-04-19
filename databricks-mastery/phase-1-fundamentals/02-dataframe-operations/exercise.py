# ============================================================================
# Exercise 1.2 — DataFrame Operations
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("df-operations-exercise").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

sales = spark.createDataFrame([
    (1, "Alice",   "North", "Laptop",  1200.0, "2024-01-10"),
    (2, "Bob",     "South", "Phone",    800.0, "2024-01-15"),
    (3, "Alice",   "North", "Tablet",   450.0, "2024-02-01"),
    (4, "Carol",   "East",  "Laptop",  1100.0, "2024-02-10"),
    (5, "Bob",     "South", "Laptop",  1300.0, "2024-03-05"),
    (6, "Carol",   "East",  "Phone",    750.0, "2024-03-20"),
    (7, "Alice",   "North", "Tablet",   500.0, "2024-04-01"),
    (8, "Dave",    "West",  "Phone",    820.0, "2024-04-15"),
], ["id","rep","region","product","amount","sale_date"])

# ---------------------------------------------------------------------------
# 1. Total sales per region
# ---------------------------------------------------------------------------
# TODO: Group by region, sum amount, alias as "total_sales" → region_sales
region_sales = None  # replace None

assert region_sales is not None
assert "total_sales" in region_sales.columns

# ---------------------------------------------------------------------------
# 2. Average amount per product, ordered descending
# ---------------------------------------------------------------------------
# TODO: groupBy product, avg amount alias "avg_amount", orderBy desc → product_avg
product_avg = None  # replace None

assert product_avg.columns == ["product", "avg_amount"]

# ---------------------------------------------------------------------------
# 3. Add commission column (5% of amount) rounded to 2 decimals
# ---------------------------------------------------------------------------
# TODO: withColumn "commission" → df_commission
df_commission = None  # replace None

assert "commission" in df_commission.columns

# ---------------------------------------------------------------------------
# 4. Categorize sale size: >= 1000 → "Large", >= 500 → "Medium", else "Small"
# ---------------------------------------------------------------------------
# TODO: withColumn "sale_size" using F.when / F.otherwise → df_sized
df_sized = None  # replace None

assert "sale_size" in df_sized.columns

# ---------------------------------------------------------------------------
# 5. Extract year and month from sale_date
# ---------------------------------------------------------------------------
# TODO: Convert sale_date string to date column, then extract year as "yr" and month as "mo"
df_dates = None  # replace None

assert "yr" in df_dates.columns
assert "mo" in df_dates.columns

# ---------------------------------------------------------------------------
# 6. Pivot: total sales per rep per product
# ---------------------------------------------------------------------------
# TODO: pivot on product, sum amount → df_pivot
df_pivot = None  # replace None

assert "Laptop" in df_pivot.columns or "Phone" in df_pivot.columns

# ---------------------------------------------------------------------------
# 7. Collect distinct products as a Python list
# ---------------------------------------------------------------------------
# TODO: products_list should be a Python list of distinct product names
products_list = None  # replace None

assert isinstance(products_list, list)
assert set(products_list) == {"Laptop", "Phone", "Tablet"}

# ---------------------------------------------------------------------------
# 8. Top sales rep by total amount
# ---------------------------------------------------------------------------
# TODO: Group by rep, sum amount, order desc, get first row's rep name → top_rep (str)
top_rep = None  # replace None

assert isinstance(top_rep, str)

print(f"Top sales rep: {top_rep}")
print("All assertions passed!")
spark.stop()
