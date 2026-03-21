# ============================================================
# Examples 1.4 — ML Algorithms Deep Dive (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Linear regression normal equation"""
    X = np.array([[1,1],[1,2],[1,3],[1,4]], dtype=float)   # with bias column
    y = np.array([2.0, 4.0, 5.0, 4.0])
    theta = np.linalg.pinv(X.T @ X) @ X.T @ y
    print(f"Ex01 — normal equation: bias={theta[0]:.3f}, coef={theta[1]:.3f}")

def ex02():
    """Gradient descent single step"""
    X = np.array([[1.0, 2.0], [1.0, 3.0], [1.0, 4.0]])
    y = np.array([5.0, 7.0, 9.0])
    theta = np.zeros(2)
    lr = 0.01
    grad = X.T @ (X @ theta - y) / len(y)
    theta_new = theta - lr * grad
    print(f"Ex02 — GD step: theta {theta} → {theta_new.round(4)}")

def ex03():
    """Sigmoid function"""
    z = np.array([-5, -1, 0, 1, 5])
    sigma = 1 / (1 + np.exp(-z))
    print("Ex03 — sigmoid:", sigma.round(4))

def ex04():
    """Logistic regression prediction (manual)"""
    theta = np.array([0.5, -0.3, 1.2])
    x = np.array([1.0, 2.0, -1.0])    # includes bias
    logit = theta @ x
    prob = 1 / (1 + np.exp(-logit))
    label = int(prob >= 0.5)
    print(f"Ex04 — logistic pred: logit={logit:.3f}, prob={prob:.3f}, label={label}")

def ex05():
    """Euclidean distance"""
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 6.0, 3.0])
    dist = np.sqrt(np.sum((a - b) ** 2))
    print(f"Ex05 — Euclidean distance: {dist:.4f} (np.linalg.norm: {np.linalg.norm(a-b):.4f})")

def ex06():
    """Manhattan distance"""
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 6.0, 3.0])
    dist = np.sum(np.abs(a - b))
    print(f"Ex06 — Manhattan distance: {dist:.4f}")

def ex07():
    """K-nearest neighbor (manual 1-NN)"""
    X_train = np.array([[1,2],[3,4],[5,1],[2,5]], dtype=float)
    y_train = np.array([0, 1, 0, 1])
    x_query = np.array([2.5, 3.0])
    dists = np.linalg.norm(X_train - x_query, axis=1)
    nn_idx = np.argmin(dists)
    print(f"Ex07 — 1-NN: nearest={nn_idx} (dist={dists[nn_idx]:.3f}), label={y_train[nn_idx]}")

def ex08():
    """Entropy calculation"""
    def entropy(probs):
        probs = np.array(probs)
        probs = probs[probs > 0]
        return -np.sum(probs * np.log2(probs))
    print(f"Ex08 — entropy pure=[1,0]: {entropy([1,0]):.4f}")
    print(f"       entropy mixed=[0.5,0.5]: {entropy([0.5,0.5]):.4f}")
    print(f"       entropy 3-class=[1/3,1/3,1/3]: {entropy([1/3,1/3,1/3]):.4f}")

def ex09():
    """Gini impurity"""
    def gini(probs):
        return 1 - sum(p**2 for p in probs)
    print(f"Ex09 — gini pure=[1,0]: {gini([1,0]):.4f}")
    print(f"       gini mixed=[0.5,0.5]: {gini([0.5,0.5]):.4f}")
    print(f"       gini 3-class uniform: {gini([1/3,1/3,1/3]):.4f}")

def ex10():
    """Information gain"""
    def entropy(probs):
        probs = np.array([p for p in probs if p > 0])
        return -np.sum(probs * np.log2(probs))
    # Parent: 10 pos, 10 neg
    H_parent = entropy([0.5, 0.5])
    # Split: left 6 pos 2 neg, right 4 pos 8 neg
    H_left  = entropy([6/8, 2/8])
    H_right = entropy([4/12, 8/12])
    IG = H_parent - (8/20) * H_left - (12/20) * H_right
    print(f"Ex10 — information gain: H_parent={H_parent:.4f}, IG={IG:.4f}")

def ex11():
    """Dot product for cosine similarity"""
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([2.0, 4.0, 6.0])
    cos_sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    print(f"Ex11 — cosine similarity: {cos_sim:.4f} (parallel vectors → 1.0)")

def ex12():
    """Softmax function"""
    def softmax(z):
        e = np.exp(z - z.max())   # numerically stable
        return e / e.sum()
    logits = np.array([2.0, 1.0, 0.1])
    probs = softmax(logits)
    print(f"Ex12 — softmax: {probs.round(4)} | sum={probs.sum():.4f}")

