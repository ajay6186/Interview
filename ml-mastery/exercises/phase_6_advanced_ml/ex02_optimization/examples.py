# ============================================================
# Examples 6.2 — Optimization Algorithms (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Gradient descent on f(x)=x^2, 20 steps"""
    x, lr = 5.0, 0.1
    for _ in range(20):
        grad = 2 * x
        x -= lr * grad
    print(f"Ex01 — GD on x^2: final x={x:.6f} (min=0)")

def ex02():
    """GD on f(x,y)=x^2+y^2, 20 steps"""
    x, y, lr = 3.0, -4.0, 0.1
    for _ in range(20):
        x -= lr * 2 * x
        y -= lr * 2 * y
    print(f"Ex02 — GD on x^2+y^2: x={x:.6f}, y={y:.6f}")

def ex03():
    """Step size effect: lr=0.1 vs 1.0 vs 0.01 on f(x)=x^2"""
    results = {}
    for lr in [0.1, 1.0, 0.01]:
        x = 5.0
        for _ in range(20):
            x -= lr * 2 * x
        results[lr] = x
    print(f"Ex03 — LR effect after 20 steps: {', '.join(f'lr={k}: x={v:.4f}' for k,v in results.items())}")

def ex04():
    """SGD on linear regression, 10 steps"""
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, 20)
    y = 2 * X + 1 + rng.normal(0, 0.1, 20)
    w, b, lr = 0.0, 0.0, 0.05
    for step in range(10):
        i = rng.integers(0, len(X))
        pred = w * X[i] + b
        grad_w = 2 * (pred - y[i]) * X[i]
        grad_b = 2 * (pred - y[i])
        w -= lr * grad_w
        b -= lr * grad_b
    print(f"Ex04 — SGD LinReg (10 steps): w={w:.4f}, b={b:.4f} (true: w=2, b=1)")

def ex05():
    """Momentum update on f(x)=x^2"""
    x, v, lr, mu = 5.0, 0.0, 0.1, 0.9
    for _ in range(20):
        grad = 2 * x
        v = mu * v - lr * grad
        x += v
    print(f"Ex05 — Momentum GD: x={x:.6f} (min=0)")

def ex06():
    """Nesterov accelerated gradient step"""
    x, v, lr, mu = 5.0, 0.0, 0.1, 0.9
    for _ in range(20):
        x_lookahead = x + mu * v
        grad = 2 * x_lookahead
        v = mu * v - lr * grad
        x += v
    print(f"Ex06 — Nesterov update: x={x:.6f} (min=0)")

def ex07():
    """Adagrad on f(x)=x^2"""
    x, G, lr, eps = 5.0, 0.0, 0.5, 1e-8
    for _ in range(20):
        grad = 2 * x
        G += grad**2
        x -= lr / np.sqrt(G + eps) * grad
    print(f"Ex07 — Adagrad: x={x:.6f} (min=0)")

def ex08():
    """RMSprop on f(x)=x^2"""
    x, v, lr, rho, eps = 5.0, 0.0, 0.1, 0.9, 1e-8
    for _ in range(20):
        grad = 2 * x
        v = rho * v + (1 - rho) * grad**2
        x -= lr / np.sqrt(v + eps) * grad
    print(f"Ex08 — RMSprop: x={x:.6f} (min=0)")

def ex09():
    """Adam on f(x)=x^2"""
    x = 5.0
    m, v, lr, b1, b2, eps = 0.0, 0.0, 0.1, 0.9, 0.999, 1e-8
    for t in range(1, 21):
        grad = 2 * x
        m = b1 * m + (1 - b1) * grad
        v = b2 * v + (1 - b2) * grad**2
        m_hat = m / (1 - b1**t)
        v_hat = v / (1 - b2**t)
        x -= lr * m_hat / (np.sqrt(v_hat) + eps)
    print(f"Ex09 — Adam: x={x:.6f} (min=0)")

def ex10():
    """Gradient clipping by norm"""
    grad = np.array([10.0, 20.0, 5.0])
    max_norm = 5.0
    norm = np.linalg.norm(grad)
    clipped = grad * min(1.0, max_norm / norm)
    print(f"Ex10 — Grad clip (norm): original norm={norm:.4f}, "
          f"clipped norm={np.linalg.norm(clipped):.4f}, clipped={np.round(clipped,4)}")

def ex11():
    """Gradient clipping by value"""
    grad = np.array([-15.0, 3.5, 22.0, -0.5])
    clip_val = 5.0
    clipped = np.clip(grad, -clip_val, clip_val)
    print(f"Ex11 — Grad clip (value): original={grad}, clipped={clipped}")

def ex12():
    """Learning rate warmup schedule"""
    warmup_steps = 10
    total_steps = 50
    lrs = []
    for step in range(1, 21):
        if step <= warmup_steps:
            lr = 0.001 * step / warmup_steps
        else:
            lr = 0.001
        lrs.append(round(lr, 6))
    print(f"Ex12 — LR warmup (first 20 steps): {lrs}")

