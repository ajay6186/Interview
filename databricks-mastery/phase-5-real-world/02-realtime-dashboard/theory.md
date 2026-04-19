# Theory: Real-Time Dashboard Pipeline

## Architecture Overview

A real-time dashboard pipeline processes streaming events and materializes low-latency metrics that BI tools (Grafana, Databricks SQL, Power BI) query directly from Delta tables.

```
Event Sources
  ├── Kafka: order events, payment events, error events
  ├── Kafka: clickstream (page views, add-to-cart)
  └── Kafka: IoT sensors (if applicable)
        │
        ▼
  Structured Streaming
  (readStream → watermark → groupBy window → writeStream)
        │
        ▼
  Delta Tables (updated every N seconds/minutes)
  ├── metrics.orders_per_minute
  ├── metrics.revenue_per_5min
  ├── metrics.error_rate_rolling
  └── metrics.active_users_1h
        │
        ▼
  BI Layer
  (Databricks SQL Warehouse, Grafana via SQL connector, Power BI DirectQuery)
```

---

## Streaming Windowed Aggregations

```python
from pyspark.sql import functions as F

def build_orders_per_minute(spark):
    """Count orders per minute with 5-minute watermark for late data."""
    orders_stream = (spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "broker:9092")
        .option("subscribe", "orders")
        .option("startingOffsets", "latest")
        .load()
        .select(
            F.from_json(F.col("value").cast("string"),
                "STRUCT<order_id:STRING, region:STRING, amount:DOUBLE, event_ts:TIMESTAMP>"
            ).alias("d"))
        .select("d.*"))

    aggregated = (orders_stream
        .withWatermark("event_ts", "5 minutes")   # tolerate 5 min late data
        .groupBy(
            F.window("event_ts", "1 minute").alias("window"),  # 1-min tumbling window
            "region"
        )
        .agg(
            F.count("*").alias("order_count"),
            F.sum("amount").alias("revenue"),
            F.avg("amount").alias("avg_order_value")
        )
        .select(
            F.col("window.start").alias("window_start"),
            F.col("window.end").alias("window_end"),
            "region", "order_count", "revenue", "avg_order_value"
        ))

    return (aggregated.writeStream
        .format("delta")
        .outputMode("append")    # append finalized windows (with watermark)
        .option("checkpointLocation", "/ckpt/metrics/orders_per_minute")
        .trigger(processingTime="30 seconds")
        .toTable("metrics.orders_per_minute"))
```

---

## Rolling Metrics (Sliding Window)

```python
def build_revenue_rolling_5min(spark):
    """5-minute rolling revenue with 1-minute slide — overlapping windows."""
    stream = (spark.readStream
        .format("delta")
        .option("readChangeFeed", "true")
        .option("startingVersion", "latest")
        .table("bronze.orders"))

    rolling = (stream
        .withWatermark("created_at", "10 minutes")
        .groupBy(
            F.window("created_at", "5 minutes", "1 minute"),  # slide every 1 min
            "region"
        )
        .agg(
            F.sum("amount").alias("revenue_5min"),
            F.count("*").alias("orders_5min")
        ))

    return (rolling.writeStream
        .format("delta")
        .outputMode("append")
        .option("checkpointLocation", "/ckpt/metrics/revenue_rolling")
        .trigger(processingTime="1 minute")
        .toTable("metrics.revenue_rolling_5min"))
```

---

## Error Rate Monitoring

```python
def build_error_rate_stream(spark):
    """Track error rate per service as a rolling 10-minute metric."""
    events = (spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "broker:9092")
        .option("subscribe", "app-events")
        .option("startingOffsets", "latest")
        .load()
        .select(F.from_json(F.col("value").cast("string"),
            "STRUCT<service:STRING, event_type:STRING, event_ts:TIMESTAMP>").alias("d"))
        .select("d.*"))

    error_rate = (events
        .withWatermark("event_ts", "5 minutes")
        .groupBy(F.window("event_ts", "10 minutes"), "service")
        .agg(
            F.count("*").alias("total_events"),
            F.sum(F.when(F.col("event_type") == "error", 1).otherwise(0)).alias("error_count")
        )
        .withColumn("error_rate_pct",
            F.round(F.col("error_count") / F.col("total_events") * 100, 2)))

    return (error_rate.writeStream
        .format("delta")
        .outputMode("append")
        .option("checkpointLocation", "/ckpt/metrics/error_rate")
        .trigger(processingTime="1 minute")
        .toTable("metrics.error_rate_10min"))
```

---

## Active Users (Session Window)

