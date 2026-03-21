# ============================================================
# Examples 1.5 — Model Evaluation & Validation (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold,
    KFold, LeaveOneOut, TimeSeriesSplit, GroupKFold,
    StratifiedGroupKFold, learning_curve, cross_validate
)
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, mean_squared_error, mean_absolute_error, r2_score,
    roc_curve, auc, precision_recall_curve, average_precision_score,
    brier_score_loss, log_loss, cohen_kappa_score, matthews_corrcoef,
    balanced_accuracy_score, roc_auc_score
)
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.pipeline import Pipeline
from sklearn.calibration import calibration_curve
import warnings
warnings.filterwarnings("ignore")

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Accuracy score manual"""
    y_true = np.array([1, 0, 1, 1, 0, 1, 0, 0])
    y_pred = np.array([1, 0, 1, 0, 0, 1, 1, 0])
    manual = (y_true == y_pred).mean()
    sklearn_acc = accuracy_score(y_true, y_pred)
    print(f"Ex01 — accuracy manual: {manual:.4f} | sklearn: {sklearn_acc:.4f}")

def ex02():
    """Precision manual"""
    y_true = np.array([1, 0, 1, 1, 0, 1, 0])
    y_pred = np.array([1, 0, 1, 0, 1, 1, 0])
    tp = ((y_pred == 1) & (y_true == 1)).sum()
    fp = ((y_pred == 1) & (y_true == 0)).sum()
    manual_prec = tp / (tp + fp)
    print(f"Ex02 — precision manual: {manual_prec:.4f} | sklearn: {precision_score(y_true,y_pred):.4f}")

def ex03():
    """Recall manual"""
    y_true = np.array([1, 0, 1, 1, 0, 1, 0])
    y_pred = np.array([1, 0, 1, 0, 1, 1, 0])
    tp = ((y_pred == 1) & (y_true == 1)).sum()
    fn = ((y_pred == 0) & (y_true == 1)).sum()
    manual_rec = tp / (tp + fn)
    print(f"Ex03 — recall manual: {manual_rec:.4f} | sklearn: {recall_score(y_true,y_pred):.4f}")

def ex04():
    """F1 manual"""
    y_true = np.array([1, 0, 1, 1, 0, 1, 0])
    y_pred = np.array([1, 0, 1, 0, 1, 1, 0])
    p = precision_score(y_true, y_pred)
    r = recall_score(y_true, y_pred)
    manual_f1 = 2 * p * r / (p + r)
    print(f"Ex04 — F1 manual: {manual_f1:.4f} | sklearn: {f1_score(y_true,y_pred):.4f}")

def ex05():
    """Confusion matrix manual"""
    y_true = np.array([1, 0, 1, 1, 0, 0, 1])
    y_pred = np.array([1, 0, 1, 0, 1, 0, 1])
    tp = ((y_pred==1)&(y_true==1)).sum()
    tn = ((y_pred==0)&(y_true==0)).sum()
    fp = ((y_pred==1)&(y_true==0)).sum()
    fn = ((y_pred==0)&(y_true==1)).sum()
    print(f"Ex05 — confusion matrix manual: TP={tp} TN={tn} FP={fp} FN={fn}")
    print(f"       sklearn:\n{confusion_matrix(y_true, y_pred)}")

def ex06():
    """Mean squared error"""
    y_true = np.array([3.0, 5.0, 2.5, 7.0, 1.0])
    y_pred = np.array([2.8, 4.5, 2.7, 6.0, 1.5])
    manual_mse = np.mean((y_true - y_pred) ** 2)
    print(f"Ex06 — MSE manual: {manual_mse:.4f} | sklearn: {mean_squared_error(y_true,y_pred):.4f}")

def ex07():
    """Root mean squared error"""
    y_true = np.array([3.0, 5.0, 2.5, 7.0, 1.0])
    y_pred = np.array([2.8, 4.5, 2.7, 6.0, 1.5])
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    print(f"Ex07 — RMSE: {rmse:.4f}")

def ex08():
    """Mean absolute error"""
    y_true = np.array([3.0, 5.0, 2.5, 7.0, 1.0])
    y_pred = np.array([2.8, 4.5, 2.7, 6.0, 1.5])
    manual_mae = np.mean(np.abs(y_true - y_pred))
    print(f"Ex08 — MAE manual: {manual_mae:.4f} | sklearn: {mean_absolute_error(y_true,y_pred):.4f}")

def ex09():
    """R-squared"""
    y_true = np.array([3.0, 5.0, 2.5, 7.0, 1.0])
    y_pred = np.array([2.8, 4.5, 2.7, 6.0, 1.5])
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    manual_r2 = 1 - ss_res / ss_tot
    print(f"Ex09 — R² manual: {manual_r2:.4f} | sklearn: {r2_score(y_true,y_pred):.4f}")

def ex10():
    """Train/test split evaluation"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    print(f"Ex10 — holdout: train acc={model.score(X_tr,y_tr):.3f} | "
          f"test acc={model.score(X_te,y_te):.3f}")

