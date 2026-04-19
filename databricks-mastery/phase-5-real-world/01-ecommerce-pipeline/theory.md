# Theory: E-Commerce Pipeline

## Architecture Overview

A production e-commerce data pipeline processes orders, inventory, customers, and clickstream data through the Medallion Architecture to power analytics, ML, and reporting.

```
Data Sources
  ├── Order Service (Kafka / REST API)
  ├── Inventory DB (MySQL CDC via Debezium → Kafka)
  ├── Customer DB (PostgreSQL → batch extract)
  └── Clickstream (S3 JSON files via Auto Loader)
          │
          ▼
      BRONZE (raw)
  ├── bronze.orders      (streaming from Kafka)
  ├── bronze.inventory   (streaming CDC)
  ├── bronze.customers   (batch, daily)
  └── bronze.clicks      (streaming, Auto Loader)
          │
          ▼
      SILVER (clean)
  ├── silver.orders      (validated, deduplicated)
  ├── silver.inventory   (current state after CDC)
  ├── silver.customers   (merged, masked PII)
  └── silver.clicks      (sessionized)
          │
          ▼
      GOLD (business)
  ├── gold.daily_revenue       (by date/region/category)
  ├── gold.customer_360        (unified customer view)
  ├── gold.product_performance (sales + inventory + returns)
  └── gold.funnel_analytics    (click → cart → purchase)
```

---

## Bronze: Order Ingestion from Kafka

```python
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

ORDER_SCHEMA = StructType([
    StructField("order_id",     StringType(),  False),
    StructField("customer_id",  StringType(),  False),
    StructField("product_id",   StringType(),  True),
    StructField("amount",       DoubleType(),  True),
    StructField("status",       StringType(),  True),
    StructField("created_at",   StringType(),  True),  # parse to timestamp later
])

def ingest_orders_bronze(spark):
    kafka_df = (spark.readStream
        .format("kafka")
        .option("kafka.bootstrap.servers", "broker:9092")
        .option("subscribe", "orders-topic")
        .option("startingOffsets", "latest")
        .option("maxOffsetsPerTrigger", 50000)
        .load())

    orders_df = (kafka_df
        .select(F.from_json(F.col("value").cast("string"), ORDER_SCHEMA).alias("d"),
                F.col("timestamp").alias("kafka_ts"))
        .select("d.*", "kafka_ts")
        .withColumn("_ingestion_ts", F.current_timestamp())
        .withColumn("_source", F.lit("kafka:orders-topic")))

    return (orders_df.writeStream
        .format("delta")
        .outputMode("append")
        .option("checkpointLocation", "/ckpt/bronze/orders")
        .option("mergeSchema", "true")
        .trigger(processingTime="1 minute")
        .toTable("bronze.orders"))
```

---

## Silver: Order Cleaning and Deduplication

```python
def transform_silver_orders(spark):
    from delta.tables import DeltaTable

    bronze_stream = (spark.readStream
        .format("delta")
        .option("readChangeFeed", "true")
        .option("startingVersion", "latest")
        .table("bronze.orders"))

    VALID_STATUSES = {"pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"}

    def process_batch(batch_df, batch_id):
        # Filter CDF change types
        batch_df = batch_df.filter(
            F.col("_change_type").isin("insert", "update_postimage"))

        # Parse and clean
        cleaned = (batch_df
            .filter(F.col("order_id").isNotNull())
            .filter(F.col("customer_id").isNotNull())
            .withColumn("amount", F.round(F.col("amount").cast("double"), 2))
            .withColumn("status", F.lower(F.trim("status")))
            .withColumn("created_at",
                F.to_timestamp("created_at", "yyyy-MM-dd'T'HH:mm:ss"))
            .dropDuplicates(["order_id"]))

        # Split valid/invalid
        valid   = cleaned.filter(F.col("status").isin(*VALID_STATUSES) & (F.col("amount") > 0))
        invalid = cleaned.subtract(valid) \
            .withColumn("_error_reason", F.lit("invalid_status_or_amount")) \
            .withColumn("_rejected_at", F.current_timestamp())

        # MERGE into silver
        if DeltaTable.isDeltaTable(spark, "spark_catalog.silver.orders"):
            silver = DeltaTable.forName(spark, "silver.orders")
            (silver.alias("t")
                .merge(valid.alias("s"), "t.order_id = s.order_id")
                .whenMatchedUpdate(condition="s.created_at > t.created_at",
                                   set={"status": "s.status", "amount": "s.amount",
                                        "created_at": "s.created_at"})
                .whenNotMatchedInsertAll()
                .execute())
        else:
            valid.write.format("delta").saveAsTable("silver.orders")

        invalid.write.format("delta").mode("append").saveAsTable("bronze.orders_dlq")

    return (bronze_stream.writeStream
        .foreachBatch(process_batch)
        .option("checkpointLocation", "/ckpt/silver/orders")
        .trigger(processingTime="5 minutes")
        .start())
```

---

## Gold: Daily Revenue Aggregation

```python
def build_gold_revenue(spark, date_str: str):
    """Idempotent daily revenue build — replaceWhere on date."""
    silver_df = (spark.table("silver.orders")
        .join(spark.table("silver.products"), "product_id", "left")
        .filter(F.to_date("created_at") == date_str)
        .filter(F.col("status") == "delivered"))

    gold_df = (silver_df
        .groupBy(
            F.to_date("created_at").alias("revenue_date"),
            "region",
            "product_category")
        .agg(
            F.sum("amount").alias("revenue"),
            F.count("*").alias("order_count"),
            F.countDistinct("customer_id").alias("unique_customers"),
            F.avg("amount").alias("avg_order_value"),
            F.percentile_approx("amount", 0.5).alias("median_order_value")
        ))

    (gold_df.write
        .format("delta")
        .mode("overwrite")
        .option("replaceWhere", f"revenue_date = '{date_str}'")
        .partitionBy("revenue_date")
        .saveAsTable("gold.daily_revenue"))

    print(f"Gold daily revenue built for {date_str}: {gold_df.count()} rows")
```

