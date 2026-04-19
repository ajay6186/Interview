# ============================================================================
# Solution 1.4 — Reading & Writing Data
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, IntegerType, StringType, DoubleType

spark = SparkSession.builder.appName("read-write-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/rw_exercise"
os.makedirs(BASE, exist_ok=True)

df = spark.createDataFrame([
    (1,"Laptop","Electronics",999.99),
    (2,"Phone","Electronics",699.00),
    (3,"Desk","Furniture",249.50),
    (4,"Chair","Furniture",149.00),
    (5,"Mouse","Electronics",29.99),
], ["id","product","category","price"])

# 1. Parquet round-trip
df.write.mode("overwrite").parquet(f"{BASE}/products_parquet")
df_parquet = spark.read.parquet(f"{BASE}/products_parquet")
assert df_parquet.count() == 5

# 2. CSV with explicit schema
schema = StructType([
    StructField("id",       IntegerType(), True),
    StructField("product",  StringType(),  True),
    StructField("category", StringType(),  True),
    StructField("price",    DoubleType(),  True),
])
df.write.mode("overwrite").option("header","true").csv(f"{BASE}/products_csv")
df_csv = spark.read.schema(schema).option("header","true").csv(f"{BASE}/products_csv")
assert df_csv.schema["price"].dataType == DoubleType()

# 3. Partitioned write and read
df.write.mode("overwrite").partitionBy("category").parquet(f"{BASE}/partitioned")
df_part = spark.read.parquet(f"{BASE}/partitioned")
assert df_part is not None

# 4. Filter + write
df.filter(F.col("category") == "Electronics").write.mode("overwrite").parquet(f"{BASE}/electronics")
df_elec = spark.read.parquet(f"{BASE}/electronics")
assert df_elec.count() == 3

# 5. Append
df_new = spark.createDataFrame([(6,"Keyboard","Electronics",49.99)],
                                ["id","product","category","price"])
df_new.write.mode("append").parquet(f"{BASE}/products_parquet")
df_appended = spark.read.parquet(f"{BASE}/products_parquet")
assert df_appended.count() == 6

# 6. Source file name
df_sourced = spark.read.parquet(f"{BASE}/products_parquet") \
    .withColumn("source_file", F.input_file_name())
assert "source_file" in df_sourced.columns

# 7. Column pruning
df_pruned = spark.read.parquet(f"{BASE}/products_parquet").select("id","product")
assert df_pruned.columns == ["id","product"]

print("All assertions passed!")
spark.stop()