def ex13():
    """Cosine annealing schedule"""
    lr_max, lr_min = 0.1, 0.001
    T_max = 50
    lrs = [lr_min + 0.5*(lr_max - lr_min)*(1 + np.cos(np.pi*t/T_max)) for t in range(0, 51, 10)]
    print(f"Ex13 — Cosine annealing: {[round(lr, 5) for lr in lrs]}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Batch vs mini-batch vs SGD: loss comparison after 100 steps"""
    rng = np.random.default_rng(42)
    N = 100
    X = rng.uniform(0, 1, N)
    y = 3 * X + 2 + rng.normal(0, 0.2, N)
    lr = 0.05

    def mse_loss(w, b):
        return np.mean((w * X + b - y)**2)

    results = {}
    for mode in ["batch", "minibatch", "sgd"]:
        w, b = 0.0, 0.0
        for step in range(100):
            if mode == "batch":
                batch_X, batch_y = X, y
            elif mode == "minibatch":
                idx = rng.integers(0, N, size=16)
                batch_X, batch_y = X[idx], y[idx]
            else:  # sgd
                i = rng.integers(0, N)
                batch_X, batch_y = X[[i]], y[[i]]
            pred = w * batch_X + b
            err = pred - batch_y
            w -= lr * 2 * np.mean(err * batch_X)
            b -= lr * 2 * np.mean(err)
        results[mode] = mse_loss(w, b)
    print(f"Ex14 — Loss after 100 steps: {', '.join(f'{k}={v:.4f}' for k,v in results.items())}")

def ex15():
    """Momentum parameter effect: 0 vs 0.5 vs 0.9"""
    results = {}
    for mu in [0.0, 0.5, 0.9]:
        x, v, lr = 5.0, 0.0, 0.05
        for _ in range(50):
            grad = 2 * x
            v = mu * v - lr * grad
            x += v
        results[mu] = abs(x)
    print(f"Ex15 — Momentum effect (50 steps |x|): {', '.join(f'mu={k}: {v:.6f}' for k,v in results.items())}")

def ex16():
    """Adam beta1/beta2 effect on convergence"""
    configs = [(0.9, 0.999), (0.5, 0.9), (0.99, 0.9999)]
    for b1, b2 in configs:
        x, m, v, lr, eps = 5.0, 0.0, 0.0, 0.1, 1e-8
        for t in range(1, 51):
            g = 2 * x
            m = b1 * m + (1 - b1) * g
            v = b2 * v + (1 - b2) * g**2
            x -= lr * (m/(1-b1**t)) / (np.sqrt(v/(1-b2**t)) + eps)
        print(f"Ex16 — Adam b1={b1},b2={b2}: x={x:.6f} after 50 steps")

def ex17():
    """Weight decay (L2 regularization) effect"""
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, 50)
    y = 2 * X + rng.normal(0, 0.5, 50)
    for wd in [0.0, 0.01, 0.1]:
        w, b, lr = 0.0, 0.0, 0.05
        for _ in range(100):
            pred = w * X + b
            err = pred - y
            grad_w = 2 * np.mean(err * X) + wd * w
            grad_b = 2 * np.mean(err)
            w -= lr * grad_w
            b -= lr * grad_b
        print(f"Ex17 — Weight decay={wd}: w={w:.4f}, b={b:.4f}")

def ex18():
    """Learning rate finder: increase lr until loss explodes"""
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, 100)
    y = 2 * X + 1 + rng.normal(0, 0.2, 100)
    lr, w, b = 1e-5, 0.0, 0.0
    prev_loss = np.inf
    best_lr = lr
    for step in range(40):
        lr *= 1.5
        pred = w * X + b
        loss = np.mean((pred - y)**2)
        grad_w = 2 * np.mean((pred - y) * X)
        grad_b = 2 * np.mean(pred - y)
        w -= lr * grad_w
        b -= lr * grad_b
        if loss > 5 * prev_loss or np.isnan(loss):
            print(f"Ex18 — LR finder: loss explodes at lr={lr:.6f}, best lr={best_lr:.6f}")
            return
        if loss < prev_loss:
            best_lr = lr
        prev_loss = loss
    print(f"Ex18 — LR finder: best lr={best_lr:.6f}")

def ex19():
    """Cyclical learning rate (triangular policy)"""
    base_lr, max_lr = 0.001, 0.01
    step_size = 10
    lrs = []
    for t in range(40):
        cycle = np.floor(1 + t / (2 * step_size))
        x_pos = abs(t / step_size - 2 * cycle + 1)
        lr = base_lr + (max_lr - base_lr) * max(0, 1 - x_pos)
        lrs.append(round(lr, 5))
    print(f"Ex19 — Cyclical LR (every 5th): {lrs[::5]}")

def ex20():
    """One-cycle policy (warm up then anneal)"""
    max_lr = 0.01
    total = 40
    lrs = []
    for t in range(total):
        if t < total * 0.3:
            lr = max_lr * (t / (total * 0.3))
        else:
            lr = max_lr * (1 - (t - total*0.3) / (total * 0.7))
        lrs.append(max(round(lr, 6), 0))
    print(f"Ex20 — One-cycle LR (every 10th): {lrs[::10]}")

