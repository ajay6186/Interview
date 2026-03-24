# ============================================================
# Examples 3.5 — Ensemble Methods (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from sklearn.datasets import make_classification
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import (BaggingClassifier, AdaBoostClassifier,
                               GradientBoostingClassifier,
                               VotingClassifier, StackingClassifier,
                               RandomForestClassifier)
from sklearn.model_selection import train_test_split, cross_val_predict, cross_val_score
from sklearn.metrics import accuracy_score

np.random.seed(42)
X, y = make_classification(n_samples=400, n_features=10,
                            n_informative=5, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Single decision tree baseline"""
    dt = DecisionTreeClassifier(max_depth=5, random_state=42)
    dt.fit(X_train, y_train)
    acc = dt.score(X_test, y_test)
    print("Ex01 — single tree accuracy:", round(acc, 4))

def ex02():
    """Bagging: bootstrap sample a dataset"""
    rng = np.random.default_rng(0)
    n = len(X_train)
    idx = rng.integers(0, n, size=n)
    X_boot, y_boot = X_train[idx], y_train[idx]
    dt = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X_boot, y_boot)
    print("Ex02 — bootstrap tree accuracy:", round(dt.score(X_test, y_test), 4))

def ex03():
    """Hard voting: majority vote from 3 trees"""
    trees = [DecisionTreeClassifier(max_depth=i+1, random_state=i).fit(X_train, y_train)
             for i in range(3)]
    preds = np.array([t.predict(X_test) for t in trees])
    votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=preds)
    print("Ex03 — hard voting accuracy:", round(accuracy_score(y_test, votes), 4))

def ex04():
    """Soft voting: average predicted probabilities"""
    clfs = [LogisticRegression(max_iter=1000).fit(X_train, y_train),
            GaussianNB().fit(X_train, y_train)]
    probas = np.array([c.predict_proba(X_test) for c in clfs])
    avg_proba = probas.mean(axis=0)
    preds = np.argmax(avg_proba, axis=1)
    print("Ex04 — soft voting accuracy:", round(accuracy_score(y_test, preds), 4))

def ex05():
    """sklearn BaggingClassifier"""
    bag = BaggingClassifier(n_estimators=20, random_state=42)
    bag.fit(X_train, y_train)
    print("Ex05 — bagging accuracy:", round(bag.score(X_test, y_test), 4))

def ex06():
    """sklearn AdaBoostClassifier"""
    ada = AdaBoostClassifier(n_estimators=50, random_state=42)
    ada.fit(X_train, y_train)
    print("Ex06 — AdaBoost accuracy:", round(ada.score(X_test, y_test), 4))

def ex07():
    """sklearn RandomForestClassifier"""
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    print("Ex07 — Random Forest accuracy:", round(rf.score(X_test, y_test), 4))

def ex08():
    """sklearn GradientBoostingClassifier"""
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb.fit(X_train, y_train)
    print("Ex08 — Gradient Boosting accuracy:", round(gb.score(X_test, y_test), 4))

def ex09():
    """sklearn VotingClassifier (hard voting)"""
    vc = VotingClassifier(estimators=[
        ("lr", LogisticRegression(max_iter=1000)),
        ("dt", DecisionTreeClassifier(max_depth=5, random_state=42)),
        ("nb", GaussianNB()),
    ], voting="hard")
    vc.fit(X_train, y_train)
    print("Ex09 — VotingClassifier accuracy:", round(vc.score(X_test, y_test), 4))

def ex10():
    """sklearn VotingClassifier (soft voting)"""
    vc = VotingClassifier(estimators=[
        ("lr", LogisticRegression(max_iter=1000)),
        ("nb", GaussianNB()),
    ], voting="soft")
    vc.fit(X_train, y_train)
    print("Ex10 — Soft VotingClassifier accuracy:", round(vc.score(X_test, y_test), 4))

def ex11():
    """AdaBoost weight update: compute alpha from error"""
    rng = np.random.default_rng(0)
    w = np.ones(len(y_train)) / len(y_train)
    dt = DecisionTreeClassifier(max_depth=1).fit(X_train, y_train)
    yp = dt.predict(X_train)
    error = np.sum(w[yp != y_train])
    alpha = 0.5 * np.log((1 - error) / (error + 1e-10))
    print("Ex11 — error:", round(error, 4), "| alpha:", round(alpha, 4))

def ex12():
    """Ensemble size effect: accuracy vs n_estimators"""
    sizes = [1, 5, 10, 20, 50]
    accs = [BaggingClassifier(n_estimators=k, random_state=42)
                .fit(X_train, y_train).score(X_test, y_test) for k in sizes]
    print("Ex12 — sizes:", sizes)
    print("        accs:", [round(a, 4) for a in accs])

def ex13():
    """Feature importance from Random Forest"""
    rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    importances = rf.feature_importances_
    top3 = np.argsort(importances)[::-1][:3]
    print("Ex13 — top 3 features:", [(int(i), round(float(importances[i]), 4)) for i in top3])

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Gradient Boosting from scratch (residual fitting)"""
    train_p = np.full(len(X_train), 0.5)
    test_p  = np.full(len(X_test), 0.5)
    for _ in range(30):
        residuals = y_train - train_p
        tree = DecisionTreeRegressor(max_depth=2)
        tree.fit(X_train, residuals)
        train_p += 0.1 * tree.predict(X_train)
        test_p  += 0.1 * tree.predict(X_test)
    preds = (test_p >= 0.5).astype(int)
    print("Ex14 — GB scratch accuracy:", round(accuracy_score(y_test, preds), 4))

def ex15():
    """Bagging from scratch with majority vote"""
    rng = np.random.default_rng(42)
    n = len(X_train)
    all_preds = []
    for _ in range(20):
        idx = rng.integers(0, n, size=n)
        tree = DecisionTreeClassifier(max_depth=5, random_state=0).fit(X_train[idx], y_train[idx])
        all_preds.append(tree.predict(X_test))
    votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=np.array(all_preds))
    print("Ex15 — bagging scratch accuracy:", round(accuracy_score(y_test, votes), 4))

