# ============================================================================
# Examples 3.4 — Unity Catalog  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================
# NOTE: Unity Catalog requires Databricks workspace with UC enabled.
#       These examples show the patterns and SQL commands.
#       Run in a Databricks notebook on a UC-enabled cluster.
# ============================================================================

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Three-level namespace: catalog.schema.table
print("Ex01 UC namespace: catalog.schema.table (e.g., my_catalog.analytics.sales)")

# 2. Create catalog
# spark.sql("CREATE CATALOG IF NOT EXISTS my_catalog")
print("Ex02 CREATE CATALOG my_catalog")

# 3. Use catalog
# spark.sql("USE CATALOG my_catalog")
print("Ex03 USE CATALOG my_catalog")

# 4. Create schema (database)
# spark.sql("CREATE SCHEMA IF NOT EXISTS my_catalog.analytics COMMENT 'Analytics schema'")
print("Ex04 CREATE SCHEMA my_catalog.analytics")

# 5. Create managed Delta table
# spark.sql("""
#     CREATE TABLE IF NOT EXISTS my_catalog.analytics.sales (
#         id BIGINT, date DATE, amount DOUBLE, region STRING
#     ) USING DELTA COMMENT 'Sales fact table'
# """)
print("Ex05 CREATE TABLE my_catalog.analytics.sales USING DELTA")

# 6. Create external table (data in cloud storage)
# spark.sql("""
#     CREATE TABLE IF NOT EXISTS my_catalog.analytics.raw_events
#     USING DELTA LOCATION 'abfss://container@account.dfs.core.windows.net/raw/events'
# """)
print("Ex06 CREATE TABLE ... LOCATION '...' (external table)")

# 7. List catalogs
# spark.sql("SHOW CATALOGS").show()
print("Ex07 SHOW CATALOGS")

# 8. List schemas
# spark.sql("SHOW SCHEMAS IN my_catalog").show()
print("Ex08 SHOW SCHEMAS IN my_catalog")

# 9. List tables
# spark.sql("SHOW TABLES IN my_catalog.analytics").show()
print("Ex09 SHOW TABLES IN my_catalog.analytics")

# 10. Describe table
# spark.sql("DESCRIBE TABLE my_catalog.analytics.sales").show()
print("Ex10 DESCRIBE TABLE my_catalog.analytics.sales")

# 11. Read table with full name
# df = spark.table("my_catalog.analytics.sales")
# df = spark.sql("SELECT * FROM my_catalog.analytics.sales")
print("Ex11 read: spark.table('catalog.schema.table')")

# 12. Write to managed table
# df.write.mode("append").saveAsTable("my_catalog.analytics.sales")
print("Ex12 write: df.write.saveAsTable('catalog.schema.table')")

# 13. ALTER TABLE — add column
# spark.sql("ALTER TABLE my_catalog.analytics.sales ADD COLUMN discount DOUBLE")
print("Ex13 ALTER TABLE ... ADD COLUMN discount DOUBLE")

# 14. ALTER TABLE — set comment
# spark.sql("ALTER TABLE my_catalog.analytics.sales ALTER COLUMN amount COMMENT 'Total sale amount in USD'")
print("Ex14 ALTER COLUMN ... COMMENT")

# 15. DROP TABLE
# spark.sql("DROP TABLE IF EXISTS my_catalog.analytics.temp_table")
print("Ex15 DROP TABLE IF EXISTS")

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. GRANT — give permissions
# spark.sql("GRANT SELECT ON TABLE my_catalog.analytics.sales TO `data_analysts`")
# spark.sql("GRANT MODIFY ON TABLE my_catalog.analytics.sales TO `etl_service_principal`")
print("Ex16 GRANT SELECT ON TABLE ... TO `group`")

# 17. GRANT schema-level
# spark.sql("GRANT USE SCHEMA ON SCHEMA my_catalog.analytics TO `data_scientists`")
print("Ex17 GRANT USE SCHEMA ON SCHEMA ...")

