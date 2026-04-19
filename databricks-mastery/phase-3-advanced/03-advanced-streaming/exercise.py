# ============================================================================
# Exercise 3.3 — Advanced Structured Streaming
# ============================================================================

import os, time
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, IntegerType, StringType, DoubleType, TimestampType

spark = (SparkSession.builder
    .appName("adv-streaming-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/adv_stream_ex"
os.makedirs(BASE, exist_ok=True)

# Write source data (events with timestamps)
from datetime import datetime, timedelta
events = []
for i in range(20):
    ts = (datetime.now() - timedelta(seconds=i)).strftime("%Y-%m-%d %H:%M:%S")
    events.append((i, f"event_{i%5}", float(i*10), ts))

event_schema = StructType([
    StructField("event_id",   IntegerType(), True),
    StructField("event_type", StringType(),  True),
    StructField("amount",     DoubleType(),  True),
    StructField("event_time", StringType(),  True),
])
spark.createDataFrame(events, ["event_id","event_type","amount","event_time"]) \
     .write.mode("overwrite").json(f"{BASE}/events_src")

# ---------------------------------------------------------------------------
# 1. Read streaming source with schema
# ---------------------------------------------------------------------------
# TODO: stream = spark.readStream with event_schema above, .json(f"{BASE}/events_src")
stream = None  # replace None
assert stream is not None and stream.isStreaming

# ---------------------------------------------------------------------------
# 2. Add watermark on event_time (cast string to timestamp first)
# ---------------------------------------------------------------------------
# TODO: stream_ts = stream with "event_time" cast to TimestampType, then withWatermark 30 seconds
stream_ts = None  # replace None
assert stream_ts.isStreaming

# ---------------------------------------------------------------------------
# 3. Tumbling window: count events per 10-second window
# ---------------------------------------------------------------------------
# TODO: windowed = groupBy window("event_time","10 seconds"), count()
windowed = None  # replace None
assert windowed.isStreaming

# ---------------------------------------------------------------------------
# 4. Write windowed to Delta with outputMode=update and Trigger.AvailableNow
# ---------------------------------------------------------------------------
DELTA_WIN = f"{BASE}/windowed_delta"
CHK_WIN   = f"{BASE}/chk_windowed"

# TODO: write windowed to delta, outputMode="update", trigger(availableNow=True or once=True)
# Then read delta → df_win

df_win = None  # replace None
assert df_win is not None

# ---------------------------------------------------------------------------
# 5. Stream-static join: enrich events with event_type labels
# ---------------------------------------------------------------------------
labels = spark.createDataFrame([
    ("event_0","Purchase"),("event_1","Click"),("event_2","View"),
    ("event_3","Cart"),("event_4","Search"),
], ["event_type","label"])

# TODO: enriched_stream = join stream (with schema) with F.broadcast(labels) on event_type
enriched_stream = None  # replace None
assert enriched_stream.isStreaming
assert enriched_stream.isStreaming  # label column will be present after execution

# ---------------------------------------------------------------------------
# 6. foreachBatch: write to two different paths
# ---------------------------------------------------------------------------
PATH_A = f"{BASE}/path_a"
PATH_B = f"{BASE}/path_b"

# TODO: write stream via foreachBatch:
#   - write ALL rows to PATH_A as parquet
#   - write rows where amount > 100 to PATH_B as parquet
#   - trigger once=True

df_a = spark.read.parquet(PATH_A) if os.path.exists(PATH_A) else None
df_b = spark.read.parquet(PATH_B) if os.path.exists(PATH_B) else None

assert df_a is not None and df_a.count() == 20
assert df_b is not None and df_b.count() == 10  # events 10..19 have amount > 100

# ---------------------------------------------------------------------------
# 7. Streaming deduplication by event_id with watermark
# ---------------------------------------------------------------------------
# TODO: deduped = stream_ts with watermark on event_time 60s, dropDuplicates(["event_id"])
deduped = None  # replace None
assert deduped.isStreaming

print("All assertions passed!")
spark.stop()
