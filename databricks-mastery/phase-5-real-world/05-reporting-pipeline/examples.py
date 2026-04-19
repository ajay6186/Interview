# ============================================================================
# Examples 5.5 — Reporting Pipeline (Star Schema + BI)  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: dimensional modeling, fact/dim tables, SCD2, BI aggregations
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("reporting-pipeline")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/reporting"
for p in ["dim/date","dim/customer","dim/product","dim/location",
          "fact/orders","fact/events","gold/daily_sales","gold/monthly_kpi"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

# ── Source data ───────────────────────────────────────────────────────────────
raw_orders = spark.createDataFrame([
    ("ord_001","cust_01","prod_A","loc_NY","2024-01-10",  2, 999.99, "completed"),
    ("ord_002","cust_02","prod_B","loc_LN","2024-01-10",  1, 699.00, "completed"),
    ("ord_003","cust_01","prod_C","loc_NY","2024-01-11",  3, 149.99, "refunded"),
    ("ord_004","cust_03","prod_A","loc_TK","2024-01-12",  1, 999.99, "completed"),
    ("ord_005","cust_02","prod_D","loc_LN","2024-01-12",  2, 349.00, "pending"),
    ("ord_006","cust_04","prod_B","loc_NY","2024-01-13",  1, 699.00, "completed"),
    ("ord_007","cust_01","prod_D","loc_NY","2024-01-14",  1, 349.00, "completed"),
    ("ord_008","cust_03","prod_C","loc_TK","2024-01-15",  2, 149.99, "completed"),
], ["order_id","customer_id","product_id","location_id","order_date","quantity","unit_price","status"])

raw_customers = spark.createDataFrame([
    ("cust_01","Alice","premium","female",35,"alice@email.com"),
    ("cust_02","Bob",  "standard","male",  28,"bob@email.com"),
    ("cust_03","Carol","premium","female",42,"carol@email.com"),
    ("cust_04","Dave", "gold",   "male",  55,"dave@email.com"),
], ["customer_id","name","tier","gender","age","email"])

raw_products = spark.createDataFrame([
    ("prod_A","Laptop",      "Electronics","Apple",  999.99),
    ("prod_B","Phone",       "Electronics","Samsung",699.00),
    ("prod_C","Headphones",  "Electronics","Sony",   149.99),
    ("prod_D","Office Chair","Furniture",  "Herman Miller",349.00),
], ["product_id","product_name","category","brand","unit_price"])

raw_locations = spark.createDataFrame([
    ("loc_NY","New York","NY","USA","North America"),
    ("loc_LN","London",  "ENG","UK","Europe"),
    ("loc_TK","Tokyo",   "TKY","JP","Asia Pacific"),
], ["location_id","city","region","country","continent"])

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Star schema concept
print("""Ex01 Star Schema:
  fact_orders (central)
    → dim_customer  (customer_id FK)
    → dim_product   (product_id FK)
    → dim_date      (date_key FK)
    → dim_location  (location_id FK)
Benefits: simple joins, fast BI queries, human-readable
""")

# 2. Build dim_date (calendar dimension)
date_range = spark.sql("""
    SELECT explode(sequence(
        to_date('2024-01-01'), to_date('2024-12-31'), interval 1 day
    )) AS full_date
""")
dim_date = (date_range
    .withColumn("date_key",       F.date_format("full_date","yyyyMMdd").cast("int"))
    .withColumn("year",           F.year("full_date"))
    .withColumn("quarter",        F.quarter("full_date"))
    .withColumn("month",          F.month("full_date"))
    .withColumn("month_name",     F.date_format("full_date","MMMM"))
    .withColumn("week_of_year",   F.weekofyear("full_date"))
    .withColumn("day_of_week",    F.dayofweek("full_date"))
    .withColumn("day_name",       F.date_format("full_date","EEEE"))
    .withColumn("is_weekend",     F.dayofweek("full_date").isin(1,7))
    .withColumn("is_holiday",     F.lit(False)))  # populate separately

dim_date.write.format("delta").mode("overwrite").save(f"{BASE}/dim/date")
print(f"Ex02 dim_date rows: {dim_date.count()}")
dim_date.show(3)

# 3. Build dim_customer (Type 1 — overwrite on change)
dim_customer = (raw_customers
    .withColumn("customer_key", F.monotonically_increasing_id())
    .withColumn("_created_at",  F.current_timestamp()))
dim_customer.write.format("delta").mode("overwrite").save(f"{BASE}/dim/customer")
print("Ex03 dim_customer written:", dim_customer.count())

# 4. Build dim_product
dim_product = (raw_products
    .withColumn("product_key",  F.monotonically_increasing_id())
    .withColumn("is_current",   F.lit(True))
    .withColumn("effective_from",F.lit("2024-01-01").cast("date"))
    .withColumn("effective_to",  F.lit("9999-12-31").cast("date")))
dim_product.write.format("delta").mode("overwrite").save(f"{BASE}/dim/product")
print("Ex04 dim_product written:", dim_product.count())

# 5. Build dim_location
dim_location = raw_locations.withColumn("location_key", F.monotonically_increasing_id())
dim_location.write.format("delta").mode("overwrite").save(f"{BASE}/dim/location")
print("Ex05 dim_location written:", dim_location.count())

# 6. Build fact_orders (computed measures)
fact_orders = (raw_orders
    .withColumn("order_date",   F.to_date("order_date","yyyy-MM-dd"))
    .withColumn("date_key",     F.date_format("order_date","yyyyMMdd").cast("int"))
    .withColumn("line_total",   F.round(F.col("unit_price") * F.col("quantity"), 2))
    .withColumn("is_completed", (F.col("status") == "completed").cast("int"))
    .withColumn("is_refunded",  (F.col("status") == "refunded").cast("int"))
    .withColumn("_loaded_at",   F.current_timestamp()))

fact_orders.write.format("delta").mode("overwrite").save(f"{BASE}/fact/orders")
print("Ex06 fact_orders written:", fact_orders.count())
fact_orders.show(3, truncate=False)

# 7. Fact table schema
fact_orders.printSchema()

# 8. Validate referential integrity (fact → dim)
cust_ids_dim  = spark.read.format("delta").load(f"{BASE}/dim/customer").select("customer_id")
orphan_custs  = fact_orders.join(cust_ids_dim, "customer_id", "left_anti")
print(f"Ex08 orphan customers in fact: {orphan_custs.count()}")

# 9. Basic measures — total revenue
total_rev = fact_orders.filter(F.col("status") == "completed") \
    .agg(F.sum("line_total")).collect()[0][0]
print(f"Ex09 total completed revenue: {round(total_rev, 2)}")

# 10. Count measures
completed = fact_orders.filter(F.col("status") == "completed").count()
total      = fact_orders.count()
print(f"Ex10 completed={completed}/{total}  completion_rate={round(completed/total*100,1)}%")

# 11. Join fact with dim_date
fact_with_date = fact_orders.join(
    spark.read.format("delta").load(f"{BASE}/dim/date").select("date_key","month_name","is_weekend","quarter"),
    "date_key", "left"
)
fact_with_date.select("order_id","order_date","month_name","is_weekend").show(5)

# 12. Star join — all dimensions
d_cust = spark.read.format("delta").load(f"{BASE}/dim/customer")
d_prod = spark.read.format("delta").load(f"{BASE}/dim/product")
d_loc  = spark.read.format("delta").load(f"{BASE}/dim/location")
d_date = spark.read.format("delta").load(f"{BASE}/dim/date")

star = (fact_orders
    .join(F.broadcast(d_cust.select("customer_id","name","tier")), "customer_id","left")
    .join(F.broadcast(d_prod.select("product_id","product_name","category")), "product_id","left")
    .join(F.broadcast(d_loc.select("location_id","city","continent")), "location_id","left")
    .join(d_date.select("date_key","month_name","quarter","is_weekend"), "date_key","left"))
star.show(3, truncate=False)
print("Ex12 star join done")

# 13. Broadcast joins for small dimensions
print("Ex13 F.broadcast(dim_table) — tells Spark to broadcast small dim (<200MB) to all executors")

# 14. Sales by category
star.filter(F.col("status") == "completed") \
    .groupBy("category").agg(F.sum("line_total").alias("revenue")).orderBy(F.desc("revenue")).show()

# 15. Sales by location
star.filter(F.col("status") == "completed") \
    .groupBy("city","continent").agg(F.sum("line_total").alias("revenue")).orderBy(F.desc("revenue")).show()

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Daily sales gold table
gold_daily = (star.filter(F.col("status") == "completed")
    .groupBy("order_date","month_name","quarter")
    .agg(
        F.sum("line_total").alias("revenue"),
        F.count("*").alias("order_count"),
        F.countDistinct("customer_id").alias("unique_customers"),
        F.sum("quantity").alias("units_sold"),
        F.avg("line_total").alias("avg_order_value"),
    )
    .orderBy("order_date"))
gold_daily.write.format("delta").mode("overwrite").save(f"{BASE}/gold/daily_sales")
gold_daily.show()
print("Ex16 gold daily_sales written")

# 17. Monthly KPI table
gold_monthly = (star.filter(F.col("status") == "completed")
    .groupBy("quarter","month_name",
             F.date_format("order_date","yyyy-MM").alias("year_month"))
    .agg(
        F.sum("line_total").alias("revenue"),
        F.count("*").alias("orders"),
        F.countDistinct("customer_id").alias("active_customers"),
        F.sum("quantity").alias("units"),
    )
    .orderBy("year_month"))
gold_monthly.write.format("delta").mode("overwrite").save(f"{BASE}/gold/monthly_kpi")
gold_monthly.show()
print("Ex17 gold monthly_kpi written")

# 18. Week-over-week growth
w_lag = Window.orderBy("order_date")
gold_daily_loaded = spark.read.format("delta").load(f"{BASE}/gold/daily_sales")
dow = gold_daily_loaded \
    .withColumn("prev_rev", F.lag("revenue",7).over(w_lag)) \
    .withColumn("wow_pct",
        F.when(F.col("prev_rev").isNotNull() & (F.col("prev_rev") > 0),
               F.round((F.col("revenue") - F.col("prev_rev")) / F.col("prev_rev") * 100, 1)))
dow.select("order_date","revenue","wow_pct").show()
print("Ex18 WoW growth done")

# 19. Running total (cumulative revenue)
w_run = Window.orderBy("order_date").rowsBetween(Window.unboundedPreceding, Window.currentRow)
gold_cum = gold_daily_loaded.withColumn("cum_revenue", F.round(F.sum("revenue").over(w_run), 2))
gold_cum.select("order_date","revenue","cum_revenue").show()

# 20. Moving average (7-day)
w_ma = Window.orderBy("order_date").rowsBetween(-6, Window.currentRow)
gold_ma = gold_daily_loaded.withColumn("rev_7d_avg", F.round(F.avg("revenue").over(w_ma), 2))
gold_ma.select("order_date","revenue","rev_7d_avg").show()
print("Ex20 7-day moving avg done")

# 21. Rank products by revenue (dense_rank)
prod_rev = (star.filter(F.col("status") == "completed")
    .groupBy("product_id","product_name","category")
    .agg(F.sum("line_total").alias("revenue")))
w_rank = Window.partitionBy("category").orderBy(F.desc("revenue"))
prod_ranked = prod_rev.withColumn("rank_in_category", F.dense_rank().over(w_rank))
prod_ranked.orderBy("category","rank_in_category").show()
print("Ex21 product ranking done")

# 22. Cohort retention analysis
first_purchase = (star.filter(F.col("status") == "completed")
    .groupBy("customer_id")
    .agg(F.date_format(F.min("order_date"), "yyyy-MM").alias("cohort_month")))

orders_with_cohort = star.filter(F.col("status") == "completed") \
    .join(first_purchase, "customer_id") \
    .withColumn("order_month", F.date_format("order_date","yyyy-MM"))

retention = (orders_with_cohort
    .groupBy("cohort_month","order_month")
    .agg(F.countDistinct("customer_id").alias("active"))
    .orderBy("cohort_month","order_month"))
retention.show()
print("Ex22 cohort retention done")

# 23. Pareto analysis (80/20 rule)
total_revenue = star.filter(F.col("status") == "completed") \
    .agg(F.sum("line_total")).collect()[0][0]

cust_rev = (star.filter(F.col("status") == "completed")
    .groupBy("customer_id","name")
    .agg(F.sum("line_total").alias("rev"))
    .orderBy(F.desc("rev")))

w_cumrev = Window.orderBy(F.desc("rev")).rowsBetween(Window.unboundedPreceding, Window.currentRow)
pareto = cust_rev.withColumn("cum_pct",
    F.round(F.sum("rev").over(w_cumrev) / total_revenue * 100, 1))
pareto.show()
print("Ex23 Pareto analysis done")

# 24. Pivot table — revenue by category × month
pivot_tbl = (star.filter(F.col("status") == "completed")
    .withColumn("month_abbr", F.date_format("order_date","MMM"))
    .groupBy("category")
    .pivot("month_abbr", ["Jan","Feb","Mar"])
    .agg(F.round(F.sum("line_total"), 2))
    .fillna(0))
pivot_tbl.show()
print("Ex24 pivot table done")

# 25. GROUPING SETS for multi-level aggregation
spark.sql("""
SELECT
    COALESCE(category,'ALL') AS category,
    COALESCE(city,'ALL')     AS city,
    ROUND(SUM(line_total),2) AS revenue
FROM (SELECT * FROM delta.`{b}/fact/orders`
      JOIN delta.`{b}/dim/product` USING (product_id)
      JOIN delta.`{b}/dim/location` USING (location_id)
      WHERE status='completed') t
GROUP BY GROUPING SETS ((category),(city),(category,city),())
ORDER BY revenue DESC
""".format(b=BASE)).show()
print("Ex25 GROUPING SETS done")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 26. SCD Type 2 for dim_customer
print("""Ex26 SCD2 update for customer tier change:
staged = spark.createDataFrame([('cust_01','Alice','gold','female',35,'alice@email.com')],
    ['customer_id','name','tier','gender','age','email'])

# Expire old current row
DeltaTable.forPath(spark, '/dim/customer').alias('t')
  .merge(staged.alias('s'), 't.customer_id=s.customer_id AND t.is_current=True')
  .whenMatchedUpdate(condition='t.tier != s.tier',
                     set={'is_current':'false','effective_to':'current_date()'})
  .execute()

# Insert new current row
staged.withColumn('is_current', lit(True)) \\
      .withColumn('effective_from', current_date()) \\
      .withColumn('effective_to',   lit('9999-12-31').cast('date')) \\
      .write.format('delta').mode('append').save('/dim/customer')
""")

# 27. Slowly Changing Dimension comparison
print("""Ex27 SCD types:
  Type 0: Never change (static dimension)
  Type 1: Overwrite old value (no history)
  Type 2: Add new row with is_current flag (full history) ← most common
  Type 3: Add 'previous_value' column (only 1 history level)
  Type 6: Combine Types 1+2+3
""")

# 28. Junk dimension (low-cardinality flags)
print("""Ex28 Junk dimension (consolidate flags):
dim_order_type = distinct combos of (is_online, is_promo, payment_method, channel)
→ single dim_junk table with junk_key FK in fact table
Reduces fact table width without many small columns
""")

# 29. Slowly Changing Measure
print("""Ex29 Slowly Changing Measure:
Product price changes over time. Store price snapshots:
fact_price_history (product_id, effective_date, unit_price)
Join fact_orders to price history: ON order_date BETWEEN effective_date AND next_effective_date
Ensures historical revenue computed at actual price, not current price
""")

# 30. Late-arriving facts
print("""Ex30 Late fact handling:
Problem: refund event arrives 30 days after order
Solution: write refund as new fact row (immutable append)
  OR: use MERGE with status column (set status='refunded' on order row)
Reporting: SUM(amount) WHERE status='completed' (excludes refunds naturally)
""")

# 31. Gold table incremental refresh
last_date = spark.read.format("delta").load(f"{BASE}/gold/daily_sales") \
    .agg(F.max("order_date")).collect()[0][0]
print(f"Ex31 gold last_date={last_date}. Only process fact rows after this date.")

# 32. Gold view layer for BI
print("""Ex32 BI views on top of Gold:
CREATE OR REPLACE VIEW prod.reporting.v_revenue_by_category AS
SELECT category, year_month, SUM(revenue) AS revenue
FROM prod.gold.daily_sales
JOIN prod.dim.product USING (product_id)
GROUP BY 1, 2;
-- Power BI / Tableau connect to this view
""")

# 33. Tableau / Power BI connection pattern
print("""Ex33 BI connectivity:
- Power BI: Databricks connector (JDBC) → DirectQuery or Import mode
- Tableau:  Databricks connector → Live connection to SQL Warehouse
- Best practice: connect to SQL Warehouse (serverless) → sub-second query response
- Use Gold views/tables → never expose Silver directly to BI tools
""")

# 34. Query optimization for BI
print("""Ex34 BI query optimization:
- Materialize heavy aggregations into Gold tables (avoid runtime fan-out)
- Z-ORDER on date + category columns (most common BI filters)
- Delta caching enabled: hot data stays in SSD across BI queries
- Cluster auto-suspend: 30-60 min idle → reduces cost without user impact
- Table access pattern: avoid SELECT * — push column projection
""")

# 35. Row-level security for regional BI teams
print("""Ex35 Regional RLS:
CREATE VIEW reporting.v_regional_sales AS
SELECT * FROM gold.daily_sales s
JOIN (SELECT region FROM access_control.region_access
      WHERE user_email = current_user()) a
ON s.region = a.region;
-- Data analysts in EMEA see only European data
""")

# 36. Data freshness SLA monitoring
print("""Ex36 Freshness SLA:
SELECT table_name, MAX(last_modified) AS last_refresh,
       DATEDIFF(current_timestamp(), MAX(last_modified)) AS hours_stale
FROM information_schema.tables
WHERE table_schema = 'gold'
HAVING hours_stale > 25  -- alert if not refreshed in 25h
""")

# 37. Materialized view pattern (scheduled refresh)
print("""Ex37 Materialized view via scheduled job:
-- Daily 06:00: run Gold aggregation job
-- Writes to gold.daily_sales with replaceWhere='order_date = current_date - 1'
-- BI tools read gold.daily_sales (always fresh by 06:30)
""")

# 38. Aggregation layer (pre-computed summaries)
monthly_summary = (star.filter(F.col("status") == "completed")
    .groupBy(
        F.date_format("order_date","yyyy-MM").alias("month"),
        "category","continent"
    )
    .agg(
        F.sum("line_total").alias("revenue"),
        F.count("*").alias("orders"),
        F.countDistinct("customer_id").alias("unique_buyers"),
        F.sum("quantity").alias("units_sold"),
    ))
monthly_summary.show(5, truncate=False)
print("Ex38 multi-dimensional summary done")

# 39. Index table for lookup optimization
print("""Ex39 Lookup optimization:
-- Small lookup tables: use BROADCAST JOIN hint
SELECT /*+ BROADCAST(d) */ f.*, d.product_name
FROM fact_orders f JOIN dim_product d ON f.product_id = d.product_id

-- Large dims: Z-ORDER on join key
OPTIMIZE delta.`/dim/customer` ZORDER BY (customer_id)
""")

# 40. Time intelligence functions
print("""Ex40 Time intelligence:
-- MTD (Month-to-date)
WHERE order_date >= date_trunc('month', current_date())

-- YTD (Year-to-date)
WHERE order_date >= date_trunc('year', current_date())

-- Same period last year
WHERE order_date BETWEEN date_add(same_start_ly, 0) AND date_add(same_end_ly, 0)

-- Rolling 12 months
WHERE order_date >= add_months(current_date(), -12)
""")

# 41. Calculated measures in SQL
print("""Ex41 Calculated measures:
SELECT
    month,
    revenue,
    revenue - LAG(revenue) OVER (ORDER BY month)       AS mom_delta,
    ROUND(revenue / LAG(revenue) OVER (ORDER BY month) * 100 - 100, 1) AS mom_pct,
    SUM(revenue) OVER (PARTITION BY year ORDER BY month) AS ytd_revenue,
    AVG(revenue) OVER (ORDER BY month ROWS 2 PRECEDING)  AS ma_3m
FROM gold.monthly_kpi
""")

# 42. Semantic layer (dbt metrics / Databricks AI/BI)
print("""Ex42 Semantic layer:
-- dbt metrics (v1.6+):
metric:
  name: revenue
  label: Total Revenue
  model: ref('fact_orders')
  calculation_method: sum
  expression: line_total
  filters: [{field: status, value: completed}]
  dimensions: [order_date, category, customer_tier]

-- Databricks AI/BI Genie: natural language → SQL on Gold tables
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Full star schema data model diagram
print("""Ex43 Data Model:
         dim_date
        (date_key)
            │
dim_customer─┤
(customer_id) │
            ┌─▼──────────────────┐
dim_product─┤  fact_orders       │─dim_location
(product_id) │  order_id PK       │ (location_id)
            │  customer_id FK    │
            │  product_id FK     │
            │  date_key FK       │
            │  location_id FK    │
            │  quantity (measure)│
            │  line_total (meas) │
            │  is_completed (meas│
            └────────────────────┘
""")

# 44. Kimball vs Inmon methodology
print("""Ex44 Methodologies:
  Kimball (bottom-up):
    → Build dimensional models (star schemas) per subject area
    → Conformed dimensions shared across star schemas
    → Query-optimized, business-friendly
    → Best for: agile analytics, team-specific domains

  Inmon (top-down):
    → Enterprise Data Warehouse first (3NF normalized)
    → Data marts derived from EDW
    → Single source of truth
    → Best for: large enterprises, strict governance

  Modern Lakehouse: pragmatic blend
    → Silver = normalized (Inmon-ish), Gold = star schemas (Kimball-ish)
""")

# 45. Conformed dimensions
print("""Ex45 Conformed dimensions:
  dim_date is shared across ALL star schemas in the enterprise
  (sales, finance, HR, marketing all use same calendar dimension)
  → consistent date hierarchies, period comparisons work across domains
  → must be centrally owned and versioned
""")

# 46. Factless fact tables
print("""Ex46 Factless fact table examples:
  1. Product inventory snapshot (product, date, warehouse → no amount measure)
  2. Event attendance (event, attendee, date → count(*) is the implicit fact)
  3. Campaign impressions (campaign, user, date → count is the measure)
  Used to answer 'what did NOT happen' queries
""")

# 47. Aggregate fact tables
print("""Ex47 Aggregate facts:
  fact_daily_sales   = pre-agg of fact_orders by date (common BI drill-to)
  fact_monthly_sales = further rolled up
  → Drill-through: BI tool goes from gold.monthly → gold.daily → fact.orders
  → Drill-up/down enabled by consistent keys across grain levels
""")

# 48. Type 4 mini-dimension
print("""Ex48 Type 4 mini-dimension:
  Rapidly changing attributes (customer_score, account_status) split into:
    dim_customer_mini (customer_mini_key, account_status, credit_score, tier)
    → FK in fact table instead of in large dim_customer
  Advantage: fast-changing attributes don't cause dim_customer SCD2 explosions
""")

# 49. Reporting pipeline orchestration
print("""Ex49 Reporting pipeline job:
  Tasks:
    1. ingest_delta      → Auto Loader → Bronze
    2. cleanse_silver    → depends on: ingest_delta
    3. build_star        → depends on: cleanse_silver
       [3a. dim_date, 3b. dim_customer, 3c. dim_product, 3d. dim_location] (parallel)
    4. fact_orders       → depends on: all dims
    5. gold_daily        → depends on: fact_orders
    6. gold_monthly      → depends on: gold_daily
    7. run_dq_checks     → depends on: gold_daily, gold_monthly
  Schedule: daily 04:00 UTC, email on failure, max_retries=2
""")

# 50. Production reporting checklist
print("""Ex50 Production reporting checklist:
✓ Conformed dimensions centrally managed with versioning
✓ Fact table grain documented (one row = one order line)
✓ SCD2 enabled for all slowly-changing dimensions
✓ Gold tables partitioned by date (replaceWhere for idempotent refresh)
✓ Z-ORDER on date + top filter columns
✓ BI access via SQL Warehouse (serverless) through Gold views
✓ Row-level security applied at view layer
✓ Data freshness monitored: alert if Gold older than 25h
✓ Historical revenue uses point-in-time price (Slowly Changing Measure)
✓ Conformed date dimension shared enterprise-wide
✓ Aggregate fact tables for fast BI drill-up, fact table for drill-through
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
