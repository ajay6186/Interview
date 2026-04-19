# ============================================================================
# Exercise 4.2 — Matrix Operations
# ============================================================================
# Practice eigendecomposition, SVD, Cholesky decomposition, least squares
# fitting, matrix rank, and pseudoinverse.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Eigendecomposition
# ---------------------------------------------------------------------------

A = np.array([[4., 1.],
              [2., 3.]])

# TODO: compute eigenvalues and eigenvectors of A
eigenvalues = None  # replace None
eigenvectors = None  # replace None

# ---------------------------------------------------------------------------
# 2. SVD decomposition
# ---------------------------------------------------------------------------

M = np.array([[1., 2., 3.],
              [4., 5., 6.]])  # shape (2, 3)

# TODO: compute full SVD of M — store as U, s, Vt
U = None   # replace None
s = None   # replace None
Vt = None  # replace None

# TODO: reconstruct M from U, s, Vt
M_reconstructed = None  # replace None

# ---------------------------------------------------------------------------
# 3. Cholesky decomposition
# ---------------------------------------------------------------------------

# Symmetric positive definite matrix
PD = np.array([[6., 3.],
               [3., 4.]])

# TODO: compute the lower Cholesky factor L such that L @ L.T == PD
L_chol = None  # replace None

# ---------------------------------------------------------------------------
# 4. Least squares fitting
# ---------------------------------------------------------------------------

# Data: y ≈ a + b*x
np.random.seed(42)
x_data = np.linspace(0., 10., 20)
y_data = 2.5 * x_data + 1.0 + np.random.normal(0, 0.5, 20)

# Design matrix with intercept column
X_design = np.column_stack([np.ones_like(x_data), x_data])

# TODO: solve for coefficients [a, b] using np.linalg.lstsq
#       Store only the coefficients (index 0 of the return value)
lstsq_coeffs = None  # replace None

# ---------------------------------------------------------------------------
# 5. Matrix rank and pseudoinverse
# ---------------------------------------------------------------------------

singular_mat = np.array([[1., 2., 3.],
                          [2., 4., 6.]])   # rank-1 matrix

# TODO: compute the rank of singular_mat
mat_rank = None  # replace None

# TODO: compute the Moore-Penrose pseudoinverse of singular_mat
mat_pinv = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert eigenvalues is not None, "eigenvalues must be defined"
    assert eigenvectors is not None, "eigenvectors must be defined"
    assert eigenvalues.shape == (2,), "should have 2 eigenvalues"
    # Verify A v = lambda v for each eigenpair
    for i in range(2):
        assert np.allclose(A @ eigenvectors[:, i],
                           eigenvalues[i] * eigenvectors[:, i]), \
            f"eigenvector {i} verification failed"

    assert U is not None and s is not None and Vt is not None, "U, s, Vt must be defined"
    assert U.shape == (2, 2), f"U should be (2,2), got {U.shape}"
    assert s.shape == (2,), f"s should have 2 singular values"
    assert Vt.shape == (3, 3), f"Vt should be (3,3), got {Vt.shape}"
    assert s[0] >= s[1], "singular values should be in descending order"

    assert M_reconstructed is not None, "M_reconstructed must be defined"
    assert np.allclose(M_reconstructed, M), "SVD reconstruction should match original"

    assert L_chol is not None, "L_chol must be defined"
    assert L_chol.shape == (2, 2), "L_chol should be 2x2"
    assert np.allclose(L_chol @ L_chol.T, PD), "L @ L.T should equal PD"
    # Lower triangular check
    assert np.isclose(L_chol[0, 1], 0.), "upper-right should be 0 (lower triangular)"

    assert lstsq_coeffs is not None, "lstsq_coeffs must be defined"
    assert lstsq_coeffs.shape == (2,), "should have 2 coefficients [a, b]"
    # b ≈ 2.5 (slope), a ≈ 1.0 (intercept)
    assert np.isclose(lstsq_coeffs[1], 2.5, atol=0.3), \
        f"slope should be ~2.5, got {lstsq_coeffs[1]}"
    assert np.isclose(lstsq_coeffs[0], 1.0, atol=0.5), \
        f"intercept should be ~1.0, got {lstsq_coeffs[0]}"

    assert mat_rank is not None, "mat_rank must be defined"
    assert mat_rank == 1, f"rank should be 1, got {mat_rank}"

    assert mat_pinv is not None, "mat_pinv must be defined"
    assert mat_pinv.shape == (3, 2), f"pinv shape should be (3,2), got {mat_pinv.shape}"
    # Verify pseudoinverse property: A @ pinv(A) @ A == A
    assert np.allclose(singular_mat @ mat_pinv @ singular_mat, singular_mat), \
        "A @ pinv(A) @ A should equal A"

    print("Exercise 4.2 — All assertions passed!")

if __name__ == "__main__":
    main()
