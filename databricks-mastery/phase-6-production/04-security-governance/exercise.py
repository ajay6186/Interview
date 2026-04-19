# ============================================================================
# Exercise 6.4 — Security & Governance
# ============================================================================
# Practice: PII masking, data classification, schema contract validation,
# secret-safe patterns, audit log helpers, and row/column filtering logic.
#
# Instructions: Replace every None / "TODO" so assertions pass.
# Run with: python exercise.py  (requires PySpark installed)
# ============================================================================

import hashlib, re
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder \
    .appName("security-governance-exercise") \
    .getOrCreate()
spark.sparkContext.setLogLevel("WARN")

raw_customers = spark.createDataFrame([
    ("cust_01", "Alice Smith",  "alice.smith@example.com",  "+1-555-100-0001", "12345"),
    ("cust_02", "Bob Jones",    "bob.jones@company.org",    "+44-20-7946-001", "67890"),
    ("cust_03", "Carol Wu",     "carol@email.net",          "+1-555-200-0002", "11111"),
    ("cust_04",  None,          None,                       None,              None),
], ["customer_id", "name", "email", "phone", "zip_code"])

# ---------------------------------------------------------------------------
# 1. PII masking — email
# ---------------------------------------------------------------------------

# TODO: Add column "email_masked" to raw_customers:
#       - For non-null emails: keep the first character, replace everything
#         before the @ with "***", e.g. "alice.smith@example.com" → "a***@example.com"
#       - For null emails: leave as null
# HINT: Use F.regexp_replace and F.when

df_email_masked = None  # replace

assert df_email_masked is not None,                "df_email_masked must not be None"
assert "email_masked" in df_email_masked.columns,  "Must have email_masked column"

emails = {r["email_masked"] for r in df_email_masked.select("email_masked").collect() if r["email_masked"]}
assert any("***@" in e for e in emails),    f"Masked emails should contain ***@, got {emails}"
assert any("a***@" in e for e in emails),   f"Expected 'a***@example.com' pattern, got {emails}"
# Null row should remain null
null_masked = df_email_masked.filter(F.col("customer_id") == "cust_04").select("email_masked").collect()[0][0]
assert null_masked is None, f"Null email should remain null, got {null_masked}"

# ---------------------------------------------------------------------------
# 2. PII masking — phone
# ---------------------------------------------------------------------------

# TODO: Add column "phone_masked" to raw_customers:
#       - For non-null phones: replace all digits EXCEPT the last 4 with "*"
#         e.g. "+1-555-100-0001" → "*-***-***-0001"
#       - For null phones: leave as null
# HINT: F.regexp_replace(col, pattern, "*")

df_phone_masked = None  # replace

assert df_phone_masked is not None,               "df_phone_masked must not be None"
assert "phone_masked" in df_phone_masked.columns, "Must have phone_masked column"

phones = {r["phone_masked"] for r in df_phone_masked.select("phone_masked").collect() if r["phone_masked"]}
for p in phones:
    digits_visible = re.findall(r"\d", p)
    assert len(digits_visible) <= 4, \
        f"At most 4 digits should be visible in masked phone, got {len(digits_visible)} in '{p}'"

# ---------------------------------------------------------------------------
# 3. PII tokenisation — name (SHA-256 hash)
# ---------------------------------------------------------------------------

SALT = "COMPANY_SALT_2024"

# TODO: Implement a Python UDF `hash_name(name, salt)` that:
#       - Returns sha256(name + salt).hexdigest()[:16] for non-null names
#       - Returns None for null input
# Then add column "name_token" to raw_customers using this UDF.

# (Write the UDF as a regular Python function first, then register it)
def hash_name(name, salt: str = SALT):
    pass  # replace

# TODO: Register hash_name as a Spark UDF returning StringType
# TODO: Add "name_token" column to raw_customers

df_tokenised = None  # replace

assert df_tokenised is not None,                "df_tokenised must not be None"
assert "name_token" in df_tokenised.columns,    "Must have name_token column"

tokens = {r["name_token"] for r in df_tokenised.select("name_token").collect() if r["name_token"]}
for t in tokens:
    assert len(t) == 16, f"Token must be 16 chars, got {len(t)} for '{t}'"
    assert t != "Alice Smith",   "Name must not appear in plaintext in token"

null_token = df_tokenised.filter(F.col("customer_id") == "cust_04").select("name_token").collect()[0][0]
assert null_token is None, f"Null name should produce null token, got {null_token}"

# Deterministic: same input → same token
t1 = hash_name("Alice Smith", SALT)
t2 = hash_name("Alice Smith", SALT)
assert t1 == t2, "hash_name must be deterministic"

# Different salt → different token
t3 = hash_name("Alice Smith", "OTHER_SALT")
assert t1 != t3, "Different salt should produce different token"

# ---------------------------------------------------------------------------
# 4. Data classification check
# ---------------------------------------------------------------------------

