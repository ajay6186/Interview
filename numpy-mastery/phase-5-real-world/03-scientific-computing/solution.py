# ============================================================================
# Solution 5.3 — Scientific Computing
# ============================================================================

import numpy as np

# 1. Trapezoidal integration of sin over [0, pi]
x_pi = np.linspace(0, np.pi, 10_000)
integral_sin = np.trapz(np.sin(x_pi), x_pi)

# 2. FFT — detect dominant frequency
fs = 500.0
t = np.arange(0, 1, 1/fs)
signal = np.sin(2 * np.pi * 30 * t) + np.sin(2 * np.pi * 80 * t)
fft_result = np.fft.fft(signal)
freqs = np.fft.fftfreq(len(t), 1/fs)
magnitude = np.abs(fft_result)
pos_mask = freqs > 0
top2_freqs = freqs[pos_mask][np.argsort(magnitude[pos_mask])[-2:]]

# 3. Inverse FFT reconstruction
signal_recovered = np.fft.ifft(fft_result).real

# 4. Polynomial fitting
np.random.seed(1)
x_data = np.linspace(0, 1, 50)
y_data = 3 * x_data**2 - 2 * x_data + 1 + np.random.normal(0, 0.02, 50)
coeffs = np.polyfit(x_data, y_data, 2)
y_fitted = np.polyval(coeffs, x_data)

# 5. Solve linear system
A_sys = np.array([[3., 1., -1.],
                  [1., 4.,  2.],
                  [2., 1.,  3.]], dtype=float)
b_sys = np.array([4., 11., 10.], dtype=float)
x_sol = np.linalg.solve(A_sys, b_sys)

# 6. Eigenvalues of symmetric matrix
M_sym = np.array([[4., 2., 0.],
                  [2., 3., 1.],
                  [0., 1., 2.]], dtype=float)
eigenvalues_sym, eigenvectors_sym = np.linalg.eigh(M_sym)

# 7. Euler method
x_ode = np.linspace(0, 1, 200)
h_ode = x_ode[1] - x_ode[0]
y_euler = np.empty(200)
y_euler[0] = 1.0
for i in range(1, 200):
    y_euler[i] = y_euler[i-1] + h_ode * (-2 * y_euler[i-1])

# 8. SVD decomposition
M_svd = np.array([[1., 2., 3.],
                  [4., 5., 6.],
                  [7., 8., 9.],
                  [10., 11., 12.]], dtype=float)
U_svd, s_svd, Vt_svd = np.linalg.svd(M_svd, full_matrices=False)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert integral_sin is not None
    assert np.isclose(integral_sin, 2.0, atol=1e-5)

    assert fft_result is not None
    assert len(fft_result) == len(t)

    assert freqs is not None
    assert magnitude is not None
    assert np.all(magnitude >= 0)

    assert top2_freqs is not None
    assert len(top2_freqs) == 2
    assert np.allclose(np.sort(top2_freqs), [30., 80.], atol=1.5)

    assert signal_recovered is not None
    assert np.allclose(signal_recovered, signal, atol=1e-8)

    assert coeffs is not None
    assert len(coeffs) == 3
    assert np.isclose(coeffs[0], 3., atol=0.5)

    assert y_fitted is not None
    assert y_fitted.shape == x_data.shape

    assert x_sol is not None
    assert np.allclose(A_sys @ x_sol, b_sys, atol=1e-8)

    assert eigenvalues_sym is not None
    assert len(eigenvalues_sym) == 3
    assert np.all(eigenvalues_sym > 0)

    assert eigenvectors_sym is not None
    assert eigenvectors_sym.shape == (3, 3)
    assert np.allclose(eigenvectors_sym.T @ eigenvectors_sym, np.eye(3), atol=1e-10)

    assert y_euler is not None
    assert len(y_euler) == 200
    assert np.isclose(y_euler[0], 1.0)
    y_exact = np.exp(-2 * x_ode)
    assert np.max(np.abs(y_euler - y_exact)) < 0.01

    assert U_svd is not None and s_svd is not None and Vt_svd is not None
    assert U_svd.shape == (4, 3)
    assert s_svd.shape == (3,)
    assert Vt_svd.shape == (3, 3)
    assert np.allclose(U_svd @ np.diag(s_svd) @ Vt_svd, M_svd, atol=1e-8)

    print("Solution 5.3 — All assertions passed!")

if __name__ == "__main__":
    main()
