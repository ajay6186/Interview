# ============================================================
# Examples 5.2 — Evaluation Metrics (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, balanced_accuracy_score, matthews_corrcoef,
    cohen_kappa_score, roc_auc_score, average_precision_score,
    mean_squared_error, mean_absolute_error, r2_score,
    explained_variance_score, median_absolute_error,
    roc_curve, precision_recall_curve, log_loss, brier_score_loss
)
from scipy import stats

# Shared data for all examples
np.random.seed(42)
X_cls, y_cls = make_classification(n_samples=300, n_features=10, random_state=42)
X_reg, y_reg = make_regression(n_samples=300, n_features=10, noise=20, random_state=42)

_clf = LogisticRegression(max_iter=1000).fit(X_cls[:200], y_cls[:200])
y_pred_cls = _clf.predict(X_cls[200:])
y_prob_cls = _clf.predict_proba(X_cls[200:])[:, 1]
y_true_cls = y_cls[200:]

_reg = Ridge(alpha=1.0).fit(X_reg[:200], y_reg[:200])
y_pred_reg = _reg.predict(X_reg[200:])
y_true_reg = y_reg[200:]

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Accuracy from scratch"""
    def accuracy_scratch(y_true, y_pred):
        return np.mean(y_true == y_pred)

    acc_scratch = accuracy_scratch(y_true_cls, y_pred_cls)
    acc_sklearn = accuracy_score(y_true_cls, y_pred_cls)
    print(f"Ex01 — Accuracy scratch={acc_scratch:.4f}, sklearn={acc_sklearn:.4f}, match={np.isclose(acc_scratch, acc_sklearn)}")

def ex02():
    """Precision from scratch"""
    def precision_scratch(y_true, y_pred):
        tp = np.sum((y_pred == 1) & (y_true == 1))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        return tp / (tp + fp + 1e-10)

    p_scratch = precision_scratch(y_true_cls, y_pred_cls)
    p_sklearn = precision_score(y_true_cls, y_pred_cls)
    print(f"Ex02 — Precision scratch={p_scratch:.4f}, sklearn={p_sklearn:.4f}, match={np.isclose(p_scratch, p_sklearn, atol=1e-4)}")

def ex03():
    """Recall from scratch"""
    def recall_scratch(y_true, y_pred):
        tp = np.sum((y_pred == 1) & (y_true == 1))
        fn = np.sum((y_pred == 0) & (y_true == 1))
        return tp / (tp + fn + 1e-10)

    r_scratch = recall_scratch(y_true_cls, y_pred_cls)
    r_sklearn = recall_score(y_true_cls, y_pred_cls)
    print(f"Ex03 — Recall scratch={r_scratch:.4f}, sklearn={r_sklearn:.4f}, match={np.isclose(r_scratch, r_sklearn, atol=1e-4)}")

def ex04():
    """F1 score from scratch"""
    def f1_scratch(y_true, y_pred):
        tp = np.sum((y_pred == 1) & (y_true == 1))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        fn = np.sum((y_pred == 0) & (y_true == 1))
        p = tp / (tp + fp + 1e-10)
        r = tp / (tp + fn + 1e-10)
        return 2 * p * r / (p + r + 1e-10)

    f1_s = f1_scratch(y_true_cls, y_pred_cls)
    f1_sk = f1_score(y_true_cls, y_pred_cls)
    print(f"Ex04 — F1 scratch={f1_s:.4f}, sklearn={f1_sk:.4f}, match={np.isclose(f1_s, f1_sk, atol=1e-4)}")

def ex05():
    """Confusion matrix from scratch"""
    def cm_scratch(y_true, y_pred):
        classes = np.unique(y_true)
        n = len(classes)
        cm = np.zeros((n, n), dtype=int)
        for i, actual in enumerate(classes):
            for j, pred in enumerate(classes):
                cm[i, j] = np.sum((y_true == actual) & (y_pred == pred))
        return cm

    cm_s = cm_scratch(y_true_cls, y_pred_cls)
    cm_sk = confusion_matrix(y_true_cls, y_pred_cls)
    print(f"Ex05 — CM scratch:\n{cm_s}\n       CM sklearn:\n{cm_sk}\n       match={np.array_equal(cm_s, cm_sk)}")

def ex06():
    """TP, TN, FP, FN counts"""
    cm = confusion_matrix(y_true_cls, y_pred_cls)
    tn, fp, fn, tp = cm.ravel()
    print(f"Ex06 — TP={tp}, TN={tn}, FP={fp}, FN={fn}, total={tp+tn+fp+fn}")

def ex07():
    """Specificity (true negative rate) from scratch"""
    def specificity(y_true, y_pred):
        tn = np.sum((y_pred == 0) & (y_true == 0))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        return tn / (tn + fp + 1e-10)

    spec = specificity(y_true_cls, y_pred_cls)
    cm = confusion_matrix(y_true_cls, y_pred_cls)
    tn, fp, _, _ = cm.ravel()
    spec_check = tn / (tn + fp)
    print(f"Ex07 — Specificity scratch={spec:.4f}, check={spec_check:.4f}")

def ex08():
    """Balanced accuracy"""
    ba_scratch = (recall_score(y_true_cls, y_pred_cls) +
                  recall_score(1 - y_true_cls, 1 - y_pred_cls)) / 2
    ba_sklearn = balanced_accuracy_score(y_true_cls, y_pred_cls)
    print(f"Ex08 — Balanced Accuracy scratch={ba_scratch:.4f}, sklearn={ba_sklearn:.4f}")

def ex09():
    """Matthews Correlation Coefficient from scratch"""
    def mcc_scratch(y_true, y_pred):
        tp = np.sum((y_pred == 1) & (y_true == 1))
        tn = np.sum((y_pred == 0) & (y_true == 0))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        fn = np.sum((y_pred == 0) & (y_true == 1))
        num = tp * tn - fp * fn
        den = np.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn) + 1e-10)
        return num / den

    mcc_s = mcc_scratch(y_true_cls, y_pred_cls)
    mcc_sk = matthews_corrcoef(y_true_cls, y_pred_cls)
    print(f"Ex09 — MCC scratch={mcc_s:.4f}, sklearn={mcc_sk:.4f}, match={np.isclose(mcc_s, mcc_sk, atol=1e-4)}")

def ex10():
    """Cohen's Kappa"""
    kappa = cohen_kappa_score(y_true_cls, y_pred_cls)
    n = len(y_true_cls)
    cm = confusion_matrix(y_true_cls, y_pred_cls)
    po = np.trace(cm) / n
    pe = np.sum(cm.sum(axis=0) * cm.sum(axis=1)) / (n * n)
    kappa_scratch = (po - pe) / (1 - pe)
    print(f"Ex10 — Cohen's Kappa sklearn={kappa:.4f}, scratch={kappa_scratch:.4f}")

