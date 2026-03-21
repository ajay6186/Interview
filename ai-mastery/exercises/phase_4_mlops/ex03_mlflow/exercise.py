# ============================================================
# Exercise 4.3 — MLflow Experiment Tracking
# ============================================================
# Topics:
#   • mlflow.start_run() and run context manager
#   • Logging parameters, metrics, and artifacts
#   • mlflow.sklearn.log_model()
#   • Comparing runs programmatically
#   • Loading models from MLflow
#   • Model registry concepts (Staging / Production)
#   • Experiment management
#   • Auto-logging with mlflow.sklearn.autolog()
#   • MLflow Projects (MLproject file)
# ============================================================

import mlflow
import mlflow.sklearn
import numpy as np
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score


# ---------------------------------------------------------------------------
# TODO 1: Set the MLflow tracking URI to store runs locally in ./mlruns
# Then create (or get) an experiment named "iris-classification"
# Return the experiment ID
# ---------------------------------------------------------------------------
def setup_experiment(experiment_name: str) -> str:
    pass  # TODO: mlflow.set_tracking_uri, mlflow.set_experiment, return experiment_id


# ---------------------------------------------------------------------------
# TODO 2: Train a RandomForest and log it as an MLflow run
# Log params: n_estimators, max_depth, random_state
# Log metrics: accuracy, f1_score (weighted)
# Log the model with mlflow.sklearn.log_model()
# Return the run_id
# ---------------------------------------------------------------------------
def train_and_log_random_forest(
    X_train, X_test, y_train, y_test,
    n_estimators: int = 100,
    max_depth: int = None,
) -> str:
    pass  # TODO: implement with mlflow.start_run() context manager


# ---------------------------------------------------------------------------
# TODO 3: Train a LogisticRegression and log it as a separate MLflow run
# Log params: C, max_iter, solver
# Log metrics: accuracy, f1_score (weighted)
# Log the model with mlflow.sklearn.log_model()
# Return the run_id
# ---------------------------------------------------------------------------
def train_and_log_logistic_regression(
    X_train, X_test, y_train, y_test,
    C: float = 1.0,
    max_iter: int = 200,
) -> str:
    pass  # TODO: implement with mlflow.start_run() context manager


# ---------------------------------------------------------------------------
# TODO 4: Compare runs in an experiment
# Use mlflow.search_runs() to get all runs for the experiment
# Return the run_id of the run with the highest accuracy
# ---------------------------------------------------------------------------
def find_best_run(experiment_name: str) -> str:
    pass  # TODO: mlflow.search_runs, sort by accuracy, return best run_id


# ---------------------------------------------------------------------------
# TODO 5: Log a custom artifact (confusion matrix as a text file)
# Create a temporary file, write the matrix, log it with mlflow.log_artifact()
# ---------------------------------------------------------------------------
def log_confusion_matrix_artifact(run_id: str, confusion_matrix: np.ndarray) -> None:
    pass  # TODO: create temp file, write cm, mlflow.log_artifact


# ---------------------------------------------------------------------------
# TODO 6: Log metrics across multiple steps (simulating epoch-level logging)
# Log "train_loss" for steps 0..n_steps with a decaying formula
# Use mlflow.log_metric(key, value, step=step)
# ---------------------------------------------------------------------------
def log_training_curve(run_id: str, n_steps: int = 10) -> None:
    pass  # TODO: use mlflow.start_run(run_id=run_id), log metric at each step


# ---------------------------------------------------------------------------
# TODO 7: Load a logged model from MLflow using the run_id
# Use mlflow.sklearn.load_model("runs:/<run_id>/model")
# Return the loaded model
# ---------------------------------------------------------------------------
def load_model_from_run(run_id: str):
    pass  # TODO: mlflow.sklearn.load_model("runs:/<run_id>/model")


# ---------------------------------------------------------------------------
# TODO 8: Register a model in the MLflow Model Registry
# Register the model from a run with a given registered name
# Return the model version number
# ---------------------------------------------------------------------------
def register_model(run_id: str, registered_name: str) -> int:
    pass  # TODO: mlflow.register_model("runs:/<run_id>/model", registered_name)


# ---------------------------------------------------------------------------
# TODO 9: Transition a registered model version to a given stage
# Stages: "Staging", "Production", "Archived"
# Use MlflowClient().transition_model_version_stage(...)
# ---------------------------------------------------------------------------
def transition_model_stage(
    registered_name: str, version: int, stage: str
) -> None:
    pass  # TODO: MlflowClient().transition_model_version_stage(...)


# ---------------------------------------------------------------------------
# TODO 10: Load the Production version of a registered model
# Use mlflow.sklearn.load_model("models:/<name>/Production")
# Return the loaded model
# ---------------------------------------------------------------------------
def load_production_model(registered_name: str):
    pass  # TODO: mlflow.sklearn.load_model("models:/<name>/Production")


# ---------------------------------------------------------------------------
# TODO 11: Use mlflow.sklearn.autolog() to automatically log a run
# Train a RandomForest with autolog enabled
# Return the run_id of the autolog run
# ---------------------------------------------------------------------------
def train_with_autolog(X_train, X_test, y_train, y_test) -> str:
    pass  # TODO: mlflow.sklearn.autolog(), train model, return run_id


# ---------------------------------------------------------------------------
# TODO 12: Write the content of an MLproject file for this exercise
# Specify: name, conda_env (or python_env), entry points: train
# Entry point train accepts: n_estimators (int, default 100), max_depth (int, default 5)
# ---------------------------------------------------------------------------
def mlproject_file_content() -> str:
    pass  # TODO: return the MLproject YAML content as a string


# ---------------------------------------------------------------------------
# TODO 13: Search runs with a filter expression
# Return runs where accuracy > threshold
# Use mlflow.search_runs(filter_string="metrics.accuracy > 0.9")
# ---------------------------------------------------------------------------
def search_high_accuracy_runs(experiment_name: str, threshold: float = 0.9) -> list:
    pass  # TODO: mlflow.search_runs with filter_string


def main():
    print("=== Exercise 4.3: MLflow Experiment Tracking ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1",  "setup_experiment()              — Set tracking URI + create experiment"),
        ("TODO 2",  "train_and_log_random_forest()   — Log RF run (params, metrics, model)"),
        ("TODO 3",  "train_and_log_logistic_reg()    — Log LR run (params, metrics, model)"),
        ("TODO 4",  "find_best_run()                 — Compare runs, return best run_id"),
        ("TODO 5",  "log_confusion_matrix_artifact() — Log a text artifact to a run"),
        ("TODO 6",  "log_training_curve()            — Log metric at each step"),
        ("TODO 7",  "load_model_from_run()           — Load model from runs:/<id>/model"),
        ("TODO 8",  "register_model()                — Register in Model Registry"),
        ("TODO 9",  "transition_model_stage()        — Move to Staging/Production"),
        ("TODO 10", "load_production_model()         — Load from models:/<name>/Production"),
        ("TODO 11", "train_with_autolog()            — mlflow.sklearn.autolog()"),
        ("TODO 12", "mlproject_file_content()        — Write MLproject YAML"),
        ("TODO 13", "search_high_accuracy_runs()     — filter_string search"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("MLflow concepts:")
    print("  Tracking URI  : where runs are stored (local ./mlruns or remote server)")
    print("  Experiment    : a named group of runs (like a project)")
    print("  Run           : one execution with params, metrics, artifacts")
    print("  Model Registry: versioned store with Staging/Production stages")
    print("  Artifact      : any file logged alongside a run (plots, CSVs, models)")


if __name__ == "__main__":
    main()
