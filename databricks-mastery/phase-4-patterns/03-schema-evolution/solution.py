# ============================================================================
# Solution 4.3 — Schema Evolution
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("schema-evolution-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/schev_sol"
os.makedirs(BASE, exist_ok=True)

v1 = spark.createDataFrame([(1,"Alice"),(2,"Bob")], ["id","name"])
v2 = spark.createDataFrame([(3,"Carol","carol@x.com")], ["id","name","email"])

# 1. mergeSchema
v1.write.format("delta").mode("overwrite").save(f"{BASE}/users")
v2.write.format("delta").mode("append").option("mergeSchema","true").save(f"{BASE}/users")
cols_after_merge = spark.read.format("delta").load(f"{BASE}/users").columns
assert "email" in cols_after_merge

# 2. Null for older rows
email_for_id1 = spark.read.format("delta").load(f"{BASE}/users") \
    .filter(F.col("id")==1).collect()[0]["email"]
assert email_for_id1 is None

# 3. overwriteSchema
v3 = spark.createDataFrame([(10,99.5),(20,87.3)], ["user_id","score"])
v3.write.format("delta").mode("overwrite").option("overwriteSchema","true").save(f"{BASE}/users")
cols_after_overwrite = spark.read.format("delta").load(f"{BASE}/users").columns
assert "user_id" in cols_after_overwrite
assert "name" not in cols_after_overwrite

# 4. Schema enforcement error
v1.write.format("delta").mode("overwrite").save(f"{BASE}/strict")
err_type = None
try:
    v2.write.format("delta").mode("append").save(f"{BASE}/strict")
except Exception as e:
    err_type = type(e).__name__
assert err_type is not None

# 5. Schema drift detection
old_cols = {"id","name"}
new_cols = {"id","name","email","age"}
added   = new_cols - old_cols
removed = old_cols - new_cols
assert added   == {"email","age"}
assert removed == set()

print("All assertions passed!")
spark.stop()
