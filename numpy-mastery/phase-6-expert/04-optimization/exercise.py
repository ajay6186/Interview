# ============================================================================
# Exercise 6.4 — Optimization
# ============================================================================
# Write high-performance NumPy code: in-place operations, einsum, stride
# tricks, rolling sums, memory layout, and BLAS-level operations.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

np.random.seed(9)

# ---------------------------------------------------------------------------
# 1. In-place operation: scale array b by 2.5 without creating a new array
# ---------------------------------------------------------------------------

b = np.random.rand(10_000)
b_ref = b  # same object

# TODO: scale b in-place by 2.5 (use *= or np.multiply(b, 2.5, out=b))

# ---------------------------------------------------------------------------
# 2. Matrix multiplication using np.einsum
# ---------------------------------------------------------------------------

A = np.random.rand(50, 30)
B = np.random.rand(30, 40)

# TODO: compute A @ B using np.einsum with subscript 'ij,jk->ik'
C_einsum = None  # replace None

# ---------------------------------------------------------------------------
# 3. Trace using np.einsum
# ---------------------------------------------------------------------------

M = np.random.rand(100, 100)

# TODO: compute trace of M using np.einsum (subscript: 'ii->')
trace_einsum = None  # replace None

# ---------------------------------------------------------------------------
# 4. Batch row dot products using np.einsum
# ---------------------------------------------------------------------------

X = np.random.rand(200, 5)
Y = np.random.rand(200, 5)

# TODO: compute element-wise dot product of each row pair using np.einsum 'ij,ij->i'
row_dots = None  # replace None   — shape (200,)

# ---------------------------------------------------------------------------
# 5. Rolling sum using the cumsum trick
# ---------------------------------------------------------------------------

data = np.random.rand(1_000)
window = 50

# TODO: compute rolling sum of data with given window using cumsum:
#   cumsum = np.cumsum(np.concatenate([[0.], data]))
#   rolling_sum = cumsum[window:] - cumsum[:-window]
rolling_sum = None  # replace None   — shape (951,)

# ---------------------------------------------------------------------------
# 6. Stride tricks — rolling window view (no copy)
# ---------------------------------------------------------------------------

arr_1d = np.arange(20, dtype=float)
win_size = 5

# TODO: use np.lib.stride_tricks.as_strided to create a view of shape
#       (len(arr_1d) - win_size + 1, win_size) where each row is a window.
#       shape  = (16, 5)
#       strides = (arr_1d.strides[-1], arr_1d.strides[-1])
rolling_view = None  # replace None

# ---------------------------------------------------------------------------
# 7. Gram matrix (A.T @ A) via np.einsum (avoid transposing large arrays)
# ---------------------------------------------------------------------------

A_gram = np.random.rand(100, 20)

# TODO: compute A_gram.T @ A_gram using np.einsum('ij,ik->jk', A_gram, A_gram)
gram = None  # replace None   — shape (20, 20)

# ---------------------------------------------------------------------------
# 8. Efficient pairwise squared distances
# ---------------------------------------------------------------------------

X_pts = np.random.rand(50, 4)

# TODO: compute pairwise squared Euclidean distance matrix using broadcasting:
#   diff = X_pts[:, None, :] - X_pts[None, :, :]
#   D_sq = np.sum(diff**2, axis=2)
#   Result shape: (50, 50)
D_sq = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert b is b_ref, "b should still be the same object (in-place)"
    assert np.allclose(b, b_ref * 1.), "b in-place scale check"  # b already scaled
    assert np.all(b >= 0), "b values should be non-negative"
    # Verify in-place scaling happened (mean should be ≈ 2.5 * 0.5 = 1.25)
    assert 1.0 < b.mean() < 1.5, f"b.mean() ≈ 1.25 expected, got {b.mean():.4f}"

    assert C_einsum is not None, "C_einsum must be defined"
    assert C_einsum.shape == (50, 40), f"C_einsum shape should be (50,40), got {C_einsum.shape}"
    assert np.allclose(C_einsum, A @ B), "C_einsum should equal A @ B"

    assert trace_einsum is not None, "trace_einsum must be defined"
    assert np.isclose(float(trace_einsum), np.trace(M)), \
        f"trace_einsum should equal np.trace(M)={np.trace(M):.4f}"

    assert row_dots is not None, "row_dots must be defined"
    assert row_dots.shape == (200,), f"row_dots shape should be (200,), got {row_dots.shape}"
    expected_rd = np.array([np.dot(X[i], Y[i]) for i in range(200)])
    assert np.allclose(row_dots, expected_rd), "row_dots values mismatch"

    assert rolling_sum is not None, "rolling_sum must be defined"
    assert rolling_sum.shape == (1_000 - window + 1,), \
        f"rolling_sum shape should be ({1_000 - window + 1},), got {rolling_sum.shape}"
    # Verify first window sum
    assert np.isclose(rolling_sum[0], data[:window].sum()), \
        f"rolling_sum[0] = {rolling_sum[0]:.4f} should equal data[:50].sum() = {data[:50].sum():.4f}"

    assert rolling_view is not None, "rolling_view must be defined"
    assert rolling_view.shape == (16, 5), \
        f"rolling_view shape should be (16, 5), got {rolling_view.shape}"
    assert np.shares_memory(rolling_view, arr_1d), "rolling_view should share memory with arr_1d"
    assert np.allclose(rolling_view[0], arr_1d[:5]), "first window should be arr_1d[0:5]"
    assert np.allclose(rolling_view[-1], arr_1d[-5:]), "last window should be arr_1d[-5:]"

    assert gram is not None, "gram must be defined"
    assert gram.shape == (20, 20), f"gram shape should be (20,20), got {gram.shape}"
    assert np.allclose(gram, A_gram.T @ A_gram), "gram should equal A_gram.T @ A_gram"
    assert np.allclose(gram, gram.T), "gram matrix should be symmetric"

    assert D_sq is not None, "D_sq must be defined"
    assert D_sq.shape == (50, 50), f"D_sq shape should be (50,50), got {D_sq.shape}"
    assert np.allclose(np.diag(D_sq), 0), "diagonal of distance matrix should be 0"
    assert np.allclose(D_sq, D_sq.T), "distance matrix should be symmetric"
    # Check one specific distance
    i0, j0 = 0, 10
    expected_d = np.sum((X_pts[i0] - X_pts[j0])**2)
    assert np.isclose(D_sq[i0, j0], expected_d), f"D_sq[0,10] mismatch"

    print("Exercise 6.4 — All assertions passed!")

if __name__ == "__main__":
    main()
