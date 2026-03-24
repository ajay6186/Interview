# ============================================================
# Solution 1.2 — Calculus & Optimization
# ============================================================

import numpy as np
from typing import Callable, Tuple


def numerical_derivative(f: Callable, x: float, h: float = 1e-5) -> float:
    return (f(x + h) - f(x)) / h


def numerical_gradient(f: Callable, x: np.ndarray, h: float = 1e-5) -> np.ndarray:
    grad = np.zeros_like(x, dtype=float)
    for i in range(len(x)):
        x_fwd = x.copy()
        x_fwd[i] += h
        grad[i] = (f(x_fwd) - f(x)) / h
    return grad


def gd_step(x: np.ndarray, gradient: np.ndarray, lr: float) -> np.ndarray:
    return x - lr * gradient


def gd_minimize_1d(x0: float = 10.0, lr: float = 0.1, n_steps: int = 100) -> float:
    x = x0
    for _ in range(n_steps):
        grad = 2 * x + 3  # f'(x) = 2x + 3
        x = x - lr * grad
    return x


def gd_minimize_2d(x0: float = 5., y0: float = -3., lr: float = 0.1, n_steps: int = 100) -> Tuple[float, float]:
    x, y = x0, y0
    for _ in range(n_steps):
        gx, gy = 2 * x, 2 * y
        x = x - lr * gx
        y = y - lr * gy
    return x, y


def sgd_vs_gd(X: np.ndarray, y: np.ndarray, lr: float = 0.01, n_steps: int = 200):
    n, d = X.shape
    w_gd = np.zeros(d)
    w_sgd = np.zeros(d)

    # Full-batch GD
    for _ in range(n_steps):
        grad = (2 / n) * X.T @ (X @ w_gd - y)
        w_gd = w_gd - lr * grad

    # Stochastic GD
    for t in range(n_steps):
        idx = np.random.randint(n)
        x_i = X[idx]
        y_i = y[idx]
        grad = 2 * x_i * (np.dot(x_i, w_sgd) - y_i)
        w_sgd = w_sgd - lr * grad

    return w_gd, w_sgd


def momentum_step(x: np.ndarray, grad: np.ndarray, v: np.ndarray,
                  lr: float = 0.01, beta: float = 0.9) -> Tuple[np.ndarray, np.ndarray]:
    v_new = beta * v + (1 - beta) * grad
    x_new = x - lr * v_new
    return x_new, v_new


def adam_step(x: np.ndarray, grad: np.ndarray, m: np.ndarray, v: np.ndarray,
              t: int, lr: float = 0.001, beta1: float = 0.9,
              beta2: float = 0.999, eps: float = 1e-8) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    m_new = beta1 * m + (1 - beta1) * grad
    v_new = beta2 * v + (1 - beta2) * grad ** 2
    m_hat = m_new / (1 - beta1 ** t)
    v_hat = v_new / (1 - beta2 ** t)
    x_new = x - lr * m_hat / (np.sqrt(v_hat) + eps)
    return x_new, m_new, v_new


