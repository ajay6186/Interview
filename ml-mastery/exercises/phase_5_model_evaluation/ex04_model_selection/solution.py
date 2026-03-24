# ============================================================
# Solution 5.4 — Model Selection
# ============================================================

import numpy as np
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.model_selection import cross_val_score, learning_curve, validation_curve
from scipy import stats
import time


def compare_models(X, y) -> dict:
    models = {
        "LogisticRegression": Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RandomForest":       RandomForestClassifier(n_estimators=100, random_state=42),
        "SVM_linear":         Pipeline([("sc", StandardScaler()), ("clf", SVC(kernel="linear"))]),
        "KNN_5":              Pipeline([("sc", StandardScaler()), ("clf", KNeighborsClassifier(n_neighbors=5))]),
        "DecisionTree":       DecisionTreeClassifier(random_state=42),
    }
    results = {}
    for name, model in models.items():
        scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
        results[name] = (round(scores.mean(), 4), round(scores.std(), 4))
    return results


def paired_ttest(scores_a: np.ndarray, scores_b: np.ndarray, name_a: str, name_b: str) -> tuple:
    t_stat, p_val = stats.ttest_rel(scores_a, scores_b)
    if p_val > 0.05:
        winner = "tie"
    else:
        winner = name_a if scores_a.mean() > scores_b.mean() else name_b
    return (round(float(t_stat), 4), round(float(p_val), 4), winner)


def wilcoxon_test(scores_a: np.ndarray, scores_b: np.ndarray, name_a: str, name_b: str) -> tuple:
    stat, p_val = stats.wilcoxon(scores_a, scores_b)
    if p_val > 0.05:
        winner = "tie"
    else:
        winner = name_a if scores_a.mean() > scores_b.mean() else name_b
    return (round(float(stat), 4), round(float(p_val), 4), winner)


def compute_aic(n_samples: int, n_params: int, rss: float) -> float:
    log_likelihood = -n_samples / 2 * np.log(rss / n_samples)
    aic = 2 * n_params - 2 * log_likelihood
    return round(float(aic), 4)


def compute_bic(n_samples: int, n_params: int, rss: float) -> float:
    log_likelihood = -n_samples / 2 * np.log(rss / n_samples)
    bic = n_params * np.log(n_samples) - 2 * log_likelihood
    return round(float(bic), 4)


def regularization_path(X, y) -> tuple:
    alphas = np.logspace(-3, 3, 20)
    train_scores, val_scores = [], []
    for alpha in alphas:
        model = Ridge(alpha=alpha)
        tr = cross_val_score(model, X, y, cv=5, scoring="r2")
        train_scores.append(round(float(tr.mean()), 4))
        val_scores.append(round(float(tr.mean()), 4))
    # Get both train and val separately
    train_s, val_s = [], []
    for alpha in alphas:
        model = Ridge(alpha=alpha)
        scores = cross_val_score(model, X, y, cv=5, scoring="r2", return_train_score=False)
        val_s.append(round(float(scores.mean()), 4))
    return (np.round(alphas, 6).tolist(), train_scores, val_s)


def bias_variance_polynomial(X, y) -> tuple:
    degrees = list(range(1, 11))
    train_s, val_s = [], []
    for d in degrees:
        pipe = Pipeline([
            ("poly", PolynomialFeatures(degree=d, include_bias=False)),
            ("scaler", StandardScaler()),
            ("model", Ridge(alpha=1.0)),
        ])
        scores = cross_val_score(pipe, X, y, cv=5, scoring="r2")
        # Approximate train score by fitting on full data
        pipe.fit(X, y)
        train_s.append(round(float(pipe.score(X, y)), 4))
        val_s.append(round(float(scores.mean()), 4))
    return (degrees, train_s, val_s)


def model_learning_curve(X, y) -> tuple:
    model = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    train_sizes, train_scores, val_scores = learning_curve(
        model, X, y, cv=5, train_sizes=np.linspace(0.1, 1.0, 10), scoring="accuracy"
    )
    return (
        train_sizes.tolist(),
        np.round(train_scores.mean(axis=1), 4).tolist(),
        np.round(val_scores.mean(axis=1), 4).tolist(),
    )


def model_validation_curve(X, y) -> tuple:
    model = DecisionTreeClassifier(random_state=42)
    depths = list(range(1, 11))
    train_scores, val_scores = validation_curve(
        model, X, y, param_name="max_depth", param_range=depths, cv=5, scoring="accuracy"
    )
    return (
        depths,
        np.round(train_scores.mean(axis=1), 4).tolist(),
        np.round(val_scores.mean(axis=1), 4).tolist(),
    )


def feature_importance_selection(X, y) -> list:
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X, y)
    importances = rf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1][:5]
    return [(int(i), round(float(importances[i]), 4)) for i in sorted_idx]


def measure_latency(X, y) -> dict:
    models = {
        "LogisticRegression": Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RandomForest":       RandomForestClassifier(n_estimators=100, random_state=42),
        "KNN_5":              Pipeline([("sc", StandardScaler()), ("clf", KNeighborsClassifier(n_neighbors=5))]),
    }
    latencies = {}
    X_test = X[:100]
    for name, model in models.items():
        model.fit(X, y)
        start = time.perf_counter()
        for _ in range(100):
            model.predict(X_test)
        elapsed_ms = (time.perf_counter() - start) / 100 * 1000
        latencies[name] = round(elapsed_ms, 2)
    return latencies


