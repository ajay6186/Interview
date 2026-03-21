# ============================================================
# Examples 4.3 — MLflow Experiment Tracking (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import os
import json
import tempfile
import numpy as np
from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, f1_score
from sklearn.preprocessing import StandardScaler

try:
    import mlflow
    import mlflow.sklearn
    MLFLOW_AVAILABLE = True
    mlflow.set_tracking_uri('./mlruns')
except ImportError:
    MLFLOW_AVAILABLE = False

# Shared dataset for examples
np.random.seed(42)
X, y = make_classification(n_samples=500, n_features=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """What is MLflow"""
    description = """
MLflow is an open-source platform for managing the ML lifecycle:
  1. Tracking   — log experiments (params, metrics, artifacts)
  2. Projects   — reproducible ML code packaging
  3. Models     — standardized model packaging + deployment
  4. Registry   — centralized model store with versioning + stages

Key concepts:
  Experiment  — named group of runs (e.g., "loan_model_v2")
  Run         — single execution of ML code
  Parameters  — input config (n_estimators, learning_rate)
  Metrics     — output numbers over time (accuracy, loss)
  Artifacts   — files (model.pkl, plots, data samples)
  Tags        — key-value strings for searchability
"""
    print("Ex01 — What is MLflow:")
    print(description)

def ex02():
    """mlflow.start_run() pattern"""
    if not MLFLOW_AVAILABLE:
        print("Ex02 — mlflow.start_run() pattern:")
        print("""
with mlflow.start_run(run_name="training_run_1") as run:
    mlflow.log_param("n_estimators", 100)
    mlflow.log_metric("accuracy", 0.92)
    print(f"Run ID: {run.info.run_id}")
""")
        return
    mlflow.set_experiment("ex02_start_run")
    with mlflow.start_run(run_name="demo_run") as run:
        mlflow.log_param("demo", True)
        print(f"Ex02 — mlflow.start_run() pattern:")
        print(f"  Run ID:     {run.info.run_id}")
        print(f"  Experiment: {run.info.experiment_id}")
        print(f"  Status:     {run.info.status}")

def ex03():
    """log_param"""
    if not MLFLOW_AVAILABLE:
        print("Ex03 — log_param:")
        print("  mlflow.log_param('n_estimators', 100)")
        print("  mlflow.log_params({'lr': 0.01, 'batch_size': 32})")
        return
    mlflow.set_experiment("ex03_log_param")
    with mlflow.start_run(run_name="log_param_demo"):
        # Single param
        mlflow.log_param("n_estimators", 100)
        mlflow.log_param("max_depth", 5)
        # Multiple params at once
        mlflow.log_params({"min_samples_split": 2, "random_state": 42})
        print("Ex03 — log_param:")
        print("  Logged: n_estimators=100, max_depth=5, min_samples_split=2, random_state=42")

def ex04():
    """log_metric"""
    if not MLFLOW_AVAILABLE:
        print("Ex04 — log_metric:")
        print("  mlflow.log_metric('accuracy', 0.92)")
        print("  mlflow.log_metrics({'f1': 0.91, 'auc': 0.95})")
        return
    mlflow.set_experiment("ex04_log_metric")
    with mlflow.start_run(run_name="log_metric_demo"):
        mlflow.log_metric("accuracy", 0.923)
        mlflow.log_metric("f1_score", 0.911)
        mlflow.log_metrics({"precision": 0.905, "recall": 0.917, "auc": 0.961})
        print("Ex04 — log_metric:")
        print("  Logged: accuracy=0.923, f1_score=0.911, precision=0.905, recall=0.917")

def ex05():
    """log_artifact"""
    if not MLFLOW_AVAILABLE:
        print("Ex05 — log_artifact:")
        print("  mlflow.log_artifact('model_report.txt')")
        print("  mlflow.log_artifact('confusion_matrix.png', artifact_path='plots')")
        return
    mlflow.set_experiment("ex05_log_artifact")
    with mlflow.start_run(run_name="artifact_demo"):
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Model Report\n============\nAccuracy: 0.923\nF1: 0.911\n")
            tmp_path = f.name
        mlflow.log_artifact(tmp_path, artifact_path="reports")
        os.unlink(tmp_path)
        print("Ex05 — log_artifact:")
        print("  Logged: model_report.txt to artifact store under 'reports/'")

def ex06():
    """log_model (sklearn)"""
    if not MLFLOW_AVAILABLE:
        print("Ex06 — log_model (sklearn):")
        print("  mlflow.sklearn.log_model(model, 'random_forest')")
        return
    mlflow.set_experiment("ex06_log_model")
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    with mlflow.start_run(run_name="log_model_demo"):
        mlflow.sklearn.log_model(clf, artifact_path="random_forest")
        acc = accuracy_score(y_test, clf.predict(X_test))
        mlflow.log_metric("accuracy", acc)
        print(f"Ex06 — log_model (sklearn):")
        print(f"  Logged sklearn model | accuracy={acc:.4f}")

def ex07():
    """autolog"""
    if not MLFLOW_AVAILABLE:
        print("Ex07 — autolog:")
        print("  mlflow.sklearn.autolog()  # auto-logs params, metrics, model")
        return
    mlflow.set_experiment("ex07_autolog")
    mlflow.sklearn.autolog(log_model_signatures=True, log_input_examples=False)
    with mlflow.start_run(run_name="autolog_demo"):
        clf = RandomForestClassifier(n_estimators=30, max_depth=4, random_state=42)
        clf.fit(X_train, y_train)
        score = clf.score(X_test, y_test)
    mlflow.sklearn.autolog(disable=True)
    print(f"Ex07 — autolog:")
    print(f"  autolog auto-captured: n_estimators, max_depth, accuracy, feature importances")
    print(f"  Test accuracy: {score:.4f}")

def ex08():
    """Experiment creation"""
    if not MLFLOW_AVAILABLE:
        print("Ex08 — Experiment Creation:")
        print("  exp_id = mlflow.create_experiment('my_experiment')")
        print("  mlflow.set_experiment('my_experiment')")
        return
    exp_name = "ex08_loan_model_v2"
    try:
        exp_id = mlflow.create_experiment(
            exp_name,
            tags={"project": "loan_approval", "team": "ml_platform"}
        )
    except Exception:
        exp_id = mlflow.get_experiment_by_name(exp_name).experiment_id
    mlflow.set_experiment(exp_name)
    print("Ex08 — Experiment Creation:")
    print(f"  Experiment: '{exp_name}'  ID: {exp_id}")
    print(f"  Tags: project=loan_approval, team=ml_platform")

def ex09():
    """Run naming"""
    if not MLFLOW_AVAILABLE:
        print("Ex09 — Run Naming:")
        print("  mlflow.start_run(run_name='rf_n100_depth5_20250101')")
        return
    mlflow.set_experiment("ex09_run_naming")
    with mlflow.start_run(run_name="rf_n100_depth5_seed42") as run:
        mlflow.set_tag("model_type", "RandomForest")
        mlflow.set_tag("author", "ml_engineer")
        mlflow.log_param("n_estimators", 100)
        print("Ex09 — Run Naming:")
        print(f"  Run name: rf_n100_depth5_seed42")
        print(f"  Tags: model_type=RandomForest, author=ml_engineer")

def ex10():
    """Nested runs"""
    if not MLFLOW_AVAILABLE:
        print("Ex10 — Nested Runs:")
        print("  with mlflow.start_run() as parent:")
        print("      with mlflow.start_run(nested=True) as child:")
        print("          mlflow.log_metric('fold_accuracy', 0.91)")
        return
    mlflow.set_experiment("ex10_nested_runs")
    with mlflow.start_run(run_name="cv_parent") as parent:
        mlflow.log_param("n_folds", 3)
        fold_accs = []
        for fold in range(3):
            with mlflow.start_run(run_name=f"fold_{fold}", nested=True):
                idx = list(range(fold * 100, (fold + 1) * 100))
                clf = LogisticRegression(max_iter=200)
                clf.fit(X_train, y_train)
                acc = clf.score(X_test, y_test)
                mlflow.log_metric("fold_accuracy", acc)
                fold_accs.append(acc)
        mlflow.log_metric("mean_accuracy", float(np.mean(fold_accs)))
    print("Ex10 — Nested Runs:")
    print(f"  3 fold runs nested under parent | mean_accuracy={np.mean(fold_accs):.4f}")

def ex11():
    """Compare runs concept"""
    description = """
# Compare runs in MLflow UI:
# 1. Open: mlflow ui --port 5000
# 2. Select experiment → check multiple runs
# 3. Click "Compare" button
# 4. View: parallel coordinates plot, metric charts, param table

# Programmatic comparison:
# client = mlflow.tracking.MlflowClient()
# runs = client.search_runs(
#     experiment_ids=["1"],
#     filter_string="metrics.accuracy > 0.9",
#     order_by=["metrics.accuracy DESC"],
#     max_results=10
# )
# for r in runs:
#     print(r.info.run_id, r.data.metrics["accuracy"])
"""
    print("Ex11 — Compare Runs Concept:")
    print(description)

def ex12():
    """MLflow UI concept"""
    description = """
# MLflow Tracking UI — web interface for experiment exploration

# Start UI:
# mlflow ui                              # default: localhost:5000
# mlflow ui --host 0.0.0.0 --port 8080
# mlflow ui --backend-store-uri postgresql://user:pass@host/mldb

# UI features:
# - Experiments list (left sidebar)
# - Runs table with sortable/filterable columns
# - Run detail: params, metrics, artifacts, tags
# - Metric history charts (interactive)
# - Artifact browser (view plots, download models)
# - Model Registry tab (registered models + stages)
# - Compare runs: parallel coordinates, scatter plots

# Remote tracking server:
# mlflow server \\
#   --backend-store-uri postgresql://mluser:pass@db:5432/mlflow \\
#   --default-artifact-root s3://my-bucket/mlflow-artifacts \\
#   --host 0.0.0.0 --port 5000
"""
    print("Ex12 — MLflow UI Concept:")
    print(description)

def ex13():
    """Tracking URI setup"""
    if not MLFLOW_AVAILABLE:
        print("Ex13 — Tracking URI Setup:")
        print("  mlflow.set_tracking_uri('./mlruns')        # local")
        print("  mlflow.set_tracking_uri('http://mlflow-server:5000')  # remote")
        return
    # Local filesystem (default)
    mlflow.set_tracking_uri("./mlruns")
    print("Ex13 — Tracking URI Setup:")
    print(f"  Current URI: {mlflow.get_tracking_uri()}")
    print("  Options:")
    print("    ./mlruns                              — local filesystem")
    print("    http://mlflow-server:5000             — remote HTTP server")
    print("    postgresql://user:pass@host/mlflowdb  — PostgreSQL backend")
    print("    databricks                            — Databricks hosted")
    print("    Set MLFLOW_TRACKING_URI env var for persistent config")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Log multiple params dict"""
    if not MLFLOW_AVAILABLE:
        print("Ex14 — Log Multiple Params Dict:")
        print("  mlflow.log_params({'n_estimators': 100, 'max_depth': 5, 'lr': 0.01})")
        return
    mlflow.set_experiment("ex14_log_params_dict")
    params = {
        "n_estimators": 100,
        "max_depth": 5,
        "min_samples_split": 2,
        "min_samples_leaf": 1,
        "random_state": 42,
        "class_weight": "balanced"
    }
    with mlflow.start_run(run_name="params_dict_demo"):
        mlflow.log_params(params)
        clf = RandomForestClassifier(**{k: v for k, v in params.items() if k != "class_weight"})
        clf.fit(X_train, y_train)
        mlflow.log_metric("accuracy", clf.score(X_test, y_test))
    print(f"Ex14 — Log Multiple Params Dict:")
    print(f"  Logged {len(params)} params: {list(params.keys())}")

def ex15():
    """Log metrics over time (epoch loop)"""
    if not MLFLOW_AVAILABLE:
        print("Ex15 — Log Metrics Over Time:")
        print("  for epoch in range(10):")
        print("      mlflow.log_metric('loss', loss_val, step=epoch)")
        return
    mlflow.set_experiment("ex15_metrics_over_time")
    with mlflow.start_run(run_name="metrics_over_epochs"):
        np.random.seed(7)
        for epoch in range(10):
            train_loss = 1.0 / (epoch + 1) + np.random.normal(0, 0.02)
            val_loss   = 1.0 / (epoch + 1) + 0.05 + np.random.normal(0, 0.02)
            val_acc    = 0.5 + epoch * 0.04 + np.random.normal(0, 0.01)
            mlflow.log_metric("train_loss", float(train_loss), step=epoch)
            mlflow.log_metric("val_loss",   float(val_loss),   step=epoch)
            mlflow.log_metric("val_acc",    float(val_acc),    step=epoch)
    print("Ex15 — Log Metrics Over Time:")
    print(f"  Logged train_loss, val_loss, val_acc for 10 epochs")
    print(f"  Final: train_loss={train_loss:.4f}, val_acc={val_acc:.4f}")

def ex16():
    """Log numpy array as artifact"""
    if not MLFLOW_AVAILABLE:
        print("Ex16 — Log numpy array as artifact:")
        print("  np.save('/tmp/arr.npy', arr); mlflow.log_artifact('/tmp/arr.npy')")
        return
    mlflow.set_experiment("ex16_numpy_artifact")
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    importances = clf.feature_importances_
    with mlflow.start_run(run_name="numpy_artifact"):
        with tempfile.TemporaryDirectory() as tmpdir:
            npy_path = os.path.join(tmpdir, "feature_importances.npy")
            np.save(npy_path, importances)
            mlflow.log_artifact(npy_path, artifact_path="arrays")
    print("Ex16 — Log numpy array as artifact:")
    print(f"  Saved feature_importances shape={importances.shape} to artifacts/arrays/")
    print(f"  Top feature: feature_{np.argmax(importances)} (importance={importances.max():.4f})")

def ex17():
    """Log DataFrame as artifact"""
    if not MLFLOW_AVAILABLE:
        print("Ex17 — Log DataFrame as artifact:")
        print("  df.to_csv('/tmp/results.csv'); mlflow.log_artifact('/tmp/results.csv')")
        return
    mlflow.set_experiment("ex17_dataframe_artifact")
    results = []
    for n in [10, 50, 100]:
        clf = RandomForestClassifier(n_estimators=n, random_state=42)
        clf.fit(X_train, y_train)
        results.append({"n_estimators": n, "accuracy": clf.score(X_test, y_test)})
    with mlflow.start_run(run_name="dataframe_artifact"):
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = os.path.join(tmpdir, "experiment_results.csv")
            header = "n_estimators,accuracy\n"
            rows = "".join(f"{r['n_estimators']},{r['accuracy']:.6f}\n" for r in results)
            with open(csv_path, 'w') as f:
                f.write(header + rows)
            mlflow.log_artifact(csv_path, artifact_path="tables")
    print("Ex17 — Log DataFrame as artifact:")
    for r in results:
        print(f"  n_estimators={r['n_estimators']:3d} → accuracy={r['accuracy']:.4f}")

def ex18():
    """Log matplotlib figure"""
    if not MLFLOW_AVAILABLE:
        print("Ex18 — Log matplotlib figure:")
        print("  fig, ax = plt.subplots(); ax.plot(losses)")
        print("  mlflow.log_figure(fig, 'plots/training_curve.png')")
        return
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError:
        print("Ex18 — Log matplotlib figure: (matplotlib not installed)")
        return
    mlflow.set_experiment("ex18_matplotlib_artifact")
    with mlflow.start_run(run_name="matplotlib_artifact"):
        epochs = list(range(10))
        losses = [1.0 / (e + 1) + 0.05 * np.random.randn() for e in epochs]
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.plot(epochs, losses, 'b-o', label='val_loss')
        ax.set_xlabel("Epoch"); ax.set_ylabel("Loss"); ax.set_title("Training Curve")
        ax.legend(); ax.grid(True)
        mlflow.log_figure(fig, "plots/training_curve.png")
        plt.close(fig)
    print("Ex18 — Log matplotlib figure:")
    print("  Logged training_curve.png to artifacts/plots/")

def ex19():
    """Load model from run"""
    if not MLFLOW_AVAILABLE:
        print("Ex19 — Load model from run:")
        print("  model = mlflow.sklearn.load_model('runs:/RUN_ID/model')")
        return
    mlflow.set_experiment("ex19_load_model")
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    with mlflow.start_run(run_name="save_for_loading") as run:
        mlflow.sklearn.log_model(clf, artifact_path="model")
        run_id = run.info.run_id
    loaded = mlflow.sklearn.load_model(f"runs:/{run_id}/model")
    acc = accuracy_score(y_test, loaded.predict(X_test))
    print("Ex19 — Load model from run:")
    print(f"  Saved + reloaded model from run_id={run_id[:8]}...")
    print(f"  Accuracy after reload: {acc:.4f}")

def ex20():
    """Model signature"""
    if not MLFLOW_AVAILABLE:
        print("Ex20 — Model Signature:")
        print("  from mlflow.models.signature import infer_signature")
        print("  sig = infer_signature(X_train, model.predict(X_train))")
        print("  mlflow.sklearn.log_model(model, 'model', signature=sig)")
        return
    from mlflow.models.signature import infer_signature
    mlflow.set_experiment("ex20_model_signature")
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    signature = infer_signature(X_train, clf.predict(X_train))
    with mlflow.start_run(run_name="model_with_signature"):
        mlflow.sklearn.log_model(clf, artifact_path="model", signature=signature)
    print("Ex20 — Model Signature:")
    print(f"  Inputs:  {signature.inputs}")
    print(f"  Outputs: {signature.outputs}")

def ex21():
    """Input example"""
    if not MLFLOW_AVAILABLE:
        print("Ex21 — Input Example:")
        print("  mlflow.sklearn.log_model(model, 'model', input_example=X_train[:3])")
        return
    from mlflow.models.signature import infer_signature
    mlflow.set_experiment("ex21_input_example")
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    input_example = X_train[:3]
    signature = infer_signature(X_train, clf.predict(X_train))
    with mlflow.start_run(run_name="model_with_input_example"):
        mlflow.sklearn.log_model(
            clf, artifact_path="model",
            signature=signature, input_example=input_example
        )
    print("Ex21 — Input Example:")
    print(f"  Logged model with input_example shape={input_example.shape}")
    print(f"  Example row: {input_example[0].round(3)}")

def ex22():
    """Model flavors"""
    description = """
# MLflow Model Flavors — different interfaces for the same model

# Built-in flavors:
# mlflow.sklearn     — scikit-learn models
# mlflow.pytorch     — PyTorch nn.Module
# mlflow.tensorflow  — TF SavedModel / Keras
# mlflow.xgboost     — XGBoost Booster
# mlflow.lightgbm    — LightGBM
# mlflow.statsmodels — statsmodels
# mlflow.spacy       — spaCy
# mlflow.transformers — HuggingFace Transformers
# mlflow.pyfunc      — generic Python callable (most flexible)

# Each flavor provides:
# - log_model(model, "artifact_path")
# - load_model("runs:/RUN_ID/artifact_path")
# - predict(data) — unified interface

# MLmodel file (auto-generated in artifact):
# flavors:
#   python_function:
#     model_path: model.pkl
#     loader_module: mlflow.sklearn
#   sklearn:
#     sklearn_version: 1.4.0
"""
    print("Ex22 — Model Flavors:")
    print(description)

def ex23():
    """Custom python model"""
    if not MLFLOW_AVAILABLE:
        print("Ex23 — Custom Python Model:")
        print("  class MyModel(mlflow.pyfunc.PythonModel):")
        print("      def predict(self, context, model_input): ...")
        print("  mlflow.pyfunc.log_model('model', python_model=MyModel())")
        return
    mlflow.set_experiment("ex23_custom_pyfunc")
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)

    class LoanModel(mlflow.pyfunc.PythonModel):
        def __init__(self, model, threshold=0.5):
            self.model = model
            self.threshold = threshold

        def predict(self, context, model_input):
            proba = self.model.predict_proba(model_input)[:, 1]
            return (proba >= self.threshold).astype(int)

    with mlflow.start_run(run_name="custom_pyfunc"):
        mlflow.pyfunc.log_model(
            artifact_path="loan_model",
            python_model=LoanModel(clf, threshold=0.45)
        )
    sample = X_test[:3]
    preds = LoanModel(clf, threshold=0.45).predict(None, sample)
    print("Ex23 — Custom Python Model:")
    print(f"  Custom LoanModel with threshold=0.45")
    print(f"  Predictions for 3 samples: {preds}")

def ex24():
    """Register model"""
    if not MLFLOW_AVAILABLE:
        print("Ex24 — Register Model:")
        print("  mlflow.register_model('runs:/RUN_ID/model', 'LoanApprovalModel')")
        return
    mlflow.set_experiment("ex24_register_model")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    with mlflow.start_run(run_name="register_demo") as run:
        mlflow.sklearn.log_model(clf, artifact_path="model")
        run_id = run.info.run_id
    try:
        mv = mlflow.register_model(f"runs:/{run_id}/model", "LoanApprovalModel")
        print("Ex24 — Register Model:")
        print(f"  Model 'LoanApprovalModel' registered — version {mv.version}")
    except Exception as e:
        print("Ex24 — Register Model:")
        print(f"  Code: mlflow.register_model('runs:/{run_id[:8]}../model', 'LoanApprovalModel')")
        print(f"  Note: {e}")

def ex25():
    """Model stages (Staging/Production)"""
    description = """
# MLflow Model Registry Stages

# Stages: None → Staging → Production → Archived

from mlflow.tracking import MlflowClient
client = MlflowClient()

# Transition to Staging:
client.transition_model_version_stage(
    name="LoanApprovalModel",
    version=1,
    stage="Staging",
    archive_existing_versions=False
)

# Promote to Production:
client.transition_model_version_stage(
    name="LoanApprovalModel",
    version=1,
    stage="Production",
    archive_existing_versions=True   # archives old Production version
)

# Load by stage (always gets current Production):
model = mlflow.sklearn.load_model("models:/LoanApprovalModel/Production")

# Add description:
client.update_model_version(
    name="LoanApprovalModel", version=1,
    description="RF n=100, trained on v3 dataset, accuracy=0.923"
)
"""
    print("Ex25 — Model Stages (Staging/Production):")
    print(description)

def ex26():
    """Model version comparison"""
    if not MLFLOW_AVAILABLE:
        print("Ex26 — Model Version Comparison:")
        print("  client = MlflowClient()")
        print("  versions = client.search_model_versions(\"name='LoanApprovalModel'\")")
        print("  for v in versions: print(v.version, v.current_stage, v.run_id)")
        return
    mlflow.set_experiment("ex26_version_comparison")
    results = {}
    for n_est in [30, 100, 200]:
        clf = RandomForestClassifier(n_estimators=n_est, random_state=42)
        clf.fit(X_train, y_train)
        results[n_est] = {
            "accuracy": accuracy_score(y_test, clf.predict(X_test)),
            "f1": f1_score(y_test, clf.predict(X_test))
        }
    print("Ex26 — Model Version Comparison:")
    print(f"  {'n_estimators':>13} {'accuracy':>10} {'f1':>8}")
    print(f"  {'-'*33}")
    for n, m in results.items():
        print(f"  {n:>13} {m['accuracy']:>10.4f} {m['f1']:>8.4f}")
    best = max(results.items(), key=lambda kv: kv[1]["accuracy"])
    print(f"  Best: n_estimators={best[0]} with accuracy={best[1]['accuracy']:.4f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Full training run with MLflow logging"""
    if not MLFLOW_AVAILABLE:
        print("Ex27 — Full training run with MLflow logging:")
        print("  (mlflow not installed — showing code pattern)")
        print("  with mlflow.start_run(): log_params → train → log_metrics → log_model")
        return
    mlflow.set_experiment("ex27_full_training_run")
    params = {"n_estimators": 100, "max_depth": 6, "random_state": 42}
    with mlflow.start_run(run_name="full_training_pipeline") as run:
        mlflow.set_tags({"dataset": "synthetic", "task": "classification"})
        mlflow.log_params(params)
        clf = RandomForestClassifier(**params)
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        metrics = {
            "accuracy": accuracy_score(y_test, preds),
            "f1_macro": f1_score(y_test, preds, average="macro"),
            "train_accuracy": clf.score(X_train, y_train)
        }
        mlflow.log_metrics(metrics)
        from mlflow.models.signature import infer_signature
        sig = infer_signature(X_train, clf.predict(X_train))
        mlflow.sklearn.log_model(clf, "model", signature=sig, input_example=X_train[:2])
        run_id = run.info.run_id
    print("Ex27 — Full Training Run with MLflow Logging:")
    print(f"  Run ID: {run_id[:8]}...")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}")

