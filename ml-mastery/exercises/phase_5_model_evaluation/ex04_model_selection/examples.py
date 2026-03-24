# ============================================================
# Examples 5.4 — Model Selection (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.model_selection import cross_val_score, learning_curve, validation_curve
from scipy import stats
import time

np.random.seed(42)
X_cls, y_cls = make_classification(n_samples=300, n_features=10, random_state=42)
X_reg, y_reg = make_regression(n_samples=200, n_features=5, noise=10, random_state=42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Majority class baseline accuracy"""
    baseline = max(y_cls.mean(), 1 - y_cls.mean())
    print("Ex01 — baseline accuracy:", round(float(baseline), 4))

def ex02():
    """Logistic Regression 5-fold CV accuracy"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    scores = cross_val_score(pipe, X_cls, y_cls, cv=5, scoring="accuracy")
    print("Ex02 — LR CV mean:", round(scores.mean(), 4), "| std:", round(scores.std(), 4))

def ex03():
    """Decision Tree 5-fold CV accuracy"""
    scores = cross_val_score(DecisionTreeClassifier(random_state=42), X_cls, y_cls, cv=5)
    print("Ex03 — DT CV mean:", round(scores.mean(), 4), "| std:", round(scores.std(), 4))

def ex04():
    """Random Forest 5-fold CV accuracy"""
    scores = cross_val_score(RandomForestClassifier(n_estimators=100, random_state=42),
                              X_cls, y_cls, cv=5)
    print("Ex04 — RF CV mean:", round(scores.mean(), 4), "| std:", round(scores.std(), 4))

def ex05():
    """KNN 5-fold CV accuracy"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", KNeighborsClassifier(n_neighbors=5))])
    scores = cross_val_score(pipe, X_cls, y_cls, cv=5)
    print("Ex05 — KNN CV mean:", round(scores.mean(), 4))

def ex06():
    """SVM 5-fold CV accuracy"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", SVC(kernel="linear"))])
    scores = cross_val_score(pipe, X_cls, y_cls, cv=5)
    print("Ex06 — SVM CV mean:", round(scores.mean(), 4))

def ex07():
    """Naive Bayes 5-fold CV accuracy"""
    scores = cross_val_score(GaussianNB(), X_cls, y_cls, cv=5)
    print("Ex07 — GNB CV mean:", round(scores.mean(), 4))

def ex08():
    """Compare 5 classifiers side by side"""
    models = {
        "LR":  Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "DT":  DecisionTreeClassifier(random_state=42),
        "RF":  RandomForestClassifier(n_estimators=100, random_state=42),
        "KNN": Pipeline([("sc", StandardScaler()), ("clf", KNeighborsClassifier(n_neighbors=5))]),
        "NB":  GaussianNB(),
    }
    for name, m in models.items():
        sc = cross_val_score(m, X_cls, y_cls, cv=5).mean()
        print(f"Ex08 — {name}: {sc:.4f}")

def ex09():
    """AIC for Ridge regression"""
    model = Ridge().fit(X_reg, y_reg)
    rss = float(np.sum((y_reg - model.predict(X_reg)) ** 2))
    n, k = len(y_reg), X_reg.shape[1] + 1
    ll = -n / 2 * np.log(rss / n)
    aic = 2 * k - 2 * ll
    print("Ex09 — AIC:", round(float(aic), 4))

def ex10():
    """BIC for Ridge regression"""
    model = Ridge().fit(X_reg, y_reg)
    rss = float(np.sum((y_reg - model.predict(X_reg)) ** 2))
    n, k = len(y_reg), X_reg.shape[1] + 1
    ll = -n / 2 * np.log(rss / n)
    bic = k * np.log(n) - 2 * ll
    print("Ex10 — BIC:", round(float(bic), 4))

def ex11():
    """Occam's Razor: prefer simpler model when performance is tied"""
    def occams_razor(score_a, score_b, params_a, params_b, name_a, name_b):
        if abs(score_a - score_b) <= 0.01:
            return name_a if params_a <= params_b else name_b
        return name_a if score_a > score_b else name_b
    winner = occams_razor(0.92, 0.921, 10000, 100, "RF", "LR")
    print("Ex11 — Occam's Razor winner:", winner)

