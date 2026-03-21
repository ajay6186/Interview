# ============================================================
# Examples 2.3 — PyTorch Introduction (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset, Dataset
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Create tensor from list"""
    if TORCH_AVAILABLE:
        t = torch.tensor([1.0, 2.0, 3.0, 4.0])
        print("Ex01 — Tensor from list:", t)
    else:
        print("Ex01 — PyTorch not installed — concept: torch.tensor([1.0, 2.0, 3.0, 4.0]) creates a 1D float tensor")

def ex02():
    """Zeros and ones tensors"""
    if TORCH_AVAILABLE:
        z = torch.zeros(2, 3)
        o = torch.ones(2, 3)
        print("Ex02 — Zeros shape:", z.shape, "| Ones shape:", o.shape)
    else:
        print("Ex02 — PyTorch not installed — concept: torch.zeros(2,3) and torch.ones(2,3) create filled tensors")

def ex03():
    """Random tensor"""
    if TORCH_AVAILABLE:
        torch.manual_seed(42)
        r = torch.randn(3, 4)
        print("Ex03 — Random tensor shape:", r.shape, "| Mean:", round(r.mean().item(), 4))
    else:
        print("Ex03 — PyTorch not installed — concept: torch.randn(3,4) samples from N(0,1)")

def ex04():
    """Tensor dtypes"""
    if TORCH_AVAILABLE:
        t_float = torch.tensor([1.0, 2.0], dtype=torch.float32)
        t_int = torch.tensor([1, 2], dtype=torch.int64)
        t_bool = torch.tensor([True, False], dtype=torch.bool)
        print("Ex04 — Dtypes: float32={}, int64={}, bool={}".format(t_float.dtype, t_int.dtype, t_bool.dtype))
    else:
        print("Ex04 — PyTorch not installed — concept: dtype=torch.float32/int64/bool controls precision")

def ex05():
    """Tensor shape and ndim"""
    if TORCH_AVAILABLE:
        t = torch.zeros(2, 3, 4)
        print("Ex05 — Shape:", t.shape, "| ndim:", t.ndim, "| numel:", t.numel())
    else:
        print("Ex05 — PyTorch not installed — concept: .shape, .ndim, .numel() describe tensor dimensions")

def ex06():
    """Basic tensor math (add, mul, matmul)"""
    if TORCH_AVAILABLE:
        a = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
        b = torch.tensor([[5.0, 6.0], [7.0, 8.0]])
        print("Ex06 — a + b:\n", a + b)
        print("       a @ b:\n", a @ b)
    else:
        print("Ex06 — PyTorch not installed — concept: +, *, @ for elementwise/matmul operations")

def ex07():
    """Tensor indexing"""
    if TORCH_AVAILABLE:
        t = torch.tensor([[10, 20, 30], [40, 50, 60]])
        print("Ex07 — t[0]:", t[0], "| t[1,2]:", t[1, 2].item(), "| t[:, 1]:", t[:, 1])
    else:
        print("Ex07 — PyTorch not installed — concept: t[row,col], t[:,col] for indexing/slicing")

def ex08():
    """Tensor slicing"""
    if TORCH_AVAILABLE:
        t = torch.arange(12).reshape(3, 4)
        print("Ex08 — Full tensor:\n", t)
        print("       Slice t[1:, 2:]:\n", t[1:, 2:])
    else:
        print("Ex08 — PyTorch not installed — concept: t[1:, 2:] slices rows 1+ and cols 2+")

def ex09():
    """Reshape and view"""
    if TORCH_AVAILABLE:
        t = torch.arange(12, dtype=torch.float32)
        r = t.view(3, 4)
        r2 = t.reshape(2, 6)
        print("Ex09 — view(3,4):", r.shape, "| reshape(2,6):", r2.shape)
    else:
        print("Ex09 — PyTorch not installed — concept: .view() / .reshape() change tensor shape without copy")

def ex10():
    """Tensor to numpy"""
    if TORCH_AVAILABLE:
        t = torch.tensor([1.0, 2.0, 3.0])
        arr = t.numpy()
        print("Ex10 — Tensor to numpy:", arr, "| type:", type(arr).__name__)
    else:
        print("Ex10 — PyTorch not installed — concept: .numpy() converts CPU tensor to numpy array (shared memory)")

def ex11():
    """Numpy to tensor"""
    if TORCH_AVAILABLE:
        arr = np.array([4.0, 5.0, 6.0])
        t = torch.from_numpy(arr)
        print("Ex11 — Numpy to tensor:", t, "| dtype:", t.dtype)
    else:
        print("Ex11 — PyTorch not installed — concept: torch.from_numpy(arr) wraps numpy array as tensor")

def ex12():
    """CPU vs GPU concept"""
    if TORCH_AVAILABLE:
        t = torch.randn(3, 3)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        t = t.to(device)
        print("Ex12 — Tensor device:", t.device, "| CUDA available:", torch.cuda.is_available())
    else:
        print("Ex12 — PyTorch not installed — concept: .to('cuda') moves tensor to GPU for accelerated compute")

def ex13():
    """requires_grad for autograd"""
    if TORCH_AVAILABLE:
        x = torch.tensor([2.0, 3.0], requires_grad=True)
        y = (x ** 2).sum()
        print("Ex13 — requires_grad=True | y:", y.item(), "| grad_fn:", y.grad_fn)
    else:
        print("Ex13 — PyTorch not installed — concept: requires_grad=True enables automatic gradient tracking")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Autograd backward pass"""
    if TORCH_AVAILABLE:
        x = torch.tensor([2.0], requires_grad=True)
        y = x ** 3 + 2 * x
        y.backward()
        print("Ex14 — dy/dx at x=2:", x.grad.item(), "| Expected (3x²+2):", 3*4+2)
    else:
        print("Ex14 — PyTorch not installed — concept: y.backward() computes dy/dx via reverse-mode autodiff")

