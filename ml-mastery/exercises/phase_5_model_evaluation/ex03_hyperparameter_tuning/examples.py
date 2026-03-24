# ============================================================
# Examples 5.3 — Hyperparameter Tuning (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression, Ridge, SGDClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import (
    GridSearchCV, RandomizedSearchCV, cross_val_score,
    validation_curve, learning_curve, KFold
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import make_scorer, f1_score, accuracy_score
from scipy import stats
from scipy.stats import uniform, randint, loguniform

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Manual grid search with nested loops"""
    X, y = make_classification(n_samples=200, random_state=42)
    C_values = [0.01, 0.1, 1, 10]
    best_score, best_C = 0, None
    for C in C_values:
        scores = cross_val_score(LogisticRegression(C=C, max_iter=1000),
                                 X, y, cv=3, scoring='accuracy')
        if scores.mean() > best_score:
            best_score, best_C = scores.mean(), C
    print(f"Ex01 — Manual grid search: best C={best_C}, score={best_score:.4f}")

def ex02():
    """sklearn GridSearchCV"""
    X, y = make_classification(n_samples=200, random_state=42)
    param_grid = {'C': [0.01, 0.1, 1, 10], 'max_iter': [1000]}
    gs = GridSearchCV(LogisticRegression(), param_grid, cv=5, scoring='accuracy')
    gs.fit(X, y)
    print(f"Ex02 — GridSearchCV: best_params={gs.best_params_}, best_score={gs.best_score_:.4f}")

def ex03():
    """Accessing best_params_ and best_score_"""
    X, y = make_classification(n_samples=200, random_state=42)
    gs = GridSearchCV(LogisticRegression(max_iter=1000),
                      {'C': [0.1, 1, 10]}, cv=5)
    gs.fit(X, y)
    print(f"Ex03 — best_params_={gs.best_params_}")
    print(f"       best_score_={gs.best_score_:.4f}")
    print(f"       best_estimator_={gs.best_estimator_}")

def ex04():
    """cv_results_ as DataFrame"""
    X, y = make_classification(n_samples=200, random_state=42)
    gs = GridSearchCV(LogisticRegression(max_iter=1000),
                      {'C': [0.01, 0.1, 1, 10]}, cv=3)
    gs.fit(X, y)
    df = pd.DataFrame(gs.cv_results_)[['param_C', 'mean_test_score', 'std_test_score', 'rank_test_score']]
    print(f"Ex04 — cv_results_ DataFrame:\n{df.to_string()}")

def ex05():
    """RandomizedSearchCV with n_iter"""
    X, y = make_classification(n_samples=200, random_state=42)
    param_dist = {'C': loguniform(0.001, 100), 'max_iter': [1000]}
    rs = RandomizedSearchCV(LogisticRegression(), param_dist, n_iter=10,
                            cv=5, scoring='accuracy', random_state=42)
    rs.fit(X, y)
    print(f"Ex05 — RandomizedSearchCV: best_params={rs.best_params_}, score={rs.best_score_:.4f}")

def ex06():
    """param_distributions with scipy.stats distributions"""
    X, y = make_classification(n_samples=200, random_state=42)
    param_dist = {
        'C': loguniform(1e-4, 1e4),
        'tol': uniform(1e-5, 1e-2),
    }
    rs = RandomizedSearchCV(LogisticRegression(max_iter=1000),
                            param_dist, n_iter=15, cv=3, random_state=42)
    rs.fit(X, y)
    print(f"Ex06 — scipy.stats param_dist: C={rs.best_params_['C']:.6f}, "
          f"tol={rs.best_params_['tol']:.6f}, score={rs.best_score_:.4f}")

def ex07():
    """Fitting GridSearchCV"""
    X, y = make_classification(n_samples=200, random_state=42)
    gs = GridSearchCV(RandomForestClassifier(random_state=42),
                      {'n_estimators': [10, 20, 50], 'max_depth': [3, 5, None]},
                      cv=3, scoring='accuracy', n_jobs=-1)
    gs.fit(X, y)
    print(f"Ex07 — RF GridSearchCV fit: best={gs.best_params_}, score={gs.best_score_:.4f}")

def ex08():
    """Predict with best estimator"""
    X, y = make_classification(n_samples=200, random_state=42)
    gs = GridSearchCV(LogisticRegression(max_iter=1000),
                      {'C': [0.1, 1, 10]}, cv=3)
    gs.fit(X[:150], y[:150])
    preds = gs.predict(X[150:])
    acc = accuracy_score(y[150:], preds)
    print(f"Ex08 — predict with best estimator: test acc={acc:.4f}")

def ex09():
    """refit=True behavior (default) — best estimator on full data"""
    X, y = make_classification(n_samples=200, random_state=42)
    gs_refit = GridSearchCV(LogisticRegression(max_iter=1000),
                            {'C': [0.1, 1, 10]}, cv=3, refit=True)
    gs_no_refit = GridSearchCV(LogisticRegression(max_iter=1000),
                               {'C': [0.1, 1, 10]}, cv=3, refit=False)
    gs_refit.fit(X, y)
    gs_no_refit.fit(X, y)
    has_estimator = hasattr(gs_refit, 'best_estimator_')
    has_no_estimator = not hasattr(gs_no_refit, 'best_estimator_')
    print(f"Ex09 — refit=True has best_estimator: {has_estimator}")
    print(f"       refit=False lacks best_estimator: {has_no_estimator}")

def ex10():
    """scoring parameter options"""
    X, y = make_classification(n_samples=200, random_state=42)
    for scoring in ['accuracy', 'f1', 'roc_auc']:
        gs = GridSearchCV(LogisticRegression(max_iter=1000),
                          {'C': [0.1, 1, 10]}, cv=3, scoring=scoring)
        gs.fit(X, y)
        print(f"Ex10 — scoring='{scoring}': best_score={gs.best_score_:.4f}")

def ex11():
    """return_train_score=True"""
    X, y = make_classification(n_samples=200, random_state=42)
    gs = GridSearchCV(LogisticRegression(max_iter=1000),
                      {'C': [0.1, 1, 10]}, cv=3,
                      return_train_score=True, scoring='accuracy')
    gs.fit(X, y)
    df = pd.DataFrame(gs.cv_results_)[['param_C', 'mean_train_score', 'mean_test_score']]
    print(f"Ex11 — train vs test scores:\n{df.to_string()}")

def ex12():
    """Multiple scoring metrics with GridSearchCV"""
    X, y = make_classification(n_samples=200, random_state=42)
    scoring = {'accuracy': 'accuracy', 'f1': 'f1', 'roc_auc': 'roc_auc'}
    gs = GridSearchCV(LogisticRegression(max_iter=1000),
                      {'C': [0.1, 1, 10]}, cv=3,
                      scoring=scoring, refit='f1')
    gs.fit(X, y)
    df = pd.DataFrame(gs.cv_results_)[['param_C', 'mean_test_accuracy', 'mean_test_f1', 'mean_test_roc_auc']]
    print(f"Ex12 — Multiple scoring metrics:\n{df.to_string()}")

def ex13():
    """Parallel jobs (n_jobs=-1)"""
    X, y = make_classification(n_samples=300, random_state=42)
    gs = GridSearchCV(RandomForestClassifier(random_state=42),
                      {'n_estimators': [10, 20, 50], 'max_depth': [3, 5, None]},
                      cv=3, n_jobs=-1, scoring='accuracy')
    gs.fit(X, y)
    n_fits = len(gs.cv_results_['mean_test_score'])
    print(f"Ex13 — n_jobs=-1: {n_fits} fits completed, best={gs.best_params_}, score={gs.best_score_:.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """GridSearchCV with Pipeline"""
    X, y = make_classification(n_samples=200, random_state=42)
    pipe = Pipeline([('scaler', StandardScaler()), ('clf', LogisticRegression(max_iter=1000))])
    param_grid = {'clf__C': [0.01, 0.1, 1, 10]}
    gs = GridSearchCV(pipe, param_grid, cv=5, scoring='accuracy')
    gs.fit(X, y)
    print(f"Ex14 — GridSearchCV + Pipeline: best_params={gs.best_params_}, score={gs.best_score_:.4f}")

def ex15():
    """param_grid for Pipeline steps"""
    X, y = make_classification(n_samples=200, random_state=42)
    pipe = Pipeline([('scaler', StandardScaler()), ('clf', LogisticRegression(max_iter=1000))])
    param_grid = [
        {'scaler': [StandardScaler()], 'clf__C': [0.1, 1, 10]},
        {'scaler': ['passthrough'], 'clf__C': [0.1, 1, 10]},
    ]
    gs = GridSearchCV(pipe, param_grid, cv=3, scoring='accuracy')
    gs.fit(X, y)
    print(f"Ex15 — Pipeline param_grid (scaler options): best={gs.best_params_}, score={gs.best_score_:.4f}")

def ex16():
    """RandomizedSearchCV with n_iter efficiency"""
    X, y = make_classification(n_samples=300, random_state=42)
    param_dist = {
        'n_estimators': randint(10, 200),
        'max_depth': [3, 5, 7, None],
        'min_samples_split': randint(2, 20),
        'max_features': ['sqrt', 'log2', None],
    }
    rs = RandomizedSearchCV(RandomForestClassifier(random_state=42),
                            param_dist, n_iter=20, cv=3,
                            scoring='accuracy', random_state=42, n_jobs=-1)
    rs.fit(X, y)
    print(f"Ex16 — RandomizedSearchCV n_iter=20: best={rs.best_params_}, score={rs.best_score_:.4f}")

def ex17():
    """HalvingGridSearchCV (successive halving)"""
    try:
        from sklearn.model_selection import HalvingGridSearchCV
        X, y = make_classification(n_samples=500, random_state=42)
        param_grid = {'n_estimators': [10, 20, 50, 100],
                      'max_depth': [3, 5, 7, None]}
        halving_gs = HalvingGridSearchCV(RandomForestClassifier(random_state=42),
                                          param_grid, cv=3, factor=2, random_state=42)
        halving_gs.fit(X, y)
        print(f"Ex17 — HalvingGridSearchCV: best={halving_gs.best_params_}, "
              f"score={halving_gs.best_score_:.4f}")
    except ImportError:
        print("Ex17 — HalvingGridSearchCV: requires sklearn >= 0.24")

def ex18():
    """HalvingRandomSearchCV"""
    try:
        from sklearn.model_selection import HalvingRandomSearchCV
        X, y = make_classification(n_samples=500, random_state=42)
        param_dist = {'n_estimators': randint(10, 200), 'max_depth': randint(3, 15)}
        halving_rs = HalvingRandomSearchCV(RandomForestClassifier(random_state=42),
                                            param_dist, n_candidates=50, cv=3,
                                            factor=3, random_state=42)
        halving_rs.fit(X, y)
        print(f"Ex18 — HalvingRandomSearchCV: best={halving_rs.best_params_}, "
              f"score={halving_rs.best_score_:.4f}")
    except ImportError:
        print("Ex18 — HalvingRandomSearchCV: requires sklearn >= 0.24")

def ex19():
    """Validation curve: vary alpha in Ridge"""
    X, y = make_regression(n_samples=300, noise=20, random_state=42)
    alphas = np.logspace(-3, 3, 7)
    tr_s, va_s = validation_curve(Ridge(), X, y, param_name='alpha',
                                   param_range=alphas, cv=5, scoring='r2')
    best_alpha = alphas[np.argmax(va_s.mean(axis=1))]
    print(f"Ex19 — Validation curve Ridge: best alpha={best_alpha:.4f}, "
          f"best val R²={va_s.mean(axis=1).max():.4f}")

def ex20():
    """Learning curve: vary n_samples"""
    X, y = make_classification(n_samples=500, random_state=42)
    sizes, tr_s, va_s = learning_curve(LogisticRegression(max_iter=1000),
                                        X, y, cv=5,
                                        train_sizes=np.linspace(0.1, 1.0, 6),
                                        scoring='accuracy')
    print("Ex20 — Learning curve (n_samples vs accuracy):")
    for sz, tr, va in zip(sizes, tr_s.mean(axis=1), va_s.mean(axis=1)):
        print(f"       n={sz:3d}: train={tr:.3f}, val={va:.3f}")

def ex21():
    """Early stopping in hyperparameter search (sklearn SGDClassifier)"""
    X, y = make_classification(n_samples=300, random_state=42)
    param_grid = {'alpha': [0.0001, 0.001, 0.01, 0.1],
                  'max_iter': [50, 100, 200]}
    gs = GridSearchCV(SGDClassifier(early_stopping=True, validation_fraction=0.1,
                                     n_iter_no_change=5, random_state=42),
                      param_grid, cv=3, scoring='accuracy')
    gs.fit(X, y)
    print(f"Ex21 — Early stopping SGD: best={gs.best_params_}, score={gs.best_score_:.4f}")

def ex22():
    """Custom scorer with make_scorer"""
    def weighted_accuracy(y_true, y_pred, weight_fp=2.0):
        tp = np.sum((y_pred == 1) & (y_true == 1))
        tn = np.sum((y_pred == 0) & (y_true == 0))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        fn = np.sum((y_pred == 0) & (y_true == 1))
        return (tp + tn) / (tp + tn + weight_fp * fp + fn + 1e-10)

    custom_scorer = make_scorer(weighted_accuracy, weight_fp=2.0)
    X, y = make_classification(n_samples=200, random_state=42)
    gs = GridSearchCV(LogisticRegression(max_iter=1000),
                      {'C': [0.1, 1, 10]}, cv=3, scoring=custom_scorer)
    gs.fit(X, y)
    print(f"Ex22 — Custom scorer (weighted acc): best C={gs.best_params_['C']}, score={gs.best_score_:.4f}")

def ex23():
    """Warm starting for iterative models (Ridge path)"""
    X, y = make_regression(n_samples=300, noise=20, random_state=42)
    alphas = np.logspace(2, -3, 10)
    coefs = []
    for alpha in alphas:
        ridge = Ridge(alpha=alpha)
        ridge.fit(X, y)
        coefs.append(np.linalg.norm(ridge.coef_))
    print("Ex23 — Warm starting Ridge path (coef norm vs alpha):")
    for alpha, coef_norm in zip(alphas[::3], coefs[::3]):
        print(f"       alpha={alpha:.4f}: coef_norm={coef_norm:.4f}")

def ex24():
    """Hyperparameter importance via CV score variance"""
    X, y = make_classification(n_samples=300, random_state=42)
    param_grid = {'n_estimators': [10, 20, 50, 100],
                  'max_depth': [3, 5, 7, None],
                  'min_samples_split': [2, 5, 10]}
    gs = GridSearchCV(RandomForestClassifier(random_state=42),
                      param_grid, cv=3, scoring='accuracy')
    gs.fit(X, y)
    df = pd.DataFrame(gs.cv_results_)
    # Compute variance contribution of each param
    for param in ['param_n_estimators', 'param_max_depth', 'param_min_samples_split']:
        var = df.groupby(param)['mean_test_score'].mean().var()
        print(f"Ex24 — HP importance: {param}={var:.6f}")

def ex25():
    """Bayesian optimization concept (print description)"""
    print("Ex25 — Bayesian Optimization concept:")
    steps = [
        "1. Start with a prior over the objective function f(hyperparams)",
        "2. Evaluate f at a few initial random points",
        "3. Fit a surrogate model (Gaussian Process) to observed points",
        "4. Use acquisition function (EI, UCB) to select next HP to evaluate",
        "5. Update surrogate with new observation",
        "6. Repeat until budget exhausted — pick best observed HP",
        "Key advantage: fewer evaluations than grid/random search",
    ]
    for s in steps:
        print(f"       {s}")

def ex26():
    """Optuna concept (print design)"""
    print("Ex26 — Optuna (TPE-based hyperparameter optimization) concept:")
    design = {
        "Engine":      "Tree Parzen Estimator (TPE) — models p(x|good) and p(x|bad)",
        "API":         "study = optuna.create_study(); study.optimize(objective, n_trials=100)",
        "Pruning":     "Prune unpromising trials early (MedianPruner, PercentilePruner)",
        "Parallelism": "Supports distributed tuning via storage backend (RDB, Redis)",
        "Integration": "sklearn, PyTorch, XGBoost, LightGBM callbacks",
        "Best params": "study.best_params, study.best_value",
    }
    for k, v in design.items():
        print(f"       {k}: {v}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """HyperparamTuner class wrapping GridSearch + RandomSearch"""
    class HyperparamTuner:
        def __init__(self, estimator, param_grid, param_dist=None, cv=5):
            self.estimator = estimator
            self.param_grid = param_grid
            self.param_dist = param_dist or param_grid
            self.cv = cv
            self.grid_result_ = None
            self.random_result_ = None

        def grid_search(self, X, y):
            gs = GridSearchCV(self.estimator, self.param_grid,
                              cv=self.cv, scoring='accuracy')
            gs.fit(X, y)
            self.grid_result_ = gs
            return gs.best_params_, gs.best_score_

        def random_search(self, X, y, n_iter=20):
            rs = RandomizedSearchCV(self.estimator, self.param_dist,
                                    n_iter=n_iter, cv=self.cv,
                                    scoring='accuracy', random_state=42)
            rs.fit(X, y)
            self.random_result_ = rs
            return rs.best_params_, rs.best_score_

        def compare(self):
            g = self.grid_result_.best_score_
            r = self.random_result_.best_score_
            return {'grid': round(g, 4), 'random': round(r, 4), 'winner': 'grid' if g > r else 'random'}

    X, y = make_classification(n_samples=300, random_state=42)
    param_grid = {'n_estimators': [10, 20, 50], 'max_depth': [3, 5, None]}
    param_dist = {'n_estimators': randint(5, 100), 'max_depth': [3, 5, 7, None]}
    tuner = HyperparamTuner(RandomForestClassifier(random_state=42), param_grid, param_dist)
    gp, gs_score = tuner.grid_search(X, y)
    rp, rs_score = tuner.random_search(X, y)
    print(f"Ex27 — HyperparamTuner: grid={gs_score:.4f}, random={rs_score:.4f}, "
          f"compare={tuner.compare()}")

def ex28():
    """BayesianTuner class (simple GP-inspired approach)"""
    class BayesianTuner:
        """Simplified Bayesian-style tuner using random sampling + exploitation."""
        def __init__(self, estimator, param_ranges, n_init=5, n_iter=15, cv=3):
            self.estimator = estimator
            self.param_ranges = param_ranges
            self.n_init = n_init
            self.n_iter = n_iter
            self.cv = cv
            self.history_ = []

        def _sample_params(self, rng):
            params = {}
            for k, v in self.param_ranges.items():
                if isinstance(v, list):
                    params[k] = rng.choice(v)
                elif isinstance(v, tuple) and len(v) == 2:
                    params[k] = rng.uniform(v[0], v[1])
            return params

        def tune(self, X, y):
            rng = np.random.RandomState(42)
            for i in range(self.n_init + self.n_iter):
                params = self._sample_params(rng)
                try:
                    self.estimator.set_params(**params)
                    score = cross_val_score(self.estimator, X, y,
                                            cv=self.cv, scoring='accuracy').mean()
                    self.history_.append((params, score))
                except Exception:
                    pass
            self.best_params_ = max(self.history_, key=lambda x: x[1])[0]
            self.best_score_ = max(self.history_, key=lambda x: x[1])[1]
            return self

    X, y = make_classification(n_samples=200, random_state=42)
    param_ranges = {'C': (0.01, 10.0)}
    bt = BayesianTuner(LogisticRegression(max_iter=1000), param_ranges)
    bt.tune(X, y)
    print(f"Ex28 — BayesianTuner: best_params={bt.best_params_}, score={bt.best_score_:.4f}, "
          f"n_trials={len(bt.history_)}")

def ex29():
    """TuningExperiment class logging all trials"""
    class TuningExperiment:
        def __init__(self, estimator, param_grid, cv=3):
            self.estimator = estimator
            self.param_grid = param_grid
            self.cv = cv

        def run(self, X, y):
            gs = GridSearchCV(self.estimator, self.param_grid,
                              cv=self.cv, scoring='accuracy',
                              return_train_score=True)
            gs.fit(X, y)
            self.results_df_ = pd.DataFrame(gs.cv_results_)
            self.best_params_ = gs.best_params_
            self.best_score_ = gs.best_score_
            return self

        def top_n(self, n=3):
            cols = [c for c in self.results_df_.columns if c.startswith('param_')] + \
                   ['mean_test_score', 'rank_test_score']
            return self.results_df_[cols].sort_values('rank_test_score').head(n)

    X, y = make_classification(n_samples=200, random_state=42)
    exp = TuningExperiment(LogisticRegression(max_iter=1000),
                           {'C': [0.001, 0.01, 0.1, 1, 10]}).run(X, y)
    print(f"Ex29 — TuningExperiment top 3:\n{exp.top_n(3).to_string()}")

def ex30():
    """ValidationCurveAnalyzer class"""
    class ValidationCurveAnalyzer:
        def __init__(self, model, param_name, param_range, cv=5):
            self.model = model
            self.param_name = param_name
            self.param_range = param_range
            self.cv = cv

        def analyze(self, X, y):
            tr_s, va_s = validation_curve(
                self.model, X, y, param_name=self.param_name,
                param_range=self.param_range, cv=self.cv, scoring='accuracy')
            self.train_mean_ = tr_s.mean(axis=1)
            self.val_mean_ = va_s.mean(axis=1)
            self.best_idx_ = np.argmax(self.val_mean_)
            self.best_param_ = self.param_range[self.best_idx_]
            return self

        def report(self):
            rows = []
            for p, tr, va in zip(self.param_range, self.train_mean_, self.val_mean_):
                rows.append({'param': p, 'train': round(tr, 4), 'val': round(va, 4),
                              'gap': round(tr - va, 4)})
            return pd.DataFrame(rows)

    X, y = make_classification(n_samples=300, random_state=42)
    vca = ValidationCurveAnalyzer(RandomForestClassifier(random_state=42),
                                   'n_estimators', [5, 10, 20, 50, 100])
    vca.analyze(X, y)
    print(f"Ex30 — ValidationCurveAnalyzer: best n_estimators={vca.best_param_}")
    print(vca.report().to_string())

def ex31():
    """LearningCurveAnalyzer class"""
    class LearningCurveAnalyzer:
        def __init__(self, model, train_sizes=None, cv=5):
            self.model = model
            self.train_sizes = train_sizes or np.linspace(0.1, 1.0, 6)
            self.cv = cv

        def analyze(self, X, y):
            sizes, tr_s, va_s = learning_curve(
                self.model, X, y, cv=self.cv,
                train_sizes=self.train_sizes, scoring='accuracy')
            self.sizes_ = sizes
            self.train_mean_ = tr_s.mean(axis=1)
            self.val_mean_ = va_s.mean(axis=1)
            self.gaps_ = self.train_mean_ - self.val_mean_
            return self

        def diagnosis(self):
            final_gap = self.gaps_[-1]
            if final_gap > 0.1:
                return "HIGH VARIANCE (overfitting) — more data or regularization needed"
            elif self.val_mean_[-1] < 0.7:
                return "HIGH BIAS (underfitting) — more complex model needed"
            else:
                return "GOOD FIT"

    X, y = make_classification(n_samples=500, random_state=42)
    lca = LearningCurveAnalyzer(LogisticRegression(max_iter=1000)).analyze(X, y)
    print(f"Ex31 — LearningCurveAnalyzer: diagnosis='{lca.diagnosis()}'")
    for sz, tr, va, gap in zip(lca.sizes_, lca.train_mean_, lca.val_mean_, lca.gaps_):
        print(f"       n={sz:3d}: train={tr:.3f}, val={va:.3f}, gap={gap:.3f}")

def ex32():
    """Full tuning pipeline: preprocess + model + GridSearch"""
    X, y = make_classification(n_samples=300, random_state=42)
    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(random_state=42))
    ])
    param_grid = {
        'clf__n_estimators': [20, 50],
        'clf__max_depth': [3, 5, None],
    }
    gs = GridSearchCV(pipe, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
    gs.fit(X, y)
    print(f"Ex32 — Full tuning pipeline: best={gs.best_params_}, score={gs.best_score_:.4f}")

def ex33():
    """Compare GridSearch vs RandomSearch efficiency"""
    X, y = make_classification(n_samples=300, random_state=42)
    param_grid = {'n_estimators': [10, 20, 50, 100],
                  'max_depth': [3, 5, 7, None],
                  'min_samples_split': [2, 5, 10]}
    param_dist = {'n_estimators': randint(10, 100),
                  'max_depth': [3, 5, 7, None],
                  'min_samples_split': randint(2, 10)}
    gs = GridSearchCV(RandomForestClassifier(random_state=42),
                      param_grid, cv=3, scoring='accuracy', n_jobs=-1)
    rs = RandomizedSearchCV(RandomForestClassifier(random_state=42),
                             param_dist, n_iter=20, cv=3,
                             scoring='accuracy', n_jobs=-1, random_state=42)
    gs.fit(X, y); rs.fit(X, y)
    n_grid_fits = len(gs.cv_results_['mean_test_score']) * 3
    n_rand_fits = 20 * 3
    print(f"Ex33 — GridSearch: {n_grid_fits} fits, score={gs.best_score_:.4f}")
    print(f"       RandomSearch: {n_rand_fits} fits, score={rs.best_score_:.4f}")
    print(f"       Efficiency gain: {n_grid_fits / n_rand_fits:.1f}x fewer fits for RandomSearch")

def ex34():
    """Nested CV for unbiased evaluation"""
    X, y = make_classification(n_samples=200, random_state=42)
    inner_cv = KFold(n_splits=3, shuffle=True, random_state=42)
    outer_cv = KFold(n_splits=5, shuffle=True, random_state=42)
    param_grid = {'C': [0.1, 1, 10]}
    gs = GridSearchCV(LogisticRegression(max_iter=1000), param_grid, cv=inner_cv)
    nested_scores = cross_val_score(gs, X, y, cv=outer_cv, scoring='accuracy')
    non_nested_gs = GridSearchCV(LogisticRegression(max_iter=1000), param_grid, cv=3)
    non_nested_gs.fit(X, y)
    print(f"Ex34 — Nested CV (unbiased): {nested_scores.mean():.4f} ± {nested_scores.std():.4f}")
    print(f"       Non-nested (biased):   {non_nested_gs.best_score_:.4f} "
          f"(optimistic bias={non_nested_gs.best_score_ - nested_scores.mean():.4f})")

def ex35():
    """Hyperparameter sensitivity analysis"""
    X, y = make_classification(n_samples=300, random_state=42)
    param_grid = {'C': [0.001, 0.01, 0.1, 1, 10, 100]}
    gs = GridSearchCV(LogisticRegression(max_iter=1000), param_grid, cv=5, scoring='accuracy')
    gs.fit(X, y)
    df = pd.DataFrame(gs.cv_results_)[['param_C', 'mean_test_score', 'std_test_score']]
    df['sensitivity'] = df['mean_test_score'].diff().abs()
    print(f"Ex35 — Hyperparameter sensitivity analysis:\n{df.to_string()}")

def ex36():
    """AutoML concept (print design)"""
    print("Ex36 — AutoML concept:")
    components = {
        "Search Space":    "Algorithms × Preprocessors × Hyperparams (CASH problem)",
        "Tools":           "auto-sklearn, H2O AutoML, FLAML, AutoKeras, TPOT",
        "Search Strategy": "Bayesian opt + meta-learning warm start",
        "Ensembling":      "Post-hoc ensemble of top k models",
        "Time Budget":     "User specifies total_time; optimizer allocates across candidates",
        "Output":          "Best pipeline (preprocessor + model + hyperparams)",
    }
    for k, v in components.items():
        print(f"       {k}: {v}")

def ex37():
    """Feature selection + hyperparameter joint tuning"""
    from sklearn.feature_selection import SelectKBest, f_classif
    X, y = make_classification(n_samples=300, n_features=20, n_informative=5, random_state=42)
    pipe = Pipeline([
        ('selector', SelectKBest(f_classif)),
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000))
    ])
    param_grid = {
        'selector__k': [5, 10, 15, 20],
        'clf__C': [0.1, 1, 10],
    }
    gs = GridSearchCV(pipe, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
    gs.fit(X, y)
    print(f"Ex37 — Feature selection + HP tuning: best={gs.best_params_}, score={gs.best_score_:.4f}")

def ex38():
    """Production hyperparameter tuning strategy"""
    strategy = {
        "Phase 1 - Coarse":   "RandomizedSearchCV, n_iter=50, log-uniform distributions",
        "Phase 2 - Fine":     "GridSearchCV around best region from Phase 1",
        "Phase 3 - Verify":   "Nested CV to confirm unbiased performance estimate",
        "Phase 4 - Final":    "Refit best config on ALL training data",
        "Phase 5 - Monitor":  "Track metric drift; retune when perf degrades > threshold",
        "Infrastructure":     "Log all trials to MLflow/W&B; version hyperparams with model",
        "Budget":             "Allocate by n_samples: small=GridSearch, large=Random/Bayesian",
    }
    print("Ex38 — Production HP Tuning Strategy:")
    for k, v in strategy.items():
        print(f"       {k}: {v}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Population-based training concept"""
    print("Ex39 — Population-Based Training (PBT) concept:")
    print("       1. Initialize population of N workers with random HPs")
    print("       2. Train all workers in parallel for T steps")
    print("       3. Exploit: copy weights from top 25% to bottom 25%")
    print("       4. Explore: perturb copied HPs by ±20% or resample")
    print("       5. Repeat until convergence")
    print("       Used by: DeepMind AlphaStar, Google Brain (PBT paper 2017)")
    print("       Key: adapts HPs DURING training, not just at start")

