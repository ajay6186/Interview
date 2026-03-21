# ============================================================
# Examples 2.1 — Neural Networks from Scratch (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from sklearn.datasets import make_moons, make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, accuracy_score

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Sigmoid activation function"""
    def sigmoid(x):
        return 1 / (1 + np.exp(-x))
    vals = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    result = np.round(sigmoid(vals), 4)
    print("Ex01 — Sigmoid:", result)

def ex02():
    """ReLU activation function"""
    def relu(x):
        return np.maximum(0, x)
    vals = np.array([-3.0, -1.0, 0.0, 1.0, 3.0])
    result = relu(vals)
    print("Ex02 — ReLU:", result)

def ex03():
    """Tanh activation function"""
    def tanh(x):
        return np.tanh(x)
    vals = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    result = np.round(tanh(vals), 4)
    print("Ex03 — Tanh:", result)

def ex04():
    """Softmax activation function"""
    def softmax(x):
        e_x = np.exp(x - np.max(x))
        return e_x / e_x.sum()
    logits = np.array([2.0, 1.0, 0.5])
    result = np.round(softmax(logits), 4)
    print("Ex04 — Softmax:", result, "| Sum:", round(result.sum(), 4))

def ex05():
    """Linear neuron output (weighted sum)"""
    inputs = np.array([1.0, 2.0, 3.0])
    weights = np.array([0.5, -0.3, 0.8])
    bias = 0.1
    output = np.dot(inputs, weights) + bias
    print("Ex05 — Linear neuron output:", round(output, 4))

def ex06():
    """Single neuron with bias and sigmoid activation"""
    def sigmoid(x):
        return 1 / (1 + np.exp(-x))
    x = np.array([0.5, 0.8])
    w = np.array([0.4, -0.6])
    b = 0.2
    z = np.dot(x, w) + b
    a = sigmoid(z)
    print("Ex06 — Neuron output (sigmoid):", round(a, 4))

def ex07():
    """Layer forward pass with numpy"""
    X = np.array([[1.0, 2.0], [3.0, 4.0]])     # 2 samples, 2 features
    W = np.array([[0.1, 0.3], [0.5, 0.2]])       # 2 inputs → 2 neurons
    b = np.array([0.1, -0.1])
    Z = X @ W + b
    A = np.tanh(Z)
    print("Ex07 — Layer output shape:", A.shape, "| Values:\n", np.round(A, 4))

def ex08():
    """2-layer network output"""
    def sigmoid(x): return 1 / (1 + np.exp(-x))
    X = np.array([[1.0, 2.0]])
    W1 = np.random.seed(0) or np.array([[0.5, -0.4], [0.3, 0.6]])
    b1 = np.array([0.1, 0.0])
    W2 = np.array([[0.7], [-0.5]])
    b2 = np.array([0.2])
    A1 = sigmoid(X @ W1 + b1)
    A2 = sigmoid(A1 @ W2 + b2)
    print("Ex08 — 2-layer output:", np.round(A2, 4))

def ex09():
    """Weight initialization (random normal)"""
    np.random.seed(42)
    W = np.random.randn(4, 3) * 0.01
    print("Ex09 — Random weights shape:", W.shape, "| Mean:", round(W.mean(), 6), "| Std:", round(W.std(), 6))

def ex10():
    """Mean Squared Error loss"""
    def mse(y_true, y_pred):
        return np.mean((y_true - y_pred) ** 2)
    y_true = np.array([1.0, 0.0, 1.0, 0.0])
    y_pred = np.array([0.9, 0.1, 0.8, 0.2])
    result = mse(y_true, y_pred)
    print("Ex10 — MSE Loss:", round(result, 4))

def ex11():
    """Cross-entropy loss (multi-class)"""
    def cross_entropy(y_true, y_pred):
        y_pred = np.clip(y_pred, 1e-9, 1.0)
        return -np.sum(y_true * np.log(y_pred))
    y_true = np.array([0.0, 1.0, 0.0])
    y_pred = np.array([0.1, 0.8, 0.1])
    result = cross_entropy(y_true, y_pred)
    print("Ex11 — Cross-Entropy Loss:", round(result, 4))

def ex12():
    """Binary cross-entropy loss"""
    def bce(y_true, y_pred):
        y_pred = np.clip(y_pred, 1e-9, 1 - 1e-9)
        return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))
    y_true = np.array([1.0, 0.0, 1.0, 1.0])
    y_pred = np.array([0.9, 0.1, 0.8, 0.7])
    result = bce(y_true, y_pred)
    print("Ex12 — Binary Cross-Entropy:", round(result, 4))

def ex13():
    """Mean Absolute Error loss"""
    def mae(y_true, y_pred):
        return np.mean(np.abs(y_true - y_pred))
    y_true = np.array([3.0, -0.5, 2.0, 7.0])
    y_pred = np.array([2.5, 0.0, 2.0, 8.0])
    result = mae(y_true, y_pred)
    print("Ex13 — MAE Loss:", round(result, 4))

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Backprop gradient for single neuron"""
    def sigmoid(x): return 1 / (1 + np.exp(-x))
    def sigmoid_deriv(x): s = sigmoid(x); return s * (1 - s)
    x, w, b = 1.5, 0.8, 0.1
    z = x * w + b
    y_pred = sigmoid(z)
    y_true = 1.0
    dL_da = y_pred - y_true
    da_dz = sigmoid_deriv(z)
    dz_dw = x
    dL_dw = dL_da * da_dz * dz_dw
    print("Ex14 — Backprop dL/dw:", round(dL_dw, 6))

