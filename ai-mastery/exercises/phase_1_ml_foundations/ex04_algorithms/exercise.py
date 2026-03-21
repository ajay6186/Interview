# ============================================================
# Exercise 1.4 — ML Algorithms Deep Dive
# ============================================================
# Topics:
#   • Linear Regression from scratch (gradient descent)
#   • Logistic Regression from scratch (sigmoid + gradient descent)
#   • K-Nearest Neighbors
#   • Decision Tree
#   • Random Forest (ensemble)
#   • K-Means Clustering
#   • PCA (dimensionality reduction)
#   • Support Vector Machine
#   • Naive Bayes
#   • Gradient Boosting
# ============================================================

import numpy as np
import pandas as pd
from sklearn.datasets import make_regression, make_classification, make_blobs
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_squared_error, r2_score, accuracy_score, classification_report
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB

# ---------------------------------------------------------------------------
# Shared sample data
# ---------------------------------------------------------------------------
np.random.seed(42)

X_reg, y_reg = make_regression(n_samples=200, n_features=3, noise=10, random_state=42)
X_reg_train, X_reg_test, y_reg_train, y_reg_test = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

X_clf, y_clf = make_classification(
    n_samples=300, n_features=6, n_informative=4,
    n_redundant=1, random_state=42
)
X_clf_train, X_clf_test, y_clf_train, y_clf_test = train_test_split(
    X_clf, y_clf, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_clf_train_scaled = scaler.fit_transform(X_clf_train)
X_clf_test_scaled  = scaler.transform(X_clf_test)

X_cluster, _ = make_blobs(n_samples=300, centers=4, cluster_std=1.2, random_state=42)

# ---------------------------------------------------------------------------
# TODO 1: Linear Regression from scratch using gradient descent
# ---------------------------------------------------------------------------
# Implement a LinearRegressionScratch class with fit(X, y) and predict(X).
# Use gradient descent: w -= lr * gradient, b -= lr * grad_b
# Parameters: learning_rate=0.01, n_iterations=1000
# Expected: class with fit() and predict() methods

class LinearRegressionScratch:
    def __init__(self, learning_rate=0.01, n_iterations=1000):
        self.lr = learning_rate
        self.n_iterations = n_iterations
        self.weights = None
        self.bias = None

    def fit(self, X, y):
        pass  # TODO: implement gradient descent

    def predict(self, X):
        pass  # TODO: implement dot product + bias

# ---------------------------------------------------------------------------
# TODO 2: Logistic Regression from scratch
# ---------------------------------------------------------------------------
# Implement LogisticRegressionScratch with fit(X, y) and predict(X).
# Use sigmoid: 1 / (1 + exp(-z)), binary cross-entropy gradient.
# Return predicted class labels (0 or 1) from predict().
# Expected: class with fit() and predict() methods

class LogisticRegressionScratch:
    def __init__(self, learning_rate=0.1, n_iterations=1000):
        self.lr = learning_rate
        self.n_iterations = n_iterations
        self.weights = None
        self.bias = None

    def _sigmoid(self, z):
        pass  # TODO: implement

    def fit(self, X, y):
        pass  # TODO: implement gradient descent on binary cross-entropy

    def predict(self, X):
        pass  # TODO: return 0/1 predictions using threshold 0.5

# ---------------------------------------------------------------------------
# TODO 3: Train and evaluate a K-Nearest Neighbors classifier
# ---------------------------------------------------------------------------
# Use sklearn's KNeighborsClassifier with k=5 on scaled clf data.
# Return a dict {'accuracy': ..., 'model': ...}
# Expected: {'accuracy': ~0.85, 'model': <KNeighborsClassifier>}

def train_knn():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 4: Train a Decision Tree and inspect feature importances
# ---------------------------------------------------------------------------
# Train DecisionTreeClassifier(max_depth=4, random_state=42) on clf data.
# Return a dict {'accuracy': ..., 'feature_importances': ...}
# Expected: {'accuracy': ~0.83, 'feature_importances': array of floats}

def train_decision_tree():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 5: Train a Random Forest and compare to a single Decision Tree
# ---------------------------------------------------------------------------
# Train RandomForestClassifier(n_estimators=100, random_state=42).
# Return a dict {'rf_accuracy': ..., 'dt_accuracy': ...}
# Expected: rf_accuracy > dt_accuracy in most cases

def train_random_forest():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 6: K-Means clustering from scratch (manual implementation)
# ---------------------------------------------------------------------------
# Implement k-means: randomly initialise k centroids, then iterate:
#   1. Assign each point to nearest centroid (Euclidean distance)
#   2. Update centroids to mean of assigned points
# Run for n_iterations=100, k=4, on X_cluster.
# Return (labels, centroids) — labels: array of shape (n_samples,)
# Expected: labels array with values 0-3, centroids array (4, 2)

def kmeans_scratch(X, k=4, n_iterations=100):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Use sklearn KMeans and compute inertia for k=1..6 (elbow method)
# ---------------------------------------------------------------------------
# Fit KMeans for k in range(1, 7) on X_cluster.
# Return a dict {k: inertia} to identify the elbow.
# Expected: inertia decreases sharply then flattens around k=4

def kmeans_elbow():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 8: PCA — reduce dimensionality and measure variance explained
# ---------------------------------------------------------------------------
# Apply PCA to X_clf (6 features → 2 components).
# Return a dict {'explained_variance_ratio': ..., 'X_pca_shape': ...}
# Expected: explained_variance_ratio sums to < 1.0, X_pca_shape = (300, 2)

def apply_pca():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 9: Train an SVM classifier (linear and RBF kernels)
# ---------------------------------------------------------------------------
# Train SVC(kernel='linear') and SVC(kernel='rbf') on scaled clf data.
# Return a dict {'linear_acc': ..., 'rbf_acc': ...}
# Expected: both accuracies > 0.80

def train_svm():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 10: Train a Gaussian Naive Bayes classifier
# ---------------------------------------------------------------------------
# Use GaussianNB on clf data (unscaled is fine).
# Return a dict {'accuracy': ..., 'class_priors': ...}
# Expected: accuracy ~0.80, class_priors is an array summing to 1.0

def train_naive_bayes():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 11: Train a Gradient Boosting classifier and tune n_estimators
# ---------------------------------------------------------------------------
# Try n_estimators in [50, 100, 200]. For each, train GradientBoostingClassifier
# (learning_rate=0.1, max_depth=3, random_state=42) on clf data.
# Return a dict {n_estimators: accuracy}.
# Expected: accuracy generally increases then plateaus

def train_gradient_boosting():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 12: Implement KNN from scratch (no sklearn)
# ---------------------------------------------------------------------------
# Write knn_predict(X_train, y_train, X_test, k=3).
# For each test point: find k nearest neighbours by Euclidean distance,
# return majority vote label.
# Return predicted labels array.
# Expected: array of 0/1 labels with accuracy comparable to sklearn KNN

def knn_predict(X_train, y_train, X_test, k=3):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 13: Implement a Decision Stump (1-level decision tree) from scratch
# ---------------------------------------------------------------------------
# A decision stump splits on the single feature and threshold that
# minimises Gini impurity across both resulting nodes.
# Implement DecisionStump with fit(X, y) and predict(X).
# Expected: class producing 0/1 predictions with accuracy > 0.5

class DecisionStump:
    def __init__(self):
        self.feature_idx = None
        self.threshold = None
        self.left_label = None
        self.right_label = None

    def _gini(self, y):
        pass  # TODO: implement Gini impurity

    def fit(self, X, y):
        pass  # TODO: exhaustive search over features and thresholds

    def predict(self, X):
        pass  # TODO: apply learned split

# ---------------------------------------------------------------------------
# TODO 14: Compare all classifiers side by side
# ---------------------------------------------------------------------------
# Train KNN(k=5), DecisionTree(max_depth=4), RandomForest(n=100),
# SVC(rbf), GaussianNB, GradientBoosting(n=100) on scaled clf data.
# Return a dict {model_name: test_accuracy}.
# Expected: dict with 6 entries, all accuracies > 0.75

def compare_all_classifiers():
    pass  # TODO: implement

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 1.4: ML Algorithms Deep Dive ===\n")

    # TODO 1 — Linear Regression scratch
    lr_scratch = LinearRegressionScratch(learning_rate=0.01, n_iterations=1000)
    lr_scratch.fit(X_reg_train, y_reg_train)
    preds = lr_scratch.predict(X_reg_test)
    print("TODO 1  — Linear Regression (scratch) R²:", r2_score(y_reg_test, preds) if preds is not None else None)

    # TODO 2 — Logistic Regression scratch
    log_scratch = LogisticRegressionScratch(learning_rate=0.1, n_iterations=1000)
    log_scratch.fit(X_clf_train_scaled, y_clf_train)
    log_preds = log_scratch.predict(X_clf_test_scaled)
    print("TODO 2  — Logistic Regression (scratch) acc:", accuracy_score(y_clf_test, log_preds) if log_preds is not None else None)

    print("TODO 3  — KNN:", train_knn())
    print("TODO 4  — Decision Tree:", train_decision_tree())
    print("TODO 5  — Random Forest vs DT:", train_random_forest())

    labels, centroids = kmeans_scratch(X_cluster) if kmeans_scratch(X_cluster) is not None else (None, None)
    print("TODO 6  — KMeans scratch labels (unique):", np.unique(labels) if labels is not None else None)
    print("TODO 7  — KMeans elbow inertias:", kmeans_elbow())
    print("TODO 8  — PCA:", apply_pca())
    print("TODO 9  — SVM:", train_svm())
    print("TODO 10 — Naive Bayes:", train_naive_bayes())
    print("TODO 11 — Gradient Boosting:", train_gradient_boosting())

    knn_preds = knn_predict(X_clf_train_scaled, y_clf_train, X_clf_test_scaled, k=3)
    print("TODO 12 — KNN scratch acc:", accuracy_score(y_clf_test, knn_preds) if knn_preds is not None else None)

    stump = DecisionStump()
    stump.fit(X_clf_train, y_clf_train)
    stump_preds = stump.predict(X_clf_test)
    print("TODO 13 — Decision Stump acc:", accuracy_score(y_clf_test, stump_preds) if stump_preds is not None else None)

    print("TODO 14 — All classifiers:", compare_all_classifiers())

if __name__ == "__main__":
    main()