def ex13():
    """Cross-entropy loss"""
    def cross_entropy(y_true, y_pred_prob):
        eps = 1e-15
        y_pred_prob = np.clip(y_pred_prob, eps, 1 - eps)
        return -np.mean(y_true * np.log(y_pred_prob) + (1 - y_true) * np.log(1 - y_pred_prob))
    y_true = np.array([1, 0, 1, 1, 0])
    y_good = np.array([0.9, 0.1, 0.8, 0.95, 0.05])
    y_bad  = np.array([0.6, 0.4, 0.6, 0.6,  0.4])
    print(f"Ex13 — cross-entropy: good preds={cross_entropy(y_true,y_good):.4f} | "
          f"bad preds={cross_entropy(y_true,y_bad):.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Gradient descent from scratch (full)"""
    rng = np.random.default_rng(0)
    X = rng.random((100, 2))
    y = 3 * X[:, 0] + 2 * X[:, 1] + rng.random(100) * 0.1
    theta = np.zeros(2)
    lr, epochs = 0.1, 300
    for _ in range(epochs):
        grad = -2 * X.T @ (y - X @ theta) / len(y)
        theta -= lr * grad
    print(f"Ex14 — GD from scratch: theta={theta.round(4)} (expected ≈ [3, 2])")

def ex15():
    """Logistic regression from scratch"""
    rng = np.random.default_rng(1)
    X = rng.random((100, 2))
    y = (X[:, 0] + X[:, 1] > 1.0).astype(float)
    X_b = np.c_[np.ones(100), X]
    theta = np.zeros(3)
    lr = 0.5
    for _ in range(500):
        sigma = 1 / (1 + np.exp(-X_b @ theta))
        theta -= lr * X_b.T @ (sigma - y) / len(y)
    pred = (1 / (1 + np.exp(-X_b @ theta)) >= 0.5).astype(int)
    acc = (pred == y).mean()
    print(f"Ex15 — logistic regression scratch: accuracy={acc:.3f}, theta={theta.round(3)}")

def ex16():
    """Decision stump from scratch"""
    X = np.array([2, 1, 4, 3, 6, 5], dtype=float)
    y = np.array([0, 0, 1, 0, 1, 1])
    best_thr, best_err = None, 1.0
    for thr in np.unique(X):
        for direction in [1, -1]:
            pred = ((X >= thr).astype(int) if direction == 1
                    else (X < thr).astype(int))
            err = (pred != y).mean()
            if err < best_err:
                best_err, best_thr = err, thr
    print(f"Ex16 — decision stump: threshold={best_thr}, error={best_err:.3f}")

def ex17():
    """K-means single iteration"""
    rng = np.random.default_rng(0)
    X = np.vstack([rng.random((10, 2)), rng.random((10, 2)) + 3])
    centroids = X[[0, 10]]   # initial centroids
    dists = np.linalg.norm(X[:, None, :] - centroids[None, :, :], axis=2)
    labels = np.argmin(dists, axis=1)
    new_centroids = np.array([X[labels == k].mean(axis=0) for k in range(2)])
    print(f"Ex17 — k-means 1 iter: labels={labels} | new centroids:\n{new_centroids.round(3)}")

def ex18():
    """PCA step by step"""
    rng = np.random.default_rng(5)
    X = rng.random((20, 4))
    X_c = X - X.mean(axis=0)
    cov = X_c.T @ X_c / (len(X) - 1)
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues, eigenvectors = eigenvalues[idx], eigenvectors[:, idx]
    X_pca = X_c @ eigenvectors[:, :2]
    explained = eigenvalues[:2] / eigenvalues.sum()
    print(f"Ex18 — PCA from scratch: explained var {explained.round(3)} | "
          f"projected shape {X_pca.shape}")

def ex19():
    """Naive Bayes calculation"""
    # P(spam|word) ∝ P(word|spam) * P(spam)
    p_spam = 0.3
    p_ham  = 0.7
    # P(word|class) for two words
    p_w1_spam, p_w1_ham = 0.8, 0.1
    p_w2_spam, p_w2_ham = 0.7, 0.2
    score_spam = np.log(p_spam) + np.log(p_w1_spam) + np.log(p_w2_spam)
    score_ham  = np.log(p_ham)  + np.log(p_w1_ham)  + np.log(p_w2_ham)
    label = "spam" if score_spam > score_ham else "ham"
    print(f"Ex19 — Naive Bayes: log score spam={score_spam:.3f}, ham={score_ham:.3f} → {label}")

def ex20():
    """SVM margin concept"""
    # Support vectors at (1,1), (2,2) for class +1; (1,2), (2,1) for class -1
    sv_pos = np.array([[1, 1], [2, 2]], dtype=float)
    sv_neg = np.array([[1, 2], [2, 1]], dtype=float)
    # Decision boundary w·x + b = 0, w=(0,1) simplified
    w = np.array([0.0, 1.0])
    b = -1.5
    margin = 2 / np.linalg.norm(w)
    print(f"Ex20 — SVM margin = {margin:.3f}")
    for x in sv_pos:
        print(f"       sv_pos {x}: w·x+b = {w@x+b:.1f} (should be ~+1)")
    for x in sv_neg:
        print(f"       sv_neg {x}: w·x+b = {w@x+b:.1f} (should be ~-1)")

def ex21():
    """Perceptron algorithm"""
    X = np.array([[1,0],[0,1],[1,1],[0,0]], dtype=float)
    y = np.array([1, 1, 1, -1])        # OR gate (almost)
    w = np.zeros(2); b = 0.0
    lr = 0.1
    for _ in range(50):
        for xi, yi in zip(X, y):
            if yi * (w @ xi + b) <= 0:
                w += lr * yi * xi
                b += lr * yi
    preds = np.sign(X @ w + b)
    print(f"Ex21 — Perceptron: w={w.round(3)}, b={b:.3f}, preds={preds.astype(int)}, true={y}")

def ex22():
    """AdaBoost concept (compute weights after weak learner)"""
    y = np.array([1, 1, -1, -1, 1])
    pred = np.array([1, -1, -1, -1, 1])   # weak learner
    n = len(y)
    w = np.ones(n) / n
    correct = (pred == y)
    err = w[~correct].sum()
    alpha = 0.5 * np.log((1 - err) / max(err, 1e-10))
    w_new = w * np.exp(-alpha * y * pred)
    w_new /= w_new.sum()
    print(f"Ex22 — AdaBoost: error={err:.3f}, alpha={alpha:.3f}")
    print(f"       updated weights: {w_new.round(4)}")

def ex23():
    """Bagging (bootstrap sampling)"""
    rng = np.random.default_rng(7)
    X = rng.random((20, 2))
    y = (X[:, 0] > 0.5).astype(int)
    from sklearn.tree import DecisionTreeClassifier
    preds = []
    for _ in range(10):
        idx = rng.integers(0, 20, 20)
        tree = DecisionTreeClassifier(max_depth=2, random_state=0)
        tree.fit(X[idx], y[idx])
        preds.append(tree.predict(X))
    ensemble = np.array(preds).mean(axis=0).round().astype(int)
    single   = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X, y).predict(X)
    print(f"Ex23 — bagging: ensemble acc={( ensemble==y).mean():.3f} | "
          f"single tree acc={(single==y).mean():.3f}")

