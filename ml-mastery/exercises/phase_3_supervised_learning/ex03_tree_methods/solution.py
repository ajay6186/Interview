# ============================================================
# Solution 3.3 — Tree-Based Methods
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
# Solution 1: Best Split from Scratch
# ---------------------------------------------------------------------------

def _gini(y: np.ndarray) -> float:
    if len(y) == 0:
        return 0.0
    classes, counts = np.unique(y, return_counts=True)
    p = counts / len(y)
    return float(1 - np.sum(p ** 2))


def best_split(X: np.ndarray, y: np.ndarray):
    best_gain = -np.inf
    best_feat = None
    best_thresh = None
    parent_gini = _gini(y)
    n = len(y)

    for feat in range(X.shape[1]):
        thresholds = np.unique(X[:, feat])
        for t in thresholds:
            left = y[X[:, feat] <= t]
            right = y[X[:, feat] > t]
            if len(left) == 0 or len(right) == 0:
                continue
            weighted = (len(left) / n) * _gini(left) + (len(right) / n) * _gini(right)
            gain = parent_gini - weighted
            if gain > best_gain:
                best_gain = gain
                best_feat = feat
                best_thresh = t

    return best_feat, best_thresh, round(best_gain, 6)


# ---------------------------------------------------------------------------
# Solution 2: sklearn DecisionTreeClassifier
# ---------------------------------------------------------------------------

