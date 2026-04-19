# ============================================================================
# Exercise 1.3 — Array Operations
# ============================================================================
# Learn element-wise arithmetic (+, -, *, /, **), comparison operators,
# scalar broadcasting, and NumPy universal functions (ufuncs) like np.add,
# np.multiply, etc.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Element-wise arithmetic
# ---------------------------------------------------------------------------

a = np.array([1, 2, 3, 4, 5], dtype=float)
b = np.array([10, 20, 30, 40, 50], dtype=float)

# TODO: add arrays a and b element-wise
result_add = None  # replace None

# TODO: subtract a from b element-wise
result_sub = None  # replace None

# TODO: multiply a and b element-wise
result_mul = None  # replace None

# TODO: divide b by a element-wise
result_div = None  # replace None

# TODO: raise a to the power of 2 element-wise
result_pow = None  # replace None

# ---------------------------------------------------------------------------
# 2. Scalar broadcasting
# ---------------------------------------------------------------------------

arr = np.array([1, 2, 3, 4, 5], dtype=float)

# TODO: multiply every element by 3
scaled = None  # replace None

# TODO: add 10 to every element
shifted = None  # replace None

# TODO: check which elements are greater than 2
greater_than_2 = None  # replace None (should be a boolean array)

# ---------------------------------------------------------------------------
# 3. Comparison operators
# ---------------------------------------------------------------------------

x = np.array([5, 3, 8, 1, 9, 2])

# TODO: create a boolean array where x > 4
mask_gt4 = None  # replace None

# TODO: create a boolean array where x == 3
mask_eq3 = None  # replace None

# TODO: create a boolean array where x <= 3
mask_le3 = None  # replace None

# ---------------------------------------------------------------------------
# 4. NumPy ufuncs
# ---------------------------------------------------------------------------

p = np.array([1.0, 4.0, 9.0, 16.0])
q = np.array([2.0, 3.0, 4.0, 5.0])

# TODO: use np.add to add p and q
ufunc_add = None  # replace None

# TODO: use np.multiply to multiply p and q
ufunc_mul = None  # replace None

# TODO: use np.sqrt to compute square roots of p
sqrt_p = None  # replace None

# TODO: use np.maximum to get element-wise maximum of p and q
elem_max = None  # replace None

# ---------------------------------------------------------------------------
# 5. Chained operations
# ---------------------------------------------------------------------------

data = np.array([2.0, 4.0, 6.0, 8.0])

# TODO: compute (data * 3 + 1) / 2
chained = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert np.allclose(result_add, [11, 22, 33, 44, 55]), f"result_add wrong: {result_add}"
    assert np.allclose(result_sub, [9, 18, 27, 36, 45]), f"result_sub wrong"
    assert np.allclose(result_mul, [10, 40, 90, 160, 250]), f"result_mul wrong"
    assert np.allclose(result_div, [10, 10, 10, 10, 10]), f"result_div wrong"
    assert np.allclose(result_pow, [1, 4, 9, 16, 25]), f"result_pow wrong"

    assert np.allclose(scaled, [3, 6, 9, 12, 15]), f"scaled wrong"
    assert np.allclose(shifted, [11, 12, 13, 14, 15]), f"shifted wrong"
    assert list(greater_than_2) == [False, False, True, True, True], f"greater_than_2 wrong"

    assert list(mask_gt4) == [True, False, True, False, True, False], f"mask_gt4 wrong"
    assert list(mask_eq3) == [False, True, False, False, False, False], f"mask_eq3 wrong"
    assert list(mask_le3) == [False, True, False, True, False, True], f"mask_le3 wrong"

    assert np.allclose(ufunc_add, [3, 7, 13, 21]), f"ufunc_add wrong"
    assert np.allclose(ufunc_mul, [2, 12, 36, 80]), f"ufunc_mul wrong"
    assert np.allclose(sqrt_p, [1, 2, 3, 4]), f"sqrt_p wrong"
    assert np.allclose(elem_max, [2, 4, 9, 16]), f"elem_max wrong"

    assert np.allclose(chained, [3.5, 6.5, 9.5, 12.5]), f"chained wrong"

    print("Exercise 1.3 — All assertions passed!")

if __name__ == "__main__":
    main()
