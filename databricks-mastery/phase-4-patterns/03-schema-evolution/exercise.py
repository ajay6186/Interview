# ============================================================================
# Exercise 4.3 — Schema Evolution
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("schema-evolution-exercise")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/schev_ex"
os.makedirs(BASE, exist_ok=True)

v1 = spark.createDataFrame([(1,"Alice"),(2,"Bob")], ["id","name"])
v2 = spark.createDataFrame([(3,"Carol","carol@x.com")], ["id","name","email"])

# ---------------------------------------------------------------------------
# 1. Write v1 as Delta, then append v2 WITH schema evolution
# ---------------------------------------------------------------------------
# TODO: write v1 as delta overwrite to BASE/users
#       append v2 using mergeSchema=true
#       read back, store columns list in cols_after_merge
cols_after_merge = None  # replace

assert "email" in (cols_after_merge or []), "email column should appear after mergeSchema"

# ---------------------------------------------------------------------------
# 2. Check that older rows have null for new column
# ---------------------------------------------------------------------------
# TODO: read BASE/users, filter id==1, get the email value
#       store in email_for_id1
email_for_id1 = "NOT_READ"  # replace

assert email_for_id1 is None, f"Older rows should have null email, got {email_for_id1}"

# ---------------------------------------------------------------------------
# 3. overwriteSchema — replace with completely new schema
# ---------------------------------------------------------------------------
v3 = spark.createDataFrame([(10,99.5),(20,87.3)], ["user_id","score"])
# TODO: write v3 to BASE/users with mode overwrite AND overwriteSchema=true
#       read back, store columns list in cols_after_overwrite
cols_after_overwrite = None  # replace

assert "user_id" in (cols_after_overwrite or []), "user_id should exist after overwriteSchema"
assert "name" not in (cols_after_overwrite or []), "name should be gone after overwriteSchema"

# ---------------------------------------------------------------------------
# 4. Schema enforcement — expect error without mergeSchema
# ---------------------------------------------------------------------------
# TODO: write v1 as delta overwrite to BASE/strict
#       try appending v2 WITHOUT mergeSchema (should raise an exception)
#       catch the exception, store exception class name in err_type
err_type = None  # replace

assert err_type is not None, "Should have raised an exception"

# ---------------------------------------------------------------------------
# 5. Detect schema drift
# ---------------------------------------------------------------------------
# TODO: given old_cols = {"id","name"} and new_cols = {"id","name","email","age"}
#       compute added = new_cols - old_cols and removed = old_cols - new_cols
old_cols = {"id","name"}
new_cols = {"id","name","email","age"}
added   = None  # replace
removed = None  # replace

assert added   == {"email","age"}, f"Added cols wrong: {added}"
assert removed == set(),          f"Removed cols wrong: {removed}"

print("All assertions passed!")
spark.stop()
