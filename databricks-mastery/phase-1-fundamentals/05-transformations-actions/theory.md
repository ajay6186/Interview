# Theory: Transformations & Actions

## The Fundamental Split
Every Spark operation is either a **transformation** (adds to the plan, returns a new DataFrame, no execution) or an **action** (triggers execution, returns a result to the driver or writes to storage).

This is called **lazy evaluation** — the most important concept in Spark.

---

## Lazy Evaluation Flow

```
1. User calls transformations → Spark builds a logical plan (DAG)
2. Catalyst optimizer rewrites the plan (push filters down, eliminate columns, etc.)
3. Catalyst generates the physical plan (which join strategy, how to order stages)
4. User calls an action → Spark executes the physical plan
5. Results returned to driver OR written to storage
```

```python
df = spark.read.parquet("/data/")         # No execution yet
df2 = df.filter(F.col("age") > 25)       # No execution yet — adds to plan
df3 = df2.select("name", "age")          # No execution yet — adds to plan
df3.show()                               # ACTION — plan executes NOW
```

---

## Transformations (Lazy)

### Narrow Transformations (no shuffle)
Each output partition depends only on one input partition. Can be pipelined together.

| Operation | Description |
|-----------|-------------|
| `filter / where` | Keep rows matching predicate |
| `select` | Choose columns |
| `withColumn` | Add/replace column |
| `withColumnRenamed` | Rename column |
| `drop` | Remove column |
| `map` (RDD) | Apply function to each element |
| `flatMap` (RDD) | Apply function, flatten results |
| `union` | Combine two DataFrames with same schema |
| `sample` | Randomly sample rows |

### Wide Transformations (shuffle)
Output partitions depend on multiple input partitions — data moves across the network. Each wide transformation creates a **stage boundary**.

| Operation | Description |
|-----------|-------------|
| `groupBy + agg` | Aggregate by key |
| `join` | Combine two DataFrames on a key |
| `distinct` | Remove duplicate rows |
| `orderBy / sort` | Global sort (all data to fewer partitions) |
| `repartition(N)` | Full shuffle to N balanced partitions |
| `reduceByKey` (RDD) | Aggregate by key with shuffle |
| `cogroup` (RDD) | Group two RDDs by key |

---

## Actions (Trigger Execution)

```python
# Aggregations → returns a value to driver
df.count()                          # Long: number of rows
df.agg(F.sum("amount")).collect()  # Sum

# Fetch data → returns to driver (be careful with large DFs!)
df.collect()                        # List[Row]: all rows — can OOM
df.take(10)                         # List[Row]: first 10
df.first()                          # Row: first row
df.head(5)                          # List[Row]: first 5

# Display
df.show(20, truncate=False)         # Print to stdout
df.describe("amount").show()        # Summary statistics

# Write → writes to storage (safest for large data)
df.write.format("delta").save("/path")
df.write.saveAsTable("db.table")
df.writeTo("catalog.schema.table").append()

# Convert
df.toPandas()                       # pandas DataFrame (all data → driver)

# For each partition
df.foreachPartition(fn)             # process each partition (side effects)
df.foreach(fn)                      # process each row (side effects)
```

---

## Stages, Tasks, and Partitions

```
Job (triggered by one action)
  └── Stages (separated by shuffle boundaries)
       ├── Stage 1: narrow transforms — runs on N partitions in parallel
       │    ├── Task 1: processes partition 1
       │    ├── Task 2: processes partition 2
       │    └── Task N: processes partition N
       └── Stage 2: after shuffle — runs on M partitions
            ├── Task 1: processes shuffled partition 1
            └── Task M: processes shuffled partition M
```

- **One task = one partition = one CPU core** (ideally).
- Too few partitions: not enough parallelism, slow.
- Too many partitions: scheduling overhead per task, slow.
- **Rule of thumb**: 100–200 MB per partition; `spark.sql.shuffle.partitions = 200` (default).

---

## RDD vs DataFrame API

```python
# DataFrame (high-level, optimized)
df.filter(F.col("age") > 25).select("name").groupBy("name").count()

# RDD (low-level, manual)
rdd = sc.parallelize([("Alice",30), ("Bob",25)])
rdd.filter(lambda x: x[1] > 25).map(lambda x: x[0]).countByValue()
```

**Always use DataFrame API** for structured data. Use RDD only for:
- Operations not expressible in DataFrame API.
- Processing unstructured text (log parsing).
- Custom partitioning logic.

---

## accumulator and broadcast (RDD concepts)

```python
# Accumulator: distributed counter/sum (only updated in transformations, read in driver)
acc = sc.accumulator(0)
df.foreach(lambda row: acc.add(1))   # each executor increments
print(acc.value)                      # read in driver

# Broadcast variable: send read-only lookup table to all executors (avoid shuffle)
lookup = sc.broadcast({"A": 1, "B": 2})
result = rdd.map(lambda x: lookup.value.get(x, 0))
```

---

## Common Interview Questions

**Q: What is lazy evaluation and what are its benefits?**  
A: Transformations are not executed when called — they add to a logical plan. Execution only happens on actions. Benefits: (1) Catalyst can optimize the whole pipeline before running, (2) unused columns/rows can be eliminated before data is read, (3) operations can be pipelined and fused into fewer passes over the data.

**Q: What triggers Spark execution?**  
A: Actions trigger execution: `count()`, `collect()`, `show()`, `first()`, `take(n)`, `write()`, `save()`, `toPandas()`, `foreachPartition()`. Every action creates one Spark job.

**Q: What is a stage in Spark?**  
A: A stage is a set of tasks that can run in parallel without a shuffle. Stage boundaries occur at wide transformations (groupBy, join, distinct, orderBy). One job may have many stages; stages run sequentially (output of one feeds the next).

**Q: Why is `collect()` dangerous on large DataFrames?**  
A: `collect()` transfers all partitions to the driver node. If the DataFrame is larger than driver memory, the driver OOMs and the job crashes. Use `show(N)` or `take(N)` for inspection, or write to storage instead of collecting.

**Q: What is the difference between `count()` and `show()`?**  
A: Both are actions that trigger execution. `count()` returns a Python integer (number of rows) to the driver. `show()` fetches the first N rows and prints them — it's a `take()` + print under the hood. Neither is "free" — both scan all required partitions.

**Q: What is a Spark accumulator?**  
A: An accumulator is a shared variable that workers can only add to (not read). The driver can read the final value after an action. Use for: counting records processed, counting errors, building simple metrics during a foreach/foreachPartition. Do NOT use for business logic — accumulators inside transformations are unreliable (may be counted twice on task retry).

---

## Quick Reference

```python
# Narrow transformations (no shuffle)
df.filter(col > 5)
df.select("a","b")
df.withColumn("c", expr)
df.drop("col")
df.union(df2)
df.sample(fraction=0.1, seed=42)

# Wide transformations (shuffle)
df.groupBy("key").agg(...)
df.join(df2, "key", "left")
df.distinct()
df.orderBy("col")
df.repartition(10)

# Actions
n = df.count()
rows = df.collect()        # dangerous on large data
r = df.first()
rows = df.take(10)
df.show(10)
df.write.format("delta").save("/path")
```