def ex40():
    """Evolutionary hyperparameter search (numpy random)"""
    X, y = make_classification(n_samples=200, random_state=42)

    def evaluate(C):
        return cross_val_score(LogisticRegression(C=C, max_iter=1000),
                               X, y, cv=3, scoring='accuracy').mean()

    # Simple evolutionary strategy (μ, λ)-ES
    rng = np.random.RandomState(42)
    population = rng.uniform(0.01, 10, 10)  # initial C values
    fitness = np.array([evaluate(c) for c in population])
    for generation in range(3):
        top_k = population[np.argsort(fitness)[::-1][:5]]
        mean_c, std_c = top_k.mean(), top_k.std() + 0.1
        offspring = rng.normal(mean_c, std_c, 10).clip(0.001, 100)
        offspring_fitness = np.array([evaluate(c) for c in offspring])
        all_c = np.concatenate([population, offspring])
        all_f = np.concatenate([fitness, offspring_fitness])
        best_idx = np.argsort(all_f)[::-1][:10]
        population, fitness = all_c[best_idx], all_f[best_idx]
    print(f"Ex40 — Evolutionary search: best C={population[0]:.4f}, score={fitness[0]:.4f}")

def ex41():
    """TPE (Tree Parzen Estimator) concept"""
    print("Ex41 — TPE (Tree Parzen Estimator) concept:")
    steps = [
        "1. Partition observed HP configs into 'good' (top γ%) and 'bad' (rest)",
        "2. Fit kernel density estimator l(x) on good configs",
        "3. Fit kernel density estimator g(x) on bad configs",
        "4. Acquisition: maximize EI ∝ l(x) / g(x)",
        "5. Evaluate f at selected x; update l(x) and g(x)",
        "6. Optuna default sampler uses TPE",
        "Key: models the DISTRIBUTION of good HPs (vs GP which models f directly)",
    ]
    for s in steps:
        print(f"       {s}")