def ex11():
    """Holdout evaluation with metrics"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)
    model = DecisionTreeClassifier(max_depth=4, random_state=0).fit(X_tr, y_tr)
    pred = model.predict(X_te)
    proba = model.predict_proba(X_te)[:, 1]
    print(f"Ex11 — holdout: acc={accuracy_score(y_te,pred):.3f} | "
          f"f1={f1_score(y_te,pred):.3f} | auc={roc_auc_score(y_te,proba):.3f}")

def ex12():
    """cross_val_score"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    scores = cross_val_score(LogisticRegression(max_iter=300), X, y, cv=5, scoring="accuracy")
    print(f"Ex12 — 5-fold CV: {scores.round(3)} | mean={scores.mean():.3f} ± {scores.std():.3f}")

def ex13():
    """Stratified K-Fold"""
    X, y = make_classification(n_samples=200, n_features=6, weights=[0.8,0.2], random_state=0)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
    model = LogisticRegression(max_iter=300)
    scores = []
    for tr, te in skf.split(X, y):
        model.fit(X[tr], y[tr])
        scores.append(accuracy_score(y[te], model.predict(X[te])))
    print(f"Ex13 — stratified K-fold: {[round(s,3) for s in scores]} | mean={np.mean(scores):.3f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Leave-one-out CV"""
    X, y = make_classification(n_samples=40, n_features=4, random_state=0)
    loo = LeaveOneOut()
    model = LogisticRegression(max_iter=300)
    preds = []
    for tr, te in loo.split(X):
        model.fit(X[tr], y[tr])
        preds.append(model.predict(X[te])[0])
    print(f"Ex14 — LOO-CV: accuracy={accuracy_score(y, preds):.3f} (n={len(X)} folds)")

def ex15():
    """Time series CV (expanding window)"""
    X, y = make_regression(n_samples=100, n_features=3, noise=5, random_state=0)
    tscv = TimeSeriesSplit(n_splits=5)
    model = LinearRegression()
    r2_scores = []
    for tr, te in tscv.split(X):
        model.fit(X[tr], y[tr])
        r2_scores.append(r2_score(y[te], model.predict(X[te])))
    print(f"Ex15 — TimeSeries CV R² scores: {[round(s,3) for s in r2_scores]} | "
          f"mean={np.mean(r2_scores):.3f}")

def ex16():
    """ROC curve data"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    fpr, tpr, thresholds = roc_curve(y_te, proba)
    roc_auc = auc(fpr, tpr)
    print(f"Ex16 — ROC curve: AUC={roc_auc:.4f} | {len(fpr)} threshold points")
    print(f"       sample (fpr, tpr, thr): {list(zip(fpr[:3].round(3), tpr[:3].round(3), thresholds[:3].round(3)))}")

def ex17():
    """AUC calculation"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=1)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    for name, model in [("LogReg", LogisticRegression(max_iter=300)),
                         ("DTree",  DecisionTreeClassifier(max_depth=4, random_state=0))]:
        model.fit(X_tr, y_tr)
        proba = model.predict_proba(X_te)[:, 1]
        print(f"Ex17 — AUC {name}: {roc_auc_score(y_te, proba):.4f}")