def ex15():
    """Chain rule example"""
    # f(x) = sigmoid(relu(wx + b))
    def relu(x): return max(0.0, x)
    def relu_deriv(x): return 1.0 if x > 0 else 0.0
    def sigmoid(x): return 1 / (1 + np.exp(-x))
    def sigmoid_deriv(x): s = sigmoid(x); return s * (1 - s)
    x, w, b = 2.0, 0.5, -0.3
    z1 = w * x + b
    a1 = relu(z1)
    out = sigmoid(a1)
    grad = sigmoid_deriv(a1) * relu_deriv(z1) * x
    print("Ex15 — Chain rule df/dw:", round(grad, 6))

def ex16():
    """Gradient descent weight update"""
    np.random.seed(0)
    w = 0.5
    learning_rate = 0.1
    gradients = [0.3, 0.25, 0.18, 0.12, 0.06]
    for i, g in enumerate(gradients):
        w = w - learning_rate * g
    print("Ex16 — GD weight after 5 steps:", round(w, 4))

def ex17():
    """Mini-batch gradient descent step"""
    np.random.seed(42)
    X = np.random.randn(100, 3)
    y = np.random.randn(100, 1)
    w = np.zeros((3, 1))
    batch_size = 16
    lr = 0.01
    batch_X, batch_y = X[:batch_size], y[:batch_size]
    pred = batch_X @ w
    loss = np.mean((pred - batch_y) ** 2)
    grad = (2 / batch_size) * batch_X.T @ (pred - batch_y)
    w -= lr * grad
    print("Ex17 — Mini-batch loss:", round(loss, 4), "| w norm:", round(np.linalg.norm(w), 6))

def ex18():
    """Momentum update"""
    w = np.array([1.0, -0.5])
    v = np.zeros(2)
    grad = np.array([0.3, -0.1])
    lr, beta = 0.01, 0.9
    for _ in range(5):
        v = beta * v + (1 - beta) * grad
        w = w - lr * v
    print("Ex18 — Momentum w:", np.round(w, 4))

def ex19():
    """RMSprop update"""
    w = np.array([1.0, -0.5])
    s = np.zeros(2)
    grad = np.array([0.3, -0.1])
    lr, beta, eps = 0.01, 0.9, 1e-8
    for _ in range(5):
        s = beta * s + (1 - beta) * grad ** 2
        w = w - lr * grad / (np.sqrt(s) + eps)
    print("Ex19 — RMSprop w:", np.round(w, 4))

