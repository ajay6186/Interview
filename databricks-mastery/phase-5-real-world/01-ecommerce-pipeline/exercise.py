# ============================================================================
# Exercise 5.1 — E-Commerce Pipeline
# ============================================================================
# Build a complete Bronze → Silver → Gold e-commerce pipeline with enrichment,
# aggregations, MERGE upserts, and data quality checks.
#
# Instructions: Replace every None / pass so all assertions pass.
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("ecommerce-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/ecomm_ex"
for p in ["bronze/orders","silver/orders","gold/revenue"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

raw_orders = spark.createDataFrame([
    ("ord_001","cust_01","prod_A","2","999.99","2024-01-10 09:00:00","completed"),
    ("ord_002","cust_02","prod_B","1","699.00","2024-01-10 10:00:00","completed"),
    ("ord_003","cust_01","prod_C","3","149.99","2024-01-11 14:00:00","refunded"),
    ("ord_004","cust_03","prod_A","1","999.99","2024-01-12 08:00:00","completed"),
    ("ord_005","cust_02","prod_D","2","349.00","2024-01-12 16:00:00","pending"),
    ("ord_001","cust_01","prod_A","2","999.99","2024-01-10 09:00:00","completed"),  # dup
], ["order_id","customer_id","product_id","qty_str","price_str","order_ts","status"])

products = spark.createDataFrame([
    ("prod_A","Laptop",     "Electronics"),
    ("prod_B","Phone",      "Electronics"),
    ("prod_C","Headphones", "Electronics"),
    ("prod_D","Office Chair","Furniture"),
], ["product_id","product_name","category"])

# ---------------------------------------------------------------------------
# 1. Bronze ingest — add _ingested_at and _source metadata columns, write to Delta
# ---------------------------------------------------------------------------
# TODO: Add _ingested_at = current_timestamp() and _source = "orders_api"
#       Write to f"{BASE}/bronze/orders" as delta, mode overwrite
#       Store row count in bronze_count

bronze_count = None  # replace

assert bronze_count == 6, f"Bronze should have 6 rows (raw, with dup), got {bronze_count}"
print(f"[1] bronze_count={bronze_count}")

# ---------------------------------------------------------------------------
# 2. Silver cleanse
# ---------------------------------------------------------------------------
# TODO: Read from bronze, then:
#   - dropDuplicates on order_id
#   - cast order_ts to timestamp (format: "yyyy-MM-dd HH:mm:ss")
#   - add order_date = to_date(order_ts)
#   - cast qty_str → int as quantity
#   - cast price_str → double as unit_price
#   - filter: customer_id not null, quantity > 0, unit_price > 0
#   - add line_total = round(unit_price * quantity, 2)
#   - drop qty_str, price_str, _ingested_at, _source
#   - write to f"{BASE}/silver/orders" as delta, mode overwrite
#   - store row count in silver_count

silver_count = None  # replace

assert silver_count == 5, f"Silver should have 5 unique rows, got {silver_count}"
print(f"[2] silver_count={silver_count}")

# ---------------------------------------------------------------------------
# 3. Enrich with product data
# ---------------------------------------------------------------------------
# TODO: Read silver/orders, join with products on product_id (left join)
#       Store enriched df in df_enriched
#       Verify "category" column is present

df_enriched = None  # replace

assert df_enriched is not None
assert "category" in df_enriched.columns, "category column must exist after join"
print(f"[3] enriched rows={df_enriched.count()}")

# ---------------------------------------------------------------------------
# 4. Gold — daily revenue for completed orders
# ---------------------------------------------------------------------------
# TODO: From df_enriched, filter status == "completed"
#       groupBy order_date
#       aggregate: revenue = sum(line_total), order_count = count(*),
#                  unique_customers = countDistinct(customer_id)
#       write to f"{BASE}/gold/revenue" as delta overwrite
#       store row count in gold_count

gold_count = None  # replace

assert gold_count >= 2, f"Gold should have at least 2 date rows, got {gold_count}"
print(f"[4] gold_count={gold_count}")

# ---------------------------------------------------------------------------
# 5. Customer LTV
# ---------------------------------------------------------------------------
# TODO: From df_enriched (completed orders only)
#       groupBy customer_id
#       aggregate: total_spend = sum(line_total), order_count = count(*)
#       add avg_order_value = round(total_spend / order_count, 2)
#       store in ltv_df

ltv_df = None  # replace

top_customer = ltv_df.orderBy(F.desc("total_spend")).first()
assert top_customer is not None
print(f"[5] top LTV customer: {top_customer['customer_id']} spend={top_customer['total_spend']}")

# ---------------------------------------------------------------------------
# 6. MERGE incremental orders into silver
# ---------------------------------------------------------------------------
new_orders = spark.createDataFrame([
    ("ord_006","cust_04","prod_B","1","699.00","2024-01-13 11:00:00","completed"),
    # ord_002 updated to shipped
    ("ord_002","cust_02","prod_B","1","699.00","2024-01-10 10:00:00","shipped"),
], ["order_id","customer_id","product_id","qty_str","price_str","order_ts","status"])

# TODO: Prepare new_silver from new_orders (same transforms as step 2):
#       cast order_ts, order_date, quantity, unit_price, line_total
#       (no need to re-deduplicate or filter here)
# TODO: MERGE new_silver into silver/orders
#       on order_id match: update all; no match: insert all
# TODO: Read silver back and store count in merged_count

merged_count = None  # replace

assert merged_count == 6, f"After MERGE: expected 6 rows (5 original + 1 new), got {merged_count}"
print(f"[6] merged_count={merged_count}")

# Verify ord_002 status was updated
ord_002_status = spark.read.format("delta").load(f"{BASE}/silver/orders") \
    .filter(F.col("order_id") == "ord_002").select("status").collect()[0][0]
assert ord_002_status == "shipped", f"ord_002 status should be 'shipped', got {ord_002_status}"
print(f"[6b] ord_002 status updated to: {ord_002_status}")

# ---------------------------------------------------------------------------
# 7. Time travel — read bronze version 0
# ---------------------------------------------------------------------------
# TODO: Read bronze/orders at versionAsOf=0
#       Store count in v0_count

v0_count = None  # replace

assert v0_count == 6, f"Bronze v0 should have 6 rows, got {v0_count}"
print(f"[7] bronze v0 count={v0_count}")

# ---------------------------------------------------------------------------
# 8. Data quality check
# ---------------------------------------------------------------------------
# TODO: implement run_dq(df, checks: dict) where:
#   - checks = {check_name: (condition_function, error_message)}
#   - condition_function takes df and returns True/False
#   - raises ValueError with failed check names if any fail
#   - returns True if all pass

def run_dq(df, checks: dict) -> bool:
    pass  # TODO

silver_df = spark.read.format("delta").load(f"{BASE}/silver/orders")
result = run_dq(silver_df, {
    "no_null_order_id":    (lambda df: df.filter(F.col("order_id").isNull()).count() == 0,
                            "Null order_id found"),
    "no_negative_qty":     (lambda df: df.filter(F.col("quantity") < 0).count() == 0,
                            "Negative quantity found"),
    "no_negative_price":   (lambda df: df.filter(F.col("unit_price") <= 0).count() == 0,
                            "Non-positive price found"),
})
assert result is True
print("[8] DQ checks passed")

print("\nAll assertions passed!")
spark.stop()
