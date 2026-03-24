# ============================================================
# Solution 1.4 — Statistics for ML
# ============================================================

import numpy as np
import pandas as pd
from scipy import stats
import math
from typing import Tuple, List


def descriptive_stats(data: np.ndarray) -> dict:
    data = np.asarray(data, dtype=float)
    mode_result = stats.mode(data, keepdims=True)
    return {
        "mean":     float(np.mean(data)),
        "median":   float(np.median(data)),
        "mode":     float(mode_result.mode[0]),
        "variance": float(np.var(data, ddof=1)),
        "std":      float(np.std(data, ddof=1)),
    }


def zscore(data: np.ndarray) -> np.ndarray:
    data = np.asarray(data, dtype=float)
    return (data - data.mean()) / data.std(ddof=0)


def pearson_corr(x: np.ndarray, y: np.ndarray) -> float:
    r, _ = stats.pearsonr(x, y)
    return r


def spearman_corr(x: np.ndarray, y: np.ndarray) -> float:
    rho, _ = stats.spearmanr(x, y)
    return rho


def one_sample_ttest(data: np.ndarray, popmean: float) -> Tuple[float, float]:
    t, p = stats.ttest_1samp(data, popmean)
    return t, p


def two_sample_ttest(group1: np.ndarray, group2: np.ndarray) -> Tuple[float, float]:
    t, p = stats.ttest_ind(group1, group2)
    return t, p


def chi2_test(contingency_table: np.ndarray) -> Tuple[float, float, int]:
    chi2, p, dof, _ = stats.chi2_contingency(contingency_table)
    return chi2, p, dof


def one_way_anova(*groups: np.ndarray) -> Tuple[float, float]:
    F, p = stats.f_oneway(*groups)
    return F, p


def confidence_interval(data: np.ndarray, confidence: float = 0.95) -> Tuple[float, float]:
    data = np.asarray(data, dtype=float)
    n = len(data)
    mean = np.mean(data)
    se = stats.sem(data)
    lower, upper = stats.t.interval(confidence, df=n-1, loc=mean, scale=se)
    return lower, upper


def bootstrap_ci(data: np.ndarray, confidence: float = 0.95,
                 n_bootstrap: int = 1000, seed: int = 42) -> Tuple[float, float]:
    rng = np.random.default_rng(seed)
    data = np.asarray(data, dtype=float)
    boot_means = np.array([
        rng.choice(data, size=len(data), replace=True).mean()
        for _ in range(n_bootstrap)
    ])
    alpha = 1 - confidence
    lower = np.percentile(boot_means, 100 * alpha / 2)
    upper = np.percentile(boot_means, 100 * (1 - alpha / 2))
    return lower, upper


def interpret_pvalue(p_value: float, alpha: float = 0.05) -> str:
    return "Reject H0" if p_value < alpha else "Fail to reject H0"


def type1_error_rate(alpha: float = 0.05, n_sim: int = 1000,
                     n: int = 30, seed: int = 42) -> float:
    rng = np.random.default_rng(seed)
    rejections = 0
    for _ in range(n_sim):
        sample = rng.normal(0, 1, size=n)
        _, p = stats.ttest_1samp(sample, popmean=0)
        if p < alpha:
            rejections += 1
    return rejections / n_sim


def statistical_power(effect_size: float, n: int, alpha: float = 0.05) -> float:
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z = abs(effect_size) * np.sqrt(n) - z_alpha
    power = stats.norm.cdf(z)
    return power


def ab_test_sample_size(p1: float, p2: float, alpha: float = 0.05, power: float = 0.8) -> int:
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta = stats.norm.ppf(power)
    numerator = (z_alpha + z_beta) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))
    denominator = (p1 - p2) ** 2
    return math.ceil(numerator / denominator)


def bonferroni(p_values: List[float], alpha: float = 0.05) -> List[bool]:
    n = len(p_values)
    adjusted_alpha = alpha / n
    return [p < adjusted_alpha for p in p_values]


def main():
    print("=== Solution 1.4: Statistics for ML ===\n")

    data = np.array([1, 2, 2, 3, 4, 5, 5, 5, 6], dtype=float)
    stats_dict = descriptive_stats(data)
    print("Result 1 — Descriptive stats:", {k: round(v, 4) for k, v in stats_dict.items()})
    print("Result 2 — Z-scores:", np.round(zscore(data), 4))

    x = np.array([1, 2, 3, 4, 5], dtype=float)
    y = np.array([2, 4, 5, 4, 5], dtype=float)
    print("Result 3 — Pearson corr:", round(pearson_corr(x, y), 4))
    print("Result 4 — Spearman corr:", round(spearman_corr(x, y), 4))

    t, p = one_sample_ttest(np.array([2.1, 2.5, 2.3, 2.4, 2.6]), popmean=2.0)
    print(f"Result 5 — One-sample t-test: t={round(t,4)}, p={round(p,4)}")

    g1 = np.array([5.1, 5.5, 4.9, 5.3, 5.2])
    g2 = np.array([4.8, 4.5, 5.0, 4.7, 4.6])
    t, p = two_sample_ttest(g1, g2)
    print(f"Result 6 — Two-sample t-test: t={round(t,4)}, p={round(p,4)}")

    table = np.array([[10, 20], [30, 40]])
    chi2, p, dof = chi2_test(table)
    print(f"Result 7 — Chi-square: chi2={round(chi2,4)}, p={round(p,4)}, dof={dof}")

    F, p = one_way_anova(np.array([1,2,3]), np.array([4,5,6]), np.array([7,8,9]))
    print(f"Result 8 — ANOVA: F={round(F,4)}, p={round(p,6)}")

    lo, hi = confidence_interval(x)
    print(f"Result 9 — 95% CI: ({round(lo,4)}, {round(hi,4)})")

    lo, hi = bootstrap_ci(x)
    print(f"Result 10 — Bootstrap 95% CI: ({round(lo,4)}, {round(hi,4)})")

    print("Result 11 — p=0.03:", interpret_pvalue(0.03))
    print("           p=0.07:", interpret_pvalue(0.07))

    rate = type1_error_rate()
    print(f"Result 12 — Type I error rate (expect ~= 0.05): {round(rate, 3)}")

    pw = statistical_power(effect_size=0.5, n=30)
    print(f"Result 13 — Power (d=0.5, n=30): {round(pw, 4)}")

    n_ab = ab_test_sample_size(0.10, 0.12)
    print(f"Result 14 — A/B test n per group: {n_ab}")

    significant = bonferroni([0.01, 0.04, 0.001])
    print(f"Result 15 — Bonferroni [0.01, 0.04, 0.001]: {significant}")


if __name__ == "__main__":
    main()
