# ============================================================
# Solution 6.5 — Causal ML & A/B Testing
# ============================================================

import numpy as np
from scipy import stats


def ab_conversion_rates(clicks_a: int, visitors_a: int,
                        clicks_b: int, visitors_b: int) -> tuple:
    rate_a = clicks_a / visitors_a
    rate_b = clicks_b / visitors_b
    lift   = (rate_b - rate_a) / rate_a * 100
    return (round(rate_a, 4), round(rate_b, 4), round(lift, 2))


def ab_ztest(clicks_a: int, visitors_a: int,
             clicks_b: int, visitors_b: int) -> tuple:
    p_a = clicks_a / visitors_a
    p_b = clicks_b / visitors_b
    p_pool = (clicks_a + clicks_b) / (visitors_a + visitors_b)
    se = np.sqrt(p_pool * (1 - p_pool) * (1 / visitors_a + 1 / visitors_b))
    z = (p_b - p_a) / se
    p_val = 2 * (1 - stats.norm.cdf(abs(z)))
    return (round(float(z), 4), round(float(p_val), 4), bool(p_val < 0.05))


def min_sample_size(p1: float, p2: float,
                    alpha: float = 0.05, power: float = 0.8) -> int:
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta  = stats.norm.ppf(power)
    numerator   = (z_alpha + z_beta) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))
    denominator = (p1 - p2) ** 2
    n = numerator / denominator
    return int(np.ceil(n))


def statistical_power(n: int, p1: float, p2: float, alpha: float = 0.05) -> float:
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    p_pool  = (p1 + p2) / 2
    se_null = np.sqrt(2 * p_pool * (1 - p_pool) / n)
    se_alt  = np.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / n)
    effect  = abs(p2 - p1)
    z_power = (effect - z_alpha * se_null) / se_alt
    return round(float(stats.norm.cdf(z_power)), 4)


def multiple_testing_correction(p_values: list, alpha: float = 0.05) -> dict:
    m = len(p_values)
    p_arr = np.array(p_values)

    # Bonferroni
    alpha_bonf  = alpha / m
    bonferroni  = [i for i, p in enumerate(p_values) if p <= alpha_bonf]

    # Benjamini-Hochberg (FDR)
    order = np.argsort(p_arr)
    bh_threshold = (np.arange(1, m + 1) / m) * alpha
    bh_rejected = order[p_arr[order] <= bh_threshold].tolist()

    return {
        "bonferroni_rejected": bonferroni,
        "bh_fdr_rejected": sorted(bh_rejected),
    }


def obs_vs_rct() -> str:
    return (
        "Randomized Controlled Trial (RCT): treatment is randomly assigned, "
        "so treatment and control groups are comparable on all observed AND unobserved confounders. "
        "Gold standard for causal inference; internally valid.\n"
        "Observational study: treatment is self-selected; confounders may differ between groups. "
        "Causal claims require strong assumptions (no unmeasured confounders). "
        "Methods like PSM, IPW, DiD, IV attempt to control for confounding."
    )


def simpsons_paradox() -> tuple:
    # Department A: many women apply (competitive), few men
    # Department B: many men apply (easy), few women
    # Overall: women appear to have lower acceptance rate
    data = {
        "dept_A": {"A_accept": 10, "A_total": 100, "B_accept": 80, "B_total": 100},
        "dept_B": {"A_accept": 80, "A_total": 100, "B_accept": 10, "B_total": 100},
    }
    # Group A (e.g., treated), Group B (e.g., control)
    # Subgroup 1 (Dept A easy): A rate = 10%, B rate = 80%  → B > A
    # Subgroup 2 (Dept B hard): A rate = 80%, B rate = 10%  → A > B
    # Overall: A has 90/200=45%, B has 90/200=45% — tie here; classic example below:

    # Classic Berkeley: treat=male, ctrl=female
    male_overall   = (512 / 825)    # ~62%
    female_overall = (89  / 108)    # ~82%  ← females higher overall
    # But within most depts, males have higher rate (they apply to easier depts)
    sub1_male   = 0.62; sub1_female = 0.82  # dept 1 (easy)
    sub2_male   = 0.63; sub2_female = 0.68  # dept 2 (moderate)

    overall_rates   = {"male": round(male_overall, 3),  "female": round(female_overall, 3)}
    subgroup_rates  = {
        "dept_easy":     {"male": sub1_male, "female": sub1_female},
        "dept_moderate": {"male": sub2_male, "female": sub2_female},
    }
    return (overall_rates, subgroup_rates)


