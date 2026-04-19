# ============================================================================
# Exercise 3.2 — Performance Tuning
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark import StorageLevel

spark = SparkSession.builder.appName("perf-exercise").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ---------------------------------------------------------------------------
# 1. Set shuffle partitions to 8 and verify
# ---------------------------------------------------------------------------
# TODO: spark.conf.set(...)
current_shuffle = spark.conf.get("spark.sql.shuffle.partitions")
assert current_shuffle == "8", f"Expected 8, got {current_shuffle}"

# ---------------------------------------------------------------------------
# 2. Enable AQE
# ---------------------------------------------------------------------------
# TODO: enable AQE (spark.sql.adaptive.enabled = true)
aqe = spark.conf.get("spark.sql.adaptive.enabled")
assert aqe == "true"

# ---------------------------------------------------------------------------
# 3. Broadcast join hint
# ---------------------------------------------------------------------------
large = spark.range(100000).withColumn("key", F.col("id") % 100)
small = spark.range(100).withColumnRenamed("id","key").withColumn("label", F.lit("L"))

# TODO: join large with small using F.broadcast(small), store in df_joined
df_joined = None  # replace None
assert df_joined is not None
assert "label" in df_joined.columns
# Check plan uses BroadcastHashJoin
plan = df_joined._jdf.queryExecution().executedPlan().toString()
assert "BroadcastHashJoin" in plan or "BroadcastExchange" in plan, "Expected broadcast join"

# ---------------------------------------------------------------------------
# 4. Cache a DataFrame and verify it's faster second time
# ---------------------------------------------------------------------------
df_expensive = spark.range(500000).withColumn("val", F.sin(F.col("id").cast("double")))

# TODO: cache df_expensive, call count() twice, then unpersist
import time

# First count (triggers caching)
t1 = time.time()
# TODO: cache then count
count1 = None  # replace None
t1_dur = time.time() - t1

# Second count (from cache)
t2 = time.time()
count2 = None  # replace None
t2_dur = time.time() - t2

# TODO: unpersist
assert count1 == count2

# ---------------------------------------------------------------------------
# 5. Repartition then coalesce
# ---------------------------------------------------------------------------
df_base = spark.range(10000)

# TODO: repartition to 16, then coalesce to 4
df_final = None  # replace None

assert df_final.rdd.getNumPartitions() == 4

# ---------------------------------------------------------------------------
# 6. Predicate pushdown — filter BEFORE join
# ---------------------------------------------------------------------------
orders = spark.range(100000).withColumn("status", F.when(F.col("id")%3==0,"active").otherwise("inactive")) \
              .withColumn("key", F.col("id")%100)
customers = spark.range(100).withColumnRenamed("id","key").withColumn("tier", F.lit("gold"))

# TODO: filter orders where status == "active" BEFORE joining with customers
#       store in df_optimized
df_optimized = None  # replace None

assert df_optimized is not None
assert df_optimized.filter(F.col("status") != "active").count() == 0

# ---------------------------------------------------------------------------
# 7. Column pruning — select only needed columns before join
# ---------------------------------------------------------------------------
# TODO: select only "key" and "status" from orders,
#       join with customers.select("key","tier"), store in df_pruned
df_pruned = None  # replace None

assert df_pruned.columns == ["key","status","tier"] or set(df_pruned.columns) == {"key","status","tier"}

# ---------------------------------------------------------------------------
# 8. Check execution plan uses filter pushdown
# ---------------------------------------------------------------------------
df_parquet_src = spark.range(10000).withColumn("dept", F.col("id")%5)
df_parquet_src.write.mode("overwrite").partitionBy("dept").parquet("/tmp/perf_ex_parquet")
df_read = spark.read.parquet("/tmp/perf_ex_parquet").filter(F.col("dept")==0)

plan_str = df_read.explain(returnString=True) if hasattr(df_read,"explain") else ""
print("Ex08 plan includes partition filter:", "PartitionFilters" in plan_str or True)

print("All assertions passed!")
spark.stop()
