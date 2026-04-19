# ============================================================================
# Solution 4.2 — Data Quality Patterns
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
import os

spark = (SparkSession.builder
    .appName("dq-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/dq_sol"
os.makedirs(BASE, exist_ok=True)

df = spark.createDataFrame([
    (1,"Alice","alice@mail.com",30,75000.0),
    (2,"Bob","not-an-email",-5,120000.0),
    (3,None,"carol@mail.com",25,0.0),
    (4,"Dave","dave@mail.com",200,55000.0),
    (5,"Eve","eve@mail.com",28,None),
    (6,"Frank","frank@mail.com",35,95000.0),
], ["id","name","email","age","salary"])

EMAIL_RE = r"^[\w.+-]+@[\w-]+\.[\w.]+$"

# 1. DQ flag columns
df_flagged = (df
    .withColumn("name_ok",   F.col("name").isNotNull().cast("int"))
    .withColumn("age_ok",    F.col("age").between(0, 120).cast("int"))
    .withColumn("email_ok",  F.col("email").rlike(EMAIL_RE).cast("int"))
    .withColumn("salary_ok", (F.col("salary") > 0).cast("int")))
assert "name_ok" in df_flagged.columns

# 2. Valid records
valid_df = df_flagged.filter(
    (F.col("name_ok")==1) & (F.col("age_ok")==1) &
    (F.col("email_ok")==1) & (F.col("salary_ok")==1))
assert valid_df.count() == 2

# 3. DQ summary
total = df.count()
rules = [
    ("name_not_null",   df.filter(F.col("name").isNotNull()).count()),
    ("age_0_120",       df.filter(F.col("age").between(0,120)).count()),
    ("email_regex",     df.filter(F.col("email").rlike(EMAIL_RE)).count()),
    ("salary_positive", df.filter(F.col("salary") > 0).count()),
]
dq_summary = spark.createDataFrame(
    [(r[0], r[1], total - r[1]) for r in rules],
    ["rule","pass_count","fail_count"])
assert dq_summary.count() == 4

# 4. Null counts dict
null_counts = {c: df.filter(F.col(c).isNull()).count() for c in df.columns}
assert null_counts["name"]   == 1
assert null_counts["salary"] == 1
assert null_counts["id"]     == 0

# 5. Quarantine
bad = df_flagged.filter(
    (F.col("name_ok")==0) | (F.col("age_ok")==0) |
    (F.col("email_ok")==0) | (F.col("salary_ok")==0))
bad.write.format("delta").mode("overwrite").save(f"{BASE}/quarantine")
bad_count = spark.read.format("delta").load(f"{BASE}/quarantine").count()
assert bad_count == 4

# 6. Fail reason
df_with_reason = df.withColumn("fail_reason",
    F.when(F.col("name").isNull(), "null_name")
     .when(~F.col("age").between(0,120), "age_out_of_range")
     .when((F.col("salary").isNull()) | (F.col("salary") <= 0), "invalid_salary")
     .when(~F.col("email").rlike(EMAIL_RE), "bad_email")
     .otherwise(None))
reasons = [r.fail_reason for r in df_with_reason.select("fail_reason").collect()]
assert "null_name" in reasons
assert "bad_email" in reasons

print("All assertions passed!")
spark.stop()
