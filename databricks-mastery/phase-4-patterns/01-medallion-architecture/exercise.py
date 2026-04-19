# ============================================================================
# Exercise 4.1 — Medallion Architecture (Bronze → Silver → Gold)
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("medallion-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE   = "/tmp/medal_ex"
BRONZE = f"{BASE}/bronze"
SILVER = f"{BASE}/silver"
GOLD   = f"{BASE}/gold"
for p in [BRONZE, SILVER, GOLD]:
    os.makedirs(p, exist_ok=True)

raw = spark.createDataFrame([
    ("ord_001","2024-01-10","alice@x.com","Widget","29.99","2"),
    ("ord_002","2024-01-11","bob@x.com","Gadget","49.00","1"),
    ("ord_003","bad_date","carol@x.com","Gizmo","15.00","3"),
    ("ord_004","2024-01-13",None,"Thing","9.99","1"),
    ("ord_001","2024-01-10","alice@x.com","Widget","29.99","2"),  # duplicate
], ["order_id","order_date","customer_email","product","price_str","qty_str"])

# ---------------------------------------------------------------------------
# 1. Bronze layer — write raw with metadata columns
# ---------------------------------------------------------------------------
# TODO: add _ingested_at (current_timestamp) and _source (lit("orders_v1"))
#       write as delta, mode overwrite, to BRONZE/orders
#       store count in bronze_count
bronze_count = None  # replace

assert bronze_count == 5, f"Expected 5 raw rows, got {bronze_count}"

# ---------------------------------------------------------------------------
# 2. Silver layer — cleanse, type-cast, deduplicate
# ---------------------------------------------------------------------------
# TODO: read from BRONZE/orders
#       dropDuplicates on order_id
#       cast order_date to date (yyyy-MM-dd), price_str → double, qty_str → int
#       filter: order_date not null, customer_email not null, price > 0
#       add total_amount = round(price * quantity, 2)
#       add _processed_at = current_timestamp
#       write as delta overwrite to SILVER/orders
#       store count in silver_count
silver_count = None  # replace

assert silver_count == 2, f"Expected 2 clean rows, got {silver_count}"

# ---------------------------------------------------------------------------
# 3. Silver quarantine — bad records
# ---------------------------------------------------------------------------
# TODO: read from BRONZE/orders
#       filter rows where order_date cast fails (to_date returns null)
#         OR customer_email is null
#       write to SILVER/quarantine (overwrite delta)
#       store count in bad_count
bad_count = None  # replace

assert bad_count == 2, f"Expected 2 bad rows (1 bad_date + 1 null_email), got {bad_count}"

# ---------------------------------------------------------------------------
# 4. Gold layer — daily revenue per product
# ---------------------------------------------------------------------------
# TODO: read SILVER/orders, groupBy order_date + product
#       aggregate: revenue = sum(total_amount), order_count = count(*)
#       write to GOLD/daily_revenue (overwrite delta)
#       store count in gold_count
gold_count = None  # replace

assert gold_count >= 1, "Gold must have at least one row"

# ---------------------------------------------------------------------------
# 5. Time travel — read bronze version 0
# ---------------------------------------------------------------------------
# TODO: read BRONZE/orders at versionAsOf 0
#       store count in v0_count
v0_count = None  # replace

assert v0_count == 5, f"Version 0 should have 5 rows, got {v0_count}"

# ---------------------------------------------------------------------------
# 6. GDPR delete from silver
# ---------------------------------------------------------------------------
# TODO: use DeltaTable.forPath on SILVER/orders
#       delete rows where customer_email == "alice@x.com"
#       read silver again, collect customer_email values into a list
remaining_emails = None  # replace with list of emails still in silver

assert "alice@x.com" not in (remaining_emails or []), "GDPR delete failed"

print("All assertions passed!")
spark.stop()