def ex42():
    """Multi-fidelity optimization: run cheap evaluations first"""
    X, y = make_classification(n_samples=300, random_state=42)
    param_dist = {'n_estimators': [5, 10, 20, 50, 100, 200],
                  'max_depth': [3, 5, 7, None]}
    # Stage 1: cheap (small subset, few trees)
    X_cheap, y_cheap = X[:100], y[:100]
    rs_cheap = RandomizedSearchCV(RandomForestClassifier(random_state=42),
                                   param_dist, n_iter=20, cv=3,
                                   scoring='accuracy', random_state=42)
    rs_cheap.fit(X_cheap, y_cheap)
    top_params = pd.DataFrame(rs_cheap.cv_results_).nsmallest(5, 'rank_test_score')[
        ['param_n_estimators', 'param_max_depth']].to_dict('records')
    # Stage 2: expensive (full data) on top 5 only
    best_score = 0
    best_p = None
    for params in top_params:
        p = {k.replace('param_', ''): v for k, v in params.items()}
        score = cross_val_score(RandomForestClassifier(**p, random_state=42),
                                X, y, cv=3, scoring='accuracy').mean()
        if score > best_score:
            best_score, best_p = score, p
    print(f"Ex42 — Multi-fidelity: cheap top5 → full eval: best={best_p}, score={best_score:.4f}")

