# Theory: Secrets & Configuration Management

## Why Secrets Management Matters

Hardcoding credentials in notebooks or code files is a critical security risk:
- Credentials visible in git history, audit logs, job output
- Shared notebooks expose credentials to all viewers
- Rotating credentials requires finding and updating every hardcoded location

The solution: store secrets in a vault, reference them by name. The actual values never appear in code.

---

## Databricks Secrets

Databricks Secrets is a built-in secrets manager integrated with the Databricks platform. It supports two backends: Databricks-native and Azure Key Vault / AWS Secrets Manager.

```
Hierarchy:
  Scope (e.g., "prod-secrets")
    └── Secret (e.g., "db-password")
```

```bash
# Create scope (CLI)
databricks secrets create-scope prod-secrets

# Add secrets (CLI)
databricks secrets put-secret prod-secrets db-host --string-value "my-db.us-east-1.rds.amazonaws.com"
databricks secrets put-secret prod-secrets db-password --string-value "s3cr3t!"
databricks secrets put-secret prod-secrets kafka-api-key --string-value "abc123"

# List scopes and secrets
databricks secrets list-scopes
databricks secrets list-secrets prod-secrets
```

```python
# Read in notebook/job (value is REDACTED in output — never printed as plaintext)
host     = dbutils.secrets.get(scope="prod-secrets", key="db-host")
password = dbutils.secrets.get(scope="prod-secrets", key="db-password")

# Use in connection
jdbc_url = f"jdbc:postgresql://{host}:5432/orders"
df = (spark.read.format("jdbc")
    .option("url", jdbc_url)
    .option("dbtable", "orders")
    .option("user", "etl_user")
    .option("password", password)  # never hardcode this
    .load())
```

---

## Secret Scope Types

### Databricks-native scope
```bash
databricks secrets create-scope my-scope --initial-manage-principal users
```
Secrets stored in Databricks-managed encrypted store.

### Azure Key Vault-backed scope
```bash
databricks secrets create-scope akv-scope \
    --scope-backend-type AZURE_KEYVAULT \
    --resource-id /subscriptions/.../vaults/my-vault \
    --dns-name https://my-vault.vault.azure.net/
```
Secrets stored in Azure Key Vault; Databricks reads them via managed identity.

### AWS Secrets Manager
```python
# Access via boto3 inside the cluster (uses instance profile)
import boto3, json
client = boto3.client("secretsmanager", region_name="us-east-1")
secret = json.loads(client.get_secret_value(SecretId="prod/db/credentials")["SecretString"])
password = secret["password"]
```

---

## RBAC for Secrets

```bash
# Grant READ to a group (they can use secrets but not manage them)
databricks secrets put-acl prod-secrets data-engineers READ

# Grant WRITE to admins
databricks secrets put-acl prod-secrets platform-team WRITE

# Grant MANAGE (can set ACLs)
databricks secrets put-acl prod-secrets admin-group MANAGE

# List ACLs
databricks secrets get-acl prod-secrets data-engineers
```

**Permission levels**: READ (use secrets in code) < WRITE (create/update secrets) < MANAGE (set ACLs).

---

## Configuration Management

### Databricks Widgets (notebook parameters)
```python
# Define widgets (set default, accept from job run)
dbutils.widgets.text("env", "dev", "Environment")
dbutils.widgets.dropdown("region", "US", ["US", "EU", "APAC"], "Region")
dbutils.widgets.text("date", "", "Processing Date (YYYY-MM-DD)")

# Read widget values
env    = dbutils.widgets.get("env")
region = dbutils.widgets.get("region")
date   = dbutils.widgets.get("date") or str(datetime.date.today())

# Remove all widgets
dbutils.widgets.removeAll()
```

### Config Dictionary Pattern
```python
import os

CONFIGS = {
    "dev": {
        "bronze_path": "/dev/bronze",
        "silver_path": "/dev/silver",
        "gold_path":   "/dev/gold",
        "max_retries": 1,
        "shuffle_partitions": 50,
    },
    "prod": {
        "bronze_path": "/prod/bronze",
        "silver_path": "/prod/silver",
        "gold_path":   "/prod/gold",
        "max_retries": 3,
        "shuffle_partitions": 400,
    }
}

env = dbutils.widgets.get("env")   # passed as job parameter
cfg = CONFIGS[env]

spark.conf.set("spark.sql.shuffle.partitions", cfg["shuffle_partitions"])
bronze_df.write.format("delta").save(cfg["bronze_path"])
```

