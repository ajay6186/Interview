# ============================================================================
# Examples 4.5 — Secrets & Configuration Management  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: dbutils.secrets, Spark conf, widgets, env vars, config patterns
# ============================================================================

import os, json
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("secrets-config-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. dbutils.secrets.listScopes()
print("Ex01 dbutils.secrets.listScopes() → [{name:'jdbc-scope'}, {name:'kv-scope'}]")

# 2. dbutils.secrets.list(scope)
print("Ex02 dbutils.secrets.list('jdbc-scope') → [{key:'db_password'},{key:'db_user'}]")

# 3. dbutils.secrets.get — retrieve a secret
print("Ex03 pw = dbutils.secrets.get(scope='jdbc-scope', key='db_password')")
print("     Value is auto-redacted in notebook output → [REDACTED]")

# 4. Never print secrets
print("Ex04 NEVER do: print(secret) — even [REDACTED] leaks the pattern")
print("     USE: pass directly to JDBC properties={'password': secret}")

# 5. Azure Key Vault-backed secret scope (CLI)
print("""Ex05 Create AKV-backed scope:
databricks secrets create-scope \\
  --scope kv-scope \\
  --scope-backend-type AZURE_KEYVAULT \\
  --resource-id /subscriptions/xxx/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/my-kv \\
  --dns-name https://my-kv.vault.azure.net/
""")

# 6. Databricks-managed secret scope
print("Ex06 databricks secrets create-scope --scope myapp  (Databricks-managed backend)")

# 7. Put a secret via CLI
print("Ex07 databricks secrets put --scope myapp --key db_pass --string-value 'pa$$word'")

# 8. Environment variables set in cluster UI
print("Ex08 Cluster → Advanced → Spark env vars: DB_HOST=myserver.database.windows.net")

# 9. Read env var with fallback
DB_HOST = os.environ.get("DB_HOST", "localhost")
print(f"Ex09 DB_HOST={DB_HOST}")

# 10. spark.conf.set at runtime
spark.conf.set("myapp.batch_size", "1000")
print("Ex10 spark.conf.set('myapp.batch_size','1000')")

# 11. spark.conf.get with default
batch_size = int(spark.conf.get("myapp.batch_size", "500"))
print(f"Ex11 batch_size={batch_size}")

# 12. SparkSession builder config
print("""Ex12 SparkSession.builder
    .config('spark.sql.shuffle.partitions','200')
    .config('spark.sql.adaptive.enabled','true')
    .getOrCreate()""")

# 13. dbutils.widgets.text for notebook params
print("Ex13 dbutils.widgets.text('run_date','2024-01-01','Processing Date')")
print("     run_date = dbutils.widgets.get('run_date')")

# 14. Widget value validation
print("""Ex14 from datetime import datetime
run_date = dbutils.widgets.get('run_date')
try: datetime.strptime(run_date, '%Y-%m-%d')
except ValueError: raise ValueError(f'Bad date: {run_date}')""")

# 15. python-dotenv for local dev
print("""Ex15 Local dev .env file:
DB_PASS=localpass
CATALOG=dev
Load: from dotenv import load_dotenv; load_dotenv('.env')
""")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Config class pattern
class AppConfig:
    _DEFAULTS = {
        "dev":     {"catalog": "dev",     "db": "raw", "max_records": 10_000},
        "staging": {"catalog": "staging", "db": "raw", "max_records": 500_000},
        "prod":    {"catalog": "prod",    "db": "raw", "max_records": None},
    }

    def __init__(self, env: str = "dev"):
        if env not in self._DEFAULTS:
            raise ValueError(f"Unknown env: {env}")
        self.env = env
        self._d = self._DEFAULTS[env]

    @property
    def catalog(self): return self._d["catalog"]
    @property
    def database(self): return self._d["db"]
    @property
    def max_records(self): return self._d["max_records"]
    @property
    def orders_table(self): return f"{self.catalog}.{self.database}.orders"

cfg = AppConfig("dev")
print(f"Ex16 AppConfig: table={cfg.orders_table} max={cfg.max_records}")

# 17. JSON config file
config_path = "/tmp/app_cfg.json"
config_data = {"batch_size": 2000, "parallelism": 8, "checkpoint": "/tmp/ckpt"}
with open(config_path, "w") as f:
    json.dump(config_data, f)
with open(config_path) as f:
    loaded = json.load(f)
print(f"Ex17 JSON config: {loaded}")

# 18. Config stored in Delta table (config-as-data)
cfg_df = spark.createDataFrame([
    ("batch_size",  "2000", "prod"),
    ("parallelism", "8",    "prod"),
    ("max_retries", "3",    "prod"),
], ["key", "value", "env"])
cfg_df.createOrReplaceTempView("app_config")
batch = spark.sql("SELECT value FROM app_config WHERE key='batch_size' AND env='prod'").collect()[0][0]
print(f"Ex18 config from Delta: batch_size={batch}")

# 19. JDBC connection using secret
print("""Ex19 pw = dbutils.secrets.get('jdbc-scope','db_pass')
df = spark.read.jdbc(
    url='jdbc:sqlserver://host:1433;databaseName=orders',
    table='dbo.orders',
    properties={'user':'etl_user','password':pw,'driver':'com.microsoft.sqlserver.jdbc.SQLServerDriver'}
)""")

# 20. ADLS Gen2 OAuth with secret
print("""Ex20 ADLS Gen2 via service principal:
client_secret = dbutils.secrets.get('aad-scope','client_secret')
spark.conf.set('fs.azure.account.auth.type.account.dfs.core.windows.net', 'OAuth')
spark.conf.set('fs.azure.account.oauth.provider.type.account.dfs.core.windows.net',
               'org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider')
spark.conf.set('fs.azure.account.oauth2.client.id.account.dfs.core.windows.net',   'app_id')
spark.conf.set('fs.azure.account.oauth2.client.secret.account.dfs.core.windows.net', client_secret)
spark.conf.set('fs.azure.account.oauth2.client.endpoint.account.dfs.core.windows.net',
               'https://login.microsoftonline.com/<tenant>/oauth2/token')
""")

# 21. S3 via IAM instance profile (no secrets in code)
print("Ex21 AWS best practice: attach IAM role to cluster → no credentials in code at all")

# 22. Config validation
def validate_cfg(cfg: dict, required: list) -> None:
    missing = [k for k in required if not cfg.get(k)]
    if missing:
        raise ValueError(f"Missing required config keys: {missing}")
    print(f"Ex22 config valid: {list(cfg.keys())}")

validate_cfg({"catalog": "prod", "batch_size": "1000"}, ["catalog", "batch_size"])

# 23. Performance confs
print("""Ex23 Performance:
spark.conf.set('spark.sql.shuffle.partitions','200')
spark.conf.set('spark.sql.adaptive.enabled','true')
spark.conf.set('spark.sql.adaptive.coalescePartitions.enabled','true')
spark.conf.set('spark.databricks.io.cache.enabled','true')  # SSD Delta cache
""")

# 24. Delta-specific confs
print("""Ex24 Delta:
spark.conf.set('spark.databricks.delta.autoCompact.enabled','true')
spark.conf.set('spark.databricks.delta.optimizeWrite.enabled','true')
spark.conf.set('spark.databricks.delta.retentionDurationCheck.enabled','false')
spark.conf.set('spark.databricks.delta.merge.repartitionBeforeWrite.enabled','true')
""")

# 25. Cluster tags for cost attribution
print("""Ex25 Cluster tags (via API or UI):
{\"team\":\"data-engineering\",\"project\":\"orders-etl\",\"env\":\"prod\",\"cost_center\":\"CC-1234\"}
→ Tags appear on Azure/AWS billing for per-team chargeback
""")

# 26. Init scripts for cluster-level setup
print("""Ex26 Init script (DBFS path: /dbfs/init/setup.sh):
#!/bin/bash
set -e
pip install great-expectations==0.18.0 --quiet
echo "EXTRA_JAVA_OPTS=-Xmx2g" >> /etc/environment
""")

# 27. Feature flags from Delta
flags = spark.createDataFrame([
    ("enable_v2_pipeline", True,  "prod"),
    ("use_photon",         True,  "prod"),
    ("debug_mode",         False, "prod"),
], ["flag_name", "enabled", "env"])
flags.createOrReplaceTempView("feature_flags")
v2 = spark.sql("SELECT enabled FROM feature_flags WHERE flag_name='enable_v2_pipeline'").collect()[0][0]
print(f"Ex27 feature_flag enable_v2_pipeline={v2}")

# 28. Config layering (base → env → override)
def merge(*dicts: dict) -> dict:
    out = {}
    for d in dicts:
        out.update(d)
    return out

final = merge(
    {"batch": 500, "retries": 3, "log_level": "INFO"},
    {"batch": 2000, "log_level": "WARN"},        # prod override
    {"retries": 5},                               # hotfix override
)
print(f"Ex28 merged config: {final}")

# 29. %run pattern for config notebooks
print("Ex29 %run ../config/prod  # imports variables from config notebook into current scope")

# 30. Secret rotation strategy
print("""Ex30 Rotation:
1. Update secret in Key Vault
2. Fetch dynamically inside task (not at cluster startup) → rotation takes effect immediately
3. For JDBC pools: restart cluster after rotation
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. Multi-tenant secret isolation
print("""Ex31 Per-tenant scope:
tenant = dbutils.widgets.get('tenant_id')
pw = dbutils.secrets.get(scope=f'{tenant}-secrets', key='db_password')
catalog = f'{tenant}_catalog'
""")

# 32. Secret masking in custom log handlers
def safe_log(msg: str, *secrets: str) -> str:
    for s in secrets:
        if s:
            msg = msg.replace(s, "***")
    return msg

fake_secret = "hunter2"
print(f"Ex32 safe log: {safe_log(f'connecting with password={fake_secret}', fake_secret)}")

# 33. Config hot-reload (no cluster restart)
def reload_config(env: str) -> dict:
    """Re-read config from Delta table each invocation."""
    rows = spark.sql(f"SELECT key, value FROM app_config WHERE env='{env}'").collect()
    return {r.key: r.value for r in rows}

live = reload_config("prod")
print(f"Ex33 hot-reloaded config: {live}")

# 34. Parameterized table refs (prevent SQL injection)
table = "orders"  # validated against allowlist before use
ALLOWED = {"orders", "products", "customers"}
if table not in ALLOWED:
    raise ValueError(f"Table '{table}' not in allowlist")
df_safe = spark.sql(f"SELECT * FROM app_config WHERE env='prod'")  # safe reference
print("Ex34 parameterized table name validated against allowlist")

# 35. Cluster metadata at runtime
print("""Ex35 Read notebook context:
ctx = dbutils.notebook.entry_point.getDbutils().notebook().getContext()
user       = ctx.tags().apply('user')
cluster_id = ctx.clusterId().get()
job_id     = ctx.currentRunId().toOption().getOrElse(None)
""")

# 36. Config drift detection
expected = {"spark.sql.shuffle.partitions": "200", "spark.sql.adaptive.enabled": "true"}
current  = {k: spark.conf.get(k, "") for k in expected}
drift    = {k for k in expected if current.get(k) != expected[k]}
print(f"Ex36 config drift: {drift}")

# 37. Audit log for config changes
print("""Ex37 config_audit table:
schema: changed_at TIMESTAMP, key STRING, old_value STRING, new_value STRING,
        env STRING, changed_by STRING, reason STRING
Write append-only before every config change for compliance
""")

# 38. Per-environment catalog routing
def resolve_table(table: str, env: str) -> str:
    catalog_map = {"dev": "dev", "staging": "staging", "prod": "prod"}
    return f"{catalog_map[env]}.raw.{table}"

print(f"Ex38 resolve_table('orders','prod') = {resolve_table('orders','prod')}")

# 39. Spark property file for spark-submit
print("""Ex39 spark-submit --properties-file prod.conf \\
    --py-files myetl.whl s3://bucket/main.py
# prod.conf:
# spark.executor.memory=8g
# spark.driver.memory=4g
# spark.sql.shuffle.partitions=400
""")

# 40. Secret ACL management
print("""Ex40 Secret ACLs:
databricks secrets put-acl --scope myapp --principal data-engineers --permission READ
databricks secrets put-acl --scope myapp --principal ops-team        --permission WRITE
databricks secrets put-acl --scope myapp --principal ci-service-acct --permission READ
""")

# 41. HashiCorp Vault integration
print("""Ex41 Vault via REST API:
import requests
resp = requests.get('http://vault:8200/v1/secret/data/etl/db',
                    headers={'X-Vault-Token': os.environ['VAULT_TOKEN']})
db_pass = resp.json()['data']['data']['password']
""")

# 42. AWS Secrets Manager
print("""Ex42 AWS Secrets Manager:
import boto3, json
sm = boto3.client('secretsmanager', region_name='us-east-1')
secret = json.loads(sm.get_secret_value(SecretId='prod/etl/db')['SecretString'])
password = secret['password']
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Just-in-time secrets (fetch at use-time, not startup)
print("""Ex43 JIT secrets pattern:
def get_connection():
    # fetched fresh every time — rotation effective immediately
    pw = dbutils.secrets.get('jdbc-scope', 'db_pass')
    return {'url': jdbc_url, 'properties': {'password': pw}}
""")

# 44. Pydantic-style config validation
class PipelineConfig:
    VALID_ENVS = {"dev", "staging", "prod"}

    def __init__(self, env: str, batch_size: int, checkpoint_path: str):
        assert env in self.VALID_ENVS, f"env must be in {self.VALID_ENVS}"
        assert batch_size > 0, "batch_size must be positive"
        assert checkpoint_path.startswith("/"), "checkpoint_path must be absolute"
        self.env = env
        self.batch_size = batch_size
        self.checkpoint_path = checkpoint_path

    def __repr__(self):
        return f"PipelineConfig(env={self.env}, batch={self.batch_size})"

pc = PipelineConfig("prod", 2000, "/checkpoints/orders")
print(f"Ex44 {pc}")

# 45. Databricks CLI config profiles
print("""Ex45 ~/.databrickscfg:
[DEFAULT]
host  = https://adb-111.azuredatabricks.net
token = dapi111...

[staging]
host  = https://adb-222.azuredatabricks.net
token = dapi222...

Usage: databricks --profile staging jobs list
""")

# 46. Asset Bundle environment targets
print("""Ex46 bundle.yml targets:
targets:
  dev:
    mode: development
    variables: {catalog: dev, cluster_size: Small}
  prod:
    mode: production
    variables: {catalog: prod, cluster_size: Large}
    run_as: {service_principal_name: prod-sp@company.com}
""")

# 47. Zero-secret architecture (managed identity / workload identity)
print("""Ex47 Zero-secret:
- Azure: Assign Managed Identity to cluster → access ADLS/SQL without credentials
- AWS: Attach IAM role to cluster instance profile → access S3/Glue without keys
- GCP: Use workload identity for GCS and BigQuery access
No secrets stored anywhere — identity is the credential
""")

# 48. GCS service account via secret
print("""Ex48 GCS:
sa_json = dbutils.secrets.get('gcs-scope','service_account_json')
import tempfile, os
with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
    f.write(sa_json); keyfile = f.name
spark.conf.set('google.cloud.auth.service.account.json.keyfile', keyfile)
os.unlink(keyfile)  # clean up after use
""")

# 49. Secrets audit via Databricks audit logs
print("""Ex49 Audit log for secret access:
- Enable workspace audit logs → delivered to Azure Monitor / AWS S3
- Filter: event_type = 'secretsGet', serviceName = 'secrets'
- Alert via Databricks SQL: SELECT * FROM audit_log WHERE eventName='secretsGet'
  AND userIdentity.email NOT IN ('etl-svc@co.com')
""")

# 50. Config snapshot for reproducibility
def snapshot_config(run_id: str) -> dict:
    cfg_snapshot = {
        "run_id": run_id,
        "shuffle_partitions": spark.conf.get("spark.sql.shuffle.partitions", "200"),
        "adaptive_enabled":   spark.conf.get("spark.sql.adaptive.enabled", "true"),
        "catalog": "prod",
        "captured_at": "2024-01-15T06:00:00Z",
    }
    print(f"Ex50 config snapshot: {cfg_snapshot}")
    return cfg_snapshot

snapshot_config("run-2024-01-15-001")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
