# ============================================================
# Exercise 2.3 — PyTorch Introduction
# ============================================================
# Topics:
#   • Tensor creation and operations
#   • Autograd and backpropagation
#   • nn.Module subclassing
#   • Simple neural network for regression
#   • Training loop (forward, loss, backward, step)
#   • DataLoader and Dataset
#   • GPU/CPU device handling
#   • Model saving/loading
#   • Custom loss function
#   • Batch normalization and dropout
# ============================================================

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader, TensorDataset
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("PyTorch not installed. Install with: pip install torch")

import numpy as np
from sklearn.datasets import make_regression, make_classification
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Shared sample data
# ---------------------------------------------------------------------------
np.random.seed(42)
X_np, y_np = make_regression(n_samples=400, n_features=8, noise=10, random_state=42)
scaler_X = StandardScaler()
scaler_y = StandardScaler()
X_np = scaler_X.fit_transform(X_np)
y_np = scaler_y.fit_transform(y_np.reshape(-1, 1)).ravel()

X_train_np, X_test_np, y_train_np, y_test_np = train_test_split(
    X_np, y_np, test_size=0.2, random_state=42
)

# ---------------------------------------------------------------------------
# TODO 1: Tensor creation and basic operations
# ---------------------------------------------------------------------------
# Create a 3x4 tensor of random floats, a zeros tensor, and an ones tensor.
# Compute their element-wise sum and matrix multiplication (3x4 @ 4x3).
# Return a dict {'rand_shape': ..., 'sum_shape': ..., 'matmul_shape': ...}
# Expected: {'rand_shape': (3, 4), 'sum_shape': (3, 4), 'matmul_shape': (3, 3)}

def tensor_basics():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 2: Tensor operations — reshape, slice, dtype conversion
# ---------------------------------------------------------------------------
# Create a tensor of shape (12,) with values 0-11.
# Reshape to (3, 4), slice rows 0-1, convert to float32.
# Return a dict {'original_shape': ..., 'reshaped': ..., 'sliced_shape': ..., 'dtype': ...}
# Expected: {'original_shape': (12,), 'reshaped': (3,4), 'sliced_shape': (2,4), 'dtype': torch.float32}

def tensor_operations():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 3: Autograd — compute gradient of a simple function
# ---------------------------------------------------------------------------
# Create x = tensor([2.0, 3.0], requires_grad=True).
# Compute y = (x ** 2).sum(), call y.backward().
# Return x.grad as a list.
# Expected: [4.0, 6.0]  (dy/dx_i = 2*x_i)

def autograd_demo():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 4: Define a simple MLP using nn.Module
# ---------------------------------------------------------------------------
# Create SimpleNet(in_features, hidden, out_features):
#   Linear → ReLU → Linear → ReLU → Linear
# Implement forward(x).
# Expected: class with forward() returning tensor of shape (batch, out_features)

class SimpleNet(nn.Module if TORCH_AVAILABLE else object):
    def __init__(self, in_features=8, hidden=64, out_features=1):
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        pass  # TODO: define layers (nn.Linear, nn.ReLU)

    def forward(self, x):
        pass  # TODO: implement forward pass

# ---------------------------------------------------------------------------
# TODO 5: Convert numpy arrays to PyTorch tensors for training
# ---------------------------------------------------------------------------
# Convert X_train_np, y_train_np, X_test_np, y_test_np to float32 tensors.
# Return (X_train_t, y_train_t, X_test_t, y_test_t).
# Expected: four tensors with matching shapes to the numpy arrays

def numpy_to_tensors():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement using torch.tensor(arr, dtype=torch.float32)

# ---------------------------------------------------------------------------
# TODO 6: Create a Dataset and DataLoader
# ---------------------------------------------------------------------------
# Use TensorDataset with X_train and y_train tensors.
# Create a DataLoader(batch_size=32, shuffle=True).
# Return a dict {'n_batches': ..., 'first_batch_X_shape': ..., 'first_batch_y_shape': ...}
# Expected: n_batches ~10 (320 samples / 32), shapes (32, 8) and (32,)

def create_dataloader():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Implement a training loop for regression
# ---------------------------------------------------------------------------
# Train SimpleNet(8, 64, 1) for 50 epochs using MSELoss and Adam(lr=0.01).
# Use DataLoader with batch_size=32.
# Return a dict {'final_train_loss': ..., 'epochs_trained': 50}
# Expected: final_train_loss < 1.0 (data is normalised)

