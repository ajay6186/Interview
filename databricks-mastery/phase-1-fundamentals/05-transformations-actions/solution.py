# ============================================================================
# Solution 1.5 — Transformations & Actions
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark import StorageLevel

spark = SparkSession.builder.appName("transformations-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

df = spark.createDataFrame([
    (1,"Alice",95000.0,"Engineering",True),
    (2,"Bob",72000.0,"Marketing",True),
    (3,"Carol",105000.0,"Engineering",True),
    (4,"Dave",68000.0,"Marketing",False),
    (5,"Eve",88000.0,"Engineering",True),
    (6,"Frank",60000.0,"HR",None),
    (7,"Grace",80000.0,"HR",False),
], ["id","name","salary","dept","active"])

# 1. Lazy chain
pipeline = (df
    .filter(F.col("active") == True)
    .withColumn("bonus", F.round(F.col("salary") * 0.10, 2))
    .select("name","salary","bonus")
    .orderBy(F.col("salary").desc()))

assert pipeline is not None

# 2. Count
active_count = pipeline.count()
assert active_count == 4

# 3. Cache
pipeline.cache()
cached_count = pipeline.count()
assert cached_count == 4
pipeline.unpersist()

# 4. Collect names
active_names = [r["name"] for r in pipeline.collect()]
assert isinstance(active_names, list)
assert "Alice" in active_names

# 5. Drop nulls
df_clean = df.na.drop(subset=["active"])
assert df_clean.count() == 6

# 6. Repartition + coalesce
df_single = df.repartition(2).coalesce(1)
assert df_single.rdd.getNumPartitions() == 1

# 7. toLocalIterator
iter_count = sum(1 for _ in df.toLocalIterator())
assert iter_count == 7

# 8. Broadcast join
dept_info = spark.createDataFrame([
    ("Engineering","NYC"),("Marketing","LA"),("HR","Chicago")
], ["dept","city"])

df_joined = df.join(F.broadcast(dept_info), on="dept", how="inner")
assert "city" in df_joined.columns

print("All assertions passed!")
spark.stop()
