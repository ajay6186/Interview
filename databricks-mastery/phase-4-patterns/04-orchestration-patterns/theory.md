# Theory: Orchestration Patterns

## What is Orchestration?

Orchestration coordinates the execution of multiple pipeline stages — handling dependencies, retries, scheduling, and monitoring. In Databricks, orchestration can be done via:

1. **Databricks Workflows** — native, tightly integrated with clusters and Delta Live Tables
2. **Apache Airflow** — popular open-source DAG scheduler
3. **Delta Live Tables (DLT)** — declarative, automatic dependency resolution
4. **dbt** — SQL-centric transformation orchestration

---

## Databricks Workflows (Jobs)

```python
# Workflows API: create a multi-task job programmatically
import requests

job_config = {
    "name": "orders_pipeline",
    "tasks": [
        {
            "task_key": "ingest_bronze",
            "notebook_task": {"notebook_path": "/pipelines/01_bronze_ingestion"},
            "new_cluster": {"spark_version": "14.3.x-scala2.12",
                            "node_type_id": "i3.xlarge",
                            "num_workers": 4},
        },
        {
            "task_key": "transform_silver",
            "depends_on": [{"task_key": "ingest_bronze"}],   # dependency
            "notebook_task": {"notebook_path": "/pipelines/02_silver_transform"},
            "job_cluster_key": "shared_cluster",
        },
        {
            "task_key": "build_gold",
            "depends_on": [{"task_key": "transform_silver"}],
            "notebook_task": {"notebook_path": "/pipelines/03_gold_agg"},
            "job_cluster_key": "shared_cluster",
        },
    ],
    "job_clusters": [
        {"job_cluster_key": "shared_cluster",
         "new_cluster": {"spark_version": "14.3.x-scala2.12",
                         "node_type_id": "i3.xlarge",
                         "num_workers": 8}}
    ],
    "schedule": {"quartz_cron_expression": "0 0 6 * * ?",  # daily at 06:00 UTC
                 "timezone_id": "UTC"},
    "email_notifications": {"on_failure": ["oncall@company.com"]},
    "max_retries": 2,
    "min_retry_interval_millis": 60000,
}
```

**Task types in Databricks Workflows**:
- `notebook_task` — run a notebook
- `python_wheel_task` — run a packaged Python wheel
- `spark_python_task` — run a .py script
- `dbt_task` — run dbt models
- `pipeline_task` — trigger a DLT pipeline
- `run_job_task` — trigger another Databricks job

---

## Delta Live Tables (DLT) as Orchestrator

DLT automatically resolves dependencies from `dlt.read()` / `dlt.read_stream()` calls:

```python
import dlt
from pyspark.sql import functions as F

# Bronze — no dependency (reads from external source)
@dlt.table(name="bronze_orders", comment="Raw orders from S3")
def bronze_orders():
    return (spark.readStream
        .format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.schemaLocation", "/schema/orders")
        .load("s3://landing/orders/"))

# Silver — depends on bronze (DLT auto-wires this)
@dlt.table(name="silver_orders", comment="Cleaned orders")
@dlt.expect_or_drop("valid_amount", "amount > 0")
def silver_orders():
    return (dlt.read_stream("bronze_orders")
        .filter(F.col("order_id").isNotNull())
        .withColumn("amount", F.round("amount", 2)))

# Gold — depends on silver
@dlt.table(name="gold_daily_revenue", comment="Daily revenue by region")
def gold_daily_revenue():
    return (dlt.read("silver_orders")   # batch read (not streaming)
        .groupBy("region", F.to_date("created_at").alias("date"))
        .agg(F.sum("amount").alias("revenue"), F.count("*").alias("orders")))
```

**DLT advantages**: automatic dependency resolution, built-in DQ expectations, auto-scaling, managed checkpoints, pipeline UI with data lineage.

---

## Retry Pattern

```python
import time
import functools

def with_retry(func=None, max_retries=3, delay_sec=5, exceptions=(Exception,)):
    """Decorator/wrapper that retries a function on failure."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_retries + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    if attempt < max_retries:
                        print(f"Attempt {attempt} failed: {e}. Retrying in {delay_sec}s...")
                        time.sleep(delay_sec)
                    else:
                        print(f"All {max_retries} attempts failed.")
            raise last_exc
        return wrapper
    if func is not None:
        return decorator(func)
    return decorator

@with_retry(max_retries=3, delay_sec=10)
def load_silver():
    # potentially flaky operation
    spark.sql("MERGE INTO silver.orders ...")
```

---

## Watermark-Based Incremental Loading

