# ============================================================================
# Exercise 3.4 — Unity Catalog
# ============================================================================
# NOTE: UC requires Databricks. These exercises test SQL knowledge.
#       Fill in the blanks with the correct SQL/Python commands.
# ============================================================================

# ---------------------------------------------------------------------------
# 1. Write the SQL to create a catalog named "company_data"
# ---------------------------------------------------------------------------
sql_1 = None  # replace with string SQL command

assert sql_1 is not None
assert "CREATE CATALOG" in sql_1.upper()
assert "company_data" in sql_1

# ---------------------------------------------------------------------------
# 2. Write the SQL to create a schema "finance" in "company_data"
# ---------------------------------------------------------------------------
sql_2 = None  # replace with string SQL

assert "CREATE SCHEMA" in sql_2.upper()
assert "company_data.finance" in sql_2

# ---------------------------------------------------------------------------
# 3. Write the SQL to create a Delta managed table company_data.finance.transactions
#    with columns: txn_id BIGINT, date DATE, amount DOUBLE, region STRING
# ---------------------------------------------------------------------------
sql_3 = None  # replace with string SQL

assert "CREATE TABLE" in sql_3.upper()
assert "company_data.finance.transactions" in sql_3
assert "DELTA" in sql_3.upper() or "USING DELTA" in sql_3.upper()

# ---------------------------------------------------------------------------
# 4. Write the SQL to GRANT SELECT on company_data.finance.transactions to `analysts`
# ---------------------------------------------------------------------------
sql_4 = None  # replace with string SQL

assert "GRANT" in sql_4.upper()
assert "SELECT" in sql_4.upper()
assert "analysts" in sql_4

# ---------------------------------------------------------------------------
# 5. Write the SQL to show all tables in company_data.finance
# ---------------------------------------------------------------------------
sql_5 = None  # replace with string SQL

assert "SHOW TABLES" in sql_5.upper()
assert "company_data.finance" in sql_5

# ---------------------------------------------------------------------------
# 6. Write the SQL to add a tag 'domain'='finance' to the transactions table
# ---------------------------------------------------------------------------
sql_6 = None  # replace with string SQL

assert "SET TAGS" in sql_6.upper()
assert "domain" in sql_6

# ---------------------------------------------------------------------------
# 7. Write the SQL to describe the history of company_data.finance.transactions
# ---------------------------------------------------------------------------
sql_7 = None  # replace with string SQL

assert "DESCRIBE HISTORY" in sql_7.upper()
assert "company_data.finance.transactions" in sql_7

# ---------------------------------------------------------------------------
# 8. Write the path pattern for a UC volume "raw_files" in company_data.finance
# ---------------------------------------------------------------------------
volume_path = None  # replace with string path

assert volume_path is not None
assert volume_path.startswith("/Volumes/")
assert "company_data" in volume_path
assert "finance" in volume_path
assert "raw_files" in volume_path

# ---------------------------------------------------------------------------
# 9. Write the SQL to revoke MODIFY from `junior_etl` on the transactions table
# ---------------------------------------------------------------------------
sql_9 = None  # replace with string SQL

assert "REVOKE" in sql_9.upper()
assert "MODIFY" in sql_9.upper()
assert "junior_etl" in sql_9

# ---------------------------------------------------------------------------
# 10. Write the SQL query to list all PII-tagged columns across company_data catalog
#     (query information_schema.columns with appropriate filter)
# ---------------------------------------------------------------------------
sql_10 = None  # replace with string SQL

assert "information_schema" in sql_10.lower()
assert "columns" in sql_10.lower()
assert "pii" in sql_10.lower() or "tag" in sql_10.lower()

print("All assertions passed! Unity Catalog SQL patterns verified.")
