# ============================================================================
# Examples 5.3 — Scientific Computing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# --- BASIC ---

# 1. linspace grid for function evaluation
x = np.linspace(0, 2 * np.pi, 1000)
y_sin = np.sin(x)
print("Ex01 sin range:", round(y_sin.min(), 4), "to", round(y_sin.max(), 4))

# 2. composite function
y_comp = np.sin(x) * np.exp(-0.1 * x)
print("Ex02 damped sin at x=pi:", round(y_comp[len(x)//2], 4))

# 3. numerical derivative (central difference)
dx = x[1] - x[0]
dy_dx = np.gradient(y_sin, dx)
print("Ex03 derivative of sin at x=0:", round(dy_dx[0], 4))  # ≈ cos(0) = 1

# 4. trapezoidal integration of sin over [0, pi] = 2
x_pi = np.linspace(0, np.pi, 1000)
integral_trap = np.trapz(np.sin(x_pi), x_pi)
print("Ex04 trapz integral sin[0,pi]:", round(integral_trap, 6))

# 5. Simpson's rule integration
def simpsons(f, a, b, n=1000):
    if n % 2 == 1:
        n += 1
    h = (b - a) / n
    xi = np.linspace(a, b, n+1)
    fi = f(xi)
    return h/3 * (fi[0] + 4*fi[1::2].sum() + 2*fi[2:-1:2].sum() + fi[-1])
integral_simp = simpsons(np.sin, 0, np.pi)
print("Ex05 Simpson integral:", round(integral_simp, 8))

# 6. root finding (bisection) — find root of sin in [3, 4]
def bisection(f, a, b, tol=1e-10):
    for _ in range(200):
        mid = (a + b) / 2
        if abs(f(mid)) < tol or (b - a) / 2 < tol:
            return mid
        if np.sign(f(a)) == np.sign(f(mid)):
            a = mid
        else:
            b = mid
    return (a + b) / 2
root = bisection(np.sin, 3, 4)
print("Ex06 root of sin:", round(root, 8))  # ≈ pi

# 7. polynomial evaluation with Horner's method
coeffs = [1, -6, 11, -6]  # (x-1)(x-2)(x-3)
x_eval = np.linspace(0, 4, 100)
y_poly = np.polyval(coeffs, x_eval)
roots_poly = np.roots(coeffs)
print("Ex07 polynomial roots:", np.sort(roots_poly).round(4))

# 8. polynomial fitting
x_data = np.linspace(0, 1, 20)
y_data = 2 * x_data**3 - x_data**2 + 0.5 + np.random.normal(0, 0.02, 20)
coeffs_fit = np.polyfit(x_data, y_data, 3)
print("Ex08 fitted leading coeff:", round(coeffs_fit[0], 2))  # ≈ 2

# 9. linear system solve: Ax = b
A = np.array([[3, 1], [1, 2]], dtype=float)
b_vec = np.array([9, 8], dtype=float)
x_sol = np.linalg.solve(A, b_vec)
print("Ex09 solution x:", x_sol.round(4))  # [2, 3]

# 10. matrix determinant
det_A = np.linalg.det(A)
print("Ex10 det(A):", round(det_A, 4))

# 11. matrix inverse
A_inv = np.linalg.inv(A)
print("Ex11 A @ A_inv ≈ I:", np.allclose(A @ A_inv, np.eye(2)))

# 12. eigenvalues and eigenvectors
evals, evecs = np.linalg.eigh(A)
print("Ex12 eigenvalues:", evals.round(4))

# 13. singular value decomposition
M = np.random.rand(4, 3)
U, s, Vt = np.linalg.svd(M)
print("Ex13 singular values:", s.round(4))

# 14. condition number
print("Ex14 condition number:", round(np.linalg.cond(A), 4))

# 15. norm of a vector/matrix
v = np.array([3., 4.])
print("Ex15 L2 norm:", round(np.linalg.norm(v), 4))
print("Ex15 Frobenius norm:", round(np.linalg.norm(A), 4))

# --- INTERMEDIATE ---

# 16. FFT of a signal
fs = 1000.0  # sampling frequency
t = np.arange(0, 1, 1/fs)
signal = np.sin(2*np.pi*50*t) + 0.5*np.sin(2*np.pi*120*t)
fft_result = np.fft.fft(signal)
freqs = np.fft.fftfreq(len(t), 1/fs)
magnitude = np.abs(fft_result)
pos_mask = freqs > 0
print("Ex16 FFT peak frequencies:", freqs[pos_mask][np.argsort(magnitude[pos_mask])[-2:]].round(1))

# 17. inverse FFT
signal_recovered = np.fft.ifft(fft_result).real
print("Ex17 IFFT error:", round(np.max(np.abs(signal - signal_recovered)), 10))

# 18. power spectral density (PSD)
psd = (magnitude**2) / (len(t) * fs)
print("Ex18 PSD max at freq:", round(freqs[pos_mask][np.argmax(psd[pos_mask])], 1))

# 19. low-pass filter in frequency domain
fft_filtered = fft_result.copy()
fft_filtered[np.abs(freqs) > 80] = 0
signal_filtered = np.fft.ifft(fft_filtered).real
print("Ex19 filtered signal 120Hz component ≈ 0:", np.abs(np.sin(2*np.pi*120*t) - signal_filtered + np.sin(2*np.pi*50*t)).mean() < 0.1)

# 20. 2D FFT (image Fourier transform)
img = np.random.rand(32, 32)
fft2 = np.fft.fft2(img)
print("Ex20 2D FFT shape:", fft2.shape)

# 21. Euler method for ODE: dy/dx = -y, y(0) = 1, exact: y = e^{-x}
def euler(f_ode, y0, x_ode, h):
    y_ode = np.empty(len(x_ode))
    y_ode[0] = y0
    for i in range(1, len(x_ode)):
        y_ode[i] = y_ode[i-1] + h * f_ode(x_ode[i-1], y_ode[i-1])
    return y_ode
x_ode = np.linspace(0, 2, 1000)
h_ode = x_ode[1] - x_ode[0]
y_euler = euler(lambda x_e, y_e: -y_e, 1.0, x_ode, h_ode)
y_exact = np.exp(-x_ode)
print("Ex21 Euler max error:", round(np.max(np.abs(y_euler - y_exact)), 6))

# 22. Runge-Kutta 4th order
def rk4(f_rk, y0_rk, x_rk, h_rk):
    y_rk = np.empty(len(x_rk))
    y_rk[0] = y0_rk
    for i in range(1, len(x_rk)):
        k1 = h_rk * f_rk(x_rk[i-1], y_rk[i-1])
        k2 = h_rk * f_rk(x_rk[i-1] + h_rk/2, y_rk[i-1] + k1/2)
        k3 = h_rk * f_rk(x_rk[i-1] + h_rk/2, y_rk[i-1] + k2/2)
        k4 = h_rk * f_rk(x_rk[i-1] + h_rk, y_rk[i-1] + k3)
        y_rk[i] = y_rk[i-1] + (k1 + 2*k2 + 2*k3 + k4) / 6
    return y_rk
x_rk = np.linspace(0, 2, 200)
h_rk = x_rk[1] - x_rk[0]
y_rk4 = rk4(lambda x_r, y_r: -y_r, 1.0, x_rk, h_rk)
print("Ex22 RK4 max error:", round(np.max(np.abs(y_rk4 - np.exp(-x_rk))), 10))

# 23. numerical Jacobian of f(x) = [sin(x1)*cos(x2), x1^2 + x2^2]
def f_vec(x_j):
    return np.array([np.sin(x_j[0]) * np.cos(x_j[1]), x_j[0]**2 + x_j[1]**2])
def numerical_jacobian(f_j, x_j, eps=1e-7):
    n_j = len(x_j)
    f0 = f_j(x_j)
    J = np.zeros((len(f0), n_j))
    for k in range(n_j):
        dx = np.zeros(n_j); dx[k] = eps
        J[:, k] = (f_j(x_j + dx) - f0) / eps
    return J
J = numerical_jacobian(f_vec, np.array([0.5, 0.5]))
print("Ex23 Jacobian:\n", J.round(4))

# 24. Newton's method for root finding
def newtons(f_n, df_n, x0_n, tol=1e-12, max_iter=100):
    x_n = x0_n
    for _ in range(max_iter):
        fx = f_n(x_n)
        if abs(fx) < tol:
            break
        x_n -= fx / df_n(x_n)
    return x_n
root_cos = newtons(np.cos, lambda x_nc: -np.sin(x_nc), 1.0)
print("Ex24 Newton root cos:", round(root_cos, 8))  # ≈ pi/2

# 25. Gaussian quadrature (5-point Gauss-Legendre concept)
# nodes and weights for [-1,1] interval
gl_nodes = np.array([-0.9061798459, -0.5384693101, 0., 0.5384693101, 0.9061798459])
gl_weights = np.array([0.2369268851, 0.4786286705, 0.5688888889, 0.4786286705, 0.2369268851])
# transform from [-1,1] to [0, pi]
a_gl, b_gl = 0, np.pi
t_gl = 0.5 * (b_gl - a_gl) * gl_nodes + 0.5 * (a_gl + b_gl)
gl_integral = 0.5 * (b_gl - a_gl) * np.sum(gl_weights * np.sin(t_gl))
print("Ex25 Gauss-Legendre integral sin:", round(gl_integral, 8))

# 26. convolution (1D) without FFT
def convolve1d(a, b):
    n, m = len(a), len(b)
    out = np.zeros(n + m - 1)
    for i in range(n):
        out[i:i+m] += a[i] * b
    return out
a_conv = np.array([1., 2., 3.])
b_conv = np.array([0., 1., 0.5])
print("Ex26 convolution:", convolve1d(a_conv, b_conv).round(4))

# 27. FFT-based convolution
def fft_convolve(a_f, b_f):
    n_f = len(a_f) + len(b_f) - 1
    fa, fb = np.fft.rfft(a_f, n_f), np.fft.rfft(b_f, n_f)
    return np.fft.irfft(fa * fb, n_f)
print("Ex27 FFT convolution:", fft_convolve(a_conv, b_conv).round(4))

# 28. least squares solution (overdetermined system)
A_ls = np.random.rand(10, 3)
b_ls = np.random.rand(10)
x_ls, res, rank, sv = np.linalg.lstsq(A_ls, b_ls, rcond=None)
print("Ex28 least squares x:", x_ls.round(4))

# 29. Cholesky decomposition
M_spd = A.T @ A + np.eye(2) * 0.1  # make SPD
L_chol = np.linalg.cholesky(M_spd)
print("Ex29 Cholesky L @ L.T ≈ M:", np.allclose(L_chol @ L_chol.T, M_spd))

# 30. QR decomposition
A_qr = np.random.rand(5, 3)
Q, R = np.linalg.qr(A_qr)
print("Ex30 Q orthogonal:", np.allclose(Q.T @ Q, np.eye(3)))

# --- ADVANCED ---

# 31. finite difference Laplacian (2D)
def laplacian_2d(u, dx_l):
    return (np.roll(u, 1, axis=0) + np.roll(u, -1, axis=0) +
            np.roll(u, 1, axis=1) + np.roll(u, -1, axis=1) - 4*u) / dx_l**2
u_init = np.sin(np.linspace(0, np.pi, 20))[:, None] * np.sin(np.linspace(0, np.pi, 20))[None, :]
lap = laplacian_2d(u_init, np.pi / 19)
print("Ex31 Laplacian shape:", lap.shape)

# 32. heat equation (explicit scheme)
nx, nt = 50, 1000
dx_h = 1.0 / (nx - 1)
dt_h = 0.4 * dx_h**2  # CFL condition for alpha=1
u_heat = np.zeros(nx)
u_heat[nx//4:3*nx//4] = 1.0  # initial condition
alpha = 1.0
for _ in range(nt):
    u_heat[1:-1] += alpha * dt_h / dx_h**2 * (u_heat[2:] - 2*u_heat[1:-1] + u_heat[:-2])
print("Ex32 heat eq max:", round(u_heat.max(), 4))

# 33. wave equation (1D, explicit)
nx_w, nt_w = 100, 500
dx_w = 1.0 / (nx_w - 1)
dt_w = 0.5 * dx_w  # CFL = c * dt/dx = 0.5 < 1
c_wave = 1.0
u_w = np.sin(np.pi * np.linspace(0, 1, nx_w))
u_w_prev = u_w.copy()
u_w_next = np.zeros(nx_w)
for _ in range(nt_w):
    r = c_wave * dt_w / dx_w
    u_w_next[1:-1] = 2*u_w[1:-1] - u_w_prev[1:-1] + r**2*(u_w[2:] - 2*u_w[1:-1] + u_w[:-2])
    u_w_prev, u_w = u_w.copy(), u_w_next.copy()
print("Ex33 wave eq amplitude:", round(np.max(np.abs(u_w)), 4))

# 34. power iteration for dominant eigenvalue
A_pi = np.array([[4., 1.], [2., 3.]])
v_pi = np.random.rand(2)
for _ in range(100):
    v_pi = A_pi @ v_pi
    v_pi /= np.linalg.norm(v_pi)
eigenval_approx = v_pi @ A_pi @ v_pi
print("Ex34 dominant eigenvalue:", round(eigenval_approx, 4))  # ≈ 5

# 35. CG (conjugate gradient) method for Ax=b
def conjugate_gradient(A_cg, b_cg, tol=1e-10):
    x_cg = np.zeros_like(b_cg)
    r = b_cg - A_cg @ x_cg
    p = r.copy()
    for _ in range(len(b_cg)):
        Ap = A_cg @ p
        alpha_cg = r @ r / (p @ Ap)
        x_cg += alpha_cg * p
        r_new = r - alpha_cg * Ap
        if np.linalg.norm(r_new) < tol:
            break
        beta_cg = r_new @ r_new / (r @ r)
        p = r_new + beta_cg * p
        r = r_new
    return x_cg
A_cg = np.array([[4., 1.], [1., 3.]])
b_cg = np.array([1., 2.])
x_cg = conjugate_gradient(A_cg, b_cg)
print("Ex35 CG residual:", round(np.linalg.norm(A_cg @ x_cg - b_cg), 10))

# 36. Gaussian elimination
def gaussian_elim(A_ge, b_ge):
    n_ge = len(b_ge)
    Ab = np.column_stack([A_ge.astype(float), b_ge.astype(float)])
    for col in range(n_ge):
        pivot = np.argmax(np.abs(Ab[col:, col])) + col
        Ab[[col, pivot]] = Ab[[pivot, col]]
        Ab[col] /= Ab[col, col]
        for row in range(n_ge):
            if row != col:
                Ab[row] -= Ab[row, col] * Ab[col]
    return Ab[:, -1]
x_ge = gaussian_elim(np.array([[2., 1., -1.], [-3., -1., 2.], [-2., 1., 2.]]),
                     np.array([8., -11., -3.]))
print("Ex36 Gaussian elim:", x_ge.round(4))  # [2, 3, -1]

# 37. cubic spline interpolation (natural spline, simplified)
x_sp = np.array([0., 1., 2., 3., 4.])
y_sp = np.sin(x_sp)
# Using numpy polynomial approach as proxy
coeffs_sp = np.polyfit(x_sp, y_sp, 4)
x_interp = np.linspace(0, 4, 50)
y_interp = np.polyval(coeffs_sp, x_interp)
interp_error = np.max(np.abs(y_interp - np.sin(x_interp)))
print("Ex37 interpolation max error:", round(interp_error, 4))

# 38. Fast matrix exponentiation (repeated squaring)
def matrix_power(M_mp, n_mp):
    result = np.eye(len(M_mp))
    while n_mp > 0:
        if n_mp % 2 == 1:
            result = result @ M_mp
        M_mp = M_mp @ M_mp
        n_mp //= 2
    return result
M_mp = np.array([[1., 1.], [1., 0.]])  # Fibonacci matrix
print("Ex38 matrix^10:", matrix_power(M_mp, 10).astype(int))

# 39. numerical stability — Kahan summation
def kahan_sum(arr_k):
    s_k, c_k = 0.0, 0.0
    for x_k in arr_k:
        y_k = x_k - c_k
        t_k = s_k + y_k
        c_k = (t_k - s_k) - y_k
        s_k = t_k
    return s_k
arr_kahan = np.full(10000, 0.1)
print("Ex39 Kahan sum:", kahan_sum(arr_kahan), "naive sum:", arr_kahan.sum())

# 40. Discrete Fourier Transform vs FFT validation
N_dft = 64
x_dft = np.random.rand(N_dft)
# DFT matrix approach
n_idx = np.arange(N_dft)
k_idx = n_idx[:, None]
W = np.exp(-2j * np.pi * k_idx * n_idx / N_dft)
X_dft = W @ x_dft
X_fft = np.fft.fft(x_dft)
print("Ex40 DFT == FFT:", np.allclose(X_dft, X_fft))

# 41. Principal Component Analysis via SVD
X_svd = np.random.randn(50, 4)
X_svd -= X_svd.mean(axis=0)
U_s, S_s, Vt_s = np.linalg.svd(X_svd, full_matrices=False)
X_reduced = X_svd @ Vt_s[:2].T
print("Ex41 PCA via SVD shape:", X_reduced.shape)

# 42. Savitzky-Golay smoothing (polynomial least-squares filter)
def savgol_coefficients(window, poly_order):
    half_w = window // 2
    x_sg = np.arange(-half_w, half_w + 1, dtype=float)
    A_sg = np.vander(x_sg, poly_order + 1, increasing=True)
    ATA_inv = np.linalg.inv(A_sg.T @ A_sg)
    return (ATA_inv @ A_sg.T)[0]  # zeroth derivative coefficients
sg_coeffs = savgol_coefficients(5, 2)
noisy = np.sin(np.linspace(0, 2*np.pi, 100)) + np.random.normal(0, 0.1, 100)
smoothed = np.convolve(noisy, sg_coeffs[::-1], mode='same')
print("Ex42 SG smoothed std:", round(smoothed.std(), 4))

# --- EXPERT ---

# 43. LU decomposition with partial pivoting
def lu_decomp(A_lu):
    n_lu = A_lu.shape[0]
    L_lu = np.eye(n_lu)
    U_lu = A_lu.copy().astype(float)
    P_lu = np.eye(n_lu)
    for k in range(n_lu - 1):
        pivot = np.argmax(np.abs(U_lu[k:, k])) + k
        U_lu[[k, pivot]] = U_lu[[pivot, k]]
        P_lu[[k, pivot]] = P_lu[[pivot, k]]
        if k > 0:
            L_lu[[k, pivot], :k] = L_lu[[pivot, k], :k]
        for i in range(k+1, n_lu):
            L_lu[i, k] = U_lu[i, k] / U_lu[k, k]
            U_lu[i] -= L_lu[i, k] * U_lu[k]
    return P_lu, L_lu, U_lu
P_lu, L_lu, U_lu = lu_decomp(np.array([[2., 1., 1.], [4., 3., 3.], [8., 7., 9.]]))
print("Ex43 LU residual:", round(np.max(np.abs(P_lu @ np.array([[2.,1.,1.],[4.,3.,3.],[8.,7.,9.]]) - L_lu @ U_lu)), 10))

# 44. adaptive quadrature (Gaussian with error estimate)
def adaptive_quad(f_aq, a_aq, b_aq, tol_aq=1e-8, depth=0):
    if depth > 50:
        return (b_aq - a_aq) * f_aq((a_aq + b_aq) / 2)
    mid_aq = (a_aq + b_aq) / 2
    I1 = (b_aq - a_aq) / 6 * (f_aq(a_aq) + 4*f_aq(mid_aq) + f_aq(b_aq))
    I2 = ((b_aq - a_aq) / 12 * (f_aq(a_aq) + 4*f_aq((a_aq+mid_aq)/2) +
          2*f_aq(mid_aq) + 4*f_aq((mid_aq+b_aq)/2) + f_aq(b_aq)))
    if abs(I1 - I2) < tol_aq:
        return I2
    return (adaptive_quad(f_aq, a_aq, mid_aq, tol_aq, depth+1) +
            adaptive_quad(f_aq, mid_aq, b_aq, tol_aq, depth+1))
aq_result = adaptive_quad(lambda x_a: x_a**4 * np.exp(-x_a), 0., 5.)
print("Ex44 adaptive quad:", round(aq_result, 6))  # ≈ 24 - 65*e^{-5}

# 45. multivariate Newton's method (2D)
def newton_multivariate(F_nm, J_nm, x0_nm, tol=1e-12, max_iter=50):
    x_nm = x0_nm.copy().astype(float)
    for _ in range(max_iter):
        Fx = F_nm(x_nm)
        if np.linalg.norm(Fx) < tol:
            break
        dx_nm = np.linalg.solve(J_nm(x_nm), -Fx)
        x_nm += dx_nm
    return x_nm
# Solve: x^2 + y^2 = 1, x - y = 0 → solution: x=y=1/sqrt(2)
F_mv = lambda v: np.array([v[0]**2 + v[1]**2 - 1, v[0] - v[1]])
J_mv = lambda v: np.array([[2*v[0], 2*v[1]], [1., -1.]])
sol_mv = newton_multivariate(F_mv, J_mv, np.array([0.6, 0.8]))
print("Ex45 multivariate Newton:", sol_mv.round(8))  # ≈ [0.707, 0.707]

# 46. BFGS quasi-Newton update (one step)
def bfgs_update(H_b, s_b, y_b):
    rho = 1.0 / (y_b @ s_b)
    I_b = np.eye(len(s_b))
    V = I_b - rho * np.outer(s_b, y_b)
    return V @ H_b @ V.T + rho * np.outer(s_b, s_b)
H_b = np.eye(2)
s_b = np.array([0.1, 0.2])
y_b = np.array([0.3, 0.1])
H_new = bfgs_update(H_b, s_b, y_b)
print("Ex46 BFGS updated Hessian:\n", H_new.round(4))

# 47. Chebyshev polynomial approximation
def chebyshev_approx(f_ch, a_ch, b_ch, n_ch):
    nodes = np.cos((2*np.arange(1, n_ch+1) - 1) * np.pi / (2*n_ch))
    x_ch = 0.5 * (a_ch + b_ch) + 0.5 * (b_ch - a_ch) * nodes
    f_nodes = f_ch(x_ch)
    coeffs_ch = 2/n_ch * np.array([np.sum(f_nodes * np.cos(k*np.arccos(nodes))) for k in range(n_ch)])
    coeffs_ch[0] /= 2
    return coeffs_ch
ch_coeffs = chebyshev_approx(np.exp, 0., 1., 10)
print("Ex47 Chebyshev coefficients (first 5):", ch_coeffs[:5].round(6))

# 48. Hilbert matrix (ill-conditioned) and regularization
n_h = 8
H_hilbert = 1.0 / (np.arange(1, n_h+1)[:, None] + np.arange(1, n_h+1)[None, :] - 1)
print("Ex48 Hilbert condition number:", f"{np.linalg.cond(H_hilbert):.2e}")
# Tikhonov regularization
lam = 1e-10
H_reg = H_hilbert + lam * np.eye(n_h)
print("Ex48 regularized condition number:", f"{np.linalg.cond(H_reg):.2e}")

# 49. Randomized SVD (sketch-based)
def randomized_svd(A_r, k):
    Omega = np.random.randn(A_r.shape[1], k)
    Y_r = A_r @ Omega
    Q_r, _ = np.linalg.qr(Y_r)
    B_r = Q_r.T @ A_r
    U_r, S_r, Vt_r = np.linalg.svd(B_r, full_matrices=False)
    return Q_r @ U_r, S_r, Vt_r
A_big = np.random.randn(100, 50)
U_r, S_r, Vt_r = randomized_svd(A_big, k=10)
print("Ex49 randomized SVD singular values (top 3):", S_r[:3].round(2))

# 50. spectral clustering affinity matrix
n_sc = 20
X_sc = np.vstack([np.random.randn(10, 2), np.random.randn(10, 2) + 5])
dists_sq = np.sum((X_sc[:, None, :] - X_sc[None, :, :])**2, axis=2)
sigma_sc = 1.0
W_sc = np.exp(-dists_sq / (2 * sigma_sc**2))
D_sc = np.diag(W_sc.sum(axis=1))
L_sc = D_sc - W_sc  # unnormalized Laplacian
evals_sc = np.linalg.eigvalsh(L_sc)
print("Ex50 spectral gap (2nd eigenvalue):", round(evals_sc[1], 6))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
