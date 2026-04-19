# Theory: Advanced Streaming

## Stateful Operations

Stateless streaming: each micro-batch is independent (filter, select, withColumn).  
Stateful streaming: Spark maintains state across micro-batches for aggregations, deduplication, joins.

```python
# Stateful aggregation — Spark maintains running counts per key
(stream_df
    .withWatermark("event_ts", "1 hour")
    .groupBy(F.window("event_ts", "10 minutes"), "region")
    .agg(F.count("*").alias("event_count"))
    .writeStream
    .outputMode("update")
    .format("delta")
    .option("checkpointLocation", "/ckpt/agg")
    .start("/silver/agg"))
```

State is stored in the checkpoint's **state store** (RocksDB by default in DBR). Without watermarks, state grows unboundedly → OOM.

---

## Stream-to-Stream Joins

Join two streaming DataFrames. Spark buffers both sides and matches events within a time window.

```python
orders_stream = (spark.readStream.format("delta").load("/bronze/orders")
    .withWatermark("order_ts", "1 hour"))

payments_stream = (spark.readStream.format("delta").load("/bronze/payments")
    .withWatermark("payment_ts", "1 hour"))

# Inner join: match orders to payments within 1 hour
joined = orders_stream.alias("o").join(
    payments_stream.alias("p"),
    expr("""
        o.order_id = p.order_id AND
        p.payment_ts BETWEEN o.order_ts AND o.order_ts + INTERVAL 1 HOUR
    """),
    "inner"
)
```

**Requirements**:
- Both streams must have watermarks (for state cleanup).
- The join condition must include a time range (to bound state size).
- Only `inner` and `left outer` joins are supported for stream-to-stream.

---

## Stream-to-Static Join

Join a stream with a static (batch) DataFrame — the static side is re-read each micro-batch:

```python
products_static = spark.read.format("delta").table("catalog.products")  # static

orders_stream = spark.readStream.format("delta").load("/bronze/orders")

enriched = orders_stream.join(
    products_static,
    "product_id",
    "left"
)
# products_static is refreshed each batch (not cached in state store)
```

**Note**: If the static table changes, the stream will pick up new data on the next micro-batch. Use `broadcast(products_static)` if the table is small.

---

## foreachBatch

`foreachBatch` gives you full DataFrame API access on each micro-batch — the most flexible sink.

```python
def process_batch(batch_df, batch_id):
    # batch_df is a regular DataFrame
    # batch_id is the current batch sequence number (for dedup/idempotency)

    # Idempotent MERGE
    from delta.tables import DeltaTable
    if DeltaTable.isDeltaTable(spark, "/silver/orders"):
        delta_table = DeltaTable.forPath(spark, "/silver/orders")
        (delta_table.alias("t")
            .merge(batch_df.alias("s"), "t.id = s.id")
            .whenMatchedUpdateAll()
            .whenNotMatchedInsertAll()
            .execute())
    else:
        batch_df.write.format("delta").save("/silver/orders")

    # Write to multiple sinks in one batch
    batch_df.filter(F.col("status") == "failed") \
        .write.format("delta").mode("append").save("/alerts/failed_orders")

(stream_df.writeStream
    .foreachBatch(process_batch)
    .option("checkpointLocation", "/ckpt/orders")
    .trigger(processingTime="5 minutes")
    .start())
```

**Key uses**:
- MERGE (upsert) as a streaming sink.
- Writing to multiple sinks from one stream.
- Custom transformations not supported by built-in sinks.
- Deduplication using `batch_id` for exactly-once guarantees.

---

## Deduplication in Streaming

```python
# dropDuplicates within a micro-batch (not across batches)
stream_df.dropDuplicates(["event_id"])

# Cross-batch deduplication using withWatermark + dropDuplicates
(stream_df
    .withWatermark("event_ts", "1 hour")  # deduplicate within watermark window
    .dropDuplicates(["event_id", "event_ts"])
    .writeStream
    .outputMode("append")
    .format("delta")
    .option("checkpointLocation", "/ckpt")
    .start("/silver/events"))

# Strongest dedup: MERGE in foreachBatch (idempotent across restarts)
def dedup_batch(batch_df, batch_id):
    batch_df = batch_df.dropDuplicates(["event_id"])  # within-batch
    delta_table.alias("t").merge(
        batch_df.alias("s"), "t.event_id = s.event_id"
    ).whenNotMatchedInsertAll().execute()   # across-batch
```

---

## Kafka Integration