def ex20():
    """Adam optimizer update"""
    w = np.array([1.0, -0.5])
    m, v = np.zeros(2), np.zeros(2)
    grad = np.array([0.3, -0.1])
    lr, b1, b2, eps = 0.001, 0.9, 0.999, 1e-8
    for t in range(1, 6):
        m = b1 * m + (1 - b1) * grad
        v = b2 * v + (1 - b2) * grad ** 2
        m_hat = m / (1 - b1 ** t)
        v_hat = v / (1 - b2 ** t)
        w = w - lr * m_hat / (np.sqrt(v_hat) + eps)
    print("Ex20 — Adam w:", np.round(w, 4))

def ex21():
    """Xavier weight initialization"""
    np.random.seed(42)
    fan_in, fan_out = 4, 6
    limit = np.sqrt(6 / (fan_in + fan_out))
    W = np.random.uniform(-limit, limit, (fan_in, fan_out))
    print("Ex21 — Xavier init | shape:", W.shape, "| std:", round(W.std(), 4))

def ex22():
    """He (Kaiming) weight initialization"""
    np.random.seed(42)
    fan_in = 4
    std = np.sqrt(2 / fan_in)
    W = np.random.randn(fan_in, 8) * std
    print("Ex22 — He init | shape:", W.shape, "| std:", round(W.std(), 4))

def ex23():
    """L1 regularization gradient"""
    w = np.array([0.5, -0.3, 0.0, 0.8])
    lam = 0.01
    grad_l1 = lam * np.sign(w)
    print("Ex23 — L1 reg gradient:", grad_l1)

def ex24():
    """L2 regularization gradient"""
    w = np.array([0.5, -0.3, 0.0, 0.8])
    lam = 0.01
    grad_l2 = lam * w
    print("Ex24 — L2 reg gradient:", np.round(grad_l2, 4))

def ex25():
    """Dropout mask (numpy simulation)"""
    np.random.seed(7)
    A = np.array([0.5, 1.2, -0.3, 0.8, 0.9, -0.6])
    keep_prob = 0.7
    mask = (np.random.rand(*A.shape) < keep_prob).astype(float)
    A_drop = (A * mask) / keep_prob
    print("Ex25 — Dropout mask:", mask, "| Output:", np.round(A_drop, 3))

