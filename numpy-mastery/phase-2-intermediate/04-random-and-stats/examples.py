# ============================================================================
# Examples 2.4 — Random and Statistics  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# --- BASIC ---

# 1. np.random.rand — uniform [0, 1)
print("Ex01:", np.random.rand(5))

# 2. np.random.randn — standard normal
print("Ex02:", np.random.randn(5))

# 3. np.random.randint
print("Ex03:", np.random.randint(0, 10, size=8))

# 4. np.random.seed for reproducibility
np.random.seed(0)
print("Ex04:", np.random.rand(3))
np.random.seed(0)
print("Ex04 same:", np.random.rand(3))  # same values

# 5. np.random.choice
print("Ex05:", np.random.choice(np.arange(20), size=5, replace=False))

# 6. np.random.choice with probabilities
p = np.array([0.5, 0.3, 0.2])
print("Ex06:", np.random.choice([1, 2, 3], size=10, p=p))

# 7. np.random.shuffle (in-place)
arr = np.arange(10)
np.random.shuffle(arr)
print("Ex07:", arr)

# 8. np.random.permutation (returns new array)
print("Ex08:", np.random.permutation(10))

# 9. np.median
data = np.array([3., 1., 4., 1., 5., 9., 2., 6.])
print("Ex09 median:", np.median(data))

# 10. np.percentile
print("Ex10 25th:", np.percentile(data, 25))
print("Ex10 75th:", np.percentile(data, 75))

# 11. IQR
p25 = np.percentile(data, 25)
p75 = np.percentile(data, 75)
print("Ex11 IQR:", p75 - p25)

# 12. np.histogram
counts, edges = np.histogram(data, bins=4)
print("Ex12 counts:", counts, "edges:", edges.round(2))

# 13. np.corrcoef — correlation matrix
X = np.random.randn(50, 2)
print("Ex13 corrcoef:\n", np.corrcoef(X.T).round(3))

# 14. np.cov — covariance matrix
print("Ex14 cov:\n", np.cov(X.T).round(3))

# 15. normal distribution with loc/scale
samples_n = np.random.normal(loc=5.0, scale=2.0, size=1000)
print("Ex15 mean:", samples_n.mean().round(2), "std:", samples_n.std().round(2))

# --- INTERMEDIATE ---

# 16. uniform distribution with low/high
u = np.random.uniform(low=2.0, high=8.0, size=1000)
print("Ex16 min:", u.min().round(2), "max:", u.max().round(2))

# 17. Poisson distribution
pois = np.random.poisson(lam=3.0, size=1000)
print("Ex17 Poisson mean:", pois.mean().round(2))

# 18. binomial distribution
binom = np.random.binomial(n=10, p=0.5, size=1000)
print("Ex18 Binomial mean:", binom.mean().round(2))

# 19. exponential distribution
expo = np.random.exponential(scale=2.0, size=1000)
print("Ex19 Exponential mean:", expo.mean().round(2))

# 20. beta distribution
beta = np.random.beta(a=2.0, b=5.0, size=1000)
print("Ex20 Beta mean:", beta.mean().round(2))

# 21. np.random.multivariate_normal
mean_mv = [0., 0.]
cov_mv = [[1., 0.8], [0.8, 1.]]
mv_samples = np.random.multivariate_normal(mean_mv, cov_mv, size=500)
print("Ex21 mv corr:", np.corrcoef(mv_samples.T)[0, 1].round(2))

# 22. np.quantile (similar to percentile but fraction [0,1])
data2 = np.random.randn(1000)
print("Ex22 Q1:", np.quantile(data2, 0.25).round(3))

# 23. np.histogram2d
x2, y2 = np.random.randn(100), np.random.randn(100)
H, xedges, yedges = np.histogram2d(x2, y2, bins=5)
print("Ex23 hist2d shape:", H.shape)

# 24. np.histogram with density=True
dens, edges2 = np.histogram(data2, bins=20, density=True)
print("Ex24 density sum*binwidth ~1:", (dens * np.diff(edges2)).sum().round(3))

# 25. np.digitize — bin membership
bins_d = np.array([0, 25, 50, 75, 100])
values_d = np.array([10, 30, 55, 80, 45])
print("Ex25 bin indices:", np.digitize(values_d, bins_d))

# 26. np.random.Generator (new API)
rng = np.random.default_rng(seed=42)
print("Ex26:", rng.random(5))

# 27. Generator distributions
print("Ex27 normal:", rng.standard_normal(5).round(3))

# 28. np.random.SeedSequence for reproducible parallel streams
ss = np.random.SeedSequence(12345)
child_seeds = ss.spawn(3)
rngs = [np.random.default_rng(s) for s in child_seeds]
print("Ex28 first values:", [r.random() for r in rngs])

# 29. np.nanpercentile
arr_nan = np.array([1., 2., np.nan, 4., 5.])
print("Ex29 nanpercentile:", np.nanpercentile(arr_nan, 50))

# 30. moving statistics using np.lib.stride_tricks
def rolling_mean(arr_rm, window):
    shape = arr_rm.shape[:-1] + (arr_rm.shape[-1] - window + 1, window)
    strides = arr_rm.strides + (arr_rm.strides[-1],)
    from numpy.lib.stride_tricks import as_strided
    windows = as_strided(arr_rm, shape=shape, strides=strides)
    return windows.mean(axis=-1)
data3 = np.array([1., 2., 3., 4., 5., 6., 7.])
print("Ex30 rolling mean(3):", rolling_mean(data3, 3))

