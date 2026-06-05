# ============================================================================
# Examples 4.6 — Event-Driven Architecture  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: Kafka, Delta CDF, Auto Loader, triggers, stateful streaming, Saga
# ============================================================================

import os, json, time
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (StructType, StructField, StringType,
                                DoubleType, LongType, TimestampType)

spark = (SparkSession.builder
    .appName("event-driven-examples")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/eda_examples"
os.makedirs(BASE, exist_ok=True)

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Kafka source — connection string
print("Ex01 Kafka read:")
print("  spark.readStream.format('kafka')")
print("    .option('kafka.bootstrap.servers', 'broker1:9092,broker2:9092')")
print("    .option('subscribe', 'orders')")
print("    .option('startingOffsets', 'latest')")
print("    .load()")

# 2. Kafka multi-topic subscription
print("Ex02 Multi-topic: .option('subscribe', 'orders,clicks,inventory')")

# 3. Kafka topic pattern (regex)
print("Ex03 Pattern sub: .option('subscribePattern', 'events_.*')")

# 4. Deserialise Kafka value (JSON string)
print("""Ex04 Deserialise JSON value:
  schema = StructType([StructField('order_id', StringType()),
                       StructField('amount',   DoubleType())])
  df = raw.select(F.from_json(F.col('value').cast('string'), schema).alias('data'))
      .select('data.*')
""")

# 5. Kafka offset control — start from earliest
print("Ex05 startingOffsets: 'earliest'  — reprocess all history (backfill)")

# 6. Kafka backpressure
print("Ex06 maxOffsetsPerTrigger: 50000  — limit records per micro-batch for back-pressure")

# 7. Azure Event Hubs (Kafka-compatible endpoint)
print("Ex07 Event Hubs uses same Kafka API:")
print("  kafka.bootstrap.servers = '<namespace>.servicebus.windows.net:9093'")
print("  kafka.security.protocol = SASL_SSL")

# 8. AWS Kinesis source
print("Ex08 Kinesis: .format('kinesis').option('streamName','events').option('region','us-east-1')")

# 9. GCP Pub/Sub source
print("Ex09 Pub/Sub: .format('pubsub').option('subscription','projects/p/subscriptions/s')")

# 10. Auto Loader — simplest form
print("Ex10 Auto Loader:")
print("  spark.readStream.format('cloudFiles')")
print("    .option('cloudFiles.format', 'json')")
print("    .option('cloudFiles.schemaLocation', '/schemas/events')")
print("    .load('abfss://landing@account.dfs.core.windows.net/events/')")

# 11. Auto Loader file notification mode (push vs poll)
print("Ex11 cloudFiles.useNotifications=true → SNS/SQS (AWS) or Event Grid (Azure)")
print("     cloudFiles.useNotifications=false → directory listing (simpler, slightly higher latency)")

# 12. Delta CDF — enable on table
print("Ex12 ALTER TABLE silver.orders SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')")

# 13. CDF batch read
print("""Ex13 CDF batch (all changes since version 5):
  spark.read.format('delta')
    .option('readChangeFeed', 'true')
    .option('startingVersion', 5)
    .table('silver.orders')
  # columns: _change_type, _commit_version, _commit_timestamp + all table cols
""")

# 14. CDF _change_type values
print("Ex14 _change_type values:")
print("  insert            — new row added")
print("  update_preimage   — row before UPDATE")
print("  update_postimage  — row after  UPDATE")
print("  delete            — row removed")

# 15. File-arrival trigger in Databricks Workflows YAML
print("""Ex15 file_arrival trigger:
trigger:
  file_arrival:
    url: "abfss://container@account.dfs.core.windows.net/landing/"
    min_time_between_triggers_seconds: 60
""")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Watermark — basic
print("Ex16 Watermark (tolerate 10-min late data):")
events = spark.createDataFrame([], StructType([
    StructField("event_id",   StringType()),
    StructField("event_time", TimestampType()),
    StructField("amount",     DoubleType()),
]))
# (conceptual — stream not active)
print("  events.withWatermark('event_time', '10 minutes')")

# 17. Tumbling window aggregation
print("""Ex17 Tumbling 5-min window:
  events
    .withWatermark('event_time', '5 minutes')
    .groupBy(F.window('event_time', '5 minutes'), 'product_id')
    .agg(F.count('*').alias('count'), F.sum('amount').alias('revenue'))
""")

# 18. Sliding window
print("Ex18 Sliding window (10-min window, slide every 5 min):")
print("  .groupBy(F.window('event_time', '10 minutes', '5 minutes'), 'product_id')")

# 19. Session window
print("Ex19 Session window (gap 30 min):")
print("  .groupBy(F.session_window('event_time', '30 minutes'), 'user_id')")

# 20. Append output mode
print("Ex20 .writeStream.outputMode('append')  — only emit complete windows after watermark passes")

# 21. Update output mode
print("Ex21 .writeStream.outputMode('update')  — emit updated windows each micro-batch (with watermark)")

# 22. Trigger — fixed interval
print("Ex22 .writeStream.trigger(processingTime='1 minute')  — micro-batch every 60 s")

# 23. Trigger — availableNow (incremental batch)
print("Ex23 .writeStream.trigger(availableNow=True)  — process all available data then stop")

# 24. Trigger — once (legacy, replaced by availableNow)
print("Ex24 .writeStream.trigger(once=True)  — legacy one-shot trigger")

# 25. Checkpoint location
print("Ex25 .writeStream.option('checkpointLocation', '/ckpt/orders_stream')")
print("     Checkpoint persists offsets + state — NEVER delete unless resetting the stream")

# 26. Foreachbatch — write to multiple sinks
print("""Ex26 foreachBatch for fan-out writes:
def write_batch(df, epoch_id):
    df.write.format('delta').mode('append').save('/bronze/orders')
    df.write.format('delta').mode('append').save('/bronze/orders_backup')

stream.writeStream.foreachBatch(write_batch).start()
""")

# 27. CDF streaming — downstream propagation
print("""Ex27 CDF streaming consumer:
cdf = (spark.readStream.format('delta')
    .option('readChangeFeed', 'true')
    .option('startingVersion', 'latest')
    .table('silver.orders'))

# Only process inserts + update_postimage
inserts = cdf.filter(F.col('_change_type').isin(['insert', 'update_postimage']))
""")

# 28. Kafka producer (write events to Kafka)
print("""Ex28 Write to Kafka:
(df.select(
    F.col('order_id').cast('string').alias('key'),
    F.to_json(F.struct('*')).alias('value'))
.write
.format('kafka')
.option('kafka.bootstrap.servers', 'broker:9092')
.option('topic', 'processed_orders')
.save())
""")

# 29. Dead letter queue pattern
print("""Ex29 Dead Letter Queue via foreachBatch:
def write_with_dlq(df, epoch_id):
    good = df.filter(F.col('amount') > 0)
    bad  = df.filter(F.col('amount') <= 0)
    good.write.format('delta').mode('append').save('/silver/orders')
    bad.write.format('delta').mode('append').save('/dlq/orders')
""")

# 30. Schema evolution in streams
print("Ex30 Auto Loader schema evolution: .option('cloudFiles.schemaEvolutionMode', 'addNewColumns')")
print("     Adds new columns automatically without breaking the stream")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. CDF as event sourcing — replay state at any point
print("Ex31 Event sourcing: replay all CDF history to reconstruct state at any version")
print("""
  spark.read.format('delta')
    .option('readChangeFeed', 'true')
    .option('startingVersion', 0)          # from the very beginning
    .option('endingVersion', 50)           # up to version 50
    .table('silver.orders')
""")

# 32. Exactly-once semantics
print("""Ex32 Exactly-once:
  Kafka  → committed offsets in checkpoint
  Delta  → idempotent MERGE or replaceWhere
  Result → re-running the same batch produces identical output
""")

# 33. Kafka consumer group isolation
print("Ex33 kafka.group.id='spark-consumer-1'  — isolate consumer group per job")
print("     Different jobs can read same topic independently from their own offsets")

# 34. Avro deserialization (Schema Registry)
print("""Ex34 Avro with Confluent Schema Registry:
  from pyspark.sql.avro.functions import from_avro
  schema_str = requests.get(f'{REGISTRY}/subjects/orders-value/versions/latest').json()['schema']
  df = raw.select(from_avro(F.expr("substring(value, 6, length(value)-5)"), schema_str).alias('data'))
""")

# 35. State cleanup — mapGroupsWithState
print("""Ex35 Stateful session tracking:
  events.groupBy('user_id')
        .applyInPandasWithState(
            update_session_fn,
            outputStructType=...,
            stateStructType=...,
            outputMode='append',
            timeoutConf=GroupStateTimeout.ProcessingTimeTimeout)
""")

# 36. Continuous trigger (row-level latency)
print("Ex36 .writeStream.trigger(continuous='1 second')  — ~10 ms latency, limited ops support")

# 37. Event-driven job trigger via REST
print("""Ex37 External system triggers Databricks job:
import requests
resp = requests.post(
    f"{DATABRICKS_HOST}/api/2.1/jobs/run-now",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={"job_id": 123, "job_parameters": {"event_source": "crm", "batch_id": "b-001"}})
run_id = resp.json()['run_id']
""")

# 38. Poll job run until completion
print("""Ex38 Poll run status:
while True:
    run = requests.get(f'{HOST}/api/2.1/jobs/runs/get',
                       headers=headers, params={'run_id': run_id}).json()
    state = run['state']['life_cycle_state']
    if state in ('TERMINATED', 'SKIPPED', 'INTERNAL_ERROR'):
        break
    time.sleep(10)
result_state = run['state']['result_state']   # SUCCESS | FAILED
""")

# 39. Saga pattern implementation
print("""Ex39 Saga compensating transactions:
class SagaRunner:
    def __init__(self):
        self.steps = []

    def add_step(self, action, compensate):
        self.steps.append((action, compensate))

    def run(self):
        completed = []
        for action, compensate in self.steps:
            try:
                action()
                completed.append(compensate)
            except Exception as e:
                print(f'Step failed: {e}. Rolling back...')
                for comp in reversed(completed):
                    comp()
                raise
""")

# 40. Event schema registry pattern
print("""Ex40 Event schema versioning:
{
  "event_type": "order_placed",
  "schema_version": "2.1",
  "event_id": "evt-001",
  "timestamp": "2024-01-15T10:00:00Z",
  "payload": { "order_id": "ord-999", "amount": 99.99 }
}
Schema compatibility: BACKWARD (new readers can read old events)
""")

# 41. Fan-out streaming (write to multiple targets)
print("""Ex41 Fan-out via foreachBatch:
def fan_out(df, epoch_id):
    df.persist()
    # write to Delta
    df.write.format('delta').mode('append').save('/silver/events')
    # write aggregates to SQL DW
    (df.groupBy('event_type').count()
       .write.format('jdbc').option('url', DW_URL).mode('append').save())
    # push high-value events to Kafka
    (df.filter(F.col('amount') > 1000)
       .selectExpr("CAST(event_id AS STRING) AS key", "to_json(struct(*)) AS value")
       .write.format('kafka').option('topic','high_value').save())
    df.unpersist()
""")

# 42. Multi-hop streaming (Bronze → Silver → Gold, all streaming)
print("""Ex42 Multi-hop streaming:
# Bronze: raw ingest
bronze = spark.readStream.format('cloudFiles').load('/landing/')
bronze.writeStream.format('delta').option('checkpointLocation','/ckpt/bronze').start('/bronze/')

# Silver: enrich + clean (reads bronze stream)
silver = (spark.readStream.format('delta').load('/bronze/')
          .filter(F.col('amount') > 0)
          .withColumn('amount_usd', F.col('amount') * F.col('fx_rate')))
silver.writeStream.format('delta').option('checkpointLocation','/ckpt/silver').start('/silver/')

# Gold: windowed aggregation (reads silver stream)
gold = (spark.readStream.format('delta').load('/silver/')
        .withWatermark('event_time','5 min')
        .groupBy(F.window('event_time','1 hour'),'region')
        .agg(F.sum('amount_usd').alias('revenue')))
gold.writeStream.outputMode('update').format('delta')
    .option('checkpointLocation','/ckpt/gold').start('/gold/')
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Kafka exactly-once write (idempotent producer)
print("""Ex43 Kafka idempotent producer config:
  kafka.enable.idempotence = true
  kafka.acks = all
  kafka.retries = 2147483647
  kafka.max.in.flight.requests.per.connection = 5
""")

# 44. Delta CDF with MERGE — propagating deletes downstream
print("""Ex44 CDF-driven downstream MERGE:
cdf = spark.readStream.format('delta').option('readChangeFeed','true').table('silver.orders')

def propagate(df, epoch_id):
    deletes = df.filter(F.col('_change_type') == 'delete')
    upserts = df.filter(F.col('_change_type').isin(['insert','update_postimage']))
    # apply deletes
    deletes.createOrReplaceTempView('to_delete')
    spark.sql('''
        MERGE INTO gold.order_summary t USING to_delete s
        ON t.order_id = s.order_id
        WHEN MATCHED THEN DELETE
    ''')
    # apply upserts
    upserts.createOrReplaceTempView('to_upsert')
    spark.sql('''
        MERGE INTO gold.order_summary t USING to_upsert s
        ON t.order_id = s.order_id
        WHEN MATCHED THEN UPDATE SET *
        WHEN NOT MATCHED THEN INSERT *
    ''')

cdf.writeStream.foreachBatch(propagate).option('checkpointLocation','/ckpt/cdf_gold').start()
""")

# 45. Out-of-order event handling with explicit state
print("""Ex45 Handling out-of-order events:
  watermark = 10 min  → tolerate events up to 10 min late
  window    = 5 min   → aggregate per 5-min bucket
  Late row arriving 8 min after window close → still included
  Late row arriving 12 min after window close → dropped (past watermark)
""")

# 46. Monitoring stream metrics
print("""Ex46 Stream progress monitoring:
query = stream.writeStream.start()
while query.isActive:
    progress = query.lastProgress
    if progress:
        print({
            'inputRowsPerSecond':   progress['inputRowsPerSecond'],
            'processedRowsPerSec':  progress['processedRowsPerSecond'],
            'numInputRows':         progress['numInputRows'],
            'batchId':              progress['batchId'],
            'watermark':            progress['eventTime'].get('watermark'),
        })
    time.sleep(30)
""")

# 47. Stream-stream join (two Kafka topics)
print("""Ex47 Stream-stream join (orders + payments):
orders   = (spark.readStream.format('kafka').option('subscribe','orders')
              .load().select(F.from_json(F.col('value').cast('str'), order_schema).alias('d'))
              .select('d.*').withWatermark('order_time','10 minutes'))

payments = (spark.readStream.format('kafka').option('subscribe','payments')
              .load().select(F.from_json(F.col('value').cast('str'), pay_schema).alias('d'))
              .select('d.*').withWatermark('pay_time','10 minutes'))

joined = (orders.join(payments,
    (orders.order_id == payments.order_id) &
    (payments.pay_time.between(orders.order_time,
                               orders.order_time + F.expr('INTERVAL 30 MINUTES')))))
""")

# 48. Event-driven ML inference
print("""Ex48 Real-time ML scoring via foreachBatch:
import mlflow
model = mlflow.pyfunc.load_model('models:/fraud_detector/production')

def score_batch(df, epoch_id):
    features = df.select('amount','merchant_id','user_age').toPandas()
    predictions = model.predict(features)
    result_df = spark.createDataFrame(
        df.toPandas().assign(fraud_score=predictions))
    result_df.write.format('delta').mode('append').save('/silver/scored_events')

stream.writeStream.foreachBatch(score_batch).start()
""")

# 49. Event routing (topic → table mapping)
print("""Ex49 Event router foreachBatch:
TOPIC_TABLE_MAP = {
    'orders':   '/silver/orders',
    'clicks':   '/silver/clicks',
    'sessions': '/silver/sessions',
}

def route(df, epoch_id):
    for topic, path in TOPIC_TABLE_MAP.items():
        (df.filter(F.col('topic') == topic)
           .drop('topic','key','partition','offset')
           .write.format('delta').mode('append').save(path))

kafka_stream.writeStream.foreachBatch(route).start()
""")

# 50. Custom event emitter for pipeline observability
import datetime

def emit_event(event_type: str, pipeline: str, rows: int, **extra):
    event = {
        "event_type":  event_type,
        "pipeline":    pipeline,
        "rows":        rows,
        "ts":          datetime.datetime.utcnow().isoformat(),
        **extra,
    }
    print(json.dumps(event))
    # In production: write to Delta events table or push to Kafka topic

emit_event("batch_completed", "orders_etl", 15_420, env="prod", duration_sec=42.1)
emit_event("schema_mismatch", "orders_etl",      3, env="prod", mismatched_col="amount")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