def ex28():
    """Cross-validation with per-fold logging"""
    if not MLFLOW_AVAILABLE:
        print("Ex28 — Cross-validation with per-fold logging:")
        print("  Parent run logs mean metrics; child runs log per-fold metrics")
        return
    from sklearn.model_selection import StratifiedKFold
    mlflow.set_experiment("ex28_cv_logging")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    fold_scores = []
    with mlflow.start_run(run_name="5fold_cv_parent") as parent:
        mlflow.log_param("n_splits", 5)
        mlflow.log_param("n_estimators", 50)
        for fold, (tr_idx, val_idx) in enumerate(skf.split(X, y)):
            with mlflow.start_run(run_name=f"fold_{fold}", nested=True):
                clf = RandomForestClassifier(n_estimators=50, random_state=fold)
                clf.fit(X[tr_idx], y[tr_idx])
                score = clf.score(X[val_idx], y[val_idx])
                mlflow.log_metric("fold_accuracy", score)
                fold_scores.append(score)
        mlflow.log_metric("cv_mean_accuracy", float(np.mean(fold_scores)))
        mlflow.log_metric("cv_std_accuracy",  float(np.std(fold_scores)))
    print("Ex28 — Cross-validation with per-fold logging:")
    for i, s in enumerate(fold_scores):
        print(f"  Fold {i}: {s:.4f}")
    print(f"  Mean: {np.mean(fold_scores):.4f} ± {np.std(fold_scores):.4f}")

