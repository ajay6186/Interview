# ============================================================
# Solution 1.4 — ML Algorithms Deep Dive
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
# TODO 1: Linear Regression from scratch
# ---------------------------------------------------------------------------

class LinearRegressionScratch:
    def __init__(self, learning_rate=0.01, n_iterations=1000):
        self.lr = learning_rate
        self.n_iterations = n_iterations
        self.weights = None
        self.bias = None

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0.0
        for _ in range(self.n_iterations):
            y_pred = X @ self.weights + self.bias
            error  = y_pred - y
            dw = (2 / n_samples) * (X.T @ error)
            db = (2 / n_samples) * np.sum(error)
            self.weights -= self.lr * dw
            self.bias    -= self.lr * db

    def predict(self, X):
        return X @ self.weights + self.bias

# ---------------------------------------------------------------------------
# TODO 2: Logistic Regression from scratch
# ---------------------------------------------------------------------------

class LogisticRegressionScratch:
    def __init__(self, learning_rate=0.1, n_iterations=1000):
        self.lr = learning_rate
        self.n_iterations = n_iterations
        self.weights = None
        self.bias = None

    def _sigmoid(self, z):
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0.0
        for _ in range(self.n_iterations):
            z = X @ self.weights + self.bias
            y_pred = self._sigmoid(z)
            error  = y_pred - y
            dw = (1 / n_samples) * (X.T @ error)
            db = (1 / n_samples) * np.sum(error)
            self.weights -= self.lr * dw
            self.bias    -= self.lr * db

    def predict(self, X):
        z = X @ self.weights + self.bias
        probs = self._sigmoid(z)
        return (probs >= 0.5).astype(int)

# ---------------------------------------------------------------------------
# TODO 3: K-Nearest Neighbors
# ---------------------------------------------------------------------------

def train_knn():
    model = KNeighborsClassifier(n_neighbors=5)
    model.fit(X_clf_train_scaled, y_clf_train)
    acc = accuracy_score(y_clf_test, model.predict(X_clf_test_scaled))
    return {'accuracy': round(acc, 4), 'model': model}

# ---------------------------------------------------------------------------
# TODO 4: Decision Tree
# ---------------------------------------------------------------------------

def train_decision_tree():
    model = DecisionTreeClassifier(max_depth=4, random_state=42)
    model.fit(X_clf_train, y_clf_train)
    acc = accuracy_score(y_clf_test, model.predict(X_clf_test))
    return {
        'accuracy': round(acc, 4),
        'feature_importances': np.round(model.feature_importances_, 4),
    }

# ---------------------------------------------------------------------------
# TODO 5: Random Forest vs Decision Tree
# ---------------------------------------------------------------------------

def train_random_forest():
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_clf_train, y_clf_train)
    rf_acc = accuracy_score(y_clf_test, rf.predict(X_clf_test))

    dt = DecisionTreeClassifier(max_depth=4, random_state=42)
    dt.fit(X_clf_train, y_clf_train)
    dt_acc = accuracy_score(y_clf_test, dt.predict(X_clf_test))

    return {'rf_accuracy': round(rf_acc, 4), 'dt_accuracy': round(dt_acc, 4)}

# ---------------------------------------------------------------------------
# TODO 6: K-Means from scratch
# ---------------------------------------------------------------------------

def kmeans_scratch(X, k=4, n_iterations=100):
    np.random.seed(42)
    idx = np.random.choice(len(X), k, replace=False)
    centroids = X[idx].copy()

    labels = np.zeros(len(X), dtype=int)
    for _ in range(n_iterations):
        # Assignment step
        dists = np.linalg.norm(X[:, np.newaxis] - centroids[np.newaxis], axis=2)
        labels = np.argmin(dists, axis=1)
        # Update step
        new_centroids = np.array([
            X[labels == i].mean(axis=0) if np.any(labels == i) else centroids[i]
            for i in range(k)
        ])
        if np.allclose(centroids, new_centroids):
            break
        centroids = new_centroids

    return labels, centroids

