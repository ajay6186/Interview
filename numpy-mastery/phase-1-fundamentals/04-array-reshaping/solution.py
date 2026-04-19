# ============================================================================
# Solution 1.4 — Array Reshaping
# ============================================================================
# Learn to reshape arrays, add/remove dimensions, transpose, concatenate,
# and stack arrays using reshape, ravel, flatten, T, newaxis, squeeze,
# expand_dims, concatenate, and stack.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Reshape and flatten
# ---------------------------------------------------------------------------

arr = np.arange(12)

# Reshape arr into a (3, 4) matrix
matrix = arr.reshape(3, 4)

# Reshape arr into a (2, 2, 3) 3D array
arr3d = arr.reshape(2, 2, 3)

# Flatten matrix back to 1D using .ravel() (returns view when possible)
flat_ravel = matrix.ravel()

# Flatten matrix back to 1D using .flatten() (always returns copy)
flat_flatten = matrix.flatten()

# ---------------------------------------------------------------------------
# 2. Transpose
# ---------------------------------------------------------------------------

mat = np.array([[1, 2, 3],
                [4, 5, 6]])  # shape (2,3)

# Transpose mat so shape becomes (3, 2)
mat_T = mat.T

# ---------------------------------------------------------------------------
# 3. Adding and removing dimensions
# ---------------------------------------------------------------------------

vec = np.array([1, 2, 3, 4])  # shape (4,)

# Add a new axis at position 0 so shape becomes (1, 4)
row_vec = vec[np.newaxis, :]

# Add a new axis at position 1 so shape becomes (4, 1)
col_vec = vec[:, np.newaxis]

# Use np.expand_dims to add axis at position 0
expanded = np.expand_dims(vec, axis=0)

base2d = np.array([[1, 2, 3]])  # shape (1, 3)

# Use np.squeeze to remove the size-1 axis, result shape (3,)
squeezed = np.squeeze(base2d)

# ---------------------------------------------------------------------------
# 4. Concatenate and stack
# ---------------------------------------------------------------------------

a = np.array([[1, 2], [3, 4]])  # shape (2, 2)
b = np.array([[5, 6], [7, 8]])  # shape (2, 2)

# Concatenate a and b along axis 0 (row-wise), result shape (4, 2)
concat_rows = np.concatenate([a, b], axis=0)

# Concatenate a and b along axis 1 (column-wise), result shape (2, 4)
concat_cols = np.concatenate([a, b], axis=1)

x = np.array([1, 2, 3])
y = np.array([4, 5, 6])

# Stack x and y along a new axis 0 to get shape (2, 3)
stacked_0 = np.stack([x, y], axis=0)

# Stack x and y along a new axis 1 to get shape (3, 2)
stacked_1 = np.stack([x, y], axis=1)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert matrix is not None, "matrix must be defined"
    assert matrix.shape == (3, 4), f"Expected (3,4), got {matrix.shape}"

    assert arr3d is not None, "arr3d must be defined"
    assert arr3d.shape == (2, 2, 3), f"Expected (2,2,3), got {arr3d.shape}"

    assert flat_ravel is not None, "flat_ravel must be defined"
    assert flat_ravel.shape == (12,), f"Expected (12,), got {flat_ravel.shape}"
    assert list(flat_ravel) == list(range(12)), "flat_ravel should be 0..11"

    assert flat_flatten is not None, "flat_flatten must be defined"
    assert flat_flatten.shape == (12,), f"Expected (12,), got {flat_flatten.shape}"
    assert not np.shares_memory(flat_flatten, matrix), "flatten should return a copy"

    assert mat_T is not None, "mat_T must be defined"
    assert mat_T.shape == (3, 2), f"Expected (3,2), got {mat_T.shape}"
    assert mat_T[0, 0] == 1 and mat_T[2, 1] == 6, "transpose values wrong"

    assert row_vec is not None, "row_vec must be defined"
    assert row_vec.shape == (1, 4), f"Expected (1,4), got {row_vec.shape}"

    assert col_vec is not None, "col_vec must be defined"
    assert col_vec.shape == (4, 1), f"Expected (4,1), got {col_vec.shape}"

    assert expanded is not None, "expanded must be defined"
    assert expanded.shape == (1, 4), f"Expected (1,4), got {expanded.shape}"

    assert squeezed is not None, "squeezed must be defined"
    assert squeezed.shape == (3,), f"Expected (3,), got {squeezed.shape}"

    assert concat_rows is not None, "concat_rows must be defined"
    assert concat_rows.shape == (4, 2), f"Expected (4,2), got {concat_rows.shape}"

    assert concat_cols is not None, "concat_cols must be defined"
    assert concat_cols.shape == (2, 4), f"Expected (2,4), got {concat_cols.shape}"

    assert stacked_0 is not None, "stacked_0 must be defined"
    assert stacked_0.shape == (2, 3), f"Expected (2,3), got {stacked_0.shape}"

    assert stacked_1 is not None, "stacked_1 must be defined"
    assert stacked_1.shape == (3, 2), f"Expected (3,2), got {stacked_1.shape}"

    print("Solution 1.4 — All assertions passed!")

if __name__ == "__main__":
    main()
