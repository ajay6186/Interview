# ============================================================
# Exercise 5.2 — Evaluation Metrics
# ============================================================
# Topics:
#   • Classification metrics from scratch: accuracy, confusion matrix,
#     precision, recall, F1, MCC, Cohen's Kappa
#   • ROC curve, AUC, Precision-Recall curve, Average Precision
#   • Regression metrics from scratch: MSE, RMSE, MAE, R², MAPE
#   • Huber loss
#   • Multi-class metrics (macro, micro, weighted)
# ============================================================

import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


# --- TODO 1: Accuracy from scratch ---
# accuracy = correct predictions / total predictions
def accuracy_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 2: Confusion matrix from scratch ---
# Return dict with keys TP, TN, FP, FN (binary classification).
def confusion_matrix_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


# --- TODO 3: Precision from scratch ---
# precision = TP / (TP + FP)
def precision_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 4: Recall from scratch ---
# recall = TP / (TP + FN)
def recall_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 5: F1-score from scratch ---
# F1 = 2 * precision * recall / (precision + recall)
def f1_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 6: Matthews Correlation Coefficient ---
# MCC = (TP*TN - FP*FN) / sqrt((TP+FP)(TP+FN)(TN+FP)(TN+FN))
def mcc_from_scratch(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 7: Cohen's Kappa ---
# kappa = (p_o - p_e) / (1 - p_e)
# p_o = observed agreement, p_e = expected by chance
def cohens_kappa(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 8: ROC curve data ---
# Return (fpr_list, tpr_list, thresholds) by varying threshold
# over y_scores (predicted probabilities).
def roc_curve_from_scratch(y_true: np.ndarray, y_scores: np.ndarray) -> tuple:
    pass  # TODO: implement


# --- TODO 9: AUC from ROC (trapezoidal rule) ---
def auc_from_roc(fpr: np.ndarray, tpr: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 10: Precision-Recall curve ---
# Return (precisions, recalls, thresholds) varying threshold.
def pr_curve_from_scratch(y_true: np.ndarray, y_scores: np.ndarray) -> tuple:
    pass  # TODO: implement


# --- TODO 11: Average Precision (area under PR curve) ---
# AP = sum over thresholds of precision[i] * (recall[i] - recall[i-1])
def average_precision(precisions: np.ndarray, recalls: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 12: MSE, RMSE, MAE, R² from scratch ---
# Return dict with keys mse, rmse, mae, r2.
def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


# --- TODO 13: MAPE from scratch ---
# MAPE = mean(|y_true - y_pred| / |y_true|) * 100
def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 14: Huber loss ---
# L(delta) = 0.5*(y-f)^2 if |y-f| <= delta else delta*(|y-f| - 0.5*delta)
def huber_loss(y_true: np.ndarray, y_pred: np.ndarray, delta: float = 1.0) -> float:
    pass  # TODO: implement


# --- TODO 15: Multi-class metrics ---
# Use sklearn classification_report-style calculation.
# Return dict: {macro_f1, micro_f1, weighted_f1} using sklearn.
def multiclass_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


def main():
    print("=== Exercise 5.2: Evaluation Metrics ===\n")

    np.random.seed(42)
    y_true_bin = np.array([1, 0, 1, 1, 0, 1, 0, 0, 1, 1])
    y_pred_bin = np.array([1, 0, 1, 0, 0, 1, 1, 0, 1, 0])
    y_scores  = np.array([0.9, 0.2, 0.8, 0.4, 0.1, 0.95, 0.6, 0.3, 0.85, 0.45])

    print("TODO 1  - Accuracy:", accuracy_from_scratch(y_true_bin, y_pred_bin))
    print("TODO 2  - Confusion matrix:", confusion_matrix_from_scratch(y_true_bin, y_pred_bin))
    print("TODO 3  - Precision:", precision_from_scratch(y_true_bin, y_pred_bin))
    print("TODO 4  - Recall:", recall_from_scratch(y_true_bin, y_pred_bin))
    print("TODO 5  - F1:", f1_from_scratch(y_true_bin, y_pred_bin))
    print("TODO 6  - MCC:", mcc_from_scratch(y_true_bin, y_pred_bin))
    print("TODO 7  - Cohen's Kappa:", cohens_kappa(y_true_bin, y_pred_bin))

    fpr, tpr, thresholds = roc_curve_from_scratch(y_true_bin, y_scores) or (None, None, None)
    print("TODO 8  - ROC curve points:", list(zip(fpr, tpr)) if fpr is not None else None)
    print("TODO 9  - AUC:", auc_from_roc(np.array(fpr), np.array(tpr)) if fpr is not None else None)

    precisions, recalls, _ = pr_curve_from_scratch(y_true_bin, y_scores) or (None, None, None)
    print("TODO 10 - PR curve precisions:", precisions)
    print("TODO 11 - Average Precision:", average_precision(
        np.array(precisions), np.array(recalls)
    ) if precisions is not None else None)

    y_true_reg = np.array([3.0, -0.5, 2.0, 7.0])
    y_pred_reg = np.array([2.5,  0.0, 2.0, 8.0])
    print("TODO 12 - Regression metrics:", regression_metrics(y_true_reg, y_pred_reg))
    print("TODO 13 - MAPE:", mape(y_true_reg, y_pred_reg))
    print("TODO 14 - Huber loss (delta=1):", huber_loss(y_true_reg, y_pred_reg))

    y_true_mc = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2, 0])
    y_pred_mc = np.array([0, 2, 2, 0, 0, 2, 1, 1, 2, 0])
    print("TODO 15 - Multi-class metrics:", multiclass_metrics(y_true_mc, y_pred_mc))


if __name__ == "__main__":
    main()