def training_loop():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement forward / loss / backward / step loop

# ---------------------------------------------------------------------------
# TODO 8: Evaluate a trained model on the test set
# ---------------------------------------------------------------------------
# After training (reuse training_loop logic), compute test MSE.
# Use model.eval() and torch.no_grad().
# Return {'test_mse': ...}
# Expected: test_mse < 2.0

def evaluate_model():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement evaluation with torch.no_grad()

# ---------------------------------------------------------------------------
# TODO 9: Get the device (GPU if available, else CPU)
# ---------------------------------------------------------------------------
# Return the device string ('cuda' or 'cpu') and move a small tensor to it.
# Return {'device': ..., 'tensor_device': ...}
# Expected: {'device': 'cpu' or 'cuda', 'tensor_device': same}

def device_handling():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement using torch.device

# ---------------------------------------------------------------------------
# TODO 10: Save and load a model's state dict
# ---------------------------------------------------------------------------
# Train SimpleNet briefly (10 epochs), save state_dict to 'simple_net.pt',
# load it into a new SimpleNet instance, compare predictions.
# Return {'saved': True, 'predictions_match': True/False}
# Expected: predictions_match should be True

def save_load_model():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: implement torch.save / torch.load / model.load_state_dict

# ---------------------------------------------------------------------------
# TODO 11: Implement a custom loss function
# ---------------------------------------------------------------------------
# Implement HuberLoss as a subclass of nn.Module.
# Huber loss = 0.5*(y-p)^2 if |y-p|<=delta, else delta*(|y-p| - 0.5*delta)
# Return loss value for a small example.
# Expected: a scalar tensor

class HuberLoss(nn.Module if TORCH_AVAILABLE else object):
    def __init__(self, delta=1.0):
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        self.delta = delta

    def forward(self, predictions, targets):
        pass  # TODO: implement Huber loss formula

def custom_loss_demo():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: create HuberLoss, call it with sample tensors, return scalar

# ---------------------------------------------------------------------------
# TODO 12: Build a network with BatchNorm and Dropout
# ---------------------------------------------------------------------------
# Create RegNetBN(in_features, hidden, out_features):
#   Linear(in, hidden) → BatchNorm1d(hidden) → ReLU → Dropout(0.3) →
#   Linear(hidden, hidden//2) → ReLU → Linear(hidden//2, out)
# Expected: class with forward() that works in train and eval mode

class RegNetBN(nn.Module if TORCH_AVAILABLE else object):
    def __init__(self, in_features=8, hidden=64, out_features=1):
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        pass  # TODO: define layers with BatchNorm1d and Dropout

    def forward(self, x):
        pass  # TODO: implement forward pass

# ---------------------------------------------------------------------------
# TODO 13: Compare SimpleNet vs RegNetBN on regression data
# ---------------------------------------------------------------------------
# Train both models for 100 epochs with Adam(lr=0.01), MSELoss.
# Return {'simple_test_mse': ..., 'bn_test_mse': ...}
# Expected: both < 2.0; BatchNorm model may converge faster

def compare_architectures():
    if not TORCH_AVAILABLE:
        return None
    pass  # TODO: train both and compare test MSE

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 2.3: PyTorch Introduction ===\n")
    if not TORCH_AVAILABLE:
        print("PyTorch not available — install it to run this exercise.")
        return

    print("TODO 1  — Tensor basics:", tensor_basics())
    print("TODO 2  — Tensor operations:", tensor_operations())
    print("TODO 3  — Autograd gradient:", autograd_demo())

    net = SimpleNet(8, 64, 1)
    print("TODO 4  — SimpleNet:", net)

    tensors = numpy_to_tensors()
    if tensors:
        print("TODO 5  — Tensor shapes:", [t.shape for t in tensors])
    else:
        print("TODO 5  — Tensors:", tensors)

    print("TODO 6  — DataLoader:", create_dataloader())
    print("TODO 7  — Training loop:", training_loop())
    print("TODO 8  — Evaluate model:", evaluate_model())
    print("TODO 9  — Device handling:", device_handling())
    print("TODO 10 — Save/load model:", save_load_model())
    print("TODO 11 — Custom loss:", custom_loss_demo())

    bn_net = RegNetBN(8, 64, 1)
    print("TODO 12 — RegNetBN:", bn_net)
    print("TODO 13 — Architecture comparison:", compare_architectures())

if __name__ == "__main__":
    main()
