# ============================================================================
# Solution 5.5 — Reporting Pipeline (Star Schema + BI)
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("reporting-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/report_ex"
for p in ["dim/date","dim/product","fact/orders","gold/daily"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

raw_orders = spark.createDataFrame([
    ("o1","cust_A","p1","2024-01-10",2,999.99,"completed"),
    ("o2","cust_B","p2","2024-01-10",1,699.00,"completed"),
    ("o3","cust_A","p3","2024-01-11",3,149.99,"refunded"),
    ("o4","cust_C","p1","2024-01-12",1,999.99,"completed"),
    ("o5","cust_B","p2","2024-01-12",2,699.00,"completed"),
    ("o6","cust_D","p3","2024-01-13",1,149.99,"completed"),
    ("o7","cust_A","p2","2024-01-14",1,699.00,"completed"),
], ["order_id","customer_id","product_id","order_date","quantity","unit_price","status"])

raw_products = spark.createDataFrame([
    ("p1","Laptop",      "Electronics"),
    ("p2","Phone",       "Electronics"),
    ("p3","Headphones",  "Electronics"),
], ["product_id","product_name","category"])

# 1. dim_date
dim_date_df = (spark.sql("""
    SELECT explode(sequence(
        to_date('2024-01-10'), to_date('2024-01-14'), interval 1 day
    )) AS full_date
""")
.withColumn("date_key",   F.date_format("full_date","yyyyMMdd").cast("int"))
.withColumn("year",       F.year("full_date"))
.withColumn("month",      F.month("full_date"))
.withColumn("day_name",   F.date_format("full_date","EEEE"))
.withColumn("is_weekend", F.dayofweek("full_date").isin(1,7)))
dim_date_df.write.format("delta").mode("overwrite").save(f"{BASE}/dim/date")
dim_date_count = spark.read.format("delta").load(f"{BASE}/dim/date").count()
assert dim_date_count == 5
print(f"[1] dim_date_count={dim_date_count}")

# 2. dim_product
dim_product_df = raw_products.withColumn("product_key", F.monotonically_increasing_id())
dim_product_df.write.format("delta").mode("overwrite").save(f"{BASE}/dim/product")
dim_product_count = spark.read.format("delta").load(f"{BASE}/dim/product").count()
assert dim_product_count == 3
print(f"[2] dim_product_count={dim_product_count}")

# 3. fact_orders
fact_df = (raw_orders
    .withColumn("order_date",   F.to_date("order_date","yyyy-MM-dd"))
    .withColumn("date_key",     F.date_format("order_date","yyyyMMdd").cast("int"))
    .withColumn("line_total",   F.round(F.col("unit_price") * F.col("quantity"), 2))
    .withColumn("is_completed", (F.col("status") == "completed").cast("int")))
fact_df.write.format("delta").mode("overwrite").save(f"{BASE}/fact/orders")
fact_count = spark.read.format("delta").load(f"{BASE}/fact/orders").count()
assert fact_count == 7
print(f"[3] fact_count={fact_count}")

# 4. Star join
d_prod = spark.read.format("delta").load(f"{BASE}/dim/product")
d_date = spark.read.format("delta").load(f"{BASE}/dim/date")
fact   = spark.read.format("delta").load(f"{BASE}/fact/orders")
star_df = (fact
    .join(F.broadcast(d_prod.select("product_id","product_name","category")), "product_id","left")
    .join(d_date.select("date_key","day_name","is_weekend"), "date_key","left"))
assert "category" in star_df.columns
assert "day_name" in star_df.columns
print(f"[4] star rows={star_df.count()}")

# 5. Total completed revenue
total_rev = star_df.filter(F.col("status") == "completed") \
    .agg(F.round(F.sum("line_total"),2)).collect()[0][0]
expected_rev = round(2*999.99 + 699.00 + 999.99 + 2*699.00 + 149.99 + 699.00, 2)
assert abs(total_rev - expected_rev) < 0.01
print(f"[5] total_rev={total_rev}")

# 6. Gold daily revenue
gold_df = (star_df.filter(F.col("status") == "completed")
    .groupBy("order_date")
    .agg(F.round(F.sum("line_total"),2).alias("revenue"),
         F.count("*").alias("orders"),
         F.countDistinct("customer_id").alias("unique_customers")))
gold_df.write.format("delta").mode("overwrite").save(f"{BASE}/gold/daily")
gold_count = spark.read.format("delta").load(f"{BASE}/gold/daily").count()
assert gold_count >= 4
print(f"[6] gold_count={gold_count}")

# 7. Cumulative revenue
gold_loaded = spark.read.format("delta").load(f"{BASE}/gold/daily")
w_run = Window.orderBy("order_date").rowsBetween(Window.unboundedPreceding, Window.currentRow)
cum_df = gold_loaded.withColumn("cum_revenue", F.round(F.sum("revenue").over(w_run), 2))
assert "cum_revenue" in cum_df.columns
rows = cum_df.orderBy("order_date").collect()
for i in range(1, len(rows)):
    assert rows[i]["cum_revenue"] >= rows[i-1]["cum_revenue"]
print(f"[7] final cum_revenue={rows[-1]['cum_revenue']:.2f}")

# 8. Product ranking
prod_rev = (star_df.filter(F.col("status") == "completed")
    .groupBy("product_id","category")
    .agg(F.round(F.sum("line_total"),2).alias("revenue")))
w_rank = Window.partitionBy("category").orderBy(F.desc("revenue"))
ranked_df = prod_rev.withColumn("rank", F.dense_rank().over(w_rank))
assert "rank" in ranked_df.columns
top_elec = ranked_df.filter((F.col("rank") == 1) & (F.col("category") == "Electronics")).first()
assert top_elec is not None
print(f"[8] top Electronics: {top_elec['product_id']} rev={top_elec['revenue']:.2f}")

# 9. Category pivot
pivot_df = (star_df.filter(F.col("status") == "completed")
    .groupBy("product_id")
    .pivot("category")
    .agg(F.round(F.sum("line_total"),2))
    .fillna(0))
assert "Electronics" in pivot_df.columns or "Furniture" in pivot_df.columns
print(f"[9] pivot columns: {pivot_df.columns}")

# 10. SCD2 explanation
scd2_explanation = (
    "SCD Type 2 tracks the full historical changes of a dimension attribute. "
    "Each change inserts a new row with is_current=True and effective_from date, "
    "while the old row gets is_current=False and effective_to set to today."
)
lower = scd2_explanation.lower()
assert "histor" in lower
assert "is_current" in lower or "effective" in lower
print(f"[10] SCD2: {scd2_explanation[:80]}")

print("\nAll assertions passed!")
spark.stop()
