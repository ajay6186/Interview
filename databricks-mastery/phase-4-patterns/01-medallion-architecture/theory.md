# Theory: Medallion Architecture

## What is the Medallion Architecture?

The Medallion Architecture organizes data into three progressive quality layers — Bronze, Silver, Gold — each adding more structure, quality, and business value.

```
Raw Source Systems
        │
        ▼
  ┌─────────────┐   Raw, as-is data       No schema enforcement
  │   BRONZE    │   Append-only           Retains all source history
  │  (raw)      │   Delta table           Minimal transformations
  └─────────────┘
        │
        ▼
  ┌─────────────┐   Cleaned, validated    Schema enforced
  │   SILVER    │   Deduplicated          Nulls handled
  │ (cleansed)  │   Conformed             Business keys resolved
  └─────────────┘
        │
        ▼
  ┌─────────────┐   Aggregated            Optimized for analytics
  │    GOLD     │   Business-ready        Denormalized (star schema)
  │ (curated)   │   Serving layer         Low-latency queries
  └─────────────┘
        │
        ▼
  BI Tools / ML / APIs
```

---

## Bronze Layer — Raw Ingestion

```python
# Bronze: land data exactly as received (schema-on-read)
def load_bronze(spark, source_path, target_table):
    df = (spark.readStream
        .format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.schemaLocation", f"/schema/{target_table}")
        .load(source_path))

    # Add ingestion metadata
    df = df.withColumn("_ingestion_ts", F.current_timestamp()) \
           .withColumn("_source_file", F.input_file_name()) \
           .withColumn("_batch_id", F.lit(int(time.time())))

    # Append-only, no dedup
    (df.writeStream
        .format("delta")
        .outputMode("append")
        .option("checkpointLocation", f"/ckpt/bronze/{target_table}")
        .option("mergeSchema", "true")   # allow schema evolution
        .trigger(processingTime="10 minutes")
        .toTable(f"bronze.{target_table}"))
```

**Bronze principles**:
- Never transform or filter source data — keep everything.
- Use append-only writes (idempotent: checkpoint prevents re-ingestion).
- Add metadata columns (`_ingestion_ts`, `_source_file`).
- Keep raw for auditing, reprocessing, and schema changes.

---

## Silver Layer — Cleansed & Conformed

```python
def load_silver_orders(spark):
    # Read from Bronze (CDC stream or batch)
    bronze_df = (spark.readStream
        .format("delta")
        .option("readChangeFeed", "true")
        .option("startingVersion", "latest")
        .table("bronze.orders"))

    def process_batch(batch_df, batch_id):
        from delta.tables import DeltaTable

        # Transformations: clean, validate, deduplicate
        cleaned = (batch_df
            .filter(F.col("_change_type").isin(["insert", "update_postimage"]))
            .filter(F.col("order_id").isNotNull())       # remove nulls
            .filter(F.col("amount") > 0)                 # business rule
            .withColumn("amount", F.round("amount", 2))
            .withColumn("status", F.lower(F.trim("status")))
            .dropDuplicates(["order_id"])                # dedup
            .select("order_id", "customer_id", "amount", "status",
                    "created_at", "_ingestion_ts"))

        # MERGE (upsert) into Silver
        silver = DeltaTable.forName(spark, "silver.orders")
        (silver.alias("t")
            .merge(cleaned.alias("s"), "t.order_id = s.order_id")
            .whenMatchedUpdateAll()
            .whenNotMatchedInsertAll()
            .execute())

    (bronze_df.writeStream
        .foreachBatch(process_batch)
        .option("checkpointLocation", "/ckpt/silver/orders")
        .trigger(processingTime="15 minutes")
        .start())
```

**Silver principles**:
- Apply business rules and validation; route invalid rows to dead-letter.
- Deduplicate on business keys.
- MERGE ensures idempotency — safe to replay.
- Keep granular (row-level, not aggregated).

---

## Gold Layer — Business Aggregations

```python
def build_gold_daily_revenue(spark):
    # Batch job reading from Silver (incremental by partition)
    silver_df = (spark.read
        .format("delta")
        .table("silver.orders")
        .filter(F.col("status") == "completed")
        .filter(F.col("created_date") >= F.date_sub(F.current_date(), 1)))

    gold_df = (silver_df
        .groupBy("created_date", "region", "product_category")
        .agg(
            F.sum("amount").alias("revenue"),
            F.count("*").alias("order_count"),
            F.countDistinct("customer_id").alias("unique_customers"),
            F.avg("amount").alias("avg_order_value")
        ))

    # replaceWhere for idempotent partition overwrite
    (gold_df.write
        .format("delta")
        .mode("overwrite")
        .option("replaceWhere", "created_date >= date_sub(current_date(), 1)")
        .partitionBy("created_date")
        .saveAsTable("gold.daily_revenue"))
```

