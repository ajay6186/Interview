# ============================================================
# Examples 3.1 — Linear Regression (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.linear_model import (
    LinearRegression, Ridge, Lasso, ElasticNet,
    RidgeCV, LassoCV, BayesianRidge, SGDRegressor,
    HuberRegressor, QuantileRegressor, IsotonicRegression
)
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score, learning_curve
from sklearn.datasets import make_regression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.multioutput import MultiOutputRegressor
from sklearn.impute import SimpleImputer
from sklearn.kernel_ridge import KernelRidge
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.svm import SVR
from sklearn.neural_network import MLPRegressor
from sklearn.isotonic import IsotonicRegression
from sklearn.feature_selection import SelectKBest, f_regression

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """LinearRegression fit + predict"""
    X, y = make_regression(n_samples=100, n_features=1, noise=10, random_state=0)
    model = LinearRegression().fit(X, y)
    preds = model.predict(X[:3])
    print("Ex01 —", np.round(preds, 2))

def ex02():
    """Train/test split + score"""
    X, y = make_regression(n_samples=200, n_features=5, noise=15, random_state=1)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = LinearRegression().fit(X_tr, y_tr)
    score = model.score(X_te, y_te)
    print(f"Ex02 — Test R²: {score:.4f}")

def ex03():
    """MSE calculation"""
    X, y = make_regression(n_samples=100, n_features=3, noise=20, random_state=2)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    preds = LinearRegression().fit(X_tr, y_tr).predict(X_te)
    mse = mean_squared_error(y_te, preds)
    print(f"Ex03 — MSE: {mse:.4f}")

def ex04():
    """R² score"""
    X, y = make_regression(n_samples=100, n_features=4, noise=10, random_state=3)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    preds = LinearRegression().fit(X_tr, y_tr).predict(X_te)
    r2 = r2_score(y_te, preds)
    print(f"Ex04 — R²: {r2:.4f}")

def ex05():
    """Coefficients + intercept"""
    X, y = make_regression(n_samples=100, n_features=3, noise=5, random_state=4)
    model = LinearRegression().fit(X, y)
    print(f"Ex05 — Coefs: {np.round(model.coef_, 2)}, Intercept: {model.intercept_:.2f}")

def ex06():
    """Predict on new data"""
    X, y = make_regression(n_samples=100, n_features=2, noise=5, random_state=5)
    model = LinearRegression().fit(X, y)
    new_X = np.array([[1.5, -0.5], [0.0, 1.0]])
    print(f"Ex06 — Predictions: {np.round(model.predict(new_X), 2)}")

def ex07():
    """Feature scaling + regression"""
    X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=6)
    pipe = Pipeline([("scaler", StandardScaler()), ("lr", LinearRegression())])
    pipe.fit(X, y)
    print(f"Ex07 — Scaled R²: {pipe.score(X, y):.4f}")

def ex08():
    """Residuals calculation"""
    X, y = make_regression(n_samples=100, n_features=1, noise=10, random_state=7)
    model = LinearRegression().fit(X, y)
    residuals = y - model.predict(X)
    print(f"Ex08 — Residuals mean: {residuals.mean():.4f}, std: {residuals.std():.4f}")

def ex09():
    """Residual sum of squares"""
    X, y = make_regression(n_samples=100, n_features=2, noise=10, random_state=8)
    model = LinearRegression().fit(X, y)
    rss = np.sum((y - model.predict(X)) ** 2)
    print(f"Ex09 — RSS: {rss:.4f}")

def ex10():
    """Total sum of squares"""
    X, y = make_regression(n_samples=100, n_features=2, noise=10, random_state=9)
    tss = np.sum((y - y.mean()) ** 2)
    print(f"Ex10 — TSS: {tss:.4f}")

def ex11():
    """R² from scratch"""
    X, y = make_regression(n_samples=100, n_features=2, noise=10, random_state=10)
    model = LinearRegression().fit(X, y)
    preds = model.predict(X)
    ss_res = np.sum((y - preds) ** 2)
    ss_tot = np.sum((y - y.mean()) ** 2)
    r2_manual = 1 - ss_res / ss_tot
    print(f"Ex11 — R² (manual): {r2_manual:.4f}")

def ex12():
    """MAE from scratch"""
    X, y = make_regression(n_samples=100, n_features=2, noise=15, random_state=11)
    preds = LinearRegression().fit(X, y).predict(X)
    mae = np.mean(np.abs(y - preds))
    print(f"Ex12 — MAE: {mae:.4f}")

