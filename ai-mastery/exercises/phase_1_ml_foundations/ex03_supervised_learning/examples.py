# ============================================================
# Examples 1.3 — Supervised Learning (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification, make_regression
from sklearn.linear_model import (
    LinearRegression, LogisticRegression, Ridge, Lasso,
    SGDClassifier
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier,
    VotingClassifier, StackingClassifier
)
from sklearn.svm import SVC
from sklearn.model_selection import (
    train_test_split, cross_val_score, GridSearchCV,
    learning_curve, validation_curve, KFold
)
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score, mean_squared_error
)
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.inspection import permutation_importance
import warnings
warnings.filterwarnings("ignore")

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """LinearRegression fit/predict"""
    X, y = make_regression(n_samples=50, n_features=1, noise=10, random_state=0)
    model = LinearRegression().fit(X, y)
    pred = model.predict(X[:3])
    print(f"Ex01 — LinearRegression coef: {model.coef_[0]:.3f}, intercept: {model.intercept_:.3f}")
    print(f"       first 3 preds: {pred.round(2)}")

def ex02():
    """Train/test split + score"""
    X, y = make_regression(n_samples=100, n_features=3, noise=5, random_state=1)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = LinearRegression().fit(X_tr, y_tr)
    print(f"Ex02 — R² train: {model.score(X_tr,y_tr):.3f} | test: {model.score(X_te,y_te):.3f}")

def ex03():
    """MSE calculation"""
    y_true = np.array([3.0, 5.0, 2.5, 7.0])
    y_pred = np.array([2.8, 4.9, 2.7, 6.5])
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    print(f"Ex03 — MSE: {mse:.4f} | RMSE: {rmse:.4f}")

def ex04():
    """LogisticRegression binary"""
    X, y = make_classification(n_samples=100, n_features=4, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=200).fit(X_tr, y_tr)
    print(f"Ex04 — LogisticRegression accuracy: {model.score(X_te,y_te):.3f}")

def ex05():
    """KNeighborsClassifier"""
    X, y = make_classification(n_samples=100, n_features=4, random_state=2)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    knn = KNeighborsClassifier(n_neighbors=5).fit(X_tr, y_tr)
    print(f"Ex05 — KNN (k=5) accuracy: {knn.score(X_te,y_te):.3f}")

def ex06():
    """DecisionTreeClassifier"""
    X, y = make_classification(n_samples=150, n_features=5, random_state=3)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    dt = DecisionTreeClassifier(max_depth=4, random_state=0).fit(X_tr, y_tr)
    print(f"Ex06 — DecisionTree accuracy: {dt.score(X_te,y_te):.3f} | depth: {dt.get_depth()}")

def ex07():
    """Confusion matrix"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=4)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    pred = LogisticRegression(max_iter=200).fit(X_tr, y_tr).predict(X_te)
    cm = confusion_matrix(y_te, pred)
    print(f"Ex07 — Confusion matrix:\n{cm}")

def ex08():
    """Accuracy score"""
    y_true = np.array([0, 1, 1, 0, 1, 0])
    y_pred = np.array([0, 1, 0, 0, 1, 1])
    print(f"Ex08 — accuracy: {accuracy_score(y_true, y_pred):.3f} "
          f"({accuracy_score(y_true, y_pred, normalize=False)}/{len(y_true)} correct)")

def ex09():
    """Precision and Recall"""
    y_true = np.array([0, 1, 1, 0, 1, 0, 1])
    y_pred = np.array([0, 1, 0, 0, 1, 1, 1])
    print(f"Ex09 — precision: {precision_score(y_true,y_pred):.3f} | "
          f"recall: {recall_score(y_true,y_pred):.3f} | "
          f"F1: {f1_score(y_true,y_pred):.3f}")

def ex10():
    """Classification report"""
    X, y = make_classification(n_samples=150, n_features=5, random_state=5)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    pred = DecisionTreeClassifier(random_state=0).fit(X_tr, y_tr).predict(X_te)
    print("Ex10 — classification report:")
    print(classification_report(y_te, pred))

def ex11():
    """SGDClassifier"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=6)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    sgd = SGDClassifier(loss="hinge", max_iter=1000, random_state=0).fit(X_tr, y_tr)
    print(f"Ex11 — SGDClassifier accuracy: {sgd.score(X_te,y_te):.3f}")

