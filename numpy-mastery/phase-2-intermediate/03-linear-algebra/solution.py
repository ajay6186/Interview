# ============================================================================
# Solution 2.3 — Linear Algebra
# ============================================================================
# Practice matrix multiplication with np.dot and @, compute determinants,
# matrix inverses, solve linear systems, and compute vector/matrix norms.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Matrix multiplication
# ---------------------------------------------------------------------------

A = np.array([[1, 2],
              [3, 4]], dtype=float)

B = np.array([[5, 6],
              [7, 8]], dtype=float)

# Compute A @ B using the @ operator
AB = A @ B

# Compute A @ B using np.matmul
AB_matmul = np.matmul(A, B)

# Compute the dot product of the first row of A with the first column of B
dot_val = np.dot(A[0], B[:, 0])

# ---------------------------------------------------------------------------
# 2. Determinant and inverse
# ---------------------------------------------------------------------------

M = np.array([[2., 1.],
              [5., 3.]])

# Compute the determinant of M
det_M = np.linalg.det(M)

# Compute the inverse of M
inv_M = np.linalg.inv(M)

# ---------------------------------------------------------------------------
# 3. Solving a linear system Ax = b
# ---------------------------------------------------------------------------

# System: 2x + y = 5
#         5x + 3y = 13
A_sys = np.array([[2., 1.],
                  [5., 3.]])
b_sys = np.array([5., 13.])

# Solve A_sys @ x = b_sys using np.linalg.solve
x_solution = np.linalg.solve(A_sys, b_sys)

# ---------------------------------------------------------------------------
# 4. Matrix trace and norms
# ---------------------------------------------------------------------------

C = np.array([[1., 2., 3.],
              [4., 5., 6.],
              [7., 8., 9.]])

# Compute the trace of C (sum of diagonal elements)
trace_C = np.trace(C)

# Compute the Frobenius norm of C
frob_norm = np.linalg.norm(C, 'fro')

v = np.array([3., 4.])

# Compute the L2 (Euclidean) norm of vector v
l2_norm = np.linalg.norm(v)

# ---------------------------------------------------------------------------
# 5. Matrix power — multiplying a matrix by itself
# ---------------------------------------------------------------------------

P = np.array([[1., 1.],
              [0., 1.]])

# Compute P @ P (P squared)
P_squared = P @ P

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert AB is not None, "AB must be defined"
    assert np.allclose(AB, [[19, 22], [43, 50]]), f"AB wrong: {AB}"

    assert AB_matmul is not None, "AB_matmul must be defined"
    assert np.allclose(AB_matmul, AB), "AB_matmul should equal AB"

    assert dot_val is not None, "dot_val must be defined"
    assert np.isclose(dot_val, 19.0), f"dot_val should be 19, got {dot_val}"

    assert det_M is not None, "det_M must be defined"
    assert np.isclose(det_M, 1.0), f"det(M) should be 1, got {det_M}"

    assert inv_M is not None, "inv_M must be defined"
    assert np.allclose(inv_M @ M, np.eye(2)), "inv_M @ M should be identity"

    assert x_solution is not None, "x_solution must be defined"
    assert np.allclose(A_sys @ x_solution, b_sys), "x_solution should satisfy the system"
    assert np.allclose(x_solution, [2., 1.]), f"x_solution should be [2,1], got {x_solution}"

    assert trace_C is not None, "trace_C must be defined"
    assert np.isclose(trace_C, 15.0), f"trace should be 15, got {trace_C}"

    assert frob_norm is not None, "frob_norm must be defined"
    assert np.isclose(frob_norm, np.sqrt(285)), f"Frobenius norm wrong: {frob_norm}"

    assert l2_norm is not None, "l2_norm must be defined"
    assert np.isclose(l2_norm, 5.0), f"L2 norm of [3,4] should be 5, got {l2_norm}"

    assert P_squared is not None, "P_squared must be defined"
    assert np.allclose(P_squared, [[1, 2], [0, 1]]), f"P^2 wrong: {P_squared}"

    print("Solution 2.3 — All assertions passed!")

if __name__ == "__main__":
    main()
