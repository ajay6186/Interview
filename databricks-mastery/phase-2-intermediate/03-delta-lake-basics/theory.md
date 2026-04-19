# Theory: Delta Lake Basics

## What is Delta Lake?
Delta Lake is an open-source storage layer that adds **ACID transactions** to cloud object storage (S3, ADLS, GCS). It sits on top of Parquet files and adds a **transaction log** (`_delta_log/`) that tracks every change. Databricks is built around Delta Lake and uses it as the default table format.

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│               Delta Table on Cloud Storage          │
│                                                     │
│  _delta_log/                                        │
│    00000000000000000000.json   ← first write        │
│    00000000000000000001.json   ← second write       │
│    00000000000000000002.json   ← delete operation   │
│    00000000000000000010.checkpoint.parquet  ← checkpoint │
│                                                     │
│  part-00000-abc.parquet   ← actual data file        │
│  part-00001-def.parquet   ← actual data file        │
│  part-00002-ghi.parquet   ← old version (not removed yet) │
└────────────────────────────────────────────────────┘
```

Each JSON log entry records: operation (WRITE / MERGE / DELETE / UPDATE), schema, statistics, and which files were added/removed.

---

## ACID Properties in Delta Lake

| Property | How Delta achieves it |
|----------|----------------------|
| **Atomicity** | Transaction log — either all files are committed or none |
| **Consistency** | Schema enforcement — writes that violate schema are rejected |
| **Isolation** | Snapshot isolation — each read sees a consistent snapshot |
| **Durability** | Data is on durable cloud storage (S3/ADLS); log is the source of truth |

---

## Key Features

### 1. Time Travel
Every version of the table is preserved in the transaction log. You can query any historical version.

```python
# By version
df = spark.read.format("delta").option("versionAsOf", 5).load("/silver/orders")

# By timestamp
df = spark.read.format("delta").option("timestampAsOf","2024-01-15").load("/silver/orders")

# SQL
spark.sql("SELECT * FROM silver.orders VERSION AS OF 5")
spark.sql("SELECT * FROM silver.orders TIMESTAMP AS OF '2024-01-15'")
```

### 2. MERGE (Upsert)
Atomically insert new rows and update existing rows in one operation — the cornerstone of incremental ETL.

```python
from delta.tables import DeltaTable

DeltaTable.forPath(spark, "/silver/orders").alias("t") \
    .merge(new_df.alias("s"), "t.order_id = s.order_id") \
    .whenMatchedUpdateAll()      # update if key matches
    .whenNotMatchedInsertAll()   # insert if new
    .execute()
```

### 3. Schema Enforcement
Delta rejects writes that don't match the table schema (by default). Prevents silent data corruption.

```python
# Allow new columns to be added (but not type changes)
df.write.format("delta").option("mergeSchema","true").mode("append").save(path)

# Overwrite schema completely
df.write.format("delta").option("overwriteSchema","true").mode("overwrite").save(path)
```

### 4. OPTIMIZE and VACUUM
```python
# Compact small files into larger ones (target ~1 GB each)
spark.sql("OPTIMIZE delta.`/silver/orders`")

# With Z-ordering (co-locate data for filter pushdown)
spark.sql("OPTIMIZE silver.orders ZORDER BY (customer_id)")

# Remove files older than retention (default 7 days)
spark.sql("VACUUM silver.orders RETAIN 168 HOURS")
```

---

## Delta Log Deep Dive

```
_delta_log/00000000000000000000.json  contains:
{
  "commitInfo": {"timestamp": 1705276800000, "operation": "WRITE", ...},
  "add": {"path": "part-000.parquet", "size": 12345, "stats": {"numRecords": 100, ...}},
  ...
}
```

The transaction log is the **source of truth**. Reading a Delta table = read the log to find which files belong to the current version, then read those Parquet files.

**Checkpoint**: every 10 commits, Delta writes a `.checkpoint.parquet` file summarising all log entries → faster reads for tables with many commits.

---

## Delta vs Parquet vs Hudi vs Iceberg

| Feature | Parquet | Delta Lake | Apache Hudi | Apache Iceberg |
|---------|---------|-----------|-------------|----------------|
| ACID transactions | ✗ | ✓ | ✓ | ✓ |
| Time travel | ✗ | ✓ | limited | ✓ |
| MERGE / upsert | manual | ✓ | ✓ | ✓ |
| Schema evolution | manual | ✓ | ✓ | ✓ |
| Open format | ✓ | ✓ (Delta 3.0) | ✓ | ✓ |
| Databricks native | ✓ | ✓✓ (default) | ✓ | ✓ |
| Spark SQL native | ✓ | ✓ | ✓ | ✓ |

---

## Table Properties

```python
# Enable Change Data Feed (stream of changes)
spark.sql("ALTER TABLE silver.orders SET TBLPROPERTIES ('delta.enableChangeDataFeed'='true')")

