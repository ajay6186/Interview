# ============================================================================
# Examples 5.6 — Real-World Streaming Pipeline  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Project: IoT Sensor + Clickstream → Medallion (Bronze/Silver/Gold)
# Covers: Kafka ingest, Auto Loader, watermarks, anomalies, CDF, CI/CD hooks
# ============================================================================

import os, json, time, datetime, random
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import (StructType, StructField, StringType,
                                DoubleType, LongType, TimestampType,
                                BooleanType, IntegerType)

spark = (SparkSession.builder
    .appName("streaming-pipeline-examples")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .config("spark.databricks.delta.optimizeWrite.enabled", "true")
    .config("spark.databricks.delta.autoCompact.enabled", "true")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE  = "/tmp/streaming_pipeline"
PATHS = {
    "bronze":    f"{BASE}/bronze/events",
    "silver":    f"{BASE}/silver/events",
    "gold_agg":  f"{BASE}/gold/windowed_metrics",
    "gold_alert":f"{BASE}/gold/anomaly_alerts",
    "dlq":       f"{BASE}/dlq/events",
    "ckpt":      f"{BASE}/checkpoints",
}
for p in PATHS.values():
    os.makedirs(p, exist_ok=True)

# ── SEED: simulated sensor events ────────────────────────────────────────────
random.seed(42)
event_schema = StructType([
    StructField("event_id",   StringType()),
    StructField("device_id",  StringType()),
    StructField("region",     StringType()),
    StructField("metric",     StringType()),
    StructField("value",      DoubleType()),
    StructField("event_time", TimestampType()),
])

raw_events = spark.createDataFrame([
    ("e001","dev-A","us-east","temperature", 72.1,"2024-01-15 10:00:00"),
    ("e002","dev-B","us-east","temperature", 75.3,"2024-01-15 10:00:05"),
    ("e003","dev-A","us-east","humidity",    45.0,"2024-01-15 10:00:10"),
    ("e004","dev-C","eu-west","temperature", 68.5,"2024-01-15 10:00:15"),
    ("e005","dev-A","us-east","temperature",250.0,"2024-01-15 10:00:20"),  # anomaly!
    ("e006","dev-B","us-east","humidity",    50.2,"2024-01-15 10:00:25"),
    ("e007","dev-D","ap-south","pressure",  1013.,"2024-01-15 10:00:30"),
    ("e008","dev-C","eu-west","humidity",    55.1,"2024-01-15 10:00:35"),
    ("e009","dev-A","us-east","temperature", 71.8,"2024-01-15 10:00:40"),
    ("e010","dev-B","us-east","temperature", 74.9,"2024-01-15 10:00:45"),
], ["event_id","device_id","region","metric","value","event_time"])

raw_events = raw_events.withColumn("event_time", F.to_timestamp("event_time"))

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Event schema definition
print("Ex01 event_schema:", event_schema.simpleString())

# 2. Kafka readStream skeleton
print("""Ex02 Kafka readStream:
  spark.readStream
    .format('kafka')
    .option('kafka.bootstrap.servers', 'broker:9092')
    .option('subscribe', 'iot_events')
    .option('startingOffsets', 'latest')
    .option('maxOffsetsPerTrigger', 100_000)
    .load()
""")

# 3. Auto Loader readStream skeleton
print("""Ex03 Auto Loader readStream:
  spark.readStream
    .format('cloudFiles')
    .option('cloudFiles.format', 'json')
    .option('cloudFiles.schemaLocation', '/schemas/iot')
    .option('cloudFiles.useNotifications', 'true')
    .load('abfss://landing@account.dfs.core.windows.net/iot/')
""")

# 4. Deserialise Kafka JSON value
print("""Ex04 Deserialise Kafka value:
  raw.selectExpr('CAST(value AS STRING) AS json_str', 'timestamp AS kafka_ts')
     .select(F.from_json('json_str', event_schema).alias('d'), 'kafka_ts')
     .select('d.*', 'kafka_ts')
""")

# 5. Write Bronze — Delta append
print("""Ex05 Bronze write:
  parsed.writeStream
    .format('delta')
    .outputMode('append')
    .option('checkpointLocation', '/ckpt/bronze_events')
    .start('/bronze/events')
""")

# 6. Read Bronze for Silver transformation
print("""Ex06 Silver read from Bronze:
  silver_input = spark.readStream.format('delta').load('/bronze/events')
""")

# 7. Null filter (Silver validation)
print("Ex07 Silver null filter:")
silver = raw_events.filter(
    F.col("event_id").isNotNull() &
    F.col("device_id").isNotNull() &
    F.col("value").isNotNull())
print(f"  rows after null filter: {silver.count()}")

# 8. Value range validation
print("Ex08 Range validation (temperature sensor bounds):")
valid = silver.filter(F.col("value").between(-100, 400))
print(f"  valid rows: {valid.count()} / {silver.count()}")

# 9. Event deduplication in Silver
print("""Ex09 Silver deduplication via foreachBatch MERGE:
  spark.sql('''
    MERGE INTO silver.events t USING batch s
    ON t.event_id = s.event_id
    WHEN NOT MATCHED THEN INSERT *
  ''')
  # Idempotent — re-running same batch produces no duplicates
""")

# 10. Dead letter queue (DLQ)
bad_schema = spark.createDataFrame([
    ("e011", None, "us-east", "temperature", 72.0, "2024-01-15 10:01:00"),
], ["event_id","device_id","region","metric","value","event_time"])
bad_schema = bad_schema.withColumn("event_time", F.to_timestamp("event_time"))
dlq = bad_schema.filter(F.col("device_id").isNull())
print(f"Ex10 DLQ: {dlq.count()} malformed record(s) routed to DLQ")

# 11. Checkpoint location naming convention
print("Ex11 Checkpoint naming: /ckpt/<source>_to_<target>_<purpose>")
print("     e.g. /ckpt/kafka_to_bronze, /ckpt/bronze_to_silver, /ckpt/silver_to_gold_metrics")

# 12. Trigger — fixed interval
print("Ex12 .writeStream.trigger(processingTime='1 minute')  — micro-batch every 60 s")

# 13. Trigger — availableNow
print("Ex13 .writeStream.trigger(availableNow=True)  — process all then terminate")

# 14. Output mode selection
print("Ex14 Output modes:")
print("  'append'   — new rows only (Bronze, Silver)")
print("  'update'   — changed aggregates (windowed Gold with watermark)")
print("  'complete' — full result (small aggregations, no watermark)")

# 15. stream.awaitTermination()
print("Ex15 query.awaitTermination()  — block driver until stream stops or errors")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Watermarked 5-min tumbling window
windowed_metrics = (raw_events
    .withWatermark("event_time", "10 minutes")
    .groupBy(
        F.window("event_time", "5 minutes").alias("window"),
        "device_id", "region", "metric")
    .agg(
        F.avg("value").alias("avg_value"),
        F.min("value").alias("min_value"),
        F.max("value").alias("max_value"),
        F.count("*").alias("event_count"))
    .withColumn("window_start", F.col("window.start"))
    .withColumn("window_end",   F.col("window.end"))
    .drop("window"))
print(f"Ex16 windowed metrics rows: {windowed_metrics.count()}")
windowed_metrics.show(3, truncate=False)

# 17. Sliding window (overlap)
print("Ex17 Sliding: 10-min window, 5-min slide:")
print("  .groupBy(F.window('event_time', '10 minutes', '5 minutes'), 'device_id')")

# 18. Z-score anomaly detection (batch)
w = Window.partitionBy("device_id", "metric")
scored = (raw_events
    .withColumn("mean",   F.avg("value").over(w))
    .withColumn("stddev", F.stddev("value").over(w))
    .withColumn("z_score",
        (F.col("value") - F.col("mean")) /
        F.when(F.col("stddev") > 0, F.col("stddev")).otherwise(F.lit(1.0)))
    .withColumn("is_anomaly", F.abs(F.col("z_score")) > 3.0))

anomalies = scored.filter(F.col("is_anomaly"))
print(f"Ex18 anomalies detected: {anomalies.count()}")

# 19. foreachBatch for anomaly sink
print("""Ex19 foreachBatch anomaly sink:
def detect_and_write(df, epoch_id):
    w = Window.partitionBy('device_id','metric')
    scored = (df
        .withColumn('mean',   F.avg('value').over(w))
        .withColumn('stddev', F.stddev_samp('value').over(w))
        .withColumn('z_score',
            (F.col('value') - F.col('mean')) /
            F.when(F.col('stddev') > 0, F.col('stddev')).otherwise(1.0))
        .withColumn('is_anomaly', F.abs(F.col('z_score')) > 3.0))
    (scored.filter(F.col('is_anomaly'))
        .write.format('delta').mode('append').save('/gold/anomaly_alerts'))

silver_stream.writeStream.foreachBatch(detect_and_write).start()
""")

# 20. CDF enable on Silver
print("Ex20 Enable CDF on Silver:")
print("  spark.sql(\"ALTER TABLE silver.events SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')\")")

# 21. CDF downstream consumer
print("""Ex21 CDF downstream consumer:
  cdf = (spark.readStream.format('delta')
      .option('readChangeFeed', 'true')
      .option('startingVersion', 'latest')
      .table('silver.events'))
  # Propagate inserts + updates to Gold without reprocessing Silver
""")

# 22. Multi-metric aggregation
agg_df = (raw_events
    .groupBy("region", "metric")
    .agg(
        F.avg("value").alias("avg"),
        F.stddev("value").alias("stddev"),
        F.count("*").alias("count"),
        F.min("event_time").alias("first_seen"),
        F.max("event_time").alias("last_seen")))
print(f"Ex22 multi-metric agg: {agg_df.count()} rows")
agg_df.show(truncate=False)

# 23. Per-device running total (window function)
running = (raw_events
    .withColumn("running_sum",
        F.sum("value").over(
            Window.partitionBy("device_id", "metric")
                  .orderBy("event_time")
                  .rowsBetween(Window.unboundedPreceding, Window.currentRow))))
print(f"Ex23 running totals: {running.count()} rows")

# 24. Alert threshold (static)
HIGH_TEMP_THRESHOLD = 200.0
alerts = raw_events.filter(
    (F.col("metric") == "temperature") & (F.col("value") > HIGH_TEMP_THRESHOLD))
print(f"Ex24 static threshold alerts: {alerts.count()}")

# 25. Device heartbeat check (last seen)
last_seen = (raw_events
    .groupBy("device_id")
    .agg(F.max("event_time").alias("last_event_time")))
print(f"Ex25 device last-seen:")
last_seen.show()

# 26. Schema enforcement on Bronze read
print("""Ex26 Bronze with explicit schema (reject schema-on-read drift):
  spark.readStream.format('delta')
       .option('inferSchema', 'false')
       .schema(event_schema)
       .load('/bronze/events')
""")

# 27. Repartition before write (avoid small files)
print("""Ex27 Repartition before Delta write:
  (df.repartition(8)
     .write.format('delta').mode('append').save('/silver/events'))
""")

# 28. OPTIMIZE / ZORDER Gold table
print("Ex28 Post-load optimize:")
print("  spark.sql('OPTIMIZE gold.windowed_metrics ZORDER BY (region, metric)')")

# 29. VACUUM Bronze (remove old files)
print("Ex29 VACUUM Bronze (keep 7-day history):")
print("  spark.sql('VACUUM bronze.events RETAIN 168 HOURS')")

# 30. partitionBy on Delta write
print("""Ex30 Partition Gold by date for query pruning:
  (df.withColumn('date', F.to_date('window_start'))
     .write.format('delta')
     .partitionBy('date', 'region')
     .mode('append')
     .save('/gold/windowed_metrics'))
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. End-to-end pipeline function
def run_batch_pipeline(input_df, base_path: str):
    """Simulate a single micro-batch through Bronze → Silver → Gold."""
    # Bronze: append raw
    bronze_path = f"{base_path}/bronze"
    input_df.write.format("delta").mode("append").save(bronze_path)

    # Silver: validate + deduplicate
    bronze_df = spark.read.format("delta").load(bronze_path)
    silver_df = bronze_df.filter(
        F.col("event_id").isNotNull() &
        F.col("device_id").isNotNull() &
        F.col("value").between(-200, 500))
    silver_path = f"{base_path}/silver"
    silver_df.write.format("delta").mode("append").save(silver_path)

    # Gold: windowed metrics
    gold_df = (silver_df
        .groupBy("device_id", "region", "metric",
                 F.window("event_time", "5 minutes"))
        .agg(F.avg("value").alias("avg_value"),
             F.count("*").alias("event_count"))
        .withColumn("window_start", F.col("window.start"))
        .drop("window"))
    gold_path = f"{base_path}/gold"
    gold_df.write.format("delta").mode("append").save(gold_path)

    return silver_df.count(), gold_df.count()

silver_count, gold_count = run_batch_pipeline(raw_events, f"{BASE}/pipeline_run")
print(f"Ex31 pipeline run: silver={silver_count} gold={gold_count}")

# 32. Stream lag metric
print("""Ex32 Stream lag tracking:
def log_progress(query):
    p = query.lastProgress
    if p:
        lag = p['numInputRows'] / max(p['inputRowsPerSecond'], 0.001)
        print(json.dumps({
            'batch_id': p['batchId'],
            'input_rows': p['numInputRows'],
            'rows_per_sec': p['processedRowsPerSecond'],
            'lag_sec': round(lag, 2),
        }))
""")

# 33. Multi-hop write with persist()
print("""Ex33 foreachBatch multi-hop with persist:
def multi_hop(df, epoch_id):
    df.persist()
    # Silver
    df.filter(F.col('value').isNotNull()).write.format('delta').mode('append').save(SILVER)
    # Gold alerts
    df.filter(F.col('value') > 200).write.format('delta').mode('append').save(ALERTS)
    # DLQ
    df.filter(F.col('value').isNull()).write.format('delta').mode('append').save(DLQ)
    df.unpersist()
""")

# 34. Idempotent MERGE in foreachBatch
print("""Ex34 Idempotent Silver MERGE:
def merge_silver(df, epoch_id):
    df.createOrReplaceTempView('incoming')
    spark.sql('''
        MERGE INTO silver.events tgt
        USING incoming src
        ON tgt.event_id = src.event_id
        WHEN NOT MATCHED THEN INSERT *
    ''')
""")

# 35. Bronze compaction (small-file fix)
print("""Ex35 Bronze auto-compaction config:
spark.conf.set('spark.databricks.delta.optimizeWrite.enabled', 'true')
spark.conf.set('spark.databricks.delta.autoCompact.enabled',   'true')
# Or: scheduled OPTIMIZE job:
# spark.sql('OPTIMIZE bronze.events')
""")

# 36. Schema evolution in Silver stream
print("""Ex36 Schema evolution:
silver_stream.writeStream
    .format('delta')
    .option('mergeSchema', 'true')  # allow new columns
    .option('checkpointLocation', CKPT)
    .start(SILVER_PATH)
""")

# 37. Graceful shutdown
print("""Ex37 Graceful stream shutdown:
import signal
query = silver_stream.writeStream.start()
def handler(sig, frame):
    query.stop()
    spark.stop()
signal.signal(signal.SIGTERM, handler)
query.awaitTermination()
""")

# 38. Device heartbeat SLA check
now_ts = datetime.datetime.utcnow()
last_events = {
    "dev-A": datetime.datetime(2024, 1, 15, 10, 0, 40),
    "dev-B": datetime.datetime(2024, 1, 15, 10, 0, 45),
    "dev-X": datetime.datetime(2024, 1, 15,  9, 0,  0),  # >30 min ago — alert
}
STALE_MINUTES = 30
print("Ex38 Heartbeat SLA check:")
for device, last in last_events.items():
    age = (now_ts - last).total_seconds() / 60
    status = "STALE" if age > STALE_MINUTES else "OK"
    print(f"  {device}: last_seen={last} age={age:.0f}min → {status}")

# 39. Back-pressure tuning
print("""Ex39 Back-pressure tuning knobs:
  maxOffsetsPerTrigger  = 50_000       # limit records/batch (Kafka)
  processingTime        = '2 minutes'  # slow down trigger
  spark.streaming.backpressure.enabled = true  # auto-rate limiting
  spark.streaming.kafka.maxRatePerPartition = 5000
""")

# 40. State size monitoring
print("""Ex40 State size metric (applyInPandasWithState):
  query.lastProgress['stateOperators'][0]['numRowsTotal']
  # Monitor: if this grows unboundedly, watermark is too large or state TTL missing
""")

# 41. Exactly-once end-to-end proof
print("""Ex41 Exactly-once guarantees:
  Source  : Kafka   → offsets committed after each successful batch (at-least-once source)
  Sink    : Delta   → MERGE keyed on event_id  (idempotent write = exactly-once result)
  Effect  : micro-batch can be retried any number of times, final Delta table has no duplicates
  Caveat  : non-idempotent sinks (REST APIs, external DBs without upsert) need custom dedup logic
""")

# 42. Full pipeline Databricks Workflow YAML
print("""Ex42 Databricks Workflow for streaming pipeline:
resources:
  jobs:
    streaming_pipeline:
      trigger: {continuous: {pause_status: UNPAUSED}}
      tasks:
        - task_key: kafka_to_bronze
          spark_python_task: {python_file: 'src/bronze_ingest.py'}
        - task_key: bronze_to_silver
          depends_on: [{task_key: kafka_to_bronze}]
          spark_python_task: {python_file: 'src/silver_transform.py'}
        - task_key: silver_to_gold
          depends_on: [{task_key: bronze_to_silver}]
          spark_python_task: {python_file: 'src/gold_aggregate.py'}
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Stream-stream join (sensor + metadata)
print("""Ex43 Stream-stream join (events + device_metadata):
  events_stream = spark.readStream.format('delta').load('/silver/events')
    .withWatermark('event_time', '10 minutes')

  meta_stream = spark.readStream.format('delta').load('/silver/device_meta')
    .withWatermark('updated_at', '1 hour')

  enriched = (events_stream
    .join(meta_stream,
          (events_stream.device_id == meta_stream.device_id) &
          (meta_stream.updated_at <= events_stream.event_time),
          'left'))
""")

# 44. Stateful session tracking
print("""Ex44 Session tracking with mapGroupsWithState:
  from pyspark.sql.streaming.state import GroupStateTimeout
  # Track active sessions per device — emit when gap > 30 min
  events_stream.groupBy('device_id')
    .applyInPandasWithState(
        track_session_fn,
        outputStructType='device_id STRING, session_start TIMESTAMP, event_count INT',
        stateStructType='session_start TIMESTAMP, event_count INT',
        outputMode='append',
        timeoutConf=GroupStateTimeout.EventTimeTimeout)
""")

# 45. Kafka write for downstream consumers
print("""Ex45 Write anomaly alerts back to Kafka:
  (alerts_df
    .select(
        F.col('device_id').cast('string').alias('key'),
        F.to_json(F.struct('event_id','device_id','value','z_score','event_time')).alias('value'))
    .write
    .format('kafka')
    .option('kafka.bootstrap.servers', 'broker:9092')
    .option('topic', 'iot_alerts')
    .save())
""")

# 46. Multi-region fan-out
print("""Ex46 Multi-region write (fan-out in foreachBatch):
REGION_PATHS = {'us-east': '/gold/us_east', 'eu-west': '/gold/eu_west', 'ap-south': '/gold/ap_south'}
def regional_write(df, epoch_id):
    df.persist()
    for region, path in REGION_PATHS.items():
        (df.filter(F.col('region') == region)
           .write.format('delta').mode('append').save(path))
    df.unpersist()
""")

# 47. ML scoring in streaming
print("""Ex47 Real-time ML scoring:
import mlflow
model_uri = 'models:/anomaly_classifier/production'
predict    = mlflow.pyfunc.spark_udf(spark, model_uri, result_type='double')

scored = silver_stream.withColumn(
    'anomaly_score',
    predict(F.struct('value','device_id','metric','region')))
""")

# 48. Dead letter reprocessing job
print("""Ex48 DLQ reprocessing:
  # Scheduled daily: fix DLQ records and re-ingest
  dlq_df = spark.read.format('delta').load('/dlq/events')
  fixed  = dlq_df.withColumn('device_id',
               F.coalesce('device_id', F.lit('unknown')))
  fixed.write.format('delta').mode('append').save('/bronze/events')
  # Clear processed DLQ records
  spark.sql("DELETE FROM delta.`/dlq/events` WHERE reprocessed = true")
""")

# 49. CI/CD integration test for streaming
print("""Ex49 CI integration test:
def test_silver_pipeline():
    test_events = spark.createDataFrame([
        ('e_test_1', 'dev-Z', 'us-east', 'temperature', 70.0, now()),
    ], schema)
    # write to Bronze
    test_events.write.format('delta').mode('append').save(TEST_BRONZE)
    # run silver transform
    result = transform_silver(spark.read.format('delta').load(TEST_BRONZE))
    # assert
    assert result.count() == 1
    assert result.filter(F.col('is_valid') == True).count() == 1
""")

# 50. End-to-end metrics emission
def emit_pipeline_metrics(pipeline: str, batch_id: int,
                           input_rows: int, silver_rows: int,
                           gold_rows: int, anomaly_count: int,
                           duration_ms: int):
    metrics = {
        "pipeline":       pipeline,
        "batch_id":       batch_id,
        "input_rows":     input_rows,
        "silver_rows":    silver_rows,
        "gold_rows":      gold_rows,
        "anomaly_count":  anomaly_count,
        "drop_rate_pct":  round((input_rows - silver_rows) / max(input_rows, 1) * 100, 2),
        "duration_ms":    duration_ms,
        "ts":             datetime.datetime.utcnow().isoformat(),
    }
    print(f"Ex50 METRICS {json.dumps(metrics)}")

emit_pipeline_metrics("iot_streaming", 42, 10_420, 10_415, 1_200, 3, 8_312)


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