def ex16():
    """Stacking: OOF predictions as meta-features"""
    base = [LogisticRegression(max_iter=1000), KNeighborsClassifier(n_neighbors=5)]
    meta_cols = [cross_val_predict(m, X_train, y_train, cv=5, method="predict_proba")[:, 1]
                 for m in base]
    meta_X_train = np.column_stack(meta_cols)
    for m in base:
        m.fit(X_train, y_train)
    meta_X_test = np.column_stack([m.predict_proba(X_test)[:, 1] for m in base])
    meta = LogisticRegression(max_iter=1000).fit(meta_X_train, y_train)
    print("Ex16 — stacking scratch accuracy:", round(meta.score(meta_X_test, y_test), 4))

def ex17():
    """sklearn StackingClassifier"""
    sc = StackingClassifier(
        estimators=[("lr", LogisticRegression(max_iter=1000)),
                    ("dt", DecisionTreeClassifier(max_depth=5, random_state=42))],
        final_estimator=LogisticRegression(max_iter=1000),
    )
    sc.fit(X_train, y_train)
    print("Ex17 — sklearn stacking accuracy:", round(sc.score(X_test, y_test), 4))

def ex18():
    """Blending: holdout set for meta-learner"""
    split = int(0.8 * len(X_train))
    X_b, X_h = X_train[:split], X_train[split:]
    y_b, y_h = y_train[:split], y_train[split:]
    base = [LogisticRegression(max_iter=1000), KNeighborsClassifier(n_neighbors=5)]
    for m in base:
        m.fit(X_b, y_b)
    hold_meta = np.column_stack([m.predict_proba(X_h)[:, 1] for m in base])
    test_meta  = np.column_stack([m.predict_proba(X_test)[:, 1] for m in base])
    meta = LogisticRegression(max_iter=1000).fit(hold_meta, y_h)
    print("Ex18 — blending accuracy:", round(meta.score(test_meta, y_test), 4))

def ex19():
    """Ensemble diversity: pairwise agreement"""
    lr = LogisticRegression(max_iter=1000).fit(X_train, y_train)
    dt = DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_train, y_train)
    nb = GaussianNB().fit(X_train, y_train)
    p_lr = lr.predict(X_test)
    p_dt = dt.predict(X_test)
    p_nb = nb.predict(X_test)
    print("Ex19 — LR-DT agree:", round(float(np.mean(p_lr==p_dt)), 4),
          "| LR-NB agree:", round(float(np.mean(p_lr==p_nb)), 4))