def ex12():
    """Learning curve: train vs val score over data size"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    sizes, train_sc, val_sc = learning_curve(
        pipe, X_cls, y_cls, cv=5, train_sizes=np.linspace(0.1, 1.0, 5), scoring="accuracy")
    for s, tr, vl in zip(sizes, train_sc.mean(axis=1), val_sc.mean(axis=1)):
        print(f"Ex12 — n={int(s)}: train={tr:.4f} val={vl:.4f}")

def ex13():
    """Validation curve: DT depth vs accuracy"""
    depths = [1, 2, 3, 5, 7, 10]
    train_sc, val_sc = validation_curve(
        DecisionTreeClassifier(random_state=42), X_cls, y_cls,
        param_name="max_depth", param_range=depths, cv=5, scoring="accuracy")
    for d, tr, vl in zip(depths, train_sc.mean(axis=1), val_sc.mean(axis=1)):
        print(f"Ex13 — depth={d}: train={tr:.4f} val={vl:.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Paired t-test: LR vs RF"""
    scores_lr = cross_val_score(Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
                                 X_cls, y_cls, cv=5)
    scores_rf = cross_val_score(RandomForestClassifier(n_estimators=100, random_state=42), X_cls, y_cls, cv=5)
    t, p = stats.ttest_rel(scores_lr, scores_rf)
    winner = "tie" if p > 0.05 else ("LR" if scores_lr.mean() > scores_rf.mean() else "RF")
    print("Ex14 — t-stat:", round(float(t), 4), "| p-val:", round(float(p), 4), "| winner:", winner)

def ex15():
    """Wilcoxon signed-rank test: LR vs RF"""
    scores_lr = cross_val_score(Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
                                 X_cls, y_cls, cv=5)
    scores_rf = cross_val_score(RandomForestClassifier(n_estimators=100, random_state=42), X_cls, y_cls, cv=5)
    try:
        stat, p = stats.wilcoxon(scores_lr, scores_rf)
        winner = "tie" if p > 0.05 else ("LR" if scores_lr.mean() > scores_rf.mean() else "RF")
        print("Ex15 — Wilcoxon stat:", round(float(stat), 4), "| p-val:", round(float(p), 4), "| winner:", winner)
    except ValueError as e:
        print("Ex15 — Wilcoxon:", e)

def ex16():
    """Regularization path: Ridge alpha vs val R²"""
    alphas = np.logspace(-3, 3, 10)
    for alpha in alphas[[0, 3, 6, 9]]:
        sc = cross_val_score(Ridge(alpha=alpha), X_reg, y_reg, cv=5, scoring="r2").mean()
        print(f"Ex16 — Ridge alpha={alpha:.4f}: val R²={sc:.4f}")

def ex17():
    """Lasso path: sparsity vs alpha"""
    for alpha in [0.001, 0.01, 0.1, 1.0]:
        m = Lasso(alpha=alpha, max_iter=5000).fit(X_reg, y_reg)
        n_nonzero = np.sum(np.abs(m.coef_) > 1e-6)
        sc = cross_val_score(Lasso(alpha=alpha, max_iter=5000), X_reg, y_reg, cv=5, scoring="r2").mean()
        print(f"Ex17 — Lasso alpha={alpha}: nonzero={n_nonzero} val R²={sc:.4f}")

def ex18():
    """Polynomial degree vs bias-variance"""
    X1d = X_reg[:, :1]
    for d in [1, 2, 3, 5, 8]:
        pipe = Pipeline([
            ("poly",   PolynomialFeatures(degree=d, include_bias=False)),
            ("scaler", StandardScaler()),
            ("model",  Ridge(alpha=1.0)),
        ])
        cv_sc = cross_val_score(pipe, X1d, y_reg, cv=5, scoring="r2").mean()
        pipe.fit(X1d, y_reg)
        train_sc = pipe.score(X1d, y_reg)
        print(f"Ex18 — degree={d}: train={train_sc:.4f} val={cv_sc:.4f}")

def ex19():
    """Feature importance for selection"""
    rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_cls, y_cls)
    top5 = [(int(i), round(float(rf.feature_importances_[i]), 4))
             for i in np.argsort(rf.feature_importances_)[::-1][:5]]
    print("Ex19 — top 5 features:", top5)

