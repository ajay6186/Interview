# ============================================================================
# Exercise 5.5 — Reporting Pipeline (Star Schema + BI)
# ============================================================================
# Build a star schema, run BI aggregations, window functions, and practice
# dimensional modeling patterns.
#
# Instructions: Replace every None / pass so all assertions pass.
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = (SparkSession.builder
    .appName("reporting-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/report_ex"
for p in ["dim/date","dim/product","fact/orders","gold/daily"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

raw_orders = spark.createDataFrame([
    ("o1","cust_A","p1","2024-01-10", 2, 999.99,"completed"),
    ("o2","cust_B","p2","2024-01-10", 1, 699.00,"completed"),
    ("o3","cust_A","p3","2024-01-11", 3, 149.99,"refunded"),
    ("o4","cust_C","p1","2024-01-12", 1, 999.99,"completed"),
    ("o5","cust_B","p2","2024-01-12", 2, 699.00,"completed"),
    ("o6","cust_D","p3","2024-01-13", 1, 149.99,"completed"),
    ("o7","cust_A","p2","2024-01-14", 1, 699.00,"completed"),
], ["order_id","customer_id","product_id","order_date","quantity","unit_price","status"])

raw_products = spark.createDataFrame([
    ("p1","Laptop",       "Electronics"),
    ("p2","Phone",        "Electronics"),
    ("p3","Headphones",   "Electronics"),
], ["product_id","product_name","category"])

# ---------------------------------------------------------------------------
# 1. Build dim_date (calendar dimension for 2024-01-10 to 2024-01-14)
# ---------------------------------------------------------------------------
# TODO: Generate dim_date using sequence from 2024-01-10 to 2024-01-14
#       Columns: date_key (int: yyyyMMdd), full_date, year, month, day_name, is_weekend
#       Write to f"{BASE}/dim/date" as delta overwrite
#       Store count in dim_date_count

dim_date_count = None  # replace

assert dim_date_count == 5, f"Expected 5 dates, got {dim_date_count}"
dd = spark.read.format("delta").load(f"{BASE}/dim/date")
assert "date_key" in dd.columns
assert "is_weekend" in dd.columns
print(f"[1] dim_date_count={dim_date_count}")

# ---------------------------------------------------------------------------
# 2. Build dim_product
# ---------------------------------------------------------------------------
# TODO: Add a product_key (monotonically_increasing_id) to raw_products
#       Write to f"{BASE}/dim/product" as delta overwrite
#       Store count in dim_product_count

dim_product_count = None  # replace

assert dim_product_count == 3
print(f"[2] dim_product_count={dim_product_count}")

# ---------------------------------------------------------------------------
# 3. Build fact_orders
# ---------------------------------------------------------------------------
# TODO: From raw_orders:
#   - cast order_date to date
#   - add date_key = date_format(order_date, "yyyyMMdd").cast("int")
#   - add line_total = round(unit_price * quantity, 2)
#   - add is_completed = (status == "completed").cast("int")
#   Write to f"{BASE}/fact/orders" as delta overwrite
#   Store count in fact_count

fact_count = None  # replace

assert fact_count == 7
fact_df = spark.read.format("delta").load(f"{BASE}/fact/orders")
assert "date_key" in fact_df.columns
assert "line_total" in fact_df.columns
print(f"[3] fact_count={fact_count}")

# ---------------------------------------------------------------------------
# 4. Star join — fact + all dimensions
# ---------------------------------------------------------------------------
# TODO: Join fact/orders with dim/product on product_id (left join)
#       and with dim/date on date_key (left join)
#       Store as star_df
#       Verify "category" and "day_name" columns exist

star_df = None  # replace

assert star_df is not None
assert "category" in star_df.columns
assert "day_name" in star_df.columns
print(f"[4] star rows={star_df.count()}")

# ---------------------------------------------------------------------------
# 5. Total completed revenue
# ---------------------------------------------------------------------------
# TODO: From star_df, filter completed orders, sum line_total → total_rev

total_rev = None  # replace

expected_rev = round(2*999.99 + 699.00 + 999.99 + 2*699.00 + 149.99 + 699.00, 2)
assert abs(total_rev - expected_rev) < 0.01, f"Expected {expected_rev}, got {total_rev}"
print(f"[5] total_rev={total_rev}")

# ---------------------------------------------------------------------------
# 6. Gold daily revenue table
# ---------------------------------------------------------------------------
# TODO: From star_df (completed only), groupBy order_date:
#       revenue=sum(line_total), orders=count(*), unique_customers=countDistinct(customer_id)
#       Write to f"{BASE}/gold/daily" as delta overwrite
#       Store count in gold_count

gold_count = None  # replace

assert gold_count >= 4, f"Expected >= 4 dates in gold, got {gold_count}"
print(f"[6] gold daily rows={gold_count}")

# ---------------------------------------------------------------------------
# 7. Running cumulative revenue (window function)
# ---------------------------------------------------------------------------
# TODO: From gold/daily, order by order_date, compute cum_revenue = running sum of revenue
#       Use Window.orderBy("order_date").rowsBetween(unboundedPreceding, currentRow)
#       Store as cum_df (must have "cum_revenue" column)

cum_df = None  # replace

assert "cum_revenue" in cum_df.columns
rows = cum_df.orderBy("order_date").collect()
for i in range(1, len(rows)):
    assert rows[i]["cum_revenue"] >= rows[i-1]["cum_revenue"], "cum_revenue must be non-decreasing"
print(f"[7] final cumulative_revenue={rows[-1]['cum_revenue']:.2f}")

# ---------------------------------------------------------------------------
# 8. Product ranking by category
# ---------------------------------------------------------------------------
# TODO: From star_df (completed), groupBy product_id + category → sum(line_total) as revenue
#       Add rank = dense_rank() over Window.partitionBy("category").orderBy(desc("revenue"))
#       Store as ranked_df (must have "rank" column)

ranked_df = None  # replace

assert "rank" in ranked_df.columns
top_electronics = ranked_df.filter((F.col("rank") == 1) & (F.col("category") == "Electronics")).first()
assert top_electronics is not None
print(f"[8] top Electronics product: {top_electronics['product_id']} rev={top_electronics['revenue']:.2f}")

# ---------------------------------------------------------------------------
# 9. Revenue by category pivot
# ---------------------------------------------------------------------------
# TODO: From star_df (completed), groupBy product_id and pivot on category
#       to get per-category revenue columns
#       fillna(0)
#       Store as pivot_df

pivot_df = None  # replace

assert pivot_df is not None
assert "Electronics" in pivot_df.columns or "Furniture" in pivot_df.columns
print(f"[9] pivot columns: {pivot_df.columns}")

# ---------------------------------------------------------------------------
# 10. Explain SCD2
# ---------------------------------------------------------------------------
# TODO: Set scd2_explanation to a string describing SCD Type 2.
#       Must contain "history" or "historical" (case-insensitive)
#       and "is_current" or "effective" (case-insensitive).

scd2_explanation = None  # replace

assert scd2_explanation is not None
lower = scd2_explanation.lower()
assert "histor" in lower, "Must mention history"
assert ("is_current" in lower or "effective" in lower), "Must mention is_current or effective"
print(f"[10] SCD2: {scd2_explanation[:80]}")

print("\nAll assertions passed!")
spark.stop()