def ex43():
    """Hyperband algorithm concept"""
    print("Ex43 — Hyperband algorithm concept:")
    design = {
        "Idea":       "Bandit-based, adaptively allocates budget using successive halving",
        "Input":      "R = max resource per config, η = halving rate (default 3)",
        "Brackets":   "Multiple brackets with different n_configs and resource schedules",
        "Within bracket": "Run configs for r_i steps; keep top 1/η; increase budget; repeat",
        "Advantage":  "No need to choose n_configs vs resource tradeoff (explores both)",
        "BOHB":       "Combines Hyperband with Bayesian optimization for best of both",
        "Library":    "Ray Tune, SMAC3, KerasTuner all implement Hyperband",
    }
    for k, v in design.items():
        print(f"       {k}: {v}")

def ex44():
    """Meta-learning for warm starting"""
    print("Ex44 — Meta-learning for warm starting:")
    print("       Idea: use knowledge from previous datasets to initialise HP search")
    # Simulate: run on similar datasets, collect best HPs
    datasets = []
    best_hps = []
    for seed in range(5):
        X_m, y_m = make_classification(n_samples=200, n_features=10, random_state=seed)
        gs = GridSearchCV(LogisticRegression(max_iter=1000),
                          {'C': [0.01, 0.1, 1, 10]}, cv=3, scoring='accuracy')
        gs.fit(X_m, y_m)
        best_hps.append(gs.best_params_['C'])
    # Meta-feature: use most frequent best C as warm start
    warm_start_C = max(set(best_hps), key=best_hps.count)
    print(f"       Best C per meta-dataset: {best_hps}")
    print(f"       Warm-start C for new dataset: {warm_start_C}")

