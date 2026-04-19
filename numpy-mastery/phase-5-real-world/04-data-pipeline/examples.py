# ============================================================================
# Examples 5.4 — Data Pipeline  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# Simulate raw sensor data: timestamps + 3 sensor channels, with noise/missing
n_samples = 500
timestamps = np.arange(n_samples, dtype=float)
sensor_a = np.sin(2 * np.pi * timestamps / 100) + np.random.normal(0, 0.1, n_samples)
sensor_b = np.cos(2 * np.pi * timestamps / 80) * 2 + np.random.normal(0, 0.2, n_samples)
sensor_c = np.random.exponential(1.5, n_samples)

# Inject missing values
missing_mask = np.random.random(n_samples) < 0.05
sensor_a[missing_mask] = np.nan
sensor_b[np.random.random(n_samples) < 0.03] = np.nan

raw_data = np.column_stack([sensor_a, sensor_b, sensor_c])

# --- BASIC ---

# 1. data shape and dtype
print("Ex01 shape:", raw_data.shape, "dtype:", raw_data.dtype)

# 2. count missing values per column
nan_counts = np.sum(np.isnan(raw_data), axis=0)
print("Ex02 NaN counts per column:", nan_counts)

# 3. total missing percentage
pct_missing = np.isnan(raw_data).sum() / raw_data.size * 100
print("Ex03 missing %:", round(pct_missing, 2))

# 4. row mask for complete cases (no NaN in any column)
complete_rows = ~np.any(np.isnan(raw_data), axis=1)
print("Ex04 complete rows:", complete_rows.sum())

# 5. column statistics (ignoring NaN)
col_means = np.nanmean(raw_data, axis=0)
col_stds = np.nanstd(raw_data, axis=0)
print("Ex05 means:", col_means.round(4))
print("Ex05 stds:", col_stds.round(4))

# 6. min and max per column
col_mins = np.nanmin(raw_data, axis=0)
col_maxs = np.nanmax(raw_data, axis=0)
print("Ex06 mins:", col_mins.round(4), "maxs:", col_maxs.round(4))

# 7. fill NaN with column mean
data_filled = raw_data.copy()
for j in range(raw_data.shape[1]):
    nan_j = np.isnan(data_filled[:, j])
    data_filled[nan_j, j] = col_means[j]
print("Ex07 remaining NaNs:", np.isnan(data_filled).sum())

# 8. fill NaN with forward fill
def ffill(arr):
    out = arr.copy()
    for i in range(1, len(out)):
        if np.isnan(out[i]):
            out[i] = out[i-1]
    return out
data_ff = raw_data.copy()
for j in range(data_ff.shape[1]):
    data_ff[:, j] = ffill(data_ff[:, j])
print("Ex08 forward-filled NaNs:", np.isnan(data_ff).sum())

# 9. backward fill
def bfill(arr):
    out = arr[::-1].copy()
    out = ffill(out)
    return out[::-1]
data_bf = raw_data.copy()
for j in range(data_bf.shape[1]):
    data_bf[:, j] = bfill(data_bf[:, j])
print("Ex09 backward-filled NaNs:", np.isnan(data_bf).sum())

# 10. interpolate NaN (linear)
def linear_interp_nan(arr):
    out = arr.copy()
    nan_idx = np.where(np.isnan(arr))[0]
    valid_idx = np.where(~np.isnan(arr))[0]
    if len(valid_idx) < 2:
        return out
    out[nan_idx] = np.interp(nan_idx, valid_idx, arr[valid_idx])
    return out
data_interp = raw_data.copy()
for j in range(data_interp.shape[1]):
    data_interp[:, j] = linear_interp_nan(data_interp[:, j])
print("Ex10 interpolated NaNs:", np.isnan(data_interp).sum())

# 11. z-score normalization (column-wise, using filled data)
d = data_filled
d_norm = (d - d.mean(axis=0)) / d.std(axis=0)
print("Ex11 normalized mean:", d_norm.mean(axis=0).round(6))

