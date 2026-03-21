# ============================================================
# Exercise 2.1 — Neural Networks from Scratch & with PyTorch
# ============================================================
# Topics: Activation functions, forward pass, loss functions,
#         gradient descent, PyTorch nn.Module, training loops,
#         optimizers, XOR problem, dropout
# ============================================================
# NOTE: Requires: pip install torch numpy matplotlib

import numpy as np

# NOTE: Requires: pip install torch
import torch
import torch.nn as nn
import torch.optim as optim

# NOTE: Requires: pip install matplotlib
import matplotlib.pyplot as plt


# ─────────────────────────────────────────────
# TODO 1: Implement sigmoid activation function
# ─────────────────────────────────────────────
# Formula: sigmoid(x) = 1 / (1 + e^(-x))
def sigmoid(x: np.ndarray) -> np.ndarray:
    pass  # TODO 1


# ─────────────────────────────────────────────
# TODO 2: Implement ReLU activation function
# ─────────────────────────────────────────────
# Formula: relu(x) = max(0, x)
def relu(x: np.ndarray) -> np.ndarray:
    pass  # TODO 2


# ─────────────────────────────────────────────────────────────
# TODO 3: Implement forward pass for a single neuron
# ─────────────────────────────────────────────────────────────
# A neuron computes: output = activation(dot(weights, inputs) + bias)
# Use sigmoid as the activation function
def single_neuron_forward(inputs: np.ndarray, weights: np.ndarray, bias: float) -> float:
    pass  # TODO 3


# ─────────────────────────────────────────────────────────────────
# TODO 4: Implement simple 2-layer network forward pass (pure numpy)
# ─────────────────────────────────────────────────────────────────
# Layer 1: hidden = relu(X @ W1 + b1)
# Layer 2: output = sigmoid(hidden @ W2 + b2)
# Return the final output
def two_layer_forward(X: np.ndarray, W1: np.ndarray, b1: np.ndarray,
                      W2: np.ndarray, b2: np.ndarray) -> np.ndarray:
    pass  # TODO 4


# ─────────────────────────────────────────────────────────
# TODO 5: Compute binary cross-entropy loss
# ─────────────────────────────────────────────────────────
# Formula: -mean(y * log(y_pred) + (1 - y) * log(1 - y_pred))
# Clip y_pred to avoid log(0) using np.clip(y_pred, 1e-7, 1 - 1e-7)
def binary_cross_entropy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO 5


