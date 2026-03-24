# ============================================================
# Exercise 1.4 — Statistics for ML
# ============================================================
# Topics:
#   • Descriptive statistics: mean, median, mode, variance, std
#   • Normalization: Z-score
#   • Correlation: Pearson, Spearman
#   • Hypothesis tests: t-test (1-sample, 2-sample), chi-square, ANOVA
#   • Confidence intervals: analytical and bootstrap
#   • Statistical power, A/B test sample size
#   • Multiple testing correction (Bonferroni)
# ============================================================

import numpy as np
import pandas as pd
from scipy import stats
from typing import Tuple, List

# ---------------------------------------------------------------------------
# TODO 1: Descriptive Statistics
# ---------------------------------------------------------------------------
# Given a 1-D array of data, return a dict with keys:
#   mean, median, mode, variance (ddof=1), std (ddof=1)
# Expected: descriptive_stats([1,2,2,3,4]) → {mean:2.4, median:2, mode:2, ...}

def descriptive_stats(data: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: Z-Score Normalization
# ---------------------------------------------------------------------------
# Standardize array: z = (x - mean) / std  (use ddof=0 for population std)
# Expected: zscore([1,2,3,4,5]) → array with mean≈0, std≈1

def zscore(data: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Pearson Correlation Coefficient
# ---------------------------------------------------------------------------
# Compute Pearson r between arrays x and y.
# Expected: pearson_corr([1,2,3], [2,4,6]) == 1.0 (perfect linear)

def pearson_corr(x: np.ndarray, y: np.ndarray) -> float:
    pass  # TODO: implement (use scipy.stats.pearsonr, return only r)


# ---------------------------------------------------------------------------
# TODO 4: Spearman Correlation
# ---------------------------------------------------------------------------
# Compute Spearman rank correlation between x and y.
# Expected: spearman_corr([1,2,3], [1,4,9]) == 1.0 (monotone)

def spearman_corr(x: np.ndarray, y: np.ndarray) -> float:
    pass  # TODO: implement (use scipy.stats.spearmanr, return only rho)


# ---------------------------------------------------------------------------
# TODO 5: One-Sample T-Test
# ---------------------------------------------------------------------------
# Test if the mean of data equals popmean. Return (t_statistic, p_value).
# Expected: one_sample_ttest([2.1,2.5,2.3], popmean=2.0) → (t, p)

def one_sample_ttest(data: np.ndarray, popmean: float) -> Tuple[float, float]:
    pass  # TODO: implement (use scipy.stats.ttest_1samp)


# ---------------------------------------------------------------------------
# TODO 6: Two-Sample T-Test
# ---------------------------------------------------------------------------
# Test if means of group1 and group2 are equal (independent samples).
# Return (t_statistic, p_value).
# Expected: two_sample_ttest(group1, group2) → (t, p)

def two_sample_ttest(group1: np.ndarray, group2: np.ndarray) -> Tuple[float, float]:
    pass  # TODO: implement (use scipy.stats.ttest_ind)


# ---------------------------------------------------------------------------
# TODO 7: Chi-Square Test for Independence
# ---------------------------------------------------------------------------
# Given a contingency table (2D array), perform chi-square test.
# Return (chi2_statistic, p_value, degrees_of_freedom).
# Expected: chi2_test([[10,20],[30,40]]) → (chi2, p, dof)

def chi2_test(contingency_table: np.ndarray) -> Tuple[float, float, int]:
    pass  # TODO: implement (use scipy.stats.chi2_contingency)


# ---------------------------------------------------------------------------
# TODO 8: One-Way ANOVA
# ---------------------------------------------------------------------------
# Test if means of multiple groups are equal.
# Accept *groups (variable number of arrays). Return (F_statistic, p_value).
# Expected: one_way_anova([1,2,3], [4,5,6], [7,8,9]) → (F, p)

def one_way_anova(*groups: np.ndarray) -> Tuple[float, float]:
    pass  # TODO: implement (use scipy.stats.f_oneway)


# ---------------------------------------------------------------------------
# TODO 9: Confidence Interval for Mean (Analytical)
# ---------------------------------------------------------------------------
# Compute (lower, upper) confidence interval for the mean of data.
# Use t-distribution: CI = x_bar ± t_{alpha/2, n-1} * (s / sqrt(n))
# Expected: confidence_interval([1,2,3,4,5], 0.95) → (lower, upper)

def confidence_interval(data: np.ndarray, confidence: float = 0.95) -> Tuple[float, float]:
    pass  # TODO: implement (use scipy.stats.t.interval or sem)


# ---------------------------------------------------------------------------
# TODO 10: Bootstrap Confidence Interval
# ---------------------------------------------------------------------------
# Compute a bootstrap confidence interval for the mean.
# Draw n_bootstrap samples (with replacement), compute mean each time,
# return the (alpha/2, 1-alpha/2) percentiles.
# Expected: bootstrap_ci(data, n_bootstrap=1000) → (lower, upper)

def bootstrap_ci(data: np.ndarray, confidence: float = 0.95,
                 n_bootstrap: int = 1000, seed: int = 42) -> Tuple[float, float]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: P-value Interpretation
# ---------------------------------------------------------------------------
# Given a p_value and significance level alpha, return a string:
#   "Reject H0" if p_value < alpha, else "Fail to reject H0"
# Expected: interpret_pvalue(0.03, 0.05) == "Reject H0"

def interpret_pvalue(p_value: float, alpha: float = 0.05) -> str:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Type I and Type II Error Simulation
# ---------------------------------------------------------------------------
# Simulate Type I error rate: generate data from H0 (mu=0) n_sim times,
# run one-sample t-test against popmean=0, count fraction of rejections
# (which are false positives = Type I errors). Return the estimated rate.
# Expected: type1_error_rate(alpha=0.05, n_sim=1000) ≈ 0.05

def type1_error_rate(alpha: float = 0.05, n_sim: int = 1000,
                     n: int = 30, seed: int = 42) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Statistical Power Calculation
# ---------------------------------------------------------------------------
# Compute the statistical power of a one-sample z-test:
#   power = P(reject H0 | H1 true)
# For known sigma, effect_size = (mu1 - mu0) / sigma.
# power = 1 - beta = Phi(|effect_size| * sqrt(n) - z_{alpha/2})
# Use scipy.stats.norm.cdf. Return the power (float).

def statistical_power(effect_size: float, n: int, alpha: float = 0.05) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: A/B Test Minimum Sample Size
# ---------------------------------------------------------------------------
# Compute minimum n per group for a two-proportion z-test:
#   n = (z_{alpha/2} + z_beta)^2 * (p1*(1-p1) + p2*(1-p2)) / (p1 - p2)^2
# Return n (integer, rounded up).
# Expected: ab_test_sample_size(0.1, 0.12) → reasonable n

def ab_test_sample_size(p1: float, p2: float, alpha: float = 0.05, power: float = 0.8) -> int:
    pass  # TODO: implement (use scipy.stats.norm.ppf for z-scores)


# ---------------------------------------------------------------------------
# TODO 15: Bonferroni Correction
# ---------------------------------------------------------------------------
# Given a list of p-values and overall significance level alpha,
# apply Bonferroni correction: adjusted_alpha = alpha / n_tests
# Return a list of booleans: True if the test is significant after correction.
# Expected: bonferroni([0.01, 0.04, 0.001], 0.05) → [True, False, True]

def bonferroni(p_values: List[float], alpha: float = 0.05) -> List[bool]:
    pass  # TODO: implement


def main():
    print("=== Exercise 1.4: Statistics for ML ===\n")

    data = np.array([1, 2, 2, 3, 4, 5, 5, 5, 6])
    print("TODO 1 — Descriptive stats:", descriptive_stats(data))
    print("TODO 2 — Z-scores:", zscore(data))

    x = np.array([1, 2, 3, 4, 5], dtype=float)
    y = np.array([2, 4, 5, 4, 5], dtype=float)
    print("TODO 3 — Pearson corr:", pearson_corr(x, y))
    print("TODO 4 — Spearman corr:", spearman_corr(x, y))

    print("TODO 5 — One-sample t-test:", one_sample_ttest(np.array([2.1,2.5,2.3,2.4,2.6]), popmean=2.0))
    g1 = np.array([5.1, 5.5, 4.9, 5.3, 5.2])
    g2 = np.array([4.8, 4.5, 5.0, 4.7, 4.6])
    print("TODO 6 — Two-sample t-test:", two_sample_ttest(g1, g2))

    table = np.array([[10, 20], [30, 40]])
    print("TODO 7 — Chi-square test:", chi2_test(table))
    print("TODO 8 — One-way ANOVA:", one_way_anova(np.array([1,2,3]), np.array([4,5,6]), np.array([7,8,9])))
    print("TODO 9 — Confidence interval:", confidence_interval(x))
    print("TODO 10 — Bootstrap CI:", bootstrap_ci(x))
    print("TODO 11 — Interpret p=0.03:", interpret_pvalue(0.03))
    print("TODO 12 — Type I error rate:", type1_error_rate())
    print("TODO 13 — Statistical power:", statistical_power(effect_size=0.5, n=30))
    print("TODO 14 — A/B test sample size:", ab_test_sample_size(0.10, 0.12))
    print("TODO 15 — Bonferroni:", bonferroni([0.01, 0.04, 0.001]))


if __name__ == "__main__":
    main()