```python
# Read from Kafka
kafka_df = (spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "broker1:9092,broker2:9092")
    .option("subscribe", "orders-topic")            # single topic
    # .option("subscribePattern", "orders-.*")      # regex pattern
    .option("startingOffsets", "latest")            # latest | earliest | {"topic":{"0":offset}}
    .option("maxOffsetsPerTrigger", 100000)         # rate limiting
    .option("kafka.security.protocol", "SASL_SSL") # auth
    .load())

# Kafka schema: key(binary), value(binary), topic, partition, offset, timestamp, timestampType
orders_df = kafka_df.select(
    F.col("value").cast("string").alias("json_str"),
    F.col("timestamp").alias("kafka_ts"),
    F.col("partition"),
    F.col("offset")
)

# Parse JSON
from pyspark.sql.types import StructType, StructField, StringType, DoubleType
schema = StructType([
    StructField("order_id", StringType()),
    StructField("amount", DoubleType()),
    StructField("status", StringType()),
])
orders_df = orders_df.select(F.from_json("json_str", schema).alias("data")).select("data.*")

# Write back to Kafka
(stream_df
    .select(F.to_json(F.struct("*")).alias("value"))
    .writeStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "broker:9092")
    .option("topic", "output-topic")
    .option("checkpointLocation", "/ckpt/kafka-out")
    .start())
```

---

## Auto Loader (Advanced)

```python
# Recommended for cloud file ingestion at scale
stream_df = (spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "json")
    .option("cloudFiles.schemaLocation", "/schema/orders")   # schema inference + drift
    .option("cloudFiles.inferColumnTypes", "true")
    .option("cloudFiles.maxFilesPerTrigger", 1000)           # rate limiting
    .option("cloudFiles.useNotifications", "true")           # SNS/Event Grid (faster)
    .load("s3://landing/orders/"))

# Auto Loader tracks processed files in the checkpoint — no re-ingestion
# Schema evolution: new columns auto-added with schema merging
```

**Auto Loader vs spark.readStream.parquet()**:

| | Auto Loader | readStream.format("parquet") |
|--|-------------|-------------------------------|
| File tracking | Yes (checkpoint) | Directory listing only |
| Scale | Billions of files | Thousands of files |
| Schema evolution | Built-in | Manual |
| Cloud notifications | Yes (event-driven) | No |

---

## Common Interview Questions

**Q: What is foreachBatch and why is it useful?**  
A: `foreachBatch(fn)` calls your function with the current micro-batch as a regular DataFrame and a batch ID. This enables using the full DataFrame API (MERGE, custom transforms, multiple sinks) with streaming data. The batch ID enables idempotency — you can check if you've already processed this batch.

**Q: How do you do a stream-to-stream join?**  
A: Both streams must have watermarks to bound state size. The join condition must include a time range so Spark knows when to expire buffered rows. Only inner and left outer joins are supported. Example: match orders and payments where payment arrives within 1 hour of the order.

**Q: How do you deduplicate a stream across restarts?**  
A: Three approaches of increasing strength: (1) `dropDuplicates` within each micro-batch (no cross-batch dedup). (2) `withWatermark + dropDuplicates` — deduplicates within the watermark window. (3) MERGE in `foreachBatch` — strongest, works across restarts because the target Delta table is the source of truth.

**Q: What is the difference between stream-to-stream join and stream-to-static join?**  
A: In a stream-to-static join, one side is a regular batch DataFrame re-read each micro-batch — no state overhead. In stream-to-stream join, Spark buffers both sides in the state store and matches events within a time window; both sides must have watermarks.

**Q: How does Auto Loader differ from a regular streaming file source?**  
A: Auto Loader tracks which files have been processed in the checkpoint (prevents re-ingestion), handles schema evolution automatically, uses cloud event notifications (SNS/Event Grid) for low-latency file discovery, and scales to billions of files. Regular `readStream.parquet()` can only list directories and doesn't scale to billions of files.

---

## Quick Reference

```python
# Stream-to-static join
stream.join(static_df, "key", "left")

# Stream-to-stream join (both need watermarks)
stream1.withWatermark("ts1", "1 hour") \
    .join(stream2.withWatermark("ts2", "1 hour"),
          expr("s1.id = s2.id AND s2.ts BETWEEN s1.ts AND s1.ts + INTERVAL 1 HOUR"))

# foreachBatch
stream.writeStream.foreachBatch(fn).option("checkpointLocation", "/ckpt").start()

# Deduplication
stream.withWatermark("ts", "1 hour").dropDuplicates(["event_id", "ts"])

# Kafka source
spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", "broker:9092") \
    .option("subscribe", "topic") \
    .option("startingOffsets", "latest").load()

# Auto Loader
spark.readStream.format("cloudFiles") \
    .option("cloudFiles.format", "json") \
    .option("cloudFiles.schemaLocation", "/schema") \
    .load("s3://bucket/prefix/")

# State store (RocksDB for large state)
spark.conf.set("spark.sql.streaming.stateStore.providerClass",
    "com.databricks.sql.streaming.state.RocksDBStateStoreProvider")
```
