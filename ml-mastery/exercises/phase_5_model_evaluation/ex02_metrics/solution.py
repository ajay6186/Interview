# ============================================================
# Solution 5.2 — Evaluation Metrics
# ============================================================

import numpy as np
from sklearn.metrics import f1_score


def accuracy_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return round(float(np.sum(y_true == y_pred) / len(y_true)), 4)


def confusion_matrix_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    TP = int(np.sum((y_pred == 1) & (y_true == 1)))
    TN = int(np.sum((y_pred == 0) & (y_true == 0)))
    FP = int(np.sum((y_pred == 1) & (y_true == 0)))
    FN = int(np.sum((y_pred == 0) & (y_true == 1)))
    return {"TP": TP, "TN": TN, "FP": FP, "FN": FN}


def precision_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    cm = confusion_matrix_from_scratch(y_true, y_pred)
    denom = cm["TP"] + cm["FP"]
    return round(cm["TP"] / denom, 4) if denom > 0 else 0.0


def recall_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    cm = confusion_matrix_from_scratch(y_true, y_pred)
    denom = cm["TP"] + cm["FN"]
    return round(cm["TP"] / denom, 4) if denom > 0 else 0.0


def f1_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    p = precision_from_scratch(y_true, y_pred)
    r = recall_from_scratch(y_true, y_pred)
    return round(2 * p * r / (p + r), 4) if (p + r) > 0 else 0.0


def mcc_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    cm = confusion_matrix_from_scratch(y_true, y_pred)
    TP, TN, FP, FN = cm["TP"], cm["TN"], cm["FP"], cm["FN"]
    numerator = TP * TN - FP * FN
    denominator = np.sqrt((TP + FP) * (TP + FN) * (TN + FP) * (TN + FN))
    return round(numerator / denominator, 4) if denominator > 0 else 0.0