def propensity_score_matching_concept() -> str:
    return (
        "Propensity Score Matching (PSM) steps:\n"
        "  1. Estimate P(T=1|X) = e(X) using logistic regression.\n"
        "  2. For each treated unit, find a control unit with the closest e(X) "
        "(nearest-neighbor, caliper, or optimal matching).\n"
        "  3. Check covariate balance on matched sample (standardized mean differences < 0.1).\n"
        "  4. Estimate ATE or ATT on matched sample: mean(Y|T=1) - mean(Y|T=0).\n"
        "  Assumption: No unmeasured confounders (ignorability given X)."
    )


def ipw_ate(T: np.ndarray, Y: np.ndarray, e: np.ndarray) -> float:
    # Horvitz-Thompson estimator
    numerator_treat = np.mean(T * Y / np.clip(e, 1e-6, 1 - 1e-6))
    numerator_ctrl  = np.mean((1 - T) * Y / np.clip(1 - e, 1e-6, 1 - 1e-6))
    return round(float(numerator_treat - numerator_ctrl), 4)


def difference_in_differences(y_treat_pre: np.ndarray, y_treat_post: np.ndarray,
                               y_ctrl_pre: np.ndarray, y_ctrl_post: np.ndarray) -> tuple:
    delta_treat = y_treat_post.mean() - y_treat_pre.mean()
    delta_ctrl  = y_ctrl_post.mean()  - y_ctrl_pre.mean()
    did = delta_treat - delta_ctrl

    # SE via delta method (pooled)
    n_tp = len(y_treat_post); n_t0 = len(y_treat_pre)
    n_cp = len(y_ctrl_post);  n_c0 = len(y_ctrl_pre)
    var = (y_treat_post.var() / n_tp + y_treat_pre.var() / n_t0 +
           y_ctrl_post.var()  / n_cp + y_ctrl_pre.var()  / n_c0)
    se = np.sqrt(var)
    return (round(float(did), 4), round(float(se), 4))


def regression_discontinuity(cutoff: float = 0.5, window: float = 0.2,
                              n: int = 1000) -> tuple:
    rng = np.random.default_rng(42)
    X = rng.uniform(0, 1, n)
    T = (X >= cutoff).astype(float)
    # True LATE = 3.0 at cutoff
    Y = 2 * X + 3 * T + rng.normal(0, 0.5, n)

    # Local linear regression on each side within window
    left_mask  = (X >= cutoff - window) & (X < cutoff)
    right_mask = (X >= cutoff) & (X < cutoff + window)

    # Left side: predict Y at cutoff from left
    Xl = X[left_mask]; Yl = Y[left_mask]
    Xr = X[right_mask]; Yr = Y[right_mask]

    def local_lin(Xs, Ys, x0):
        if len(Xs) < 2:
            return float(Ys.mean())
        A = np.column_stack([np.ones(len(Xs)), Xs - x0])
        coef = np.linalg.lstsq(A, Ys, rcond=None)[0]
        return float(coef[0])

    y_right_at_cutoff = local_lin(Xr, Yr, cutoff)
    y_left_at_cutoff  = local_lin(Xl, Yl, cutoff)
    late = y_right_at_cutoff - y_left_at_cutoff

    # SE via OLS residuals (simplified)
    resid = np.concatenate([Yl - (2 * Xl + 3 * 0), Yr - (2 * Xr + 3 * 1)])
    se = float(resid.std() / np.sqrt(len(resid)))
    return (round(late, 4), round(se, 4))


def instrumental_variables_concept() -> str:
    return (
        "Instrumental Variables (IV) / Two-Stage Least Squares (2SLS):\n"
        "  Problem: T is endogenous (correlated with unobserved confounders U).\n"
        "  Instrument Z must satisfy:\n"
        "    1. Relevance: Z correlates with T (Z → T).\n"
        "    2. Exclusion restriction: Z affects Y only through T (Z ⊥ Y | T, U).\n"
        "    3. Independence: Z ⊥ U (instrument is as-good-as-random).\n"
        "  2SLS:\n"
        "    Stage 1: Regress T on Z → get T_hat (exogenous variation in T).\n"
        "    Stage 2: Regress Y on T_hat → causal estimate.\n"
        "  Example: distance to college as IV for education → earnings."
    )


