# ============================================================================
# Solution 2.1 — Joins & Aggregations
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("joins-agg-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

customers = spark.createDataFrame([
    (1,"Alice","Gold"),(2,"Bob","Silver"),(3,"Carol","Gold"),
    (4,"Dave","Bronze"),(5,"Eve","Silver"),
], ["cust_id","name","tier"])

orders = spark.createDataFrame([
    (1001,1,250.0,"2024-01"),(1002,2,100.0,"2024-01"),
    (1003,1,500.0,"2024-02"),(1004,3,750.0,"2024-02"),
    (1005,1,300.0,"2024-03"),(1006,2,200.0,"2024-03"),
    (1007,4,150.0,"2024-03"),(1008,3,900.0,"2024-04"),
], ["order_id","cust_id","amount","month"])

products = spark.createDataFrame([
    (1001,"Laptop"),(1002,"Phone"),(1003,"Tablet"),
    (1004,"Laptop"),(1005,"Phone"),(1006,"Tablet"),
    (1007,"Mouse"),(1008,"Laptop"),
], ["order_id","product"])

# 1. Inner join
enriched = customers.join(orders, on="cust_id", how="inner")
assert "name" in enriched.columns and "amount" in enriched.columns

# 2. Left join → no orders
no_orders = customers.join(orders, on="cust_id", how="left").filter(F.col("order_id").isNull())
assert no_orders.count() == 1

# 3. Total spend
cust_spend = (orders.groupBy("cust_id")
                    .agg(F.sum("amount").alias("total_spend"))
                    .orderBy(F.col("total_spend").desc()))
assert cust_spend.first()["total_spend"] == 1050.0

# 4. Avg per tier
tier_avg = (customers.join(orders, on="cust_id")
                     .groupBy("tier")
                     .agg(F.avg("amount").alias("avg_order")))
assert "tier" in tier_avg.columns and "avg_order" in tier_avg.columns

# 5. Three-table join
full_orders = (customers.join(orders, on="cust_id")
                        .join(products, on="order_id")
                        .select("name","tier","amount","product"))
assert "product" in full_orders.columns

# 6. Monthly revenue
monthly_rev = (orders.groupBy("month")
                     .agg(F.sum("amount").alias("revenue"))
                     .orderBy("month"))
months = [r["month"] for r in monthly_rev.select("month").collect()]
assert months == sorted(months)

# 7. Pivot
pivot_df = orders.groupBy("cust_id").pivot("month").agg(F.sum("amount"))
assert "2024-01" in pivot_df.columns

# 8. Distinct products per customer
product_variety = (orders.join(products, on="order_id")
                         .groupBy("cust_id")
                         .agg(F.countDistinct("product").alias("unique_products")))
assert "unique_products" in product_variety.columns

print("All assertions passed!")
spark.stop()
