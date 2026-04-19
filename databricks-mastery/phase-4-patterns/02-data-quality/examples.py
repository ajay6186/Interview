# ============================================================================
# Examples 4.2 — Data Quality Patterns  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType
import os

spark = (SparkSession.builder
    .appName("data-quality-examples")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/dq_examples"
os.makedirs(BASE, exist_ok=True)

df = spark.createDataFrame([
    (1,"Alice","alice@mail.com",30,75000.0),
    (2,"Bob","not-an-email",-5,120000.0),
    (3,None,"carol@mail.com",25,0.0),
    (4,"Dave","dave@mail.com",200,55000.0),
    (5,"Eve","eve@mail.com",28,None),
    (6,"Frank","frank@mail.com",35,95000.0),
], ["id","name","email","age","salary"])

# ── BASIC (1–15) ─────────────────────────────────────────────────────────────
# 1. Null check — flag nulls in name column
df1 = df.withColumn("name_null_flag", F.col("name").isNull().cast("int"))
df1.select("id","name","name_null_flag").show()

# 2. Not-null count per column
for c in df.columns:
    cnt = df.filter(F.col(c).isNotNull()).count()
    print(f"Ex02 not-null [{c}]: {cnt}/{df.count()}")

# 3. Null counts dict
null_counts = {c: df.filter(F.col(c).isNull()).count() for c in df.columns}
print("Ex03 null counts:", null_counts)

# 4. Completeness score (0–1)
total = df.count()
completeness = {c: df.filter(F.col(c).isNotNull()).count() / total for c in df.columns}
print("Ex04 completeness:", completeness)

# 5. Range check — age must be 0–120
df5 = df.withColumn("age_ok", F.col("age").between(0, 120).cast("int"))
df5.select("id","age","age_ok").show()

# 6. Regex validation — email format
df6 = df.withColumn("email_ok",
    F.col("email").rlike(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$").cast("int"))
df6.select("id","email","email_ok").show()

# 7. Positive value check — salary > 0
df7 = df.withColumn("salary_ok", (F.col("salary") > 0).cast("int"))
df7.select("id","salary","salary_ok").show()

# 8. Multi-column DQ flag row
df8 = (df
    .withColumn("name_ok",   F.col("name").isNotNull().cast("int"))
    .withColumn("age_ok",    F.col("age").between(0,120).cast("int"))
    .withColumn("email_ok",  F.col("email").rlike(r"^[\w.+-]+@[\w-]+\.[\w.]+$").cast("int"))
    .withColumn("salary_ok", (F.col("salary") > 0).cast("int")))
df8.show()

# 9. Row-level DQ score (average of all flag columns)
df9 = df8.withColumn("dq_score",
    (F.col("name_ok") + F.col("age_ok") + F.col("email_ok") + F.col("salary_ok")) / 4)
df9.select("id","dq_score").show()

# 10. Filter valid records (all checks pass)
valid = df8.filter(
    (F.col("name_ok")==1) & (F.col("age_ok")==1) &
    (F.col("email_ok")==1) & (F.col("salary_ok")==1))
print("Ex10 valid rows:", valid.count())

# 11. Quarantine invalid records
invalid = df8.filter(
    (F.col("name_ok")==0) | (F.col("age_ok")==0) |
    (F.col("email_ok")==0) | (F.col("salary_ok")==0))
print("Ex11 invalid rows:", invalid.count())

# 12. Duplicate detection
df12 = df.withColumn("dup_flag",
    F.count("id").over(__import__("pyspark.sql.window",fromlist=["Window"])
        .Window.partitionBy("id")) > 1)
df12.select("id","dup_flag").show()

# 13. Add DQ rule failure reason
df13 = df.withColumn("fail_reason",
    F.when(F.col("name").isNull(), "null_name")
     .when(~F.col("age").between(0,120), "age_out_of_range")
     .when(F.col("salary") <= 0, "invalid_salary")
     .when(~F.col("email").rlike(r"^[\w.+-]+@[\w-]+\.[\w.]+$"), "bad_email")
     .otherwise(None))
df13.select("id","fail_reason").show()

# 14. Count DQ failures by reason
df13.groupBy("fail_reason").count().show()

# 15. Assert no nulls in primary key
pk_nulls = df.filter(F.col("id").isNull()).count()
print(f"Ex15 PK nulls: {pk_nulls} (should be 0)")

# ── INTERMEDIATE (16–30) ─────────────────────────────────────────────────────
# 16. Cross-field validation — salary shouldn't be null when name is present
df16 = df.withColumn("cross_check",
    (~F.col("name").isNull() & F.col("salary").isNull()).cast("int"))
df16.select("id","name","salary","cross_check").show()

# 17. Statistical outlier — z-score
from pyspark.sql.window import Window
stats = df.select(F.mean("salary").alias("mu"), F.stddev("salary").alias("sigma")).collect()[0]
mu, sigma = stats["mu"], stats["sigma"]
df17 = df.withColumn("zscore", (F.col("salary") - mu) / sigma if sigma else F.lit(0))
df17.select("id","salary","zscore").show()

# 18. Percentile-based outlier detection
p1, p99 = df.approxQuantile("salary", [0.01, 0.99], 0.01)
df18 = df.withColumn("salary_outlier", (~F.col("salary").between(p1, p99)).cast("int"))
df18.select("id","salary","salary_outlier").show()

# 19. Timeliness — check if a date column is within the last 7 days
events = spark.createDataFrame([
    (1,"2024-01-10"),(2,"2020-01-01"),(3,"2024-01-15")
], ["id","event_date"])
df19 = events.withColumn("timely",
    (F.datediff(F.lit("2024-01-15"), F.to_date("event_date","yyyy-MM-dd")) <= 7).cast("int"))
df19.show()

# 20. Uniqueness check — duplicate email detection
email_counts = df.groupBy("email").count()
df20 = df.join(email_counts.filter(F.col("count") > 1), "email", "left_semi")
print("Ex20 duplicate emails:", df20.count())

# 21. Value set validation — category must be in allowed list
cat_df = spark.createDataFrame([
    (1,"A"),(2,"B"),(3,"X"),(4,"A"),(5,"Z")
], ["id","category"])
allowed = ["A","B","C","D"]
df21 = cat_df.withColumn("category_ok", F.col("category").isin(allowed).cast("int"))
df21.show()

# 22. String length validation — name 2–50 chars
df22 = df.withColumn("name_len_ok",
    F.when(F.col("name").isNull(), 0)
     .otherwise((F.length("name").between(2,50)).cast("int")))
df22.select("id","name","name_len_ok").show()

# 23. Non-negative constraint with F.greatest
df23 = df.withColumn("salary_clean", F.greatest(F.col("salary"), F.lit(0.0)))
df23.select("id","salary","salary_clean").show()

# 24. Default fill for nulls — coalesce
df24 = df.withColumn("salary_filled", F.coalesce(F.col("salary"), F.lit(0.0)))
df24.select("id","salary","salary_filled").show()

# 25. DQ summary DataFrame — rule, pass_count, fail_count
rules = [
    ("name_not_null",   df.filter(F.col("name").isNotNull()).count()),
    ("age_0_120",       df.filter(F.col("age").between(0,120)).count()),
    ("email_regex",     df.filter(F.col("email").rlike(r"^[\w.+-]+@[\w-]+\.[\w.]+$")).count()),
    ("salary_positive", df.filter(F.col("salary") > 0).count()),
]
dq_summary = spark.createDataFrame(
    [(r[0], r[1], total - r[1]) for r in rules],
    ["rule","pass_count","fail_count"])
dq_summary.show()

# 26. Write valid to silver, invalid to quarantine (Delta)
valid.drop("name_ok","age_ok","email_ok","salary_ok") \
    .write.format("delta").mode("overwrite").save(f"{BASE}/silver")
invalid.write.format("delta").mode("overwrite").save(f"{BASE}/quarantine")
print("Ex26 silver:", spark.read.format("delta").load(f"{BASE}/silver").count(),
      "quarantine:", spark.read.format("delta").load(f"{BASE}/quarantine").count())

# 27. Referential integrity — all orders reference valid customers
orders  = spark.createDataFrame([(1,101),(2,102),(3,999)],["order_id","cust_id"])
customers = spark.createDataFrame([(101,"A"),(102,"B")],["cust_id","name"])
orphan_orders = orders.join(customers,"cust_id","left_anti")
print("Ex27 orphan orders:", orphan_orders.count())

# 28. DQ metadata — add run_id and dq_ts
import uuid
run_id = str(uuid.uuid4())
df28 = df.withColumn("_dq_run_id", F.lit(run_id)) \
         .withColumn("_dq_ts", F.current_timestamp())
df28.select("id","_dq_run_id","_dq_ts").show(truncate=False)

# 29. Rolling DQ score per partition using window
from pyspark.sql.window import Window
w = Window.orderBy("id").rowsBetween(-1, 1)
df29 = df9.withColumn("rolling_dq", F.avg("dq_score").over(w))
df29.select("id","dq_score","rolling_dq").show()

# 30. Expectation DSL — great_expectations style (plain Python dict)
expectations = [
    {"col":"name",   "type":"not_null"},
    {"col":"age",    "type":"between",  "min":0, "max":120},
    {"col":"salary", "type":"positive"},
    {"col":"email",  "type":"regex", "pattern": r"^[\w.+-]+@[\w-]+\.[\w.]+$"},
]
print("Ex30 expectations defined:", len(expectations))

# ── ADVANCED (31–42) ─────────────────────────────────────────────────────────
# 31. Great Expectations integration stub
print("Ex31 ge.from_pandas(df.toPandas()).expect_column_values_to_not_be_null('name')")

# 32. DQ check function
def run_dq(dataframe, col, rule, **kwargs):
    if rule == "not_null":
        return dataframe.filter(F.col(col).isNull()).count() == 0
    elif rule == "between":
        mn, mx = kwargs["min"], kwargs["max"]
        return dataframe.filter(~F.col(col).between(mn,mx)).count() == 0
    elif rule == "positive":
        return dataframe.filter(F.col(col) <= 0).count() == 0
    elif rule == "regex":
        return dataframe.filter(~F.col(col).rlike(kwargs["pattern"])).count() == 0
    return False

results = {e["col"]: run_dq(df, **e) for e in expectations}
print("Ex32 DQ results:", results)

# 33. DQ metrics table (Delta)
metrics = [(k, int(v)) for k,v in results.items()]
mdf = spark.createDataFrame(metrics, ["rule","passed"])
mdf.write.format("delta").mode("overwrite").save(f"{BASE}/dq_metrics")
print("Ex33 DQ metrics written")

# 34. Conditional quarantine with fail_reason
df34 = df13.withColumn("is_valid", F.col("fail_reason").isNull().cast("int"))
valid34   = df34.filter(F.col("is_valid") == 1).drop("fail_reason","is_valid")
invalid34 = df34.filter(F.col("is_valid") == 0)
print("Ex34 valid:", valid34.count(), "invalid:", invalid34.count())

# 35. DQ pass rate as percentage
pass_rate = sum(v for v in results.values()) / len(results) * 100
print(f"Ex35 DQ pass rate: {pass_rate:.0f}%")

# 36. Freshness check — max date in dataset
dates_df = spark.createDataFrame([("2024-01-01",),("2024-01-15",),("2023-12-01",)],["dt"])
max_date = dates_df.agg(F.max("dt").alias("max_dt")).collect()[0]["max_dt"]
freshness_ok = max_date >= "2024-01-14"
print(f"Ex36 freshness ok: {freshness_ok} (max_date={max_date})")

# 37. Volumetric check — row count within expected range
expected_min, expected_max = 4, 100
vol_ok = expected_min <= df.count() <= expected_max
print(f"Ex37 volume ok: {vol_ok}")

# 38. Schema drift detection
expected_schema = {"id","name","email","age","salary"}
actual_schema   = set(df.columns)
drift = expected_schema.symmetric_difference(actual_schema)
print(f"Ex38 schema drift: {drift}")

# 39. DQ report to JSON artifact
import json
report = {
    "run_id": run_id,
    "total_rows": total,
    "null_counts": null_counts,
    "dq_pass_rate": pass_rate,
    "rules": results,
}
print("Ex39 DQ report:", json.dumps(report, indent=2)[:200], "...")

# 40. Standardise email to lowercase
df40 = df.withColumn("email_clean", F.lower(F.trim("email")))
df40.select("id","email","email_clean").show()

# 41. Trim whitespace from all string columns
str_cols = [c for c,t in df.dtypes if t == "string"]
df41 = df
for c in str_cols:
    df41 = df41.withColumn(c, F.trim(F.col(c)))
df41.show()

# 42. Nullify invalid emails (keep value only if valid)
df42 = df.withColumn("email_safe",
    F.when(F.col("email").rlike(r"^[\w.+-]+@[\w-]+\.[\w.]+$"), F.col("email"))
     .otherwise(None))
df42.select("id","email","email_safe").show()

# ── EXPERT (43–50) ────────────────────────────────────────────────────────────
# 43. Delta Live Tables expectations
print("Ex43 @dlt.expect('valid_age','age BETWEEN 0 AND 120')")
print("     @dlt.expect_or_drop('not_null_name','name IS NOT NULL')")
print("     @dlt.expect_or_fail('pk_unique','COUNT(DISTINCT id) = COUNT(id)')")

# 44. Soda Core integration stub
print("Ex44 soda scan: soda scan -d spark -c soda.yml orders.yml")

# 45. DQ as a separate monitoring job (Databricks Workflow)
print("Ex45 Job task 1: run_dq_checks → task 2: write_dq_metrics → task 3: alert_on_failure")

# 46. Column-level DQ heatmap (collect to Pandas for visualization)
col_quality = {c: df.filter(F.col(c).isNotNull()).count()/total for c in df.columns}
print("Ex46 column quality heatmap:", col_quality)

# 47. Custom expectation — no future dates
future_dates = dates_df.filter(F.col("dt") > F.current_date()).count()
print(f"Ex47 future dates: {future_dates}")

# 48. MERGE bad records back after manual fix
print("Ex48 After manual fix → MERGE quarantine fixes back into silver with MERGE statement")

# 49. DQ SLA — alert if pass rate < 95%
sla_threshold = 95.0
if pass_rate < sla_threshold:
    print(f"Ex49 ALERT: DQ pass rate {pass_rate:.1f}% below SLA {sla_threshold}%")
else:
    print(f"Ex49 DQ SLA met: {pass_rate:.1f}%")

# 50. DQ dashboard query
print("Ex50 SELECT rule, passed, run_date FROM dq_metrics ORDER BY run_date DESC LIMIT 30")

def main():
    print("\nAll 50 DQ examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