def ex20():
    """Inference latency benchmark"""
    models = {
        "LR":  Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RF":  RandomForestClassifier(n_estimators=100, random_state=42),
        "KNN": Pipeline([("sc", StandardScaler()), ("clf", KNeighborsClassifier(n_neighbors=5))]),
    }
    X_test = X_cls[:50]
    for name, m in models.items():
        m.fit(X_cls, y_cls)
        t0 = time.perf_counter()
        for _ in range(100):
            m.predict(X_test)
        elapsed = (time.perf_counter() - t0) / 100 * 1000
        print(f"Ex20 — {name} latency: {elapsed:.2f} ms")

def ex21():
    """Nested CV: unbiased generalization estimate"""
    from sklearn.model_selection import GridSearchCV
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    inner = GridSearchCV(pipe, {"clf__C": [0.1, 1, 10]}, cv=3, scoring="accuracy")
    outer_scores = cross_val_score(inner, X_cls, y_cls, cv=5, scoring="accuracy")
    print("Ex21 — nested CV:", np.round(outer_scores, 4).tolist(),
          "| mean:", round(outer_scores.mean(), 4))

def ex22():
    """Model complexity vs CV score (n_estimators)"""
    for n in [5, 20, 50, 100, 200]:
        sc = cross_val_score(RandomForestClassifier(n_estimators=n, random_state=42),
                              X_cls, y_cls, cv=5).mean()
        print(f"Ex22 — n_estimators={n}: CV={sc:.4f}")

def ex23():
    """Confidence interval for CV accuracy"""
    scores = cross_val_score(RandomForestClassifier(n_estimators=100, random_state=42),
                              X_cls, y_cls, cv=10)
    mean = scores.mean()
    se   = scores.std() / np.sqrt(len(scores))
    ci   = (round(float(mean - 1.96*se), 4), round(float(mean + 1.96*se), 4))
    print("Ex23 — CV mean:", round(float(mean), 4), "| 95% CI:", ci)

def ex24():
    """Model selection checklist"""
    checklist = [
        "1. Define metric aligned with business goal",
        "2. Establish a majority-class baseline",
        "3. Use nested CV for unbiased estimate",
        "4. Compare with statistical tests (t-test / Wilcoxon)",
        "5. Check complexity vs interpretability trade-off",
        "6. Validate on held-out test set (not used for selection)",
        "7. Verify robustness across time periods and segments",
    ]
    for item in checklist:
        print("Ex24 —", item)

def ex25():
    """Model selection report: rank models by CV score"""
    models = {
        "LR":  Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RF":  RandomForestClassifier(n_estimators=100, random_state=42),
        "DT":  DecisionTreeClassifier(random_state=42),
        "GNB": GaussianNB(),
    }
    results = sorted([(name, round(float(cross_val_score(m, X_cls, y_cls, cv=5).mean()), 4))
                       for name, m in models.items()], key=lambda x: -x[1])
    for rank, (name, sc) in enumerate(results, 1):
        print(f"Ex25 — Rank {rank}: {name:<6} CV={sc:.4f}")

def ex26():
    """Production deployment framework"""
    steps = [
        "1. Offline evaluation: nested CV, multiple metrics, statistical tests",
        "2. Shadow deployment: run new model in parallel, compare outputs",
        "3. A/B test: split live traffic, measure business KPIs",
        "4. Canary release: gradually increase traffic to new model",
        "5. Monitor post-deployment: data drift, degradation, retrain triggers",
    ]
    for step in steps:
        print("Ex26 —", step)

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """ModelSelector class: fit, rank, select best"""
    class ModelSelector:
        def __init__(self, models: dict, cv: int = 5):
            self.models = models
            self.cv = cv
            self.results_ = {}
        def fit(self, X, y):
            for name, m in self.models.items():
                sc = cross_val_score(m, X, y, cv=self.cv, scoring="accuracy")
                self.results_[name] = (round(float(sc.mean()), 4), round(float(sc.std()), 4))
            return self
        def best(self):
            return max(self.results_, key=lambda k: self.results_[k][0])
        def report(self):
            for name, (mean, std) in sorted(self.results_.items(), key=lambda x: -x[1][0]):
                print(f"  {name:<6} mean={mean:.4f} std={std:.4f}")
    selector = ModelSelector({
        "LR": Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RF": RandomForestClassifier(n_estimators=100, random_state=42),
        "DT": DecisionTreeClassifier(random_state=42),
    })
    selector.fit(X_cls, y_cls)
    print("Ex27 — Best model:", selector.best())
    selector.report()

