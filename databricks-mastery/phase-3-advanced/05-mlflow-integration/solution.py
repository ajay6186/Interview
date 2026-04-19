# ============================================================================
# Solution 3.5 — MLflow Integration
# ============================================================================

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
from mlflow.models.signature import infer_signature

mlflow.set_tracking_uri("file:///tmp/mlflow_exercise")
mlflow.set_experiment("/exercise/churn_prediction")

np.random.seed(42)
X = np.random.randn(500, 5)
y = (X[:,0] + X[:,1] > 0).astype(int)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

client = mlflow.tracking.MlflowClient()

# 1. Logistic Regression run
with mlflow.start_run(run_name="logistic_regression") as run:
    mlflow.log_params({"C":1.0,"solver":"lbfgs","max_iter":100})
    lr = LogisticRegression(C=1.0, max_iter=100); lr.fit(X_train, y_train)
    acc = accuracy_score(y_test, lr.predict(X_test))
    auc = roc_auc_score(y_test, lr.predict_proba(X_test)[:,1])
    mlflow.log_metrics({"accuracy":acc,"roc_auc":auc})
    mlflow.sklearn.log_model(lr,"lr_model")
    lr_run_id = run.info.run_id

lr_metrics = client.get_run(lr_run_id).data.metrics
assert "accuracy" in lr_metrics and "roc_auc" in lr_metrics

# 2. Random Forest run
with mlflow.start_run(run_name="random_forest") as run:
    mlflow.log_params({"n_estimators":50,"max_depth":5})
    rf = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
    rf.fit(X_train, y_train)
    acc = accuracy_score(y_test, rf.predict(X_test))
    auc = roc_auc_score(y_test, rf.predict_proba(X_test)[:,1])
    mlflow.log_metrics({"accuracy":acc,"roc_auc":auc})
    mlflow.sklearn.log_model(rf,"rf_model")
    rf_run_id = run.info.run_id

# 3. Compare runs
runs_df = mlflow.search_runs(
    experiment_names=["/exercise/churn_prediction"],
    order_by=["metrics.roc_auc DESC"],
)
best_run_id = runs_df.iloc[0]["run_id"]
assert best_run_id in [lr_run_id, rf_run_id]

# 4. Register best model
best_run = client.get_run(best_run_id)
artifact_uri = best_run.info.artifact_uri
# Determine model artifact path
model_path = "lr_model" if best_run_id == lr_run_id else "rf_model"
mlflow.register_model(f"runs:/{best_run_id}/{model_path}", "ChurnPredictor")
versions = client.search_model_versions("name='ChurnPredictor'")
assert len(versions) >= 1

# 5. Set alias
client.set_registered_model_alias("ChurnPredictor","champion","1")
champion_version = client.get_model_version_by_alias("ChurnPredictor","champion")
assert champion_version is not None

# 6. Load and score
loaded = mlflow.sklearn.load_model("models:/ChurnPredictor/1")
predictions = loaded.predict(X_test[:10])
assert len(predictions) == 10

# 7. HPO search
best_C = None; best_acc = 0
with mlflow.start_run(run_name="hpo_search"):
    for C in [0.1, 1.0, 10.0]:
        with mlflow.start_run(run_name=f"lr_C_{C}", nested=True):
            m = LogisticRegression(C=C, max_iter=200); m.fit(X_train, y_train)
            acc = accuracy_score(y_test, m.predict(X_test))
            mlflow.log_param("C", C); mlflow.log_metric("accuracy", acc)
            if acc > best_acc:
                best_acc = acc; best_C = C

assert best_C in [0.1, 1.0, 10.0]

# 8. Model with signature
with mlflow.start_run(run_name="with_signature") as r:
    lr2 = LogisticRegression(); lr2.fit(X_train, y_train)
    sig = infer_signature(X_train, lr2.predict(X_train))
    mlflow.sklearn.log_model(lr2, "model_signed", signature=sig)
    sig_run_id = r.info.run_id

assert client.get_run(sig_run_id) is not None

print("All assertions passed!")
