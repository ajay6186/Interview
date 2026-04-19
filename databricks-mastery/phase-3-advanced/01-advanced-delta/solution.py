# ============================================================================
# Solution 3.1 — Advanced Delta Lake
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("adv-delta-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/adv_delta_ex"
TABLE_PATH = f"{BASE}/transactions"
os.makedirs(BASE, exist_ok=True)

transactions = spark.createDataFrame([
    (1,"2024-01-01","purchase",150.0,"US"),
    (2,"2024-01-02","refund",-50.0,"US"),
    (3,"2024-01-03","purchase",300.0,"EU"),
    (4,"2024-01-04","purchase",75.0,"EU"),
    (5,"2024-01-05","refund",-30.0,"US"),
], ["txn_id","date","type","amount","region"])

# 1. Write as Delta
transactions.write.format("delta").mode("overwrite").partitionBy("region").save(TABLE_PATH)
assert spark.read.format("delta").load(TABLE_PATH).count() == 5

# 2. UPDATE refunds
dt = DeltaTable.forPath(spark, TABLE_PATH)
dt.update(condition=F.col("type")=="refund", set={"amount": F.lit(0.0)})
assert spark.read.format("delta").load(TABLE_PATH).filter(F.col("type")=="refund").agg(F.sum("amount")).first()[0] == 0.0

# 3. DELETE refunds
dt.delete(condition=F.col("type")=="refund")
assert spark.read.format("delta").load(TABLE_PATH).filter(F.col("type")=="refund").count() == 0

# 4. MERGE
new_txns = spark.createDataFrame([
    (3,"2024-01-03","purchase",350.0,"EU"),
    (6,"2024-01-06","purchase",500.0,"APAC"),
], ["txn_id","date","type","amount","region"])

dt.alias("t").merge(new_txns.alias("s"), "t.txn_id = s.txn_id") \
  .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()

df_merged = spark.read.format("delta").load(TABLE_PATH)
assert df_merged.filter(F.col("txn_id")==6).count() == 1
assert df_merged.filter(F.col("txn_id")==3).first()["amount"] == 350.0

# 5. Time travel v0
df_v0 = spark.read.format("delta").option("versionAsOf",0).load(TABLE_PATH)
assert df_v0.count() == 5

# 6. OPTIMIZE
spark.sql(f"OPTIMIZE delta.`{TABLE_PATH}`")
print("Ex06 OPTIMIZE done")

# 7. Describe history
history = spark.sql(f"DESCRIBE HISTORY delta.`{TABLE_PATH}`")
n_versions = history.count()
assert n_versions >= 3

# 8. CDF
spark.sql(f"ALTER TABLE delta.`{TABLE_PATH}` SET TBLPROPERTIES ('delta.enableChangeDataFeed'='true')")
dt = DeltaTable.forPath(spark, TABLE_PATH)
dt.update(F.col("region")=="US", {"region": F.lit("NA")})
cdf_df = spark.read.format("delta") \
    .option("readChangeFeed","true") \
    .option("startingVersion",0) \
    .load(TABLE_PATH)
assert "_change_type" in cdf_df.columns

print("All assertions passed!")
spark.stop()