def ex45():
    """Hyperparameter transfer learning"""
    print("Ex45 — Hyperparameter transfer learning:")
    # Train on source task, reuse HPs on target task
    X_src, y_src = make_classification(n_samples=300, n_features=10, random_state=1)
    X_tgt, y_tgt = make_classification(n_samples=300, n_features=10, random_state=2)
    # Tune on source
    gs_src = GridSearchCV(RandomForestClassifier(random_state=42),
                          {'n_estimators': [10, 20, 50], 'max_depth': [3, 5, None]},
                          cv=3, scoring='accuracy')
    gs_src.fit(X_src, y_src)
    src_params = gs_src.best_params_
    # Apply source HPs to target (transfer)
    transfer_score = cross_val_score(RandomForestClassifier(**src_params, random_state=42),
                                      X_tgt, y_tgt, cv=3, scoring='accuracy').mean()
    # Tune from scratch on target
    gs_tgt = GridSearchCV(RandomForestClassifier(random_state=42),
                          {'n_estimators': [10, 20, 50], 'max_depth': [3, 5, None]},
                          cv=3, scoring='accuracy')
    gs_tgt.fit(X_tgt, y_tgt)
    scratch_score = gs_tgt.best_score_
    print(f"       Source best params: {src_params}")
    print(f"       Transfer score (source HPs on target): {transfer_score:.4f}")
    print(f"       From-scratch score on target: {scratch_score:.4f}")

