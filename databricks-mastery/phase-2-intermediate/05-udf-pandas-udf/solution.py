# ============================================================================
# Solution 2.5 — UDFs & Pandas UDFs
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (StringType, DoubleType, BooleanType, IntegerType,
                                ArrayType, StructType, StructField)
from pyspark.sql.functions import udf, pandas_udf
import pandas as pd

spark = SparkSession.builder.appName("udf-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

df = spark.createDataFrame([
    (1,"Alice Smith","Engineering",95000.0,5),
    (2,"Bob Jones","Marketing",72000.0,3),
    (3,"Carol White","Engineering",105000.0,8),
    (4,"Dave Brown","HR",68000.0,2),
    (5,"Eve Black",None,60000.0,1),
], ["id","full_name","dept","salary","yoe"])

# 1. Last name UDF
@udf(returnType=StringType())
def last_name_udf(name):
    if name is None: return "Unknown"
    parts = name.split(" ")
    return parts[1] if len(parts) > 1 else "Unknown"

df_1 = df.withColumn("last_name", last_name_udf("full_name"))
assert "last_name" in df_1.columns
assert df_1.filter(F.col("id")==1).first()["last_name"] == "Smith"

# 2. Compensation UDF
@udf(returnType=DoubleType())
def comp_udf(salary, yoe):
    if salary is None or yoe is None: return None
    return salary + yoe * 2000

df_2 = df.withColumn("total_comp", comp_udf("salary","yoe"))
assert "total_comp" in df_2.columns
assert df_2.filter(F.col("id")==1).first()["total_comp"] == 105000.0

# 3. SQL-registered UDF
@udf(returnType=StringType())
def classify_salary(salary):
    if salary is None: return "Unknown"
    if salary > 90000: return "High"
    if salary > 70000: return "Mid"
    return "Low"

spark.udf.register("salary_class", classify_salary)
df.createOrReplaceTempView("emp_ex")
sql_result = spark.sql("SELECT id, salary_class(salary) as class FROM emp_ex")
assert "class" in sql_result.columns

# 4. Z-score Pandas UDF
@pandas_udf(DoubleType())
def zscore_udf(salary: pd.Series) -> pd.Series:
    return (salary - salary.mean()) / salary.std()

df_4 = df.withColumn("sal_zscore", zscore_udf("salary"))
assert "sal_zscore" in df_4.columns
vals = [r["sal_zscore"] for r in df_4.select("sal_zscore").collect()]
assert abs(sum(vals)/len(vals)) < 0.01

# 5. Above average Pandas UDF
@pandas_udf(BooleanType())
def above_avg_udf(salary: pd.Series) -> pd.Series:
    return salary > salary.mean()

df_5 = df.withColumn("above_avg", above_avg_udf("salary"))
assert "above_avg" in df_5.columns

# 6. applyInPandas rank
out_schema = StructType(df.schema.fields + [StructField("dept_rank", IntegerType(), True)])

def rank_in_dept(pdf: pd.DataFrame) -> pd.DataFrame:
    pdf = pdf.sort_values("salary", ascending=False).reset_index(drop=True)
    pdf["dept_rank"] = range(1, len(pdf) + 1)
    return pdf

df_6 = df.groupBy("dept").applyInPandas(rank_in_dept, schema=out_schema)
assert "dept_rank" in df_6.columns

# 7. Tokenize UDF
@udf(returnType=ArrayType(StringType()))
def tokenize_udf(name):
    if name is None: return []
    return [w.upper() for w in name.split(" ")]

df_7 = df.withColumn("name_tokens", tokenize_udf("full_name"))
assert "name_tokens" in df_7.columns
assert df_7.filter(F.col("id")==1).first()["name_tokens"] == ["ALICE","SMITH"]

print("All assertions passed!")
spark.stop()
