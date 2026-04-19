# ============================================================================
# Examples 6.4 — Security & Governance  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: Unity Catalog, RBAC, secrets, PII masking, row/column security,
#         data classification, audit logging, compliance
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = (SparkSession.builder
    .appName("security-governance")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. Unity Catalog hierarchy
print("""Ex01 Unity Catalog hierarchy:
  Metastore (workspace-level)
    └── Catalog     (e.g., prod, dev, test)
         └── Schema  (e.g., bronze, silver, gold)
              └── Table / View / Function

  Three-part name: catalog.schema.table
  Example:         prod.silver.orders

  Replaces: Hive metastore (single-workspace, no cross-workspace governance).
  Unity Catalog: account-level, governs multiple workspaces from one control plane.
""")

# 2. Create catalog / schema (SQL)
print("""Ex02 Catalog and schema:
  -- Create catalog:
  CREATE CATALOG IF NOT EXISTS dev;
  CREATE CATALOG IF NOT EXISTS prod;

  -- Create schema:
  CREATE SCHEMA IF NOT EXISTS prod.bronze;
  CREATE SCHEMA IF NOT EXISTS prod.silver;
  CREATE SCHEMA IF NOT EXISTS prod.gold;

  -- Managed tables stored at: <metastore-storage>/<catalog>/<schema>/<table>/
""")

# 3. Create managed vs external table
print("""Ex03 Managed vs External table:
  Managed:
    CREATE TABLE prod.silver.orders (order_id STRING, amount DOUBLE)
    USING DELTA;
    → Unity Catalog manages file lifecycle. DROP TABLE also deletes files.

  External:
    CREATE TABLE prod.silver.orders_ext
    USING DELTA LOCATION 's3://my-bucket/silver/orders';
    → You manage files. DROP TABLE removes only metadata, not files.

  Prefer MANAGED for new tables (UC handles lifecycle + governance).
  Use EXTERNAL when sharing storage with non-Databricks systems.
""")

# 4. Granting privileges
print("""Ex04 GRANT syntax:
  -- Grant read access to a group:
  GRANT SELECT ON TABLE prod.silver.orders TO GROUP analysts;

  -- Grant all DML to data-engineers group:
  GRANT SELECT, INSERT, MODIFY ON TABLE prod.silver.orders TO GROUP data-engineers;

  -- Grant schema access:
  GRANT USAGE ON SCHEMA prod.silver TO GROUP analysts;
  GRANT SELECT ON ALL TABLES IN SCHEMA prod.silver TO GROUP analysts;

  -- Revoke:
  REVOKE SELECT ON TABLE prod.silver.orders FROM GROUP analysts;
""")

# 5. Roles and groups
print("""Ex05 Roles and groups:
  Unity Catalog principals: users, service principals, groups.
  Groups map to: Entra ID (Azure) / IAM groups (AWS) / Google groups (GCP).

  Best practice:
    - Grant to GROUPS, not individual users (scale, auditability)
    - analysts_ro  → SELECT only
    - data-engineers → SELECT + MODIFY + CREATE
    - ml-team      → SELECT on gold, INSERT on feature_store

  Check permissions:
    SHOW GRANTS ON TABLE prod.silver.orders;
    SHOW GRANTS TO GROUP analysts;
""")

# 6. Service principals
print("""Ex06 Service principals:
  Non-human identity for automated pipelines.
  Best practices:
    - Each production pipeline has its own service principal (SP)
    - SP has MINIMAL permissions (only tables it needs)
    - Store SP credentials in Databricks Secrets (never in code or config files)
    - Rotate SP secrets on a schedule (90 days)
    - Audit SP activity via Unity Catalog system tables
""")

# 7. Databricks Secrets
print("""Ex07 Databricks Secrets:
  Encrypted key-value store. Credentials NEVER appear in plaintext in notebooks.

  CLI setup:
    databricks secrets create-scope --scope prod-secrets
    databricks secrets put --scope prod-secrets --key db_password

  Usage in Python:
    password = dbutils.secrets.get(scope="prod-secrets", key="db_password")
    # password = "[REDACTED]" when printed — never exposed in logs

  Usage in SQL:
    -- Not directly available; pass via Python variable to JDBC options.
""")

# 8. Secrets in JDBC connections
print("""Ex08 Secure JDBC connection:
  jdbc_url  = dbutils.secrets.get("prod-secrets","jdbc_url")
  jdbc_user = dbutils.secrets.get("prod-secrets","jdbc_user")
  jdbc_pass = dbutils.secrets.get("prod-secrets","jdbc_password")

  df = (spark.read
      .format("jdbc")
      .option("url",      jdbc_url)
      .option("dbtable",  "orders")
      .option("user",     jdbc_user)
      .option("password", jdbc_pass)
      .load())

  NEVER: .option("password", "my_actual_password")
""")

# 9. PII identification
print("""Ex09 PII categories:
  Direct PII:    name, email, phone, SSN, passport, DOB, IP address
  Indirect PII:  zip code, job title, device ID (identifying when combined)
  Financial:     credit card, bank account, salary
  Health:        diagnosis, prescription, biometric

  Regulations:
    GDPR (EU):     right to access, erasure, portability
    CCPA (CA):     right to opt-out, deletion
    HIPAA (US):    health data protection
    PCI-DSS:       payment card data

  Rule: classify all PII columns BEFORE landing data in any table.
""")

# 10. PII masking — email
raw_customers = [
    ("cust_01", "Alice Smith",  "alice.smith@example.com",   "+1-555-100-0001"),
    ("cust_02", "Bob Jones",    "bob.jones@company.org",     "+44-20-7946-0001"),
    ("cust_03", "Carol Wu",     "carol.wu@email.net",        "+1-555-200-0002"),
]
df_raw = spark.createDataFrame(raw_customers, ["customer_id","name","email","phone"])

df_masked_email = df_raw.withColumn(
    "email_masked",
    F.concat(
        F.regexp_replace(F.col("email"), r"(?<=^.).+(?=@)", "***"),
    )
)
df_masked_email.show(truncate=False)
print("Ex10 email masking done")

# 11. PII masking — phone
df_masked_phone = df_raw.withColumn(
    "phone_masked",
    F.regexp_replace(F.col("phone"), r"\d(?=\d{4})", "*")
)
df_masked_phone.select("customer_id","phone","phone_masked").show(truncate=False)
print("Ex11 phone masking done")

# 12. PII masking — name tokenisation
import hashlib
mask_name = F.udf(lambda n: hashlib.sha256(n.encode()).hexdigest()[:12] if n else None)
df_tokenised = df_raw.withColumn("name_token", mask_name(F.col("name")))
df_tokenised.select("customer_id","name","name_token").show(truncate=False)
print("Ex12 name tokenisation done")

# 13. Column tagging for PII (Unity Catalog)
print("""Ex13 Column tags in Unity Catalog:
  -- Apply PII tag to sensitive columns:
  ALTER TABLE prod.silver.customers
    ALTER COLUMN email   SET TAGS ('pii'='true', 'pii_category'='email');
  ALTER TABLE prod.silver.customers
    ALTER COLUMN phone   SET TAGS ('pii'='true', 'pii_category'='phone');

  -- Query all PII columns across all tables:
  SELECT table_catalog, table_schema, table_name, column_name, tag_value
  FROM system.information_schema.column_tags
  WHERE tag_name = 'pii' AND tag_value = 'true';
""")

# 14. Data classification levels
print("""Ex14 Data classification:
  PUBLIC:        no restriction (product names, public prices)
  INTERNAL:      employees only (internal metrics, org charts)
  CONFIDENTIAL:  need-to-know (customer names, order history)
  RESTRICTED:    regulated/PII (SSN, health, payment card)

  Enforce in Unity Catalog via:
    - Table-level tags: SET TAGS ('classification'='restricted')
    - Access policies per classification level
    - Alerts for untagged tables in gold/silver schemas
""")

# 15. Audit log query
print("""Ex15 Audit log (Unity Catalog system tables):
  -- Who accessed what tables in the last 7 days:
  SELECT user_name, action_name, object_type, object_name, event_time
  FROM system.access.audit
  WHERE event_time > current_timestamp() - INTERVAL 7 DAYS
    AND action_name IN ('SELECT','INSERT','DELETE','UPDATE')
  ORDER BY event_time DESC;

  -- Failed access attempts:
  SELECT user_name, action_name, object_name, error_message, event_time
  FROM system.access.audit
  WHERE event_time > current_timestamp() - INTERVAL 1 DAY
    AND response_error_message IS NOT NULL;
""")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Row-level security with dynamic views
print("""Ex16 Row-level security (Dynamic View):
  -- Create view that filters rows based on current_user():
  CREATE OR REPLACE VIEW prod.silver.orders_rls AS
  SELECT * FROM prod.silver.orders
  WHERE region = (
    SELECT region FROM prod.silver.user_region_map
    WHERE user_email = current_user()
  ) OR is_member('data-engineers');

  -- Grant view access to analysts (NOT the base table):
  GRANT SELECT ON VIEW prod.silver.orders_rls TO GROUP analysts;
  REVOKE SELECT ON TABLE prod.silver.orders   FROM GROUP analysts;
""")

# 17. Column-level security with dynamic views
print("""Ex17 Column masking (Dynamic View):
  CREATE OR REPLACE VIEW prod.silver.customers_masked AS
  SELECT
    customer_id,
    name,
    CASE WHEN is_member('pii-readers')
         THEN email
         ELSE regexp_replace(email, r'(?<=^.).+(?=@)', '***')
    END AS email,
    CASE WHEN is_member('pii-readers')
         THEN phone
         ELSE regexp_replace(phone, r'\\d(?=\\d{4})', '*')
    END AS phone
  FROM prod.silver.customers;

  -- Analysts see masked PII; pii-readers group see full data.
""")

# 18. Row filters and column masks (DBR 12.2+)
print("""Ex18 Row filters + Column masks (Unity Catalog):
  -- Row filter function:
  CREATE FUNCTION prod.silver.orders_region_filter(region STRING)
  RETURNS BOOLEAN
  RETURN is_member('data-engineers')
      OR current_user() IN (
           SELECT user_email FROM prod.config.user_regions WHERE user_region=region);

  -- Attach to table:
  ALTER TABLE prod.silver.orders
    SET ROW FILTER prod.silver.orders_region_filter ON (region);

  -- Column mask function:
  CREATE FUNCTION prod.silver.mask_email(email STRING)
  RETURNS STRING
  RETURN CASE WHEN is_member('pii-readers') THEN email
              ELSE regexp_replace(email, r'(?<=^.).+(?=@)', '***') END;

  ALTER TABLE prod.silver.customers
    ALTER COLUMN email SET MASK prod.silver.mask_email;
""")

# 19. Unity Catalog lineage
print("""Ex19 Data lineage (Unity Catalog):
  UC tracks column-level lineage automatically for:
    - Delta table reads/writes
    - Spark SQL operations
    - Python DataFrames (if registered as UC tables)

  Query lineage:
    SELECT * FROM system.access.table_lineage
    WHERE target_table_full_name = 'prod.gold.daily_revenue'
    ORDER BY event_time DESC;

  Visualise: Databricks UI → Catalog → table → Lineage tab.
  Use case: impact analysis before changing upstream silver tables.
""")

# 20. Encryption at rest
print("""Ex20 Encryption at rest:
  Cloud storage encryption (S3 / ADLS / GCS):
    - SSE-S3 (AWS-managed keys): default, no config needed
    - SSE-KMS (customer-managed KMS key): configure in cluster / DBFS mount
    - Azure Storage: service-managed or customer-managed keys

  Databricks workspace encryption:
    Cluster storage, control plane, logs → encrypted by default.
    Customer-managed keys (CMK): configure in workspace settings.

  DBR Delta encryption: data is encrypted at the storage layer (not Spark layer).
""")

# 21. Network security
print("""Ex21 Network security:
  VNet/VPC injection: deploy Databricks cluster nodes inside your VPC.
  No internet egress: worker nodes can't reach public internet.
  Private Link: Databricks control plane → worker VPC over private network.
  IP Access List: restrict access to Databricks UI/API by IP range.

  Best practice for prod:
    1. VNet injection (required for regulated workloads)
    2. Private endpoints for storage accounts
    3. IP Access List on workspace (allow only corporate IPs)
    4. Enable Private Link for control plane
""")

# 22. Secret scopes — best practice
print("""Ex22 Secret scopes:
  Scope per environment:
    dev-secrets     → dev credentials
    staging-secrets → staging credentials
    prod-secrets    → prod credentials (access restricted to prod SPs)

  Scope per team:
    de-secrets      → data engineering secrets
    ml-secrets      → ML platform secrets

  Assign ACLs on scopes:
    databricks secrets put-acl --scope prod-secrets --principal SP_orders_etl READ

  Audit: who accessed which secret, when.
""")

# 23. Token management
print("""Ex23 Personal Access Tokens (PAT):
  Used by: CLI, REST API, SDK clients.

  Best practices:
    - Service principals: use OAuth M2M tokens (auto-rotated), not PATs
    - Developers: PATs with short expiry (90 days)
    - Enforce token expiry via workspace settings
    - Revoke immediately on team departure
    - Rotate before expiry (set reminder 2 weeks before)

  Never embed PATs in:
    - Code repositories (git history is permanent)
    - Environment variables in cluster config (visible in UI)
    - Printed logs
""")

# 24. Compliance frameworks
print("""Ex24 Compliance frameworks:
  SOC 2 Type II:  security, availability, processing integrity, confidentiality
  ISO 27001:      information security management
  HIPAA:          health data in US — requires BAA with Databricks
  PCI DSS:        payment card data — must isolate in dedicated cluster
  GDPR / CCPA:    right to erasure requires Delta deletion vectors + VACUUM

  Databricks compliance: SOC2, ISO27001, HIPAA BAA, FedRAMP (GovCloud)
  Responsibility: YOU classify data; YOU configure access controls; Databricks secures infra.
""")

# 25. Right to erasure (GDPR Article 17)
print("""Ex25 Right to erasure in Delta:
  DELETE FROM prod.silver.customers WHERE customer_id = 'cust_xyz';
  DELETE FROM prod.silver.orders    WHERE customer_id = 'cust_xyz';

  After DELETE: data gone from current snapshot but still in time-travel history!
  To fully erase:
    VACUUM prod.silver.customers RETAIN 0 HOURS;  -- removes old file versions
    -- Repeat for all tables containing this customer's data.

  Delta Deletion Vectors (DBR 12.2+):
    Marks deleted rows without rewriting files → faster deletion + VACUUM later.
""")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 26. Table Access Control (legacy Hive)
print("""Ex26 Table ACL (Hive metastore — legacy):
  Works only on clusters with "Table Access Control" enabled.
  Applies per-cluster (not account-wide like UC).

  GRANT SELECT ON TABLE default.orders TO `alice@company.com`;
  GRANT MODIFY ON TABLE default.orders TO GROUP `de-team`;

  Limitation: no cross-workspace governance, no lineage, no column tags.
  Migration path: move all tables to Unity Catalog.
""")

# 27. Data masking with hash + salt
salt = "COMPANY_SECRET_SALT_2024"

df_hashed = df_raw.withColumn(
    "email_hashed",
    F.sha2(F.concat(F.col("email"), F.lit(salt)), 256)
)
df_hashed.select("customer_id","email","email_hashed").show(truncate=False)
print("Ex27 email hash+salt done (one-way, not reversible)")

# 28. Tokenisation vs encryption
print("""Ex28 Tokenisation vs Encryption:
  Encryption:    reversible with key. Store key in KMS. Needed for: data retrieval.
  Tokenisation:  one-way hash → token. Original NOT recoverable. Needed for: de-identification.

  Use encryption when: you need to display original value to authorised users (e.g., bank account).
  Use tokenisation when: you only need to JOIN across systems (customer_id token is consistent).

  Vault-based tokenisation: send PII to Vault, receive token; Vault maps token→PII securely.
""")

# 29. Column encryption in PySpark
print("""Ex29 Column-level encryption:
  # Using pyspark with Databricks Secrets:
  from cryptography.fernet import Fernet
  key   = dbutils.secrets.get('prod-secrets','fernet_key').encode()
  f     = Fernet(key)
  enc   = F.udf(lambda v: f.encrypt(v.encode()).decode() if v else None)
  dec   = F.udf(lambda v: f.decrypt(v.encode()).decode() if v else None)

  df_encrypted = df_raw.withColumn('email_enc', enc(F.col('email')))
  df_decrypted = df_encrypted.withColumn('email', dec(F.col('email_enc')))

  Warning: Python UDF adds overhead; use only for small PII tables.
""")

# 30. Unity Catalog external locations
print("""Ex30 External locations (Unity Catalog):
  Controls which cloud paths Databricks can access — managed by admins.

  CREATE EXTERNAL LOCATION prod_silver
  URL 's3://prod-datalake/silver'
  WITH (STORAGE CREDENTIAL prod_s3_cred);

  GRANT READ FILES, WRITE FILES ON EXTERNAL LOCATION prod_silver
    TO GROUP data-engineers;

  Effect: only storage credentials defined in UC external locations can be used.
  Prevents: ad-hoc access to arbitrary S3 paths by end users.
""")

# 31. Data products and contracts
print("""Ex31 Data contracts:
  A data contract is a formal agreement between producer (DE team) and consumer (Analytics/ML).

  Contract includes:
    - Schema: column names, types, nullability
    - SLAs: freshness (updated by 6 AM), completeness (>= 99.5%)
    - DQ rules: no negative amounts, no future dates
    - Versioning: breaking changes get new table name or version tag

  Enforce via:
    - Unity Catalog schema constraints + column tags
    - Great Expectations suites checked in CI
    - Schema Registry for streaming sources
""")

# 32. Shared responsibility model
print("""Ex32 Shared responsibility:
  Databricks (cloud provider responsibility):
    - Physical security of data centres
    - Network infrastructure
    - Hypervisor and host OS security
    - Control plane availability + encryption

  Customer (your responsibility):
    - Data classification and access controls
    - Secret management and rotation
    - Network configuration (VPC, firewall rules)
    - Identity management (who has access to what)
    - Compliance posture (GDPR, HIPAA, PCI)
    - Backup and disaster recovery planning
""")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 33. Attribute-based access control (ABAC)
print("""Ex33 ABAC with Unity Catalog:
  Combine row filters + column masks + group membership:

  Row filter: WHERE region = user's assigned region
  Column mask: PII visible only to pii-readers group
  Table tag: 'classification'='restricted' → auto-apply audit policy

  ABAC policy engine approach (advanced):
    - Custom policy table: user → allowed_regions, allowed_tables, allowed_pii_level
    - Row filter function reads policy table at query time
    - Fully dynamic, no code change when policy changes
""")

# 34. Immutable audit trail
print("""Ex34 Immutable audit:
  Delta append-only log: never delete audit records.
  Use Delta TBLPROPERTIES to block deletes:
    ALTER TABLE prod.audit.pipeline_runs SET TBLPROPERTIES (
      'delta.appendOnly' = 'true'
    );
  Attempts to DELETE/UPDATE raise AnalysisException.

  Combined with: write-once S3 bucket (Object Lock) → tamper-proof audit.
  Required for: SOC2, ISO27001, financial compliance.
""")

# 35. Data deletion with Delta Deletion Vectors
print("""Ex35 Deletion Vectors (DBR 12.2+):
  Traditional DELETE: rewrites entire Parquet files → slow for large tables.
  Deletion Vectors:   marks deleted rows in a sidecar file → no rewrite.

  Enable:
    ALTER TABLE prod.silver.customers SET TBLPROPERTIES (
      'delta.enableDeletionVectors' = 'true'
    );

  DELETE FROM prod.silver.customers WHERE customer_id = 'cust_xyz';
  → Instant: just writes a deletion vector file.

  VACUUM later removes the actual Parquet rows.
  MERGE with DVs: 5-10× faster on large tables vs traditional MERGE.
""")

# 36. Lakehouse monitoring for security
print("""Ex36 Security monitoring:
  Monitor for:
    - Unusual access patterns (user accessing 100× more tables than normal)
    - Off-hours access to PII tables (2 AM access to customers table)
    - Failed authentication spikes (brute force indicator)
    - Large data exports (SELECT * on large table → possible data exfiltration)

  Tools:
    - Unity Catalog system tables (system.access.audit)
    - Azure Sentinel / AWS GuardDuty / GCP Chronicle (SIEM integration)
    - Custom Databricks alerts (SQL alert on audit table)
""")

# 37. Zero-trust data access
print("""Ex37 Zero-trust principles for data:
  Never trust, always verify:
    1. Every query re-evaluated against current access policy (no cached permissions)
    2. Minimum privilege: each user/SP gets only what they need
    3. Short-lived credentials: OAuth tokens expire in 1h; SPs use M2M OAuth
    4. Assume breach: isolate sensitive schemas; log all access; alert on anomalies
    5. Encrypt in transit: all Databricks REST API calls use TLS 1.2+
""")

# 38. Secrets best practices in code
def get_secret_safely(scope: str, key: str):
    """Retrieve a secret. In Databricks, use dbutils.secrets.get()."""
    # In non-Databricks environment, read from OS env (for CI/CD testing):
    import os
    env_var = f"{scope.upper()}_{key.upper()}".replace("-","_")
    val = os.environ.get(env_var, "PLACEHOLDER")
    return val

db_pass = get_secret_safely("prod-secrets","db_password")
print(f"Ex38 secret retrieved (value hidden): {'*' * len(db_pass)}")

# 39. Data masking strategy per sensitivity level
def mask_value(value: str, sensitivity: str) -> str:
    """Apply masking based on data sensitivity level."""
    if not value:
        return value
    if sensitivity == "PUBLIC":
        return value
    if sensitivity == "INTERNAL":
        return value[:3] + "***"
    if sensitivity == "CONFIDENTIAL":
        return "***" + value[-2:] if len(value) > 2 else "***"
    if sensitivity == "RESTRICTED":
        return "[REDACTED]"
    return value

assert mask_value("alice@example.com", "PUBLIC")       == "alice@example.com"
assert mask_value("alice@example.com", "RESTRICTED")   == "[REDACTED]"
assert "***" in mask_value("alice@example.com", "CONFIDENTIAL")
print("Ex39 masking strategy tested")

# 40. Schema-level governance rules
print("""Ex40 Schema governance rules:
  bronze: append-only, schema-on-read, raw source data.
    → data-engineers: write; analysts: NO ACCESS (contains PII in raw form)

  silver: cleansed, PII masked, schema-on-write.
    → data-engineers: write; analysts: SELECT on non-PII views

  gold: aggregated, no PII, business metrics.
    → data-engineers: write; analysts + BI tools: SELECT

  NEVER: grant analysts SELECT directly on bronze.
  ALWAYS: separate raw PII from aggregate reporting layers.
""")

# 41. Databricks workspace separation
print("""Ex41 Workspace isolation:
  dev workspace:
    - All developers have access
    - No production data (use synthetic or anonymised data)
    - Cluster policies allow larger clusters for development

  staging workspace:
    - Access restricted to data engineers + QA
    - Uses production-like data (may be a subset)
    - Used for integration testing before prod deploy

  prod workspace:
    - Access via service principals only (no human notebook access)
    - Only read access for BI tools (SQL Warehouse)
    - Strict cluster policies (spot + auto-termination + cost tags)
""")

# 42. Compliance audit evidence
print("""Ex42 Audit evidence generation:
  For GDPR/SOC2/ISO27001 audits, demonstrate:
    1. Data classification: show tag policy on all tables
    2. Access control: SHOW GRANTS on PII tables
    3. Audit log: query system.access.audit for access records
    4. Deletion evidence: Delta DESCRIBE HISTORY showing DELETE operations
    5. Encryption: storage configuration screenshots (SSE-KMS enabled)
    6. Secret management: Vault/Secrets config showing rotation policy
    7. Network isolation: VNet configuration + private endpoint screenshots
""")

# 43. Dynamic data masking with is_member()
print("""Ex43 is_member() for dynamic access:
  Built-in Unity Catalog function:
    is_member('group-name')  → True if current_user() is in that group

  Use in views and row filters:
    SELECT customer_id,
           CASE WHEN is_member('pii-readers') THEN email ELSE '***@***.com' END AS email
    FROM silver.customers;

  Group management: sync from Entra ID / Okta → Databricks groups.
  When user leaves team → remove from group → instantly loses access.
""")

# 44. Data contracts enforcement via CI
print("""Ex44 Schema contract CI enforcement:
  In CI pipeline (GitHub Actions):
    1. On every PR that changes a silver/gold table:
       a. Run schema contract test (expected cols + types)
       b. Run DQ tests (null rates, value ranges, referential integrity)
    2. Block merge if any contract test fails
    3. Notify data consumers (Slack/Teams) of approved schema changes

  Tool: pytest + chispa + Great Expectations suite in git.
  Contract version: bump version tag on breaking changes; old version stays until consumers migrate.
""")

# 45. Unity Catalog system tables
print("""Ex45 System tables (UC):
  system.access.audit          → all access events
  system.access.table_lineage  → column-level data lineage
  system.information_schema.*  → table/column/constraint metadata
  system.billing.usage         → DBU consumption per resource

  Power queries:
    -- Tables with no access in 30 days (zombie tables):
    SELECT t.table_name
    FROM information_schema.tables t
    LEFT JOIN system.access.audit a
      ON a.object_name = t.table_full_name
      AND a.event_time > current_date() - INTERVAL 30 DAYS
    WHERE a.object_name IS NULL;
""")

# 46. Private connectivity patterns
print("""Ex46 Private connectivity:
  Storage (S3/ADLS):  use S3 VPC endpoint / ADLS private endpoint
  Databricks:         Private Link for control plane
  External DB:        VPC peering or Transit Gateway to DB subnet
  Kafka/Event Hubs:   private endpoint on Event Hubs namespace

  Result: ALL data movement stays within private network.
  No data crosses public internet → meets strict network security requirements.
""")

# 47. Key rotation procedure
print("""Ex47 Key rotation:
  1. Generate new secret (new Fernet key, new DB password, new API token)
  2. Store in Databricks Secrets under a versioned name:
       prod-secrets/db_password_v2
  3. Update pipeline config to use _v2 key
  4. Deploy and verify pipeline runs with new key
  5. Delete old secret:
       databricks secrets delete --scope prod-secrets --key db_password_v1
  6. Log rotation event in audit log with timestamp + rotated_by user

  Automate: schedule rotation job every 90 days.
""")

# 48. Prevent SQL injection in parameterised notebooks
print("""Ex48 SQL injection prevention:
  UNSAFE: f"SELECT * FROM {user_input}"  ← user controls table name → injection

  SAFE approaches:
    1. Allowlist: validate user_input against known table names
       allowed_tables = {'orders', 'products', 'customers'}
       assert user_input in allowed_tables, "Table not allowed"
       spark.sql(f"SELECT * FROM {user_input}")  # now safe

    2. Use spark.table() for dynamic table access:
       spark.table(f"prod.silver.{validated_table_name}")

    3. Parameterise via widget (Databricks widget = sanitised input):
       dbutils.widgets.get("table_name")  → always a string, no SQL execution
""")

# 49. Data loss prevention (DLP)
print("""Ex49 Data Loss Prevention:
  Prevent sensitive data from leaving the platform:
    1. Egress controls: VNet rules block data export to non-approved destinations
    2. Export audit: alert when > N rows downloaded by a single user in a day
    3. Column-level prevention: restrict SELECT on CC/SSN columns to specific roles
    4. File download limits: SQL Warehouse download size limit
    5. Watermarking: embed invisible markers in exported datasets to trace leaks

  System: Microsoft Purview (Azure) / Macie (AWS) + Databricks audit integration.
""")

# 50. Security & governance checklist
print("""Ex50 Security & governance checklist:
  Identity & Access:
    ✓ Unity Catalog enabled (not Hive metastore)
    ✓ Grants to groups, not individuals
    ✓ Service principals per pipeline (least privilege)
    ✓ OAuth M2M for service-to-service (not PATs)
    ✓ PAT expiry enforced (< 90 days)

  Data protection:
    ✓ All PII columns tagged in Unity Catalog
    ✓ PII masked in silver (dynamic views or column masks)
    ✓ Gold layer: no direct PII (only aggregates or tokens)
    ✓ Secrets in Databricks Secrets (never in code)
    ✓ Encryption at rest (SSE-KMS or CMK)

  Network:
    ✓ VNet injection for all production clusters
    ✓ Private endpoints for storage and control plane
    ✓ IP Access List on workspace

  Audit & compliance:
    ✓ Unity Catalog audit enabled (system.access.audit)
    ✓ Audit table append-only (delta.appendOnly=true)
    ✓ GDPR erasure procedure documented + tested
    ✓ Monthly access review per table
    ✓ Key rotation schedule in place
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