def ex28():
    """Bias-variance polynomial analysis with plot data"""
    X1d = X_reg[:, :1]
    results = []
    for d in range(1, 9):
        pipe = Pipeline([
            ("poly", PolynomialFeatures(degree=d, include_bias=False)),
            ("sc",   StandardScaler()),
            ("m",    Ridge(alpha=1.0)),
        ])
        val = cross_val_score(pipe, X1d, y_reg, cv=5, scoring="r2").mean()
        pipe.fit(X1d, y_reg)
        train = pipe.score(X1d, y_reg)
        gap   = train - val
        results.append((d, round(train, 4), round(val, 4), round(gap, 4)))
    best_d = max(results, key=lambda x: x[2])[0]
    print("Ex28 — best degree:", best_d)
    for d, tr, vl, gap in results[:5]:
        print(f"       degree={d}: train={tr:.4f} val={vl:.4f} gap={gap:.4f}")

def ex29():
    """Cross-validated AIC/BIC for model selection"""
    n, k_base = len(y_reg), X_reg.shape[1] + 1
    for alpha in [0.001, 0.1, 10.0]:
        m = Ridge(alpha=alpha).fit(X_reg, y_reg)
        rss = float(np.sum((y_reg - m.predict(X_reg)) ** 2))
        ll  = -n / 2 * np.log(rss / n)
        aic = round(float(2 * k_base - 2 * ll), 4)
        bic = round(float(k_base * np.log(n) - 2 * ll), 4)
        cv  = round(float(cross_val_score(Ridge(alpha=alpha), X_reg, y_reg, cv=5, scoring="r2").mean()), 4)
        print(f"Ex29 — alpha={alpha}: AIC={aic} BIC={bic} CV R²={cv}")

def ex30():
    """Statistical significance heatmap: pairwise tests"""
    model_scores = {}
    for name, m in [("LR", Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])),
                     ("RF", RandomForestClassifier(n_estimators=100, random_state=42)),
                     ("DT", DecisionTreeClassifier(random_state=42))]:
        model_scores[name] = cross_val_score(m, X_cls, y_cls, cv=5)
    names = list(model_scores.keys())
    for i in range(len(names)):
        for j in range(i+1, len(names)):
            a, b = names[i], names[j]
            try:
                _, p = stats.ttest_rel(model_scores[a], model_scores[b])
                sig = "significant" if p < 0.05 else "not significant"
                print(f"Ex30 — {a} vs {b}: p={p:.4f} ({sig})")
            except Exception:
                print(f"Ex30 — {a} vs {b}: cannot test")

def ex31():
    """Regularization path with optimal alpha selection"""
    alphas = np.logspace(-3, 3, 20)
    best_alpha, best_score = None, -np.inf
    for alpha in alphas:
        sc = cross_val_score(Ridge(alpha=alpha), X_reg, y_reg, cv=5, scoring="r2").mean()
        if sc > best_score:
            best_score, best_alpha = sc, alpha
    print("Ex31 — best alpha:", round(float(best_alpha), 6),
          "| best R²:", round(float(best_score), 4))

def ex32():
    """Ensemble of CV scores for robust comparison"""
    results = {}
    for name, m in [("LR", Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])),
                     ("RF", RandomForestClassifier(n_estimators=100, random_state=42)),
                     ("GB", GradientBoostingClassifier(n_estimators=50, random_state=42))]:
        all_scores = [cross_val_score(m, X_cls, y_cls, cv=5).mean() for _ in range(3)]
        results[name] = round(float(np.mean(all_scores)), 4)
    ranked = sorted(results.items(), key=lambda x: -x[1])
    print("Ex32 — stable ranking:", ranked)

def ex33():
    """Learning efficiency: accuracy per training sample"""
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    sizes, _, val_sc = learning_curve(pipe, X_cls, y_cls, cv=5,
                                       train_sizes=np.linspace(0.1, 1.0, 5))
    efficiency = [(int(s), round(float(v), 4)) for s, v in zip(sizes, val_sc.mean(axis=1))]
    print("Ex33 — learning efficiency (n, val_acc):", efficiency)

