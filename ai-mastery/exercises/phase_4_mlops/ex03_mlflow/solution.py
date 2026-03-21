# ============================================================
# Solution 4.3 — MLflow Experiment Tracking
# ============================================================
#
# pip install mlflow scikit-learn numpy
#
# Runs against local ./mlruns directory (no server required).
# Start the UI: mlflow ui --backend-store-uri ./mlruns

import os
import tempfile
import numpy as np

from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix

try:
    import mlflow
    import mlflow.sklearn
    from mlflow.tracking import MlflowClient
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False

TRACKING_URI = "./mlruns"
EXPERIMENT_NAME = "iris-classification"


def _require_mlflow(fn_name: str):
    if not MLFLOW_AVAILABLE:
        print(f"  [skip] mlflow not installed — {fn_name} skipped.")
        return False
    return True


# ---------------------------------------------------------------------------
# SOLUTION 1: Setup experiment
# ---------------------------------------------------------------------------
def setup_experiment(experiment_name: str) -> str:
    if not _require_mlflow("setup_experiment"):
        return "N/A"
    mlflow.set_tracking_uri(TRACKING_URI)
    experiment = mlflow.set_experiment(experiment_name)
    return experiment.experiment_id


# ---------------------------------------------------------------------------
# SOLUTION 2: Train and log RandomForest
# ---------------------------------------------------------------------------
def train_and_log_random_forest(
    X_train, X_test, y_train, y_test,
    n_estimators: int = 100,
    max_depth: int = None,
) -> str:
    if not _require_mlflow("train_and_log_random_forest"):
        return "N/A"
    mlflow.set_tracking_uri(TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)

    with mlflow.start_run(run_name="random-forest") as run:
        # Log parameters
        mlflow.log_param("model_type", "RandomForestClassifier")
        mlflow.log_param("n_estimators", n_estimators)
        mlflow.log_param("max_depth", max_depth if max_depth else "None")
        mlflow.log_param("random_state", 42)

        # Train
        model = RandomForestClassifier(
            n_estimators=n_estimators, max_depth=max_depth, random_state=42
        )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # Log metrics
        acc = accuracy_score(y_test, y_pred)
        f1  = f1_score(y_test, y_pred, average="weighted")
        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("f1_score", f1)

        # Log model
        mlflow.sklearn.log_model(model, artifact_path="model")

        print(f"    RandomForest  | accuracy={acc:.4f}  f1={f1:.4f}  run_id={run.info.run_id}")
        return run.info.run_id


# ---------------------------------------------------------------------------
# SOLUTION 3: Train and log LogisticRegression
# ---------------------------------------------------------------------------
def train_and_log_logistic_regression(
    X_train, X_test, y_train, y_test,
    C: float = 1.0,
    max_iter: int = 200,
) -> str:
    if not _require_mlflow("train_and_log_logistic_regression"):
        return "N/A"
    mlflow.set_tracking_uri(TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)

    with mlflow.start_run(run_name="logistic-regression") as run:
        mlflow.log_param("model_type", "LogisticRegression")
        mlflow.log_param("C", C)
        mlflow.log_param("max_iter", max_iter)
        mlflow.log_param("solver", "lbfgs")

        model = LogisticRegression(C=C, max_iter=max_iter, solver="lbfgs",
                                   multi_class="auto", random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        f1  = f1_score(y_test, y_pred, average="weighted")
        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("f1_score", f1)

        mlflow.sklearn.log_model(model, artifact_path="model")

        print(f"    LogisticReg   | accuracy={acc:.4f}  f1={f1:.4f}  run_id={run.info.run_id}")
        return run.info.run_id


# ---------------------------------------------------------------------------
# SOLUTION 4: Find best run by accuracy
# ---------------------------------------------------------------------------
def find_best_run(experiment_name: str) -> str:
    if not _require_mlflow("find_best_run"):
        return "N/A"
    mlflow.set_tracking_uri(TRACKING_URI)
    experiment = mlflow.get_experiment_by_name(experiment_name)
    if experiment is None:
        return "N/A"

    runs = mlflow.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["metrics.accuracy DESC"],
    )
    if runs.empty:
        return "N/A"
    best_run_id = runs.iloc[0]["run_id"]
    best_acc    = runs.iloc[0]["metrics.accuracy"]
    print(f"    Best run: {best_run_id}  accuracy={best_acc:.4f}")
    return best_run_id