def ex29():
    """Hyperparameter search with MLflow"""
    if not MLFLOW_AVAILABLE:
        print("Ex29 — Hyperparameter search with MLflow:")
        print("  for params in param_grid: with mlflow.start_run(): log+train+log_metric")
        return
    mlflow.set_experiment("ex29_hparam_search")
    param_grid = [
        {"n_estimators": 30, "max_depth": 3},
        {"n_estimators": 50, "max_depth": 5},
        {"n_estimators": 100, "max_depth": 7},
    ]
    best_acc, best_run = 0, None
    for params in param_grid:
        with mlflow.start_run(run_name=f"rf_n{params['n_estimators']}_d{params['max_depth']}"):
            mlflow.log_params(params)
            clf = RandomForestClassifier(**params, random_state=42)
            clf.fit(X_train, y_train)
            acc = clf.score(X_test, y_test)
            mlflow.log_metric("accuracy", acc)
            if acc > best_acc:
                best_acc, best_run = acc, params
    print("Ex29 — Hyperparameter Search with MLflow:")
    for p in param_grid:
        clf = RandomForestClassifier(**p, random_state=42)
        clf.fit(X_train, y_train)
        print(f"  n_est={p['n_estimators']:3d}, max_depth={p['max_depth']:2d} → acc={clf.score(X_test, y_test):.4f}")
    print(f"  Best: {best_run} → accuracy={best_acc:.4f}")