def ex15():
    """Compute gradient of multi-var expression"""
    if TORCH_AVAILABLE:
        x = torch.tensor([1.0], requires_grad=True)
        w = torch.tensor([3.0], requires_grad=True)
        b = torch.tensor([0.5], requires_grad=True)
        y = (w * x + b) ** 2
        y.backward()
        print("Ex15 — dy/dw:", w.grad.item(), "| dy/dx:", x.grad.item(), "| dy/db:", b.grad.item())
    else:
        print("Ex15 — PyTorch not installed — concept: gradients flow to all leaves with requires_grad=True")

def ex16():
    """Gradient accumulation"""
    if TORCH_AVAILABLE:
        x = torch.tensor([1.0], requires_grad=True)
        for _ in range(3):
            y = x ** 2
            y.backward()
        print("Ex16 — Accumulated grad (3 steps):", x.grad.item(), "| Expected (2x * 3):", 6.0)
    else:
        print("Ex16 — PyTorch not installed — concept: gradients accumulate unless .zero_grad() is called")

def ex17():
    """zero_grad to reset gradients"""
    if TORCH_AVAILABLE:
        x = torch.tensor([1.0], requires_grad=True)
        y = x ** 2; y.backward()
        print("Ex17 — Grad before zero:", x.grad.item())
        x.grad.zero_()
        print("       Grad after zero:", x.grad.item())
    else:
        print("Ex17 — PyTorch not installed — concept: .zero_grad() or optimizer.zero_grad() clears accumulated grads")

def ex18():
    """Simple nn.Linear layer"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        linear = nn.Linear(in_features=3, out_features=2)
        x = torch.randn(4, 3)
        out = linear(x)
        print("Ex18 — nn.Linear output shape:", out.shape, "| Weight shape:", linear.weight.shape)
    else:
        print("Ex18 — PyTorch not installed — concept: nn.Linear(in, out) applies y = xW^T + b")

def ex19():
    """nn.Sequential model"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Sequential(
            nn.Linear(4, 8),
            nn.ReLU(),
            nn.Linear(8, 2),
            nn.Softmax(dim=1)
        )
        x = torch.randn(3, 4)
        out = model(x)
        print("Ex19 — nn.Sequential output shape:", out.shape, "| Row sums:", out.sum(dim=1))
    else:
        print("Ex19 — PyTorch not installed — concept: nn.Sequential chains layers in order")

