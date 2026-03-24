# ============================================================
# Examples 3.4 — Neural Networks from Scratch (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.datasets import make_classification, make_regression, make_moons
from sklearn.metrics import accuracy_score, r2_score

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Sigmoid activation function"""
    def sigmoid(z):
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    z = np.array([-3.0, -1.0, 0.0, 1.0, 3.0])
    print(f"Ex01 — sigmoid({z}) = {np.round(sigmoid(z), 4)}")

def ex02():
    """ReLU activation function"""
    def relu(z):
        return np.maximum(0, z)
    z = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    print(f"Ex02 — relu({z}) = {relu(z)}")

def ex03():
    """Tanh activation function"""
    def tanh(z):
        return np.tanh(z)
    z = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    print(f"Ex03 — tanh({z}) = {np.round(tanh(z), 4)}")

def ex04():
    """Softmax function"""
    def softmax(z):
        z_shifted = z - z.max()
        e = np.exp(z_shifted)
        return e / e.sum()
    z = np.array([2.0, 1.0, 0.5])
    sm = softmax(z)
    print(f"Ex04 — softmax({z}) = {np.round(sm, 4)}, sum={sm.sum():.4f}")

def ex05():
    """Linear neuron output"""
    x = np.array([1.0, 2.0, 3.0])
    w = np.array([0.5, -0.3, 0.8])
    b = 0.1
    output = np.dot(w, x) + b
    print(f"Ex05 — Linear neuron output: w·x + b = {output:.4f}")

def ex06():
    """Single neuron with bias (sigmoid)"""
    def sigmoid(z):
        return 1 / (1 + np.exp(-z))
    x = np.array([1.5, -0.5, 2.0])
    w = np.array([0.4, 0.7, -0.2])
    b = -0.3
    out = sigmoid(np.dot(w, x) + b)
    print(f"Ex06 — Sigmoid neuron output: {out:.4f}")

def ex07():
    """2-neuron hidden layer (manual)"""
    def relu(z): return np.maximum(0, z)
    x = np.array([1.0, 2.0])
    W = np.array([[0.3, -0.5], [0.7, 0.2]])
    b = np.array([0.1, -0.2])
    h = relu(W @ x + b)
    print(f"Ex07 — 2-neuron hidden layer output: {np.round(h, 4)}")

def ex08():
    """Forward pass 2-layer MLP"""
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    def relu(z): return np.maximum(0, z)
    rng = np.random.default_rng(0)
    x = rng.standard_normal(4)
    W1, b1 = rng.standard_normal((6, 4)) * 0.1, np.zeros(6)
    W2, b2 = rng.standard_normal((1, 6)) * 0.1, np.zeros(1)
    h = relu(W1 @ x + b1)
    out = sigmoid(W2 @ h + b2)
    print(f"Ex08 — 2-layer MLP forward output: {np.round(out, 4)}")

def ex09():
    """MSE loss"""
    y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y_pred = np.array([1.1, 1.9, 3.2, 3.8, 5.1])
    mse = np.mean((y_true - y_pred) ** 2)
    print(f"Ex09 — MSE loss: {mse:.4f}")

def ex10():
    """Binary cross-entropy loss"""
    def bce(y, p):
        p = np.clip(p, 1e-7, 1 - 1e-7)
        return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    y = np.array([1, 0, 1, 1, 0])
    p = np.array([0.9, 0.1, 0.8, 0.7, 0.3])
    print(f"Ex10 — Binary cross-entropy: {bce(y, p):.4f}")

def ex11():
    """Categorical cross-entropy loss"""
    def cce(y_onehot, probs):
        probs = np.clip(probs, 1e-7, 1.0)
        return -np.mean(np.sum(y_onehot * np.log(probs), axis=1))
    y_oh = np.array([[1,0,0],[0,1,0],[0,0,1]])
    p = np.array([[0.8,0.1,0.1],[0.2,0.7,0.1],[0.1,0.2,0.7]])
    print(f"Ex11 — Categorical cross-entropy: {cce(y_oh, p):.4f}")

def ex12():
    """Weight initialization (random)"""
    rng = np.random.default_rng(0)
    W = rng.standard_normal((4, 3)) * 0.01
    b = np.zeros(4)
    print(f"Ex12 — Random init W shape={W.shape}, mean={W.mean():.4f}, std={W.std():.4f}")

def ex13():
    """Weight initialization (Xavier/Glorot)"""
    rng = np.random.default_rng(0)
    n_in, n_out = 4, 6
    limit = np.sqrt(6.0 / (n_in + n_out))
    W = rng.uniform(-limit, limit, (n_out, n_in))
    print(f"Ex13 — Xavier init limit={limit:.4f}, W shape={W.shape}, std={W.std():.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Backprop gradient for output (MSE)"""
    y = np.array([1.0, 0.0, 1.0])
    y_pred = np.array([0.8, 0.3, 0.6])
    grad_output = 2 * (y_pred - y) / len(y)
    print(f"Ex14 — MSE gradient at output: {np.round(grad_output, 4)}")