# Auto-compact small files after writes
spark.sql("ALTER TABLE silver.orders SET TBLPROPERTIES ('delta.autoCompact.enabled'='true')")

# Optimized writes (shuffle before write to size files correctly)
spark.sql("ALTER TABLE silver.orders SET TBLPROPERTIES ('delta.optimizeWrite.enabled'='true')")

# Append-only (for audit tables — prevents DELETE/UPDATE)
spark.sql("ALTER TABLE ops.audit SET TBLPROPERTIES ('delta.appendOnly'='true')")

# Add CHECK constraint
spark.sql("ALTER TABLE silver.orders ADD CONSTRAINT pos_amount CHECK (amount > 0)")
```

---

## DESCRIBE Commands

```python
spark.sql("DESCRIBE DETAIL silver.orders")
# → numFiles, sizeInBytes, partitionColumns, lastModified, location

spark.sql("DESCRIBE HISTORY silver.orders LIMIT 10")
# → version, timestamp, operation, operationMetrics, userName
```

---

## Common Interview Questions

**Q: What is the Delta transaction log?**  
A: The `_delta_log/` directory contains JSON files (one per commit) that record every add/remove of Parquet files. Reading a Delta table means first reading the log to determine which files belong to the current version, then reading those Parquet files. The log is the source of truth for ACID guarantees.

**Q: How does Delta Lake achieve ACID transactions?**  
A: Atomicity via transaction log (all-or-nothing commits). Consistency via schema enforcement (invalid writes rejected). Isolation via snapshot isolation (readers see a consistent point-in-time snapshot, not partially written data). Durability via cloud object storage (S3/ADLS).

**Q: What is Delta time travel and how does it work?**  
A: Delta retains old Parquet files and the transaction log. You can query any historical version using `versionAsOf` or `timestampAsOf`. This works because old files are not deleted until `VACUUM` is run. Default retention is 7 days (168 hours).

**Q: What is the difference between `MERGE` and `INSERT OVERWRITE`?**  
A: `INSERT OVERWRITE` (or `mode("overwrite")`) rewrites the entire table or partition. `MERGE` does a row-level upsert — matches existing rows by key and updates them, inserts new rows, optionally deletes rows. MERGE is idempotent and much more efficient for incremental updates.

**Q: What does OPTIMIZE do and when should you run it?**  
A: `OPTIMIZE` compacts many small Parquet files into larger files (target ~1 GB). Small files accumulate from streaming writes or frequent appends and slow down reads (many I/O round-trips). Run after bulk loads and on a schedule (weekly or daily for high-write tables).

**Q: What is Z-ordering in Delta Lake?**  
A: Z-ordering co-locates rows with similar values of a column within the same Parquet files. Queries filtering on that column skip most files. E.g., `OPTIMIZE orders ZORDER BY (customer_id)` — queries for a specific customer skip ~95% of files. Effective for 1–2 high-selectivity columns.

**Q: What is VACUUM and what are the risks?**  
A: `VACUUM` deletes Parquet files that are no longer part of the current table version and are older than the retention threshold (default 7 days). Risk: if you vacuum below 7 days, time travel queries will fail. Warning: never vacuum below the retention period when concurrent readers or streams are running.

**Q: What is Change Data Feed (CDF)?**  
A: CDF records every row-level INSERT, UPDATE, DELETE as a change event in a special table. Downstream tables can read only the changes (incremental) instead of the full table. Enable with `delta.enableChangeDataFeed=true`. Read with `spark.read.format("delta").option("readChangeFeed","true")`.

---

## Common Pitfalls

- **Vacuuming too aggressively** → breaks time travel and stream checkpoints.
- **Forgetting `MERGE` is not a complete transaction across multiple tables** → use two-phase pattern for multi-table atomicity.
- **Running OPTIMIZE with ZORDER on the wrong column** → Z-order on partition column = wasted effort (partition pruning already handles it).
- **Not enabling CDF before you need it** → you can't read past changes if CDF wasn't on when they happened.
- **Too many `MERGE` writers at once** → Delta conflict detection → retries or failures.

---

## Quick Reference

```python
# Write
df.write.format("delta").mode("overwrite").save(path)
df.write.format("delta").mode("append").save(path)
df.write.format("delta").partitionBy("date").mode("overwrite") \
    .option("replaceWhere","date='2024-01-15'").save(path)

# Read
spark.read.format("delta").load(path)
spark.read.format("delta").option("versionAsOf", 3).load(path)
spark.table("catalog.schema.table")

# MERGE
DeltaTable.forPath(spark, path).alias("t") \
    .merge(src.alias("s"), "t.id = s.id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .execute()

# Maintenance
spark.sql("OPTIMIZE delta.`/path` ZORDER BY (col)")
spark.sql("VACUUM delta.`/path` RETAIN 168 HOURS")
spark.sql("DESCRIBE HISTORY delta.`/path`")
spark.sql("RESTORE TABLE delta.`/path` TO VERSION AS OF 3")
```
