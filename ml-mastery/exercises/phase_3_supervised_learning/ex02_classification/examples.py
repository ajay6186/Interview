# ============================================================
# Examples 3.2 — Classification Algorithms (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, Perceptron, SGDClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import LinearSVC, SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.multiclass import OneVsRestClassifier, OneVsOneClassifier
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.datasets import load_iris, load_breast_cancer, make_classification, make_moons
from sklearn.metrics import (
    accuracy_score, confusion_matrix, classification_report,
    roc_auc_score, f1_score, precision_recall_curve, auc
)
from sklearn.impute import SimpleImputer

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """LogisticRegression fit + predict"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = LogisticRegression(max_iter=500).fit(X_tr, y_tr)
    acc = accuracy_score(y_te, model.predict(X_te))
    print(f"Ex01 — LogReg accuracy: {acc:.4f}")

def ex02():
    """Accuracy score"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=1)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    preds = LogisticRegression(max_iter=500).fit(X_tr, y_tr).predict(X_te)
    print(f"Ex02 — Accuracy: {accuracy_score(y_te, preds):.4f}")

def ex03():
    """Confusion matrix"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=2)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    preds = LogisticRegression(max_iter=500).fit(X_tr, y_tr).predict(X_te)
    cm = confusion_matrix(y_te, preds)
    print(f"Ex03 — Confusion matrix:\n{cm}")

def ex04():
    """Classification report"""
    X, y = load_iris(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    preds = LogisticRegression(max_iter=500).fit(X_tr, y_tr).predict(X_te)
    report = classification_report(y_te, preds, target_names=load_iris().target_names)
    print(f"Ex04 — Classification report:\n{report}")

def ex05():
    """KNeighborsClassifier (k=3)"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=3)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = KNeighborsClassifier(n_neighbors=3).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex05 — KNN k=3 accuracy: {acc:.4f}")

def ex06():
    """GaussianNB"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=4)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = GaussianNB().fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex06 — GaussianNB accuracy: {acc:.4f}")

def ex07():
    """LinearSVC"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=5)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = LinearSVC(max_iter=2000, dual=False).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex07 — LinearSVC accuracy: {acc:.4f}")

def ex08():
    """DecisionTreeClassifier"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=6)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = DecisionTreeClassifier(random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex08 — DecisionTree accuracy: {acc:.4f}")

def ex09():
    """predict_proba"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=7)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    probs = LogisticRegression(max_iter=500).fit(X_tr, y_tr).predict_proba(X_te)[:3]
    print(f"Ex09 — predict_proba (3 samples):\n{np.round(probs, 3)}")

def ex10():
    """Binary classification on breast_cancer"""
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    pipe = Pipeline([("scaler", StandardScaler()), ("lr", LogisticRegression(max_iter=1000))])
    acc = pipe.fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex10 — Breast cancer accuracy: {acc:.4f}")

