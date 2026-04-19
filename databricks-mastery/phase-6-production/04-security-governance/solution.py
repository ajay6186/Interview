# ============================================================================
# Solution 6.4 — Security & Governance
# ============================================================================

import hashlib, re
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StringType

spark = SparkSession.builder \
    .appName("security-governance-solution") \
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

df_email_masked = raw_customers.withColumn(
    "email_masked",
    F.when(
        F.col("email").isNotNull(),
        F.regexp_replace(F.col("email"), r"(?<=^.).+(?=@)", "***")
    )
)

emails = {r["email_masked"] for r in df_email_masked.select("email_masked").collect() if r["email_masked"]}
assert any("***@" in e for e in emails)
assert any("a***@" in e for e in emails)
null_masked = df_email_masked.filter(F.col("customer_id") == "cust_04").select("email_masked").collect()[0][0]
assert null_masked is None

# ---------------------------------------------------------------------------
# 2. PII masking — phone
# ---------------------------------------------------------------------------

df_phone_masked = raw_customers.withColumn(
    "phone_masked",
    F.when(
        F.col("phone").isNotNull(),
        F.regexp_replace(F.col("phone"), r"\d(?=\d{4})", "*")
    )
)

phones = {r["phone_masked"] for r in df_phone_masked.select("phone_masked").collect() if r["phone_masked"]}
for p in phones:
    digits_visible = re.findall(r"\d", p)
    assert len(digits_visible) <= 4, f"Too many digits visible: '{p}'"

# ---------------------------------------------------------------------------
# 3. PII tokenisation — name
# ---------------------------------------------------------------------------

SALT = "COMPANY_SALT_2024"

def hash_name(name, salt: str = SALT):
    if name is None:
        return None
    return hashlib.sha256((name + salt).encode()).hexdigest()[:16]

hash_name_udf = F.udf(hash_name, StringType())

df_tokenised = raw_customers.withColumn("name_token", hash_name_udf(F.col("name")))

tokens = {r["name_token"] for r in df_tokenised.select("name_token").collect() if r["name_token"]}
for t in tokens:
    assert len(t) == 16
    assert t != "Alice Smith"

null_token = df_tokenised.filter(F.col("customer_id") == "cust_04").select("name_token").collect()[0][0]
assert null_token is None

t1 = hash_name("Alice Smith", SALT)
t2 = hash_name("Alice Smith", SALT)
assert t1 == t2

t3 = hash_name("Alice Smith", "OTHER_SALT")
assert t1 != t3

# ---------------------------------------------------------------------------
# 4. Data classification
# ---------------------------------------------------------------------------

def classify_column(col_name: str) -> str:
    restricted   = {"email","phone","name","ssn","credit_card"}
    confidential = {"zip_code","date_of_birth","customer_id"}
    internal     = {"order_count","total_spend","created_at"}
    if col_name in restricted:   return "RESTRICTED"
    if col_name in confidential: return "CONFIDENTIAL"
    if col_name in internal:     return "INTERNAL"
    return "PUBLIC"

assert classify_column("email")        == "RESTRICTED"
assert classify_column("phone")        == "RESTRICTED"
assert classify_column("customer_id")  == "CONFIDENTIAL"
assert classify_column("zip_code")     == "CONFIDENTIAL"
assert classify_column("order_count")  == "INTERNAL"
assert classify_column("product_name") == "PUBLIC"

# ---------------------------------------------------------------------------
# 5. Row-level filtering
# ---------------------------------------------------------------------------

orders = spark.createDataFrame([
    ("o1","cust_01","US",  999.99,"completed"),
    ("o2","cust_02","EU",  349.00,"completed"),
    ("o3","cust_03","US",  149.99,"refunded"),
    ("o4","cust_01","APAC",299.00,"pending"),
], ["order_id","customer_id","region","amount","status"])

user_allowed_regions = ["US","APAC"]
rls_result = orders.filter(F.col("region").isin(user_allowed_regions))

assert rls_result.count() == 3
regions_visible = {r["region"] for r in rls_result.select("region").collect()}
assert "EU" not in regions_visible

# ---------------------------------------------------------------------------
# 6. Column masking simulation
# ---------------------------------------------------------------------------

is_pii_reader = False

df_col_masked = raw_customers.withColumn(
    "email_display",
    F.when(
        F.lit(is_pii_reader), F.col("email")
    ).otherwise(
        F.when(F.col("email").isNotNull(),
               F.regexp_replace(F.col("email"), r"(?<=^.).+(?=@)", "***"))
    )
)

displayed = {r["email_display"] for r in df_col_masked.select("email_display").collect() if r["email_display"]}
assert all("***@" in e for e in displayed)

is_pii_reader = True
df_col_unmasked = raw_customers.withColumn(
    "email_display",
    F.when(F.lit(is_pii_reader), F.col("email")).otherwise(
        F.when(F.col("email").isNotNull(),
               F.regexp_replace(F.col("email"), r"(?<=^.).+(?=@)", "***"))
    )
)
displayed_unmasked = {r["email_display"] for r in df_col_unmasked.select("email_display").collect() if r["email_display"]}
assert any("@" in e and "***" not in e for e in displayed_unmasked)

# ---------------------------------------------------------------------------
# 7. Audit log helper
# ---------------------------------------------------------------------------

def build_audit_entry(user: str, action: str, table: str,
                      rows_affected: int, status: str) -> dict:
    return {
        "user":          user,
        "action":        action,
        "table":         table,
        "rows_affected": rows_affected,
        "status":        status,
        "ts":            datetime.utcnow().isoformat(),
    }

entry = build_audit_entry("alice@company.com","SELECT","prod.silver.orders",1000,"SUCCESS")
assert entry["user"]          == "alice@company.com"
assert entry["action"]        == "SELECT"
assert entry["table"]         == "prod.silver.orders"
assert entry["rows_affected"] == 1000
assert entry["status"]        == "SUCCESS"
assert "ts" in entry
assert isinstance(entry["ts"], str)

print("\nAll assertions passed!")
spark.stop()
