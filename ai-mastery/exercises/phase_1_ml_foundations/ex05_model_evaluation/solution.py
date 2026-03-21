# ============================================================
# Solution 1.5 — Model Evaluation & Validation
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold,
    GridSearchCV, learning_curve
)
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.metrics import (
    confusion_matrix, accuracy_score, precision_score,
    recall_score, f1_score, classification_report,
    roc_auc_score, roc_curve,
    mean_squared_error, mean_absolute_error, r2_score
)

# ---------------------------------------------------------------------------
# Shared sample data
# ---------------------------------------------------------------------------
np.random.seed(42)

X_clf, y_clf = make_classification(
    n_samples=500, n_features=10, n_informative=6,
    n_redundant=2, random_state=42
)
X_clf_train, X_clf_test, y_clf_train, y_clf_test = train_test_split(
    X_clf, y_clf, test_size=0.2, random_state=42, stratify=y_clf
)

X_reg, y_reg = make_regression(n_samples=300, n_features=8, noise=20, random_state=42)
X_reg_train, X_reg_test, y_reg_train, y_reg_test = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

# ---------------------------------------------------------------------------
# TODO 1: Stratified k-fold cross-validation
# ---------------------------------------------------------------------------

def stratified_cv():
    model = LogisticRegression(max_iter=1000, random_state=42)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(model, X_clf, y_clf, cv=skf, scoring='accuracy')
    return {
        'mean_acc':   round(scores.mean(), 4),
        'std_acc':    round(scores.std(), 4),
        'fold_scores': np.round(scores, 4).tolist(),
    }

# ---------------------------------------------------------------------------
# TODO 2: Confusion matrix analysis
# ---------------------------------------------------------------------------

def confusion_matrix_analysis():
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_clf_train, y_clf_train)
    y_pred = model.predict(X_clf_test)
    cm = confusion_matrix(y_clf_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    return {
        'confusion_matrix': cm,
        'tn': int(tn), 'fp': int(fp),
        'fn': int(fn), 'tp': int(tp),
    }

# ---------------------------------------------------------------------------
# TODO 3: Precision, Recall, F1 — manual and sklearn
# ---------------------------------------------------------------------------

def precision_recall_f1():
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_clf_train, y_clf_train)
    y_pred = model.predict(X_clf_test)

    cm = confusion_matrix(y_clf_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    manual_precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    manual_recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    manual_f1 = (
        2 * manual_precision * manual_recall / (manual_precision + manual_recall)
        if (manual_precision + manual_recall) > 0 else 0.0
    )

    return {
        'sklearn_precision': round(precision_score(y_clf_test, y_pred), 4),
        'sklearn_recall':    round(recall_score(y_clf_test, y_pred), 4),
        'sklearn_f1':        round(f1_score(y_clf_test, y_pred), 4),
        'manual_precision':  round(manual_precision, 4),
        'manual_recall':     round(manual_recall, 4),
        'manual_f1':         round(manual_f1, 4),
    }

# ---------------------------------------------------------------------------
# TODO 4: ROC curve and AUC
# ---------------------------------------------------------------------------

def roc_analysis():
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_clf_train, y_clf_train)
    y_proba = model.predict_proba(X_clf_test)[:, 1]
    auc = roc_auc_score(y_clf_test, y_proba)
    fpr, tpr, thresholds = roc_curve(y_clf_test, y_proba)
    return {'auc': round(auc, 4), 'n_thresholds': len(thresholds)}

# ---------------------------------------------------------------------------
# TODO 5: Regression metrics
# ---------------------------------------------------------------------------

def regression_metrics():
    model = LinearRegression()
    model.fit(X_reg_train, y_reg_train)
    y_pred = model.predict(X_reg_test)
    mse  = mean_squared_error(y_reg_test, y_pred)
    mae  = mean_absolute_error(y_reg_test, y_pred)
    r2   = r2_score(y_reg_test, y_pred)
    return {
        'mse':  round(mse, 2),
        'rmse': round(np.sqrt(mse), 2),
        'mae':  round(mae, 2),
        'r2':   round(r2, 4),
    }

