# ============================================================================
# Exercise 3.4 — Universal Functions (ufuncs)
# ============================================================================
# Practice ufunc methods: reduce, accumulate, outer, reduceat. Create custom
# ufuncs using np.frompyfunc.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. ufunc.reduce
# ---------------------------------------------------------------------------

arr = np.array([1., 2., 3., 4., 5.])

# TODO: use np.add.reduce to compute the sum of arr
add_reduce = None  # replace None

# TODO: use np.multiply.reduce to compute the product of arr
mul_reduce = None  # replace None

# ---------------------------------------------------------------------------
# 2. ufunc.accumulate
# ---------------------------------------------------------------------------

# TODO: use np.add.accumulate to compute the running sum of arr
add_accum = None  # replace None

# TODO: use np.multiply.accumulate to compute the running product of arr
mul_accum = None  # replace None

# ---------------------------------------------------------------------------
# 3. ufunc.outer
# ---------------------------------------------------------------------------

a = np.array([1., 2., 3.])
b = np.array([10., 20., 30., 40.])

# TODO: use np.add.outer to compute all pairwise sums (shape 3x4)
add_outer = None  # replace None

# TODO: use np.multiply.outer to compute the outer product (shape 3x4)
mul_outer = None  # replace None

# ---------------------------------------------------------------------------
# 4. Custom ufunc with np.frompyfunc
# ---------------------------------------------------------------------------

def my_clamp(x, lo, hi):
    """Clamp scalar x to [lo, hi]."""
    if x < lo:
        return lo
    elif x > hi:
        return hi
    return x

# TODO: create a custom ufunc using np.frompyfunc(my_clamp, 3, 1)
clamp_ufunc = None  # replace None

# ---------------------------------------------------------------------------
# 5. np.add.reduceat — segmented reduction
# ---------------------------------------------------------------------------

data = np.array([1., 2., 3., 4., 5., 6., 7., 8., 9., 10.])
# Segment boundaries: [0, 3, 7] means segments [0:3], [3:7], [7:]
indices = np.array([0, 3, 7])

# TODO: use np.add.reduceat to compute the sum of each segment
segment_sums = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert add_reduce is not None, "add_reduce must be defined"
    assert np.isclose(add_reduce, 15.), f"add_reduce should be 15, got {add_reduce}"

    assert mul_reduce is not None, "mul_reduce must be defined"
    assert np.isclose(mul_reduce, 120.), f"mul_reduce should be 120, got {mul_reduce}"

    assert add_accum is not None, "add_accum must be defined"
    assert np.allclose(add_accum, [1., 3., 6., 10., 15.]), f"add_accum wrong: {add_accum}"

    assert mul_accum is not None, "mul_accum must be defined"
    assert np.allclose(mul_accum, [1., 2., 6., 24., 120.]), f"mul_accum wrong: {mul_accum}"

    assert add_outer is not None, "add_outer must be defined"
    assert add_outer.shape == (3, 4), f"Expected (3,4), got {add_outer.shape}"
    assert np.isclose(add_outer[0, 0], 11.), f"add_outer[0,0] should be 11"
    assert np.isclose(add_outer[2, 3], 43.), f"add_outer[2,3] should be 43"

    assert mul_outer is not None, "mul_outer must be defined"
    assert mul_outer.shape == (3, 4), f"Expected (3,4), got {mul_outer.shape}"
    assert np.allclose(mul_outer, np.outer(a, b)), "mul_outer should match np.outer"

    assert clamp_ufunc is not None, "clamp_ufunc must be defined"
    test_vals = np.array([-5., 0., 3., 7., 10.])
    clamped = clamp_ufunc(test_vals, 0., 5.).astype(float)
    assert np.allclose(clamped, [0., 0., 3., 5., 5.]), f"clamp_ufunc wrong: {clamped}"

    assert segment_sums is not None, "segment_sums must be defined"
    assert len(segment_sums) == 3, "should have 3 segments"
    assert np.isclose(segment_sums[0], 6.),  f"segment 0 sum should be 6, got {segment_sums[0]}"
    assert np.isclose(segment_sums[1], 22.), f"segment 1 sum should be 22, got {segment_sums[1]}"
    assert np.isclose(segment_sums[2], 34.), f"segment 2 sum should be 34, got {segment_sums[2]}"

    print("Exercise 3.4 — All assertions passed!")

if __name__ == "__main__":
    main()