def step_decay_lr(initial_lr: float, epoch: int, drop_every: int = 10, drop_rate: float = 0.5) -> float:
    return initial_lr * (drop_rate ** (epoch // drop_every))


def is_convex_at(f: Callable, x: float, h: float = 1e-5) -> bool:
    second_deriv = (f(x + h) - 2 * f(x) + f(x - h)) / (h ** 2)
    return second_deriv >= 0


def chain_rule_example(x: float) -> float:
    # g(x) = 2x + 1, f(z) = z^2, L(y) = y
    # dL/dx = 2*g(x) * 2 = 4*(2x+1)
    g = lambda x: 2 * x + 1
    f = lambda z: z ** 2
    L = lambda y: y

    # Numerical chain: dL/dx ~= dL/df * df/dg * dg/dx
    dg_dx = numerical_derivative(g, x)
    df_dg = numerical_derivative(f, g(x))
    dL_df = numerical_derivative(L, f(g(x)))
    return dL_df * df_dg * dg_dx


def numerical_jacobian(f: Callable, x: np.ndarray, h: float = 1e-5) -> np.ndarray:
    f0 = f(x)
    m = len(f0)
    n = len(x)
    J = np.zeros((m, n))
    for j in range(n):
        x_fwd = x.copy().astype(float)
        x_fwd[j] += h
        J[:, j] = (f(x_fwd) - f0) / h
    return J


def newtons_method(f: Callable, x0: float = 1.0, n_steps: int = 50, tol: float = 1e-8) -> float:
    x = x0
    for _ in range(n_steps):
        fx = f(x)
        if abs(fx) < tol:
            break
        fpx = numerical_derivative(f, x)
        if abs(fpx) < 1e-12:
            break
        x = x - fx / fpx
    return x


def conjugate_gradient(A: np.ndarray, b: np.ndarray, tol: float = 1e-8, max_iter: int = 1000) -> np.ndarray:
    x = np.zeros_like(b, dtype=float)
    r = b - A @ x
    p = r.copy()
    rs_old = np.dot(r, r)

    for _ in range(max_iter):
        Ap = A @ p
        alpha = rs_old / np.dot(p, Ap)
        x = x + alpha * p
        r = r - alpha * Ap
        rs_new = np.dot(r, r)
        if np.sqrt(rs_new) < tol:
            break
        p = r + (rs_new / rs_old) * p
        rs_old = rs_new

    return x


def main():
    print("=== Solution 1.2: Calculus & Optimization ===\n")

    print("Result 1 — Numerical derivative of x^2 at x=3:", numerical_derivative(lambda x: x**2, 3.0))
    print("Result 2 — Gradient of x^2+y^2 at [1,2]:", numerical_gradient(lambda x: x[0]**2 + x[1]**2, np.array([1., 2.])))
    print("Result 3 — GD step:", gd_step(np.array([1., 1.]), np.array([2., 4.]), 0.1))
    print("Result 4 — GD minimize 1D (expect ~= -1.5):", round(gd_minimize_1d(), 6))
    print("Result 5 — GD minimize 2D (expect ~= (0,0)):", tuple(round(v, 6) for v in gd_minimize_2d()))

    np.random.seed(42)
    X = np.random.randn(20, 2)
    y = X @ np.array([2.0, -1.0]) + 0.1 * np.random.randn(20)
    w_gd, w_sgd = sgd_vs_gd(X, y)
    print("Result 6 — GD weights:", np.round(w_gd, 4), "| SGD weights:", np.round(w_sgd, 4))
    print("           True weights: [2.0, -1.0]")

    x0 = np.array([5.0])
    grad0 = np.array([10.0])
    v0 = np.zeros(1)
    x_new, v_new = momentum_step(x0, grad0, v0)
    print("Result 7 — Momentum step: x_new=", x_new, "v_new=", v_new)

    x0_adam = np.array([5.0])
    m0 = np.zeros(1)
    v0_adam = np.zeros(1)
    x_adam, m_adam, v_adam = adam_step(x0_adam, np.array([10.0]), m0, v0_adam, t=1)
    print("Result 8 — Adam step: x_new=", np.round(x_adam, 6))

    print("Result 9 — LR at epoch 10 (drop_every=5):", step_decay_lr(0.1, epoch=10, drop_every=5))
    print("Result 10 — x^2 convex at 0:", is_convex_at(lambda x: x**2, 0.0))
    print("           -x^2 convex at 0:", is_convex_at(lambda x: -x**2, 0.0))
    print("Result 11 — Chain rule at x=1 (expect ~= 12):", round(chain_rule_example(1.0), 4))

    f_vec = lambda x: np.array([x[0]**2, x[0]*x[1]])
    print("Result 12 — Jacobian:\n", np.round(numerical_jacobian(f_vec, np.array([1., 2.])), 4))
    print("Result 13 — Newton's method x^2-2=0 (expect ~= 1.4142):", round(newtons_method(lambda x: x**2 - 2, x0=1.0), 6))

    A_cg = np.array([[4., 1.], [1., 3.]])
    b_cg = np.array([1., 2.])
    sol = conjugate_gradient(A_cg, b_cg)
    print("Result 14 — CG solution:", np.round(sol, 6))
    print("           Verify A@x~=b:", np.round(A_cg @ sol, 6))


if __name__ == "__main__":
    main()