def ex20():
    """Custom nn.Module"""
    if TORCH_AVAILABLE:
        class TwoLayerNet(nn.Module):
            def __init__(self, n_in, n_hid, n_out):
                super().__init__()
                self.fc1 = nn.Linear(n_in, n_hid)
                self.fc2 = nn.Linear(n_hid, n_out)
            def forward(self, x):
                return self.fc2(torch.relu(self.fc1(x)))
        torch.manual_seed(0)
        model = TwoLayerNet(4, 8, 3)
        x = torch.randn(5, 4)
        out = model(x)
        print("Ex20 — Custom nn.Module output:", out.shape)
    else:
        print("Ex20 — PyTorch not installed — concept: subclass nn.Module, define __init__ and forward()")

def ex21():
    """Forward pass through model"""
    if TORCH_AVAILABLE:
        torch.manual_seed(1)
        model = nn.Sequential(nn.Linear(2, 4), nn.Tanh(), nn.Linear(4, 1), nn.Sigmoid())
        x = torch.tensor([[0.5, -0.3], [1.0, 0.2]])
        with torch.no_grad():
            out = model(x)
        print("Ex21 — Forward pass output:", out.detach().numpy().round(4))
    else:
        print("Ex21 — PyTorch not installed — concept: model(x) calls forward(); no_grad() saves memory during inference")

def ex22():
    """MSELoss"""
    if TORCH_AVAILABLE:
        criterion = nn.MSELoss()
        y_pred = torch.tensor([0.8, 0.2, 0.9, 0.1])
        y_true = torch.tensor([1.0, 0.0, 1.0, 0.0])
        loss = criterion(y_pred, y_true)
        print("Ex22 — MSELoss:", round(loss.item(), 4))
    else:
        print("Ex22 — PyTorch not installed — concept: nn.MSELoss() computes mean((pred - target)^2)")

def ex23():
    """CrossEntropyLoss"""
    if TORCH_AVAILABLE:
        criterion = nn.CrossEntropyLoss()
        logits = torch.tensor([[2.0, 1.0, 0.5], [0.5, 2.5, 0.3]])
        targets = torch.tensor([0, 1])
        loss = criterion(logits, targets)
        print("Ex23 — CrossEntropyLoss:", round(loss.item(), 4))
    else:
        print("Ex23 — PyTorch not installed — concept: nn.CrossEntropyLoss applies softmax + NLL internally")

def ex24():
    """SGD optimizer step"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Linear(2, 1)
        optimizer = optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
        x = torch.randn(5, 2); y = torch.randn(5, 1)
        pred = model(x); loss = nn.MSELoss()(pred, y)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
        print("Ex24 — SGD step done | Loss:", round(loss.item(), 4))
    else:
        print("Ex24 — PyTorch not installed — concept: SGD: w = w - lr * grad (with optional momentum)")

def ex25():
    """Adam optimizer step"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Linear(2, 1)
        optimizer = optim.Adam(model.parameters(), lr=0.001, betas=(0.9, 0.999))
        x = torch.randn(5, 2); y = torch.randn(5, 1)
        pred = model(x); loss = nn.MSELoss()(pred, y)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
        print("Ex25 — Adam step done | Loss:", round(loss.item(), 4))
    else:
        print("Ex25 — PyTorch not installed — concept: Adam maintains per-param adaptive learning rates via m/v estimates")

def ex26():
    """Learning rate scheduler (StepLR)"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Linear(2, 1)
        optimizer = optim.SGD(model.parameters(), lr=0.1)
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)
        lrs = []
        for epoch in range(15):
            scheduler.step()
            lrs.append(round(optimizer.param_groups[0]['lr'], 5))
        print("Ex26 — LR at epochs [0,4,5,9,10,14]:", [lrs[i] for i in [0,4,5,9,10,14]])
    else:
        print("Ex26 — PyTorch not installed — concept: StepLR multiplies lr by gamma every step_size epochs")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Full SimpleNet class definition"""
    if TORCH_AVAILABLE:
        class SimpleNet(nn.Module):
            def __init__(self, n_in, n_hid, n_out):
                super().__init__()
                self.net = nn.Sequential(
                    nn.Linear(n_in, n_hid), nn.ReLU(),
                    nn.Linear(n_hid, n_hid), nn.ReLU(),
                    nn.Linear(n_hid, n_out)
                )
            def forward(self, x): return self.net(x)
        torch.manual_seed(0)
        net = SimpleNet(4, 16, 3)
        total_params = sum(p.numel() for p in net.parameters())
        print("Ex27 — SimpleNet | Params:", total_params, "| Output shape:", net(torch.randn(2, 4)).shape)
    else:
        print("Ex27 — PyTorch not installed — concept: nn.Module subclass with sequential layers for classification")