# ---------------------------------------------------------------------------
# TODO 6: Compare regression models
# ---------------------------------------------------------------------------

def compare_regression_models():
    models = {
        'LinearRegression': LinearRegression(),
        'Ridge(alpha=1)':   Ridge(alpha=1.0),
        'Ridge(alpha=10)':  Ridge(alpha=10.0),
    }
    results = {}
    for name, model in models.items():
        model.fit(X_reg_train, y_reg_train)
        y_pred = model.predict(X_reg_test)
        results[name] = {
            'r2':  round(r2_score(y_reg_test, y_pred), 4),
            'mae': round(mean_absolute_error(y_reg_test, y_pred), 2),
        }
    return results

# ---------------------------------------------------------------------------
# TODO 7: Bias-variance tradeoff with polynomial degree
# ---------------------------------------------------------------------------

def bias_variance_polynomial():
    # Use single feature for clean illustration
    X_1d_train, X_1d_test = X_reg_train[:, :1], X_reg_test[:, :1]
    results = {}
    for degree in [1, 2, 3, 5, 10]:
        pipeline = make_pipeline(PolynomialFeatures(degree), LinearRegression())
        pipeline.fit(X_1d_train, y_reg_train)
        train_mse = mean_squared_error(y_reg_train, pipeline.predict(X_1d_train))
        test_mse  = mean_squared_error(y_reg_test,  pipeline.predict(X_1d_test))
        results[degree] = {
            'train_mse': round(train_mse, 2),
            'test_mse':  round(test_mse, 2),
        }
    return results

# ---------------------------------------------------------------------------
# TODO 8: Learning curve data
# ---------------------------------------------------------------------------

def learning_curve_data():
    model = LogisticRegression(max_iter=1000, random_state=42)
    train_sizes, train_scores, val_scores = learning_curve(
        model, X_clf, y_clf,
        cv=5, train_sizes=np.linspace(0.1, 1.0, 10),
        scoring='accuracy'
    )
    return {
        'train_sizes':       train_sizes.tolist(),
        'train_scores_mean': np.round(train_scores.mean(axis=1), 4).tolist(),
        'val_scores_mean':   np.round(val_scores.mean(axis=1), 4).tolist(),
    }

# ---------------------------------------------------------------------------
# TODO 9: GridSearchCV — LogisticRegression
# ---------------------------------------------------------------------------

def grid_search_logistic():
    param_grid = {
        'C':      [0.01, 0.1, 1, 10],
        'solver': ['lbfgs', 'liblinear'],
    }
    model = LogisticRegression(max_iter=1000, random_state=42)
    gs = GridSearchCV(model, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
    gs.fit(X_clf_train, y_clf_train)
    results_df = pd.DataFrame(gs.cv_results_)[['param_C', 'param_solver', 'mean_test_score']]
    return {
        'best_params':    gs.best_params_,
        'best_score':     round(gs.best_score_, 4),
        'all_results_df': results_df,
    }

# ---------------------------------------------------------------------------
# TODO 10: GridSearchCV — RandomForest
# ---------------------------------------------------------------------------

def grid_search_rf():
    param_grid = {
        'n_estimators': [50, 100],
        'max_depth':    [None, 5, 10],
    }
    rf = RandomForestClassifier(random_state=42)
    gs = GridSearchCV(rf, param_grid, cv=3, scoring='f1', n_jobs=-1)
    gs.fit(X_clf_train, y_clf_train)
    return {
        'best_params': gs.best_params_,
        'best_f1':     round(gs.best_score_, 4),
    }

# ---------------------------------------------------------------------------
# TODO 11: Feature importance from Random Forest
# ---------------------------------------------------------------------------

def feature_importance():
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_clf_train, y_clf_train)
    importances = rf.feature_importances_
    top3_idx = np.argsort(importances)[::-1][:3]
    return {
        'top3_indices':     top3_idx.tolist(),
        'top3_importances': np.round(importances[top3_idx], 4).tolist(),
    }

