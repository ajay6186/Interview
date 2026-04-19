# ============================================================================
# Solution 4.4 — Statistical Analysis
# ============================================================================
# Work with random distributions, detect outliers using IQR and z-scores,
# and estimate confidence intervals via bootstrap sampling.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Simulate distributions
# ---------------------------------------------------------------------------

np.random.seed(42)

# Generate 1000 samples from a normal distribution with mean=50, std=10
normal_samples = np.random.normal(loc=50., scale=10., size=1000)

# Generate 1000 samples from a Poisson distribution with lambda=3
poisson_samples = np.random.poisson(lam=3., size=1000)

# Generate 1000 samples from a Binomial distribution with n=10, p=0.4
binomial_samples = np.random.binomial(n=10, p=0.4, size=1000)

# ---------------------------------------------------------------------------
# 2. IQR-based outlier detection
# ---------------------------------------------------------------------------

np.random.seed(0)
data = np.concatenate([
    np.random.normal(0., 1., 95),
    np.array([10., -10., 15., -15., 20.])  # outliers
])

# Compute Q1, Q3, and IQR
Q1 = np.percentile(data, 25)
Q3 = np.percentile(data, 75)
iqr_val = Q3 - Q1

# Create a boolean mask marking outliers (beyond 1.5 * IQR from Q1/Q3)
outlier_mask = (data < Q1 - 1.5 * iqr_val) | (data > Q3 + 1.5 * iqr_val)

# ---------------------------------------------------------------------------
# 3. Z-score outlier detection
# ---------------------------------------------------------------------------

# Compute z-scores of data
z_scores = (data - data.mean()) / data.std()

# Create a boolean mask for |z| > 2.5 outliers
z_outlier_mask = np.abs(z_scores) > 2.5

# ---------------------------------------------------------------------------
# 4. Bootstrap confidence interval for the mean
# ---------------------------------------------------------------------------

np.random.seed(42)
sample = np.random.normal(100., 15., size=50)

# Run 2000 bootstrap iterations
n_boot = 2000
boot_means = np.array([
    np.mean(np.random.choice(sample, size=len(sample), replace=True))
    for _ in range(n_boot)
])

# Compute the 95% confidence interval (2.5th and 97.5th percentiles)
ci_lower = np.percentile(boot_means, 2.5)
ci_upper = np.percentile(boot_means, 97.5)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert normal_samples is not None, "normal_samples must be defined"
    assert len(normal_samples) == 1000, "normal_samples should have 1000 elements"
    assert np.isclose(normal_samples.mean(), 50., atol=2.), \
        f"normal mean should be ~50, got {normal_samples.mean():.2f}"
    assert np.isclose(normal_samples.std(), 10., atol=1.), \
        f"normal std should be ~10, got {normal_samples.std():.2f}"

    assert poisson_samples is not None, "poisson_samples must be defined"
    assert len(poisson_samples) == 1000, "poisson_samples should have 1000 elements"
    assert np.isclose(poisson_samples.mean(), 3., atol=0.5), \
        f"Poisson mean should be ~3, got {poisson_samples.mean():.2f}"

    assert binomial_samples is not None, "binomial_samples must be defined"
    assert len(binomial_samples) == 1000, "binomial_samples should have 1000 elements"
    assert np.isclose(binomial_samples.mean(), 4., atol=0.5), \
        f"Binomial mean should be ~4 (n*p=10*0.4), got {binomial_samples.mean():.2f}"

    assert Q1 is not None and Q3 is not None, "Q1 and Q3 must be defined"
    assert np.isclose(iqr_val, Q3 - Q1), "IQR should equal Q3 - Q1"

    assert outlier_mask is not None, "outlier_mask must be defined"
    assert outlier_mask.dtype == np.bool_, "outlier_mask should be boolean"
    assert np.sum(outlier_mask) >= 3, \
        f"Should detect at least 3 outliers, got {np.sum(outlier_mask)}"

    assert z_scores is not None, "z_scores must be defined"
    assert np.isclose(z_scores.mean(), 0., atol=1e-10), "z_scores should have mean ~0"

    assert z_outlier_mask is not None, "z_outlier_mask must be defined"
    assert z_outlier_mask.dtype == np.bool_, "z_outlier_mask should be boolean"

    assert boot_means is not None, "boot_means must be defined"
    assert boot_means.shape == (n_boot,), f"boot_means should have {n_boot} elements"

    assert ci_lower is not None and ci_upper is not None, "CI must be defined"
    assert ci_lower < ci_upper, "ci_lower should be less than ci_upper"
    assert ci_lower < 100. < ci_upper, \
        f"95% CI [{ci_lower:.1f}, {ci_upper:.1f}] should contain 100"

    print("Solution 4.4 — All assertions passed!")

if __name__ == "__main__":
    main()