```python
def build_active_users(spark):
    """Count active users — session window groups events within 30 min of each other."""
    clicks = (spark.readStream
        .format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.schemaLocation", "/schema/clicks")
        .load("s3://landing/clicks/"))

    sessions = (clicks
        .withWatermark("event_ts", "1 hour")
        .groupBy(
            F.session_window("event_ts", "30 minutes"),  # 30-min inactivity gap
            "user_id"
        )
        .agg(F.count("*").alias("page_views")))

    # Count distinct active users in each completed session window
    active_users = (sessions
        .groupBy(F.col("session_window.start").alias("window_start"))
        .agg(F.countDistinct("user_id").alias("active_users")))

    return (active_users.writeStream
        .format("delta")
        .outputMode("append")
        .option("checkpointLocation", "/ckpt/metrics/active_users")
        .trigger(processingTime="5 minutes")
        .toTable("metrics.active_users"))
```

---

## Databricks SQL for Dashboarding

```sql
-- Query the latest metrics for a Grafana/DBSQL dashboard
-- Refresh every 60 seconds via auto-refresh

-- Orders in the last hour
SELECT
    window_start,
    region,
    SUM(order_count) AS orders,
    SUM(revenue)     AS revenue
FROM metrics.orders_per_minute
WHERE window_start >= NOW() - INTERVAL 1 HOUR
GROUP BY window_start, region
ORDER BY window_start DESC;

-- Current error rate by service
SELECT
    window.start AS window_start,
    service,
    error_rate_pct
FROM metrics.error_rate_10min
WHERE window.start >= NOW() - INTERVAL 30 MINUTES
ORDER BY error_rate_pct DESC;
```

---

## foreachBatch for Multi-Sink Real-Time

```python
def real_time_multi_sink(spark):
    """Write metrics to Delta AND send alerts to Kafka for high error rates."""
    stream = spark.readStream.format("delta").option("readChangeFeed","true") \
                  .table("bronze.events")

    def process_and_alert(batch_df, batch_id):
        # Write all to Delta metrics table
        metrics = batch_df.groupBy("service", F.window("event_ts","5 minutes")) \
                          .agg(F.count("*").alias("events"),
                               F.sum(F.when(F.col("type")=="error",1).otherwise(0)).alias("errors"))
        metrics.write.format("delta").mode("append").saveAsTable("metrics.events_5min")

        # Alert if error rate > 5%
        high_error = metrics.withColumn("rate", F.col("errors")/F.col("events")) \
                            .filter(F.col("rate") > 0.05)
        if high_error.count() > 0:
            (high_error
                .select(F.to_json(F.struct("*")).alias("value"))
                .write.format("kafka")
                .option("kafka.bootstrap.servers", "broker:9092")
                .option("topic", "alerts")
                .save())

    return (stream.writeStream
        .foreachBatch(process_and_alert)
        .option("checkpointLocation", "/ckpt/realtime")
        .trigger(processingTime="1 minute")
        .start())
```

---

## Common Interview Questions

**Q: What output mode do you use for streaming aggregations and why?**  
A: Use `append` with watermarks — finalized windows are written once when the watermark passes their end time (no updates to old rows). Use `update` if you need live updates to window results as new data arrives (but not all sinks support update mode). Never use `complete` on large streams — it rewrites the entire result table every trigger.

**Q: How does a watermark affect when aggregated results are written?**  
A: The watermark is `max(event_time) - delay`. Results for a window are only emitted (in `append` mode) after the watermark passes the window's end time — guaranteeing no more late data can affect that window. A 5-minute watermark means results appear 5 minutes after the window closes.

**Q: What is the difference between tumbling, sliding, and session windows?**  
A: Tumbling: fixed size, non-overlapping (e.g., 1-min buckets). Sliding: fixed size, overlapping with a slide interval (e.g., 5-min window every 1 min). Session: gap-based (group events with < N minutes of inactivity between them) — size varies per user's session.

**Q: How do you build a real-time dashboard with sub-minute latency?**  
A: Use `trigger(processingTime="30 seconds")` or `trigger(continuous="1 second")` (experimental). Write to a Delta table. Point Databricks SQL or Grafana at the Delta table with auto-refresh. For true sub-second: write to Redis or a time-series DB (InfluxDB) from `foreachBatch`.

**Q: How do you alert on streaming anomalies?**  
A: In `foreachBatch`: compute metrics, check thresholds, write to an alerts Kafka topic or call a webhook if threshold exceeded. This pattern lets you combine analytics writes and alerting in one pass over the micro-batch data.

---

## Quick Reference

```python
# Tumbling window
.withWatermark("ts", "5 min")
.groupBy(F.window("ts", "1 minute"), "region")
.agg(F.count("*"))
.writeStream.outputMode("append")

# Sliding window
F.window("ts", "5 minutes", "1 minute")  # 5-min window, slide every 1 min

# Session window
F.session_window("ts", "30 minutes")     # 30-min inactivity gap

# foreachBatch for multi-sink
.writeStream.foreachBatch(fn).option("checkpointLocation", "/ckpt").start()

# Trigger options
.trigger(processingTime="30 seconds")
.trigger(availableNow=True)   # batch-style: process all, then stop
.trigger(continuous="1 second")  # experimental, ~ms latency

# Output modes
.outputMode("append")    # finalized windows (with watermark)
.outputMode("update")    # changed rows only
.outputMode("complete")  # full result table (avoid on large data)
```