def ex28():
    """Training loop (10 epochs)"""
    if TORCH_AVAILABLE:
        torch.manual_seed(42)
        X = torch.randn(100, 2); y = (X[:, 0] + X[:, 1] > 0).float().unsqueeze(1)
        model = nn.Sequential(nn.Linear(2, 8), nn.ReLU(), nn.Linear(8, 1), nn.Sigmoid())
        opt = optim.Adam(model.parameters(), lr=0.05)
        crit = nn.BCELoss()
        losses = []
        for epoch in range(10):
            pred = model(X); loss = crit(pred, y)
            opt.zero_grad(); loss.backward(); opt.step()
            losses.append(round(loss.item(), 4))
        print("Ex28 — Training losses:", losses[::2])
    else:
        print("Ex28 — PyTorch not installed — concept: for epoch in range(N): pred=model(X); loss=crit(pred,y); loss.backward(); opt.step()")

def ex29():
    """Validation loop"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        X = torch.randn(120, 2); y = (X.sum(dim=1) > 0).long()
        X_tr, X_val, y_tr, y_val = X[:80], X[80:], y[:80], y[80:]
        model = nn.Sequential(nn.Linear(2, 8), nn.ReLU(), nn.Linear(8, 2))
        opt = optim.Adam(model.parameters(), lr=0.05)
        crit = nn.CrossEntropyLoss()
        for _ in range(20):
            model.train(); pred = model(X_tr); loss = crit(pred, y_tr)
            opt.zero_grad(); loss.backward(); opt.step()
        model.eval()
        with torch.no_grad():
            val_pred = model(X_val)
            val_acc = (val_pred.argmax(1) == y_val).float().mean().item()
        print("Ex29 — Validation accuracy:", round(val_acc, 4))
    else:
        print("Ex29 — PyTorch not installed — concept: model.eval() + torch.no_grad() for validation inference")

def ex30():
    """DataLoader with TensorDataset"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        X = torch.randn(50, 3); y = torch.randint(0, 2, (50,))
        dataset = TensorDataset(X, y)
        loader = DataLoader(dataset, batch_size=16, shuffle=True)
        batch_count = 0
        for bx, by in loader:
            batch_count += 1
        print("Ex30 — TensorDataset batches:", batch_count, "| Last batch X shape:", bx.shape)
    else:
        print("Ex30 — PyTorch not installed — concept: TensorDataset + DataLoader handle batching and shuffling")

