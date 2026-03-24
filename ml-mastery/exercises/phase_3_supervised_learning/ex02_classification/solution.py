# ============================================================
# Solution 3.2 — Classification Algorithms
# ============================================================

import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.metrics import confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split

np.random.seed(42)
X, y = make_classification(n_samples=200, n_features=4, n_classes=2,
                            random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2,
                                                     random_state=42)

from sklearn.datasets import make_classification as mc
X_mc, y_mc = mc(n_samples=200, n_features=4, n_classes=3,
                n_informative=4, n_redundant=0, random_state=42)


# ---------------------------------------------------------------------------
# Solution 1: Logistic Regression from Scratch
# ---------------------------------------------------------------------------

def logistic_regression_scratch(X: np.ndarray, y: np.ndarray,
                                  lr: float = 0.1, epochs: int = 500) -> np.ndarray:
    X_b = np.c_[np.ones(X.shape[0]), X]
    n, p = X_b.shape
    w = np.zeros(p)
    for _ in range(epochs):
        z = X_b @ w
        y_hat = 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        grad = (1 / n) * X_b.T @ (y_hat - y)
        w -= lr * grad
    return w


# ---------------------------------------------------------------------------
# Solution 2: sklearn LogisticRegression
# ---------------------------------------------------------------------------

def sklearn_logistic(X_train, y_train, X_test, y_test):
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    return model, acc


# ---------------------------------------------------------------------------
# Solution 3: KNN from Scratch
# ---------------------------------------------------------------------------

def knn_predict(X_train: np.ndarray, y_train: np.ndarray,
                x_query: np.ndarray, k: int = 3) -> int:
    dists = np.sqrt(np.sum((X_train - x_query) ** 2, axis=1))
    k_idx = np.argsort(dists)[:k]
    k_labels = y_train[k_idx]
    counts = np.bincount(k_labels.astype(int))
    return int(np.argmax(counts))


# ---------------------------------------------------------------------------
# Solution 4: sklearn KNN
# ---------------------------------------------------------------------------

def sklearn_knn(X_train, y_train, X_test, y_test):
    model = KNeighborsClassifier(n_neighbors=5)
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    return model, acc


# ---------------------------------------------------------------------------
# Solution 5: Gaussian Naive Bayes from Scratch
# ---------------------------------------------------------------------------

def naive_bayes_scratch(X_train: np.ndarray, y_train: np.ndarray,
                         X_test: np.ndarray) -> np.ndarray:
    classes = np.unique(y_train)
    n_total = len(y_train)
    log_priors = {}
    means = {}
    variances = {}

    for c in classes:
        X_c = X_train[y_train == c]
        log_priors[c] = np.log(len(X_c) / n_total)
        means[c] = X_c.mean(axis=0)
        variances[c] = X_c.var(axis=0) + 1e-9  # smoothing

    preds = []
    for x in X_test:
        log_posteriors = []
        for c in classes:
            log_p = log_priors[c]
            log_likelihood = -0.5 * np.sum(
                np.log(2 * np.pi * variances[c]) +
                (x - means[c]) ** 2 / variances[c]
            )
            log_posteriors.append(log_p + log_likelihood)
        preds.append(classes[np.argmax(log_posteriors)])
    return np.array(preds)


# ---------------------------------------------------------------------------
# Solution 6: Linear SVM
# ---------------------------------------------------------------------------

def linear_svm(X_train, y_train, X_test, y_test):
    model = SVC(kernel='linear')
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    return model, acc


# ---------------------------------------------------------------------------
# Solution 7: RBF SVM
# ---------------------------------------------------------------------------

def rbf_svm(X_train, y_train, X_test, y_test):
    model = SVC(kernel='rbf', C=1.0, gamma='scale')
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    return model, acc


# ---------------------------------------------------------------------------
# Solution 8: Perceptron from Scratch
# ---------------------------------------------------------------------------

def perceptron_scratch(X: np.ndarray, y: np.ndarray,
                        lr: float = 0.1, epochs: int = 50) -> np.ndarray:
    X_b = np.c_[np.ones(X.shape[0]), X]
    w = np.zeros(X_b.shape[1])
    for _ in range(epochs):
        for i in range(len(X_b)):
            y_hat = 1 if w @ X_b[i] >= 0 else 0
            w += lr * (y[i] - y_hat) * X_b[i]
    return w


# ---------------------------------------------------------------------------
# Solution 9: Multi-class OvR
# ---------------------------------------------------------------------------

def multiclass_ovr(X: np.ndarray, y: np.ndarray) -> float:
    model = LogisticRegression(multi_class='ovr', max_iter=1000)
    model.fit(X, y)
    return model.score(X, y)


# ---------------------------------------------------------------------------
# Solution 10: predict_proba
# ---------------------------------------------------------------------------

def predict_proba_lr(X_train, y_train, X_test) -> np.ndarray:
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)
    return model.predict_proba(X_test)


# ---------------------------------------------------------------------------
# Solution 11: Decision Threshold Analysis
# ---------------------------------------------------------------------------

