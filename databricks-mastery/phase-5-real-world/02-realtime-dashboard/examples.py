# ============================================================================
# Examples 5.2 — Real-Time Dashboard Pipeline  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: Structured Streaming, watermarks, windowed aggs, Delta sink, KPIs
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType, IntegerType

spark = (SparkSession.builder
    .appName("realtime-dashboard")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/rt_dash"
for p in ["bronze/events","silver/events","gold/kpi_window","gold/kpi_running","checkpoints"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

# ── Event schema ──────────────────────────────────────────────────────────────
EVENT_SCHEMA = StructType([
    StructField("event_id",    StringType(),    True),
    StructField("user_id",     StringType(),    True),
    StructField("event_type",  StringType(),    True),  # page_view / add_to_cart / purchase
    StructField("product_id",  StringType(),    True),
    StructField("amount",      DoubleType(),    True),
    StructField("event_time",  TimestampType(), True),
    StructField("session_id",  StringType(),    True),
])

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Rate source — synthetic events for testing
print("""Ex01 Rate source (synthetic):
stream = spark.readStream.format('rate') \\
    .option('rowsPerSecond', 100).load() \\
    .select(F.col('value').alias('event_id'),
            F.current_timestamp().alias('event_time'))
""")

# 2. Batch seed data for static testing
batch_events = spark.createDataFrame([
    ("e001","u1","page_view", "p_A", None,   "2024-01-15 10:00:01","s1"),
    ("e002","u1","add_to_cart","p_A",None,   "2024-01-15 10:00:30","s1"),
    ("e003","u1","purchase",  "p_A",999.99,  "2024-01-15 10:01:00","s1"),
    ("e004","u2","page_view", "p_B", None,   "2024-01-15 10:00:45","s2"),
    ("e005","u2","add_to_cart","p_B",None,   "2024-01-15 10:01:10","s2"),
    ("e006","u3","page_view", "p_C", None,   "2024-01-15 10:00:20","s3"),
    ("e007","u3","page_view", "p_A", None,   "2024-01-15 10:01:30","s3"),
    ("e008","u4","purchase",  "p_B",699.00,  "2024-01-15 10:02:00","s4"),
    # late event (arrives at t+5min but event_time is 10:00:10)
    ("e009","u5","purchase",  "p_C",149.99,  "2024-01-15 10:00:10","s5"),
], ["event_id","user_id","event_type","product_id","amount","event_time","session_id"])

# Cast string timestamp to proper type
batch_events = batch_events \
    .withColumn("event_time", F.to_timestamp("event_time","yyyy-MM-dd HH:mm:ss")) \
    .withColumn("amount", F.col("amount").cast("double"))

batch_events.printSchema()
batch_events.show(5, truncate=False)
print("Ex02 batch event seed loaded:", batch_events.count())

# 3. Write seed events to bronze Delta
batch_events \
    .withColumn("_ingested_at", F.current_timestamp()) \
    .write.format("delta").mode("overwrite").save(f"{BASE}/bronze/events")
print("Ex03 bronze events written:", batch_events.count())

# 4. Read bronze as streaming source (trigger once)
print("""Ex04 Read Delta as streaming source:
stream = spark.readStream.format('delta').load('/bronze/events')
""")

# 5. Event type distribution
batch_events.groupBy("event_type").count().show()

# 6. Null amount for non-purchase events
null_amounts = batch_events.filter(
    (F.col("event_type") != "purchase") & F.col("amount").isNull()
).count()
print(f"Ex06 non-purchase events with null amount (expected): {null_amounts}")

# 7. Event counts by hour
batch_events \
    .withColumn("hour", F.date_format("event_time","yyyy-MM-dd HH:00:00")) \
    .groupBy("hour").count().show()

# 8. Unique active users in window
active_users = batch_events \
    .filter(F.col("event_time").between("2024-01-15 10:00:00", "2024-01-15 10:02:00")) \
    .select("user_id").distinct().count()
print(f"Ex08 active users in 2-min window: {active_users}")

# 9. Conversion rate (purchase / unique_users)
total_users    = batch_events.select("user_id").distinct().count()
buyers         = batch_events.filter(F.col("event_type") == "purchase").select("user_id").distinct().count()
conversion_pct = round(buyers / total_users * 100, 1)
print(f"Ex09 conversion rate: {buyers}/{total_users} = {conversion_pct}%")

# 10. Total revenue
total_rev = batch_events.agg(F.sum("amount")).collect()[0][0]
print(f"Ex10 total revenue: {total_rev}")

# 11. Average order value
aov = batch_events.filter(F.col("event_type") == "purchase") \
    .agg(F.avg("amount").alias("aov")).collect()[0][0]
print(f"Ex11 average order value: {round(aov, 2)}")

# 12. Funnel: page_view → add_to_cart → purchase
funnel = {et: batch_events.filter(F.col("event_type") == et).select("user_id").distinct().count()
          for et in ["page_view","add_to_cart","purchase"]}
print(f"Ex12 funnel: {funnel}")

# 13. Session depth (events per session)
session_depth = batch_events.groupBy("session_id").count().orderBy(F.desc("count"))
session_depth.show()

# 14. Time to purchase (first page_view → purchase per session)
first_pv = batch_events.filter(F.col("event_type") == "page_view") \
    .groupBy("session_id").agg(F.min("event_time").alias("first_view"))
purchase_ts = batch_events.filter(F.col("event_type") == "purchase") \
    .select("session_id", F.col("event_time").alias("purchase_time"))
ttp = first_pv.join(purchase_ts, "session_id") \
    .withColumn("time_to_purchase_sec",
        (F.col("purchase_time").cast("long") - F.col("first_view").cast("long")))
ttp.show()
print("Ex14 time-to-purchase calculated")

# 15. Top products by page views
batch_events.filter(F.col("event_type") == "page_view") \
    .groupBy("product_id").count().orderBy(F.desc("count")).show()

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. 5-minute tumbling window aggregation (batch mode)
windowed_kpi = (batch_events
    .groupBy(
        F.window("event_time", "5 minutes").alias("window"),
        "event_type"
    )
    .agg(
        F.count("*").alias("event_count"),
        F.sum("amount").alias("revenue"),
        F.countDistinct("user_id").alias("unique_users")
    )
    .withColumn("window_start", F.col("window.start"))
    .withColumn("window_end",   F.col("window.end"))
    .drop("window"))
windowed_kpi.show(truncate=False)
print("Ex16 5-min tumbling window done")

# 17. 10-minute sliding window (5-min slide)
sliding_kpi = (batch_events
    .groupBy(F.window("event_time", "10 minutes", "5 minutes"))
    .agg(F.count("*").alias("events"), F.sum("amount").alias("revenue"))
    .withColumn("start", F.col("window.start"))
    .withColumn("end",   F.col("window.end"))
    .drop("window"))
sliding_kpi.orderBy("start").show(truncate=False)
print("Ex17 sliding window done")

# 18. Watermark concept for late data
print("""Ex18 Watermark in streaming:
stream.withWatermark('event_time', '10 minutes')   # tolerate 10-min late data
      .groupBy(F.window('event_time','5 minutes'))
      .agg(F.count('*').alias('events'))
      .writeStream.format('delta').outputMode('append')...
""")

# 19. Session window (Spark 3.2+)
print("""Ex19 Session window:
stream.groupBy('user_id', F.session_window('event_time', '30 minutes'))
      .agg(F.count('*').alias('events_in_session'))
""")

# 20. Real-time revenue KPI
rt_kpi = (batch_events
    .filter(F.col("event_type") == "purchase")
    .groupBy(F.window("event_time", "1 minute"))
    .agg(
        F.sum("amount").alias("revenue_1min"),
        F.count("*").alias("orders_1min")
    )
    .withColumn("window_start", F.col("window.start"))
    .drop("window")
    .orderBy("window_start"))
rt_kpi.show(truncate=False)
print("Ex20 1-min revenue KPI done")

# 21. Write windowed KPI to gold Delta
windowed_kpi.write.format("delta").mode("overwrite").save(f"{BASE}/gold/kpi_window")
print("Ex21 gold/kpi_window written:", windowed_kpi.count())

# 22. Streaming output modes
print("""Ex22 Output modes:
  append:   new rows only → use with windowed aggs + watermark
  complete: full result table → use with stateful aggs (small cardinality)
  update:   changed rows only → use with non-window aggs
""")

# 23. Checkpoint for fault tolerance
print("""Ex23 Checkpoint:
query = (stream.writeStream.format('delta')
    .option('checkpointLocation', '/checkpoints/silver_events')
    .outputMode('append')
    .trigger(processingTime='30 seconds')
    .start('/silver/events'))
""")

# 24. Trigger modes
print("""Ex24 Triggers:
  processingTime='30 seconds'  → micro-batch every 30s
  once=True                    → process all available, then stop (batch backfill)
  availableNow=True            → process all available, multiple micro-batches, then stop
  continuous='1 second'        → experimental continuous processing
""")

# 25. foreachBatch — custom sink
print("""Ex25 foreachBatch:
def upsert_to_delta(micro_batch_df, batch_id):
    micro_batch_df.write.format('delta').mode('append').save(gold_path)
    # Or use MERGE for upsert

stream.writeStream.foreachBatch(upsert_to_delta).start()
""")

# 26. Rate limiting with maxFilesPerTrigger
print("""Ex26 Throttle ingestion:
spark.readStream.format('cloudFiles')
    .option('maxFilesPerTrigger', 10)   # only 10 files per micro-batch
    .option('cloudFiles.format','json')
    .load('/landing/')
""")

# 27. Real-time alert: revenue drop
print("""Ex27 Revenue alert via foreachBatch:
def alert_on_drop(df, epoch_id):
    rev = df.filter(col('event_type')=='purchase').agg(sum('amount')).collect()[0][0] or 0
    if rev < 100:  # threshold
        send_alert(f'Low revenue in batch {epoch_id}: {rev}')
""")

# 28. Active users (last 5 minutes rolling)
print("""Ex28 Active users (rolling 5-min window):
stream.withWatermark('event_time','1 minute')
      .groupBy(window('event_time','5 minutes','1 minute'))
      .agg(approx_count_distinct('user_id').alias('active_users'))
      .writeStream.outputMode('update').format('memory').queryName('active_users').start()
""")

# 29. Reading streaming query metrics
print("""Ex29 Query metrics:
query = stream.writeStream...start()
print(query.lastProgress)   # dict of micro-batch stats
print(query.status)         # current status
query.awaitTermination(60)  # block for 60s
""")

# 30. Multiple streaming queries on one cluster
print("""Ex30 Multiple queries:
q1 = orders_stream.writeStream.format('delta').start('/gold/orders')
q2 = events_stream.writeStream.format('delta').start('/gold/events')
spark.streams.awaitAnyTermination()  # wait for first termination
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. Deduplication in streaming with watermark
print("""Ex31 Streaming dedup:
stream.withWatermark('event_time','1 hour')
      .dropDuplicates(['event_id','event_time'])
""")

# 32. Stateful streaming — running totals
print("""Ex32 mapGroupsWithState for custom stateful logic (Scala/Python):
# Python: use foreachBatch + Delta MERGE to maintain state
def update_running_totals(df, epoch):
    DeltaTable.forPath(spark, '/gold/running').alias('t') \\
        .merge(df.groupBy('product_id').agg(sum('amount')).alias('s'),
               't.product_id=s.product_id') \\
        .whenMatchedUpdate(set={'total': 't.total + s.sum(amount)'}) \\
        .whenNotMatchedInsertAll().execute()
""")

# 33. Kafka source (real-world)
print("""Ex33 Kafka source:
stream = spark.readStream \\
    .format('kafka') \\
    .option('kafka.bootstrap.servers','broker:9092') \\
    .option('subscribe','orders-events') \\
    .option('startingOffsets','latest') \\
    .load() \\
    .select(F.from_json(F.col('value').cast('string'), EVENT_SCHEMA).alias('data')) \\
    .select('data.*')
""")

# 34. Schema-on-read with from_json
json_events = spark.createDataFrame([
    ('{"event_id":"e100","user_id":"u1","event_type":"purchase","amount":99.99}',),
    ('{"event_id":"e101","user_id":"u2","event_type":"page_view","amount":null}',),
], ["json_str"])

parsed_schema = StructType([
    StructField("event_id",   StringType(),  True),
    StructField("user_id",    StringType(),  True),
    StructField("event_type", StringType(),  True),
    StructField("amount",     DoubleType(),  True),
])
parsed = json_events.select(F.from_json("json_str", parsed_schema).alias("d")).select("d.*")
parsed.show()
print("Ex34 JSON schema-on-read done")

# 35. EventHub source (Azure)
print("""Ex35 EventHub source:
connection_str = dbutils.secrets.get('eh-scope','connection_string')
stream = spark.readStream.format('eventhubs') \\
    .options(**{'eventhubs.connectionString': spark._jvm.org.apache.spark.eventhubs \\
                .EventHubsUtils.encrypt(sc._jvm, connection_str)}) \\
    .load()
""")

# 36. Kinesis source (AWS)
print("""Ex36 Kinesis source:
stream = spark.readStream.format('kinesis') \\
    .option('streamName','orders-stream') \\
    .option('region','us-east-1') \\
    .option('initialPosition','LATEST') \\
    .load()
""")

# 37. Write streaming KPIs to Databricks SQL dashboard table
print("""Ex37 Dashboard feed:
kpi_stream.writeStream.format('delta')
    .option('checkpointLocation','/ckpt/dashboard_kpi')
    .outputMode('append')
    .trigger(processingTime='1 minute')
    .start('prod.gold.dashboard_kpi')
""")

# 38. Streaming data quality with expectations
print("""Ex38 Streaming DQ in foreachBatch:
def dq_and_write(df, epoch_id):
    bad  = df.filter(col('amount') < 0)
    good = df.filter(col('amount') >= 0)
    bad.write.format('delta').mode('append').save('/quarantine/events')
    good.write.format('delta').mode('append').save('/silver/events')
""")

# 39. Dead letter queue for malformed events
print("""Ex39 Dead letter queue:
def process(df, epoch_id):
    schema_ok = df.filter(col('event_id').isNotNull() & col('user_id').isNotNull())
    bad        = df.subtract(schema_ok)
    bad.withColumn('error', lit('null_key')) \\
       .write.format('delta').mode('append').save('/dlq/events')
    schema_ok.write.format('delta').mode('append').save('/silver/events')
""")

# 40. Monitoring streaming query lag
print("""Ex40 Monitor lag:
import time
while query.isActive:
    prog = query.lastProgress
    if prog:
        lag = prog.get('triggerExecution',{}).get('latency',{}).get('latestOffset', 0)
        print(f'Lag: {lag}ms  Rows/sec: {prog.get(\"processedRowsPerSecond\",0):.0f}')
    time.sleep(30)
""")

# 41. Graceful shutdown
print("""Ex41 Graceful stop:
query = stream.writeStream...start()
import signal
def handle(signum, frame):
    query.stop()
signal.signal(signal.SIGTERM, handle)
""")

# 42. Backpressure and rate control
print("""Ex42 Backpressure:
spark.conf.set('spark.streaming.backpressure.enabled','true')
spark.conf.set('spark.streaming.kafka.maxRatePerPartition','1000')  # Kafka DStream
# For Structured Streaming: maxOffsetsPerTrigger, maxFilesPerTrigger
stream.option('maxOffsetsPerTrigger', 50000)  # Kafka SS
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Exactly-once semantics with Delta + Kafka
print("""Ex43 Exactly-once:
- Delta as sink: idempotent write via checkpointing + transactional commits
- Kafka: committed offsets + Delta transaction = exactly-once end-to-end
- foreachBatch + MERGE: guarantees idempotency on re-play
""")

# 44. CDC streaming with APPLY CHANGES (DLT)
print("""Ex44 DLT CDC:
import dlt
dlt.create_target_table('customers')
dlt.apply_changes(
    target='customers',
    source='cdc_stream',
    keys=['customer_id'],
    sequence_by='updated_at',
    stored_as_scd_type=2
)
""")

# 45. Multi-hop streaming (Bronze → Silver → Gold)
print("""Ex45 Multi-hop streaming:
q1 = raw_stream.writeStream.format('delta').start('/bronze/events')
q2 = (spark.readStream.format('delta').load('/bronze/events')
        .withWatermark('event_time','5 minutes')
        .filter(col('event_id').isNotNull())
        .writeStream.format('delta').start('/silver/events'))
q3 = (spark.readStream.format('delta').load('/silver/events')
        .groupBy(window('event_time','5 minutes'))
        .agg(sum('amount').alias('revenue'))
        .writeStream.format('delta').outputMode('append').start('/gold/kpi'))
""")

# 46. Streaming join (stream + static dimension)
print("""Ex46 Stream-static join:
products_static = spark.read.format('delta').load('/silver/products')
enriched = events_stream.join(
    F.broadcast(products_static),
    'product_id', 'left'
)
""")

# 47. Stream-stream join (within watermark)
print("""Ex47 Stream-stream join (e.g., page_view + purchase within 10 min):
views     = events_stream.filter(col('event_type')=='page_view') \\
                .withWatermark('event_time','10 minutes')
purchases = events_stream.filter(col('event_type')=='purchase') \\
                .withWatermark('event_time','10 minutes')
joined = views.join(purchases,
    expr(\"views.user_id = purchases.user_id AND \"\
         \"purchases.event_time BETWEEN views.event_time AND views.event_time + interval 10 minutes\"))
""")

# 48. Auto Loader schema evolution
print("""Ex48 Schema evolution with Auto Loader:
spark.readStream.format('cloudFiles')
    .option('cloudFiles.schemaLocation','/schemas/events')
    .option('cloudFiles.schemaEvolutionMode','addNewColumns')  # auto-detect new columns
    .load('/landing/events/')
""")

# 49. Streaming metrics to Prometheus/Grafana
print("""Ex49 Custom metrics via SparkListener + Prometheus pushgateway:
from prometheus_client import CollectorRegistry, Gauge, push_to_gateway
registry = CollectorRegistry()
g = Gauge('streaming_lag_ms','Streaming query lag',registry=registry)
g.set(query.lastProgress.get('durationMs',{}).get('triggerExecution',0))
push_to_gateway('pushgateway:9091', job='streaming', registry=registry)
""")

# 50. Production streaming checklist
print("""Ex50 Production streaming checklist:
✓ Watermark set for all time-based aggregations
✓ Checkpoint location on durable storage (ADLS/S3/GCS)
✓ maxFilesPerTrigger / maxOffsetsPerTrigger throttle set
✓ Dead-letter queue for malformed records
✓ foreachBatch for idempotent writes / MERGE patterns
✓ Schema evolution enabled (Auto Loader)
✓ Alert on query termination / lag threshold breach
✓ Graceful shutdown handler registered
✓ Monitoring: lastProgress logged every trigger
✓ Exactly-once guaranteed end-to-end via Delta + checkpointing
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