def ex24():
    """Feature scaling effect on algorithms"""
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=150, n_features=4, random_state=0)
    X[:, 0] *= 1000     # artificially scale up one feature
    from sklearn.model_selection import cross_val_score
    raw_score  = cross_val_score(KNeighborsClassifier(5), X, y, cv=5).mean()
    sc_score   = cross_val_score(
        KNeighborsClassifier(5), StandardScaler().fit_transform(X), y, cv=5).mean()
    print(f"Ex24 — scaling effect on KNN: raw={raw_score:.3f} | scaled={sc_score:.3f}")

def ex25():
    """Regularization: L1 vs L2 effect on coefficients"""
    from sklearn.linear_model import Ridge, Lasso
    from sklearn.datasets import make_regression
    X, y = make_regression(n_samples=100, n_features=10, n_informative=3, noise=5, random_state=0)
    ridge = Ridge(alpha=10).fit(X, y)
    lasso = Lasso(alpha=1.0).fit(X, y)
    print(f"Ex25 — L2 (Ridge) coefs (all nonzero): {(ridge.coef_ != 0).sum()}/10 nonzero")
    print(f"       L1 (Lasso) coefs (sparse):       {(lasso.coef_ != 0).sum()}/10 nonzero")
    print(f"       Lasso coefs: {lasso.coef_.round(3)}")

