# ============================================================
# Solution 3.4 — Neural Networks from Scratch
# ============================================================

import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

np.random.seed(42)

X_xor = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
y_xor = np.array([0, 1, 1, 0], dtype=float)

X_cls, y_cls = make_classification(n_samples=200, n_features=4,
                                    n_classes=2, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X_cls, y_cls,
                                                     test_size=0.2,
                                                     random_state=42)


# ---------------------------------------------------------------------------
# Solution 1: Sigmoid
# ---------------------------------------------------------------------------

def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-np.clip(z, -500, 500)))


# ---------------------------------------------------------------------------
# Solution 2: ReLU
# ---------------------------------------------------------------------------

def relu(z: np.ndarray) -> np.ndarray:
    return np.maximum(0, z)


# ---------------------------------------------------------------------------
# Solution 3: Tanh
# ---------------------------------------------------------------------------

def tanh(z: np.ndarray) -> np.ndarray:
    return np.tanh(z)


# ---------------------------------------------------------------------------
# Solution 4: Softmax
# ---------------------------------------------------------------------------

def softmax(z: np.ndarray) -> np.ndarray:
    e = np.exp(z - np.max(z))
    return e / e.sum()


# ---------------------------------------------------------------------------
# Solution 5: Forward Single Layer
# ---------------------------------------------------------------------------

def forward_single_layer(W: np.ndarray, x: np.ndarray,
                          b: np.ndarray) -> np.ndarray:
    return sigmoid(W @ x + b)


# ---------------------------------------------------------------------------
# Solution 6: Forward 2-Layer MLP
# ---------------------------------------------------------------------------

def forward_mlp(W1, b1, W2, b2, x: np.ndarray):
    z1 = W1 @ x + b1
    a1 = sigmoid(z1)
    z2 = W2 @ a1 + b2
    a2 = sigmoid(z2)
    return a1, a2


# ---------------------------------------------------------------------------
# Solution 7: MSE Loss
# ---------------------------------------------------------------------------

def mse_loss(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean((y_pred - y_true) ** 2))


# ---------------------------------------------------------------------------
# Solution 8: Binary Cross-Entropy
# ---------------------------------------------------------------------------

def binary_cross_entropy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    p = np.clip(y_pred, 1e-15, 1 - 1e-15)
    return float(-np.mean(y_true * np.log(p) + (1 - y_true) * np.log(1 - p)))


# ---------------------------------------------------------------------------
# Solution 9: Categorical Cross-Entropy
# ---------------------------------------------------------------------------

def categorical_cross_entropy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    p = np.clip(y_pred, 1e-15, 1 - 1e-15)
    return float(-np.mean(np.sum(y_true * np.log(p), axis=1)))


# ---------------------------------------------------------------------------
# Solution 10: Output Layer Gradient
# ---------------------------------------------------------------------------

def output_layer_grad(a2: float, y: float, a1: np.ndarray):
    delta2 = a2 - y                              # scalar
    dW2 = delta2 * a1.reshape(1, -1)             # (1, n_hidden)
    db2 = float(delta2)
    return dW2, db2


# ---------------------------------------------------------------------------
# Solution 11: Hidden Layer Gradient
# ---------------------------------------------------------------------------

def hidden_layer_grad(delta2: np.ndarray, W2: np.ndarray,
                       a1: np.ndarray, x: np.ndarray):
    delta1 = (W2.T @ delta2) * (a1 * (1 - a1))  # (n_hidden,)
    dW1 = np.outer(delta1, x)                    # (n_hidden, n_in)
    db1 = delta1
    return dW1, db1


# ---------------------------------------------------------------------------
# Solution 12: Weight Update
# ---------------------------------------------------------------------------

def weight_update(W: np.ndarray, dW: np.ndarray, lr: float = 0.1) -> np.ndarray:
    return W - lr * dW


# ---------------------------------------------------------------------------
# Solution 13: Full Training Loop
# ---------------------------------------------------------------------------