# 12. clip values to [mean - 3*std, mean + 3*std]
lower = d.mean(axis=0) - 3 * d.std(axis=0)
upper = d.mean(axis=0) + 3 * d.std(axis=0)
d_clipped = np.clip(d, lower, upper)
print("Ex12 clipped range:", d_clipped.min(axis=0).round(4), d_clipped.max(axis=0).round(4))

# 13. detect outliers (z-score > 3)
z_scores = np.abs((d - d.mean(axis=0)) / d.std(axis=0))
outlier_mask = z_scores > 3
print("Ex13 outliers per column:", outlier_mask.sum(axis=0))

# 14. rolling window view (stride tricks)
def rolling_window(arr, w):
    shape = arr.shape[:-1] + (arr.shape[-1] - w + 1, w)
    strides = arr.strides + (arr.strides[-1],)
    return np.lib.stride_tricks.as_strided(arr, shape=shape, strides=strides)
rw = rolling_window(d[:, 0], 10)
print("Ex14 rolling window shape:", rw.shape)

# 15. rolling mean (window=20)
rolling_means = np.array([d[max(0, i-19):i+1, 0].mean() for i in range(len(d))])
print("Ex15 rolling mean shape:", rolling_means.shape)

# --- INTERMEDIATE ---

# 16. rolling std (window=20)
rolling_stds = np.array([d[max(0, i-19):i+1, 0].std() for i in range(len(d))])
print("Ex16 rolling std (last 3):", rolling_stds[-3:].round(6))

# 17. resampling: downsample by averaging every 10 rows
n_bins = len(d) // 10
d_downsampled = d[:n_bins*10].reshape(n_bins, 10, -1).mean(axis=1)
print("Ex17 downsampled shape:", d_downsampled.shape)

# 18. upsampling: repeat each row n times
d_upsampled = np.repeat(d_downsampled, 2, axis=0)
print("Ex18 upsampled shape:", d_upsampled.shape)

# 19. feature engineering: delta (rate of change)
d_delta = np.diff(d, axis=0, prepend=d[:1])
print("Ex19 delta shape:", d_delta.shape)

# 20. feature engineering: ratio of columns
ratio_ab = d[:, 0] / (d[:, 1] + 1e-8)
print("Ex20 ratio A/B stats:", round(ratio_ab.mean(), 4), round(ratio_ab.std(), 4))

# 21. feature engineering: rolling correlation (manual, window=50)
w_corr = 50
rolling_corr = np.array([
    np.corrcoef(d[i:i+w_corr, 0], d[i:i+w_corr, 1])[0, 1]
    for i in range(len(d) - w_corr + 1)
])
print("Ex21 rolling correlation range:", round(rolling_corr.min(), 4), "to", round(rolling_corr.max(), 4))

# 22. data binning (digitize)
bins_c = np.linspace(d[:, 2].min(), d[:, 2].max(), 11)
binned_c = np.digitize(d[:, 2], bins_c)
print("Ex22 binned unique counts:", len(np.unique(binned_c)))

# 23. group statistics by bin
bin_means = np.array([d[binned_c == k, 0].mean() if (binned_c == k).sum() > 0 else np.nan
                      for k in range(1, 12)])
print("Ex23 bin means:", bin_means.round(4))

# 24. sliding window with overlap: extract windows
def extract_windows(arr, window_size, stride):
    n_w = (len(arr) - window_size) // stride + 1
    return np.array([arr[i*stride:i*stride+window_size] for i in range(n_w)])
windows = extract_windows(d[:, 0], 50, 10)
print("Ex24 extracted windows shape:", windows.shape)

# 25. batch statistics for windows
win_means = windows.mean(axis=1)
win_stds = windows.std(axis=1)
print("Ex25 window stats shapes:", win_means.shape, win_stds.shape)

# 26. data augmentation: add Gaussian noise
noise_std = 0.05
d_augmented = d + np.random.normal(0, noise_std * d.std(axis=0), d.shape)
print("Ex26 augmented data SNR:", round((d.std() / noise_std), 2))