def ex26():
    """Learning rate effect on convergence"""
    rng = np.random.default_rng(0)
    X = rng.random((50, 1))
    y = 3 * X.ravel() + 1
    X_b = np.c_[np.ones(50), X]
    print("Ex26 — learning rate effect:")
    for lr in [0.001, 0.01, 0.1, 1.0]:
        theta = np.zeros(2)
        for _ in range(200):
            theta -= lr * X_b.T @ (X_b @ theta - y) / 50
        mse = np.mean((X_b @ theta - y) ** 2)
        print(f"       lr={lr:.3f}: final MSE={mse:.6f}, theta={theta.round(3)}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Full linear regression class from scratch"""
    class LinearRegressionScratch:
        def fit(self, X, y):
            X_b = np.c_[np.ones(len(X)), X]
            self.theta_ = np.linalg.pinv(X_b.T @ X_b) @ X_b.T @ y
            return self
        def predict(self, X):
            return np.c_[np.ones(len(X)), X] @ self.theta_
        def score(self, X, y):
            y_pred = self.predict(X)
            ss_res = np.sum((y - y_pred) ** 2)
            ss_tot = np.sum((y - y.mean()) ** 2)
            return 1 - ss_res / ss_tot
    rng = np.random.default_rng(0)
    X = rng.random((100, 2))
    y = 2 * X[:, 0] + 3 * X[:, 1] + rng.random(100) * 0.1
    model = LinearRegressionScratch().fit(X, y)
    print(f"Ex27 — LinearRegression scratch: R²={model.score(X,y):.4f}, "
          f"theta={model.theta_.round(3)}")

def ex28():
    """Full logistic regression class from scratch"""
    class LogisticRegressionScratch:
        def __init__(self, lr=0.1, epochs=500):
            self.lr = lr; self.epochs = epochs
        def _sigmoid(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def fit(self, X, y):
            X_b = np.c_[np.ones(len(X)), X]
            self.theta_ = np.zeros(X_b.shape[1])
            for _ in range(self.epochs):
                self.theta_ -= self.lr * X_b.T @ (self._sigmoid(X_b @ self.theta_) - y) / len(y)
            return self
        def predict_proba(self, X):
            return self._sigmoid(np.c_[np.ones(len(X)), X] @ self.theta_)
        def predict(self, X):
            return (self.predict_proba(X) >= 0.5).astype(int)
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=100, n_features=3, random_state=0)
    m = LogisticRegressionScratch().fit(X, y)
    print(f"Ex28 — LogisticRegression scratch: acc={(m.predict(X)==y).mean():.3f}")

def ex29():
    """Full k-means class from scratch"""
    class KMeansScratch:
        def __init__(self, k=2, max_iter=100, seed=0):
            self.k = k; self.max_iter = max_iter; self.rng = np.random.default_rng(seed)
        def fit(self, X):
            idx = self.rng.choice(len(X), self.k, replace=False)
            self.centroids_ = X[idx].copy()
            for _ in range(self.max_iter):
                dists = np.linalg.norm(X[:, None] - self.centroids_[None], axis=2)
                self.labels_ = np.argmin(dists, axis=1)
                new_c = np.array([X[self.labels_==k].mean(0) for k in range(self.k)])
                if np.allclose(self.centroids_, new_c):
                    break
                self.centroids_ = new_c
            return self
    rng = np.random.default_rng(0)
    X = np.vstack([rng.random((30,2)), rng.random((30,2))+3])
    km = KMeansScratch(k=2).fit(X)
    from sklearn.metrics import adjusted_rand_score
    true_labels = np.array([0]*30 + [1]*30)
    print(f"Ex29 — KMeans scratch: ARI={adjusted_rand_score(true_labels, km.labels_):.3f}")

def ex30():
    """Full decision tree (depth 2) from scratch"""
    class DecisionStump:
        def fit(self, X, y, weights=None):
            if weights is None: weights = np.ones(len(y)) / len(y)
            best = {"err": 1.0}
            for j in range(X.shape[1]):
                for thr in np.unique(X[:, j]):
                    for sign in [1, -1]:
                        pred = np.where(X[:, j] >= thr, sign, -sign)
                        err = weights[pred != y].sum()
                        if err < best["err"]:
                            best = {"err": err, "j": j, "thr": thr, "sign": sign}
            self.j_, self.thr_, self.sign_ = best["j"], best["thr"], best["sign"]
            return self
        def predict(self, X):
            return np.where(X[:, self.j_] >= self.thr_, self.sign_, -self.sign_)
    rng = np.random.default_rng(0)
    X = rng.random((60, 2))
    y = np.where(X[:, 0] + X[:, 1] > 1.0, 1, -1)
    stump = DecisionStump().fit(X, y)
    acc = (stump.predict(X) == y).mean()
    print(f"Ex30 — DecisionStump scratch: acc={acc:.3f}, split on feature {stump.j_} >= {stump.thr_:.3f}")

def ex31():
    """Full Naive Bayes class from scratch"""
    class GaussianNBScratch:
        def fit(self, X, y):
            self.classes_ = np.unique(y)
            self.priors_ = {c: (y==c).mean() for c in self.classes_}
            self.means_  = {c: X[y==c].mean(0) for c in self.classes_}
            self.vars_   = {c: X[y==c].var(0) + 1e-9 for c in self.classes_}
            return self
        def _log_likelihood(self, x, c):
            mu, var = self.means_[c], self.vars_[c]
            return -0.5 * np.sum(np.log(2*np.pi*var) + (x-mu)**2/var)
        def predict(self, X):
            return np.array([
                max(self.classes_, key=lambda c: np.log(self.priors_[c]) + self._log_likelihood(x, c))
                for x in X
            ])
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=100, n_features=4, random_state=0)
    m = GaussianNBScratch().fit(X, y)
    print(f"Ex31 — GaussianNB scratch: acc={(m.predict(X)==y).mean():.3f}")