def ex34():
    """Multi-metric model evaluation"""
    from sklearn.model_selection import cross_validate
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    cv_res = cross_validate(pipe, X_cls, y_cls, cv=5,
                             scoring=["accuracy", "f1", "roc_auc"])
    for metric in ["test_accuracy", "test_f1", "test_roc_auc"]:
        print(f"Ex34 — {metric}: {cv_res[metric].mean():.4f} ± {cv_res[metric].std():.4f}")

def ex35():
    """Model selection under distribution shift (time-split)"""
    from sklearn.model_selection import TimeSeriesSplit
    tscv = TimeSeriesSplit(n_splits=5)
    for name, m in [("LR", Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])),
                     ("RF", RandomForestClassifier(n_estimators=100, random_state=42))]:
        sc = cross_val_score(m, X_cls, y_cls, cv=tscv, scoring="accuracy")
        print(f"Ex35 — {name} time-series CV: {sc.mean():.4f} ± {sc.std():.4f}")

def ex36():
    """Calibration check: Brier score"""
    from sklearn.calibration import CalibratedClassifierCV
    from sklearn.metrics import brier_score_loss
    from sklearn.model_selection import train_test_split
    X_tr, X_te, y_tr, y_te = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    for name, m in [("RF_uncal", RandomForestClassifier(n_estimators=100, random_state=42)),
                     ("RF_cal",   CalibratedClassifierCV(RandomForestClassifier(n_estimators=100, random_state=42), cv=5))]:
        m.fit(X_tr, y_tr)
        proba = m.predict_proba(X_te)[:, 1]
        bs = brier_score_loss(y_te, proba)
        print(f"Ex36 — {name} Brier score: {bs:.4f} (lower=better)")

def ex37():
    """Model selection with fairness constraint"""
    from sklearn.model_selection import train_test_split
    X_tr, X_te, y_tr, y_te = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    # Simulate group membership
    group = (X_te[:, 0] > 0).astype(int)
    results = {}
    for name, m in [("LR", Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])),
                     ("RF", RandomForestClassifier(n_estimators=100, random_state=42))]:
        m.fit(X_tr, y_tr)
        preds = m.predict(X_te)
        acc_g0 = float(np.mean(preds[group==0] == y_te[group==0]))
        acc_g1 = float(np.mean(preds[group==1] == y_te[group==1]))
        results[name] = {"acc_g0": round(acc_g0, 4), "acc_g1": round(acc_g1, 4),
                          "gap": round(abs(acc_g0 - acc_g1), 4)}
    print("Ex37 — fairness metrics:", results)

def ex38():
    """Pareto frontier: accuracy vs model size"""
    models = [
        ("NB",     GaussianNB(),            0),
        ("LR",     Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]), 10),
        ("DT_3",   DecisionTreeClassifier(max_depth=3, random_state=42), 100),
        ("DT_10",  DecisionTreeClassifier(max_depth=10, random_state=42), 1023),
        ("RF_50",  RandomForestClassifier(n_estimators=50, random_state=42), 50000),
        ("RF_100", RandomForestClassifier(n_estimators=100, random_state=42), 100000),
    ]
    results = []
    for name, m, size in models:
        sc = cross_val_score(m, X_cls, y_cls, cv=5).mean()
        results.append((name, round(float(sc), 4), size))
    results.sort(key=lambda x: x[2])
    print("Ex38 — accuracy vs model size (name, acc, n_params):")
    for name, acc, sz in results:
        print(f"       {name}: acc={acc:.4f} size={sz}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Bayesian model comparison via cross-validated log-likelihood"""
    from sklearn.model_selection import cross_val_predict
    from sklearn.metrics import log_loss
    models = {
        "LR":  Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RF":  RandomForestClassifier(n_estimators=100, random_state=42),
        "GNB": GaussianNB(),
    }
    for name, m in models.items():
        probas = cross_val_predict(m, X_cls, y_cls, cv=5, method="predict_proba")
        ll = -log_loss(y_cls, probas)
        print(f"Ex39 — {name} CV log-likelihood: {ll:.4f}")

def ex40():
    """Progressive model selection: start simple, test complex"""
    from sklearn.model_selection import train_test_split
    X_tr, X_te, y_tr, y_te = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    pipeline = [
        ("Baseline", lambda: max(y_tr.mean(), 1-y_tr.mean())),
        ("LR",    lambda: Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]).fit(X_tr, y_tr).score(X_te, y_te)),
        ("DT_3",  lambda: DecisionTreeClassifier(max_depth=3, random_state=42).fit(X_tr, y_tr).score(X_te, y_te)),
        ("RF_50", lambda: RandomForestClassifier(n_estimators=50, random_state=42).fit(X_tr, y_tr).score(X_te, y_te)),
    ]
    prev_score = 0
    for name, fn in pipeline:
        score = fn()
        delta = score - prev_score
        print(f"Ex40 — {name}: {score:.4f} (Δ={delta:+.4f})")
        prev_score = score

