# ============================================================================
# Exercise 6.3 — Advanced Ufuncs
# ============================================================================
# Master NumPy ufunc machinery: frompyfunc, vectorize, reduce, accumulate,
# outer, reduceat, and generalized ufuncs with signatures.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

np.random.seed(5)

# ---------------------------------------------------------------------------
# 1. np.frompyfunc — create a ufunc from a Python function
# ---------------------------------------------------------------------------

# TODO: create a ufunc using np.frompyfunc that computes x**3 (one input, one output)
cube_ufunc = None  # replace None

# TODO: apply cube_ufunc to np.arange(5) and convert result to float array
cubed = None  # replace None   (cast to float via .astype(float))

# ---------------------------------------------------------------------------
# 2. np.vectorize — vectorize a Python function
# ---------------------------------------------------------------------------

def sign_str(x_ss):
    """Return 'pos', 'neg', or 'zero' based on sign of x."""
    if x_ss > 0:
        return 'pos'
    elif x_ss < 0:
        return 'neg'
    else:
        return 'zero'

# TODO: create a vectorized version of sign_str using np.vectorize
v_sign = None  # replace None

# TODO: apply v_sign to np.array([-2, 0, 3, -1, 5])
sign_result = None  # replace None

# ---------------------------------------------------------------------------
# 3. ufunc reduce — compute product via np.multiply.reduce
# ---------------------------------------------------------------------------

arr = np.array([1., 2., 3., 4., 5.])

# TODO: compute product of all elements using np.multiply.reduce(arr)
product = None  # replace None   (expected: 120.0)

# ---------------------------------------------------------------------------
# 4. ufunc accumulate — running maximum
# ---------------------------------------------------------------------------

arr2 = np.array([3., 1., 4., 1., 5., 9., 2., 6.])

# TODO: compute running maximum using np.maximum.accumulate(arr2)
running_max = None  # replace None

# ---------------------------------------------------------------------------
# 5. ufunc outer — outer product
# ---------------------------------------------------------------------------

u = np.array([1., 2., 3.])
v = np.array([10., 20.])

# TODO: compute outer product matrix using np.multiply.outer(u, v)
outer_mat = None  # replace None   — shape (3, 2)

# ---------------------------------------------------------------------------
# 6. ufunc reduceat — grouped sum
# ---------------------------------------------------------------------------

values = np.array([1., 2., 3., 4., 5., 6., 7., 8., 9., 10.])
group_starts = np.array([0, 3, 7])   # groups: [0:3], [3:7], [7:]

# TODO: compute group sums using np.add.reduceat(values, group_starts)
group_sums = None  # replace None   — shape (3,)

# ---------------------------------------------------------------------------
# 7. np.vectorize with signature — batch row dot products
# ---------------------------------------------------------------------------

def row_dot(a_rd, b_rd):
    return float(np.dot(a_rd, b_rd))

# TODO: create vectorized row_dot with signature='(n),(n)->()'
v_row_dot = None  # replace None

A = np.random.rand(5, 4)
B = np.random.rand(5, 4)

# TODO: apply v_row_dot to A and B → shape (5,)
dot_results = None  # replace None

# ---------------------------------------------------------------------------
# 8. ufunc at — unbuffered in-place operation
# ---------------------------------------------------------------------------

hist = np.zeros(5, dtype=float)
indices = np.array([0, 1, 1, 2, 2, 2, 3, 4, 4])

# TODO: use np.add.at(hist, indices, 1.) to count occurrences
# (fills hist with counts at each index position)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert cube_ufunc is not None, "cube_ufunc must be defined"
    assert hasattr(cube_ufunc, 'nin') and hasattr(cube_ufunc, 'nout'), \
        "cube_ufunc should be a ufunc-like object"

    assert cubed is not None, "cubed must be defined"
    assert cubed.shape == (5,), f"cubed shape should be (5,), got {cubed.shape}"
    assert np.allclose(cubed.astype(float), [0., 1., 8., 27., 64.]), \
        f"cubed should be [0,1,8,27,64], got {cubed}"

    assert v_sign is not None, "v_sign must be defined"
    assert callable(v_sign), "v_sign should be callable"

    assert sign_result is not None, "sign_result must be defined"
    assert len(sign_result) == 5, "sign_result should have 5 elements"
    assert list(sign_result) == ['neg', 'zero', 'pos', 'neg', 'pos'], \
        f"sign_result mismatch: {list(sign_result)}"

    assert product is not None, "product must be defined"
    assert np.isclose(float(product), 120.0), f"product should be 120.0, got {product}"

    assert running_max is not None, "running_max must be defined"
    assert len(running_max) == len(arr2), "running_max length mismatch"
    assert np.allclose(running_max, [3., 3., 4., 4., 5., 9., 9., 9.]), \
        f"running_max mismatch: {running_max}"

    assert outer_mat is not None, "outer_mat must be defined"
    assert outer_mat.shape == (3, 2), f"outer_mat shape should be (3, 2), got {outer_mat.shape}"
    assert np.allclose(outer_mat, [[10., 20.], [20., 40.], [30., 60.]]), \
        f"outer_mat values mismatch: {outer_mat}"

    assert group_sums is not None, "group_sums must be defined"
    assert group_sums.shape == (3,), f"group_sums shape should be (3,), got {group_sums.shape}"
    assert np.allclose(group_sums, [6., 22., 27.]), \
        f"group_sums should be [6, 22, 34], got {group_sums}"

    assert v_row_dot is not None, "v_row_dot must be defined"
    assert callable(v_row_dot), "v_row_dot should be callable"

    assert dot_results is not None, "dot_results must be defined"
    assert dot_results.shape == (5,), f"dot_results shape should be (5,), got {dot_results.shape}"
    expected_dots = np.array([np.dot(A[i], B[i]) for i in range(5)])
    assert np.allclose(dot_results.astype(float), expected_dots, atol=1e-10), \
        "dot_results should match manual row dot products"

    assert np.allclose(hist, [1., 2., 3., 1., 2.]), \
        f"hist should be [1,2,3,1,2] after add.at, got {hist}"

    print("Exercise 6.3 — All assertions passed!")

if __name__ == "__main__":
    main()