def ex31():
    """Train/validation split with DataLoader"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        X = torch.randn(100, 4); y = (X.sum(dim=1) > 0).long()
        n_train = 80
        train_ds = TensorDataset(X[:n_train], y[:n_train])
        val_ds = TensorDataset(X[n_train:], y[n_train:])
        train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
        val_loader = DataLoader(val_ds, batch_size=16)
        print("Ex31 — Train batches:", len(train_loader), "| Val batches:", len(val_loader))
    else:
        print("Ex31 — PyTorch not installed — concept: separate DataLoaders for train and val splits")

def ex32():
    """Save model state_dict"""
    if TORCH_AVAILABLE:
        import tempfile, os
        torch.manual_seed(0)
        model = nn.Linear(4, 2)
        with tempfile.NamedTemporaryFile(suffix='.pt', delete=False) as f:
            path = f.name
        torch.save(model.state_dict(), path)
        size = os.path.getsize(path)
        os.unlink(path)
        print("Ex32 — state_dict saved | Keys:", list(model.state_dict().keys()), "| File size:", size, "bytes")
    else:
        print("Ex32 — PyTorch not installed — concept: torch.save(model.state_dict(), 'model.pt') serializes weights")

def ex33():
    """Load model state_dict"""
    if TORCH_AVAILABLE:
        import tempfile, os
        torch.manual_seed(0)
        model = nn.Linear(4, 2)
        original_weight = model.weight.data.clone()
        with tempfile.NamedTemporaryFile(suffix='.pt', delete=False) as f:
            path = f.name
        torch.save(model.state_dict(), path)
        model2 = nn.Linear(4, 2)
        model2.load_state_dict(torch.load(path, weights_only=True))
        os.unlink(path)
        match = torch.allclose(original_weight, model2.weight.data)
        print("Ex33 — Loaded weights match original:", match)
    else:
        print("Ex33 — PyTorch not installed — concept: model.load_state_dict(torch.load(path)) restores weights")

def ex34():
    """Custom Dataset class"""
    if TORCH_AVAILABLE:
        class TextDataset(Dataset):
            def __init__(self, features, labels):
                self.features = features
                self.labels = labels
            def __len__(self): return len(self.labels)
            def __getitem__(self, idx): return self.features[idx], self.labels[idx]

        X = torch.randn(40, 5); y = torch.randint(0, 3, (40,))
        ds = TextDataset(X, y)
        loader = DataLoader(ds, batch_size=8, shuffle=False)
        print("Ex34 — Custom Dataset len:", len(ds), "| Batch 0 shapes:", next(iter(loader))[0].shape)
    else:
        print("Ex34 — PyTorch not installed — concept: subclass Dataset with __len__ and __getitem__")

def ex35():
    """Custom loss function"""
    if TORCH_AVAILABLE:
        class FocalLoss(nn.Module):
            def __init__(self, gamma=2.0):
                super().__init__()
                self.gamma = gamma
            def forward(self, pred, target):
                bce = nn.functional.binary_cross_entropy(pred, target, reduction='none')
                pt = torch.exp(-bce)
                return ((1 - pt) ** self.gamma * bce).mean()
        pred = torch.tensor([0.9, 0.1, 0.8, 0.2])
        target = torch.tensor([1.0, 0.0, 1.0, 0.0])
        loss = FocalLoss(gamma=2.0)(pred, target)
        print("Ex35 — Focal loss:", round(loss.item(), 4))
    else:
        print("Ex35 — PyTorch not installed — concept: subclass nn.Module with forward(pred, target) for custom losses")

def ex36():
    """L2 regularization via weight_decay"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Linear(4, 2)
        opt_wd = optim.Adam(model.parameters(), lr=0.01, weight_decay=1e-4)
        X = torch.randn(20, 4); y = torch.randint(0, 2, (20,))
        pred = model(X); loss = nn.CrossEntropyLoss()(pred, y)
        opt_wd.zero_grad(); loss.backward(); opt_wd.step()
        print("Ex36 — L2 reg (weight_decay=1e-4) | Loss:", round(loss.item(), 4))
    else:
        print("Ex36 — PyTorch not installed — concept: weight_decay in optimizer adds L2 penalty to each update")