# TODO: Implement `classify_column(col_name: str) -> str` that returns:
#       "RESTRICTED"   if col_name is in {"email","phone","name","ssn","credit_card"}
#       "CONFIDENTIAL" if col_name is in {"zip_code","date_of_birth","customer_id"}
#       "INTERNAL"     if col_name is in {"order_count","total_spend","created_at"}
#       "PUBLIC"       otherwise

def classify_column(col_name: str) -> str:
    pass  # replace

assert classify_column("email")        == "RESTRICTED",   f"email should be RESTRICTED"
assert classify_column("phone")        == "RESTRICTED",   f"phone should be RESTRICTED"
assert classify_column("customer_id")  == "CONFIDENTIAL", f"customer_id should be CONFIDENTIAL"
assert classify_column("zip_code")     == "CONFIDENTIAL", f"zip_code should be CONFIDENTIAL"
assert classify_column("order_count")  == "INTERNAL",     f"order_count should be INTERNAL"
assert classify_column("product_name") == "PUBLIC",       f"product_name should be PUBLIC"

# ---------------------------------------------------------------------------
# 5. Row-level filtering simulation
# ---------------------------------------------------------------------------

orders = spark.createDataFrame([
    ("o1", "cust_01", "US",  999.99, "completed"),
    ("o2", "cust_02", "EU",  349.00, "completed"),
    ("o3", "cust_03", "US",  149.99, "refunded"),
    ("o4", "cust_01", "APAC",299.00, "pending"),
], ["order_id", "customer_id", "region", "amount", "status"])

# Simulate RLS: user is allowed to see only these regions
user_allowed_regions = ["US", "APAC"]

# TODO: Filter `orders` to only rows where region is in user_allowed_regions
#       Store result in `rls_result`

rls_result = None  # replace

assert rls_result is not None,          "rls_result must not be None"
assert rls_result.count() == 3,        f"Expected 3 rows (US+APAC), got {rls_result.count()}"

regions_visible = {r["region"] for r in rls_result.select("region").collect()}
assert "EU" not in regions_visible, f"EU region should be hidden, visible regions: {regions_visible}"

# ---------------------------------------------------------------------------
# 6. Column masking simulation
# ---------------------------------------------------------------------------

# TODO: Create `df_col_masked` from raw_customers with these rules:
#   - "pii_reader" = True  →  email shown as-is
#   - "pii_reader" = False →  email masked (replace chars before @ with "***")
# Simulate pii_reader=False (analyst role) by adding a literal False column first,
# then apply the conditional mask.
# Store the masked email in column "email_display".

is_pii_reader = False  # simulate analyst role

df_col_masked = None  # replace

assert df_col_masked is not None,                   "df_col_masked must not be None"
assert "email_display" in df_col_masked.columns,    "Must have email_display column"

displayed = {r["email_display"] for r in df_col_masked.select("email_display").collect() if r["email_display"]}
# With pii_reader=False, all emails must be masked
assert all("***@" in e for e in displayed), \
    f"With pii_reader=False, all emails must be masked, got {displayed}"

# Repeat for pii_reader=True
is_pii_reader = True

df_col_unmasked = raw_customers.withColumn(
    "email_display",
    F.when(F.lit(is_pii_reader), F.col("email")).otherwise(
        F.when(F.col("email").isNotNull(),
               F.regexp_replace(F.col("email"), r"(?<=^.).+(?=@)", "***"))
    )
)
displayed_unmasked = {r["email_display"] for r in df_col_unmasked.select("email_display").collect() if r["email_display"]}
assert any("@" in e and "***" not in e for e in displayed_unmasked), \
    f"With pii_reader=True, at least one unmasked email expected, got {displayed_unmasked}"

# ---------------------------------------------------------------------------
# 7. Audit log helper
# ---------------------------------------------------------------------------

# TODO: Implement `build_audit_entry(user: str, action: str, table: str,
#                                    rows_affected: int, status: str) -> dict`
#       Returns a dict with keys: user, action, table, rows_affected, status, ts
#       where ts is the ISO timestamp string (datetime.utcnow().isoformat())

from datetime import datetime

def build_audit_entry(user: str, action: str, table: str,
                      rows_affected: int, status: str) -> dict:
    pass  # replace

entry = build_audit_entry("alice@company.com", "SELECT", "prod.silver.orders", 1000, "SUCCESS")

assert entry is not None,                         "build_audit_entry must return a dict"
assert entry["user"]          == "alice@company.com"
assert entry["action"]        == "SELECT"
assert entry["table"]         == "prod.silver.orders"
assert entry["rows_affected"] == 1000
assert entry["status"]        == "SUCCESS"
assert "ts" in entry,                             "Entry must have 'ts' key"
assert isinstance(entry["ts"], str),              "ts must be a string"

print("\nAll assertions passed!")
spark.stop()
