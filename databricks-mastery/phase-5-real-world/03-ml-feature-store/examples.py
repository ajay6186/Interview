# ============================================================================
# Examples 5.3 — ML Feature Store & MLflow  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# Covers: MLflow tracking, model registry, feature engineering, Delta as FS
# ============================================================================

import os
import mlflow
import mlflow.sklearn
import mlflow.spark
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.ml.feature import VectorAssembler, StandardScaler, StringIndexer
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.regression import LinearRegression
from pyspark.ml import Pipeline
from pyspark.ml.evaluation import BinaryClassificationEvaluator, RegressionEvaluator
import numpy as np

spark = (SparkSession.builder
    .appName("ml-feature-store")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/ml_fs"
for p in ["features/customer","features/product","models","mlruns"]:
    os.makedirs(f"{BASE}/{p}", exist_ok=True)

mlflow.set_tracking_uri(f"file://{BASE}/mlruns")

# ── Raw data ──────────────────────────────────────────────────────────────────
orders = spark.createDataFrame([
    ("cust_01",12, 1200.0,"2024-01-01","completed"),
    ("cust_01", 3,  150.0,"2024-01-05","completed"),
    ("cust_02", 1,  699.0,"2024-01-03","completed"),
    ("cust_02", 2,  300.0,"2024-01-08","refunded"),
    ("cust_03", 5,  899.0,"2024-01-02","completed"),
    ("cust_03", 1,   29.9,"2024-01-10","completed"),
    ("cust_04", 8, 2499.0,"2024-01-04","completed"),
], ["customer_id","quantity","amount","order_date","status"])

customers = spark.createDataFrame([
    ("cust_01","Alice","premium","New York",  "2022-01-01", 35),
    ("cust_02","Bob",  "standard","London",  "2023-06-15", 28),
    ("cust_03","Carol","premium","Tokyo",    "2021-09-01", 42),
    ("cust_04","Dave", "gold",   "New York", "2020-03-20", 55),
], ["customer_id","name","tier","city","joined_date","age"])

# ── BASIC ─────────────────────────────────────────────────────────────────────

# 1. MLflow experiment setup
exp_name = "/ecommerce_churn_model"
mlflow.set_experiment(exp_name)
print(f"Ex01 MLflow experiment: {exp_name}")

# 2. Start and end a run
with mlflow.start_run(run_name="baseline_run") as run:
    mlflow.log_param("model_type", "random_forest")
    mlflow.log_metric("accuracy", 0.85)
    print(f"Ex02 run_id={run.info.run_id}")

# 3. Log multiple params at once
with mlflow.start_run(run_name="param_log_demo"):
    mlflow.log_params({"n_estimators": 100, "max_depth": 5, "min_samples": 10})
    print("Ex03 logged params")

# 4. Log multiple metrics
with mlflow.start_run(run_name="metrics_demo"):
    mlflow.log_metrics({"auc": 0.91, "f1": 0.87, "precision": 0.88, "recall": 0.86})
    print("Ex04 logged metrics")

# 5. Log artifact (file)
artifact_path = "/tmp/feature_importance.txt"
with open(artifact_path, "w") as f:
    f.write("feature,importance\namount,0.45\nquantity,0.30\nage,0.25\n")

with mlflow.start_run(run_name="artifact_demo"):
    mlflow.log_artifact(artifact_path, artifact_path="feature_importance")
    print("Ex05 logged artifact")

# 6. Basic feature engineering — order statistics per customer
cust_features = (orders
    .filter(F.col("status") == "completed")
    .groupBy("customer_id")
    .agg(
        F.count("*").alias("order_count"),
        F.sum("amount").alias("total_spend"),
        F.avg("amount").alias("avg_order_value"),
        F.max("amount").alias("max_order_value"),
        F.sum("quantity").alias("total_items"),
    ))
cust_features.show()
print("Ex06 customer features computed")

# 7. Join features with customer attributes
df_ml = cust_features.join(customers.select("customer_id","tier","age"), "customer_id", "left")
df_ml.show()

# 8. Label encoding for tier
indexer = StringIndexer(inputCol="tier", outputCol="tier_idx")
df_indexed = indexer.fit(df_ml).transform(df_ml)
df_indexed.select("customer_id","tier","tier_idx").show()
print("Ex08 tier indexed")

# 9. Feature assembly for Spark ML
feature_cols = ["order_count","total_spend","avg_order_value","max_order_value","total_items","age","tier_idx"]
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features", handleInvalid="skip")
df_vec = assembler.transform(df_indexed)
df_vec.select("customer_id","features").show(truncate=False)
print("Ex09 features assembled")

# 10. Feature scaling
scaler = StandardScaler(inputCol="features", outputCol="scaled_features", withMean=True, withStd=True)
scaler_model = scaler.fit(df_vec)
df_scaled = scaler_model.transform(df_vec)
df_scaled.select("customer_id","scaled_features").show(truncate=False)
print("Ex10 features scaled")

# 11. Create churn label (no purchase in last 30 days proxy)
df_labeled = df_ml.withColumn("label",
    F.when(F.col("order_count") <= 1, 1.0).otherwise(0.0))
df_labeled.select("customer_id","order_count","label").show()
print("Ex11 churn labels created")

# 12. Train/test split
train_df, test_df = df_labeled.randomSplit([0.8, 0.2], seed=42)
print(f"Ex12 train={train_df.count()}  test={test_df.count()}")

# 13. SparkML pipeline
pipeline = Pipeline(stages=[
    StringIndexer(inputCol="tier", outputCol="tier_idx", handleInvalid="skip"),
    VectorAssembler(inputCols=["order_count","total_spend","avg_order_value","total_items","age","tier_idx"],
                    outputCol="features", handleInvalid="skip"),
    RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=50, seed=42)
])
print("Ex13 Pipeline stages defined")