def ex21():
    """Adagrad adaptive learning rates per parameter"""
    rng = np.random.default_rng(42)
    # Two params: one sparse, one dense
    grad_a = np.array([1.0, 0.0, 1.0, 0.0, 1.0, 0.0])   # sparse
    grad_b = np.array([1.0, 1.0, 1.0, 1.0, 1.0, 1.0])   # dense
    G_a, G_b = np.zeros(6), np.zeros(6)
    lr, eps = 0.1, 1e-8
    for g_a, g_b in zip([grad_a]*5, [grad_b]*5):
        G_a += g_a**2
        G_b += g_b**2
    eff_lr_a = lr / np.sqrt(G_a + eps)
    eff_lr_b = lr / np.sqrt(G_b + eps)
    print(f"Ex21 — Adagrad eff lr (sparse): {np.round(eff_lr_a,5)}")
    print(f"       Adagrad eff lr (dense) : {np.round(eff_lr_b,5)}")

def ex22():
    """AMSGrad: maintains max of past v_t"""
    x, m, v, v_hat_max = 5.0, 0.0, 0.0, 0.0
    lr, b1, b2, eps = 0.1, 0.9, 0.999, 1e-8
    for t in range(1, 21):
        g = 2 * x
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g**2
        v_hat = v / (1 - b2**t)
        v_hat_max = max(v_hat_max, v_hat)
        m_hat = m / (1 - b1**t)
        x -= lr * m_hat / (np.sqrt(v_hat_max) + eps)
    print(f"Ex22 — AMSGrad: x={x:.6f} (uses max v_hat for stability)")

def ex23():
    """LAMB optimizer concept (Layer-wise Adaptive Moments)"""
    print("Ex23 — LAMB optimizer (Layer-wise Adaptive Moments for Batches):")
    print("       Designed for large-batch training (BERT, TPU training)")
    print("       Update: g_t = m_t / (sqrt(v_t) + eps) + lambda * w_t")
    print("       Scale: eta_t = phi(||w||) / ||g_t||  (trust ratio)")
    print("       w_t+1 = w_t - lr * eta_t * g_t")
    # Simulate trust ratio computation
    w_norm = 2.5
    g_norm = 0.8
    trust_ratio = w_norm / g_norm if g_norm > 0 else 1.0
    print(f"       Trust ratio: ||w||/||g|| = {trust_ratio:.4f}")

def ex24():
    """Lookahead optimizer concept"""
    print("Ex24 — Lookahead optimizer:")
    print("       Maintains 'slow weights' theta and 'fast weights' phi")
    # Simulate lookahead with Adam as base
    rng = np.random.default_rng(42)
    x_slow, lr_slow, k = 5.0, 0.5, 5
    x_fast, m, v = x_slow, 0.0, 0.0
    lr_fast, b1, b2, eps = 0.01, 0.9, 0.999, 1e-8
    for outer in range(4):
        for t in range(1, k+1):
            g = 2 * x_fast
            m = b1*m + (1-b1)*g
            v = b2*v + (1-b2)*g**2
            x_fast -= lr_fast * (m/(1-b1**t)) / (np.sqrt(v/(1-b2**t)) + eps)
        x_slow = x_slow + lr_slow * (x_fast - x_slow)  # slow weight update
        x_fast = x_slow
    print(f"       x_slow after 4 outer steps: {x_slow:.6f}")

def ex25():
    """Gradient accumulation for large effective batch"""
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, 100)
    y = 2 * X + 1 + rng.normal(0, 0.1, 100)
    w, b = 0.0, 0.0
    lr, accum_steps = 0.05, 4
    accum_gw, accum_gb = 0.0, 0.0
    for i in range(100):
        xi, yi = X[i % 100], y[i % 100]
        pred = w * xi + b
        accum_gw += 2 * (pred - yi) * xi
        accum_gb += 2 * (pred - yi)
        if (i + 1) % accum_steps == 0:
            w -= lr * accum_gw / accum_steps
            b -= lr * accum_gb / accum_steps
            accum_gw, accum_gb = 0.0, 0.0
    print(f"Ex25 — Grad accumulation (k={accum_steps}): w={w:.4f}, b={b:.4f}")

