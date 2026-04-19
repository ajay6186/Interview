# Theory: Streaming Basics

## What is Structured Streaming?
Structured Streaming is Spark's stream processing engine that treats an incoming data stream as an **unbounded table** that grows over time. You write the same DataFrame API as batch, and Spark handles the continuous execution.

```
Input stream (unbounded table):
  row 1  [00:01]
  row 2  [00:02]       →  process continuously
  row 3  [00:03]
  ...

Output (result table — updated each trigger)
```

---

## Architecture

```
Source (Kafka/Delta/Autoloader/Socket)
    │
    ▼
Structured Streaming Engine
    │  micro-batch or continuous
    ▼
    Checkpoint (tracks progress / offsets)
    │
    ▼
Sink (Delta/Kafka/Console/Memory)
```

Each **trigger** = one micro-batch. Spark reads new data since the last checkpoint, processes it, and writes to the sink.

---

## Reading Streaming Sources

```python
# Kafka source
stream_df = (spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "broker:9092")
    .option("subscribe", "orders-topic")
    .option("startingOffsets", "latest")    # or "earliest"
    .load()
    .select(F.col("value").cast("string").alias("json_value"),
            F.col("timestamp")))

# Delta table as streaming source
stream_df = (spark.readStream
    .format("delta")
    .option("ignoreChanges","true")         # for tables with updates/deletes
    .load("/bronze/orders"))

# Auto Loader (incremental file ingestion)
stream_df = (spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format","json")
    .option("cloudFiles.schemaLocation","/schema/orders")
    .load("s3://landing/orders/"))
```

---

## Writing to Sinks

```python
query = (stream_df.writeStream
    .format("delta")                                   # sink
    .outputMode("append")                              # append/complete/update
    .option("checkpointLocation", "/ckpt/orders")     # REQUIRED for fault tolerance
    .trigger(processingTime="5 minutes")               # micro-batch interval
    .start("/silver/orders"))                          # output path

query.awaitTermination()     # block until stopped
query.stop()                 # gracefully stop
```

---

## Output Modes

| Mode | When to use | Works with |
|------|-------------|------------|
| `append` | Only new rows output — no updates to previous results | Stateless transforms, Delta |
| `complete` | Full result table output every trigger | Aggregations (whole table) |
| `update` | Only changed rows since last trigger | Aggregations |

```
append mode:   time 1: [row1]     time 2: [row2]    time 3: [row3]
complete mode: time 1: [row1]     time 2: [row1,row2]  time 3: [row1,row2,row3]
update mode:   time 1: [agg1]     time 2: [agg1_new, agg2]  (changed rows only)
```

---

## Triggers

```python
.trigger(processingTime="30 seconds")  # micro-batch every 30s
.trigger(availableNow=True)            # process all available data then stop (batch-style)
.trigger(once=True)                    # (deprecated) same as availableNow
.trigger(continuous="1 second")        # experimental: ms-latency mode
```

`availableNow=True` is extremely useful for testing streaming pipelines in batch mode.

---

## Checkpoints

The checkpoint stores:
1. **Offsets**: where we left off in the source (Kafka offset, Delta version, file list).
2. **State store**: for stateful aggregations (watermarks, session windows).
3. **Metadata**: schema, sink info.

**Without a checkpoint**: restarting a stream reprocesses data from the beginning (or loses data).
**With a checkpoint**: restart resumes exactly where it stopped — **exactly-once processing**.

```
/ckpt/orders/
  offsets/     ← source offsets per batch
  commits/     ← committed batch IDs
  state/       ← aggregation state
  metadata     ← stream metadata
```

---

## Watermarks (Late Data Handling)

Without watermarks, Spark holds state for every key forever (OOM risk). Watermarks tell Spark how late data can arrive before being discarded.

```python
stream_df \
    .withWatermark("event_timestamp", "2 hours")   # tolerate 2h late arrival
    .groupBy(
        F.window("event_timestamp", "1 hour"),     # 1-hour tumbling window
        F.col("region")
    ) \
    .agg(F.count("*").alias("orders"))
```

```
Current max event_time: 10:00
Watermark: 10:00 - 2h = 08:00
→ Events with event_time < 08:00 are dropped (too late)
→ State for windows before 08:00 is cleared
```

---

## Streaming Aggregation Windows

```python
# Tumbling window (non-overlapping, fixed size)
F.window("ts", "1 hour")               # 00:00-01:00, 01:00-02:00, ...

# Sliding window (overlapping)
F.window("ts", "1 hour", "30 minutes") # slides every 30 min

# Session window (gap-based)
F.session_window("ts", "30 minutes")   # group events with < 30min gap
```

---

## stateful vs Stateless Operations

| | Stateless | Stateful |
|--|-----------|----------|
| Examples | filter, select, withColumn, flat_map | groupBy+agg, join stream-to-stream, deduplication |
| Memory | No state per key | Grows with distinct keys |
| Requires watermark | No | Recommended |
| Performance | Fast | Slower, risk of OOM without watermark |

---

## Common Interview Questions

**Q: What is Structured Streaming and how does it differ from Spark batch?**  
A: Structured Streaming is Spark's streaming engine that models a stream as an unbounded table. You write the same DataFrame API as batch. Spark handles continuous execution, checkpointing, and fault tolerance. The key difference: data arrives continuously; batch processes a fixed snapshot.

**Q: What is a checkpoint in Structured Streaming?**  
A: A checkpoint is a persistent directory that stores the source offsets (where we left off), committed batch IDs, and aggregation state. It enables exactly-once processing on restart — Spark resumes from the last committed offset rather than reprocessing from the beginning.

**Q: What are the three output modes in Structured Streaming?**  
A: Append: only new rows are written each trigger (stateless operations). Complete: the full result table is written every trigger (aggregations). Update: only rows that changed since the last trigger are written (aggregations with updates).

**Q: What is a watermark and why do you need it?**  
A: A watermark specifies how late data can arrive. Without it, Spark must hold aggregation state for all possible event times forever (OOM risk). With a watermark of 2 hours, Spark discards events more than 2 hours behind the current event time and clears old state.

**Q: What is the difference between `processingTime` and `availableNow` triggers?**  
A: `processingTime="5 minutes"` runs a micro-batch every 5 minutes continuously. `availableNow=True` processes all data currently available in the source then stops — useful for testing streaming pipelines as if they were batch jobs.

**Q: What is Auto Loader and why is it preferred over `spark.readStream.parquet()`?**  
A: Auto Loader (`cloudFiles`) incrementally ingests new files from cloud storage using change notification or directory listing. It tracks which files were already processed (prevents re-ingestion), handles schema evolution, and scales to billions of files efficiently.

---

## Quick Reference

```python
# Read stream
spark.readStream.format("delta").load("/path")
spark.readStream.format("kafka").option("subscribe","topic").load()
spark.readStream.format("cloudFiles").option("cloudFiles.format","json").load("/path")

# Transform
stream_df.filter(...).select(...).withColumn(...)

# Watermark + aggregation
stream_df \
    .withWatermark("event_ts","1 hour") \
    .groupBy(F.window("event_ts","1 hour"), "region") \
    .agg(F.count("*"))

# Write stream
query = stream_df.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation","/ckpt/path") \
    .trigger(processingTime="5 minutes") \
    .start("/sink/path")

query.lastProgress    # metrics dict
query.status          # current status
query.stop()
query.awaitTermination()
```
