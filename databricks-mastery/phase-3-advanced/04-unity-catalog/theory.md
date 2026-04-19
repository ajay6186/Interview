# Theory: Unity Catalog

## What is Unity Catalog?

Unity Catalog (UC) is Databricks' unified governance layer for data and AI — providing centralized access control, audit logging, data lineage, and discovery across all Databricks workspaces.

```
Unity Catalog Hierarchy:

Metastore (one per region — attached to multiple workspaces)
  └── Catalog (logical namespace — one per project/environment)
       └── Schema (= Database)
            ├── Table (managed or external)
            ├── View
            ├── Volume (unstructured files)
            └── Function (UDFs)
```

---

## Three-Level Namespace

```sql
-- catalog.schema.table  (fully qualified)
SELECT * FROM prod_catalog.sales.orders;

-- Set default catalog and schema to use short names
USE CATALOG prod_catalog;
USE SCHEMA sales;
SELECT * FROM orders;   -- resolves to prod_catalog.sales.orders

-- Create objects in each level
CREATE CATALOG dev_catalog;
CREATE SCHEMA dev_catalog.analytics;
CREATE TABLE dev_catalog.analytics.metrics (...) USING DELTA;
```

---

## Managed vs External Tables

```sql
-- MANAGED: UC owns the data files (stored in UC-managed location)
-- Dropping the table drops the data
CREATE TABLE prod_catalog.sales.orders (
    id BIGINT, amount DOUBLE, status STRING
) USING DELTA;

-- EXTERNAL: UC registers the table; data lives in customer-controlled storage
-- Dropping the table does NOT drop the data
CREATE TABLE prod_catalog.sales.orders_ext
USING DELTA
LOCATION 's3://my-bucket/delta/orders';
```

| | Managed | External |
|--|---------|----------|
| Data location | UC-managed storage | Customer storage |
| Drop behavior | Drops data | Metadata only |
| Governance | Full UC | Full UC |
| Best for | New tables | Migrating existing |

---

## Grants and RBAC

```sql
-- Grant privileges
GRANT SELECT ON TABLE prod_catalog.sales.orders TO analyst_group;
GRANT SELECT, MODIFY ON TABLE prod_catalog.sales.orders TO data_engineer;
GRANT ALL PRIVILEGES ON SCHEMA prod_catalog.analytics TO team_lead;
GRANT USE CATALOG ON CATALOG prod_catalog TO `user@company.com`;

-- Revoke
REVOKE SELECT ON TABLE prod_catalog.sales.orders FROM analyst_group;

-- Show grants
SHOW GRANTS ON TABLE prod_catalog.sales.orders;
SHOW GRANTS ON SCHEMA prod_catalog.sales;

-- Privilege hierarchy (grant USE CATALOG before USE SCHEMA before table access)
GRANT USE CATALOG ON CATALOG prod_catalog TO analyst_group;
GRANT USE SCHEMA ON SCHEMA prod_catalog.sales TO analyst_group;
GRANT SELECT ON TABLE prod_catalog.sales.orders TO analyst_group;
```

**UC Privilege hierarchy**: Metastore Admin > Catalog Owner > Schema Owner > Table Owner > Granted privileges.

---

## Row-Level Security (RLS)

Implemented via **dynamic views** that filter rows based on the current user:

```sql
-- Create a view that filters by user's region
CREATE OR REPLACE VIEW prod_catalog.sales.orders_rls AS
SELECT * FROM prod_catalog.sales.orders_raw
WHERE region IN (
    SELECT region FROM prod_catalog.access.user_region_map
    WHERE user_email = current_user()
);

-- Grant access to the VIEW (not the raw table)
GRANT SELECT ON VIEW prod_catalog.sales.orders_rls TO analyst_group;
-- Do NOT grant SELECT on prod_catalog.sales.orders_raw to analyst_group
```

---

## Column Masking

```sql
-- Mask PII columns in a view
CREATE OR REPLACE VIEW prod_catalog.sales.customers_masked AS
SELECT
    customer_id,
    CASE WHEN is_member('pii_readers') THEN email
         ELSE regexp_replace(email, '(^[^@]+)', repeat('*', length(regexp_extract(email,'(^[^@]+)',1))))
    END AS email,
    CASE WHEN is_member('pii_readers') THEN phone
         ELSE concat('***-***-', right(phone, 4))
    END AS phone,
    region,
    created_at
FROM prod_catalog.sales.customers_raw;
```

---

## Data Lineage

UC automatically tracks lineage at the column level — which table/column was used to compute each output column.

```python
# View lineage in Databricks UI: Data Explorer > table > Lineage tab
# Programmatic access via REST API or lineage_graph SQL function

# Lineage is captured for:
# - SQL queries
# - PySpark DataFrame operations
# - Notebooks, Jobs, DLT pipelines
```