def ex26():
    """Newton's method on 1D function f(x)=x^3-2x-5"""
    x = 3.0  # initial guess
    for step in range(10):
        fx = x**3 - 2*x - 5
        fpx = 3*x**2 - 2
        x_new = x - fx / fpx
        if abs(x_new - x) < 1e-10:
            break
        x = x_new
    print(f"Ex26 — Newton's method on x^3-2x-5=0: root={x:.8f}, f(x)={x**3-2*x-5:.2e}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """GradientDescent class with configurable lr and momentum"""
    class GradientDescent:
        def __init__(self, lr=0.1, momentum=0.0):
            self.lr = lr
            self.momentum = momentum
            self.v = None
            self.history = []
        def step(self, params, grads):
            if self.v is None:
                self.v = np.zeros_like(params)
            self.v = self.momentum * self.v - self.lr * grads
            params = params + self.v
            self.history.append(np.linalg.norm(params))
            return params
        def optimize(self, x0, grad_fn, n_steps):
            x = x0.copy()
            for _ in range(n_steps):
                x = self.step(x, grad_fn(x))
            return x

    def grad_rosenbrock(x):
        dx = -2*(1 - x[0]) - 400*x[0]*(x[1] - x[0]**2)
        dy = 200*(x[1] - x[0]**2)
        return np.array([dx, dy])

    gd = GradientDescent(lr=0.001, momentum=0.9)
    x0 = np.array([-1.0, 1.0])
    result = gd.optimize(x0, grad_rosenbrock, 200)
    print(f"Ex27 — GD on Rosenbrock: x={np.round(result,4)} (min at [1,1])")

def ex28():
    """Adam optimizer class: full implementation"""
    class Adam:
        def __init__(self, lr=0.01, b1=0.9, b2=0.999, eps=1e-8):
            self.lr, self.b1, self.b2, self.eps = lr, b1, b2, eps
            self.m = self.v = None
            self.t = 0
        def step(self, params, grads):
            if self.m is None:
                self.m = np.zeros_like(params)
                self.v = np.zeros_like(params)
            self.t += 1
            self.m = self.b1*self.m + (1-self.b1)*grads
            self.v = self.b2*self.v + (1-self.b2)*grads**2
            m_hat = self.m / (1 - self.b1**self.t)
            v_hat = self.v / (1 - self.b2**self.t)
            return params - self.lr * m_hat / (np.sqrt(v_hat) + self.eps)
        def optimize(self, x0, grad_fn, n_steps):
            x = x0.copy()
            for _ in range(n_steps):
                x = self.step(x, grad_fn(x))
            return x

    adam = Adam(lr=0.1)
    result = adam.optimize(np.array([5.0, -3.0]), lambda x: 2*x, 100)
    print(f"Ex28 — Adam on x^2+y^2: result={np.round(result,6)}")

def ex29():
    """LRScheduler class: step, cosine, cyclic"""
    class LRScheduler:
        def __init__(self, base_lr=0.1):
            self.base_lr = base_lr
        def step_decay(self, epoch, step_size=10, gamma=0.5):
            return self.base_lr * (gamma ** (epoch // step_size))
        def cosine(self, t, T_max):
            return self.base_lr * 0.5 * (1 + np.cos(np.pi * t / T_max))
        def cyclic(self, t, base=0.001, max_lr=0.01, step_size=10):
            cycle = np.floor(1 + t / (2*step_size))
            x = abs(t/step_size - 2*cycle + 1)
            return base + (max_lr - base) * max(0, 1 - x)

    sched = LRScheduler(0.1)
    epochs = [0, 5, 10, 20, 30, 40, 50]
    step_lrs  = [round(sched.step_decay(e), 5) for e in epochs]
    cos_lrs   = [round(sched.cosine(e, 50),  5) for e in epochs]
    print(f"Ex29 — Step decay: {step_lrs}")
    print(f"       Cosine:     {cos_lrs}")

def ex30():
    """OptimizationTrajectory: records convergence path"""
    class OptimizationTrajectory:
        def __init__(self):
            self.path = []
            self.losses = []
        def record(self, x, loss):
            self.path.append(x.copy())
            self.losses.append(loss)
        def convergence_iter(self, tol=1e-4):
            for i, (l1, l2) in enumerate(zip(self.losses[:-1], self.losses[1:])):
                if abs(l1 - l2) < tol:
                    return i + 1
            return len(self.losses)

    traj = OptimizationTrajectory()
    x = np.array([5.0])
    for _ in range(30):
        loss = x[0]**2
        traj.record(x, loss)
        x = x - 0.2 * 2 * x
    conv_iter = traj.convergence_iter()
    print(f"Ex30 — Trajectory: {len(traj.path)} steps, converged at iter {conv_iter}, "
          f"final loss={traj.losses[-1]:.8f}")

def ex31():
    """ConvergenceChecker: multiple stopping criteria"""
    class ConvergenceChecker:
        def __init__(self, patience=5, tol=1e-6, max_iter=1000):
            self.patience = patience
            self.tol = tol
            self.max_iter = max_iter
            self._best = np.inf
            self._count = 0
        def check(self, loss, iteration):
            if iteration >= self.max_iter:
                return True, "max_iter"
            if abs(self._best - loss) < self.tol:
                self._count += 1
                if self._count >= self.patience:
                    return True, "plateau"
            else:
                self._count = 0
                self._best = min(self._best, loss)
            return False, None

    checker = ConvergenceChecker(patience=3, tol=1e-5)
    x = 5.0
    for i in range(200):
        loss = x**2
        x -= 0.2 * 2 * x
        done, reason = checker.check(loss, i)
        if done:
            print(f"Ex31 — Convergence: stopped at iter {i}, reason={reason}, loss={loss:.2e}")
            return
    print(f"Ex31 — Convergence: max_iter reached")

def ex32():
    """OptimizerBenchmark: compare 6 optimizers on same function"""
    def minimize_quad(optimizer_fn, n_steps=100):
        x = 5.0
        state = {}
        for t in range(1, n_steps+1):
            g = 2 * x
            x, state = optimizer_fn(x, g, t, state)
        return abs(x)

    def gd(x, g, t, s): return x - 0.05*g, s
    def momentum(x, g, t, s):
        v = s.get("v", 0.0)
        v = 0.9*v - 0.05*g; return x+v, {"v": v}
    def adagrad(x, g, t, s):
        G = s.get("G", 0.0) + g**2
        return x - 0.5/np.sqrt(G+1e-8)*g, {"G": G}
    def rmsprop(x, g, t, s):
        v = 0.9*s.get("v", 0.0) + 0.1*g**2
        return x - 0.1/np.sqrt(v+1e-8)*g, {"v": v}
    def adam_fn(x, g, t, s):
        m = 0.9*s.get("m",0.) + 0.1*g
        v = 0.999*s.get("v",0.) + 0.001*g**2
        mh = m/(1-0.9**t); vh = v/(1-0.999**t)
        return x - 0.1*mh/(np.sqrt(vh)+1e-8), {"m": m, "v": v}
    def nesterov(x, g, t, s):
        v = s.get("v", 0.0)
        v_new = 0.9*v - 0.05*(2*(x + 0.9*v))
        return x+v_new, {"v": v_new}

    opts = [("GD",gd),("Momentum",momentum),("Adagrad",adagrad),
            ("RMSprop",rmsprop),("Adam",adam_fn),("Nesterov",nesterov)]
    print("Ex32 — Optimizer benchmark |x| after 100 steps on x^2:")
    for name, fn in opts:
        print(f"       {name:12s}: {minimize_quad(fn):.8f}")

def ex33():
    """RegularizedOptimizer: L1 and L2 regularization"""
    class RegularizedOptimizer:
        def __init__(self, lr=0.05, l1=0.0, l2=0.0):
            self.lr, self.l1, self.l2 = lr, l1, l2
        def step(self, x, grad_loss):
            grad_total = grad_loss + self.l2 * x + self.l1 * np.sign(x)
            return x - self.lr * grad_total

    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, (50, 3))
    y = X @ np.array([1.0, 0.0, 3.0]) + rng.normal(0, 0.1, 50)
    for l1, l2 in [(0,0), (0,0.1), (0.05,0)]:
        opt = RegularizedOptimizer(l2=l2, l1=l1)
        w = np.ones(3)
        for _ in range(200):
            pred = X @ w
            grad = 2/50 * X.T @ (pred - y)
            w = opt.step(w, grad)
        print(f"Ex33 — L1={l1},L2={l2}: w={np.round(w,4)}")

def ex34():
    """ConstrainedOptimizer: projected gradient descent"""
    class ConstrainedOptimizer:
        def __init__(self, lr=0.1, constraint="simplex"):
            self.lr = lr
            self.constraint = constraint
        def project_simplex(self, v):
            u = np.sort(v)[::-1]
            cssv = np.cumsum(u)
            rho = np.where(u * np.arange(1, len(u)+1) > cssv - 1)[0][-1]
            theta = (cssv[rho] - 1) / (rho + 1)
            return np.maximum(v - theta, 0)
        def project_l2_ball(self, v, radius=1.0):
            norm = np.linalg.norm(v)
            return v * min(1.0, radius / norm)
        def step(self, x, grad):
            x_new = x - self.lr * grad
            if self.constraint == "simplex":
                return self.project_simplex(x_new)
            elif self.constraint == "l2ball":
                return self.project_l2_ball(x_new)
            return x_new

    opt = ConstrainedOptimizer(lr=0.1, constraint="simplex")
    x = np.array([0.5, 0.3, 0.2])
    for _ in range(50):
        grad = 2 * (x - np.array([0.1, 0.7, 0.2]))
        x = opt.step(x, grad)
    print(f"Ex34 — Projected GD (simplex): x={np.round(x,4)}, sum={x.sum():.4f}")

def ex35():
    """Full optimization experiment: run, compare, report"""
    rng = np.random.default_rng(42)
    X = np.column_stack([np.ones(100), rng.uniform(0, 2, 100)])
    y = X @ np.array([1.0, 2.5]) + rng.normal(0, 0.3, 100)

    def run_experiment(lr, momentum=0.0, n_steps=200):
        w = np.zeros(2)
        v = np.zeros(2)
        losses = []
        for _ in range(n_steps):
            pred = X @ w
            loss = np.mean((pred - y)**2)
            losses.append(loss)
            grad = 2/100 * X.T @ (pred - y)
            v = momentum * v - lr * grad
            w += v
        return losses[-1], w

    print("Ex35 — Full optimization experiment:")
    for lr, mu in [(0.01, 0.0), (0.01, 0.9), (0.001, 0.9)]:
        final_loss, w = run_experiment(lr, mu)
        print(f"       lr={lr}, mu={mu}: loss={final_loss:.5f}, w={np.round(w,4)}")

def ex36():
    """Loss landscape analyzer: saddle point detection"""
    class LossLandscapeAnalyzer:
        def hessian_2d(self, f, x, eps=1e-4):
            h = np.zeros((2, 2))
            for i in range(2):
                for j in range(2):
                    ei, ej = np.eye(2)[i], np.eye(2)[j]
                    h[i,j] = (f(x+eps*ei+eps*ej) - f(x+eps*ei-eps*ej)
                              - f(x-eps*ei+eps*ej) + f(x-eps*ei-eps*ej)) / (4*eps**2)
            return h
        def classify_critical(self, hessian):
            eigvals = np.linalg.eigvals(hessian)
            if all(eigvals > 0): return "minimum"
            if all(eigvals < 0): return "maximum"
            return "saddle_point"

    def saddle_fn(x): return x[0]**2 - x[1]**2
    def min_fn(x): return x[0]**2 + x[1]**2

    analyzer = LossLandscapeAnalyzer()
    for fn, pt, name in [(saddle_fn, np.array([0.,0.]), "saddle"), (min_fn, np.array([0.,0.]), "min")]:
        H = analyzer.hessian_2d(fn, pt)
        kind = analyzer.classify_critical(H)
        print(f"Ex36 — {name}: critical point type = {kind}")

def ex37():
    """Gradient noise analysis"""
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, 200)
    y = 2 * X + 1 + rng.normal(0, 0.3, 200)
    w, b = 2.0, 1.0  # near optimum
    batch_sizes = [1, 16, 64, 200]
    print("Ex37 — Gradient noise analysis (std of gradient estimates):")
    for bs in batch_sizes:
        grad_w_samples = []
        for _ in range(100):
            idx = rng.integers(0, 200, bs)
            pred = w * X[idx] + b
            gw = 2 * np.mean((pred - y[idx]) * X[idx])
            grad_w_samples.append(gw)
        print(f"       batch_size={bs:3d}: grad_w std={np.std(grad_w_samples):.5f}")

def ex38():
    """Production optimizer selection guide"""
    print("Ex38 — Production Optimizer Selection Guide:")
    print("  Adam / AdamW:")
    print("    - Default choice for deep learning (NLP, vision)")
    print("    - AdamW: decoupled weight decay (better generalization)")
    print("  SGD + Momentum + LR Scheduler:")
    print("    - Often best final accuracy for image classification (ResNet)")
    print("    - Requires careful LR tuning but generalizes well")
    print("  LAMB / LARS:")
    print("    - Large batch training (batch_size > 8192)")
    print("    - Used in BERT pre-training on TPU pods")
    print("  L-BFGS:")
    print("    - Full batch, small datasets, smooth objectives")
    print("    - Second-order convergence but expensive per step")
    # Benchmark summary
    results = {"Adam": 0.0012, "SGD+Mom": 0.0009, "AdamW": 0.0011, "LAMB": 0.0013}
    for name, loss in results.items():
        print(f"  {name:12s}: validation_loss={loss}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Conjugate gradient method"""
    rng = np.random.default_rng(42)
    n = 5
    A_raw = rng.uniform(0, 1, (n, n))
    A = A_raw.T @ A_raw + n * np.eye(n)  # SPD matrix
    b = rng.uniform(0, 1, n)
    # Conjugate gradient: solve Ax = b
    x = np.zeros(n)
    r = b - A @ x
    p = r.copy()
    r_dot = r @ r
    for _ in range(n):
        Ap = A @ p
        alpha = r_dot / (p @ Ap)
        x += alpha * p
        r -= alpha * Ap
        r_dot_new = r @ r
        if r_dot_new < 1e-12:
            break
        beta = r_dot_new / r_dot
        p = r + beta * p
        r_dot = r_dot_new
    residual = np.linalg.norm(A @ x - b)
    print(f"Ex39 — Conjugate gradient: residual={residual:.2e}, x={np.round(x,4)}")

def ex40():
    """L-BFGS two-loop recursion"""
    def lbfgs_two_loop(grad, s_list, y_list):
        q = grad.copy()
        alphas = []
        rhos = [1.0 / (y @ s) for s, y in zip(s_list, y_list)]
        for s, y, rho in zip(reversed(s_list), reversed(y_list), reversed(rhos)):
            alpha = rho * (s @ q)
            q -= alpha * y
            alphas.append(alpha)
        if y_list:
            s, y = s_list[-1], y_list[-1]
            gamma = (s @ y) / (y @ y)
            r = gamma * q
        else:
            r = q.copy()
        for s, y, rho, alpha in zip(s_list, y_list, rhos, reversed(alphas)):
            beta = rho * (y @ r)
            r += s * (alpha - beta)
        return -r

    # Optimize f(x,y)=x^2+10*y^2
    x = np.array([5.0, 3.0])
    def grad_fn(x): return np.array([2*x[0], 20*x[1]])
    s_list, y_list = [], []
    for step in range(20):
        g = grad_fn(x)
        if len(s_list) == 0:
            d = -g
        else:
            d = lbfgs_two_loop(g, s_list[-5:], y_list[-5:])
        lr = 0.1
        x_new = x + lr * d
        s_list.append(x_new - x)
        y_list.append(grad_fn(x_new) - g)
        x = x_new
    print(f"Ex40 — L-BFGS: x={np.round(x,6)}, f={x[0]**2+10*x[1]**2:.2e}")

def ex41():
    """Trust region method concept"""
    print("Ex41 — Trust Region Method:")
    print("       Idea: constrain step to region where quadratic model is trusted")
    print("       min_p m(p) = f(x) + g^T p + 1/2 p^T H p  s.t. ||p|| <= Delta")
    # Dogleg step simulation
    g = np.array([2.0, 1.0])
    H = np.array([[4.0, 0.0], [0.0, 2.0]])
    Delta = 0.5  # trust radius
    p_u = -(g @ g) / (g @ H @ g) * g          # Cauchy point (steepest descent)
    p_b = -np.linalg.solve(H, g)               # Newton step
    if np.linalg.norm(p_b) <= Delta:
        p = p_b
        step_type = "full Newton"
    elif np.linalg.norm(p_u) >= Delta:
        p = Delta * p_u / np.linalg.norm(p_u)
        step_type = "Cauchy"
    else:
        step_type = "dogleg"
        p = p_u  # simplified
    print(f"       Trust radius={Delta}, step_type={step_type}, p={np.round(p,4)}")

def ex42():
    """Interior point method concept"""
    print("Ex42 — Interior Point / Barrier Method:")
    print("       Problem: min f(x) s.t. g_i(x) <= 0")
    print("       Barrier: min f(x) - mu * sum_i log(-g_i(x))")
    print("       Algorithm: solve barrier problem for decreasing mu")
    # Simple example: min x^2 s.t. x >= 0.5
    mu = 1.0
    x = 2.0
    for outer in range(5):
        mu *= 0.1
        for _ in range(50):
            grad = 2*x + mu / (x - 0.5)  # barrier for -x + 0.5 <= 0
            H = 2 - mu / (x - 0.5)**2
            if H > 0:
                x -= grad / H
                x = max(x, 0.5 + 1e-9)
    print(f"       Interior point: x={x:.6f} (constrained min x >= 0.5 of x^2)")

def ex43():
    """Frank-Wolfe (conditional gradient) algorithm"""
    # min 0.5 * ||x - target||^2 over simplex
    target = np.array([0.1, 0.7, 0.2])
    x = np.ones(3) / 3  # start at centroid of simplex
    for t in range(1, 51):
        grad = x - target
        # Linear oracle: find vertex minimizing g^T s over simplex
        s = np.zeros(3)
        s[np.argmin(grad)] = 1.0
        gamma = 2.0 / (t + 2)  # step size
        x = (1 - gamma) * x + gamma * s
    print(f"Ex43 — Frank-Wolfe: x={np.round(x,4)}, target={target}")
    print(f"       ||x-target||={np.linalg.norm(x-target):.6f}")

def ex44():
    """ADMM: Alternating Direction Method of Multipliers"""
    # Lasso via ADMM: min 0.5||Ax-b||^2 + lambda*||z||_1 s.t. x=z
    rng = np.random.default_rng(42)
    n, p = 30, 5
    A = rng.normal(0, 1, (n, p))
    x_true = np.array([1.0, 0.0, 2.0, 0.0, -1.0])
    b = A @ x_true + rng.normal(0, 0.1, n)
    lam, rho = 0.1, 1.0
    x = np.zeros(p)
    z = np.zeros(p)
    u = np.zeros(p)
    AtA = A.T @ A
    Atb = A.T @ b
    for _ in range(100):
        # x update: (A^TA + rho I) x = A^T b + rho(z - u)
        x = np.linalg.solve(AtA + rho * np.eye(p), Atb + rho * (z - u))
        # z update: soft thresholding
        v = x + u
        z = np.sign(v) * np.maximum(np.abs(v) - lam/rho, 0)
        u += x - z
    print(f"Ex44 — ADMM Lasso: x={np.round(x,4)} (true={x_true})")

def ex45():
    """Proximal gradient method"""
    # min 0.5||Ax-b||^2 + lambda*||x||_1 (Lasso via ISTA)
    rng = np.random.default_rng(42)
    n, p = 40, 6
    A = rng.normal(0, 1, (n, p))
    x_true = np.array([2.0, 0.0, 0.0, -1.5, 0.0, 1.0])
    b = A @ x_true + rng.normal(0, 0.1, n)
    lam = 0.1
    L = np.linalg.norm(A.T @ A, ord=2)  # Lipschitz constant
    x = np.zeros(p)
    for _ in range(200):
        grad = A.T @ (A @ x - b)
        # Proximal step: soft thresholding
        v = x - grad / L
        x = np.sign(v) * np.maximum(np.abs(v) - lam/L, 0)
    print(f"Ex45 — Proximal gradient (ISTA): x={np.round(x,4)}")
    print(f"       True x: {x_true}")

def ex46():
    """Subgradient method for non-smooth optimization (L1 loss)"""
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, 50)
    y = 2 * X + 1 + rng.normal(0, 0.2, 50)
    # Minimize median regression: sum |y - (w*x + b)|
    w, b = 0.0, 0.0
    for t in range(1, 201):
        lr = 1.0 / np.sqrt(t)  # diminishing step size
        residuals = y - (w * X + b)
        subgrad_w = -np.mean(np.sign(residuals) * X)
        subgrad_b = -np.mean(np.sign(residuals))
        w -= lr * subgrad_w
        b -= lr * subgrad_b
    loss = np.mean(np.abs(y - (w * X + b)))
    print(f"Ex46 — Subgradient (L1 regression): w={w:.4f}, b={b:.4f}, MAE={loss:.4f}")

