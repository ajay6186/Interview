# ============================================================================
# Solution 4.1 — Data Preprocessing
# ============================================================================
# Implement min-max normalization, z-score standardization, outlier clipping,
# NaN handling, and understand how these operations work on NumPy arrays.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Min-max normalization
# ---------------------------------------------------------------------------

def normalize(arr):
    """Scale arr to [0, 1] using min-max normalization.
    If max == min, return zeros.
    """
    lo = arr.min()
    hi = arr.max()
    if np.isclose(hi, lo):
        return np.zeros_like(arr, dtype=float)
    return (arr - lo) / (hi - lo)

# ---------------------------------------------------------------------------
# 2. Z-score standardization
# ---------------------------------------------------------------------------

def standardize(arr):
    """Standardize arr to have mean=0 and std=1 (population std).
    If std == 0, return zeros.
    """
    mean = arr.mean()
    std = arr.std()
    if np.isclose(std, 0.):
        return np.zeros_like(arr, dtype=float)
    return (arr - mean) / std

# ---------------------------------------------------------------------------
# 3. Clip outliers
# ---------------------------------------------------------------------------

def clip_outliers(arr, low_pct=5., high_pct=95.):
    """Clip values below the low_pct percentile and above the high_pct percentile."""
    low = np.percentile(arr, low_pct)
    high = np.percentile(arr, high_pct)
    return np.clip(arr, low, high)

# ---------------------------------------------------------------------------
# 4. Fill NaN with mean
# ---------------------------------------------------------------------------

def fill_nan_with_mean(arr):
    """Replace NaN values with the mean of non-NaN values.
    Return a copy (do not modify the original).
    """
    result = arr.copy()
    mean_val = np.nanmean(arr)
    result[np.isnan(result)] = mean_val
    return result

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    # normalize
    x = np.array([2., 4., 6., 8., 10.])
    normed = normalize(x)
    assert normed is not None, "normalize must return a value"
    assert np.isclose(normed.min(), 0.), f"min after normalize should be 0, got {normed.min()}"
    assert np.isclose(normed.max(), 1.), f"max after normalize should be 1, got {normed.max()}"
    assert np.allclose(normed, [0., 0.25, 0.5, 0.75, 1.]), f"normalize wrong: {normed}"

    # normalize edge case: all same value
    x_const = np.array([3., 3., 3.])
    normed_const = normalize(x_const)
    assert np.allclose(normed_const, [0., 0., 0.]), "constant array should normalize to zeros"

    # standardize
    data = np.array([2., 4., 4., 4., 5., 5., 7., 9.])
    std_data = standardize(data)
    assert std_data is not None, "standardize must return a value"
    assert np.isclose(std_data.mean(), 0., atol=1e-10), f"mean after standardize should be 0"
    assert np.isclose(std_data.std(), 1., atol=1e-10), f"std after standardize should be 1"

    # standardize edge case: all same
    std_const = standardize(np.array([5., 5., 5.]))
    assert np.allclose(std_const, [0., 0., 0.]), "constant standardize should be zeros"

    # clip_outliers
    np.random.seed(42)
    arr_with_outliers = np.concatenate([
        np.random.normal(0., 1., 90),
        np.array([100., -100., 200., -200., 150., -150., 120., -120., 110., -110.])
    ])
    clipped = clip_outliers(arr_with_outliers)
    assert clipped is not None, "clip_outliers must return a value"
    low_thresh = np.percentile(arr_with_outliers, 5.)
    high_thresh = np.percentile(arr_with_outliers, 95.)
    assert clipped.min() >= low_thresh - 1e-10, "min should be >= 5th percentile"
    assert clipped.max() <= high_thresh + 1e-10, "max should be <= 95th percentile"

    # fill_nan_with_mean
    arr_nan = np.array([1., 2., np.nan, 4., np.nan, 6.])
    filled = fill_nan_with_mean(arr_nan)
    assert filled is not None, "fill_nan_with_mean must return a value"
    assert not np.any(np.isnan(filled)), "result should have no NaN"
    expected_mean = np.nanmean(arr_nan)
    assert np.isclose(filled[2], expected_mean), f"NaN at index 2 should be {expected_mean}"
    assert np.isclose(filled[4], expected_mean), f"NaN at index 4 should be {expected_mean}"
    assert np.isclose(arr_nan[2], np.nan, equal_nan=True), "original should be unchanged"

    print("Solution 4.1 — All assertions passed!")

if __name__ == "__main__":
    main()