def ex46():
    """NAS (Neural Architecture Search) concept"""
    print("Ex46 — Neural Architecture Search (NAS) concept:")
    nas_summary = {
        "Goal":       "Automatically design the neural network architecture",
        "Search space": "Layer types, sizes, connections, activations, skip connections",
        "Methods":    "RL-based (Zoph 2016), Evolutionary, Gradient-based (DARTS)",
        "Cost":       "Original NAS: 800 GPU days; DARTS: 4 GPU days",
        "Proxy tasks": "Train on small dataset / few epochs to estimate architecture quality",
        "One-shot":   "Train a supernetwork; subnet performance ≈ standalone performance",
    }
    for k, v in nas_summary.items():
        print(f"       {k}: {v}")

def ex47():
    """DARTS concept"""
    print("Ex47 — DARTS (Differentiable Architecture Search) concept:")
    darts = {
        "Key idea":    "Relax discrete architecture choices to continuous parameters α",
        "Mixed ops":   "output = Σ softmax(α_i) * op_i(x) — differentiable mix of ops",
        "Bilevel opt": "Minimize val loss w.r.t. α; minimize train loss w.r.t. weights",
        "Derivation":  "Approximate inner optimization with single gradient step",
        "Discretize":  "Replace each mixed op with argmax(α) after training",
        "Cost":        "~4 GPU days on CIFAR-10 (vs 1800+ for RL-based NAS)",
    }
    for k, v in darts.items():
        print(f"       {k}: {v}")