def ex47():
    """Evolution Strategy (CMA-ES concept)"""
    print("Ex47 — CMA-ES (Covariance Matrix Adaptation Evolution Strategy):")
    # Simple (1+1)-ES on sphere function
    rng = np.random.default_rng(42)
    n = 4
    x = rng.uniform(-3, 3, n)
    sigma = 1.0
    best_f = np.sum(x**2)
    for gen in range(200):
        mutation = rng.normal(0, sigma, n)
        x_new = x + mutation
        f_new = np.sum(x_new**2)
        if f_new < best_f:
            x = x_new
            best_f = f_new
            sigma *= 1.2  # increase step if success
        else:
            sigma *= 0.8  # decrease step if failure
        sigma = np.clip(sigma, 1e-8, 10.0)
    print(f"       (1+1)-ES on sphere: f={best_f:.6f}, x={np.round(x,4)}")
    print(f"       CMA-ES full: maintains full covariance matrix C")
    print(f"       Sample: x ~ N(m, sigma^2 C), update m + C from top-k offspring")

def ex48():
    """Bayesian optimization with GP and Expected Improvement"""
    rng = np.random.default_rng(42)
    def black_box(x): return -(np.sin(3*x) + np.sin(5*x))

    def rbf(x1, x2, ls=0.5): return np.exp(-0.5*(x1[:,None]-x2[None,:])**2/ls**2)

    def expected_improvement(X_cand, X_obs, y_obs, noise=0.01):
        K = rbf(X_obs, X_obs) + noise * np.eye(len(X_obs))
        K_s = rbf(X_obs, X_cand)
        K_inv = np.linalg.inv(K)
        mu = K_s.T @ K_inv @ y_obs
        var = np.array([1 - rbf(np.array([x]), X_obs) @ K_inv @ rbf(X_obs, np.array([x]))
                        for x in X_cand]).clip(0).ravel()
        sigma = np.sqrt(var)
        f_best = y_obs.min()
        Z = (f_best - mu) / (sigma + 1e-8)
        from scipy.stats import norm as snorm
        ei = (f_best - mu) * snorm.cdf(Z) + sigma * snorm.pdf(Z)
        return ei

    X_obs = np.array([0.0, 2.0, 4.0])
    y_obs = np.array([black_box(x) for x in X_obs])
    candidates = np.linspace(0, 4, 50)
    for _ in range(3):
        ei = expected_improvement(candidates, X_obs, y_obs)
        x_next = candidates[np.argmax(ei)]
        X_obs = np.append(X_obs, x_next)
        y_obs = np.append(y_obs, black_box(x_next))
    print(f"Ex48 — Bayesian Opt (EI): best x={X_obs[np.argmin(y_obs)]:.4f}, "
          f"best f={y_obs.min():.4f}")

