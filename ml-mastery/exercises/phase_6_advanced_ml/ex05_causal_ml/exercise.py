# ============================================================
# Exercise 6.5 — Causal ML & A/B Testing
# ============================================================
# Topics:
#   • A/B test: conversion rates, z-test for proportions
#   • Minimum sample size, statistical power
#   • Multiple testing correction (Bonferroni, FDR)
#   • Observational vs RCT
#   • Simpson's paradox (confounding)
#   • Propensity score matching concept
#   • Inverse propensity weighting (IPW)
#   • Difference-in-differences (DiD)
#   • Regression discontinuity (RD)
#   • Instrumental variables concept
#   • Uplift modeling (treatment effect per individual)
#   • CATE (Conditional Average Treatment Effect)
#   • Causal graph (DAG) and d-separation
# ============================================================

import numpy as np
from scipy import stats


# --- TODO 1: A/B test — compute conversion rates ---
# Given clicks_a, visitors_a, clicks_b, visitors_b.
# Return (rate_a, rate_b, relative_lift_pct).
def ab_conversion_rates(clicks_a: int, visitors_a: int,
                        clicks_b: int, visitors_b: int) -> tuple:
    pass  # TODO: implement


# --- TODO 2: A/B test — z-test for proportions ---
# H0: rate_a == rate_b. Two-sided test.
# Return (z_stat, p_value, significant: bool at alpha=0.05).
def ab_ztest(clicks_a: int, visitors_a: int,
             clicks_b: int, visitors_b: int) -> tuple:
    pass  # TODO: implement


# --- TODO 3: Minimum sample size ---
# n = (z_alpha/2 + z_beta)^2 * (p1*(1-p1) + p2*(1-p2)) / (p1-p2)^2
# Return n per group (ceil).
def min_sample_size(p1: float, p2: float,
                    alpha: float = 0.05, power: float = 0.8) -> int:
    pass  # TODO: implement


# --- TODO 4: Statistical power ---
# Given n per group, compute actual power for detecting (p1, p2).
# Return power as float.
def statistical_power(n: int, p1: float, p2: float, alpha: float = 0.05) -> float:
    pass  # TODO: implement


# --- TODO 5: Multiple testing correction ---
# Bonferroni: alpha_corrected = alpha / n_tests
# BH (FDR): sort p-values, reject p_i <= i/m * alpha
# Return dict {method: list_of_rejected_indices}.
def multiple_testing_correction(p_values: list, alpha: float = 0.05) -> dict:
    pass  # TODO: implement


# --- TODO 6: Observational vs RCT ---
# Return a string comparing the two study designs.
def obs_vs_rct() -> str:
    pass  # TODO: implement


# --- TODO 7: Simpson's paradox ---
# Simulate: overall rate_B > rate_A, but within each subgroup rate_A > rate_B.
# Return (overall_rates, subgroup_rates) as dicts.
def simpsons_paradox() -> tuple:
    pass  # TODO: implement


# --- TODO 8: Propensity score matching concept ---
# Return a string explaining PSM steps.
def propensity_score_matching_concept() -> str:
    pass  # TODO: implement


