# ============================================================
# Exercise 6.2 — Optimization Algorithms
# ============================================================
# Topics:
#   • Gradient descent: batch, SGD, mini-batch
#   • Momentum SGD, Nesterov accelerated gradient
#   • Adagrad, RMSprop, Adam (from scratch), AdamW
#   • Learning rate scheduling: step decay, cosine annealing,
#     warm restarts
#   • Gradient clipping
#   • Second-order optimization: Newton's method
#   • Hyperparameter sensitivity (vary lr, convergence)
# ============================================================

import numpy as np


# Shared helper: quadratic loss on a linear model
# Loss(w) = mean((X @ w - y)^2) / 2
# Gradient = X.T @ (X @ w - y) / n

def _loss(w: np.ndarray, X: np.ndarray, y: np.ndarray) -> float:
    residuals = X @ w - y
    return float(0.5 * np.mean(residuals ** 2))

def _grad(w: np.ndarray, X: np.ndarray, y: np.ndarray) -> np.ndarray:
    return X.T @ (X @ w - y) / len(y)


# --- TODO 1: Batch gradient descent ---
# Run for n_iters, return (final_w, loss_history).
def gradient_descent(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                     n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 2: Stochastic gradient descent ---
# One random sample per step. Return (final_w, loss_history).
def sgd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
        n_iters: int = 500) -> tuple:
    pass  # TODO: implement


# --- TODO 3: Mini-batch gradient descent ---
# batch_size samples per step. Return (final_w, loss_history).
def mini_batch_gd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                  batch_size: int = 16, n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 4: Momentum SGD ---
# v = gamma*v - lr*grad; w += v
# Return (final_w, loss_history).
def momentum_sgd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                 gamma: float = 0.9, n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 5: Nesterov accelerated gradient ---
# Look-ahead: g = grad(w + gamma*v); v = gamma*v - lr*g; w += v
# Return (final_w, loss_history).
def nesterov_gd(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
                gamma: float = 0.9, n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 6: Adagrad ---
# G += grad^2; w -= lr / sqrt(G + eps) * grad
# Return (final_w, loss_history).
def adagrad(X: np.ndarray, y: np.ndarray, lr: float = 0.1,
            eps: float = 1e-8, n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 7: RMSprop ---
# E[g^2] = rho*E[g^2] + (1-rho)*grad^2; w -= lr/sqrt(E[g^2]+eps)*grad
# Return (final_w, loss_history).
def rmsprop(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
            rho: float = 0.9, eps: float = 1e-8, n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 8: Adam optimizer (from scratch) ---
# m = b1*m + (1-b1)*g; v = b2*v + (1-b2)*g^2
# m_hat = m/(1-b1^t); v_hat = v/(1-b2^t)
# w -= lr * m_hat / (sqrt(v_hat) + eps)
# Return (final_w, loss_history).
def adam(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
         b1: float = 0.9, b2: float = 0.999, eps: float = 1e-8,
         n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 9: AdamW (Adam with weight decay) ---
# Same as Adam but w -= lr * lambda_wd * w before update.
# Return (final_w, loss_history).
def adamw(X: np.ndarray, y: np.ndarray, lr: float = 0.01,
          weight_decay: float = 0.01, n_iters: int = 200) -> tuple:
    pass  # TODO: implement


# --- TODO 10: Step decay schedule ---
# lr = lr_0 * drop^(floor(epoch / drop_every))
# Return list of lr values for epochs 0..n_epochs-1.
def step_decay(lr_0: float = 0.1, drop: float = 0.5,
               drop_every: int = 10, n_epochs: int = 50) -> list:
    pass  # TODO: implement


# --- TODO 11: Cosine annealing ---
# lr_t = lr_min + 0.5*(lr_max-lr_min)*(1 + cos(pi*t/T))
# Return list of lr values for t = 0..T-1.
def cosine_annealing(lr_max: float = 0.1, lr_min: float = 1e-4,
                     T: int = 50) -> list:
    pass  # TODO: implement


# --- TODO 12: Warm restarts (SGDR) ---
# Cosine anneal for T_0 steps, then restart with T_i *= T_mult.
# Return list of lr values for total n_steps.
def warm_restarts(lr_max: float = 0.1, lr_min: float = 1e-4,
                  T_0: int = 10, T_mult: int = 2, n_steps: int = 60) -> list:
    pass  # TODO: implement


# --- TODO 13: Gradient clipping ---
# Clip gradient by global norm: if ||g|| > max_norm, scale g.
# Return clipped gradient.
def clip_gradient(grad: np.ndarray, max_norm: float = 1.0) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 14: Newton's method ---
# w_new = w - H^{-1} @ g, where H is the Hessian of MSE loss.
# H = X^T @ X / n
# Return (final_w, n_steps_to_converge).
def newtons_method(X: np.ndarray, y: np.ndarray, tol: float = 1e-6,
                   max_iter: int = 50) -> tuple:
    pass  # TODO: implement


# --- TODO 15: Learning rate sensitivity ---
# Run gradient_descent with lr in [0.0001, 0.001, 0.01, 0.1, 0.5].
# Return dict {lr: final_loss}.
def lr_sensitivity(X: np.ndarray, y: np.ndarray) -> dict:
    pass  # TODO: implement


def main():
    print("=== Exercise 6.2: Optimization Algorithms ===\n")

    np.random.seed(42)
    n, d = 100, 3
    X = np.random.randn(n, d)
    true_w = np.array([1.0, -2.0, 0.5])
    y = X @ true_w + 0.1 * np.random.randn(n)

    w_gd, hist_gd = gradient_descent(X, y) or (None, None)
    print("TODO 1  - Batch GD final w:", w_gd, "final loss:", hist_gd[-1] if hist_gd else None)

    w_sgd, hist_sgd = sgd(X, y) or (None, None)
    print("TODO 2  - SGD final w:", w_sgd)

    w_mb, hist_mb = mini_batch_gd(X, y) or (None, None)
    print("TODO 3  - Mini-batch GD final w:", w_mb)

    w_mom, hist_mom = momentum_sgd(X, y) or (None, None)
    print("TODO 4  - Momentum SGD final w:", w_mom)

    w_nes, hist_nes = nesterov_gd(X, y) or (None, None)
    print("TODO 5  - Nesterov GD final w:", w_nes)

    w_ada, hist_ada = adagrad(X, y) or (None, None)
    print("TODO 6  - Adagrad final w:", w_ada)

    w_rms, hist_rms = rmsprop(X, y) or (None, None)
    print("TODO 7  - RMSprop final w:", w_rms)

    w_adam, hist_adam = adam(X, y) or (None, None)
    print("TODO 8  - Adam final w:", w_adam)

    w_aw, hist_aw = adamw(X, y) or (None, None)
    print("TODO 9  - AdamW final w:", w_aw)

    print("TODO 10 - Step decay (first 5):", step_decay()[:5] if step_decay() else None)
    print("TODO 11 - Cosine annealing (first 5):", cosine_annealing()[:5] if cosine_annealing() else None)
    print("TODO 12 - Warm restarts (first 15):", warm_restarts()[:15] if warm_restarts() else None)

    g = np.array([3.0, 4.0])
    print("TODO 13 - Gradient clipping (norm=1):", clip_gradient(g, max_norm=1.0))

    w_newton, steps = newtons_method(X, y) or (None, None)
    print("TODO 14 - Newton's method final w:", w_newton, "steps:", steps)

    print("TODO 15 - LR sensitivity:", lr_sensitivity(X, y))


if __name__ == "__main__":
    main()
