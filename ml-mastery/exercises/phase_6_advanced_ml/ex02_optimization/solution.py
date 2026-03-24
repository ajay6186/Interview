# ============================================================
# Solution 6.2 — Optimization Algorithms
# ============================================================

import numpy as np


def _loss(w: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
    return float(0.5 * np.mean((X @ w - y) ** 2))

def _grad(w: np.ndarray, X: np.ndarray, y: np.ndarray) -> np.ndarray:
    return X.T @ (X @ w - y) / len(y)


def gradient_descent(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                     n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    history = []
    for _ in range(n_iters):
        w -= lr * _grad(w, X, y)
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def sgd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
        n_iters: int = 500) -> tuple:
    w = np.zeros(X.shape[1])
    history = []
    n = len(y)
    for _ in range(n_iters):
        idx = np.random.randint(n)
        g = X[idx] * (X[idx] @ w - y[idx])
        w -= lr * g
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def mini_batch_gd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                  batch_size: int = 16, n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    n = len(y)
    history = []
    for _ in range(n_iters):
        idx = np.random.choice(n, batch_size, replace=False)
        g = _grad(w, X[idx], y[idx])
        w -= lr * g
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def momentum_sgd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                 gamma: float = 0.9, n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    v = np.zeros_like(w)
    history = []
    for _ in range(n_iters):
        g = _grad(w, X, y)
        v = gamma * v - lr * g
        w += v
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def nesterov_gd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                gamma: float = 0.9, n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    v = np.zeros_like(w)
    history = []
    for _ in range(n_iters):
        w_lookahead = w + gamma * v
        g = _grad(w_lookahead, X, y)
        v = gamma * v - lr * g
        w += v
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def adagrad(X: np.ndarray, y: np.ndarray, lr: float = 0.1,
            eps: float = 1e-8, n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    G = np.zeros_like(w)
    history = []
    for _ in range(n_iters):
        g = _grad(w, X, y)
        G += g ** 2
        w -= lr / (np.sqrt(G) + eps) * g
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def rmsprop(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
            rho: float = 0.9, eps: float = 1e-8, n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    E_g2 = np.zeros_like(w)
    history = []
    for _ in range(n_iters):
        g = _grad(w, X, y)
        E_g2 = rho * E_g2 + (1 - rho) * g ** 2
        w -= lr / (np.sqrt(E_g2) + eps) * g
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def adam(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
         b1: float = 0.9, b2: float = 0.999, eps: float = 1e-8,
         n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    m = np.zeros_like(w)
    v = np.zeros_like(w)
    history = []
    for t in range(1, n_iters + 1):
        g = _grad(w, X, y)
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g ** 2
        m_hat = m / (1 - b1 ** t)
        v_hat = v / (1 - b2 ** t)
        w -= lr * m_hat / (np.sqrt(v_hat) + eps)
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def adamw(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
          weight_decay: float = 0.01, n_iters: int = 200) -> tuple:
    w = np.zeros(X.shape[1])
    m = np.zeros_like(w)
    v = np.zeros_like(w)
    b1, b2, eps = 0.9, 0.999, 1e-8
    history = []
    for t in range(1, n_iters + 1):
        g = _grad(w, X, y)
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g ** 2
        m_hat = m / (1 - b1 ** t)
        v_hat = v / (1 - b2 ** t)
        w -= lr * weight_decay * w          # weight decay
        w -= lr * m_hat / (np.sqrt(v_hat) + eps)
        history.append(_loss(w, X, y))
    return (np.round(w, 4), [round(l, 6) for l in history])


def step_decay(lr_0: float = 0.1, drop: float = 0.5,
               drop_every: int = 10, n_epochs: int = 50) -> list:
    return [round(lr_0 * (drop ** (e // drop_every)), 8) for e in range(n_epochs)]


def cosine_annealing(lr_max: float = 0.1, lr_min: float = 1e-4,
                     T: int = 50) -> list:
    return [
        round(lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * t / T)), 8)
        for t in range(T)
    ]


def warm_restarts(lr_max: float = 0.1, lr_min: float = 1e-4,
                  T_0: int = 10, T_mult: int = 2, n_steps: int = 60) -> list:
    lrs = []
    t_cur = 0
    T_cur = T_0
    for step in range(n_steps):
        lr = lr_min + 0.5 * (lr_max - lr_min) * (1 + np.cos(np.pi * t_cur / T_cur))
        lrs.append(round(lr, 8))
        t_cur += 1
        if t_cur >= T_cur:
            t_cur = 0
            T_cur *= T_mult
    return lrs


def clip_gradient(grad: np.ndarray, max_norm: float = 1.0) -> np.ndarray:
    norm = np.linalg.norm(grad)
    if norm > max_norm:
        return grad * (max_norm / norm)
    return grad


def newtons_method(X: np.ndarray, y: np.ndarray, tol: float = 1e-6,
                   max_iter: int = 50) -> tuple:
    n = len(y)
    H = X.T @ X / n       # Hessian for MSE
    H_inv = np.linalg.inv(H)
    w = np.zeros(X.shape[1])
    for step in range(max_iter):
        g = _grad(w, X, y)
        delta = H_inv @ g
        w -= delta
        if np.linalg.norm(delta) < tol:
            return (np.round(w, 4), step + 1)
    return (np.round(w, 4), max_iter)


def lr_sensitivity(X: np.ndarray, y: np.ndarray) -> dict:
    lrs = [0.0001, 0.001, 0.01, 0.1, 0.5]
    results = {}
    for lr in lrs:
        _, history = gradient_descent(X, y, lr=lr, n_iters=200)
        results[lr] = history[-1]
    return results


def main():
    print("=== Solution 6.2: Optimization Algorithms ===\n")

    np.random.seed(42)
    n, d = 100, 3
    X = np.random.randn(n, d)
    true_w = np.array([1.0, -2.0, 0.5])
    y = X @ true_w + 0.1 * np.random.randn(n)

    w_gd, hist_gd = gradient_descent(X, y)
    print("Result 1  - Batch GD:     w={} loss={:.6f}".format(w_gd, hist_gd[-1]))

    w_sgd, hist_sgd = sgd(X, y)
    print("Result 2  - SGD:          w={} loss={:.6f}".format(w_sgd, hist_sgd[-1]))

    w_mb, hist_mb = mini_batch_gd(X, y)
    print("Result 3  - Mini-batch:   w={} loss={:.6f}".format(w_mb, hist_mb[-1]))

    w_mom, hist_mom = momentum_sgd(X, y)
    print("Result 4  - Momentum:     w={} loss={:.6f}".format(w_mom, hist_mom[-1]))

    w_nes, hist_nes = nesterov_gd(X, y)
    print("Result 5  - Nesterov:     w={} loss={:.6f}".format(w_nes, hist_nes[-1]))

    w_ada, hist_ada = adagrad(X, y)
    print("Result 6  - Adagrad:      w={} loss={:.6f}".format(w_ada, hist_ada[-1]))

    w_rms, hist_rms = rmsprop(X, y)
    print("Result 7  - RMSprop:      w={} loss={:.6f}".format(w_rms, hist_rms[-1]))

    w_adam, hist_adam = adam(X, y)
    print("Result 8  - Adam:         w={} loss={:.6f}".format(w_adam, hist_adam[-1]))

    w_aw, hist_aw = adamw(X, y)
    print("Result 9  - AdamW:        w={} loss={:.6f}".format(w_aw, hist_aw[-1]))

    sd = step_decay()
    print("Result 10 - Step decay (epochs 0,10,20,30,40):", sd[0], sd[10], sd[20], sd[30], sd[40])

    ca = cosine_annealing()
    print("Result 11 - Cosine annealing (first 5):", ca[:5])

    wr = warm_restarts()
    print("Result 12 - Warm restarts (first 15):", wr[:15])

    g = np.array([3.0, 4.0])
    print("Result 13 - Gradient clipping (norm 5 → 1):", clip_gradient(g, 1.0), "norm:", round(float(np.linalg.norm(clip_gradient(g, 1.0))), 4))

    w_n, steps = newtons_method(X, y)
    print("Result 14 - Newton's: w={} converged in {} steps".format(w_n, steps))

    print("Result 15 - LR sensitivity:", lr_sensitivity(X, y))

    print("\n  True weights:", true_w)


if __name__ == "__main__":
    main()
