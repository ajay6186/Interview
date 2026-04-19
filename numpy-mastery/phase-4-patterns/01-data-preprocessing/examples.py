# ============================================================================
# Examples 4.1 — Data Preprocessing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. min-max normalization
x = np.array([2., 4., 6., 8., 10.])
normed = (x - x.min()) / (x.max() - x.min())
print("Ex01 min-max:", normed)

# 2. z-score standardization
z = (x - x.mean()) / x.std()
print("Ex02 z-score:", z.round(4))

# 3. np.clip to bound values
print("Ex03 clip [3,7]:", np.clip(x, 3., 7.))

# 4. check for NaN
arr_nan = np.array([1., 2., np.nan, 4., 5.])
print("Ex04 isnan:", np.isnan(arr_nan))

# 5. count NaN
print("Ex05 nan count:", np.sum(np.isnan(arr_nan)))

# 6. np.nanmean (ignore NaN)
print("Ex06 nanmean:", np.nanmean(arr_nan))

# 7. fill NaN with mean
filled = arr_nan.copy()
filled[np.isnan(filled)] = np.nanmean(arr_nan)
print("Ex07 nan filled:", filled)

# 8. fill NaN with 0
filled0 = np.nan_to_num(arr_nan, nan=0.)
print("Ex08 nan→0:", filled0)

# 9. np.percentile for IQR-based clipping
data = np.concatenate([np.arange(1., 11.), np.array([100., -100.])])
low, high = np.percentile(data, [5., 95.])
print("Ex09 5th pct:", low, "95th:", high)
print("Ex09 clipped:", np.clip(data, low, high))

# 10. np.isfinite — masks both inf and nan
arr_inf = np.array([1., np.inf, -np.inf, np.nan, 5.])
print("Ex10 isfinite:", np.isfinite(arr_inf))

# 11. replace inf and nan with 0
clean = np.where(np.isfinite(arr_inf), arr_inf, 0.)
print("Ex11 cleaned:", clean)

# 12. np.nan_to_num for all special values
print("Ex12:", np.nan_to_num(arr_inf, nan=0., posinf=999., neginf=-999.))

# 13. column-wise normalization of 2D array
X = np.array([[1., 10.], [2., 20.], [3., 30.]])
X_norm = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0))
print("Ex13 col normalized:\n", X_norm)

# 14. row-wise z-score
X_z = (X - X.mean(axis=1, keepdims=True)) / X.std(axis=1, keepdims=True)
print("Ex14 row z-score:\n", X_z.round(4))

# 15. binary threshold
binary = (x >= 6.).astype(int)
print("Ex15 binary:", binary)

# --- INTERMEDIATE ---

# 16. robust scaling: (x - median) / IQR
from_data = np.random.RandomState(0).normal(5, 2, 100)
med = np.median(from_data)
iqr_v = np.percentile(from_data, 75) - np.percentile(from_data, 25)
robust_scaled = (from_data - med) / iqr_v
print("Ex16 robust scaled median:", np.median(robust_scaled).round(4))

# 17. log transform for skewed data
skewed = np.array([1., 10., 100., 1000., 10000.])
print("Ex17 log1p:", np.log1p(skewed))

# 18. sqrt transform
print("Ex18 sqrt:", np.sqrt(skewed))

# 19. power transform (Box-Cox concept for lambda=0.5)
lam = 0.5
print("Ex19 box-cox:", (skewed ** lam - 1) / lam)

# 20. one-hot encoding
labels = np.array([0, 2, 1, 0, 3])
n_classes = 4
one_hot = (labels[:, None] == np.arange(n_classes)).astype(int)
print("Ex20 one-hot:\n", one_hot)

# 21. ordinal encoding with lookup
categories = np.array(['cat', 'dog', 'bird', 'cat', 'bird'])
unique_cats = np.unique(categories)
mapping = {c: i for i, c in enumerate(unique_cats)}
ordinal = np.array([mapping[c] for c in categories])
print("Ex21 ordinal:", ordinal)

# 22. impute NaN with median
arr_m = np.array([1., np.nan, 3., np.nan, 5.])
med_m = np.nanmedian(arr_m)
filled_m = np.where(np.isnan(arr_m), med_m, arr_m)
print("Ex22 median impute:", filled_m)

# 23. forward fill NaN (last valid value)
arr_ff = np.array([1., np.nan, np.nan, 4., np.nan])
result_ff = arr_ff.copy()
mask_ff = np.isnan(result_ff)
idx_ff = np.where(~mask_ff, np.arange(len(result_ff)), 0)
np.maximum.accumulate(idx_ff, out=idx_ff)
result_ff[mask_ff] = result_ff[idx_ff[mask_ff]]
print("Ex23 forward fill:", result_ff)

# 24. mean normalization (center around 0, range -0.5 to 0.5)
mean_norm = (x - x.mean()) / (x.max() - x.min())
print("Ex24 mean norm:", mean_norm)

