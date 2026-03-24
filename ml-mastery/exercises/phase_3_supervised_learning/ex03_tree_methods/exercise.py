# ============================================================
# Exercise 3.3 — Tree-Based Methods
# ============================================================
# Topics:
#   • Decision Tree from scratch (binary split on best feature)
#   • sklearn DecisionTreeClassifier and DecisionTreeRegressor
#   • Random Forest, Extra Trees, Gradient Boosting
#   • XGBoost and LightGBM (optional, guarded)
#   • Feature importance, pruning, OOB score
#   • Tree depth vs overfitting, feature selection
# ============================================================

import numpy as np
from sklearn.datasets import make_classification, make_regression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (RandomForestClassifier, ExtraTreesClassifier,
                               GradientBoostingClassifier)
from sklearn.model_selection import train_test_split

np.random.seed(42)
X_cls, y_cls = make_classification(n_samples=300, n_features=5,
                                    n_informative=3, random_state=42)
X_reg, y_reg = make_regression(n_samples=300, n_features=5, noise=10,
                                random_state=42)
X_train, X_test, y_train, y_test = train_test_split(
    X_cls, y_cls, test_size=0.2, random_state=42)


# ---------------------------------------------------------------------------
# TODO 1: Decision Tree Node Split from Scratch
# ---------------------------------------------------------------------------
# Find the best binary split on a single feature for a dataset.
# Gini impurity of a node: 1 - Σ p_k²
# Search all features and thresholds (use unique feature values as candidates).
# Return (best_feature_idx, best_threshold, best_gini_gain).