def ex13():
    """RMSE from scratch"""
    X, y = make_regression(n_samples=100, n_features=2, noise=15, random_state=12)
    preds = LinearRegression().fit(X, y).predict(X)
    rmse = np.sqrt(np.mean((y - preds) ** 2))
    print(f"Ex13 — RMSE: {rmse:.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Ridge regression (alpha=1.0)"""
    X, y = make_regression(n_samples=100, n_features=10, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    score = Ridge(alpha=1.0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex14 — Ridge R²: {score:.4f}")

def ex15():
    """Lasso regression"""
    X, y = make_regression(n_samples=100, n_features=10, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    score = Lasso(alpha=0.1).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex15 — Lasso R²: {score:.4f}")

def ex16():
    """ElasticNet"""
    X, y = make_regression(n_samples=100, n_features=10, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    score = ElasticNet(alpha=0.1, l1_ratio=0.5).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex16 — ElasticNet R²: {score:.4f}")

def ex17():
    """Polynomial regression degree 2 and 3"""
    X, y = make_regression(n_samples=100, n_features=1, noise=5, random_state=0)
    for deg in [2, 3]:
        pipe = Pipeline([("poly", PolynomialFeatures(deg)), ("lr", LinearRegression())])
        r2 = pipe.fit(X, y).score(X, y)
        print(f"Ex17 — Poly deg={deg} R²: {r2:.4f}")

def ex18():
    """RidgeCV (auto alpha selection)"""
    X, y = make_regression(n_samples=100, n_features=5, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = RidgeCV(alphas=[0.1, 1.0, 10.0]).fit(X_tr, y_tr)
    print(f"Ex18 — RidgeCV best alpha: {model.alpha_}, R²: {model.score(X_te, y_te):.4f}")

def ex19():
    """LassoCV"""
    X, y = make_regression(n_samples=200, n_features=5, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = LassoCV(cv=5, random_state=0).fit(X_tr, y_tr)
    print(f"Ex19 — LassoCV best alpha: {model.alpha_:.4f}, R²: {model.score(X_te, y_te):.4f}")

def ex20():
    """Compare R² of Ridge, Lasso, Linear"""
    X, y = make_regression(n_samples=100, n_features=10, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for name, m in [("Linear", LinearRegression()), ("Ridge", Ridge()), ("Lasso", Lasso(alpha=0.1))]:
        print(f"Ex20 — {name} R²: {m.fit(X_tr, y_tr).score(X_te, y_te):.4f}")

def ex21():
    """Regularization path (vary alpha)"""
    X, y = make_regression(n_samples=100, n_features=5, noise=10, random_state=0)
    alphas = [0.01, 0.1, 1.0, 10.0, 100.0]
    r2s = [Ridge(alpha=a).fit(X, y).score(X, y) for a in alphas]
    print(f"Ex21 — Reg path R²: {[round(r, 3) for r in r2s]}")

def ex22():
    """Feature importance (coef_)"""
    X, y = make_regression(n_samples=100, n_features=5, noise=5, random_state=0)
    coefs = LinearRegression().fit(X, y).coef_
    ranked = np.argsort(np.abs(coefs))[::-1]
    print(f"Ex22 — Feature rank by |coef|: {ranked}, coefs: {np.round(coefs[ranked], 2)}")

def ex23():
    """Confidence intervals via bootstrap"""
    X, y = make_regression(n_samples=100, n_features=1, noise=10, random_state=0)
    coefs = []
    rng = np.random.default_rng(0)
    for _ in range(200):
        idx = rng.integers(0, len(X), len(X))
        coefs.append(LinearRegression().fit(X[idx], y[idx]).coef_[0])
    lo, hi = np.percentile(coefs, [2.5, 97.5])
    print(f"Ex23 — Coef 95% CI: [{lo:.2f}, {hi:.2f}]")

def ex24():
    """Heteroscedasticity check (residuals vs fitted)"""
    X, y = make_regression(n_samples=100, n_features=1, noise=10, random_state=0)
    model = LinearRegression().fit(X, y)
    residuals = y - model.predict(X)
    corr = np.corrcoef(model.predict(X), np.abs(residuals))[0, 1]
    print(f"Ex24 — Corr(fitted, |residuals|): {corr:.4f} (near 0 → homoscedastic)")

def ex25():
    """Multicollinearity — condition number"""
    X, y = make_regression(n_samples=100, n_features=5, noise=5, random_state=0)
    cond = np.linalg.cond(X)
    print(f"Ex25 — Condition number: {cond:.2f} (<30 → low multicollinearity)")

def ex26():
    """Bayesian Ridge"""
    X, y = make_regression(n_samples=100, n_features=5, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    score = BayesianRidge().fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex26 — BayesianRidge R²: {score:.4f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """LinearRegressionFromScratch — normal equation"""
    class LinearRegressionFromScratch:
        def fit(self, X, y):
            Xb = np.c_[np.ones(len(X)), X]
            self.theta_ = np.linalg.pinv(Xb.T @ Xb) @ Xb.T @ y
            return self
        def predict(self, X):
            return np.c_[np.ones(len(X)), X] @ self.theta_

    X, y = make_regression(n_samples=50, n_features=2, noise=5, random_state=0)
    model = LinearRegressionFromScratch().fit(X, y)
    r2 = r2_score(y, model.predict(X))
    print(f"Ex27 — From-scratch normal eq R²: {r2:.4f}")

def ex28():
    """GradientDescentRegressor class"""
    class GradientDescentRegressor:
        def __init__(self, lr=0.01, n_iter=500):
            self.lr, self.n_iter = lr, n_iter
        def fit(self, X, y):
            Xb = np.c_[np.ones(len(X)), X]
            self.w_ = np.zeros(Xb.shape[1])
            for _ in range(self.n_iter):
                grad = Xb.T @ (Xb @ self.w_ - y) / len(y)
                self.w_ -= self.lr * grad
            return self
        def predict(self, X):
            return np.c_[np.ones(len(X)), X] @ self.w_

    X, y = make_regression(n_samples=100, n_features=1, noise=10, random_state=0)
    X = StandardScaler().fit_transform(X)
    model = GradientDescentRegressor(lr=0.1, n_iter=1000).fit(X, y)
    print(f"Ex28 — GD Regressor R²: {r2_score(y, model.predict(X)):.4f}")

def ex29():
    """RobustRegressor class (Huber loss)"""
    class RobustRegressor:
        def fit(self, X, y):
            self.model_ = HuberRegressor().fit(X, y)
            return self
        def predict(self, X):
            return self.model_.predict(X)
        def score(self, X, y):
            return r2_score(y, self.predict(X))

    X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=0)
    rng = np.random.default_rng(1)
    y[rng.integers(0, 100, 5)] += 200
    model = RobustRegressor().fit(X, y)
    print(f"Ex29 — Huber robust R²: {model.score(X, y):.4f}")

def ex30():
    """PolynomialRegressionPipeline class"""
    class PolynomialRegressionPipeline:
        def __init__(self, degree=2):
            self.pipe_ = Pipeline([
                ("poly", PolynomialFeatures(degree)),
                ("scaler", StandardScaler()),
                ("lr", LinearRegression())
            ])
        def fit(self, X, y):
            self.pipe_.fit(X, y); return self
        def score(self, X, y):
            return self.pipe_.score(X, y)

    X, y = make_regression(n_samples=100, n_features=2, noise=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    m = PolynomialRegressionPipeline(degree=3).fit(X_tr, y_tr)
    print(f"Ex30 — PolyPipeline test R²: {m.score(X_te, y_te):.4f}")

def ex31():
    """RegularizedRegressionComparison class"""
    class RegularizedRegressionComparison:
        def __init__(self, X_tr, y_tr, X_te, y_te):
            self.data = (X_tr, y_tr, X_te, y_te)
        def compare(self):
            X_tr, y_tr, X_te, y_te = self.data
            results = {}
            for name, model in [("Ridge", Ridge()), ("Lasso", Lasso(alpha=0.1)), ("ElasticNet", ElasticNet())]:
                results[name] = model.fit(X_tr, y_tr).score(X_te, y_te)
            return results

    X, y = make_regression(n_samples=100, n_features=8, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    comp = RegularizedRegressionComparison(X_tr, y_tr, X_te, y_te)
    print(f"Ex31 — {comp.compare()}")

def ex32():
    """ResidualAnalyzer class"""
    class ResidualAnalyzer:
        def __init__(self, model):
            self.model = model
        def analyze(self, X, y):
            preds = self.model.predict(X)
            res = y - preds
            return {"mean": res.mean(), "std": res.std(), "max_abs": np.abs(res).max()}

    X, y = make_regression(n_samples=100, n_features=2, noise=15, random_state=0)
    model = LinearRegression().fit(X, y)
    ra = ResidualAnalyzer(model)
    stats = ra.analyze(X, y)
    print(f"Ex32 — Residuals: mean={stats['mean']:.3f}, std={stats['std']:.3f}, max_abs={stats['max_abs']:.3f}")

def ex33():
    """Full regression pipeline (preprocess + fit + evaluate)"""
    X, y = make_regression(n_samples=200, n_features=10, noise=15, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler", StandardScaler()),
        ("model", Ridge(alpha=1.0))
    ])
    pipe.fit(X_tr, y_tr)
    print(f"Ex33 — Full pipeline R²: {pipe.score(X_te, y_te):.4f}")

def ex34():
    """Bias-variance tradeoff (vary polynomial degree)"""
    X, y = make_regression(n_samples=100, n_features=1, noise=20, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0)
    for deg in [1, 3, 7]:
        pipe = Pipeline([("poly", PolynomialFeatures(deg)), ("lr", LinearRegression())])
        pipe.fit(X_tr, y_tr)
        tr_r2 = pipe.score(X_tr, y_tr)
        te_r2 = pipe.score(X_te, y_te)
        print(f"Ex34 — deg={deg}: train={tr_r2:.3f}, test={te_r2:.3f}")

def ex35():
    """Learning curve for regression"""
    X, y = make_regression(n_samples=300, n_features=5, noise=10, random_state=0)
    sizes, train_sc, val_sc = learning_curve(LinearRegression(), X, y, cv=5, train_sizes=[0.2, 0.5, 1.0])
    for s, tr, va in zip(sizes, train_sc.mean(axis=1), val_sc.mean(axis=1)):
        print(f"Ex35 — n={s}: train_R²={tr:.3f}, val_R²={va:.3f}")

def ex36():
    """Cross-validated regression pipeline"""
    X, y = make_regression(n_samples=200, n_features=5, noise=10, random_state=0)
    pipe = Pipeline([("scaler", StandardScaler()), ("ridge", Ridge())])
    cv_scores = cross_val_score(pipe, X, y, cv=5, scoring="r2")
    print(f"Ex36 — CV R² scores: {np.round(cv_scores, 3)}, mean={cv_scores.mean():.3f}")

def ex37():
    """Feature selection + regression"""
    X, y = make_regression(n_samples=200, n_features=20, n_informative=5, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    pipe = Pipeline([
        ("select", SelectKBest(f_regression, k=5)),
        ("lr", LinearRegression())
    ])
    pipe.fit(X_tr, y_tr)
    print(f"Ex37 — SelectKBest+LR R²: {pipe.score(X_te, y_te):.4f}")

def ex38():
    """Outlier-robust regression (HuberRegressor vs LinearRegression)"""
    X, y = make_regression(n_samples=100, n_features=2, noise=5, random_state=0)
    rng = np.random.default_rng(42)
    y[rng.integers(0, 100, 10)] += 300
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    lr_r2 = LinearRegression().fit(X_tr, y_tr).score(X_te, y_te)
    hub_r2 = HuberRegressor().fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex38 — LinearR²: {lr_r2:.4f}, HuberR²: {hub_r2:.4f}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Quantile regression concept (sklearn QuantileRegressor)"""
    X, y = make_regression(n_samples=100, n_features=1, noise=15, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for q in [0.1, 0.5, 0.9]:
        r2 = QuantileRegressor(quantile=q, alpha=0.0, solver="highs").fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex39 — Quantile q={q} R²: {r2:.4f}")

def ex40():
    """Isotonic regression"""
    X, y = make_regression(n_samples=100, n_features=1, noise=10, random_state=0)
    x1d = X.ravel()
    order = np.argsort(x1d)
    iso = IsotonicRegression(out_of_bounds="clip").fit(x1d[order], y[order])
    preds = iso.predict(x1d[order])
    print(f"Ex40 — Isotonic R²: {r2_score(y[order], preds):.4f}")

def ex41():
    """Kernel ridge regression"""
    X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    score = KernelRidge(alpha=1.0, kernel="rbf").fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex41 — KernelRidge R²: {score:.4f}")

def ex42():
    """Gaussian process regression"""
    X, y = make_regression(n_samples=60, n_features=2, noise=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    gpr = GaussianProcessRegressor(random_state=0).fit(X_tr, y_tr)
    score = gpr.score(X_te, y_te)
    print(f"Ex42 — GPR R²: {score:.4f}")

def ex43():
    """Support vector regression (SVR)"""
    X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=0)
    X_sc = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X_sc, y, test_size=0.2, random_state=0)
    score = SVR(kernel="rbf", C=10).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex43 — SVR R²: {score:.4f}")

def ex44():
    """Neural network regression (MLPRegressor)"""
    X, y = make_regression(n_samples=200, n_features=5, noise=10, random_state=0)
    X_sc = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X_sc, y, test_size=0.2, random_state=0)
    score = MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=500, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex44 — MLP Regressor R²: {score:.4f}")

def ex45():
    """Online learning regression (SGDRegressor)"""
    X, y = make_regression(n_samples=300, n_features=5, noise=10, random_state=0)
    X_sc = StandardScaler().fit_transform(X)
    model = SGDRegressor(max_iter=1000, random_state=0)
    model.fit(X_sc[:200], y[:200])
    model.partial_fit(X_sc[200:], y[200:])
    print(f"Ex45 — SGD Online R²: {r2_score(y, model.predict(X_sc)):.4f}")

def ex46():
    """Multi-output regression"""
    X, y1 = make_regression(n_samples=100, n_features=3, noise=5, random_state=0)
    _, y2 = make_regression(n_samples=100, n_features=3, noise=5, random_state=1)
    Y = np.c_[y1, y2]
    model = MultiOutputRegressor(Ridge()).fit(X, Y)
    preds = model.predict(X)
    r2s = [r2_score(Y[:, i], preds[:, i]) for i in range(2)]
    print(f"Ex46 — Multi-output R²: {[round(r, 3) for r in r2s]}")

def ex47():
    """Regression with missing data (impute + regress)"""
    X, y = make_regression(n_samples=100, n_features=4, noise=10, random_state=0)
    rng = np.random.default_rng(0)
    mask = rng.random(X.shape) < 0.1
    X_missing = X.copy()
    X_missing[mask] = np.nan
    X_tr, X_te, y_tr, y_te = train_test_split(X_missing, y, test_size=0.2, random_state=0)
    pipe = Pipeline([("imputer", SimpleImputer()), ("lr", LinearRegression())])
    pipe.fit(X_tr, y_tr)
    print(f"Ex47 — Impute+Regress R²: {pipe.score(X_te, y_te):.4f}")

def ex48():
    """Regression on imbalanced targets (log-transform)"""
    rng = np.random.default_rng(0)
    X = rng.standard_normal((200, 3))
    y = np.exp(X[:, 0] * 2 + rng.standard_normal(200) * 0.5)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model_log = LinearRegression().fit(X_tr, np.log1p(y_tr))
    preds_log = np.expm1(model_log.predict(X_te))
    r2 = r2_score(y_te, preds_log)
    print(f"Ex48 — Log-transform regression R²: {r2:.4f}")

def ex49():
    """Production regression service design (class)"""
    class RegressionService:
        def __init__(self):
            self.pipeline_ = Pipeline([("scaler", StandardScaler()), ("model", Ridge())])
            self.is_fitted_ = False
        def train(self, X, y):
            self.pipeline_.fit(X, y)
            self.is_fitted_ = True
        def predict(self, X):
            if not self.is_fitted_:
                raise RuntimeError("Model not trained")
            return self.pipeline_.predict(X)
        def evaluate(self, X, y):
            return {"r2": r2_score(y, self.predict(X)), "mae": mean_absolute_error(y, self.predict(X))}

    X, y = make_regression(n_samples=100, n_features=3, noise=10, random_state=0)
    svc = RegressionService()
    svc.train(X, y)
    metrics = svc.evaluate(X, y)
    print(f"Ex49 — Production service: R²={metrics['r2']:.4f}, MAE={metrics['mae']:.4f}")

def ex50():
    """Regression checklist"""
    checklist = [
        "1. EDA: check distributions, outliers, correlations",
        "2. Split data: train/val/test (stratify if needed)",
        "3. Feature engineering: scaling, encoding, polynomials",
        "4. Baseline: mean predictor R² = 0",
        "5. Linear model: LinearRegression, Ridge, Lasso",
        "6. Evaluate: R², MAE, RMSE on val set",
        "7. Regularization: tune alpha via CV",
        "8. Residual analysis: normality, homoscedasticity",
        "9. Advanced: SVR, MLP, GBM if needed",
        "10. Final test evaluation: report R², RMSE, MAE",
    ]
    print("Ex50 — Regression Checklist:")
    for item in checklist:
        print(f"  {item}")


def main():
    print("=" * 60)
    print("Examples 3.1 — Linear Regression")
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
