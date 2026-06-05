# ============================================================================
# Exercise 5.6 — Real-World Streaming Pipeline
# ============================================================================
# Build a full IoT sensor streaming pipeline: ingest → Bronze → Silver → Gold.
# Practice: windowed aggregations, anomaly detection, DLQ, deduplication,
#           CDF propagation, and end-to-end pipeline assembly.
#
# Instructions: Replace every None / pass so all assertions pass.
# ============================================================================

import os, json, datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import (StructType, StructField, StringType,
                                DoubleType, TimestampType, BooleanType)

spark = (SparkSession.builder
    .appName("streaming-pipeline-exercise")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/stream_ex"
os.makedirs(BASE, exist_ok=True)

# ── SEED DATA ─────────────────────────────────────────────────────────────────
raw = spark.createDataFrame([
    # (event_id, device_id, region, metric, value, event_time, kafka_offset)
    ("e001", "dev-A", "us-east", "temperature",  72.1, "2024-01-15 10:00:00", 1),
    ("e002", "dev-B", "us-east", "temperature",  75.3, "2024-01-15 10:00:05", 2),
    ("e003", "dev-A", "us-east", "humidity",     45.0, "2024-01-15 10:00:10", 3),
    ("e004", "dev-C", "eu-west", "temperature",  68.5, "2024-01-15 10:00:15", 4),
    ("e005", "dev-A", "us-east", "temperature", 999.0, "2024-01-15 10:00:20", 5),  # anomaly
    ("e006", "dev-B", "us-east", "humidity",     50.2, "2024-01-15 10:00:25", 6),
    ("e007", "dev-D", "ap-south","pressure",   1013.0, "2024-01-15 10:00:30", 7),
    ("e008", "dev-C", "eu-west", "humidity",     55.1, "2024-01-15 10:00:35", 8),
    ("e009", "dev-A", "us-east", "temperature",  71.8, "2024-01-15 10:00:40", 9),
    ("e010", "dev-B", "us-east", "temperature",  74.9, "2024-01-15 10:00:45", 10),
    ("e002", "dev-B", "us-east", "temperature",  75.3, "2024-01-15 10:00:05",  2),  # duplicate!
    (None,   "dev-X", "us-east", "temperature",  80.0, "2024-01-15 10:00:50", 11),  # null event_id
    ("e012", None,    "us-east", "temperature",  65.0, "2024-01-15 10:00:55", 12),  # null device_id
], ["event_id","device_id","region","metric","value","event_time","kafka_offset"])

raw = raw.withColumn("event_time", F.to_timestamp("event_time"))


# =============================================================================
# STEP 1 — Bronze: Persist raw events
# =============================================================================
# TODO: write raw to delta at f"{BASE}/bronze" (mode='overwrite' for this exercise)
# TODO: read it back into bronze_df

bronze_path = f"{BASE}/bronze"
# replace the two lines below
None  # write raw
bronze_df = None  # read back

assert bronze_df is not None, "bronze_df must not be None"
assert bronze_df.count() == 13, f"Expected 13 raw rows in Bronze, got {bronze_df.count()}"
print(f"[1] Bronze rows: {bronze_df.count()}")


# =============================================================================
# STEP 2 — Silver: Validate and deduplicate
# =============================================================================
# Apply these rules in order:
# a) Filter out rows where event_id IS NULL  → route to DLQ
# b) Filter out rows where device_id IS NULL → route to DLQ
# c) Deduplicate: keep one row per event_id (any row, e.g. first() or dropDuplicates)

# TODO: create dlq_df — rows where event_id IS NULL OR device_id IS NULL
# TODO: create silver_df — valid rows, then deduplicated on event_id

dlq_df    = None  # replace
silver_df = None  # replace

assert dlq_df is not None and silver_df is not None
assert dlq_df.count()    == 2,  f"Expected 2 DLQ rows, got {dlq_df.count()}"
assert silver_df.count() == 10, f"Expected 10 Silver rows after dedup, got {silver_df.count()}"
print(f"[2] DLQ: {dlq_df.count()}  Silver: {silver_df.count()}")


# =============================================================================
# STEP 3 — Gold: Windowed metrics
# =============================================================================
# Using silver_df (treat as static batch simulation of a micro-batch):
# Group by device_id + metric + 30-second tumbling window on event_time.
# Aggregate: avg(value) aliased 'avg_value', count(*) aliased 'event_count'.
# Extract window.start as 'window_start', window.end as 'window_end', drop 'window'.

# TODO: build gold_metrics DataFrame

gold_metrics = None  # replace

assert gold_metrics is not None
rows = gold_metrics.collect()
# 10 silver events across devices/metrics/30s windows → number of unique combinations
assert len(rows) > 0, "gold_metrics must not be empty"

# All avg_value entries should be finite numbers
for r in rows:
    assert r.avg_value is not None
    assert r.event_count >= 1

print(f"[3] Gold metric rows: {len(rows)}")
gold_metrics.orderBy("device_id","metric","window_start").show(truncate=False)


# =============================================================================
# STEP 4 — Anomaly Detection
# =============================================================================
# From silver_df, compute per (device_id, metric):
#   mean   = avg(value) over the window
#   stddev = stddev_samp(value) over the window
#   z_score = (value - mean) / stddev   (use 1.0 if stddev == 0 to avoid division-by-zero)
# Flag is_anomaly = abs(z_score) > 2.5
#
# Return only the anomalous rows.

# TODO: build anomalies DataFrame

anomalies = None  # replace

assert anomalies is not None
count = anomalies.count()
assert count >= 1, f"Expected at least 1 anomaly (value=999 for dev-A), got {count}"
assert "e005" in [r.event_id for r in anomalies.collect()], "event e005 (value=999) must be an anomaly"
print(f"[4] Anomalies detected: {count}")
anomalies.select("event_id","device_id","metric","value","z_score","is_anomaly").show()


# =============================================================================
# STEP 5 — CDF Simulation: Propagate changes downstream
# =============================================================================
# Simulate a CDF batch: some rows are inserts, one is an update_postimage.
# From this CDF batch, extract only the rows that should be applied downstream:
#   - 'insert' rows
#   - 'update_postimage' rows (the new state after an update)
# Exclude 'update_preimage' and 'delete' rows.

cdf_batch = spark.createDataFrame([
    ("e001", "dev-A", "us-east", "temperature",  72.1, "insert"),
    ("e003", "dev-A", "us-east", "humidity",     45.0, "insert"),
    ("e004", "dev-C", "eu-west", "temperature",  68.5, "update_preimage"),
    ("e004", "dev-C", "eu-west", "temperature",  69.0, "update_postimage"),
    ("e007", "dev-D", "ap-south","pressure",   1013.0, "delete"),
], ["event_id","device_id","region","metric","value","_change_type"])

# TODO: filter cdf_batch to keep only insert and update_postimage rows → downstream_df

downstream_df = None  # replace

assert downstream_df is not None
assert downstream_df.count() == 3, f"Expected 3 downstream rows, got {downstream_df.count()}"
change_types = {r._change_type for r in downstream_df.collect()}
assert "delete"           not in change_types
assert "update_preimage"  not in change_types
print(f"[5] Downstream CDF rows: {downstream_df.count()}")
downstream_df.show()


# =============================================================================
# STEP 6 — Pipeline Metrics
# =============================================================================
# Compute the following metrics from the data produced above:
#   total_input_rows   — raw.count()
#   dlq_rows           — dlq_df.count()
#   silver_rows        — silver_df.count()
#   anomaly_count      — anomalies.count()
#   drop_rate_pct      — round((total_input_rows - silver_rows) / total_input_rows * 100, 2)

# TODO: fill in each value

total_input_rows = None   # replace
dlq_rows         = None   # replace
silver_rows      = None   # replace
anomaly_count    = None   # replace
drop_rate_pct    = None   # replace

assert total_input_rows == 13
assert dlq_rows         == 2
assert silver_rows      == 10
assert anomaly_count    >= 1
assert 0 < drop_rate_pct <= 100

metrics = {
    "total_input_rows": total_input_rows,
    "dlq_rows":         dlq_rows,
    "silver_rows":      silver_rows,
    "anomaly_count":    anomaly_count,
    "drop_rate_pct":    drop_rate_pct,
}
print(f"[6] Pipeline metrics: {json.dumps(metrics)}")


# =============================================================================
# STEP 7 — Device Heartbeat SLA
# =============================================================================
# From silver_df, find devices that have NOT sent an event in the last 5 seconds
# relative to the maximum event_time in silver_df.
# Hint: compute max(event_time) across all silver rows → use as "now"
#       compute last_seen per device
#       flag devices where (now - last_seen) > 5 seconds

# TODO: compute max_ts (maximum event_time in silver_df)
# TODO: compute last_seen per device_id: max(event_time) aliased 'last_seen'
# TODO: add column 'stale' = True when (max_ts - last_seen) > 5 seconds
#       hint: F.col("last_seen") < (max_ts - F.expr("INTERVAL 5 SECONDS"))

max_ts     = None  # replace
heartbeat  = None  # replace

assert max_ts is not None
assert heartbeat is not None
stale_devices = heartbeat.filter(F.col("stale") == True).collect()
print(f"[7] max_ts={max_ts}")
print(f"[7] Heartbeat (stale > 5s):")
heartbeat.show()
assert len(stale_devices) >= 1, "Expected at least one stale device"


print("\nAll exercises complete!")
spark.stop()