def best_split(X: np.ndarray, y: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: sklearn DecisionTreeClassifier
# ---------------------------------------------------------------------------
# Fit DecisionTreeClassifier(max_depth=5, random_state=42) on (X_train, y_train).
# Return (model, test accuracy).

def sklearn_decision_tree(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Decision Tree for Regression
# ---------------------------------------------------------------------------
# Fit DecisionTreeRegressor(max_depth=5, random_state=42) on (X_reg, y_reg).
# Return (model, RMSE on X_reg).

def decision_tree_regression(X: np.ndarray, y: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Feature Importance from Tree
# ---------------------------------------------------------------------------
# Fit a DecisionTreeClassifier on (X_train, y_train).
# Return a sorted list of (feature_idx, importance) tuples,
# sorted by importance descending.

def tree_feature_importance(X_train, y_train) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Pruning — max_depth Effect
# ---------------------------------------------------------------------------
# Train DecisionTreeClassifier with max_depth in [1, 2, 3, 5, 10, None].
# Return a dict: {max_depth: (train_acc, test_acc)}.

def pruning_depth_effect(X_train, y_train, X_test, y_test) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: Random Forest
# ---------------------------------------------------------------------------
# Fit RandomForestClassifier(n_estimators=100, random_state=42)
# on (X_train, y_train). Return (model, test accuracy).

def random_forest(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Random Forest Feature Importance
# ---------------------------------------------------------------------------
# Fit RandomForestClassifier on (X_train, y_train).
# Return the feature_importances_ array sorted descending,
# as a list of (feature_idx, importance) tuples.

def rf_feature_importance(X_train, y_train) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Extra Trees
# ---------------------------------------------------------------------------
# Fit ExtraTreesClassifier(n_estimators=100, random_state=42)
# on (X_train, y_train). Return (model, test accuracy).

def extra_trees(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Gradient Boosting
# ---------------------------------------------------------------------------
# Fit GradientBoostingClassifier(n_estimators=100, random_state=42)
# on (X_train, y_train). Return (model, test accuracy).

def gradient_boosting(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: XGBoost (guarded)
# ---------------------------------------------------------------------------
# Try to import xgboost and fit XGBClassifier(n_estimators=100, random_state=42,
# use_label_encoder=False, eval_metric='logloss').
# If import fails, print a message and return None.
# Return (model, test accuracy) or None.

def xgboost_classifier(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: LightGBM (guarded)
# ---------------------------------------------------------------------------
# Try to import lightgbm and fit LGBMClassifier(n_estimators=100, random_state=42).
# If import fails, print a message and return None.
# Return (model, test accuracy) or None.

def lightgbm_classifier(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Tree Depth vs Overfitting
# ---------------------------------------------------------------------------
# For max_depth in [1, 2, 3, 5, 10, 20]:
#   - Fit DecisionTreeClassifier on X_train
#   - Record train acc and test acc
# Return a dict: {depth: {'train': acc, 'test': acc}}

def depth_vs_overfitting(X_train, y_train, X_test, y_test) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: OOB (Out-of-Bag) Score
# ---------------------------------------------------------------------------
# Fit RandomForestClassifier(n_estimators=100, oob_score=True, random_state=42).
# Return the oob_score_.

def oob_score(X_train, y_train) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Feature Selection using Tree Importance
# ---------------------------------------------------------------------------
# Fit RandomForestClassifier on (X_train, y_train).
# Select features where importance > threshold (default 0.1).
# Return (selected feature indices, X_train_reduced, X_test_reduced).

def feature_selection_tree(X_train, y_train, X_test, threshold: float = 0.1):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Partial Dependence Concept
# ---------------------------------------------------------------------------
# Compute a manual partial dependence for feature `feature_idx`:
#   - Create a grid of 20 evenly-spaced values for that feature
#     (between min and max of X[:, feature_idx]).
#   - For each grid value v, replace X[:, feature_idx] with v for all samples
#     and compute the mean predicted probability (class 1).
# Return (grid_values, mean_predictions) as arrays.

def partial_dependence(model, X: np.ndarray, feature_idx: int):
    pass  # TODO: implement


def main():
    print("=== Exercise 3.3: Tree-Based Methods ===\n")

    feat, thresh, gain = best_split(X_train, y_train) if best_split(X_train, y_train) else (None, None, None)
    print("TODO 1 — Best split: feature", feat, "threshold", thresh, "gain", gain)

    result2 = sklearn_decision_tree(X_train, y_train, X_test, y_test)
    print("TODO 2 — DT accuracy:", result2[1] if result2 else None)

    result3 = decision_tree_regression(X_reg, y_reg)
    print("TODO 3 — DT Regression RMSE:", result3[1] if result3 else None)

    fi4 = tree_feature_importance(X_train, y_train)
    print("TODO 4 — Tree feature importance:", fi4)

    depth_results = pruning_depth_effect(X_train, y_train, X_test, y_test)
    print("TODO 5 — Depth effect:", depth_results)

    result6 = random_forest(X_train, y_train, X_test, y_test)
    print("TODO 6 — RF accuracy:", result6[1] if result6 else None)

    fi7 = rf_feature_importance(X_train, y_train)
    print("TODO 7 — RF feature importance:", fi7)

    result8 = extra_trees(X_train, y_train, X_test, y_test)
    print("TODO 8 — Extra Trees accuracy:", result8[1] if result8 else None)

    result9 = gradient_boosting(X_train, y_train, X_test, y_test)
    print("TODO 9 — GB accuracy:", result9[1] if result9 else None)

    result10 = xgboost_classifier(X_train, y_train, X_test, y_test)
    print("TODO 10 — XGBoost accuracy:", result10[1] if result10 else None)

    result11 = lightgbm_classifier(X_train, y_train, X_test, y_test)
    print("TODO 11 — LightGBM accuracy:", result11[1] if result11 else None)

    dv = depth_vs_overfitting(X_train, y_train, X_test, y_test)
    print("TODO 12 — Depth vs overfitting:", dv)

    oob = oob_score(X_train, y_train)
    print("TODO 13 — OOB score:", oob)

    sel = feature_selection_tree(X_train, y_train, X_test)
    print("TODO 14 — Selected features:", sel[0] if sel else None)

    rf_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    grid, pdp = partial_dependence(rf_model, X_test, feature_idx=0) if partial_dependence else (None, None)
    print("TODO 15 — PDP grid (first 3):", grid[:3] if grid is not None else None)


if __name__ == "__main__":
    main()