def ex32():
    """Full PCA class from scratch"""
    class PCAScratch:
        def __init__(self, n_components=2):
            self.n_components = n_components
        def fit(self, X):
            self.mean_ = X.mean(0)
            Xc = X - self.mean_
            cov = Xc.T @ Xc / (len(X)-1)
            vals, vecs = np.linalg.eigh(cov)
            idx = np.argsort(vals)[::-1]
            self.components_ = vecs[:, idx[:self.n_components]].T
            self.explained_variance_ratio_ = vals[idx[:self.n_components]] / vals.sum()
            return self
        def transform(self, X):
            return (X - self.mean_) @ self.components_.T
    rng = np.random.default_rng(0)
    X = rng.random((50, 6))
    pca = PCAScratch(n_components=3).fit(X)
    Xt = pca.transform(X)
    print(f"Ex32 — PCA scratch: shape {Xt.shape} | "
          f"explained var: {pca.explained_variance_ratio_.round(3)}")

def ex33():
    """Ensemble: combine predictions from multiple models"""
    from sklearn.datasets import make_classification
    from sklearn.linear_model import LogisticRegression
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.metrics import accuracy_score
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te = X[:150], X[150:]
    y_tr, y_te = y[:150], y[150:]
    models = [LogisticRegression(max_iter=300), DecisionTreeClassifier(max_depth=4, random_state=0)]
    probas = np.mean([m.fit(X_tr, y_tr).predict_proba(X_te) for m in models], axis=0)
    ensemble_pred = probas.argmax(axis=1)
    print(f"Ex33 — ensemble average proba: acc={accuracy_score(y_te, ensemble_pred):.3f}")

def ex34():
    """Stacking meta-learner concept"""
    from sklearn.datasets import make_classification
    from sklearn.linear_model import LogisticRegression
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.model_selection import cross_val_predict
    from sklearn.metrics import accuracy_score
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_tr, X_te = X[:160], X[160:]
    y_tr, y_te = y[:160], y[160:]
    base_models = [LogisticRegression(max_iter=300), DecisionTreeClassifier(max_depth=3, random_state=0)]
    meta_features_train = np.column_stack([
        cross_val_predict(m, X_tr, y_tr, cv=3, method="predict_proba")[:, 1]
        for m in base_models
    ])
    [m.fit(X_tr, y_tr) for m in base_models]
    meta_features_test = np.column_stack([m.predict_proba(X_te)[:, 1] for m in base_models])
    meta = LogisticRegression(max_iter=300).fit(meta_features_train, y_tr)
    print(f"Ex34 — stacking meta-learner: acc={accuracy_score(y_te, meta.predict(meta_features_test)):.3f}")

def ex35():
    """Full neural network forward pass (numpy)"""
    rng = np.random.default_rng(0)
    # 2 → 4 → 3 → 1 network
    W1 = rng.random((4, 2)) - 0.5
    b1 = rng.random((4, 1)) - 0.5
    W2 = rng.random((3, 4)) - 0.5
    b2 = rng.random((3, 1)) - 0.5
    W3 = rng.random((1, 3)) - 0.5
    b3 = rng.random((1, 1)) - 0.5
    relu = lambda z: np.maximum(0, z)
    sigmoid = lambda z: 1 / (1 + np.exp(-z))
    x = rng.random((2, 5))    # batch of 5
    a1 = relu(W1 @ x + b1)
    a2 = relu(W2 @ a1 + b2)
    out = sigmoid(W3 @ a2 + b3)
    print(f"Ex35 — NN forward pass: input shape {x.shape} → output {out.shape} | "
          f"outputs: {out.ravel().round(4)}")

def ex36():
    """Backpropagation single layer"""
    rng = np.random.default_rng(1)
    X = rng.random((4, 3))    # 4 samples, 3 features
    y = np.array([[1.0],[0],[1],[0]])
    W = rng.random((1, 3)) - 0.5
    b = np.zeros((1, 1))
    lr = 0.1
    sigmoid = lambda z: 1 / (1 + np.exp(-z))
    for step in range(3):
        z = (W @ X.T + b)
        a = sigmoid(z)           # (1, 4)
        loss = -np.mean(y.T * np.log(a + 1e-9) + (1-y.T) * np.log(1-a+1e-9))
        dz = a - y.T             # (1, 4)
        dW = dz @ X / len(X)
        db = dz.mean(keepdims=True)
        W -= lr * dW; b -= lr * db
        print(f"Ex36 — backprop step {step+1}: loss={loss:.4f}")