# ---------------------------------------------------------------------------
# TODO 7: KMeans elbow method
# ---------------------------------------------------------------------------

def kmeans_elbow():
    results = {}
    for k in range(1, 7):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_cluster)
        results[k] = round(km.inertia_, 2)
    return results

# ---------------------------------------------------------------------------
# TODO 8: PCA dimensionality reduction
# ---------------------------------------------------------------------------

def apply_pca():
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_clf)
    return {
        'explained_variance_ratio': np.round(pca.explained_variance_ratio_, 4).tolist(),
        'X_pca_shape': X_pca.shape,
    }

# ---------------------------------------------------------------------------
# TODO 9: SVM (linear and RBF)
# ---------------------------------------------------------------------------

def train_svm():
    svm_linear = SVC(kernel='linear', random_state=42)
    svm_linear.fit(X_clf_train_scaled, y_clf_train)
    linear_acc = accuracy_score(y_clf_test, svm_linear.predict(X_clf_test_scaled))

    svm_rbf = SVC(kernel='rbf', random_state=42)
    svm_rbf.fit(X_clf_train_scaled, y_clf_train)
    rbf_acc = accuracy_score(y_clf_test, svm_rbf.predict(X_clf_test_scaled))

    return {'linear_acc': round(linear_acc, 4), 'rbf_acc': round(rbf_acc, 4)}

# ---------------------------------------------------------------------------
# TODO 10: Gaussian Naive Bayes
# ---------------------------------------------------------------------------

def train_naive_bayes():
    model = GaussianNB()
    model.fit(X_clf_train, y_clf_train)
    acc = accuracy_score(y_clf_test, model.predict(X_clf_test))
    return {
        'accuracy': round(acc, 4),
        'class_priors': np.round(model.class_prior_, 4).tolist(),
    }

# ---------------------------------------------------------------------------
# TODO 11: Gradient Boosting with n_estimators tuning
# ---------------------------------------------------------------------------

def train_gradient_boosting():
    results = {}
    for n in [50, 100, 200]:
        gb = GradientBoostingClassifier(
            n_estimators=n, learning_rate=0.1, max_depth=3, random_state=42
        )
        gb.fit(X_clf_train, y_clf_train)
        acc = accuracy_score(y_clf_test, gb.predict(X_clf_test))
        results[n] = round(acc, 4)
    return results

# ---------------------------------------------------------------------------
# TODO 12: KNN from scratch
# ---------------------------------------------------------------------------

def knn_predict(X_train, y_train, X_test, k=3):
    predictions = []
    for test_point in X_test:
        dists = np.linalg.norm(X_train - test_point, axis=1)
        k_idx = np.argsort(dists)[:k]
        k_labels = y_train[k_idx]
        # Majority vote
        values, counts = np.unique(k_labels, return_counts=True)
        predictions.append(values[np.argmax(counts)])
    return np.array(predictions)

# ---------------------------------------------------------------------------
# TODO 13: Decision Stump from scratch
# ---------------------------------------------------------------------------

class DecisionStump:
    def __init__(self):
        self.feature_idx = None
        self.threshold = None
        self.left_label = None
        self.right_label = None

    def _gini(self, y):
        if len(y) == 0:
            return 0.0
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return 1.0 - np.sum(probs ** 2)

    def fit(self, X, y):
        n_samples, n_features = X.shape
        best_gini = float('inf')

        for f in range(n_features):
            thresholds = np.unique(X[:, f])
            for thresh in thresholds:
                left  = y[X[:, f] <= thresh]
                right = y[X[:, f] >  thresh]
                if len(left) == 0 or len(right) == 0:
                    continue
                weighted_gini = (
                    len(left)  / n_samples * self._gini(left) +
                    len(right) / n_samples * self._gini(right)
                )
                if weighted_gini < best_gini:
                    best_gini = weighted_gini
                    self.feature_idx = f
                    self.threshold   = thresh
                    # Most common label in each split
                    vals_l, cnt_l = np.unique(left,  return_counts=True)
                    vals_r, cnt_r = np.unique(right, return_counts=True)
                    self.left_label  = vals_l[np.argmax(cnt_l)]
                    self.right_label = vals_r[np.argmax(cnt_r)]

    def predict(self, X):
        col = X[:, self.feature_idx]
        return np.where(col <= self.threshold, self.left_label, self.right_label)

