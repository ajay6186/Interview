# ============================================================
# Examples 5.1 — Cross-Validation (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.model_selection import (
    KFold, StratifiedKFold, LeaveOneOut, ShuffleSplit, TimeSeriesSplit,
    GroupKFold, RepeatedKFold, StratifiedShuffleSplit,
    cross_val_score, cross_val_predict, cross_validate,
    learning_curve, validation_curve, GridSearchCV
)
from sklearn.datasets import make_classification, make_regression, load_iris
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import make_scorer, f1_score, accuracy_score
from scipy import stats

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """k-fold split returning indices manually"""
    X = np.arange(10)
    n_splits = 5
    fold_size = len(X) // n_splits
    folds = [X[i * fold_size:(i + 1) * fold_size] for i in range(n_splits)]
    for i, fold in enumerate(folds):
        train = np.concatenate([folds[j] for j in range(n_splits) if j != i])
        print(f"Ex01 — Fold {i+1}: train={train}, val={fold}")

def ex02():
    """sklearn KFold split"""
    X = np.zeros((10, 2))
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    splits = [(tr.tolist(), va.tolist()) for tr, va in kf.split(X)]
    print(f"Ex02 — KFold: {len(splits)} folds, fold0 val={splits[0][1]}")

def ex03():
    """StratifiedKFold preserving class proportions"""
    X, y = make_classification(n_samples=100, n_classes=2, random_state=42)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    class_ratios = []
    for tr, va in skf.split(X, y):
        ratio = y[va].mean()
        class_ratios.append(round(ratio, 2))
    print(f"Ex03 — StratifiedKFold class ratios per fold: {class_ratios}")

def ex04():
    """cross_val_score 5-fold accuracy"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"Ex04 — 5-fold accuracy: {scores.round(3)}, mean={scores.mean():.3f}")

def ex05():
    """cross_val_score with multiple metrics using cross_validate"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    results = cross_validate(model, X, y, cv=5,
                             scoring=['accuracy', 'f1'], return_train_score=False)
    print(f"Ex05 — Accuracy: {results['test_accuracy'].mean():.3f}, "
          f"F1: {results['test_f1'].mean():.3f}")

def ex06():
    """cross_val_predict for out-of-fold predictions"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    preds = cross_val_predict(model, X, y, cv=5)
    acc = accuracy_score(y, preds)
    print(f"Ex06 — cross_val_predict OOF accuracy: {acc:.3f}")

def ex07():
    """Leave-One-Out CV"""
    X, y = make_classification(n_samples=50, random_state=42)
    model = LogisticRegression(max_iter=1000)
    loo = LeaveOneOut()
    scores = cross_val_score(model, X, y, cv=loo, scoring='accuracy')
    print(f"Ex07 — LOO-CV: n_splits={len(scores)}, mean_acc={scores.mean():.3f}")

def ex08():
    """ShuffleSplit cross-validation"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    ss = ShuffleSplit(n_splits=10, test_size=0.2, random_state=42)
    scores = cross_val_score(model, X, y, cv=ss, scoring='accuracy')
    print(f"Ex08 — ShuffleSplit (10 iters): mean={scores.mean():.3f}, std={scores.std():.3f}")

def ex09():
    """TimeSeriesSplit for temporal data"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    tscv = TimeSeriesSplit(n_splits=5)
    scores = cross_val_score(model, X, y, cv=tscv, scoring='accuracy')
    print(f"Ex09 — TimeSeriesSplit scores: {scores.round(3)}, mean={scores.mean():.3f}")

def ex10():
    """GroupKFold ensuring no group leakage"""
    X, y = make_classification(n_samples=100, random_state=42)
    groups = np.repeat(np.arange(10), 10)
    gkf = GroupKFold(n_splits=5)
    folds_info = []
    for tr, va in gkf.split(X, y, groups):
        folds_info.append(np.unique(groups[va]).tolist())
    print(f"Ex10 — GroupKFold val groups: {folds_info}")

def ex11():
    """RepeatedKFold for more stable estimates"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    rkf = RepeatedKFold(n_splits=5, n_repeats=3, random_state=42)
    scores = cross_val_score(model, X, y, cv=rkf, scoring='accuracy')
    print(f"Ex11 — RepeatedKFold (5x3=15): mean={scores.mean():.3f}, std={scores.std():.4f}")

