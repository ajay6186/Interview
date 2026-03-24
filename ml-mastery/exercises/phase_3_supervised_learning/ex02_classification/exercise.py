# ============================================================
# Exercise 3.2 — Classification Algorithms
# ============================================================
# Topics:
#   • Logistic regression from scratch (gradient descent)
#   • sklearn LogisticRegression, KNN, Naive Bayes, SVM
#   • Perceptron, multi-class (OvR), probability calibration
#   • Decision threshold, imbalanced classes
#   • Soft vs hard voting, confusion matrix, ROC-AUC
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

# Multi-class dataset
from sklearn.datasets import make_classification as mc
X_mc, y_mc = mc(n_samples=200, n_features=4, n_classes=3,
                n_informative=4, n_redundant=0, random_state=42)


# ---------------------------------------------------------------------------
# TODO 1: Logistic Regression from Scratch
# ---------------------------------------------------------------------------
# Implement binary logistic regression using gradient descent.
# Use sigmoid activation: σ(z) = 1 / (1 + exp(-z))
# Use binary cross-entropy loss. Run for `epochs` iterations.
# Return the weight vector w (shape: (n_features+1,)) including bias.
# Add bias by prepending a column of ones to X before training.

def logistic_regression_scratch(X: np.ndarray, y: np.ndarray,
                                  lr: float = 0.1, epochs: int = 500) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: sklearn LogisticRegression
# ---------------------------------------------------------------------------
# Fit sklearn LogisticRegression(max_iter=1000) on (X_train, y_train).
# Return (model, accuracy on X_test).