def ex30():
    """Experiment comparison function"""
    if not MLFLOW_AVAILABLE:
        print("Ex30 — Experiment comparison function:")
        print("  client.search_runs(experiment_ids, filter_string, order_by)")
        return
    def compare_runs(experiment_name: str, metric: str = "accuracy", top_n: int = 3):
        client = mlflow.tracking.MlflowClient()
        exp = client.get_experiment_by_name(experiment_name)
        if exp is None:
            return []
        runs = client.search_runs(
            experiment_ids=[exp.experiment_id],
            order_by=[f"metrics.{metric} DESC"],
            max_results=top_n
        )
        return [
            {"run_id": r.info.run_id[:8], metric: r.data.metrics.get(metric), "params": r.data.params}
            for r in runs
        ]
    results = compare_runs("ex29_hparam_search", "accuracy", top_n=3)
    print("Ex30 — Experiment Comparison Function:")
    for r in results:
        print(f"  Run {r['run_id']}... accuracy={r['accuracy']:.4f} params={r['params']}")

def ex31():
    """Model promotion pipeline"""
    description = """
# Automated model promotion: Champion vs Challenger

from mlflow.tracking import MlflowClient

def promote_if_better(new_run_id: str, model_name: str, metric: str = "accuracy"):
    client = MlflowClient()
    new_acc = client.get_run(new_run_id).data.metrics[metric]

    # Get current Production model metrics
    prod_versions = client.get_latest_versions(model_name, stages=["Production"])
    if prod_versions:
        prod_run_id = prod_versions[0].run_id
        prod_acc = client.get_run(prod_run_id).data.metrics[metric]
    else:
        prod_acc = 0.0  # no current production model

    print(f"Challenger: {new_acc:.4f}  |  Champion: {prod_acc:.4f}")

    if new_acc > prod_acc + 0.005:  # require 0.5% improvement
        # Register + promote new model
        mv = mlflow.register_model(f"runs:/{new_run_id}/model", model_name)
        client.transition_model_version_stage(
            name=model_name, version=mv.version,
            stage="Production", archive_existing_versions=True
        )
        print(f"Promoted version {mv.version} to Production!")
    else:
        print("Challenger did not beat champion. Keeping current Production model.")
"""
    print("Ex31 — Model Promotion Pipeline:")
    print(description)