def ex12():
    """StratifiedShuffleSplit"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    sss = StratifiedShuffleSplit(n_splits=5, test_size=0.2, random_state=42)
    scores = cross_val_score(model, X, y, cv=sss, scoring='accuracy')
    print(f"Ex12 — StratifiedShuffleSplit: mean={scores.mean():.3f}, std={scores.std():.4f}")

def ex13():
    """cross_validate returning train AND test scores"""
    X, y = make_classification(n_samples=200, random_state=42)
    model = LogisticRegression(max_iter=1000)
    results = cross_validate(model, X, y, cv=5, scoring='accuracy', return_train_score=True)
    train_mean = results['train_score'].mean()
    test_mean = results['test_score'].mean()
    print(f"Ex13 — cross_validate: train={train_mean:.3f}, test={test_mean:.3f}, "
          f"gap={train_mean - test_mean:.3f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """cross_val_score for regression (R²)"""
    X, y = make_regression(n_samples=200, n_features=10, noise=20, random_state=42)
    model = Ridge(alpha=1.0)
    scores = cross_val_score(model, X, y, cv=5, scoring='r2')
    print(f"Ex14 — Ridge R² CV: {scores.round(3)}, mean={scores.mean():.3f}")

def ex15():
    """Cross-validated feature importance mean across folds"""
    X, y = make_classification(n_samples=300, n_features=10, random_state=42)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    importances = np.zeros(X.shape[1])
    rf = RandomForestClassifier(n_estimators=30, random_state=42)
    for tr, va in kf.split(X, y):
        rf.fit(X[tr], y[tr])
        importances += rf.feature_importances_
    importances /= 5
    top3 = np.argsort(importances)[::-1][:3]
    print(f"Ex15 — CV feature importances top3 features: {top3}, scores: {importances[top3].round(3)}")

def ex16():
    """k-fold CV with sklearn Pipeline"""
    X, y = make_classification(n_samples=200, random_state=42)
    pipe = Pipeline([('scaler', StandardScaler()), ('clf', LogisticRegression(max_iter=1000))])
    scores = cross_val_score(pipe, X, y, cv=5, scoring='accuracy')
    print(f"Ex16 — Pipeline CV: mean={scores.mean():.3f}, std={scores.std():.4f}")

def ex17():
    """k-fold with preprocessing fit only on train fold"""
    X, y = make_classification(n_samples=200, random_state=42)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    accs = []
    for tr, va in kf.split(X, y):
        scaler = StandardScaler()
        X_tr = scaler.fit_transform(X[tr])
        X_va = scaler.transform(X[va])
        model = LogisticRegression(max_iter=1000)
        model.fit(X_tr, y[tr])
        accs.append(accuracy_score(y[va], model.predict(X_va)))
    print(f"Ex17 — Manual k-fold (no leakage): mean={np.mean(accs):.3f}, std={np.std(accs):.4f}")

def ex18():
    """Bias-variance via learning curves"""
    X, y = make_classification(n_samples=500, random_state=42)
    model = LogisticRegression(max_iter=1000)
    train_sizes, train_scores, val_scores = learning_curve(
        model, X, y, cv=5, train_sizes=np.linspace(0.1, 1.0, 5), scoring='accuracy')
    print(f"Ex18 — Learning curve train sizes: {train_sizes}")
    print(f"       Train scores mean: {train_scores.mean(axis=1).round(3)}")
    print(f"       Val   scores mean: {val_scores.mean(axis=1).round(3)}")

def ex19():
    """Overfitting detection via train vs val gap"""
    X, y = make_classification(n_samples=200, random_state=42)
    results = cross_validate(LogisticRegression(max_iter=1000), X, y, cv=5,
                             scoring='accuracy', return_train_score=True)
    gap = results['train_score'].mean() - results['test_score'].mean()
    status = "OVERFIT" if gap > 0.05 else "OK"
    print(f"Ex19 — Train={results['train_score'].mean():.3f}, "
          f"Val={results['test_score'].mean():.3f}, Gap={gap:.3f} [{status}]")

def ex20():
    """Learning curve for different training sizes"""
    X, y = make_classification(n_samples=500, random_state=42)
    rf = RandomForestClassifier(n_estimators=20, random_state=42)
    sizes, tr_s, va_s = learning_curve(rf, X, y, cv=3,
                                       train_sizes=[50, 100, 200, 350, 500])
    for sz, tr, va in zip(sizes, tr_s.mean(axis=1), va_s.mean(axis=1)):
        print(f"Ex20 — n={sz:3d}: train={tr:.3f}, val={va:.3f}")

def ex21():
    """Validation curve for n_estimators"""
    X, y = make_classification(n_samples=300, random_state=42)
    rf = RandomForestClassifier(random_state=42)
    param_range = [5, 10, 20, 50, 100]
    tr_s, va_s = validation_curve(rf, X, y, param_name='n_estimators',
                                   param_range=param_range, cv=3, scoring='accuracy')
    print("Ex21 — Validation curve (n_estimators):")
    for n, tr, va in zip(param_range, tr_s.mean(axis=1), va_s.mean(axis=1)):
        print(f"       n={n:3d}: train={tr:.3f}, val={va:.3f}")

def ex22():
    """Nested CV: outer evaluation + inner GridSearchCV"""
    X, y = make_classification(n_samples=200, random_state=42)
    inner_cv = KFold(n_splits=3, shuffle=True, random_state=42)
    outer_cv = KFold(n_splits=5, shuffle=True, random_state=42)
    clf = GridSearchCV(LogisticRegression(max_iter=1000),
                       param_grid={'C': [0.01, 0.1, 1, 10]}, cv=inner_cv)
    nested_scores = cross_val_score(clf, X, y, cv=outer_cv, scoring='accuracy')
    print(f"Ex22 — Nested CV scores: {nested_scores.round(3)}, mean={nested_scores.mean():.3f}")

def ex23():
    """Repeated CV statistical comparison of two models"""
    X, y = make_classification(n_samples=200, random_state=42)
    rkf = RepeatedKFold(n_splits=5, n_repeats=10, random_state=42)
    scores1 = cross_val_score(LogisticRegression(max_iter=1000), X, y, cv=rkf)
    scores2 = cross_val_score(RandomForestClassifier(n_estimators=20, random_state=42), X, y, cv=rkf)
    t_stat, p_val = stats.ttest_rel(scores1, scores2)
    print(f"Ex23 — LR mean={scores1.mean():.3f}, RF mean={scores2.mean():.3f}")
    print(f"       Paired t-test: t={t_stat:.3f}, p={p_val:.4f}")

def ex24():
    """CV for imbalanced datasets using StratifiedKFold + F1"""
    X, y = make_classification(n_samples=300, weights=[0.9, 0.1], random_state=42)
    model = LogisticRegression(class_weight='balanced', max_iter=1000)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    f1_scores = cross_val_score(model, X, y, cv=skf, scoring='f1')
    print(f"Ex24 — Imbalanced F1 CV: {f1_scores.round(3)}, mean={f1_scores.mean():.3f}")

def ex25():
    """CV with custom scorer"""
    X, y = make_classification(n_samples=200, random_state=42)
    custom_scorer = make_scorer(f1_score, average='weighted')
    model = LogisticRegression(max_iter=1000)
    scores = cross_val_score(model, X, y, cv=5, scoring=custom_scorer)
    print(f"Ex25 — Custom scorer (weighted F1): {scores.round(3)}, mean={scores.mean():.3f}")

def ex26():
    """Time series walk-forward validation"""
    X, y = make_classification(n_samples=200, random_state=42)
    tscv = TimeSeriesSplit(n_splits=5)
    model = LogisticRegression(max_iter=1000)
    accs = []
    for i, (tr, va) in enumerate(tscv.split(X, y)):
        model.fit(X[tr], y[tr])
        accs.append(accuracy_score(y[va], model.predict(X[va])))
    print(f"Ex26 — Walk-forward validation accs: {[round(a,3) for a in accs]}, mean={np.mean(accs):.3f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """CrossValidator class: fit, get_scores, summary"""
    class CrossValidator:
        def __init__(self, model, cv=5, scoring='accuracy'):
            self.model = model
            self.cv = cv
            self.scoring = scoring
            self.scores_ = None

        def fit(self, X, y):
            self.scores_ = cross_val_score(self.model, X, y,
                                           cv=self.cv, scoring=self.scoring)
            return self

        def get_scores(self):
            return self.scores_

        def summary(self):
            return {'mean': self.scores_.mean(), 'std': self.scores_.std(),
                    'min': self.scores_.min(), 'max': self.scores_.max()}

    X, y = make_classification(n_samples=200, random_state=42)
    cv = CrossValidator(LogisticRegression(max_iter=1000)).fit(X, y)
    print(f"Ex27 — CrossValidator summary: {cv.summary()}")

def ex28():
    """NestedCVEvaluator class with outer + inner loops"""
    class NestedCVEvaluator:
        def __init__(self, estimator, param_grid, outer_cv=5, inner_cv=3):
            self.estimator = estimator
            self.param_grid = param_grid
            self.outer_cv = KFold(n_splits=outer_cv, shuffle=True, random_state=42)
            self.inner_cv = KFold(n_splits=inner_cv, shuffle=True, random_state=42)

        def evaluate(self, X, y):
            gs = GridSearchCV(self.estimator, self.param_grid, cv=self.inner_cv)
            scores = cross_val_score(gs, X, y, cv=self.outer_cv, scoring='accuracy')
            return scores

    X, y = make_classification(n_samples=200, random_state=42)
    ev = NestedCVEvaluator(LogisticRegression(max_iter=1000), {'C': [0.1, 1, 10]})
    scores = ev.evaluate(X, y)
    print(f"Ex28 — NestedCVEvaluator: {scores.round(3)}, mean={scores.mean():.3f}")

def ex29():
    """LearningCurveAnalyzer class"""
    class LearningCurveAnalyzer:
        def __init__(self, model, cv=5, train_sizes=None):
            self.model = model
            self.cv = cv
            self.train_sizes = train_sizes or np.linspace(0.1, 1.0, 5)

        def analyze(self, X, y):
            sizes, tr_s, va_s = learning_curve(
                self.model, X, y, cv=self.cv, train_sizes=self.train_sizes)
            self.sizes_ = sizes
            self.train_mean_ = tr_s.mean(axis=1)
            self.val_mean_ = va_s.mean(axis=1)
            return self

        def report(self):
            return {int(s): {'train': round(tr, 3), 'val': round(va, 3)}
                    for s, tr, va in zip(self.sizes_, self.train_mean_, self.val_mean_)}

    X, y = make_classification(n_samples=400, random_state=42)
    lca = LearningCurveAnalyzer(LogisticRegression(max_iter=1000)).analyze(X, y)
    print(f"Ex29 — LearningCurveAnalyzer report: {lca.report()}")

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
            self.best_param_ = self.param_range[np.argmax(self.val_mean_)]
            return self

    X, y = make_classification(n_samples=300, random_state=42)
    vca = ValidationCurveAnalyzer(Ridge(), 'alpha', [0.001, 0.01, 0.1, 1, 10])
    # Use regression data for Ridge
    Xr, yr = make_regression(n_samples=300, noise=10, random_state=42)
    vca2 = ValidationCurveAnalyzer(Ridge(), 'alpha', [0.001, 0.01, 0.1, 1, 10], cv=3)
    tr_s, va_s = validation_curve(Ridge(), Xr, yr, param_name='alpha',
                                   param_range=[0.001, 0.01, 0.1, 1, 10], cv=3, scoring='r2')
    best = [0.001, 0.01, 0.1, 1, 10][np.argmax(va_s.mean(axis=1))]
    print(f"Ex30 — ValidationCurveAnalyzer: best alpha={best}, "
          f"val R²={va_s.mean(axis=1).max():.3f}")

def ex31():
    """CVModelComparator class comparing N models"""
    class CVModelComparator:
        def __init__(self, models, cv=5, scoring='accuracy'):
            self.models = models
            self.cv = cv
            self.scoring = scoring
            self.results_ = {}

        def compare(self, X, y):
            for name, model in self.models.items():
                scores = cross_val_score(model, X, y, cv=self.cv, scoring=self.scoring)
                self.results_[name] = {'mean': scores.mean(), 'std': scores.std()}
            return self

        def best(self):
            return max(self.results_, key=lambda k: self.results_[k]['mean'])

    X, y = make_classification(n_samples=200, random_state=42)
    models = {'LR': LogisticRegression(max_iter=1000),
              'RF': RandomForestClassifier(n_estimators=20, random_state=42)}
    comp = CVModelComparator(models).compare(X, y)
    print(f"Ex31 — CVModelComparator: {comp.results_}, best={comp.best()}")

def ex32():
    """StabilityAnalyzer using CV score std"""
    class StabilityAnalyzer:
        def __init__(self, model, cv_options=None):
            self.model = model
            self.cv_options = cv_options or [3, 5, 10]

        def analyze(self, X, y):
            self.stds_ = {}
            for cv in self.cv_options:
                scores = cross_val_score(self.model, X, y, cv=cv, scoring='accuracy')
                self.stds_[cv] = round(scores.std(), 4)
            return self

        def is_stable(self, threshold=0.05):
            return all(v < threshold for v in self.stds_.values())

    X, y = make_classification(n_samples=300, random_state=42)
    sa = StabilityAnalyzer(LogisticRegression(max_iter=1000)).analyze(X, y)
    print(f"Ex32 — StabilityAnalyzer stds={sa.stds_}, stable={sa.is_stable()}")

def ex33():
    """BiasVarianceEstimator class"""
    class BiasVarianceEstimator:
        def __init__(self, model, n_bootstraps=20, test_size=0.3):
            self.model = model
            self.n_bootstraps = n_bootstraps
            self.test_size = test_size

        def estimate(self, X, y):
            rng = np.random.RandomState(42)
            n_test = int(len(X) * self.test_size)
            preds = []
            test_idx = rng.choice(len(X), n_test, replace=False)
            X_test, y_test = X[test_idx], y[test_idx]
            train_mask = np.ones(len(X), dtype=bool)
            train_mask[test_idx] = False
            for _ in range(self.n_bootstraps):
                idx = rng.choice(train_mask.sum(), train_mask.sum(), replace=True)
                X_tr = X[train_mask][idx]
                y_tr = y[train_mask][idx]
                self.model.fit(X_tr, y_tr)
                preds.append(self.model.predict(X_test))
            preds = np.array(preds)
            bias2 = np.mean((preds.mean(axis=0) - y_test) ** 2)
            variance = np.mean(preds.var(axis=0))
            return {'bias2': round(bias2, 4), 'variance': round(variance, 4)}

    X, y = make_regression(n_samples=200, noise=10, random_state=42)
    bve = BiasVarianceEstimator(Ridge(alpha=1.0))
    result = bve.estimate(X, y)
    print(f"Ex33 — BiasVarianceEstimator: {result}")

def ex34():
    """TimeSeriesCVEvaluator class"""
    class TimeSeriesCVEvaluator:
        def __init__(self, model, n_splits=5):
            self.model = model
            self.n_splits = n_splits
            self.tscv = TimeSeriesSplit(n_splits=n_splits)

        def evaluate(self, X, y):
            scores = []
            for tr, va in self.tscv.split(X):
                self.model.fit(X[tr], y[tr])
                preds = self.model.predict(X[va])
                scores.append(accuracy_score(y[va], preds))
            self.scores_ = np.array(scores)
            return self

        def summary(self):
            return {'scores': self.scores_.round(3).tolist(),
                    'mean': round(self.scores_.mean(), 3),
                    'trend': 'improving' if self.scores_[-1] > self.scores_[0] else 'declining'}

    X, y = make_classification(n_samples=200, random_state=42)
    ev = TimeSeriesCVEvaluator(LogisticRegression(max_iter=1000)).evaluate(X, y)
    print(f"Ex34 — TimeSeriesCVEvaluator: {ev.summary()}")

def ex35():
    """Full CV pipeline: preprocess + fit + CV evaluate"""
    X, y = make_classification(n_samples=300, n_features=20, random_state=42)
    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(n_estimators=20, random_state=42))
    ])
    results = cross_validate(pipe, X, y, cv=5,
                             scoring=['accuracy', 'f1'],
                             return_train_score=True)
    print(f"Ex35 — Full CV pipeline:")
    print(f"       Train acc={results['train_accuracy'].mean():.3f}, "
          f"Test acc={results['test_accuracy'].mean():.3f}")
    print(f"       Train F1={results['train_f1'].mean():.3f}, "
          f"Test F1={results['test_f1'].mean():.3f}")

def ex36():
    """CV report generator"""
    def cv_report(model, X, y, cv=5, model_name="Model"):
        results = cross_validate(model, X, y, cv=cv,
                                 scoring=['accuracy', 'f1'],
                                 return_train_score=True)
        report = {
            'model': model_name,
            'train_acc': f"{results['train_accuracy'].mean():.3f} ± {results['train_accuracy'].std():.3f}",
            'test_acc': f"{results['test_accuracy'].mean():.3f} ± {results['test_accuracy'].std():.3f}",
            'test_f1': f"{results['test_f1'].mean():.3f} ± {results['test_f1'].std():.3f}",
        }
        return report

    X, y = make_classification(n_samples=200, random_state=42)
    report = cv_report(LogisticRegression(max_iter=1000), X, y, model_name="LogReg")
    print(f"Ex36 — CV Report: {report}")

def ex37():
    """CV with bootstrap confidence interval"""
    X, y = make_classification(n_samples=300, random_state=42)
    scores = cross_val_score(LogisticRegression(max_iter=1000), X, y,
                             cv=10, scoring='accuracy')
    rng = np.random.RandomState(42)
    boot_means = [rng.choice(scores, len(scores), replace=True).mean()
                  for _ in range(1000)]
    ci_low, ci_high = np.percentile(boot_means, [2.5, 97.5])
    print(f"Ex37 — CV Bootstrap 95% CI: [{ci_low:.3f}, {ci_high:.3f}], "
          f"mean={scores.mean():.3f}")

def ex38():
    """Production CV strategy selector"""
    def select_cv_strategy(n_samples, is_temporal, is_imbalanced, has_groups):
        if is_temporal:
            strategy = "TimeSeriesSplit"
            reason = "temporal ordering must be preserved"
        elif has_groups:
            strategy = "GroupKFold"
            reason = "group leakage must be prevented"
        elif is_imbalanced:
            strategy = "StratifiedKFold"
            reason = "class proportions must be preserved"
        elif n_samples < 500:
            strategy = "RepeatedKFold"
            reason = "small dataset benefits from repetition"
        else:
            strategy = "KFold (5-fold)"
            reason = "standard for large balanced datasets"
        return strategy, reason

    cases = [(100, False, False, False), (500, True, False, False),
             (300, False, True, False), (200, False, False, True)]
    for args in cases:
        s, r = select_cv_strategy(*args)
        print(f"Ex38 — n={args[0]:3d}, temporal={args[1]}, imbal={args[2]}, groups={args[3]} "
              f"→ {s} ({r})")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Distribution shift detection via CV"""
    from sklearn.linear_model import LogisticRegression as LR
    rng = np.random.RandomState(42)
    X_train = rng.randn(200, 5)
    X_test = rng.randn(200, 5) + 0.5   # shifted distribution
    y_combined = np.concatenate([np.zeros(200), np.ones(200)])
    X_combined = np.vstack([X_train, X_test])
    detector = LR(max_iter=1000)
    scores = cross_val_score(detector, X_combined, y_combined, cv=5, scoring='roc_auc')
    shift_detected = scores.mean() > 0.6
    print(f"Ex39 — Distribution shift AUC={scores.mean():.3f} "
          f"({'SHIFT DETECTED' if shift_detected else 'NO SHIFT'})")

