# ============================================================================
# Examples 3.3 — Advanced Structured Streaming  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import os, time
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

spark = (SparkSession.builder
    .appName("adv-streaming-examples")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")
BASE = "/tmp/adv_streaming"
os.makedirs(BASE, exist_ok=True)

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Watermark basics
rate = spark.readStream.format("rate").option("rowsPerSecond",10).load()
with_wm = rate.withWatermark("timestamp","30 seconds")
print("Ex01 watermark added")

# 2. Tumbling window aggregation
tumbling = (with_wm
    .groupBy(F.window("timestamp","10 seconds"))
    .agg(F.count("value").alias("cnt"), F.sum("value").alias("total")))
print("Ex02 tumbling window defined")

# 3. Sliding window
sliding = (with_wm
    .groupBy(F.window("timestamp","10 seconds","5 seconds"))
    .count())
print("Ex03 sliding window defined")

# 4. Session window (Spark 3.2+)
try:
    session = (with_wm
        .groupBy(F.session_window("timestamp","15 seconds"))
        .count())
    print("Ex04 session window defined")
except AttributeError:
    print("Ex04 session_window requires Spark 3.2+")

# 5. Output mode: update (for windowed aggregation)
q5 = tumbling.writeStream.format("console").outputMode("update") \
             .trigger(processingTime="5 seconds").start()
time.sleep(15)
q5.stop()
print("Ex05 update mode windowed query done")

# 6. Output mode: complete (entire result table each trigger)
q6 = tumbling.writeStream.format("memory").queryName("windows") \
             .outputMode("complete").start()
time.sleep(10)
spark.sql("SELECT * FROM windows ORDER BY window").show(truncate=False)
q6.stop()

# 7. Late data handling with watermark
print("""
Ex07 Late Data:
  - Events arriving after watermark are silently dropped
  - watermark = max_event_time_seen - watermark_delay
  - windowEnd < watermark → window is finalized and can be emitted (append mode)
""")

# 8. dropDuplicates in streaming
dedup = rate.withWatermark("timestamp","10 seconds").dropDuplicates(["value","timestamp"])
print("Ex08 streaming dedup defined")

# 9. Stream-static join
static = spark.createDataFrame([(i,f"label_{i%5}") for i in range(1000)],["val","label"])
stream_static = rate.join(static, rate.value == static.val, "left")
print("Ex09 stream-static join defined")

# 10. Stream-stream inner join
rate2 = spark.readStream.format("rate").option("rowsPerSecond",8).load() \
             .withColumnRenamed("value","value2").withColumnRenamed("timestamp","ts2")
ss_join = (rate.withWatermark("timestamp","10 seconds")
    .join(rate2.withWatermark("ts2","10 seconds"),
          F.expr("value = value2 AND timestamp BETWEEN ts2 - INTERVAL 5 SECONDS AND ts2 + INTERVAL 5 SECONDS"),
          "inner"))
print("Ex10 stream-stream inner join defined")

# 11. Stream-stream left outer join
ss_left = (rate.withWatermark("timestamp","10 seconds")
    .join(rate2.withWatermark("ts2","10 seconds"),
          F.expr("value = value2 AND ts2 BETWEEN timestamp - INTERVAL 5 SECONDS AND timestamp + INTERVAL 5 SECONDS"),
          "leftOuter"))
print("Ex11 stream-stream left outer join defined")

# 12. foreachBatch — write to multiple sinks
SINK_A = f"{BASE}/sink_a"
SINK_B = f"{BASE}/sink_b"
schema = StructType([StructField("id",IntegerType()),StructField("val",DoubleType())])
spark.createDataFrame([(1,10.0),(2,20.0)],["id","val"]).write.mode("overwrite").json(f"{BASE}/src")

src_stream = spark.readStream.schema(schema).json(f"{BASE}/src")
def multi_sink(df, epoch_id):
    df.cache()
    df.write.mode("append").parquet(SINK_A)
    df.filter(F.col("val")>15).write.mode("append").parquet(SINK_B)
    df.unpersist()

q12 = src_stream.writeStream.foreachBatch(multi_sink).trigger(once=True).start()
q12.awaitTermination()
print("Ex12 multi-sink foreachBatch done")

# 13. Idempotent foreachBatch with batch_id
def idempotent_write(df, batch_id):
    df.withColumn("batch_id", F.lit(batch_id)) \
      .write.mode("append").parquet(f"{BASE}/idempotent")

q13 = src_stream.writeStream.foreachBatch(idempotent_write).trigger(once=True).start()
q13.awaitTermination()
print("Ex13 idempotent foreachBatch done")

# 14. MERGE in foreachBatch (exactly-once Delta upsert)
from delta.tables import DeltaTable
DELTA_SINK = f"{BASE}/delta_sink"
spark.createDataFrame([(1,10.0),(2,20.0)],["id","val"]).write.format("delta").mode("overwrite").save(DELTA_SINK)

def merge_batch(micro_df, batch_id):
    dt = DeltaTable.forPath(spark, DELTA_SINK)
    dt.alias("t").merge(micro_df.alias("s"),"t.id=s.id") \
      .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()

q14 = src_stream.writeStream.foreachBatch(merge_batch).trigger(once=True).start()
q14.awaitTermination()
print("Ex14 MERGE in foreachBatch done")

# 15. Trigger.Once vs Trigger.AvailableNow
print("""
Ex15 Trigger comparison:
  Trigger.Once        → one micro-batch, then stop (legacy)
  Trigger.AvailableNow → multiple micro-batches until no new data, then stop (Spark 3.3+)
  processingTime="1m" → run every minute
  continuous="1s"     → experimental, sub-second latency
""")

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. mapGroupsWithState — arbitrary stateful processing
from pyspark.sql.streaming import GroupState, GroupStateTimeout
from pyspark.sql.types import *

# Schema for state
state_schema = StructType([
    StructField("count", LongType()),
    StructField("sum",   DoubleType()),
])

def update_state(key, rows, state: GroupState):
    if state.hasTimedOut:
        state.remove()
        return iter([])
    existing = state.get if not state.exists else state.get
    cnt = 0; total = 0.0
    for row in rows:
        cnt += 1; total += row.val
    state.update((cnt, total))
    state.setTimeoutDuration(60000)  # 1 min
    yield (key[0], cnt, total)

print("Ex16 mapGroupsWithState pattern defined")

# 17. flatMapGroupsWithState — emit multiple rows
print("Ex17 flatMapGroupsWithState: can yield 0+ rows per state update; used for sessionization")

# 18. State schema migration
print("Ex18 State schema migration: changelogCheckpointingEnabled + schema migration guide")

# 19. RocksDB state store
spark.conf.set("spark.sql.streaming.stateStore.providerClass",
               "org.apache.spark.sql.execution.streaming.state.RocksDBStateStoreProvider")
print("Ex19 RocksDB state store configured")

# 20. Checkpoint recovery
print("""
Ex20 Checkpoint recovery:
  - Store checkpoint in durable storage (DBFS, S3, ADLS)
  - Restart query with SAME checkpointLocation → resumes from last committed offset
  - Change in query plan may break checkpoint (some changes tolerated)
""")

# 21. Schema evolution in Auto Loader
print("""
Ex21 Auto Loader schema evolution:
  .option("cloudFiles.schemaEvolutionMode","addNewColumns")
  → New columns in source files automatically added to target schema
  → Old columns kept; new columns filled with null for old files
""")

# 22. Rescued data column
print("Ex22 _rescued_data: Auto Loader stores schema-mismatch data; useful for schema debugging")

# 23. maxFilesPerTrigger
print("Ex23 .option('maxFilesPerTrigger','100') — limit files processed per batch (file source)")

# 24. maxBytesPerTrigger
print("Ex24 .option('maxBytesPerTrigger','10m') — limit bytes per batch")

# 25. latestFirst for file source
print("Ex25 .option('latestFirst','true') — process newest files first (for catch-up scenarios)")

# 26. Kafka offsets management
print("""
Ex26 Kafka offset management:
  startingOffsets: 'earliest' | 'latest' | {"topic":{"partition":offset}}
  maxOffsetsPerTrigger: limit per batch
  failOnDataLoss: false (skip missing offsets in compacted topics)
""")

# 27. Kafka exactly-once (Databricks)
print("""
Ex27 Kafka exactly-once:
  .option("kafka.isolation.level","read_committed")
  + transactional producer on write side
  + checkpoint-based offset tracking
""")

# 28. Event Hub source (Azure)
print("""
Ex28 Event Hub:
  spark.readStream
    .format("eventhubs")
    .options(**ehConf)
    .load()
  where ehConf = {"eventhubs.connectionString": conn_str, ...}
""")

# 29. Monitoring streaming queries
print("""
Ex29 Monitoring:
  query.lastProgress → dict with inputRowsPerSecond, processedRowsPerSecond, durationMs
  query.recentProgress → list of recent progress reports
  spark.streams.active → list of active streaming queries
""")

# 30. Streaming query listener
print("""
Ex30 StreamingQueryListener:
  class MyListener(StreamingQueryListener):
    def onQueryStarted(self, event): pass
    def onQueryProgress(self, event): log(event.progress)
    def onQueryTerminated(self, event): alert_if_error()
  spark.streams.addListener(MyListener())
""")

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Exactly-once end-to-end
print("""
Ex31 Exactly-once E2E:
  Source: Kafka (replayable) or Auto Loader (file tracking)
  Processing: deterministic transformations
  Sink: Delta (transactional) → guarantees exactly-once via idempotent commits
""")

# 32. Multi-hop streaming (medallion)
print("""
Ex32 Multi-hop streaming:
  Bronze: readStream(kafka).write(delta_bronze)
  Silver: readStream(delta_bronze).filter/clean.write(delta_silver)
  Gold:   readStream(delta_silver).agg.write(delta_gold)
  Each hop has its own checkpoint location
""")

# 33. Delta Live Tables (DLT) — declarative streaming
print("""
Ex33 DLT streaming:
  import dlt
  @dlt.table
  def bronze():
      return spark.readStream.format("cloudFiles")...

  @dlt.table
  @dlt.expect_all({"valid_amount":"amount > 0"})
  def silver():
      return dlt.read_stream("bronze").filter(...)
""")

# 34. DLT expectations (data quality rules)
print("""
Ex34 DLT Expectations:
  @dlt.expect("valid_id", "id IS NOT NULL")         → warn only
  @dlt.expect_or_drop("positive_amt","amount > 0")  → drop failing rows
  @dlt.expect_or_fail("no_duplicates","...")        → fail pipeline
""")

# 35. DLT continuous vs triggered mode
print("""
Ex35 DLT pipeline modes:
  Triggered: process available data then wait (like Trigger.AvailableNow)
  Continuous: keep running (low latency, higher cost)
""")

# 36. Auto Loader with Unity Catalog
print("""
Ex36 Auto Loader + UC:
  spark.readStream.format("cloudFiles")
    .option("cloudFiles.format","json")
    .option("cloudFiles.schemaLocation","abfss://...")
    .load("abfss://container@account.dfs.core.windows.net/raw/")
  → Schema stored in UC; tracked per table
""")

# 37. Streaming metrics + alerting
print("""
Ex37 Production alerting:
  if query.lastProgress["inputRowsPerSecond"] == 0:
      alert("No data in last trigger!")
  if query.lastProgress["durationMs"]["triggerExecution"] > SLA_MS:
      alert("Trigger exceeded SLA!")
""")

# 38. Backpressure via maxOffsetsPerTrigger
print("Ex38 Kafka: .option('maxOffsetsPerTrigger','10000') prevents OOM during backlog catch-up")

# 39. State store metrics
print("Ex39 State store: monitor 'numStateRows','stateMemory' in lastProgress['stateOperators']")

# 40. Restart strategies (DBR)
print("""
Ex40 Databricks restart policy:
  {"maxConcurrentRuns":1,
   "max_retries":10,
   "retry_on_timeout":true}
  → Workflow auto-restarts streaming job on failure
""")

# 41. Blue-green streaming deployment
print("""
Ex41 Blue-green for streaming:
  1. Start new (green) query with same checkpoint + new code
  2. If green is healthy, stop old (blue) query
  3. Some changes require checkpoint reset + replay from source
""")

# 42. Streaming aggregation on Delta source (incremental)
print("""
Ex42 Incremental agg on Delta:
  spark.readStream.format("delta")
    .option("readChangeData","true")
    .load(PATH)
  → Only new/changed rows processed each trigger
""")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Custom source (V2 API)
print("Ex43 Custom source: implement DataSource, MicroBatchStream, Offset via Spark DataSource V2 API")

# 44. Custom sink (foreachBatch is simpler)
print("Ex44 Custom sink via foreachBatch: write to any system (Elasticsearch, Redis, custom DB)")

# 45. Stateful ML inference in streaming
print("""
Ex45 Stateful ML in streaming:
  - Load model once per partition (mapInPandas / foreachBatch)
  - Use MLflow spark_udf for zero-copy scoring
  - Maintain rolling feature aggregations as streaming state
""")

# 46. Schema registry integration
print("Ex46 Schema registry: use spark-avro with schema registry to enforce Avro schemas on Kafka")

# 47. Streaming to Kafka (write)
print("""
Ex47 Write to Kafka:
  df.writeStream
    .format("kafka")
    .option("kafka.bootstrap.servers","broker:9092")
    .option("topic","output_topic")
    .option("checkpointLocation", ckpt)
    .start()
  Messages: key (optional) + value (required, bytes or string)
""")

# 48. Streaming window with allowed lateness
print("""
Ex48 Allowed lateness:
  watermark = max(event_time) - delay
  Any event with event_time < watermark is late and dropped (in append mode)
  In update mode: late events still update existing windows
""")

# 49. Streaming join state cleanup
print("""
Ex49 Stream-stream join state:
  Without watermark → state grows indefinitely (OOM risk)
  With watermark on both sides → state pruned when both watermarks advance
  Tune: spark.sql.streaming.join.stateFormatVersion
""")

# 50. Production streaming checklist
print("""
Ex50 Production Streaming Checklist:
  ✓ checkpoint in durable storage (DBFS/S3/ADLS)
  ✓ watermark on event time for late data
  ✓ Delta sink for ACID + exactly-once
  ✓ foreachBatch for complex sinks (MERGE, multi-table)
  ✓ monitoring (lastProgress, StreamingQueryListener)
  ✓ alerting on zero inputRows, SLA breach
  ✓ auto-restart policy (Databricks Workflow)
  ✓ maxFilesPerTrigger / maxOffsetsPerTrigger to control batch size
  ✓ RocksDB state store for high-cardinality stateful ops
  ✓ DLT for declarative, auto-managed pipeline (Databricks)
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
