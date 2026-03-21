# ============================================================
# Solution 1.3 — Supervised Learning: Regression & Classification
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import (
    LinearRegression, LogisticRegression, Ridge, Lasso
)
from sklearn.metrics import (
    mean_squared_error, r2_score, classification_report, accuracy_score
)
from sklearn.model_selection import (
    train_test_split, cross_val_score, learning_curve
)
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
import joblib
import os

# ---------------------------------------------------------------------------
# Shared sample data
# ---------------------------------------------------------------------------
np.random.seed(42)

X_reg, y_reg = make_regression(n_samples=200, n_features=5, noise=15, random_state=42)
X_reg_train, X_reg_test, y_reg_train, y_reg_test = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

X_clf, y_clf = make_classification(
    n_samples=300, n_features=10, n_informative=5,
    n_redundant=2, random_state=42
)
X_clf_train, X_clf_test, y_clf_train, y_clf_test = train_test_split(
    X_clf, y_clf, test_size=0.2, random_state=42
)

# ---------------------------------------------------------------------------
# TODO 1: Train LinearRegression
# ---------------------------------------------------------------------------

def train_linear_regression():
    model = LinearRegression()
    model.fit(X_reg_train, y_reg_train)
    return model

# ---------------------------------------------------------------------------
# TODO 2: Evaluate regression
# ---------------------------------------------------------------------------

def evaluate_regression(model):
    y_pred = model.predict(X_reg_test)
    return {
        'mse': mean_squared_error(y_reg_test, y_pred),
        'r2':  r2_score(y_reg_test, y_pred),
    }

# ---------------------------------------------------------------------------
# TODO 3: Train LogisticRegression
# ---------------------------------------------------------------------------

def train_logistic_regression():
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_clf_train, y_clf_train)
    return model

# ---------------------------------------------------------------------------
# TODO 4: Predictions + classification_report
# ---------------------------------------------------------------------------

def evaluate_classification(model):
    y_pred = model.predict(X_clf_test)
    print("\n  Classification Report:\n", classification_report(y_clf_test, y_pred))
    return y_pred

# ---------------------------------------------------------------------------
# TODO 5: Ridge regression
# ---------------------------------------------------------------------------

def train_ridge():
    model = Ridge(alpha=1.0)
    model.fit(X_reg_train, y_reg_train)
    return model

# ---------------------------------------------------------------------------
# TODO 6: Lasso regression
# ---------------------------------------------------------------------------

def train_lasso():
    model = Lasso(alpha=0.1)
    model.fit(X_reg_train, y_reg_train)
    return model

# ---------------------------------------------------------------------------
# TODO 7: Tune C parameter
# ---------------------------------------------------------------------------

def tune_logistic_c():
    c_values = [0.001, 0.01, 0.1, 1, 10, 100]
    results = {}
    for c in c_values:
        model = LogisticRegression(C=c, max_iter=1000, random_state=42)
        model.fit(X_clf_train, y_clf_train)
        results[c] = round(model.score(X_clf_test, y_clf_test), 4)
    return results

# ---------------------------------------------------------------------------
# TODO 8: Three-way split
# ---------------------------------------------------------------------------

def three_way_split():
    # First split off test set (20%)
    X_temp, X_test, y_temp, y_test = train_test_split(
        X_clf, y_clf, test_size=0.2, random_state=42
    )
    # Split remainder into train (60% of total = 75% of 80%) and val (20% of total)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.25, random_state=42
    )
    return X_train, X_val, X_test, y_train, y_val, y_test

# ---------------------------------------------------------------------------
# TODO 9: Detect overfitting
# ---------------------------------------------------------------------------

def detect_overfitting():
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_clf_train, y_clf_train)
    train_acc = model.score(X_clf_train, y_clf_train)
    test_acc  = model.score(X_clf_test, y_clf_test)
    diff = train_acc - test_acc
    print(f"  Train acc: {train_acc:.4f} | Test acc: {test_acc:.4f} | Diff: {diff:.4f}")
    if diff > 0.05:
        print("  → Model is overfitting (train >> test).")
    else:
        print("  → Model generalises well.")
    return {'train_acc': round(train_acc, 4), 'test_acc': round(test_acc, 4)}

# ---------------------------------------------------------------------------
# TODO 10: Cross-validation
# ---------------------------------------------------------------------------

def cross_validate():
    model = LogisticRegression(max_iter=1000, random_state=42)
    scores = cross_val_score(model, X_clf, y_clf, cv=5)
    return {'mean': round(scores.mean(), 4), 'std': round(scores.std(), 4)}

# ---------------------------------------------------------------------------
# TODO 11: Learning curve
# ---------------------------------------------------------------------------