def ex20():
    """Bias-Variance decomposition via bootstrap"""
    rng = np.random.default_rng(42)
    n = len(X_train)
    all_preds = []
    for _ in range(30):
        idx = rng.integers(0, n, size=n)
        dt = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X_train[idx], y_train[idx])
        all_preds.append(dt.predict(X_test))
    all_preds = np.array(all_preds, dtype=float)
    mean_p = all_preds.mean(axis=0)
    bias2  = float(np.mean((mean_p - y_test) ** 2))
    var    = float(np.mean(np.var(all_preds, axis=0)))
    print("Ex20 — bias²:", round(bias2, 6), "| variance:", round(var, 6))

def ex21():
    """Ensemble pruning: keep top-k by accuracy"""
    models = [DecisionTreeClassifier(max_depth=i+1, random_state=i).fit(X_train, y_train)
              for i in range(10)]
    accs = [(i, accuracy_score(y_test, m.predict(X_test))) for i, m in enumerate(models)]
    top5 = sorted(accs, key=lambda t: t[1], reverse=True)[:5]
    top_models = [models[i] for i, _ in top5]
    votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0,
        arr=np.array([m.predict(X_test) for m in top_models]))
    print("Ex21 — pruned ensemble accuracy:", round(accuracy_score(y_test, votes), 4),
          "| top indices:", [i for i, _ in top5])

def ex22():
    """AdaBoost sample weights evolution over iterations"""
    w = np.ones(len(y_train)) / len(y_train)
    weight_sums = [round(float(w.sum()), 4)]
    for _ in range(5):
        dt = DecisionTreeClassifier(max_depth=1).fit(X_train, y_train,
                                                      sample_weight=w)
        yp = dt.predict(X_train)
        error = np.sum(w[yp != y_train])
        alpha = 0.5 * np.log((1 - error) / (error + 1e-10))
        y_signed = 2 * y_train - 1
        p_signed = 2 * yp - 1
        w = w * np.exp(-alpha * y_signed * p_signed)
        w /= w.sum()
        weight_sums.append(round(float(w.sum()), 4))
    print("Ex22 — weight sums (should stay ≈1):", weight_sums)

def ex23():
    """Random subspace method (feature bagging)"""
    rng = np.random.default_rng(0)
    n_features = X_train.shape[1]
    k = n_features // 2
    all_preds = []
    for _ in range(20):
        feats = rng.choice(n_features, size=k, replace=False)
        dt = DecisionTreeClassifier(max_depth=5, random_state=0).fit(
            X_train[:, feats], y_train)
        all_preds.append(dt.predict(X_test[:, feats]))
    votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=np.array(all_preds))
    print("Ex23 — random subspace accuracy:", round(accuracy_score(y_test, votes), 4))

def ex24():
    """Out-of-bag (OOB) error estimation"""
    bag = BaggingClassifier(n_estimators=50, oob_score=True, random_state=42)
    bag.fit(X_train, y_train)
    print("Ex24 — OOB score:", round(bag.oob_score_, 4),
          "| test score:", round(bag.score(X_test, y_test), 4))

def ex25():
    """Gradient Boosting: effect of learning rate"""
    results = {}
    for lr in [0.01, 0.1, 0.5, 1.0]:
        gb = GradientBoostingClassifier(n_estimators=100, learning_rate=lr, random_state=42)
        gb.fit(X_train, y_train)
        results[lr] = round(gb.score(X_test, y_test), 4)
    print("Ex25 — learning rate vs accuracy:", results)

def ex26():
    """Gradient Boosting: effect of tree depth"""
    results = {}
    for d in [1, 2, 3, 5]:
        gb = GradientBoostingClassifier(n_estimators=100, max_depth=d, random_state=42)
        gb.fit(X_train, y_train)
        results[d] = round(gb.score(X_test, y_test), 4)
    print("Ex26 — depth vs accuracy:", results)

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """EnsembleWrapper class: uniform interface"""
    class EnsembleWrapper:
        def __init__(self, estimators):
            self.estimators = estimators
        def fit(self, X, y):
            for e in self.estimators:
                e.fit(X, y)
            return self
        def predict(self, X):
            preds = np.array([e.predict(X) for e in self.estimators])
            return np.apply_along_axis(
                lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=preds)
    ew = EnsembleWrapper([
        LogisticRegression(max_iter=1000),
        DecisionTreeClassifier(max_depth=5, random_state=42),
        GaussianNB(),
    ])
    ew.fit(X_train, y_train)
    print("Ex27 — EnsembleWrapper accuracy:", round(accuracy_score(y_test, ew.predict(X_test)), 4))

