# ============================================================================
# Solution 2.4 — Structured Streaming Basics
# ============================================================================

import os, time
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, IntegerType, StringType, DoubleType

spark = (SparkSession.builder
    .appName("streaming-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/streaming_exercise"
os.makedirs(BASE, exist_ok=True)

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

# 1. Read streaming
event_stream = spark.readStream.schema(schema).json(f"{BASE}/events")
assert event_stream.isStreaming == True

# 2. Filter purchases
purchases = event_stream.filter(F.col("event") == "purchase")
assert purchases.isStreaming == True

# 3. Write to Delta
DELTA_SINK = f"{BASE}/purchases_delta"
DELTA_CHK  = f"{BASE}/chk_purchases"
q3 = purchases.writeStream \
    .format("delta") \
    .option("path", DELTA_SINK) \
    .option("checkpointLocation", DELTA_CHK) \
    .trigger(once=True) \
    .start()
q3.awaitTermination()
df_result = spark.read.format("delta").load(DELTA_SINK)
assert df_result.count() == 3

# 4. Rate grouped
rate = spark.readStream.format("rate").option("rowsPerSecond", 10).load()
grouped = rate.withColumn("bucket", F.col("value") % 3).groupBy("bucket").count()
assert grouped.isStreaming == True

# 5. Memory sink
q5 = grouped.writeStream \
    .format("memory") \
    .queryName("buckets") \
    .outputMode("complete") \
    .start()
time.sleep(4)
bucket_df = spark.sql("SELECT * FROM buckets")
buckets = [r["bucket"] for r in bucket_df.select("bucket").collect()]
assert set(buckets).issuperset({0, 1, 2})
q5.stop()

# 6. foreachBatch
collected = []
def capture_batch(df, batch_id):
    collected.extend(df.collect())

q6 = event_stream.writeStream.foreachBatch(capture_batch).trigger(once=True).start()
q6.awaitTermination()
assert len(collected) == 5

# 7. Windowed agg
rate2 = spark.readStream.format("rate").option("rowsPerSecond", 5).load()
windowed_agg = (rate2
    .withWatermark("timestamp", "10 seconds")
    .groupBy(F.window("timestamp", "5 seconds"))
    .count())
assert windowed_agg.isStreaming == True

print("All assertions passed!")
spark.stop()
