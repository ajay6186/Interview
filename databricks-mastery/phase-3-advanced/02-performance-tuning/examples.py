# ============================================================================
# Examples 3.2 — Performance Tuning  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark import StorageLevel

spark = SparkSession.builder.appName("perf-tuning-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Shuffle partitions — reduce for small data
spark.conf.set("spark.sql.shuffle.partitions","8")
print("Ex01 shuffle partitions:", spark.conf.get("spark.sql.shuffle.partitions"))

# 2. AQE (Adaptive Query Execution) — Spark 3+
spark.conf.set("spark.sql.adaptive.enabled","true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled","true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled","true")
print("Ex02 AQE enabled")

# 3. Broadcast join threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold","10485760")  # 10MB
print("Ex03 broadcast threshold:", spark.conf.get("spark.sql.autoBroadcastJoinThreshold"))

# 4. Broadcast join hint
df_large = spark.range(1000000).withColumn("key", F.col("id") % 100)
df_small  = spark.range(100).withColumnRenamed("id","key")
df_large.join(F.broadcast(df_small), on="key").explain()  # BroadcastHashJoin

# 5. Cache a DataFrame
df_cached = spark.range(100000).withColumn("val", F.rand()).cache()
df_cached.count()  # materialize cache
df_cached.count()  # served from cache
df_cached.unpersist()
print("Ex05 cache/unpersist done")

# 6. persist with storage level
df_p = spark.range(50000).persist(StorageLevel.MEMORY_AND_DISK)
df_p.count()
df_p.unpersist()
print("Ex06 persist MEMORY_AND_DISK done")

# 7. coalesce to reduce partitions (no shuffle)
df_many = spark.range(100).repartition(20)
df_few  = df_many.coalesce(4)
print("Ex07 partitions:", df_few.rdd.getNumPartitions())

# 8. repartition to increase partitions (with shuffle)
df_repart = spark.range(100).repartition(8)
print("Ex08 partitions:", df_repart.rdd.getNumPartitions())

# 9. repartition by column (hash partitioning)
df_hash = spark.range(100).withColumn("key", F.col("id") % 4) \
               .repartition(4, F.col("key"))
print("Ex09 hash-partitioned by key")

# 10. Predicate pushdown — filter before join
big  = spark.range(1000000).withColumn("cat", F.col("id")%10)
small_ref = spark.range(5).withColumnRenamed("id","cat")
# GOOD: filter early
big.filter(F.col("cat") < 3).join(small_ref, on="cat").explain()

# 11. Column pruning — select only needed columns
# BAD:  df.join(other).select("a")  -- reads all columns then drops
# GOOD: df.select("a","key").join(other.select("key","b"), on="key")
print("Ex11 column pruning: select needed cols before joins")

# 12. Avoid UDFs where built-ins exist
# BAD:  @udf(DoubleType()) def slow_sqrt(x): return x**0.5
# GOOD: F.sqrt("col")
print("Ex12 prefer F.sqrt over UDF — no serialization overhead")

# 13. explain() — understand execution plan
spark.range(1000).filter(F.col("id") > 500).orderBy("id").explain(extended=False)

# 14. explain("cost") — cost-based optimizer plan
spark.range(1000).groupBy(F.col("id")%10).count().explain("cost")

# 15. Avoid collect() on large DataFrames
# BAD:  df.collect()  -- brings ALL data to driver
# GOOD: df.limit(100).collect()  or  df.write.parquet(path)
print("Ex15 avoid large collect(); use write() or limit()")

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Skew handling — identify skew
from pyspark.sql.window import Window
df_skew = spark.createDataFrame(
    [(i % 3, float(i)) for i in range(10000)], ["key","val"]
)
df_skew.groupBy("key").count().show()

# 17. Salting to handle skew
import random
N = 4
df_salted = df_skew.withColumn("salt", (F.rand()*N).cast("int"))
df_ref2   = spark.createDataFrame([(k,) for k in range(3)],["key"]) \
                 .withColumn("salt", F.explode(F.array([F.lit(i) for i in range(N)])))
df_salted.join(df_ref2, on=["key","salt"]).drop("salt").explain()

# 18. Broadcast join for lookup
lookup = spark.createDataFrame([(0,"A"),(1,"B"),(2,"C")],["key","label"])
df_skew.join(F.broadcast(lookup), on="key").explain()

# 19. Push filters early (predicate pushdown)
df_pp = spark.range(1000000).withColumn("cat", F.col("id")%5)
df_pp.filter(F.col("cat")==1).count()  # Filter pushed to scan

# 20. Avoid cartesian/cross joins
# Always specify join condition — cross join on large tables causes OOM
print("Ex20 always specify ON condition in joins")

# 21. Z-ordering for Delta (data skipping)
print("""
Ex21 ZORDER in Delta:
  OPTIMIZE table ZORDER BY (filter_column)
  → colocates rows with same values in fewer files
  → enables file-level data skipping (skip files where min/max don't match filter)
""")

# 22. Partition pruning
print("""
Ex22 Partition pruning:
  Table partitioned by `date`; filter on `date` → Spark reads only matching partitions
  Check with .explain() for "PartitionFilters" in plan
""")

# 23. File size tuning — optimal Parquet/Delta file size
spark.conf.set("spark.sql.files.maxPartitionBytes","134217728")  # 128MB
spark.conf.set("spark.sql.files.openCostInBytes","4194304")      # 4MB
print("Ex23 max partition bytes set to 128MB")

# 24. Write fewer, larger files
df_large2 = spark.range(100000)
df_large2.coalesce(4).write.mode("overwrite").parquet("/tmp/perf_out")
import os
files = os.listdir("/tmp/perf_out")
print("Ex24 output files:", len([f for f in files if f.endswith(".parquet")]))

# 25. Kryo serialization for RDD operations
spark.conf.set("spark.serializer","org.apache.spark.serializer.KryoSerializer")
print("Ex25 Kryo serializer set")

# 26. Memory configuration
# spark.executor.memory = 4g
# spark.executor.memoryOverhead = 512m
# spark.sql.shuffle.partitions = 200 (default) → tune to data size
print("Ex26 memory config: executor.memory, memoryOverhead, shuffle.partitions")

# 27. Tungsten — binary processing, off-heap
spark.conf.set("spark.sql.tungsten.enabled","true")
print("Ex27 Tungsten enabled (default in Spark 2+)")

# 28. Whole-stage code generation
spark.conf.set("spark.sql.codegen.wholeStage","true")
print("Ex28 whole-stage codegen enabled")

# 29. Dynamic partition pruning (DPP)
spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.enabled","true")
print("Ex29 DPP enabled")

# 30. Speculative execution (slow straggler mitigation)
spark.conf.set("spark.speculation","true")
spark.conf.set("spark.speculation.multiplier","1.5")
print("Ex30 speculative execution enabled")

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. AQE: coalesce post-shuffle partitions
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitionNum","1")
spark.conf.set("spark.sql.adaptive.coalescePartitions.initialPartitionNum","200")
print("Ex31 AQE coalesce config set")

# 32. AQE: convert sort-merge join to broadcast join at runtime
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled","true")
print("Ex32 AQE local shuffle reader enabled")

# 33. Cost-based optimizer (CBO) — gather table stats
spark.range(10000).write.mode("overwrite").saveAsTable("cbo_test")
spark.sql("ANALYZE TABLE cbo_test COMPUTE STATISTICS FOR ALL COLUMNS")
print("Ex33 CBO statistics computed")
spark.sql("DROP TABLE IF EXISTS cbo_test")

# 34. Join reordering (CBO)
spark.conf.set("spark.sql.cbo.enabled","true")
spark.conf.set("spark.sql.cbo.joinReorder.enabled","true")
print("Ex34 CBO join reorder enabled")

# 35. Vectorized Parquet reader
spark.conf.set("spark.sql.parquet.enableVectorizedReader","true")
print("Ex35 vectorized parquet reader enabled")

# 36. ORC vectorized reader
spark.conf.set("spark.sql.orc.enableVectorizedReader","true")
print("Ex36 vectorized ORC reader enabled")

# 37. Delta data skipping statistics
print("""
Ex37 Delta data skipping:
  - Stores min/max stats for each file per column
  - Query with filter → skip files where min > filter_val or max < filter_val
  - Up to 32 columns by default; configure with delta.dataSkippingNumIndexedCols
""")

# 38. Photon engine (Databricks)
print("Ex38 Photon: native vectorized C++ engine; enabled on Photon-enabled cluster configs")

# 39. Cluster auto-scaling
print("""
Ex39 Auto-scaling:
  minWorkers: 2
  maxWorkers: 20
  → Databricks adds/removes workers based on pending tasks
  → Useful for bursty workloads; not ideal for streaming (use fixed cluster)
""")

# 40. Delta OPTIMIZE write
spark.conf.set("spark.databricks.delta.optimizeWrite.enabled","true")
print("Ex40 Delta optimize write: auto-coalesces small writes into larger files")

# 41. Auto compaction
spark.conf.set("spark.databricks.delta.autoCompact.enabled","true")
print("Ex41 auto compaction: triggers OPTIMIZE after writes automatically")

# 42. Resource pools / fair scheduling
spark.sparkContext.setLocalProperty("spark.scheduler.pool","high_priority")
print("Ex42 FAIR scheduler pool set to high_priority")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. GC tuning
print("Ex43 GC: use G1GC (-XX:+UseG1GC) for large heaps; tune -XX:G1HeapRegionSize")

# 44. Executor memory breakdown
print("""
Ex44 Spark Memory Model:
  spark.executor.memory = M
  ├── Reserved (300MB)
  ├── User Memory  = (M - 300MB) * (1 - memoryFraction)
  └── Spark Memory = (M - 300MB) * memoryFraction (0.6 default)
      ├── Execution Memory (joins, sorts, shuffles)
      └── Storage Memory   (cache, broadcast)
""")

# 45. off-heap memory
spark.conf.set("spark.memory.offHeap.enabled","true")
spark.conf.set("spark.memory.offHeap.size","2g")
print("Ex45 off-heap 2GB enabled")

# 46. Shuffle write optimization
spark.conf.set("spark.shuffle.compress","true")
spark.conf.set("spark.shuffle.spill.compress","true")
print("Ex46 shuffle compression enabled")

# 47. Locality preference
print("Ex47 Spark prefers PROCESS_LOCAL > NODE_LOCAL > RACK_LOCAL > ANY; tune spark.locality.wait")

# 48. Dynamic allocation
spark.conf.set("spark.dynamicAllocation.enabled","true")
spark.conf.set("spark.dynamicAllocation.minExecutors","2")
spark.conf.set("spark.dynamicAllocation.maxExecutors","20")
print("Ex48 dynamic allocation enabled")

# 49. Checkpoint intervals for long lineage chains
sc = spark.sparkContext
sc.setCheckpointDir("/tmp/checkpoints")
long_chain = spark.range(1000)
for _ in range(20):
    long_chain = long_chain.filter(F.col("id") >= 0)
long_chain = long_chain.checkpoint()
print("Ex49 checkpoint broke long lineage")

# 50. Performance tuning checklist
print("""
Ex50 Perf Tuning Checklist:
  1. Reduce shuffle partitions for small data (default 200 is too high)
  2. Enable AQE for adaptive partition coalescing + skew join mitigation
  3. Broadcast small tables (< autoBroadcastJoinThreshold)
  4. OPTIMIZE + ZORDER Delta tables on filter columns
  5. Use column pruning + predicate pushdown
  6. Cache DataFrames used multiple times
  7. Avoid UDFs; use built-in functions or Pandas UDFs
  8. Use Photon-enabled clusters in Databricks
  9. Monitor Spark UI: Stage timeline, SQL tab, Executors tab
  10. Profile with spark.sql.execution.arrow.pyspark.enabled=true for Pandas ops
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