def ex12():
    """Ridge regression"""
    X, y = make_regression(n_samples=100, n_features=5, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    ridge = Ridge(alpha=1.0).fit(X_tr, y_tr)
    print(f"Ex12 — Ridge R²: {ridge.score(X_te,y_te):.3f} | coefs: {ridge.coef_.round(3)}")

def ex13():
    """Lasso regression"""
    X, y = make_regression(n_samples=100, n_features=5, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    lasso = Lasso(alpha=0.1).fit(X_tr, y_tr)
    print(f"Ex13 — Lasso R²: {lasso.score(X_te,y_te):.3f} | coefs: {lasso.coef_.round(3)}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """RandomForestClassifier"""
    X, y = make_classification(n_samples=200, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr)
    print(f"Ex14 — RandomForest accuracy: {rf.score(X_te,y_te):.3f} | "
          f"OOB not computed (set oob_score=True)")

def ex15():
    """GradientBoostingClassifier"""
    X, y = make_classification(n_samples=200, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=0)
    gb.fit(X_tr, y_tr)
    print(f"Ex15 — GradientBoosting accuracy: {gb.score(X_te,y_te):.3f}")

def ex16():
    """SVM with RBF kernel"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    pipe = Pipeline([("sc", StandardScaler()), ("svm", SVC(kernel="rbf", C=1.0))])
    pipe.fit(X_tr, y_tr)
    print(f"Ex16 — SVM RBF accuracy: {pipe.score(X_te,y_te):.3f}")

def ex17():
    """Cross-validation score"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    model = LogisticRegression(max_iter=300)
    scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print(f"Ex17 — 5-fold CV: {scores.round(3)} | mean: {scores.mean():.3f} ± {scores.std():.3f}")

def ex18():
    """GridSearchCV"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    param_grid = {"max_depth": [2, 4, 6], "min_samples_split": [2, 5]}
    gs = GridSearchCV(DecisionTreeClassifier(random_state=0), param_grid, cv=5, scoring="accuracy")
    gs.fit(X, y)
    print(f"Ex18 — GridSearch best params: {gs.best_params_} | best CV score: {gs.best_score_:.3f}")

def ex19():
    """Feature importance from RandomForest"""
    X, y = make_classification(n_samples=200, n_features=6, n_informative=3, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X, y)
    importances = rf.feature_importances_
    ranked = np.argsort(importances)[::-1]
    print("Ex19 — feature importances (ranked):")
    for rank, fi in enumerate(ranked):
        print(f"       f{fi}: {importances[fi]:.4f}")

def ex20():
    """ROC-AUC score"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)[:, 1]
    print(f"Ex20 — ROC-AUC: {roc_auc_score(y_te, proba):.4f}")

def ex21():
    """Multi-class classification"""
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=200, n_features=6, n_classes=3, n_informative=4,
                                n_clusters_per_class=1, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=500, multi_class="multinomial").fit(X_tr, y_tr)
    print(f"Ex21 — multi-class (3) accuracy: {model.score(X_te,y_te):.3f}")

def ex22():
    """Multi-label concept"""
    from sklearn.multiclass import OneVsRestClassifier
    X, y_bin = make_classification(n_samples=150, n_features=6, random_state=0)
    # Simulate 3-label: threshold probability
    model = LogisticRegression(max_iter=300).fit(X, y_bin)
    proba = model.predict_proba(X)[:, 1]
    y_multi = np.column_stack([proba > 0.3, proba > 0.5, proba > 0.7]).astype(int)
    print(f"Ex22 — multi-label concept: shape {y_multi.shape} | "
          f"label counts: {y_multi.sum(axis=0)}")

def ex23():
    """class_weight for imbalanced"""
    rng = np.random.default_rng(0)
    X = rng.random((200, 4))
    y = np.concatenate([np.zeros(180), np.ones(20)]).astype(int)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0, stratify=y)
    m_none  = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    m_bal   = LogisticRegression(max_iter=300, class_weight="balanced").fit(X_tr, y_tr)
    print(f"Ex23 — no weight recall: {recall_score(y_te, m_none.predict(X_te)):.3f} | "
          f"balanced recall: {recall_score(y_te, m_bal.predict(X_te)):.3f}")

def ex24():
    """Calibrated classifier"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    base = SVC(probability=False)
    cal  = CalibratedClassifierCV(base, cv=3, method="sigmoid")
    cal.fit(X_tr, y_tr)
    proba = cal.predict_proba(X_te)[:, 1]
    print(f"Ex24 — calibrated SVM: proba range [{proba.min():.3f}, {proba.max():.3f}] | "
          f"AUC: {roc_auc_score(y_te, proba):.3f}")

def ex25():
    """VotingClassifier"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    vc = VotingClassifier(estimators=[
        ("lr",  LogisticRegression(max_iter=300)),
        ("dt",  DecisionTreeClassifier(max_depth=4, random_state=0)),
        ("knn", KNeighborsClassifier(n_neighbors=5)),
    ], voting="soft")
    vc.fit(X_tr, y_tr)
    print(f"Ex25 — VotingClassifier (soft) accuracy: {vc.score(X_te,y_te):.3f}")

def ex26():
    """StackingClassifier"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    base = [("dt", DecisionTreeClassifier(max_depth=3, random_state=0)),
            ("knn", KNeighborsClassifier(n_neighbors=7))]
    sc = StackingClassifier(estimators=base, final_estimator=LogisticRegression(max_iter=300), cv=3)
    sc.fit(X_tr, y_tr)
    print(f"Ex26 — StackingClassifier accuracy: {sc.score(X_te,y_te):.3f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Full ML pipeline (preprocess + model)"""
    X, y = make_classification(n_samples=300, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    pipe = Pipeline([
        ("sc",  StandardScaler()),
        ("clf", RandomForestClassifier(n_estimators=50, random_state=0)),
    ])
    pipe.fit(X_tr, y_tr)
    print(f"Ex27 — full ML pipeline: train {pipe.score(X_tr,y_tr):.3f} | test {pipe.score(X_te,y_te):.3f}")

def ex28():
    """Nested cross-validation"""
    from sklearn.model_selection import cross_validate
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    inner = KFold(n_splits=3, shuffle=True, random_state=0)
    outer = KFold(n_splits=5, shuffle=True, random_state=1)
    inner_gs = GridSearchCV(DecisionTreeClassifier(random_state=0),
                            {"max_depth": [2, 4]}, cv=inner, refit=True)
    cv_results = cross_validate(inner_gs, X, y, cv=outer, scoring="accuracy", return_train_score=True)
    print(f"Ex28 — nested CV: test scores {cv_results['test_score'].round(3)} | "
          f"mean {cv_results['test_score'].mean():.3f}")

def ex29():
    """Model comparison function"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    models = {
        "LR":   LogisticRegression(max_iter=300),
        "DT":   DecisionTreeClassifier(max_depth=4, random_state=0),
        "RF":   RandomForestClassifier(n_estimators=50, random_state=0),
        "KNN":  KNeighborsClassifier(n_neighbors=5),
    }
    print("Ex29 — model comparison (5-fold CV accuracy):")
    for name, m in models.items():
        scores = cross_val_score(m, X, y, cv=5)
        print(f"       {name:5s}: {scores.mean():.3f} ± {scores.std():.3f}")

def ex30():
    """Learning curve plotter (text)"""
    from sklearn.model_selection import learning_curve
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    train_sizes, train_scores, val_scores = learning_curve(
        LogisticRegression(max_iter=300), X, y,
        train_sizes=np.linspace(0.1, 1.0, 5), cv=3, scoring="accuracy")
    print("Ex30 — learning curve:")
    for sz, tr, va in zip(train_sizes, train_scores.mean(1), val_scores.mean(1)):
        print(f"       n={sz:4d}  train={tr:.3f}  val={va:.3f}")

def ex31():
    """Validation curve"""
    from sklearn.model_selection import validation_curve
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    depths = [1, 2, 3, 5, 8, 12]
    tr_sc, va_sc = validation_curve(DecisionTreeClassifier(random_state=0), X, y,
                                    param_name="max_depth", param_range=depths, cv=5)
    print("Ex31 — validation curve (max_depth vs accuracy):")
    for d, tr, va in zip(depths, tr_sc.mean(1), va_sc.mean(1)):
        print(f"       depth={d:2d}  train={tr:.3f}  val={va:.3f}")

def ex32():
    """Hyperparameter grid search + CV report"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    param_grid = {"n_estimators": [20, 50], "max_depth": [3, 5]}
    gs = GridSearchCV(RandomForestClassifier(random_state=0), param_grid, cv=3,
                      scoring="accuracy", return_train_score=True)
    gs.fit(X, y)
    results = pd.DataFrame(gs.cv_results_)
    cols = ["param_n_estimators","param_max_depth","mean_test_score","mean_train_score"]
    print("Ex32 — GridSearch results:\n", results[cols].to_string(index=False))

def ex33():
    """Early stopping simulation (GB with staged_predict)"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    gb = GradientBoostingClassifier(n_estimators=200, random_state=0).fit(X_tr, y_tr)
    staged_scores = [accuracy_score(y_te, p) for p in gb.staged_predict(X_te)]
    best_n = int(np.argmax(staged_scores)) + 1
    print(f"Ex33 — early stopping: best iteration = {best_n}, "
          f"score = {staged_scores[best_n-1]:.3f} (final = {staged_scores[-1]:.3f})")

def ex34():
    """Custom scorer"""
    from sklearn.metrics import make_scorer
    def high_recall_metric(y_true, y_pred):
        return 2 * recall_score(y_true, y_pred) - precision_score(y_true, y_pred)
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    custom_scorer = make_scorer(high_recall_metric)
    scores = cross_val_score(LogisticRegression(max_iter=300), X, y, cv=5, scoring=custom_scorer)
    print(f"Ex34 — custom recall-biased scorer: {scores.round(3)} | mean: {scores.mean():.3f}")

def ex35():
    """Pipeline with feature selection + model"""
    from sklearn.feature_selection import SelectKBest, f_classif
    X, y = make_classification(n_samples=200, n_features=12, n_informative=5, random_state=0)
    pipe = Pipeline([
        ("sc",  StandardScaler()),
        ("sel", SelectKBest(f_classif, k=5)),
        ("clf", LogisticRegression(max_iter=300)),
    ])
    scores = cross_val_score(pipe, X, y, cv=5)
    print(f"Ex35 — pipeline (scale→select→classify) CV: {scores.mean():.3f} ± {scores.std():.3f}")

def ex36():
    """Ensemble with different algorithms"""
    X, y = make_classification(n_samples=300, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    models = [
        LogisticRegression(max_iter=300),
        RandomForestClassifier(n_estimators=50, random_state=0),
        GradientBoostingClassifier(n_estimators=50, random_state=0),
    ]
    preds = np.array([m.fit(X_tr, y_tr).predict(X_te) for m in models])
    # majority vote
    from scipy import stats
    ensemble_pred = stats.mode(preds, axis=0)[0].ravel()
    print(f"Ex36 — manual ensemble majority vote: {accuracy_score(y_te, ensemble_pred):.3f}")

def ex37():
    """Model comparison table"""
    X, y = make_classification(n_samples=250, n_features=8, random_state=0)
    models = {
        "LogReg":   LogisticRegression(max_iter=300),
        "RF":       RandomForestClassifier(n_estimators=50, random_state=0),
        "GB":       GradientBoostingClassifier(n_estimators=50, random_state=0),
        "DT":       DecisionTreeClassifier(max_depth=5, random_state=0),
    }
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    print("Ex37 — model comparison table:")
    print(f"       {'Model':10s} {'Train':>6s} {'Test':>6s} {'AUC':>6s}")
    for name, m in models.items():
        m.fit(X_tr, y_tr)
        proba = m.predict_proba(X_te)[:, 1]
        print(f"       {name:10s} {m.score(X_tr,y_tr):6.3f} {m.score(X_te,y_te):6.3f} "
              f"{roc_auc_score(y_te, proba):6.3f}")

def ex38():
    """Train multiple models and compare on regression"""
    from sklearn.linear_model import Ridge, Lasso
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.metrics import mean_absolute_error
    X, y = make_regression(n_samples=200, n_features=6, noise=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    models = {"Ridge": Ridge(), "Lasso": Lasso(alpha=0.5),
              "RF_Reg": RandomForestRegressor(n_estimators=50, random_state=0),
              "GB_Reg": GradientBoostingRegressor(n_estimators=50, random_state=0)}
    print("Ex38 — regression model comparison:")
    for name, m in models.items():
        m.fit(X_tr, y_tr)
        pred = m.predict(X_te)
        print(f"       {name:8s} MAE={mean_absolute_error(y_te,pred):.2f}  "
              f"R²={m.score(X_te,y_te):.3f}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Learning rate scheduling concept (warm restart simulation)"""
    from sklearn.neural_network import MLPClassifier
    X, y = make_classification(n_samples=300, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    lrs = [0.1, 0.01, 0.001]
    for lr in lrs:
        m = MLPClassifier(hidden_layer_sizes=(32,), learning_rate_init=lr,
                          max_iter=50, random_state=0)
        m.fit(X_tr, y_tr)
        print(f"Ex39 — lr={lr:.3f}: test acc={m.score(X_te,y_te):.3f}")

def ex40():
    """Warm starting (incremental refit)"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    rf = RandomForestClassifier(n_estimators=10, warm_start=True, random_state=0)
    for n in [10, 30, 50, 100]:
        rf.n_estimators = n
        rf.fit(X_tr, y_tr)
        print(f"Ex40 — warm_start n_estimators={n:3d}: acc={rf.score(X_te,y_te):.3f}")

def ex41():
    """partial_fit for online learning"""
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=500, n_features=6, random_state=0)
    sgd = SGDClassifier(loss="log_loss", max_iter=1, random_state=0)
    chunk_size = 50
    for i in range(0, 400, chunk_size):
        sgd.partial_fit(X[i:i+chunk_size], y[i:i+chunk_size], classes=[0, 1])
    acc = accuracy_score(y[400:], sgd.predict(X[400:]))
    print(f"Ex41 — partial_fit online learning: final test accuracy={acc:.3f}")

def ex42():
    """Incremental learning (accumulate data)"""
    from sklearn.naive_bayes import GaussianNB
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    gnb = GaussianNB()
    accs = []
    for end in range(50, 251, 50):
        gnb.partial_fit(X[end-50:end], y[end-50:end], classes=[0,1])
        acc = accuracy_score(y[250:], gnb.predict(X[250:]))
        accs.append(acc)
    print(f"Ex42 — incremental GaussianNB accs by chunk: {[round(a,3) for a in accs]}")

def ex43():
    """Custom estimator (BaseEstimator + ClassifierMixin)"""
    class MajorityClassifier(BaseEstimator, ClassifierMixin):
        def fit(self, X, y):
            vals, counts = np.unique(y, return_counts=True)
            self.majority_class_ = vals[np.argmax(counts)]
            self.classes_ = vals
            return self
        def predict(self, X):
            return np.full(len(X), self.majority_class_)
    X, y = make_classification(n_samples=100, n_features=4, weights=[0.8,0.2], random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    mc = MajorityClassifier().fit(X_tr, y_tr)
    print(f"Ex43 — MajorityClassifier: majority={mc.majority_class_}, "
          f"acc={accuracy_score(y_te, mc.predict(X_te)):.3f}")

def ex44():
    """Permutation importance"""
    X, y = make_classification(n_samples=200, n_features=6, n_informative=3, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    rf = RandomForestClassifier(n_estimators=100, random_state=0).fit(X_tr, y_tr)
    result = permutation_importance(rf, X_te, y_te, n_repeats=10, random_state=0)
    print("Ex44 — permutation importances:")
    for i in np.argsort(result.importances_mean)[::-1]:
        print(f"       f{i}: {result.importances_mean[i]:.4f} ± {result.importances_std[i]:.4f}")

def ex45():
    """SHAP values concept (manual approximation)"""
    X, y = make_classification(n_samples=100, n_features=4, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X, y)
    # Linear SHAP: feature_value * coef (simplified)
    coefs = model.coef_[0]
    x_sample = X[0]
    contributions = x_sample * coefs
    pred_prob = model.predict_proba(X[0:1])[0, 1]
    print(f"Ex45 — SHAP concept (linear): prediction prob={pred_prob:.3f}")
    print(f"       feature contributions: {contributions.round(4)}")
    print(f"       sum + bias ≈ logit: {(contributions.sum() + model.intercept_[0]):.4f}")

def ex46():
    """Confidence intervals for predictions (bootstrap)"""
    rng = np.random.default_rng(42)
    X, y = make_regression(n_samples=100, n_features=3, noise=5, random_state=0)
    preds_boot = []
    for _ in range(200):
        idx = rng.integers(0, 80, 80)
        m = LinearRegression().fit(X[idx], y[idx])
        preds_boot.append(m.predict(X[80:]))
    boot_arr = np.array(preds_boot)
    ci_low  = np.percentile(boot_arr, 2.5, axis=0)
    ci_high = np.percentile(boot_arr, 97.5, axis=0)
    mean_pred = boot_arr.mean(axis=0)
    print(f"Ex46 — bootstrap CI (first 3 test samples):")
    for i in range(3):
        print(f"       pred={mean_pred[i]:.2f}  95% CI=[{ci_low[i]:.2f}, {ci_high[i]:.2f}]")

def ex47():
    """Prediction uncertainty (probability spread)"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    proba = model.predict_proba(X_te)
    uncertainty = 1 - proba.max(axis=1)   # lower max prob = higher uncertainty
    certain_mask = uncertainty < 0.1
    print(f"Ex47 — prediction uncertainty: mean={uncertainty.mean():.3f} | "
          f"highly certain (prob>0.9): {certain_mask.sum()}/{len(X_te)}")

def ex48():
    """Production model wrapper"""
    class ProductionModel:
        def __init__(self, pipeline):
            self.pipeline = pipeline
            self.n_predictions = 0
        def predict(self, X):
            if not hasattr(self, "pipeline"):
                raise RuntimeError("Model not loaded")
            result = self.pipeline.predict(X)
            self.n_predictions += len(X)
            return result
        def stats(self):
            return {"total_predictions": self.n_predictions}
    X, y = make_classification(n_samples=150, n_features=5, random_state=0)
    pipe = Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=300))])
    pipe.fit(X[:100], y[:100])
    prod = ProductionModel(pipe)
    pred = prod.predict(X[100:])
    print(f"Ex48 — ProductionModel: acc={accuracy_score(y[100:], pred):.3f} | "
          f"stats={prod.stats()}")

def ex49():
    """A/B test model comparison"""
    from scipy import stats as scipy_stats
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    model_a = LogisticRegression(max_iter=300).fit(X_tr, y_tr)
    model_b = RandomForestClassifier(n_estimators=50, random_state=0).fit(X_tr, y_tr)
    # Compare per-sample correctness for paired test
    correct_a = (model_a.predict(X_te) == y_te).astype(int)
    correct_b = (model_b.predict(X_te) == y_te).astype(int)
    t_stat, p_val = scipy_stats.ttest_rel(correct_a, correct_b)
    print(f"Ex49 — A/B test: Model A acc={correct_a.mean():.3f} | Model B acc={correct_b.mean():.3f}")
    print(f"       paired t-test: t={t_stat:.3f}, p={p_val:.4f} ({'significant' if p_val<0.05 else 'not significant'})")

def ex50():
    """Full ML experiment tracker"""
    import time
    results = []
    X, y = make_classification(n_samples=300, n_features=8, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
    experiments = [
        ("LogReg",       Pipeline([("sc", StandardScaler()), ("clf", LogisticRegression(max_iter=300))])),
        ("RF-50",        RandomForestClassifier(n_estimators=50, random_state=0)),
        ("GB-100",       GradientBoostingClassifier(n_estimators=100, random_state=0)),
        ("DT-depth4",    DecisionTreeClassifier(max_depth=4, random_state=0)),
    ]
    for name, model in experiments:
        t0 = time.perf_counter()
        model.fit(X_tr, y_tr)
        t_fit = time.perf_counter() - t0
        pred = model.predict(X_te)
        proba = model.predict_proba(X_te)[:, 1]
        results.append({
            "model": name,
            "acc": accuracy_score(y_te, pred),
            "auc": roc_auc_score(y_te, proba),
            "fit_ms": round(t_fit * 1000, 1),
        })
    df = pd.DataFrame(results).sort_values("auc", ascending=False)
    print("Ex50 — ML experiment tracker:")
    print(df.to_string(index=False))


def main():
    print("=" * 60)
    print("Examples 1.3 — Supervised Learning")
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
