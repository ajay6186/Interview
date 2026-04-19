# ============================================================================
# Exercise 3.5 — MLflow Integration
# ============================================================================

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

mlflow.set_tracking_uri("file:///tmp/mlflow_exercise")
mlflow.set_experiment("/exercise/churn_prediction")

np.random.seed(42)
X = np.random.randn(500, 5)
y = (X[:,0] + X[:,1] > 0).astype(int)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ---------------------------------------------------------------------------
# 1. Log a Logistic Regression run with params and metrics
# ---------------------------------------------------------------------------
# TODO: start a run named "logistic_regression"
#       log params: {"C": 1.0, "solver": "lbfgs", "max_iter": 100}
#       fit LogisticRegression(C=1.0, max_iter=100)
#       log metrics: accuracy, roc_auc
#       log model as "lr_model"
#       store run_id in `lr_run_id`
lr_run_id = None  # replace None

assert lr_run_id is not None, "Run ID must not be None"
# Verify metrics were logged
client = mlflow.tracking.MlflowClient()
lr_metrics = client.get_run(lr_run_id).data.metrics
assert "accuracy" in lr_metrics
assert "roc_auc" in lr_metrics

# ---------------------------------------------------------------------------
# 2. Log a Random Forest run
# ---------------------------------------------------------------------------
# TODO: start a run named "random_forest"
#       log params: {"n_estimators": 50, "max_depth": 5}
#       fit, log accuracy + roc_auc, log model as "rf_model"
#       store run_id in `rf_run_id`
rf_run_id = None  # replace None

assert rf_run_id is not None
rf_metrics = client.get_run(rf_run_id).data.metrics
assert "accuracy" in rf_metrics

# ---------------------------------------------------------------------------
# 3. Compare runs — find the best model (highest roc_auc)
# ---------------------------------------------------------------------------
# TODO: use mlflow.search_runs to get all runs in this experiment
#       sort by metrics.roc_auc descending
#       store best_run_id = the run_id with highest roc_auc
runs_df = None  # replace None
best_run_id = None  # replace None

assert runs_df is not None
assert best_run_id is not None
assert best_run_id in [lr_run_id, rf_run_id]

# ---------------------------------------------------------------------------
# 4. Register the best model
# ---------------------------------------------------------------------------
# TODO: register the best model from best_run_id as "ChurnPredictor"
#       Hint: mlflow.register_model(f"runs:/{best_run_id}/...", "ChurnPredictor")
#       Figure out the artifact path from the run

# Verify it was registered
versions = client.search_model_versions("name='ChurnPredictor'")
assert len(versions) >= 1, "Model must be registered"

# ---------------------------------------------------------------------------
# 5. Set alias "champion" on version 1
# ---------------------------------------------------------------------------
# TODO: client.set_registered_model_alias("ChurnPredictor","champion","1")
champion_version = client.get_model_version_by_alias("ChurnPredictor","champion")
assert champion_version is not None

# ---------------------------------------------------------------------------
# 6. Load champion model and score
# ---------------------------------------------------------------------------
# TODO: load model using models:/ChurnPredictor@champion
#       predict on X_test[:10], store in predictions (numpy array or list)
predictions = None  # replace None

assert predictions is not None
assert len(predictions) == 10

# ---------------------------------------------------------------------------
# 7. Nested runs for hyperparameter search
# ---------------------------------------------------------------------------
# TODO: Start a parent run "hpo_search"
#       Inside it, start nested runs for C=[0.1, 1.0, 10.0] with LogisticRegression
#       Log accuracy in each nested run
#       Find best C and store in best_C
best_C = None  # replace None

assert best_C in [0.1, 1.0, 10.0]

# ---------------------------------------------------------------------------
# 8. Log a model with signature
# ---------------------------------------------------------------------------
from mlflow.models.signature import infer_signature
# TODO: fit any model, create signature, log model with signature
#       assert signature is not None from the logged model info
with mlflow.start_run(run_name="with_signature") as r:
    lr = LogisticRegression(); lr.fit(X_train, y_train)
    sig = infer_signature(X_train, lr.predict(X_train))
    # TODO: log model with signature
    sig_run_id = r.info.run_id

run_data = client.get_run(sig_run_id)
assert run_data is not None

print("All assertions passed!")
