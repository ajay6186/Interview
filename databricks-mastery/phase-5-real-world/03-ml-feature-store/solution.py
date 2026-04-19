# ============================================================================
# Solution 5.3 — ML Feature Store & MLflow
# ============================================================================

import os, mlflow, mlflow.sklearn
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.ml.feature import VectorAssembler, StringIndexer
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml import Pipeline
from pyspark.ml.evaluation import BinaryClassificationEvaluator

spark = (SparkSession.builder
    .appName("ml-feature-solution")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/ml_ex"
os.makedirs(f"{BASE}/features", exist_ok=True)
os.makedirs(f"{BASE}/mlruns",   exist_ok=True)
mlflow.set_tracking_uri(f"file://{BASE}/mlruns")

orders = spark.createDataFrame([
    ("cust_01", 5, 1500.0, "2024-01-01"),
    ("cust_01", 3,  300.0, "2024-01-05"),
    ("cust_02", 1,  699.0, "2024-01-03"),
    ("cust_02", 2,  300.0, "2024-01-08"),
    ("cust_03", 8, 2499.0, "2024-01-02"),
    ("cust_03", 1,   29.9, "2024-01-10"),
    ("cust_04", 1,   49.0, "2024-01-14"),
], ["customer_id","quantity","amount","order_date"])

customers = spark.createDataFrame([
    ("cust_01","Alice","premium",35),
    ("cust_02","Bob",  "standard",28),
    ("cust_03","Carol","premium",42),
    ("cust_04","Dave", "standard",22),
], ["customer_id","name","tier","age"])

# 1. Aggregate features
cust_features = (orders.groupBy("customer_id")
    .agg(
        F.count("*").alias("order_count"),
        F.sum("amount").alias("total_spend"),
        F.round(F.avg("amount"),2).alias("avg_amount"),
        F.max("amount").alias("max_amount"),
        F.sum("quantity").alias("total_qty"),
    ))
assert "order_count" in cust_features.columns
row = cust_features.filter(F.col("customer_id") == "cust_01").first()
assert row["order_count"] == 2
assert abs(row["total_spend"] - 1800.0) < 0.01
print(f"[1] features: {cust_features.count()} customers")

# 2. Join features with customer attributes
df_ml = cust_features.join(customers.select("customer_id","tier","age"), "customer_id","left")
assert "tier" in df_ml.columns and "age" in df_ml.columns
print(f"[2] df_ml rows={df_ml.count()}")

# 3. Churn label
df_labeled = df_ml.withColumn("label",
    F.when(F.col("order_count") <= 1, 1.0).otherwise(0.0))
churn_count = df_labeled.filter(F.col("label") == 1.0).count()
assert churn_count == 2
print(f"[3] churn_count={churn_count}")

# 4. Log-transform
df_log = df_labeled.withColumn("log_total_spend", F.log1p(F.col("total_spend")))
neg_log = df_log.filter(F.col("log_total_spend") < 0).count()
assert neg_log == 0
print(f"[4] log_total_spend min={df_log.agg(F.min('log_total_spend')).collect()[0][0]:.4f}")

# 5. Pipeline
pipeline = Pipeline(stages=[
    StringIndexer(inputCol="tier", outputCol="tier_idx", handleInvalid="skip"),
    VectorAssembler(inputCols=["order_count","total_spend","avg_amount","total_qty","age","tier_idx"],
                    outputCol="features", handleInvalid="skip"),
    RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=20, seed=42)
])
assert len(pipeline.getStages()) == 3
print(f"[5] stages: {[type(s).__name__ for s in pipeline.getStages()]}")

# 6. Train and evaluate
pipeline_model = pipeline.fit(df_labeled)
predictions    = pipeline_model.transform(df_labeled)
auc            = BinaryClassificationEvaluator(labelCol="label").evaluate(predictions)
assert isinstance(auc, float) and 0.0 <= auc <= 1.0
print(f"[6] AUC={auc:.4f}")

# 7. MLflow logging
mlflow.set_experiment("/ex_churn_model")
with mlflow.start_run(run_name="rf_v1") as run:
    mlflow.log_param("num_trees", 20)
    mlflow.log_metric("train_auc", round(auc, 4))
    run_id = run.info.run_id
assert run_id is not None and len(run_id) > 0
print(f"[7] run_id={run_id}")

# 8. Feature store
(df_ml.withColumn("_feature_ts", F.current_timestamp())
    .write.format("delta").mode("overwrite")
    .save(f"{BASE}/features/customer_features"))
fs_count = spark.read.format("delta").load(f"{BASE}/features/customer_features").count()
assert fs_count == 4
print(f"[8] feature store rows={fs_count}")

# 9. RFM features
rfm_df = (orders
    .withColumn("order_date", F.to_date("order_date"))
    .groupBy("customer_id")
    .agg(
        F.datediff(F.lit("2024-01-15").cast("date"), F.max("order_date")).alias("recency_days"),
        F.count("*").alias("frequency"),
        F.sum("amount").alias("monetary"),
    ))
cust3 = rfm_df.filter(F.col("customer_id") == "cust_03").first()
assert cust3["frequency"] == 2
print(f"[9] RFM cust_03 freq={cust3['frequency']}")

# 10. Feature importances
rf_stage = pipeline_model.stages[-1]
importances_list = rf_stage.featureImportances.toArray().tolist()
assert len(importances_list) == 6
assert abs(sum(importances_list) - 1.0) < 0.001
print(f"[10] importances (sum={sum(importances_list):.4f}): {[round(v,3) for v in importances_list]}")

print("\nAll assertions passed!")
spark.stop()
