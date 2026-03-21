# ============================================================
# Exercise 1.5 — Model Evaluation & Validation
# ============================================================
# Topics:
#   • Train/test split and cross-validation
#   • Confusion matrix
#   • Accuracy, Precision, Recall, F1-score
#   • ROC curve and AUC
#   • Regression metrics (MSE, RMSE, MAE, R²)
#   • Bias-variance tradeoff
#   • Learning curves
#   • Hyperparameter tuning (GridSearchCV)
#   • Feature importance
#   • Model comparison pipeline
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold,
    GridSearchCV, learning_curve
)
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.metrics import (
    confusion_matrix, accuracy_score, precision_score,
    recall_score, f1_score, classification_report,
    roc_auc_score, roc_curve,
    mean_squared_error, mean_absolute_error, r2_score
)

# ---------------------------------------------------------------------------
# Shared sample data
# ---------------------------------------------------------------------------
np.random.seed(42)

X_clf, y_clf = make_classification(
    n_samples=500, n_features=10, n_informative=6,
    n_redundant=2, random_state=42
)
X_clf_train, X_clf_test, y_clf_train, y_clf_test = train_test_split(
    X_clf, y_clf, test_size=0.2, random_state=42, stratify=y_clf
)

X_reg, y_reg = make_regression(n_samples=300, n_features=8, noise=20, random_state=42)
X_reg_train, X_reg_test, y_reg_train, y_reg_test = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

# ---------------------------------------------------------------------------
# TODO 1: Stratified k-fold cross-validation
# ---------------------------------------------------------------------------
# Use StratifiedKFold(n_splits=5) with LogisticRegression(max_iter=1000).
# Return a dict {'mean_acc': ..., 'std_acc': ..., 'fold_scores': [...]}.
# Expected: mean_acc ~0.85, fold_scores is a list of 5 floats

def stratified_cv():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 2: Confusion matrix analysis
# ---------------------------------------------------------------------------
# Train LogisticRegression on clf data and compute the confusion matrix.
# Return a dict {'confusion_matrix': ..., 'tn': ..., 'fp': ..., 'fn': ..., 'tp': ...}
# Expected: 2x2 numpy array and the four extracted values

def confusion_matrix_analysis():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 3: Compute precision, recall, and F1-score manually and via sklearn
# ---------------------------------------------------------------------------
# Train LogisticRegression. Compute precision, recall, F1 both by hand
# (using TP/FP/FN from confusion matrix) and via sklearn.
# Return a dict {'sklearn_precision': ..., 'sklearn_recall': ...,
#                'sklearn_f1': ..., 'manual_precision': ...,
#                'manual_recall': ..., 'manual_f1': ...}
# Expected: manual and sklearn values should match (±0.001)

def precision_recall_f1():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 4: ROC curve and AUC score
# ---------------------------------------------------------------------------
# Use LogisticRegression with predict_proba. Compute the ROC AUC score.
# Return a dict {'auc': ..., 'n_thresholds': ...}
# Expected: auc > 0.90, n_thresholds > 50

def roc_analysis():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 5: Regression metrics (MSE, RMSE, MAE, R²)
# ---------------------------------------------------------------------------
# Train a LinearRegression on regression data.
# Return a dict {'mse': ..., 'rmse': ..., 'mae': ..., 'r2': ...}
# Expected: r2 > 0.90 on this dataset

def regression_metrics():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 6: Compare regression metrics across three models
# ---------------------------------------------------------------------------
# Train LinearRegression, Ridge(alpha=1), Ridge(alpha=10) on regression data.
# Return a dict {model_name: {'r2': ..., 'mae': ...}}.
# Expected: dict with 3 entries

def compare_regression_models():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Demonstrate bias-variance tradeoff with polynomial degree
# ---------------------------------------------------------------------------
# For polynomial degrees [1, 2, 3, 5, 10], use a 1-feature regression subset.
# For each degree, compute train MSE and test MSE.
# Return a dict {degree: {'train_mse': ..., 'test_mse': ...}}.
# Expected: test_mse forms a U-shape (decreases then increases)

def bias_variance_polynomial():
    pass  # TODO: implement (use X_reg[:, :1] for 1 feature)

