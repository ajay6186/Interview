# ============================================================================
# Exercise 1.4 — Reading & Writing Data
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, IntegerType, StringType, DoubleType

spark = SparkSession.builder.appName("read-write-exercise").getOrCreate()
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

# ---------------------------------------------------------------------------
# 1. Write df as Parquet then read it back
# ---------------------------------------------------------------------------
# TODO: write df to f"{BASE}/products_parquet" (overwrite)
#       read it back into df_parquet
df_parquet = None  # replace None

assert df_parquet is not None
assert df_parquet.count() == 5

# ---------------------------------------------------------------------------
# 2. Write df as CSV with header then read with explicit schema
# ---------------------------------------------------------------------------
schema = StructType([
    StructField("id",       IntegerType(), True),
    StructField("product",  StringType(),  True),
    StructField("category", StringType(),  True),
    StructField("price",    DoubleType(),  True),
])
# TODO: write CSV then read with schema above → df_csv
df_csv = None  # replace None

assert df_csv is not None
assert df_csv.schema["price"].dataType == DoubleType()

# ---------------------------------------------------------------------------
# 3. Write partitioned by category, read back
# ---------------------------------------------------------------------------
# TODO: write df partitioned by "category" to f"{BASE}/partitioned"
#       read back → df_part
df_part = None  # replace None

assert df_part is not None

# ---------------------------------------------------------------------------
# 4. Filter before write: only Electronics, read back and count
# ---------------------------------------------------------------------------
# TODO: filter df where category == "Electronics"
#       write as parquet to f"{BASE}/electronics"
#       read back into df_elec
df_elec = None  # replace None

assert df_elec.count() == 3

# ---------------------------------------------------------------------------
# 5. Append a new row to existing parquet
# ---------------------------------------------------------------------------
# TODO: Create a new DataFrame with 1 row: (6,"Keyboard","Electronics",49.99)
#       Append it to f"{BASE}/products_parquet"
#       Read back → df_appended, should have 6 rows
df_appended = None  # replace None

assert df_appended is not None
assert df_appended.count() == 6

# ---------------------------------------------------------------------------
# 6. Add source file name column
# ---------------------------------------------------------------------------
# TODO: Read parquet and add column "source_file" = F.input_file_name() → df_sourced
df_sourced = None  # replace None

assert "source_file" in df_sourced.columns

# ---------------------------------------------------------------------------
# 7. Read with column pruning (select only id and product)
# ---------------------------------------------------------------------------
# TODO: Read parquet, select only "id" and "product" → df_pruned
df_pruned = None  # replace None

assert df_pruned.columns == ["id", "product"]

print("All assertions passed!")
spark.stop()
