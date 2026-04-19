# ============================================================================
# Solution 1.2 — DataFrame Operations
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("df-operations-solution").getOrCreate()
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

# 1. Total sales per region
region_sales = sales.groupBy("region").agg(F.sum("amount").alias("total_sales"))
assert "total_sales" in region_sales.columns

# 2. Average per product ordered desc
product_avg = (sales.groupBy("product")
                    .agg(F.avg("amount").alias("avg_amount"))
                    .orderBy(F.col("avg_amount").desc()))
assert product_avg.columns == ["product", "avg_amount"]

# 3. Commission
df_commission = sales.withColumn("commission", F.round(F.col("amount") * 0.05, 2))
assert "commission" in df_commission.columns

# 4. Categorize
df_sized = sales.withColumn("sale_size",
    F.when(F.col("amount") >= 1000, "Large")
     .when(F.col("amount") >= 500,  "Medium")
     .otherwise("Small"))
assert "sale_size" in df_sized.columns

# 5. Date parts
df_dates = (sales
    .withColumn("date_col", F.to_date("sale_date", "yyyy-MM-dd"))
    .withColumn("yr", F.year("date_col"))
    .withColumn("mo", F.month("date_col")))
assert "yr" in df_dates.columns and "mo" in df_dates.columns

# 6. Pivot
df_pivot = sales.groupBy("rep").pivot("product").agg(F.sum("amount"))
assert "Laptop" in df_pivot.columns

# 7. Distinct products list
products_list = [r["product"] for r in sales.select("product").distinct().collect()]
assert set(products_list) == {"Laptop", "Phone", "Tablet"}

# 8. Top rep
top_rep = (sales.groupBy("rep")
                .agg(F.sum("amount").alias("total"))
                .orderBy(F.col("total").desc())
                .first()["rep"])
assert isinstance(top_rep, str)

print(f"Top sales rep: {top_rep}")
print("All assertions passed!")
spark.stop()