def ex32():
    """Automated model selection (best run)"""
    if not MLFLOW_AVAILABLE:
        print("Ex32 — Automated model selection:")
        print("  best_run = client.search_runs(..., order_by=['metrics.accuracy DESC'])[0]")
        return
    mlflow.set_experiment("ex32_model_selection")
    for seed in range(3):
        with mlflow.start_run():
            clf = RandomForestClassifier(n_estimators=50, random_state=seed)
            clf.fit(X_train, y_train)
            mlflow.log_metric("accuracy", clf.score(X_test, y_test))
    client = mlflow.tracking.MlflowClient()
    exp = client.get_experiment_by_name("ex32_model_selection")
    best_runs = client.search_runs(
        [exp.experiment_id], order_by=["metrics.accuracy DESC"], max_results=1
    )
    best = best_runs[0]
    print("Ex32 — Automated Model Selection (Best Run):")
    print(f"  Best run_id: {best.info.run_id[:8]}...")
    print(f"  Best accuracy: {best.data.metrics['accuracy']:.4f}")

def ex33():
    """MLflow Projects concept"""
    description = """
# MLflow Projects — reproducible ML code packaging

# MLproject file (YAML):
# name: loan_model
# conda_env: conda.yaml
# entry_points:
#   train:
#     parameters:
#       n_estimators: {type: int, default: 100}
#       max_depth:    {type: int, default: 5}
#       data_path:    {type: str, default: data/train.csv}
#     command: "python train.py --n-estimators {n_estimators} --max-depth {max_depth}"
#   evaluate:
#     parameters:
#       model_uri: {type: str}
#     command: "python evaluate.py --model-uri {model_uri}"

# Run a project:
# mlflow run . -P n_estimators=200 -P max_depth=8
# mlflow run git://github.com/org/ml-project.git -P n_estimators=100
# mlflow run . --experiment-name loan_experiments

# Benefit: anyone can reproduce experiment with exact params + env
"""
    print("Ex33 — MLflow Projects Concept:")
    print(description)

def ex34():
    """Train + log + register pipeline"""
    if not MLFLOW_AVAILABLE:
        print("Ex34 — Train + log + register pipeline:")
        print("  train → log_params → log_metrics → log_model → register_model")
        return
    def train_log_register(params: dict, model_name: str):
        mlflow.set_experiment("ex34_full_pipeline")
        with mlflow.start_run(run_name="train_log_register") as run:
            mlflow.log_params(params)
            clf = RandomForestClassifier(**params)
            clf.fit(X_train, y_train)
            acc = clf.score(X_test, y_test)
            mlflow.log_metric("accuracy", acc)
            mlflow.log_metric("f1", f1_score(y_test, clf.predict(X_test)))
            from mlflow.models.signature import infer_signature
            mlflow.sklearn.log_model(
                clf, "model",
                signature=infer_signature(X_train, clf.predict(X_train))
            )
            run_id = run.info.run_id
        try:
            mv = mlflow.register_model(f"runs:/{run_id}/model", model_name)
            return run_id, mv.version, acc
        except Exception:
            return run_id, None, acc

    rid, ver, acc = train_log_register(
        {"n_estimators": 100, "max_depth": 5, "random_state": 42},
        "LoanModelPipeline"
    )
    print("Ex34 — Train + Log + Register Pipeline:")
    print(f"  Run: {rid[:8]}... | Version: {ver} | Accuracy: {acc:.4f}")

