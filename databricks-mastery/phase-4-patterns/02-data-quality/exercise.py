# ============================================================================
# Exercise 4.2 — Data Quality Patterns
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
import os

spark = (SparkSession.builder
    .appName("dq-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/dq_ex"
os.makedirs(BASE, exist_ok=True)

df = spark.createDataFrame([
    (1,"Alice","alice@mail.com",30,75000.0),
    (2,"Bob","not-an-email",-5,120000.0),
    (3,None,"carol@mail.com",25,0.0),
    (4,"Dave","dave@mail.com",200,55000.0),
    (5,"Eve","eve@mail.com",28,None),
    (6,"Frank","frank@mail.com",35,95000.0),
], ["id","name","email","age","salary"])

# ---------------------------------------------------------------------------
# 1. DQ flag columns
# ---------------------------------------------------------------------------
# TODO: add these boolean (cast to int) columns to df:
#   name_ok   → name IS NOT NULL
#   age_ok    → age BETWEEN 0 AND 120
#   email_ok  → email matches regex ^[\w.+-]+@[\w-]+\.[\w.]+$
#   salary_ok → salary > 0
#   store result in df_flagged
df_flagged = None  # replace

assert df_flagged is not None
assert "name_ok"   in df_flagged.columns
assert "age_ok"    in df_flagged.columns
assert "email_ok"  in df_flagged.columns
assert "salary_ok" in df_flagged.columns

# ---------------------------------------------------------------------------
# 2. Valid records — all 4 flags are 1
# ---------------------------------------------------------------------------
# TODO: filter df_flagged where all 4 flags == 1
#       store in valid_df
valid_df = None  # replace

assert valid_df is not None
assert valid_df.count() == 2, f"Expected 2 valid rows, got {valid_df.count()}"

# ---------------------------------------------------------------------------
# 3. DQ summary
# ---------------------------------------------------------------------------
# TODO: create a DataFrame with columns: rule (str), pass_count (int), fail_count (int)
#       one row per rule: name_not_null, age_0_120, email_regex, salary_positive
#       store in dq_summary
dq_summary = None  # replace

assert dq_summary is not None
assert dq_summary.count() == 4

# ---------------------------------------------------------------------------
# 4. Null counts dict
# ---------------------------------------------------------------------------
# TODO: build a dict {column_name: null_count} for all columns in df
#       store in null_counts
null_counts = None  # replace

assert null_counts is not None
assert null_counts["name"]   == 1
assert null_counts["salary"] == 1
assert null_counts["id"]     == 0

# ---------------------------------------------------------------------------
# 5. Quarantine bad records
# ---------------------------------------------------------------------------
# TODO: filter df_flagged where ANY flag == 0
#       write as delta overwrite to BASE + "/quarantine"
#       read back and store count in bad_count
bad_count = None  # replace

assert bad_count == 4, f"Expected 4 bad rows, got {bad_count}"

# ---------------------------------------------------------------------------
# 6. Fail reason column
# ---------------------------------------------------------------------------
# TODO: add fail_reason column to df using F.when/.otherwise:
#   "null_name"        if name is null
#   "age_out_of_range" if age not between 0–120
#   "invalid_salary"   if salary <= 0 or null
#   "bad_email"        if email doesn't match regex
#   None               otherwise
#   store in df_with_reason
df_with_reason = None  # replace

assert df_with_reason is not None
reasons = [r.fail_reason for r in df_with_reason.select("fail_reason").collect()]
assert "null_name" in reasons
assert "bad_email" in reasons

print("All assertions passed!")
spark.stop()