def sklearn_logistic(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: K-Nearest Neighbors from Scratch
# ---------------------------------------------------------------------------
# Predict the class of a single point x_query given training data X_train, y_train.
# Use Euclidean distance. Classify by majority vote among k neighbors.
# Return the predicted class label (int).

def knn_predict(X_train: np.ndarray, y_train: np.ndarray,
                x_query: np.ndarray, k: int = 3) -> int:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: sklearn KNeighborsClassifier
# ---------------------------------------------------------------------------
# Fit KNeighborsClassifier(n_neighbors=5) on (X_train, y_train).
# Return (model, accuracy on X_test).

def sklearn_knn(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Gaussian Naive Bayes from Scratch
# ---------------------------------------------------------------------------
# Implement Gaussian Naive Bayes:
#   1. Compute prior P(c) and per-class feature mean/variance from X_train, y_train.
#   2. For each test point x, compute log P(c) + Σ log N(x_j; μ_cj, σ²_cj).
#   3. Return predictions as an array of class labels.

def naive_bayes_scratch(X_train: np.ndarray, y_train: np.ndarray,
                         X_test: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: Linear SVM
# ---------------------------------------------------------------------------
# Fit sklearn SVC(kernel='linear') on (X_train, y_train).
# Return (model, accuracy on X_test).

def linear_svm(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: RBF SVM
# ---------------------------------------------------------------------------
# Fit sklearn SVC(kernel='rbf', C=1.0, gamma='scale') on (X_train, y_train).
# Return (model, accuracy on X_test).

def rbf_svm(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Perceptron from Scratch
# ---------------------------------------------------------------------------
# Implement a single-layer perceptron:
#   - Initialize weights to zero (include bias in w[0]).
#   - Update rule: w += lr * (y_i - y_hat_i) * x_i for each misclassified sample.
#   - Activation: step function (predict 1 if w·x >= 0 else 0).
#   - Run for `epochs` passes over the data.
# Return the final weight vector.

def perceptron_scratch(X: np.ndarray, y: np.ndarray,
                        lr: float = 0.1, epochs: int = 50) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Multi-class Classification (OvR)
# ---------------------------------------------------------------------------
# Fit LogisticRegression(multi_class='ovr', max_iter=1000) on (X_mc, y_mc).
# Return accuracy on X_mc.

def multiclass_ovr(X: np.ndarray, y: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Probability Calibration (predict_proba)
# ---------------------------------------------------------------------------
# Fit LogisticRegression on (X_train, y_train).
# Return predicted probabilities for X_test (shape: (n_test, 2)).

def predict_proba_lr(X_train, y_train, X_test) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Decision Threshold Analysis
# ---------------------------------------------------------------------------
# Given predicted probabilities (class-1 column) and true labels,
# evaluate accuracy at thresholds [0.3, 0.4, 0.5, 0.6, 0.7].
# Return a dict: {threshold: accuracy}.

def threshold_analysis(probs: np.ndarray, y_true: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Classification with Imbalanced Classes
# ---------------------------------------------------------------------------
# Fit LogisticRegression(class_weight='balanced', max_iter=1000) on (X_train, y_train).
# Return (model, accuracy on X_test).

def imbalanced_classification(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Soft vs Hard Voting
# ---------------------------------------------------------------------------
# Given three fitted classifiers (list), X_test, and y_test:
#   - Hard voting: majority vote of predicted classes.
#   - Soft voting: average predicted probabilities, then argmax.
# Return (hard_accuracy, soft_accuracy).

def soft_hard_voting(classifiers: list, X_test, y_test):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Confusion Matrix Interpretation
# ---------------------------------------------------------------------------
# Given y_true and y_pred, compute and return a dict with:
#   'matrix', 'TP', 'TN', 'FP', 'FN', 'precision', 'recall', 'f1'

def confusion_matrix_analysis(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: ROC-AUC Score
# ---------------------------------------------------------------------------
# Given a fitted model with predict_proba, X_test, and y_test,
# return the ROC-AUC score (using sklearn roc_auc_score).

def roc_auc(model, X_test, y_test) -> float:
    pass  # TODO: implement


def main():
    print("=== Exercise 3.2: Classification Algorithms ===\n")

    w = logistic_regression_scratch(X_train, y_train)
    print("TODO 1 — LR scratch weights (first 3):", w[:3] if w is not None else None)

    result2 = sklearn_logistic(X_train, y_train, X_test, y_test)
    print("TODO 2 — sklearn LR accuracy:", result2[1] if result2 else None)

    pred = knn_predict(X_train, y_train, X_test[0], k=3)
    print("TODO 3 — KNN scratch prediction:", pred)

    result4 = sklearn_knn(X_train, y_train, X_test, y_test)
    print("TODO 4 — sklearn KNN accuracy:", result4[1] if result4 else None)

    nb_preds = naive_bayes_scratch(X_train, y_train, X_test)
    print("TODO 5 — NB scratch preds (first 5):", nb_preds[:5] if nb_preds is not None else None)

    result6 = linear_svm(X_train, y_train, X_test, y_test)
    print("TODO 6 — Linear SVM accuracy:", result6[1] if result6 else None)

    result7 = rbf_svm(X_train, y_train, X_test, y_test)
    print("TODO 7 — RBF SVM accuracy:", result7[1] if result7 else None)

    w_perc = perceptron_scratch(X_train, y_train)
    print("TODO 8 — Perceptron weights (first 3):", w_perc[:3] if w_perc is not None else None)

    acc_mc = multiclass_ovr(X_mc, y_mc)
    print("TODO 9 — Multi-class OvR accuracy:", acc_mc)

    probs = predict_proba_lr(X_train, y_train, X_test)
    print("TODO 10 — Proba shape:", probs.shape if probs is not None else None)

    thresh_results = threshold_analysis(probs[:, 1] if probs is not None else None, y_test)
    print("TODO 11 — Threshold analysis:", thresh_results)

    result12 = imbalanced_classification(X_train, y_train, X_test, y_test)
    print("TODO 12 — Balanced LR accuracy:", result12[1] if result12 else None)

    clf1 = LogisticRegression(max_iter=1000).fit(X_train, y_train)
    clf2 = KNeighborsClassifier(n_neighbors=5).fit(X_train, y_train)
    clf3 = GaussianNB().fit(X_train, y_train)
    h_acc, s_acc = soft_hard_voting([clf1, clf2, clf3], X_test, y_test) if soft_hard_voting else (None, None)
    print("TODO 13 — Hard voting acc:", h_acc, "| Soft voting acc:", s_acc)

    y_pred = clf1.predict(X_test)
    cm_info = confusion_matrix_analysis(y_test, y_pred)
    print("TODO 14 — CM:", cm_info['matrix'] if cm_info else None)
    print("         F1:", cm_info['f1'] if cm_info else None)

    auc = roc_auc(clf1, X_test, y_test)
    print("TODO 15 — ROC-AUC:", auc)


if __name__ == "__main__":
    main()
