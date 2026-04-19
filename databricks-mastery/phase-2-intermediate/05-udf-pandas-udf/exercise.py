# ============================================================================
# Exercise 2.5 — UDFs & Pandas UDFs
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StringType, DoubleType, BooleanType, IntegerType, ArrayType
from pyspark.sql.functions import udf, pandas_udf
import pandas as pd

spark = SparkSession.builder.appName("udf-exercise").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

df = spark.createDataFrame([
    (1,"Alice Smith","Engineering",95000.0,5),
    (2,"Bob Jones","Marketing",72000.0,3),
    (3,"Carol White","Engineering",105000.0,8),
    (4,"Dave Brown","HR",68000.0,2),
    (5,"Eve Black",None,60000.0,1),
], ["id","full_name","dept","salary","yoe"])

# ---------------------------------------------------------------------------
# 1. Python UDF: extract last name (second word in full_name, or "Unknown" if None)
# ---------------------------------------------------------------------------
# TODO: define last_name_udf (returnType=StringType)
#       apply as column "last_name"
last_name_udf = None  # replace None
df_1 = None  # replace None — should have "last_name" column

assert df_1 is not None
assert "last_name" in df_1.columns
first_row = df_1.filter(F.col("id") == 1).first()
assert first_row["last_name"] == "Smith"

# ---------------------------------------------------------------------------
# 2. Python UDF: compensation = salary + yoe * 2000 (handle nulls → return None)
# ---------------------------------------------------------------------------
# TODO: comp_udf (returnType=DoubleType), apply as "total_comp"
comp_udf = None  # replace None
df_2 = None  # replace None

assert "total_comp" in df_2.columns
alice_comp = df_2.filter(F.col("id")==1).first()["total_comp"]
assert alice_comp == 95000.0 + 5*2000  # 105000.0

# ---------------------------------------------------------------------------
# 3. SQL-registered UDF: classify salary
# ---------------------------------------------------------------------------
# TODO: define classify_salary(salary): return "High"(>90k)/"Mid"(>70k)/"Low"
#       register as "salary_class" for SQL use
#       query: SELECT id, salary_class(salary) as class FROM emp_ex
df.createOrReplaceTempView("emp_ex")
sql_result = None  # replace None

assert sql_result is not None
assert "class" in sql_result.columns

# ---------------------------------------------------------------------------
# 4. Pandas UDF: z-score normalize salary (vectorized)
# ---------------------------------------------------------------------------
# TODO: define zscore_udf (pandas_udf, DoubleType)
#       zscore = (salary - mean) / std
#       apply as "sal_zscore"
zscore_udf = None  # replace None
df_4 = None  # replace None

assert "sal_zscore" in df_4.columns
# mean of zscores should be ~0
vals = [r["sal_zscore"] for r in df_4.select("sal_zscore").collect()]
assert abs(sum(vals) / len(vals)) < 0.01, "z-scores should have mean ~0"

# ---------------------------------------------------------------------------
# 5. Pandas UDF: boolean — is salary above department average?
# ---------------------------------------------------------------------------
# TODO: above_dept_avg_udf(salary: pd.Series) -> pd.Series (BooleanType)
#       Note: this is per-partition, use groupBy + applyInPandas instead for true dept avg
#       For simplicity here: return salary > salary.mean()
above_avg_udf = None  # replace None
df_5 = None  # replace None

assert "above_avg" in df_5.columns

# ---------------------------------------------------------------------------
# 6. applyInPandas: rank employees within dept by salary
# ---------------------------------------------------------------------------
from pyspark.sql.types import StructType, StructField
out_schema = StructType(df.schema.fields + [StructField("dept_rank", IntegerType(), True)])

def rank_in_dept(pdf: pd.DataFrame) -> pd.DataFrame:
    # TODO: sort by salary desc, assign dept_rank 1,2,3,...
    pass  # replace with implementation

# TODO: apply rank_in_dept via groupBy("dept").applyInPandas
df_6 = None  # replace None

assert df_6 is not None
assert "dept_rank" in df_6.columns

# ---------------------------------------------------------------------------
# 7. UDF returning array: tokenize full_name into list of words
# ---------------------------------------------------------------------------
# TODO: tokenize_udf (returnType=ArrayType(StringType()))
#       split full_name by space, uppercase each word
tokenize_udf = None  # replace None
df_7 = None  # replace None

assert "name_tokens" in df_7.columns
tokens = df_7.filter(F.col("id")==1).first()["name_tokens"]
assert tokens == ["ALICE", "SMITH"]

print("All assertions passed!")
spark.stop()