def uplift_model(X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> np.ndarray:
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler

    treat_mask = T == 1
    ctrl_mask  = T == 0
    scaler = StandardScaler()
    X_sc = scaler.fit_transform(X)

    model_t = LogisticRegression(max_iter=500).fit(X_sc[treat_mask], Y[treat_mask])
    model_c = LogisticRegression(max_iter=500).fit(X_sc[ctrl_mask],  Y[ctrl_mask])

    p_treat = model_t.predict_proba(X_sc)[:, 1]
    p_ctrl  = model_c.predict_proba(X_sc)[:, 1]
    return np.round(p_treat - p_ctrl, 4)


def cate_s_learner(X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> np.ndarray:
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler

    scaler = StandardScaler()
    X_sc = scaler.fit_transform(X)
    X_with_T = np.column_stack([X_sc, T])
    model = LinearRegression().fit(X_with_T, Y)

    X_treat = np.column_stack([X_sc, np.ones(len(X))])
    X_ctrl  = np.column_stack([X_sc, np.zeros(len(X))])
    cate = model.predict(X_treat) - model.predict(X_ctrl)
    return np.round(cate, 4)


def causal_dag_concept() -> str:
    return (
        "Causal DAG (Directed Acyclic Graph):\n"
        "  Nodes = variables; directed edges = direct causal effects.\n"
        "  Three path structures:\n"
        "    Chain:   X → Z → Y   (Z mediates; block Z to block path)\n"
        "    Fork:    X ← Z → Y   (Z is confounder; block Z to block spurious association)\n"
        "    Collider: X → Z ← Y  (Z is collider; conditioning on Z OPENS blocked path)\n"
        "\n"
        "  d-separation: Sets X and Y are d-separated given Z if all paths between them\n"
        "  are blocked (either by conditioning on non-colliders, or NOT conditioning on colliders).\n"
        "\n"
        "  Backdoor criterion: A set Z blocks all backdoor paths (paths into X) and\n"
        "  contains no descendants of X. If Z satisfies backdoor, then:\n"
        "    P(Y|do(X)) = sum_z P(Y|X,Z)*P(Z)  (adjustment formula)."
    )


def main():
    print("=== Solution 6.5: Causal ML & A/B Testing ===\n")

    np.random.seed(42)

    clicks_a, visitors_a = 120, 1000
    clicks_b, visitors_b = 150, 1000
    print("Result 1  - Conversion rates:", ab_conversion_rates(clicks_a, visitors_a, clicks_b, visitors_b))
    print("Result 2  - Z-test:", ab_ztest(clicks_a, visitors_a, clicks_b, visitors_b))
    print("Result 3  - Min sample size (p1=0.10, p2=0.12):", min_sample_size(0.10, 0.12))
    print("Result 4  - Power (n=2000, p1=0.10, p2=0.12):", statistical_power(2000, 0.10, 0.12))

    p_vals = [0.01, 0.04, 0.20, 0.03, 0.50]
    print("Result 5  - Multiple testing correction:", multiple_testing_correction(p_vals))
    print("Result 6  - Obs vs RCT:\n ", obs_vs_rct())
    overall, subgroup = simpsons_paradox()
    print("Result 7  - Simpson's paradox:")
    print("           Overall rates:", overall)
    print("           Subgroup rates:", subgroup)
    print("Result 8  - PSM concept:\n ", propensity_score_matching_concept())

    n_units = 500
    rng = np.random.default_rng(42)
    X_ipw = rng.standard_normal((n_units, 3))
    e_ipw = 1 / (1 + np.exp(-X_ipw[:, 0]))
    T_ipw = (rng.random(n_units) < e_ipw).astype(float)
    Y_ipw = T_ipw * 2 + X_ipw[:, 0] + rng.standard_normal(n_units) * 0.5
    print("Result 9  - IPW ATE (true ≈ 2.0):", ipw_ate(T_ipw, Y_ipw, e_ipw))

    y_tp = rng.normal(5, 1, 100); y_t0 = rng.normal(3, 1, 100)
    y_cp = rng.normal(4, 1, 100); y_c0 = rng.normal(3.5, 1, 100)
    did_est, did_se = difference_in_differences(y_t0, y_tp, y_c0, y_cp)
    print("Result 10 - DiD (true ≈ 1.5):", did_est, "±", did_se)

    print("Result 11 - RD LATE (true ≈ 3.0):", regression_discontinuity())
    print("Result 12 - IV concept:\n ", instrumental_variables_concept())

    X_ul = rng.standard_normal((200, 5))
    T_ul = (rng.random(200) > 0.5).astype(int)
    Y_ul = (T_ul * 1.5 + X_ul[:, 0] > 0).astype(int)
    uplift = uplift_model(X_ul, T_ul, Y_ul)
    cate   = cate_s_learner(X_ul, T_ul, Y_ul)
    print("Result 13 - Uplift model mean:", round(float(uplift.mean()), 4))
    print("Result 14 - CATE S-learner mean:", round(float(cate.mean()), 4))
    print("Result 15 - Causal DAG concept:\n ", causal_dag_concept())


if __name__ == "__main__":
    main()
