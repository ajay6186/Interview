# ============================================================================
# Exercise 5.2 — Real-Time Dashboard Pipeline
# ============================================================================
# Practice windowed aggregations, streaming concepts, funnel analysis,
# watermarks, and real-time KPI computation using batch data.
#
# Instructions: Replace every None / pass so all assertions pass.
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = (SparkSession.builder
    .appName("realtime-dashboard-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/rtdash_ex"
os.makedirs(f"{BASE}/gold", exist_ok=True)

events = spark.createDataFrame([
    ("e001","u1","page_view", "p_A", None,   "2024-01-15 10:00:01","s1"),
    ("e002","u1","add_to_cart","p_A",None,   "2024-01-15 10:00:30","s1"),
    ("e003","u1","purchase",  "p_A",999.99,  "2024-01-15 10:01:00","s1"),
    ("e004","u2","page_view", "p_B",None,    "2024-01-15 10:00:45","s2"),
    ("e005","u2","add_to_cart","p_B",None,   "2024-01-15 10:01:10","s2"),
    ("e006","u3","page_view", "p_C",None,    "2024-01-15 10:00:20","s3"),
    ("e007","u3","page_view", "p_A",None,    "2024-01-15 10:01:30","s3"),
    ("e008","u4","purchase",  "p_B",699.00,  "2024-01-15 10:02:00","s4"),
    ("e009","u5","purchase",  "p_C",149.99,  "2024-01-15 10:00:10","s5"),
], ["event_id","user_id","event_type","product_id","amount","event_time","session_id"])

events = events \
    .withColumn("event_time", F.to_timestamp("event_time","yyyy-MM-dd HH:mm:ss")) \
    .withColumn("amount",     F.col("amount").cast("double"))

# ---------------------------------------------------------------------------
# 1. Total unique users
# ---------------------------------------------------------------------------
# TODO: count distinct user_id values → store in unique_users

unique_users = None  # replace

assert unique_users == 5, f"Expected 5 unique users, got {unique_users}"
print(f"[1] unique_users={unique_users}")

# ---------------------------------------------------------------------------
# 2. Conversion rate
# ---------------------------------------------------------------------------
# TODO: buyers = distinct user_ids with event_type == "purchase"
#       conversion_pct = round(buyers / unique_users * 100, 1)

buyers = None  # replace
conversion_pct = None  # replace

assert buyers == 3, f"Expected 3 buyers, got {buyers}"
assert conversion_pct == 60.0, f"Expected 60.0%, got {conversion_pct}"
print(f"[2] buyers={buyers} conversion={conversion_pct}%")

# ---------------------------------------------------------------------------
# 3. Total revenue from purchases
# ---------------------------------------------------------------------------
# TODO: sum of amount for purchase events → store in total_revenue

total_revenue = None  # replace

assert abs(total_revenue - (999.99 + 699.00 + 149.99)) < 0.01, f"Revenue mismatch: {total_revenue}"
print(f"[3] total_revenue={round(total_revenue, 2)}")

# ---------------------------------------------------------------------------
# 4. Average order value (AOV)
# ---------------------------------------------------------------------------
# TODO: average amount for purchase events → store in aov, rounded to 2 decimals

aov = None  # replace

assert abs(aov - round((999.99 + 699.00 + 149.99) / 3, 2)) < 0.01
print(f"[4] AOV={aov}")

# ---------------------------------------------------------------------------
# 5. Funnel counts
# ---------------------------------------------------------------------------
# TODO: Build a dict funnel = {event_type: distinct_user_count}
#       for event_types: "page_view", "add_to_cart", "purchase"

funnel = None  # replace  # expected: {"page_view": 4, "add_to_cart": 2, "purchase": 3}

assert funnel["page_view"]    == 4, f"page_view expected 4, got {funnel['page_view']}"
assert funnel["add_to_cart"]  == 2, f"add_to_cart expected 2, got {funnel['add_to_cart']}"
assert funnel["purchase"]     == 3, f"purchase expected 3, got {funnel['purchase']}"
print(f"[5] funnel={funnel}")

# ---------------------------------------------------------------------------
# 6. 1-minute tumbling window revenue
# ---------------------------------------------------------------------------
# TODO: groupBy 5-minute tumbling window on event_time for purchase events
#       aggregate: revenue=sum(amount), orders=count(*)
#       extract window.start as window_start, window.end as window_end
#       drop "window" column
#       store in windowed_df

windowed_df = None  # replace

assert windowed_df is not None
assert "window_start" in windowed_df.columns
assert "revenue" in windowed_df.columns
assert windowed_df.count() >= 1
print(f"[6] windowed KPIs: {windowed_df.count()} windows")
windowed_df.show(truncate=False)

# ---------------------------------------------------------------------------
# 7. Session depth (events per session)
# ---------------------------------------------------------------------------
# TODO: groupBy session_id, count events, store as session_stats
#       get the max events in any single session → max_depth

session_stats = None  # replace
max_depth = None      # replace

assert max_depth >= 3, f"Session s1 has 3 events (page_view + add_to_cart + purchase), got {max_depth}"
print(f"[7] session depth max={max_depth}")

# ---------------------------------------------------------------------------
# 8. Time-to-purchase per session
# ---------------------------------------------------------------------------
# TODO: For sessions with both page_view and purchase:
#       first_view  = min(event_time) where event_type == "page_view"
#       purchase_ts = event_time where event_type == "purchase"
#       join on session_id, compute ttp_sec = purchase_time (long) - first_view (long)
#       store result in ttp_df
#       get ttp for session s1 → s1_ttp (should be ~59 seconds)

ttp_df = None  # replace
s1_ttp = None  # replace

assert s1_ttp is not None
assert 55 <= s1_ttp <= 65, f"Session s1 TTP should be ~59s, got {s1_ttp}"
print(f"[8] session s1 TTP={s1_ttp}s")

# ---------------------------------------------------------------------------
# 9. Running cumulative revenue (window function)
# ---------------------------------------------------------------------------
# TODO: Start with a per-minute revenue summary:
#       df_per_min = events filtered to purchase, grouped by minute (date_trunc 'minute'),
#                    agg sum(amount) as revenue, ordered by minute
#       Then add cum_revenue = running sum over ordered minutes using window function

df_per_min = None  # replace (must have "revenue" and "cum_revenue" columns)

assert df_per_min is not None
assert "cum_revenue" in df_per_min.columns
rows = df_per_min.collect()
# cumulative should be non-decreasing
for i in range(1, len(rows)):
    assert rows[i]["cum_revenue"] >= rows[i-1]["cum_revenue"]
print(f"[9] cumulative revenue computed, total={rows[-1]['cum_revenue']:.2f}")

# ---------------------------------------------------------------------------
# 10. Watermark description
# ---------------------------------------------------------------------------
# TODO: Build a string explanation of why we need watermarks in streaming.
#       Store in watermark_explanation.
#       Must contain the word "late" (case-insensitive).

watermark_explanation = None  # replace e.g., "Watermarks tolerate late data..."

assert watermark_explanation is not None
assert "late" in watermark_explanation.lower(), "explanation must mention 'late' data"
print(f"[10] watermark_explanation: {watermark_explanation[:80]}")

print("\nAll assertions passed!")
spark.stop()
