# Theory: Real-World Streaming Pipeline

## Project Overview

Build a production-grade **IoT Sensor & Clickstream Streaming Pipeline** that ingests high-volume event data from Kafka, processes it through a medallion architecture, detects anomalies in real time, and serves aggregated metrics to a downstream dashboard.

### Architecture
```
Kafka (events)
    │
    ▼
Bronze (Auto Loader / Structured Streaming)
  - Raw, schema-on-read, append-only
  - Checkpointed for exactly-once
    │
    ▼
Silver (Structured Streaming + watermarks)
  - Parsed, validated, deduplicated
  - DLQ for malformed records
  - CDF enabled for downstream propagation
    │
    ├── ▼  Gold: windowed_metrics (streaming)
    │       - 1-min & 5-min tumbling windows per device/region
    │       - Revenue, event counts, avg values
    │
    └── ▼  Gold: anomaly_alerts (foreachBatch)
            - Z-score anomaly detection per device
            - Writes alerts to Delta + Kafka topic
```

---

## Key Design Decisions

### 1. Exactly-Once Semantics
- Kafka offsets committed to checkpoint after each micro-batch
- Silver writes use `MERGE` (via `foreachBatch`) to prevent duplicate rows on retry
- Gold writes use `replaceWhere` on partition columns for idempotent overwrites

### 2. Watermarks and Late Data Policy
- **Silver**: no windowing — pass-through with event_time preserved
- **Gold windowed_metrics**: 10-minute watermark on `event_time`
  - Tolerates sensors that buffer events for up to 10 minutes
  - After watermark passes, window state is dropped from memory
- **Anomaly detection**: uses processing-time batches (no watermark needed)

### 3. Schema Management
```python
event_schema = StructType([
    StructField("device_id",   StringType()),
    StructField("region",      StringType()),
    StructField("metric",      StringType()),
    StructField("value",       DoubleType()),
    StructField("event_time",  TimestampType()),
    StructField("event_id",    StringType()),
])
```
Auto Loader tracks schema evolution — new fields are added as nullable columns without breaking the pipeline.

### 4. Back-Pressure
- `maxOffsetsPerTrigger` limits records per micro-batch to prevent OOM on burst traffic
- Silver → Gold: `trigger(processingTime="1 minute")` controls Gold refresh rate independently

---

## Streaming Checkpoints

| Stream | Checkpoint Path |
|--------|----------------|
| Kafka → Bronze | `/ckpt/bronze_events` |
| Bronze → Silver | `/ckpt/silver_events` |
| Silver → Gold (metrics) | `/ckpt/gold_metrics` |
| Silver → Gold (anomalies) | `/ckpt/gold_anomalies` |

**Rule**: never delete a checkpoint unless intentionally resetting offset. Deleting the checkpoint causes the stream to replay from the beginning (or `startingOffsets`).

---

## Anomaly Detection Algorithm

Z-score based per-device anomaly detection across a rolling batch:

```python
def detect_anomalies(df, epoch_id):
    from pyspark.sql.window import Window

    w = Window.partitionBy("device_id", "metric")
    scored = (df
        .withColumn("mean",  F.avg("value").over(w))
        .withColumn("stddev", F.stddev("value").over(w))
        .withColumn("z_score",
            (F.col("value") - F.col("mean")) / F.when(F.col("stddev") > 0, F.col("stddev")).otherwise(1.0))
        .withColumn("is_anomaly", F.abs(F.col("z_score")) > 3.0))

    alerts = scored.filter(F.col("is_anomaly"))
    if alerts.count() > 0:
        alerts.write.format("delta").mode("append").save("/gold/anomaly_alerts")
```

---

## Performance Considerations

| Concern | Solution |
|---------|---------|
| Small files at Bronze | Auto-compact via `optimizeWrite=true`, daily OPTIMIZE job |
| State size in Silver | Watermark limits how long window state is retained |
| Skew on device_id | Salting or repartition before wide aggregations |
| Checkpoint overhead | SSD-backed storage; avoid DBFS root in prod (use ADLS/S3) |
| Cold start latency | Use `startingOffsets: latest` for live pipelines; `earliest` only for backfill |

---

## Production Checklist

- [ ] Checkpoint location on reliable cloud storage (not local disk)
- [ ] `maxOffsetsPerTrigger` tuned to cluster memory
- [ ] Watermark set to expected maximum sensor delay
- [ ] Dead Letter Queue for malformed JSON / schema violations
- [ ] Alerting on stream lag (`inputRowsPerSecond` drops below threshold)
- [ ] OPTIMIZE / VACUUM scheduled daily on Bronze and Silver
- [ ] Unity Catalog governance — separate catalogs for dev/staging/prod
- [ ] CDF enabled on Silver for downstream CDF consumers

---

## Common Interview Questions

**Q: What is the difference between Structured Streaming and DStreams?**  
A: DStreams (Spark Streaming v1) treats data as RDD micro-batches — low-level, no SQL, no exactly-once. Structured Streaming (v2) uses the DataFrame API, supports event-time, watermarks, stateful aggregations, and has exactly-once end-to-end with Delta. Always use Structured Streaming for new projects.

**Q: How do you achieve end-to-end exactly-once with Kafka and Delta?**  
A: Kafka offsets are committed to the checkpoint after each micro-batch. Delta writes within `foreachBatch` use MERGE (idempotent upsert keyed on event_id). Together: even if a micro-batch is retried, the same offsets produce the same MERGE, yielding no duplicates.

**Q: What happens if you delete the checkpoint directory?**  
A: The stream loses its offset history and will restart from `startingOffsets` (usually `latest` or `earliest`). Using `latest` means you lose events that arrived during the downtime; using `earliest` causes a full replay (can take hours on large topics). Always back up checkpoints before any migration.

**Q: When should you use `trigger(availableNow=True)` vs continuous streaming?**  
A: `availableNow=True` is ideal for scheduled jobs that run every N minutes — it processes all accumulated data, writes a checkpoint, then terminates (saving cluster cost). Continuous streaming is for sub-second latency (e.g., fraud detection) and keeps the cluster running 24/7. Most analytics pipelines use `availableNow=True` or fixed-interval triggers.

**Q: How do watermarks interact with Delta MERGE in foreachBatch?**  
A: Watermarks apply at the Structured Streaming engine level, controlling which late events are included. Inside `foreachBatch`, you operate on a static DataFrame (a single micro-batch). The MERGE in `foreachBatch` is just standard Delta SQL — it doesn't know about watermarks. Combine both: watermark to drop truly stale events, MERGE for idempotent writes of the events you do process.