def ex15():
    """Backprop gradient for sigmoid"""
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    z = np.array([-1.0, 0.0, 1.0, 2.0])
    s = sigmoid(z)
    grad_sigmoid = s * (1 - s)
    print(f"Ex15 — sigmoid'(z) = {np.round(grad_sigmoid, 4)}")

def ex16():
    """Backprop for 2-layer (full equations)"""
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    rng = np.random.default_rng(0)
    X = rng.standard_normal((5, 3))
    y = rng.integers(0, 2, 5).astype(float)
    W1 = rng.standard_normal((4, 3)) * 0.1
    b1 = np.zeros(4)
    W2 = rng.standard_normal((1, 4)) * 0.1
    b2 = np.zeros(1)
    Z1 = X @ W1.T + b1; A1 = sigmoid(Z1)
    Z2 = A1 @ W2.T + b2; A2 = sigmoid(Z2).ravel()
    dA2 = -(y / (A2 + 1e-7) - (1 - y) / (1 - A2 + 1e-7)) / len(y)
    dZ2 = dA2 * A2 * (1 - A2)
    dW2 = dZ2[:, None] * A1
    print(f"Ex16 — dW2 shape={dW2.shape}, dW2 mean={dW2.mean():.4f}")

def ex17():
    """Weight update step (SGD)"""
    W = np.array([[0.5, -0.3], [0.2, 0.8]])
    grad_W = np.array([[0.1, -0.05], [0.03, 0.12]])
    lr = 0.01
    W_new = W - lr * grad_W
    print(f"Ex17 — Weight after SGD update:\n{np.round(W_new, 4)}")

def ex18():
    """Mini-batch gradient descent step"""
    rng = np.random.default_rng(0)
    X = rng.standard_normal((100, 3))
    y = rng.standard_normal(100)
    w = np.zeros(3); b = 0.0
    batch_size = 16
    batch_X = X[:batch_size]; batch_y = y[:batch_size]
    preds = batch_X @ w + b
    grad_w = batch_X.T @ (preds - batch_y) / batch_size
    grad_b = (preds - batch_y).mean()
    w -= 0.01 * grad_w; b -= 0.01 * grad_b
    print(f"Ex18 — Mini-batch GD: w norm={np.linalg.norm(w):.4f}, b={b:.4f}")

def ex19():
    """Momentum update"""
    rng = np.random.default_rng(0)
    w = rng.standard_normal(4)
    v = np.zeros(4)
    grad = rng.standard_normal(4)
    lr, beta = 0.01, 0.9
    v = beta * v - lr * grad
    w += v
    print(f"Ex19 — Momentum update: v={np.round(v, 4)}, w={np.round(w, 4)}")

def ex20():
    """Adam update"""
    rng = np.random.default_rng(0)
    w = rng.standard_normal(3)
    m, v = np.zeros(3), np.zeros(3)
    grad = rng.standard_normal(3)
    lr, beta1, beta2, eps, t = 0.001, 0.9, 0.999, 1e-8, 1
    m = beta1 * m + (1 - beta1) * grad
    v = beta2 * v + (1 - beta2) * grad**2
    m_hat = m / (1 - beta1**t)
    v_hat = v / (1 - beta2**t)
    w -= lr * m_hat / (np.sqrt(v_hat) + eps)
    print(f"Ex20 — Adam update: w={np.round(w, 4)}")

def ex21():
    """L2 regularization gradient"""
    rng = np.random.default_rng(0)
    W = rng.standard_normal((3, 4))
    grad_loss = rng.standard_normal((3, 4))
    lam = 0.01
    grad_total = grad_loss + lam * W
    print(f"Ex21 — L2 reg grad norm: {np.linalg.norm(grad_total):.4f}")

def ex22():
    """Dropout forward (training mode)"""
    rng = np.random.default_rng(0)
    h = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    p_keep = 0.8
    mask = (rng.uniform(size=h.shape) < p_keep).astype(float)
    h_dropped = h * mask / p_keep
    print(f"Ex22 — Dropout output: {np.round(h_dropped, 4)}, mask: {mask}")

def ex23():
    """Batch normalization forward"""
    rng = np.random.default_rng(0)
    x = rng.standard_normal((4, 3))
    gamma, beta = np.ones(3), np.zeros(3)
    eps = 1e-5
    mu = x.mean(axis=0)
    var = x.var(axis=0)
    x_hat = (x - mu) / np.sqrt(var + eps)
    out = gamma * x_hat + beta
    print(f"Ex23 — BN output mean: {out.mean(axis=0).round(4)}, std: {out.std(axis=0).round(4)}")

