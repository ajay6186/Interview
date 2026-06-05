# ============================================================================
# Exercise 4.6 — Event-Driven Architecture
# ============================================================================
# Practice: Delta CDF, watermarked aggregations, event routing, Saga pattern,
#           streaming pipeline design, and event-sourcing with Delta.
#
# Instructions: Replace every None / pass so all assertions pass.
# ============================================================================

import os, json
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (StructType, StructField, StringType,
                                DoubleType, TimestampType, IntegerType)

spark = (SparkSession.builder
    .appName("eda-exercise")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/eda_exercise"
os.makedirs(f"{BASE}/delta", exist_ok=True)

# ── SEED DATA ─────────────────────────────────────────────────────────────────
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

# ── EXERCISE 1: CDF Change Types ──────────────────────────────────────────────
# CDF emits rows with a _change_type column. Given a simulated CDF batch,
# count how many rows are inserts vs deletes.

cdf_batch = spark.createDataFrame([
    ("o001", "insert"),
    ("o002", "insert"),
    ("o003", "update_preimage"),
    ("o003", "update_postimage"),
    ("o004", "delete"),
    ("o005", "insert"),
], ["order_id", "_change_type"])

# TODO: count rows where _change_type == 'insert' → insert_count
# TODO: count rows where _change_type == 'delete' → delete_count

insert_count = None  # replace
delete_count = None  # replace

assert insert_count == 3, f"Expected 3 inserts, got {insert_count}"
assert delete_count == 1, f"Expected 1 delete, got {delete_count}"
print(f"[1] inserts={insert_count} deletes={delete_count}")


# ── EXERCISE 2: Watermark Window Aggregation ──────────────────────────────────
# Simulate micro-batch data. Compute total revenue per category using a
# 15-minute tumbling window. Use event_time as the timestamp column.
# (Batch simulation — no active stream needed.)

# TODO: group orders by 15-minute window on event_time AND category
#       aggregate: sum(amount) aliased as 'revenue', count(*) aliased as 'event_count'
#       sort by window start ascending

windowed = None  # replace

assert windowed is not None, "windowed should not be None"
rows = windowed.collect()
# All 8 events fall in the same 15-min window so there should be 3 categories
assert len(rows) == 3, f"Expected 3 window+category rows, got {len(rows)}"
electronics_row = next(r for r in rows if r.category == "electronics")
assert abs(electronics_row.revenue - (299.99 + 999.00 + 499.00 + 149.99)) < 0.01
print(f"[2] windowed rows={len(rows)}, electronics_revenue={electronics_row.revenue:.2f}")


# ── EXERCISE 3: Event Routing ─────────────────────────────────────────────────
# Given a raw events DataFrame with a 'topic' column, split into per-topic
# DataFrames (simulate foreachBatch routing).

raw_events = spark.createDataFrame([
    ("orders",   "o100", "2024-01-15 10:00:00"),
    ("orders",   "o101", "2024-01-15 10:01:00"),
    ("clicks",   "c001", "2024-01-15 10:00:10"),
    ("sessions", "s001", "2024-01-15 10:00:05"),
    ("sessions", "s002", "2024-01-15 10:00:30"),
    ("orders",   "o102", "2024-01-15 10:02:00"),
], ["topic", "event_id", "event_time"])

# TODO: create three DataFrames by filtering on 'topic':
#   orders_df   — rows where topic == 'orders'
#   clicks_df   — rows where topic == 'clicks'
#   sessions_df — rows where topic == 'sessions'

orders_df   = None  # replace
clicks_df   = None  # replace
sessions_df = None  # replace

assert orders_df.count()   == 3, f"Expected 3 order events,   got {orders_df.count()}"
assert clicks_df.count()   == 1, f"Expected 1 click event,    got {clicks_df.count()}"
assert sessions_df.count() == 2, f"Expected 2 session events, got {sessions_df.count()}"
print(f"[3] orders={orders_df.count()} clicks={clicks_df.count()} sessions={sessions_df.count()}")


# ── EXERCISE 4: Dead Letter Queue ─────────────────────────────────────────────
# Separate good records (amount > 0, order_id is not null) from bad records.

mixed = spark.createDataFrame([
    ("o201", "u1", 99.99),
    ("o202", "u2", -5.00),   # bad — negative amount
    (None,   "u3", 10.00),   # bad — null order_id
    ("o204", "u4", 250.00),
    ("o205", None, 75.00),   # ok — null user_id is allowed
], ["order_id", "user_id", "amount"])

# TODO: good_records  — rows where amount > 0 AND order_id IS NOT NULL
# TODO: dlq_records   — rows that fail the above condition

good_records = None  # replace
dlq_records  = None  # replace

assert good_records.count() == 3, f"Expected 3 good records, got {good_records.count()}"
assert dlq_records.count()  == 2, f"Expected 2 DLQ records, got {dlq_records.count()}"
print(f"[4] good={good_records.count()} dlq={dlq_records.count()}")


# ── EXERCISE 5: Event Deduplication ───────────────────────────────────────────
# Kafka can produce duplicate messages. Deduplicate by event_id, keeping the
# row with the latest event_time.

dupes = spark.createDataFrame([
    ("evt-1", "u1", "page_view", "2024-01-15 10:00:00"),
    ("evt-2", "u2", "purchase",  "2024-01-15 10:01:00"),
    ("evt-1", "u1", "page_view", "2024-01-15 10:00:00"),  # exact dupe
    ("evt-3", "u3", "add_cart",  "2024-01-15 10:02:00"),
    ("evt-2", "u2", "purchase",  "2024-01-15 10:01:05"),  # later dupe of evt-2
], ["event_id", "user_id", "event_type", "event_time"])

dupes = dupes.withColumn("event_time", F.to_timestamp("event_time"))

# TODO: deduplicate keeping the row with the maximum event_time per event_id
#       hint: use dropDuplicates or a window function with row_number

deduped = None  # replace

assert deduped.count() == 3, f"Expected 3 unique events, got {deduped.count()}"
evt2 = deduped.filter(F.col("event_id") == "evt-2").collect()[0]
assert str(evt2.event_time) == "2024-01-15 10:01:05", f"Expected latest evt-2 timestamp"
print(f"[5] deduped={deduped.count()}")


# ── EXERCISE 6: Saga Compensating Transactions ────────────────────────────────
# Implement a simple Saga runner. Each step has an action and a compensate.
# On failure, completed steps should be rolled back in reverse order.

class SagaRunner:
    def __init__(self):
        self.steps = []
        self.log   = []

    def add_step(self, name: str, action, compensate):
        self.steps.append((name, action, compensate))

    def run(self) -> bool:
        """Execute steps. On failure, run compensations in reverse.
        Returns True on full success, False if saga was rolled back."""
        completed = []
        for name, action, compensate in self.steps:
            try:
                action()
                completed.append((name, compensate))
                self.log.append(f"DONE: {name}")
            except Exception as e:
                self.log.append(f"FAILED: {name} ({e})")
                # TODO: iterate completed in reverse and call each compensate()
                #       append "COMPENSATED: <name>" to self.log for each
                pass  # replace this pass with rollback logic
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

assert result is False, "Saga should return False on failure"
assert "reserve" in executed,  "reserve_inventory should have executed"
assert "charge"  in executed,  "charge_payment should have executed"
assert "refund"  in executed,  "charge_payment compensation (refund) should have run"
assert "release" in executed,  "reserve_inventory compensation (release) should have run"
# dispatch should NOT be in compensations because it never succeeded
assert executed.count("cancel_dispatch") == 0, "dispatch never completed — no compensation needed"
print(f"[6] saga log: {saga.log}")
print(f"[6] execution order: {executed}")


# ── EXERCISE 7: High-Value Event Detection ────────────────────────────────────
# From the orders DataFrame, find users who have placed more than one
# order totalling over $500.

# TODO: group by user_id, compute:
#       order_count = count(*)
#       total_spent = sum(amount)
# TODO: filter to users with order_count > 1 AND total_spent > 500

high_value_users = None  # replace

assert high_value_users is not None
rows = high_value_users.collect()
user_ids = {r.user_id for r in rows}
assert "u1" in user_ids, "u1 has 2 orders totalling ~1299, should be included"
assert "u2" not in user_ids, "u2 has 2 orders but total ~549 > 500 — check your assertion"
# u2 total = 49.99 + 499.00 = 548.99 > 500 and order_count = 2 → should be included
assert "u2" in user_ids, "u2 has 2 orders totalling ~549, should be included"
assert "u3" not in user_ids, "u3 has 2 orders totalling only ~37.50, should NOT be included"
print(f"[7] high_value_users={sorted(user_ids)}")


# ── EXERCISE 8: Kafka Message Schema ─────────────────────────────────────────
# Parse a JSON-encoded Kafka value column into structured fields.

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

# TODO: parse the 'value' column using from_json with kafka_schema
#       select all fields from the parsed struct
#       result columns: order_id, amount, category

parsed = None  # replace

assert parsed is not None
assert parsed.count() == 3
cols = set(parsed.columns)
assert {"order_id", "amount", "category"} <= cols, f"Missing columns. Got: {cols}"
first = parsed.orderBy("order_id").first()
assert first.order_id == "o300"
print(f"[8] parsed Kafka messages: {parsed.count()} rows, columns: {sorted(cols)}")


print("\nAll exercises completed!")
spark.stop()
