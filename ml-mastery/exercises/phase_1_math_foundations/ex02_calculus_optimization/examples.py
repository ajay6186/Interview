# ============================================================
# Examples 1.2 — Calculus & Optimization (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import math

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Numerical derivative — forward difference"""
    f = lambda x: x ** 2
    x, h = 3.0, 1e-5
    deriv = (f(x + h) - f(x)) / h
    print(f"Ex01 — f'(3) forward diff: {deriv:.6f} (exact: 6.0)")

def ex02():
    """Numerical derivative — central difference"""
    f = lambda x: x ** 3
    x, h = 2.0, 1e-5
    deriv = (f(x + h) - f(x - h)) / (2 * h)
    print(f"Ex02 — f'(2) central diff: {deriv:.6f} (exact: 12.0)")

def ex03():
    """Gradient of f(x,y) = x² + y²"""
    def grad_f(x, y, h=1e-5):
        dfx = (x + h) ** 2 + y ** 2 - (x ** 2 + y ** 2)
        dfy = x ** 2 + (y + h) ** 2 - (x ** 2 + y ** 2)
        return np.array([dfx / h, dfy / h])
    g = grad_f(3.0, 4.0)
    print(f"Ex03 — gradient at (3,4): {np.round(g, 4)} (exact: [6, 8])")

def ex04():
    """Gradient descent single step"""
    x = np.array([3.0, 4.0])
    grad = 2 * x          # gradient of ||x||²
    lr = 0.1
    x_new = x - lr * grad
    print(f"Ex04 — after one GD step: {x_new}")

def ex05():
    """Minimize x² with gradient descent (100 steps)"""
    x = 10.0
    lr = 0.1
    for _ in range(100):
        x = x - lr * (2 * x)
    print(f"Ex05 — minimized x²: x≈{x:.8f} (should be ≈0)")

def ex06():
    """Gradient norm"""
    grad = np.array([3.0, 4.0, 0.0])
    gnorm = np.linalg.norm(grad)
    print(f"Ex06 — gradient norm: {gnorm:.4f}")

def ex07():
    """Hessian matrix (numerical, f(x,y) = x²+xy+y²)"""
    f = lambda x, y: x**2 + x*y + y**2
    x, y, h = 1.0, 1.0, 1e-4
    fxx = (f(x+h,y) - 2*f(x,y) + f(x-h,y)) / h**2
    fyy = (f(x,y+h) - 2*f(x,y) + f(x,y-h)) / h**2
    fxy = (f(x+h,y+h) - f(x+h,y-h) - f(x-h,y+h) + f(x-h,y-h)) / (4*h**2)
    H = np.array([[fxx, fxy],[fxy, fyy]])
    print(f"Ex07 — Hessian:\n{np.round(H, 4)}")

def ex08():
    """Saddle point detection via eigenvalues of Hessian"""
    H = np.array([[1.0, 0.0], [0.0, -1.0]])
    eigvals = np.linalg.eigvalsh(H)
    is_saddle = eigvals[0] < 0 < eigvals[-1]
    print(f"Ex08 — Hessian eigvals: {eigvals}, saddle point: {is_saddle}")

def ex09():
    """Convexity check via second derivative (f=x² is convex, f=-x² is not)"""
    f1_dd = lambda x: 2.0         # d²/dx² of x²
    f2_dd = lambda x: -2.0        # d²/dx² of -x²
    print(f"Ex09 — x² convex: {f1_dd(0) > 0}, -x² convex: {f2_dd(0) > 0}")

def ex10():
    """Chain rule: d/dx sin(x²) = cos(x²)*2x"""
    x = np.array([0.5, 1.0, 1.5])
    deriv = np.cos(x**2) * 2 * x
    print(f"Ex10 — chain rule d/dx sin(x²) at x={x}: {np.round(deriv, 4)}")

def ex11():
    """Learning rate effect: large vs small on convergence"""
    x_small, x_large = 10.0, 10.0
    for _ in range(20):
        x_small -= 0.05 * (2 * x_small)
        x_large -= 0.95 * (2 * x_large)
    print(f"Ex11 — after 20 steps: lr=0.05 → x={x_small:.4f}, lr=0.95 → x={x_large:.4f}")

def ex12():
    """Gradient descent path data (first 5 steps)"""
    x = 8.0
    lr, path = 0.2, [8.0]
    for _ in range(4):
        x = x - lr * (2 * x)
        path.append(round(x, 4))
    print(f"Ex12 — GD path (x²): {path}")

def ex13():
    """Convergence criterion: stop when gradient norm < tol"""
    x, lr, tol = 5.0, 0.1, 1e-6
    steps = 0
    while abs(2 * x) > tol:
        x = x - lr * (2 * x)
        steps += 1
    print(f"Ex13 — converged in {steps} steps, x≈{x:.8f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """SGD vs GD comparison on y=x² (loss after 50 steps)"""
    np.random.seed(0)
    x_gd, x_sgd = 10.0, 10.0
    lr = 0.1
    for _ in range(50):
        x_gd -= lr * (2 * x_gd)
        noise = np.random.randn() * 0.5
        x_sgd -= lr * (2 * x_sgd + noise)
    print(f"Ex14 — GD x²={x_gd**2:.6f}, SGD x²={x_sgd**2:.6f}")

def ex15():
    """Momentum update step"""
    x, v = 10.0, 0.0
    lr, beta = 0.1, 0.9
    grad = 2 * x
    v = beta * v + (1 - beta) * grad
    x = x - lr * v
    print(f"Ex15 — momentum step: x={x:.4f}, v={v:.4f}")

def ex16():
    """RMSprop step"""
    x = 10.0
    lr, beta, eps = 0.1, 0.9, 1e-8
    s = 0.0
    grad = 2 * x
    s = beta * s + (1 - beta) * grad**2
    x = x - lr * grad / (math.sqrt(s) + eps)
    print(f"Ex16 — RMSprop step: x={x:.4f}")

def ex17():
    """Adam optimizer single step"""
    x = 10.0
    lr, b1, b2, eps, t = 0.1, 0.9, 0.999, 1e-8, 1
    m, v = 0.0, 0.0
    grad = 2 * x
    m = b1 * m + (1 - b1) * grad
    v = b2 * v + (1 - b2) * grad**2
    m_hat = m / (1 - b1**t)
    v_hat = v / (1 - b2**t)
    x = x - lr * m_hat / (math.sqrt(v_hat) + eps)
    print(f"Ex17 — Adam step: x={x:.4f}")

def ex18():
    """AdaGrad step"""
    x = 10.0
    lr, eps = 0.5, 1e-8
    G = 0.0
    grad = 2 * x
    G += grad**2
    x = x - lr * grad / (math.sqrt(G) + eps)
    print(f"Ex18 — AdaGrad step: x={x:.4f}")

def ex19():
    """Nesterov (NAG) step"""
    x, v = 10.0, 0.0
    lr, beta = 0.1, 0.9
    x_ahead = x - beta * v
    grad_ahead = 2 * x_ahead
    v = beta * v + lr * grad_ahead
    x = x - v
    print(f"Ex19 — Nesterov step: x={x:.4f}")

def ex20():
    """Learning rate decay — step decay (halve every 10 epochs)"""
    lr0, decay, step = 0.1, 0.5, 10
    schedule = [lr0 * (decay ** (e // step)) for e in range(30)]
    print(f"Ex20 — LR schedule (epochs 0,9,10,19,20,29): "
          f"{[round(schedule[i], 5) for i in [0,9,10,19,20,29]]}")

def ex21():
    """Cosine annealing schedule"""
    lr_max, T_max = 0.1, 50
    lrs = [lr_max * 0.5 * (1 + math.cos(math.pi * t / T_max)) for t in range(T_max)]
    print(f"Ex21 — cosine anneal (t=0,25,49): {[round(lrs[i], 4) for i in [0,25,49]]}")

def ex22():
    """Warm restarts (cosine with restart at T=25)"""
    lr_max, T = 0.1, 25
    def warm_lr(t):
        return lr_max * 0.5 * (1 + math.cos(math.pi * (t % T) / T))
    vals = [round(warm_lr(t), 4) for t in [0, 12, 24, 25, 37, 49]]
    print(f"Ex22 — warm restart LR at t=0,12,24,25,37,49: {vals}")

def ex23():
    """Gradient clipping by norm"""
    grad = np.array([10.0, 10.0, 10.0])
    max_norm = 1.0
    gnorm = np.linalg.norm(grad)
    clipped = grad * (max_norm / gnorm) if gnorm > max_norm else grad
    print(f"Ex23 — clipped gradient norm: {np.linalg.norm(clipped):.4f} (max={max_norm})")

def ex24():
    """Gradient clipping by value"""
    grad = np.array([-5.0, 3.0, 8.0, -2.0])
    clipped = np.clip(grad, -1.0, 1.0)
    print(f"Ex24 — value-clipped gradient: {clipped}")

def ex25():
    """Vanishing gradient simulation (sigmoid deep network)"""
    sigmoid_deriv = lambda x: (1 / (1 + np.exp(-x))) * (1 - 1 / (1 + np.exp(-x)))
    x = 0.0
    grad = 1.0
    for layer in range(10):
        grad *= sigmoid_deriv(x)
    print(f"Ex25 — gradient after 10 sigmoid layers: {grad:.6e} (vanishing)")

def ex26():
    """Exploding gradient simulation"""
    grad = 1.0
    W_norm = 2.0
    for layer in range(10):
        grad *= W_norm
    print(f"Ex26 — gradient after 10 layers (W_norm=2): {grad:.2f} (exploding)")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """GradientDescent class with fit method"""
    class GradientDescent:
        def __init__(self, lr=0.1, max_iter=100, tol=1e-6):
            self.lr = lr
            self.max_iter = max_iter
            self.tol = tol
        def fit(self, x0, grad_fn):
            x = x0
            for i in range(self.max_iter):
                g = grad_fn(x)
                if np.linalg.norm(g) < self.tol:
                    break
                x = x - self.lr * g
            return x, i
    gd = GradientDescent(lr=0.1)
    x_opt, iters = gd.fit(np.array([5.0, 5.0]), lambda x: 2 * x)
    print(f"Ex27 — GD converged in {iters} iters, x={np.round(x_opt, 6)}")

def ex28():
    """SGD class with mini-batch support"""
    class SGD:
        def __init__(self, lr=0.01):
            self.lr = lr
        def step(self, x, grads_batch):
            grad_mean = np.mean(grads_batch, axis=0)
            return x - self.lr * grad_mean
    np.random.seed(0)
    x = np.array([10.0])
    sgd = SGD(lr=0.1)
    for _ in range(20):
        batch_grads = np.array([2 * x + np.random.randn(1) * 0.1 for _ in range(8)])
        x = sgd.step(x, batch_grads)
    print(f"Ex28 — SGD mini-batch result: x={x[0]:.4f}")

def ex29():
    """Adam class — full implementation over 50 steps"""
    class Adam:
        def __init__(self, lr=0.01, b1=0.9, b2=0.999, eps=1e-8):
            self.lr, self.b1, self.b2, self.eps = lr, b1, b2, eps
            self.m, self.v, self.t = 0.0, 0.0, 0
        def step(self, x, grad):
            self.t += 1
            self.m = self.b1 * self.m + (1 - self.b1) * grad
            self.v = self.b2 * self.v + (1 - self.b2) * grad**2
            m_hat = self.m / (1 - self.b1**self.t)
            v_hat = self.v / (1 - self.b2**self.t)
            return x - self.lr * m_hat / (math.sqrt(v_hat) + self.eps)
    x = 10.0
    adam = Adam(lr=0.5)
    for _ in range(50):
        x = adam.step(x, 2 * x)
    print(f"Ex29 — Adam 50 steps: x={x:.6f}")

def ex30():
    """LRScheduler class (step, cosine, linear modes)"""
    class LRScheduler:
        def __init__(self, lr0, mode='step', decay=0.5, step_size=10, T_max=50):
            self.lr0, self.mode = lr0, mode
            self.decay, self.step_size, self.T_max = decay, step_size, T_max
        def get(self, epoch):
            if self.mode == 'step':
                return self.lr0 * (self.decay ** (epoch // self.step_size))
            elif self.mode == 'cosine':
                return self.lr0 * 0.5 * (1 + math.cos(math.pi * epoch / self.T_max))
            elif self.mode == 'linear':
                return self.lr0 * max(0, 1 - epoch / self.T_max)
    sched = LRScheduler(0.1, mode='cosine', T_max=50)
    vals = [round(sched.get(e), 4) for e in [0, 25, 50]]
    print(f"Ex30 — LRScheduler cosine at e=0,25,50: {vals}")

def ex31():
    """OptimizationBenchmark class — compare GD and Adam on x²"""
    class OptimizationBenchmark:
        def __init__(self, x0=10.0, n_steps=50):
            self.x0, self.n_steps = x0, n_steps
        def run_gd(self, lr=0.1):
            x = self.x0
            for _ in range(self.n_steps):
                x -= lr * (2 * x)
            return x
        def run_adam(self, lr=0.5):
            x, m, v = self.x0, 0.0, 0.0
            for t in range(1, self.n_steps + 1):
                g = 2 * x
                m = 0.9 * m + 0.1 * g
                v = 0.999 * v + 0.001 * g**2
                x -= lr * (m / (1 - 0.9**t)) / (math.sqrt(v / (1 - 0.999**t)) + 1e-8)
            return x
    bench = OptimizationBenchmark()
    print(f"Ex31 — GD x={bench.run_gd():.6f}, Adam x={bench.run_adam():.6f}")

def ex32():
    """Newton's method class for scalar functions"""
    class NewtonsMethod:
        def __init__(self, tol=1e-8, max_iter=50):
            self.tol, self.max_iter = tol, max_iter
        def solve(self, f, df, ddf, x0):
            x = x0
            for i in range(self.max_iter):
                step = df(x) / ddf(x)
                x -= step
                if abs(step) < self.tol:
                    break
            return x, i
    nm = NewtonsMethod()
    # minimize f(x) = x^4 - 3x^2 + 2: f'= 4x^3 - 6x, f'' = 12x^2 - 6
    x_opt, iters = nm.solve(None, lambda x: 4*x**3 - 6*x, lambda x: 12*x**2 - 6, x0=2.0)
    print(f"Ex32 — Newton's method: x={x_opt:.6f} in {iters} iters")

