# Theory: Reading & Writing Data

## Data Source API
Spark uses a unified `DataFrameReader` / `DataFrameWriter` API for all formats. The `.format()` specifies the source/sink type.

```python
# Generic pattern
df = spark.read.format("FORMAT").option("key","value").load("PATH")
df.write.format("FORMAT").option("key","value").mode("MODE").save("PATH")
```

---

## Write Modes

| Mode | Behaviour |
|------|-----------|
| `overwrite` | Delete all existing data, write new data |
| `append` | Add new data to existing data |
| `ignore` | Write only if path doesn't exist; silently do nothing otherwise |
| `error` (default) | Raise error if path already exists |

---

## File Formats Comparison

| Format | Schema | Compression | Splittable | Best for |
|--------|--------|-------------|------------|---------|
| **CSV** | none (inferred) | GZIP, none | GZIP = No | Human-readable exchange, legacy |
| **JSON** | none (inferred) | GZIP | GZIP = No | Semi-structured, nested |
| **Parquet** | embedded | Snappy (default) | Yes | Analytics, columnar, fast |
| **ORC** | embedded | ZLIB | Yes | Hive ecosystem |
| **Avro** | external schema | Snappy | Yes | Kafka, schema registry |
| **Delta** | versioned + enforced | Snappy / ZSTD | Yes | All Databricks production use |

---

## Reading Common Formats

```python
# CSV
df = spark.read.format("csv") \
    .option("header","true") \
    .option("inferSchema","true") \
    .option("sep",",") \
    .option("nullValue","NA") \
    .option("dateFormat","yyyy-MM-dd") \
    .load("s3://bucket/data/*.csv")

# JSON (line-delimited)
df = spark.read.json("/path/to/data.jsonl")

# Parquet
df = spark.read.parquet("/path/to/data/")

# Delta
df = spark.read.format("delta").load("/silver/orders")
df = spark.table("silver.orders")      # from catalog

# JDBC
df = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://host:5432/mydb") \
    .option("dbtable", "orders") \
    .option("user", dbutils.secrets.get("scope","user")) \
    .option("password", dbutils.secrets.get("scope","password")) \
    .option("numPartitions", "10") \
    .option("partitionColumn", "order_id") \
    .option("lowerBound","0") \
    .option("upperBound","100000") \
    .load()
```

---

## Writing Common Formats

```python
# Parquet (partitioned)
df.write.format("parquet").partitionBy("order_date").mode("overwrite").save("/output/")

# Delta
df.write.format("delta").mode("append").save("/silver/orders")

# Delta with partition overwrite (idempotent)
df.write.format("delta") \
    .partitionBy("order_date") \
    .mode("overwrite") \
    .option("replaceWhere","order_date='2024-01-15'") \
    .save("/silver/orders")

# Save as catalog table
df.write.format("delta").saveAsTable("silver.orders")

# CSV (for export)
df.coalesce(1).write.csv("/output/report.csv", header=True)
```

---

## Auto Loader (cloudFiles)

Auto Loader is Databricks-native for incrementally ingesting files from cloud storage as they arrive. It uses structured streaming internally.

```python
df = (spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "json")           # source file format
    .option("cloudFiles.schemaLocation", "/schema/orders")  # save inferred schema
    .option("cloudFiles.inferColumnTypes", "true")
    .load("s3://landing/orders/"))

df.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/ckpt/orders_bronze") \
    .outputMode("append") \
    .trigger(availableNow=True)   # process all available files then stop
    .start("/bronze/orders")
```

**Why Auto Loader over `spark.read`?**  
- Tracks which files have already been processed (no re-ingestion).
- Handles schema evolution with `cloudFiles.schemaEvolutionMode=addNewColumns`.
- Scales to millions of files without listing performance issues.

---

## Schema Inference vs Explicit Schema

```python
# Infer (slow for large datasets, may get types wrong)
df = spark.read.option("inferSchema","true").csv("/data/")

# Explicit (fast, correct, recommended for production)
from pyspark.sql.types import *
schema = StructType([
    StructField("order_id",   StringType(),    False),
    StructField("amount",     DoubleType(),    True),
    StructField("order_date", DateType(),      True),
])
df = spark.read.schema(schema).csv("/data/")
```

**Always use explicit schemas in production** — inferSchema scans the data (expensive) and may guess wrong types (e.g., all-numeric strings become IntegerType).

---

## Partitioned Reads

```python
# Partition pruning: Spark reads only matching partitions
df = spark.read.parquet("/data/partitioned_by_date/") \
    .filter(F.col("order_date") == "2024-01-15")
# → Only reads the 2024-01-15 partition directory

# Specify partitioning explicitly if Spark doesn't auto-detect
df = spark.read.option("basePath","/data/").parquet("/data/order_date=2024-01-15/")
```

---

## Common Interview Questions

**Q: What is the difference between `saveAsTable` and `save`?**  
A: `save(path)` writes data files to a path without registering in any catalog. `saveAsTable("catalog.schema.table")` writes data AND registers the table in the catalog (Hive metastore or Unity Catalog), making it queryable by name from SQL or other sessions.

**Q: What is `replaceWhere` and why is it important?**  
A: `replaceWhere` is a Delta-specific option that atomically overwrites only the rows matching a predicate — typically a single partition. This makes daily ETL runs idempotent: running the same job twice produces the same result (no duplicate data). Without it, `mode("overwrite")` wipes the entire table.

**Q: How does Auto Loader differ from `spark.read`?**  
A: `spark.read` is a batch read of all files at the time of the call (no tracking). Auto Loader (`cloudFiles`) is a streaming source that tracks which files were already processed, handles schema evolution, and scales to millions of files using directory listing or event notifications (SNS/Event Grid).

**Q: Why use explicit schemas instead of `inferSchema`?**  
A: `inferSchema` scans the data to guess types (slow) and may be wrong (e.g., integer IDs become bigint, dates stay strings). Explicit schemas are faster, deterministic, and ensure correct types at pipeline entry — preventing downstream type errors.

**Q: What is the difference between Parquet and Delta?**  
A: Delta = Parquet files + transaction log (`_delta_log/`). Parquet is just column-oriented file storage with no ACID support, no upserts, and no schema enforcement. Delta adds all of those on top of Parquet, which is why Delta is always preferred for production Databricks workloads.

**Q: How do you read data from JDBC with parallelism?**  
A: Use `numPartitions`, `partitionColumn`, `lowerBound`, `upperBound` options. Spark splits the read range into N parallel queries, each fetching a sub-range. Without these options, JDBC reads in a single thread (no parallelism, potential bottleneck).

---

## Quick Reference

```python
# Read shortcuts
spark.read.csv("/path", header=True, inferSchema=True)
spark.read.json("/path")
spark.read.parquet("/path")
spark.read.format("delta").load("/path")
spark.table("schema.table")

# Write shortcuts
df.write.csv("/path", header=True, mode="overwrite")
df.write.parquet("/path", mode="append")
df.write.format("delta").mode("overwrite").save("/path")
df.write.format("delta").partitionBy("col").saveAsTable("db.table")

# Schema types
StringType(), IntegerType(), LongType()
DoubleType(), FloatType(), DecimalType(10,2)
BooleanType(), DateType(), TimestampType()
ArrayType(StringType()), MapType(StringType(), IntegerType())
StructType([StructField("name", StringType(), nullable=True)])
```