# ---------------------------------------------------------------------------
# TODO 12: Permutation importance (manual)
# ---------------------------------------------------------------------------

def permutation_importance():
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_clf_train, y_clf_train)
    baseline_acc = accuracy_score(y_clf_test, model.predict(X_clf_test))

    rng = np.random.RandomState(0)
    importances = {}
    for i in range(X_clf_test.shape[1]):
        X_permuted = X_clf_test.copy()
        X_permuted[:, i] = rng.permutation(X_permuted[:, i])
        shuffled_acc = accuracy_score(y_clf_test, model.predict(X_permuted))
        importances[i] = round(baseline_acc - shuffled_acc, 4)
    return importances

# ---------------------------------------------------------------------------
# TODO 13: Full evaluation pipeline
# ---------------------------------------------------------------------------

def evaluation_pipeline():
    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('clf',    LogisticRegression(max_iter=1000, random_state=42)),
    ])
    scores = cross_val_score(pipe, X_clf, y_clf, cv=5, scoring='f1')
    return {'mean_f1': round(scores.mean(), 4), 'std_f1': round(scores.std(), 4)}

# ---------------------------------------------------------------------------
# TODO 14: Multi-metric evaluation dashboard
# ---------------------------------------------------------------------------

def evaluation_dashboard():
    scaler = StandardScaler()
    X_tr_sc = scaler.fit_transform(X_clf_train)
    X_te_sc = scaler.transform(X_clf_test)

    configs = [
        ('LogisticRegression', LogisticRegression(max_iter=1000, random_state=42), False),
        ('RandomForest',       RandomForestClassifier(n_estimators=100, random_state=42), False),
        ('SVC',                SVC(probability=True, random_state=42), True),
    ]

    dashboard = []
    for name, model, use_scaled in configs:
        X_tr = X_tr_sc if use_scaled else X_clf_train
        X_te = X_te_sc if use_scaled else X_clf_test
        model.fit(X_tr, y_clf_train)
        y_pred  = model.predict(X_te)
        y_proba = model.predict_proba(X_te)[:, 1]
        dashboard.append({
            'model':     name,
            'accuracy':  round(accuracy_score(y_clf_test, y_pred), 4),
            'precision': round(precision_score(y_clf_test, y_pred), 4),
            'recall':    round(recall_score(y_clf_test, y_pred), 4),
            'f1':        round(f1_score(y_clf_test, y_pred), 4),
            'auc':       round(roc_auc_score(y_clf_test, y_proba), 4),
        })
    return dashboard

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 1.5: Model Evaluation & Validation ===\n")

    print("Result 1  — Stratified CV:", stratified_cv())
    cm_result = confusion_matrix_analysis()
    print("Result 2  — Confusion matrix:\n", cm_result['confusion_matrix'])
    print("           TP:", cm_result['tp'], "FP:", cm_result['fp'],
          "TN:", cm_result['tn'], "FN:", cm_result['fn'])
    print("Result 3  — Precision/Recall/F1:", precision_recall_f1())
    print("Result 4  — ROC/AUC:", roc_analysis())
    print("Result 5  — Regression metrics:", regression_metrics())
    print("Result 6  — Compare regression models:", compare_regression_models())
    print("Result 7  — Bias-variance polynomial:", bias_variance_polynomial())

    lc = learning_curve_data()
    print("Result 8  — Learning curve val scores:", lc['val_scores_mean'])

    gs = grid_search_logistic()
    print("Result 9  — GridSearch best params:", gs['best_params'], "score:", gs['best_score'])
    print("Result 10 — GridSearch RF:", grid_search_rf())
    print("Result 11 — Feature importance:", feature_importance())
    print("Result 12 — Permutation importance:", permutation_importance())
    print("Result 13 — Pipeline CV:", evaluation_pipeline())

    dashboard = evaluation_dashboard()
    print("Result 14 — Evaluation dashboard:")
    for entry in dashboard:
        print("           ", entry)

if __name__ == "__main__":
    main()