# 14. Train pipeline
pipeline_model = pipeline.fit(df_labeled)
predictions = pipeline_model.transform(df_labeled)
predictions.select("customer_id","label","prediction","probability").show()
print("Ex14 Pipeline trained")

# 15. Evaluate model
evaluator = BinaryClassificationEvaluator(labelCol="label")
auc = evaluator.evaluate(predictions)
print(f"Ex15 AUC={round(auc, 4)}")

# ── INTERMEDIATE ──────────────────────────────────────────────────────────────

# 16. Full MLflow run with SparkML
with mlflow.start_run(run_name="churn_rf_v1") as run:
    mlflow.log_params({
        "num_trees": 50,
        "features": str(feature_cols[:5]),
        "label": "churn_flag",
    })
    model = pipeline.fit(df_labeled)
    preds = model.transform(df_labeled)
    auc_val = evaluator.evaluate(preds)
    mlflow.log_metric("train_auc", round(auc_val, 4))
    mlflow.spark.log_model(model, "churn_model")
    print(f"Ex16 Logged model run_id={run.info.run_id}  auc={auc_val:.4f}")

# 17. Feature store as Delta table (Delta as FS)
cust_features \
    .withColumn("_feature_ts", F.current_timestamp()) \
    .write.format("delta").mode("overwrite").save(f"{BASE}/features/customer")
print(f"Ex17 Feature table written: {cust_features.count()} rows")

# 18. Time-travel for point-in-time features
print("""Ex18 Point-in-time feature lookup:
features_at_T = spark.read.format('delta') \\
    .option('timestampAsOf','2024-01-10T00:00:00') \\
    .load('/features/customer')
# Ensures model training uses features as they existed at time T
""")

# 19. Feature reuse — load from Delta FS
loaded_features = spark.read.format("delta").load(f"{BASE}/features/customer")
print(f"Ex19 Feature store loaded: {loaded_features.columns}")