def ex35():
    """Model lineage tracking"""
    if not MLFLOW_AVAILABLE:
        print("Ex35 — Model lineage tracking:")
        print("  mlflow.set_tag('parent_run_id', run_id)")
        print("  mlflow.set_tag('data_version', 'v3.2')")
        return
    mlflow.set_experiment("ex35_lineage_tracking")
    # Simulate data preprocessing run
    with mlflow.start_run(run_name="data_preprocessing") as prep_run:
        mlflow.set_tag("step", "preprocessing")
        mlflow.log_param("scaler", "StandardScaler")
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_train)
        prep_run_id = prep_run.info.run_id

    # Training run references preprocessing run for lineage
    with mlflow.start_run(run_name="training_with_lineage") as train_run:
        mlflow.set_tag("parent_preprocessing_run", prep_run_id)
        mlflow.set_tag("data_version", "v3.2_synthetic")
        mlflow.set_tag("feature_engineering_step", prep_run_id[:8])
        clf = RandomForestClassifier(n_estimators=50, random_state=42)
        clf.fit(X_scaled, y_train)
        mlflow.log_metric("accuracy", clf.score(scaler.transform(X_test), y_test))
    print("Ex35 — Model Lineage Tracking:")
    print(f"  Preprocessing run:  {prep_run_id[:8]}...")
    print(f"  Training run:       {train_run.info.run_id[:8]}...")
    print("  Training run tags preprocessing run ID for full lineage")

def ex36():
    """A/B test logging"""
    if not MLFLOW_AVAILABLE:
        print("Ex36 — A/B test logging:")
        print("  Log variant A and B runs, compare metrics for decision")
        return
    mlflow.set_experiment("ex36_ab_test_logging")
    ab_results = {}
    for variant, n_est in [("A_logistic", None), ("B_rf_100", 100)]:
        with mlflow.start_run(run_name=f"variant_{variant}") as run:
            mlflow.set_tag("ab_variant", variant)
            if n_est is None:
                clf = LogisticRegression(max_iter=300, random_state=42)
            else:
                clf = RandomForestClassifier(n_estimators=n_est, random_state=42)
            clf.fit(X_train, y_train)
            acc = clf.score(X_test, y_test)
            f1 = f1_score(y_test, clf.predict(X_test))
            mlflow.log_metrics({"accuracy": acc, "f1": f1})
            ab_results[variant] = {"accuracy": acc, "f1": f1}
    print("Ex36 — A/B Test Logging:")
    for v, m in ab_results.items():
        print(f"  Variant {v}: accuracy={m['accuracy']:.4f}, f1={m['f1']:.4f}")
    winner = max(ab_results.items(), key=lambda kv: kv[1]["accuracy"])
    print(f"  Winner: {winner[0]} (accuracy={winner[1]['accuracy']:.4f})")

def ex37():
    """Production MLflow patterns"""
    description = """
# Production MLflow Patterns

# 1. Remote tracking server (not local ./mlruns):
# mlflow.set_tracking_uri("https://mlflow.company.com")

# 2. Use S3/GCS for artifact store:
# mlflow server --default-artifact-root s3://company-mlflow/artifacts

# 3. PostgreSQL as backend store (not SQLite):
# mlflow server --backend-store-uri postgresql://user:pass@host/mlflowdb

# 4. Authentication (MLflow >= 2.5):
# MLFLOW_TRACKING_USERNAME / MLFLOW_TRACKING_PASSWORD env vars

# 5. Model tagging for traceability:
# mlflow.set_tag("git_commit", subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip())
# mlflow.set_tag("deploy_env", os.getenv("DEPLOY_ENV", "dev"))

# 6. Auto-tag with CI/CD metadata:
# mlflow.set_tags({
#     "ci_pipeline": os.getenv("CI_PIPELINE_ID"),
#     "branch": os.getenv("CI_COMMIT_BRANCH"),
#     "triggered_by": os.getenv("GITLAB_USER_LOGIN")
# })

# 7. Always use experiment names (not IDs) for portability
# 8. Set experiment before start_run (not inside)
# 9. Use run_name for human-readable identification
"""
    print("Ex37 — Production MLflow Patterns:")
    print(description)

def ex38():
    """MLflow Recipes concept"""
    description = """
# MLflow Recipes (formerly Pipelines) — opinionated ML workflow templates

# Templates available:
# - regression/v1    — end-to-end regression
# - classification/v1 — end-to-end classification

# Recipe structure:
# recipe.yaml       — defines steps + config
# profiles/
#   local.yaml      — local dev config
#   production.yaml — production config
# steps/
#   ingest.py       — data loading
#   split.py        — train/test split
#   transform.py    — feature engineering
#   train.py        — model training
#   evaluate.py     — metric evaluation + gates
#   register.py     — model registration

# Usage:
# from mlflow.recipes import Recipe
# r = Recipe(profile="local")
# r.run("train")          # run up to train step
# r.run()                 # run all steps
# r.inspect("evaluate")   # open step card in Jupyter

# Benefits:
# - Standardized structure across teams
# - Auto-logging to MLflow
# - Step-level caching (skip unchanged steps)
# - Built-in data validation + model gating
"""
    print("Ex38 — MLflow Recipes Concept:")
    print(description)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """MLflow + custom metrics"""
    if not MLFLOW_AVAILABLE:
        print("Ex39 — MLflow + Custom Metrics:")
        print("  mlflow.log_metric('business_value', compute_business_value(preds, y_test))")
        return
    mlflow.set_experiment("ex39_custom_metrics")

    def business_value(y_true, y_pred):
        tp = int(np.sum((y_pred == 1) & (y_true == 1)))
        fp = int(np.sum((y_pred == 1) & (y_true == 0)))
        fn = int(np.sum((y_pred == 0) & (y_true == 1)))
        return tp * 500 - fp * 200 - fn * 100

    with mlflow.start_run(run_name="custom_metrics"):
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        acc = accuracy_score(y_test, preds)
        bv = business_value(y_test, preds)
        mlflow.log_metrics({
            "accuracy": acc,
            "business_value_usd": float(bv),
            "false_positive_cost": float(np.sum((preds==1) & (y_test==0)) * 200)
        })
    print("Ex39 — MLflow + Custom Metrics:")
    print(f"  accuracy={acc:.4f} | business_value=${bv:,.0f}")

def ex40():
    """MLflow + feature store integration"""
    description = """
# MLflow + Feature Store (Feast / Tecton / Vertex AI Feature Store)

# Log feature store metadata as MLflow tags:
# mlflow.set_tag("feature_store", "feast")
# mlflow.set_tag("feature_view", "loan_features_v3")
# mlflow.set_tag("feature_version", "20250101")

# Log feature names as artifact:
# feature_names = feature_store.get_features("loan_features_v3")
# mlflow.log_dict({"features": feature_names}, "feature_metadata.json")

# Custom feature drift metric:
# drift_score = compute_psi(train_features, prod_features)
# mlflow.log_metric("feature_drift_psi", drift_score)

# Example workflow:
# 1. Feature store generates training dataset + feature version tag
# 2. MLflow run logs feature_version tag
# 3. At inference, feature store serves features with same version
# 4. If drift detected → re-train using updated feature version
# 5. New run logs new feature_version → full traceability
"""
    print("Ex40 — MLflow + Feature Store Integration:")
    print(description)