def train_mlp(X: np.ndarray, y: np.ndarray,
               n_hidden: int = 4, lr: float = 0.5,
               epochs: int = 1000):
    n_in = X.shape[1]
    rng = np.random.default_rng(42)
    W1 = rng.standard_normal((n_hidden, n_in)) * 0.1
    b1 = np.zeros(n_hidden)
    W2 = rng.standard_normal((1, n_hidden)) * 0.1
    b2 = np.zeros(1)

    for _ in range(epochs):
        for i in range(len(X)):
            x_i = X[i]
            y_i = y[i]

            # Forward
            a1, a2 = forward_mlp(W1, b1, W2, b2, x_i)

            # Backward
            delta2 = np.array([a2[0] - y_i])
            dW2 = np.outer(delta2, a1)
            db2 = delta2

            dW1, db1_grad = hidden_layer_grad(delta2, W2, a1, x_i)

            # Update
            W2 = weight_update(W2, dW2, lr)
            b2 = weight_update(b2, db2, lr)
            W1 = weight_update(W1, dW1, lr)
            b1 = weight_update(b1, db1_grad, lr)

    return W1, b1, W2, b2


# ---------------------------------------------------------------------------
# Solution 14: XOR
# ---------------------------------------------------------------------------

def train_xor():
    W1, b1, W2, b2 = train_mlp(X_xor, y_xor, n_hidden=4, lr=1.0, epochs=2000)
    print("XOR predictions:")
    for i, x in enumerate(X_xor):
        _, a2 = forward_mlp(W1, b1, W2, b2, x)
        pred = int(a2[0] >= 0.5)
        print(f"  input={x.astype(int).tolist()}, pred={pred}, true={int(y_xor[i])}")
    return W1, b1, W2, b2


# ---------------------------------------------------------------------------
# Solution 15: sklearn MLPClassifier
# ---------------------------------------------------------------------------

def sklearn_mlp(X_train, y_train, X_test, y_test):
    model = MLPClassifier(hidden_layer_sizes=(8,), max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    return model, model.score(X_test, y_test)


def main():
    print("=== Solution 3.4: Neural Networks from Scratch ===\n")

    z = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    print("Result 1 — sigmoid:", np.round(sigmoid(z), 4))
    print("Result 2 — relu:", relu(z))
    print("Result 3 — tanh:", np.round(tanh(z), 4))
    print("Result 4 — softmax:", np.round(softmax(np.array([1.0, 2.0, 3.0])), 4))

    np.random.seed(0)
    W = np.random.randn(3, 4)
    x = np.random.randn(4)
    b = np.zeros(3)
    print("Result 5 — single layer forward:", np.round(forward_single_layer(W, x, b), 4))

    W1 = np.random.randn(4, 2) * 0.5
    b1_v = np.zeros(4)
    W2 = np.random.randn(1, 4) * 0.5
    b2_v = np.zeros(1)
    a1, a2 = forward_mlp(W1, b1_v, W2, b2_v, X_xor[0])
    print("Result 6 — MLP forward a2:", np.round(a2, 4))

    y_true = np.array([1.0, 0.0, 1.0])
    y_pred = np.array([0.9, 0.1, 0.8])
    print("Result 7 — MSE:", round(mse_loss(y_true, y_pred), 6))
    print("Result 8 — BCE:", round(binary_cross_entropy(y_true, y_pred), 6))

    y_oh = np.array([[1, 0], [0, 1], [1, 0]], dtype=float)
    p_oh = np.array([[0.9, 0.1], [0.2, 0.8], [0.7, 0.3]])
    print("Result 9 — CCE:", round(categorical_cross_entropy(y_oh, p_oh), 6))

    a1_v = np.array([0.5, 0.3, 0.7, 0.2])
    dW2, db2 = output_layer_grad(0.8, 1.0, a1_v)
    print("Result 10 — dW2:", np.round(dW2, 4), "db2:", round(db2, 4))

    W2_v = np.array([[0.5, -0.3, 0.2, 0.8]])
    delta2_v = np.array([-0.2])
    x_v = np.array([1.0, 0.5])
    dW1, db1_g = hidden_layer_grad(delta2_v, W2_v, a1_v, x_v)
    print("Result 11 — dW1 shape:", dW1.shape, "| dW1:", np.round(dW1, 4))

    W_test = np.array([[1.0, 2.0], [3.0, 4.0]])
    dW_test = np.array([[0.1, 0.2], [0.3, 0.4]])
    print("Result 12 — Updated W:", weight_update(W_test, dW_test, lr=0.1))

    res13 = train_mlp(X_xor, y_xor, n_hidden=4, lr=0.5, epochs=1000)
    print("Result 13 — train_mlp weights W1 shape:", res13[0].shape)

    print("Result 14 — XOR training:")
    train_xor()

    _, acc15 = sklearn_mlp(X_train, y_train, X_test, y_test)
    print("Result 15 — sklearn MLP accuracy:", round(acc15, 4))


if __name__ == "__main__":
    main()