def ex26():
    """Batch normalization forward pass"""
    np.random.seed(0)
    X = np.random.randn(4, 3)
    eps = 1e-8
    mu = X.mean(axis=0)
    var = X.var(axis=0)
    X_norm = (X - mu) / np.sqrt(var + eps)
    gamma, beta = np.ones(3), np.zeros(3)
    out = gamma * X_norm + beta
    print("Ex26 — BatchNorm mean:", np.round(out.mean(axis=0), 4), "| std:", np.round(out.std(axis=0), 4))

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Full NeuralNet class (numpy, 2 layers)"""
    class NeuralNet:
        def __init__(self, n_in, n_hidden, n_out):
            np.random.seed(42)
            self.W1 = np.random.randn(n_in, n_hidden) * 0.1
            self.b1 = np.zeros(n_hidden)
            self.W2 = np.random.randn(n_hidden, n_out) * 0.1
            self.b2 = np.zeros(n_out)

        def sigmoid(self, x): return 1 / (1 + np.exp(-x))

        def forward(self, X):
            self.z1 = X @ self.W1 + self.b1
            self.a1 = self.sigmoid(self.z1)
            self.z2 = self.a1 @ self.W2 + self.b2
            self.a2 = self.sigmoid(self.z2)
            return self.a2

    nn = NeuralNet(2, 4, 1)
    X = np.array([[0.5, -0.3], [1.0, 0.2]])
    out = nn.forward(X)
    print("Ex27 — NeuralNet forward:", np.round(out, 4))

def ex28():
    """NeuralNet with training loop"""
    class NeuralNet:
        def __init__(self, n_in, n_hidden, n_out, lr=0.1):
            np.random.seed(1)
            self.W1 = np.random.randn(n_in, n_hidden) * 0.5
            self.b1 = np.zeros(n_hidden)
            self.W2 = np.random.randn(n_hidden, n_out) * 0.5
            self.b2 = np.zeros(n_out)
            self.lr = lr

        def sigmoid(self, x): return 1 / (1 + np.exp(-x))
        def sig_d(self, x): s = self.sigmoid(x); return s * (1 - s)

        def forward(self, X):
            self.X = X
            self.z1 = X @ self.W1 + self.b1
            self.a1 = self.sigmoid(self.z1)
            self.z2 = self.a1 @ self.W2 + self.b2
            self.a2 = self.sigmoid(self.z2)
            return self.a2

        def backward(self, y):
            m = y.shape[0]
            d2 = (self.a2 - y) * self.sig_d(self.z2)
            dW2 = self.a1.T @ d2 / m
            db2 = d2.mean(axis=0)
            d1 = (d2 @ self.W2.T) * self.sig_d(self.z1)
            dW1 = self.X.T @ d1 / m
            db1 = d1.mean(axis=0)
            self.W1 -= self.lr * dW1; self.b1 -= self.lr * db1
            self.W2 -= self.lr * dW2; self.b2 -= self.lr * db2

        def loss(self, y_pred, y):
            return np.mean((y_pred - y) ** 2)

    X = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)
    y = np.array([[0],[0],[0],[1]], dtype=float)
    nn = NeuralNet(2, 4, 1, lr=0.5)
    for _ in range(500):
        pred = nn.forward(X)
        nn.backward(y)
    final_loss = nn.loss(nn.forward(X), y)
    print("Ex28 — After 500 epochs, loss:", round(final_loss, 4))

def ex29():
    """Train XOR problem"""
    class MLP:
        def __init__(self):
            np.random.seed(3)
            self.W1 = np.random.randn(2, 4)
            self.b1 = np.zeros(4)
            self.W2 = np.random.randn(4, 1)
            self.b2 = np.zeros(1)

        def sig(self, x): return 1 / (1 + np.exp(-x))
        def sig_d(self, x): s = self.sig(x); return s * (1 - s)

        def forward(self, X):
            self.X = X
            self.z1 = X @ self.W1 + self.b1
            self.a1 = self.sig(self.z1)
            self.z2 = self.a1 @ self.W2 + self.b2
            self.a2 = self.sig(self.z2)
            return self.a2

        def backward(self, y, lr=1.0):
            m = y.shape[0]
            d2 = (self.a2 - y) * self.sig_d(self.z2)
            dW2 = self.a1.T @ d2 / m; db2 = d2.mean(0)
            d1 = (d2 @ self.W2.T) * self.sig_d(self.z1)
            dW1 = self.X.T @ d1 / m; db1 = d1.mean(0)
            self.W1 -= lr * dW1; self.b1 -= lr * db1
            self.W2 -= lr * dW2; self.b2 -= lr * db2

    X = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=float)
    y = np.array([[0],[1],[1],[0]], dtype=float)
    net = MLP()
    for _ in range(10000):
        net.forward(X); net.backward(y, lr=1.0)
    preds = (net.forward(X) > 0.5).astype(int)
    print("Ex29 — XOR predictions:", preds.T, "| Expected: [0,1,1,0]")

def ex30():
    """Train on sklearn moons dataset"""
    class MLP:
        def __init__(self):
            np.random.seed(0)
            self.W1 = np.random.randn(2, 8) * 0.5
            self.b1 = np.zeros(8)
            self.W2 = np.random.randn(8, 1) * 0.5
            self.b2 = np.zeros(1)
        def sig(self, x): return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
        def forward(self, X):
            self.X = X; self.z1 = X @ self.W1 + self.b1
            self.a1 = self.sig(self.z1); self.z2 = self.a1 @ self.W2 + self.b2
            self.a2 = self.sig(self.z2); return self.a2
        def step(self, y, lr=0.05):
            m = y.shape[0]; sig_d = lambda x: self.sig(x) * (1 - self.sig(x))
            d2 = (self.a2 - y) * sig_d(self.z2); dW2 = self.a1.T @ d2 / m; db2 = d2.mean(0)
            d1 = (d2 @ self.W2.T) * sig_d(self.z1); dW1 = self.X.T @ d1 / m; db1 = d1.mean(0)
            self.W1 -= lr * dW1; self.b1 -= lr * db1; self.W2 -= lr * dW2; self.b2 -= lr * db2

    X, y = make_moons(n_samples=200, noise=0.2, random_state=42)
    y = y.reshape(-1, 1).astype(float)
    net = MLP()
    for _ in range(1000): net.forward(X); net.step(y)
    preds = (net.forward(X) > 0.5).astype(int)
    acc = (preds == y.astype(int)).mean()
    print("Ex30 — Moons accuracy:", round(acc, 4))

def ex31():
    """Train + validation loss tracking"""
    np.random.seed(42)
    X, y = make_classification(n_samples=300, n_features=4, random_state=42)
    X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=0)
    y_tr = y_tr.reshape(-1, 1).astype(float)
    y_val = y_val.reshape(-1, 1).astype(float)

    def sig(x): return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    np.random.seed(0)
    W1 = np.random.randn(4, 6) * 0.5; b1 = np.zeros(6)
    W2 = np.random.randn(6, 1) * 0.5; b2 = np.zeros(1)

    train_losses, val_losses = [], []
    for epoch in range(200):
        z1 = X_tr @ W1 + b1; a1 = sig(z1); z2 = a1 @ W2 + b2; a2 = sig(z2)
        tl = np.mean((a2 - y_tr) ** 2); train_losses.append(tl)
        z1v = X_val @ W1 + b1; a1v = sig(z1v); z2v = a1v @ W2 + b2; a2v = sig(z2v)
        vl = np.mean((a2v - y_val) ** 2); val_losses.append(vl)
        d2 = (a2 - y_tr) * a2 * (1 - a2); dW2 = a1.T @ d2 / len(y_tr); db2 = d2.mean(0)
        d1 = (d2 @ W2.T) * a1 * (1 - a1); dW1 = X_tr.T @ d1 / len(y_tr); db1 = d1.mean(0)
        W1 -= 0.1 * dW1; b1 -= 0.1 * db1; W2 -= 0.1 * dW2; b2 -= 0.1 * db2

    print("Ex31 — Train loss: {:.4f} | Val loss: {:.4f}".format(train_losses[-1], val_losses[-1]))

def ex32():
    """Early stopping implementation"""
    np.random.seed(42)
    X, y = make_classification(n_samples=300, n_features=4, random_state=42)
    X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2)
    y_tr = y_tr.reshape(-1, 1).astype(float)
    y_val = y_val.reshape(-1, 1).astype(float)
    def sig(x): return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    np.random.seed(1)
    W1 = np.random.randn(4, 6) * 0.5; b1 = np.zeros(6)
    W2 = np.random.randn(6, 1) * 0.5; b2 = np.zeros(1)

    best_val, patience, wait, stop_epoch = np.inf, 15, 0, 0
    for epoch in range(1, 501):
        z1 = X_tr @ W1 + b1; a1 = sig(z1); z2 = a1 @ W2 + b2; a2 = sig(z2)
        d2 = (a2 - y_tr) * a2 * (1-a2); dW2 = a1.T @ d2 / len(y_tr); db2 = d2.mean(0)
        d1 = (d2 @ W2.T) * a1 * (1-a1); dW1 = X_tr.T @ d1 / len(y_tr); db1 = d1.mean(0)
        W1 -= 0.1 * dW1; b1 -= 0.1 * db1; W2 -= 0.1 * dW2; b2 -= 0.1 * db2
        vl = np.mean((sig(sig(X_val @ W1 + b1) @ W2 + b2) - y_val) ** 2)
        if vl < best_val - 1e-4:
            best_val = vl; wait = 0; stop_epoch = epoch
        else:
            wait += 1
        if wait >= patience:
            break
    print("Ex32 — Early stopping at epoch:", stop_epoch, "| Best val loss:", round(best_val, 4))

def ex33():
    """Learning rate scheduler (step decay)"""
    initial_lr = 0.1
    decay_factor = 0.5
    step_size = 10
    losses = []
    np.random.seed(5)
    w = np.random.randn(4)
    grad = np.random.randn(4) * 0.3
    for epoch in range(1, 31):
        lr = initial_lr * (decay_factor ** (epoch // step_size))
        w = w - lr * grad
        loss = np.sum(w ** 2)
        losses.append(loss)
    print("Ex33 — LR scheduler | Epoch 10 loss:", round(losses[9], 4), "| Epoch 30 loss:", round(losses[29], 4))

def ex34():
    """Mini-batch DataLoader simulation"""
    np.random.seed(42)
    X = np.random.randn(100, 4)
    y = np.random.randint(0, 2, 100)
    batch_size = 16

    def mini_batches(X, y, batch_size, shuffle=True):
        indices = np.arange(len(X))
        if shuffle: np.random.shuffle(indices)
        for start in range(0, len(X), batch_size):
            idx = indices[start:start + batch_size]
            yield X[idx], y[idx]

    batch_count = 0
    for bx, by in mini_batches(X, y, batch_size):
        batch_count += 1
    print("Ex34 — Total batches:", batch_count, "| Last batch size:", len(bx))

def ex35():
    """Full training + evaluation pipeline"""
    np.random.seed(42)
    X, y = make_moons(n_samples=400, noise=0.2, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)
    y_tr = y_tr.reshape(-1, 1).astype(float)
    y_te = y_te.reshape(-1, 1).astype(float)
    def sig(x): return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    np.random.seed(0)
    W1 = np.random.randn(2, 8) * 0.3; b1 = np.zeros(8)
    W2 = np.random.randn(8, 1) * 0.3; b2 = np.zeros(1)
    for _ in range(1000):
        z1 = X_tr @ W1 + b1; a1 = sig(z1); z2 = a1 @ W2 + b2; a2 = sig(z2)
        d2 = (a2 - y_tr) * a2*(1-a2); dW2 = a1.T @ d2 / len(y_tr); db2 = d2.mean(0)
        d1 = (d2 @ W2.T) * a1*(1-a1); dW1 = X_tr.T @ d1 / len(y_tr); db1 = d1.mean(0)
        W1 -= 0.1*dW1; b1 -= 0.1*db1; W2 -= 0.1*dW2; b2 -= 0.1*db2
    z1t = X_te @ W1 + b1; a1t = sig(z1t); z2t = a1t @ W2 + b2; a2t = sig(z2t)
    acc = ((a2t > 0.5).astype(int) == y_te.astype(int)).mean()
    print("Ex35 — Test accuracy:", round(acc, 4))

def ex36():
    """Confusion matrix from neural net predictions"""
    np.random.seed(42)
    y_true = np.array([0,1,1,0,1,0,1,1,0,0])
    y_pred = np.array([0,1,1,0,0,0,1,1,1,0])
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    print("Ex36 — Confusion Matrix: TP={}, TN={}, FP={}, FN={}".format(tp, tn, fp, fn))

def ex37():
    """Hyperparameter tuning loop"""
    from sklearn.neural_network import MLPClassifier
    X, y = make_moons(n_samples=300, noise=0.2, random_state=42)
    X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, random_state=0)
    best_acc, best_lr = 0, 0
    for lr in [0.001, 0.01, 0.05, 0.1]:
        clf = MLPClassifier(hidden_layer_sizes=(16,), learning_rate_init=lr, max_iter=200, random_state=0)
        clf.fit(X_tr, y_tr)
        acc = clf.score(X_val, y_val)
        if acc > best_acc: best_acc, best_lr = acc, lr
    print("Ex37 — Best LR:", best_lr, "| Best val acc:", round(best_acc, 4))

def ex38():
    """Overfitting demo (small dataset)"""
    from sklearn.neural_network import MLPClassifier
    np.random.seed(42)
    X, y = make_moons(n_samples=400, noise=0.25, random_state=42)
    X_small, _, y_small, _ = train_test_split(X, y, train_size=20, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0)

    clf = MLPClassifier(hidden_layer_sizes=(32, 32), max_iter=500, random_state=0)
    clf.fit(X_small, y_small)
    train_acc = clf.score(X_small, y_small)
    test_acc = clf.score(X_te, y_te)
    print("Ex38 — Overfit demo | Train acc:", round(train_acc, 4), "| Test acc:", round(test_acc, 4))

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Numpy 1D convolution (CNN concept)"""
    signal = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 4.0, 3.0])
    kernel = np.array([1.0, 0.0, -1.0])
    result = np.convolve(signal, kernel, mode='valid')
    print("Ex39 — 1D Conv output:", np.round(result, 3))