def sklearn_decision_tree(X_train, y_train, X_test, y_test):
    model = DecisionTreeClassifier(max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 3: Decision Tree Regression
# ---------------------------------------------------------------------------

def decision_tree_regression(X: np.ndarray, y: np.ndarray):
    model = DecisionTreeRegressor(max_depth=5, random_state=42)
    model.fit(X, y)
    preds = model.predict(X)
    rmse = float(np.sqrt(np.mean((y - preds) ** 2)))
    return model, rmse


# ---------------------------------------------------------------------------
# Solution 4: Feature Importance from Tree
# ---------------------------------------------------------------------------

def tree_feature_importance(X_train, y_train) -> list:
    model = DecisionTreeClassifier(random_state=42)
    model.fit(X_train, y_train)
    pairs = list(enumerate(model.feature_importances_))
    return sorted(pairs, key=lambda t: t[1], reverse=True)


# ---------------------------------------------------------------------------
# Solution 5: Pruning — max_depth Effect
# ---------------------------------------------------------------------------

def pruning_depth_effect(X_train, y_train, X_test, y_test) -> dict:
    results = {}
    for depth in [1, 2, 3, 5, 10, None]:
        model = DecisionTreeClassifier(max_depth=depth, random_state=42)
        model.fit(X_train, y_train)
        results[depth] = (
            round(model.score(X_train, y_train), 4),
            round(model.score(X_test, y_test), 4),
        )
    return results


# ---------------------------------------------------------------------------
# Solution 6: Random Forest
# ---------------------------------------------------------------------------

def random_forest(X_train, y_train, X_test, y_test):
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 7: RF Feature Importance
# ---------------------------------------------------------------------------

def rf_feature_importance(X_train, y_train) -> list:
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    pairs = list(enumerate(model.feature_importances_))
    return sorted(pairs, key=lambda t: t[1], reverse=True)


# ---------------------------------------------------------------------------
# Solution 8: Extra Trees
# ---------------------------------------------------------------------------

def extra_trees(X_train, y_train, X_test, y_test):
    model = ExtraTreesClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 9: Gradient Boosting
# ---------------------------------------------------------------------------

def gradient_boosting(X_train, y_train, X_test, y_test):
    model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


# ---------------------------------------------------------------------------
# Solution 10: XGBoost
# ---------------------------------------------------------------------------

def xgboost_classifier(X_train, y_train, X_test, y_test):
    try:
        from xgboost import XGBClassifier
        model = XGBClassifier(n_estimators=100, random_state=42,
                              use_label_encoder=False, eval_metric='logloss',
                              verbosity=0)
        model.fit(X_train, y_train)
        return model, model.score(X_test, y_test)
    except ImportError:
        print("XGBoost not installed. Run: pip install xgboost")
        return None


# ---------------------------------------------------------------------------
# Solution 11: LightGBM
# ---------------------------------------------------------------------------

def lightgbm_classifier(X_train, y_train, X_test, y_test):
    try:
        from lightgbm import LGBMClassifier
        model = LGBMClassifier(n_estimators=100, random_state=42, verbose=-1)
        model.fit(X_train, y_train)
        return model, model.score(X_test, y_test)
    except ImportError:
        print("LightGBM not installed. Run: pip install lightgbm")
        return None


# ---------------------------------------------------------------------------
# Solution 12: Tree Depth vs Overfitting
# ---------------------------------------------------------------------------

def depth_vs_overfitting(X_train, y_train, X_test, y_test) -> dict:
    results = {}
    for depth in [1, 2, 3, 5, 10, 20]:
        model = DecisionTreeClassifier(max_depth=depth, random_state=42)
        model.fit(X_train, y_train)
        results[depth] = {
            'train': round(model.score(X_train, y_train), 4),
            'test': round(model.score(X_test, y_test), 4),
        }
    return results


# ---------------------------------------------------------------------------
# Solution 13: OOB Score
# ---------------------------------------------------------------------------

def oob_score(X_train, y_train) -> float:
    model = RandomForestClassifier(n_estimators=100, oob_score=True, random_state=42)
    model.fit(X_train, y_train)
    return float(model.oob_score_)


# ---------------------------------------------------------------------------
# Solution 14: Feature Selection Using Tree
# ---------------------------------------------------------------------------

def feature_selection_tree(X_train, y_train, X_test, threshold: float = 0.1):
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    importances = model.feature_importances_
    selected = np.where(importances > threshold)[0]
    return selected, X_train[:, selected], X_test[:, selected]


# ---------------------------------------------------------------------------
# Solution 15: Partial Dependence (manual)
# ---------------------------------------------------------------------------

def partial_dependence(model, X: np.ndarray, feature_idx: int):
    grid = np.linspace(X[:, feature_idx].min(), X[:, feature_idx].max(), 20)
    mean_preds = []
    X_copy = X.copy()
    for v in grid:
        X_copy[:, feature_idx] = v
        if hasattr(model, 'predict_proba'):
            p = model.predict_proba(X_copy)[:, 1].mean()
        else:
            p = model.predict(X_copy).mean()
        mean_preds.append(p)
    return grid, np.array(mean_preds)


def main():
    print("=== Solution 3.3: Tree-Based Methods ===\n")

    feat, thresh, gain = best_split(X_train, y_train)
    print("Result 1 — Best split: feature", feat, "| threshold", round(thresh, 4),
          "| gain", gain)

    _, acc2 = sklearn_decision_tree(X_train, y_train, X_test, y_test)
    print("Result 2 — DT accuracy:", round(acc2, 4))

    _, rmse3 = decision_tree_regression(X_reg, y_reg)
    print("Result 3 — DT Regression RMSE:", round(rmse3, 4))

    fi4 = tree_feature_importance(X_train, y_train)
    print("Result 4 — Tree feature importance:", [(i, round(v, 4)) for i, v in fi4])

    depth_results = pruning_depth_effect(X_train, y_train, X_test, y_test)
    print("Result 5 — Depth effect:")
    for d, (tr, te) in depth_results.items():
        print(f"   depth={d}: train={tr}, test={te}")

    _, acc6 = random_forest(X_train, y_train, X_test, y_test)
    print("Result 6 — RF accuracy:", round(acc6, 4))

    fi7 = rf_feature_importance(X_train, y_train)
    print("Result 7 — RF feature importance:", [(i, round(v, 4)) for i, v in fi7])

    _, acc8 = extra_trees(X_train, y_train, X_test, y_test)
    print("Result 8 — Extra Trees accuracy:", round(acc8, 4))

    _, acc9 = gradient_boosting(X_train, y_train, X_test, y_test)
    print("Result 9 — GB accuracy:", round(acc9, 4))

    result10 = xgboost_classifier(X_train, y_train, X_test, y_test)
    print("Result 10 — XGBoost accuracy:", round(result10[1], 4) if result10 else "N/A")

    result11 = lightgbm_classifier(X_train, y_train, X_test, y_test)
    print("Result 11 — LightGBM accuracy:", round(result11[1], 4) if result11 else "N/A")

    dv = depth_vs_overfitting(X_train, y_train, X_test, y_test)
    print("Result 12 — Depth vs overfitting:")
    for d, v in dv.items():
        print(f"   depth={d}: {v}")

    oob = oob_score(X_train, y_train)
    print("Result 13 — OOB score:", round(oob, 4))

    selected, _, _ = feature_selection_tree(X_train, y_train, X_test)
    print("Result 14 — Selected features:", selected)

    rf_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    grid, pdp = partial_dependence(rf_model, X_test, feature_idx=0)
    print("Result 15 — PDP grid (first 3):", np.round(grid[:3], 4))
    print("           PDP mean preds (first 3):", np.round(pdp[:3], 4))


if __name__ == "__main__":
    main()