def ex28():
    """Stacked generalization with 3 base learners"""
    base = [LogisticRegression(max_iter=1000),
            KNeighborsClassifier(n_neighbors=5),
            GaussianNB()]
    meta_cols = [cross_val_predict(m, X_train, y_train, cv=5, method="predict_proba")[:, 1]
                 for m in base]
    meta_X_tr = np.column_stack(meta_cols)
    for m in base:
        m.fit(X_train, y_train)
    meta_X_te = np.column_stack([m.predict_proba(X_test)[:, 1] for m in base])
    meta = RandomForestClassifier(n_estimators=50, random_state=42).fit(meta_X_tr, y_train)
    print("Ex28 — 3-base stacking accuracy:", round(meta.score(meta_X_te, y_test), 4))

def ex29():
    """Multi-level stacking (level-0, level-1, level-2)"""
    # Level 0: LR, KNN
    l0 = [LogisticRegression(max_iter=1000), KNeighborsClassifier(n_neighbors=5)]
    l0_meta = np.column_stack([
        cross_val_predict(m, X_train, y_train, cv=5, method="predict_proba")[:, 1]
        for m in l0])
    for m in l0:
        m.fit(X_train, y_train)
    l0_test = np.column_stack([m.predict_proba(X_test)[:, 1] for m in l0])
    # Level 1: GNB on meta features
    l1 = GaussianNB().fit(l0_meta, y_train)
    l1_tr = l1.predict_proba(l0_meta)[:, 1].reshape(-1, 1)
    l1_te = l1.predict_proba(l0_test)[:, 1].reshape(-1, 1)
    # Level 2: final logistic
    final = LogisticRegression(max_iter=1000).fit(l1_tr, y_train)
    print("Ex29 — 2-level stacking accuracy:", round(final.score(l1_te, y_test), 4))

def ex30():
    """Boosting residual analysis: distribution of residuals"""
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    proba = gb.predict_proba(X_test)[:, 1]
    residuals = y_test.astype(float) - proba
    print("Ex30 — residual mean:", round(float(residuals.mean()), 4),
          "| std:", round(float(residuals.std()), 4),
          "| max abs:", round(float(np.abs(residuals).max()), 4))

def ex31():
    """Cross-validated ensemble comparison"""
    models = {
        "Bagging": BaggingClassifier(n_estimators=20, random_state=42),
        "AdaBoost": AdaBoostClassifier(n_estimators=50, random_state=42),
        "GB": GradientBoostingClassifier(n_estimators=50, random_state=42),
        "RF": RandomForestClassifier(n_estimators=50, random_state=42),
    }
    for name, m in models.items():
        sc = cross_val_score(m, X, y, cv=5, scoring="accuracy")
        print(f"Ex31 — {name}: mean={sc.mean():.4f} std={sc.std():.4f}")

def ex32():
    """Weighted voting ensemble"""
    clfs = [("lr", LogisticRegression(max_iter=1000)),
            ("dt", DecisionTreeClassifier(max_depth=5, random_state=42)),
            ("nb", GaussianNB())]
    weights = [2, 1, 1]  # LR gets double weight
    vc = VotingClassifier(estimators=clfs, voting="soft", weights=weights)
    vc.fit(X_train, y_train)
    print("Ex32 — weighted soft voting accuracy:", round(vc.score(X_test, y_test), 4))

def ex33():
    """Ensemble confidence: std of predicted probabilities"""
    clfs = [LogisticRegression(max_iter=1000).fit(X_train, y_train),
            RandomForestClassifier(n_estimators=50, random_state=42).fit(X_train, y_train),
            GaussianNB().fit(X_train, y_train)]
    probas = np.array([c.predict_proba(X_test)[:, 1] for c in clfs])
    mean_p = probas.mean(axis=0)
    std_p  = probas.std(axis=0)
    low_conf = (std_p > 0.15).sum()
    print("Ex33 — mean proba[:3]:", np.round(mean_p[:3], 4),
          "| std[:3]:", np.round(std_p[:3], 4),
          "| low-confidence samples:", low_conf)

