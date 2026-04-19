# Theory: Spark Basics

## What is Apache Spark?
Apache Spark is a distributed in-memory computing engine for large-scale data processing. It runs computations across a cluster of machines, keeping intermediate data in memory (rather than writing to disk after every step like Hadoop MapReduce), making it 10–100× faster for iterative workloads.

Databricks is a managed cloud platform built on top of Apache Spark. It adds collaborative notebooks, Delta Lake, Unity Catalog, MLflow, and production job scheduling on top of the open-source Spark engine.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  DRIVER NODE                     │
│  SparkContext → DAG Scheduler → Task Scheduler   │
│  SparkSession (entry point for user code)        │
└────────────────────┬────────────────────────────┘
                     │  distributes tasks
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Worker  │  │ Worker  │  │ Worker  │
   │Executor │  │Executor │  │Executor │
   │ Task Task│  │ Task Task│  │ Task Task│
   └─────────┘  └─────────┘  └─────────┘
        │            │            │
   ┌────▼────────────▼────────────▼────┐
   │         Cluster Manager            │
   │  (YARN / Kubernetes / Standalone)  │
   └────────────────────────────────────┘
```

**Driver**: Runs your Python/Scala code. Builds the execution plan (DAG). Coordinates workers.  
**Executor**: JVM process on each worker node. Runs tasks and stores cached data.  
**Task**: Smallest unit of work. One task processes one partition.  
**Partition**: A chunk of the distributed dataset.

---

## Core Concepts

### SparkSession vs SparkContext
- **SparkContext** (old, Spark 1.x): low-level entry point for RDD operations.
- **SparkSession** (Spark 2+): unified entry point. Wraps SparkContext + HiveContext + SQLContext. Use this.

```python
spark = SparkSession.builder.appName("my-app").getOrCreate()
sc    = spark.sparkContext   # still accessible if needed
```

### RDD (Resilient Distributed Dataset)
- Low-level distributed collection of any Python objects.
- Immutable, fault-tolerant (can be recomputed from lineage on failure).
- No schema — just rows of arbitrary objects.
- Use when: complex transformations that DataFrames can't express.

### DataFrame
- Distributed collection of **Row** objects with a **schema** (column names + types).
- Optimised by the **Catalyst query optimizer** — better performance than RDDs.
- Interoperable with Spark SQL.
- **Always prefer DataFrames over RDDs** for structured data.

### Dataset (Scala/Java only)
- Type-safe DataFrame. Not available in Python (PySpark DataFrames are untyped at compile time).

---

## Lazy Evaluation & DAG

Spark builds a **Directed Acyclic Graph (DAG)** of transformations. Nothing executes until an **action** is called.

```
df.filter(...)  ← transformation — adds to plan, no data moves
  .select(...)  ← transformation — adds to plan
  .count()      ← ACTION — triggers execution of entire plan