---

## Volumes

Volumes manage unstructured files (images, CSVs, binary data) under UC governance:

```sql
-- Create a volume
CREATE VOLUME prod_catalog.sales.raw_files
COMMENT 'Landing zone for raw CSV files';

-- Upload files via Databricks UI or CLI
-- Access in Python
df = spark.read.csv("/Volumes/prod_catalog/sales/raw_files/orders.csv")

-- Or in SQL
SELECT * FROM read_files('/Volumes/prod_catalog/sales/raw_files/orders.csv', format => 'csv')
```

---

## Tags (Data Classification)

```sql
-- Tag a table
ALTER TABLE prod_catalog.sales.orders
SET TAGS ('pii' = 'false', 'team' = 'data-eng', 'sla' = 'tier1');

-- Tag a column
ALTER TABLE prod_catalog.sales.customers
ALTER COLUMN email SET TAGS ('pii' = 'true', 'classification' = 'restricted');

-- Query tags
SELECT * FROM system.information_schema.column_tags
WHERE catalog_name = 'prod_catalog' AND table_name = 'customers';
```

---

## System Tables (Audit & Billing)

```python
# Audit logs — all access events
spark.sql("""
SELECT user_identity.email, event_type, request_params.table_full_name, event_date
FROM system.access.audit
WHERE event_date = current_date()
  AND event_type = 'databricks.unityCatalog.table.read'
ORDER BY event_date DESC
""")

# Billing usage
spark.sql("""
SELECT workspace_id, sku_name, SUM(dbu_quantity) AS total_dbus
FROM system.billing.usage
WHERE usage_date >= dateadd(day, -30, current_date())
GROUP BY 1, 2
ORDER BY total_dbus DESC
""")
```

---

## Common Interview Questions

**Q: What is Unity Catalog and what problems does it solve?**  
A: Unity Catalog is Databricks' unified governance solution providing: (1) centralized access control with ANSI SQL GRANT/REVOKE across all workspaces, (2) column-level lineage tracking, (3) data discovery via a searchable catalog, (4) audit logs for compliance, (5) fine-grained access control to tables, views, volumes, and functions.

**Q: What is the three-level namespace in Unity Catalog?**  
A: `catalog.schema.table`. A Catalog is the top-level namespace (per project/environment). Schemas (databases) group related tables. Tables are the leaves. Users must be granted USE CATALOG, USE SCHEMA, and then table-level privileges in order.

**Q: How do you implement row-level security in Unity Catalog?**  
A: Create a dynamic view that filters rows using `current_user()` or `is_member()` functions. Grant SELECT on the view (not the raw table) to users. The view evaluates per-query so each user sees only their allowed rows.

**Q: What is the difference between a managed table and an external table in UC?**  
A: Managed tables: UC controls data files; dropping the table deletes the data. External tables: data lives in customer-controlled storage; dropping the table removes only the metadata. External tables are used when migrating existing data or when multiple systems need direct storage access.

**Q: What is a Volume in Unity Catalog?**  
A: A Volume is a UC object that manages unstructured files (CSVs, images, binaries) under UC governance. Files in a Volume are accessible at `/Volumes/catalog/schema/volume_name/` from notebooks, jobs, and SQL. You can apply tags, grants, and lineage to Volumes just like tables.

---

## Quick Reference

```sql
-- Namespace
USE CATALOG prod_catalog;
USE SCHEMA sales;

-- Object creation
CREATE CATALOG dev;
CREATE SCHEMA dev.analytics;
CREATE TABLE dev.analytics.t (...) USING DELTA;
CREATE TABLE dev.analytics.t_ext USING DELTA LOCATION 's3://bucket/path';

-- Grants
GRANT USE CATALOG ON CATALOG prod TO group1;
GRANT USE SCHEMA ON SCHEMA prod.sales TO group1;
GRANT SELECT ON TABLE prod.sales.orders TO group1;
GRANT SELECT, MODIFY ON TABLE prod.sales.orders TO data_engineers;
REVOKE SELECT ON TABLE prod.sales.orders FROM group1;
SHOW GRANTS ON TABLE prod.sales.orders;

-- RLS view
CREATE VIEW orders_rls AS
SELECT * FROM orders_raw WHERE region IN (
  SELECT region FROM user_map WHERE user_email = current_user()
);

-- Tags
ALTER TABLE t SET TAGS ('pii' = 'true');
ALTER TABLE t ALTER COLUMN email SET TAGS ('classification' = 'restricted');

-- Volume
CREATE VOLUME catalog.schema.vol;
df = spark.read.csv("/Volumes/catalog/schema/vol/file.csv")

-- Audit
SELECT * FROM system.access.audit WHERE event_date = current_date();
```