def ex40():
    """LSTM cell forward pass (numpy)"""
    np.random.seed(0)
    input_size, hidden_size = 3, 4
    x = np.random.randn(input_size)
    h_prev = np.zeros(hidden_size)
    c_prev = np.zeros(hidden_size)
    concat = np.concatenate([h_prev, x])
    Wf = np.random.randn(hidden_size, input_size + hidden_size) * 0.1
    Wi = np.random.randn(hidden_size, input_size + hidden_size) * 0.1
    Wg = np.random.randn(hidden_size, input_size + hidden_size) * 0.1
    Wo = np.random.randn(hidden_size, input_size + hidden_size) * 0.1
    sig = lambda x: 1 / (1 + np.exp(-x))
    f = sig(Wf @ concat); i = sig(Wi @ concat)
    g = np.tanh(Wg @ concat); o = sig(Wo @ concat)
    c_new = f * c_prev + i * g
    h_new = o * np.tanh(c_new)
    print("Ex40 — LSTM h_new:", np.round(h_new, 4))

def ex41():
    """Scaled dot-product attention (numpy)"""
    np.random.seed(0)
    seq_len, d_k = 4, 8
    Q = np.random.randn(seq_len, d_k)
    K = np.random.randn(seq_len, d_k)
    V = np.random.randn(seq_len, d_k)
    scores = Q @ K.T / np.sqrt(d_k)
    def softmax(x): e = np.exp(x - x.max(axis=-1, keepdims=True)); return e / e.sum(axis=-1, keepdims=True)
    weights = softmax(scores)
    output = weights @ V
    print("Ex41 — Attention output shape:", output.shape, "| Weights sum:", np.round(weights.sum(axis=1), 2))