**Gold principles**:
- Optimized for specific use cases (BI dashboards, ML features, APIs).
- Denormalized — pre-join tables for query speed.
- Aggregated — reduced row count for fast scans.
- Partitioned on query patterns (date, region).

---

## Dead-Letter Queue

Route invalid rows to a separate table for inspection/reprocessing:

```python
def process_with_dlq(batch_df, batch_id):
    # Separate valid from invalid
    valid_df   = batch_df.filter(
        F.col("order_id").isNotNull() & (F.col("amount") > 0))
    invalid_df = batch_df.filter(
        F.col("order_id").isNull() | (F.col("amount") <= 0)) \
        .withColumn("_error_reason",
            F.when(F.col("order_id").isNull(), "null_order_id")
             .when(F.col("amount") <= 0, "invalid_amount")
             .otherwise("unknown")) \
        .withColumn("_rejected_at", F.current_timestamp())

    # Write valid to Silver
    valid_df.write.format("delta").mode("append").saveAsTable("silver.orders")
    # Write invalid to dead-letter
    invalid_df.write.format("delta").mode("append").saveAsTable("bronze.orders_dlq")
```

---

## Idempotency Patterns

```python
# Bronze: idempotent via checkpoint (Auto Loader never re-ingests)
# Silver: idempotent via MERGE on business key
# Gold: idempotent via replaceWhere on partition predicate

# replaceWhere example (Gold)
df.write.format("delta") \
    .mode("overwrite") \
    .option("replaceWhere", "created_date = '2024-01-15' AND region = 'EU'") \
    .saveAsTable("gold.daily_revenue")
# Re-running with same input produces identical output
```

---

## Common Interview Questions

**Q: What is the Medallion Architecture?**  
A: A multi-layer data organization pattern with three zones: Bronze (raw, as-ingested), Silver (cleaned, validated, deduplicated), Gold (aggregated, business-ready). Each layer adds more structure and reliability. Delta Lake's ACID guarantees make it reliable at every layer.

**Q: Why is Bronze append-only?**  
A: Bronze preserves the full history of raw source data. If a bug in Silver logic corrupts data, you can reprocess from Bronze. Append-only also makes ingestion fast (no MERGE overhead). The checkpoint prevents re-ingestion of already-processed files.

**Q: How do you achieve idempotency at each layer?**  
A: Bronze: Auto Loader checkpoint prevents re-ingesting files. Silver: MERGE on the business key means re-running produces the same result. Gold: `replaceWhere` on the partition predicate atomically replaces only the targeted partition — safe to re-run.

**Q: What goes in the dead-letter queue and why?**  
A: The DLQ captures rows that fail validation (null keys, invalid values, schema mismatches). This keeps the Silver layer clean while preserving rejected data for investigation and reprocessing. Each rejected row gets an `_error_reason` column for debugging.

**Q: How do you decide what belongs in Silver vs Gold?**  
A: Silver is row-level, cleaned, and business-key resolved — it represents the single source of truth. Gold is aggregated and denormalized for specific use cases (one Gold table per dashboard/report/model). If something is still "facts about individual events," it's Silver. If it's "metrics and summaries," it's Gold.

---

## Quick Reference

```
Bronze: raw append → Auto Loader → Delta (mergeSchema=true)
Silver: cleaned upsert → foreachBatch → MERGE on business key
Gold:   aggregated overwrite → replaceWhere on date partition

Dead-letter: filter invalid → withColumn("_error_reason") → append to _dlq table

Idempotency:
  Bronze  → checkpoint (never re-ingests)
  Silver  → MERGE (same key = update, not duplicate)
  Gold    → replaceWhere (atomic partition overwrite)

Metadata columns to add at Bronze:
  _ingestion_ts, _source_file, _batch_id, _schema_version

Key table properties:
  delta.enableChangeDataFeed = true   (Bronze → Silver CDC)
  delta.enableDeletionVectors = true  (fast Silver deletes)
  delta.autoOptimize.optimizeWrite = true  (avoid small files)
```
