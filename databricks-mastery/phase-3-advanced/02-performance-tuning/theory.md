# Theory: Performance Tuning

## Adaptive Query Execution (AQE)

AQE re-optimizes the query plan at runtime using actual data statistics collected during execution — not just estimates.

```python
# Enable (default ON in DBR 7+)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# AQE features:
# 1. Dynamic coalescing of shuffle partitions
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitionSize", "64MB")

# 2. Dynamic skew join splitting
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")

# 3. Dynamic switch of join strategy (SortMergeJoin → BroadcastHashJoin at runtime)
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
```

**AQE flow**:
```
Query starts → Stage 1 executes → AQE reads actual stats
→ Re-plans Stage 2 (may coalesce small partitions, split large partitions, switch join type)
→ Stage 2 executes with optimized plan
```

---

## Shuffle Partition Tuning

The single most impactful performance setting for aggregations and joins:

```python
# Default (often too high for small data, too low for large data)
spark.conf.set("spark.sql.shuffle.partitions", "200")

# Rule of thumb: target 100–200 MB per partition after shuffle
# Formula: total_data_size_MB / target_partition_size_MB
# Example: 2000 MB / 100 MB = 20 partitions

# AQE coalesces automatically — but set a reasonable starting point
spark.conf.set("spark.sql.shuffle.partitions", "400")  # let AQE reduce

# Check partition sizes after a shuffle
df.groupBy("region").agg(F.count("*")).explain()
# Look for "Exchange" nodes in the plan — each is a shuffle stage
```

---

## Broadcast Join Threshold

```python
# Auto-broadcast tables smaller than this (default 10 MB)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "209715200")  # 200 MB

# Force broadcast hint (even if table is larger than threshold)
from pyspark.sql.functions import broadcast
df_large.join(broadcast(df_small), "product_id")

# Disable auto-broadcast (force SortMergeJoin for debugging)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "-1")

# Read the plan to confirm strategy
df_joined.explain()
# Look for: BroadcastHashJoin vs SortMergeJoin vs ShuffleHashJoin
```

---

## Partition Pruning

Spark skips reading Parquet files for partitions that don't match the filter — only works on partition columns.

```python
# Write partitioned data
df.write.format("delta") \
    .partitionBy("region", "date") \
    .save("/delta/orders")

# Filter on partition column → Spark skips non-matching partitions
df = spark.read.format("delta").load("/delta/orders")
df.filter(F.col("region") == "EU").filter(F.col("date") == "2024-01-15")
# Reads only /delta/orders/region=EU/date=2024-01-15/*.parquet

# Verify with explain — look for "PartitionFilters" in the plan
df.filter(F.col("region") == "EU").explain()
```

**Predicate Pushdown**: For file formats that support statistics (Parquet, Delta), Spark pushes filters down to file scan level to skip row groups.

---

## Caching

```python
# Cache a DataFrame in memory (persist on first action)
df.cache()               # MEMORY_AND_DISK (default for DataFrames)
df.persist()             # same

# Specific storage levels
from pyspark import StorageLevel
df.persist(StorageLevel.MEMORY_ONLY)        # OOM if doesn't fit
df.persist(StorageLevel.MEMORY_AND_DISK)   # spills to disk
df.persist(StorageLevel.DISK_ONLY)          # always on disk (slower)
df.persist(StorageLevel.MEMORY_AND_DISK_SER)  # serialized (less RAM)

# Always unpersist when done
df.unpersist()

# Check what's cached
spark.catalog.listCachedTables()
```

**When to cache**:
- A DataFrame is used in **multiple downstream actions** (branching pipelines)
- An expensive computation (join + aggregation) that needs to be reused
- Iterative algorithms (ML)

**When NOT to cache**:
- Single-use DataFrames (waste of memory)
- Larger than cluster memory (spills cause thrashing)
- DataFrames that change frequently

---

## OPTIMIZE and File Compaction

```python
# Compact small files into target size (default 1 GB)
spark.sql("OPTIMIZE orders")

# Z-ORDER: co-locate related data in the same files
spark.sql("OPTIMIZE orders ZORDER BY (customer_id, order_date)")

# Verify file count before/after
spark.sql("DESCRIBE DETAIL orders").select("numFiles", "sizeInBytes").show()

# Auto-optimize (write-time compaction)
spark.sql("""
ALTER TABLE orders SET TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',  -- coalesce small writes
    'delta.autoOptimize.autoCompact' = 'true'     -- background compaction
)
""")
```

