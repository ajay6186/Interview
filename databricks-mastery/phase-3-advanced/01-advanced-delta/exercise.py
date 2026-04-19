# ============================================================================
# Exercise 3.1 — Advanced Delta Lake
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("adv-delta-exercise")
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

# ---------------------------------------------------------------------------
# 1. Write as Delta, partitioned by region
# ---------------------------------------------------------------------------
# TODO: write transactions as delta, mode=overwrite, partitionBy region

df_check = spark.read.format("delta").load(TABLE_PATH)
assert df_check.count() == 5
assert df_check.columns != []

# ---------------------------------------------------------------------------
# 2. UPDATE: set amount = 0 for refunds
# ---------------------------------------------------------------------------
# TODO: use DeltaTable.forPath, update rows where type == "refund", set amount = 0

df_upd = spark.read.format("delta").load(TABLE_PATH)
assert df_upd.filter(F.col("type")=="refund").agg(F.sum("amount")).first()[0] == 0.0

# ---------------------------------------------------------------------------
# 3. DELETE: remove all refund transactions
# ---------------------------------------------------------------------------
# TODO: delete where type == "refund"

df_del = spark.read.format("delta").load(TABLE_PATH)
assert df_del.filter(F.col("type")=="refund").count() == 0

# ---------------------------------------------------------------------------
# 4. MERGE: upsert new transactions
# ---------------------------------------------------------------------------
new_txns = spark.createDataFrame([
    (3,"2024-01-03","purchase",350.0,"EU"),  # update (amount changed)
    (6,"2024-01-06","purchase",500.0,"APAC"), # new row
], ["txn_id","date","type","amount","region"])

# TODO: MERGE new_txns into TABLE_PATH: whenMatchedUpdateAll, whenNotMatchedInsertAll

df_merged = spark.read.format("delta").load(TABLE_PATH)
assert df_merged.filter(F.col("txn_id")==6).count() == 1
assert df_merged.filter(F.col("txn_id")==3).first()["amount"] == 350.0

# ---------------------------------------------------------------------------
# 5. Time travel — read version 0 (original data before any modifications)
# ---------------------------------------------------------------------------
# TODO: df_v0 = read delta at versionAsOf=0
df_v0 = None  # replace None

assert df_v0.count() == 5  # original 5 rows

# ---------------------------------------------------------------------------
# 6. OPTIMIZE the table
# ---------------------------------------------------------------------------
# TODO: run OPTIMIZE on TABLE_PATH
print("Ex06 OPTIMIZE done")

# ---------------------------------------------------------------------------
# 7. DESCRIBE HISTORY and count versions
# ---------------------------------------------------------------------------
# TODO: history = spark.sql("DESCRIBE HISTORY delta.`TABLE_PATH`")
#       n_versions = history.count()
history = None  # replace None
n_versions = None  # replace None

assert n_versions >= 3, f"Expected >=3 versions, got {n_versions}"

# ---------------------------------------------------------------------------
# 8. Enable CDF and verify change types after an update
# ---------------------------------------------------------------------------
# TODO: ALTER TABLE to enable delta.enableChangeDataFeed = true
#       Make one more update (e.g., set region = 'NA' where region = 'US')
#       Read CDF with readChangeFeed=true, startingVersion=0
#       Assert _change_type column exists
cdf_df = None  # replace None

assert cdf_df is not None
assert "_change_type" in cdf_df.columns

print("All assertions passed!")
spark.stop()
