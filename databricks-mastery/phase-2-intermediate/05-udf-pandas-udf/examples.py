# ============================================================================
# Examples 2.5 — UDFs & Pandas UDFs  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *
from pyspark.sql.functions import udf, pandas_udf, PandasUDFType
import pandas as pd

spark = SparkSession.builder.appName("udf-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

df = spark.createDataFrame([
    (1,"Alice Smith","alice@email.com",95000.0,5),
    (2,"Bob Jones","bob@email.com",72000.0,3),
    (3,"Carol White","carol@email.com",105000.0,8),
    (4,"Dave Brown",None,68000.0,2),
], ["id","full_name","email","salary","yoe"])

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Simple Python UDF — uppercase first name
def get_first_name(full_name):
    if full_name is None: return None
    return full_name.split(" ")[0].upper()

get_first_name_udf = udf(get_first_name, StringType())
df.withColumn("first_name", get_first_name_udf("full_name")).show()

# 2. Register UDF with decorator
@udf(returnType=StringType())
def extract_domain(email):
    if email is None: return "unknown"
    return email.split("@")[-1]

df.withColumn("domain", extract_domain("email")).show()

# 3. UDF with integer return type
@udf(returnType=IntegerType())
def salary_band(salary):
    if salary is None: return -1
    if salary > 90000: return 3
    if salary > 75000: return 2
    return 1

df.withColumn("band", salary_band("salary")).show()

# 4. UDF with boolean return type
@udf(returnType=BooleanType())
def is_senior(yoe):
    return yoe is not None and yoe >= 5

df.withColumn("is_senior", is_senior("yoe")).show()

# 5. UDF with double return
@udf(returnType=DoubleType())
def apply_bonus(salary, yoe):
    if salary is None or yoe is None: return 0.0
    rate = 0.15 if yoe >= 5 else 0.10
    return round(salary * rate, 2)

df.withColumn("bonus", apply_bonus("salary","yoe")).show()

# 6. Register UDF for SQL use
spark.udf.register("sql_get_first_name", get_first_name, StringType())
df.createOrReplaceTempView("emp")
spark.sql("SELECT id, sql_get_first_name(full_name) as first_name FROM emp").show()

# 7. UDF returning array
@udf(returnType=ArrayType(StringType()))
def split_name(full_name):
    if full_name is None: return []
    return full_name.split(" ")

df.withColumn("name_parts", split_name("full_name")).show()

# 8. UDF returning struct
name_schema = StructType([
    StructField("first", StringType(), True),
    StructField("last",  StringType(), True),
])
@udf(returnType=name_schema)
def parse_name(full_name):
    if full_name is None: return None
    parts = full_name.split(" ")
    return (parts[0], parts[1] if len(parts) > 1 else "")

df.withColumn("name_struct", parse_name("full_name")).show()

# 9. UDF returning map
@udf(returnType=MapType(StringType(), StringType()))
def make_metadata(name, email):
    return {"name": name or "", "email": email or "n/a"}

df.withColumn("meta", make_metadata("full_name","email")).show()

# 10. Chain multiple UDFs
df.withColumn("first_name", get_first_name_udf("full_name")) \
  .withColumn("band", salary_band("salary")) \
  .withColumn("is_sr", is_senior("yoe")) \
  .show()

# 11. UDF null handling — always return None explicitly
@udf(returnType=StringType())
def safe_upper(s):
    return s.upper() if s else None

df.withColumn("upper_name", safe_upper("full_name")).show()

# 12. lambda UDF (for simple cases)
double_salary = udf(lambda s: s * 2 if s else None, DoubleType())
df.withColumn("double_sal", double_salary("salary")).show()

# 13. UDF performance note — use built-in functions when possible
# Built-in: F.upper("full_name")  — no serialization overhead
# UDF:      upper_udf("full_name") — Python serialization + deserialization per row
df.withColumn("builtin_upper", F.upper("full_name")).show()

# 14. Vectorized (Pandas) UDF — scalar type
@pandas_udf(DoubleType())
def vectorized_bonus(salary: pd.Series, yoe: pd.Series) -> pd.Series:
    return (salary * yoe.apply(lambda y: 0.15 if y >= 5 else 0.10)).round(2)

df.withColumn("vec_bonus", vectorized_bonus("salary","yoe")).show()

# 15. Pandas UDF — string scalar
@pandas_udf(StringType())
def vec_first_name(names: pd.Series) -> pd.Series:
    return names.fillna("").apply(lambda n: n.split(" ")[0].upper())

df.withColumn("first_name_vec", vec_first_name("full_name")).show()

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Pandas UDF — return boolean
@pandas_udf(BooleanType())
def vec_is_senior(yoe: pd.Series) -> pd.Series:
    return yoe >= 5

df.withColumn("senior_vec", vec_is_senior("yoe")).show()

# 17. Pandas UDF — complex computation
@pandas_udf(DoubleType())
def normalize_salary(salary: pd.Series) -> pd.Series:
    return (salary - salary.min()) / (salary.max() - salary.min())

df.withColumn("norm_sal", normalize_salary("salary")).show()

# 18. Grouped Map Pandas UDF (applyInPandas)
def rank_within_group(pdf: pd.DataFrame) -> pd.DataFrame:
    pdf = pdf.sort_values("salary", ascending=False)
    pdf["rank"] = range(1, len(pdf) + 1)
    return pdf

schema = StructType(df.schema.fields + [StructField("rank", IntegerType(), True)])
df.groupBy("yoe").applyInPandas(rank_within_group, schema=schema).show()

# 19. Grouped Aggregate Pandas UDF
@pandas_udf(DoubleType())
def mean_salary(salary: pd.Series) -> float:
    return salary.mean()

df.groupBy("yoe").agg(mean_salary("salary").alias("avg_sal")).show()

# 20. Iterator of Pandas UDF (batch processing)
from typing import Iterator
@pandas_udf(DoubleType())
def batch_compute(salary_iter: Iterator[pd.Series]) -> Iterator[pd.Series]:
    for salary in salary_iter:
        yield salary * 1.1  # 10% increase simulation

df.withColumn("adjusted", batch_compute("salary")).show()

# 21. Iterator of multiple Series
from typing import Tuple
@pandas_udf(DoubleType())
def compute_total(it: Iterator[Tuple[pd.Series, pd.Series]]) -> Iterator[pd.Series]:
    for salary, yoe in it:
        yield salary + yoe * 1000

df.withColumn("total_comp", compute_total("salary","yoe")).show()

# 22. mapInPandas (partition-level processing — no groupBy needed)
def double_all(df_pd: pd.DataFrame) -> pd.DataFrame:
    df_pd["salary"] = df_pd["salary"] * 2
    return df_pd

df.mapInPandas(double_all, schema=df.schema).show()

# 23. UDF caching (closure variable)
threshold = 80000  # captured in closure
@udf(returnType=BooleanType())
def above_threshold(salary):
    return salary is not None and salary > threshold

df.withColumn("high_earner", above_threshold("salary")).show()

# 24. UDF with external library (use mapInPandas to load model once per partition)
def apply_rule(df_pd: pd.DataFrame) -> pd.DataFrame:
    import re
    df_pd["has_valid_email"] = df_pd["email"].fillna("").apply(
        lambda e: bool(re.match(r"[^@]+@[^@]+\.[^@]+", e))
    )
    return df_pd

result_schema = StructType(df.schema.fields + [StructField("has_valid_email", BooleanType())])
df.mapInPandas(apply_rule, schema=result_schema).show()

# 25. Register Pandas UDF for SQL
spark.udf.register("sql_vec_first_name", vec_first_name)
spark.sql("SELECT id, sql_vec_first_name(full_name) FROM emp").show()

# 26. UDF on struct column
@udf(returnType=StringType())
def format_address(addr):
    if addr is None: return None
    return f"{addr['city']}, {addr['zip']}"

addr_df = spark.createDataFrame([
    (1, {"city":"NYC","zip":"10001"}),
    (2, {"city":"LA", "zip":"90001"}),
], ["id","address"])
addr_df.withColumn("addr_str", format_address("address")).show()

# 27. UDF on array column
@udf(returnType=IntegerType())
def count_items(arr):
    if arr is None: return 0
    return len(arr)

arr_df = spark.createDataFrame([([1,2,3],),([],),(None,)], ["nums"])
arr_df.withColumn("cnt", count_items("nums")).show()

# 28. UDF on map column
@udf(returnType=StringType())
def get_key(m, key):
    if m is None: return None
    return str(m.get(key, ""))

map_df = spark.createDataFrame([({"a":1,"b":2},),({"a":3},)], ["m"])
map_df.withColumn("a_val", get_key("m", F.lit("a"))).show()

# 29. Error handling inside UDF
@udf(returnType=DoubleType())
def safe_divide(a, b):
    try:
        return float(a) / float(b) if b and b != 0 else None
    except:
        return None

div_df = spark.createDataFrame([(10.0,2.0),(5.0,0.0),(None,3.0)], ["a","b"])
div_df.withColumn("result", safe_divide("a","b")).show()

# 30. Chained Pandas UDFs (pipeline)
@pandas_udf(DoubleType())
def tax(salary: pd.Series) -> pd.Series:
    return salary * 0.3

@pandas_udf(DoubleType())
def net(salary: pd.Series, tax_amount: pd.Series) -> pd.Series:
    return salary - tax_amount

df.withColumn("tax_amt", tax("salary")) \
  .withColumn("net_salary", net("salary", F.col("tax_amt"))) \
  .show()

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Pandas UDF for ML scoring (load model once per partition)
def score_partition(df_pd: pd.DataFrame) -> pd.DataFrame:
    # Simulate: in production, load model once here
    # model = joblib.load("model.pkl")
    df_pd["predicted_churn"] = (df_pd["salary"] < 70000).astype(float)
    return df_pd

score_schema = StructType(df.schema.fields + [StructField("predicted_churn", DoubleType())])
df.mapInPandas(score_partition, schema=score_schema).show()

# 32. Pandas UDF with PyArrow types
import pyarrow as pa
@pandas_udf("double")
def arrow_double(x: pd.Series) -> pd.Series:
    return x * 2.0

df.withColumn("dbl", arrow_double("salary")).show()

# 33. UDF used in window function (UDF results as window input)
@udf(returnType=DoubleType())
def adjusted_salary(salary, yoe):
    return salary * (1 + 0.02 * yoe) if salary and yoe else salary

from pyspark.sql.window import Window
w = Window.partitionBy(F.lit(1)).orderBy("adjusted")
df.withColumn("adjusted", adjusted_salary("salary","yoe")) \
  .withColumn("rank_adjusted", F.rank().over(w)) \
  .show()

# 34. Dynamic UDF factory
def make_multiplier_udf(factor):
    @udf(returnType=DoubleType())
    def multiplier(val):
        return val * factor if val else None
    return multiplier

double_udf  = make_multiplier_udf(2.0)
triple_udf  = make_multiplier_udf(3.0)
df.withColumn("double_sal", double_udf("salary")) \
  .withColumn("triple_sal", triple_udf("salary")) \
  .show()

# 35. Apply different logic per partition with mapInPandas
def smart_process(df_pd: pd.DataFrame) -> pd.DataFrame:
    import numpy as np
    df_pd["log_salary"] = np.log1p(df_pd["salary"].fillna(0))
    return df_pd

log_schema = StructType(df.schema.fields + [StructField("log_salary", DoubleType())])
df.mapInPandas(smart_process, schema=log_schema).show()

# 36. UDF broadcast (pass large lookup via broadcast)
sc = spark.sparkContext
lookup = sc.broadcast({"Alice Smith": "admin", "Bob Jones": "user"})

@udf(returnType=StringType())
def get_role(name):
    return lookup.value.get(name, "viewer")

df.withColumn("role", get_role("full_name")).show()

# 37. UDF in SQL with arguments
spark.udf.register("salary_band_sql", salary_band)
spark.sql("SELECT id, full_name, salary_band_sql(salary) as band FROM emp").show()

# 38. Type hints for Pandas UDF readability
@pandas_udf("string")
def tidy_email(email: pd.Series) -> pd.Series:
    return email.fillna("").str.lower().str.strip()

df.withColumn("clean_email", tidy_email("email")).show()

# 39. Performance: prefer built-in → Pandas UDF → Python UDF
print("""
Ex39 Performance ranking (fastest → slowest):
  1. Built-in Spark functions (no serialization)
  2. Pandas/Vectorized UDF     (Arrow columnar serialization)
  3. Python row-level UDF      (row-by-row serialization, slowest)
""")

# 40. Pandas UDF for feature engineering at scale
data_large = spark.range(10000).withColumn("val", F.rand() * 100)
@pandas_udf(DoubleType())
def zscore(v: pd.Series) -> pd.Series:
    return (v - v.mean()) / v.std()
data_large.withColumn("z", zscore("val")).show(3)

# 41. mapInArrow (Spark 3.3+ — even faster than mapInPandas)
try:
    def arrow_fn(batch_iter):
        for batch in batch_iter:
            pdf = batch.to_pandas()
            pdf["salary"] = pdf["salary"] * 1.1
            yield pa.RecordBatch.from_pandas(pdf)
    print("Ex41 mapInArrow: spark 3.3+ API for PyArrow-native processing")
except Exception as e:
    print("Ex41:", e)

# 42. Exception propagation from UDF
@udf(returnType=IntegerType())
def fail_on_null(val):
    if val is None:
        raise ValueError("Null value encountered!")
    return int(val)

try:
    df.withColumn("fail", fail_on_null("email")).collect()
except Exception as e:
    print("Ex42 UDF exception propagated:", type(e).__name__)

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Typed Dataset UDF (Scala API only in JVM; Python uses pandas_udf)
print("Ex43 Typed UDFs in Python: use pandas_udf with typed return type annotation")

# 44. Delta Live Tables UDF (defined in notebook, reused in DLT pipelines)
print("Ex44 DLT UDF: define Python UDF in DLT notebook, apply in @dlt.table transform")

# 45. MLflow + UDF — register model as UDF
print("""
Ex45 MLflow model UDF:
  import mlflow.pyfunc
  predict_udf = mlflow.pyfunc.spark_udf(spark, "models:/MyModel/1", result_type="double")
  df.withColumn("pred", predict_udf("feature1","feature2")).show()
""")

# 46. UDF observability — log metrics from inside UDF
count_acc = sc.accumulator(0)
@udf(returnType=StringType())
def tracked_fn(name):
    count_acc.add(1)
    return name.upper() if name else None

df.withColumn("tracked", tracked_fn("full_name")).collect()
print("Ex46 UDF invocations (via accumulator):", count_acc.value)

# 47. Arrow-optimized Pandas UDF (spark.sql.execution.arrow.pyspark.enabled)
spark.conf.set("spark.sql.execution.arrow.pyspark.enabled", "true")
print("Ex47 Arrow optimization enabled:", spark.conf.get("spark.sql.execution.arrow.pyspark.enabled"))

# 48. Fallback behavior when Arrow not available
spark.conf.set("spark.sql.execution.arrow.pyspark.fallback.enabled","true")
print("Ex48 Arrow fallback enabled")

# 49. UDF with custom schema validation
@udf(returnType=BooleanType())
def is_valid_record(name, salary, yoe):
    if name is None or salary is None or yoe is None: return False
    if salary <= 0 or yoe < 0: return False
    return True

df.withColumn("valid", is_valid_record("full_name","salary","yoe")).show()

# 50. Best practices
print("""
Ex50 UDF Best Practices:
  1. Prefer built-in F.* functions — zero serialization cost
  2. Use Pandas UDF for vectorized computation (10-100x faster than row UDF)
  3. Use mapInPandas when you need full DataFrame context (model load, etc.)
  4. Avoid UDFs in streaming — prefer built-ins or Pandas UDF
  5. Register UDFs for SQL use with spark.udf.register()
  6. Handle nulls explicitly in every UDF
  7. Use accumulators for lightweight UDF-level telemetry
  8. Enable Arrow: spark.sql.execution.arrow.pyspark.enabled = true
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