def ex37():
    """Dropout in training vs eval mode"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Sequential(nn.Linear(4, 8), nn.Dropout(p=0.5), nn.ReLU(), nn.Linear(8, 2))
        x = torch.randn(5, 4)
        model.train()
        out_train = model(x)
        model.eval()
        with torch.no_grad():
            out_eval = model(x)
        print("Ex37 — Dropout | Train zeros:", (out_train == 0).sum().item(), "| Eval zeros:", (out_eval == 0).sum().item())
    else:
        print("Ex37 — PyTorch not installed — concept: nn.Dropout(p) zeros activations during train; no-op during eval")

def ex38():
    """Batch normalization layer"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Sequential(nn.Linear(4, 8), nn.BatchNorm1d(8), nn.ReLU(), nn.Linear(8, 2))
        x = torch.randn(16, 4)
        model.train()
        out = model(x)
        print("Ex38 — BatchNorm model output shape:", out.shape, "| Mean:", round(out.mean().item(), 4))
    else:
        print("Ex38 — PyTorch not installed — concept: nn.BatchNorm1d normalizes activations per batch per feature")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Training with loss table print"""
    if TORCH_AVAILABLE:
        torch.manual_seed(42)
        X = torch.randn(80, 2); y = (X.sum(dim=1) > 0).float().unsqueeze(1)
        model = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 1), nn.Sigmoid())
        opt = optim.Adam(model.parameters(), lr=0.05); crit = nn.BCELoss()
        print("Ex39 — Epoch | Loss")
        for epoch in range(1, 11):
            pred = model(X); loss = crit(pred, y)
            opt.zero_grad(); loss.backward(); opt.step()
            if epoch % 2 == 0:
                print("       {:5d} | {:.4f}".format(epoch, loss.item()))
    else:
        print("Ex39 — PyTorch not installed — concept: training loop printing epoch/loss table for monitoring")

def ex40():
    """MLP for multi-class classification"""
    if TORCH_AVAILABLE:
        from sklearn.datasets import make_classification
        torch.manual_seed(0)
        X_np, y_np = make_classification(n_samples=200, n_features=8, n_classes=3,
                                         n_informative=6, random_state=42)
        X = torch.tensor(X_np, dtype=torch.float32)
        y = torch.tensor(y_np, dtype=torch.long)
        model = nn.Sequential(nn.Linear(8, 32), nn.ReLU(), nn.Linear(32, 16), nn.ReLU(), nn.Linear(16, 3))
        opt = optim.Adam(model.parameters(), lr=0.01); crit = nn.CrossEntropyLoss()
        for _ in range(100):
            loss = crit(model(X), y); opt.zero_grad(); loss.backward(); opt.step()
        acc = (model(X).argmax(1) == y).float().mean().item()
        print("Ex40 — MLP 3-class accuracy:", round(acc, 4))
    else:
        print("Ex40 — PyTorch not installed — concept: MLP with n_classes output nodes + CrossEntropyLoss")

def ex41():
    """1D Convolutional layer"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        # (batch, channels, seq_len)
        x = torch.randn(4, 1, 16)
        conv = nn.Conv1d(in_channels=1, out_channels=8, kernel_size=3, padding=1)
        out = conv(x)
        print("Ex41 — Conv1d input:", x.shape, "| Output:", out.shape)
    else:
        print("Ex41 — PyTorch not installed — concept: nn.Conv1d(in_ch, out_ch, kernel) for sequence feature extraction")

def ex42():
    """LSTM for sequence modeling"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        lstm = nn.LSTM(input_size=4, hidden_size=8, num_layers=1, batch_first=True)
        x = torch.randn(3, 5, 4)   # (batch, seq_len, input_size)
        out, (h_n, c_n) = lstm(x)
        print("Ex42 — LSTM output:", out.shape, "| h_n:", h_n.shape, "| c_n:", c_n.shape)
    else:
        print("Ex42 — PyTorch not installed — concept: nn.LSTM(input_size, hidden_size) processes sequences with gating")

def ex43():
    """Gradient clipping"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Linear(4, 2)
        opt = optim.SGD(model.parameters(), lr=0.1)
        x = torch.randn(8, 4) * 100; y = torch.randint(0, 2, (8,))
        loss = nn.CrossEntropyLoss()(model(x), y)
        opt.zero_grad(); loss.backward()
        before = sum(p.grad.norm().item() for p in model.parameters() if p.grad is not None)
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        after = sum(p.grad.norm().item() for p in model.parameters() if p.grad is not None)
        opt.step()
        print("Ex43 — Grad norm before clip:", round(before, 4), "| After clip:", round(after, 4))
    else:
        print("Ex43 — PyTorch not installed — concept: nn.utils.clip_grad_norm_(params, max_norm) prevents explosion")

def ex44():
    """Mixed precision training concept"""
    if TORCH_AVAILABLE:
        # Show the pattern; actual AMP requires CUDA
        print("Ex44 — Mixed precision pattern:")
        print("  scaler = torch.cuda.amp.GradScaler()")
        print("  with torch.autocast(device_type='cuda', dtype=torch.float16):")
        print("      output = model(input)")
        print("      loss = criterion(output, target)")
        print("  scaler.scale(loss).backward()")
        print("  scaler.step(optimizer); scaler.update()")
        print("  Concept: float16 forward pass, float32 weight updates → 2x speedup on GPU")
    else:
        print("Ex44 — PyTorch not installed — concept: torch.autocast + GradScaler enable float16 training with stability")