def ex11():
    """Multi-class on iris"""
    X, y = load_iris(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = LogisticRegression(max_iter=500).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex11 — Iris multi-class accuracy: {acc:.4f}")

def ex12():
    """Train/test split + accuracy"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=8)
    for ts in [0.1, 0.2, 0.3]:
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=ts, random_state=0)
        acc = LogisticRegression(max_iter=500).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex12 — test_size={ts}: accuracy={acc:.4f}")

def ex13():
    """ROC-AUC score"""
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = Pipeline([("sc", StandardScaler()), ("lr", LogisticRegression(max_iter=1000))])
    model.fit(X_tr, y_tr)
    probs = model.predict_proba(X_te)[:, 1]
    print(f"Ex13 — ROC-AUC: {roc_auc_score(y_te, probs):.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """LogisticRegression with C tuning"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for C in [0.01, 0.1, 1.0, 10.0]:
        acc = LogisticRegression(C=C, max_iter=500).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex14 — C={C}: accuracy={acc:.4f}")

def ex15():
    """KNN with distance weighting"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for w in ["uniform", "distance"]:
        acc = KNeighborsClassifier(n_neighbors=5, weights=w).fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex15 — KNN weights={w}: accuracy={acc:.4f}")

def ex16():
    """SVM with RBF kernel"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X_sc = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X_sc, y, test_size=0.2, random_state=0)
    acc = SVC(kernel="rbf", C=1.0, gamma="scale").fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex16 — SVM RBF accuracy: {acc:.4f}")

def ex17():
    """Perceptron"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    acc = Perceptron(max_iter=500, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex17 — Perceptron accuracy: {acc:.4f}")

def ex18():
    """SGDClassifier"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_sc = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X_sc, y, test_size=0.2, random_state=0)
    acc = SGDClassifier(max_iter=500, random_state=0).fit(X_tr, y_tr).score(X_te, y_te)
    print(f"Ex18 — SGD accuracy: {acc:.4f}")

def ex19():
    """class_weight='balanced'"""
    X, y = make_classification(n_samples=300, n_features=5, weights=[0.9, 0.1], random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for cw in [None, "balanced"]:
        f1 = f1_score(y_te, LogisticRegression(class_weight=cw, max_iter=500).fit(X_tr, y_tr).predict(X_te))
        print(f"Ex19 — class_weight={cw}: F1={f1:.4f}")

def ex20():
    """Decision threshold tuning"""
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = Pipeline([("sc", StandardScaler()), ("lr", LogisticRegression(max_iter=1000))])
    probs = model.fit(X_tr, y_tr).predict_proba(X_te)[:, 1]
    for thresh in [0.3, 0.5, 0.7]:
        preds = (probs >= thresh).astype(int)
        print(f"Ex20 — threshold={thresh}: F1={f1_score(y_te, preds):.4f}")

def ex21():
    """Calibrated classifier"""
    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    base = LinearSVC(max_iter=2000, dual=False)
    cal = CalibratedClassifierCV(base, cv=3).fit(X_tr, y_tr)
    probs = cal.predict_proba(X_te)[:3]
    print(f"Ex21 — Calibrated probs (3 samples): {np.round(probs, 3)}")

def ex22():
    """Multi-class strategies: OvR and OvO"""
    X, y = load_iris(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    base = LogisticRegression(max_iter=500)
    for name, clf in [("OvR", OneVsRestClassifier(base)), ("OvO", OneVsOneClassifier(base))]:
        acc = clf.fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex22 — {name} accuracy: {acc:.4f}")

def ex23():
    """Probability calibration: reliability data"""
    X, y = make_classification(n_samples=500, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    probs = LogisticRegression(max_iter=500).fit(X_tr, y_tr).predict_proba(X_te)[:, 1]
    bins = np.linspace(0, 1, 6)
    for i in range(len(bins) - 1):
        mask = (probs >= bins[i]) & (probs < bins[i+1])
        if mask.sum() > 0:
            frac_pos = y_te[mask].mean()
            print(f"Ex23 — Bin [{bins[i]:.1f},{bins[i+1]:.1f}]: mean_pred={probs[mask].mean():.3f}, frac_pos={frac_pos:.3f}")

def ex24():
    """PR-AUC"""
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = Pipeline([("sc", StandardScaler()), ("lr", LogisticRegression(max_iter=1000))])
    probs = model.fit(X_tr, y_tr).predict_proba(X_te)[:, 1]
    precision, recall, _ = precision_recall_curve(y_te, probs)
    pr_auc = auc(recall, precision)
    print(f"Ex24 — PR-AUC: {pr_auc:.4f}")

def ex25():
    """F1 at different thresholds"""
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = Pipeline([("sc", StandardScaler()), ("lr", LogisticRegression(max_iter=1000))])
    probs = model.fit(X_tr, y_tr).predict_proba(X_te)[:, 1]
    for t in [0.3, 0.4, 0.5, 0.6, 0.7]:
        f1 = f1_score(y_te, (probs >= t).astype(int))
        print(f"Ex25 — threshold={t}: F1={f1:.4f}")

def ex26():
    """Decision boundary concept (2D data, LogReg vs DT)"""
    X, y = make_moons(n_samples=200, noise=0.2, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for name, model in [("LogReg", LogisticRegression()), ("DTree", DecisionTreeClassifier(max_depth=3, random_state=0))]:
        acc = model.fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex26 — {name} (moons) accuracy: {acc:.4f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """ClassificationComparator class"""
    class ClassificationComparator:
        def __init__(self, models):
            self.models = models
        def compare(self, X_tr, y_tr, X_te, y_te):
            results = {}
            for name, m in self.models.items():
                m.fit(X_tr, y_tr)
                results[name] = accuracy_score(y_te, m.predict(X_te))
            return results

    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    models = {"LR": LogisticRegression(max_iter=500), "KNN": KNeighborsClassifier(), "NB": GaussianNB()}
    comp = ClassificationComparator(models)
    print(f"Ex27 — {comp.compare(X_tr, y_tr, X_te, y_te)}")

def ex28():
    """ThresholdTuner class"""
    class ThresholdTuner:
        def __init__(self, model):
            self.model = model
            self.best_threshold_ = 0.5
        def tune(self, X_val, y_val):
            probs = self.model.predict_proba(X_val)[:, 1]
            best_f1, best_t = 0, 0.5
            for t in np.arange(0.1, 0.9, 0.05):
                f1 = f1_score(y_val, (probs >= t).astype(int), zero_division=0)
                if f1 > best_f1:
                    best_f1, best_t = f1, t
            self.best_threshold_ = best_t
            return best_t, best_f1

    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    pipe = Pipeline([("sc", StandardScaler()), ("lr", LogisticRegression(max_iter=1000))])
    pipe.fit(X_tr, y_tr)
    tuner = ThresholdTuner(pipe)
    best_t, best_f1 = tuner.tune(X_te, y_te)
    print(f"Ex28 — Best threshold: {best_t:.2f}, F1: {best_f1:.4f}")

def ex29():
    """MultiClassEvaluator class"""
    class MultiClassEvaluator:
        def __init__(self, model, class_names):
            self.model = model
            self.class_names = class_names
        def evaluate(self, X, y):
            preds = self.model.predict(X)
            return {
                "accuracy": accuracy_score(y, preds),
                "macro_f1": f1_score(y, preds, average="macro"),
                "weighted_f1": f1_score(y, preds, average="weighted")
            }

    X, y = load_iris(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    model = LogisticRegression(max_iter=500).fit(X_tr, y_tr)
    ev = MultiClassEvaluator(model, load_iris().target_names)
    print(f"Ex29 — {ev.evaluate(X_te, y_te)}")

def ex30():
    """ClassificationPipeline class"""
    class ClassificationPipeline:
        def __init__(self, clf):
            self.pipe_ = Pipeline([
                ("imputer", SimpleImputer()),
                ("scaler", StandardScaler()),
                ("clf", clf)
            ])
        def fit(self, X, y):
            self.pipe_.fit(X, y); return self
        def evaluate(self, X, y):
            preds = self.pipe_.predict(X)
            return accuracy_score(y, preds)

    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    cp = ClassificationPipeline(LogisticRegression(max_iter=1000)).fit(X_tr, y_tr)
    print(f"Ex30 — Pipeline accuracy: {cp.evaluate(X_te, y_te):.4f}")

def ex31():
    """ImbalancedClassifier class (oversample majority with resampling)"""
    class ImbalancedClassifier:
        def __init__(self, clf):
            self.clf = clf
        def fit(self, X, y):
            rng = np.random.default_rng(0)
            classes, counts = np.unique(y, return_counts=True)
            max_c = counts.max()
            X_bal, y_bal = [X], [y]
            for cls, cnt in zip(classes, counts):
                if cnt < max_c:
                    idx = np.where(y == cls)[0]
                    extra = rng.choice(idx, max_c - cnt)
                    X_bal.append(X[extra]); y_bal.append(y[extra])
            X_bal = np.vstack(X_bal); y_bal = np.hstack(y_bal)
            self.clf.fit(X_bal, y_bal); return self
        def predict(self, X):
            return self.clf.predict(X)

    X, y = make_classification(n_samples=300, n_features=5, weights=[0.9, 0.1], random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    clf = ImbalancedClassifier(LogisticRegression(max_iter=500)).fit(X_tr, y_tr)
    f1 = f1_score(y_te, clf.predict(X_te))
    print(f"Ex31 — Imbalanced oversampled F1: {f1:.4f}")

def ex32():
    """FeatureImportanceClassifier class"""
    class FeatureImportanceClassifier:
        def __init__(self, clf):
            self.clf = clf
        def fit(self, X, y):
            self.clf.fit(X, y); return self
        def importance(self):
            if hasattr(self.clf, "coef_"):
                return np.abs(self.clf.coef_[0])
            elif hasattr(self.clf, "feature_importances_"):
                return self.clf.feature_importances_
            return None

    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    fi = FeatureImportanceClassifier(LogisticRegression(max_iter=500)).fit(X, y)
    imp = fi.importance()
    print(f"Ex32 — Feature importances: {np.round(imp, 3)}")

def ex33():
    """ClassifierEnsemble (majority vote)"""
    class ClassifierEnsemble:
        def __init__(self, clfs):
            self.clfs = clfs
        def fit(self, X, y):
            for c in self.clfs: c.fit(X, y)
            return self
        def predict(self, X):
            votes = np.array([c.predict(X) for c in self.clfs])
            return np.apply_along_axis(lambda x: np.bincount(x).argmax(), 0, votes)

    X, y = make_classification(n_samples=200, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    clfs = [LogisticRegression(max_iter=500), KNeighborsClassifier(), GaussianNB()]
    ens = ClassifierEnsemble(clfs).fit(X_tr, y_tr)
    print(f"Ex33 — Ensemble accuracy: {accuracy_score(y_te, ens.predict(X_te)):.4f}")

def ex34():
    """Full classification pipeline (preprocess + classify + evaluate)"""
    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
    pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000, C=1.0))
    ])
    pipe.fit(X_tr, y_tr)
    preds = pipe.predict(X_te)
    print(f"Ex34 — Full pipeline acc={accuracy_score(y_te, preds):.4f}, F1={f1_score(y_te, preds):.4f}")

def ex35():
    """Cross-validated comparison"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    models = {"LR": LogisticRegression(max_iter=500), "KNN": KNeighborsClassifier(), "DT": DecisionTreeClassifier(random_state=0)}
    for name, m in models.items():
        scores = cross_val_score(m, X, y, cv=5)
        print(f"Ex35 — {name} CV acc: {scores.mean():.4f} ± {scores.std():.4f}")

def ex36():
    """Model calibration pipeline"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    base = LinearSVC(max_iter=2000, dual=False)
    cal_pipe = CalibratedClassifierCV(base, cv=3, method="sigmoid")
    cal_pipe.fit(X_tr, y_tr)
    probs = cal_pipe.predict_proba(X_te)[:, 1]
    print(f"Ex36 — Calibrated ROC-AUC: {roc_auc_score(y_te, probs):.4f}")

def ex37():
    """Production classifier class"""
    class ProductionClassifier:
        def __init__(self):
            self.pipeline_ = Pipeline([
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=1000))
            ])
            self.is_fitted_ = False
        def train(self, X, y):
            self.pipeline_.fit(X, y); self.is_fitted_ = True
        def predict(self, X):
            if not self.is_fitted_: raise RuntimeError("Not fitted")
            return self.pipeline_.predict(X)
        def predict_proba(self, X):
            return self.pipeline_.predict_proba(X)
        def evaluate(self, X, y):
            preds = self.predict(X)
            return {"accuracy": accuracy_score(y, preds), "f1": f1_score(y, preds, average="weighted")}

    X, y = load_breast_cancer(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    pc = ProductionClassifier(); pc.train(X_tr, y_tr)
    print(f"Ex37 — Production classifier: {pc.evaluate(X_te, y_te)}")

def ex38():
    """Classification checklist (print)"""
    checklist = [
        "1. EDA: class balance, feature distributions",
        "2. Baseline: majority class accuracy",
        "3. Split: stratified train/val/test",
        "4. Preprocess: scale, impute, encode",
        "5. Evaluate: accuracy, F1, ROC-AUC",
        "6. Handle imbalance: class_weight, resampling",
        "7. Threshold tuning for business objective",
        "8. Calibrate probabilities if needed",
        "9. Cross-validate before final model",
        "10. Final test eval: classification report",
    ]
    print("Ex38 — Classification Checklist:")
    for item in checklist:
        print(f"  {item}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Logistic regression from scratch (numpy gradient descent)"""
    def sigmoid(z):
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

    X, y = make_classification(n_samples=200, n_features=2, random_state=0)
    X = StandardScaler().fit_transform(X)
    Xb = np.c_[np.ones(len(X)), X]
    w = np.zeros(Xb.shape[1])
    for _ in range(1000):
        grad = Xb.T @ (sigmoid(Xb @ w) - y) / len(y)
        w -= 0.1 * grad
    preds = (sigmoid(Xb @ w) >= 0.5).astype(int)
    print(f"Ex39 — LogReg from scratch accuracy: {accuracy_score(y, preds):.4f}")

def ex40():
    """Linear SVM from scratch (hinge loss gradient descent)"""
    X, y = make_classification(n_samples=200, n_features=2, random_state=0)
    X = StandardScaler().fit_transform(X)
    y_pm = np.where(y == 0, -1, 1)
    w = np.zeros(X.shape[1])
    b = 0.0
    lr, lam = 0.01, 0.01
    for _ in range(1000):
        for xi, yi in zip(X, y_pm):
            if yi * (xi @ w + b) < 1:
                w = (1 - lr * lam) * w + lr * yi * xi
                b += lr * yi
            else:
                w = (1 - lr * lam) * w
    preds = np.sign(X @ w + b)
    acc = accuracy_score(y_pm, preds)
    print(f"Ex40 — Linear SVM from scratch accuracy: {acc:.4f}")

def ex41():
    """Gaussian Naive Bayes from scratch"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    classes = np.unique(y_tr)
    params = {}
    for c in classes:
        Xc = X_tr[y_tr == c]
        params[c] = {"mean": Xc.mean(0), "var": Xc.var(0), "prior": len(Xc) / len(y_tr)}
    def log_prob(x, c):
        m, v, p = params[c]["mean"], params[c]["var"], params[c]["prior"]
        return np.sum(-0.5 * np.log(2 * np.pi * v) - (x - m)**2 / (2 * v)) + np.log(p)
    preds = np.array([classes[np.argmax([log_prob(x, c) for c in classes])] for x in X_te])
    print(f"Ex41 — GNB from scratch accuracy: {accuracy_score(y_te, preds):.4f}")

def ex42():
    """Perceptron from scratch"""
    X, y = make_classification(n_samples=200, n_features=2, random_state=0)
    X = StandardScaler().fit_transform(X)
    y_pm = np.where(y == 0, -1, 1)
    w = np.zeros(X.shape[1]); b = 0.0
    for _ in range(50):
        for xi, yi in zip(X, y_pm):
            if yi * (xi @ w + b) <= 0:
                w += yi * xi; b += yi
    preds = np.sign(X @ w + b)
    acc = accuracy_score(y_pm, preds)
    print(f"Ex42 — Perceptron from scratch accuracy: {acc:.4f}")

def ex43():
    """k-NN from scratch"""
    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    def knn_predict(X_tr, y_tr, X_te, k=3):
        preds = []
        for x in X_te:
            dists = np.sum((X_tr - x)**2, axis=1)
            nbrs = y_tr[np.argsort(dists)[:k]]
            preds.append(np.bincount(nbrs).argmax())
        return np.array(preds)
    preds = knn_predict(X_tr, y_tr, X_te, k=3)
    print(f"Ex43 — k-NN from scratch accuracy: {accuracy_score(y_te, preds):.4f}")

def ex44():
    """Neural network classifier (MLPClassifier)"""
    X, y = make_moons(n_samples=300, noise=0.2, random_state=0)
    X_sc = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X_sc, y, test_size=0.2, random_state=0)
    mlp = MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=500, random_state=0).fit(X_tr, y_tr)
    print(f"Ex44 — MLP accuracy: {mlp.score(X_te, y_te):.4f}")

def ex45():
    """Interpretable classifier (decision tree + rules)"""
    from sklearn.tree import export_text
    X, y = load_iris(return_X_y=True)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    tree = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X_tr, y_tr)
    rules = export_text(tree, feature_names=load_iris().feature_names)
    print(f"Ex45 — Decision tree rules (first 5 lines):")
    for line in rules.split("\n")[:5]:
        print(f"  {line}")
    print(f"  accuracy={tree.score(X_te, y_te):.4f}")

def ex46():
    """Conformal prediction concept"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    X_tr, X_cal, X_te, y_tr, y_cal, y_te = (
        X[:150], X[150:225], X[225:], y[:150], y[150:225], y[225:]
    )
    model = LogisticRegression(max_iter=500).fit(X_tr, y_tr)
    cal_probs = model.predict_proba(X_cal)
    scores = 1 - cal_probs[np.arange(len(y_cal)), y_cal]
    q_level = np.quantile(scores, 0.9)
    te_probs = model.predict_proba(X_te)
    pred_sets = [np.where(1 - row >= q_level)[0].tolist() for row in te_probs[:5]]
    print(f"Ex46 — Conformal prediction sets (5 samples): {pred_sets}")

def ex47():
    """Active learning concept"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    labeled_idx = list(range(20))
    pool_idx = list(range(20, 300))
    X_labeled, y_labeled = X[labeled_idx], y[labeled_idx]
    model = LogisticRegression(max_iter=500).fit(X_labeled, y_labeled)
    uncertainties = model.predict_proba(X[pool_idx])
    entropy = -np.sum(uncertainties * np.log(uncertainties + 1e-10), axis=1)
    top5 = np.array(pool_idx)[np.argsort(entropy)[-5:]]
    print(f"Ex47 — Active learning: top-5 uncertain indices: {top5.tolist()}")

def ex48():
    """Transfer learning for classification concept"""
    X_source, y_source = make_classification(n_samples=500, n_features=10, random_state=0)
    X_target, y_target = make_classification(n_samples=50, n_features=10, random_state=1)
    X_target_te, y_target_te = make_classification(n_samples=100, n_features=10, random_state=2)
    base_model = LogisticRegression(max_iter=500).fit(X_source, y_source)
    source_acc = base_model.score(X_target_te, y_target_te)
    fine_tuned = LogisticRegression(max_iter=500, warm_start=True).fit(X_source, y_source)
    fine_tuned.fit(X_target, y_target)
    target_acc = fine_tuned.score(X_target_te, y_target_te)
    print(f"Ex48 — Transfer: source-only acc={source_acc:.4f}, fine-tuned acc={target_acc:.4f}")

def ex49():
    """Fairness-aware classifier concept"""
    rng = np.random.default_rng(0)
    n = 300
    X = rng.standard_normal((n, 4))
    protected = rng.integers(0, 2, n)
    y = (X[:, 0] + 0.5 * protected + rng.standard_normal(n) * 0.5 > 0).astype(int)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    prot_tr, prot_te = protected[:len(X_tr)], protected[len(X_tr):]
    model = LogisticRegression(max_iter=500).fit(X_tr, y_tr)
    preds = model.predict(X_te)
    for g in [0, 1]:
        mask = prot_te == g
        if mask.sum() > 0:
            print(f"Ex49 — Group {g} accuracy: {accuracy_score(y_te[mask], preds[mask]):.4f}")

def ex50():
    """Production classification architecture (print)"""
    architecture = [
        "ProductionClassifier Architecture:",
        "  1. DataValidator — schema checks, missing value detection",
        "  2. FeatureEngineer — encoding, scaling, feature crosses",
        "  3. ModelRegistry — versioned model store (MLflow/W&B)",
        "  4. InferenceService — REST API (FastAPI/Flask)",
        "  5. ThresholdManager — configurable decision threshold",
        "  6. ProbabilityCalibrator — isotonic/Platt scaling",
        "  7. MonitoringService — accuracy, drift, latency alerts",
        "  8. ShadowDeployment — new model parallel shadow scoring",
        "  9. A/B Testing — traffic split, metric comparison",
        " 10. FeedbackLoop — label collection, model retraining",
    ]
    print("Ex50 —")
    for line in architecture:
        print(f"  {line}")


def main():
    print("=" * 60)
    print("Examples 3.2 — Classification Algorithms")
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
