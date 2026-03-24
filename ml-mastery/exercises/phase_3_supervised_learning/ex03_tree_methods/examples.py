# ============================================================
# Examples 3.3 — Tree-Based Methods (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, export_text
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    ExtraTreesClassifier, GradientBoostingClassifier,
    GradientBoostingRegressor, AdaBoostClassifier
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import (
    train_test_split, cross_val_score, GridSearchCV, learning_curve
)
from sklearn.datasets import make_classification, make_regression, load_breast_cancer, load_iris
from sklearn.metrics import accuracy_score, r2_score, f1_score
from sklearn.inspection import partial_dependence
from sklearn.impute import SimpleImputer

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """DecisionTreeClassifier fit + predict"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = DecisionTreeClassifier(random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex01 — DTree accuracy: {acc:.4f}")

def ex02():
    """Tree depth effect (max_depth = 1, 2, 3, 5, None)"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for d in [1, 2, 3, 5, None]:
        acc = DecisionTreeClassifier(max_depth=d, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex02 — max_depth={d}: accuracy={acc:.4f}")

def ex03():
    """Feature importance from tree"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    tree = DecisionTreeClassifier(random_state=0).fit(X, y)
    imp = tree.feature_importances_
    print(f"Ex03 — Feature importances: {np.round(imp, 3)}")

def ex04():
    """DecisionTreeRegressor"""
    X, y = make_regression(n_samples=200, n_features=4, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    r2 = DecisionTreeRegressor(max_depth=4, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex04 — DTreeRegressor R²: {r2:.4f}")

def ex05():
    """Gini vs entropy criterion"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for crit in ["gini", "entropy"]:
        acc = DecisionTreeClassifier(criterion=crit, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex05 — criterion={crit}: accuracy={acc:.4f}")

def ex06():
    """min_samples_split effect"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for mss in [2, 10, 20, 50]:
        acc = DecisionTreeClassifier(min_samples_split=mss, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex06 — min_samples_split={mss}: accuracy={acc:.4f}")

def ex07():
    """min_samples_leaf effect"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for msl in [1, 5, 10, 20]:
        acc = DecisionTreeClassifier(min_samples_leaf=msl, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex07 — min_samples_leaf={msl}: accuracy={acc:.4f}")

def ex08():
    """Tree visualization (export_text)"""
    X, y = load_iris(return_X_y=True)
    tree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X, y)
    rules = export_text(tree, feature_names=load_iris().feature_names)
    print("Ex08 — Tree rules (first 6 lines):")
    for line in rules.split("\n")[:6]:
        print(f"  {line}")

def ex09():
    """RandomForestClassifier"""
    X, y = make_classification(n_samples=300, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex09 — RandomForest accuracy: {acc:.4f}")

def ex10():
    """RF feature importance"""
    X, y = make_classification(n_samples=300, n_features=8, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X, y)
    imp = rf.feature_importances_
    ranked = np.argsort(imp)[::-1]
    print(f"Ex10 — RF top-3 features: {ranked[:3].tolist()}, importances: {np.round(imp[ranked[:3]], 3)}")

def ex11():
    """RF n_estimators effect"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for n in [10, 50, 100, 200]:
        acc = RandomForestClassifier(n_estimators=n, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex11 — n_estimators={n}: accuracy={acc:.4f}")

def ex12():
    """OOB score"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, oob_score=True, random_state=0).fit(X, y)
    print(f"Ex12 — RF OOB score: {rf.oob_score_:.4f}")

def ex13():
    """ExtraTreesClassifier"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = ExtraTreesClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex13 — ExtraTrees accuracy: {acc:.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """GradientBoostingClassifier"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = GradientBoostingClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex14 — GBM accuracy: {acc:.4f}")

def ex15():
    """Learning rate effect on GBM"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for lr in [0.01, 0.05, 0.1, 0.5, 1.0]:
        acc = GradientBoostingClassifier(learning_rate=lr, n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex15 — lr={lr}: accuracy={acc:.4f}")

def ex16():
    """n_estimators vs learning_rate tradeoff"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    configs = [(50, 0.2), (100, 0.1), (200, 0.05), (500, 0.02)]
    for n, lr in configs:
        acc = GradientBoostingClassifier(n_estimators=n, learning_rate=lr, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex16 — n={n}, lr={lr}: accuracy={acc:.4f}")

def ex17():
    """Subsample effect (stochastic GBM)"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for ss in [0.5, 0.75, 1.0]:
        acc = GradientBoostingClassifier(subsample=ss, n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex17 — subsample={ss}: accuracy={acc:.4f}")

def ex18():
    """GBM feature importance"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    gbm = GradientBoostingClassifier(n_estimators=100, random_state=0).fit(X, y)
    imp = gbm.feature_importances_
    print(f"Ex18 — GBM feature importances: {np.round(imp, 3)}")

def ex19():
    """XGBoost (try/except)"""
    try:
        from xgboost import XGBClassifier
        X, y = make_classification(n_samples=300, n_features=6, random_state=0)
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
        acc = XGBClassifier(n_estimators=100, random_state=0, eval_metric="logloss", verbosity=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex19 — XGBoost accuracy: {acc:.4f}")
    except ImportError:
        print("Ex19 — XGBoost not installed; using sklearn GBM instead")
        X, y = make_classification(n_samples=300, n_features=6, random_state=0)
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
        acc = GradientBoostingClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex19 — sklearn GBM accuracy: {acc:.4f}")

def ex20():
    """LightGBM (try/except)"""
    try:
        import lightgbm as lgb
        X, y = make_classification(n_samples=300, n_features=6, random_state=0)
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
        clf = lgb.LGBMClassifier(n_estimators=100, random_state=0, verbose=-1).fit(X_tr, y_tr)
        acc = clf.score(X_te, y_te)
        print(f"Ex20 — LightGBM accuracy: {acc:.4f}")
    except ImportError:
        print("Ex20 — LightGBM not installed; using ExtraTrees instead")
        X, y = make_classification(n_samples=300, n_features=6, random_state=0)
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
        acc = ExtraTreesClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex20 — ExtraTrees accuracy: {acc:.4f}")

def ex21():
    """CatBoost concept (print)"""
    print("Ex21 — CatBoost key concepts:")
    print("  - Ordered boosting: avoids prediction shift/target leakage")
    print("  - Native categorical handling: target statistics per category")
    print("  - Symmetric trees: all nodes at same depth split on same feature")
    print("  - Usage: CatBoostClassifier(iterations=100).fit(X, y, cat_features=[...])")

def ex22():
    """Early stopping for GBM"""
    X, y = make_classification(n_samples=500, n_features=6, random_state=0)
    X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=0)
    gbm = GradientBoostingClassifier(n_estimators=200, random_state=0)
    gbm.fit(X_tr, y_tr)
    staged_accs = [accuracy_score(y_val, pred) for pred in gbm.staged_predict(X_val)]
    best_n = int(np.argmax(staged_accs) + 1)
    print(f"Ex22 — Early stopping: best n_estimators={best_n}, val acc={max(staged_accs):.4f}")

def ex23():
    """Tree depth vs overfitting (train/test curve)"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for d in [1, 3, 5, 7, None]:
        tr_acc = DecisionTreeClassifier(max_depth=d, random_state=0).fit(X_tr, y_tr).score(X_tr, y_tr)
        te_acc = DecisionTreeClassifier(max_depth=d, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex23 — depth={d}: train={tr_acc:.3f}, test={te_acc:.3f}")

def ex24():
    """Feature selection via tree importance"""
    X, y = make_classification(n_samples=300, n_features=20, n_informative=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr)
    top5 = np.argsort(rf.feature_importances_)[-5:]
    acc_all = rf.score(X_te, y_te)
    acc_top5 = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_tr[:, top5], y_tr).score(X_te[:, top5], y_te)
    print(f"Ex24 — All features acc={acc_all:.4f}, Top-5 acc={acc_top5:.4f}")

def ex25():
    """Tree models on imbalanced data (class_weight)"""
    X, y = make_classification(n_samples=300, n_features=5, weights=[0.9, 0.1], random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for cw in [None, "balanced"]:
        f1 = f1_score(y_te, RandomForestClassifier(n_estimators=100, class_weight=cw, random_state=0).fit(X_tr, y_tr).predict(X_te))
        print(f"Ex25 — class_weight={cw}: F1={f1:.4f}")

def ex26():
    """Cross-validated tree comparison"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    models = {
        "DTree": DecisionTreeClassifier(max_depth=5, random_state=0),
        "RF": RandomForestClassifier(n_estimators=50, random_state=0),
        "GBM": GradientBoostingClassifier(n_estimators=50, random_state=0),
    }
    for name, m in models.items():
        sc = cross_val_score(m, X, y, cv=5)
        print(f"Ex26 — {name} CV: {sc.mean():.4f} ± {sc.std():.4f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """DecisionTreeFromScratch class (binary split, gini)"""
    class DecisionTreeFromScratch:
        def _gini(self, y):
            if len(y) == 0: return 0
            classes, counts = np.unique(y, return_counts=True)
            p = counts / len(y)
            return 1 - np.sum(p**2)
        def _best_split(self, X, y):
            best_gain, best_feat, best_val = -1, 0, 0
            g_parent = self._gini(y)
            for f in range(X.shape[1]):
                for val in np.unique(X[:, f]):
                    left = y[X[:, f] <= val]; right = y[X[:, f] > val]
                    if len(left) == 0 or len(right) == 0: continue
                    gain = g_parent - (len(left)/len(y)*self._gini(left) + len(right)/len(y)*self._gini(right))
                    if gain > best_gain:
                        best_gain, best_feat, best_val = gain, f, val
            return best_feat, best_val
        def fit(self, X, y, depth=0):
            if depth >= 3 or len(np.unique(y)) == 1:
                vals, cnts = np.unique(y, return_counts=True)
                self.leaf_val = vals[np.argmax(cnts)]; return self
            f, v = self._best_split(X, y)
            self.split_feat, self.split_val = f, v
            l_idx = X[:, f] <= v; r_idx = ~l_idx
            self.left = DecisionTreeFromScratch().fit(X[l_idx], y[l_idx], depth+1)
            self.right = DecisionTreeFromScratch().fit(X[r_idx], y[r_idx], depth+1)
            return self
        def predict_one(self, x):
            if hasattr(self, "leaf_val"): return self.leaf_val
            if x[self.split_feat] <= self.split_val: return self.left.predict_one(x)
            return self.right.predict_one(x)
        def predict(self, X):
            return np.array([self.predict_one(x) for x in X])

    X, y = make_classification(n_samples=100, n_features=4, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    tree = DecisionTreeFromScratch().fit(X_tr, y_tr)
    print(f"Ex27 — DTree from scratch accuracy: {accuracy_score(y_te, tree.predict(X_te)):.4f}")

def ex28():
    """RandomForestFromScratch class (bagging + trees)"""
    class RandomForestFromScratch:
        def __init__(self, n_trees=10, random_state=0):
            self.n_trees, self.rng = n_trees, np.random.default_rng(random_state)
        def fit(self, X, y):
            self.trees_ = []
            for _ in range(self.n_trees):
                idx = self.rng.integers(0, len(X), len(X))
                tree = DecisionTreeClassifier(max_depth=4, random_state=int(self.rng.integers(0, 10000)))
                tree.fit(X[idx], y[idx])
                self.trees_.append(tree)
            return self
        def predict(self, X):
            votes = np.array([t.predict(X) for t in self.trees_])
            return np.apply_along_axis(lambda x: np.bincount(x).argmax(), 0, votes)

    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    rf = RandomForestFromScratch(n_trees=20).fit(X_tr, y_tr)
    print(f"Ex28 — RF from scratch accuracy: {accuracy_score(y_te, rf.predict(X_te)):.4f}")

def ex29():
    """GradientBoostingFromScratch class (residual fitting, 3 iterations)"""
    class GradientBoostingFromScratch:
        def __init__(self, n_estimators=3, lr=0.5):
            self.n_estimators, self.lr = n_estimators, lr
        def fit(self, X, y):
            self.F0_ = y.mean()
            self.trees_ = []
            F = np.full(len(y), self.F0_)
            for _ in range(self.n_estimators):
                residuals = y - F
                tree = DecisionTreeRegressor(max_depth=2, random_state=0)
                tree.fit(X, residuals)
                F += self.lr * tree.predict(X)
                self.trees_.append(tree)
            return self
        def predict(self, X):
            F = np.full(len(X), self.F0_)
            for tree in self.trees_:
                F += self.lr * tree.predict(X)
            return F

    X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    gbm = GradientBoostingFromScratch(n_estimators=50, lr=0.1).fit(X_tr, y_tr)
    print(f"Ex29 — GBM from scratch R²: {r2_score(y_te, gbm.predict(X_te)):.4f}")

def ex30():
    """TreeEnsembleComparator class"""
    class TreeEnsembleComparator:
        def __init__(self):
            self.models = {
                "DTree": DecisionTreeClassifier(max_depth=5, random_state=0),
                "RF": RandomForestClassifier(n_estimators=100, random_state=0),
                "ET": ExtraTreesClassifier(n_estimators=100, random_state=0),
                "GBM": GradientBoostingClassifier(n_estimators=100, random_state=0),
            }
        def compare(self, X_tr, y_tr, X_te, y_te):
            return {name: m.fit(X_tr, y_tr).score(X_te, y_te) for name, m in self.models.items()}

    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    comp = TreeEnsembleComparator()
    results = comp.compare(X_tr, y_tr, X_te, y_te)
    print(f"Ex30 — Ensemble comparison: { {k: round(v, 4) for k, v in results.items()} }")

def ex31():
    """FeatureImportanceAggregator class (across multiple trees)"""
    class FeatureImportanceAggregator:
        def __init__(self, models):
            self.models = models
        def aggregate(self, X, y):
            all_imp = []
            for m in self.models:
                m.fit(X, y)
                all_imp.append(m.feature_importances_)
            return np.mean(all_imp, axis=0)

    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    models = [
        RandomForestClassifier(n_estimators=50, random_state=0),
        ExtraTreesClassifier(n_estimators=50, random_state=0),
        GradientBoostingClassifier(n_estimators=50, random_state=0),
    ]
    agg = FeatureImportanceAggregator(models)
    avg_imp = agg.aggregate(X, y)
    print(f"Ex31 — Aggregated importances: {np.round(avg_imp, 3)}")

def ex32():
    """TreeDepthAnalyzer class"""
    class TreeDepthAnalyzer:
        def __init__(self, depths):
            self.depths = depths
        def analyze(self, X_tr, y_tr, X_te, y_te):
            results = {}
            for d in self.depths:
                tree = DecisionTreeClassifier(max_depth=d, random_state=0)
                tree.fit(X_tr, y_tr)
                results[d] = {"train": tree.score(X_tr, y_tr), "test": tree.score(X_te, y_te)}
            return results

    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    analyzer = TreeDepthAnalyzer([1, 3, 5, 10, None])
    results = analyzer.analyze(X_tr, y_tr, X_te, y_te)
    for d, sc in results.items():
        print(f"Ex32 — depth={d}: train={sc['train']:.3f}, test={sc['test']:.3f}")

def ex33():
    """Full tree pipeline (preprocess + fit + evaluate)"""
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
    pipe = Pipeline([
        ("imputer", SimpleImputer()),
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(n_estimators=100, random_state=0))
    ])
    pipe.fit(X_tr, y_tr)
    print(f"Ex33 — Full tree pipeline acc: {pipe.score(X_te, y_te):.4f}")

def ex34():
    """Hyperparameter tuning (GridSearchCV for RF)"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    param_grid = {"n_estimators": [50, 100], "max_depth": [3, 5, None]}
    gs = GridSearchCV(RandomForestClassifier(random_state=0), param_grid, cv=3)
    gs.fit(X_tr, y_tr)
    print(f"Ex34 — Best RF params: {gs.best_params_}, test acc: {gs.score(X_te, y_te):.4f}")

def ex35():
    """Partial dependence data"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X, y)
    pd_result = partial_dependence(rf, X, features=[0], grid_resolution=5)
    pd_values = pd_result["average"][0]
    grid_vals = pd_result["grid_values"][0]
    print(f"Ex35 — Partial dependence feature 0:")
    for g, v in zip(np.round(grid_vals, 2), np.round(pd_values, 3)):
        print(f"  x={g}: pd={v}")

def ex36():
    """Tree model interpretability (rules extraction)"""
    X, y = load_iris(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    tree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X_tr, y_tr)
    rules = export_text(tree, feature_names=load_iris().feature_names)
    print(f"Ex36 — Tree rules:\n{rules}")
    print(f"  accuracy={tree.score(X_te, y_te):.4f}")

def ex37():
    """Tree model calibration"""
    from sklearn.calibration import CalibratedClassifierCV
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    base = DecisionTreeClassifier(max_depth=5, random_state=0)
    cal = CalibratedClassifierCV(base, cv=3, method="isotonic").fit(X_tr, y_tr)
    probs = cal.predict_proba(X_te)[:, 1]
    from sklearn.metrics import roc_auc_score
    print(f"Ex37 — Calibrated DTree ROC-AUC: {roc_auc_score(y_te, probs):.4f}")

def ex38():
    """Production tree model pipeline"""
    class ProductionTreeModel:
        def __init__(self):
            self.pipeline_ = Pipeline([
                ("imputer", SimpleImputer()),
                ("clf", RandomForestClassifier(n_estimators=100, random_state=0))
            ])
            self.is_fitted_ = False
        def train(self, X, y):
            self.pipeline_.fit(X, y); self.is_fitted_ = True
        def predict(self, X):
            if not self.is_fitted_: raise RuntimeError("Not fitted")
            return self.pipeline_.predict(X)
        def feature_importance(self, X, y):
            self.pipeline_.fit(X, y)
            return self.pipeline_.named_steps["clf"].feature_importances_

    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = ProductionTreeModel(); model.train(X_tr, y_tr)
    print(f"Ex38 — Production RF acc: {accuracy_score(y_te, model.predict(X_te)):.4f}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Oblique decision trees concept"""
    print("Ex39 — Oblique Decision Trees:")
    print("  - Standard trees split on one feature at a time (axis-aligned)")
    print("  - Oblique trees split on linear combinations: w·x <= threshold")
    print("  - Benefits: fewer nodes for rotated/diagonal boundaries")
    print("  - sklearn: no built-in; use sklearn-oblique-tree or implement custom")
    print("  - Key: solve small linear problem at each node for w weights")

def ex40():
    """Soft decision trees concept"""
    print("Ex40 — Soft Decision Trees:")
    print("  - Standard trees: hard routing (each sample → exactly one leaf)")
    print("  - Soft trees: probabilistic routing (each sample → all leaves)")
    print("  - Each internal node has sigmoid gate: sigma(w·x + b)")
    print("  - Leaf prediction weighted by routing probability product")
    print("  - Benefits: differentiable end-to-end, trainable by gradient descent")

def ex41():
    """Neural oblivious decision trees concept"""
    print("Ex41 — Neural Oblivious Decision Trees (NODE):")
    print("  - Oblivious trees: all nodes at same depth use same split feature")
    print("  - NODE: differentiable oblivious trees as building blocks")
    print("  - Uses entmax for sparse, differentiable split choices")
    print("  - Achieves gradient-boosting-like performance on tabular data")
    print("  - Available in PyTorch via the 'node' library (ICLR 2020)")

def ex42():
    """Monotone constraints in trees"""
    X, y = make_regression(n_samples=300, n_features=3, noise=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    gbm_mono = GradientBoostingRegressor(
        n_estimators=100, random_state=0,
        monotone_cst=[1, 0, -1]
    ).fit(X_tr, y_tr)
    r2 = gbm_mono.score(X_te, y_te)
    print(f"Ex42 — GBM with monotone constraints R²: {r2:.4f}")
    print("  Feature 0: increasing (+1), Feature 1: unconstrained (0), Feature 2: decreasing (-1)")

def ex43():
    """Interaction constraints in XGBoost (concept + sklearn fallback)"""
    try:
        from xgboost import XGBClassifier
        X, y = make_classification(n_samples=300, n_features=6, random_state=0)
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
        clf = XGBClassifier(
            n_estimators=100, random_state=0,
            interaction_constraints="[[0,1],[2,3],[4,5]]",
            eval_metric="logloss", verbosity=0
        ).fit(X_tr, y_tr)
        print(f"Ex43 — XGB interaction constraints acc: {clf.score(X_te, y_te):.4f}")
    except ImportError:
        print("Ex43 — XGBoost not installed. Interaction constraints concept:")
        print("  - Restrict which feature pairs can appear together in a tree path")
        print("  - interaction_constraints=[[0,1],[2,3]] means:")
        print("    features 0,1 can interact; features 2,3 can interact")
        print("  - Prevents spurious interactions; improves interpretability")

def ex44():
    """Tree SHAP values concept (print pattern)"""
    print("Ex44 — Tree SHAP Values:")
    print("  SHAP: SHapley Additive exPlanations — model-agnostic feature attribution")
    print("  TreeSHAP: polynomial-time exact SHAP for trees (Lundberg et al., 2018)")
    print("  Usage:")
    print("    import shap")
    print("    explainer = shap.TreeExplainer(rf_model)")
    print("    shap_values = explainer.shap_values(X_test)")
    print("    shap.summary_plot(shap_values, X_test)")
    print("  Properties: local + global, consistent, handles feature interactions")

def ex45():
    """Global surrogate model (tree explaining a GBM)"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    gbm = GradientBoostingClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr)
    gbm_preds = gbm.predict(X_tr)
    surrogate = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X_tr, gbm_preds)
    fidelity = accuracy_score(gbm_preds, surrogate.predict(X_tr))
    test_acc = accuracy_score(y_te, gbm.predict(X_te))
    print(f"Ex45 — Surrogate fidelity: {fidelity:.4f}, GBM test acc: {test_acc:.4f}")

def ex46():
    """Counterfactual explanation (tree-based)"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    tree = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X, y)
    sample = X[0:1]
    original_pred = tree.predict(sample)[0]
    decision_path = tree.decision_path(sample)
    feature_path = []
    for node_id in decision_path.indices:
        if tree.tree_.feature[node_id] >= 0:
            feature_path.append(tree.tree_.feature[node_id])
    print(f"Ex46 — Sample pred={original_pred}, decision path features={feature_path}")
    print(f"  Counterfactual: flip leaf by changing feature {feature_path[-1] if feature_path else 'N/A'}")

def ex47():
    """Model compression (distill RF into a decision tree)"""
    X, y = make_classification(n_samples=500, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr)
    soft_labels = rf.predict_proba(X_tr)[:, 1]
    hard_distill = (soft_labels >= 0.5).astype(int)
    student = DecisionTreeClassifier(max_depth=5, random_state=0).fit(X_tr, hard_distill)
    teacher_acc = rf.score(X_te, y_te)
    student_acc = student.score(X_te, y_te)
    print(f"Ex47 — Teacher (RF) acc={teacher_acc:.4f}, Student (DTree) acc={student_acc:.4f}")

def ex48():
    """Tree models for time series (lag features + RF)"""
    rng = np.random.default_rng(0)
    n = 300
    t = np.arange(n)
    signal = np.sin(t * 0.1) + rng.standard_normal(n) * 0.2
    lags = 5
    X_ts = np.array([signal[i:n-lags+i] for i in range(lags)]).T
    y_ts = signal[lags:]
    X_tr, X_te, y_tr, y_te = train_test_split(X_ts, y_ts, test_size=0.2, shuffle=False)
    r2 = RandomForestRegressor(n_estimators=100, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex48 — RF on time series (lag features) R²: {r2:.4f}")

def ex49():
    """Tree models for ranking (LambdaRank concept)"""
    print("Ex49 — Tree Models for Ranking (LambdaRank):")
    print("  - Learning to rank: predict relevance order, not absolute values")
    print("  - LambdaRank: GBM where gradients are lambda_ij (pairwise swap impact)")
    print("  - lambda_ij = |ΔnDCG_ij| * sigmoid(score_j - score_i)")
    print("  - LambdaMART: LambdaRank + MART (Multiple Additive Regression Trees)")
    print("  - XGBoost: objective='rank:ndcg' implements LambdaRank natively")
    X, y = make_regression(n_samples=100, n_features=5, noise=5, random_state=0)
    r2 = GradientBoostingRegressor(n_estimators=50, random_state=0).fit(X, y).score(X, y)
    print(f"  Surrogate R²: {r2:.4f}")

def ex50():
    """Production gradient boosting checklist"""
    checklist = [
        "1. Feature engineering: target encoding, lag features, ratios",
        "2. Hyperparameters: learning_rate ↓, n_estimators ↑, max_depth=3-8",
        "3. Regularization: min_child_weight, reg_alpha, reg_lambda, subsample",
        "4. Early stopping: hold out 10-20%, stop when val loss stops improving",
        "5. Feature importance: permutation + SHAP for stable rankings",
        "6. Monotone constraints: enforce business logic in feature relationships",
        "7. Cross-validation: StratifiedKFold or TimeSeriesSplit",
        "8. Calibration: isotonic/Platt if probabilities needed",
        "9. Model serialization: joblib/pickle, version with model metadata",
        "10. Monitoring: prediction drift, feature drift, performance decay",
    ]
    print("Ex50 — Production GBM Checklist:")
    for item in checklist:
        print(f"  {item}")


def main():
    print("=" * 60)
    print("Examples 3.3 — Tree-Based Methods")
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
