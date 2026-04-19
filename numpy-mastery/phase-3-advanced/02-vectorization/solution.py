# ============================================================================
# Solution 3.2 — Vectorization
# ============================================================================
# Replace Python for-loops with vectorized NumPy operations using
# np.vectorize, np.frompyfunc, and np.apply_along_axis.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. np.vectorize
# ---------------------------------------------------------------------------

def clamp_scalar(x, lo, hi):
    """Clamp a scalar value to [lo, hi]."""
    return max(lo, min(hi, x))

# Create a vectorized version of clamp_scalar using np.vectorize
clamp_vec = np.vectorize(clamp_scalar)

# ---------------------------------------------------------------------------
# 2. Replace a for-loop with vectorized operations
# ---------------------------------------------------------------------------

data = np.array([-5., -2., 0., 3., 7., 10., -1., 4.])

# Compute the following using a loop (reference):
loop_result = np.array([x**2 if x >= 0 else -x for x in data])

# Compute the same result WITHOUT a loop using np.where
vectorized_result = np.where(data >= 0, data ** 2, -data)

# ---------------------------------------------------------------------------
# 3. np.frompyfunc
# ---------------------------------------------------------------------------

def grade(score):
    """Convert a numeric score to a letter grade."""
    if score >= 90:
        return 'A'
    elif score >= 80:
        return 'B'
    elif score >= 70:
        return 'C'
    elif score >= 60:
        return 'D'
    else:
        return 'F'

# Create a ufunc from grade using np.frompyfunc (1 input, 1 output)
grade_ufunc = np.frompyfunc(grade, 1, 1)

# ---------------------------------------------------------------------------
# 4. np.apply_along_axis
# ---------------------------------------------------------------------------

matrix = np.array([[3., 1., 4., 1., 5.],
                   [9., 2., 6., 5., 3.],
                   [5., 8., 9., 7., 9.]])

def normalize_row(row):
    """Min-max normalize a 1D array to [0, 1]."""
    lo, hi = row.min(), row.max()
    return (row - lo) / (hi - lo) if hi > lo else row * 0.0

# Apply normalize_row along axis=1 (to each row)
normalized_rows = np.apply_along_axis(normalize_row, axis=1, arr=matrix)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    # clamp_vec tests
    assert clamp_vec is not None, "clamp_vec must be defined"
    arr_test = np.array([-5., 0., 3., 10., 15.])
    clamped = clamp_vec(arr_test, 0., 8.)
    assert np.allclose(clamped, [0., 0., 3., 8., 8.]), f"clamped wrong: {clamped}"

    # vectorized_result test
    assert vectorized_result is not None, "vectorized_result must be defined"
    assert np.allclose(vectorized_result, loop_result), \
        f"vectorized_result {vectorized_result} != loop_result {loop_result}"

    # grade_ufunc tests
    assert grade_ufunc is not None, "grade_ufunc must be defined"
    scores = np.array([95., 83., 74., 62., 55.])
    grades = grade_ufunc(scores)
    assert list(grades) == ['A', 'B', 'C', 'D', 'F'], f"grades wrong: {grades}"

    # normalized_rows tests
    assert normalized_rows is not None, "normalized_rows must be defined"
    assert normalized_rows.shape == matrix.shape, "shape should match matrix"
    # Each row should have min=0 and max=1
    assert np.allclose(normalized_rows.min(axis=1), 0.), "min of each row should be 0"
    assert np.allclose(normalized_rows.max(axis=1), 1.), "max of each row should be 1"

    print("Solution 3.2 — All assertions passed!")

if __name__ == "__main__":
    main()