# --- TODO 9: Inverse propensity weighting (IPW) ---
# ATE_IPW = mean(T*Y/e) - mean((1-T)*Y/(1-e))
# T: treatment (0/1), Y: outcome, e: propensity score P(T=1|X).
# Return estimated ATE.
def ipw_ate(T: np.ndarray, Y: np.ndarray, e: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 10: Difference-in-differences (DiD) ---
# DiD = (Y_treat_post - Y_treat_pre) - (Y_ctrl_post - Y_ctrl_pre)
# Return (did_estimate, se_estimate).
def difference_in_differences(y_treat_pre: np.ndarray, y_treat_post: np.ndarray,
                               y_ctrl_pre: np.ndarray, y_ctrl_post: np.ndarray) -> tuple:
    pass  # TODO: implement


# --- TODO 11: Regression discontinuity ---
# Simulate RD: units above cutoff get treatment.
# Estimate local average treatment effect (LATE) at cutoff
# using linear regression on left/right windows.
# Return (late_estimate, se_estimate).
def regression_discontinuity(cutoff: float = 0.5, window: float = 0.2,
                              n: int = 1000) -> tuple:
    pass  # TODO: implement


# --- TODO 12: Instrumental variables concept ---
# Return a string explaining IV estimation (2SLS).
def instrumental_variables_concept() -> str:
    pass  # TODO: implement


# --- TODO 13: Uplift modeling ---
# Uplift_i = P(Y=1|T=1, X=x_i) - P(Y=1|T=0, X=x_i)
# Train separate models for T=1 and T=0; return per-individual uplift.
def uplift_model(X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 14: CATE (Conditional ATE) ---
# Use sklearn's cross-fitting (simple S-learner: one model with T as feature).
# Return per-individual CATE estimates.
def cate_s_learner(X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 15: Causal DAG and d-separation ---
# Return a string explaining DAGs, backdoor criterion, and d-separation.
def causal_dag_concept() -> str:
    pass  # TODO: implement


def main():
    print("=== Exercise 6.5: Causal ML & A/B Testing ===\n")

    np.random.seed(42)

    clicks_a, visitors_a = 120, 1000
    clicks_b, visitors_b = 150, 1000
    print("TODO 1  - Conversion rates:", ab_conversion_rates(clicks_a, visitors_a, clicks_b, visitors_b))
    print("TODO 2  - Z-test:", ab_ztest(clicks_a, visitors_a, clicks_b, visitors_b))
    print("TODO 3  - Min sample size (p1=0.10, p2=0.12):", min_sample_size(0.10, 0.12))
    print("TODO 4  - Power (n=2000, p1=0.10, p2=0.12):", statistical_power(2000, 0.10, 0.12))

    p_vals = [0.01, 0.04, 0.20, 0.03, 0.50]
    print("TODO 5  - Multiple testing correction:", multiple_testing_correction(p_vals))
    print("TODO 6  - Obs vs RCT:", obs_vs_rct())
    print("TODO 7  - Simpson's paradox:", simpsons_paradox())
    print("TODO 8  - PSM concept:", propensity_score_matching_concept())

    n_units = 500
    X_ipw = np.random.randn(n_units, 3)
    e_ipw = 1 / (1 + np.exp(-X_ipw[:, 0]))
    T_ipw = (np.random.rand(n_units) < e_ipw).astype(float)
    Y_ipw = T_ipw * 2 + X_ipw[:, 0] + np.random.randn(n_units) * 0.5
    print("TODO 9  - IPW ATE (true ≈ 2.0):", ipw_ate(T_ipw, Y_ipw, e_ipw))

    y_tp = np.random.normal(5, 1, 100)
    y_t0 = np.random.normal(3, 1, 100)
    y_cp = np.random.normal(4, 1, 100)
    y_c0 = np.random.normal(3.5, 1, 100)
    print("TODO 10 - DiD estimate:", difference_in_differences(y_t0, y_tp, y_c0, y_cp))
    print("TODO 11 - Regression discontinuity:", regression_discontinuity())
    print("TODO 12 - IV concept:", instrumental_variables_concept())

    X_ul = np.random.randn(200, 5)
    T_ul = (np.random.rand(200) > 0.5).astype(int)
    Y_ul = (T_ul * 1.5 + X_ul[:, 0] > 0).astype(int)
    print("TODO 13 - Uplift mean:", uplift_model(X_ul, T_ul, Y_ul).mean() if uplift_model(X_ul, T_ul, Y_ul) is not None else None)
    print("TODO 14 - CATE S-learner mean:", cate_s_learner(X_ul, T_ul, Y_ul).mean() if cate_s_learner(X_ul, T_ul, Y_ul) is not None else None)
    print("TODO 15 - Causal DAG concept:", causal_dag_concept())


if __name__ == "__main__":
    main()
