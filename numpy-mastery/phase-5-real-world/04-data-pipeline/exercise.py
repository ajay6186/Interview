# ============================================================================
# Exercise 5.4 — Data Pipeline
# ============================================================================
# Build robust data pipeline components with NumPy: missing-value handling,
# outlier removal, normalization, rolling stats, and chunked processing.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

np.random.seed(3)

n = 400
raw = np.column_stack([
    np.sin(np.linspace(0, 4*np.pi, n)) + np.random.normal(0, 0.1, n),
    np.random.normal(50, 10, n),
    np.random.exponential(3, n),
])

# Inject NaN
rng_nan = np.random.RandomState(11)
raw[rng_nan.random((n, 3)) < 0.04] = np.nan

# ---------------------------------------------------------------------------
# 1. Count NaNs per column
# ---------------------------------------------------------------------------

# TODO: count NaN values in each column using np.isnan and .sum
nan_counts = None  # replace None   — shape (3,)

# ---------------------------------------------------------------------------
# 2. Forward-fill NaN values in column 0
# ---------------------------------------------------------------------------

col0 = raw[:, 0].copy()

# TODO: implement forward fill: replace each NaN with the last valid value
#       Hint: iterate with a loop, checking np.isnan(col0[i])
col0_ffill = col0.copy()
# ... fill col0_ffill ...

# ---------------------------------------------------------------------------
# 3. Mean imputation for all columns
# ---------------------------------------------------------------------------

# TODO: compute per-column mean ignoring NaN (np.nanmean)
col_means = None  # replace None

# TODO: create data_filled — copy of raw with NaN replaced by column mean
data_filled = raw.copy()
# ... fill data_filled ...

# ---------------------------------------------------------------------------
# 4. Z-score normalization of data_filled
# ---------------------------------------------------------------------------

# TODO: compute column-wise mean and std of data_filled
d_mean = None  # replace None
d_std  = None  # replace None

# TODO: z-score normalize data_filled
data_norm = None  # replace None

# ---------------------------------------------------------------------------
# 5. Clip values to [-3, 3] after normalization
# ---------------------------------------------------------------------------

# TODO: clip data_norm to range [-3, 3] using np.clip
data_clipped = None  # replace None

# ---------------------------------------------------------------------------
# 6. Rolling mean of column 0 (window = 20)
# ---------------------------------------------------------------------------

col0_clean = data_filled[:, 0]

# TODO: compute rolling mean with window=20.
#       For index i, use data_filled[max(0,i-19):i+1, 0].mean()
#       Result shape: (400,)
rolling_mean_col0 = None  # replace None

# ---------------------------------------------------------------------------
# 7. Downsample by averaging every 10 rows
# ---------------------------------------------------------------------------

# TODO: reshape data_filled into blocks of 10 and take mean of each block
#       Result shape: (40, 3)
n_blocks = len(data_filled) // 10
data_downsampled = None  # replace None

# ---------------------------------------------------------------------------
# 8. Chunked column-wise sum (chunk_size = 50)
# ---------------------------------------------------------------------------

# TODO: sum each column of data_filled in chunks of 50 rows,
#       then add all chunk sums to get the total column sum.
#       Result shape: (3,)
chunk_size = 50
total_sum = None  # replace None

# ---------------------------------------------------------------------------
# 9. Detect outliers using IQR (for column 1 of data_filled)
# ---------------------------------------------------------------------------

col1 = data_filled[:, 1]

# TODO: compute Q1 (25th percentile) and Q3 (75th percentile) of col1
q1 = None  # replace None
q3 = None  # replace None

# TODO: compute IQR = Q3 - Q1
iqr = None  # replace None

# TODO: boolean mask: True where col1 < Q1 - 1.5*IQR  or  col1 > Q3 + 1.5*IQR
outlier_mask = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert nan_counts is not None, "nan_counts must be defined"
    assert nan_counts.shape == (3,), "nan_counts should have shape (3,)"
    assert nan_counts.dtype in [np.int32, np.int64, int, np.intp], "nan_counts should be integer"
    assert np.array_equal(nan_counts, np.isnan(raw).sum(axis=0)), "count NaN per column"

    assert col0_ffill is not None, "col0_ffill must be defined"
    assert len(col0_ffill) == n, "col0_ffill length mismatch"
    # After ffill starting from a valid first value, NaN count should drop
    first_valid = col0[~np.isnan(col0)]
    if len(first_valid) > 0:
        assert np.isnan(col0_ffill).sum() <= np.isnan(col0).sum(), \
            "forward fill should reduce or keep same NaN count"

    assert col_means is not None, "col_means must be defined"
    assert col_means.shape == (3,), "col_means should have shape (3,)"
    assert np.allclose(col_means, np.nanmean(raw, axis=0)), "use np.nanmean"

    assert np.isnan(data_filled).sum() == 0, "data_filled should have no NaNs"

    assert d_mean is not None and d_std is not None, "d_mean and d_std must be defined"
    assert data_norm is not None, "data_norm must be defined"
    assert data_norm.shape == data_filled.shape, "data_norm shape mismatch"
    assert np.allclose(data_norm.mean(axis=0), 0, atol=1e-10), "z-score mean should be 0"
    assert np.allclose(data_norm.std(axis=0), 1, atol=1e-10), "z-score std should be 1"

    assert data_clipped is not None, "data_clipped must be defined"
    assert data_clipped.min() >= -3 - 1e-10, "clipped min should be >= -3"
    assert data_clipped.max() <= 3 + 1e-10, "clipped max should be <= 3"

    assert rolling_mean_col0 is not None, "rolling_mean_col0 must be defined"
    assert len(rolling_mean_col0) == n, "rolling_mean_col0 should have length n"
    # Check first and last values
    assert np.isclose(rolling_mean_col0[0], col0_clean[0]), "rolling mean at i=0 is just the value"
    assert np.isclose(rolling_mean_col0[19], col0_clean[:20].mean()), "rolling mean at i=19"

    assert data_downsampled is not None, "data_downsampled must be defined"
    assert data_downsampled.shape == (40, 3), f"downsampled shape should be (40,3), got {data_downsampled.shape}"
    assert np.allclose(data_downsampled[0], data_filled[:10].mean(axis=0)), "first block mean check"

    assert total_sum is not None, "total_sum must be defined"
    assert total_sum.shape == (3,), "total_sum should have shape (3,)"
    assert np.allclose(total_sum, data_filled.sum(axis=0)), \
        "chunked sum should equal direct column sum"

    assert q1 is not None and q3 is not None and iqr is not None
    assert np.isclose(q1, np.percentile(col1, 25)), "q1 should be 25th percentile"
    assert np.isclose(q3, np.percentile(col1, 75)), "q3 should be 75th percentile"
    assert np.isclose(iqr, q3 - q1), "IQR = Q3 - Q1"

    assert outlier_mask is not None, "outlier_mask must be defined"
    assert outlier_mask.dtype == bool, "outlier_mask should be boolean"
    assert len(outlier_mask) == n, "outlier_mask length should be n"
    expected_mask = (col1 < q1 - 1.5*iqr) | (col1 > q3 + 1.5*iqr)
    assert np.array_equal(outlier_mask, expected_mask), "IQR outlier mask mismatch"

    print("Exercise 5.4 — All assertions passed!")

if __name__ == "__main__":
    main()