# 18. GRANT catalog-level
# spark.sql("GRANT USE CATALOG ON CATALOG my_catalog TO `all_users`")
print("Ex18 GRANT USE CATALOG ON CATALOG ...")

# 19. REVOKE permission
# spark.sql("REVOKE SELECT ON TABLE my_catalog.analytics.sales FROM `interns`")
print("Ex19 REVOKE SELECT ... FROM `group`")

# 20. SHOW GRANTS
# spark.sql("SHOW GRANTS ON TABLE my_catalog.analytics.sales").show()
print("Ex20 SHOW GRANTS ON TABLE")

# 21. Column-level security (column masking)
# spark.sql("""
#     ALTER TABLE my_catalog.analytics.customers
#     ALTER COLUMN email SET MASK mask_email USING COLUMNS (email)
# """)
print("Ex21 Column masking: ALTER COLUMN ... SET MASK")

# 22. Row-level security (row filters)
# spark.sql("""
#     ALTER TABLE my_catalog.analytics.sales
#     SET ROW FILTER filter_by_region ON (region)
# """)
print("Ex22 Row filters: SET ROW FILTER ... ON (column)")

# 23. Data lineage
# spark.sql("DESCRIBE HISTORY my_catalog.analytics.sales").show()
# UC automatically tracks lineage: which table was created FROM which source
print("Ex23 Data lineage: tracked automatically in UC — view in Catalog Explorer")

# 24. Tags on tables/columns
# spark.sql("ALTER TABLE my_catalog.analytics.sales SET TAGS ('pii'='false','domain'='sales')")
print("Ex24 Table tags: ALTER TABLE ... SET TAGS ('key'='value')")

# 25. Tags on columns
# spark.sql("ALTER TABLE my_catalog.analytics.customers ALTER COLUMN email SET TAGS ('pii'='true')")
print("Ex25 Column tags: ALTER COLUMN ... SET TAGS ('pii'='true')")

# 26. INFORMATION_SCHEMA — query metadata
# spark.sql("SELECT * FROM my_catalog.information_schema.tables").show()
print("Ex26 information_schema.tables — lists all tables with metadata")

# 27. INFORMATION_SCHEMA — columns
# spark.sql("SELECT * FROM my_catalog.information_schema.columns WHERE table_name='sales'").show()
print("Ex27 information_schema.columns — column metadata")

# 28. Table owner
# spark.sql("ALTER TABLE my_catalog.analytics.sales OWNER TO `etl_team`")
print("Ex28 ALTER TABLE ... OWNER TO `group`")

# 29. UC volumes — manage unstructured data
# spark.sql("CREATE VOLUME IF NOT EXISTS my_catalog.analytics.raw_files")
print("Ex29 CREATE VOLUME — manage files/images/unstructured data in UC")

# 30. Read/write from volume
# df = spark.read.json("/Volumes/my_catalog/analytics/raw_files/events/")
print("Ex30 /Volumes/catalog/schema/volume/path — UC volume path")

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Metastore assignment
print("Ex31 UC metastore: one per region; assigned to one or more Databricks workspaces")

# 32. Service principal as data owner
print("Ex32 Service principal: GRANT permissions to service principal for automated ETL")

# 33. Attribute-based access control (ABAC)
print("Ex33 ABAC: combine row/column filters with dynamic group membership for fine-grained access")

# 34. Data masking functions
print("""
Ex34 Built-in masking functions:
  - mask_email(email)     → a***@domain.com
  - mask_ssn(ssn)         → XXX-XX-1234
  - Custom: CREATE FUNCTION my_catalog.analytics.mask_cc(cc STRING) RETURNS STRING ...
""")

# 35. Dynamic views for data masking (alternative to column masking)
print("""
Ex35 Dynamic view pattern:
  CREATE VIEW my_catalog.analytics.v_customers AS
  SELECT id,
         CASE WHEN is_member('data_admins') THEN email
              ELSE concat(left(email,2), '***@', split(email,'@')[1]) END AS email
  FROM my_catalog.analytics.customers
""")