def ex11():
    """ROC-AUC with sklearn"""
    auc = roc_auc_score(y_true_cls, y_prob_cls)
    print(f"Ex11 — ROC-AUC={auc:.4f}")

def ex12():
    """Average precision (PR-AUC)"""
    ap = average_precision_score(y_true_cls, y_prob_cls)
    print(f"Ex12 — Average Precision (PR-AUC)={ap:.4f}")

def ex13():
    """MSE from scratch"""
    def mse_scratch(y_true, y_pred):
        return np.mean((y_true - y_pred) ** 2)

    mse_s = mse_scratch(y_true_reg, y_pred_reg)
    mse_sk = mean_squared_error(y_true_reg, y_pred_reg)
    print(f"Ex13 — MSE scratch={mse_s:.4f}, sklearn={mse_sk:.4f}, match={np.isclose(mse_s, mse_sk)}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """RMSE from scratch"""
    def rmse_scratch(y_true, y_pred):
        return np.sqrt(np.mean((y_true - y_pred) ** 2))

    rmse_s = rmse_scratch(y_true_reg, y_pred_reg)
    rmse_sk = np.sqrt(mean_squared_error(y_true_reg, y_pred_reg))
    print(f"Ex14 — RMSE scratch={rmse_s:.4f}, sklearn={rmse_sk:.4f}")

def ex15():
    """MAE from scratch"""
    def mae_scratch(y_true, y_pred):
        return np.mean(np.abs(y_true - y_pred))

    mae_s = mae_scratch(y_true_reg, y_pred_reg)
    mae_sk = mean_absolute_error(y_true_reg, y_pred_reg)
    print(f"Ex15 — MAE scratch={mae_s:.4f}, sklearn={mae_sk:.4f}")

def ex16():
    """R² from scratch"""
    def r2_scratch(y_true, y_pred):
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - y_true.mean()) ** 2)
        return 1 - ss_res / (ss_tot + 1e-10)

    r2_s = r2_scratch(y_true_reg, y_pred_reg)
    r2_sk = r2_score(y_true_reg, y_pred_reg)
    print(f"Ex16 — R² scratch={r2_s:.4f}, sklearn={r2_sk:.4f}, match={np.isclose(r2_s, r2_sk, atol=1e-4)}")

def ex17():
    """MAPE from scratch"""
    def mape_scratch(y_true, y_pred):
        return np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + 1e-10))) * 100

    mape = mape_scratch(y_true_reg, y_pred_reg)
    print(f"Ex17 — MAPE={mape:.2f}%")

def ex18():
    """Huber loss"""
    def huber_loss(y_true, y_pred, delta=1.0):
        residual = np.abs(y_true - y_pred)
        loss = np.where(residual <= delta,
                        0.5 * residual ** 2,
                        delta * (residual - 0.5 * delta))
        return np.mean(loss)

    hl = huber_loss(y_true_reg, y_pred_reg, delta=10.0)
    mse = mean_squared_error(y_true_reg, y_pred_reg)
    print(f"Ex18 — Huber loss (delta=10)={hl:.4f}, MSE={mse:.4f}")

def ex19():
    """Explained variance score"""
    evs = explained_variance_score(y_true_reg, y_pred_reg)
    r2 = r2_score(y_true_reg, y_pred_reg)
    print(f"Ex19 — Explained Variance={evs:.4f}, R²={r2:.4f} "
          f"(differ when bias≠0: diff={evs - r2:.6f})")

def ex20():
    """Median absolute error"""
    med_ae = median_absolute_error(y_true_reg, y_pred_reg)
    mae = mean_absolute_error(y_true_reg, y_pred_reg)
    print(f"Ex20 — Median AE={med_ae:.4f}, Mean AE={mae:.4f} "
          f"(MedAE more robust to outliers)")

def ex21():
    """Multi-class accuracy"""
    X_mc, y_mc = make_classification(n_samples=300, n_classes=3,
                                      n_informative=5, random_state=42)
    from sklearn.linear_model import LogisticRegression as LR
    model = LR(max_iter=1000, multi_class='multinomial').fit(X_mc[:200], y_mc[:200])
    preds = model.predict(X_mc[200:])
    acc = accuracy_score(y_mc[200:], preds)
    print(f"Ex21 — Multi-class accuracy={acc:.4f}")

def ex22():
    """Macro precision, recall, F1"""
    X_mc, y_mc = make_classification(n_samples=300, n_classes=3,
                                      n_informative=5, random_state=42)
    from sklearn.linear_model import LogisticRegression as LR
    model = LR(max_iter=1000).fit(X_mc[:200], y_mc[:200])
    preds = model.predict(X_mc[200:])
    p = precision_score(y_mc[200:], preds, average='macro')
    r = recall_score(y_mc[200:], preds, average='macro')
    f = f1_score(y_mc[200:], preds, average='macro')
    print(f"Ex22 — Macro: precision={p:.4f}, recall={r:.4f}, F1={f:.4f}")

def ex23():
    """Micro precision, recall, F1"""
    X_mc, y_mc = make_classification(n_samples=300, n_classes=3,
                                      n_informative=5, random_state=42)
    from sklearn.linear_model import LogisticRegression as LR
    model = LR(max_iter=1000).fit(X_mc[:200], y_mc[:200])
    preds = model.predict(X_mc[200:])
    p = precision_score(y_mc[200:], preds, average='micro')
    r = recall_score(y_mc[200:], preds, average='micro')
    f = f1_score(y_mc[200:], preds, average='micro')
    print(f"Ex23 — Micro: precision={p:.4f}, recall={r:.4f}, F1={f:.4f} "
          f"(all equal micro accuracy for multi-class)")

def ex24():
    """Weighted F1"""
    X_mc, y_mc = make_classification(n_samples=300, n_classes=3,
                                      n_informative=5, random_state=42)
    from sklearn.linear_model import LogisticRegression as LR
    model = LR(max_iter=1000).fit(X_mc[:200], y_mc[:200])
    preds = model.predict(X_mc[200:])
    f_w = f1_score(y_mc[200:], preds, average='weighted')
    f_m = f1_score(y_mc[200:], preds, average='macro')
    print(f"Ex24 — Weighted F1={f_w:.4f}, Macro F1={f_m:.4f}")

def ex25():
    """ROC curve data: TPR/FPR at thresholds"""
    fpr, tpr, thresholds = roc_curve(y_true_cls, y_prob_cls)
    auc = roc_auc_score(y_true_cls, y_prob_cls)
    best_idx = np.argmax(tpr - fpr)
    print(f"Ex25 — ROC: {len(fpr)} thresholds, AUC={auc:.4f}, "
          f"best threshold={thresholds[best_idx]:.3f} (TPR={tpr[best_idx]:.3f}, FPR={fpr[best_idx]:.3f})")

def ex26():
    """PR curve data: precision/recall at thresholds"""
    precision_arr, recall_arr, thresholds = precision_recall_curve(y_true_cls, y_prob_cls)
    ap = average_precision_score(y_true_cls, y_prob_cls)
    f1_vals = 2 * precision_arr * recall_arr / (precision_arr + recall_arr + 1e-10)
    best_idx = np.argmax(f1_vals[:-1])
    print(f"Ex26 — PR curve: AP={ap:.4f}, best threshold={thresholds[best_idx]:.3f} "
          f"(P={precision_arr[best_idx]:.3f}, R={recall_arr[best_idx]:.3f})")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """MetricsCalculator class for all classification metrics"""
    class MetricsCalculator:
        def __init__(self, y_true, y_pred, y_prob=None):
            self.y_true = y_true
            self.y_pred = y_pred
            self.y_prob = y_prob

        def all_metrics(self):
            cm = confusion_matrix(self.y_true, self.y_pred)
            tn, fp, fn, tp = cm.ravel()
            return {
                'accuracy':  round(accuracy_score(self.y_true, self.y_pred), 4),
                'precision': round(precision_score(self.y_true, self.y_pred), 4),
                'recall':    round(recall_score(self.y_true, self.y_pred), 4),
                'f1':        round(f1_score(self.y_true, self.y_pred), 4),
                'specificity': round(tn / (tn + fp), 4),
                'mcc':       round(matthews_corrcoef(self.y_true, self.y_pred), 4),
                'auc':       round(roc_auc_score(self.y_true, self.y_prob), 4) if self.y_prob is not None else None,
            }

    mc = MetricsCalculator(y_true_cls, y_pred_cls, y_prob_cls)
    print(f"Ex27 — MetricsCalculator: {mc.all_metrics()}")

def ex28():
    """RegressionMetrics class for all regression metrics"""
    class RegressionMetrics:
        def __init__(self, y_true, y_pred):
            self.y_true = y_true
            self.y_pred = y_pred

        def all_metrics(self):
            return {
                'mse':      round(mean_squared_error(self.y_true, self.y_pred), 4),
                'rmse':     round(np.sqrt(mean_squared_error(self.y_true, self.y_pred)), 4),
                'mae':      round(mean_absolute_error(self.y_true, self.y_pred), 4),
                'r2':       round(r2_score(self.y_true, self.y_pred), 4),
                'mape':     round(np.mean(np.abs((self.y_true - self.y_pred) / (np.abs(self.y_true) + 1e-10))) * 100, 2),
                'med_ae':   round(median_absolute_error(self.y_true, self.y_pred), 4),
                'exp_var':  round(explained_variance_score(self.y_true, self.y_pred), 4),
            }

    rm = RegressionMetrics(y_true_reg, y_pred_reg)
    print(f"Ex28 — RegressionMetrics: {rm.all_metrics()}")

def ex29():
    """MultiClassMetrics class"""
    class MultiClassMetrics:
        def __init__(self, y_true, y_pred):
            self.y_true = y_true
            self.y_pred = y_pred

        def report(self):
            return {
                'accuracy': round(accuracy_score(self.y_true, self.y_pred), 4),
                'macro_f1': round(f1_score(self.y_true, self.y_pred, average='macro'), 4),
                'micro_f1': round(f1_score(self.y_true, self.y_pred, average='micro'), 4),
                'weighted_f1': round(f1_score(self.y_true, self.y_pred, average='weighted'), 4),
                'per_class_f1': f1_score(self.y_true, self.y_pred, average=None).round(4).tolist(),
            }

    X_mc, y_mc = make_classification(n_samples=300, n_classes=3,
                                      n_informative=5, random_state=42)
    from sklearn.linear_model import LogisticRegression as LR
    model = LR(max_iter=1000).fit(X_mc[:200], y_mc[:200])
    mcm = MultiClassMetrics(y_mc[200:], model.predict(X_mc[200:]))
    print(f"Ex29 — MultiClassMetrics: {mcm.report()}")

def ex30():
    """BinaryEvaluator class with full report"""
    class BinaryEvaluator:
        def __init__(self, model):
            self.model = model

        def evaluate(self, X_train, y_train, X_test, y_test):
            self.model.fit(X_train, y_train)
            y_pred = self.model.predict(X_test)
            y_prob = self.model.predict_proba(X_test)[:, 1]
            cm = confusion_matrix(y_test, y_pred)
            tn, fp, fn, tp = cm.ravel()
            return {
                'accuracy':    round(accuracy_score(y_test, y_pred), 4),
                'precision':   round(precision_score(y_test, y_pred), 4),
                'recall':      round(recall_score(y_test, y_pred), 4),
                'f1':          round(f1_score(y_test, y_pred), 4),
                'specificity': round(tn / (tn + fp), 4),
                'roc_auc':     round(roc_auc_score(y_test, y_prob), 4),
                'pr_auc':      round(average_precision_score(y_test, y_prob), 4),
                'mcc':         round(matthews_corrcoef(y_test, y_pred), 4),
            }

    be = BinaryEvaluator(LogisticRegression(max_iter=1000))
    report = be.evaluate(X_cls[:200], y_cls[:200], X_cls[200:], y_cls[200:])
    print(f"Ex30 — BinaryEvaluator: {report}")

def ex31():
    """ROCAnalyzer class with curve + optimal threshold"""
    class ROCAnalyzer:
        def __init__(self, y_true, y_prob):
            self.fpr, self.tpr, self.thresholds = roc_curve(y_true, y_prob)
            self.auc = roc_auc_score(y_true, y_prob)

        def optimal_threshold(self, method='youden'):
            if method == 'youden':
                idx = np.argmax(self.tpr - self.fpr)
            elif method == 'f1':
                f1_vals = 2 * self.tpr * (1 - self.fpr) / (self.tpr + (1 - self.fpr) + 1e-10)
                idx = np.argmax(f1_vals)
            return self.thresholds[idx]

        def summary(self):
            return {'auc': round(self.auc, 4),
                    'optimal_threshold': round(self.optimal_threshold(), 4),
                    'n_thresholds': len(self.thresholds)}

    ra = ROCAnalyzer(y_true_cls, y_prob_cls)
    print(f"Ex31 — ROCAnalyzer: {ra.summary()}")

def ex32():
    """PRAnalyzer class with curve + best F1 threshold"""
    class PRAnalyzer:
        def __init__(self, y_true, y_prob):
            self.precision_arr, self.recall_arr, self.thresholds = \
                precision_recall_curve(y_true, y_prob)
            self.ap = average_precision_score(y_true, y_prob)

        def best_f1_threshold(self):
            f1_vals = 2 * self.precision_arr[:-1] * self.recall_arr[:-1] / \
                      (self.precision_arr[:-1] + self.recall_arr[:-1] + 1e-10)
            idx = np.argmax(f1_vals)
            return self.thresholds[idx], f1_vals[idx]

        def summary(self):
            thresh, best_f1 = self.best_f1_threshold()
            return {'ap': round(self.ap, 4),
                    'best_f1_threshold': round(thresh, 4),
                    'best_f1': round(best_f1, 4)}

    pra = PRAnalyzer(y_true_cls, y_prob_cls)
    print(f"Ex32 — PRAnalyzer: {pra.summary()}")

def ex33():
    """CalibrationAnalyzer class (reliability diagram data)"""
    class CalibrationAnalyzer:
        def __init__(self, y_true, y_prob, n_bins=10):
            self.y_true = y_true
            self.y_prob = y_prob
            self.n_bins = n_bins

        def reliability_data(self):
            bins = np.linspace(0, 1, self.n_bins + 1)
            bin_means, bin_fracs = [], []
            for low, high in zip(bins[:-1], bins[1:]):
                mask = (self.y_prob >= low) & (self.y_prob < high)
                if mask.sum() > 0:
                    bin_means.append(self.y_prob[mask].mean())
                    bin_fracs.append(self.y_true[mask].mean())
            return np.array(bin_means), np.array(bin_fracs)

        def calibration_error(self):
            mean_probs, true_fracs = self.reliability_data()
            return np.mean(np.abs(mean_probs - true_fracs))

    ca = CalibrationAnalyzer(y_true_cls, y_prob_cls)
    ece = ca.calibration_error()
    m, f = ca.reliability_data()
    print(f"Ex33 — CalibrationAnalyzer: ECE={ece:.4f}, bins={len(m)}")

def ex34():
    """Full evaluation report for binary classification"""
    def binary_eval_report(y_true, y_pred, y_prob):
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
        report = {
            'n_samples': len(y_true),
            'positive_rate': round(y_true.mean(), 3),
            'accuracy':    round(accuracy_score(y_true, y_pred), 4),
            'precision':   round(precision_score(y_true, y_pred), 4),
            'recall':      round(recall_score(y_true, y_pred), 4),
            'specificity': round(tn / (tn + fp), 4),
            'f1':          round(f1_score(y_true, y_pred), 4),
            'mcc':         round(matthews_corrcoef(y_true, y_pred), 4),
            'roc_auc':     round(roc_auc_score(y_true, y_prob), 4),
            'pr_auc':      round(average_precision_score(y_true, y_prob), 4),
            'log_loss':    round(log_loss(y_true, y_prob), 4),
            'brier':       round(brier_score_loss(y_true, y_prob), 4),
        }
        return report

    report = binary_eval_report(y_true_cls, y_pred_cls, y_prob_cls)
    print("Ex34 — Full binary eval report:")
    for k, v in report.items():
        print(f"       {k}: {v}")

def ex35():
    """Full evaluation report for regression"""
    def regression_eval_report(y_true, y_pred):
        residuals = y_true - y_pred
        return {
            'n_samples': len(y_true),
            'mse':      round(mean_squared_error(y_true, y_pred), 4),
            'rmse':     round(np.sqrt(mean_squared_error(y_true, y_pred)), 4),
            'mae':      round(mean_absolute_error(y_true, y_pred), 4),
            'mape':     round(np.mean(np.abs(residuals / (np.abs(y_true) + 1e-10))) * 100, 2),
            'r2':       round(r2_score(y_true, y_pred), 4),
            'exp_var':  round(explained_variance_score(y_true, y_pred), 4),
            'med_ae':   round(median_absolute_error(y_true, y_pred), 4),
            'residual_std': round(residuals.std(), 4),
        }

    report = regression_eval_report(y_true_reg, y_pred_reg)
    print(f"Ex35 — Full regression eval report: {report}")

def ex36():
    """Metrics comparison table for N models"""
    def metrics_table(models_dict, X_train, y_train, X_test, y_test):
        rows = []
        for name, model in models_dict.items():
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            probs = model.predict_proba(X_test)[:, 1]
            rows.append({
                'model': name,
                'accuracy': round(accuracy_score(y_test, preds), 4),
                'f1':       round(f1_score(y_test, preds), 4),
                'roc_auc':  round(roc_auc_score(y_test, probs), 4),
            })
        return pd.DataFrame(rows).set_index('model')

    models = {
        'LogReg': LogisticRegression(max_iter=1000),
        'RF':     RandomForestClassifier(n_estimators=20, random_state=42),
    }
    table = metrics_table(models, X_cls[:200], y_cls[:200], X_cls[200:], y_cls[200:])
    print(f"Ex36 — Metrics comparison table:\n{table}")

def ex37():
    """Statistical significance for metric comparison (permutation test)"""
    from sklearn.model_selection import cross_val_score
    from sklearn.linear_model import LogisticRegression as LR
    scores_a = cross_val_score(LR(max_iter=1000), X_cls, y_cls, cv=10, scoring='accuracy')
    scores_b = cross_val_score(RandomForestClassifier(n_estimators=20, random_state=42),
                                X_cls, y_cls, cv=10, scoring='accuracy')
    t_stat, p_val = stats.ttest_rel(scores_a, scores_b)
    winner = 'LR' if scores_a.mean() > scores_b.mean() else 'RF'
    print(f"Ex37 — Statistical comparison: LR={scores_a.mean():.4f}, RF={scores_b.mean():.4f}")
    print(f"       t={t_stat:.3f}, p={p_val:.4f}, significant={'YES' if p_val < 0.05 else 'NO'}, better={winner}")

def ex38():
    """Production metrics dashboard"""
    def metrics_dashboard(y_true, y_pred, y_prob, model_name="Model"):
        cm = confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
        dashboard = {
            'model': model_name,
            'accuracy': round(accuracy_score(y_true, y_pred), 4),
            'precision': round(precision_score(y_true, y_pred), 4),
            'recall': round(recall_score(y_true, y_pred), 4),
            'f1': round(f1_score(y_true, y_pred), 4),
            'roc_auc': round(roc_auc_score(y_true, y_prob), 4),
            'pr_auc': round(average_precision_score(y_true, y_prob), 4),
            'mcc': round(matthews_corrcoef(y_true, y_pred), 4),
            'brier': round(brier_score_loss(y_true, y_prob), 4),
            'tp': int(tp), 'fp': int(fp), 'fn': int(fn), 'tn': int(tn),
        }
        return dashboard

    dash = metrics_dashboard(y_true_cls, y_pred_cls, y_prob_cls, "LogReg")
    print("Ex38 — Production Metrics Dashboard:")
    for k, v in dash.items():
        print(f"       {k}: {v}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """DCG and nDCG for ranking"""
    def dcg(relevances, k=None):
        relevances = np.array(relevances[:k] if k else relevances, dtype=float)
        gains = relevances / np.log2(np.arange(2, len(relevances) + 2))
        return gains.sum()

    def ndcg(relevances, k=None):
        ideal = sorted(relevances, reverse=True)
        dcg_val = dcg(relevances, k)
        idcg_val = dcg(ideal, k)
        return dcg_val / idcg_val if idcg_val > 0 else 0.0

    relevances = [3, 2, 3, 0, 1, 2]
    d = dcg(relevances)
    nd = ndcg(relevances)
    print(f"Ex39 — DCG={d:.4f}, nDCG={nd:.4f} for relevances={relevances}")

def ex40():
    """MRR (Mean Reciprocal Rank)"""
    def mrr(ranked_lists, relevant_item):
        reciprocal_ranks = []
        for ranked in ranked_lists:
            for rank, item in enumerate(ranked, 1):
                if item == relevant_item:
                    reciprocal_ranks.append(1.0 / rank)
                    break
            else:
                reciprocal_ranks.append(0.0)
        return np.mean(reciprocal_ranks)

    queries = [['a', 'b', 'c'], ['b', 'a', 'c'], ['c', 'b', 'a'], ['a', 'c', 'b']]
    relevant = 'a'
    mrr_val = mrr(queries, relevant)
    print(f"Ex40 — MRR for relevant item '{relevant}': {mrr_val:.4f}")

def ex41():
    """Precision@k"""
    def precision_at_k(y_true, y_scores, k):
        top_k_idx = np.argsort(y_scores)[::-1][:k]
        return y_true[top_k_idx].sum() / k

    rng = np.random.RandomState(42)
    y_true_rank = rng.randint(0, 2, 50)
    y_scores_rank = rng.rand(50)
    for k in [5, 10, 20]:
        p_at_k = precision_at_k(y_true_rank, y_scores_rank, k)
        print(f"Ex41 — Precision@{k}={p_at_k:.4f}")

def ex42():
    """Recall@k"""
    def recall_at_k(y_true, y_scores, k):
        top_k_idx = np.argsort(y_scores)[::-1][:k]
        total_relevant = y_true.sum()
        return y_true[top_k_idx].sum() / (total_relevant + 1e-10)

    rng = np.random.RandomState(42)
    y_true_rank = rng.randint(0, 2, 50)
    y_scores_rank = rng.rand(50)
    for k in [5, 10, 20]:
        r_at_k = recall_at_k(y_true_rank, y_scores_rank, k)
        print(f"Ex42 — Recall@{k}={r_at_k:.4f}")

def ex43():
    """AP@k (Average Precision at k)"""
    def ap_at_k(y_true, y_scores, k):
        top_k_idx = np.argsort(y_scores)[::-1][:k]
        hits = 0
        precision_sum = 0
        for i, idx in enumerate(top_k_idx):
            if y_true[idx] == 1:
                hits += 1
                precision_sum += hits / (i + 1)
        total_relevant = min(y_true.sum(), k)
        return precision_sum / (total_relevant + 1e-10)

    rng = np.random.RandomState(42)
    y_true_rank = rng.randint(0, 2, 50)
    y_scores_rank = rng.rand(50)
    for k in [5, 10, 20]:
        ap = ap_at_k(y_true_rank, y_scores_rank, k)
        print(f"Ex43 — AP@{k}={ap:.4f}")

def ex44():
    """mAP (mean Average Precision across queries)"""
    def ap_at_k(y_true, y_scores, k):
        top_k_idx = np.argsort(y_scores)[::-1][:k]
        hits, precision_sum = 0, 0
        for i, idx in enumerate(top_k_idx):
            if y_true[idx] == 1:
                hits += 1
                precision_sum += hits / (i + 1)
        return precision_sum / (min(y_true.sum(), k) + 1e-10)

    rng = np.random.RandomState(42)
    n_queries = 5
    aps = []
    for q in range(n_queries):
        y_t = rng.randint(0, 2, 20)
        y_s = rng.rand(20)
        aps.append(ap_at_k(y_t, y_s, 10))
    map_val = np.mean(aps)
    print(f"Ex44 — mAP@10 over {n_queries} queries={map_val:.4f}, per-query={[round(a,3) for a in aps]}")

def ex45():
    """Concordance index (C-index) for survival analysis"""
    def concordance_index(event_times, predicted_scores, events):
        concordant = discordant = 0
        n = len(event_times)
        for i in range(n):
            for j in range(i + 1, n):
                if events[i] == 1 and events[j] == 1:
                    if event_times[i] != event_times[j]:
                        if event_times[i] < event_times[j]:
                            if predicted_scores[i] > predicted_scores[j]:
                                concordant += 1
                            elif predicted_scores[i] < predicted_scores[j]:
                                discordant += 1
                        else:
                            if predicted_scores[j] > predicted_scores[i]:
                                concordant += 1
                            elif predicted_scores[j] < predicted_scores[i]:
                                discordant += 1
        total = concordant + discordant
        return concordant / total if total > 0 else 0.5

    rng = np.random.RandomState(42)
    times = rng.exponential(10, 30)
    events = rng.randint(0, 2, 30)
    risk_scores = -times + rng.randn(30) * 2
    ci = concordance_index(times, risk_scores, events)
    print(f"Ex45 — Concordance Index (C-index)={ci:.4f}")

def ex46():
    """Brier score for probability calibration"""
    bs = brier_score_loss(y_true_cls, y_prob_cls)
    bs_perfect = brier_score_loss(y_true_cls, y_true_cls.astype(float))
    bs_random = brier_score_loss(y_true_cls, np.full(len(y_true_cls), 0.5))
    print(f"Ex46 — Brier score: model={bs:.4f}, perfect={bs_perfect:.4f}, random={bs_random:.4f}")

def ex47():
    """Log loss"""
    ll = log_loss(y_true_cls, y_prob_cls)
    ll_perfect = log_loss(y_true_cls, np.clip(y_true_cls.astype(float), 1e-7, 1 - 1e-7))
    print(f"Ex47 — Log loss: model={ll:.4f}, perfect≈{ll_perfect:.6f}")

def ex48():
    """Expected Calibration Error (ECE)"""
    def expected_calibration_error(y_true, y_prob, n_bins=10):
        bins = np.linspace(0, 1, n_bins + 1)
        ece = 0
        n = len(y_true)
        for low, high in zip(bins[:-1], bins[1:]):
            mask = (y_prob >= low) & (y_prob < high)
            if mask.sum() > 0:
                conf = y_prob[mask].mean()
                acc = y_true[mask].mean()
                ece += mask.sum() / n * abs(conf - acc)
        return ece

    ece = expected_calibration_error(y_true_cls, y_prob_cls)
    print(f"Ex48 — Expected Calibration Error (ECE)={ece:.4f}")

def ex49():
    """Quantile loss (pinball loss)"""
    def quantile_loss(y_true, y_pred, quantile=0.5):
        residual = y_true - y_pred
        return np.mean(np.maximum(quantile * residual, (quantile - 1) * residual))

    for q in [0.1, 0.5, 0.9]:
        ql = quantile_loss(y_true_reg, y_pred_reg, quantile=q)
        print(f"Ex49 — Quantile loss (q={q}): {ql:.4f}")

def ex50():
    """Tweedie deviance and metrics for imbalanced datasets guide"""
    def tweedie_deviance(y_true, y_pred, power=1.5):
        y_pred = np.maximum(y_pred, 1e-10)
        if power == 0:
            return np.mean((y_true - y_pred) ** 2)
        elif power == 1:
            return 2 * np.mean(y_true * np.log(y_true / (y_pred + 1e-10)) - (y_true - y_pred))
        elif power == 2:
            return 2 * np.mean(np.log(y_true / (y_pred + 1e-10)) + (y_true - y_pred) / (y_pred + 1e-10))
        else:
            t1 = y_true ** (2 - power) / ((1 - power) * (2 - power))
            t2 = y_true * y_pred ** (1 - power) / (1 - power)
            t3 = y_pred ** (2 - power) / (2 - power)
            return 2 * np.mean(t1 - t2 + t3)

    y_pos = np.abs(y_true_reg) + 1
    y_pred_pos = np.abs(y_pred_reg) + 1
    td = tweedie_deviance(y_pos, y_pred_pos, power=1.5)
    print(f"Ex50 — Tweedie Deviance (power=1.5): {td:.4f}")
    print("       Imbalanced dataset metrics guide:")
    guide = {
        'Avoid': 'Accuracy (misleading with imbalance)',
        'Use': 'F1, PR-AUC, MCC, Balanced Accuracy',
        'Threshold': 'Tune via PR curve, not ROC',
        'Sampling': 'SMOTE / class_weight before CV',
    }
    for k, v in guide.items():
        print(f"       {k}: {v}")


def main():
    print("=" * 60)
    print("Examples 5.2 — Evaluation Metrics")
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