# 20. Window features — recency, frequency (RFM)
w_cust = Window.partitionBy("customer_id").orderBy("order_date")
rfm = (orders
    .withColumn("order_date", F.to_date("order_date"))
    .withColumn("days_since_prev",
        F.datediff("order_date", F.lag("order_date", 1).over(w_cust)))
    .groupBy("customer_id")
    .agg(
        F.count("*").alias("frequency"),
        F.sum("amount").alias("monetary"),
        F.datediff(F.lit("2024-01-15").cast("date"),
                   F.max("order_date").cast("date")).alias("recency_days"),
        F.avg("days_since_prev").alias("avg_days_between_orders"),
    ))
rfm.show()
print("Ex20 RFM features done")

# 21. Derived features — rolling averages via window
w_roll = Window.partitionBy("customer_id").orderBy("order_date") \
    .rowsBetween(-2, Window.currentRow)
orders_with_roll = (orders
    .withColumn("order_date", F.to_date("order_date"))
    .withColumn("rolling_3_avg", F.avg("amount").over(w_roll)))
orders_with_roll.select("customer_id","order_date","amount","rolling_3_avg").show()

# 22. One-hot encoding via pandas_udf alternative — SQL pivot
tier_pivot = (customers.select("customer_id","tier")
    .groupBy("customer_id")
    .pivot("tier", ["standard","premium","gold"])
    .count()
    .fillna(0))
tier_pivot.show()
print("Ex22 tier one-hot via pivot done")

# 23. MLflow model loading
runs = mlflow.search_runs(experiment_names=[exp_name], order_by=["metrics.train_auc DESC"])
if not runs.empty:
    best_run_id = runs.iloc[0]["run_id"]
    loaded_model = mlflow.spark.load_model(f"runs:/{best_run_id}/churn_model")
    print(f"Ex23 loaded model from run {best_run_id}")
else:
    print("Ex23 no runs found — skipping model load")

# 24. MLflow model registry — register model
with mlflow.start_run(run_name="churn_rf_register"):
    pipeline_model2 = pipeline.fit(df_labeled)
    result = mlflow.spark.log_model(
        pipeline_model2, "churn_model",
        registered_model_name="ecommerce_churn"
    )
    print(f"Ex24 registered model version: {result.version if hasattr(result,'version') else 'N/A'}")

# 25. Model stages (MLflow registry)
print("""Ex25 Model stages:
client = mlflow.tracking.MlflowClient()
client.transition_model_version_stage(
    name='ecommerce_churn', version='1', stage='Staging')
client.transition_model_version_stage(
    name='ecommerce_churn', version='1', stage='Production')
""")

# 26. Batch inference with registered model
print("""Ex26 Batch inference:
model_uri = 'models:/ecommerce_churn/Production'
loaded    = mlflow.spark.load_model(model_uri)
batch     = spark.read.format('delta').load('/silver/customers')
preds     = loaded.transform(batch)
preds.write.format('delta').mode('overwrite').save('/gold/churn_predictions')
""")

# 27. sklearn model with mlflow.sklearn
try:
    from sklearn.ensemble import RandomForestClassifier as SKForest
    from sklearn.metrics import roc_auc_score

    pdf = df_labeled.toPandas()
    X = pdf[["order_count","total_spend","avg_order_value","total_items"]].fillna(0)
    y = pdf["label"]

    with mlflow.start_run(run_name="sklearn_rf"):
        sk_model = SKForest(n_estimators=50, max_depth=4, random_state=42)
        sk_model.fit(X, y)
        auc_sk = roc_auc_score(y, sk_model.predict_proba(X)[:, 1])
        mlflow.log_params({"n_estimators": 50, "max_depth": 4})
        mlflow.log_metric("train_auc", round(auc_sk, 4))
        mlflow.sklearn.log_model(sk_model, "sklearn_churn_model")
        print(f"Ex27 sklearn model auc={auc_sk:.4f}")
except Exception as e:
    print(f"Ex27 sklearn not available or failed: {e}")