def compute_learning_curve():
    # A learning curve plots score vs. training set size.
    # Overfitting: train score >> val score.
    # Underfitting: both scores are low and close together.
    # Good fit: both scores converge at a high value.
    model = LogisticRegression(max_iter=1000, random_state=42)
    train_sizes, train_scores, val_scores = learning_curve(
        model, X_clf, y_clf, cv=5,
        train_sizes=np.linspace(0.1, 1.0, 10),
        scoring='accuracy'
    )
    train_scores_mean = train_scores.mean(axis=1)
    val_scores_mean   = val_scores.mean(axis=1)
    return train_sizes, train_scores_mean, val_scores_mean

# ---------------------------------------------------------------------------
# TODO 12: Bias-variance demo
# ---------------------------------------------------------------------------

def bias_variance_demo():
    # Linear model: low variance, may have bias if data is nonlinear.
    # Degree-10 polynomial: low bias (fits training well), high variance.
    lin_model = LinearRegression()
    lin_model.fit(X_reg_train, y_reg_train)
    lin_train_r2 = r2_score(y_reg_train, lin_model.predict(X_reg_train))
    lin_test_r2  = r2_score(y_reg_test,  lin_model.predict(X_reg_test))

    # Polynomial (degree 3 — a moderate complexity increase)
    poly_model = make_pipeline(PolynomialFeatures(degree=3), LinearRegression())
    poly_model.fit(X_reg_train, y_reg_train)
    poly_train_r2 = r2_score(y_reg_train, poly_model.predict(X_reg_train))
    poly_test_r2  = r2_score(y_reg_test,  poly_model.predict(X_reg_test))

    return {
        'linear':     {'train_r2': round(lin_train_r2, 4),  'test_r2': round(lin_test_r2, 4)},
        'polynomial': {'train_r2': round(poly_train_r2, 4), 'test_r2': round(poly_test_r2, 4)},
    }

# ---------------------------------------------------------------------------
# TODO 13: Baseline model
# ---------------------------------------------------------------------------

def baseline_model():
    # Regression baseline: always predict the training mean
    y_pred_reg = np.full(y_reg_test.shape, y_reg_train.mean())
    baseline_mse = mean_squared_error(y_reg_test, y_pred_reg)

    # Classification baseline: always predict the most common class
    from scipy.stats import mode
    most_common = mode(y_clf_train, keepdims=True).mode[0]
    y_pred_clf = np.full(y_clf_test.shape, most_common)
    baseline_acc = accuracy_score(y_clf_test, y_pred_clf)

    return {
        'baseline_mse': round(baseline_mse, 2),
        'baseline_acc': round(baseline_acc, 4),
    }

# ---------------------------------------------------------------------------
# TODO 14: Compare multiple regression models
# ---------------------------------------------------------------------------

def compare_models():
    models = {
        'LinearRegression': LinearRegression(),
        'Ridge(alpha=1)':   Ridge(alpha=1.0),
        'Lasso(alpha=0.1)': Lasso(alpha=0.1),
    }
    results = {}
    for name, model in models.items():
        model.fit(X_reg_train, y_reg_train)
        r2 = r2_score(y_reg_test, model.predict(X_reg_test))
        results[name] = round(r2, 4)
    return results

# ---------------------------------------------------------------------------
# TODO 15: Save and load model with joblib
# ---------------------------------------------------------------------------

def save_and_load_model():
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_clf_train, y_clf_train)

    path = 'model.joblib'
    joblib.dump(model, path)

    loaded_model = joblib.load(path)
    acc = accuracy_score(y_clf_test, loaded_model.predict(X_clf_test))

    os.remove(path)
    return round(acc, 4)

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 1.3: Supervised Learning ===\n")

    model_lr = train_linear_regression()
    print("Result 1  — LinearRegression:", model_lr)
    print("Result 2  — Regression metrics:", evaluate_regression(model_lr))

    model_log = train_logistic_regression()
    print("\nResult 3  — LogisticRegression:", model_log)
    preds = evaluate_classification(model_log)
    print("Result 4  — Predictions (first 10):", preds[:10])

    ridge = train_ridge()
    lasso = train_lasso()
    print("\nResult 5  — Ridge R²:", round(r2_score(y_reg_test, ridge.predict(X_reg_test)), 4))
    print("Result 6  — Lasso R²:", round(r2_score(y_reg_test, lasso.predict(X_reg_test)), 4))
    print("\nResult 7  — C tuning:", tune_logistic_c())

    splits = three_way_split()
    print("\nResult 8  — Split sizes:", [s.shape for s in splits])
    print("Result 9  — Overfitting check:", detect_overfitting())
    print("Result 10 — Cross-val:", cross_validate())

    ts, tr_s, v_s = compute_learning_curve()
    print("\nResult 11 — Learning curve (val scores):", np.round(v_s, 3))
    print("Result 12 — Bias-variance demo:", bias_variance_demo())
    print("Result 13 — Baseline metrics:", baseline_model())
    print("Result 14 — Model comparison:", compare_models())
    print("Result 15 — Save/load accuracy:", save_and_load_model())

if __name__ == "__main__":
    main()
