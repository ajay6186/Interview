# ============================================================================
# Solution 5.2 — Real-Time Dashboard Pipeline
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = (SparkSession.builder
    .appName("realtime-dashboard-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/rtdash_ex"
os.makedirs(f"{BASE}/gold", exist_ok=True)

events = spark.createDataFrame([
    ("e001","u1","page_view", "p_A", None,  "2024-01-15 10:00:01","s1"),
    ("e002","u1","add_to_cart","p_A",None,  "2024-01-15 10:00:30","s1"),
    ("e003","u1","purchase",  "p_A",999.99, "2024-01-15 10:01:00","s1"),
    ("e004","u2","page_view", "p_B",None,   "2024-01-15 10:00:45","s2"),
    ("e005","u2","add_to_cart","p_B",None,  "2024-01-15 10:01:10","s2"),
    ("e006","u3","page_view", "p_C",None,   "2024-01-15 10:00:20","s3"),
    ("e007","u3","page_view", "p_A",None,   "2024-01-15 10:01:30","s3"),
    ("e008","u4","purchase",  "p_B",699.00, "2024-01-15 10:02:00","s4"),
    ("e009","u5","purchase",  "p_C",149.99, "2024-01-15 10:00:10","s5"),
], ["event_id","user_id","event_type","product_id","amount","event_time","session_id"])
events = events \
    .withColumn("event_time", F.to_timestamp("event_time","yyyy-MM-dd HH:mm:ss")) \
    .withColumn("amount",     F.col("amount").cast("double"))

# 1. Unique users
unique_users = events.select("user_id").distinct().count()
assert unique_users == 5
print(f"[1] unique_users={unique_users}")

# 2. Conversion rate
buyers = events.filter(F.col("event_type") == "purchase").select("user_id").distinct().count()
conversion_pct = round(buyers / unique_users * 100, 1)
assert buyers == 3
assert conversion_pct == 60.0
print(f"[2] buyers={buyers} conversion={conversion_pct}%")

# 3. Total revenue
total_revenue = events.filter(F.col("event_type") == "purchase").agg(F.sum("amount")).collect()[0][0]
assert abs(total_revenue - (999.99 + 699.00 + 149.99)) < 0.01
print(f"[3] total_revenue={round(total_revenue,2)}")

# 4. AOV
aov = round(events.filter(F.col("event_type") == "purchase").agg(F.avg("amount")).collect()[0][0], 2)
assert abs(aov - round((999.99 + 699.00 + 149.99) / 3, 2)) < 0.01
print(f"[4] AOV={aov}")

# 5. Funnel
funnel = {et: events.filter(F.col("event_type") == et).select("user_id").distinct().count()
          for et in ["page_view","add_to_cart","purchase"]}
assert funnel["page_view"]   == 4
assert funnel["add_to_cart"] == 2
assert funnel["purchase"]    == 3
print(f"[5] funnel={funnel}")

# 6. Windowed KPI
windowed_df = (events
    .filter(F.col("event_type") == "purchase")
    .groupBy(F.window("event_time","5 minutes").alias("window"))
    .agg(F.sum("amount").alias("revenue"), F.count("*").alias("orders"))
    .withColumn("window_start", F.col("window.start"))
    .withColumn("window_end",   F.col("window.end"))
    .drop("window"))
assert "window_start" in windowed_df.columns
assert windowed_df.count() >= 1
print(f"[6] windowed KPIs: {windowed_df.count()}")
windowed_df.show(truncate=False)

# 7. Session depth
session_stats = events.groupBy("session_id").count()
max_depth = session_stats.agg(F.max("count")).collect()[0][0]
assert max_depth >= 3
print(f"[7] max_depth={max_depth}")

# 8. Time-to-purchase
first_pv = events.filter(F.col("event_type") == "page_view") \
    .groupBy("session_id").agg(F.min("event_time").alias("first_view"))
purchase_ts = events.filter(F.col("event_type") == "purchase") \
    .select("session_id", F.col("event_time").alias("purchase_time"))
ttp_df = first_pv.join(purchase_ts, "session_id") \
    .withColumn("ttp_sec", F.col("purchase_time").cast("long") - F.col("first_view").cast("long"))
s1_ttp = ttp_df.filter(F.col("session_id") == "s1").select("ttp_sec").collect()[0][0]
assert 55 <= s1_ttp <= 65
print(f"[8] s1 TTP={s1_ttp}s")

# 9. Cumulative revenue
df_per_min = (events
    .filter(F.col("event_type") == "purchase")
    .withColumn("minute", F.date_trunc("minute","event_time"))
    .groupBy("minute")
    .agg(F.sum("amount").alias("revenue"))
    .orderBy("minute"))
w_run = Window.orderBy("minute").rowsBetween(Window.unboundedPreceding, Window.currentRow)
df_per_min = df_per_min.withColumn("cum_revenue", F.round(F.sum("revenue").over(w_run), 2))
assert "cum_revenue" in df_per_min.columns
rows = df_per_min.collect()
for i in range(1, len(rows)):
    assert rows[i]["cum_revenue"] >= rows[i-1]["cum_revenue"]
print(f"[9] final cum_revenue={rows[-1]['cum_revenue']:.2f}")

# 10. Watermark explanation
watermark_explanation = (
    "Watermarks define a threshold for how late arriving data can be and still be included "
    "in windowed aggregations. Without a watermark, Spark must keep all past state indefinitely. "
    "A watermark of '10 minutes' means events up to 10 minutes late are still processed correctly."
)
assert "late" in watermark_explanation.lower()
print(f"[10] {watermark_explanation[:80]}")

print("\nAll assertions passed!")
spark.stop()