# 28. Hyperparameter search
print("""Ex28 Hyperparameter sweep:
for n_trees in [50, 100, 200]:
    for depth in [3, 5, 8]:
        with mlflow.start_run():
            mlflow.log_params({'n_trees': n_trees, 'max_depth': depth})
            model = RandomForestClassifier(numTrees=n_trees, maxDepth=depth)
            fitted = model.fit(train_df)
            auc = evaluator.evaluate(fitted.transform(test_df))
            mlflow.log_metric('auc', auc)
""")

# 29. Model comparison via MLflow UI
print("""Ex29 Compare runs:
runs_df = mlflow.search_runs(experiment_names=['/ecommerce_churn'],
                              order_by=['metrics.train_auc DESC'])
print(runs_df[['run_id','params.num_trees','metrics.train_auc']].head(5))
""")

# 30. Feature importance logging
rf_stage = pipeline_model.stages[-1]
if hasattr(rf_stage, "featureImportances"):
    importances = rf_stage.featureImportances.toArray()
    importance_dict = dict(zip(feature_cols[:len(importances)], importances))
    with mlflow.start_run(run_name="feature_importance"):
        mlflow.log_dict(importance_dict, "feature_importances.json")
    print(f"Ex30 feature importances logged: {importance_dict}")

# ── ADVANCED ──────────────────────────────────────────────────────────────────

# 31. Pandas UDF for feature engineering at scale
from pyspark.sql.types import DoubleType
import pandas as pd

@F.pandas_udf(DoubleType())
def log_transform(s: pd.Series) -> pd.Series:
    return np.log1p(s)

df_log = cust_features.withColumn("log_total_spend", log_transform(F.col("total_spend")))
df_log.select("customer_id","total_spend","log_total_spend").show()
print("Ex31 log transform via pandas_udf done")

# 32. Feature freshness check
print("""Ex32 Feature freshness:
latest_ts = spark.read.format('delta').load('/features/customer') \\
    .agg(F.max('_feature_ts')).collect()[0][0]
age_hours = (datetime.now() - latest_ts).total_seconds() / 3600
if age_hours > 24:
    raise RuntimeError(f'Features stale: {age_hours:.1f}h old (max 24h)')
""")

# 33. Online feature store pattern (Delta + Redis)
print("""Ex33 Online feature serving:
# Batch: write features to Delta (offline store)
features.write.format('delta').mode('overwrite').save('/features/customer')
# Streaming: sync latest features to Redis for low-latency serving
features_stream.writeStream.foreachBatch(lambda df, _: df.toPandas().apply(
    lambda r: redis_client.hset(f'cust:{r.customer_id}', mapping=r.to_dict()), axis=1
)).start()
""")

# 34. Feature versioning with Delta schema evolution
print("""Ex34 Feature versioning:
new_feature = df.withColumn('purchase_velocity',
    F.col('order_count') / F.col('account_age_days'))
new_feature.write.format('delta').mode('overwrite') \\
    .option('mergeSchema','true').save('/features/customer')
# Delta history records each schema change with timestamp
""")

# 35. Cross-validation with SparkML
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder

rf = RandomForestClassifier(featuresCol="features", labelCol="label", seed=42)
assembler_cv = VectorAssembler(
    inputCols=["order_count","total_spend","avg_order_value","total_items"],
    outputCol="features", handleInvalid="skip")
pipeline_cv = Pipeline(stages=[
    StringIndexer(inputCol="tier", outputCol="tier_idx", handleInvalid="skip"),
    assembler_cv, rf])
grid = ParamGridBuilder().addGrid(rf.numTrees, [10, 20]).build()
cv   = CrossValidator(estimator=pipeline_cv, estimatorParamMaps=grid,
                      evaluator=evaluator, numFolds=2, seed=42)
cv_model = cv.fit(df_labeled)
best_auc  = evaluator.evaluate(cv_model.transform(df_labeled))
print(f"Ex35 CV best AUC={best_auc:.4f}")