def ex37():
    """Gradient checking"""
    def loss_fn(theta, X, y):
        pred = X @ theta
        return 0.5 * np.mean((pred - y) ** 2)
    def analytical_grad(theta, X, y):
        return X.T @ (X @ theta - y) / len(y)
    rng = np.random.default_rng(0)
    X = rng.random((20, 3)); y = rng.random(20)
    theta = rng.random(3)
    eps = 1e-5
    num_grad = np.zeros(3)
    for i in range(3):
        t_plus = theta.copy(); t_plus[i] += eps
        t_minus = theta.copy(); t_minus[i] -= eps
        num_grad[i] = (loss_fn(t_plus, X, y) - loss_fn(t_minus, X, y)) / (2*eps)
    ana_grad = analytical_grad(theta, X, y)
    diff = np.max(np.abs(num_grad - ana_grad))
    print(f"Ex37 — gradient check: max diff={diff:.2e} ({'PASS' if diff < 1e-5 else 'FAIL'})")

def ex38():
    """Numerical gradient vs analytical"""
    def sigmoid(z): return 1 / (1 + np.exp(-z))
    def bce_loss(w, x, y_true):
        pred = sigmoid(np.dot(w, x))
        return -(y_true * np.log(pred+1e-9) + (1-y_true)*np.log(1-pred+1e-9))
    w = np.array([0.3, -0.2, 0.5])
    x = np.array([1.0, 2.0, -1.0])
    y_true = 1.0
    eps = 1e-5
    num_grad = np.array([(bce_loss(w+eps*np.eye(3)[i], x, y_true) -
                          bce_loss(w-eps*np.eye(3)[i], x, y_true)) / (2*eps) for i in range(3)])
    pred = sigmoid(np.dot(w, x))
    ana_grad = (pred - y_true) * x
    print(f"Ex38 — numerical grad: {num_grad.round(6)}")
    print(f"       analytical grad: {ana_grad.round(6)}")
    print(f"       match: {np.allclose(num_grad, ana_grad, atol=1e-5)}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Adam optimizer from scratch"""
    def adam(grad_fn, theta0, lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8, n_iter=200):
        theta = theta0.copy()
        m = np.zeros_like(theta); v = np.zeros_like(theta)
        for t in range(1, n_iter+1):
            g = grad_fn(theta)
            m = beta1*m + (1-beta1)*g
            v = beta2*v + (1-beta2)*g**2
            m_hat = m/(1-beta1**t); v_hat = v/(1-beta2**t)
            theta -= lr * m_hat / (np.sqrt(v_hat) + eps)
        return theta
    rng = np.random.default_rng(0)
    X = rng.random((100, 2)); y = 3*X[:,0] - 2*X[:,1] + rng.random(100)*0.1
    grad_fn = lambda theta: -2 * X.T @ (y - X @ theta) / len(y)
    theta_init = np.zeros(2)
    theta_opt = adam(grad_fn, theta_init, lr=0.05, n_iter=500)
    print(f"Ex39 — Adam optimizer: theta={theta_opt.round(4)} (expected ≈ [3, -2])")

def ex40():
    """Batch normalization concept (numpy)"""
    rng = np.random.default_rng(0)
    X = rng.random((8, 4)) * 100    # unnormalized layer activations
    gamma = np.ones(4); beta = np.zeros(4)
    eps = 1e-5
    mu = X.mean(axis=0); var = X.var(axis=0)
    X_hat = (X - mu) / np.sqrt(var + eps)
    out = gamma * X_hat + beta
    print(f"Ex40 — BatchNorm: input mean={X.mean():.2f} std={X.std():.2f} | "
          f"output mean={out.mean():.4f} std={out.std():.4f}")

def ex41():
    """Dropout forward/backward (numpy)"""
    rng = np.random.default_rng(42)
    h = rng.random((4, 6))          # activations
    p_keep = 0.8
    # Forward
    mask = (rng.random(h.shape) < p_keep) / p_keep   # inverted dropout
    h_drop = h * mask
    # Backward
    dh_drop = np.ones_like(h)       # upstream gradient
    dh = dh_drop * mask
    print(f"Ex41 — Dropout (p_keep={p_keep}): "
          f"kept {(mask>0).sum()}/{mask.size} units | "
          f"mean activation {h_drop.mean():.3f} (original {h.mean():.3f})")

def ex42():
    """Convolutional layer concept (1D)"""
    signal = np.array([1.0, 2, 3, 4, 5, 6, 7, 8])
    kernel = np.array([0.25, 0.5, 0.25])     # smoothing kernel
    output = np.convolve(signal, kernel, mode="valid")
    print(f"Ex42 — 1D convolution: input len={len(signal)}, kernel len={len(kernel)}")
    print(f"       output: {output.round(3)}")
    # Edge detection
    edge_kernel = np.array([-1.0, 0, 1])
    edges = np.convolve(signal, edge_kernel, mode="valid")
    print(f"       edge detection: {edges.round(3)}")

def ex43():
    """RNN forward pass concept"""
    rng = np.random.default_rng(0)
    input_size, hidden_size, seq_len = 3, 4, 5
    Wxh = rng.random((hidden_size, input_size)) * 0.1
    Whh = rng.random((hidden_size, hidden_size)) * 0.1
    bh  = np.zeros(hidden_size)
    h = np.zeros(hidden_size)
    xs = rng.random((seq_len, input_size))
    hs = []
    for x in xs:
        h = np.tanh(Wxh @ x + Whh @ h + bh)
        hs.append(h)
    hs = np.array(hs)
    print(f"Ex43 — RNN forward pass: seq_len={seq_len}, hidden={hidden_size}")
    print(f"       final hidden state: {hs[-1].round(4)}")

def ex44():
    """Attention mechanism (scaled dot-product)"""
    rng = np.random.default_rng(0)
    seq_len, d_k = 4, 8
    Q = rng.random((seq_len, d_k))
    K = rng.random((seq_len, d_k))
    V = rng.random((seq_len, d_k))
    scores = Q @ K.T / np.sqrt(d_k)
    # softmax
    scores_exp = np.exp(scores - scores.max(axis=-1, keepdims=True))
    attn_weights = scores_exp / scores_exp.sum(axis=-1, keepdims=True)
    output = attn_weights @ V
    print(f"Ex44 — Scaled dot-product attention: Q/K/V shape {Q.shape}")
    print(f"       attention weights (row 0): {attn_weights[0].round(3)}")
    print(f"       output shape: {output.shape}")

def ex45():
    """Transformer block concept"""
    rng = np.random.default_rng(1)
    seq_len, d_model = 5, 8
    X = rng.random((seq_len, d_model))
    # Layer norm
    mu = X.mean(axis=-1, keepdims=True)
    std = X.std(axis=-1, keepdims=True) + 1e-6
    X_ln = (X - mu) / std
    # Single-head self-attention (simplified)
    W_Q = rng.random((d_model, d_model)) * 0.1
    W_K = rng.random((d_model, d_model)) * 0.1
    W_V = rng.random((d_model, d_model)) * 0.1
    Q, K, V = X_ln @ W_Q, X_ln @ W_K, X_ln @ W_V
    scores = Q @ K.T / np.sqrt(d_model)
    attn = np.exp(scores - scores.max(axis=-1, keepdims=True))
    attn /= attn.sum(axis=-1, keepdims=True)
    attn_out = attn @ V
    # Residual + FFN
    out = X + attn_out
    print(f"Ex45 — Transformer block: input {X.shape} → output {out.shape}")
    print(f"       output norm (mean): {out.mean(axis=-1).round(3)}")

def ex46():
    """Genetic algorithm for hyperparameter search"""
    rng = np.random.default_rng(0)
    from sklearn.datasets import make_classification
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.model_selection import cross_val_score
    X, y = make_classification(n_samples=150, n_features=6, random_state=0)
    # Chromosome: [max_depth (1-10), min_samples_split (2-20)]
    def fitness(chrom):
        md, ms = max(1, int(chrom[0])), max(2, int(chrom[1]))
        return cross_val_score(DecisionTreeClassifier(max_depth=md, min_samples_split=ms,
                                                       random_state=0), X, y, cv=3).mean()
    population = rng.uniform([1, 2], [10, 20], size=(10, 2))
    for gen in range(5):
        scores = np.array([fitness(c) for c in population])
        elite_idx = np.argsort(scores)[-4:]
        elites = population[elite_idx]
        children = elites + rng.random((10, 2)) * 2 - 1
        children = np.clip(children, [1, 2], [10, 20])
        population = np.vstack([elites, children[:6]])
    best = population[np.argmax([fitness(c) for c in population])]
    print(f"Ex46 — Genetic search: best params depth={int(best[0])}, "
          f"min_split={int(best[1])}, score={fitness(best):.3f}")

def ex47():
    """Simulated annealing for hyperparameter optimization"""
    rng = np.random.default_rng(3)
    from sklearn.datasets import make_classification
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.model_selection import cross_val_score
    X, y = make_classification(n_samples=150, n_features=4, random_state=0)
    def objective(k):
        k = max(1, min(20, int(k)))
        return cross_val_score(KNeighborsClassifier(n_neighbors=k), X, y, cv=3).mean()
    T = 5.0; k_curr = 5.0; best_score = objective(k_curr); best_k = k_curr
    for step in range(30):
        k_new = k_curr + rng.uniform(-2, 2)
        delta = objective(k_new) - objective(k_curr)
        if delta > 0 or rng.random() < np.exp(delta / T):
            k_curr = k_new
            if objective(k_new) > best_score:
                best_score = objective(k_new); best_k = k_new
        T *= 0.9
    print(f"Ex47 — Simulated annealing: best k={int(best_k)}, score={best_score:.3f}")

def ex48():
    """Evolutionary strategies (CMA-ES concept)"""
    rng = np.random.default_rng(0)
    # Minimize Rosenbrock function as optimization demo
    def rosenbrock(x):
        return sum(100*(x[i+1]-x[i]**2)**2 + (1-x[i])**2 for i in range(len(x)-1))
    mu = np.array([0.0, 0.0]); sigma = 0.5
    for gen in range(50):
        offspring = mu + sigma * rng.random((20, 2))
        scores = np.array([rosenbrock(o) for o in offspring])
        best_idx = np.argsort(scores)[:5]
        mu = offspring[best_idx].mean(0)
        sigma *= 0.95
    print(f"Ex48 — Evolutionary Strategies: final mu={mu.round(4)} "
          f"(optimum=[1,1]) | f={rosenbrock(mu):.4f}")

def ex49():
    """Algorithm complexity comparison (Big-O table)"""
    import time
    from sklearn.datasets import make_classification
    sizes = [100, 500, 1000]
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import SVC
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.neighbors import KNeighborsClassifier
    print("Ex49 — Fit time comparison (ms):")
    print(f"       {'Algorithm':18s} {'n=100':>8s} {'n=500':>8s} {'n=1000':>8s}")
    algos = [("LogReg", LogisticRegression(max_iter=200)),
             ("DecisionTree", DecisionTreeClassifier()),
             ("KNN", KNeighborsClassifier())]
    for name, alg in algos:
        times = []
        for n in sizes:
            X, y = make_classification(n_samples=n, n_features=6, random_state=0)
            t0 = time.perf_counter()
            alg.fit(X, y)
            times.append((time.perf_counter() - t0) * 1000)
        print(f"       {name:18s} {times[0]:8.2f} {times[1]:8.2f} {times[2]:8.2f}")

def ex50():
    """Benchmark: algorithms on same dataset"""
    from sklearn.datasets import make_classification
    from sklearn.metrics import accuracy_score, roc_auc_score
    from sklearn.model_selection import train_test_split
    from sklearn.linear_model import LogisticRegression
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    import time
    X, y = make_classification(n_samples=500, n_features=10, n_informative=6, random_state=42)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    from sklearn.preprocessing import StandardScaler
    sc = StandardScaler(); X_tr_s = sc.fit_transform(X_tr); X_te_s = sc.transform(X_te)
    models = [
        ("LogReg",    LogisticRegression(max_iter=300),                True),
        ("DTree",     DecisionTreeClassifier(max_depth=5, random_state=0), False),
        ("RF-100",    RandomForestClassifier(n_estimators=100, random_state=0), False),
        ("GB-100",    GradientBoostingClassifier(n_estimators=100, random_state=0), False),
        ("KNN-5",     KNeighborsClassifier(n_neighbors=5),            True),
        ("SVM-RBF",   SVC(kernel="rbf", probability=True),            True),
    ]
    print("Ex50 — Algorithm benchmark on (400 train / 100 test):")
    print(f"       {'Algorithm':12s} {'Acc':>6s} {'AUC':>6s} {'FitMs':>7s}")
    for name, m, scaled in models:
        Xtr, Xte = (X_tr_s, X_te_s) if scaled else (X_tr, X_te)
        t0 = time.perf_counter()
        m.fit(Xtr, y_tr)
        fit_ms = (time.perf_counter() - t0) * 1000
        pred = m.predict(Xte)
        proba = m.predict_proba(Xte)[:, 1]
        print(f"       {name:12s} {accuracy_score(y_te, pred):6.3f} "
              f"{roc_auc_score(y_te, proba):6.3f} {fit_ms:7.1f}")


def main():
    print("=" * 60)
    print("Examples 1.4 — ML Algorithms Deep Dive")
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