def ex34():
    """Ensemble with calibration concept"""
    from sklearn.calibration import CalibratedClassifierCV
    base = DecisionTreeClassifier(max_depth=5, random_state=42)
    cal  = CalibratedClassifierCV(base, cv=5, method="isotonic")
    cal.fit(X_train, y_train)
    proba = cal.predict_proba(X_test)[:, 1]
    preds = (proba >= 0.5).astype(int)
    print("Ex34 — calibrated tree accuracy:", round(accuracy_score(y_test, preds), 4),
          "| proba range:", round(proba.min(), 4), "–", round(proba.max(), 4))

def ex35():
    """Gradient Boosting: staged prediction (early stopping analysis)"""
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb.fit(X_train, y_train)
    staged_accs = [accuracy_score(y_test, p)
                   for p in gb.staged_predict(X_test)]
    best_n = int(np.argmax(staged_accs)) + 1
    print("Ex35 — best n_estimators:", best_n,
          "| best accuracy:", round(staged_accs[best_n-1], 4))

def ex36():
    """Feature importance: compare RF vs GradientBoosting"""
    rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    rf_top = np.argsort(rf.feature_importances_)[::-1][:3]
    gb_top = np.argsort(gb.feature_importances_)[::-1][:3]
    print("Ex36 — RF top features:", rf_top.tolist())
    print("       GB top features:", gb_top.tolist())

def ex37():
    """Snapshot ensemble: train once, snapshot at multiple epochs"""
    # Simulate by varying random_state
    snapshots = [DecisionTreeClassifier(max_depth=5, random_state=i).fit(X_train, y_train)
                 for i in range(10)]
    preds = np.array([m.predict(X_test) for m in snapshots])
    votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=preds)
    print("Ex37 — snapshot ensemble accuracy:", round(accuracy_score(y_test, votes), 4))