```python
import json
from pathlib import Path

WATERMARK_PATH = "/dbfs/pipeline_state/watermarks.json"

def load_watermark(pipeline_name: str) -> str:
    """Return last processed timestamp or epoch start."""
    try:
        with open(WATERMARK_PATH) as f:
            marks = json.load(f)
        return marks.get(pipeline_name, "1970-01-01 00:00:00")
    except FileNotFoundError:
        return "1970-01-01 00:00:00"

def save_watermark(pipeline_name: str, watermark: str):
    """Persist the last successfully processed watermark."""
    marks = {}
    try:
        with open(WATERMARK_PATH) as f:
            marks = json.load(f)
    except FileNotFoundError:
        pass
    marks[pipeline_name] = watermark
    Path(WATERMARK_PATH).parent.mkdir(parents=True, exist_ok=True)
    with open(WATERMARK_PATH, "w") as f:
        json.dump(marks, f)

# Usage
last_ts = load_watermark("orders_pipeline")
new_data = spark.table("bronze.orders").filter(
    F.col("created_at") > last_ts)
# ... process new_data ...
max_ts = new_data.agg(F.max("created_at")).collect()[0][0]
save_watermark("orders_pipeline", str(max_ts))
```

---

## Pipeline Context Manager

```python
import time
import json
from datetime import datetime

class PipelineRun:
    def __init__(self, pipeline_name: str, run_id: str):
        self.pipeline = pipeline_name
        self.run_id   = run_id
        self.stages   = {}
        self._start   = None

    def __enter__(self):
        self._start = time.time()
        print(json.dumps({"level": "INFO", "event": "run_started",
                          "pipeline": self.pipeline, "run_id": self.run_id,
                          "ts": datetime.now().isoformat()}))
        return self

    def record_stage(self, stage: str, rows_in: int, rows_out: int):
        self.stages[stage] = {"rows_in": rows_in, "rows_out": rows_out}
        print(json.dumps({"level": "INFO", "event": "stage_complete",
                          "pipeline": self.pipeline, "stage": stage,
                          "rows_in": rows_in, "rows_out": rows_out}))

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self._start
        status   = "FAILED" if exc_type else "SUCCESS"
        print(json.dumps({"level": "ERROR" if exc_type else "INFO",
                          "event": "run_finished", "pipeline": self.pipeline,
                          "run_id": self.run_id, "status": status,
                          "duration_sec": round(duration, 2),
                          "error": str(exc_val) if exc_val else None}))
        return False   # do not suppress exceptions

# Usage
with PipelineRun("orders_etl", "run_001") as run:
    bronze_df = ingest_bronze()
    run.record_stage("bronze", rows_in=0, rows_out=bronze_df.count())
    silver_df = transform_silver(bronze_df)
    run.record_stage("silver", rows_in=bronze_df.count(), rows_out=silver_df.count())
```

---

## Common Interview Questions

**Q: What are Databricks Workflows and how do you define task dependencies?**  
A: Databricks Workflows (Jobs) is a native scheduler for multi-task pipelines. Tasks can be notebooks, Python scripts, DLT pipelines, or dbt runs. Dependencies are defined with `depends_on: [{task_key: "upstream_task"}]` — Databricks executes them in topological order with automatic retry and alerting.

**Q: What is Delta Live Tables and how does it differ from Workflows?**  
A: DLT is a declarative ETL framework — you define what each table should look like (using `@dlt.table`), and DLT figures out the execution order from `dlt.read()` dependencies. It includes built-in DQ expectations, auto-scaling, and managed checkpoints. Workflows is imperative (you define the order); DLT is declarative (dependencies are inferred).

**Q: How do you implement idempotent pipelines?**  
A: (1) Use watermarks to process only new data; (2) use MERGE at Silver for upserts; (3) use `replaceWhere` at Gold for partition overwrite; (4) use Auto Loader at Bronze (checkpoint prevents re-ingestion). Together these ensure re-running a pipeline produces the same result.

**Q: What is a watermark in a batch pipeline context?**  
A: A persisted timestamp or offset marking the last successfully processed record. Each run loads the watermark, processes only records newer than it, and saves the new max timestamp on success. Prevents reprocessing old data and enables incremental loading.

**Q: How do you handle failures in orchestration?**  
A: (1) Retry with exponential backoff for transient failures. (2) Checkpoint after each stage so retries resume where they left off (not from scratch). (3) Dead-letter queue for rows that consistently fail. (4) Alerting (email/Slack) on failure. (5) Idempotent writes so partial retries don't corrupt data.

---

## Quick Reference

```python
# Retry decorator
@with_retry(max_retries=3, delay_sec=10)
def my_stage(): ...

# Watermark
last_ts = load_watermark("pipeline")
df = bronze.filter(F.col("ts") > last_ts)
save_watermark("pipeline", str(df.agg(F.max("ts")).collect()[0][0]))

# Pipeline context manager
with PipelineRun("name", "run_id") as run:
    run.record_stage("stage", rows_in=1000, rows_out=990)

# DLT dependencies
@dlt.table
def silver(): return dlt.read_stream("bronze")  # auto-depends on bronze

@dlt.table
def gold():   return dlt.read("silver")         # auto-depends on silver

# Workflow task dependency (JSON/YAML)
{"task_key": "silver", "depends_on": [{"task_key": "bronze"}]}
```