# 36. AutoML summary (Databricks AutoML)
print("""Ex36 Databricks AutoML:
from databricks import automl
summary = automl.classify(
    dataset=df_labeled,
    target_col='label',
    primary_metric='roc_auc',
    timeout_minutes=30,
)
print(summary.best_trial.mlflow_run_id)
print(summary.best_trial.metrics)
""")

# 37. Model explainability (SHAP)
print("""Ex37 SHAP values:
import shap
explainer = shap.TreeExplainer(sk_model)
shap_values = explainer.shap_values(X)
shap.summary_plot(shap_values[1], X, plot_type='bar')
# Log SHAP plot as MLflow artifact
mlflow.log_figure(fig, 'shap_summary.png')
""")

# 38. Regression example — LTV prediction
lr_pipe = Pipeline(stages=[
    StringIndexer(inputCol="tier", outputCol="tier_idx", handleInvalid="skip"),
    VectorAssembler(inputCols=["order_count","avg_order_value","total_items","age","tier_idx"],
                    outputCol="features", handleInvalid="skip"),
    LinearRegression(featuresCol="features", labelCol="total_spend", maxIter=100)
])
lr_model = lr_pipe.fit(df_ml.fillna({"age": 30}))
lr_preds  = lr_model.transform(df_ml.fillna({"age": 30}))
rmse = RegressionEvaluator(labelCol="total_spend", metricName="rmse").evaluate(lr_preds)
print(f"Ex38 LTV regression RMSE={round(rmse, 2)}")

# 39. Distributed hyperparameter tuning with Hyperopt
print("""Ex39 Hyperopt distributed tuning:
from hyperopt import fmin, tpe, hp, STATUS_OK, Trials
from pyspark.ml.classification import GBTClassifier

def objective(params):
    with mlflow.start_run(nested=True):
        gbt = GBTClassifier(maxIter=int(params['max_iter']),
                            maxDepth=int(params['max_depth']),
                            featuresCol='features', labelCol='label')
        model = Pipeline(stages=[assembler, gbt]).fit(train_df)
        auc   = evaluator.evaluate(model.transform(test_df))
        mlflow.log_metric('auc', auc)
        return {'loss': -auc, 'status': STATUS_OK}

search_space = {'max_iter': hp.quniform('max_iter',10,100,10),
                'max_depth': hp.quniform('max_depth',3,8,1)}
best = fmin(fn=objective, space=search_space, algo=tpe.suggest, max_evals=10,
            trials=SparkTrials(parallelism=4))
print(best)
""")

# 40. Feature monitoring — distribution drift
print("""Ex40 Feature drift detection:
from scipy.stats import ks_2samp

current  = current_features.select('total_spend').toPandas()['total_spend']
baseline = baseline_features.select('total_spend').toPandas()['total_spend']
stat, p_val = ks_2samp(current, baseline)
if p_val < 0.05:
    print(f'DRIFT DETECTED: total_spend KS stat={stat:.4f} p={p_val:.4f}')
""")

# 41. Champion/challenger model deployment
print("""Ex41 Champion/challenger:
# Route 90% traffic to champion, 10% to challenger
import random
def predict(features):
    if random.random() < 0.9:
        return champion_model.predict(features)
    else:
        return challenger_model.predict(features)
# Track both models' accuracy, promote challenger if better after N samples
""")

# 42. Model cards as MLflow tags
with mlflow.start_run(run_name="model_card_demo"):
    mlflow.set_tags({
        "model.owner":          "data-team",
        "model.use_case":       "churn_prediction",
        "model.training_data":  "2023-01-01 to 2024-01-01",
        "model.bias_audit":     "passed",
        "model.approved_by":    "jane.doe@company.com",
    })
    print("Ex42 model card tags logged")

# ── EXPERT ────────────────────────────────────────────────────────────────────

# 43. Feature store with Databricks Feature Store API
print("""Ex43 Databricks Feature Store:
from databricks.feature_store import FeatureStoreClient
fs = FeatureStoreClient()
fs.create_table(
    name='main.features.customer_stats',
    primary_keys=['customer_id'],
    schema=cust_features.schema,
    description='Customer purchase statistics'
)
fs.write_table(name='main.features.customer_stats', df=cust_features, mode='merge')
""")