def occams_razor(model_a_score: float, model_b_score: float,
                 model_a_params: int, model_b_params: int,
                 name_a: str, name_b: str) -> str:
    if abs(model_a_score - model_b_score) <= 0.01:
        return name_a if model_a_params <= model_b_params else name_b
    return name_a if model_a_score > model_b_score else name_b


def model_selection_report(X, y) -> list:
    models = {
        "LogisticRegression": Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RandomForest":       RandomForestClassifier(n_estimators=100, random_state=42),
        "DecisionTree":       DecisionTreeClassifier(random_state=42),
    }
    results = []
    for name, model in models.items():
        score = cross_val_score(model, X, y, cv=5, scoring="accuracy").mean()
        results.append((name, round(float(score), 4)))
    results.sort(key=lambda x: -x[1])
    report = [(i + 1, name, score) for i, (name, score) in enumerate(results)]
    print("\n  --- Model Selection Report ---")
    for rank, name, score in report:
        print(f"  Rank {rank}: {name:<22} CV accuracy = {score:.4f}")
    return report


def selection_checklist() -> list:
    return [
        "1. Define the evaluation metric aligned with business goal.",
        "2. Establish a baseline (majority class, mean predictor).",
        "3. Use nested CV for unbiased generalization estimate.",
        "4. Compare models with statistical tests (t-test / Wilcoxon).",
        "5. Check model complexity vs interpretability tradeoff.",
        "6. Validate on a truly held-out test set (not used for selection).",
        "7. Verify robustness: different data splits, time periods, segments.",
    ]


def production_selection_framework() -> list:
    return [
        "Step 1: Offline evaluation — nested CV, multiple metrics, statistical tests.",
        "Step 2: Shadow deployment — run new model in parallel, compare outputs.",
        "Step 3: A/B test — split live traffic, measure business KPIs.",
        "Step 4: Canary release — gradually increase traffic to new model.",
        "Step 5: Monitor post-deployment — data drift, performance degradation, retrain triggers.",
    ]


def main():
    print("=== Solution 5.4: Model Selection ===\n")

    np.random.seed(42)
    X_cls, y_cls = make_classification(n_samples=300, n_features=10, random_state=42)
    X_reg, y_reg = make_regression(n_samples=200, n_features=5, noise=10, random_state=42)

    print("Result 1  - Compare models:")
    for name, (mean, std) in compare_models(X_cls, y_cls).items():
        print(f"    {name:<22} mean={mean:.4f} std={std:.4f}")

    scores_lr = cross_val_score(Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]), X_cls, y_cls, cv=5)
    scores_rf = cross_val_score(RandomForestClassifier(random_state=42), X_cls, y_cls, cv=5)
    print("Result 2  - Paired t-test LR vs RF:", paired_ttest(scores_lr, scores_rf, "LR", "RF"))
    print("Result 3  - Wilcoxon LR vs RF:", wilcoxon_test(scores_lr, scores_rf, "LR", "RF"))

    ridge = Ridge().fit(X_reg, y_reg)
    rss = float(np.sum((y_reg - ridge.predict(X_reg)) ** 2))
    print("Result 4  - AIC:", compute_aic(len(y_reg), X_reg.shape[1] + 1, rss))
    print("Result 5  - BIC:", compute_bic(len(y_reg), X_reg.shape[1] + 1, rss))

    alphas, tr, vl = regularization_path(X_reg, y_reg)
    print("Result 6  - Reg path (first 5 alphas, val R²):", list(zip(np.round(alphas[:5], 4), vl[:5])))

    X_reg1d = X_reg[:, :1]
    degs, bv_tr, bv_vl = bias_variance_polynomial(X_reg1d, y_reg)
    print("Result 7  - Poly degree | train R² | val R²:")
    for d, tr, vl in zip(degs, bv_tr, bv_vl):
        print(f"    degree={d} train={tr:.4f} val={vl:.4f}")

    ts, mtr, mvr = model_learning_curve(X_cls, y_cls)
    print("Result 8  - Learning curve:", list(zip(ts, mvr)))

    depths, dtr, dvl = model_validation_curve(X_cls, y_cls)
    print("Result 9  - Validation curve:")
    for d, tr, vl in zip(depths, dtr, dvl):
        print(f"    depth={d} train={tr:.4f} val={vl:.4f}")

    print("Result 10 - Feature importances (top 5):", feature_importance_selection(X_cls, y_cls))
    print("Result 11 - Latency (ms):", measure_latency(X_cls, y_cls))
    print("Result 12 - Occam's razor:", occams_razor(0.92, 0.921, 10000, 100, "RandomForest", "LogisticReg"))
    print("Result 13 - Model report:", model_selection_report(X_cls, y_cls))
    print("Result 14 - Checklist:")
    for item in selection_checklist():
        print(" ", item)
    print("Result 15 - Production framework:")
    for step in production_selection_framework():
        print(" ", step)


if __name__ == "__main__":
    main()
