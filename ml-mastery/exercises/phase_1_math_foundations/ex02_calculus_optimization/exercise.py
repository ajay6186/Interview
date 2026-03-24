# ============================================================
# Exercise 1.2 — Calculus & Optimization
# ============================================================
# Topics:
#   • Numerical differentiation (forward difference, gradient, Jacobian)
#   • Gradient descent (vanilla, 2D, SGD)
#   • Advanced optimizers: Momentum, Adam, learning rate decay
#   • Convexity, chain rule, Newton's method
# ============================================================

import numpy as np
from typing import Callable, Tuple

# ---------------------------------------------------------------------------
# TODO 1: Numerical Derivative (Forward Difference)
# ---------------------------------------------------------------------------
# Approximate df/dx at point x using forward difference:
#   f'(x) ≈ (f(x + h) - f(x)) / h
# Expected: numerical_derivative(lambda x: x**2, 3.0) ≈ 6.0

def numerical_derivative(f: Callable, x: float, h: float = 1e-5) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: Numerical Gradient
# ---------------------------------------------------------------------------
# Given a scalar function f(x) where x is a numpy array, return the
# gradient vector using forward differences for each component.
# Expected: numerical_gradient(lambda x: x[0]**2 + x[1]**2, np.array([1.,2.])) ≈ [2., 4.]

def numerical_gradient(f: Callable, x: np.ndarray, h: float = 1e-5) -> np.ndarray:
    pass  # TODO: implement (perturb each dimension independently)


# ---------------------------------------------------------------------------
# TODO 3: Gradient Descent Step
# ---------------------------------------------------------------------------
# Perform one step of gradient descent:
#   x_new = x - lr * gradient
# Expected: gd_step(np.array([1.,1.]), np.array([2.,4.]), 0.1) == [0.8, 0.6]

def gd_step(x: np.ndarray, gradient: np.ndarray, lr: float) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Gradient Descent to Minimize f(x) = x^2 + 3x + 2
# ---------------------------------------------------------------------------
# Run gradient descent starting from x0 for n_steps steps with given lr.
# f'(x) = 2x + 3  (minimum at x = -1.5)
# Return the final x value.
# Expected: gd_minimize_1d(x0=10.0, lr=0.1, n_steps=100) ≈ -1.5

def gd_minimize_1d(x0: float = 10.0, lr: float = 0.1, n_steps: int = 100) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Gradient Descent on 2D Function f(x,y) = x^2 + y^2
# ---------------------------------------------------------------------------
# Run GD starting from (x0, y0) for n_steps. Return final (x, y).
# Gradient: [2x, 2y]  (minimum at origin)
# Expected: gd_minimize_2d(x0=5., y0=-3., lr=0.1, n_steps=100) ≈ (0., 0.)

def gd_minimize_2d(x0: float = 5., y0: float = -3., lr: float = 0.1, n_steps: int = 100) -> Tuple[float, float]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: SGD vs GD Comparison
# ---------------------------------------------------------------------------
# Simulate minimizing f(w) = mean((X @ w - y)^2) (linear regression MSE).
# GD uses full batch; SGD uses one random sample per step.
# Return (w_gd, w_sgd) after n_steps each, starting from w=zeros.
# Expected: both should converge toward the least-squares solution.

def sgd_vs_gd(X: np.ndarray, y: np.ndarray, lr: float = 0.01, n_steps: int = 200):
    pass  # TODO: implement — return (w_gd, w_sgd)


# ---------------------------------------------------------------------------
# TODO 7: Momentum Update
# ---------------------------------------------------------------------------
# Implements one step of gradient descent with momentum:
#   v_new = beta * v + (1 - beta) * gradient
#   x_new = x - lr * v_new
# Return (x_new, v_new).
# Expected: momentum_step(x=np.array([1.]), grad=np.array([2.]), v=np.zeros(1), lr=0.1, beta=0.9)

def momentum_step(x: np.ndarray, grad: np.ndarray, v: np.ndarray,
                  lr: float = 0.01, beta: float = 0.9) -> Tuple[np.ndarray, np.ndarray]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Adam Optimizer Step
# ---------------------------------------------------------------------------
# One step of Adam:
#   m = beta1 * m + (1 - beta1) * grad
#   v = beta2 * v + (1 - beta2) * grad^2
#   m_hat = m / (1 - beta1^t)
#   v_hat = v / (1 - beta2^t)
#   x_new = x - lr * m_hat / (sqrt(v_hat) + eps)
# Return (x_new, m_new, v_new).

def adam_step(x: np.ndarray, grad: np.ndarray, m: np.ndarray, v: np.ndarray,
              t: int, lr: float = 0.001, beta1: float = 0.9,
              beta2: float = 0.999, eps: float = 1e-8) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Learning Rate Decay (Step Decay)
# ---------------------------------------------------------------------------
# Compute the learning rate at epoch `epoch` using step decay:
#   lr = initial_lr * drop_rate ^ floor(epoch / drop_every)
# Expected: step_decay_lr(0.1, epoch=10, drop_every=5, drop_rate=0.5) == 0.025

