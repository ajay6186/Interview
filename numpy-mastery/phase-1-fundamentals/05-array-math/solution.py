# ============================================================================
# Solution 1.5 — Array Math
# ============================================================================
# Learn to compute statistics along axes using np.sum, np.mean, np.max,
# np.min, np.std, np.var, np.cumsum, np.cumprod, and apply ufuncs like
# np.sqrt, np.exp, np.log. Pay attention to the axis parameter.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Global reductions
# ---------------------------------------------------------------------------

arr = np.array([[1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]], dtype=float)

# Compute the sum of ALL elements
total_sum = np.sum(arr)

# Compute the mean of ALL elements
total_mean = np.mean(arr)

# Compute the maximum value in the entire array
total_max = np.max(arr)

# Compute the minimum value in the entire array
total_min = np.min(arr)

# ---------------------------------------------------------------------------
# 2. Reductions along axes
# ---------------------------------------------------------------------------

# Sum each column (axis=0), result shape (3,)
col_sums = np.sum(arr, axis=0)

# Sum each row (axis=1), result shape (3,)
row_sums = np.sum(arr, axis=1)

# Mean of each column (axis=0), result shape (3,)
col_means = np.mean(arr, axis=0)

# Max of each row (axis=1), result shape (3,)
row_maxes = np.max(arr, axis=1)

# ---------------------------------------------------------------------------
# 3. Standard deviation and variance
# ---------------------------------------------------------------------------

data = np.array([2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0])

# Compute the standard deviation (population std, ddof=0)
std_val = np.std(data)

# Compute the variance (population variance, ddof=0)
var_val = np.var(data)

# ---------------------------------------------------------------------------
# 4. Cumulative operations
# ---------------------------------------------------------------------------

seq = np.array([1, 2, 3, 4, 5])

# Compute cumulative sum of seq
cum_sum = np.cumsum(seq)

# Compute cumulative product of seq
cum_prod = np.cumprod(seq)

# ---------------------------------------------------------------------------
# 5. Mathematical ufuncs
# ---------------------------------------------------------------------------

values = np.array([1.0, 4.0, 9.0, 16.0, 25.0])

# Compute square root of each element
sqrt_vals = np.sqrt(values)

# Compute e^x for x = [0, 1, 2]
exp_vals = np.exp(np.array([0, 1, 2], dtype=float))

# Compute natural log of values (values are all > 0)
log_vals = np.log(values)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert np.isclose(total_sum, 45.0), f"total_sum wrong: {total_sum}"
    assert np.isclose(total_mean, 5.0), f"total_mean wrong: {total_mean}"
    assert np.isclose(total_max, 9.0), f"total_max wrong: {total_max}"
    assert np.isclose(total_min, 1.0), f"total_min wrong: {total_min}"

    assert col_sums is not None and col_sums.shape == (3,), f"col_sums wrong shape"
    assert np.allclose(col_sums, [12, 15, 18]), f"col_sums values wrong: {col_sums}"

    assert row_sums is not None and row_sums.shape == (3,), f"row_sums wrong shape"
    assert np.allclose(row_sums, [6, 15, 24]), f"row_sums values wrong: {row_sums}"

    assert col_means is not None and col_means.shape == (3,), f"col_means wrong shape"
    assert np.allclose(col_means, [4.0, 5.0, 6.0]), f"col_means values wrong"

    assert row_maxes is not None and row_maxes.shape == (3,), f"row_maxes wrong shape"
    assert np.allclose(row_maxes, [3, 6, 9]), f"row_maxes values wrong"

    assert np.isclose(std_val, 2.0), f"std_val wrong: {std_val}"
    assert np.isclose(var_val, 4.0), f"var_val wrong: {var_val}"

    assert cum_sum is not None, "cum_sum must be defined"
    assert np.allclose(cum_sum, [1, 3, 6, 10, 15]), f"cum_sum wrong: {cum_sum}"

    assert cum_prod is not None, "cum_prod must be defined"
    assert np.allclose(cum_prod, [1, 2, 6, 24, 120]), f"cum_prod wrong: {cum_prod}"

    assert sqrt_vals is not None, "sqrt_vals must be defined"
    assert np.allclose(sqrt_vals, [1, 2, 3, 4, 5]), f"sqrt_vals wrong"

    assert exp_vals is not None, "exp_vals must be defined"
    assert exp_vals.shape == (3,), "exp_vals should have 3 elements"
    assert np.isclose(exp_vals[0], 1.0), "exp(0) should be 1.0"
    assert np.isclose(exp_vals[1], np.e), "exp(1) should be e"

    assert log_vals is not None, "log_vals must be defined"
    assert np.allclose(log_vals, np.log(values)), "log_vals wrong"

    print("Solution 1.5 — All assertions passed!")

if __name__ == "__main__":
    main()