# ---------------------------------------------------------------------------
# SOLUTION 5: Log confusion matrix as artifact
# ---------------------------------------------------------------------------
def log_confusion_matrix_artifact(run_id: str, cm: np.ndarray) -> None:
    if not _require_mlflow("log_confusion_matrix_artifact"):
        return
    mlflow.set_tracking_uri(TRACKING_URI)

    with tempfile.TemporaryDirectory() as tmp:
        cm_path = os.path.join(tmp, "confusion_matrix.txt")
        with open(cm_path, "w") as f:
            f.write("Confusion Matrix\n")
            f.write("=" * 30 + "\n")
            for row in cm:
                f.write("  " + "  ".join(f"{v:4d}" for v in row) + "\n")
            f.write("\nRows = true labels, Cols = predicted labels\n")

        with mlflow.start_run(run_id=run_id):
            mlflow.log_artifact(cm_path, artifact_path="evaluation")
    print(f"    Logged confusion matrix artifact for run {run_id}")


# ---------------------------------------------------------------------------
# SOLUTION 6: Log training curve (step-level metrics)
# ---------------------------------------------------------------------------
def log_training_curve(run_id: str, n_steps: int = 10) -> None:
    if not _require_mlflow("log_training_curve"):
        return
    mlflow.set_tracking_uri(TRACKING_URI)

    with mlflow.start_run(run_id=run_id):
        for step in range(n_steps):
            # Simulate decaying loss
            train_loss = 1.0 * (0.7 ** step) + np.random.uniform(0, 0.05)
            val_loss   = 1.0 * (0.75 ** step) + np.random.uniform(0, 0.08)
            mlflow.log_metric("train_loss", train_loss, step=step)
            mlflow.log_metric("val_loss",   val_loss,   step=step)
    print(f"    Logged {n_steps} training steps for run {run_id}")


# ---------------------------------------------------------------------------
# SOLUTION 7: Load model from run
# ---------------------------------------------------------------------------
def load_model_from_run(run_id: str):
    if not _require_mlflow("load_model_from_run"):
        return None
    mlflow.set_tracking_uri(TRACKING_URI)
    model_uri = f"runs:/{run_id}/model"
    model = mlflow.sklearn.load_model(model_uri)
    print(f"    Loaded model from {model_uri}: {type(model).__name__}")
    return model


# ---------------------------------------------------------------------------
# SOLUTION 8: Register model in Model Registry
# ---------------------------------------------------------------------------
def register_model(run_id: str, registered_name: str) -> int:
    if not _require_mlflow("register_model"):
        return -1
    mlflow.set_tracking_uri(TRACKING_URI)
    try:
        model_uri = f"runs:/{run_id}/model"
        result = mlflow.register_model(model_uri, registered_name)
        version = int(result.version)
        print(f"    Registered '{registered_name}' version {version}")
        return version
    except Exception as e:
        print(f"    [register_model] {e}")
        return -1


# ---------------------------------------------------------------------------
# SOLUTION 9: Transition model stage
# ---------------------------------------------------------------------------
def transition_model_stage(
    registered_name: str, version: int, stage: str
) -> None:
    if not _require_mlflow("transition_model_stage"):
        return
    mlflow.set_tracking_uri(TRACKING_URI)
    try:
        client = MlflowClient(tracking_uri=TRACKING_URI)
        client.transition_model_version_stage(
            name=registered_name,
            version=str(version),
            stage=stage,
            archive_existing_versions=(stage == "Production"),
        )
        print(f"    Transitioned '{registered_name}' v{version} → {stage}")
    except Exception as e:
        print(f"    [transition_model_stage] {e}")


# ---------------------------------------------------------------------------
# SOLUTION 10: Load production model
# ---------------------------------------------------------------------------
def load_production_model(registered_name: str):
    if not _require_mlflow("load_production_model"):
        return None
    mlflow.set_tracking_uri(TRACKING_URI)
    try:
        model_uri = f"models:/{registered_name}/Production"
        model = mlflow.sklearn.load_model(model_uri)
        print(f"    Loaded Production model '{registered_name}': {type(model).__name__}")
        return model
    except Exception as e:
        print(f"    [load_production_model] {e}")
        return None