# ---------------------------------------------------------------------------
# TODO 8: Plot-style learning curve data
# ---------------------------------------------------------------------------
# Use learning_curve with LogisticRegression (cv=5) on clf data.
# Return a dict {'train_sizes': [...], 'train_scores_mean': [...],
#                'val_scores_mean': [...]}.
# Expected: arrays of length 10 (use np.linspace(0.1, 1.0, 10))

def learning_curve_data():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 9: GridSearchCV for LogisticRegression
# ---------------------------------------------------------------------------
# Search over C=[0.01, 0.1, 1, 10] and solver=['lbfgs', 'liblinear'].
# Use cv=5, scoring='accuracy'. Return a dict:
# {'best_params': ..., 'best_score': ..., 'all_results_df': ...}
# Expected: best_params is a dict, best_score > 0.80

def grid_search_logistic():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 10: GridSearchCV for RandomForestClassifier
# ---------------------------------------------------------------------------
# Search over n_estimators=[50, 100] and max_depth=[None, 5, 10].
# Use cv=3, scoring='f1'. Return {'best_params': ..., 'best_f1': ...}.
# Expected: best_f1 > 0.80

def grid_search_rf():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 11: Feature importance from Random Forest
# ---------------------------------------------------------------------------
# Train RandomForestClassifier(n_estimators=100) on clf data.
# Return the top-3 most important feature indices and their importances.
# Return a dict {'top3_indices': [...], 'top3_importances': [...]}.
# Expected: 3 feature indices and 3 importance values

def feature_importance():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 12: Permutation-style feature importance (manual)
# ---------------------------------------------------------------------------
# Train LogisticRegression. Baseline accuracy on test set.
# For each feature column, shuffle that column in X_clf_test and re-score.
# importance[i] = baseline_acc - shuffled_acc
# Return a dict {feature_idx: importance_drop}.
# Expected: dict with 10 entries, important features have larger positive drops

def permutation_importance():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 13: Full evaluation pipeline with sklearn Pipeline
# ---------------------------------------------------------------------------
# Build a Pipeline: StandardScaler → LogisticRegression(max_iter=1000).
# Evaluate with cross_val_score (cv=5, scoring='f1').
# Return {'mean_f1': ..., 'std_f1': ...}.
# Expected: mean_f1 > 0.80

def evaluation_pipeline():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 14: Multi-metric evaluation dashboard
# ---------------------------------------------------------------------------
# Train LogisticRegression, RandomForest, and SVC on clf data.
# For each model report: accuracy, precision, recall, f1, auc.
# Return a list of dicts [{'model': name, 'accuracy': ..., ...}, ...].
# Expected: 3 entries in the list

def evaluation_dashboard():
    pass  # TODO: implement

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 1.5: Model Evaluation & Validation ===\n")

    print("TODO 1  — Stratified CV:", stratified_cv())
    print("TODO 2  — Confusion matrix:", confusion_matrix_analysis())
    print("TODO 3  — Precision/Recall/F1:", precision_recall_f1())
    print("TODO 4  — ROC/AUC:", roc_analysis())
    print("TODO 5  — Regression metrics:", regression_metrics())
    print("TODO 6  — Compare regression models:", compare_regression_models())
    print("TODO 7  — Bias-variance polynomial:", bias_variance_polynomial())

    lc = learning_curve_data()
    if lc:
        print("TODO 8  — Learning curve val scores:", np.round(lc['val_scores_mean'], 3))
    else:
        print("TODO 8  — Learning curve:", lc)

    gs = grid_search_logistic()
    if gs:
        print("TODO 9  — GridSearch best params:", gs['best_params'], "score:", gs['best_score'])
    else:
        print("TODO 9  — GridSearch Logistic:", gs)

    print("TODO 10 — GridSearch RF:", grid_search_rf())
    print("TODO 11 — Feature importance:", feature_importance())
    print("TODO 12 — Permutation importance:", permutation_importance())
    print("TODO 13 — Pipeline CV:", evaluation_pipeline())
    print("TODO 14 — Evaluation dashboard:", evaluation_dashboard())

if __name__ == "__main__":
    main()
