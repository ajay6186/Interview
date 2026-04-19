# ============================================================================
# Examples 5.1 — E-Commerce Pipeline  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# End-to-end e-commerce ETL: orders, customers, products → Bronze/Silver/Gold
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("ecommerce-pipeline")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/ecomm"
for p in ["bronze/orders","bronze/customers","bronze/products",
          "silver/orders","silver/customers","silver/products",
          "gold/revenue","gold/customer_segments","gold/funnel"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

# ── Raw data ──────────────────────────────────────────────────────────────────
raw_orders = spark.createDataFrame([
    ("ord_001","cust_01","prod_A","2","2024-01-10 09:00:00","completed"),
    ("ord_002","cust_02","prod_B","1","2024-01-10 10:30:00","completed"),
    ("ord_003","cust_01","prod_C","3","2024-01-11 14:00:00","refunded"),
    ("ord_004","cust_03","prod_A","1","2024-01-12 08:00:00","completed"),
    ("ord_005","cust_02","prod_D","2","2024-01-12 16:00:00","pending"),
    ("ord_001","cust_01","prod_A","2","2024-01-10 09:00:00","completed"),  # dup
], ["order_id","customer_id","product_id","quantity","order_ts","status"])

raw_customers = spark.createDataFrame([
    ("cust_01","Alice","alice@email.com","New York",  "2023-05-01","premium"),
    ("cust_02","Bob",  "bob@email.com",  "London",   "2023-08-15","standard"),
    ("cust_03","Carol","carol@email.com","New York",  "2024-01-05","standard"),
], ["customer_id","name","email","city","joined_date","tier"])

raw_products = spark.createDataFrame([
    ("prod_A","Laptop",      "Electronics",999.99),
    ("prod_B","Phone",       "Electronics",699.00),
    ("prod_C","Headphones",  "Electronics",149.99),
    ("prod_D","Office Chair","Furniture",  349.00),
], ["product_id","product_name","category","unit_price"])

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Bronze ingest — raw orders with metadata
df_b_orders = (raw_orders
    .withColumn("_ingested_at", F.current_timestamp())
    .withColumn("_source",      F.lit("orders_api_v2")))
df_b_orders.write.format("delta").mode("overwrite").save(f"{BASE}/bronze/orders")
print("Ex01 bronze orders:", df_b_orders.count())

# 2. Bronze ingest — customers
raw_customers \
    .withColumn("_ingested_at", F.current_timestamp()) \
    .write.format("delta").mode("overwrite").save(f"{BASE}/bronze/customers")
print("Ex02 bronze customers:", raw_customers.count())

# 3. Bronze ingest — products
raw_products \
    .withColumn("_ingested_at", F.current_timestamp()) \
    .write.format("delta").mode("overwrite").save(f"{BASE}/bronze/products")
print("Ex03 bronze products:", raw_products.count())

# 4. Show bronze schema
spark.read.format("delta").load(f"{BASE}/bronze/orders").printSchema()

# 5. Bronze row count check
b_count = spark.read.format("delta").load(f"{BASE}/bronze/orders").count()
print(f"Ex05 bronze orders count={b_count}")

# 6. Peek at bronze data
spark.read.format("delta").load(f"{BASE}/bronze/orders").show(3, truncate=False)

# 7. Check for duplicates in bronze
dup_count = (spark.read.format("delta").load(f"{BASE}/bronze/orders")
    .groupBy("order_id").count().filter(F.col("count") > 1).count())
print(f"Ex07 duplicate order_ids in bronze: {dup_count}")

# 8. Check for nulls in key columns
null_cust = (spark.read.format("delta").load(f"{BASE}/bronze/orders")
    .filter(F.col("customer_id").isNull()).count())
print(f"Ex08 orders with null customer_id: {null_cust}")

# 9. Bronze CDF for incremental silver
spark.sql(f"ALTER TABLE delta.`{BASE}/bronze/orders` SET TBLPROPERTIES ('delta.enableChangeDataFeed'='true')")
print("Ex09 CDF enabled on bronze orders")

# 10. Cast timestamp in bronze
df_ts = spark.read.format("delta").load(f"{BASE}/bronze/orders") \
    .withColumn("order_ts", F.to_timestamp("order_ts", "yyyy-MM-dd HH:mm:ss"))
df_ts.printSchema()
print("Ex10 timestamp cast ok")

# 11. Filter bronze for valid statuses
valid_statuses = {"completed", "pending", "refunded", "shipped"}
df_valid = spark.read.format("delta").load(f"{BASE}/bronze/orders") \
    .filter(F.col("status").isin(list(valid_statuses)))
print(f"Ex11 valid-status rows: {df_valid.count()}")

# 12. Add ingestion date partition key
df_part = spark.read.format("delta").load(f"{BASE}/bronze/orders") \
    .withColumn("ingest_date", F.to_date(F.col("_ingested_at")))
print(f"Ex12 ingest_date sample: {df_part.select('ingest_date').first()[0]}")

# 13. Summary stats on quantity
spark.read.format("delta").load(f"{BASE}/bronze/orders") \
    .selectExpr("cast(quantity as int) as qty") \
    .describe("qty").show()

# 14. Distinct products ordered
distinct_prods = spark.read.format("delta").load(f"{BASE}/bronze/orders") \
    .select("product_id").distinct().count()
print(f"Ex14 distinct products ordered: {distinct_prods}")

# 15. Count by status
spark.read.format("delta").load(f"{BASE}/bronze/orders") \
    .groupBy("status").count().show()

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Silver orders — cleanse + deduplicate + type cast
df_s_orders = (spark.read.format("delta").load(f"{BASE}/bronze/orders")
    .dropDuplicates(["order_id"])
    .withColumn("order_ts",  F.to_timestamp("order_ts", "yyyy-MM-dd HH:mm:ss"))
    .withColumn("order_date",F.to_date("order_ts"))
    .withColumn("quantity",  F.col("quantity").cast("int"))
    .filter(F.col("customer_id").isNotNull())
    .filter(F.col("quantity") > 0)
    .drop("_ingested_at","_source"))
df_s_orders.write.format("delta").mode("overwrite").save(f"{BASE}/silver/orders")
print(f"Ex16 silver orders: {df_s_orders.count()}")

# 17. Silver customers — cleanse + mask PII
df_s_cust = (spark.read.format("delta").load(f"{BASE}/bronze/customers")
    .drop("_ingested_at")
    .withColumn("joined_date", F.to_date("joined_date", "yyyy-MM-dd"))
    .withColumn("email_masked", F.regexp_replace("email", r"(?<=.).(?=.*@)", "*")))
df_s_cust.write.format("delta").mode("overwrite").save(f"{BASE}/silver/customers")
print(f"Ex17 silver customers: {df_s_cust.count()}")

# 18. Silver products — no cleaning needed, just rewrite
spark.read.format("delta").load(f"{BASE}/bronze/products").drop("_ingested_at") \
    .write.format("delta").mode("overwrite").save(f"{BASE}/silver/products")

# 19. Enrich silver orders with product prices
s_orders   = spark.read.format("delta").load(f"{BASE}/silver/orders")
s_products = spark.read.format("delta").load(f"{BASE}/silver/products")
df_enriched = (s_orders
    .join(s_products.select("product_id","unit_price","category"), "product_id", "left")
    .withColumn("line_total", F.round(F.col("unit_price") * F.col("quantity"), 2)))
df_enriched.show(3, truncate=False)
print(f"Ex19 enriched rows: {df_enriched.count()}")

# 20. Join with customers
s_cust = spark.read.format("delta").load(f"{BASE}/silver/customers")
df_full = df_enriched.join(s_cust.select("customer_id","name","city","tier"), "customer_id", "left")
print(f"Ex20 full-enriched rows: {df_full.count()}")

# 21. Filter completed orders only for revenue
df_completed = df_full.filter(F.col("status") == "completed")
print(f"Ex21 completed orders: {df_completed.count()}")

# 22. Daily revenue aggregation
gold_daily = (df_completed
    .groupBy("order_date")
    .agg(F.sum("line_total").alias("revenue"),
         F.count("*").alias("order_count"),
         F.countDistinct("customer_id").alias("unique_customers")))
gold_daily.orderBy("order_date").show()
print("Ex22 daily revenue calculated")

# 23. Revenue by product category
gold_cat = (df_completed
    .groupBy("category")
    .agg(F.sum("line_total").alias("revenue"),
         F.count("*").alias("orders"))
    .orderBy(F.desc("revenue")))
gold_cat.show()

# 24. Revenue by customer tier
gold_tier = (df_completed
    .groupBy("tier")
    .agg(F.sum("line_total").alias("revenue"),
         F.countDistinct("customer_id").alias("customers")))
gold_tier.show()

# 25. Top products by units sold
top_products = (df_completed
    .groupBy("product_id","product_name" if "product_name" in df_completed.columns else "product_id")
    .agg(F.sum("quantity").alias("units_sold"))
    .orderBy(F.desc("units_sold")))
top_products.show()

# 26. Customer LTV (lifetime value)
clv = (df_completed
    .groupBy("customer_id","name","tier")
    .agg(F.sum("line_total").alias("total_spend"),
         F.count("*").alias("order_count"),
         F.min("order_date").alias("first_order"),
         F.max("order_date").alias("last_order")))
clv.show()
print("Ex26 CLV calculated")

# 27. Average order value per customer
clv_with_aov = clv.withColumn("avg_order_value",
    F.round(F.col("total_spend") / F.col("order_count"), 2))
clv_with_aov.show()

# 28. Repeat vs one-time customers
clv_seg = clv.withColumn("segment",
    F.when(F.col("order_count") >= 2, "repeat").otherwise("one-time"))
clv_seg.groupBy("segment").count().show()

# 29. Status funnel analysis
funnel = (spark.read.format("delta").load(f"{BASE}/silver/orders")
    .groupBy("status")
    .count()
    .withColumn("pct", F.round(F.col("count") / F.sum("count").over(Window.partitionBy()) * 100, 1)))
funnel.show()
print("Ex29 funnel done")

# 30. Write gold tables
gold_daily.write.format("delta").mode("overwrite").save(f"{BASE}/gold/revenue")
clv.write.format("delta").mode("overwrite").save(f"{BASE}/gold/customer_segments")
print("Ex30 gold tables written")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. Customer segmentation (RFM-style)
rfm = (df_completed
    .groupBy("customer_id")
    .agg(
        F.max("order_date").alias("last_order"),
        F.count("*").alias("frequency"),
        F.sum("line_total").alias("monetary")
    )
    .withColumn("recency_days",
        F.datediff(F.lit("2024-01-15").cast("date"), F.col("last_order")))
    .withColumn("segment",
        F.when((F.col("frequency") >= 2) & (F.col("monetary") >= 1000), "VIP")
         .when(F.col("frequency") >= 2, "Loyal")
         .when(F.col("recency_days") <= 30, "Recent")
         .otherwise("At-Risk")))
rfm.show()
print("Ex31 RFM segmentation done")

# 32. Window function — running revenue
w_ord = Window.orderBy("order_date").rowsBetween(Window.unboundedPreceding, Window.currentRow)
gold_daily_loaded = spark.read.format("delta").load(f"{BASE}/gold/revenue")
gold_running = gold_daily_loaded.withColumn("cumulative_revenue", F.sum("revenue").over(w_ord))
gold_running.show()

# 33. Day-over-day revenue growth
w_lag = Window.orderBy("order_date")
gold_growth = gold_daily_loaded \
    .withColumn("prev_revenue", F.lag("revenue", 1).over(w_lag)) \
    .withColumn("revenue_growth_pct",
        F.when(F.col("prev_revenue").isNotNull(),
               F.round((F.col("revenue") - F.col("prev_revenue")) / F.col("prev_revenue") * 100, 1)))
gold_growth.show()

# 34. Product cross-sell (customers who bought A also bought...)
pairs = (df_completed.select("customer_id","product_id")
    .join(df_completed.select(
        F.col("customer_id").alias("cid2"),
        F.col("product_id").alias("product_id2")
    ), F.col("customer_id") == F.col("cid2"))
    .filter(F.col("product_id") < F.col("product_id2"))
    .groupBy("product_id","product_id2")
    .count()
    .orderBy(F.desc("count")))
pairs.show()
print("Ex34 cross-sell pairs done")

# 35. Refund rate per product
refund_rate = (spark.read.format("delta").load(f"{BASE}/silver/orders")
    .groupBy("product_id")
    .agg(
        F.count("*").alias("total_orders"),
        F.sum(F.when(F.col("status") == "refunded", 1).otherwise(0)).alias("refunds")
    )
    .withColumn("refund_rate_pct", F.round(F.col("refunds") / F.col("total_orders") * 100, 1)))
refund_rate.show()

# 36. Cart abandonment proxy (pending → no completion)
pending_no_complete = (spark.read.format("delta").load(f"{BASE}/silver/orders")
    .filter(F.col("status").isin("pending"))
    .join(
        spark.read.format("delta").load(f"{BASE}/silver/orders")
            .filter(F.col("status") == "completed")
            .select(F.col("customer_id").alias("cid")),
        F.col("customer_id") == F.col("cid"), "left_anti"
    ))
print(f"Ex36 potential cart abandonment (pending, no complete): {pending_no_complete.count()}")

# 37. First-purchase cohort analysis
first_orders = (df_completed
    .groupBy("customer_id")
    .agg(F.min("order_date").alias("cohort_month"))
    .withColumn("cohort_month", F.date_format("cohort_month", "yyyy-MM")))
cohort_counts = first_orders.groupBy("cohort_month").count().orderBy("cohort_month")
cohort_counts.show()
print("Ex37 cohort analysis done")

# 38. MERGE incremental orders into silver
new_orders = spark.createDataFrame([
    ("ord_006","cust_01","prod_B","1","2024-01-13 11:00:00","completed"),
], ["order_id","customer_id","product_id","quantity","order_ts","status"])

new_silver = (new_orders
    .withColumn("order_ts",  F.to_timestamp("order_ts", "yyyy-MM-dd HH:mm:ss"))
    .withColumn("order_date",F.to_date("order_ts"))
    .withColumn("quantity",  F.col("quantity").cast("int")))

DeltaTable.forPath(spark, f"{BASE}/silver/orders").alias("t") \
    .merge(new_silver.alias("s"), "t.order_id = s.order_id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .execute()
print(f"Ex38 after MERGE silver orders: {spark.read.format('delta').load(f'{BASE}/silver/orders').count()}")

# 39. Time travel — revenue snapshot
v0_orders = spark.read.format("delta").option("versionAsOf", 0).load(f"{BASE}/silver/orders")
print(f"Ex39 silver orders at version 0: {v0_orders.count()}")

# 40. Schema enforcement — reject extra columns
try:
    bad = spark.createDataFrame([("ord_999","cust_01","prod_A","1","2024-01-14 09:00:00","completed","EXTRA")],
                                 ["order_id","customer_id","product_id","quantity","order_ts","status","extra_col"])
    bad.write.format("delta").mode("append").save(f"{BASE}/silver/orders")
    print("Ex40 write succeeded (Delta mergeSchema=false would block this without schema opt-in)")
except Exception as e:
    print(f"Ex40 schema enforcement blocked write: {type(e).__name__}")

# 41. Optimize + Z-order gold table
spark.sql(f"OPTIMIZE delta.`{BASE}/gold/revenue` ZORDER BY (order_date)")
print("Ex41 OPTIMIZE + ZORDER on gold/revenue done")

# 42. Vacuum to remove old files
spark.sql(f"VACUUM delta.`{BASE}/gold/revenue` RETAIN 168 HOURS")
print("Ex42 VACUUM complete")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Data quality checks before gold write
def run_dq_checks(df, label: str) -> bool:
    checks = {
        "no_nulls_order_id":   df.filter(F.col("order_id").isNull()).count() == 0,
        "no_negative_qty":     df.filter(F.col("quantity") < 0).count()  == 0,
        "completed_status":    df.filter(~F.col("status").isin("completed","pending","refunded")).count() == 0,
    }
    failed = [k for k, v in checks.items() if not v]
    if failed:
        raise ValueError(f"DQ failed for {label}: {failed}")
    print(f"Ex43 DQ passed for {label}: {list(checks.keys())}")
    return True

run_dq_checks(spark.read.format("delta").load(f"{BASE}/silver/orders"), "silver/orders")

# 44. Idempotent gold write (overwrite partition)
print("Ex44 Idempotent: partitionBy('order_date').mode('overwrite') with replaceWhere='order_date=2024-01-10'")
gold_daily.filter(F.col("order_date") == "2024-01-10") \
    .write.format("delta").mode("overwrite") \
    .option("replaceWhere", "order_date = '2024-01-10'") \
    .save(f"{BASE}/gold/revenue")
print("Ex44 idempotent partition overwrite done")

# 45. Structured streaming mini-batch simulation
print("""Ex45 Streaming orders pipeline:
spark.readStream.format('cloudFiles')
    .option('cloudFiles.format','json').load('/landing/orders/')
    .writeStream.format('delta').outputMode('append')
    .option('checkpointLocation','/ckpt/orders')
    .trigger(processingTime='5 minutes')
    .start('/bronze/orders')
""")

# 46. SCD Type 2 for customer changes
print("""Ex46 SCD2 customer updates:
new_rows = staged_updates \\
    .withColumn('is_current', lit(True)) \\
    .withColumn('effective_from', current_date())
# Expire old rows: UPDATE silver.customers SET is_current=False, effective_to=today
# WHERE customer_id IN (changed_ids) AND is_current=True
# Then INSERT new rows
""")

# 47. Revenue anomaly detection (simple z-score)
mean_rev = gold_daily_loaded.agg(F.mean("revenue")).collect()[0][0]
std_rev  = gold_daily_loaded.agg(F.stddev("revenue")).collect()[0][0]
if std_rev and std_rev > 0:
    anomalies = gold_daily_loaded.filter(
        F.abs(F.col("revenue") - mean_rev) > 2 * std_rev
    )
    print(f"Ex47 revenue anomalies (>2σ): {anomalies.count()}")
else:
    print("Ex47 not enough variance to detect anomalies")

# 48. Pipeline manifest / run log
run_log = spark.createDataFrame([
    ("2024-01-15", "ecommerce_etl", "bronze_ingest", "SUCCESS", b_count, 12.3),
    ("2024-01-15", "ecommerce_etl", "silver_cleanse","SUCCESS", df_s_orders.count(), 8.1),
    ("2024-01-15", "ecommerce_etl", "gold_agg",      "SUCCESS", gold_daily.count(), 3.4),
], ["run_date","pipeline","stage","status","rows_out","duration_sec"])
run_log.show()
print("Ex48 run log written")

# 49. Delta table history
hist = spark.sql(f"DESCRIBE HISTORY delta.`{BASE}/silver/orders`")
hist.select("version","timestamp","operation","operationMetrics").show(5, truncate=False)

# 50. Full pipeline orchestration summary
print("""Ex50 Full E-Commerce Pipeline:
  Bronze:  orders (raw+dup) → customers → products       [append-only, CDF enabled]
  Silver:  deduplicate, type-cast, null-filter, PII-mask  [MERGE incremental]
  Gold:    daily_revenue, customer_ltv, rfm_segments       [replaceWhere idempotent]
  Checks:  DQ assertions before gold write                 [block bad data]
  SCD2:    customer dimension with history                 [audit compliant]
  Streaming: Auto Loader → bronze → streaming silver       [always fresh]
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
