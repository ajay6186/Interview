# ============================================================
# Solution 2.3 — PyTorch Introduction
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
import os
from sklearn.datasets import make_regression
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

def tensor_basics():
    if not TORCH_AVAILABLE:
        return None
    rand_t  = torch.rand(3, 4)
    zeros_t = torch.zeros(3, 4)
    ones_t  = torch.ones(3, 4)
    elem_sum = rand_t + zeros_t + ones_t
    matmul   = rand_t @ rand_t.T  # (3,4) @ (4,3) → (3,3)
    return {
        'rand_shape':   tuple(rand_t.shape),
        'sum_shape':    tuple(elem_sum.shape),
        'matmul_shape': tuple(matmul.shape),
    }

# ---------------------------------------------------------------------------
# TODO 2: Tensor operations
# ---------------------------------------------------------------------------

def tensor_operations():
    if not TORCH_AVAILABLE:
        return None
    t = torch.arange(12)
    reshaped = t.reshape(3, 4)
    sliced   = reshaped[:2, :]
    as_float = sliced.float()
    return {
        'original_shape': tuple(t.shape),
        'reshaped':       tuple(reshaped.shape),
        'sliced_shape':   tuple(sliced.shape),
        'dtype':          as_float.dtype,
    }

# ---------------------------------------------------------------------------
# TODO 3: Autograd
# ---------------------------------------------------------------------------

def autograd_demo():
    if not TORCH_AVAILABLE:
        return None
    x = torch.tensor([2.0, 3.0], requires_grad=True)
    y = (x ** 2).sum()
    y.backward()
    return x.grad.tolist()

# ---------------------------------------------------------------------------
# TODO 4: SimpleNet
# ---------------------------------------------------------------------------

class SimpleNet(nn.Module if TORCH_AVAILABLE else object):
    def __init__(self, in_features=8, hidden=64, out_features=1):
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, out_features),
        )

    def forward(self, x):
        return self.net(x)

# ---------------------------------------------------------------------------
# TODO 5: Numpy to tensors
# ---------------------------------------------------------------------------

def numpy_to_tensors():
    if not TORCH_AVAILABLE:
        return None
    X_train_t = torch.tensor(X_train_np, dtype=torch.float32)
    y_train_t = torch.tensor(y_train_np, dtype=torch.float32)
    X_test_t  = torch.tensor(X_test_np,  dtype=torch.float32)
    y_test_t  = torch.tensor(y_test_np,  dtype=torch.float32)
    return X_train_t, y_train_t, X_test_t, y_test_t

# ---------------------------------------------------------------------------
# TODO 6: DataLoader
# ---------------------------------------------------------------------------

def create_dataloader():
    if not TORCH_AVAILABLE:
        return None
    tensors = numpy_to_tensors()
    X_train_t, y_train_t, _, _ = tensors
    dataset = TensorDataset(X_train_t, y_train_t)
    loader  = DataLoader(dataset, batch_size=32, shuffle=True)
    first_X, first_y = next(iter(loader))
    return {
        'n_batches':           len(loader),
        'first_batch_X_shape': tuple(first_X.shape),
        'first_batch_y_shape': tuple(first_y.shape),
    }

# ---------------------------------------------------------------------------
# TODO 7: Training loop
# ---------------------------------------------------------------------------

def training_loop(n_epochs=50):
    if not TORCH_AVAILABLE:
        return None
    tensors = numpy_to_tensors()
    X_train_t, y_train_t, _, _ = tensors
    dataset = TensorDataset(X_train_t, y_train_t)
    loader  = DataLoader(dataset, batch_size=32, shuffle=True)

    model = SimpleNet(8, 64, 1)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)

    model.train()
    final_loss = 0.0
    for epoch in range(n_epochs):
        epoch_loss = 0.0
        for X_batch, y_batch in loader:
            optimizer.zero_grad()
            preds = model(X_batch).squeeze()
            loss  = criterion(preds, y_batch)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        final_loss = epoch_loss / len(loader)

    return {'final_train_loss': round(final_loss, 4), 'epochs_trained': n_epochs}

# ---------------------------------------------------------------------------
# TODO 8: Evaluate model
# ---------------------------------------------------------------------------

def evaluate_model():
    if not TORCH_AVAILABLE:
        return None
    tensors = numpy_to_tensors()
    X_train_t, y_train_t, X_test_t, y_test_t = tensors
    dataset = TensorDataset(X_train_t, y_train_t)
    loader  = DataLoader(dataset, batch_size=32, shuffle=True)

    model = SimpleNet(8, 64, 1)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)

    model.train()
    for epoch in range(100):
        for X_batch, y_batch in loader:
            optimizer.zero_grad()
            loss = criterion(model(X_batch).squeeze(), y_batch)
            loss.backward()
            optimizer.step()

    model.eval()
    with torch.no_grad():
        preds = model(X_test_t).squeeze()
        test_mse = criterion(preds, y_test_t).item()

    return {'test_mse': round(test_mse, 4)}

# ---------------------------------------------------------------------------
# TODO 9: Device handling
# ---------------------------------------------------------------------------

