# ============================================================================
# Examples 3.5 — MLflow Integration  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================
# pip install mlflow scikit-learn
# In Databricks: MLflow is pre-installed and auto-configured
# ============================================================================

import mlflow
import mlflow.sklearn
import mlflow.spark
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("mlflow-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Set MLflow tracking URI (default: local ./mlruns)
mlflow.set_tracking_uri("file:///tmp/mlflow_examples")
print("Ex01 tracking URI:", mlflow.get_tracking_uri())

# 2. Create/set experiment
mlflow.set_experiment("/examples/salary_prediction")
exp = mlflow.get_experiment_by_name("/examples/salary_prediction")
print("Ex02 experiment:", exp.name if exp else "created")

# 3. Start a run
with mlflow.start_run(run_name="baseline_run") as run:
    print("Ex03 run_id:", run.info.run_id)
    mlflow.log_param("model_type","linear_regression")
    mlflow.log_metric("rmse", 5000.0)
print("Ex03 run completed")

# 4. Log params
np.random.seed(42)
X = np.random.randn(200, 3)
y = X[:,0]*2 + X[:,1]*(-1) + np.random.randn(200)*0.5

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = LinearRegression()

with mlflow.start_run(run_name="linear_reg"):
    mlflow.log_params({"fit_intercept": True, "normalize": False})
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mlflow.log_metric("rmse", rmse)
    print("Ex04 rmse logged:", rmse)

# 5. Log multiple metrics
with mlflow.start_run(run_name="multi_metric"):
    mlflow.log_metrics({"rmse":4.5, "mae":3.2, "r2":0.92})
print("Ex05 multiple metrics logged")

# 6. Log artifact (file)
import os
os.makedirs("/tmp/mlflow_artifacts", exist_ok=True)
with open("/tmp/mlflow_artifacts/notes.txt","w") as f:
    f.write("Experiment notes: baseline model")

with mlflow.start_run(run_name="with_artifact"):
    mlflow.log_artifact("/tmp/mlflow_artifacts/notes.txt")
print("Ex06 artifact logged")

# 7. Log artifact directory
with mlflow.start_run(run_name="dir_artifact"):
    mlflow.log_artifacts("/tmp/mlflow_artifacts", artifact_path="docs")
print("Ex07 directory artifact logged")

# 8. Log sklearn model
with mlflow.start_run(run_name="sklearn_model") as run:
    model.fit(X_train, y_train)
    mlflow.sklearn.log_model(model, "linear_reg_model")
    run_id = run.info.run_id
print("Ex08 sklearn model logged, run_id:", run_id)

# 9. Load logged model
loaded = mlflow.sklearn.load_model(f"runs:/{run_id}/linear_reg_model")
pred = loaded.predict(X_test[:1])
print("Ex09 loaded model prediction:", pred)

# 10. autolog — automatic param/metric/model logging
mlflow.sklearn.autolog()
with mlflow.start_run(run_name="autolog_rf"):
    rf = RandomForestClassifier(n_estimators=10, random_state=42)
    X_cls = np.random.randn(200,4)
    y_cls = (X_cls[:,0] > 0).astype(int)
    X_tr, X_te, y_tr, y_te = train_test_split(X_cls, y_cls, test_size=0.2)
    rf.fit(X_tr, y_tr)
print("Ex10 autolog RF done")
mlflow.sklearn.autolog(disable=True)

# 11. log_figure — matplotlib figure
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
ax.scatter(y_test, preds)
ax.set_xlabel("actual"); ax.set_ylabel("predicted")
with mlflow.start_run(run_name="with_figure"):
    mlflow.log_figure(fig, "scatter.png")
plt.close(fig)
print("Ex11 figure logged")

# 12. log_dict — log Python dict as JSON artifact
with mlflow.start_run(run_name="dict_artifact"):
    mlflow.log_dict({"feature_names":["f1","f2","f3"],"n_features":3}, "metadata.json")
print("Ex12 dict artifact logged")

# 13. log_text — log text as artifact
with mlflow.start_run(run_name="text_artifact"):
    mlflow.log_text("Model trained on salary data\nVersion: 1.0", "model_card.txt")
print("Ex13 text artifact logged")

# 14. Tags
with mlflow.start_run(run_name="tagged_run"):
    mlflow.set_tags({"team":"data-science","env":"dev","version":"v1.0"})
print("Ex14 tags set")

# 15. Get run info
runs = mlflow.search_runs(experiment_names=["/examples/salary_prediction"])
print("Ex15 total runs:", len(runs))
print(runs[["run_id","metrics.rmse","params.model_type"]].head())

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Model registry — register model
with mlflow.start_run(run_name="register_model") as run:
    model.fit(X_train, y_train)
    mlflow.sklearn.log_model(model, "model", registered_model_name="SalaryPredictor")
print("Ex16 model registered as SalaryPredictor")

# 17. Model versions
client = mlflow.tracking.MlflowClient()
versions = client.search_model_versions("name='SalaryPredictor'")
print("Ex17 versions:", [(v.version, v.current_stage) for v in versions])

# 18. Transition model stage (legacy API — MLflow < 2.9)
try:
    client.transition_model_version_stage("SalaryPredictor","1","Staging")
    print("Ex18 model moved to Staging")
except Exception as e:
    print("Ex18:", str(e)[:60])

# 19. Set model alias (MLflow 2.x)
try:
    client.set_registered_model_alias("SalaryPredictor","champion","1")
    print("Ex19 alias 'champion' set to version 1")
except Exception as e:
    print("Ex19:", str(e)[:60])

# 20. Load model by alias
try:
    champion = mlflow.sklearn.load_model("models:/SalaryPredictor@champion")
    print("Ex20 champion model loaded")
except Exception as e:
    print("Ex20:", str(e)[:60])

# 21. Load model by version
try:
    v1 = mlflow.sklearn.load_model("models:/SalaryPredictor/1")
    print("Ex21 version 1 loaded")
except Exception as e:
    print("Ex21:", str(e)[:60])

# 22. Model description
try:
    client.update_model_version("SalaryPredictor","1",description="LinearRegression baseline")
    print("Ex22 model description updated")
except Exception as e:
    print("Ex22:", str(e)[:60])

# 23. Compare runs with search_runs
runs_df = mlflow.search_runs(
    experiment_names=["/examples/salary_prediction"],
    filter_string="metrics.rmse < 10",
    order_by=["metrics.rmse ASC"],
)
print("Ex23 runs with rmse < 10:", len(runs_df))

# 24. MLflow spark UDF for batch scoring
try:
    predict_udf = mlflow.pyfunc.spark_udf(spark, f"runs:/{run_id}/linear_reg_model", result_type="double")
    df_score = spark.createDataFrame(pd.DataFrame(X_test[:5], columns=["f1","f2","f3"]))
    df_score.withColumn("pred", predict_udf("f1","f2","f3")).show()
    print("Ex24 spark UDF scoring done")
except Exception as e:
    print("Ex24:", str(e)[:80])

# 25. Log model with signature
from mlflow.models.signature import infer_signature
signature = infer_signature(X_train, model.predict(X_train))
with mlflow.start_run(run_name="model_with_signature"):
    mlflow.sklearn.log_model(model, "model_signed", signature=signature)
print("Ex25 model with signature logged")

# 26. Log model with input example
input_example = pd.DataFrame(X_train[:5], columns=["f1","f2","f3"])
with mlflow.start_run(run_name="model_with_example"):
    mlflow.sklearn.log_model(model, "model_example",
                              signature=signature, input_example=input_example)
print("Ex26 model with input example logged")

# 27. Custom Python model (pyfunc)
class MyCustomModel(mlflow.pyfunc.PythonModel):
    def __init__(self, threshold=0.5):
        self.threshold = threshold
    def predict(self, context, model_input):
        return (model_input.iloc[:,0] > self.threshold).astype(int)

with mlflow.start_run(run_name="custom_pyfunc"):
    mlflow.pyfunc.log_model("custom_model", python_model=MyCustomModel(threshold=0.0))
print("Ex27 custom pyfunc model logged")

# 28. Load pyfunc model (generic)
with mlflow.start_run(run_name="pyfunc_load") as r:
    mlflow.pyfunc.log_model("pyfunc_m", python_model=MyCustomModel())
    rid = r.info.run_id
loaded_pyfunc = mlflow.pyfunc.load_model(f"runs:/{rid}/pyfunc_m")
pred_custom = loaded_pyfunc.predict(pd.DataFrame({"f1":[0.5,-0.5]}))
print("Ex28 custom model prediction:", pred_custom.tolist())

# 29. Nested runs (parent + child)
with mlflow.start_run(run_name="parent") as parent:
    for i in range(3):
        with mlflow.start_run(run_name=f"child_{i}", nested=True):
            mlflow.log_metric("score", i * 0.1 + 0.7)
print("Ex29 nested runs done, parent:", parent.info.run_id)

# 30. mlflow.projects (run project from Git / directory)
print("Ex30 mlflow.projects.run: execute MLproject file from a Git repo or local directory")

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. MLflow Tracking Server (remote)
print("""
Ex31 Remote tracking server:
  mlflow.set_tracking_uri("databricks")  # In Databricks workspace
  mlflow.set_tracking_uri("http://mlflow-server:5000")  # self-hosted
""")

# 32. Feature store + MLflow integration
print("""
Ex32 Feature store:
  from databricks.feature_store import FeatureStoreClient
  fs = FeatureStoreClient()
  fs.log_model(model, "fs_model", flavor=mlflow.sklearn,
               training_set=training_set)
  # → auto-links features used for training in the model registry
""")

# 33. MLflow Models REST API (model serving)
print("""
Ex33 Model serving in Databricks:
  1. Register model in UC or workspace registry
  2. Enable "Serving" in Databricks UI or via API
  3. REST endpoint: POST https://<workspace>/serving-endpoints/<name>/invocations
  Body: {"inputs": [[1.0, 2.0, 3.0]]}
""")

# 34. A/B testing with model serving
print("""
Ex34 A/B testing:
  Route 80% traffic to "champion" model, 20% to "challenger"
  Monitor accuracy + latency per route
  Promote challenger if metrics improve
""")

# 35. MLflow evaluation (mlflow.evaluate)
with mlflow.start_run(run_name="evaluate"):
    mlflow.sklearn.log_model(model, "lr_model")
    eval_data = pd.DataFrame({"f1":X_test[:,0],"f2":X_test[:,1],"f3":X_test[:,2],"label":y_test})
    try:
        result = mlflow.evaluate(
            f"runs:/{mlflow.active_run().info.run_id}/lr_model",
            data=eval_data, targets="label", model_type="regressor",
        )
        print("Ex35 evaluation result:", result.metrics)
    except Exception as e:
        print("Ex35:", str(e)[:80])

# 36. Model monitoring (drift detection)
print("""
Ex36 Model monitoring:
  - Log predictions as MLflow metrics over time
  - Monitor feature distributions (PSI, KS test)
  - Databricks Lakehouse Monitoring for automated drift detection
""")

# 37. Hyperparameter tuning with MLflow
params_grid = [{"n_estimators":10,"max_depth":3},{"n_estimators":50,"max_depth":5}]
best_acc = 0; best_params = {}
for params in params_grid:
    with mlflow.start_run(run_name=f"hpo_{params['n_estimators']}_{params['max_depth']}", nested=True):
        clf = RandomForestClassifier(**params, random_state=42)
        clf.fit(X_tr, y_tr)
        acc = accuracy_score(y_te, clf.predict(X_te))
        mlflow.log_params(params)
        mlflow.log_metric("accuracy", acc)
        if acc > best_acc:
            best_acc = acc; best_params = params
print("Ex37 HPO done, best:", best_params)

# 38. MLflow + Hyperopt (distributed HPO)
print("""
Ex38 Hyperopt + MLflow:
  from hyperopt import fmin, tpe, hp, STATUS_OK, Trials
  space = {"n_estimators": hp.choice("n", [10,50,100]),
           "max_depth": hp.quniform("d", 2, 10, 1)}

  def objective(params):
      with mlflow.start_run(nested=True):
          model.set_params(**params).fit(X_tr, y_tr)
          acc = accuracy_score(y_te, model.predict(X_te))
          mlflow.log_metric("accuracy", acc)
          return {"loss": -acc, "status": STATUS_OK}

  best = fmin(objective, space, algo=tpe.suggest, max_evals=20)
""")

# 39. Spark ML pipeline + MLflow
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.classification import LogisticRegression as SparkLR
from pyspark.ml import Pipeline

df_ml = spark.createDataFrame(
    pd.DataFrame({"f1":X_cls[:,0],"f2":X_cls[:,1],"f3":X_cls[:,2],"f4":X_cls[:,3],"label":y_cls.astype(float)})
)
assembler = VectorAssembler(inputCols=["f1","f2","f3","f4"], outputCol="features")
lr_spark = SparkLR(featuresCol="features", labelCol="label")
pipeline = Pipeline(stages=[assembler, lr_spark])

with mlflow.start_run(run_name="spark_pipeline"):
    fitted = pipeline.fit(df_ml)
    mlflow.spark.log_model(fitted, "spark_lr_pipeline")
    print("Ex39 Spark ML pipeline logged")

# 40. Model cards
print("""
Ex40 Model card (best practice):
  with mlflow.start_run():
      mlflow.log_dict({
          "model_name": "SalaryPredictor",
          "version": "1.0",
          "description": "Predicts employee salary from features",
          "training_data": "HR data 2020-2023",
          "features": ["experience", "department", "skills"],
          "metrics": {"rmse": 4500, "r2": 0.91},
          "limitations": "Does not account for market inflation",
          "fairness": "Tested for gender/race bias",
      }, "model_card.json")
""")

# 41. Reproducibility — log code version
print("""
Ex41 Code reproducibility:
  mlflow.log_param("git_commit", subprocess.check_output(["git","rev-parse","HEAD"]).decode().strip())
  mlflow.log_artifact("train.py")
  mlflow.log_artifact("requirements.txt")
""")

# 42. MLflow Projects (MLproject file)
print("""
Ex42 MLproject file:
  name: SalaryPredictor
  conda_env: conda.yaml
  entry_points:
    main:
      parameters:
        n_estimators: {type: int, default: 100}
      command: "python train.py --n_estimators {n_estimators}"
""")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. MLflow 2.x Model Aliases
print("""
Ex43 Model Aliases (MLflow 2.x, preferred over stages):
  client.set_registered_model_alias(name, "champion", version)
  client.set_registered_model_alias(name, "challenger", version)
  model = mlflow.pyfunc.load_model("models:/MyModel@champion")
""")

# 44. Webhook for model events
print("""
Ex44 Registry webhooks (Databricks):
  POST /api/2.0/mlflow/registry-webhooks/create
  {
    "model_name": "SalaryPredictor",
    "events": ["MODEL_VERSION_TRANSITIONED_TO_PRODUCTION"],
    "http_url_spec": {"url": "https://ci-server/deploy"}
  }
""")

# 45. MLflow Gateway / AI Gateway
print("""
Ex45 MLflow AI Gateway:
  Unified API proxy for multiple LLM providers (OpenAI, Anthropic, etc.)
  mlflow.gateway.create_route("my-llm", "llm/v1/chat", ...)
  Enables A/B testing, rate limiting, cost tracking across LLM providers
""")

# 46. UC model registry (cross-workspace)
print("""
Ex46 UC Model Registry:
  Models stored as: catalog.schema.model_name
  mlflow.register_model(run_uri, "my_catalog.ml.salary_predictor")
  Accessible from any workspace attached to same UC metastore
""")

# 47. Continuous training pipeline with MLflow + Delta
print("""
Ex47 CT pipeline:
  1. Trigger retraining when data drift detected (Lakehouse Monitoring alert)
  2. Train model, log to MLflow
  3. Evaluate against champion model
  4. Auto-promote if challenger wins (via Databricks Workflow)
""")

# 48. Feature engineering audit trail
print("""
Ex48 Feature lineage:
  Feature Store logs: which features used, from which tables, at which version
  MLflow stores feature store metadata alongside model artifacts
  DESCRIBE HISTORY on feature table shows all versions
""")

# 49. MLflow experiment tracking for A/B tests (not just model training)
print("""
Ex49 A/B experiment tracking:
  with mlflow.start_run("treatment_a"):
      mlflow.log_metric("conversion_rate", 0.051)
  with mlflow.start_run("treatment_b"):
      mlflow.log_metric("conversion_rate", 0.062)
  Compare in MLflow UI or via mlflow.search_runs()
""")

# 50. MLflow summary
print("""
Ex50 MLflow Key Concepts:
  Tracking    → experiments, runs, params, metrics, artifacts
  Projects    → reproducible ML code (MLproject + conda.yaml)
  Models      → packaging + flavors (sklearn, spark, pyfunc, onnx)
  Registry    → versioning, aliases (champion/challenger), lifecycle
  Serving     → REST endpoint for real-time inference (Databricks)
  Evaluate    → model evaluation with built-in metrics
  AI Gateway  → unified LLM API proxy
""")
