# ============================================================
# Exercise 1.3 — Supervised Learning: Regression & Classification
# ============================================================
# Topics:
#   • Linear and Logistic Regression
#   • Ridge and Lasso regularization
#   • Model evaluation (MSE, R², classification_report)
#   • Cross-validation and train/validation/test split
#   • Overfitting detection and bias-variance tradeoff
#   • Model persistence with joblib
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import (
    LinearRegression, LogisticRegression, Ridge, Lasso
)
from sklearn.metrics import (
    mean_squared_error, r2_score, classification_report, accuracy_score
)
from sklearn.model_selection import (
    train_test_split, cross_val_score, learning_curve
)
import joblib
import os

# ---------------------------------------------------------------------------
# Shared sample data
# ---------------------------------------------------------------------------
np.random.seed(42)

# Regression dataset
X_reg, y_reg = make_regression(n_samples=200, n_features=5, noise=15, random_state=42)
X_reg_train, X_reg_test, y_reg_train, y_reg_test = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

# Classification dataset
X_clf, y_clf = make_classification(
    n_samples=300, n_features=10, n_informative=5,
    n_redundant=2, random_state=42
)
X_clf_train, X_clf_test, y_clf_train, y_clf_test = train_test_split(
    X_clf, y_clf, test_size=0.2, random_state=42
)

# ---------------------------------------------------------------------------
# TODO 1: Train a LinearRegression model on the regression dataset
# ---------------------------------------------------------------------------
# Fit on X_reg_train, y_reg_train. Return the fitted model.

def train_linear_regression():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 2: Evaluate regression with MSE and R² score
# ---------------------------------------------------------------------------
# Use the model from TODO 1. Predict on X_reg_test, y_reg_test.
# Return a dict {'mse': ..., 'r2': ...}

def evaluate_regression(model):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 3: Train a LogisticRegression for binary classification
# ---------------------------------------------------------------------------
# Fit on X_clf_train, y_clf_train (max_iter=1000, random_state=42).
# Return the fitted model.

def train_logistic_regression():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 4: Make predictions and print classification_report
# ---------------------------------------------------------------------------
# Use the model from TODO 3. Predict on X_clf_test.
# Return the predictions array. (Also print the report.)

def evaluate_classification(model):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 5: Train Ridge regression (alpha=1.0)
# ---------------------------------------------------------------------------
# Fit on regression training data. Return the fitted model.

def train_ridge():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 6: Train Lasso regression (alpha=0.1)
# ---------------------------------------------------------------------------
# Fit on regression training data. Return the fitted model.

def train_lasso():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Manually tune the C parameter of LogisticRegression
# ---------------------------------------------------------------------------
# Try C values: [0.001, 0.01, 0.1, 1, 10, 100]
# For each C, train on clf training data and evaluate on clf test data.
# Return a dict mapping each C value to its test accuracy.

def tune_logistic_c():
    c_values = [0.001, 0.01, 0.1, 1, 10, 100]
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 8: Implement train / validation / test split
# ---------------------------------------------------------------------------
# Split X_clf, y_clf into:
#   - 60% train, 20% validation, 20% test
# Return (X_train, X_val, X_test, y_train, y_val, y_test)

def three_way_split():
    pass  # TODO: implement (hint: split twice)

# ---------------------------------------------------------------------------
# TODO 9: Detect overfitting by comparing train vs test accuracy
# ---------------------------------------------------------------------------
# Train LogisticRegression on clf data.
# Return a dict with 'train_acc' and 'test_acc'.
# Print whether the model is overfitting (difference > 0.05).

def detect_overfitting():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 10: Cross-validation (cross_val_score, cv=5)
# ---------------------------------------------------------------------------
# Use LogisticRegression on X_clf, y_clf.
# Return mean and std of the cross-validation scores.

def cross_validate():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 11: Describe the learning curve
# ---------------------------------------------------------------------------
# Use sklearn's learning_curve on a LogisticRegression.
# Return (train_sizes, train_scores_mean, val_scores_mean).
# Explain in a comment what the curve reveals.

def compute_learning_curve():
    # A learning curve plots model performance against training set size.
    # - If train score >> val score → overfitting (high variance).
    # - If both scores are low → underfitting (high bias).
    # - If they converge at a high value → good fit.
    pass  # TODO: implement using sklearn's learning_curve

# ---------------------------------------------------------------------------
# TODO 12: Explain the bias-variance tradeoff
# ---------------------------------------------------------------------------
# Train LinearRegression (low bias, low variance) and compare to a polynomial
# fit on the same data. Return train/test R² for both to illustrate.
# Add a comment explaining the tradeoff.

def bias_variance_demo():
    # Bias: error from wrong assumptions (e.g., fitting a line to curved data).
    # Variance: error from sensitivity to small fluctuations in training data.
    # Tradeoff: decreasing bias often increases variance and vice versa.
    # Simple models → high bias, low variance.
    # Complex models → low bias, high variance.
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 13: Implement a simple baseline model
# ---------------------------------------------------------------------------
# For regression: predict the mean of y_reg_train for all test points.
# For classification: predict the most common class in y_clf_train.
# Return {'baseline_mse': ..., 'baseline_acc': ...}

def baseline_model():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 14: Compare multiple models on the same dataset
# ---------------------------------------------------------------------------
# Train LinearRegression, Ridge, and Lasso on regression data.
# Return a dict mapping model name → test R² score.

def compare_models():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 15: Save and load a trained model with joblib
# ---------------------------------------------------------------------------
# Train a LogisticRegression, save it to 'model.joblib',
# reload it, predict on X_clf_test, and return the accuracy.
# Clean up the saved file afterward.

def save_and_load_model():
    pass  # TODO: implement

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 1.3: Supervised Learning ===\n")

    model_lr = train_linear_regression()
    print("TODO 1  — LinearRegression trained:", model_lr)
    print("TODO 2  — Regression metrics:", evaluate_regression(model_lr))

    model_log = train_logistic_regression()
    print("\nTODO 3  — LogisticRegression trained:", model_log)
    print("TODO 4  — Classification predictions (first 10):", evaluate_classification(model_log)[:10] if evaluate_classification(model_log) is not None else None)

    print("\nTODO 5  — Ridge R²:", r2_score(y_reg_test, train_ridge().predict(X_reg_test)) if train_ridge() else None)
    print("TODO 6  — Lasso R²:", r2_score(y_reg_test, train_lasso().predict(X_reg_test)) if train_lasso() else None)
    print("\nTODO 7  — C tuning results:", tune_logistic_c())

    splits = three_way_split()
    if splits:
        print("\nTODO 8  — Split sizes:", [s.shape for s in splits])
    print("TODO 9  — Overfitting check:", detect_overfitting())
    print("TODO 10 — Cross-val score:", cross_validate())

    lc = compute_learning_curve()
    print("\nTODO 11 — Learning curve computed:", lc is not None)
    print("TODO 12 — Bias-variance demo:", bias_variance_demo())
    print("TODO 13 — Baseline metrics:", baseline_model())
    print("TODO 14 — Model comparison:", compare_models())
    print("TODO 15 — Save/load accuracy:", save_and_load_model())

if __name__ == "__main__":
    main()