def ex18():
    """Precision-recall curve"""
    X, y = make_classification(n_samples=200, n_features=5, weights=[0.8,0.2], random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    prec, rec, thr = precision_recall_curve(y_te, proba)
    ap = average_precision_score(y_te, proba)
    print(f"Ex18 — PR curve: AP={ap:.4f} | {len(thr)} thresholds")
    print(f"       sample (prec, rec): {list(zip(prec[:3].round(3), rec[:3].round(3)))}")

def ex19():
    """Average precision"""
    X, y = make_classification(n_samples=200, n_features=5, weights=[0.7,0.3], random_state=2)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    ap = average_precision_score(y_te, proba)
    baseline = y_te.mean()
    print(f"Ex19 — Average Precision: {ap:.4f} | baseline (class prevalence): {baseline:.4f}")

def ex20():
    """Calibration check"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    fraction_pos, mean_pred = calibration_curve(y_te, proba, n_bins=5)
    print("Ex20 — calibration curve (mean_pred vs fraction_positive):")
    for mp, fp in zip(mean_pred, fraction_pos):
        bar = "#" * int(fp * 20)
        print(f"       pred={mp:.2f} actual={fp:.2f} |{bar}")

def ex21():
    """Brier score"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    bs = brier_score_loss(y_te, proba)
    # Perfect calibration baseline
    bs_baseline = brier_score_loss(y_te, np.full(len(y_te), y_te.mean()))
    print(f"Ex21 — Brier score: {bs:.4f} | baseline (always predict mean): {bs_baseline:.4f}")

def ex22():
    """Log loss"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)
    ll = log_loss(y_te, proba)
    print(f"Ex22 — log loss: {ll:.4f} | random baseline (0.5 prob): "
          f"{log_loss(y_te, np.full((len(y_te),2), 0.5)):.4f}")

def ex23():
    """Cohen's kappa"""
    y_true = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2])
    y_pred = np.array([0, 2, 1, 0, 1, 1, 2, 1, 2])
    kappa = cohen_kappa_score(y_true, y_pred)
    acc   = accuracy_score(y_true, y_pred)
    print(f"Ex23 — Cohen's kappa: {kappa:.4f} | accuracy: {acc:.4f}")
    print(f"       kappa adjusts for chance agreement (acc can be misleading on imbalanced)")

def ex24():
    """Matthews Correlation Coefficient"""
    y_true = np.array([1, 0, 1, 1, 0, 0, 1, 0])
    y_pred = np.array([1, 0, 1, 0, 1, 0, 1, 0])
    mcc = matthews_corrcoef(y_true, y_pred)
    print(f"Ex24 — MCC: {mcc:.4f} | range [-1, 1], 1=perfect, 0=random, -1=inverse")

def ex25():
    """Balanced accuracy"""
    rng = np.random.default_rng(0)
    y_true = np.concatenate([np.zeros(90), np.ones(10)]).astype(int)
    y_pred_biased  = np.zeros(100, dtype=int)   # always predict majority
    model_pred     = rng.choice([0, 1], 100, p=[0.6, 0.4])
    print(f"Ex25 — biased model: acc={accuracy_score(y_true,y_pred_biased):.3f} | "
          f"balanced_acc={balanced_accuracy_score(y_true,y_pred_biased):.3f}")
    print(f"       rand model:   acc={accuracy_score(y_true,model_pred):.3f} | "
          f"balanced_acc={balanced_accuracy_score(y_true,model_pred):.3f}")

