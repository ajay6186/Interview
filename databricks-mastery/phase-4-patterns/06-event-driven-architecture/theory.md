# Theory: Event-Driven Architecture on Databricks

## What is Event-Driven Architecture?

Event-Driven Architecture (EDA) is a design pattern where components communicate by producing and consuming **events** — immutable records of something that happened. Instead of polling for state changes, a service reacts to events as they arrive.

Key concepts:
- **Event Producer** — emits an event when something happens (order placed, sensor reading, click)
- **Event Broker** — durable transport layer (Kafka, Azure Event Hubs, AWS Kinesis, Pub/Sub)
- **Event Consumer** — reacts to events (Structured Streaming, triggers, webhooks)
- **Event Store** — append-only log; Delta Lake acts as an event store via CDF/append-only tables

---

## Event Sources in Databricks

### 1. Apache Kafka / Azure Event Hubs
```python
# Read events from Kafka
events = (spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "broker:9092")
    .option("subscribe", "orders,clicks")          # multi-topic
    .option("startingOffsets", "latest")
    .option("maxOffsetsPerTrigger", 50_000)        # back-pressure
    .load()
    .selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)",
                "topic", "partition", "offset", "timestamp"))
```

### 2. Delta Lake Change Data Feed (CDF)
CDF turns a Delta table into an event stream — every INSERT, UPDATE, DELETE becomes a row.
```python
spark.sql("ALTER TABLE silver.orders SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')")

# Batch: read changes since version 5
changes = (spark.read.format("delta")
    .option("readChangeFeed", "true")
    .option("startingVersion", 5)
    .table("silver.orders"))
# _change_type: insert | update_preimage | update_postimage | delete

# Streaming: react to every new change
cdf_stream = (spark.readStream.format("delta")
    .option("readChangeFeed", "true")
    .option("startingVersion", "latest")
    .table("silver.orders"))
```

### 3. Auto Loader (File Arrival Events)
Auto Loader uses cloud-native file notification services to trigger ingest on new files:
```python
new_files = (spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "json")
    .option("cloudFiles.useNotifications", "true")   # SNS/SQS or Event Grid
    .option("cloudFiles.schemaLocation", "/schemas/events")
    .load("abfss://landing@account.dfs.core.windows.net/events/"))
```

### 4. File Arrival Trigger (Databricks Workflows)
```yaml
trigger:
  file_arrival:
    url: "abfss://container@account.dfs.core.windows.net/landing/"
    min_time_between_triggers_seconds: 60
```

### 5. Webhook / REST Trigger
```python
# External system triggers a Databricks job via REST API
# POST /api/2.1/jobs/run-now
# {"job_id": 123, "job_parameters": {"event_id": "evt-456", "source": "crm"}}
```

---

## Event-Driven Pipeline Patterns

### Pattern 1: Streaming ETL (Continuous)
```
Kafka → Bronze (raw) → Silver (clean) → Gold (aggregated)
        readStream      readStream         readStream / batch
```

### Pattern 2: CDF-Triggered Propagation
```
MERGE into silver.orders (CDF enabled)
  ↓ CDF stream
Downstream: enrich orders with customer data, write to gold
```

### Pattern 3: File-Arrival Batch
```
Partner drops CSV to ADLS → file_arrival trigger → Databricks job
→ Auto Loader reads new files → Bronze Delta
```

### Pattern 4: Event Sourcing with Delta
```
Delta table (append-only) = event log
Current state = replay of all events (or use CDF snapshot)
Time-travel = point-in-time reconstruction
```

### Pattern 5: Saga / Compensating Transactions
```
Step 1: Reserve inventory   → compensate: release inventory
Step 2: Charge payment      → compensate: refund payment
Step 3: Dispatch order      → compensate: cancel dispatch
On failure at step N: execute compensations N−1 → 1 in reverse order
```

---

## Watermarks and Late Data

Watermarks tell the engine how late data can arrive before being discarded:
```python
from pyspark.sql import functions as F

windowed = (events
    .withWatermark("event_time", "10 minutes")      # tolerate 10 min late arrivals
    .groupBy(
        F.window("event_time", "5 minutes"),         # 5-min tumbling window
        "product_id")
    .agg(F.count("*").alias("event_count"),
         F.sum("amount").alias("revenue")))
```

