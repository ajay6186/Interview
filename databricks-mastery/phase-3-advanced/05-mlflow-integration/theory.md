# Theory: MLflow Integration

## What is MLflow?

MLflow is an open-source platform for managing the ML lifecycle — tracking experiments, packaging models, deploying to production. It's built into Databricks (managed tracking server, model registry, model serving).

```
MLflow Components:
  Tracking    → log parameters, metrics, artifacts per run
  Projects    → package code as reproducible experiments
  Models      → package trained models with standard flavors (sklearn, PyFunc, etc.)
  Registry    → version models, manage lifecycle (Staging → Production)
  Serving     → REST API for real-time inference
```

---

## Tracking Experiments

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

# Set tracking URI (Databricks managed — auto-set in Databricks notebooks)
# mlflow.set_tracking_uri("databricks")

mlflow.set_experiment("/Users/user@company.com/churn_prediction")

with mlflow.start_run(run_name="rf_v1") as run:
    # Log parameters
    params = {"n_estimators": 100, "max_depth": 5, "random_state": 42}
    mlflow.log_params(params)

    # Train model
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # Log metrics
    mlflow.log_metric("accuracy", accuracy_score(y_test, y_pred))
    mlflow.log_metric("f1_score", f1_score(y_test, y_pred))

    # Log model
    mlflow.sklearn.log_model(model, "random_forest_model",
                             registered_model_name="ChurnPredictor")

    # Log artifacts (plots, feature importance files)
    mlflow.log_artifact("feature_importance.png")
    mlflow.log_dict({"features": list(X_train.columns)}, "features.json")

    print(f"Run ID: {run.info.run_id}")
```

---

## PySpark + MLflow (Distributed Training)

```python
# Log per-epoch metrics during training
with mlflow.start_run():
    for epoch in range(50):
        loss = train_epoch(model, X_train, y_train)
        mlflow.log_metric("train_loss", loss, step=epoch)

# AutoML integration (Databricks AutoML)
import databricks.automl
summary = databricks.automl.classify(
    dataset=spark_df,
    target_col="churn",
    primary_metric="f1",
    timeout_minutes=30
)
print(summary.best_trial.mlflow_run_id)
```

---

## MLflow Model Registry

```python
from mlflow.tracking import MlflowClient
client = MlflowClient()

# Register a model
result = mlflow.register_model(
    model_uri=f"runs:/{run_id}/random_forest_model",
    name="ChurnPredictor"
)

# Transition model stage (classic registry)
client.transition_model_version_stage(
    name="ChurnPredictor",
    version=result.version,
    stage="Staging"          # None → Staging → Production → Archived
)

# UC Model Registry (recommended — uses catalog.schema.model_name)
mlflow.set_registry_uri("databricks-uc")
mlflow.register_model(
    model_uri=f"runs:/{run_id}/model",
    name="prod_catalog.ml.ChurnPredictor"   # three-level name
)

# Set alias (UC registry)
client.set_registered_model_alias("prod_catalog.ml.ChurnPredictor", "champion", version=3)
client.set_registered_model_alias("prod_catalog.ml.ChurnPredictor", "challenger", version=4)
```

---

## Loading Models for Inference

```python
# Batch inference with PySpark (load model as UDF)
logged_model = f"runs:/{run_id}/random_forest_model"
loaded_model = mlflow.pyfunc.spark_udf(spark, model_uri=logged_model,
                                        result_type="double")
predictions_df = df.withColumn("churn_prob", loaded_model(*feature_cols))

# Load from registry (production)
model = mlflow.sklearn.load_model("models:/ChurnPredictor/Production")
# UC registry
model = mlflow.sklearn.load_model("models:/prod_catalog.ml.ChurnPredictor@champion")

# Batch scoring — apply to Spark DataFrame
predictions = model.predict(X_test_pd)
```

---

## Feature Store Integration

```python
from databricks.feature_engineering import FeatureEngineeringClient

fe = FeatureEngineeringClient()

# Create feature table
fe.create_table(
    name="prod_catalog.ml_features.customer_features",
    primary_keys=["customer_id"],
    timestamp_keys=["feature_date"],
    df=features_df,
    description="Customer behavioral features for churn prediction"
)

