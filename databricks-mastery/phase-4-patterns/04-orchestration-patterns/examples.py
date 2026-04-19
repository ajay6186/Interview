# ============================================================================
# Examples 4.4 — Orchestration Patterns  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: Databricks Workflows, DLT, dbutils, task params, scheduling
# ============================================================================

import os, json, sys
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("orchestration-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. dbutils.widgets.text — notebook parameter
print("Ex01 dbutils.widgets.text('env','dev','Environment')  → dbutils.widgets.get('env')")

# 2. dbutils.widgets.dropdown
print("Ex02 dbutils.widgets.dropdown('mode','full',['full','incremental'])")

# 3. dbutils.widgets.combobox
print("Ex03 dbutils.widgets.combobox('table','orders',['orders','products','customers'])")

# 4. dbutils.widgets.multiselect
print("Ex04 dbutils.widgets.multiselect('layers','bronze',['bronze','silver','gold'])")

# 5. dbutils.widgets.removeAll
print("Ex05 dbutils.widgets.removeAll()  # cleanup at end of notebook")

# 6. dbutils.notebook.run — call child notebook
print("Ex06 result = dbutils.notebook.run('/Shared/bronze_ingest', 300, {'env': 'prod'})")

# 7. dbutils.notebook.exit — return value to caller
print("Ex07 dbutils.notebook.exit('SUCCESS|ROWS:1234')  # structured result string")

# 8. CLI/sys.argv parameter
run_date = sys.argv[1] if len(sys.argv) > 1 else "2024-01-01"
print(f"Ex08 run_date from argv: {run_date}")

# 9. Task values in multi-task Workflows
print("Ex09 dbutils.jobs.taskValues.set(key='row_count', value=df.count())")
print("     rows = dbutils.jobs.taskValues.get(taskKey='ingest', key='row_count', debugValue=0)")

# 10. Job cluster vs interactive cluster
print("Ex10 Job cluster: ephemeral per-run, auto-terminates → cheaper for prod pipelines")
print("     Interactive cluster: persistent, shared → better for exploration")

# 11. Spot / preemptible workers in job clusters
print("Ex11 spot_bid_price_percent=100 on workers; keep driver on-demand for stability")

# 12. Cluster reuse across tasks (shared_job_cluster)
print("Ex12 shared_job_cluster: tasks B, C, D share one cluster → avoid 3x startup time")

# 13. Retry policy
print("Ex13 max_retries=3, min_retry_interval_millis=60000 — exponential backoff pattern")

# 14. Task timeout
print("Ex14 timeout_seconds=3600 — prevent runaway tasks from blocking downstream work")

# 15. Condition / run-if
print("Ex15 run_if: 'ALL_SUCCESS' | 'AT_LEAST_ONE_SUCCESS' | 'NONE_FAILED' | 'ALL_DONE'")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Linear chain A → B → C
print("Ex16 depends_on: [{task_key:'ingest'}] makes a linear pipeline")

# 17. Fan-out (A → B and A → C in parallel)
print("Ex17 Both B and C list task A in depends_on → they run in parallel after A")

# 18. Fan-in (B + C → D)
print("Ex18 D depends on [B, C] → waits for both, then continues")

# 19. For-each task (loop over parameter list)
print("""Ex19 for_each_task:
  inputs: [{\"date\":\"2024-01\"},{\"date\":\"2024-02\"},{\"date\":\"2024-03\"}]
  concurrency: 3
  task: runs 'process_month' once per input in parallel
""")

# 20. Python wheel task
print("Ex20 python_wheel_task: {package_name:'myetl', entry_point:'run', parameters:['--env','prod']}")

# 21. spark_python_task (plain .py file in DBFS/ADLS/S3)
print("Ex21 spark_python_task: {python_file:'s3://bucket/etl.py', parameters:['--env','prod']}")

# 22. dbt task
print("Ex22 dbt_task: {project_directory:'/dbt', commands:['dbt seed','dbt run','dbt test']}")

# 23. SQL task against Databricks SQL warehouse
print("Ex23 sql_task: {query:{query_id:'abc123'}, warehouse_id:'wxyz789'}")

# 24. Pipeline (DLT) task
print("Ex24 pipeline_task: {pipeline_id:'dlt_pipe_id'} — triggers a full or refresh update")

# 25. Run job task (nested jobs)
print("Ex25 run_job_task: {job_id:98765} — compose large workflows from smaller modular jobs")

# 26. Email notifications
print("Ex26 email_notifications: {on_failure:['oncall@co.com'], on_success:['lead@co.com']}")

# 27. Webhook (Slack / PagerDuty)
print("Ex27 webhook_notifications.on_failure: [{id:'<webhook_notification_id>'}]")

# 28. Cron schedule
print("Ex28 quartz_cron_expression: '0 0 6 * * ?' timezone: 'UTC' → daily at 06:00 UTC")

# 29. Continuous trigger (always-on streaming)
print("Ex29 trigger: {continuous:{pause_status:'UNPAUSED'}} — restarts immediately after run")

# 30. File-arrival trigger
print("Ex30 trigger: {file_arrival:{url:'abfss://container@account/landing/'}} — event-driven")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. Idempotent task with watermark
WM_PATH = "/tmp/orch_wm"
os.makedirs(WM_PATH, exist_ok=True)

def get_watermark(key: str, default: str = "1970-01-01") -> str:
    p = f"{WM_PATH}/{key}.txt"
    return open(p).read().strip() if os.path.exists(p) else default

def set_watermark(key: str, value: str):
    with open(f"{WM_PATH}/{key}.txt", "w") as f:
        f.write(value)

last = get_watermark("orders")
print(f"Ex31 watermark last_processed={last}")
set_watermark("orders", run_date)

# 32. Incremental Delta read via watermark
print(f"Ex32 df = spark.read.format('delta').load(path).filter(F.col('ts') > '{last}')")

# 33. Auto Loader as push-based ingest trigger
print("""Ex33 Auto Loader:
spark.readStream
    .format('cloudFiles')
    .option('cloudFiles.format', 'json')
    .option('cloudFiles.schemaLocation', '/schemas/orders')
    .load('abfss://landing/orders/')
    .writeStream.format('delta').option('checkpointLocation','/ckpt/orders')
    .start('/bronze/orders')
""")

# 34. DLT pipeline definition
dlt_code = """
import dlt
from pyspark.sql import functions as F

@dlt.table(name='bronze_orders')
def bronze_orders():
    return spark.readStream.format('cloudFiles') \\
        .option('cloudFiles.format','json').load('/landing/orders/')

@dlt.table(name='silver_orders')
@dlt.expect_or_drop('valid_price',  'price > 0')
@dlt.expect_or_drop('valid_email',  'customer_email IS NOT NULL')
def silver_orders():
    return dlt.read_stream('bronze_orders') \\
        .withColumn('price', F.col('price_str').cast('double')) \\
        .dropDuplicates(['order_id'])
"""
print("Ex34 DLT pipeline (requires DLT runtime):", dlt_code[:150])

# 35. DLT expectation modes
print("Ex35 @dlt.expect → metric only | @dlt.expect_or_drop → quarantine | @dlt.expect_or_fail → halt")

# 36. DLT CDC (APPLY CHANGES INTO)
print("Ex36 dlt.apply_changes(target='silver_customers', source='cdc_stream', keys=['id'], sequence_by='updated_at')")

# 37. Multi-env config routing
ENV = os.environ.get("ENV", "dev")
ENV_CFG = {
    "dev":  {"catalog": "dev",     "cluster": "Single Node"},
    "staging": {"catalog": "staging", "cluster": "4 workers"},
    "prod": {"catalog": "prod",    "cluster": "Auto-scale 4–20"},
}
cfg = ENV_CFG.get(ENV, ENV_CFG["dev"])
print(f"Ex37 ENV={ENV} → catalog={cfg['catalog']} cluster={cfg['cluster']}")

# 38. Task value inter-task communication
print("""Ex38 Producer task:
  count = df.count()
  dbutils.jobs.taskValues.set('processed_rows', count)
Consumer task:
  rows = dbutils.jobs.taskValues.get(taskKey='ingest', key='processed_rows', debugValue=0)
  if rows == 0: dbutils.notebook.exit('SKIP — no new data')
""")

# 39. SLA monitoring function
def assert_sla(actual: int, min_expected: int, label: str = "rows"):
    if actual < min_expected:
        raise RuntimeError(f"SLA BREACH: {label}={actual} < minimum={min_expected}")
    print(f"Ex39 SLA OK: {label}={actual} >= {min_expected}")

assert_sla(5000, 100, "orders")

# 40. Parallel notebook execution
print("""Ex40 Parallel backfill:
from concurrent.futures import ThreadPoolExecutor
dates = ['2024-01','2024-02','2024-03','2024-04']
def run(d): return dbutils.notebook.run('/ingest', 600, {'month': d})
with ThreadPoolExecutor(max_workers=4) as ex:
    results = list(ex.map(run, dates))
print(results)
""")

# 41. Backfill loop with progress tracking
dates = ["2024-01-01", "2024-01-02", "2024-01-03"]
for d in dates:
    print(f"Ex41 backfill date={d} ... OK")

# 42. Isolation via Unity Catalog per env
print("Ex42 dev.raw.orders / staging.raw.orders / prod.raw.orders — same code, catalog param")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Jobs REST API payload
job_def = {
    "name": "prod_etl",
    "tasks": [
        {"task_key": "ingest",
         "spark_python_task": {"python_file": "s3://bucket/ingest.py"},
         "job_cluster_key": "shared"},
        {"task_key": "transform",
         "depends_on": [{"task_key": "ingest"}],
         "spark_python_task": {"python_file": "s3://bucket/transform.py"},
         "job_cluster_key": "shared"},
        {"task_key": "quality_check",
         "depends_on": [{"task_key": "transform"}],
         "spark_python_task": {"python_file": "s3://bucket/dq_check.py"},
         "job_cluster_key": "shared"},
    ],
    "job_clusters": [{"job_cluster_key": "shared",
                      "new_cluster": {"spark_version": "15.4.x-scala2.12", "num_workers": 8}}],
    "schedule": {"quartz_cron_expression": "0 0 4 * * ?", "timezone_id": "UTC"},
    "max_concurrent_runs": 1,
}
print("Ex43 Job API payload (partial):", json.dumps(job_def)[:200])

# 44. Databricks Asset Bundles (DAB)
print("""Ex44 bundle.yml:
bundle:
  name: ecommerce_platform
targets:
  dev:  {mode: development, workspace: {host: ${DEV_HOST}}}
  prod: {mode: production,  workspace: {host: ${PROD_HOST}}}
resources:
  jobs:
    daily_etl:
      name: daily_etl_${bundle.target}
      tasks:
        - task_key: ingest
          python_wheel_task: {package_name: ecomm_etl, entry_point: ingest}
""")

# 45. Event-driven trigger via REST
print("Ex45 POST /api/2.1/jobs/run-now {job_id: 123, job_parameters: {date: '2024-01-15'}}")

# 46. Run monitoring
print("Ex46 GET /api/2.1/jobs/runs/get?run_id=456 → poll until life_cycle_state='TERMINATED'")

# 47. Cost-aware scheduling
print("Ex47 Schedule heavy ETL 02:00–05:00 UTC — avoids peak DBU rates on pay-as-you-go tiers")

# 48. Circuit breaker for downstream calls
class CircuitBreaker:
    def __init__(self, max_failures=3):
        self.failures = 0
        self.max_failures = max_failures

    def call(self, func, *args, **kwargs):
        if self.failures >= self.max_failures:
            raise RuntimeError("Circuit OPEN — halting pipeline")
        try:
            result = func(*args, **kwargs)
            self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            print(f"Ex48 failure {self.failures}/{self.max_failures}: {e}")
            raise

cb = CircuitBreaker()
print("Ex48 CircuitBreaker: wraps API calls / external writes to stop cascade failures")

# 49. Saga pattern for distributed transactions
print("""Ex49 Saga:
  Step 1: append to orders_staging         → compensate: delete from orders_staging
  Step 2: enrich with product catalog      → compensate: skip (read-only)
  Step 3: MERGE into orders_final          → compensate: delete inserted rows
  Step 4: update inventory                 → compensate: revert inventory change
  On failure at step N: run compensations N-1 → 1
""")

# 50. Custom pipeline metrics emission
def emit(name: str, value, **tags):
    tag_str = " ".join(f"{k}={v}" for k, v in tags.items())
    print(f"METRIC name={name} value={value} {tag_str}")

emit("etl.rows_processed", 120_000, env="prod", table="orders", status="success")
emit("etl.duration_sec",    62.3,   env="prod", table="orders")
emit("etl.bad_rows",          47,   env="prod", table="orders")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