def ex41():
    """Sample efficiency analysis across dataset sizes"""
    from sklearn.model_selection import train_test_split
    sizes = [50, 100, 150, 200, 250]
    lr = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    for n in sizes:
        X_sub, _, y_sub, _ = train_test_split(X_cls, y_cls, train_size=n, random_state=42)
        lr_sc = cross_val_score(lr, X_sub, y_sub, cv=min(5, n//10) or 2).mean()
        rf_sc = cross_val_score(rf, X_sub, y_sub, cv=min(5, n//10) or 2).mean()
        print(f"Ex41 — n={n}: LR={lr_sc:.4f} RF={rf_sc:.4f}")

def ex42():
    """Hyperparameter sensitivity analysis"""
    param_grid = {"n_estimators": [10, 50, 100, 200],
                   "max_depth":    [None, 3, 5, 10]}
    best, best_sc = None, 0
    for n in param_grid["n_estimators"]:
        for d in param_grid["max_depth"]:
            m  = RandomForestClassifier(n_estimators=n, max_depth=d, random_state=42)
            sc = cross_val_score(m, X_cls, y_cls, cv=5).mean()
            if sc > best_sc:
                best_sc, best = sc, (n, d)
    print("Ex42 — best params (n, depth):", best, "| CV score:", round(float(best_sc), 4))

def ex43():
    """Stratified vs regular CV on imbalanced data"""
    from sklearn.datasets import make_classification as mc
    from sklearn.model_selection import StratifiedKFold, KFold
    Xi, yi = mc(n_samples=300, weights=[0.9, 0.1], random_state=42, n_features=10, n_informative=5)
    m = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    sc_strat = cross_val_score(m, Xi, yi, cv=StratifiedKFold(n_splits=5), scoring="f1").mean()
    sc_rand  = cross_val_score(m, Xi, yi, cv=KFold(n_splits=5), scoring="f1").mean()
    print("Ex43 — stratified CV F1:", round(sc_strat, 4),
          "| regular CV F1:", round(sc_rand, 4))

def ex44():
    """Automated model selection pipeline"""
    from sklearn.model_selection import GridSearchCV
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    gs = GridSearchCV(pipe, {"clf__C": [0.01, 0.1, 1, 10, 100]}, cv=5, scoring="accuracy")
    gs.fit(X_cls, y_cls)
    print("Ex44 — best C:", gs.best_params_["clf__C"],
          "| best CV score:", round(gs.best_score_, 4))

def ex45():
    """Stochastic model comparison (multiple seeds)"""
    lr_scores = []
    rf_scores = []
    for seed in range(5):
        Xi, yi = make_classification(n_samples=300, n_features=10, random_state=seed)
        lr = cross_val_score(Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
                              Xi, yi, cv=5).mean()
        rf = cross_val_score(RandomForestClassifier(n_estimators=100, random_state=seed), Xi, yi, cv=5).mean()
        lr_scores.append(lr); rf_scores.append(rf)
    print("Ex45 — LR mean:", round(float(np.mean(lr_scores)), 4),
          "| RF mean:", round(float(np.mean(rf_scores)), 4))

def ex46():
    """Model selection for deployment: accuracy + latency score"""
    from sklearn.model_selection import train_test_split
    X_tr, X_te, y_tr, y_te = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    candidates = {
        "LR":  Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RF":  RandomForestClassifier(n_estimators=100, random_state=42),
        "GNB": GaussianNB(),
    }
    for name, m in candidates.items():
        m.fit(X_tr, y_tr)
        acc = m.score(X_te, y_te)
        t0  = time.perf_counter()
        for _ in range(200):
            m.predict(X_te[:10])
        latency = (time.perf_counter() - t0) / 200 * 1000
        # Combined score: penalize latency > 1ms
        combined = acc - 0.1 * max(0, latency - 1.0)
        print(f"Ex46 — {name}: acc={acc:.4f} latency={latency:.2f}ms combined={combined:.4f}")

def ex47():
    """Bayesian optimisation simulation (random search for demonstration)"""
    rng = np.random.default_rng(42)
    best_score, best_params = 0, {}
    for _ in range(20):
        C    = float(10 ** rng.uniform(-3, 3))
        pipe = Pipeline([("sc", StandardScaler()),
                          ("clf", LogisticRegression(C=C, max_iter=1000))])
        sc   = cross_val_score(pipe, X_cls, y_cls, cv=5).mean()
        if sc > best_score:
            best_score, best_params = sc, {"C": round(C, 6)}
    print("Ex47 — best C:", best_params["C"], "| CV score:", round(float(best_score), 4))

def ex48():
    """Model selection report with confidence intervals"""
    models = {
        "LR": Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
        "RF": RandomForestClassifier(n_estimators=100, random_state=42),
        "DT": DecisionTreeClassifier(random_state=42),
    }
    report = []
    for name, m in models.items():
        sc = cross_val_score(m, X_cls, y_cls, cv=10)
        mean = sc.mean()
        ci_w = 1.96 * sc.std() / np.sqrt(len(sc))
        report.append((name, round(float(mean), 4),
                        (round(float(mean - ci_w), 4), round(float(mean + ci_w), 4))))
    report.sort(key=lambda x: -x[1])
    print("Ex48 — Model selection report (sorted by CV mean):")
    for name, mean, ci in report:
        print(f"       {name}: mean={mean:.4f} 95%CI={ci}")

def ex49():
    """Shadow deployment: run A and B in parallel, compare on same data"""
    from sklearn.model_selection import train_test_split
    X_tr, X_te, y_tr, y_te = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    model_a = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    model_b = RandomForestClassifier(n_estimators=100, random_state=42)
    model_a.fit(X_tr, y_tr)
    model_b.fit(X_tr, y_tr)
    pred_a = model_a.predict(X_te)
    pred_b = model_b.predict(X_te)
    acc_a = float(np.mean(pred_a == y_te))
    acc_b = float(np.mean(pred_b == y_te))
    agreement = float(np.mean(pred_a == pred_b))
    print("Ex49 — shadow deploy A acc:", round(acc_a, 4),
          "| B acc:", round(acc_b, 4),
          "| agreement:", round(agreement, 4))

def ex50():
    """Production model selection: full workflow"""
    from sklearn.model_selection import train_test_split, GridSearchCV
    from sklearn.metrics import accuracy_score, roc_auc_score
    # 1. Split data
    X_tr, X_te, y_tr, y_te = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    # 2. Nested CV for candidate selection
    candidates = {
        "LR": (Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]),
                {"clf__C": [0.1, 1, 10]}),
        "RF": (RandomForestClassifier(random_state=42),
                {"n_estimators": [50, 100], "max_depth": [None, 5]}),
    }
    best_name, best_inner = "", None
    best_nested_score = 0.0
    for name, (m, params) in candidates.items():
        gs = GridSearchCV(m, params, cv=5, scoring="accuracy", refit=True)
        outer = cross_val_score(gs, X_tr, y_tr, cv=5, scoring="accuracy")
        print(f"Ex50 — {name} nested CV: {outer.mean():.4f} ± {outer.std():.4f}")
        if outer.mean() > best_nested_score:
            best_nested_score = outer.mean()
            best_name = name
            best_inner = GridSearchCV(m, params, cv=5, scoring="accuracy", refit=True)
    # 3. Final model: fit on all training data
    best_inner.fit(X_tr, y_tr)
    acc  = accuracy_score(y_te, best_inner.predict(X_te))
    auc  = roc_auc_score(y_te, best_inner.predict_proba(X_te)[:, 1])
    print(f"Ex50 — Winner: {best_name} | test acc={acc:.4f} | AUC={auc:.4f}")


def main():
    print("=" * 60)
    print("Examples 5.4 — Model Selection")
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
