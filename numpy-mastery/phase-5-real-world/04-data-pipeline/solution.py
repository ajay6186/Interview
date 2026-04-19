# ============================================================================
# Solution 5.4 — Data Pipeline
# ============================================================================

import numpy as np

np.random.seed(3)

n = 400
raw = np.column_stack([
    np.sin(np.linspace(0, 4*np.pi, n)) + np.random.normal(0, 0.1, n),
    np.random.normal(50, 10, n),
    np.random.exponential(3, n),
])
rng_nan = np.random.RandomState(11)
raw[rng_nan.random((n, 3)) < 0.04] = np.nan

# 1. Count NaNs per column
nan_counts = np.isnan(raw).sum(axis=0)

# 2. Forward-fill column 0
col0 = raw[:, 0].copy()
col0_ffill = col0.copy()
for i in range(1, len(col0_ffill)):
    if np.isnan(col0_ffill[i]):
        col0_ffill[i] = col0_ffill[i-1]

# 3. Mean imputation for all columns
col_means = np.nanmean(raw, axis=0)
data_filled = raw.copy()
for j in range(raw.shape[1]):
    nan_j = np.isnan(data_filled[:, j])
    data_filled[nan_j, j] = col_means[j]

# 4. Z-score normalization
d_mean = data_filled.mean(axis=0)
d_std  = data_filled.std(axis=0)
data_norm = (data_filled - d_mean) / d_std

# 5. Clip to [-3, 3]
data_clipped = np.clip(data_norm, -3, 3)

# 6. Rolling mean of column 0 (window = 20)
col0_clean = data_filled[:, 0]
rolling_mean_col0 = np.array([
    data_filled[max(0, i-19):i+1, 0].mean() for i in range(n)
])

# 7. Downsample by averaging every 10 rows
n_blocks = len(data_filled) // 10
data_downsampled = data_filled[:n_blocks*10].reshape(n_blocks, 10, 3).mean(axis=1)

# 8. Chunked column-wise sum
chunk_size = 50
total_sum = np.zeros(3)
for i in range(0, len(data_filled), chunk_size):
    total_sum += data_filled[i:i+chunk_size].sum(axis=0)

# 9. IQR outlier detection on column 1
col1 = data_filled[:, 1]
q1 = np.percentile(col1, 25)
q3 = np.percentile(col1, 75)
iqr = q3 - q1
outlier_mask = (col1 < q1 - 1.5*iqr) | (col1 > q3 + 1.5*iqr)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert nan_counts is not None
    assert nan_counts.shape == (3,)
    assert np.array_equal(nan_counts, np.isnan(raw).sum(axis=0))

    assert col0_ffill is not None
    assert len(col0_ffill) == n
    first_valid = col0[~np.isnan(col0)]
    if len(first_valid) > 0:
        assert np.isnan(col0_ffill).sum() <= np.isnan(col0).sum()

    assert col_means is not None
    assert col_means.shape == (3,)
    assert np.allclose(col_means, np.nanmean(raw, axis=0))

    assert np.isnan(data_filled).sum() == 0

    assert d_mean is not None and d_std is not None
    assert data_norm is not None
    assert data_norm.shape == data_filled.shape
    assert np.allclose(data_norm.mean(axis=0), 0, atol=1e-10)
    assert np.allclose(data_norm.std(axis=0), 1, atol=1e-10)

    assert data_clipped is not None
    assert data_clipped.min() >= -3 - 1e-10
    assert data_clipped.max() <= 3 + 1e-10

    assert rolling_mean_col0 is not None
    assert len(rolling_mean_col0) == n
    assert np.isclose(rolling_mean_col0[0], col0_clean[0])
    assert np.isclose(rolling_mean_col0[19], col0_clean[:20].mean())

    assert data_downsampled is not None
    assert data_downsampled.shape == (40, 3)
    assert np.allclose(data_downsampled[0], data_filled[:10].mean(axis=0))

    assert total_sum is not None
    assert total_sum.shape == (3,)
    assert np.allclose(total_sum, data_filled.sum(axis=0))

    assert q1 is not None and q3 is not None and iqr is not None
    assert np.isclose(q1, np.percentile(col1, 25))
    assert np.isclose(q3, np.percentile(col1, 75))
    assert np.isclose(iqr, q3 - q1)

    assert outlier_mask is not None
    assert outlier_mask.dtype == bool
    assert len(outlier_mask) == n
    expected_mask = (col1 < q1 - 1.5*iqr) | (col1 > q3 + 1.5*iqr)
    assert np.array_equal(outlier_mask, expected_mask)

    print("Solution 5.4 — All assertions passed!")

if __name__ == "__main__":
    main()