# 25. batch normalization concept
batch = np.array([[1., 2., 3.], [4., 5., 6.]])
batch_mean = batch.mean(axis=0)
batch_std = batch.std(axis=0)
batch_normed = (batch - batch_mean) / (batch_std + 1e-8)
print("Ex25 batch norm:\n", batch_normed.round(4))

# 26. sigmoid transform to compress to (0, 1)
def sigmoid(x_s):
    return 1. / (1. + np.exp(-x_s))
print("Ex26 sigmoid:", sigmoid(np.array([-2., 0., 2.])))

# 27. tanh normalization to (-1, 1)
print("Ex27 tanh:", np.tanh(np.array([-2., 0., 2.])))

# 28. decimal scaling normalization
vals = np.array([100., 500., 1000., 250.])
j = np.ceil(np.log10(np.abs(vals).max()))
dec_scaled = vals / 10**j
print("Ex28 decimal scaling:", dec_scaled)

# 29. feature hashing concept with mod
categories2 = np.array([101, 205, 303, 101, 205])
hashed = categories2 % 10
print("Ex29 feature hash:", hashed)

# 30. removing constant features
X2 = np.array([[1., 5., 3.], [1., 6., 4.], [1., 7., 5.]])
var = X2.var(axis=0)
non_const_mask = var > 0
print("Ex30 non-constant features:", X2[:, non_const_mask])

# --- ADVANCED ---

# 31. Winsorization (cap at percentile, different from clipping)
def winsorize(arr3, lower_pct, upper_pct):
    lo = np.percentile(arr3, lower_pct)
    hi = np.percentile(arr3, upper_pct)
    return np.clip(arr3, lo, hi)
np.random.seed(42)
data2 = np.concatenate([np.random.normal(0, 1, 95), [10., -10., 20., -20., 15.]])
print("Ex31 winsorized max:", winsorize(data2, 2.5, 97.5).max().round(2))

# 32. standardize with sklearn-like API (manual)
class StandardScaler:
    def fit(self, X3):
        self.mean_ = X3.mean(axis=0)
        self.std_ = X3.std(axis=0)
    def transform(self, X3):
        return (X3 - self.mean_) / (self.std_ + 1e-8)
scaler = StandardScaler()
X3 = np.random.rand(10, 3)
scaler.fit(X3)
X3_scaled = scaler.transform(X3)
print("Ex32 mean after scale:", X3_scaled.mean(axis=0).round(6))

# 33. MinMaxScaler
class MinMaxScaler:
    def fit(self, X4):
        self.min_ = X4.min(axis=0)
        self.max_ = X4.max(axis=0)
    def transform(self, X4):
        return (X4 - self.min_) / (self.max_ - self.min_ + 1e-8)
mmscaler = MinMaxScaler()
X4 = np.random.rand(10, 3)
mmscaler.fit(X4)
X4_scaled = mmscaler.transform(X4)
print("Ex33 min after scale:", X4_scaled.min(axis=0).round(4))

# 34. polynomial features (degree 2 for 1 feature)
x_1d = np.array([1., 2., 3., 4., 5.])
poly_feats = np.column_stack([np.ones_like(x_1d), x_1d, x_1d**2])
print("Ex34 poly features:\n", poly_feats)

# 35. interaction features
x_a = np.array([1., 2., 3.])
x_b = np.array([4., 5., 6.])
X5 = np.column_stack([x_a, x_b, x_a * x_b])
print("Ex35 interaction features:\n", X5)

# 36. missing value indicator feature
arr_miss = np.array([1., np.nan, 3., np.nan, 5.])
missing_indicator = np.isnan(arr_miss).astype(float)
print("Ex36 missing indicator:", missing_indicator)

# 37. temporal difference features (lag)
time_series = np.array([10., 12., 11., 14., 13., 16.])
lag1 = np.diff(time_series)
print("Ex37 lag-1 diff:", lag1)

# 38. rolling z-score (detects anomalies)
def rolling_zscore(arr6, window):
    from numpy.lib.stride_tricks import sliding_window_view
    windows = sliding_window_view(arr6, window)
    means = windows.mean(axis=-1)
    stds = windows.std(axis=-1)
    centers = arr6[window-1:]
    return (centers - means) / (stds + 1e-8)
try:
    rzs = rolling_zscore(time_series, 3)
    print("Ex38 rolling z-score:", rzs.round(3))
except ImportError:
    print("Ex38 requires NumPy >= 1.20")

# 39. quantile binning (equal-frequency bins)
data3 = np.random.rand(20)
n_bins = 4
quantiles = np.linspace(0, 100, n_bins + 1)
bin_edges = np.percentile(data3, quantiles)
bins = np.digitize(data3, bin_edges[1:-1])
print("Ex39 bin counts:", np.bincount(bins, minlength=n_bins))

