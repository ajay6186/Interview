# ============================================================
# Solution 5.3 — Hyperparameter Tuning
# ============================================================

import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import (
    GridSearchCV, RandomizedSearchCV,
    validation_curve, learning_curve, cross_val_score, KFold
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from scipy import stats


def manual_grid_search(X, y) -> tuple:
    C_values = [0.01, 0.1, 1, 10, 100]
    kf = KFold(n_splits=3, shuffle=True, random_state=42)
    best_C, best_score = None, -np.inf
    for C in C_values:
        model = LogisticRegression(C=C, max_iter=1000)
        scores = cross_val_score(model, X, y, cv=kf, scoring="accuracy")
        if scores.mean() > best_score:
            best_score = scores.mean()
            best_C = C
    return (best_C, round(best_score, 4))


def sklearn_grid_search(X, y) -> tuple:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    gs = GridSearchCV(pipe, {"clf__C": [0.01, 0.1, 1, 10]}, cv=5, scoring="accuracy")
    gs.fit(X, y)
    return (gs.best_params_, round(gs.best_score_, 4))


def sklearn_random_search(X, y) -> tuple:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    param_dist = {"clf__C": stats.loguniform(1e-3, 1e3)}
    rs = RandomizedSearchCV(pipe, param_dist, n_iter=20, cv=5, random_state=42, scoring="accuracy")
    rs.fit(X, y)
    return (rs.best_params_, round(rs.best_score_, 4))


def grid_search_with_pipeline(X, y) -> tuple:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    gs = GridSearchCV(pipe, {"clf__C": [0.1, 1, 10]}, cv=5, scoring="accuracy")
    gs.fit(X, y)
    return (gs.best_params_, round(gs.best_score_, 4))


def random_search_with_distributions(X, y) -> dict:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=2000))])
    param_dist = {
        "clf__C": stats.loguniform(1e-3, 1e3),
        "clf__max_iter": stats.randint(100, 2000),
    }
    rs = RandomizedSearchCV(pipe, param_dist, n_iter=15, cv=5, random_state=42, scoring="accuracy")
    rs.fit(X, y)
    return rs.best_params_


def extract_best(gs: GridSearchCV) -> dict:
    return {
        "best_params": gs.best_params_,
        "best_score": round(gs.best_score_, 4),
        "best_index": int(gs.best_index_),
    }


def refit_best_model(X, y) -> float:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    gs = GridSearchCV(pipe, {"clf__C": [0.1, 1, 10]}, cv=5, refit=True)
    gs.fit(X, y)
    return round(float(gs.best_estimator_.score(X, y)), 4)


def validation_curve_analysis(X, y) -> tuple:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    param_range = np.logspace(-3, 3, 7)
    train_scores, val_scores = validation_curve(
        pipe, X, y, param_name="clf__C", param_range=param_range, cv=5, scoring="accuracy"
    )
    return (
        np.round(param_range, 6).tolist(),
        np.round(train_scores.mean(axis=1), 4).tolist(),
        np.round(val_scores.mean(axis=1), 4).tolist(),
    )


def learning_curve_tuning(X, y) -> tuple:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    train_sizes, train_scores, val_scores = learning_curve(
        pipe, X, y, cv=5, train_sizes=np.linspace(0.1, 1.0, 10), scoring="accuracy"
    )
    return (
        train_sizes.tolist(),
        np.round(train_scores.mean(axis=1), 4).tolist(),
        np.round(val_scores.mean(axis=1), 4).tolist(),
    )


def bayesian_optimization_concept() -> str:
    return (
        "Bayesian Optimization builds a probabilistic surrogate model (e.g., Gaussian Process or TPE) "
        "of the objective function. TPE (Tree-structured Parzen Estimator) models p(x|y<y*) and "
        "p(x|y>=y*) separately, then picks the next hyperparameter by maximizing EI = p(x|y<y*)/p(x|y>=y*)."
        " This is more efficient than random search because it focuses evaluations in promising regions."
    )


def optuna_concept() -> str:
    return (
        "Optuna pattern:\n"
        "  import optuna\n"
        "  def objective(trial):\n"
        "      C = trial.suggest_loguniform('C', 1e-3, 1e3)\n"
        "      model = LogisticRegression(C=C)\n"
        "      return cross_val_score(model, X, y, cv=5).mean()\n"
        "  study = optuna.create_study(direction='maximize')\n"
        "  study.optimize(objective, n_trials=50)\n"
        "  print(study.best_params)"
    )


