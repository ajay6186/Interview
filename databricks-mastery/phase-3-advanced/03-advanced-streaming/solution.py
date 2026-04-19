# ============================================================================
# Solution 3.3 — Advanced Structured Streaming
# ============================================================================

import os, time
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, IntegerType, StringType, DoubleType, TimestampType
from datetime import datetime, timedelta

spark = (SparkSession.builder
    .appName("adv-streaming-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/adv_stream_ex"
os.makedirs(BASE, exist_ok=True)

events = [(i, f"event_{i%5}", float(i*10), (datetime.now()-timedelta(seconds=i)).strftime("%Y-%m-%d %H:%M:%S"))
          for i in range(20)]
event_schema = StructType([
    StructField("event_id",   IntegerType(), True),
    StructField("event_type", StringType(),  True),
    StructField("amount",     DoubleType(),  True),
    StructField("event_time", StringType(),  True),
])
spark.createDataFrame(events, ["event_id","event_type","amount","event_time"]) \
     .write.mode("overwrite").json(f"{BASE}/events_src")

# 1. Read streaming
stream = spark.readStream.schema(event_schema).json(f"{BASE}/events_src")
assert stream.isStreaming

# 2. Watermark
stream_ts = (stream
    .withColumn("event_time", F.col("event_time").cast(TimestampType()))
    .withWatermark("event_time","30 seconds"))
assert stream_ts.isStreaming

# 3. Tumbling window
windowed = stream_ts.groupBy(F.window("event_time","10 seconds")).count()
assert windowed.isStreaming

# 4. Write to Delta
DELTA_WIN = f"{BASE}/windowed_delta"
CHK_WIN   = f"{BASE}/chk_windowed"
q4 = (windowed.writeStream
    .format("delta")
    .option("path", DELTA_WIN)
    .option("checkpointLocation", CHK_WIN)
    .outputMode("update")
    .trigger(once=True)
    .start())
q4.awaitTermination()
df_win = spark.read.format("delta").load(DELTA_WIN)
assert df_win is not None

# 5. Stream-static join
labels = spark.createDataFrame([
    ("event_0","Purchase"),("event_1","Click"),("event_2","View"),
    ("event_3","Cart"),("event_4","Search"),
], ["event_type","label"])
enriched_stream = stream.join(F.broadcast(labels), on="event_type", how="left")
assert enriched_stream.isStreaming

# 6. foreachBatch dual write
PATH_A = f"{BASE}/path_a"
PATH_B = f"{BASE}/path_b"

def dual_write(df, batch_id):
    df.cache()
    df.write.mode("overwrite").parquet(PATH_A)
    df.filter(F.col("amount") > 100).write.mode("overwrite").parquet(PATH_B)
    df.unpersist()

q6 = stream.writeStream.foreachBatch(dual_write).trigger(once=True).start()
q6.awaitTermination()
df_a = spark.read.parquet(PATH_A)
df_b = spark.read.parquet(PATH_B)
assert df_a.count() == 20
assert df_b.count() == 10

# 7. Dedup
deduped = stream_ts.dropDuplicates(["event_id"])
assert deduped.isStreaming

print("All assertions passed!")
spark.stop()
