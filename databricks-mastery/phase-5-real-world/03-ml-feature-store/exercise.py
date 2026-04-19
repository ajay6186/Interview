# ============================================================================
# Exercise 5.3 — ML Feature Store & MLflow
# ============================================================================
# Build features, train a classifier, log to MLflow, and practice
# feature engineering patterns used in production ML pipelines.
#
# Instructions: Replace every None / pass so all assertions pass.
# ============================================================================

import os, mlflow, mlflow.sklearn
import numpy as np
import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.ml.feature import VectorAssembler, StringIndexer, StandardScaler
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml import Pipeline
from pyspark.ml.evaluation import BinaryClassificationEvaluator

spark = (SparkSession.builder
    .appName("ml-feature-exercise")
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

# ---------------------------------------------------------------------------
# 1. Aggregate customer purchase features
# ---------------------------------------------------------------------------
# TODO: From orders, groupBy customer_id, compute:
#   - order_count  = count(*)
#   - total_spend  = sum(amount)
#   - avg_amount   = avg(amount) rounded to 2
#   - max_amount   = max(amount)
#   - total_qty    = sum(quantity)
# Store in cust_features

cust_features = None  # replace

assert cust_features is not None
assert "order_count" in cust_features.columns
assert "total_spend" in cust_features.columns
row = cust_features.filter(F.col("customer_id") == "cust_01").first()
assert row["order_count"] == 2
assert abs(row["total_spend"] - 1800.0) < 0.01
print(f"[1] features: {cust_features.count()} customers")

# ---------------------------------------------------------------------------
# 2. Join features with customer attributes
# ---------------------------------------------------------------------------
# TODO: join cust_features with customers on customer_id (left join)
#       include: tier and age columns
#       store in df_ml

df_ml = None  # replace

assert "tier" in df_ml.columns and "age" in df_ml.columns
assert df_ml.count() == 4
print(f"[2] df_ml shape: {df_ml.count()} rows, {len(df_ml.columns)} cols")

# ---------------------------------------------------------------------------
# 3. Churn label
# ---------------------------------------------------------------------------
# TODO: add label column: 1.0 if order_count <= 1, else 0.0
#       store in df_labeled

df_labeled = None  # replace

assert "label" in df_labeled.columns
churn_count = df_labeled.filter(F.col("label") == 1.0).count()
assert churn_count == 2, f"Expected 2 churn customers (cust_02, cust_04), got {churn_count}"
print(f"[3] churn count={churn_count}")

# ---------------------------------------------------------------------------
# 4. Log-transform skewed feature
# ---------------------------------------------------------------------------
# TODO: add log_total_spend = log1p(total_spend) using F.log1p()
#       verify all values are >= 0

df_log = None  # replace

assert "log_total_spend" in df_log.columns
neg_log = df_log.filter(F.col("log_total_spend") < 0).count()
assert neg_log == 0, "log1p should produce no negative values"
print(f"[4] log_total_spend added, min={df_log.agg(F.min('log_total_spend')).collect()[0][0]:.4f}")

# ---------------------------------------------------------------------------
# 5. Build Spark ML Pipeline
# ---------------------------------------------------------------------------
# TODO: Build a Pipeline with these stages:
#   - StringIndexer: inputCol="tier", outputCol="tier_idx", handleInvalid="skip"
#   - VectorAssembler: inputCols=["order_count","total_spend","avg_amount","total_qty","age","tier_idx"]
#                      outputCol="features", handleInvalid="skip"
#   - RandomForestClassifier: featuresCol="features", labelCol="label", numTrees=20, seed=42
# Store in pipeline

pipeline = None  # replace

assert pipeline is not None
assert len(pipeline.getStages()) == 3
print(f"[5] pipeline stages: {[type(s).__name__ for s in pipeline.getStages()]}")

# ---------------------------------------------------------------------------
# 6. Train and evaluate
# ---------------------------------------------------------------------------
# TODO: fit pipeline on df_labeled → pipeline_model
#       transform df_labeled → predictions
#       evaluate with BinaryClassificationEvaluator (labelCol="label")
#       store AUC in auc (float)

pipeline_model = None  # replace
predictions    = None  # replace
auc            = None  # replace

assert pipeline_model is not None
assert predictions is not None
assert isinstance(auc, float), f"AUC should be float, got {type(auc)}"
assert 0.0 <= auc <= 1.0, f"AUC should be in [0,1], got {auc}"
print(f"[6] AUC={auc:.4f}")

# ---------------------------------------------------------------------------
# 7. Log experiment to MLflow
# ---------------------------------------------------------------------------
# TODO: Set experiment name to "/ex_churn_model"
#       Start a run named "rf_v1"
#       log_param: num_trees=20
#       log_metric: train_auc=auc (rounded to 4 decimal places)
#       Store run_id in run_id

run_id = None  # replace

assert run_id is not None and len(run_id) > 0
print(f"[7] MLflow run_id={run_id}")

# ---------------------------------------------------------------------------
# 8. Write features to Delta feature store
# ---------------------------------------------------------------------------
# TODO: Write df_ml to f"{BASE}/features/customer_features" as delta, mode overwrite
#       Also add a _feature_ts = current_timestamp() column before writing
#       Store row count in fs_count

fs_count = None  # replace

assert fs_count == 4
loaded = spark.read.format("delta").load(f"{BASE}/features/customer_features")
assert "_feature_ts" in loaded.columns
print(f"[8] feature store rows={fs_count}")

# ---------------------------------------------------------------------------
# 9. RFM features
# ---------------------------------------------------------------------------
# TODO: compute RFM features from orders:
#   - recency_days = datediff(lit("2024-01-15"), max(order_date))
#   - frequency    = count(*)
#   - monetary     = sum(amount)
# store in rfm_df

rfm_df = None  # replace

assert "recency_days" in rfm_df.columns
assert "frequency" in rfm_df.columns
assert "monetary" in rfm_df.columns
cust3 = rfm_df.filter(F.col("customer_id") == "cust_03").first()
assert cust3["frequency"] == 2
print(f"[9] RFM: {rfm_df.count()} customers, cust_03 freq={cust3['frequency']}")

# ---------------------------------------------------------------------------
# 10. Feature importance
# ---------------------------------------------------------------------------
# TODO: extract feature importances from the RandomForest stage of pipeline_model
#       The RF is the last stage: pipeline_model.stages[-1]
#       Convert featureImportances (SparseVector) to a Python list → importances_list
#       Verify it has the same length as the number of feature columns (6)

importances_list = None  # replace

assert importances_list is not None
assert len(importances_list) == 6, f"Expected 6 importances, got {len(importances_list)}"
assert abs(sum(importances_list) - 1.0) < 0.001, "Importances should sum to ~1.0"
print(f"[10] feature importances (sum={sum(importances_list):.4f}): {[round(v,3) for v in importances_list]}")

print("\nAll assertions passed!")
spark.stop()
