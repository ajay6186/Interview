import os
os.environ.setdefault("PYSPARK_PYTHON", "python3")

from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType,
    DoubleType, BooleanType, LongType, TimestampType
)
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("spark-basics-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")
print("Ex01 Spark version:", spark.version)

df = spark.createDataFrame([(1, "Alice", 30), (2, "Bob", 25)],
                           ["id", "name", "age"])
df.show()

df.printSchema()
print("Ex04 count:", df.count())
# input("Spark UI running at http://localhost:4040 — press Enter to exit...")
print("Exo5 columns:", df.columns)
print("Ex06 dtypes:", df.dtypes)
df.select("name", "age").show()
df.filter(df.age > 26).show()
df3 = df.withColumnRenamed("name", "full_name")
df3.show()
df4 = df.drop("age")
df4.show()
df.orderBy("age").show()
df.show()

df.limit(1).show()

schema = StructType([
    StructField("id", LongType(), nullable=False),
    StructField("name", StringType(), nullable=True),
    StructField("score", DoubleType(), nullable=True),
])
data = [(1, "Alice", 95.5), (2, "Bob", 87.0), (3, "Carol", None)]
df5 = spark.createDataFrame(data, schema)
df5.printSchema()
df5.show()

sc = spark.sparkContext
print("Ex17 appName:", sc.appName)

rdd = sc.parallelize([(1, "x"), (2, "y")])
df_rdd = rdd.toDF(["id", "val"])
df_rdd.show()

rows = df.collect()
print("Ex19 first row:", rows[0])

print("Ex20 first", df.first())
print("Ex20 head(2):", df.first())

print("Ex21 take(2):", df.take(2))

df5.show(truncate=False)

# 24 creatDataFrame from pandas
import pandas as pd
pdf2 = pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})
df_pd = spark.createDataFrame(pdf2)
print("---------")
df_pd.show()