---

## Customer 360

```python
def build_customer_360(spark):
    """Join customers with their order history into a unified view."""
    customers = spark.table("silver.customers")

    order_summary = (spark.table("silver.orders")
        .filter(F.col("status") == "delivered")
        .groupBy("customer_id")
        .agg(
            F.count("*").alias("total_orders"),
            F.sum("amount").alias("lifetime_value"),
            F.avg("amount").alias("avg_order_value"),
            F.min("created_at").alias("first_order_date"),
            F.max("created_at").alias("last_order_date"),
            F.datediff(F.current_date(),
                       F.max(F.to_date("created_at"))).alias("days_since_last_order")
        ))

    customer_360 = (customers
        .join(order_summary, "customer_id", "left")
        .withColumn("customer_segment",
            F.when(F.col("lifetime_value") >= 10000, "VIP")
             .when(F.col("lifetime_value") >= 1000,  "Regular")
             .when(F.col("lifetime_value") > 0,      "Occasional")
             .otherwise("New")))

    (customer_360.write
        .format("delta")
        .mode("overwrite")
        .option("overwriteSchema", "true")
        .saveAsTable("gold.customer_360"))
```

---

## SCD Type 2 (Slowly Changing Dimensions)

```python
def apply_scd2(spark, source_df, target_path, key_col, track_cols):
    """
    Implement SCD Type 2: keep full history with start/end effective dates.
    - Active records: is_current=True, end_date=9999-12-31
    - Expired records: is_current=False, end_date=last valid date
    """
    from delta.tables import DeltaTable

    new_records = (source_df
        .withColumn("start_date", F.current_date())
        .withColumn("end_date", F.lit("9999-12-31").cast("date"))
        .withColumn("is_current", F.lit(True)))

    if not DeltaTable.isDeltaTable(spark, target_path):
        new_records.write.format("delta").save(target_path)
        return

    delta_target = DeltaTable.forPath(spark, target_path)
    # Close existing active records that changed
    (delta_target.alias("t")
        .merge(new_records.alias("s"),
               f"t.{key_col} = s.{key_col} AND t.is_current = true")
        .whenMatchedUpdate(
            condition=" OR ".join(f"t.{c} <> s.{c}" for c in track_cols),
            set={"is_current": "false",
                 "end_date": "current_date()"})
        .execute())

    # Insert changed/new records
    delta_target.alias("t") \
        .merge(new_records.alias("s"),
               f"t.{key_col} = s.{key_col} AND t.is_current = true") \
        .whenNotMatchedInsertAll() \
        .execute()
```

---

## Common Interview Questions

**Q: How do you handle late-arriving orders in the pipeline?**  
A: Use watermarks in the streaming Bronze layer to tolerate late events. At Silver, the MERGE pattern handles late updates correctly — a late update with a newer `created_at` timestamp updates the existing record. For Gold daily aggregations, schedule a daily re-run to pick up any late-arriving Silver data from the previous day.

**Q: How do you ensure no duplicate orders are counted in revenue?**  
A: At Silver, `dropDuplicates(["order_id"])` within each batch + MERGE on `order_id` across batches. Gold reads Silver where order_id is unique by design. The MERGE condition `s.created_at > t.created_at` ensures updates only flow forward in time.

**Q: What is SCD Type 2 and when do you use it?**  
A: SCD2 (Slowly Changing Dimension Type 2) preserves full history of dimension changes. Each row gets `start_date`, `end_date`, and `is_current`. When a customer's region changes, the old row is closed (`is_current=false`, `end_date=today`) and a new row is inserted. Used for dimensions where historical accuracy matters (e.g., "what region was this customer in when they placed this order?").

**Q: How do you build a Customer 360 view efficiently?**  
A: Pre-aggregate order metrics per customer_id in Silver (count, sum, avg, first/last date), then join to the customer dimension. Avoid joining at query time — materialize as a Gold table updated daily. Partition by `customer_segment` or `region` for fast BI queries.

---

## Quick Reference

```python
# Bronze: stream from Kafka, parse JSON, append
kafka_df.select(F.from_json(F.col("value").cast("string"), schema).alias("d"))

# Silver: MERGE on business key (order_id)
delta_table.alias("t").merge(source.alias("s"), "t.order_id = s.order_id")
    .whenMatchedUpdate(condition="s.created_at > t.created_at", set={...})
    .whenNotMatchedInsertAll().execute()

# Gold: replaceWhere for idempotent daily build
df.write.format("delta").mode("overwrite")
    .option("replaceWhere", f"revenue_date = '{date}'")
    .saveAsTable("gold.daily_revenue")

# Customer 360: left join + window aggregations
customers.join(
    orders.groupBy("customer_id").agg(F.sum("amount"), F.count("*")),
    "customer_id", "left")

# SCD2: close old, insert new
delta.alias("t").merge(source.alias("s"), "t.key = s.key AND t.is_current = true")
    .whenMatchedUpdate(condition="t.val != s.val",
                       set={"is_current":"false","end_date":"current_date()"})
```