def ex48():
    """Joint architecture + hyperparameter search"""
    print("Ex48 — Joint architecture + hyperparameter search:")
    print("       Treats architecture choices as hyperparameters in a unified search space")
    # Simulate: grid over model complexity + regularization
    X, y = make_classification(n_samples=300, random_state=42)
    results = []
    for n_est in [10, 50]:
        for max_depth in [3, None]:
            for min_split in [2, 10]:
                score = cross_val_score(
                    RandomForestClassifier(n_estimators=n_est, max_depth=max_depth,
                                           min_samples_split=min_split, random_state=42),
                    X, y, cv=3, scoring='accuracy').mean()
                results.append({'n_est': n_est, 'depth': max_depth,
                                 'min_split': min_split, 'score': round(score, 4)})
    best = max(results, key=lambda r: r['score'])
    print(f"       Best joint config: {best}")

def ex49():
    """Hyperparameter tuning at scale (distributed)"""
    print("Ex49 — Hyperparameter tuning at scale (distributed):")
    scale_design = {
        "Ray Tune":      "Python library; parallelize GridSearch/RandomSearch/Bayesian across cluster",
        "Spark":         "MLlib CrossValidator natively distributes CV folds across executors",
        "Dask":          "dask-ml integrates with sklearn API; scales to out-of-core datasets",
        "Kubernetes":    "Run each HP trial as a pod; results stored in shared DB (e.g. MLflow)",
        "Early stopping": "Kill poor trials early (Hyperband/ASHA) to save compute",
        "Checkpointing": "Save intermediate model weights; resume if trial is preempted",
    }
    for k, v in scale_design.items():
        print(f"       {k}: {v}")

def ex50():
    """Production tuning infrastructure"""
    infra = {
        "Experiment tracking": "MLflow / W&B — log all HP trials, metrics, artifacts",
        "HP registry":         "Store best HPs per model version alongside model artifact",
        "Retuning trigger":    "Monitor val metric; retune if drop > threshold (e.g. 2%)",
        "Search strategy":     "Bayesian for expensive models; Random for cheap models",
        "Compute budget":      "Cap wall-clock time (not n_iter) for reproducibility",
        "Reproducibility":     "Log random_state, data version, sklearn version",
        "CI/CD":               "Run HP tuning in staging; gate deployment on CV score",
        "Shadow mode":         "New model serves shadow traffic; compare metrics vs champion",
    }
    print("Ex50 — Production HP Tuning Infrastructure:")
    for k, v in infra.items():
        print(f"       {k}: {v}")


def main():
    print("=" * 60)
    print("Examples 5.3 — Hyperparameter Tuning")
    print("=" * 60)
    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