def ex40():
    """Adversarial validation: train vs test distribution"""
    rng = np.random.RandomState(42)
    X_train = rng.randn(500, 10)
    X_test = rng.randn(200, 10) + np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])
    X_adv = np.vstack([X_train, X_test])
    y_adv = np.concatenate([np.zeros(len(X_train)), np.ones(len(X_test))])
    from sklearn.ensemble import RandomForestClassifier as RFC
    clf = RFC(n_estimators=30, random_state=42)
    auc = cross_val_score(clf, X_adv, y_adv, cv=5, scoring='roc_auc').mean()
    print(f"Ex40 — Adversarial validation AUC={auc:.3f} "
          f"({'distribution mismatch' if auc > 0.6 else 'distributions similar'})")

def ex41():
    """Temporal CV for streaming data (expanding window)"""
    n = 100
    X = np.random.RandomState(42).randn(n, 5)
    y = (X[:, 0] > 0).astype(int)
    min_train = 20
    step = 10
    results = []
    model = LogisticRegression(max_iter=1000)
    for end in range(min_train + step, n + 1, step):
        X_tr, y_tr = X[:end - step], y[:end - step]
        X_va, y_va = X[end - step:end], y[end - step:end]
        model.fit(X_tr, y_tr)
        results.append(accuracy_score(y_va, model.predict(X_va)))
    print(f"Ex41 — Temporal streaming CV accs: {[round(r,3) for r in results]}")