def ex24():
    """Gradient checking (numerical vs analytical)"""
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    def loss(w, x, y):
        pred = sigmoid(w @ x)
        return -y * np.log(pred + 1e-7) - (1-y) * np.log(1 - pred + 1e-7)
    w = np.array([0.5, -0.3, 0.1]); x = np.array([1.0, 2.0, -1.0]); y = 1.0
    eps = 1e-5
    num_grad = np.zeros(3)
    for i in range(3):
        wp = w.copy(); wp[i] += eps
        wm = w.copy(); wm[i] -= eps
        num_grad[i] = (loss(wp, x, y) - loss(wm, x, y)) / (2 * eps)
    pred = sigmoid(w @ x)
    anal_grad = (pred - y) * x
    print(f"Ex24 — Numerical grad: {np.round(num_grad, 5)}")
    print(f"       Analytical grad: {np.round(anal_grad, 5)}")
    print(f"       Max diff: {np.abs(num_grad - anal_grad).max():.6f}")

def ex25():
    """Train XOR (100 epochs, print loss)"""
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    X_xor = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)
    y_xor = np.array([0, 1, 1, 0], dtype=float)
    rng = np.random.default_rng(0)
    W1 = rng.standard_normal((4, 2)) * 0.5; b1 = np.zeros(4)
    W2 = rng.standard_normal((1, 4)) * 0.5; b2 = np.zeros(1)
    lr = 0.5
    for epoch in range(1, 1001):
        Z1 = X_xor @ W1.T + b1; A1 = sigmoid(Z1)
        Z2 = A1 @ W2.T + b2; A2 = sigmoid(Z2).ravel()
        loss = -np.mean(y_xor * np.log(A2+1e-7) + (1-y_xor) * np.log(1-A2+1e-7))
        dA2 = (A2 - y_xor) / len(y_xor)
        dZ2 = dA2 * A2 * (1 - A2)
        dW2 = dZ2[:, None] * A1; db2 = dZ2.mean()
        dA1 = dZ2[:, None] * W2; dZ1 = dA1 * A1 * (1 - A1)
        dW1 = dZ1.T @ X_xor / len(X_xor); db1 = dZ1.mean(axis=0)
        W1 -= lr * dW1; b1 -= lr * db1; W2 -= lr * dW2.sum(0, keepdims=True); b2 -= lr * db2
        if epoch % 100 == 0:
            print(f"Ex25 — Epoch {epoch}: loss={loss:.4f}")
    preds = (A2 >= 0.5).astype(int)
    print(f"  XOR predictions: {preds}, targets: {y_xor.astype(int)}")