def ex38():
    """Ensemble for regression: average predictions"""
    from sklearn.datasets import make_regression
    from sklearn.linear_model import Ridge
    from sklearn.metrics import mean_squared_error
    Xr, yr = make_regression(n_samples=200, n_features=5, noise=10, random_state=42)
    Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(Xr, yr, test_size=0.2, random_state=42)
    models = [Ridge(alpha=a).fit(Xr_tr, yr_tr) for a in [0.1, 1.0, 10.0]]
    avg_pred = np.mean([m.predict(Xr_te) for m in models], axis=0)
    rmse = float(np.sqrt(mean_squared_error(yr_te, avg_pred)))
    print("Ex38 — regression ensemble RMSE:", round(rmse, 4))

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Dynamic ensemble selection: choose best model per region"""
    models = {
        "lr": LogisticRegression(max_iter=1000).fit(X_train, y_train),
        "dt": DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_train, y_train),
        "nb": GaussianNB().fit(X_train, y_train),
    }
    # For each test sample, pick model with highest confidence
    final_preds = []
    for x in X_test:
        x = x.reshape(1, -1)
        max_conf = -1
        best_pred = 0
        for m in models.values():
            conf = m.predict_proba(x).max()
            if conf > max_conf:
                max_conf = conf
                best_pred = int(m.predict(x)[0])
        final_preds.append(best_pred)
    print("Ex39 — dynamic selection accuracy:", round(accuracy_score(y_test, final_preds), 4))

def ex40():
    """Diversity measure: Q-statistic between two classifiers"""
    m1 = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X_train, y_train)
    m2 = GaussianNB().fit(X_train, y_train)
    p1 = m1.predict(X_test)
    p2 = m2.predict(X_test)
    n11 = np.sum((p1==y_test) & (p2==y_test))
    n00 = np.sum((p1!=y_test) & (p2!=y_test))
    n10 = np.sum((p1==y_test) & (p2!=y_test))
    n01 = np.sum((p1!=y_test) & (p2==y_test))
    q = (n11*n00 - n10*n01) / (n11*n00 + n10*n01 + 1e-10)
    print("Ex40 — Q-statistic:", round(float(q), 4), "(closer to 0 = more diverse)")

def ex41():
    """Negative correlation learning: ensemble with diversity penalty"""
    # Simplified: train on complementary subsets
    n = len(X_train)
    rng = np.random.default_rng(42)
    all_preds = []
    for i in range(5):
        idx = rng.choice(n, size=int(n * 0.8), replace=False)
        complement = np.setdiff1d(np.arange(n), idx)
        # Use complement set occasionally
        train_idx = idx if i % 2 == 0 else complement
        dt = DecisionTreeClassifier(max_depth=4, random_state=i).fit(
            X_train[train_idx], y_train[train_idx])
        all_preds.append(dt.predict(X_test))
    votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=np.array(all_preds))
    print("Ex41 — negative corr ensemble accuracy:", round(accuracy_score(y_test, votes), 4))

def ex42():
    """Boosting with custom loss: focal loss concept"""
    # Simulate focal boosting: upweight hard examples (high loss)
    proba = np.full(len(X_train), 0.5)
    test_p = np.full(len(X_test), 0.5)
    gamma = 2.0  # focal factor
    for _ in range(30):
        residuals = y_train - proba
        # Focal weights: harder examples get more weight
        focal_w = (np.abs(residuals) + 1e-6) ** gamma
        focal_w /= focal_w.sum()
        tree = DecisionTreeRegressor(max_depth=2)
        tree.fit(X_train, residuals, sample_weight=focal_w)
        proba  += 0.1 * tree.predict(X_train)
        test_p += 0.1 * tree.predict(X_test)
    preds = (test_p >= 0.5).astype(int)
    print("Ex42 — focal boosting accuracy:", round(accuracy_score(y_test, preds), 4))

def ex43():
    """Multi-output ensemble: predict both class and confidence"""
    clfs = [RandomForestClassifier(n_estimators=50, random_state=i).fit(X_train, y_train)
            for i in range(3)]
    probas = np.array([c.predict_proba(X_test)[:, 1] for c in clfs])
    mean_p = probas.mean(axis=0)
    preds  = (mean_p >= 0.5).astype(int)
    conf   = np.abs(mean_p - 0.5) * 2  # 0=uncertain, 1=certain
    acc    = accuracy_score(y_test, preds)
    high_conf_acc = accuracy_score(y_test[conf > 0.6], preds[conf > 0.6])
    print("Ex43 — overall acc:", round(acc, 4),
          "| high-conf acc:", round(high_conf_acc, 4),
          "| high-conf samples:", int((conf > 0.6).sum()))

def ex44():
    """Cascade ensemble: fast model first, complex model on uncertain samples"""
    fast = GaussianNB().fit(X_train, y_train)
    slow = GradientBoostingClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    fast_proba = fast.predict_proba(X_test)[:, 1]
    uncertain  = np.abs(fast_proba - 0.5) < 0.2
    final_preds = (fast_proba >= 0.5).astype(int)
    if uncertain.sum() > 0:
        slow_preds = slow.predict(X_test[uncertain])
        final_preds[uncertain] = slow_preds
    print("Ex44 — cascade accuracy:", round(accuracy_score(y_test, final_preds), 4),
          "| escalated:", int(uncertain.sum()), "/", len(X_test))

def ex45():
    """Ensemble with data augmentation (jitter)"""
    rng = np.random.default_rng(42)
    all_preds = []
    for _ in range(20):
        X_aug = X_train + rng.normal(0, 0.05, X_train.shape)
        dt = DecisionTreeClassifier(max_depth=5, random_state=0).fit(X_aug, y_train)
        all_preds.append(dt.predict(X_test))
    votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=np.array(all_preds))
    print("Ex45 — augmented ensemble accuracy:", round(accuracy_score(y_test, votes), 4))

def ex46():
    """Diversity-accuracy trade-off analysis"""
    results = []
    for depth in [1, 2, 3, 5, 10]:
        models = [DecisionTreeClassifier(max_depth=depth, random_state=i).fit(X_train, y_train)
                  for i in range(10)]
        preds = np.array([m.predict(X_test) for m in models])
        # Diversity: average pairwise disagreement
        disagree = np.mean([np.mean(preds[i] != preds[j])
                            for i in range(10) for j in range(i+1, 10)])
        votes = np.apply_along_axis(
            lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=preds)
        acc = accuracy_score(y_test, votes)
        results.append(f"depth={depth}: acc={acc:.4f}, diversity={disagree:.4f}")
    for r in results:
        print("Ex46 —", r)

def ex47():
    """Post-hoc ensemble: combine pre-trained models"""
    m1 = RandomForestClassifier(n_estimators=50, random_state=0).fit(X_train, y_train)
    m2 = GradientBoostingClassifier(n_estimators=50, random_state=0).fit(X_train, y_train)
    m3 = LogisticRegression(max_iter=1000).fit(X_train, y_train)
    # Combine by averaging probabilities (no retraining)
    avg_p = (m1.predict_proba(X_test)[:, 1] +
             m2.predict_proba(X_test)[:, 1] +
             m3.predict_proba(X_test)[:, 1]) / 3
    preds = (avg_p >= 0.5).astype(int)
    print("Ex47 — post-hoc ensemble accuracy:", round(accuracy_score(y_test, preds), 4))

def ex48():
    """Ensemble calibration: reliability diagram concept"""
    rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
    proba = rf.predict_proba(X_test)[:, 1]
    # Bin into 5 buckets and check mean predicted vs actual fraction
    bins = np.linspace(0, 1, 6)
    for i in range(5):
        mask = (proba >= bins[i]) & (proba < bins[i+1])
        if mask.sum() > 0:
            mean_pred = proba[mask].mean()
            actual    = y_test[mask].mean()
            print(f"Ex48 — bin [{bins[i]:.1f},{bins[i+1]:.1f}]: "
                  f"pred={mean_pred:.3f}, actual={actual:.3f}, n={mask.sum()}")

def ex49():
    """Ensemble for imbalanced data: class-weighted voting"""
    from sklearn.datasets import make_classification as mc
    Xi, yi = mc(n_samples=400, weights=[0.85, 0.15], random_state=42, n_features=10, n_informative=5)
    Xt, Xs, yt, ys = train_test_split(Xi, yi, test_size=0.2, random_state=42)
    models = [
        RandomForestClassifier(n_estimators=50, class_weight="balanced", random_state=42).fit(Xt, yt),
        LogisticRegression(max_iter=1000, class_weight="balanced").fit(Xt, yt),
    ]
    avg_p = np.mean([m.predict_proba(Xs)[:, 1] for m in models], axis=0)
    preds = (avg_p >= 0.5).astype(int)
    from sklearn.metrics import f1_score
    f1 = f1_score(ys, preds)
    print("Ex49 — imbalanced ensemble F1:", round(f1, 4),
          "| positive rate in test:", round(ys.mean(), 4))

def ex50():
    """Production-grade ensemble: full pipeline with CV selection"""
    candidates = {
        "RF":       RandomForestClassifier(n_estimators=100, random_state=42),
        "GB":       GradientBoostingClassifier(n_estimators=100, random_state=42),
        "Ada":      AdaBoostClassifier(n_estimators=50, random_state=42),
        "Voting":   VotingClassifier(estimators=[
                        ("lr", LogisticRegression(max_iter=1000)),
                        ("dt", DecisionTreeClassifier(max_depth=5, random_state=42)),
                        ("nb", GaussianNB())], voting="soft"),
        "Stacking": StackingClassifier(
                        estimators=[("lr", LogisticRegression(max_iter=1000)),
                                    ("dt", DecisionTreeClassifier(max_depth=5, random_state=42))],
                        final_estimator=LogisticRegression(max_iter=1000)),
    }
    best_name, best_score = "", 0.0
    for name, model in candidates.items():
        sc = cross_val_score(model, X_train, y_train, cv=5, scoring="accuracy").mean()
        if sc > best_score:
            best_score, best_name = sc, name
    winner = candidates[best_name]
    winner.fit(X_train, y_train)
    test_acc = winner.score(X_test, y_test)
    print("Ex50 — best CV model:", best_name, "| CV score:", round(best_score, 4),
          "| test accuracy:", round(test_acc, 4))


def main():
    print("=" * 60)
    print("Examples 3.5 — Ensemble Methods")
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
