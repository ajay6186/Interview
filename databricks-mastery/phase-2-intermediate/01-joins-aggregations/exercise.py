# ============================================================================
# Exercise 2.1 — Joins & Aggregations
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("joins-agg-exercise").getOrCreate()
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

# ---------------------------------------------------------------------------
# 1. INNER JOIN customers + orders → enriched orders with customer name and tier
# ---------------------------------------------------------------------------
# TODO: enriched = join customers and orders on cust_id (inner)
enriched = None  # replace None

assert "name" in enriched.columns and "amount" in enriched.columns

# ---------------------------------------------------------------------------
# 2. LEFT JOIN to find customers with NO orders
# ---------------------------------------------------------------------------
# TODO: no_orders = customers left-joined with orders, filter where order_id IS NULL
no_orders = None  # replace None

assert no_orders.count() == 1  # Eve has no orders

# ---------------------------------------------------------------------------
# 3. Total spend per customer, ordered descending
# ---------------------------------------------------------------------------
# TODO: cust_spend = groupBy cust_id, sum amount alias "total_spend", orderBy desc
cust_spend = None  # replace None

top = cust_spend.first()
assert top["total_spend"] == 1050.0  # Alice: 250+500+300

# ---------------------------------------------------------------------------
# 4. Average order value per tier (join customers+orders first)
# ---------------------------------------------------------------------------
# TODO: tier_avg = join then groupBy tier, avg amount alias "avg_order"
tier_avg = None  # replace None

assert "tier" in tier_avg.columns
assert "avg_order" in tier_avg.columns

# ---------------------------------------------------------------------------
# 5. Three-table join: customers + orders + products
# ---------------------------------------------------------------------------
# TODO: full_orders = join all three tables, keep: name, tier, amount, product
full_orders = None  # replace None

assert "product" in full_orders.columns

# ---------------------------------------------------------------------------
# 6. Monthly revenue (groupBy month, sum amount, orderBy month)
# ---------------------------------------------------------------------------
# TODO: monthly_rev = groupBy month, sum amount alias "revenue", orderBy month
monthly_rev = None  # replace None

months = [r["month"] for r in monthly_rev.select("month").collect()]
assert months == sorted(months)

# ---------------------------------------------------------------------------
# 7. Pivot: total amount per customer per month
# ---------------------------------------------------------------------------
# TODO: pivot_df = groupBy cust_id, pivot month, sum amount
pivot_df = None  # replace None

assert "2024-01" in pivot_df.columns or "2024-02" in pivot_df.columns

# ---------------------------------------------------------------------------
# 8. Count distinct products purchased per customer
# ---------------------------------------------------------------------------
# TODO: product_variety = join orders+products, groupBy cust_id, countDistinct product
product_variety = None  # replace None

assert "unique_products" in product_variety.columns

print("All assertions passed!")
spark.stop()