# ---------------------------------------------------------------------------
# SOLUTION 11: Train with autolog
# ---------------------------------------------------------------------------
def train_with_autolog(X_train, X_test, y_train, y_test) -> str:
    if not _require_mlflow("train_with_autolog"):
        return "N/A"
    mlflow.set_tracking_uri(TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)

    mlflow.sklearn.autolog(log_models=True, log_input_examples=False)
    with mlflow.start_run(run_name="autolog-rf") as run:
        model = RandomForestClassifier(n_estimators=50, random_state=0)
        model.fit(X_train, y_train)
        # autolog captures: params, metrics, model — all automatically
        print(f"    Autolog run_id: {run.info.run_id}")
        return run.info.run_id


# ---------------------------------------------------------------------------
# SOLUTION 12: MLproject file content
# ---------------------------------------------------------------------------
def mlproject_file_content() -> str:
    return """\
name: iris-classification

# Use the current conda/pip environment
python_env: python_env.yaml

entry_points:
  train:
    parameters:
      n_estimators:
        type: int
        default: 100
      max_depth:
        type: int
        default: 5
      experiment_name:
        type: str
        default: iris-classification
    command: >
      python train.py
        --n-estimators {n_estimators}
        --max-depth {max_depth}
        --experiment-name {experiment_name}

  evaluate:
    parameters:
      run_id:
        type: str
    command: "python evaluate.py --run-id {run_id}"
"""


# ---------------------------------------------------------------------------
# SOLUTION 13: Search high-accuracy runs
# ---------------------------------------------------------------------------
def search_high_accuracy_runs(experiment_name: str, threshold: float = 0.9) -> list:
    if not _require_mlflow("search_high_accuracy_runs"):
        return []
    mlflow.set_tracking_uri(TRACKING_URI)
    experiment = mlflow.get_experiment_by_name(experiment_name)
    if experiment is None:
        return []

    runs = mlflow.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string=f"metrics.accuracy > {threshold}",
        order_by=["metrics.accuracy DESC"],
    )
    run_ids = runs["run_id"].tolist() if not runs.empty else []
    print(f"    Runs with accuracy > {threshold}: {len(run_ids)}")
    return run_ids


def main():
    print("=== Solution 4.3: MLflow Experiment Tracking ===\n")

    if not MLFLOW_AVAILABLE:
        print("mlflow not installed. Run: pip install mlflow scikit-learn")
        print("\nMLproject file content (no mlflow required):")
        print(mlproject_file_content())
        return

    # Load data once
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2, random_state=42
    )

    print("1. Setting up experiment...")
    exp_id = setup_experiment(EXPERIMENT_NAME)
    print(f"   Experiment ID: {exp_id}\n")

    print("2. Training and logging RandomForest...")
    rf_run_id = train_and_log_random_forest(X_train, X_test, y_train, y_test)
    print()

    print("3. Training and logging LogisticRegression...")
    lr_run_id = train_and_log_logistic_regression(X_train, X_test, y_train, y_test)
    print()

    print("4. Finding best run...")
    best_run_id = find_best_run(EXPERIMENT_NAME)
    print()

    print("5. Logging confusion matrix artifact...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)
    y_pred = rf_model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)
    log_confusion_matrix_artifact(rf_run_id, cm)
    print()

    print("6. Logging training curve (simulated loss)...")
    log_training_curve(rf_run_id, n_steps=8)
    print()

    print("7. Loading model from run...")
    loaded = load_model_from_run(rf_run_id)
    if loaded:
        acc = accuracy_score(y_test, loaded.predict(X_test))
        print(f"   Loaded model accuracy: {acc:.4f}")
    print()

    print("8–10. Model Registry (register → Staging → Production)...")
    version = register_model(best_run_id, "IrisClassifier")
    if version > 0:
        transition_model_stage("IrisClassifier", version, "Staging")
        transition_model_stage("IrisClassifier", version, "Production")
        load_production_model("IrisClassifier")
    print()

    print("11. Training with autolog...")
    train_with_autolog(X_train, X_test, y_train, y_test)
    print()

    print("12. MLproject file content:")
    print(mlproject_file_content())

    print("13. Searching high-accuracy runs (> 0.9)...")
    high_acc = search_high_accuracy_runs(EXPERIMENT_NAME, threshold=0.9)
    print()

    print(f"MLflow UI: run  mlflow ui --backend-store-uri {TRACKING_URI}")
    print(f"Then open: http://localhost:5000")


if __name__ == "__main__":
    main()