def cohens_kappa(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    n = len(y_true)
    p_o = np.sum(y_true == y_pred) / n
    classes = np.unique(np.concatenate([y_true, y_pred]))
    p_e = sum(
        (np.sum(y_true == c) / n) * (np.sum(y_pred == c) / n)
        for c in classes
    )
    return round((p_o - p_e) / (1 - p_e), 4) if p_e < 1 else 1.0


def roc_curve_from_scratch(y_true: np.ndarray, y_scores: np.ndarray) -> tuple:
    thresholds = np.sort(np.unique(y_scores))[::-1]
    fpr_list, tpr_list = [0.0], [0.0]
    P = np.sum(y_true == 1)
    N = np.sum(y_true == 0)
    for t in thresholds:
        y_pred = (y_scores >= t).astype(int)
        TP = np.sum((y_pred == 1) & (y_true == 1))
        FP = np.sum((y_pred == 1) & (y_true == 0))
        fpr_list.append(FP / N if N > 0 else 0.0)
        tpr_list.append(TP / P if P > 0 else 0.0)
    fpr_list.append(1.0)
    tpr_list.append(1.0)
    return (
        np.round(fpr_list, 4).tolist(),
        np.round(tpr_list, 4).tolist(),
        thresholds.tolist(),
    )


def auc_from_roc(fpr: np.ndarray, tpr: np.ndarray) -> float:
    fpr = np.array(fpr)
    tpr = np.array(tpr)
    return round(float(np.trapz(tpr, fpr)), 4)


def pr_curve_from_scratch(y_true: np.ndarray, y_scores: np.ndarray) -> tuple:
    thresholds = np.sort(np.unique(y_scores))[::-1]
    precisions, recalls = [], []
    for t in thresholds:
        y_pred = (y_scores >= t).astype(int)
        TP = np.sum((y_pred == 1) & (y_true == 1))
        FP = np.sum((y_pred == 1) & (y_true == 0))
        FN = np.sum((y_pred == 0) & (y_true == 1))
        p = TP / (TP + FP) if (TP + FP) > 0 else 1.0
        r = TP / (TP + FN) if (TP + FN) > 0 else 0.0
        precisions.append(round(p, 4))
        recalls.append(round(r, 4))
    return (precisions, recalls, thresholds.tolist())


def average_precision(precisions: np.ndarray, recalls: np.ndarray) -> float:
    precisions = np.array(precisions)
    recalls = np.array(recalls)
    # Sort by recall ascending
    order = np.argsort(recalls)
    recalls = recalls[order]
    precisions = precisions[order]
    ap = float(np.sum(precisions[1:] * np.diff(recalls)))
    return round(ap, 4)


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    errors = y_true - y_pred
    mse  = float(np.mean(errors ** 2))
    rmse = float(np.sqrt(mse))
    mae  = float(np.mean(np.abs(errors)))
    ss_res = np.sum(errors ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    r2   = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0
    return {k: round(v, 4) for k, v in dict(mse=mse, rmse=rmse, mae=mae, r2=r2).items()}


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    mask = y_true != 0
    return round(float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100), 4)


def huber_loss(y_true: np.ndarray, y_pred: np.ndarray, delta: float = 1.0) -> float:
    residuals = np.abs(y_true - y_pred)
    loss = np.where(
        residuals <= delta,
        0.5 * residuals ** 2,
        delta * (residuals - 0.5 * delta)
    )
    return round(float(np.mean(loss)), 4)


def multiclass_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return {
        "macro_f1":    round(float(f1_score(y_true, y_pred, average="macro")),    4),
        "micro_f1":    round(float(f1_score(y_true, y_pred, average="micro")),    4),
        "weighted_f1": round(float(f1_score(y_true, y_pred, average="weighted")), 4),
    }


def main():
    print("=== Solution 5.2: Evaluation Metrics ===\n")

    np.random.seed(42)
    y_true_bin = np.array([1, 0, 1, 1, 0, 1, 0, 0, 1, 1])
    y_pred_bin = np.array([1, 0, 1, 0, 0, 1, 1, 0, 1, 0])
    y_scores   = np.array([0.9, 0.2, 0.8, 0.4, 0.1, 0.95, 0.6, 0.3, 0.85, 0.45])

    print("Result 1  - Accuracy:", accuracy_from_scratch(y_true_bin, y_pred_bin))
    print("Result 2  - Confusion matrix:", confusion_matrix_from_scratch(y_true_bin, y_pred_bin))
    print("Result 3  - Precision:", precision_from_scratch(y_true_bin, y_pred_bin))
    print("Result 4  - Recall:", recall_from_scratch(y_true_bin, y_pred_bin))
    print("Result 5  - F1:", f1_from_scratch(y_true_bin, y_pred_bin))
    print("Result 6  - MCC:", mcc_from_scratch(y_true_bin, y_pred_bin))
    print("Result 7  - Cohen's Kappa:", cohens_kappa(y_true_bin, y_pred_bin))

    fpr, tpr, thresholds = roc_curve_from_scratch(y_true_bin, y_scores)
    print("Result 8  - ROC (fpr, tpr):", list(zip(fpr, tpr)))
    print("Result 9  - AUC:", auc_from_roc(np.array(fpr), np.array(tpr)))

    precisions, recalls, _ = pr_curve_from_scratch(y_true_bin, y_scores)
    print("Result 10 - PR precisions:", precisions)
    print("Result 10 - PR recalls:   ", recalls)
    print("Result 11 - Average Precision:", average_precision(np.array(precisions), np.array(recalls)))

    y_true_reg = np.array([3.0, -0.5, 2.0, 7.0])
    y_pred_reg = np.array([2.5,  0.0, 2.0, 8.0])
    print("Result 12 - Regression metrics:", regression_metrics(y_true_reg, y_pred_reg))
    print("Result 13 - MAPE:", mape(y_true_reg, y_pred_reg))
    print("Result 14 - Huber loss (delta=1):", huber_loss(y_true_reg, y_pred_reg))

    y_true_mc = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2, 0])
    y_pred_mc = np.array([0, 2, 2, 0, 0, 2, 1, 1, 2, 0])
    print("Result 15 - Multi-class metrics:", multiclass_metrics(y_true_mc, y_pred_mc))


if __name__ == "__main__":
    main()