def threshold_analysis(probs: np.ndarray, y_true: np.ndarray) -> dict:
    results = {}
    for t in [0.3, 0.4, 0.5, 0.6, 0.7]:
        preds = (probs >= t).astype(int)
        acc = float(np.mean(preds == y_true))
        results[t] = round(acc, 4)
    return results


# ---------------------------------------------------------------------------
# Solution 12: Imbalanced Classes
# ---------------------------------------------------------------------------

def imbalanced_classification(X_train, y_train, X_test, y_test):
    model = LogisticRegression(class_weight='balanced', max_iter=1000)
    model.fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    return model, acc


# ---------------------------------------------------------------------------
# Solution 13: Soft vs Hard Voting
# ---------------------------------------------------------------------------

def soft_hard_voting(classifiers: list, X_test, y_test):
    # Hard voting: majority vote
    preds = np.array([clf.predict(X_test) for clf in classifiers])
    hard_votes = np.apply_along_axis(
        lambda x: np.bincount(x.astype(int)).argmax(), axis=0, arr=preds
    )
    hard_acc = float(np.mean(hard_votes == y_test))

    # Soft voting: average probabilities
    probas = np.array([clf.predict_proba(X_test) for clf in classifiers])
    avg_proba = probas.mean(axis=0)
    soft_votes = np.argmax(avg_proba, axis=1)
    soft_acc = float(np.mean(soft_votes == y_test))

    return hard_acc, soft_acc


# ---------------------------------------------------------------------------
# Solution 14: Confusion Matrix Interpretation
# ---------------------------------------------------------------------------

def confusion_matrix_analysis(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)
          if (precision + recall) > 0 else 0.0)
    return {
        'matrix': cm,
        'TP': int(tp), 'TN': int(tn), 'FP': int(fp), 'FN': int(fn),
        'precision': round(precision, 4),
        'recall': round(recall, 4),
        'f1': round(f1, 4),
    }


# ---------------------------------------------------------------------------
# Solution 15: ROC-AUC
# ---------------------------------------------------------------------------

def roc_auc(model, X_test, y_test) -> float:
    probs = model.predict_proba(X_test)[:, 1]
    return float(roc_auc_score(y_test, probs))


def main():
    print("=== Solution 3.2: Classification Algorithms ===\n")

    w = logistic_regression_scratch(X_train, y_train)
    print("Result 1 — LR scratch weights (first 3):", np.round(w[:3], 4))

    model2, acc2 = sklearn_logistic(X_train, y_train, X_test, y_test)
    print("Result 2 — sklearn LR accuracy:", round(acc2, 4))

    pred = knn_predict(X_train, y_train, X_test[0], k=3)
    print("Result 3 — KNN scratch prediction:", pred, "(true:", y_test[0], ")")

    model4, acc4 = sklearn_knn(X_train, y_train, X_test, y_test)
    print("Result 4 — sklearn KNN accuracy:", round(acc4, 4))

    nb_preds = naive_bayes_scratch(X_train, y_train, X_test)
    nb_acc = np.mean(nb_preds == y_test)
    print("Result 5 — NB scratch accuracy:", round(float(nb_acc), 4),
          " | preds (first 5):", nb_preds[:5])

    _, acc6 = linear_svm(X_train, y_train, X_test, y_test)
    print("Result 6 — Linear SVM accuracy:", round(acc6, 4))

    _, acc7 = rbf_svm(X_train, y_train, X_test, y_test)
    print("Result 7 — RBF SVM accuracy:", round(acc7, 4))

    w_perc = perceptron_scratch(X_train, y_train)
    print("Result 8 — Perceptron weights (first 3):", np.round(w_perc[:3], 4))

    acc_mc = multiclass_ovr(X_mc, y_mc)
    print("Result 9 — Multi-class OvR accuracy:", round(acc_mc, 4))

    probs = predict_proba_lr(X_train, y_train, X_test)
    print("Result 10 — Proba shape:", probs.shape,
          " | first row:", np.round(probs[0], 4))

    thresh_results = threshold_analysis(probs[:, 1], y_test)
    print("Result 11 — Threshold analysis:", thresh_results)

    _, acc12 = imbalanced_classification(X_train, y_train, X_test, y_test)
    print("Result 12 — Balanced LR accuracy:", round(acc12, 4))

    clf1 = LogisticRegression(max_iter=1000).fit(X_train, y_train)
    clf2 = KNeighborsClassifier(n_neighbors=5).fit(X_train, y_train)
    clf3 = GaussianNB().fit(X_train, y_train)
    h_acc, s_acc = soft_hard_voting([clf1, clf2, clf3], X_test, y_test)
    print("Result 13 — Hard voting acc:", round(h_acc, 4),
          "| Soft voting acc:", round(s_acc, 4))

    y_pred = clf1.predict(X_test)
    cm_info = confusion_matrix_analysis(y_test, y_pred)
    print("Result 14 — Confusion matrix:\n", cm_info['matrix'])
    print("           F1:", cm_info['f1'])

    auc = roc_auc(clf1, X_test, y_test)
    print("Result 15 — ROC-AUC:", round(auc, 4))


if __name__ == "__main__":
    main()