# Write features
fe.write_table(
    name="prod_catalog.ml_features.customer_features",
    df=new_features_df,
    mode="merge"
)

# Create training dataset (joins feature tables automatically)
training_set = fe.create_training_set(
    df=labels_df,
    feature_lookups=[
        FeatureLookup(
            table_name="prod_catalog.ml_features.customer_features",
            feature_names=["avg_order_value", "days_since_last_order"],
            lookup_key="customer_id"
        )
    ],
    label="churn"
)

# Train with feature store — logs feature lineage to MLflow
with mlflow.start_run():
    fe.log_model(
        model=model,
        artifact_path="model",
        flavor=mlflow.sklearn,
        training_set=training_set,
        registered_model_name="prod_catalog.ml.ChurnPredictor"
    )
```

---

## Comparing Runs

```python
# Load experiment results as a DataFrame
runs_df = mlflow.search_runs(
    experiment_names=["/Users/user@company.com/churn_prediction"],
    filter_string="metrics.f1_score > 0.8",
    order_by=["metrics.f1_score DESC"],
    max_results=10
)

# Compare specific runs
print(runs_df[["run_id", "params.n_estimators", "metrics.f1_score", "start_time"]])

# Find best run
best_run = runs_df.iloc[0]
best_model_uri = f"runs:/{best_run['run_id']}/model"
```

---

## Common Interview Questions

**Q: What is MLflow and what are its four components?**  
A: MLflow is an open-source ML lifecycle platform. Its four components: (1) Tracking — logs parameters, metrics, and artifacts per experiment run. (2) Projects — packages code for reproducibility. (3) Models — packages trained models with a standard schema. (4) Registry — versions and manages model lifecycle (Staging/Production/Archived).

**Q: What is the difference between mlflow.log_param and mlflow.log_metric?**  
A: `log_param` records a single key-value string (hyperparameter, config — logged once per run). `log_metric` records a numeric value with an optional step (epoch number) — can be logged multiple times per run to track training curves.

**Q: How do you use an MLflow model for batch scoring in Spark?**  
A: Use `mlflow.pyfunc.spark_udf(spark, model_uri, result_type)` to wrap the model as a Spark UDF. Apply it to a DataFrame column-by-column. This distributes inference across the cluster. Alternatively, load as a pandas model and apply with `mapInPandas` for more control.

**Q: What is the Unity Catalog Model Registry and how does it differ from the classic registry?**  
A: The UC Model Registry stores models at `catalog.schema.model_name` (three-level namespace), integrates with UC RBAC (same GRANT/REVOKE as tables), supports aliases (e.g., `@champion`, `@challenger`) instead of deprecated stage labels, and provides column-level lineage. The classic registry uses Staging/Production/Archived stages and a flat namespace.

**Q: What is a Feature Store and why use it?**  
A: A Feature Store is a centralized repository of computed features with: (1) reusability — compute once, use in many models; (2) consistency — same features in training and serving; (3) lineage — tracks which features went into which model version; (4) time-travel — point-in-time correct feature lookups to prevent data leakage.

---

## Quick Reference

```python
import mlflow
import mlflow.sklearn

# Tracking
mlflow.set_experiment("/path/to/experiment")
with mlflow.start_run(run_name="v1") as run:
    mlflow.log_params({"lr": 0.01, "epochs": 50})
    mlflow.log_metric("accuracy", 0.92, step=50)
    mlflow.log_artifact("plot.png")
    mlflow.sklearn.log_model(model, "model",
                             registered_model_name="MyModel")

# Search runs
runs = mlflow.search_runs(experiment_names=["/path"],
                           order_by=["metrics.accuracy DESC"])

# Load model
model = mlflow.sklearn.load_model(f"runs:/{run_id}/model")
model = mlflow.sklearn.load_model("models:/MyModel/Production")

# Spark UDF for batch scoring
udf = mlflow.pyfunc.spark_udf(spark, f"models:/MyModel/Production",
                               result_type="double")
df.withColumn("pred", udf(*feature_cols))

# Registry transitions
client = MlflowClient()
client.transition_model_version_stage("MyModel", version=2, stage="Production")
client.set_registered_model_alias("catalog.schema.Model", "champion", version=3)
```