def step_decay_lr(initial_lr: float, epoch: int, drop_every: int = 10, drop_rate: float = 0.5) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: Convexity Check (Second Derivative Test)
# ---------------------------------------------------------------------------
# A function f is (locally) convex at x if f''(x) >= 0.
# Use numerical second derivative: f''(x) ≈ (f(x+h) - 2f(x) + f(x-h)) / h^2
# Return True if convex at x, False otherwise.
# Expected: is_convex_at(lambda x: x**2, 0.0) == True
#           is_convex_at(lambda x: -x**2, 0.0) == False

def is_convex_at(f: Callable, x: float, h: float = 1e-5) -> bool:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Chain Rule Example
# ---------------------------------------------------------------------------
# Compute dL/dx for the composition L(f(g(x))):
#   g(x) = 2x + 1
#   f(z) = z^2
#   L(y) = y (identity, so dL/dy = 1)
# dL/dx = dL/df * df/dg * dg/dx = 1 * 2*g(x) * 2 = 4*(2x+1)
# Return dL/dx evaluated at x using numerical derivatives chained together.
# Expected: chain_rule_example(1.0) ≈ 12.0  (4*(2*1+1) = 12)

def chain_rule_example(x: float) -> float:
    pass  # TODO: implement using numerical_derivative applied in chain


# ---------------------------------------------------------------------------
# TODO 12: Numerical Jacobian
# ---------------------------------------------------------------------------
# Given vector-valued function f: R^n -> R^m, return the Jacobian matrix J
# where J[i,j] = df_i / dx_j, computed via forward differences.
# Expected: numerical_jacobian(lambda x: np.array([x[0]**2, x[0]*x[1]]), np.array([1.,2.])) ≈ [[2,0],[2,1]]

def numerical_jacobian(f: Callable, x: np.ndarray, h: float = 1e-5) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Newton's Method for Root Finding
# ---------------------------------------------------------------------------
# Find a root of f(x) = 0 using Newton's method:
#   x_new = x - f(x) / f'(x)
# Use numerical_derivative for f'(x). Run for n_steps or until |f(x)| < tol.
# Expected: newtons_method(lambda x: x**2 - 2, x0=1.0) ≈ 1.4142

def newtons_method(f: Callable, x0: float = 1.0, n_steps: int = 50, tol: float = 1e-8) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Conjugate Gradient Concept
# ---------------------------------------------------------------------------
# Solve Ax = b using the conjugate gradient method (for symmetric positive
# definite A). Implement the basic CG loop.
# Return solution x.
# Expected: conjugate_gradient(np.array([[4,1],[1,3]],float), np.array([1.,2.])) ≈ [0.0909, 0.6364]

def conjugate_gradient(A: np.ndarray, b: np.ndarray, tol: float = 1e-8, max_iter: int = 1000) -> np.ndarray:
    pass  # TODO: implement the CG algorithm


def main():
    print("=== Exercise 1.2: Calculus & Optimization ===\n")

    print("TODO 1 — Numerical derivative of x^2 at x=3:", numerical_derivative(lambda x: x**2, 3.0))
    print("TODO 2 — Gradient of x^2+y^2 at [1,2]:", numerical_gradient(lambda x: x[0]**2 + x[1]**2, np.array([1., 2.])))
    print("TODO 3 — GD step:", gd_step(np.array([1., 1.]), np.array([2., 4.]), 0.1))
    print("TODO 4 — GD minimize 1D:", gd_minimize_1d())
    print("TODO 5 — GD minimize 2D:", gd_minimize_2d())

    np.random.seed(42)
    X = np.random.randn(20, 2)
    y = X @ np.array([2.0, -1.0]) + 0.1 * np.random.randn(20)
    result = sgd_vs_gd(X, y)
    if result is not None:
        w_gd, w_sgd = result
        print("TODO 6 — GD weights:", w_gd, "| SGD weights:", w_sgd)

    x0 = np.array([5.0])
    grad0 = np.array([10.0])
    v0 = np.zeros(1)
    result7 = momentum_step(x0, grad0, v0)
    print("TODO 7 — Momentum step:", result7)

    x0_adam = np.array([5.0])
    m0 = np.zeros(1)
    v0_adam = np.zeros(1)
    result8 = adam_step(x0_adam, np.array([10.0]), m0, v0_adam, t=1)
    print("TODO 8 — Adam step:", result8)

    print("TODO 9 — LR at epoch 10:", step_decay_lr(0.1, epoch=10, drop_every=5))
    print("TODO 10 — Convex check x^2 at 0:", is_convex_at(lambda x: x**2, 0.0))
    print("TODO 11 — Chain rule at x=1:", chain_rule_example(1.0))

    f_vec = lambda x: np.array([x[0]**2, x[0]*x[1]])
    print("TODO 12 — Jacobian:\n", numerical_jacobian(f_vec, np.array([1., 2.])))
    print("TODO 13 — Newton's method (x^2-2=0):", newtons_method(lambda x: x**2 - 2, x0=1.0))

    A_cg = np.array([[4., 1.], [1., 3.]])
    b_cg = np.array([1., 2.])
    print("TODO 14 — Conjugate gradient:", conjugate_gradient(A_cg, b_cg))


if __name__ == "__main__":
    main()