def ex26():
    """Learning rate effect on convergence"""
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    X_xor = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)
    y_xor = np.array([0, 1, 1, 0], dtype=float)
    for lr in [0.01, 0.1, 1.0]:
        rng = np.random.default_rng(42)
        W1 = rng.standard_normal((4, 2)) * 0.3; b1 = np.zeros(4)
        W2 = rng.standard_normal((1, 4)) * 0.3; b2 = np.zeros(1)
        for _ in range(500):
            Z1 = X_xor @ W1.T + b1; A1 = sigmoid(Z1)
            Z2 = A1 @ W2.T + b2; A2 = sigmoid(Z2).ravel()
            dA2 = (A2 - y_xor) / len(y_xor)
            dZ2 = dA2 * A2 * (1 - A2)
            dW2 = dZ2[:, None] * A1; db2 = dZ2.mean()
            dA1 = dZ2[:, None] * W2; dZ1 = dA1 * A1 * (1 - A1)
            dW1 = dZ1.T @ X_xor / len(X_xor); db1 = dZ1.mean(axis=0)
            W1 -= lr * dW1; b1 -= lr * db1; W2 -= lr * dW2.sum(0, keepdims=True); b2 -= lr * db2
        loss = -np.mean(y_xor * np.log(A2+1e-7) + (1-y_xor) * np.log(1-A2+1e-7))
        print(f"Ex26 — lr={lr}: final loss={loss:.4f}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """NeuralNetwork class (2 layers, numpy)"""
    class NeuralNetwork:
        def __init__(self, n_in, n_hidden, n_out, lr=0.01, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * np.sqrt(2.0/n_in)
            self.b1 = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((n_out, n_hidden)) * np.sqrt(2.0/n_hidden)
            self.b2 = np.zeros(n_out)
            self.lr = lr
        def _sigmoid(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def forward(self, X):
            self.Z1 = X @ self.W1.T + self.b1
            self.A1 = self._sigmoid(self.Z1)
            self.Z2 = self.A1 @ self.W2.T + self.b2
            self.A2 = self._sigmoid(self.Z2)
            return self.A2

    X, y = make_classification(n_samples=10, n_features=4, random_state=0)
    nn = NeuralNetwork(4, 8, 1)
    out = nn.forward(X)
    print(f"Ex27 — NN forward output shape={out.shape}, sample outputs={np.round(out[:3, 0], 4)}")

def ex28():
    """NeuralNetwork class with training loop"""
    class NeuralNetwork:
        def __init__(self, n_in, n_hidden, n_out, lr=0.1, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((n_out, n_hidden)) * 0.1
            self.b2 = np.zeros(n_out)
            self.lr = lr
        def _sig(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def fit(self, X, y, n_iter=200):
            for _ in range(n_iter):
                A1 = self._sig(X @ self.W1.T + self.b1)
                A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
                d2 = (A2 - y) / len(y)
                dZ2 = d2 * A2 * (1 - A2)
                self.W2 -= self.lr * (dZ2[:, None] * A1).mean(0, keepdims=True)
                self.b2 -= self.lr * dZ2.mean()
                dA1 = dZ2[:, None] * self.W2
                dZ1 = dA1 * A1 * (1 - A1)
                self.W1 -= self.lr * dZ1.T @ X / len(X)
                self.b1 -= self.lr * dZ1.mean(axis=0)
            return self
        def predict_proba(self, X):
            A1 = self._sig(X @ self.W1.T + self.b1)
            return self._sig(A1 @ self.W2.T + self.b2).ravel()
        def predict(self, X): return (self.predict_proba(X) >= 0.5).astype(int)

    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    nn = NeuralNetwork(4, 8, 1, lr=0.5).fit(X_tr, y_tr.astype(float), n_iter=500)
    print(f"Ex28 — NN with training loop accuracy: {accuracy_score(y_te, nn.predict(X_te)):.4f}")

def ex29():
    """NeuralNetwork with validation monitoring"""
    class NeuralNetworkVal:
        def __init__(self, n_in, n_hidden, lr=0.1, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((1, n_hidden)) * 0.1
            self.b2 = np.zeros(1)
            self.lr = lr
        def _sig(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def _forward(self, X):
            A1 = self._sig(X @ self.W1.T + self.b1)
            A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
            return A1, A2
        def fit(self, X_tr, y_tr, X_val, y_val, n_iter=300, verbose_every=100):
            for i in range(1, n_iter+1):
                A1, A2 = self._forward(X_tr)
                d2 = (A2 - y_tr) / len(y_tr)
                dZ2 = d2 * A2 * (1 - A2)
                self.W2 -= self.lr * (dZ2[:, None] * A1).mean(0, keepdims=True)
                self.b2 -= self.lr * dZ2.mean()
                dA1 = dZ2[:, None] * self.W2; dZ1 = dA1 * A1 * (1 - A1)
                self.W1 -= self.lr * dZ1.T @ X_tr / len(X_tr)
                self.b1 -= self.lr * dZ1.mean(axis=0)
                if i % verbose_every == 0:
                    _, val_out = self._forward(X_val)
                    val_acc = accuracy_score(y_val, (val_out >= 0.5).astype(int))
                    print(f"  iter={i}: val_acc={val_acc:.4f}")
            return self

    X, y = make_classification(n_samples=300, n_features=4, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    X_tr2, X_val, y_tr2, y_val = train_test_split(X_tr, y_tr, test_size=0.2, random_state=0)
    print("Ex29 — NN with validation:")
    nn = NeuralNetworkVal(4, 8, lr=0.3).fit(X_tr2, y_tr2.astype(float), X_val, y_val.astype(float), verbose_every=100)

def ex30():
    """NeuralNetwork with early stopping"""
    class NeuralNetworkES:
        def __init__(self, n_in, n_hidden, lr=0.1, patience=20, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((1, n_hidden)) * 0.1
            self.b2 = np.zeros(1)
            self.lr, self.patience = lr, patience
        def _sig(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def fit(self, X_tr, y_tr, X_val, y_val, n_iter=1000):
            best_val, wait, best_W1, best_W2 = np.inf, 0, self.W1.copy(), self.W2.copy()
            stopped_at = n_iter
            for i in range(1, n_iter+1):
                A1 = self._sig(X_tr @ self.W1.T + self.b1)
                A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
                d2 = (A2 - y_tr) / len(y_tr)
                dZ2 = d2 * A2 * (1 - A2)
                self.W2 -= self.lr * (dZ2[:, None] * A1).mean(0, keepdims=True)
                self.b2 -= self.lr * dZ2.mean()
                dA1 = dZ2[:, None] * self.W2; dZ1 = dA1 * A1 * (1 - A1)
                self.W1 -= self.lr * dZ1.T @ X_tr / len(X_tr)
                self.b1 -= self.lr * dZ1.mean(axis=0)
                A1v = self._sig(X_val @ self.W1.T + self.b1)
                A2v = self._sig(A1v @ self.W2.T + self.b2).ravel()
                val_loss = -np.mean(y_val*np.log(A2v+1e-7)+(1-y_val)*np.log(1-A2v+1e-7))
                if val_loss < best_val:
                    best_val = val_loss; wait = 0
                    best_W1, best_W2 = self.W1.copy(), self.W2.copy()
                else:
                    wait += 1
                    if wait >= self.patience:
                        stopped_at = i; break
            self.W1, self.W2 = best_W1, best_W2
            return self, stopped_at

    X, y = make_classification(n_samples=300, n_features=4, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    X_tr2, X_val, y_tr2, y_val = train_test_split(X_tr, y_tr, test_size=0.2, random_state=0)
    nn, stopped = NeuralNetworkES(4, 16, lr=0.2, patience=30).fit(
        X_tr2, y_tr2.astype(float), X_val, y_val.astype(float)
    )
    print(f"Ex30 — Early stopping at iter={stopped}")

def ex31():
    """NeuralNetwork with momentum"""
    class NeuralNetworkMomentum:
        def __init__(self, n_in, n_hidden, lr=0.05, beta=0.9, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((1, n_hidden)) * 0.1
            self.b2 = np.zeros(1)
            self.lr, self.beta = lr, beta
            self.vW1 = np.zeros_like(self.W1); self.vb1 = np.zeros_like(self.b1)
            self.vW2 = np.zeros_like(self.W2); self.vb2 = np.zeros_like(self.b2)
        def _sig(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def fit(self, X, y, n_iter=500):
            for _ in range(n_iter):
                A1 = self._sig(X @ self.W1.T + self.b1)
                A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
                d2 = (A2 - y) / len(y)
                dZ2 = d2 * A2 * (1 - A2)
                gW2 = (dZ2[:, None] * A1).mean(0, keepdims=True)
                gb2 = dZ2.mean()
                dA1 = dZ2[:, None] * self.W2; dZ1 = dA1 * A1 * (1 - A1)
                gW1 = dZ1.T @ X / len(X); gb1 = dZ1.mean(0)
                self.vW2 = self.beta*self.vW2 - self.lr*gW2; self.W2 += self.vW2
                self.vb2 = self.beta*self.vb2 - self.lr*gb2; self.b2 += self.vb2
                self.vW1 = self.beta*self.vW1 - self.lr*gW1; self.W1 += self.vW1
                self.vb1 = self.beta*self.vb1 - self.lr*gb1; self.b1 += self.vb1
            return self
        def predict(self, X):
            A1 = self._sig(X @ self.W1.T + self.b1)
            A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
            return (A2 >= 0.5).astype(int)

    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    nn = NeuralNetworkMomentum(4, 8, lr=0.05, beta=0.9).fit(X_tr, y_tr.astype(float))
    print(f"Ex31 — NN with Momentum accuracy: {accuracy_score(y_te, nn.predict(X_te)):.4f}")

def ex32():
    """NeuralNetwork with Adam optimizer"""
    class NeuralNetworkAdam:
        def __init__(self, n_in, n_hidden, lr=0.001, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((1, n_hidden)) * 0.1
            self.b2 = np.zeros(1)
            self.lr = lr
            self.mW1=np.zeros_like(self.W1); self.vW1=np.zeros_like(self.W1)
            self.mW2=np.zeros_like(self.W2); self.vW2=np.zeros_like(self.W2)
            self.t = 0
        def _sig(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def _adam(self, m, v, g, t, b1=0.9, b2=0.999, eps=1e-8):
            m = b1*m + (1-b1)*g; v = b2*v + (1-b2)*g**2
            mh = m/(1-b1**t); vh = v/(1-b2**t)
            return m, v, self.lr * mh / (np.sqrt(vh) + eps)
        def fit(self, X, y, n_iter=500):
            for _ in range(n_iter):
                self.t += 1
                A1 = self._sig(X @ self.W1.T + self.b1)
                A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
                d2 = (A2 - y) / len(y)
                dZ2 = d2 * A2 * (1 - A2)
                gW2 = (dZ2[:, None] * A1).mean(0, keepdims=True)
                dA1 = dZ2[:, None] * self.W2; dZ1 = dA1 * A1 * (1 - A1)
                gW1 = dZ1.T @ X / len(X)
                self.mW2, self.vW2, dw2 = self._adam(self.mW2, self.vW2, gW2, self.t)
                self.mW1, self.vW1, dw1 = self._adam(self.mW1, self.vW1, gW1, self.t)
                self.W2 -= dw2; self.W1 -= dw1
            return self
        def predict(self, X):
            A1 = self._sig(X @ self.W1.T + self.b1)
            A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
            return (A2 >= 0.5).astype(int)

    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    nn = NeuralNetworkAdam(4, 16, lr=0.005).fit(X_tr, y_tr.astype(float))
    print(f"Ex32 — NN with Adam accuracy: {accuracy_score(y_te, nn.predict(X_te)):.4f}")

def ex33():
    """NeuralNetwork with dropout"""
    class NeuralNetworkDropout:
        def __init__(self, n_in, n_hidden, p_drop=0.3, lr=0.1, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((1, n_hidden)) * 0.1
            self.b2 = np.zeros(1)
            self.p_drop, self.lr = p_drop, lr
            self.rng = rng
        def _sig(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def fit(self, X, y, n_iter=300):
            for _ in range(n_iter):
                A1_pre = self._sig(X @ self.W1.T + self.b1)
                mask = (self.rng.uniform(size=A1_pre.shape) > self.p_drop).astype(float)
                A1 = A1_pre * mask / (1 - self.p_drop)
                A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
                d2 = (A2 - y) / len(y)
                dZ2 = d2 * A2 * (1 - A2)
                gW2 = (dZ2[:, None] * A1).mean(0, keepdims=True)
                dA1 = (dZ2[:, None] * self.W2) * mask / (1 - self.p_drop)
                dZ1 = dA1 * A1_pre * (1 - A1_pre)
                gW1 = dZ1.T @ X / len(X)
                self.W2 -= self.lr * gW2; self.W1 -= self.lr * gW1
                self.b2 -= self.lr * dZ2.mean(); self.b1 -= self.lr * dZ1.mean(0)
            return self
        def predict(self, X):
            A1 = self._sig(X @ self.W1.T + self.b1)
            A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
            return (A2 >= 0.5).astype(int)

    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    nn = NeuralNetworkDropout(4, 16, p_drop=0.3, lr=0.2).fit(X_tr, y_tr.astype(float))
    print(f"Ex33 — NN with Dropout accuracy: {accuracy_score(y_te, nn.predict(X_te)):.4f}")

def ex34():
    """NeuralNetwork with batch norm (inference mode)"""
    class NeuralNetworkBN:
        def __init__(self, n_in, n_hidden, lr=0.05, random_state=0):
            rng = np.random.default_rng(random_state)
            self.W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.gamma = np.ones(n_hidden); self.beta_bn = np.zeros(n_hidden)
            self.W2 = rng.standard_normal((1, n_hidden)) * 0.1
            self.b2 = np.zeros(1)
            self.lr = lr
        def _sig(self, z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
        def _bn(self, z):
            mu = z.mean(0); var = z.var(0) + 1e-5
            z_hat = (z - mu) / np.sqrt(var)
            return self.gamma * z_hat + self.beta_bn
        def fit(self, X, y, n_iter=300):
            for _ in range(n_iter):
                Z1 = X @ self.W1.T + self.b1
                Z1_bn = self._bn(Z1); A1 = self._sig(Z1_bn)
                A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
                d2 = (A2 - y) / len(y)
                dZ2 = d2 * A2 * (1 - A2)
                gW2 = (dZ2[:, None] * A1).mean(0, keepdims=True)
                dA1 = dZ2[:, None] * self.W2; dZ1 = dA1 * A1 * (1 - A1)
                gW1 = dZ1.T @ X / len(X)
                self.W2 -= self.lr * gW2; self.W1 -= self.lr * gW1
                self.b2 -= self.lr * dZ2.mean(); self.b1 -= self.lr * dZ1.mean(0)
            return self
        def predict(self, X):
            Z1 = X @ self.W1.T + self.b1; A1 = self._sig(Z1)
            A2 = self._sig(A1 @ self.W2.T + self.b2).ravel()
            return (A2 >= 0.5).astype(int)

    X, y = make_classification(n_samples=200, n_features=4, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    nn = NeuralNetworkBN(4, 16, lr=0.1).fit(X_tr, y_tr.astype(float))
    print(f"Ex34 — NN with BatchNorm accuracy: {accuracy_score(y_te, nn.predict(X_te)):.4f}")

def ex35():
    """Full train on make_moons (print accuracy)"""
    X, y = make_moons(n_samples=400, noise=0.2, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    mlp = MLPClassifier(hidden_layer_sizes=(32, 16), activation="relu", max_iter=500, random_state=0)
    mlp.fit(X_tr, y_tr)
    print(f"Ex35 — MLP on make_moons accuracy: {mlp.score(X_te, y_te):.4f}")

def ex36():
    """sklearn MLPClassifier comparison (relu vs tanh vs logistic)"""
    X, y = make_classification(n_samples=300, n_features=6, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    for act in ["relu", "tanh", "logistic"]:
        mlp = MLPClassifier(hidden_layer_sizes=(32,), activation=act, max_iter=500, random_state=0)
        acc = mlp.fit(X_tr, y_tr).score(X_te, y_te)
        print(f"Ex36 — activation={act}: accuracy={acc:.4f}")

def ex37():
    """Hyperparameter tuning for MLP (GridSearchCV)"""
    X, y = make_classification(n_samples=300, n_features=5, random_state=0)
    X = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    param_grid = {
        "hidden_layer_sizes": [(16,), (32, 16)],
        "alpha": [0.0001, 0.001],
    }
    gs = GridSearchCV(MLPClassifier(max_iter=500, random_state=0), param_grid, cv=3)
    gs.fit(X_tr, y_tr)
    print(f"Ex37 — Best MLP params: {gs.best_params_}, test acc: {gs.score(X_te, y_te):.4f}")

def ex38():
    """Production neural network class"""
    class ProductionNeuralNet:
        def __init__(self):
            self.pipeline_ = Pipeline([
                ("scaler", StandardScaler()),
                ("mlp", MLPClassifier(
                    hidden_layer_sizes=(64, 32),
                    activation="relu",
                    max_iter=500,
                    random_state=0,
                    early_stopping=True,
                    validation_fraction=0.1,
                ))
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
            return {"accuracy": accuracy_score(y, preds), "n_iter": self.pipeline_.named_steps["mlp"].n_iter_}

    X, y = make_classification(n_samples=400, n_features=6, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0)
    pnn = ProductionNeuralNet(); pnn.train(X_tr, y_tr)
    metrics = pnn.evaluate(X_te, y_te)
    print(f"Ex38 — Production NN: accuracy={metrics['accuracy']:.4f}, n_iter={metrics['n_iter']}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """CNN concept (1D convolution in numpy)"""
    def conv1d(x, kernel, stride=1):
        k = len(kernel)
        out_len = (len(x) - k) // stride + 1
        return np.array([np.dot(x[i*stride:i*stride+k], kernel) for i in range(out_len)])

    signal = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 4.0, 3.0, 2.0, 1.0])
    edge_kernel = np.array([-1.0, 0.0, 1.0])
    smooth_kernel = np.array([1/3, 1/3, 1/3])
    edge_out = conv1d(signal, edge_kernel)
    smooth_out = conv1d(signal, smooth_kernel)
    print(f"Ex39 — 1D Conv edge: {np.round(edge_out, 2)}")
    print(f"       1D Conv smooth: {np.round(smooth_out, 2)}")

def ex40():
    """LSTM cell forward (numpy)"""
    rng = np.random.default_rng(0)
    n_in, n_hidden = 3, 4
    Wf = rng.standard_normal((n_hidden, n_in + n_hidden)) * 0.1
    Wi = rng.standard_normal((n_hidden, n_in + n_hidden)) * 0.1
    Wg = rng.standard_normal((n_hidden, n_in + n_hidden)) * 0.1
    Wo = rng.standard_normal((n_hidden, n_in + n_hidden)) * 0.1
    bf, bi, bg, bo = [np.zeros(n_hidden)] * 4
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    x = rng.standard_normal(n_in)
    h_prev = np.zeros(n_hidden)
    c_prev = np.zeros(n_hidden)
    xh = np.concatenate([x, h_prev])
    f = sigmoid(Wf @ xh + bf)
    i = sigmoid(Wi @ xh + bi)
    g = np.tanh(Wg @ xh + bg)
    o = sigmoid(Wo @ xh + bo)
    c = f * c_prev + i * g
    h = o * np.tanh(c)
    print(f"Ex40 — LSTM cell: h={np.round(h, 4)}, c_norm={np.linalg.norm(c):.4f}")

def ex41():
    """GRU cell forward (numpy)"""
    rng = np.random.default_rng(0)
    n_in, n_hidden = 3, 4
    Wz = rng.standard_normal((n_hidden, n_in + n_hidden)) * 0.1
    Wr = rng.standard_normal((n_hidden, n_in + n_hidden)) * 0.1
    Wh = rng.standard_normal((n_hidden, n_in + n_hidden)) * 0.1
    bz, br, bh_bias = [np.zeros(n_hidden)] * 3
    def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    x = rng.standard_normal(n_in)
    h_prev = rng.standard_normal(n_hidden) * 0.1
    z = sigmoid(Wz @ np.concatenate([x, h_prev]) + bz)
    r = sigmoid(Wr @ np.concatenate([x, h_prev]) + br)
    h_cand = np.tanh(Wh @ np.concatenate([x, r * h_prev]) + bh_bias)
    h = (1 - z) * h_prev + z * h_cand
    print(f"Ex41 — GRU cell: h={np.round(h, 4)}")

def ex42():
    """Attention mechanism (scaled dot-product, numpy)"""
    rng = np.random.default_rng(0)
    seq_len, d_k = 5, 8
    Q = rng.standard_normal((seq_len, d_k))
    K = rng.standard_normal((seq_len, d_k))
    V = rng.standard_normal((seq_len, d_k))
    scores = Q @ K.T / np.sqrt(d_k)
    scores -= scores.max(axis=-1, keepdims=True)
    weights = np.exp(scores) / np.exp(scores).sum(axis=-1, keepdims=True)
    output = weights @ V
    print(f"Ex42 — Attention weights (first row): {np.round(weights[0], 3)}")
    print(f"       Attention output shape: {output.shape}")

def ex43():
    """Residual connection (add skip, numpy)"""
    rng = np.random.default_rng(0)
    x = rng.standard_normal(8)
    W = rng.standard_normal((8, 8)) * 0.1
    b = np.zeros(8)
    def relu(z): return np.maximum(0, z)
    h = relu(W @ x + b)
    out = h + x
    print(f"Ex43 — Residual connection: input norm={np.linalg.norm(x):.4f}, output norm={np.linalg.norm(out):.4f}")

def ex44():
    """Weight sharing concept"""
    print("Ex44 — Weight Sharing:")
    print("  - Same weights reused across multiple positions/applications")
    print("  - CNNs: convolutional kernel shared spatially → translational equivariance")
    print("  - RNNs: Wx, Wh shared across time steps → arbitrary sequence length")
    print("  - BERT: transformer weights shared across layers (ALBERT)")
    print("  - Benefits: fewer parameters, better generalization, inductive bias")
    rng = np.random.default_rng(0)
    kernel = rng.standard_normal(3)
    seq = rng.standard_normal(10)
    shared_out = np.array([np.dot(seq[i:i+3], kernel) for i in range(8)])
    print(f"  Shared conv output (same kernel): shape={shared_out.shape}")

def ex45():
    """Neural architecture search concept"""
    print("Ex45 — Neural Architecture Search (NAS):")
    print("  - Automate design of neural network architectures")
    print("  - Search space: layers, connections, activations, widths")
    print("  - Search strategies:")
    print("    1. Random search: sample architectures, evaluate, pick best")
    print("    2. Evolutionary: mutate + select high-fitness architectures")
    print("    3. DARTS (Differentiable): relax discrete choices → continuous weights")
    print("  - Proxy tasks: train on subset, estimate full-training performance")
    print("  - Notable: NASNet, EfficientNet, ENAS (efficient NAS)")

def ex46():
    """Network pruning concept"""
    rng = np.random.default_rng(0)
    W = rng.standard_normal((8, 8))
    threshold = 0.5
    pruned_W = W * (np.abs(W) > threshold).astype(float)
    sparsity = (pruned_W == 0).mean()
    print(f"Ex46 — Network Pruning:")
    print(f"  Original W nonzeros: {(W != 0).sum()}, Pruned W nonzeros: {(pruned_W != 0).sum()}")
    print(f"  Sparsity: {sparsity:.2%}")
    print(f"  Strategies: magnitude pruning, structured pruning, lottery ticket")

def ex47():
    """Knowledge distillation (soft targets)"""
    rng = np.random.default_rng(0)
    n, n_classes = 100, 3
    def softmax_T(logits, T):
        z = logits / T; z -= z.max(axis=1, keepdims=True)
        e = np.exp(z); return e / e.sum(axis=1, keepdims=True)
    teacher_logits = rng.standard_normal((n, n_classes)) * 3
    student_logits = rng.standard_normal((n, n_classes))
    T = 4.0
    soft_targets = softmax_T(teacher_logits, T)
    soft_preds = softmax_T(student_logits, T)
    distill_loss = -np.mean(np.sum(soft_targets * np.log(soft_preds + 1e-7), axis=1)) * T**2
    print(f"Ex47 — Knowledge Distillation: T={T}, distill_loss={distill_loss:.4f}")
    print(f"  Soft targets entropy: {-np.sum(soft_targets * np.log(soft_targets + 1e-7), axis=1).mean():.4f}")

def ex48():
    """Quantization-aware training concept"""
    rng = np.random.default_rng(0)
    W = rng.standard_normal((4, 4)).astype(np.float32)
    def quantize_int8(w):
        scale = w.max() / 127.0
        w_int8 = np.clip(np.round(w / scale), -128, 127).astype(np.int8)
        return w_int8, scale
    def dequantize(w_int8, scale):
        return w_int8.astype(np.float32) * scale
    W_int8, scale = quantize_int8(W)
    W_deq = dequantize(W_int8, scale)
    quant_error = np.abs(W - W_deq).mean()
    print(f"Ex48 — Quantization: scale={scale:.4f}, mean quant error={quant_error:.6f}")
    print(f"  float32 size: {W.nbytes}B → int8 size: {W_int8.nbytes}B (4x compression)")

def ex49():
    """Neural network interpretability (gradient x input)"""
    X, y = make_classification(n_samples=200, n_features=6, random_state=0)
    X_sc = StandardScaler().fit_transform(X)
    X_tr, X_te, y_tr, y_te = train_test_split(X_sc, y, test_size=0.2, random_state=0)
    mlp = MLPClassifier(hidden_layer_sizes=(16, 8), max_iter=500, random_state=0).fit(X_tr, y_tr)
    eps = 1e-4
    sample = X_te[0:1]
    base_prob = mlp.predict_proba(sample)[0, 1]
    saliency = np.zeros(X_te.shape[1])
    for i in range(X_te.shape[1]):
        x_plus = sample.copy(); x_plus[0, i] += eps
        saliency[i] = (mlp.predict_proba(x_plus)[0, 1] - base_prob) / eps
    saliency = saliency * sample[0]
    print(f"Ex49 — Gradient x Input saliency: {np.round(saliency, 4)}")
    print(f"  Top feature: {np.argmax(np.abs(saliency))}")

def ex50():
    """Production neural network deployment"""
    print("Ex50 — Production Neural Network Deployment:")
    print("  1. Serialize model: joblib.dump / torch.save / tf.saved_model")
    print("  2. Containerize: Docker image with model + dependencies")
    print("  3. Serve via REST API: FastAPI/Flask with /predict endpoint")
    print("  4. Input validation: schema check, dtype enforcement, range checks")
    print("  5. Output validation: probability sum=1, clamp to [0,1]")
    print("  6. Preprocessing in service: same scaler as training (save with model)")
    print("  7. Monitoring: prediction latency, input drift, output distribution")
    print("  8. Canary deployment: route 5% traffic to new model first")
    print("  9. A/B testing: compare new vs old model on live traffic metrics")
    print(" 10. Rollback: keep previous model version; auto-revert on error spike")


def main():
    print("=" * 60)
    print("Examples 3.4 — Neural Networks from Scratch")
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