---

## VACUUM

```python
# Remove files no longer referenced by any Delta version
# Default retention: 7 days (168 hours)
spark.sql("VACUUM orders")

# Custom retention
spark.sql("VACUUM orders RETAIN 240 HOURS")  # 10 days

# DRY RUN — see what would be deleted without deleting
spark.sql("VACUUM orders DRY RUN")

# WARNING: setting retention < 7 days breaks time travel & concurrent readers
spark.conf.set("spark.databricks.delta.retentionDurationCheck.enabled", "false")  # not recommended
```

---

## Repartition vs Coalesce

```python
# repartition(N): full shuffle, perfectly balanced, expensive
df.repartition(10)
df.repartition(10, F.col("region"))  # hash-partition by column

# coalesce(N): no shuffle, reduces partitions by merging (unbalanced possible)
df.coalesce(4)   # combine partitions locally, no network transfer

# When to use:
# repartition — before a join/agg where you need specific partition count
# coalesce — before writing to reduce output files (avoid small files)

# After shuffle (e.g., post-join), coalesce to reduce output files:
df_joined.coalesce(4).write.format("delta").save("/path")
```

---

## Avoiding Small Files

Small files are the #1 Delta Lake performance problem. Causes: frequent streaming writes, per-partition writes, many small batch loads.

```python
# 1. Use optimizeWrite (Databricks)
df.write.format("delta") \
    .option("optimizeWrite", "true") \
    .save("/path")

# 2. Coalesce before writing
df.coalesce(8).write.format("delta").save("/path")

# 3. OPTIMIZE after many small writes
spark.sql("OPTIMIZE orders")

# 4. Trigger OPTIMIZE in streaming
(stream_df.writeStream
    .option("checkpointLocation", "/ckpt")
    .trigger(processingTime="1 hour")  # larger batches = fewer files
    .format("delta")
    .start("/path"))
```

---

## Common Interview Questions

**Q: What is AQE and what problems does it solve?**  
A: AQE re-optimizes query plans at runtime using real shuffle statistics. It solves three problems: (1) coalesces empty/tiny shuffle partitions dynamically, (2) splits oversized skewed partitions, (3) switches from SortMergeJoin to BroadcastHashJoin when one side turns out to be small at runtime.

**Q: How do you choose the right number of shuffle partitions?**  
A: Rule of thumb: aim for 100–200 MB per post-shuffle partition. Formula: `total_shuffled_data_MB / target_partition_MB`. With AQE enabled, set a slightly high value (e.g., 400) and let AQE coalesce small ones down.

**Q: When should you cache a DataFrame?**  
A: Cache when the same DataFrame is used in multiple downstream transformations or actions (avoids recomputing). Always `unpersist()` after you're done. Don't cache single-use DataFrames or ones larger than cluster memory.

**Q: What is predicate pushdown and partition pruning?**  
A: Predicate pushdown pushes filter conditions into the file scan to skip row groups (Parquet statistics). Partition pruning skips entire directory partitions when the filter matches a partition column — the strongest form of data skipping.

**Q: What is the difference between `repartition` and `coalesce`?**  
A: `repartition(N)` does a full shuffle to produce N balanced partitions — use when you need specific partition count before joins. `coalesce(N)` merges partitions locally (no shuffle) — use only to reduce partition count (e.g., before writing to avoid small files). Never use `coalesce` to increase partition count.

**Q: How do you avoid the small files problem in Delta Lake?**  
A: Four approaches: (1) Enable `optimizeWrite` to coalesce files at write time. (2) Use `coalesce()` before writing to control file count. (3) Run `OPTIMIZE` to compact existing small files. (4) Use larger streaming trigger intervals to batch more data per micro-batch.

---

## Quick Reference

```python
# AQE
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Shuffle partitions
spark.conf.set("spark.sql.shuffle.partitions", "200")

# Broadcast
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "209715200")
df_large.join(broadcast(df_small), "key")

# Cache
df.cache()
df.unpersist()
df.persist(StorageLevel.MEMORY_AND_DISK)

# Partitioning
df.repartition(10, F.col("region"))  # full shuffle
df.coalesce(4)                        # local merge

# Compaction
OPTIMIZE table_name
OPTIMIZE table_name ZORDER BY (col1, col2)
VACUUM table_name RETAIN 168 HOURS

# Partition pruning — always filter on partition columns
df.filter(F.col("region") == "EU")   # reads only region=EU files
```