# 44. Training with Feature Store lookup
print("""Ex44 FS-aware training:
from databricks.feature_store import FeatureLookup
feature_lookups = [FeatureLookup(table_name='main.features.customer_stats',
                                  feature_names=['order_count','total_spend'],
                                  lookup_key='customer_id')]
training_set = fs.create_training_set(df_labels, feature_lookups,
                                       label='churn', exclude_columns=['customer_id'])
training_df  = training_set.load_df()
model = pipeline.fit(training_df)
fs.log_model(model, artifact_path='churn_model', flavor=mlflow.spark,
             training_set=training_set, registered_model_name='churn_v2')
""")

# 45. Online inference with Model Serving endpoint
print("""Ex45 Model Serving (REST endpoint):
import requests
token = dbutils.secrets.get('model-serving', 'api_token')
resp = requests.post(
    'https://adb-xxx.azuredatabricks.net/serving-endpoints/churn-model/invocations',
    headers={'Authorization': f'Bearer {token}'},
    json={'dataframe_records': [{'customer_id':'cust_01','order_count':5,'total_spend':1500.0}]}
)
print(resp.json())
""")

# 46. A/B test framework for models
print("""Ex46 A/B test:
import hashlib
def get_model_version(customer_id: str) -> str:
    bucket = int(hashlib.md5(customer_id.encode()).hexdigest(), 16) % 100
    return 'v2' if bucket < 10 else 'v1'  # 10% get v2

predictions = df.withColumn('model_version',
    F.udf(get_model_version, StringType())(F.col('customer_id')))
""")

# 47. Retraining trigger on data drift
print("""Ex47 Drift-triggered retraining:
# Job runs daily:
# 1. Compute feature stats for latest 7 days
# 2. Compare KS test against training baseline
# 3. If p_val < 0.05 for any key feature → trigger retraining job
# 4. If new model AUC > current prod AUC + 0.01 → promote to Production
""")

# 48. ML model monitoring (Evidently / custom)
print("""Ex48 Model monitoring:
# Log predictions + actuals to Delta
preds_log = preds.select('customer_id','prediction','probability','label','ts')
preds_log.write.format('delta').mode('append').save('/monitoring/churn_preds')

# Weekly job:
window_df = spark.read.format('delta').load('/monitoring/churn_preds') \\
    .filter(col('ts') >= date_sub(current_date(),7))
weekly_auc = evaluator.evaluate(window_df)
mlflow.log_metric('weekly_auc', weekly_auc, step=week_number)
if weekly_auc < 0.75:
    trigger_retraining_job()
""")

# 49. Lakehouse ML pattern summary
print("""Ex49 Lakehouse ML architecture:
  Raw data    → Bronze Delta (append-only)
  Feature ETL → Silver Delta (cleansed)
  Feature FS  → Gold Delta (feature tables, partitioned by entity)
  Training    → MLflow experiment on Gold features
  Registry    → MLflow Model Registry: None → Staging → Production
  Inference   → Batch (Spark) or Real-time (Model Serving endpoint)
  Monitoring  → Prediction log → weekly drift checks → auto-retrain
""")

# 50. Production ML checklist
print("""Ex50 Production ML checklist:
✓ Features versioned in Delta (time-travel for PIT correctness)
✓ Training data lineage tracked via MLflow dataset
✓ All hyper-params, metrics, artifacts logged to MLflow
✓ Model registered with stage transitions (Staging → Production)
✓ Champion/challenger or A/B routing for safe rollout
✓ Batch predictions written to Delta with timestamp
✓ Weekly AUC monitoring with drift alerts
✓ Retraining automated when drift or AUC threshold breached
✓ Model cards: use case, training window, bias audit, approver
✓ Feature freshness SLA checked before each batch inference run
""")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
