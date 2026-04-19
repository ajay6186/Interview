# ============================================================================
# Exercise 2.4 — Structured Streaming Basics
# ============================================================================

import os, time
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, IntegerType, StringType, DoubleType

spark = (SparkSession.builder
    .appName("streaming-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/streaming_exercise"
os.makedirs(BASE, exist_ok=True)

# Write test files to simulate arriving data
schema = StructType([
    StructField("user_id",   IntegerType(), True),
    StructField("event",     StringType(),  True),
    StructField("amount",    DoubleType(),  True),
])
batch1 = spark.createDataFrame([
    (1,"purchase",49.99),(2,"click",0.0),(3,"purchase",199.99),
    (4,"click",0.0),(5,"purchase",29.99),
], ["user_id","event","amount"])
batch1.write.mode("overwrite").json(f"{BASE}/events")

# ---------------------------------------------------------------------------
# 1. Read streaming from JSON file source with given schema
# ---------------------------------------------------------------------------
# TODO: event_stream = spark.readStream using schema above, .json(f"{BASE}/events")
event_stream = None  # replace None

assert event_stream is not None
assert event_stream.isStreaming == True

# ---------------------------------------------------------------------------
# 2. Filter stream: only "purchase" events
# ---------------------------------------------------------------------------
# TODO: purchases = filter event_stream where event == "purchase"
purchases = None  # replace None

assert purchases.isStreaming == True

# ---------------------------------------------------------------------------
# 3. Write purchases to Delta sink with Trigger.Once
# ---------------------------------------------------------------------------
DELTA_SINK = f"{BASE}/purchases_delta"
DELTA_CHK  = f"{BASE}/chk_purchases"

# TODO: start a writeStream to DELTA_SINK (format=delta), checkpointLocation=DELTA_CHK,
#       trigger(once=True), wait for termination
# Then read DELTA_SINK into df_result
df_result = None  # replace None

assert df_result is not None
assert df_result.count() == 3  # 3 purchase events

# ---------------------------------------------------------------------------
# 4. Rate stream — count events per "mod 3" bucket
# ---------------------------------------------------------------------------
rate = spark.readStream.format("rate").option("rowsPerSecond", 10).load()

# TODO: grouped = rate grouped by (value % 3) aliased "bucket", count()
grouped = None  # replace None

assert grouped.isStreaming == True

# ---------------------------------------------------------------------------
# 5. Write grouped to memory sink, verify buckets 0,1,2 exist
# ---------------------------------------------------------------------------
# TODO: write grouped to memory sink, queryName="buckets", outputMode="complete"
#       sleep 4 seconds, query spark.sql to get result, then stop the query
bucket_df = None  # replace None

assert bucket_df is not None
buckets = [r["bucket"] for r in bucket_df.select("bucket").collect()]
assert set(buckets).issuperset({0, 1, 2})

# ---------------------------------------------------------------------------
# 6. foreachBatch — accumulate rows to a list
# ---------------------------------------------------------------------------
collected = []

def capture_batch(df, batch_id):
    rows = df.collect()
    collected.extend(rows)

# TODO: write event_stream via foreachBatch(capture_batch), trigger(once=True), await
# Then assert collected has 5 rows
assert len(collected) == 5, f"Expected 5, got {len(collected)}"

# ---------------------------------------------------------------------------
# 7. Windowed aggregation definition (just define, don't execute)
# ---------------------------------------------------------------------------
rate2 = spark.readStream.format("rate").option("rowsPerSecond", 5).load()

# TODO: define windowed_agg = rate2 with watermark "timestamp" 10s,
#       groupBy window("timestamp", "5 seconds"), count()
windowed_agg = None  # replace None

assert windowed_agg.isStreaming == True

print("All assertions passed!")
spark.stop()