def ex26():
    """Multi-class ROC (OvR)"""
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=200, n_features=6, n_classes=3,
                                n_informative=4, n_clusters_per_class=1, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=500).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)
    auc_macro = roc_auc_score(y_te, proba, multi_class="ovr", average="macro")
    auc_weighted = roc_auc_score(y_te, proba, multi_class="ovr", average="weighted")
    print(f"Ex26 — multi-class ROC-AUC: macro={auc_macro:.4f} | weighted={auc_weighted:.4f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Nested CV (outer for eval, inner for tuning)"""
    from sklearn.model_selection import GridSearchCV, cross_validate
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    inner = StratifiedKFold(n_splits=3, shuffle=True, random_state=0)
    outer = StratifiedKFold(n_splits=5, shuffle=True, random_state=1)
    gs = GridSearchCV(DecisionTreeClassifier(random_state=0),
                      {"max_depth": [2, 4, 6]}, cv=inner, scoring="accuracy")
    result = cross_validate(gs, X, y, cv=outer, scoring="accuracy", return_train_score=True)
    outer_scores = result["test_score"]
    print(f"Ex27 — nested CV: scores={outer_scores.round(3)} | "
          f"mean={outer_scores.mean():.3f} ± {outer_scores.std():.3f}")

def ex28():
    """Bootstrap confidence interval for accuracy"""
    rng = np.random.default_rng(42)
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    pred = model.predict(X_te)
    correct = (pred == y_te).astype(float)
    boot_accs = [rng.choice(correct, len(correct), replace=True).mean() for _ in range(2000)]
    ci = np.percentile(boot_accs, [2.5, 97.5])
    print(f"Ex28 — bootstrap CI: acc={correct.mean():.3f} | "
          f"95% CI=[{ci[0]:.3f}, {ci[1]:.3f}]")

def ex29():
    """Permutation test"""
    rng = np.random.default_rng(7)
    X, y = make_classification(n_samples=100, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    obs_acc = accuracy_score(y_te, model.predict(X_te))
    perm_accs = []
    for _ in range(500):
        y_perm = rng.permutation(y_te)
        perm_accs.append(accuracy_score(y_perm, model.predict(X_te)))
    p_value = np.mean(np.array(perm_accs) >= obs_acc)
    print(f"Ex29 — permutation test: obs_acc={obs_acc:.3f} | "
          f"perm_mean={np.mean(perm_accs):.3f} | p-value={p_value:.4f}")

def ex30():
    """McNemar's test concept"""
    from scipy.stats import chi2
    # Contingency table: model A right / model B wrong vs model A wrong / model B right
    y_true = np.array([1,0,1,1,0,1,0,0,1,0])
    pred_a = np.array([1,0,1,0,0,1,1,0,1,0])
    pred_b = np.array([1,0,0,1,0,1,0,0,1,1])
    b = ((pred_a == y_true) & (pred_b != y_true)).sum()   # A right, B wrong
    c = ((pred_a != y_true) & (pred_b == y_true)).sum()   # A wrong, B right
    chi2_stat = (abs(b - c) - 1) ** 2 / (b + c) if (b + c) > 0 else 0
    p_value = 1 - chi2.cdf(chi2_stat, df=1)
    print(f"Ex30 — McNemar's test: b={b}, c={c}, chi2={chi2_stat:.4f}, p={p_value:.4f}")
    print(f"       A acc={accuracy_score(y_true,pred_a):.2f}, B acc={accuracy_score(y_true,pred_b):.2f}")

def ex31():
    """DeLong's test concept (AUC CI via bootstrap)"""
    rng = np.random.default_rng(0)
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    obs_auc = roc_auc_score(y_te, proba)
    boot_aucs = []
    for _ in range(1000):
        idx = rng.integers(0, len(y_te), len(y_te))
        if len(np.unique(y_te[idx])) < 2: continue
        boot_aucs.append(roc_auc_score(y_te[idx], proba[idx]))
    ci = np.percentile(boot_aucs, [2.5, 97.5])
    print(f"Ex31 — AUC CI (DeLong bootstrap): AUC={obs_auc:.4f} | "
          f"95% CI=[{ci[0]:.4f}, {ci[1]:.4f}]")

def ex32():
    """Learning curve with CI"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    train_sizes, train_scores, val_scores = learning_curve(
        LogisticRegression(max_iter=300), X, y,
        train_sizes=np.linspace(0.2, 1.0, 5), cv=5)
    print("Ex32 — learning curve with CI:")
    for sz, tr_m, tr_s, va_m, va_s in zip(
        train_sizes, train_scores.mean(1), train_scores.std(1),
        val_scores.mean(1), val_scores.std(1)):
        print(f"       n={sz:4d}  train={tr_m:.3f}±{tr_s:.3f}  val={va_m:.3f}±{va_s:.3f}")

def ex33():
    """Bias-variance decomposition numerically"""
    rng = np.random.default_rng(0)
    X_test = np.linspace(0, 1, 30).reshape(-1, 1)
    y_true_fn = lambda x: np.sin(2 * np.pi * x).ravel()
    predictions = []
    for _ in range(100):
        X_tr = rng.random((20, 1)); y_tr = y_true_fn(X_tr) + rng.random(20) * 0.3
        from sklearn.tree import DecisionTreeRegressor
        model = DecisionTreeRegressor(max_depth=3).fit(X_tr, y_tr)
        predictions.append(model.predict(X_test))
    preds = np.array(predictions)
    mean_pred = preds.mean(axis=0)
    y_true = y_true_fn(X_test)
    bias2 = np.mean((mean_pred - y_true) ** 2)
    variance = np.mean(preds.var(axis=0))
    noise = 0.3 ** 2
    print(f"Ex33 — bias-variance: bias²={bias2:.4f} | variance={variance:.4f} | "
          f"noise≈{noise:.4f} | total≈{bias2+variance+noise:.4f}")

def ex34():
    """Model comparison with paired t-test"""
    from scipy.stats import ttest_rel
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=0)
    scores_a, scores_b = [], []
    m_a = LogisticRegression(max_iter=300)
    m_b = DecisionTreeClassifier(max_depth=4, random_state=0)
    for tr, te in kf.split(X, y):
        scores_a.append(accuracy_score(y[te], m_a.fit(X[tr],y[tr]).predict(X[te])))
        scores_b.append(accuracy_score(y[te], m_b.fit(X[tr],y[tr]).predict(X[te])))
    t, p = ttest_rel(scores_a, scores_b)
    print(f"Ex34 — paired t-test: LogReg={np.mean(scores_a):.3f} vs DTree={np.mean(scores_b):.3f}")
    print(f"       t={t:.3f}, p={p:.4f} ({'significant' if p<0.05 else 'not significant'})")

def ex35():
    """Full evaluation report function"""
    def evaluation_report(model, X_tr, y_tr, X_te, y_te, name="Model"):
        model.fit(X_tr, y_tr)
        pred = model.predict(X_te)
        proba = model.predict_proba(X_te)[:, 1]
        return {
            "name": name,
            "acc":    accuracy_score(y_te, pred),
            "prec":   precision_score(y_te, pred, zero_division=0),
            "rec":    recall_score(y_te, pred, zero_division=0),
            "f1":     f1_score(y_te, pred, zero_division=0),
            "auc":    roc_auc_score(y_te, proba),
            "logloss": log_loss(y_te, model.predict_proba(X_te)),
        }
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    r = evaluation_report(LogisticRegression(max_iter=300), X_tr, y_tr, X_te, y_te, "LogReg")
    print(f"Ex35 — evaluation report: {r['name']}")
    for k, v in list(r.items())[1:]:
        print(f"       {k}: {v:.4f}")

def ex36():
    """Classification threshold analysis"""
    X, y = make_classification(n_samples=200, n_features=5, weights=[0.7,0.3], random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    print("Ex36 — threshold analysis:")
    print(f"       {'Threshold':>10s} {'Prec':>6s} {'Rec':>6s} {'F1':>6s}")
    for thr in [0.3, 0.4, 0.5, 0.6, 0.7]:
        pred = (proba >= thr).astype(int)
        print(f"       {thr:10.1f} {precision_score(y_te,pred,zero_division=0):6.3f} "
              f"{recall_score(y_te,pred,zero_division=0):6.3f} {f1_score(y_te,pred,zero_division=0):6.3f}")

def ex37():
    """Cost-sensitive evaluation"""
    y_true = np.array([1, 0, 1, 1, 0, 0, 1, 0, 0, 1])
    y_pred = np.array([1, 1, 1, 0, 0, 1, 1, 0, 0, 0])
    # Cost matrix: FP cost = 1, FN cost = 5 (missing a positive is expensive)
    cost_matrix = {("FP"): 1, ("FN"): 5, ("TP"): 0, ("TN"): 0}
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    total_cost = fp * cost_matrix["FP"] + fn * cost_matrix["FN"]
    print(f"Ex37 — cost-sensitive: TP={tp} TN={tn} FP={fp} FN={fn}")
    print(f"       total cost (FP=1, FN=5): {total_cost} | "
          f"avg cost per sample: {total_cost/len(y_true):.2f}")

def ex38():
    """Custom evaluation metric + scorer"""
    from sklearn.metrics import make_scorer
    def weighted_f_beta(y_true, y_pred, beta=2.0):
        p = precision_score(y_true, y_pred, zero_division=0)
        r = recall_score(y_true, y_pred, zero_division=0)
        if p + r == 0: return 0.0
        return (1 + beta**2) * p * r / (beta**2 * p + r)
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    scorer = make_scorer(weighted_f_beta, beta=2.0)
    scores = cross_val_score(LogisticRegression(max_iter=300), X, y, cv=5, scoring=scorer)
    print(f"Ex38 — F2 custom scorer: {scores.round(3)} | mean={scores.mean():.3f}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Evaluation with data drift (covariate shift)"""
    rng = np.random.default_rng(0)
    X_train = rng.random((100, 4))
    y_train = (X_train[:, 0] + X_train[:, 1] > 1.0).astype(int)
    model = LogisticRegression(max_iter=300).fit(X_train, y_train)
    # Test set with drift: shifted distribution
    X_test_clean = rng.random((50, 4))
    X_test_drift = rng.random((50, 4)) + 0.5   # shifted
    y_test_clean = (X_test_clean[:,0]+X_test_clean[:,1]>1.0).astype(int)
    y_test_drift = (X_test_drift[:,0]+X_test_drift[:,1]>1.0).astype(int)
    acc_clean = accuracy_score(y_test_clean, model.predict(X_test_clean))
    acc_drift = accuracy_score(y_test_drift, model.predict(X_test_drift))
    print(f"Ex39 — data drift: clean acc={acc_clean:.3f} | drifted acc={acc_drift:.3f} "
          f"| degradation={acc_clean-acc_drift:.3f}")

def ex40():
    """Time-aware cross validation"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    tscv = TimeSeriesSplit(n_splits=5, gap=5)
    model = LogisticRegression(max_iter=300)
    scores = []
    for i, (tr, te) in enumerate(tscv.split(X)):
        model.fit(X[tr], y[tr])
        s = accuracy_score(y[te], model.predict(X[te]))
        scores.append(s)
        print(f"Ex40 — TimeSeries fold {i+1}: train_size={len(tr)} test_size={len(te)} acc={s:.3f}")
    print(f"       mean acc: {np.mean(scores):.3f}")

def ex41():
    """Group K-Fold"""
    X, y = make_classification(n_samples=120, n_features=5, random_state=0)
    groups = np.array([i // 12 for i in range(120)])   # 10 groups of 12
    gkf = GroupKFold(n_splits=5)
    model = LogisticRegression(max_iter=300)
    scores = []
    for tr, te in gkf.split(X, y, groups):
        model.fit(X[tr], y[tr])
        scores.append(accuracy_score(y[te], model.predict(X[te])))
        # Verify no group overlap
        assert len(set(groups[tr]) & set(groups[te])) == 0
    print(f"Ex41 — GroupKFold: scores={[round(s,3) for s in scores]} | "
          f"mean={np.mean(scores):.3f} (no group leakage)")

def ex42():
    """Stratified Group K-Fold"""
    X, y = make_classification(n_samples=120, n_features=5, random_state=0)
    groups = np.array([i // 4 for i in range(120)])   # 30 groups of 4
    sgkf = StratifiedGroupKFold(n_splits=5)
    model = LogisticRegression(max_iter=300)
    scores = []
    for tr, te in sgkf.split(X, y, groups):
        model.fit(X[tr], y[tr])
        scores.append(accuracy_score(y[te], model.predict(X[te])))
    print(f"Ex42 — StratifiedGroupKFold: scores={[round(s,3) for s in scores]} | "
          f"mean={np.mean(scores):.3f}")

def ex43():
    """Evaluation dashboard (print table)"""
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    X, y = make_classification(n_samples=300, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    models = {
        "LogReg":  LogisticRegression(max_iter=300),
        "DTree":   DecisionTreeClassifier(max_depth=5, random_state=0),
        "RF":      RandomForestClassifier(n_estimators=100, random_state=0),
        "GB":      GradientBoostingClassifier(n_estimators=100, random_state=0),
    }
    print("Ex43 — evaluation dashboard:")
    hdr = f"{'Model':10s} {'Acc':>5s} {'Prec':>5s} {'Rec':>5s} {'F1':>5s} {'AUC':>5s}"
    print(f"       {hdr}")
    print("       " + "-" * len(hdr))
    for name, m in models.items():
        m.fit(X_tr, y_tr); pred = m.predict(X_te)
        proba = m.predict_proba(X_te)[:, 1]
        row = (f"{name:10s} {accuracy_score(y_te,pred):5.3f} "
               f"{precision_score(y_te,pred):5.3f} {recall_score(y_te,pred):5.3f} "
               f"{f1_score(y_te,pred):5.3f} {roc_auc_score(y_te,proba):5.3f}")
        print(f"       {row}")

def ex44():
    """Statistical significance testing for ML"""
    from scipy.stats import ttest_rel, wilcoxon
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    kf = StratifiedKFold(n_splits=10, shuffle=True, random_state=0)
    model_a = LogisticRegression(max_iter=300)
    model_b = RandomForestClassifier(n_estimators=50, random_state=0)
    scores_a, scores_b = [], []
    for tr, te in kf.split(X, y):
        scores_a.append(accuracy_score(y[te], model_a.fit(X[tr],y[tr]).predict(X[te])))
        scores_b.append(accuracy_score(y[te], model_b.fit(X[tr],y[tr]).predict(X[te])))
    t_stat, t_p = ttest_rel(scores_a, scores_b)
    w_stat, w_p = wilcoxon(scores_a, scores_b)
    print(f"Ex44 — significance: LogReg={np.mean(scores_a):.3f} vs RF={np.mean(scores_b):.3f}")
    print(f"       paired t-test: t={t_stat:.3f}, p={t_p:.4f}")
    print(f"       Wilcoxon:      w={w_stat:.1f}, p={w_p:.4f}")

def ex45():
    """Multiple comparison correction (Bonferroni)"""
    from scipy.stats import ttest_rel
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
    models = {
        "LogReg": LogisticRegression(max_iter=300),
        "DTree":  DecisionTreeClassifier(max_depth=4, random_state=0),
        "RF":     RandomForestClassifier(n_estimators=30, random_state=0),
    }
    fold_scores = {name: [] for name in models}
    for tr, te in kf.split(X, y):
        for name, m in models.items():
            fold_scores[name].append(accuracy_score(y[te], m.fit(X[tr],y[tr]).predict(X[te])))
    names = list(models.keys())
    n_comparisons = len(names) * (len(names)-1) // 2
    print(f"Ex45 — Bonferroni correction ({n_comparisons} comparisons, α=0.05 → α'={0.05/n_comparisons:.4f}):")
    for i in range(len(names)):
        for j in range(i+1, len(names)):
            _, p = ttest_rel(fold_scores[names[i]], fold_scores[names[j]])
            sig = "significant" if p < 0.05/n_comparisons else "not significant"
            print(f"       {names[i]} vs {names[j]}: p={p:.4f} ({sig})")

def ex46():
    """Evaluation under class imbalance"""
    rng = np.random.default_rng(0)
    X, y = make_classification(n_samples=300, n_features=6, weights=[0.9,0.1],
                                random_state=0, n_informative=4)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, stratify=y, random_state=0)
    models = {
        "default":  LogisticRegression(max_iter=300),
        "balanced": LogisticRegression(max_iter=300, class_weight="balanced"),
    }
    print("Ex46 — imbalanced evaluation:")
    for name, m in models.items():
        m.fit(X_tr, y_tr); pred = m.predict(X_te)
        proba = m.predict_proba(X_te)[:, 1]
        print(f"       {name:10s}: acc={accuracy_score(y_te,pred):.3f} | "
              f"bal_acc={balanced_accuracy_score(y_te,pred):.3f} | "
              f"f1={f1_score(y_te,pred,zero_division=0):.3f} | "
              f"auc={roc_auc_score(y_te,proba):.3f}")

def ex47():
    """Evaluation with missing labels (partial annotation)"""
    rng = np.random.default_rng(3)
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    pred = model.predict(X_te)
    # Simulate 20% missing labels
    observed_mask = rng.random(len(y_te)) > 0.2
    acc_full   = accuracy_score(y_te, pred)
    acc_partial = accuracy_score(y_te[observed_mask], pred[observed_mask])
    print(f"Ex47 — missing labels: full acc={acc_full:.3f} | "
          f"partial ({observed_mask.sum()}/{len(y_te)} labeled): {acc_partial:.3f}")

def ex48():
    """Regression evaluation with outlier detection"""
    rng = np.random.default_rng(0)
    X, y = make_regression(n_samples=100, n_features=3, noise=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LinearRegression().fit(X_tr, y_tr)
    pred = model.predict(X_te)
    residuals = y_te - pred
    # Identify outlier predictions
    z_scores = np.abs((residuals - residuals.mean()) / residuals.std())
    outlier_mask = z_scores > 2.5
    rmse_all     = np.sqrt(mean_squared_error(y_te, pred))
    rmse_no_out  = np.sqrt(mean_squared_error(y_te[~outlier_mask], pred[~outlier_mask]))
    print(f"Ex48 — regression with outliers: RMSE_all={rmse_all:.3f} | "
          f"RMSE_no_outliers={rmse_no_out:.3f} | outliers={outlier_mask.sum()}/{len(y_te)}")

def ex49():
    """Production evaluation pipeline"""
    import time
    class ProductionEvaluator:
        def __init__(self):
            self.records = []
        def evaluate_batch(self, model, X, y_true, batch_id=0):
            t0 = time.perf_counter()
            pred  = model.predict(X)
            proba = model.predict_proba(X)[:, 1]
            latency = (time.perf_counter() - t0) * 1000
            record = {
                "batch_id":  batch_id,
                "n_samples": len(X),
                "acc":       accuracy_score(y_true, pred),
                "auc":       roc_auc_score(y_true, proba),
                "latency_ms": round(latency, 2),
            }
            self.records.append(record)
            return record
        def report(self):
            df = pd.DataFrame(self.records)
            print("       batch summary:\n", df.to_string(index=False))
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X[:200], y[:200])
    ev = ProductionEvaluator()
    print("Ex49 — production evaluator:")
    for bid, start in enumerate(range(200, 300, 25)):
        ev.evaluate_batch(model, X[start:start+25], y[start:start+25], batch_id=bid)
    ev.report()

def ex50():
    """Evaluation best practices checklist"""
    checks = [
        ("Always split data BEFORE any fitting/preprocessing",                   True),
        ("Use stratified splits for imbalanced classes",                         True),
        ("Report multiple metrics (not just accuracy)",                          True),
        ("Compute confidence intervals for reported metrics",                    True),
        ("Use nested CV to avoid optimistic bias from hyperparameter tuning",    True),
        ("Evaluate on held-out test set only ONCE",                              True),
        ("Check calibration of probability predictions",                         True),
        ("Use statistical tests when comparing models",                          True),
        ("Apply Bonferroni/FDR correction for multiple comparisons",             True),
        ("Monitor for data drift in production",                                 True),
        ("Report balanced accuracy / F1 for imbalanced datasets",               True),
        ("Document evaluation protocol for reproducibility",                     True),
    ]
    print("Ex50 — Evaluation best practices checklist:")
    for desc, done in checks:
        print(f"       [{'x' if done else ' '}] {desc}")


def main():
    print("=" * 60)
    print("Examples 1.5 — Model Evaluation & Validation")
    print("=" * 60)

    print("\n─── BASIC (1–13) ───")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()

    print("\n─── INTERMEDIATE (14–26) ───")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()

    print("\n─── NESTED (27–38) ───")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()

    print("\n─── ADVANCED (39–50) ───")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
