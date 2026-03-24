# ============================================================
# Solution 5.1 — Cross-Validation
# ============================================================

import numpy as np
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import (
    KFold, StratifiedKFold, LeaveOneOut, cross_val_score,
    cross_val_predict, TimeSeriesSplit, GroupKFold,
    RepeatedKFold, cross_validate, learning_curve,
    GridSearchCV
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from scipy import stats


def kfold_from_scratch(n_samples: int, k: int) -> list:
    indices = np.arange(n_samples)
    fold_size = n_samples // k
    splits = []
    for i in range(k):
        val_start = i * fold_size
        val_end = val_start + fold_size if i < k - 1 else n_samples
        val_idx = indices[val_start:val_end]
        train_idx = np.concatenate([indices[:val_start], indices[val_end:]])
        splits.append((train_idx.tolist(), val_idx.tolist()))
    return splits


def sklearn_kfold(X, y) -> list:
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    return [(len(tr), len(val)) for tr, val in kf.split(X, y)]


def stratified_kfold(X, y) -> list:
    skf = StratifiedKFold(n_splits=5)
    ratios = []
    for _, val_idx in skf.split(X, y):
        ratio = round(y[val_idx].mean(), 3)
        ratios.append(ratio)
    return ratios


def leave_one_out_cv(X, y) -> int:
    loo = LeaveOneOut()
    return loo.get_n_splits(X)


def cv_score_accuracy(X, y) -> tuple:
    model = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    return (round(scores.mean(), 4), round(scores.std(), 4))


def cv_multiple_metrics(X, y) -> dict:
    model = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    results = cross_validate(model, X, y, cv=5, scoring=["accuracy", "f1", "roc_auc"])
    return {
        "accuracy": round(results["test_accuracy"].mean(), 4),
        "f1": round(results["test_f1"].mean(), 4),
        "roc_auc": round(results["test_roc_auc"].mean(), 4),
    }


def cv_predictions(X, y) -> np.ndarray:
    model = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    return cross_val_predict(model, X, y, cv=5)


def time_series_cv(X, y) -> list:
    tscv = TimeSeriesSplit(n_splits=5)
    return [(len(tr), len(val)) for tr, val in tscv.split(X)]


def group_kfold_splits(X, y, groups) -> list:
    gkf = GroupKFold(n_splits=5)
    result = []
    for tr, te in gkf.split(X, y, groups):
        result.append((sorted(set(groups[tr])), sorted(set(groups[te]))))
    return result


def repeated_kfold(X, y) -> tuple:
    model = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    rkf = RepeatedKFold(n_splits=5, n_repeats=3, random_state=42)
    scores = cross_val_score(model, X, y, cv=rkf, scoring="accuracy")
    return (round(scores.mean(), 4), round(scores.std(), 4))


def nested_cv(X, y) -> list:
    outer_cv = KFold(n_splits=5, shuffle=True, random_state=42)
    inner_cv = KFold(n_splits=3, shuffle=True, random_state=42)
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    param_grid = {"clf__C": [0.1, 1, 10]}
    outer_scores = []
    for tr, te in outer_cv.split(X, y):
        gs = GridSearchCV(pipe, param_grid, cv=inner_cv, scoring="accuracy")
        gs.fit(X[tr], y[tr])
        outer_scores.append(round(gs.score(X[te], y[te]), 4))
    return outer_scores


def learning_curve_analysis(X, y) -> tuple:
    model = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    train_sizes, train_scores, val_scores = learning_curve(
        model, X, y, cv=5, train_sizes=np.linspace(0.1, 1.0, 10), scoring="accuracy"
    )
    return (
        train_sizes.tolist(),
        np.round(train_scores.mean(axis=1), 4).tolist(),
        np.round(val_scores.mean(axis=1), 4).tolist(),
    )


def detect_overfitting(train_scores: np.ndarray, val_scores: np.ndarray) -> bool:
    gap = train_scores.mean() - val_scores.mean()
    return bool(gap > 0.1)


def compare_cv_scores(scores_a: np.ndarray, scores_b: np.ndarray) -> tuple:
    t_stat, p_val = stats.ttest_rel(scores_a, scores_b)
    return (round(float(t_stat), 4), round(float(p_val), 4))


def cv_imbalanced(X, y) -> float:
    model = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000, class_weight="balanced"))])
    skf = StratifiedKFold(n_splits=5)
    scores = cross_val_score(model, X, y, cv=skf, scoring="f1")
    return round(scores.mean(), 4)


def main():
    print("=== Solution 5.1: Cross-Validation ===\n")

    np.random.seed(42)
    X_cls, y_cls = make_classification(n_samples=200, n_features=10, random_state=42)

    print("Result 1  - k-fold from scratch (n=20, k=5) — first split sizes:",
          [(len(tr), len(val)) for tr, val in kfold_from_scratch(20, 5)])
    print("Result 2  - sklearn KFold splits:", sklearn_kfold(X_cls, y_cls))
    print("Result 3  - StratifiedKFold class ratios:", stratified_kfold(X_cls, y_cls))
    print("Result 4  - LOO splits:", leave_one_out_cv(X_cls, y_cls))
    print("Result 5  - CV accuracy (mean, std):", cv_score_accuracy(X_cls, y_cls))
    print("Result 6  - CV multiple metrics:", cv_multiple_metrics(X_cls, y_cls))
    preds = cv_predictions(X_cls, y_cls)
    print("Result 7  - CV predictions shape:", preds.shape, "| accuracy:", round((preds == y_cls).mean(), 4))
    print("Result 8  - Time series splits:", time_series_cv(X_cls, y_cls))

    groups = np.repeat(np.arange(20), 10)
    print("Result 9  - GroupKFold test groups per split:",
          [te for _, te in group_kfold_splits(X_cls, y_cls, groups)])
    print("Result 10 - Repeated KFold (mean, std):", repeated_kfold(X_cls, y_cls))
    print("Result 11 - Nested CV scores:", nested_cv(X_cls, y_cls))

    ts, mtr, mvr = learning_curve_analysis(X_cls, y_cls)
    print("Result 12 - Learning curve train sizes:", ts)
    print("           mean train scores:", mtr)
    print("           mean val   scores:", mvr)
    print("Result 13 - Detect overfitting (gap=0.23):", detect_overfitting(
        np.array([0.95, 0.96, 0.94]), np.array([0.72, 0.73, 0.71])
    ))
    print("Result 14 - Compare CV scores (t, p):", compare_cv_scores(
        np.array([0.8, 0.82, 0.79, 0.81, 0.83]),
        np.array([0.75, 0.76, 0.74, 0.77, 0.75])
    ))

    X_imb, y_imb = make_classification(n_samples=200, weights=[0.9, 0.1], random_state=42)
    print("Result 15 - Imbalanced CV F1:", cv_imbalanced(X_imb, y_imb))


if __name__ == "__main__":
    main()