```

**Why lazy?**  
Spark can optimise the whole pipeline before running it (e.g., push filters before joins, eliminate unnecessary shuffles).

### Transformations vs Actions

| Transformations (lazy) | Actions (trigger execution) |
|------------------------|----------------------------|
| filter, select, withColumn | count, collect, show |
| groupBy, agg, join | first, head, take |
| map, flatMap (RDD) | write, save |
| orderBy, repartition | toPandas |

### Narrow vs Wide Transformations

| Narrow | Wide |
|--------|------|
| No shuffle — each partition produces output from its own data only | Requires shuffle — data moves between partitions |
| filter, select, map, withColumn | groupBy, join, distinct, orderBy |
| Fast, can be pipelined | Slow, marks stage boundaries |

---

## Storage Levels (Persistence)

```python
from pyspark import StorageLevel
df.persist(StorageLevel.MEMORY_AND_DISK)   # cache to RAM, spill to disk
df.cache()                                  # shorthand for MEMORY_ONLY
df.unpersist()                              # release cache
```

| Level | Meaning |
|-------|---------|
| MEMORY_ONLY | Store as deserialized JVM objects in RAM |
| MEMORY_AND_DISK | Spill to disk if RAM full |
| DISK_ONLY | Always on disk (slow, rarely used) |
| MEMORY_ONLY_SER | Serialised — less RAM, more CPU |

**Cache when**: DataFrame is used 2+ times in the same job. Always unpersist after use.

---

## Key Settings

```python
spark.conf.set("spark.sql.shuffle.partitions", "200")   # default 200
spark.conf.set("spark.sql.adaptive.enabled",   "true")  # AQE (default on DBR 7+)
spark.sparkContext.setLogLevel("WARN")                   # reduce noise
```

---

## Common Interview Questions

**Q: What is the difference between a transformation and an action?**  
A: Transformations are lazy operations that build the execution plan (DAG) — no data moves. Actions trigger execution of the plan and return results to the driver or write to storage. Examples: `filter`, `select` are transformations; `count`, `collect`, `show` are actions.

**Q: What is the difference between narrow and wide transformations?**  
A: Narrow transformations process each partition independently (no shuffle): `filter`, `map`, `select`. Wide transformations require data from multiple partitions (shuffle): `groupBy`, `join`, `distinct`, `orderBy`. Wide transformations mark stage boundaries and are expensive.

**Q: What is lazy evaluation and why does Spark use it?**  
A: Lazy evaluation means transformations build a logical plan without executing. Execution only happens when an action is called. This lets Catalyst optimise the entire pipeline — e.g., push filters before joins, remove unused columns — before generating the physical plan.

**Q: What is the difference between RDD and DataFrame?**  
A: RDDs are low-level, untyped collections with no schema optimisation. DataFrames have a schema and are optimised by Catalyst — they compile to the same JVM bytecode but the optimizer can reorder and eliminate operations. DataFrames are 10–100× faster for structured data.

**Q: What is a Spark partition?**  
A: A partition is a chunk of the distributed dataset. Each task processes one partition. More partitions = more parallelism (up to the number of cores). Default shuffle partitions = 200. Rule of thumb: 100–200 MB of data per partition.

**Q: When should you use `repartition` vs `coalesce`?**  
A: `repartition(N)` performs a full shuffle and creates exactly N balanced partitions. `coalesce(N)` reduces partition count without a full shuffle but can produce unbalanced partitions. Use `coalesce` before writing output to avoid too many small files; use `repartition` to fix severe skew.

**Q: What is the Spark DAG?**  
A: The DAG (Directed Acyclic Graph) represents the computation plan. Nodes are RDDs/DataFrames, edges are transformations. The DAG Scheduler splits the DAG into stages at shuffle boundaries. Each stage is a set of tasks that can run in parallel.

**Q: What are Executors and how do they work?**  
A: Executors are JVM processes on worker nodes. Each executor runs multiple tasks in parallel (one task per core). Executors store cached RDD/DataFrame partitions. If an executor fails, Spark recomputes lost partitions using lineage.

---

## Common Pitfalls

- **Calling `collect()` on large DataFrames** → pulls all data to driver → OOM crash.
- **Forgetting `unpersist()`** → cached data fills executor RAM → degrades other jobs.
- **`orderBy` on large DataFrames** → full shuffle to single partition → slow + OOM risk.
- **Using Python UDFs** → each row crosses JVM→Python boundary → 10–100× slower than native functions.
- **Too many or too few partitions** → overhead or slow tasks; tune `shuffle.partitions`.

---

## Quick Reference

```python
# Create
spark = SparkSession.builder.appName("app").getOrCreate()
df = spark.createDataFrame(data, ["col1","col2"])
df = spark.read.csv("/path", header=True, inferSchema=True)

# Inspect
df.printSchema()
df.show(5, truncate=False)
df.count()
df.columns
df.dtypes

# Transform (lazy)
df.select("col1","col2")
df.filter(F.col("age") > 25)
df.withColumn("new", F.col("a") + F.col("b"))
df.withColumnRenamed("old","new")
df.drop("col")
df.orderBy(F.col("price").desc())

# Actions
df.count()
df.collect()          # all rows → driver
df.take(10)           # first 10 rows
df.first()

# Cache
df.cache()
df.persist(StorageLevel.MEMORY_AND_DISK)
df.unpersist()
```
