# ============================================================================
# Solution 6.4 — Optimization
# ============================================================================

import numpy as np

np.random.seed(9)

# 1. In-place scaling
b = np.random.rand(10_000)
b_ref = b
b *= 2.5

# 2. einsum matrix multiply
A = np.random.rand(50, 30)
B = np.random.rand(30, 40)
C_einsum = np.einsum('ij,jk->ik', A, B)

# 3. Trace via einsum
M = np.random.rand(100, 100)
trace_einsum = np.einsum('ii->', M)

# 4. Batch row dots via einsum
X = np.random.rand(200, 5)
Y = np.random.rand(200, 5)
row_dots = np.einsum('ij,ij->i', X, Y)

# 5. Rolling sum via cumsum
data = np.random.rand(1_000)
window = 50
cumsum = np.cumsum(np.concatenate([[0.], data]))
rolling_sum = cumsum[window:] - cumsum[:-window]

# 6. Stride tricks rolling window
arr_1d = np.arange(20, dtype=float)
win_size = 5
shape_st = (len(arr_1d) - win_size + 1, win_size)
strides_st = (arr_1d.strides[-1], arr_1d.strides[-1])
rolling_view = np.lib.stride_tricks.as_strided(arr_1d, shape=shape_st, strides=strides_st)

# 7. Gram matrix via einsum
A_gram = np.random.rand(100, 20)
gram = np.einsum('ij,ik->jk', A_gram, A_gram)

# 8. Pairwise squared distances
X_pts = np.random.rand(50, 4)
diff = X_pts[:, None, :] - X_pts[None, :, :]
D_sq = np.sum(diff**2, axis=2)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert b is b_ref
    assert np.all(b >= 0)
    assert 1.0 < b.mean() < 1.5

    assert C_einsum is not None
    assert C_einsum.shape == (50, 40)
    assert np.allclose(C_einsum, A @ B)

    assert trace_einsum is not None
    assert np.isclose(float(trace_einsum), np.trace(M))

    assert row_dots is not None
    assert row_dots.shape == (200,)
    expected_rd = np.array([np.dot(X[i], Y[i]) for i in range(200)])
    assert np.allclose(row_dots, expected_rd)

    assert rolling_sum is not None
    assert rolling_sum.shape == (1_000 - window + 1,)
    assert np.isclose(rolling_sum[0], data[:window].sum())

    assert rolling_view is not None
    assert rolling_view.shape == (16, 5)
    assert np.shares_memory(rolling_view, arr_1d)
    assert np.allclose(rolling_view[0], arr_1d[:5])
    assert np.allclose(rolling_view[-1], arr_1d[-5:])

    assert gram is not None
    assert gram.shape == (20, 20)
    assert np.allclose(gram, A_gram.T @ A_gram)
    assert np.allclose(gram, gram.T)

    assert D_sq is not None
    assert D_sq.shape == (50, 50)
    assert np.allclose(np.diag(D_sq), 0)
    assert np.allclose(D_sq, D_sq.T)
    i0, j0 = 0, 10
    expected_d = np.sum((X_pts[i0] - X_pts[j0])**2)
    assert np.isclose(D_sq[i0, j0], expected_d)

    print("Solution 6.4 — All assertions passed!")

if __name__ == "__main__":
    main()