# 40. equal-width binning
bin_edges_w = np.linspace(data3.min(), data3.max(), n_bins + 1)
bins_w = np.digitize(data3, bin_edges_w[1:-1])
print("Ex40 equal-width bins:", np.bincount(bins_w, minlength=n_bins))

# 41. PCA whitening step (manual)
X6 = np.random.randn(100, 4)
X6_c = X6 - X6.mean(axis=0)
cov6 = X6_c.T @ X6_c / len(X6)
vals6, vecs6 = np.linalg.eigh(cov6)
# whiten: project and scale by 1/sqrt(eigenvalue)
X6_white = X6_c @ vecs6 / np.sqrt(vals6 + 1e-8)
print("Ex41 whitened cov diag ~1:", np.diag(np.cov(X6_white.T)).round(2))

# 42. Mahalanobis distance from mean
X7 = np.random.randn(20, 3)
mu7 = X7.mean(axis=0)
S7 = np.cov(X7.T)
S7_inv = np.linalg.inv(S7)
diff7 = X7 - mu7
maha = np.sqrt(np.einsum('ni,ij,nj->n', diff7, S7_inv, diff7))
print("Ex42 Mahalanobis distances shape:", maha.shape)

# --- EXPERT ---

# 43. streaming mean and variance (Welford's algorithm)
def welford_update(count, mean, M2, new_val):
    count += 1
    delta = new_val - mean
    mean += delta / count
    delta2 = new_val - mean
    M2 += delta * delta2
    return count, mean, M2
count, mean, M2 = 0, 0., 0.
for v in [2., 4., 4., 4., 5., 5., 7., 9.]:
    count, mean, M2 = welford_update(count, mean, M2, v)
print("Ex43 Welford mean:", mean, "var:", M2/count)

# 44. sparse one-hot via COO-like representation
labels44 = np.array([0, 3, 2, 1, 4, 3])
n_classes44 = 5
one_hot44 = np.zeros((len(labels44), n_classes44))
one_hot44[np.arange(len(labels44)), labels44] = 1.
print("Ex44 sparse one-hot shape:", one_hot44.shape)

# 45. imputation with KNN concept (distance-based)
data45 = np.array([[1., 2., np.nan], [4., 5., 6.], [7., 8., 9.]])
# simple approach: fill with column mean
col_means = np.nanmean(data45, axis=0)
for j in range(data45.shape[1]):
    mask45 = np.isnan(data45[:, j])
    data45[mask45, j] = col_means[j]
print("Ex45 imputed data:\n", data45)

# 46. ordinal encoding with frequency ordering
words = np.array(['dog', 'cat', 'bird', 'dog', 'dog', 'cat'])
unique_w, counts_w = np.unique(words, return_counts=True)
order = np.argsort(-counts_w)  # most frequent first
freq_enc = {w: i for i, w in enumerate(unique_w[order])}
encoded = np.array([freq_enc[w] for w in words])
print("Ex46 frequency encoding:", encoded)

# 47. robust centering with median
arr47 = np.array([1., 2., 3., 100., 4., 5.])
med47 = np.median(arr47)
mad47 = np.median(np.abs(arr47 - med47))
robust47 = (arr47 - med47) / (mad47 + 1e-8)
print("Ex47 robust z-scores:", robust47.round(3))

# 48. variance inflation concept
X8 = np.random.randn(50, 4)
corr8 = np.corrcoef(X8.T)
print("Ex48 correlation matrix:\n", corr8.round(3))

# 49. imputing with rolling mean
arr49 = np.array([1., 2., np.nan, np.nan, 5., 6.])
# fill each nan with mean of neighbors
result49 = arr49.copy()
for i in np.where(np.isnan(arr49))[0]:
    neighbors = arr49[max(0,i-1):i+2]
    result49[i] = np.nanmean(neighbors)
print("Ex49 neighbor imputed:", result49)

# 50. preprocessing pipeline
def preprocess_pipeline(X_in):
    # 1. fill NaN
    col_means50 = np.nanmean(X_in, axis=0)
    for j in range(X_in.shape[1]):
        mask50 = np.isnan(X_in[:, j])
        X_in[mask50, j] = col_means50[j]
    # 2. clip outliers per column
    for j in range(X_in.shape[1]):
        lo50 = np.percentile(X_in[:, j], 5.)
        hi50 = np.percentile(X_in[:, j], 95.)
        X_in[:, j] = np.clip(X_in[:, j], lo50, hi50)
    # 3. standardize
    mu50 = X_in.mean(axis=0)
    sigma50 = X_in.std(axis=0)
    return (X_in - mu50) / (sigma50 + 1e-8)
np.random.seed(42)
X_raw = np.random.randn(100, 3)
X_raw[5, 0] = np.nan
X_processed = preprocess_pipeline(X_raw)
print("Ex50 pipeline output shape:", X_processed.shape)
print("Ex50 mean ~0:", X_processed.mean(axis=0).round(4))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
