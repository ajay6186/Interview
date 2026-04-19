# ============================================================================
# Solution 6.3 — Advanced Ufuncs
# ============================================================================

import numpy as np

np.random.seed(5)

# 1. np.frompyfunc
cube_ufunc = np.frompyfunc(lambda x_c: x_c**3, 1, 1)
cubed = cube_ufunc(np.arange(5)).astype(float)

# 2. np.vectorize
def sign_str(x_ss):
    if x_ss > 0: return 'pos'
    elif x_ss < 0: return 'neg'
    else: return 'zero'
v_sign = np.vectorize(sign_str)
sign_result = v_sign(np.array([-2, 0, 3, -1, 5]))

# 3. reduce — product
arr = np.array([1., 2., 3., 4., 5.])
product = np.multiply.reduce(arr)

# 4. accumulate — running max
arr2 = np.array([3., 1., 4., 1., 5., 9., 2., 6.])
running_max = np.maximum.accumulate(arr2)

# 5. outer product
u = np.array([1., 2., 3.])
v = np.array([10., 20.])
outer_mat = np.multiply.outer(u, v)

# 6. reduceat — grouped sum
values = np.array([1., 2., 3., 4., 5., 6., 7., 8., 9., 10.])
group_starts = np.array([0, 3, 7])
group_sums = np.add.reduceat(values, group_starts)

# 7. vectorize with signature
def row_dot(a_rd, b_rd):
    return float(np.dot(a_rd, b_rd))
v_row_dot = np.vectorize(row_dot, signature='(n),(n)->()')
A = np.random.rand(5, 4)
B = np.random.rand(5, 4)
dot_results = v_row_dot(A, B)

# 8. ufunc at
hist = np.zeros(5, dtype=float)
indices = np.array([0, 1, 1, 2, 2, 2, 3, 4, 4])
np.add.at(hist, indices, 1.)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert cube_ufunc is not None
    assert hasattr(cube_ufunc, 'nin') and hasattr(cube_ufunc, 'nout')

    assert cubed is not None
    assert cubed.shape == (5,)
    assert np.allclose(cubed.astype(float), [0., 1., 8., 27., 64.])

    assert v_sign is not None
    assert callable(v_sign)

    assert sign_result is not None
    assert len(sign_result) == 5
    assert list(sign_result) == ['neg', 'zero', 'pos', 'neg', 'pos']

    assert product is not None
    assert np.isclose(float(product), 120.0)

    assert running_max is not None
    assert len(running_max) == len(arr2)
    assert np.allclose(running_max, [3., 3., 4., 4., 5., 9., 9., 9.])

    assert outer_mat is not None
    assert outer_mat.shape == (3, 2)
    assert np.allclose(outer_mat, [[10., 20.], [20., 40.], [30., 60.]])

    assert group_sums is not None
    assert group_sums.shape == (3,)
    assert np.allclose(group_sums, [6., 22., 27.])

    assert v_row_dot is not None
    assert callable(v_row_dot)

    assert dot_results is not None
    assert dot_results.shape == (5,)
    expected_dots = np.array([np.dot(A[i], B[i]) for i in range(5)])
    assert np.allclose(dot_results.astype(float), expected_dots, atol=1e-10)

    assert np.allclose(hist, [1., 2., 3., 1., 2.])

    print("Solution 6.3 — All assertions passed!")

if __name__ == "__main__":
    main()
