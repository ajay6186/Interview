# ============================================================================
# Solution 3.4 — Unity Catalog
# ============================================================================

# 1. Create catalog
sql_1 = "CREATE CATALOG IF NOT EXISTS company_data"
assert "CREATE CATALOG" in sql_1.upper() and "company_data" in sql_1

# 2. Create schema
sql_2 = "CREATE SCHEMA IF NOT EXISTS company_data.finance COMMENT 'Finance domain data'"
assert "CREATE SCHEMA" in sql_2.upper() and "company_data.finance" in sql_2

# 3. Create table
sql_3 = """
CREATE TABLE IF NOT EXISTS company_data.finance.transactions (
    txn_id  BIGINT,
    date    DATE,
    amount  DOUBLE,
    region  STRING
) USING DELTA COMMENT 'Finance transactions fact table'
"""
assert "CREATE TABLE" in sql_3.upper() and "company_data.finance.transactions" in sql_3

# 4. Grant select
sql_4 = "GRANT SELECT ON TABLE company_data.finance.transactions TO `analysts`"
assert "GRANT" in sql_4.upper() and "SELECT" in sql_4.upper() and "analysts" in sql_4

# 5. Show tables
sql_5 = "SHOW TABLES IN company_data.finance"
assert "SHOW TABLES" in sql_5.upper() and "company_data.finance" in sql_5

# 6. Set tags
sql_6 = "ALTER TABLE company_data.finance.transactions SET TAGS ('domain'='finance')"
assert "SET TAGS" in sql_6.upper() and "domain" in sql_6

# 7. Describe history
sql_7 = "DESCRIBE HISTORY company_data.finance.transactions"
assert "DESCRIBE HISTORY" in sql_7.upper() and "company_data.finance.transactions" in sql_7

# 8. Volume path
volume_path = "/Volumes/company_data/finance/raw_files"
assert volume_path.startswith("/Volumes/") and "company_data" in volume_path

# 9. Revoke
sql_9 = "REVOKE MODIFY ON TABLE company_data.finance.transactions FROM `junior_etl`"
assert "REVOKE" in sql_9.upper() and "MODIFY" in sql_9.upper()

# 10. Information schema PII query
sql_10 = """
SELECT table_schema, table_name, column_name, tag_value
FROM company_data.information_schema.columns
WHERE tag_name = 'pii' AND tag_value = 'true'
"""
assert "information_schema" in sql_10.lower() and "columns" in sql_10.lower()

print("All assertions passed! Unity Catalog SQL patterns verified.")
