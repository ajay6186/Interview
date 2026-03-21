# ============================================================
# Solution 2.1 — Neural Networks from Scratch & with PyTorch
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
# SOLUTION 1: Implement sigmoid activation function
# ─────────────────────────────────────────────
def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-x))


# ─────────────────────────────────────────────
# SOLUTION 2: Implement ReLU activation function
# ─────────────────────────────────────────────
def relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(0, x)


# ─────────────────────────────────────────────────────────────
# SOLUTION 3: Implement forward pass for a single neuron
# ─────────────────────────────────────────────────────────────
def single_neuron_forward(inputs: np.ndarray, weights: np.ndarray, bias: float) -> float:
    z = np.dot(weights, inputs) + bias
    return sigmoid(z)


# ─────────────────────────────────────────────────────────────────
# SOLUTION 4: Implement simple 2-layer network forward pass (pure numpy)
# ─────────────────────────────────────────────────────────────────
def two_layer_forward(X: np.ndarray, W1: np.ndarray, b1: np.ndarray,
                      W2: np.ndarray, b2: np.ndarray) -> np.ndarray:
    hidden = relu(X @ W1 + b1)      # Layer 1: ReLU activation
    output = sigmoid(hidden @ W2 + b2)  # Layer 2: Sigmoid activation
    return output


# ─────────────────────────────────────────────────────────────
# SOLUTION 5: Compute binary cross-entropy loss
# ─────────────────────────────────────────────────────────────
def binary_cross_entropy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    y_pred = np.clip(y_pred, 1e-7, 1 - 1e-7)  # Avoid log(0)
    return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))