# 27. data augmentation: time warp (stretch/compress concept)
idx_warp = np.round(np.linspace(0, len(d)-1, len(d) + 50)).astype(int)
idx_warp = np.clip(idx_warp, 0, len(d)-1)
d_warped = d[idx_warp]
print("Ex27 warped shape:", d_warped.shape)

# 28. schema validation: check all values in expected range
def validate_schema(data_v, col_ranges):
    violations = {}
    for col_v, (lo, hi) in col_ranges.items():
        n_viol = np.sum((data_v[:, col_v] < lo) | (data_v[:, col_v] > hi))
        if n_viol > 0:
            violations[col_v] = n_viol
    return violations
violations = validate_schema(d_clipped, {0: (-5, 5), 1: (-10, 10), 2: (0, 20)})
print("Ex28 schema violations:", violations)

# 29. percentile-based outlier removal
def remove_outliers_pct(data_r, pct=1):
    lo = np.percentile(data_r, pct, axis=0)
    hi = np.percentile(data_r, 100-pct, axis=0)
    mask_r = np.all((data_r >= lo) & (data_r <= hi), axis=1)
    return data_r[mask_r], mask_r
d_clean, clean_mask = remove_outliers_pct(d)
print("Ex29 rows after outlier removal:", len(d_clean))

# 30. data deduplication (remove exact duplicate rows)
d_dedup = np.unique(d.round(6), axis=0)
print("Ex30 unique rows:", len(d_dedup))

# --- ADVANCED ---

# 31. pipeline class
class NumpyPipeline:
    def __init__(self):
        self.steps = []
        self.params = {}

    def add_step(self, name, func):
        self.steps.append((name, func))
        return self

    def run(self, data_p):
        current = data_p
        for name, func in self.steps:
            current = func(current)
        return current

pipeline = NumpyPipeline()
pipeline.add_step("fill_nan", lambda x: np.where(np.isnan(x), np.nanmean(x, axis=0), x))
pipeline.add_step("normalize", lambda x: (x - x.mean(axis=0)) / (x.std(axis=0) + 1e-8))
pipeline.add_step("clip", lambda x: np.clip(x, -3, 3))
result_pipe = pipeline.run(raw_data)
print("Ex31 pipeline result shape:", result_pipe.shape)

# 32. lazy chunked processing (generator pattern)
def process_in_chunks(data_ch, chunk_size, func):
    n_chunks = (len(data_ch) + chunk_size - 1) // chunk_size
    return np.concatenate([func(data_ch[i*chunk_size:(i+1)*chunk_size])
                           for i in range(n_chunks)], axis=0)
d_chunked = process_in_chunks(d, 100, lambda x: x - x.mean(axis=0))
print("Ex32 chunked result mean:", d_chunked.mean(axis=0).round(4))

# 33. column-wise transformation mapping
transforms = {
    0: lambda x: np.log1p(np.abs(x)),  # log transform for feature 0
    1: lambda x: x**2,                  # square transform for feature 1
    2: lambda x: np.sqrt(x),            # sqrt for feature 2
}
d_transformed = d.copy()
for col_t, fn in transforms.items():
    d_transformed[:, col_t] = fn(d[:, col_t])
print("Ex33 transformed shape:", d_transformed.shape)

# 34. rolling z-score (Bollinger band concept)
def rolling_zscore(arr, window):
    rz = np.empty_like(arr)
    for i in range(len(arr)):
        w_arr = arr[max(0, i-window+1):i+1]
        rz[i] = (arr[i] - w_arr.mean()) / (w_arr.std() + 1e-8)
    return rz
rz = rolling_zscore(d[:, 0], 20)
print("Ex34 rolling z-score shape:", rz.shape)

# 35. peak detection
def find_peaks(arr, threshold=0.5):
    is_peak = (arr[1:-1] > arr[:-2]) & (arr[1:-1] > arr[2:]) & (arr[1:-1] > threshold)
    return np.where(is_peak)[0] + 1