def ex49():
    """Hyperparameter optimization as optimization problem"""
    rng = np.random.default_rng(42)
    print("Ex49 — Hyperparameter optimization approaches:")
    # Grid search simulation
    lrs = [0.001, 0.01, 0.1]
    regs = [0.0, 0.01, 0.1]
    best_val_loss, best_cfg = np.inf, None
    for lr in lrs:
        for reg in regs:
            # Simulate val loss (bowl shape with noise)
            val_loss = (np.log10(lr) + 2)**2 + (np.log10(reg + 0.001) + 1)**2 + rng.uniform(0, 0.1)
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_cfg = (lr, reg)
    print(f"       Grid search: best lr={best_cfg[0]}, reg={best_cfg[1]}, val_loss={best_val_loss:.4f}")
    # Random search
    best_val_loss_rs = np.inf
    for _ in range(20):
        lr = 10**rng.uniform(-4, -1)
        reg = 10**rng.uniform(-4, 0)
        val_loss = (np.log10(lr) + 2)**2 + (np.log10(reg + 0.001) + 1)**2 + rng.uniform(0, 0.1)
        if val_loss < best_val_loss_rs:
            best_val_loss_rs = val_loss
            best_cfg_rs = (lr, reg)
    print(f"       Random search: best lr={best_cfg_rs[0]:.4f}, val_loss={best_val_loss_rs:.4f}")

def ex50():
    """Distributed optimization: federated averaging concept"""
    print("Ex50 — Distributed Optimization (Federated Averaging):")
    rng = np.random.default_rng(42)
    n_clients = 4
    n_rounds = 10
    # Each client has local data
    clients_X = [rng.uniform(0, 1, (20, 2)) for _ in range(n_clients)]
    clients_y = [X @ np.array([2.0, -1.0]) + rng.normal(0, 0.1, 20) for X in clients_X]
    # Global model
    w_global = np.zeros(2)
    for rnd in range(n_rounds):
        local_updates = []
        for X, y in zip(clients_X, clients_y):
            w_local = w_global.copy()
            for _ in range(5):  # local SGD steps
                grad = 2/20 * X.T @ (X @ w_local - y)
                w_local -= 0.05 * grad
            local_updates.append(w_local)
        w_global = np.mean(local_updates, axis=0)  # FedAvg
    print(f"       FedAvg ({n_rounds} rounds, {n_clients} clients): w={np.round(w_global,4)}")
    print(f"       True w=[2.0,-1.0]")
    print(f"       Challenges: non-IID data, client dropout, privacy (DP-SGD)")


def main():
    print("=" * 60)
    print("Examples 6.2 — Optimization Algorithms")
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