# ─────────────────────────────────────────────────
# SOLUTION 6: Compute MSE loss
# ─────────────────────────────────────────────────
def mse_loss(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return np.mean((y_true - y_pred) ** 2)


# ─────────────────────────────────────────────────────────────
# SOLUTION 7: Implement gradient descent step
# ─────────────────────────────────────────────────────────────
def gradient_descent_step(w: np.ndarray, grad: np.ndarray, lr: float) -> np.ndarray:
    return w - lr * grad


# ─────────────────────────────────────────────────────────────────────
# SOLUTION 8: Build a PyTorch Linear layer
# ─────────────────────────────────────────────────────────────────────
def build_linear_layer(in_features: int, out_features: int) -> nn.Linear:
    return nn.Linear(in_features, out_features)


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 9: Build a 3-layer MLP using nn.Sequential
# ─────────────────────────────────────────────────────────────────────────────
def build_mlp(input_size: int, output_size: int) -> nn.Sequential:
    return nn.Sequential(
        nn.Linear(input_size, 64),
        nn.ReLU(),
        nn.Linear(64, 32),
        nn.ReLU(),
        nn.Linear(32, output_size),
    )


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 10: Define forward() in a custom nn.Module subclass
# ─────────────────────────────────────────────────────────────────────────────
class SimpleNet(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, output_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = torch.relu(self.fc1(x))   # Hidden layer with ReLU
        x = torch.sigmoid(self.fc2(x))  # Output layer with Sigmoid
        return x


# ─────────────────────────────────────────────────────────────────────────────
# SOLUTION 11: Create a training loop
# ─────────────────────────────────────────────────────────────────────────────
def training_loop(model: nn.Module, X: torch.Tensor, y: torch.Tensor,
                  optimizer: optim.Optimizer, criterion: nn.Module,
                  epochs: int = 100) -> list:
    losses = []
    for epoch in range(epochs):
        optimizer.zero_grad()          # 1. Clear previous gradients
        output = model(X)              # 2. Forward pass
        loss = criterion(output, y)    # 3. Compute loss
        loss.backward()                # 4. Backward pass (compute gradients)
        optimizer.step()               # 5. Update weights
        losses.append(loss.item())
    return losses


# ─────────────────────────────────────────────────────────────
# SOLUTION 12: Use Adam optimizer
# ─────────────────────────────────────────────────────────────
def create_adam_optimizer(model: nn.Module) -> optim.Adam:
    return optim.Adam(model.parameters(), lr=0.001)


# ─────────────────────────────────────────────────────────────
# SOLUTION 13: Train XOR problem with a 2-layer network
# ─────────────────────────────────────────────────────────────
def train_xor() -> tuple:
    # XOR dataset
    X = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=torch.float32)
    y = torch.tensor([[0], [1], [1], [0]], dtype=torch.float32)

    # Build model: 2 inputs → 4 hidden → 1 output
    model = SimpleNet(2, 4, 1)
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.BCELoss()

    losses = training_loop(model, X, y, optimizer, criterion, epochs=1000)
    return model, losses


# ─────────────────────────────────────────────────────────────────────────
# SOLUTION 14: Plot training loss over epochs
# ─────────────────────────────────────────────────────────────────────────
def plot_training_loss(losses: list) -> None:
    # NOTE: In a headless/CI environment, replace plt.show() with plt.savefig("loss.png")
    plt.figure(figsize=(8, 4))
    plt.plot(losses)
    plt.title("Training Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(True)
    # plt.show()
    plt.savefig("loss.png")
    print("  [plot saved to loss.png]")
    plt.close()


# ─────────────────────────────────────────────────────────────────────────
# SOLUTION 15: Add dropout layer to prevent overfitting
# ─────────────────────────────────────────────────────────────────────────
def build_model_with_dropout(input_size: int, output_size: int) -> nn.Sequential:
    return nn.Sequential(
        nn.Linear(input_size, 64),
        nn.ReLU(),
        nn.Dropout(p=0.5),            # Randomly zero 50% of neurons during training
        nn.Linear(64, output_size),
    )


def main():
    print("=== Solution 2.1 — Neural Networks ===\n")

    # Test activations
    x = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
    print("sigmoid(x):", sigmoid(x))
    # Expected: [0.119, 0.269, 0.5, 0.731, 0.881]
    print("relu(x):", relu(x))
    # Expected: [0.  0.  0.  1.  2.]

    # Single neuron
    inputs = np.array([0.5, 0.3, 0.2])
    weights = np.array([0.4, -0.6, 0.8])
    bias = 0.1
    out = single_neuron_forward(inputs, weights, bias)
    print(f"\nSingle neuron output: {out:.4f}")
    # z = 0.4*0.5 + (-0.6)*0.3 + 0.8*0.2 + 0.1 = 0.2-0.18+0.16+0.1 = 0.28 → sigmoid(0.28) ≈ 0.5695

    # 2-layer network
    np.random.seed(42)
    X = np.random.randn(4, 3)
    W1 = np.random.randn(3, 4)
    b1 = np.zeros(4)
    W2 = np.random.randn(4, 1)
    b2 = np.zeros(1)
    out = two_layer_forward(X, W1, b1, W2, b2)
    print("\n2-layer network output shape:", out.shape)
    print("  outputs:", out.flatten().round(4))

    # Loss functions
    y_true = np.array([1.0, 0.0, 1.0, 1.0])
    y_pred = np.array([0.9, 0.1, 0.8, 0.6])
    print(f"\nBCE loss: {binary_cross_entropy(y_true, y_pred):.4f}")
    print(f"MSE loss: {mse_loss(y_true, y_pred):.4f}")

    # Gradient descent step
    w = np.array([0.5, -0.3, 0.8])
    grad = np.array([0.1, -0.2, 0.05])
    print("\nUpdated weights:", gradient_descent_step(w, grad, lr=0.01))
    # Expected: [0.499, -0.298, 0.7995]

    # PyTorch: Linear layer
    layer = build_linear_layer(10, 5)
    print(f"\nLinear layer: {layer}")

    # MLP
    mlp = build_mlp(10, 2)
    print(f"\nMLP:\n{mlp}")

    # SimpleNet
    net = SimpleNet(2, 4, 1)
    print(f"\nSimpleNet:\n{net}")

    # XOR training
    print("\nTraining XOR (1000 epochs)...")
    model, losses = train_xor()
    print(f"  Initial loss: {losses[0]:.4f}")
    print(f"  Final loss:   {losses[-1]:.4f}")

    # Verify XOR predictions
    X_xor = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=torch.float32)
    with torch.no_grad():
        preds = model(X_xor).round()
    print(f"  XOR predictions: {preds.flatten().tolist()}  (expected [0,1,1,0])")

    plot_training_loss(losses)

    # Dropout model
    drop_model = build_model_with_dropout(10, 2)
    print(f"\nModel with dropout:\n{drop_model}")


if __name__ == "__main__":
    main()
