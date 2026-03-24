# ============================================================
# Exercise 5.4 — Model Selection
# ============================================================
# Topics:
#   • Compare multiple models via cross_val_score
#   • Paired t-test and Wilcoxon signed-rank test
#   • AIC and BIC criteria
#   • Model complexity vs performance (regularization path)
#   • Bias-variance tradeoff: polynomial degree experiment
#   • Learning curve and validation curve
#   • Feature importance-based selection
#   • Business constraints (latency, model size)
#   • Occam's razor, model comparison report
#   • Final selection checklist
#   • Production model selection framework
# ============================================================

import numpy as np
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import LogisticRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.model_selection import cross_val_score, learning_curve, validation_curve
from scipy import stats
import time


# --- TODO 1: Compare multiple models ---
# Evaluate LogisticRegression, RandomForest, SVM (linear kernel),
# KNN(k=5), DecisionTree using 5-fold CV + accuracy.
# Return dict {model_name: (mean_score, std_score)}.
def compare_models(X, y) -> dict:
    pass  # TODO: implement


# --- TODO 2: Paired t-test for model comparison ---
# Given two arrays of fold scores, return (t_stat, p_value, winner).
# winner = "A", "B", or "tie" (p > 0.05).
def paired_ttest(scores_a: np.ndarray, scores_b: np.ndarray, name_a: str, name_b: str) -> tuple:
    pass  # TODO: implement


# --- TODO 3: Wilcoxon signed-rank test ---
# Non-parametric alternative. Return (stat, p_value, winner).
def wilcoxon_test(scores_a: np.ndarray, scores_b: np.ndarray, name_a: str, name_b: str) -> tuple:
    pass  # TODO: implement


# --- TODO 4: AIC (Akaike Information Criterion) ---
# AIC = 2k - 2*log_likelihood. For regression: use RSS.
# log_likelihood ≈ -n/2 * log(RSS/n) for Gaussian errors.
# Return AIC value.
def compute_aic(n_samples: int, n_params: int, rss: float) -> float:
    pass  # TODO: implement


# --- TODO 5: BIC (Bayesian Information Criterion) ---
# BIC = k*log(n) - 2*log_likelihood.
# Return BIC value.
def compute_bic(n_samples: int, n_params: int, rss: float) -> float:
    pass  # TODO: implement


# --- TODO 6: Regularization path ---
# Fit Ridge with alphas in logspace(-3, 3, 20).
# Return (alphas, train_scores, val_scores) using 5-fold CV.
def regularization_path(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 7: Bias-variance tradeoff (polynomial degree) ---
# Fit PolynomialFeatures + Ridge for degrees 1..10.
# Return (degrees, train_scores, val_scores).
def bias_variance_polynomial(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 8: Learning curve (training size vs score) ---
# Return (train_sizes, mean_train, mean_val) for best model.
def model_learning_curve(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 9: Validation curve (hyperparameter vs score) ---
# Vary max_depth in [1..10] for DecisionTree.
# Return (depths, mean_train, mean_val).
def model_validation_curve(X, y) -> tuple:
    pass  # TODO: implement


# --- TODO 10: Feature importance-based model selection ---
# Fit RandomForest. Return top-5 feature importances as list of
# (feature_index, importance) sorted descending.
def feature_importance_selection(X, y) -> list:
    pass  # TODO: implement


# --- TODO 11: Business constraints ---
# Measure predict() latency (ms) for each model.
# Return dict {model_name: latency_ms} for 1000 predictions.
def measure_latency(X, y) -> dict:
    pass  # TODO: implement


# --- TODO 12: Occam's razor ---
# Return the simpler model name if both achieve within 1% accuracy.
# simpler = fewer parameters.
def occams_razor(model_a_score: float, model_b_score: float,
                 model_a_params: int, model_b_params: int,
                 name_a: str, name_b: str) -> str:
    pass  # TODO: implement


# --- TODO 13: Model selection report ---
# Print a structured comparison of top-3 models.
# Return list of (rank, name, mean_cv_score) tuples.
def model_selection_report(X, y) -> list:
    pass  # TODO: implement


# --- TODO 14: Final model selection checklist ---
# Return a list of 7 checklist items.
def selection_checklist() -> list:
    pass  # TODO: implement


# --- TODO 15: Production model selection framework ---
# Return a list of 5 steps for a production selection process.
def production_selection_framework() -> list:
    pass  # TODO: implement


def main():
    print("=== Exercise 5.4: Model Selection ===\n")

    np.random.seed(42)
    X_cls, y_cls = make_classification(n_samples=300, n_features=10, random_state=42)
    X_reg, y_reg = make_regression(n_samples=200, n_features=5, noise=10, random_state=42)

    print("TODO 1  - Compare models:", compare_models(X_cls, y_cls))

    scores_lr  = cross_val_score(LogisticRegression(max_iter=1000), X_cls, y_cls, cv=5)
    scores_rf  = cross_val_score(RandomForestClassifier(random_state=42), X_cls, y_cls, cv=5)
    print("TODO 2  - Paired t-test LR vs RF:", paired_ttest(scores_lr, scores_rf, "LR", "RF"))
    print("TODO 3  - Wilcoxon LR vs RF:", wilcoxon_test(scores_lr, scores_rf, "LR", "RF"))

    # Fit Ridge to get RSS for AIC/BIC
    from sklearn.linear_model import Ridge as RidgeR
    ridge = RidgeR().fit(X_reg, y_reg)
    rss = float(np.sum((y_reg - ridge.predict(X_reg)) ** 2))
    print("TODO 4  - AIC:", compute_aic(len(y_reg), X_reg.shape[1] + 1, rss))
    print("TODO 5  - BIC:", compute_bic(len(y_reg), X_reg.shape[1] + 1, rss))

    alphas, tr, vl = regularization_path(X_reg, y_reg) or (None, None, None)
    print("TODO 6  - Reg path (first 5 alphas, val scores):", list(zip(alphas[:5], vl[:5])) if alphas else None)

    X_reg1d = X_reg[:, :1]
    degs, bv_tr, bv_vl = bias_variance_polynomial(X_reg1d, y_reg) or (None, None, None)
    print("TODO 7  - Bias-variance poly degrees:", degs)

    ts, mtr, mvr = model_learning_curve(X_cls, y_cls) or (None, None, None)
    print("TODO 8  - Learning curve sizes:", ts)

    depths, dtr, dvl = model_validation_curve(X_cls, y_cls) or (None, None, None)
    print("TODO 9  - Validation curve depths:", depths)
    print("TODO 10 - Feature importances (top 5):", feature_importance_selection(X_cls, y_cls))
    print("TODO 11 - Latency (ms):", measure_latency(X_cls, y_cls))
    print("TODO 12 - Occam's razor:", occams_razor(0.92, 0.921, 10000, 100, "RandomForest", "LogisticReg"))
    print("TODO 13 - Model report:", model_selection_report(X_cls, y_cls))
    print("TODO 14 - Selection checklist:", selection_checklist())
    print("TODO 15 - Production framework:", production_selection_framework())


if __name__ == "__main__":
    main()
