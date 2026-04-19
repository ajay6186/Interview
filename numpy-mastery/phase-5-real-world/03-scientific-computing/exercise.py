# ============================================================================
# Exercise 5.3 — Scientific Computing
# ============================================================================
# Apply NumPy to core scientific computing tasks: numerical integration,
# FFT, ODE solving, linear systems, and polynomial fitting.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Trapezoidal integration of sin(x) over [0, pi]
# ---------------------------------------------------------------------------

x_pi = np.linspace(0, np.pi, 10_000)

# TODO: compute np.trapz of sin(x_pi) with respect to x_pi
integral_sin = None  # replace None   (should be ≈ 2.0)

# ---------------------------------------------------------------------------
# 2. FFT — detect dominant frequency
# ---------------------------------------------------------------------------

fs = 500.0
t = np.arange(0, 1, 1/fs)
signal = np.sin(2 * np.pi * 30 * t) + np.sin(2 * np.pi * 80 * t)

# TODO: compute FFT of signal
fft_result = None  # replace None

# TODO: compute frequency array using np.fft.fftfreq(len(t), 1/fs)
freqs = None  # replace None

# TODO: compute magnitude as np.abs(fft_result)
magnitude = None  # replace None

# TODO: find the two dominant positive frequencies (indices of 2 largest
#       magnitudes among positive frequencies only)
pos_mask = freqs > 0
# top2_freqs should be a sorted array of the two dominant positive frequencies
top2_freqs = None  # replace None

# ---------------------------------------------------------------------------
# 3. Inverse FFT reconstruction
# ---------------------------------------------------------------------------

# TODO: compute the real part of np.fft.ifft(fft_result)
signal_recovered = None  # replace None

# ---------------------------------------------------------------------------
# 4. Polynomial fitting
# ---------------------------------------------------------------------------

np.random.seed(1)
x_data = np.linspace(0, 1, 50)
y_data = 3 * x_data**2 - 2 * x_data + 1 + np.random.normal(0, 0.02, 50)

# TODO: fit a degree-2 polynomial using np.polyfit
coeffs = None  # replace None   — shape (3,), leading coeff ≈ 3

# TODO: evaluate the fitted polynomial at x_data using np.polyval
y_fitted = None  # replace None

# ---------------------------------------------------------------------------
# 5. Solve a linear system Ax = b
# ---------------------------------------------------------------------------

A_sys = np.array([[3., 1., -1.],
                  [1., 4.,  2.],
                  [2., 1.,  3.]], dtype=float)
b_sys = np.array([4., 11., 10.], dtype=float)

# TODO: solve the system using np.linalg.solve
x_sol = None  # replace None

# ---------------------------------------------------------------------------
# 6. Eigenvalues of a symmetric matrix
# ---------------------------------------------------------------------------

M_sym = np.array([[4., 2., 0.],
                  [2., 3., 1.],
                  [0., 1., 2.]], dtype=float)

# TODO: compute eigenvalues and eigenvectors using np.linalg.eigh
eigenvalues_sym = None  # replace None
eigenvectors_sym = None  # replace None

# ---------------------------------------------------------------------------
# 7. Euler method for dy/dx = -2y, y(0) = 1
# ---------------------------------------------------------------------------

x_ode = np.linspace(0, 1, 200)
h_ode = x_ode[1] - x_ode[0]

# TODO: implement Euler method; result stored in y_euler (shape: (200,))
#       f(x, y) = -2 * y
y_euler = None  # replace None

# ---------------------------------------------------------------------------
# 8. SVD decomposition
# ---------------------------------------------------------------------------

M_svd = np.array([[1., 2., 3.],
                  [4., 5., 6.],
                  [7., 8., 9.],
                  [10., 11., 12.]], dtype=float)

# TODO: compute full SVD using np.linalg.svd with full_matrices=False
U_svd = None  # replace None
s_svd = None  # replace None
Vt_svd = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert integral_sin is not None, "integral_sin must be defined"
    assert np.isclose(integral_sin, 2.0, atol=1e-5), f"integral of sin over [0,pi] ≈ 2, got {integral_sin}"

    assert fft_result is not None, "fft_result must be defined"
    assert len(fft_result) == len(t), "FFT length should match signal length"

    assert freqs is not None, "freqs must be defined"
    assert len(freqs) == len(t), "freqs length should match signal length"

    assert magnitude is not None, "magnitude must be defined"
    assert np.all(magnitude >= 0), "magnitude should be non-negative"

    assert top2_freqs is not None, "top2_freqs must be defined"
    assert len(top2_freqs) == 2, "top2_freqs should have 2 elements"
    assert np.allclose(np.sort(top2_freqs), [30., 80.], atol=1.5), \
        f"dominant frequencies should be ~30 and ~80 Hz, got {np.sort(top2_freqs)}"

    assert signal_recovered is not None, "signal_recovered must be defined"
    assert np.allclose(signal_recovered, signal, atol=1e-8), \
        "IFFT(FFT(signal)) should recover original signal"

    assert coeffs is not None, "coeffs must be defined"
    assert len(coeffs) == 3, "degree-2 fit should have 3 coefficients"
    assert np.isclose(coeffs[0], 3., atol=0.5), f"leading coefficient ≈ 3, got {coeffs[0]:.4f}"

    assert y_fitted is not None, "y_fitted must be defined"
    assert y_fitted.shape == x_data.shape, "y_fitted shape should match x_data"

    assert x_sol is not None, "x_sol must be defined"
    assert np.allclose(A_sys @ x_sol, b_sys, atol=1e-8), "A @ x should equal b"

    assert eigenvalues_sym is not None, "eigenvalues_sym must be defined"
    assert len(eigenvalues_sym) == 3, "should have 3 eigenvalues"
    assert np.all(eigenvalues_sym > 0), "M_sym is positive definite, all eigenvalues > 0"

    assert eigenvectors_sym is not None, "eigenvectors_sym must be defined"
    assert eigenvectors_sym.shape == (3, 3), "eigenvectors matrix should be 3x3"
    assert np.allclose(eigenvectors_sym.T @ eigenvectors_sym, np.eye(3), atol=1e-10), \
        "eigenvectors should be orthonormal"

    assert y_euler is not None, "y_euler must be defined"
    assert len(y_euler) == 200, "y_euler should have 200 elements"
    assert np.isclose(y_euler[0], 1.0), "y_euler[0] should equal y0 = 1.0"
    y_exact = np.exp(-2 * x_ode)
    assert np.max(np.abs(y_euler - y_exact)) < 0.01, \
        f"Euler solution should approximate e^{{-2x}}, max error = {np.max(np.abs(y_euler - y_exact)):.4f}"

    assert U_svd is not None and s_svd is not None and Vt_svd is not None, \
        "U_svd, s_svd, Vt_svd must be defined"
    assert U_svd.shape == (4, 3), f"U shape should be (4, 3), got {U_svd.shape}"
    assert s_svd.shape == (3,), f"s shape should be (3,), got {s_svd.shape}"
    assert Vt_svd.shape == (3, 3), f"Vt shape should be (3, 3), got {Vt_svd.shape}"
    assert np.allclose(U_svd @ np.diag(s_svd) @ Vt_svd, M_svd, atol=1e-8), \
        "U @ diag(s) @ Vt should reconstruct M_svd"

    print("Exercise 5.3 — All assertions passed!")

if __name__ == "__main__":
    main()
