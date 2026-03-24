# ============================================================
# Exercise 5.1 — Cross-Validation
# ============================================================
# Topics:
#   • k-fold CV from scratch
#   • sklearn KFold, StratifiedKFold, LeaveOneOut
#   • cross_val_score with single and multiple metrics
#   • cross_val_predict, TimeSeriesSplit, GroupKFold
#   • Repeated k-fold, nested CV
#   • Learning curves, overfitting detection
#   • Statistical comparison of CV scores
#   • CV for imbalanced datasets
# ============================================================

import numpy as np
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import (
    KFold, StratifiedKFold, LeaveOneOut, cross_val_score,
    cross_val_predict, TimeSeriesSplit, GroupKFold,
    RepeatedKFold, cross_validate, learning_curve
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from scipy import stats


# --- TODO 1: k-fold CV from scratch ---
# Split indices into k folds manually (no sklearn).
# Return list of (train_indices, val_indices) tuples.
def kfold_from_scratch(n_samples: int, k: int) -> list:
    pass  # TODO: implement


# --- TODO 2: sklearn KFold ---
# Use KFold(n_splits=5, shuffle=True, random_state=42).
# Return list of (train_size, val_size) tuples.
def sklearn_kfold(X, y) -> list:
    pass  # TODO: implement


# --- TODO 3: StratifiedKFold ---
# Use StratifiedKFold(n_splits=5) to preserve class ratios.
# Return the class ratio in each fold's validation set.
def stratified_kfold(X, y) -> list:
    pass  # TODO: implement


# --- TODO 4: Leave-One-Out CV ---
# Use LeaveOneOut. Return number of splits.
def leave_one_out_cv(X, y) -> int:
    pass  # TODO: implement


# --- TODO 5: cross_val_score (5-fold, accuracy) ---
# Use cross_val_score with cv=5 and scoring='accuracy'.
# Return mean and std of scores.
def cv_score_accuracy(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 6: cross_val_score with multiple metrics ---
# Use cross_validate with scoring=['accuracy','f1','roc_auc'].
# Return dict of {metric: mean_score}.
def cv_multiple_metrics(X, y) -> dict:
    pass  # TODO: implement


# --- TODO 7: Cross-validated predictions ---
# Use cross_val_predict with cv=5.
# Return the predicted labels array.
def cv_predictions(X, y) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 8: Time series CV ---
# Use TimeSeriesSplit(n_splits=5).
# Return list of (train_size, val_size) per split.
def time_series_cv(X, y) -> list:
    pass  # TODO: implement


# --- TODO 9: GroupKFold ---
# Ensure no group appears in both train and test.
# groups: integer array assigning each sample to a group.
# Return list of (train_groups, test_groups) per split.
def group_kfold_splits(X, y, groups) -> list:
    pass  # TODO: implement


# --- TODO 10: Repeated k-fold ---
# Use RepeatedKFold(n_splits=5, n_repeats=3, random_state=42).
# Return mean and std of all repeated scores.
def repeated_kfold(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 11: Nested CV ---
# Outer loop: 5-fold evaluation. Inner loop: 3-fold tuning.
# Use GridSearchCV inside outer loop with C in [0.1, 1, 10].
# Return outer fold scores list.
def nested_cv(X, y) -> list:
    pass  # TODO: implement


# --- TODO 12: Learning curve (bias-variance) ---
# Use learning_curve with train sizes 10%..100%.
# Return (train_sizes, mean_train_scores, mean_val_scores).
def learning_curve_analysis(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 13: Overfitting detection ---
# Train scores >> Val scores → overfitting.
# Return True if max gap between train and val score > 0.1.
def detect_overfitting(train_scores: np.ndarray, val_scores: np.ndarray) -> bool:
    pass  # TODO: implement


# --- TODO 14: Statistical comparison of CV scores ---
# Paired t-test between two arrays of CV fold scores.
# Return (t_statistic, p_value).
def compare_cv_scores(scores_a: np.ndarray, scores_b: np.ndarray) -> tuple:
    pass  # TODO: implement


# --- TODO 15: CV for imbalanced datasets ---
# Use StratifiedKFold + scoring='f1' for imbalanced data.
# Return mean F1 score.
def cv_imbalanced(X, y) -> float:
    pass  # TODO: implement


def main():
    print("=== Exercise 5.1: Cross-Validation ===\n")

    np.random.seed(42)
    X_cls, y_cls = make_classification(n_samples=200, n_features=10, random_state=42)
    X_reg, y_reg = make_regression(n_samples=200, n_features=5, noise=10, random_state=42)

    print("TODO 1 - k-fold from scratch (n=20, k=5):", kfold_from_scratch(20, 5))
    print("TODO 2 - sklearn KFold splits:", sklearn_kfold(X_cls, y_cls))
    print("TODO 3 - StratifiedKFold class ratios:", stratified_kfold(X_cls, y_cls))
    print("TODO 4 - LOO splits:", leave_one_out_cv(X_cls, y_cls))
    print("TODO 5 - CV accuracy (mean, std):", cv_score_accuracy(X_cls, y_cls))
    print("TODO 6 - CV multiple metrics:", cv_multiple_metrics(X_cls, y_cls))
    print("TODO 7 - CV predictions shape:", cv_predictions(X_cls, y_cls))
    print("TODO 8 - Time series splits:", time_series_cv(X_cls, y_cls))

    groups = np.repeat(np.arange(20), 10)
    print("TODO 9 - GroupKFold splits:", group_kfold_splits(X_cls, y_cls, groups))
    print("TODO 10 - Repeated KFold (mean, std):", repeated_kfold(X_cls, y_cls))
    print("TODO 11 - Nested CV scores:", nested_cv(X_cls, y_cls))

    ts, mtr, mvr = learning_curve_analysis(X_cls, y_cls) if learning_curve_analysis(X_cls, y_cls) else (None, None, None)
    print("TODO 12 - Learning curve train sizes:", ts)
    print("TODO 13 - Detect overfitting:", detect_overfitting(
        np.array([0.95, 0.96, 0.94]), np.array([0.72, 0.73, 0.71])
    ))
    print("TODO 14 - Compare CV scores (t, p):", compare_cv_scores(
        np.array([0.8, 0.82, 0.79, 0.81, 0.83]),
        np.array([0.75, 0.76, 0.74, 0.77, 0.75])
    ))

    # Imbalanced dataset
    X_imb, y_imb = make_classification(n_samples=200, weights=[0.9, 0.1], random_state=42)
    print("TODO 15 - Imbalanced CV F1:", cv_imbalanced(X_imb, y_imb))


if __name__ == "__main__":
    main()