def ex41():
    """MLflow REST API concept"""
    description = """
# MLflow REST API — programmatic access without Python client

# Base URL: http://mlflow-server:5000/api/2.0/mlflow

# Create experiment:
# POST /experiments/create
# Body: {"name": "my_exp", "tags": [{"key": "team", "value": "ml"}]}

# Create run:
# POST /runs/create
# Body: {"experiment_id": "1", "run_name": "my_run"}

# Log metric:
# POST /runs/log-metric
# Body: {"run_id": "abc123", "key": "accuracy", "value": 0.92, "timestamp": 1704067200000, "step": 0}

# Log param:
# POST /runs/log-parameter
# Body: {"run_id": "abc123", "key": "n_estimators", "value": "100"}

# Search runs:
# GET /runs/search
# Body: {"experiment_ids": ["1"], "filter": "metrics.accuracy > 0.9", "order_by": ["metrics.accuracy DESC"]}

# Register model:
# POST /registered-models/create
# Body: {"name": "LoanModel"}

# Useful for: non-Python services, microservices logging to MLflow,
# integration tests, dashboards querying MLflow directly
"""
    print("Ex41 — MLflow REST API Concept:")
    print(description)

def ex42():
    """MLflow with cloud storage (S3/GCS)"""
    description = """
# MLflow artifact store on cloud storage

# AWS S3:
# mlflow server \\
#   --backend-store-uri postgresql://user:pass@rds-host/mlflowdb \\
#   --default-artifact-root s3://company-mlflow/artifacts \\
#   --host 0.0.0.0 --port 5000

# Required: AWS credentials (IAM role or env vars)
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
# Or use IAM role on EC2/ECS/EKS (recommended)

# GCS:
# --default-artifact-root gs://company-mlflow/artifacts
# Required: GOOGLE_APPLICATION_CREDENTIALS env var

# Azure Blob:
# --default-artifact-root wasbs://container@storage.blob.core.windows.net/mlflow

# MinIO (self-hosted S3-compatible):
# --default-artifact-root s3://mlflow
# Set: MLFLOW_S3_ENDPOINT_URL=http://minio:9000

# Client side (no change needed — MLflow handles S3/GCS transparently):
# mlflow.sklearn.log_model(model, "model")  # automatically goes to S3
"""
    print("Ex42 — MLflow with Cloud Storage (S3/GCS):")
    print(description)

def ex43():
    """Distributed training logging"""
    if not MLFLOW_AVAILABLE:
        print("Ex43 — Distributed Training Logging:")
        print("  Only rank-0 worker logs to MLflow; others log locally")
        return
    mlflow.set_experiment("ex43_distributed_logging")

    def train_worker(rank: int, world_size: int):
        np.random.seed(rank)
        # Simulate each worker training on a data shard
        shard_size = len(X_train) // world_size
        start = rank * shard_size
        X_shard = X_train[start:start + shard_size]
        y_shard = y_train[start:start + shard_size]
        clf = RandomForestClassifier(n_estimators=20, random_state=rank)
        clf.fit(X_shard, y_shard)
        return clf.score(X_test, y_test)

    world_size = 4
    worker_accs = [train_worker(r, world_size) for r in range(world_size)]
    # Only rank-0 logs to MLflow (simulated)
    with mlflow.start_run(run_name="distributed_rank0"):
        mlflow.log_param("world_size", world_size)
        mlflow.log_metric("worker_avg_accuracy", float(np.mean(worker_accs)))
        for rank, acc in enumerate(worker_accs):
            mlflow.log_metric("worker_accuracy", acc, step=rank)
    print("Ex43 — Distributed Training Logging:")
    for i, acc in enumerate(worker_accs):
        print(f"  Worker {i}: acc={acc:.4f}")
    print(f"  Mean: {np.mean(worker_accs):.4f} (logged by rank-0 to MLflow)")

def ex44():
    """MLflow + DVC concept"""
    description = """
# MLflow + DVC — experiment tracking + data versioning

# DVC tracks: datasets, model artifacts in git-compatible way
# MLflow tracks: hyperparameters, metrics, model flavors

# Typical workflow:
# 1. DVC: version training data
#    dvc add data/train.csv
#    git commit -m "add train dataset v3.2"
#    dvc push  (to S3/GCS remote)

# 2. MLflow: log data version tag + run experiment
#    data_hash = subprocess.check_output(["dvc", "hash", "data/train.csv"]).decode().strip()
#    with mlflow.start_run():
#        mlflow.set_tag("data_dvc_hash", data_hash)
#        mlflow.set_tag("data_version", "v3.2")
#        # ... train + log ...

# 3. Reproduce exactly:
#    git checkout <commit>         # restore code
#    dvc checkout                  # restore data (matches git state)
#    mlflow run . -P ...           # run experiment

# DVC pipelines (dvc.yaml) + MLflow = full ML reproducibility:
# dvc repro → runs pipeline → auto-logs to MLflow
"""
    print("Ex44 — MLflow + DVC Concept:")
    print(description)

def ex45():
    """Model monitoring with MLflow"""
    if not MLFLOW_AVAILABLE:
        print("Ex45 — Model monitoring with MLflow:")
        print("  Log production metrics as MLflow runs with tag 'type=monitoring'")
        return
    mlflow.set_experiment("ex45_production_monitoring")

    def log_production_metrics(batch_id: int, predictions: np.ndarray, actuals: np.ndarray):
        with mlflow.start_run(run_name=f"monitoring_batch_{batch_id}"):
            mlflow.set_tag("type", "monitoring")
            mlflow.set_tag("batch_id", str(batch_id))
            acc = accuracy_score(actuals, predictions)
            pos_rate = float(predictions.mean())
            mlflow.log_metrics({"accuracy": acc, "positive_rate": pos_rate})
            mlflow.log_param("batch_size", len(predictions))
            return acc

    # Simulate 3 production batches
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    np.random.seed(42)
    accs = []
    for batch in range(3):
        idx = np.random.choice(len(X_test), size=30, replace=True)
        preds = clf.predict(X_test[idx])
        acc = log_production_metrics(batch, preds, y_test[idx])
        accs.append(acc)
    print("Ex45 — Model Monitoring with MLflow:")
    for i, a in enumerate(accs):
        print(f"  Batch {i}: accuracy={a:.4f}")

