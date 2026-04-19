# ============================================================================
# Examples 2.4 — Structured Streaming Basics  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================
# NOTE: Many streaming examples require a running source.
#       We use the "rate" source for local testing and file source for file-based.
#       In Databricks: use Kafka, Event Hub, Delta, Auto Loader (cloudFiles).
# ============================================================================

import os, time
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType, IntegerType

spark = (SparkSession.builder
    .appName("streaming-basics-examples")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/streaming_examples"
os.makedirs(BASE, exist_ok=True)

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Read from "rate" source — generates rows at a fixed rate (good for testing)
rate_stream = spark.readStream \
    .format("rate") \
    .option("rowsPerSecond", 5) \
    .load()
print("Ex01 isStreaming:", rate_stream.isStreaming)  # True
rate_stream.printSchema()

# 2. Write stream to console (memory sink for testing)
query1 = rate_stream.writeStream \
    .format("console") \
    .option("numRows", 5) \
    .outputMode("append") \
    .start()
time.sleep(3)
query1.stop()
print("Ex02 console sink ok")

# 3. Stream to memory sink — queryable via SQL
query2 = rate_stream.writeStream \
    .format("memory") \
    .queryName("rate_table") \
    .outputMode("append") \
    .start()
time.sleep(3)
spark.sql("SELECT * FROM rate_table LIMIT 5").show()
query2.stop()

# 4. Check query status
query3 = rate_stream.writeStream.format("console").outputMode("append").start()
print("Ex04 isActive:", query3.isActive)
print("Ex04 status:", query3.status)
query3.stop()

# 5. lastProgress — metrics of last micro-batch
query4 = rate_stream.writeStream.format("console").outputMode("append").start()
time.sleep(3)
print("Ex05 lastProgress:", query4.lastProgress)
query4.stop()

# 6. awaitTermination with timeout
query5 = rate_stream.writeStream.format("console").outputMode("append").start()
query5.awaitTermination(timeout=2)
query5.stop()
print("Ex06 awaitTermination ok")

# 7. Add column transformation to stream
enriched = rate_stream.withColumn("doubled_value", F.col("value") * 2) \
                      .withColumn("processing_time", F.current_timestamp())
q7 = enriched.writeStream.format("console").outputMode("append").start()
time.sleep(3)
q7.stop()

# 8. Filter in stream
filtered = rate_stream.filter(F.col("value") % 2 == 0)
q8 = filtered.writeStream.format("console").outputMode("append").start()
time.sleep(3)
q8.stop()

# 9. File source — read from directory as stream
FILE_SRC = f"{BASE}/file_source"
FILE_OUT = f"{BASE}/file_out"
FILE_CHK = f"{BASE}/file_chk"
os.makedirs(FILE_SRC, exist_ok=True)

schema = StructType([
    StructField("id",     IntegerType(), True),
    StructField("event",  StringType(),  True),
    StructField("amount", DoubleType(),  True),
])

# Write a batch file to be picked up
spark.createDataFrame([(1,"click",10.0),(2,"purchase",99.0)], ["id","event","amount"]) \
     .write.mode("overwrite").json(FILE_SRC)

file_stream = spark.readStream \
    .schema(schema) \
    .option("maxFilesPerTrigger", 1) \
    .json(FILE_SRC)
print("Ex09 file stream schema:", file_stream.schema)

# 10. Write file stream to parquet sink
q10 = file_stream.writeStream \
    .format("parquet") \
    .option("path", FILE_OUT) \
    .option("checkpointLocation", FILE_CHK) \
    .outputMode("append") \
    .start()
q10.processAllAvailable()
q10.stop()
result = spark.read.parquet(FILE_OUT)
print("Ex10 parquet sink rows:", result.count())

# 11. Write stream to Delta sink
DELTA_OUT = f"{BASE}/delta_out"
DELTA_CHK  = f"{BASE}/delta_chk"
q11 = file_stream.writeStream \
    .format("delta") \
    .option("path", DELTA_OUT) \
    .option("checkpointLocation", DELTA_CHK) \
    .outputMode("append") \
    .start()
q11.processAllAvailable()
q11.stop()
print("Ex11 delta sink rows:", spark.read.format("delta").load(DELTA_OUT).count())

# 12. Trigger.Once — process all available data then stop
q12 = file_stream.writeStream \
    .format("console") \
    .trigger(once=True) \
    .start()
q12.awaitTermination()
print("Ex12 Trigger.Once done")

# 13. Trigger availableNow (Spark 3.3+)
try:
    q13 = file_stream.writeStream \
        .format("console") \
        .trigger(availableNow=True) \
        .start()
    q13.awaitTermination()
    print("Ex13 Trigger.AvailableNow done")
except Exception as e:
    print("Ex13:", str(e)[:60])

# 14. Trigger processing time (micro-batch interval)
q14 = rate_stream.writeStream \
    .format("console") \
    .trigger(processingTime="2 seconds") \
    .outputMode("append") \
    .start()
time.sleep(5)
q14.stop()
print("Ex14 2-second trigger done")

# 15. Trigger continuous (experimental, low-latency)
# q = df.writeStream.trigger(continuous="1 second").start()
print("Ex15 continuous processing trigger: .trigger(continuous='1 second')")

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Stateful aggregation with complete output mode
counts = rate_stream \
    .withColumn("mod", F.col("value") % 5) \
    .groupBy("mod") \
    .count()

q16 = counts.writeStream \
    .format("memory") \
    .queryName("mod_counts") \
    .outputMode("complete") \
    .start()
time.sleep(5)
spark.sql("SELECT * FROM mod_counts ORDER BY mod").show()
q16.stop()

# 17. Windowed aggregation (time-based tumbling window)
windowed = rate_stream \
    .withWatermark("timestamp", "10 seconds") \
    .groupBy(F.window("timestamp", "5 seconds")) \
    .count()

q17 = windowed.writeStream \
    .format("console") \
    .outputMode("update") \
    .start()
time.sleep(10)
q17.stop()
print("Ex17 windowed agg done")

# 18. Watermark for late data handling
watermarked = rate_stream \
    .withWatermark("timestamp", "30 seconds") \
    .groupBy(F.window("timestamp", "10 seconds"), "value") \
    .count()
print("Ex18 watermarked stream defined")

# 19. Sliding window (window, slide duration)
sliding = rate_stream \
    .withWatermark("timestamp", "20 seconds") \
    .groupBy(F.window("timestamp", "10 seconds", "5 seconds")) \
    .agg(F.avg("value").alias("avg_val"))
print("Ex19 sliding window defined")

# 20. Session window (Spark 3.2+)
try:
    session = rate_stream \
        .withWatermark("timestamp", "30 seconds") \
        .groupBy(F.session_window("timestamp", "10 seconds")) \
        .count()
    print("Ex20 session window defined")
except AttributeError:
    print("Ex20 session_window requires Spark 3.2+")

# 21. foreachBatch — custom batch processing
def process_batch(batch_df, batch_id):
    print(f"Batch {batch_id}: {batch_df.count()} rows")
    batch_df.write.mode("append").parquet(f"{BASE}/foreach_out")

q21 = file_stream.writeStream \
    .foreachBatch(process_batch) \
    .start()
q21.processAllAvailable()
q21.stop()
print("Ex21 foreachBatch done")

# 22. foreach (row-by-row sink)
class ConsoleSink:
    def open(self, partition_id, epoch_id): return True
    def process(self, row): pass  # print(row)
    def close(self, error): pass

q22 = file_stream.writeStream.foreach(ConsoleSink()).start()
q22.processAllAvailable()
q22.stop()
print("Ex22 foreach sink done")

# 23. Checkpoint location — enables fault tolerance + exactly-once
print("Ex23 checkpoint: always set .option('checkpointLocation', path) for production")

# 24. Multiple queries on same stream
q24a = rate_stream.writeStream.format("console").outputMode("append") \
                  .queryName("q_a").start()
q24b = rate_stream.filter(F.col("value") > 5) \
                  .writeStream.format("console").outputMode("append") \
                  .queryName("q_b").start()
time.sleep(3)
q24a.stop(); q24b.stop()
print("Ex24 parallel queries done")

# 25. StreamingQueryManager
sqm = spark.streams
print("Ex25 active queries:", [q.name for q in sqm.active])

# 26. Kafka source pattern (not executed — requires Kafka)
print("""
Ex26 Kafka source:
  df = spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "broker:9092")
    .option("subscribe", "events")
    .option("startingOffsets", "earliest")
    .load()
  df = df.selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)")
""")

# 27. Kafka sink pattern
print("""
Ex27 Kafka sink:
  df.selectExpr("CAST(id AS STRING) AS key", "to_json(struct(*)) AS value")
    .writeStream
    .format("kafka")
    .option("kafka.bootstrap.servers","broker:9092")
    .option("topic","output_events")
    .option("checkpointLocation", ckpt_path)
    .start()
""")

# 28. Auto Loader (Databricks cloudFiles) — efficient incremental file ingestion
print("""
Ex28 Auto Loader (Databricks only):
  df = spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format","json")
    .option("cloudFiles.schemaLocation", schema_path)
    .load("abfss://container@account.dfs.core.windows.net/raw/")
""")

# 29. Output modes summary
print("""
Ex29 Output Modes:
  append   — only new rows (default for stateless; requires watermark for stateful)
  update   — only changed rows since last trigger
  complete — entire result table (requires aggregation)
""")

# 30. Query restart from checkpoint
print("Ex30 Restart: re-use same checkpointLocation path; query resumes from last committed offset")

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Stateful operations — mapGroupsWithState
print("Ex31 mapGroupsWithState: arbitrary stateful processing with custom state schema")

# 32. flatMapGroupsWithState
print("Ex32 flatMapGroupsWithState: emit 0+ rows per state update (session tracking, event detection)")

# 33. Streaming deduplication
dedup_stream = rate_stream.dropDuplicates(["value"])
print("Ex33 dedup on value column — uses state to track seen values within watermark")

# 34. Stream-static join
static_lookup = spark.createDataFrame([(1,"click"),(2,"purchase")],["val","label"])
joined_stream = rate_stream.join(static_lookup, rate_stream.value == static_lookup.val, "left")
print("Ex34 stream-static join defined")

# 35. Stream-stream join with watermark
rate2 = spark.readStream.format("rate").option("rowsPerSecond",3).load() \
             .withColumnRenamed("value","value2").withColumnRenamed("timestamp","ts2")
ss_join = rate_stream.withWatermark("timestamp","10 seconds") \
    .join(rate2.withWatermark("ts2","10 seconds"),
          F.expr("value = value2 AND timestamp BETWEEN ts2 - INTERVAL 5 SECONDS AND ts2 + INTERVAL 5 SECONDS"),
          "leftOuter")
print("Ex35 stream-stream join with watermark defined")

# 36. Delta as streaming source (incremental reads)
print("""
Ex36 Delta as source:
  df = spark.readStream
    .format("delta")
    .option("ignoreChanges","true")
    .load("/path/to/delta")
""")

# 37. Delta as streaming sink (MERGE via foreachBatch)
def upsert_to_delta(micro_batch_df, batch_id):
    from delta.tables import DeltaTable
    if DeltaTable.isDeltaTable(spark, DELTA_OUT):
        dt = DeltaTable.forPath(spark, DELTA_OUT)
        dt.alias("t").merge(micro_batch_df.alias("s"), "t.id = s.id") \
          .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()
    else:
        micro_batch_df.write.format("delta").save(DELTA_OUT)
print("Ex37 MERGE via foreachBatch pattern shown")

# 38. Structured Streaming with MLflow model
print("""
Ex38 Stream scoring:
  model = mlflow.spark.load_model("models:/MyModel/production")
  scored = model.transform(stream_df)
  scored.writeStream.format("delta").start(out_path)
""")

# 39. Rate-limit micro-batches (maxOffsetsPerTrigger for Kafka)
print("Ex39 Kafka: .option('maxOffsetsPerTrigger', 10000) limits records per batch")

# 40. Schema inference with Auto Loader
print("Ex40 Auto Loader: .option('cloudFiles.inferColumnTypes','true') for schema inference")

# 41. Rescue data column (Auto Loader)
print("Ex41 _rescued_data column: Auto Loader stores schema-mismatch data here")

# 42. Streaming metrics via SparkListener
print("Ex42 Custom SparkListener: subscribe to QueryProgress events for custom monitoring")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Exactly-once semantics
print("""
Ex43 Exactly-once:
  - Source: idempotent/replayable (Kafka, Delta)
  - Sink:   idempotent (Delta) or transactional
  - Checkpoint: exactly-once for Delta sinks
""")

# 44. At-least-once vs exactly-once
print("Ex44 At-least-once: checkpoint + idempotent sink. Exactly-once: transactional sink (Delta).")

# 45. Backpressure handling
print("Ex45 Backpressure: Spark structured streaming auto-adapts batch size; no explicit config needed")

# 46. Multi-hop streaming (Bronze → Silver → Gold)
print("""
Ex46 Multi-hop streaming:
  bronze_stream → write Delta (bronze)
  silver_stream = readStream(bronze) → transform → write Delta (silver)
  gold_stream   = readStream(silver) → agg      → write Delta (gold)
""")

# 47. DLT (Delta Live Tables) — declarative streaming pipelines (Databricks)
print("""
Ex47 Delta Live Tables:
  @dlt.table
  def bronze():
      return spark.readStream.format("cloudFiles")...

  @dlt.table
  @dlt.expect("valid_amount", "amount > 0")
  def silver():
      return dlt.read_stream("bronze").filter(...)
""")

# 48. Streaming checkpoints — internal structure
print("Ex48 Checkpoint dirs: offsets/ (committed), commits/ (completed), state/ (state store)")

# 49. State store — RocksDB vs HDFS
print("Ex49 RocksDB state store: spark.conf.set('spark.sql.streaming.stateStore.providerClass', 'org.apache.spark.sql.execution.streaming.state.RocksDBStateStoreProvider')")

# 50. Production streaming checklist
print("""
Ex50 Production Streaming Checklist:
  ✓ Set checkpointLocation for fault tolerance
  ✓ Set watermark for late data
  ✓ Use Delta as sink for ACID guarantees
  ✓ Monitor lastProgress (inputRowsPerSecond, processedRowsPerSecond)
  ✓ Set trigger interval appropriate to SLA
  ✓ Use foreachBatch for complex upsert/merge logic
  ✓ Scale cluster with auto-scaling enabled
  ✓ Alert on processingTime > trigger interval (backlog growing)
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