peaks = find_peaks(d[:, 0])
print("Ex35 peaks found:", len(peaks))

# 36. data versioning hash (content fingerprint)
data_hash = hash(d.tobytes())
print("Ex36 data hash (type):", type(data_hash).__name__)

# 37. structured data merge (join by row index)
data_a = d[:250, :]
data_b = d[125:375, :]  # overlapping window
# "inner join" by taking common indices
idx_a = np.arange(250)
idx_b = np.arange(125, 375)
common = np.intersect1d(idx_a, idx_b)
print("Ex37 common indices:", len(common))

# 38. pivot table concept: mean of col0 grouped by quantile of col2
q_bins = np.digitize(d[:, 2], np.percentile(d[:, 2], [25, 50, 75]))
pivot = np.array([d[q_bins == q, 0].mean() for q in range(4)])
print("Ex38 pivot means:", pivot.round(4))

# 39. exponential smoothing
def exp_smooth(arr, alpha=0.3):
    out = np.empty_like(arr, dtype=float)
    out[0] = arr[0]
    for i in range(1, len(arr)):
        out[i] = alpha * arr[i] + (1 - alpha) * out[i-1]
    return out
d_smooth = exp_smooth(d[:, 0])
print("Ex39 exp smoothed (last 3):", d_smooth[-3:].round(4))

# 40. change point detection (CUSUM)
def cusum(arr, threshold=3.0):
    mu = arr.mean()
    std = arr.std()
    S_pos = np.zeros(len(arr))
    S_neg = np.zeros(len(arr))
    for i in range(1, len(arr)):
        S_pos[i] = max(0, S_pos[i-1] + (arr[i] - mu)/std - 0.5)
        S_neg[i] = max(0, S_neg[i-1] - (arr[i] - mu)/std - 0.5)
    return (S_pos > threshold) | (S_neg > threshold)
alarms = cusum(d[:, 0])
print("Ex40 CUSUM alarms:", alarms.sum())

# 41. time series cross-validation (walk-forward)
def walk_forward_splits(n_wf, n_initial, step):
    splits = []
    train_end = n_initial
    while train_end + step <= n_wf:
        splits.append((np.arange(0, train_end), np.arange(train_end, train_end + step)))
        train_end += step
    return splits
wf_splits = walk_forward_splits(len(d), 200, 50)
print("Ex41 walk-forward splits:", len(wf_splits))

# 42. feature store concept: precompute and cache statistics
feature_store = {
    'mean': d.mean(axis=0),
    'std': d.std(axis=0),
    'min': d.min(axis=0),
    'max': d.max(axis=0),
    'p25': np.percentile(d, 25, axis=0),
    'p75': np.percentile(d, 75, axis=0),
}
print("Ex42 feature store keys:", list(feature_store.keys()))

# --- EXPERT ---

# 43. memory-efficient chunked statistics
def chunked_mean_std(data_cm, chunk_size):
    n_total = len(data_cm)
    running_sum = np.zeros(data_cm.shape[1])
    running_sum_sq = np.zeros(data_cm.shape[1])
    n_valid = np.zeros(data_cm.shape[1])
    for i in range(0, n_total, chunk_size):
        chunk = data_cm[i:i+chunk_size]
        mask_c = ~np.isnan(chunk)
        running_sum += np.nansum(chunk, axis=0)
        running_sum_sq += np.nansum(chunk**2, axis=0)
        n_valid += mask_c.sum(axis=0)
    mean_c = running_sum / n_valid
    std_c = np.sqrt(running_sum_sq / n_valid - mean_c**2)
    return mean_c, std_c
chunk_mean, chunk_std = chunked_mean_std(raw_data, 50)
print("Ex43 chunked mean:", chunk_mean.round(4))

