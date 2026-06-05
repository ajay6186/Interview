# ============================================================================
# Solution 5.6 — Real-World Streaming Pipeline
# ============================================================================

import os, json, datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import (StructType, StructField, StringType,
                                DoubleType, TimestampType, BooleanType)

spark = (SparkSession.builder
    .appName("streaming-pipeline-solution")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/stream_sol"
os.makedirs(BASE, exist_ok=True)

raw = spark.createDataFrame([
    ("e001", "dev-A", "us-east", "temperature",  72.1, "2024-01-15 10:00:00", 1),
    ("e002", "dev-B", "us-east", "temperature",  75.3, "2024-01-15 10:00:05", 2),
    ("e003", "dev-A", "us-east", "humidity",     45.0, "2024-01-15 10:00:10", 3),
    ("e004", "dev-C", "eu-west", "temperature",  68.5, "2024-01-15 10:00:15", 4),
    ("e005", "dev-A", "us-east", "temperature", 999.0, "2024-01-15 10:00:20", 5),
    ("e006", "dev-B", "us-east", "humidity",     50.2, "2024-01-15 10:00:25", 6),
    ("e007", "dev-D", "ap-south","pressure",   1013.0, "2024-01-15 10:00:30", 7),
    ("e008", "dev-C", "eu-west", "humidity",     55.1, "2024-01-15 10:00:35", 8),
    ("e009", "dev-A", "us-east", "temperature",  71.8, "2024-01-15 10:00:40", 9),
    ("e010", "dev-B", "us-east", "temperature",  74.9, "2024-01-15 10:00:45", 10),
    ("e002", "dev-B", "us-east", "temperature",  75.3, "2024-01-15 10:00:05",  2),
    (None,   "dev-X", "us-east", "temperature",  80.0, "2024-01-15 10:00:50", 11),
    ("e012", None,    "us-east", "temperature",  65.0, "2024-01-15 10:00:55", 12),
], ["event_id","device_id","region","metric","value","event_time","kafka_offset"])

raw = raw.withColumn("event_time", F.to_timestamp("event_time"))

# =============================================================================
# STEP 1 — Bronze
# =============================================================================
bronze_path = f"{BASE}/bronze"
raw.write.format("delta").mode("overwrite").save(bronze_path)
bronze_df = spark.read.format("delta").load(bronze_path)

assert bronze_df.count() == 13
print(f"[1] Bronze rows: {bronze_df.count()}")

# =============================================================================
# STEP 2 — Silver
# =============================================================================
invalid_condition = F.col("event_id").isNull() | F.col("device_id").isNull()
dlq_df    = bronze_df.filter(invalid_condition)
silver_df = (bronze_df
    .filter(~invalid_condition)
    .dropDuplicates(["event_id"]))

assert dlq_df.count()    == 2
assert silver_df.count() == 10
print(f"[2] DLQ: {dlq_df.count()}  Silver: {silver_df.count()}")

# =============================================================================
# STEP 3 — Gold: Windowed metrics
# =============================================================================
gold_metrics = (silver_df
    .groupBy("device_id", "metric",
             F.window("event_time", "30 seconds").alias("window"))
    .agg(F.avg("value").alias("avg_value"),
         F.count("*").alias("event_count"))
    .withColumn("window_start", F.col("window.start"))
    .withColumn("window_end",   F.col("window.end"))
    .drop("window"))

rows = gold_metrics.collect()
assert len(rows) > 0
for r in rows:
    assert r.avg_value is not None
    assert r.event_count >= 1
print(f"[3] Gold metric rows: {len(rows)}")
gold_metrics.orderBy("device_id","metric","window_start").show(truncate=False)

# =============================================================================
# STEP 4 — Anomaly Detection
# =============================================================================
w = Window.partitionBy("device_id", "metric")
anomalies = (silver_df
    .withColumn("mean",   F.avg("value").over(w))
    .withColumn("stddev", F.stddev_samp("value").over(w))
    .withColumn("z_score",
        (F.col("value") - F.col("mean")) /
        F.when(F.col("stddev") > 0, F.col("stddev")).otherwise(F.lit(1.0)))
    .withColumn("is_anomaly", F.abs(F.col("z_score")) > 2.5)
    .filter(F.col("is_anomaly")))

count = anomalies.count()
assert count >= 1
assert "e005" in [r.event_id for r in anomalies.collect()]
print(f"[4] Anomalies detected: {count}")
anomalies.select("event_id","device_id","metric","value","z_score","is_anomaly").show()

# =============================================================================
# STEP 5 — CDF Propagation
# =============================================================================
cdf_batch = spark.createDataFrame([
    ("e001", "dev-A", "us-east", "temperature",  72.1, "insert"),
    ("e003", "dev-A", "us-east", "humidity",     45.0, "insert"),
    ("e004", "dev-C", "eu-west", "temperature",  68.5, "update_preimage"),
    ("e004", "dev-C", "eu-west", "temperature",  69.0, "update_postimage"),
    ("e007", "dev-D", "ap-south","pressure",   1013.0, "delete"),
], ["event_id","device_id","region","metric","value","_change_type"])

downstream_df = cdf_batch.filter(
    F.col("_change_type").isin(["insert", "update_postimage"]))

assert downstream_df.count() == 3
change_types = {r._change_type for r in downstream_df.collect()}
assert "delete"          not in change_types
assert "update_preimage" not in change_types
print(f"[5] Downstream CDF rows: {downstream_df.count()}")
downstream_df.show()

# =============================================================================
# STEP 6 — Pipeline Metrics
# =============================================================================
total_input_rows = raw.count()
dlq_rows         = dlq_df.count()
silver_rows      = silver_df.count()
anomaly_count    = anomalies.count()
drop_rate_pct    = round((total_input_rows - silver_rows) / total_input_rows * 100, 2)

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
max_ts = silver_df.agg(F.max("event_time")).collect()[0][0]

last_seen_df = (silver_df
    .groupBy("device_id")
    .agg(F.max("event_time").alias("last_seen")))

heartbeat = last_seen_df.withColumn(
    "stale",
    F.col("last_seen") < (F.lit(max_ts) - F.expr("INTERVAL 5 SECONDS")))

stale_devices = heartbeat.filter(F.col("stale") == True).collect()
assert max_ts is not None
assert len(stale_devices) >= 1
print(f"[7] max_ts={max_ts}")
print(f"[7] Heartbeat (stale > 5s):")
heartbeat.show()


print("\nAll solutions verified!")
spark.stop()