def ex42():
    """Residual connection concept"""
    np.random.seed(42)
    X = np.random.randn(4, 8)
    W = np.random.randn(8, 8) * 0.1
    b = np.zeros(8)
    def relu(x): return np.maximum(0, x)
    F_x = relu(X @ W + b)
    out = X + F_x
    print("Ex42 — Residual output shape:", out.shape, "| Residual enabled: X + F(X)")

def ex43():
    """Gradient clipping"""
    np.random.seed(0)
    gradients = np.random.randn(5) * 50
    max_norm = 1.0
    norm = np.linalg.norm(gradients)
    clipped = gradients * (max_norm / max(norm, max_norm))
    print("Ex43 — Grad norm before:", round(norm, 4), "| After clip:", round(np.linalg.norm(clipped), 4))

def ex44():
    """Gradient explosion demo"""
    w = 1.0
    for layer in range(20):
        w = w * 2.0
    print("Ex44 — Gradient explosion: value after 20 multiplications by 2:", w)

def ex45():
    """Vanishing gradient demo"""
    w = 1.0
    for layer in range(20):
        w = w * 0.5
    print("Ex45 — Vanishing gradient: value after 20 multiplications by 0.5:", round(w, 8))

def ex46():
    """Batch norm vs layer norm comparison"""
    np.random.seed(0)
    X = np.random.randn(4, 6)
    eps = 1e-8
    batch_norm = (X - X.mean(axis=0)) / (X.std(axis=0) + eps)
    layer_norm = (X - X.mean(axis=1, keepdims=True)) / (X.std(axis=1, keepdims=True) + eps)
    print("Ex46 — BatchNorm std (col mean):", round(batch_norm.std(axis=0).mean(), 4))
    print("       LayerNorm std (row mean): ", round(layer_norm.std(axis=1).mean(), 4))