# ─────────────────────────────────────────────────
# TODO 6: Compute MSE loss
# ─────────────────────────────────────────────────
# Formula: mean((y_true - y_pred) ** 2)
def mse_loss(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    pass  # TODO 6


# ─────────────────────────────────────────────────────────────
# TODO 7: Implement gradient descent step
# ─────────────────────────────────────────────────────────────
# Update rule: w = w - lr * grad
# Return the updated weights
def gradient_descent_step(w: np.ndarray, grad: np.ndarray, lr: float) -> np.ndarray:
    pass  # TODO 7


# ─────────────────────────────────────────────────────────────────────
# TODO 8: Build a PyTorch Linear layer with in_features and out_features
# ─────────────────────────────────────────────────────────────────────
# Return an nn.Linear layer
def build_linear_layer(in_features: int, out_features: int) -> nn.Linear:
    pass  # TODO 8


# ─────────────────────────────────────────────────────────────────────────────
# TODO 9: Build a 3-layer MLP using nn.Sequential
# ─────────────────────────────────────────────────────────────────────────────
# Architecture: Linear(input_size, 64) → ReLU → Linear(64, 32) → ReLU → Linear(32, output_size)
def build_mlp(input_size: int, output_size: int) -> nn.Sequential:
    pass  # TODO 9


# ─────────────────────────────────────────────────────────────────────────────
# TODO 10: Define forward() in a custom nn.Module subclass
# ─────────────────────────────────────────────────────────────────────────────
# Build a network with:
#   self.fc1 = nn.Linear(input_size, hidden_size)
#   self.fc2 = nn.Linear(hidden_size, output_size)
# forward(): apply fc1 → relu → fc2 → sigmoid
class SimpleNet(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        super().__init__()
        pass  # TODO 10a: define layers

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        pass  # TODO 10b: implement forward pass


# ─────────────────────────────────────────────────────────────────────────────
# TODO 11: Create a training loop
# ─────────────────────────────────────────────────────────────────────────────
# For each epoch:
#   1. optimizer.zero_grad()
#   2. output = model(X)
#   3. loss = criterion(output, y)
#   4. loss.backward()
#   5. optimizer.step()
# Return list of loss values per epoch
def training_loop(model: nn.Module, X: torch.Tensor, y: torch.Tensor,
                  optimizer: optim.Optimizer, criterion: nn.Module,
                  epochs: int = 100) -> list:
    losses = []
    for epoch in range(epochs):
        pass  # TODO 11
    return losses


# ─────────────────────────────────────────────────────────────
# TODO 12: Use Adam optimizer
# ─────────────────────────────────────────────────────────────
# Create and return an Adam optimizer for the given model
# Use lr=0.001
def create_adam_optimizer(model: nn.Module) -> optim.Adam:
    pass  # TODO 12


# ─────────────────────────────────────────────────────────────
# TODO 13: Train XOR problem with a 2-layer network
# ─────────────────────────────────────────────────────────────
# XOR data:
#   X = [[0,0],[0,1],[1,0],[1,1]]
#   y = [[0],[1],[1],[0]]
# Build a SimpleNet(2, 4, 1), train with Adam + BCELoss for 1000 epochs
# Return (model, losses)
def train_xor() -> tuple:
    pass  # TODO 13


# ─────────────────────────────────────────────────────────────────────────
# TODO 14: Plot training loss over epochs
# ─────────────────────────────────────────────────────────────────────────
# Use matplotlib to plot losses vs epochs
# Add title "Training Loss", xlabel "Epoch", ylabel "Loss"
# Call plt.show() at the end
# NOTE: In a headless environment, replace plt.show() with plt.savefig("loss.png")
def plot_training_loss(losses: list) -> None:
    pass  # TODO 14


# ─────────────────────────────────────────────────────────────────────────
# TODO 15: Add dropout layer to prevent overfitting
# ─────────────────────────────────────────────────────────────────────────
# Build: Linear(input_size, 64) → ReLU → Dropout(p=0.5) → Linear(64, output_size)
def build_model_with_dropout(input_size: int, output_size: int) -> nn.Sequential:
    pass  # TODO 15


def main():
    print("=== Exercise 2.1 — Neural Networks ===\n")

    # Test activations
    x = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    print("sigmoid(x):", sigmoid(x))
    print("relu(x):", relu(x))

    # Single neuron
    inputs = np.array([0.5, 0.3, 0.2])
    weights = np.array([0.4, -0.6, 0.8])
    bias = 0.1
    print("\nSingle neuron output:", single_neuron_forward(inputs, weights, bias))

    # 2-layer network
    X = np.random.randn(4, 3)
    W1 = np.random.randn(3, 4)
    b1 = np.zeros(4)
    W2 = np.random.randn(4, 1)
    b2 = np.zeros(1)
    out = two_layer_forward(X, W1, b1, W2, b2)
    print("\n2-layer network output shape:", out.shape if out is not None else None)

    # Loss functions
    y_true = np.array([1.0, 0.0, 1.0, 1.0])
    y_pred = np.array([0.9, 0.1, 0.8, 0.6])
    print("\nBCE loss:", binary_cross_entropy(y_true, y_pred))
    print("MSE loss:", mse_loss(y_true, y_pred))

    # Gradient descent step
    w = np.array([0.5, -0.3, 0.8])
    grad = np.array([0.1, -0.2, 0.05])
    print("\nUpdated weights:", gradient_descent_step(w, grad, lr=0.01))

    # PyTorch: Linear layer
    layer = build_linear_layer(10, 5)
    print("\nLinear layer:", layer)

    # MLP
    mlp = build_mlp(10, 2)
    print("\nMLP:", mlp)

    # SimpleNet
    net = SimpleNet(2, 4, 1)
    print("\nSimpleNet:", net)

    # XOR training
    print("\nTraining XOR...")
    model, losses = train_xor()
    if model is not None and losses:
        print(f"Final XOR loss: {losses[-1]:.4f}")
        plot_training_loss(losses)

    # Dropout model
    drop_model = build_model_with_dropout(10, 2)
    print("\nModel with dropout:", drop_model)


if __name__ == "__main__":
    main()
