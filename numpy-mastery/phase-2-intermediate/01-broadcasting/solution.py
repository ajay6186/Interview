# ============================================================================
# Solution 2.1 — Broadcasting
# ============================================================================
# Understand NumPy's broadcasting rules: shapes align from the right, and
# size-1 dimensions are stretched. Add row/column vectors to matrices, compute
# outer products, and use np.broadcast_to.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Basic broadcasting rules
# ---------------------------------------------------------------------------

matrix = np.array([[1, 2, 3],
                   [4, 5, 6],
                   [7, 8, 9]], dtype=float)  # shape (3, 3)

row_vec = np.array([10, 20, 30], dtype=float)   # shape (3,)
col_vec = np.array([[1], [2], [3]], dtype=float) # shape (3, 1)

# Add row_vec to every row of matrix
add_row = matrix + row_vec

# Add col_vec to every column of matrix
add_col = matrix + col_vec

# ---------------------------------------------------------------------------
# 2. Row normalization (subtract row mean, divide by row std)
# ---------------------------------------------------------------------------

data = np.array([[10., 20., 30.],
                 [1.,  2.,  3.],
                 [5., 10., 15.]])

# Compute the mean of each row, shape (3, 1)
row_mean = np.mean(data, axis=1, keepdims=True)

# Compute the std of each row (ddof=0), shape (3, 1)
row_std = np.std(data, axis=1, keepdims=True)

# Normalize: (data - row_mean) / row_std
normalized = (data - row_mean) / row_std

# ---------------------------------------------------------------------------
# 3. Outer product via broadcasting
# ---------------------------------------------------------------------------

a = np.array([1, 2, 3, 4], dtype=float)
b = np.array([1, 2, 3], dtype=float)

# Compute the outer product using broadcasting
outer = a[:, np.newaxis] * b[np.newaxis, :]

# ---------------------------------------------------------------------------
# 4. Distance matrix
# ---------------------------------------------------------------------------

points = np.array([[0., 0.],
                   [3., 4.],
                   [1., 1.]])  # 3 points in 2D, shape (3, 2)

# Compute pairwise squared Euclidean distances using broadcasting
diff = points[:, np.newaxis, :] - points[np.newaxis, :, :]
dist_sq = np.sum(diff ** 2, axis=-1)

# ---------------------------------------------------------------------------
# 5. np.broadcast_to
# ---------------------------------------------------------------------------

template = np.array([1, 2, 3])  # shape (3,)

# Use np.broadcast_to to create a (4, 3) view of template
broadcast_view = np.broadcast_to(template, (4, 3))

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert add_row is not None, "add_row must be defined"
    assert add_row.shape == (3, 3), f"Expected (3,3), got {add_row.shape}"
    assert np.allclose(add_row[0], [11, 22, 33]), f"row 0 wrong: {add_row[0]}"
    assert np.allclose(add_row[2], [17, 28, 39]), f"row 2 wrong: {add_row[2]}"

    assert add_col is not None, "add_col must be defined"
    assert add_col.shape == (3, 3), f"Expected (3,3), got {add_col.shape}"
    assert np.allclose(add_col[0], [2, 3, 4]), f"row 0 wrong: {add_col[0]}"
    assert np.allclose(add_col[1], [6, 7, 8]), f"row 1 wrong: {add_col[1]}"

    assert row_mean is not None and row_mean.shape == (3, 1), f"row_mean shape wrong"
    assert np.allclose(row_mean.ravel(), [20., 2., 10.]), "row_mean values wrong"

    assert row_std is not None and row_std.shape == (3, 1), "row_std shape wrong"

    assert normalized is not None, "normalized must be defined"
    assert normalized.shape == (3, 3), "normalized shape wrong"
    assert np.allclose(np.mean(normalized, axis=1), 0), "normalized row means should be 0"

    assert outer is not None, "outer must be defined"
    assert outer.shape == (4, 3), f"Expected (4,3), got {outer.shape}"
    assert np.allclose(outer, np.outer(a, b)), "outer product values wrong"

    assert dist_sq is not None, "dist_sq must be defined"
    assert dist_sq.shape == (3, 3), f"Expected (3,3), got {dist_sq.shape}"
    assert np.isclose(dist_sq[0, 1], 25.0), f"distance(0,1) should be 25, got {dist_sq[0,1]}"
    assert np.allclose(np.diag(dist_sq), 0.0), "diagonal should be 0"

    assert broadcast_view is not None, "broadcast_view must be defined"
    assert broadcast_view.shape == (4, 3), f"Expected (4,3), got {broadcast_view.shape}"
    assert np.all(broadcast_view[3] == template), "each row should equal template"

    print("Solution 2.1 — All assertions passed!")

if __name__ == "__main__":
    main()
