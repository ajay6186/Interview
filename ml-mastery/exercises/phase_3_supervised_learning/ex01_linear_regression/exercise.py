# ============================================================
# Exercise 3.1 — Linear Regression
# ============================================================
# Topics:
#   • Normal equation and gradient descent from scratch
#   • sklearn LinearRegression, Ridge, Lasso, ElasticNet
#   • Polynomial regression
#   • Metrics: MSE, RMSE, MAE, R²
#   • Residual analysis and confidence intervals
#   • Feature importance, regularization comparison
#   • Online GD, heteroscedasticity, multicollinearity (VIF)
# ============================================================

import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from sklearn.datasets import make_regression

np.random.seed(42)
X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=42)
X_b = np.c_[np.ones(X.shape[0]), X]  # add bias column


# ---------------------------------------------------------------------------
# TODO 1: Linear Regression — Normal Equation
# ---------------------------------------------------------------------------
# Solve for weights w using the closed-form normal equation:
#   w = (X^T X)^-1 X^T y
# where X_b already has a bias column prepended.
# Return the weight vector (shape: (n_features+1,)).

def normal_equation(X_b: np.ndarray, y: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: Linear Regression — Gradient Descent
# ---------------------------------------------------------------------------
# Implement batch gradient descent for linear regression from scratch.
# Use MSE loss. Run for `epochs` iterations with learning rate `lr`.
# Return the final weight vector (shape: (n_features+1,)) for X_b.

def gradient_descent_lr(X_b: np.ndarray, y: np.ndarray,
                         lr: float = 0.01, epochs: int = 1000) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: sklearn LinearRegression
# ---------------------------------------------------------------------------
# Fit a sklearn LinearRegression on (X, y). Return (model, predictions).

def sklearn_linear_regression(X: np.ndarray, y: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Ridge Regression — sklearn + manual L2
# ---------------------------------------------------------------------------
# (a) Fit sklearn Ridge(alpha=1.0) on (X, y). Return its coefficients.
# (b) Implement the Ridge normal equation manually:
#       w = (X_b^T X_b + alpha * I)^-1 X_b^T y
#     (exclude bias from regularization by zeroing out I[0,0])
# Return (ridge_coef, manual_w).

def ridge_regression(X: np.ndarray, X_b: np.ndarray,
                     y: np.ndarray, alpha: float = 1.0):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Lasso Regression
# ---------------------------------------------------------------------------
# Fit sklearn Lasso(alpha=0.1) on (X, y). Return its coefficients.

def lasso_regression(X: np.ndarray, y: np.ndarray, alpha: float = 0.1):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: ElasticNet
# ---------------------------------------------------------------------------
# Fit sklearn ElasticNet(alpha=0.1, l1_ratio=0.5) on (X, y).
# Return its coefficients.

def elasticnet_regression(X: np.ndarray, y: np.ndarray,
                           alpha: float = 0.1, l1_ratio: float = 0.5):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Polynomial Regression (degree 3)
# ---------------------------------------------------------------------------
# Build an sklearn pipeline: PolynomialFeatures(degree=3) → LinearRegression.
# Fit on (X[:, :1], y) (use only first feature). Return predictions.

def polynomial_regression(X: np.ndarray, y: np.ndarray, degree: int = 3):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Residual Analysis
# ---------------------------------------------------------------------------
# Given true values y and predicted values y_pred:
#   • Compute residuals = y - y_pred
#   • Return a dict with keys: 'residuals', 'mean', 'std'

def residual_analysis(y: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Regression Metrics from Scratch
# ---------------------------------------------------------------------------
# Compute MSE, RMSE, MAE, R² from scratch (no sklearn metrics).
# Return a dict with keys: 'MSE', 'RMSE', 'MAE', 'R2'.

def regression_metrics(y: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Confidence Intervals for Coefficients
# ---------------------------------------------------------------------------
# Given X_b, y and a weight vector w (from normal equation):
#   1. Compute residuals and estimate sigma² = RSS / (n - p)
#   2. Compute variance of each coefficient: var(w) = sigma² * diag((X_b^T X_b)^-1)
#   3. Return 95% CI as array of shape (p, 2): [w_i - 1.96*se, w_i + 1.96*se]

def confidence_intervals(X_b: np.ndarray, y: np.ndarray,
                          w: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Feature Importance (Coefficients)
# ---------------------------------------------------------------------------
# Fit sklearn LinearRegression on (X, y).
# Return a sorted list of (feature_index, coefficient) tuples,
# sorted by absolute coefficient value descending.

def feature_importance_lr(X: np.ndarray, y: np.ndarray) -> list:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Regularization Comparison
# ---------------------------------------------------------------------------
# Fit LinearRegression, Ridge(alpha=1), and Lasso(alpha=0.1) on (X, y).
# Return a dict: {'none': coef, 'ridge': coef, 'lasso': coef}

def regularization_comparison(X: np.ndarray, y: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Online Gradient Descent (stochastic, one sample at a time)
# ---------------------------------------------------------------------------
# Implement stochastic gradient descent: iterate through each sample one-by-one
# and update weights after each sample. Run for `epochs` full passes.
# Return the final weight vector (shape: (n_features+1,)) for X_b.

def online_gradient_descent(X_b: np.ndarray, y: np.ndarray,
                              lr: float = 0.01, epochs: int = 5) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Heteroscedasticity Check (Breusch-Pagan concept)
# ---------------------------------------------------------------------------
# Given residuals:
#   1. Square the residuals → squared_res
#   2. Regress squared_res on X using LinearRegression
#   3. Return R² of that auxiliary regression (high R² suggests heteroscedasticity)

def heteroscedasticity_check(X: np.ndarray, residuals: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Multicollinearity Check (VIF)
# ---------------------------------------------------------------------------
# Compute the Variance Inflation Factor for each feature j in X:
#   VIF_j = 1 / (1 - R²_j)
# where R²_j is obtained by regressing feature j on all other features.
# Return an array of VIF values (one per feature).

def compute_vif(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


def main():
    print("=== Exercise 3.1: Linear Regression ===\n")

    w_ne = normal_equation(X_b, y)
    print("TODO 1 — Normal Equation weights:", w_ne)

    w_gd = gradient_descent_lr(X_b, y)
    print("TODO 2 — Gradient Descent weights:", w_gd)

    model, preds = sklearn_linear_regression(X, y) if sklearn_linear_regression(X, y) else (None, None)
    print("TODO 3 — sklearn coef:", model.coef_ if model else None)

    result = ridge_regression(X, X_b, y)
    print("TODO 4 — Ridge coef (sklearn):", result[0] if result else None)

    lasso_coef = lasso_regression(X, y)
    print("TODO 5 — Lasso coef:", lasso_coef)

    en_coef = elasticnet_regression(X, y)
    print("TODO 6 — ElasticNet coef:", en_coef)

    poly_preds = polynomial_regression(X, y)
    print("TODO 7 — Poly preds (first 3):", poly_preds[:3] if poly_preds is not None else None)

    _, preds2 = sklearn_linear_regression(X, y) if sklearn_linear_regression(X, y) else (None, None)
    res = residual_analysis(y, preds2) if preds2 is not None else None
    print("TODO 8 — Residual mean:", res['mean'] if res else None)

    metrics = regression_metrics(y, preds2) if preds2 is not None else None
    print("TODO 9 — Metrics:", metrics)

    w = normal_equation(X_b, y)
    ci = confidence_intervals(X_b, y, w) if w is not None else None
    print("TODO 10 — CI for bias:", ci[0] if ci is not None else None)

    fi = feature_importance_lr(X, y)
    print("TODO 11 — Feature importance:", fi)

    reg = regularization_comparison(X, y)
    print("TODO 12 — Regularization comparison:", reg)

    w_online = online_gradient_descent(X_b, y)
    print("TODO 13 — Online GD weights:", w_online)

    if w is not None:
        _, preds3 = sklearn_linear_regression(X, y)
        resids = y - preds3
        h_r2 = heteroscedasticity_check(X, resids)
        print("TODO 14 — Heteroscedasticity R²:", h_r2)

    vif = compute_vif(X)
    print("TODO 15 — VIF values:", vif)


if __name__ == "__main__":
    main()