def ex42():
    """Spatial CV for geo data concept (block assignment)"""
    rng = np.random.RandomState(42)
    n = 200
    lat = rng.uniform(0, 10, n)
    lon = rng.uniform(0, 10, n)
    X = np.column_stack([lat, lon, rng.randn(n, 3)])
    y = (lat + lon > 10).astype(int)
    block_row = (lat // 5).astype(int)
    block_col = (lon // 5).astype(int)
    blocks = block_row * 2 + block_col
    gkf = GroupKFold(n_splits=4)
    model = LogisticRegression(max_iter=1000)
    accs = []
    for tr, va in gkf.split(X, y, groups=blocks):
        model.fit(X[tr], y[tr])
        accs.append(accuracy_score(y[va], model.predict(X[va])))
    print(f"Ex42 — Spatial CV (block) accs: {[round(a,3) for a in accs]}, mean={np.mean(accs):.3f}")

def ex43():
    """Leave-subject-out CV"""
    rng = np.random.RandomState(42)
    n_subjects = 10
    n_obs_per_subject = 20
    subjects = np.repeat(np.arange(n_subjects), n_obs_per_subject)
    X = rng.randn(n_subjects * n_obs_per_subject, 5) + subjects[:, None] * 0.1
    y = (X[:, 0] > 0).astype(int)
    logo = GroupKFold(n_splits=n_subjects)
    model = LogisticRegression(max_iter=1000)
    accs = [accuracy_score(y[va], model.fit(X[tr], y[tr]).predict(X[va]))
            for tr, va in logo.split(X, y, groups=subjects)]
    print(f"Ex43 — Leave-Subject-Out CV: mean={np.mean(accs):.3f}, std={np.std(accs):.4f}")

def ex44():
    """Stratified group k-fold (manual implementation)"""
    from sklearn.model_selection import StratifiedGroupKFold
    X, y = make_classification(n_samples=200, random_state=42)
    groups = np.repeat(np.arange(20), 10)
    sgkf = StratifiedGroupKFold(n_splits=5)
    model = LogisticRegression(max_iter=1000)
    accs = [accuracy_score(y[va], model.fit(X[tr], y[tr]).predict(X[va]))
            for tr, va in sgkf.split(X, y, groups=groups)]
    print(f"Ex44 — StratifiedGroupKFold accs: {[round(a,3) for a in accs]}, mean={np.mean(accs):.3f}")

def ex45():
    """CV with data augmentation (flip features)"""
    X, y = make_classification(n_samples=200, random_state=42)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    model = LogisticRegression(max_iter=1000)
    accs = []
    for tr, va in kf.split(X, y):
        X_aug = np.vstack([X[tr], -X[tr]])
        y_aug = np.concatenate([y[tr], y[tr]])
        model.fit(X_aug, y_aug)
        accs.append(accuracy_score(y[va], model.predict(X[va])))
    print(f"Ex45 — CV with augmentation accs: {[round(a,3) for a in accs]}, mean={np.mean(accs):.3f}")

def ex46():
    """Sample weight in CV"""
    X, y = make_classification(n_samples=200, random_state=42)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    model = LogisticRegression(max_iter=1000)
    accs_w, accs_uw = [], []
    rng = np.random.RandomState(42)
    weights = rng.uniform(0.5, 2.0, len(X))
    for tr, va in kf.split(X, y):
        model.fit(X[tr], y[tr], sample_weight=weights[tr])
        accs_w.append(accuracy_score(y[va], model.predict(X[va])))
        model.fit(X[tr], y[tr])
        accs_uw.append(accuracy_score(y[va], model.predict(X[va])))
    print(f"Ex46 — Weighted CV mean={np.mean(accs_w):.3f}, Unweighted CV mean={np.mean(accs_uw):.3f}")

def ex47():
    """CV for multi-label problems"""
    from sklearn.multiclass import OneVsRestClassifier
    from sklearn.metrics import f1_score as f1
    rng = np.random.RandomState(42)
    X = rng.randn(200, 10)
    y = (rng.randn(200, 3) > 0).astype(int)
    model = OneVsRestClassifier(LogisticRegression(max_iter=1000))
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    scores = []
    for tr, va in kf.split(X):
        model.fit(X[tr], y[tr])
        preds = model.predict(X[va])
        scores.append(f1(y[va], preds, average='micro'))
    print(f"Ex47 — Multi-label CV micro-F1: {[round(s,3) for s in scores]}, mean={np.mean(scores):.3f}")

def ex48():
    """CV for multi-output regression"""
    from sklearn.multioutput import MultiOutputRegressor
    from sklearn.metrics import r2_score
    X, y1 = make_regression(n_samples=200, n_features=10, noise=10, random_state=42)
    _, y2 = make_regression(n_samples=200, n_features=10, noise=10, random_state=1)
    y = np.column_stack([y1, y2])
    model = MultiOutputRegressor(Ridge(alpha=1.0))
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    r2s = []
    for tr, va in kf.split(X):
        model.fit(X[tr], y[tr])
        r2s.append(r2_score(y[va], model.predict(X[va])))
    print(f"Ex48 — Multi-output regression CV R²: {[round(r,3) for r in r2s]}, mean={np.mean(r2s):.3f}")

def ex49():
    """CV best practices checklist"""
    checklist = [
        "1. Use stratified CV for classification (class balance)",
        "2. Use GroupKFold when samples share groups (no leakage)",
        "3. Use TimeSeriesSplit for temporal data (no future leakage)",
        "4. Fit preprocessors ONLY on training fold (no data leakage)",
        "5. Use nested CV for model selection + hyperparameter tuning",
        "6. Report mean ± std across folds (not just best fold)",
        "7. Use RepeatedKFold for small datasets (reduce variance)",
        "8. Align CV strategy with deployment (walk-forward for prod)",
    ]
    print("Ex49 — CV Best Practices:")
    for item in checklist:
        print(f"       {item}")

def ex50():
    """Production CV architecture (print full design)"""
    design = {
        "Stage 1 - Strategy Selection": "StratifiedKFold / GroupKFold / TimeSeriesSplit",
        "Stage 2 - Preprocessing":      "Fit scaler/encoder on train fold only (Pipeline)",
        "Stage 3 - Model Training":      "Train on train fold, eval on val fold",
        "Stage 4 - Aggregation":         "Mean ± std of all fold metrics",
        "Stage 5 - Nested CV":           "Inner CV for HP tuning, outer CV for estimate",
        "Stage 6 - Final Model":         "Refit best config on ALL data",
        "Stage 7 - Monitoring":          "Track CV score drift over time in production",
    }
    print("Ex50 — Production CV Architecture:")
    for stage, desc in design.items():
        print(f"       {stage}: {desc}")


def main():
    print("=" * 60)
    print("Examples 5.1 — Cross-Validation")
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
