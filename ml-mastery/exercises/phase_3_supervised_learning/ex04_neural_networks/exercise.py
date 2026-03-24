# ============================================================
# Exercise 3.4 — Neural Networks from Scratch
# ============================================================
# Topics:
#   • Activation functions: sigmoid, ReLU, tanh, softmax
#   • Forward pass: single layer and 2-layer MLP
#   • Loss functions: MSE, binary CE, categorical CE
#   • Backpropagation: output layer and hidden layer gradients
#   • Weight update (gradient descent)
#   • Full training loop
#   • XOR problem (2-layer MLP)
#   • sklearn MLPClassifier
# ============================================================

import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

np.random.seed(42)

# XOR dataset
X_xor = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
y_xor = np.array([0, 1, 1, 0], dtype=float)

# Classification dataset for sklearn comparison
X_cls, y_cls = make_classification(n_samples=200, n_features=4,
                                    n_classes=2, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X_cls, y_cls,
                                                     test_size=0.2,
                                                     random_state=42)


# ---------------------------------------------------------------------------
# TODO 1: Sigmoid Activation
# ---------------------------------------------------------------------------
# Return σ(z) = 1 / (1 + exp(-z)).
# Should work element-wise on numpy arrays.

def sigmoid(z: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: ReLU Activation
# ---------------------------------------------------------------------------
# Return max(0, z) element-wise.

def relu(z: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Tanh Activation
# ---------------------------------------------------------------------------
# Return tanh(z) element-wise (use np.tanh).

def tanh(z: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Softmax Function
# ---------------------------------------------------------------------------
# Given a 1-D array z, return softmax probabilities.
# Subtract max(z) for numerical stability.
# softmax(z)_i = exp(z_i - max(z)) / Σ exp(z_j - max(z))

def softmax(z: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Forward Pass — Single Layer
# ---------------------------------------------------------------------------
# Compute z = W @ x + b, then apply sigmoid.
# W: (n_out, n_in), x: (n_in,), b: (n_out,)
# Return the activated output a (shape: (n_out,)).

def forward_single_layer(W: np.ndarray, x: np.ndarray,
                          b: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: Forward Pass — 2-Layer MLP
# ---------------------------------------------------------------------------
# Layer 1: z1 = W1 @ x + b1,  a1 = sigmoid(z1)   (hidden layer)
# Layer 2: z2 = W2 @ a1 + b2, a2 = sigmoid(z2)   (output layer)
# Return (a1, a2) — activations of both layers.

def forward_mlp(W1, b1, W2, b2, x: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Mean Squared Error Loss
# ---------------------------------------------------------------------------
# MSE = (1/n) * Σ (y_pred_i - y_true_i)²
# Return a scalar.

def mse_loss(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Binary Cross-Entropy Loss
# ---------------------------------------------------------------------------
# BCE = -(1/n) * Σ [y_i * log(p_i) + (1-y_i) * log(1-p_i)]
# Clip p to [1e-15, 1-1e-15] to avoid log(0).
# Return a scalar.

def binary_cross_entropy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Categorical Cross-Entropy Loss
# ---------------------------------------------------------------------------
# CCE = -(1/n) * Σ_i Σ_k y_ik * log(p_ik)
# y_true: one-hot matrix (n, K), y_pred: probability matrix (n, K).
# Clip p to [1e-15, 1-1e-15].
# Return a scalar.

def categorical_cross_entropy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Backprop — Output Layer Gradient
# ---------------------------------------------------------------------------
# For sigmoid output with BCE loss:
#   dL/dz2 = a2 - y  (for a single sample)
#   dL/dW2 = dL/dz2 * a1^T
#   dL/db2 = dL/dz2
# Given a2 (scalar), y (scalar), a1 (vector):
# Return (dW2, db2) where dW2 has shape (1, len(a1)) and db2 is scalar.

def output_layer_grad(a2: float, y: float, a1: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Backprop — Hidden Layer Gradient
# ---------------------------------------------------------------------------
# For sigmoid hidden layer:
#   dL/dz1 = (W2^T @ delta2) * sigmoid'(z1)
#   sigmoid'(z1) = a1 * (1 - a1)
#   dL/dW1 = dL/dz1 * x^T
#   dL/db1 = dL/dz1
# Given delta2 (dL/dz2, shape (1,)), W2 (shape (1, n_hidden)),
#   a1 (shape (n_hidden,)), x (shape (n_in,)):
# Return (dW1, db1).

def hidden_layer_grad(delta2: np.ndarray, W2: np.ndarray,
                       a1: np.ndarray, x: np.ndarray):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Weight Update (Gradient Descent)
# ---------------------------------------------------------------------------
# Given a parameter W and its gradient dW, update: W_new = W - lr * dW.
# Return W_new.

def weight_update(W: np.ndarray, dW: np.ndarray, lr: float = 0.1) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Full Training Loop
# ---------------------------------------------------------------------------
# Implement a complete training loop for a 2-layer MLP (1 hidden layer).
# Architecture: n_in → n_hidden → 1 (binary classification, sigmoid outputs).
# For each epoch:
#   - For each sample (x_i, y_i):
#     1. Forward pass to get (a1, a2)
#     2. Compute output gradient (delta2 = a2 - y_i)
#     3. Compute hidden gradient
#     4. Update all weights
# Return (W1, b1, W2, b2) after training.

def train_mlp(X: np.ndarray, y: np.ndarray,
               n_hidden: int = 4, lr: float = 0.5,
               epochs: int = 1000):
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Train XOR Problem
# ---------------------------------------------------------------------------
# Use train_mlp to train on X_xor and y_xor (epochs=2000, lr=1.0, n_hidden=4).
# Return (W1, b1, W2, b2) and print predictions vs ground truth.

def train_xor():
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: sklearn MLPClassifier
# ---------------------------------------------------------------------------
# Fit MLPClassifier(hidden_layer_sizes=(8,), max_iter=1000, random_state=42)
# on (X_train, y_train). Return (model, test accuracy).

def sklearn_mlp(X_train, y_train, X_test, y_test):
    pass  # TODO: implement


def main():
    print("=== Exercise 3.4: Neural Networks from Scratch ===\n")

    z = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    print("TODO 1 — sigmoid:", sigmoid(z))
    print("TODO 2 — relu:", relu(z))
    print("TODO 3 — tanh:", tanh(z))
    print("TODO 4 — softmax:", softmax(np.array([1.0, 2.0, 3.0])))

    W = np.random.randn(3, 4)
    x = np.random.randn(4)
    b = np.zeros(3)
    print("TODO 5 — single layer forward:", forward_single_layer(W, x, b))

    W1 = np.random.randn(4, 2)
    b1 = np.zeros(4)
    W2 = np.random.randn(1, 4)
    b2 = np.zeros(1)
    a1, a2 = forward_mlp(W1, b1, W2, b2, X_xor[0]) if forward_mlp(W1, b1, W2, b2, X_xor[0]) else (None, None)
    print("TODO 6 — MLP forward a2:", a2)

    y_true = np.array([1.0, 0.0, 1.0])
    y_pred = np.array([0.9, 0.1, 0.8])
    print("TODO 7 — MSE:", mse_loss(y_true, y_pred))
    print("TODO 8 — BCE:", binary_cross_entropy(y_true, y_pred))

    y_oh = np.array([[1,0],[0,1],[1,0]])
    p_oh = np.array([[0.9,0.1],[0.2,0.8],[0.7,0.3]])
    print("TODO 9 — CCE:", categorical_cross_entropy(y_oh, p_oh))

    a1_v = np.array([0.5, 0.3, 0.7, 0.2])
    dW2, db2 = output_layer_grad(0.8, 1.0, a1_v) if output_layer_grad(0.8, 1.0, a1_v) else (None, None)
    print("TODO 10 — dW2:", dW2, "db2:", db2)

    W2_v = np.array([[0.5, -0.3, 0.2, 0.8]])
    delta2_v = np.array([-0.2])
    x_v = np.array([1.0, 0.5])
    dW1, db1 = hidden_layer_grad(delta2_v, W2_v, a1_v, x_v) if hidden_layer_grad(delta2_v, W2_v, a1_v, x_v) else (None, None)
    print("TODO 11 — dW1 shape:", dW1.shape if dW1 is not None else None)

    W_test = np.array([[1.0, 2.0], [3.0, 4.0]])
    dW_test = np.array([[0.1, 0.2], [0.3, 0.4]])
    print("TODO 12 — Updated W:", weight_update(W_test, dW_test, lr=0.1))

    result13 = train_mlp(X_xor, y_xor, n_hidden=4, lr=0.5, epochs=1000)
    print("TODO 13 — train_mlp returned:", result13 is not None)

    result14 = train_xor()
    print("TODO 14 — XOR training done:", result14 is not None)

    result15 = sklearn_mlp(X_train, y_train, X_test, y_test)
    print("TODO 15 — sklearn MLP accuracy:", result15[1] if result15 else None)


if __name__ == "__main__":
    main()
