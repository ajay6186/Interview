# ============================================================================
# Solution 4.6 — Event-Driven Architecture
# ============================================================================

import os, json
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import (StructType, StructField, StringType,
                                DoubleType, TimestampType, IntegerType)

spark = (SparkSession.builder
    .appName("eda-solution")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/eda_solution"
os.makedirs(f"{BASE}/delta", exist_ok=True)

orders = spark.createDataFrame([
    ("o001", "u1", "electronics", 299.99, "2024-01-15 10:00:00"),
    ("o002", "u2", "clothing",     49.99, "2024-01-15 10:01:30"),
    ("o003", "u1", "electronics", 999.00, "2024-01-15 10:05:00"),
    ("o004", "u3", "books",        15.00, "2024-01-15 10:07:00"),
    ("o005", "u2", "electronics", 499.00, "2024-01-15 10:10:00"),
    ("o006", "u4", "clothing",     89.99, "2024-01-15 10:12:00"),
    ("o007", "u3", "books",        22.50, "2024-01-15 10:14:00"),
    ("o008", "u5", "electronics", 149.99, "2024-01-15 10:15:00"),
], ["order_id", "user_id", "category", "amount", "event_time"])

orders = orders.withColumn("event_time", F.to_timestamp("event_time"))

# ── SOLUTION 1: CDF Change Types ──────────────────────────────────────────────
cdf_batch = spark.createDataFrame([
    ("o001", "insert"),
    ("o002", "insert"),
    ("o003", "update_preimage"),
    ("o003", "update_postimage"),
    ("o004", "delete"),
    ("o005", "insert"),
], ["order_id", "_change_type"])

insert_count = cdf_batch.filter(F.col("_change_type") == "insert").count()
delete_count = cdf_batch.filter(F.col("_change_type") == "delete").count()

assert insert_count == 3
assert delete_count == 1
print(f"[1] inserts={insert_count} deletes={delete_count}")


# ── SOLUTION 2: Watermark Window Aggregation ──────────────────────────────────
windowed = (orders
    .groupBy(F.window("event_time", "15 minutes"), "category")
    .agg(F.sum("amount").alias("revenue"),
         F.count("*").alias("event_count"))
    .orderBy("window"))

assert windowed is not None
rows = windowed.collect()
assert len(rows) == 3
electronics_row = next(r for r in rows if r.category == "electronics")
assert abs(electronics_row.revenue - (299.99 + 999.00 + 499.00 + 149.99)) < 0.01
print(f"[2] windowed rows={len(rows)}, electronics_revenue={electronics_row.revenue:.2f}")


# ── SOLUTION 3: Event Routing ─────────────────────────────────────────────────
raw_events = spark.createDataFrame([
    ("orders",   "o100", "2024-01-15 10:00:00"),
    ("orders",   "o101", "2024-01-15 10:01:00"),
    ("clicks",   "c001", "2024-01-15 10:00:10"),
    ("sessions", "s001", "2024-01-15 10:00:05"),
    ("sessions", "s002", "2024-01-15 10:00:30"),
    ("orders",   "o102", "2024-01-15 10:02:00"),
], ["topic", "event_id", "event_time"])

orders_df   = raw_events.filter(F.col("topic") == "orders")
clicks_df   = raw_events.filter(F.col("topic") == "clicks")
sessions_df = raw_events.filter(F.col("topic") == "sessions")

assert orders_df.count()   == 3
assert clicks_df.count()   == 1
assert sessions_df.count() == 2
print(f"[3] orders={orders_df.count()} clicks={clicks_df.count()} sessions={sessions_df.count()}")


# ── SOLUTION 4: Dead Letter Queue ─────────────────────────────────────────────
mixed = spark.createDataFrame([
    ("o201", "u1", 99.99),
    ("o202", "u2", -5.00),
    (None,   "u3", 10.00),
    ("o204", "u4", 250.00),
    ("o205", None, 75.00),
], ["order_id", "user_id", "amount"])

good_condition = (F.col("amount") > 0) & F.col("order_id").isNotNull()
good_records   = mixed.filter(good_condition)
dlq_records    = mixed.filter(~good_condition)

assert good_records.count() == 3
assert dlq_records.count()  == 2
print(f"[4] good={good_records.count()} dlq={dlq_records.count()}")


# ── SOLUTION 5: Event Deduplication ───────────────────────────────────────────
dupes = spark.createDataFrame([
    ("evt-1", "u1", "page_view", "2024-01-15 10:00:00"),
    ("evt-2", "u2", "purchase",  "2024-01-15 10:01:00"),
    ("evt-1", "u1", "page_view", "2024-01-15 10:00:00"),
    ("evt-3", "u3", "add_cart",  "2024-01-15 10:02:00"),
    ("evt-2", "u2", "purchase",  "2024-01-15 10:01:05"),
], ["event_id", "user_id", "event_type", "event_time"])

dupes = dupes.withColumn("event_time", F.to_timestamp("event_time"))

w = Window.partitionBy("event_id").orderBy(F.col("event_time").desc())
deduped = (dupes
    .withColumn("rn", F.row_number().over(w))
    .filter(F.col("rn") == 1)
    .drop("rn"))

assert deduped.count() == 3
evt2 = deduped.filter(F.col("event_id") == "evt-2").collect()[0]
assert str(evt2.event_time) == "2024-01-15 10:01:05"
print(f"[5] deduped={deduped.count()}")


# ── SOLUTION 6: Saga Compensating Transactions ────────────────────────────────
class SagaRunner:
    def __init__(self):
        self.steps = []
        self.log   = []

    def add_step(self, name: str, action, compensate):
        self.steps.append((name, action, compensate))

    def run(self) -> bool:
        completed = []
        for name, action, compensate in self.steps:
            try:
                action()
                completed.append((name, compensate))
                self.log.append(f"DONE: {name}")
            except Exception as e:
                self.log.append(f"FAILED: {name} ({e})")
                for comp_name, comp_fn in reversed(completed):
                    comp_fn()
                    self.log.append(f"COMPENSATED: {comp_name}")
                return False
        return True


saga = SagaRunner()
executed = []

saga.add_step("reserve_inventory",
    action=lambda: executed.append("reserve"),
    compensate=lambda: executed.append("release"))

saga.add_step("charge_payment",
    action=lambda: executed.append("charge"),
    compensate=lambda: executed.append("refund"))

saga.add_step("dispatch_order",
    action=lambda: (_ for _ in ()).throw(RuntimeError("courier unavailable")),
    compensate=lambda: executed.append("cancel_dispatch"))

result = saga.run()

assert result is False
assert "reserve" in executed
assert "charge"  in executed
assert "refund"  in executed
assert "release" in executed
assert executed.count("cancel_dispatch") == 0
print(f"[6] saga log: {saga.log}")
print(f"[6] execution order: {executed}")


# ── SOLUTION 7: High-Value Event Detection ────────────────────────────────────
high_value_users = (orders
    .groupBy("user_id")
    .agg(F.count("*").alias("order_count"),
         F.sum("amount").alias("total_spent"))
    .filter((F.col("order_count") > 1) & (F.col("total_spent") > 500)))

rows     = high_value_users.collect()
user_ids = {r.user_id for r in rows}
assert "u1" in user_ids
assert "u2" in user_ids
assert "u3" not in user_ids
print(f"[7] high_value_users={sorted(user_ids)}")


# ── SOLUTION 8: Kafka Message Schema ─────────────────────────────────────────
kafka_schema = StructType([
    StructField("order_id", StringType()),
    StructField("amount",   DoubleType()),
    StructField("category", StringType()),
])

kafka_raw = spark.createDataFrame([
    ('{"order_id":"o300","amount":199.99,"category":"electronics"}',),
    ('{"order_id":"o301","amount":29.99,"category":"books"}',),
    ('{"order_id":"o302","amount":89.00,"category":"clothing"}',),
], ["value"])

parsed = (kafka_raw
    .select(F.from_json(F.col("value"), kafka_schema).alias("data"))
    .select("data.*"))

assert parsed.count() == 3
cols = set(parsed.columns)
assert {"order_id", "amount", "category"} <= cols
first = parsed.orderBy("order_id").first()
assert first.order_id == "o300"
print(f"[8] parsed Kafka messages: {parsed.count()} rows, columns: {sorted(cols)}")


print("\nAll solutions verified!")
spark.stop()