# --- ADVANCED ---

# 31. bootstrap confidence interval
np.random.seed(42)
sample = np.random.normal(50, 10, size=30)
boot_means = np.array([np.mean(np.random.choice(sample, size=len(sample), replace=True))
                       for _ in range(1000)])
ci = np.percentile(boot_means, [2.5, 97.5])
print("Ex31 95% CI:", ci.round(2))

# 32. z-score normalization
z = (sample - sample.mean()) / sample.std()
print("Ex32 z-score mean:", z.mean().round(6), "std:", z.std().round(6))

# 33. outlier detection (z-score > 3)
outlier_mask = np.abs(z) > 2
print("Ex33 outliers:", sample[outlier_mask])

# 34. Pearson correlation by hand
x_p = np.random.randn(100)
y_p = 2 * x_p + np.random.randn(100)
r = np.corrcoef(x_p, y_p)[0, 1]
print("Ex34 Pearson r:", r.round(3))

# 35. covariance by hand
cov_manual = np.mean((x_p - x_p.mean()) * (y_p - y_p.mean()))
print("Ex35 cov manual:", cov_manual.round(3))
print("Ex35 np.cov:", np.cov(x_p, y_p, ddof=0)[0, 1].round(3))

# 36. np.random.dirichlet distribution
dir_samples = np.random.dirichlet([1., 1., 1.], size=5)
print("Ex36 dirichlet (rows sum to 1):", dir_samples.sum(axis=1).round(4))

# 37. np.random.multinomial
print("Ex37 multinomial:", np.random.multinomial(100, [0.2, 0.5, 0.3]))

# 38. KS statistic concept (manual)
np.random.seed(42)
s1 = np.sort(np.random.normal(0, 1, 100))
s2 = np.sort(np.random.normal(0.5, 1, 100))
ks_stat = np.max(np.abs(np.arange(1, 101)/100 - np.searchsorted(s2, s1)/100))
print("Ex38 approx KS stat:", ks_stat.round(3))

# 39. weighted percentile (via np.percentile with interpolation)
wdata = np.array([1., 2., 3., 4., 5., 6., 7., 8., 9., 10.])
print("Ex39 percentile 90:", np.percentile(wdata, 90))

# 40. trimmed mean
def trimmed_mean(arr_t, pct):
    lo = np.percentile(arr_t, pct)
    hi = np.percentile(arr_t, 100 - pct)
    return arr_t[(arr_t >= lo) & (arr_t <= hi)].mean()
data4 = np.concatenate([np.random.normal(50, 5, 95), np.array([0., 0., 0., 100., 100.])])
print("Ex40 trimmed mean (10%):", trimmed_mean(data4, 10).round(2))

# 41. np.random.choice to simulate Monte Carlo
np.random.seed(42)
wins = np.random.choice([0, 1], size=10000, p=[0.45, 0.55])
print("Ex41 estimated P(win):", wins.mean().round(3))

# 42. np.histogram normalization and PMF
counts_h, edges_h = np.histogram(np.random.randint(1, 7, 6000), bins=6)
pmf = counts_h / counts_h.sum()
print("Ex42 PMF:", pmf.round(3))

# --- EXPERT ---

# 43. Welch's t-test statistic manually
np.random.seed(42)
g1 = np.random.normal(10, 2, 50)
g2 = np.random.normal(11, 3, 50)
t_stat = (g1.mean() - g2.mean()) / np.sqrt(g1.var(ddof=1)/len(g1) + g2.var(ddof=1)/len(g2))
print("Ex43 t-stat:", t_stat.round(3))

# 44. Geometric mean via log trick
geo_data = np.array([2., 4., 8., 16., 32.])
geo_mean = np.exp(np.log(geo_data).mean())
print("Ex44 geometric mean:", geo_mean.round(4))  # should be ~8.0

# 45. Harmonic mean
harm_mean = len(geo_data) / np.sum(1.0 / geo_data)
print("Ex45 harmonic mean:", harm_mean.round(4))

# 46. np.random.Generator PCG64 bit generator
rng2 = np.random.Generator(np.random.PCG64(seed=99))
print("Ex46:", rng2.integers(0, 100, 5))

# 47. Gaussian mixture sampling
np.random.seed(42)
N = 1000
which_comp = np.random.choice([0, 1], size=N, p=[0.4, 0.6])
mixture = np.where(which_comp == 0,
                   np.random.normal(0, 1, N),
                   np.random.normal(5, 1, N))
print("Ex47 mixture mean:", mixture.mean().round(2))  # ~3.0

# 48. np.percentile with interpolation methods
x_perc = np.array([1., 2., 3., 4., 5.])
for method in ['lower', 'higher', 'midpoint', 'nearest', 'linear']:
    print(f"Ex48 p50 {method}:", np.percentile(x_perc, 50, interpolation=method))

# 49. circular statistics — mean angle
angles = np.array([10., 350., 5., 355., 15.])
rad = np.deg2rad(angles)
mean_angle = np.rad2deg(np.arctan2(np.sin(rad).mean(), np.cos(rad).mean())) % 360
print("Ex49 circular mean angle:", mean_angle.round(2))

# 50. entropy from histogram
np.random.seed(42)
obs = np.random.randint(0, 6, 600)
counts50, _ = np.histogram(obs, bins=6, range=(0, 6))
probs = counts50 / counts50.sum()
entropy = -np.sum(probs * np.log2(probs + 1e-10))
print("Ex50 entropy:", entropy.round(4))  # ~2.58 for uniform discrete 6


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