def ex46():
    """Drift logging"""
    if not MLFLOW_AVAILABLE:
        print("Ex46 — Drift logging:")
        print("  Log PSI, KS-stat, and feature drift scores as MLflow metrics")
        return
    from scipy import stats
    mlflow.set_experiment("ex46_drift_logging")

    def log_drift_metrics(reference_data: np.ndarray, production_data: np.ndarray):
        drift_metrics = {}
        for feat_idx in range(min(3, reference_data.shape[1])):
            ref_col = reference_data[:, feat_idx]
            prod_col = production_data[:, feat_idx]
            ks_stat, ks_pval = stats.ks_2samp(ref_col, prod_col)
            drift_metrics[f"ks_stat_feat_{feat_idx}"] = float(ks_stat)
            drift_metrics[f"ks_pval_feat_{feat_idx}"] = float(ks_pval)
        return drift_metrics

    np.random.seed(99)
    prod_X = X_test + np.random.normal(0.5, 0.3, X_test.shape)  # simulated drift

    with mlflow.start_run(run_name="drift_detection_run"):
        mlflow.set_tag("type", "drift_monitoring")
        drift_metrics = log_drift_metrics(X_train, prod_X)
        mlflow.log_metrics(drift_metrics)

    print("Ex46 — Drift Logging:")
    for k, v in list(drift_metrics.items())[:6]:
        print(f"  {k}: {v:.4f}")

def ex47():
    """MLflow Plugins"""
    description = """
# MLflow Plugins — extend MLflow with custom functionality

# Types of plugins:
# 1. Tracking store plugin  — custom backend (e.g., DynamoDB, MongoDB)
# 2. Artifact repository plugin — custom artifact store (e.g., Azure, Alibaba OSS)
# 3. Model flavor plugin — new model type support
# 4. Deployment plugin — deploy to custom target

# Create a plugin (PyPI package with entry_points):
# setup.cfg:
# [options.entry_points]
# mlflow.tracking_store =
#     dynamodb = my_plugin.store:DynamoDBStore
# mlflow.artifact_repository =
#     custom = my_plugin.artifact:CustomArtifactRepo
# mlflow.model_registry.store =
#     dynamodb = my_plugin.registry:DynamoDBRegistry

# After pip install my-mlflow-plugin, use:
# mlflow.set_tracking_uri("dynamodb://my-table")

# Popular community plugins:
# - mlflow-azure-blob-store
# - mlflow-spark
# - mlflow-R (R language support)
"""
    print("Ex47 — MLflow Plugins:")
    print(description)

def ex48():
    """MLflow Deployments"""
    description = """
# MLflow Deployments — deploy models to various targets

# Built-in deployment targets:
# mlflow.deployments

# Deploy to local (testing):
# mlflow models serve -m "models:/LoanModel/Production" -p 8080

# Deploy to SageMaker:
# mlflow sagemaker deploy \\
#   --app-name loan-model \\
#   --model-uri "models:/LoanModel/Production" \\
#   --region-name us-east-1 \\
#   --instance-type ml.m5.xlarge

# Deploy to Azure ML:
# mlflow azureml deploy \\
#   --model-uri "runs:/RUN_ID/model" \\
#   --workspace-name my-workspace

# Python SDK deployment:
# from mlflow.deployments import get_deploy_client
# client = get_deploy_client("sagemaker")
# client.create_deployment("loan-model", model_uri="models:/LoanModel/Production")
# client.predict("loan-model", {"instances": [[35, 75000, 720]]})

# Docker-based deployment:
# mlflow models build-docker -m "models:/LoanModel/Production" -n loan-model-image
# docker run -p 8080:8080 loan-model-image
"""
    print("Ex48 — MLflow Deployments:")
    print(description)

def ex49():
    """Production MLflow architecture"""
    description = """
# Production MLflow Architecture
# =================================

# ┌──────────────────────────────────────────────────────────┐
# │  MLflow Tracking Server (HA)                             │
# │  2+ instances behind load balancer                       │
# │  gunicorn --workers 4 mlflow.server:app                  │
# └────────────┬─────────────────────────────────────────────┘
#              │
# ┌────────────▼──────────┐   ┌──────────────────────────────┐
# │  PostgreSQL (RDS)     │   │  S3 / GCS Artifact Store     │
# │  backend-store        │   │  model.pkl, plots, datasets  │
# │  runs, params,        │   │  organized by run_id         │
# │  metrics, tags        │   └──────────────────────────────┘
# └───────────────────────┘
#
# Auth: LDAP/OAuth via MLflow Auth (>= 2.5) or reverse proxy (nginx + OAuth2)
#
# Scale: 100+ data scientists logging 1000+ runs/day
# Retention: archive runs older than 90 days → cold storage
# Backup: daily RDS snapshots + S3 versioning
#
# Access:
# - Data scientists: mlflow.set_tracking_uri("https://mlflow.company.com")
# - CI/CD: MLFLOW_TRACKING_URI env var in pipeline
# - k8s training jobs: same env var injected via secret
"""
    print("Ex49 — Production MLflow Architecture:")
    print(description)

def ex50():
    """MLflow best practices checklist"""
    description = """
# MLflow Best Practices Checklist
# ==================================

# Experiment management:
# ✓ Name experiments by project/team/model (not generic "Default")
# ✓ Set experiment before start_run (not inline)
# ✓ Use run_name for human-readable identification
# ✓ Tag runs with git_commit, branch, author, dataset_version

# Logging:
# ✓ Use autolog for standard models (sklearn, xgboost, etc.)
# ✓ Log params ONCE at start (immutable config)
# ✓ Log metrics at each step/epoch with step parameter
# ✓ Always include model signature + input_example
# ✓ Log confusion matrix, feature importances as artifacts

# Model Registry:
# ✓ Only register models that pass evaluation gate (accuracy > baseline)
# ✓ Use Staging for QA testing, Production for live serving
# ✓ Archive old Production versions (archive_existing_versions=True)
# ✓ Add description to each model version (what changed, dataset used)

# Infrastructure:
# ✓ Remote tracking server (not local ./mlruns in production)
# ✓ PostgreSQL backend (not SQLite)
# ✓ Cloud artifact store (S3/GCS)
# ✓ Enable authentication
# ✓ Regular database backups
"""
    print("Ex50 — MLflow Best Practices Checklist:")
    print(description)


def main():
    print("=" * 60)
    print("Examples 4.3 — MLflow Experiment Tracking")
    print("=" * 60)
    if not MLFLOW_AVAILABLE:
        print("[Note: mlflow not installed — some examples show code patterns]")
    print("\n─── BASIC (1–13) ───")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n─── INTERMEDIATE (14–26) ───")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n─── NESTED (27–38) ───")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n─── ADVANCED (39–50) ───")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