def device_handling():
    if not TORCH_AVAILABLE:
        return None
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    t = torch.tensor([1.0, 2.0, 3.0]).to(device)
    return {'device': str(device), 'tensor_device': str(t.device)}

# ---------------------------------------------------------------------------
# TODO 10: Save and load model
# ---------------------------------------------------------------------------

def save_load_model():
    if not TORCH_AVAILABLE:
        return None
    tensors = numpy_to_tensors()
    X_train_t, y_train_t, X_test_t, _ = tensors
    dataset = TensorDataset(X_train_t, y_train_t)
    loader  = DataLoader(dataset, batch_size=32, shuffle=True)

    model = SimpleNet(8, 64, 1)
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.MSELoss()

    model.train()
    for epoch in range(10):
        for X_batch, y_batch in loader:
            optimizer.zero_grad()
            loss = criterion(model(X_batch).squeeze(), y_batch)
            loss.backward()
            optimizer.step()

    path = 'simple_net.pt'
    torch.save(model.state_dict(), path)

    loaded_model = SimpleNet(8, 64, 1)
    loaded_model.load_state_dict(torch.load(path, weights_only=True))
    loaded_model.eval()

    model.eval()
    with torch.no_grad():
        p1 = model(X_test_t).squeeze()
        p2 = loaded_model(X_test_t).squeeze()
        match = torch.allclose(p1, p2)

    os.remove(path)
    return {'saved': True, 'predictions_match': bool(match)}

# ---------------------------------------------------------------------------
# TODO 11: Custom loss — Huber
# ---------------------------------------------------------------------------

class HuberLoss(nn.Module if TORCH_AVAILABLE else object):
    def __init__(self, delta=1.0):
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        self.delta = delta

    def forward(self, predictions, targets):
        error = torch.abs(predictions - targets)
        quadratic = torch.clamp(error, max=self.delta)
        linear    = error - quadratic
        loss = 0.5 * quadratic ** 2 + self.delta * linear
        return loss.mean()

def custom_loss_demo():
    if not TORCH_AVAILABLE:
        return None
    criterion = HuberLoss(delta=1.0)
    preds   = torch.tensor([0.5, 2.0, -1.0])
    targets = torch.tensor([0.0, 0.0,  0.0])
    loss = criterion(preds, targets)
    return round(loss.item(), 4)

# ---------------------------------------------------------------------------
# TODO 12: RegNetBN — BatchNorm + Dropout
# ---------------------------------------------------------------------------

class RegNetBN(nn.Module if TORCH_AVAILABLE else object):
    def __init__(self, in_features=8, hidden=64, out_features=1):
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden),
            nn.BatchNorm1d(hidden),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden, hidden // 2),
            nn.ReLU(),
            nn.Linear(hidden // 2, out_features),
        )

    def forward(self, x):
        return self.net(x)

# ---------------------------------------------------------------------------
# TODO 13: Compare SimpleNet vs RegNetBN
# ---------------------------------------------------------------------------

def _train_and_eval(ModelClass, n_epochs=100):
    tensors = numpy_to_tensors()
    X_train_t, y_train_t, X_test_t, y_test_t = tensors
    dataset = TensorDataset(X_train_t, y_train_t)
    loader  = DataLoader(dataset, batch_size=32, shuffle=True)

    model = ModelClass(8, 64, 1)
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.MSELoss()

    model.train()
    for _ in range(n_epochs):
        for X_batch, y_batch in loader:
            optimizer.zero_grad()
            loss = criterion(model(X_batch).squeeze(), y_batch)
            loss.backward()
            optimizer.step()

    model.eval()
    with torch.no_grad():
        preds = model(X_test_t).squeeze()
        test_mse = criterion(preds, y_test_t).item()
    return round(test_mse, 4)

def compare_architectures():
    if not TORCH_AVAILABLE:
        return None
    simple_mse = _train_and_eval(SimpleNet, n_epochs=100)
    bn_mse     = _train_and_eval(RegNetBN,  n_epochs=100)
    return {'simple_test_mse': simple_mse, 'bn_test_mse': bn_mse}

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 2.3: PyTorch Introduction ===\n")
    if not TORCH_AVAILABLE:
        print("PyTorch not available — install it to run this solution.")
        return

    print("Result 1  — Tensor basics:", tensor_basics())
    print("Result 2  — Tensor operations:", tensor_operations())
    print("Result 3  — Autograd gradient:", autograd_demo())

    net = SimpleNet(8, 64, 1)
    print("Result 4  — SimpleNet architecture:\n", net)

    tensors = numpy_to_tensors()
    print("Result 5  — Tensor shapes:", [tuple(t.shape) for t in tensors])
    print("Result 6  — DataLoader:", create_dataloader())
    print("Result 7  — Training loop:", training_loop(n_epochs=50))
    print("Result 8  — Evaluate model:", evaluate_model())
    print("Result 9  — Device handling:", device_handling())
    print("Result 10 — Save/load model:", save_load_model())
    print("Result 11 — Custom Huber loss:", custom_loss_demo())

    bn_net = RegNetBN(8, 64, 1)
    print("Result 12 — RegNetBN architecture:\n", bn_net)
    print("Result 13 — Architecture comparison:", compare_architectures())

if __name__ == "__main__":
    main()
