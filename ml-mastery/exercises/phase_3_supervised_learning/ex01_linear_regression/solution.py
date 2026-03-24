# ============================================================
# Solution 3.1 — Linear Regression
# ============================================================

import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from sklearn.datasets import make_regression

np.random.seed(42)
X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=42)
X_b = np.c_[np.ones(X.shape[0]), X]


# ---------------------------------------------------------------------------
# Solution 1: Normal Equation
# ---------------------------------------------------------------------------

def normal_equation(X_b: np.ndarray, y: np.ndarray) -> np.ndarray:
    return np.linalg.pinv(X_b.T @ X_b) @ X_b.T @ y


# ---------------------------------------------------------------------------
# Solution 2: Gradient Descent
# ---------------------------------------------------------------------------

def gradient_descent_lr(X_b: np.ndarray, y: np.ndarray,
                         lr: float = 0.01, epochs: int = 1000) -> np.ndarray:
    n, p = X_b.shape
    w = np.zeros(p)
    for _ in range(epochs):
        y_pred = X_b @ w
        grad = (2 / n) * X_b.T @ (y_pred - y)
        w -= lr * grad
    return w


# ---------------------------------------------------------------------------
# Solution 3: sklearn LinearRegression
# ---------------------------------------------------------------------------

def sklearn_linear_regression(X: np.ndarray, y: np.ndarray):
    model = LinearRegression()
    model.fit(X, y)
    return model, model.predict(X)


# ---------------------------------------------------------------------------
# Solution 4: Ridge Regression
# ---------------------------------------------------------------------------

def ridge_regression(X: np.ndarray, X_b: np.ndarray,
                     y: np.ndarray, alpha: float = 1.0):
    ridge = Ridge(alpha=alpha)
    ridge.fit(X, y)

    n, p = X_b.shape
    I = np.eye(p)
    I[0, 0] = 0  # do not regularize bias
    manual_w = np.linalg.pinv(X_b.T @ X_b + alpha * I) @ X_b.T @ y
    return ridge.coef_, manual_w


# ---------------------------------------------------------------------------
# Solution 5: Lasso Regression
# ---------------------------------------------------------------------------

def lasso_regression(X: np.ndarray, y: np.ndarray, alpha: float = 0.1):
    lasso = Lasso(alpha=alpha, max_iter=10000)
    lasso.fit(X, y)
    return lasso.coef_


# ---------------------------------------------------------------------------
# Solution 6: ElasticNet
# ---------------------------------------------------------------------------

def elasticnet_regression(X: np.ndarray, y: np.ndarray,
                           alpha: float = 0.1, l1_ratio: float = 0.5):
    en = ElasticNet(alpha=alpha, l1_ratio=l1_ratio, max_iter=10000)
    en.fit(X, y)
    return en.coef_


# ---------------------------------------------------------------------------
# Solution 7: Polynomial Regression
# ---------------------------------------------------------------------------

def polynomial_regression(X: np.ndarray, y: np.ndarray, degree: int = 3):
    pipe = make_pipeline(PolynomialFeatures(degree=degree), LinearRegression())
    pipe.fit(X[:, :1], y)
    return pipe.predict(X[:, :1])


# ---------------------------------------------------------------------------
# Solution 8: Residual Analysis
# ---------------------------------------------------------------------------

def residual_analysis(y: np.ndarray, y_pred: np.ndarray) -> dict:
    residuals = y - y_pred
    return {
        'residuals': residuals,
        'mean': float(np.mean(residuals)),
        'std': float(np.std(residuals)),
    }


# ---------------------------------------------------------------------------
# Solution 9: Regression Metrics from Scratch
# ---------------------------------------------------------------------------

def regression_metrics(y: np.ndarray, y_pred: np.ndarray) -> dict:
    mse = float(np.mean((y - y_pred) ** 2))
    rmse = float(np.sqrt(mse))
    mae = float(np.mean(np.abs(y - y_pred)))
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r2 = float(1 - ss_res / ss_tot)
    return {'MSE': mse, 'RMSE': rmse, 'MAE': mae, 'R2': r2}


# ---------------------------------------------------------------------------
# Solution 10: Confidence Intervals for Coefficients
# ---------------------------------------------------------------------------

def confidence_intervals(X_b: np.ndarray, y: np.ndarray,
                          w: np.ndarray) -> np.ndarray:
    n, p = X_b.shape
    y_pred = X_b @ w
    rss = np.sum((y - y_pred) ** 2)
    sigma2 = rss / (n - p)
    cov_w = sigma2 * np.linalg.pinv(X_b.T @ X_b)
    se = np.sqrt(np.diag(cov_w))
    ci = np.column_stack([w - 1.96 * se, w + 1.96 * se])
    return ci


# ---------------------------------------------------------------------------
# Solution 11: Feature Importance
# ---------------------------------------------------------------------------