# ---------------------------------------------------------------------------
# TODO 14: Compare all classifiers
# ---------------------------------------------------------------------------

def compare_all_classifiers():
    models = {
        'KNN(k=5)':            KNeighborsClassifier(n_neighbors=5),
        'DecisionTree(d=4)':   DecisionTreeClassifier(max_depth=4, random_state=42),
        'RandomForest(n=100)': RandomForestClassifier(n_estimators=100, random_state=42),
        'SVC(rbf)':            SVC(kernel='rbf', random_state=42),
        'GaussianNB':          GaussianNB(),
        'GradientBoosting':    GradientBoostingClassifier(n_estimators=100, random_state=42),
    }
    results = {}
    for name, model in models.items():
        # Use scaled data for distance-based models
        if name in ('KNN(k=5)', 'SVC(rbf)'):
            model.fit(X_clf_train_scaled, y_clf_train)
            acc = accuracy_score(y_clf_test, model.predict(X_clf_test_scaled))
        else:
            model.fit(X_clf_train, y_clf_train)
            acc = accuracy_score(y_clf_test, model.predict(X_clf_test))
        results[name] = round(acc, 4)
    return results

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 1.4: ML Algorithms Deep Dive ===\n")

    # Result 1 — Linear Regression scratch
    lr_scratch = LinearRegressionScratch(learning_rate=0.01, n_iterations=1000)
    lr_scratch.fit(X_reg_train, y_reg_train)
    preds = lr_scratch.predict(X_reg_test)
    print("Result 1  — Linear Regression (scratch) R²:", round(r2_score(y_reg_test, preds), 4))

    # Result 2 — Logistic Regression scratch
    log_scratch = LogisticRegressionScratch(learning_rate=0.1, n_iterations=1000)
    log_scratch.fit(X_clf_train_scaled, y_clf_train)
    log_preds = log_scratch.predict(X_clf_test_scaled)
    print("Result 2  — Logistic Regression (scratch) acc:", round(accuracy_score(y_clf_test, log_preds), 4))

    print("Result 3  — KNN:", train_knn())
    print("Result 4  — Decision Tree:", train_decision_tree())
    print("Result 5  — Random Forest vs DT:", train_random_forest())

    labels, centroids = kmeans_scratch(X_cluster)
    print("Result 6  — KMeans scratch labels (unique):", np.unique(labels))
    print("Result 7  — KMeans elbow inertias:", kmeans_elbow())
    print("Result 8  — PCA:", apply_pca())
    print("Result 9  — SVM:", train_svm())
    print("Result 10 — Naive Bayes:", train_naive_bayes())
    print("Result 11 — Gradient Boosting:", train_gradient_boosting())

    knn_preds = knn_predict(X_clf_train_scaled, y_clf_train, X_clf_test_scaled, k=3)
    print("Result 12 — KNN scratch acc:", round(accuracy_score(y_clf_test, knn_preds), 4))

    stump = DecisionStump()
    stump.fit(X_clf_train, y_clf_train)
    stump_preds = stump.predict(X_clf_test)
    print("Result 13 — Decision Stump acc:", round(accuracy_score(y_clf_test, stump_preds), 4))

    print("Result 14 — All classifiers:", compare_all_classifiers())

if __name__ == "__main__":
    main()