def ex33():
    """Conjugate gradient — solve Ax=b"""
    A = np.array([[4.0, 1.0], [1.0, 3.0]])
    b = np.array([1.0, 2.0])
    x = np.zeros(2)
    r = b - A @ x
    p = r.copy()
    for _ in range(10):
        Ap = A @ p
        alpha = np.dot(r, r) / np.dot(p, Ap)
        x = x + alpha * p
        r_new = r - alpha * Ap
        if np.linalg.norm(r_new) < 1e-10:
            break
        beta = np.dot(r_new, r_new) / np.dot(r, r)
        p = r_new + beta * p
        r = r_new
    print(f"Ex33 — CG solution x={np.round(x, 6)} (verify Ax={np.round(A@x, 4)})")

def ex34():
    """LBFGS concept: two-loop recursion approximation"""
    # Demonstrate the memory-limited Hessian update concept
    # Store last m=3 curvature pairs (s_k, y_k)
    x = np.array([5.0, 5.0])
    grad = lambda p: 2 * p
    m, history = 3, []
    lr = 0.1
    g = grad(x)
    for step in range(5):
        # Simulate LBFGS direction (simplified: H*g ≈ g/||g|| for concept)
        if not history:
            d = -g
        else:
            s_last, y_last = history[-1]
            rho = 1.0 / (np.dot(y_last, s_last) + 1e-10)
            d = -g * rho * np.dot(s_last, s_last)
        x_new = x + lr * d
        g_new = grad(x_new)
        if len(history) >= m:
            history.pop(0)
        history.append((x_new - x, g_new - g))
        x, g = x_new, g_new
    print(f"Ex34 — LBFGS concept 5 steps: x={np.round(x, 4)}")