def feature_importance_lr(X: np.ndarray, y: np.ndarray) -> list:
    model = LinearRegression()
    model.fit(X, y)
    pairs = list(enumerate(model.coef_))
    return sorted(pairs, key=lambda t: abs(t[1]), reverse=True)


# ---------------------------------------------------------------------------
# Solution 12: Regularization Comparison
# ---------------------------------------------------------------------------

def regularization_comparison(X: np.ndarray, y: np.ndarray) -> dict:
    lr = LinearRegression().fit(X, y)
    ridge = Ridge(alpha=1.0).fit(X, y)
    lasso = Lasso(alpha=0.1, max_iter=10000).fit(X, y)
    return {
        'none': lr.coef_,
        'ridge': ridge.coef_,
        'lasso': lasso.coef_,
    }


# ---------------------------------------------------------------------------
# Solution 13: Online Gradient Descent
# ---------------------------------------------------------------------------

def online_gradient_descent(X_b: np.ndarray, y: np.ndarray,
                              lr: float = 0.01, epochs: int = 5) -> np.ndarray:
    n, p = X_b.shape
    w = np.zeros(p)
    for _ in range(epochs):
        for i in range(n):
            xi = X_b[i]
            yi = y[i]
            y_pred_i = xi @ w
            grad = 2 * xi * (y_pred_i - yi)
            w -= lr * grad
    return w


# ---------------------------------------------------------------------------
# Solution 14: Heteroscedasticity Check
# ---------------------------------------------------------------------------

def heteroscedasticity_check(X: np.ndarray, residuals: np.ndarray) -> float:
    squared_res = residuals ** 2
    model = LinearRegression()
    model.fit(X, squared_res)
    ss_res = np.sum((squared_res - model.predict(X)) ** 2)
    ss_tot = np.sum((squared_res - np.mean(squared_res)) ** 2)
    r2 = float(1 - ss_res / ss_tot) if ss_tot != 0 else 0.0
    return r2


# ---------------------------------------------------------------------------
# Solution 15: VIF (Variance Inflation Factor)
# ---------------------------------------------------------------------------

def compute_vif(X: np.ndarray) -> np.ndarray:
    n_features = X.shape[1]
    vif = np.zeros(n_features)
    for j in range(n_features):
        y_j = X[:, j]
        X_others = np.delete(X, j, axis=1)
        model = LinearRegression()
        model.fit(X_others, y_j)
        ss_res = np.sum((y_j - model.predict(X_others)) ** 2)
        ss_tot = np.sum((y_j - np.mean(y_j)) ** 2)
        r2 = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0
        vif[j] = 1 / (1 - r2) if r2 < 1 else np.inf
    return vif


def main():
    print("=== Solution 3.1: Linear Regression ===\n")

    w_ne = normal_equation(X_b, y)
    print("Result 1 — Normal Equation weights:", np.round(w_ne, 3))

    w_gd = gradient_descent_lr(X_b, y)
    print("Result 2 — Gradient Descent weights:", np.round(w_gd, 3))

    model, preds = sklearn_linear_regression(X, y)
    print("Result 3 — sklearn coef:", np.round(model.coef_, 3))

    ridge_coef, manual_w = ridge_regression(X, X_b, y)
    print("Result 4 — Ridge coef (sklearn):", np.round(ridge_coef, 3))
    print("         — Ridge coef (manual): ", np.round(manual_w[1:], 3))

    lasso_coef = lasso_regression(X, y)
    print("Result 5 — Lasso coef:", np.round(lasso_coef, 3))

    en_coef = elasticnet_regression(X, y)
    print("Result 6 — ElasticNet coef:", np.round(en_coef, 3))

    poly_preds = polynomial_regression(X, y)
    print("Result 7 — Poly preds (first 3):", np.round(poly_preds[:3], 3))

    res = residual_analysis(y, preds)
    print("Result 8 — Residual mean: {:.4f}, std: {:.4f}".format(res['mean'], res['std']))

    metrics = regression_metrics(y, preds)
    print("Result 9 — Metrics:", {k: round(v, 4) for k, v in metrics.items()})

    w = normal_equation(X_b, y)
    ci = confidence_intervals(X_b, y, w)
    print("Result 10 — CI for bias:", np.round(ci[0], 3))

    fi = feature_importance_lr(X, y)
    print("Result 11 — Feature importance:", [(i, round(c, 3)) for i, c in fi])

    reg = regularization_comparison(X, y)
    print("Result 12 — Regularization comparison:")
    for k, v in reg.items():
        print(f"   {k}: {np.round(v, 3)}")

    w_online = online_gradient_descent(X_b, y)
    print("Result 13 — Online GD weights:", np.round(w_online, 3))

    resids = y - preds
    h_r2 = heteroscedasticity_check(X, resids)
    print("Result 14 — Heteroscedasticity R²: {:.4f}".format(h_r2))

    vif = compute_vif(X)
    print("Result 15 — VIF values:", np.round(vif, 3))


if __name__ == "__main__":
    main()
