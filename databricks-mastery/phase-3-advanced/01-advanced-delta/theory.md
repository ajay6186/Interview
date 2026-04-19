# Theory: Advanced Delta Lake

## Change Data Feed (CDF)

CDF records row-level changes (INSERT, UPDATE, DELETE) so downstream consumers can process only what changed.

```python
# Enable on a table
spark.sql("ALTER TABLE orders SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')")

# Or at creation
spark.sql("""
CREATE TABLE orders (id LONG, status STRING, amount DOUBLE)
USING DELTA
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')
""")

# Read changes between versions
changes = (spark.read.format("delta")
    .option("readChangeFeed", "true")
    .option("startingVersion", 5)
    .option("endingVersion", 10)         # optional
    .table("orders"))

# CDF adds 3 columns:
# _change_type: insert | update_preimage | update_postimage | delete
# _commit_version: Long
# _commit_timestamp: Timestamp

changes.filter(F.col("_change_type") == "update_postimage").show()

# Stream CDF changes
stream = (spark.readStream.format("delta")
    .option("readChangeFeed", "true")
    .option("startingVersion", "latest")
    .table("orders"))
```

**When to enable CDF**: propagating changes to Silver/Gold without full re-scan, maintaining downstream caches, audit trails.

---

## Deletion Vectors

Deletion Vectors (DV) mark deleted rows in a sidecar file instead of rewriting the Parquet file. This makes DELETE/UPDATE far faster by avoiding full file rewrites.

```python
# Enable Deletion Vectors (Databricks Runtime 12.1+)
spark.sql("""
ALTER TABLE orders SET TBLPROPERTIES (
    'delta.enableDeletionVectors' = 'true'
)
""")

# Now DELETE is much faster — marks rows in .dv files, no Parquet rewrite
spark.sql("DELETE FROM orders WHERE status = 'cancelled' AND created_at < '2023-01-01'")

# OPTIMIZE later to physically remove deleted rows
spark.sql("OPTIMIZE orders")
```

```
Without DV:  DELETE → rewrite entire Parquet file (slow for large files)
With DV:     DELETE → write tiny .dv sidecar file (fast) → OPTIMIZE later cleans up
```

---

## Liquid Clustering (replaces Z-ORDER)

Liquid Clustering incrementally clusters data without a full table rewrite. Unlike Z-ORDER, it is incremental (only newly written files are considered) and can be changed without rewriting.

```python
# Define at creation
spark.sql("""
CREATE TABLE orders (id LONG, region STRING, created_date DATE, amount DOUBLE)
USING DELTA
CLUSTER BY (region, created_date)
""")

# Or add to existing table
spark.sql("ALTER TABLE orders CLUSTER BY (region, created_date)")

# Run clustering (incremental — only un-clustered files)
spark.sql("OPTIMIZE orders")

# Verify
spark.sql("DESCRIBE DETAIL orders").select("clusteringColumns").show()
```

**Liquid Clustering vs Z-ORDER**:

| | Z-ORDER | Liquid Clustering |
|--|---------|-------------------|
| Incremental | No — rewrites all | Yes — only new files |
| Change columns | Requires full rewrite | `ALTER TABLE` |
| Max columns | Practical limit ~4 | Practical limit ~4 |
| Availability | All DBR | DBR 13.3+ |

---

## Advanced MERGE Patterns

```python
# Standard upsert
(delta_table.alias("t")
    .merge(updates.alias("s"), "t.id = s.id")
    .whenMatchedUpdateAll()
    .whenNotMatchedInsertAll()
    .execute())

# DELETE rows in target that no longer exist in source
(delta_table.alias("t")
    .merge(source.alias("s"), "t.id = s.id")
    .whenMatchedUpdate(set={"status": "s.status", "amount": "s.amount"})
    .whenNotMatchedInsert(values={"id": "s.id", "status": "s.status", "amount": "s.amount"})
    .whenNotMatchedBySourceDelete()   # DELETE rows in T with no match in S
    .execute())

# Conditional update (only update if source is newer)
(delta_table.alias("t")
    .merge(source.alias("s"), "t.id = s.id")
    .whenMatchedUpdate(
        condition="s.updated_at > t.updated_at",
        set={"status": "s.status", "updated_at": "s.updated_at"})
    .whenNotMatchedInsertAll()
    .execute())
```

---

## RESTORE Command

Revert a table to a previous version:

```python
# Restore to a version number
spark.sql("RESTORE TABLE orders TO VERSION AS OF 5")

# Restore to a timestamp
spark.sql("RESTORE TABLE orders TO TIMESTAMP AS OF '2024-01-15 00:00:00'")

# After restore, a new version is added (restore is itself a transaction)
spark.sql("DESCRIBE HISTORY orders").show()
```

**Important**: `RESTORE` does not undo VACUUM. If the data files from that version were vacuumed, restore will fail.

---

## Delta Constraints