def hyperparameter_importance(gs: GridSearchCV) -> dict:
    results = gs.cv_results_
    params = results["params"]
    scores = results["mean_test_score"]
    importance = {}
    for key in params[0].keys():
        values = np.array([p[key] for p in params])
        unique_vals = np.unique(values)
        group_means = [scores[values == v].mean() for v in unique_vals]
        importance[key] = round(float(np.var(group_means)), 6)
    return importance


def early_stopping_search(X, y) -> tuple:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    rng = np.random.RandomState(42)
    best_score = -np.inf
    no_improve = 0
    patience = 10
    n_evals = 0
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    for i in range(50):
        C = float(10 ** rng.uniform(-3, 3))
        pipe.set_params(clf__C=C)
        score = cross_val_score(pipe, X, y, cv=kf, scoring="accuracy").mean()
        n_evals += 1
        if score > best_score + 1e-4:
            best_score = score
            no_improve = 0
        else:
            no_improve += 1
        if no_improve >= patience:
            break
    return (round(best_score, 4), n_evals)


def cv_tuning_report(X, y) -> list:
    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    param_grid = {"clf__C": [0.001, 0.01, 0.1, 1, 10, 100]}
    gs = GridSearchCV(pipe, param_grid, cv=5, scoring="accuracy")
    gs.fit(X, y)
    results = gs.cv_results_
    ranked = sorted(
        zip(results["rank_test_score"], results["params"], results["mean_test_score"]),
        key=lambda x: x[0]
    )[:5]
    report = [(int(r), p, round(float(s), 4)) for r, p, s in ranked]
    for rank, params, score in report:
        print(f"  Rank {rank}: {params} → {score:.4f}")
    return report


def production_tuning_strategy() -> list:
    return [
        "1. Start with RandomizedSearchCV (broad search) before GridSearchCV (fine-grained).",
        "2. Use nested CV to get unbiased generalization estimates.",
        "3. Apply Bayesian optimization (Optuna/Hyperopt) for expensive models.",
        "4. Fix random seeds for reproducibility; log all experiments (MLflow/W&B).",
        "5. Apply early stopping and budget constraints; prefer simpler models if scores are tied.",
    ]


def main():
    print("=== Solution 5.3: Hyperparameter Tuning ===\n")

    np.random.seed(42)
    X, y = make_classification(n_samples=300, n_features=10, random_state=42)

    print("Result 1  - Manual grid search:", manual_grid_search(X, y))
    print("Result 2  - Sklearn GridSearchCV:", sklearn_grid_search(X, y))
    print("Result 3  - RandomizedSearchCV:", sklearn_random_search(X, y))
    print("Result 4  - Pipeline GridSearch:", grid_search_with_pipeline(X, y))
    print("Result 5  - Random search w/ distributions:", random_search_with_distributions(X, y))

    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    gs = GridSearchCV(pipe, {"clf__C": [0.1, 1, 10]}, cv=5)
    gs.fit(X, y)
    print("Result 6  - Extract best:", extract_best(gs))
    print("Result 7  - Refit accuracy:", refit_best_model(X, y))

    pr, mtr, mvr = validation_curve_analysis(X, y)
    print("Result 8  - Validation curve:")
    for c, tr, vl in zip(pr, mtr, mvr):
        print(f"    C={c:.4g} → train={tr:.4f}, val={vl:.4f}")

    ts, mtr2, mvr2 = learning_curve_tuning(X, y)
    print("Result 9  - Learning curve train sizes:", ts)

    print("Result 10 - Bayesian opt concept:\n ", bayesian_optimization_concept())
    print("Result 11 - Optuna concept:\n", optuna_concept())
    print("Result 12 - HP importance:", hyperparameter_importance(gs))
    print("Result 13 - Early stopping search:", early_stopping_search(X, y))
    print("Result 14 - Tuning report (top 5):")
    cv_tuning_report(X, y)
    print("Result 15 - Production strategy:")
    for line in production_tuning_strategy():
        print(" ", line)


if __name__ == "__main__":
    main()