def ex47():
    """Custom Swish activation"""
    def swish(x, beta=1.0):
        return x * (1 / (1 + np.exp(-beta * x)))
    vals = np.array([-3.0, -1.0, 0.0, 1.0, 3.0])
    result = np.round(swish(vals), 4)
    print("Ex47 — Swish activation:", result)

def ex48():
    """Neural net with skip connections (numpy)"""
    np.random.seed(42)
    X = np.random.randn(5, 4)
    def relu(x): return np.maximum(0, x)
    W1 = np.random.randn(4, 4) * 0.1; b1 = np.zeros(4)
    W2 = np.random.randn(4, 4) * 0.1; b2 = np.zeros(4)
    h1 = relu(X @ W1 + b1)
    h2 = relu(h1 @ W2 + b2)
    out = h2 + X
    print("Ex48 — Skip connection output shape:", out.shape, "| Sample row:", np.round(out[0], 4))

def ex49():
    """Production inference wrapper class"""
    class ProductionModel:
        def __init__(self, weights):
            self.W1, self.b1, self.W2, self.b2 = weights
            self.call_count = 0

        def _sig(self, x): return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

        def predict(self, X):
            self.call_count += 1
            X = np.atleast_2d(X)
            a1 = self._sig(X @ self.W1 + self.b1)
            a2 = self._sig(a1 @ self.W2 + self.b2)
            return (a2 > 0.5).astype(int)

        def stats(self):
            return {"calls": self.call_count}

    np.random.seed(0)
    weights = (np.random.randn(2, 4)*0.1, np.zeros(4), np.random.randn(4, 1)*0.1, np.zeros(1))
    model = ProductionModel(weights)
    preds = model.predict(np.array([[0.5, -0.3], [1.0, 0.2]]))
    print("Ex49 — Production model preds:", preds.T, "| Stats:", model.stats())

def ex50():
    """MC Dropout uncertainty estimation concept"""
    np.random.seed(42)
    X_test = np.random.randn(1, 2)
    def sig(x): return 1 / (1 + np.exp(-x))
    def forward_with_dropout(X, W1, b1, W2, b2, keep=0.7):
        mask = (np.random.rand(*W1.shape[1:]) < keep) / keep
        z1 = X @ W1 + b1; a1 = sig(z1) * mask
        z2 = a1 @ W2 + b2; return sig(z2)
    np.random.seed(5)
    W1 = np.random.randn(2, 4); b1 = np.zeros(4)
    W2 = np.random.randn(4, 1); b2 = np.zeros(1)
    mc_preds = np.array([forward_with_dropout(X_test, W1, b1, W2, b2) for _ in range(100)])
    mean_pred = mc_preds.mean(); uncertainty = mc_preds.std()
    print("Ex50 — MC Dropout | Mean pred:", round(float(mean_pred), 4), "| Uncertainty:", round(float(uncertainty), 4))


def main():
    print("=" * 60)
    print("Examples 2.1 — Neural Networks from Scratch")
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
