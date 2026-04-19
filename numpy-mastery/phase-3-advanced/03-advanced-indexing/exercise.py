# ============================================================================
# Exercise 3.3 — Advanced Indexing
# ============================================================================
# Master np.ix_ for cross-product selection, np.meshgrid for coordinate
# grids, np.indices, np.take, np.put, np.diag, np.triu, and np.tril.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. np.ix_ for submatrix selection
# ---------------------------------------------------------------------------

mat = np.arange(25).reshape(5, 5)

# TODO: use np.ix_ to select the submatrix formed by rows [0,2,4] and cols [1,3]
#       This should give a (3, 2) result
row_idx = np.array([0, 2, 4])
col_idx = np.array([1, 3])
submatrix = None  # replace None — use np.ix_(row_idx, col_idx)

# ---------------------------------------------------------------------------
# 2. np.meshgrid
# ---------------------------------------------------------------------------

x = np.array([1., 2., 3.])
y = np.array([10., 20.])

# TODO: create meshgrid from x and y (use default indexing='xy')
XX, YY = None, None  # replace None, None

# ---------------------------------------------------------------------------
# 3. Diagonal operations
# ---------------------------------------------------------------------------

square = np.arange(9).reshape(3, 3).astype(float)

# TODO: extract the main diagonal as a 1D array
diag_vals = None  # replace None

# TODO: create a 3x3 diagonal matrix from the array [5., 10., 15.]
diag_mat = None  # replace None

# ---------------------------------------------------------------------------
# 4. Upper and lower triangular
# ---------------------------------------------------------------------------

m = np.ones((4, 4))

# TODO: get the upper triangular part of m (including diagonal), zero elsewhere
upper = None  # replace None

# TODO: get the strictly lower triangular part of m (below diagonal only)
lower_strict = None  # replace None

# ---------------------------------------------------------------------------
# 5. np.take and np.put
# ---------------------------------------------------------------------------

source = np.array([10., 20., 30., 40., 50.])

# TODO: use np.take to gather elements at indices [2, 0, 4]
taken = None  # replace None

target = np.zeros(6)

# TODO: use np.put to place values [100., 200., 300.] at indices [1, 3, 5]
np.put(target, [1, 3, 5], [100., 200., 300.])  # already done — no TODO here

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert submatrix is not None, "submatrix must be defined"
    assert submatrix.shape == (3, 2), f"Expected (3,2), got {submatrix.shape}"
    assert submatrix[0, 0] == mat[0, 1], "submatrix[0,0] should be mat[0,1]"
    assert submatrix[2, 1] == mat[4, 3], "submatrix[2,1] should be mat[4,3]"

    assert XX is not None and YY is not None, "XX and YY must be defined"
    assert XX.shape == (2, 3), f"XX should be (2,3), got {XX.shape}"
    assert YY.shape == (2, 3), f"YY should be (2,3), got {YY.shape}"
    assert np.allclose(XX[0], [1., 2., 3.]), "XX rows should repeat x values"
    assert np.allclose(YY[:, 0], [10., 20.]), "YY cols should repeat y values"

    assert diag_vals is not None, "diag_vals must be defined"
    assert np.allclose(diag_vals, [0., 4., 8.]), f"diag wrong: {diag_vals}"

    assert diag_mat is not None, "diag_mat must be defined"
    assert diag_mat.shape == (3, 3), "diag_mat should be 3x3"
    assert np.allclose(np.diag(diag_mat), [5., 10., 15.]), "diag_mat diagonal wrong"
    assert np.allclose(diag_mat - np.diag(np.diag(diag_mat)), 0), "off-diag should be 0"

    assert upper is not None, "upper must be defined"
    assert np.allclose(upper[0], [1, 1, 1, 1]), "first row of upper should be all 1"
    assert np.allclose(upper[3, :3], [0, 0, 0]), "lower left of upper should be 0"

    assert lower_strict is not None, "lower_strict must be defined"
    assert np.allclose(lower_strict[0], [0, 0, 0, 0]), "first row should be 0"
    assert np.allclose(lower_strict[:, 3], [0, 0, 0, 0]), "last col should be 0"
    assert np.isclose(lower_strict[1, 0], 1.), "lower_strict[1,0] should be 1"

    assert taken is not None, "taken must be defined"
    assert np.allclose(taken, [30., 10., 50.]), f"taken wrong: {taken}"

    assert np.allclose(target, [0., 100., 0., 200., 0., 300.]), f"target wrong: {target}"

    print("Exercise 3.3 — All assertions passed!")

if __name__ == "__main__":
    main()
