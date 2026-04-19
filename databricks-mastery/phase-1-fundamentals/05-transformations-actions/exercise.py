# ============================================================================
# Exercise 1.5 — Transformations & Actions
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark import StorageLevel

spark = SparkSession.builder.appName("transformations-exercise").getOrCreate()
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

# ---------------------------------------------------------------------------
# 1. Build a lazy chain — do NOT trigger an action yet
#    Chain: filter active==True → withColumn bonus(10%) → select name,salary,bonus → orderBy salary desc
# ---------------------------------------------------------------------------
# TODO: build the chain into `pipeline` (no show/count/collect)
pipeline = None  # replace None

assert pipeline is not None, "pipeline must be a DataFrame"

# ---------------------------------------------------------------------------
# 2. Trigger with count (action) — how many active employees?
# ---------------------------------------------------------------------------
# TODO: active_count = pipeline.count()
active_count = None  # replace None

assert active_count == 4  # Alice, Bob, Carol, Eve

# ---------------------------------------------------------------------------
# 3. Cache pipeline, run count twice (second should be faster)
# ---------------------------------------------------------------------------
# TODO: cache pipeline, call count twice, then unpersist
cached_count = None  # replace None

assert cached_count == 4

# ---------------------------------------------------------------------------
# 4. collect() and extract names as Python list
# ---------------------------------------------------------------------------
# TODO: active_names = list of name strings from pipeline
active_names = None  # replace None

assert isinstance(active_names, list)
assert "Alice" in active_names

# ---------------------------------------------------------------------------
# 5. Drop rows where active is null
# ---------------------------------------------------------------------------
# TODO: df_clean = drop rows with null in active column
df_clean = None  # replace None

assert df_clean.count() == 6  # Frank(null active) dropped

# ---------------------------------------------------------------------------
# 6. repartition to 2, then coalesce to 1
# ---------------------------------------------------------------------------
# TODO: df_single = repartition(2) then coalesce(1)
df_single = None  # replace None

assert df_single.rdd.getNumPartitions() == 1

# ---------------------------------------------------------------------------
# 7. Use toLocalIterator to count rows without collect()
# ---------------------------------------------------------------------------
# TODO: iterate df using toLocalIterator, count rows → iter_count
iter_count = None  # replace None

assert iter_count == 7

# ---------------------------------------------------------------------------
# 8. Broadcast join hint
# ---------------------------------------------------------------------------
dept_info = spark.createDataFrame([
    ("Engineering","NYC"),("Marketing","LA"),("HR","Chicago")
], ["dept","city"])

# TODO: join df with dept_info using broadcast hint on dept_info → df_joined
df_joined = None  # replace None

assert "city" in df_joined.columns

print("All assertions passed!")
spark.stop()