# 36. External locations
print("""
Ex36 External location:
  CREATE EXTERNAL LOCATION my_adls
    URL 'abfss://container@account.dfs.core.windows.net'
    WITH (STORAGE CREDENTIAL my_credential)
  → Grants controlled access to cloud storage paths
""")

# 37. Storage credentials
print("""
Ex37 Storage credential:
  CREATE STORAGE CREDENTIAL my_credential
    WITH (AZURE_MANAGED_IDENTITY = (CREDENTIAL = my_mi))
  → Databricks uses managed identity to access cloud storage
""")

# 38. Audit logs
print("""
Ex38 UC audit logs:
  - Delivered to cloud storage (ADLS/S3/GCS)
  - Log every access event: who, what table, when, from where
  - Query via spark.read.json(audit_log_path)
""")

# 39. Delta Sharing via UC
print("""
Ex39 Delta Sharing in UC:
  CREATE SHARE my_share;
  ALTER SHARE my_share ADD TABLE my_catalog.analytics.sales;
  CREATE RECIPIENT external_partner USING ID 'partner-id';
  GRANT SELECT ON SHARE my_share TO RECIPIENT external_partner;
""")

# 40. UC API (Python SDK)
print("""
Ex40 Databricks SDK:
  from databricks.sdk import WorkspaceClient
  w = WorkspaceClient()
  tables = w.tables.list(catalog_name="my_catalog", schema_name="analytics")
""")

# 41. Model registry in UC (MLflow)
print("""
Ex41 Models in UC:
  mlflow.register_model(run_uri, "my_catalog.ml.my_model")
  model = mlflow.pyfunc.load_model("models:/my_catalog.ml.my_model/1")
""")

# 42. Feature store in UC
print("""
Ex42 Feature Engineering in UC:
  from databricks.feature_store import FeatureStoreClient
  fs = FeatureStoreClient()
  fs.create_table("my_catalog.ml.user_features", df=feature_df, primary_keys=["user_id"])
""")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Hive metastore migration to UC
print("""
Ex43 HMS → UC migration:
  1. Use SYNC command to migrate tables
  2. CONVERT TO DELTA for Parquet tables
  3. Recreate permissions in UC (GRANT statements)
  4. Update notebook references to three-part names
""")

# 44. Cross-workspace data sharing (via UC)
print("Ex44 UC is shared across workspaces in a region; tables accessible from any attached workspace")

# 45. Databricks-to-Databricks sharing (Delta Sharing)
print("Ex45 D2D sharing: recipient workspace reads shared table via Delta Sharing protocol; no data copy")

# 46. INFORMATION_SCHEMA queries for governance reporting
print("""
Ex46 Governance report:
  SELECT table_catalog, table_schema, table_name, table_type,
         created_by, last_altered_by
  FROM my_catalog.information_schema.tables
  WHERE table_type = 'BASE TABLE'
""")

# 47. PII classification with tags
print("""
Ex47 PII workflow:
  1. Tag columns with pii=true
  2. Query information_schema to find all PII columns
  3. Apply column masking functions to tagged columns
  4. Audit via audit logs who accessed PII data
""")

# 48. Vacuum protection in UC
print("Ex48 UC prevents accidental VACUUM of external tables; managed tables always safe to VACUUM")

# 49. UC catalog-level backup
print("Ex49 UC managed tables: backed by cloud storage; implement backup via DEEP CLONE + schedule")

# 50. Unity Catalog governance summary
print("""
Ex50 Unity Catalog Key Features:
  ✓ Three-level namespace (catalog.schema.table)
  ✓ Fine-grained access control (table, column, row level)
  ✓ Automatic data lineage tracking
  ✓ Delta Sharing for cross-org/cross-cloud sharing
  ✓ Audit logging for compliance
  ✓ Column masking + row filters for PII
  ✓ Volumes for unstructured data
  ✓ MLflow model registry integration
  ✓ Feature Store integration
  ✓ Cross-workspace data sharing
""")