def ex35():
    """Hyperparameter sensitivity: vary learning rate on x²"""
    results = {}
    for lr in [0.01, 0.1, 0.5, 0.99]:
        x = 10.0
        for _ in range(50):
            x -= lr * (2 * x)
        results[lr] = round(x, 6)
    print(f"Ex35 — x after 50 steps by lr: {results}")

def ex36():
    """Loss landscape 2D grid evaluation (f(x,y) = x²+y²)"""
    xs = np.linspace(-3, 3, 5)
    ys = np.linspace(-3, 3, 5)
    X, Y = np.meshgrid(xs, ys)
    Z = X**2 + Y**2
    min_val = Z.min()
    print(f"Ex36 — 2D loss landscape min: {min_val:.4f}, center: {Z[2,2]:.4f}")

def ex37():
    """Optimizer convergence plot data (loss per 10 steps)"""
    x = 10.0
    losses_gd = []
    for step in range(50):
        x -= 0.1 * (2 * x)
        if step % 10 == 9:
            losses_gd.append(round(x**2, 6))
    print(f"Ex37 — GD loss at steps 10,20,30,40,50: {losses_gd}")

def ex38():
    """Optimization with constraints via projection (x in [-1,1])"""
    x = np.array([5.0, -3.0, 0.5])
    lr = 0.3
    for _ in range(20):
        grad = 2 * x
        x = x - lr * grad
        x = np.clip(x, -1.0, 1.0)        # project onto constraint set
    print(f"Ex38 — projected GD (constrained [-1,1]): x={np.round(x, 6)}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Convex vs non-convex loss: local minima illustration"""
    # f1(x) = x^2 (convex), f2(x) = x^4 - 4x^2 (non-convex, two minima)
    xs = np.linspace(-3, 3, 200)
    f1 = xs**2
    f2 = xs**4 - 4 * xs**2
    f1_min_idx = np.argmin(f1)
    f2_min_idx = np.argmin(f2)
    print(f"Ex39 — convex min at x={xs[f1_min_idx]:.2f}, "
          f"non-convex global min at x={xs[f2_min_idx]:.2f}, "
          f"f2 has two local minima near x=±{math.sqrt(2):.4f}")

def ex40():
    """Second-order vs first-order convergence rate comparison"""
    # GD on f(x)=x²: converges linearly
    # Newton on f(x)=x²: converges in 1 step
    x_gd = 10.0
    for _ in range(10):
        x_gd -= 0.1 * (2 * x_gd)
    x_newton = 10.0
    x_newton -= (2 * x_newton) / 2.0   # f'=2x, f''=2, one Newton step
    print(f"Ex40 — GD(10 steps): x={x_gd:.6f}, Newton(1 step): x={x_newton:.6f}")

def ex41():
    """Forward-mode automatic differentiation concept (dual numbers)"""
    class Dual:
        def __init__(self, val, dot):
            self.val, self.dot = val, dot
        def __mul__(self, other):
            return Dual(self.val * other.val, self.val * other.dot + self.dot * other.val)
        def __add__(self, other):
            return Dual(self.val + other.val, self.dot + other.dot)
    x = Dual(3.0, 1.0)    # x=3, dx/dx=1
    y = x * x + x         # f(x) = x^2 + x, f'(x) = 2x+1
    print(f"Ex41 — dual number AD: f(3)={y.val}, f'(3)={y.dot} (exact: {2*3+1})")

def ex42():
    """Backpropagation as reverse-mode AD (simple 2-layer)"""
    # f(x) = sigmoid(wx + b), compute df/dw
    w, x, b = 0.5, 2.0, 0.1
    z = w * x + b
    sigmoid = lambda u: 1 / (1 + math.exp(-u))
    sig_d = lambda u: sigmoid(u) * (1 - sigmoid(u))
    # forward pass
    a = sigmoid(z)
    # backward pass
    da = 1.0               # d(loss)/d(a) = 1 (identity loss)
    dz = da * sig_d(z)
    dw = dz * x
    print(f"Ex42 — backprop df/dw at w=0.5,x=2,b=0.1: {dw:.6f}")

def ex43():
    """Natural gradient concept via Fisher information (scalar Gaussian)"""
    # For p(x|mu)=N(mu,1): F(mu) = 1, natural grad = F^{-1} * grad
    mu = 2.0
    data = np.array([1.5, 2.5, 2.0, 1.8, 2.2])
    grad_nll = mu - data.mean()   # gradient of NLL for N(mu,1)
    F = 1.0                        # Fisher info for N(mu,1) = 1/sigma^2 = 1
    natural_grad = grad_nll / F
    mu_new = mu - 0.5 * natural_grad
    print(f"Ex43 — natural gradient step: mu {mu:.4f} → {mu_new:.4f} (data mean={data.mean():.4f})")

def ex44():
    """Proximal gradient method (L1 regularization soft-thresholding)"""
    def soft_threshold(x, lam):
        return np.sign(x) * np.maximum(np.abs(x) - lam, 0)
    x = np.array([3.0, -1.5, 0.3, -0.1, 2.0])
    lr, lam = 0.1, 0.5
    grad_smooth = 2 * x   # gradient of x^2 part
    x_new = soft_threshold(x - lr * grad_smooth, lr * lam)
    print(f"Ex44 — proximal (soft-threshold) step:\n  before: {x}\n  after:  {np.round(x_new, 4)}")

def ex45():
    """ADMM concept: split variable optimization"""
    # Minimize f(x) + g(z) s.t. x=z  — one ADMM step
    # f(x) = x^2, g(z) = |z|, rho=1
    x, z, u = 5.0, 0.0, 0.0
    rho = 1.0
    lam = 0.5
    # x-update: minimize x^2 + rho/2*(x-z+u)^2  → x = rho(z-u)/(2+rho)
    x = rho * (z - u) / (2 + rho)
    # z-update: soft threshold of (x+u) with lam/rho
    v = x + u
    z = np.sign(v) * max(abs(v) - lam / rho, 0)
    # u-update
    u = u + x - z
    print(f"Ex45 — ADMM one step: x={x:.4f}, z={z:.4f}, u={u:.4f}")

def ex46():
    """Frank-Wolfe algorithm (linear minimization oracle)"""
    # Minimize f(x) = ||x-target||² over the L1 ball {||x||_1 <= 1}
    target = np.array([2.0, 3.0])
    x = np.array([0.5, 0.5])
    for t in range(1, 21):
        grad = 2 * (x - target)
        # Linear oracle: argmin <grad,s> s.t. ||s||_1 <= 1 → s = -sign(grad)*e_k
        k = np.argmax(np.abs(grad))
        s = np.zeros_like(grad)
        s[k] = -np.sign(grad[k])
        gamma = 2.0 / (t + 2)
        x = (1 - gamma) * x + gamma * s
    print(f"Ex46 — Frank-Wolfe 20 iters: x={np.round(x, 4)}, ||x||_1={np.sum(np.abs(x)):.4f}")

def ex47():
    """Stochastic variance reduction — SVRG concept (one epoch)"""
    np.random.seed(0)
    n = 20
    X = np.random.randn(n)
    w = 5.0
    lr = 0.1
    full_grad = 2 * (w - X.mean())   # gradient of mean squared error
    w_snapshot = w
    for i in range(n):
        # SVRG stochastic correction
        stoch_grad = 2 * (w - X[i])
        stoch_grad_snap = 2 * (w_snapshot - X[i])
        w = w - lr * (stoch_grad - stoch_grad_snap + full_grad)
    print(f"Ex47 — SVRG one epoch: w={w:.4f} (data mean={X.mean():.4f})")

def ex48():
    """Optimizer comparison table"""
    results = {
        "GD":        {"convex": "global min", "non-convex": "local min",  "memory": "O(d)"},
        "SGD":       {"convex": "global min", "non-convex": "local min",  "memory": "O(d)"},
        "Adam":      {"convex": "good",       "non-convex": "often good", "memory": "O(2d)"},
        "Newton":    {"convex": "global min", "non-convex": "saddle risk","memory": "O(d²)"},
        "L-BFGS":    {"convex": "global min", "non-convex": "local min",  "memory": "O(md)"},
    }
    print("Ex48 — Optimizer comparison:")
    for opt, props in results.items():
        print(f"  {opt:10s}: convex={props['convex']:15s} non-convex={props['non-convex']:15s} mem={props['memory']}")

def ex49():
    """Production optimization strategy guide"""
    strategies = [
        ("Adam",    "Default choice; robust for most DL tasks"),
        ("SGD+mom", "Better generalization for large-scale CV"),
        ("L-BFGS",  "Small datasets, full-batch second-order"),
        ("Proximal","L1/L2 regularized objectives"),
        ("ADMM",    "Distributed / consensus optimization"),
    ]
    print("Ex49 — Production optimizer guide:")
    for opt, advice in strategies:
        print(f"  {opt:10s}: {advice}")

def ex50():
    """Full optimization pipeline: Adam on 2D Rosenbrock function"""
    # f(x,y) = (1-x)^2 + 100*(y-x^2)^2
    def rosenbrock_grad(p):
        x, y = p
        gx = -2 * (1 - x) - 400 * x * (y - x**2)
        gy = 200 * (y - x**2)
        return np.array([gx, gy])
    x = np.array([-1.0, 1.0])
    lr, b1, b2, eps = 0.005, 0.9, 0.999, 1e-8
    m, v = np.zeros(2), np.zeros(2)
    for t in range(1, 2001):
        g = rosenbrock_grad(x)
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g**2
        m_hat = m / (1 - b1**t)
        v_hat = v / (1 - b2**t)
        x = x - lr * m_hat / (np.sqrt(v_hat) + eps)
    print(f"Ex50 — Adam on Rosenbrock (2000 steps): x={np.round(x, 4)} (optimum=[1,1])")

def main():
    print("=" * 60)
    print("Examples 1.2 — Calculus & Optimization")
    print("=" * 60)
    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