def ex45():
    """Model summary: count parameters"""
    if TORCH_AVAILABLE:
        def count_params(model):
            total = sum(p.numel() for p in model.parameters())
            trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
            return total, trainable
        model = nn.Sequential(nn.Linear(128, 256), nn.ReLU(), nn.Linear(256, 128), nn.ReLU(), nn.Linear(128, 10))
        total, trainable = count_params(model)
        print("Ex45 — Total params:", total, "| Trainable:", trainable)
    else:
        print("Ex45 — PyTorch not installed — concept: sum(p.numel() for p in model.parameters()) counts weights")

def ex46():
    """Transfer learning concept"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        # Simulate: freeze pretrained layers, add new head
        pretrained = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 16))
        for param in pretrained.parameters():
            param.requires_grad = False
        new_head = nn.Linear(16, 3)
        model = nn.Sequential(pretrained, new_head)
        trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
        total = sum(p.numel() for p in model.parameters())
        print("Ex46 — Transfer learning | Frozen params:", total - trainable, "| Trainable:", trainable)
    else:
        print("Ex46 — PyTorch not installed — concept: freeze pretrained layers, train only new head")

def ex47():
    """Fine-tuning pattern (unfreeze top layers)"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Sequential(
            nn.Linear(8, 32), nn.ReLU(),   # layer 0,1
            nn.Linear(32, 16), nn.ReLU(),  # layer 2,3
            nn.Linear(16, 4)               # layer 4
        )
        for param in model.parameters(): param.requires_grad = False
        # Fine-tune only last layer
        for param in model[-1].parameters(): param.requires_grad = True
        trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
        print("Ex47 — Fine-tune last layer only | Trainable params:", trainable)
    else:
        print("Ex47 — PyTorch not installed — concept: unfreeze specific layers by setting requires_grad=True")

def ex48():
    """Model pruning concept"""
    if TORCH_AVAILABLE:
        import torch.nn.utils.prune as prune
        torch.manual_seed(0)
        linear = nn.Linear(4, 4)
        prune.l1_unstructured(linear, name='weight', amount=0.5)
        sparsity = (linear.weight == 0).float().mean().item()
        print("Ex48 — After L1 pruning (50%) | Sparsity:", round(sparsity, 4))
    else:
        print("Ex48 — PyTorch not installed — concept: torch.nn.utils.prune removes low-magnitude weights")

def ex49():
    """Quantization concept"""
    if TORCH_AVAILABLE:
        torch.manual_seed(0)
        model = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 2))
        model.eval()
        # Dynamic quantization
        try:
            q_model = torch.quantization.quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)
            print("Ex49 — Dynamic quantization applied | Model type:", type(q_model).__name__)
        except Exception as e:
            print("Ex49 — Quantization concept: torch.quantization.quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)")
            print("       Reduces model size ~4x by using int8 weights")
    else:
        print("Ex49 — PyTorch not installed — concept: quantize_dynamic converts float32 weights to int8 for faster inference")

def ex50():
    """Production inference wrapper"""
    if TORCH_AVAILABLE:
        class ProductionWrapper:
            def __init__(self, model):
                self.model = model
                self.model.eval()
                self.calls = 0

            def predict(self, X_numpy):
                self.calls += 1
                x = torch.tensor(X_numpy, dtype=torch.float32)
                with torch.no_grad():
                    logits = self.model(x)
                    probs = torch.softmax(logits, dim=1)
                    preds = probs.argmax(dim=1)
                return preds.numpy(), probs.numpy()

        torch.manual_seed(0)
        model = nn.Sequential(nn.Linear(4, 16), nn.ReLU(), nn.Linear(16, 3))
        wrapper = ProductionWrapper(model)
        X = np.random.randn(5, 4).astype(np.float32)
        preds, probs = wrapper.predict(X)
        print("Ex50 — Production preds:", preds, "| Max probs:", np.round(probs.max(axis=1), 4))
        print("       Total calls:", wrapper.calls)
    else:
        print("Ex50 — PyTorch not installed — concept: wrap model.eval() + no_grad() + softmax in a ProductionWrapper class")


def main():
    print("=" * 60)
    print("Examples 2.3 — PyTorch Introduction")
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