**Tumbling windows** — fixed, non-overlapping (e.g., every 5 min)  
**Sliding windows** — overlapping (e.g., 10-min window every 5 min)  
**Session windows** — gap-based (e.g., activity within 30 min of inactivity)

---

## Stateful Streaming

For patterns that need memory across micro-batches:

```python
from pyspark.sql.streaming.state import GroupStateTimeout
from typing import Iterator
import pandas as pd

def update_session(
    key: tuple,
    pdfs: Iterator[pd.DataFrame],
    state   # GroupState
) -> Iterator[pd.DataFrame]:
    if state.hasTimedOut:
        # emit final session record
        yield pd.DataFrame([{"user_id": key[0], "session_events": state.get[0],
                             "timed_out": True}])
        state.remove()
        return
    for pdf in pdfs:
        count = state.get[0] if state.exists else 0
        count += len(pdf)
        state.update((count,))
        state.setTimeoutDuration(30 * 60 * 1000)  # 30-min session gap
    yield pd.DataFrame()  # no output until timeout

result = (events.groupBy("user_id")
    .applyInPandasWithState(
        update_session,
        outputStructType="user_id STRING, session_events INT, timed_out BOOLEAN",
        stateStructType="session_events INT",
        outputMode="append",
        timeoutConf=GroupStateTimeout.ProcessingTimeTimeout))
```

---

## Output Modes and Triggers

| Mode | When to use |
|------|-------------|
| `append` | Rows are only added, never updated (most common) |
| `update` | Only rows that changed are output (windowed agg) |
| `complete` | Full result table output each batch (small agg only) |

| Trigger | Behaviour |
|---------|-----------|
| `processingTime("1 minute")` | Micro-batch every 60 s |
| `once()` | Single batch then stop (scheduled jobs) |
| `availableNow()` | All available data then stop (incremental batch) |
| `continuous("1 second")` | Row-level millisecond latency (experimental) |

---

## Common Interview Questions

**Q: What is the difference between event-driven and polling-based architectures?**  
A: Polling periodically checks a source for new data (batch, wasteful if nothing changed). EDA reacts immediately when an event occurs — lower latency, less wasted compute, but requires a reliable broker. Databricks supports both: batch watermarks for polling, Structured Streaming + Kafka for EDA.

**Q: How does Delta CDF enable event-driven patterns?**  
A: Delta CDF logs every row-level change (insert/update/delete) as a special `_change_type` column. Downstream jobs can stream these changes to propagate updates to derived tables without reprocessing the full table. This is CDC (Change Data Capture) native to Delta.

**Q: How do watermarks prevent state from growing unbounded?**  
A: The watermark sets the maximum expected event lateness. Once the engine's event-time clock advances past `max_event_time − watermark_delay`, it knows no more late rows will arrive for windows before that point, so it can drop state for those windows.

**Q: What is the Saga pattern and why is it useful?**  
A: Saga breaks a distributed transaction into a sequence of local transactions, each with a compensating action. If step N fails, compensations for steps N−1 → 1 are executed to undo side effects. It avoids distributed 2-phase commit by accepting eventual consistency.

**Q: When would you use `availableNow()` trigger instead of `continuous` streaming?**  
A: `availableNow()` processes all currently available data then stops — ideal for scheduled batch jobs that want incremental semantics (only new data since last checkpoint) without running a always-on cluster. `continuous` is for sub-second latency requirements.

---

## Quick Reference

```python
# Kafka source
spark.readStream.format("kafka").option("subscribe","topic").load()

# CDF source (batch)
spark.read.format("delta").option("readChangeFeed","true").option("startingVersion",0).table("tbl")

# CDF source (streaming)
spark.readStream.format("delta").option("readChangeFeed","true").table("tbl")

# Auto Loader
spark.readStream.format("cloudFiles").option("cloudFiles.format","json").load("path/")

# Watermark + tumbling window
df.withWatermark("ts","5 minutes").groupBy(F.window("ts","5 minutes")).agg(...)

# Trigger once (incremental batch)
.writeStream.trigger(availableNow=True).start()

# Output modes
.writeStream.outputMode("append")    # default
.writeStream.outputMode("update")    # windowed agg
.writeStream.outputMode("complete")  # full recompute
```