```python
# CHECK constraint (enforced on all writes)
spark.sql("ALTER TABLE orders ADD CONSTRAINT valid_amount CHECK (amount > 0)")
spark.sql("ALTER TABLE orders ADD CONSTRAINT valid_status CHECK (status IN ('pending','completed','refunded'))")

# NOT NULL (via schema)
spark.sql("""
CREATE TABLE orders (
    id LONG NOT NULL,
    amount DOUBLE NOT NULL,
    status STRING
) USING DELTA
""")

# View constraints
spark.sql("DESCRIBE DETAIL orders").select("properties").show(truncate=False)

# Drop constraint
spark.sql("ALTER TABLE orders DROP CONSTRAINT valid_amount")
```

---

## Delta Sharing

Share Delta tables with external parties (different clouds, organizations) without copying data:

```python
# Provider side (Databricks)
# 1. Create share
spark.sql("CREATE SHARE my_share")
spark.sql("ALTER SHARE my_share ADD TABLE catalog.schema.orders")

# 2. Create recipient
spark.sql("CREATE RECIPIENT partner_a")

# 3. Grant access
spark.sql("GRANT SELECT ON SHARE my_share TO RECIPIENT partner_a")

# Recipient side (can be any Delta Sharing client)
import delta_sharing
client = delta_sharing.SharingClient("profile.json")
df = delta_sharing.load_as_spark("profile.json#my_share.schema.orders")
```

---

## Write Strategy Comparison

```python
# 1. overwrite — replaces all data (full snapshot)
df.write.format("delta").mode("overwrite").save("/path")

# 2. append — adds rows (no dedup)
df.write.format("delta").mode("append").save("/path")

# 3. replaceWhere — overwrite matching partition only (idempotent)
df.write.format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", "region = 'EU' AND date = '2024-01-15'") \
    .save("/path")

# 4. MERGE — full upsert logic
DeltaTable.forPath(spark, "/path").alias("t") \
    .merge(df.alias("s"), "t.id = s.id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .execute()
```

| Strategy | Idempotent | Use case |
|----------|-----------|---------|
| `overwrite` | Yes | Full snapshot load |
| `append` | No | Append-only streams |
| `replaceWhere` | Yes | Partitioned incremental load |
| MERGE | Yes | SCD / upsert / CDC |

---

## Common Interview Questions

**Q: What is Change Data Feed and when would you enable it?**  
A: CDF records row-level changes (INSERT/UPDATE/DELETE) in the Delta log. Enable it when you need downstream consumers to process only changed rows rather than scanning the full table — e.g., propagating Bronze changes to Silver incrementally, building real-time caches, or auditing data changes.

**Q: What are Deletion Vectors and how do they improve performance?**  
A: Instead of rewriting Parquet files on DELETE/UPDATE, DVs write a tiny sidecar `.dv` file that marks rows as deleted. Reads skip those rows via the DV bitmap. This makes deletes ~10× faster. Run `OPTIMIZE` periodically to physically compact files and remove deleted rows.

**Q: What is Liquid Clustering and how is it better than Z-ORDER?**  
A: Liquid Clustering incrementally clusters only new/uncompacted files, while Z-ORDER rewrites the entire table every time. Liquid Clustering columns can be changed with `ALTER TABLE` without rewriting data. It's the recommended approach in DBR 13.3+.

**Q: How does `replaceWhere` achieve idempotency?**  
A: `replaceWhere` atomically deletes all rows matching the predicate and inserts the new data. Re-running with the same source data produces the same result — idempotent. Unlike `append` (which would duplicate rows) or full `overwrite` (which replaces all data regardless of partition).

**Q: What happens if you RESTORE a table and some data files were VACUUMed?**  
A: RESTORE fails for versions older than the VACUUM retention window because the underlying Parquet files no longer exist. Set `delta.deletedFileRetentionDuration` to a value longer than your longest expected recovery window (default 7 days).

**Q: What is `whenNotMatchedBySourceDelete` in MERGE?**  
A: It deletes rows in the target table that have no matching key in the source. Useful for full-snapshot syncs where the source represents the complete current state and you want the target to mirror it exactly (including deletions).

---

## Quick Reference

```python
# CDF
ALTER TABLE t SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')
spark.read.format("delta").option("readChangeFeed","true").option("startingVersion",5).table("t")

# Deletion Vectors
ALTER TABLE t SET TBLPROPERTIES ('delta.enableDeletionVectors' = 'true')

# Liquid Clustering
CREATE TABLE t (...) USING DELTA CLUSTER BY (col1, col2)
ALTER TABLE t CLUSTER BY (col1, col2)
OPTIMIZE t   -- runs incremental clustering

# RESTORE
RESTORE TABLE t TO VERSION AS OF 5
RESTORE TABLE t TO TIMESTAMP AS OF '2024-01-15'

# Constraints
ALTER TABLE t ADD CONSTRAINT c CHECK (amount > 0)
ALTER TABLE t DROP CONSTRAINT c

# MERGE with delete
DeltaTable.forPath(spark,"/path").alias("t") \
    .merge(source.alias("s"), "t.id = s.id") \
    .whenMatchedUpdateAll() \
    .whenNotMatchedInsertAll() \
    .whenNotMatchedBySourceDelete() \
    .execute()
```
