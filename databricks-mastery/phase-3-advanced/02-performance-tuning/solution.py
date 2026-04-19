# ============================================================================
# Solution 3.2 — Performance Tuning
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark import StorageLevel
import time

spark = SparkSession.builder.appName("perf-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# 1. Shuffle partitions
spark.conf.set("spark.sql.shuffle.partitions","8")
assert spark.conf.get("spark.sql.shuffle.partitions") == "8"

# 2. AQE
spark.conf.set("spark.sql.adaptive.enabled","true")
assert spark.conf.get("spark.sql.adaptive.enabled") == "true"

# 3. Broadcast join
large = spark.range(100000).withColumn("key", F.col("id")%100)
small = spark.range(100).withColumnRenamed("id","key").withColumn("label", F.lit("L"))
df_joined = large.join(F.broadcast(small), on="key")
assert "label" in df_joined.columns

# 4. Cache
df_expensive = spark.range(500000).withColumn("val", F.sin(F.col("id").cast("double")))
df_expensive.cache()
t1 = time.time(); count1 = df_expensive.count(); t1_dur = time.time()-t1
t2 = time.time(); count2 = df_expensive.count(); t2_dur = time.time()-t2
df_expensive.unpersist()
assert count1 == count2

# 5. Repartition + coalesce
df_base = spark.range(10000)
df_final = df_base.repartition(16).coalesce(4)
assert df_final.rdd.getNumPartitions() == 4

# 6. Predicate pushdown
orders = spark.range(100000).withColumn("status", F.when(F.col("id")%3==0,"active").otherwise("inactive")) \
              .withColumn("key", F.col("id")%100)
customers = spark.range(100).withColumnRenamed("id","key").withColumn("tier", F.lit("gold"))
df_optimized = orders.filter(F.col("status")=="active").join(F.broadcast(customers), on="key")
assert df_optimized.filter(F.col("status")!="active").count() == 0

# 7. Column pruning
df_pruned = (orders.select("key","status")
                   .join(customers.select("key","tier"), on="key"))
assert set(df_pruned.columns) == {"key","status","tier"}

# 8. Partition filter check
df_parquet_src = spark.range(10000).withColumn("dept", F.col("id")%5)
df_parquet_src.write.mode("overwrite").partitionBy("dept").parquet("/tmp/perf_ex_parquet")
df_read = spark.read.parquet("/tmp/perf_ex_parquet").filter(F.col("dept")==0)
print("Ex08 plan:", df_read.explain(returnString=True if hasattr(df_read.explain,"__call__") else False))

print("All assertions passed!")
spark.stop()