### Spark Config from Job Parameters
```python
# Job parameters set at runtime (no code change needed for different environments)
# In Databricks Workflow task: Parameters → {"env": "prod", "date": "2024-01-15"}

import json
context = json.loads(dbutils.notebook.entry_point.getDbutils()
                     .notebook().getContext().toJson())
# Or simply use widgets for parameterisation
```

---

## Service Principals

For production, use service principals (not personal credentials):

```python
# OAuth machine-to-machine token for Databricks API / Unity Catalog access
# The SP is granted permissions in UC, not a human user

# In code: authenticate with SP credentials from secrets
sp_client_id = dbutils.secrets.get("prod-secrets", "sp-client-id")
sp_secret    = dbutils.secrets.get("prod-secrets", "sp-client-secret")

# Azure: mount ADLS Gen2 with service principal
spark.conf.set(
    f"fs.azure.account.auth.type.{storage_account}.dfs.core.windows.net",
    "OAuth")
spark.conf.set(
    f"fs.azure.account.oauth.provider.type.{storage_account}.dfs.core.windows.net",
    "org.apache.hadoop.fs.azurebfs.oauth2.ClientCredsTokenProvider")
spark.conf.set(
    f"fs.azure.account.oauth2.client.id.{storage_account}.dfs.core.windows.net",
    sp_client_id)
spark.conf.set(
    f"fs.azure.account.oauth2.client.secret.{storage_account}.dfs.core.windows.net",
    sp_secret)
```

---

## Common Interview Questions

**Q: What are Databricks Secrets and why should you use them instead of hardcoding credentials?**  
A: Databricks Secrets stores credentials encrypted at rest. In notebooks/jobs, values are referenced by scope+key names and are REDACTED if accidentally printed. Hardcoded credentials appear in git history, notebook output, and audit logs — a critical security risk. Secrets also allow credential rotation without code changes.

**Q: What is a secret scope and what are the two types?**  
A: A scope is a named container for secrets. Databricks-native scopes store secrets in Databricks' encrypted store. Key Vault-backed scopes (Azure) or instance-profile-backed (AWS) delegate storage to cloud-native vaults — secrets are managed outside Databricks and Databricks reads them on demand.

**Q: How do you pass configuration between environments (dev/staging/prod)?**  
A: Use Databricks Widgets to accept runtime parameters, then look up environment-specific config from a config dictionary (or Delta table). Environment is passed as a job parameter; code reads it via `dbutils.widgets.get("env")` and selects the right config. No code changes needed to switch environments.

**Q: What is a service principal and why should production jobs use one?**  
A: A service principal is a non-human identity (machine account) used for automated processes. Using service principals instead of personal credentials means: (1) jobs don't break when employees leave, (2) permissions can be scoped narrowly to what the pipeline needs, (3) credential rotation is centralized, (4) audit logs show the service principal (not a human) as the actor.

**Q: What does REDACTED mean in Databricks when using secrets?**  
A: If you accidentally `print(dbutils.secrets.get(...))` or the secret value appears in a `display()` output, Databricks replaces the actual value with `[REDACTED]` in notebook output. This prevents credentials from being visible in shared notebooks or logs.

---

## Quick Reference

```bash
# CLI: manage secrets
databricks secrets create-scope my-scope
databricks secrets put-secret my-scope my-key --string-value "value"
databricks secrets list-secrets my-scope
databricks secrets delete-secret my-scope my-key
databricks secrets put-acl my-scope group-name READ
```

```python
# Read secret in notebook/job
val = dbutils.secrets.get(scope="my-scope", key="my-key")
# val is REDACTED if printed

# Widgets for job parameters
dbutils.widgets.text("env", "dev", "Environment")
env = dbutils.widgets.get("env")

# Config pattern
CONFIGS = {"dev": {...}, "prod": {...}}
cfg = CONFIGS[env]

# Never do this:
password = "hardcoded_password"  # BAD

# Always do this:
password = dbutils.secrets.get("prod-secrets", "db-password")  # GOOD
```