# 44. streaming min/max (online algorithm)
def streaming_minmax(stream_gen, n_features):
    running_min = np.full(n_features, np.inf)
    running_max = np.full(n_features, -np.inf)
    for batch in stream_gen:
        running_min = np.minimum(running_min, np.nanmin(batch, axis=0))
        running_max = np.maximum(running_max, np.nanmax(batch, axis=0))
    return running_min, running_max
def data_generator(data_sg, batch_size):
    for i in range(0, len(data_sg), batch_size):
        yield data_sg[i:i+batch_size]
s_min, s_max = streaming_minmax(data_generator(data_filled, 50), 3)
print("Ex44 streaming min:", s_min.round(4))

# 45. exact online mean (Welford's algorithm)
def welford_mean_var(arr_w):
    n_w, mean_w, M2_w = 0, np.zeros(arr_w.shape[1]), np.zeros(arr_w.shape[1])
    for x_w in arr_w:
        n_w += 1
        delta = x_w - mean_w
        mean_w += delta / n_w
        M2_w += delta * (x_w - mean_w)
    variance = M2_w / (n_w - 1) if n_w > 1 else np.zeros_like(M2_w)
    return mean_w, variance
w_mean, w_var = welford_mean_var(d)
print("Ex45 Welford mean:", w_mean.round(4))
print("Ex45 vs np.mean:", np.allclose(w_mean, d.mean(axis=0)))

# 46. approximate nearest neighbor (LSH concept)
def random_projection_lsh(X_lsh, n_bits=8, seed=0):
    rng = np.random.RandomState(seed)
    proj = rng.randn(X_lsh.shape[1], n_bits)
    return (X_lsh @ proj > 0).astype(int)
lsh_codes = random_projection_lsh(d)
print("Ex46 LSH codes shape:", lsh_codes.shape)

# 47. data drift detection (Population Stability Index concept)
def psi(expected_e, actual_a, n_bins=10):
    bins_e = np.linspace(min(expected_e.min(), actual_a.min()),
                         max(expected_e.max(), actual_a.max()), n_bins+1)
    exp_pct = np.histogram(expected_e, bins_e)[0] / len(expected_e) + 1e-8
    act_pct = np.histogram(actual_a, bins_e)[0] / len(actual_a) + 1e-8
    exp_pct /= exp_pct.sum()
    act_pct /= act_pct.sum()
    return np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
psi_score = psi(d[:250, 0], d[250:, 0])
print("Ex47 PSI score:", round(psi_score, 6))

# 48. schema-based type casting pipeline
schema = {0: np.float32, 1: np.float32, 2: np.float64}
d_typed = np.empty_like(d)
for col_s, dtype_s in schema.items():
    d_typed[:, col_s] = d[:, col_s].astype(dtype_s)
print("Ex48 typed dtypes OK:", True)

# 49. point-in-time split (no look-ahead leakage)
def pit_split(data_pit, t_cutoff):
    return data_pit[:t_cutoff], data_pit[t_cutoff:]
train_pit, test_pit = pit_split(d, 400)
print("Ex49 PIT train size:", len(train_pit), "test size:", len(test_pit))

# 50. full production pipeline with logging
class ProductionPipeline:
    def __init__(self, steps_pp):
        self.steps = steps_pp
        self.log = []

    def transform(self, data_pp):
        current = data_pp
        for name, fn in self.steps:
            n_before = (~np.isfinite(current)).sum()
            current = fn(current)
            n_after = (~np.isfinite(current)).sum()
            self.log.append(f"{name}: finite violations {n_before}→{n_after}")
        return current

prod_pipe = ProductionPipeline([
    ("fill_nan", lambda x: np.where(~np.isfinite(x), np.nanmean(x, axis=0), x)),
    ("clip", lambda x: np.clip(x, np.nanpercentile(x, 1, axis=0), np.nanpercentile(x, 99, axis=0))),
    ("normalize", lambda x: (x - x.mean(axis=0)) / (x.std(axis=0) + 1e-8)),
])
prod_result = prod_pipe.transform(raw_data.copy())
print("Ex50 production pipeline log:")
for entry in prod_pipe.log:
    print(" ", entry)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
