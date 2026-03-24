# ============================================================
# Examples 1.4 — Statistics for ML (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import scipy.stats as stats
import math

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Mean, median, and mode"""
    data = np.array([2, 3, 3, 4, 5, 5, 5, 6, 7, 8], dtype=float)
    mean = data.mean()
    median = np.median(data)
    mode_val = stats.mode(data, keepdims=True).mode[0]
    print(f"Ex01 — mean={mean:.2f}, median={median:.2f}, mode={mode_val:.2f}")

def ex02():
    """Variance and standard deviation"""
    data = np.array([2, 4, 4, 4, 5, 5, 7, 9], dtype=float)
    var = data.var(ddof=1)
    std = data.std(ddof=1)
    print(f"Ex02 — variance={var:.4f}, std={std:.4f}")

def ex03():
    """Skewness"""
    np.random.seed(0)
    data = np.random.exponential(1.0, 500)
    skew = stats.skew(data)
    print(f"Ex03 — skewness={skew:.4f} (positive = right-skewed)")

def ex04():
    """Kurtosis"""
    np.random.seed(0)
    normal_data = np.random.normal(0, 1, 1000)
    heavy_data  = np.random.standard_t(3, 1000)
    kurt_normal = stats.kurtosis(normal_data)
    kurt_heavy  = stats.kurtosis(heavy_data)
    print(f"Ex04 — kurtosis: normal≈{kurt_normal:.4f}, heavy-tail≈{kurt_heavy:.4f}")

def ex05():
    """Z-score of a value"""
    data = np.array([10, 20, 30, 40, 50], dtype=float)
    x = 40.0
    z = (x - data.mean()) / data.std(ddof=1)
    print(f"Ex05 — z-score of {x}: {z:.4f}")

def ex06():
    """Percentiles: 25th, 50th, 75th, 95th"""
    np.random.seed(0)
    data = np.random.normal(100, 15, 200)
    pcts = np.percentile(data, [25, 50, 75, 95])
    print(f"Ex06 — percentiles [25,50,75,95]: {np.round(pcts, 2)}")

def ex07():
    """Range and IQR"""
    data = np.array([5, 7, 8, 10, 12, 14, 20, 25], dtype=float)
    r = data.max() - data.min()
    iqr = np.percentile(data, 75) - np.percentile(data, 25)
    print(f"Ex07 — range={r:.2f}, IQR={iqr:.2f}")

def ex08():
    """Coefficient of variation (CV)"""
    np.random.seed(1)
    data = np.random.normal(50, 10, 100)
    cv = data.std(ddof=1) / data.mean() * 100
    print(f"Ex08 — CV={cv:.2f}%")

def ex09():
    """Covariance matrix"""
    np.random.seed(0)
    X = np.random.randn(50, 3)
    cov_matrix = np.cov(X.T)
    print(f"Ex09 — covariance matrix (3x3):\n{np.round(cov_matrix, 3)}")

def ex10():
    """Correlation matrix"""
    np.random.seed(0)
    X = np.random.randn(50, 3)
    corr_matrix = np.corrcoef(X.T)
    print(f"Ex10 — correlation matrix:\n{np.round(corr_matrix, 3)}")

def ex11():
    """Pearson correlation between two arrays"""
    x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y = np.array([2.0, 4.0, 5.0, 4.0, 5.0])
    r, p = stats.pearsonr(x, y)
    print(f"Ex11 — Pearson r={r:.4f}, p={p:.4f}")

def ex12():
    """Spearman rank correlation"""
    x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y = np.array([5.0, 6.0, 7.0, 8.0, 7.0])
    rho, p = stats.spearmanr(x, y)
    print(f"Ex12 — Spearman rho={rho:.4f}, p={p:.4f}")

def ex13():
    """Point biserial correlation"""
    binary = np.array([0, 0, 1, 1, 0, 1, 1, 0, 1, 0])
    continuous = np.array([2.1, 3.5, 5.2, 4.8, 2.9, 6.1, 5.5, 3.2, 4.9, 2.7])
    r, p = stats.pointbiserialr(binary, continuous)
    print(f"Ex13 — point biserial r={r:.4f}, p={p:.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """One-sample t-test: is mean = mu0?"""
    np.random.seed(0)
    data = np.random.normal(5.5, 2.0, 30)
    t, p = stats.ttest_1samp(data, popmean=5.0)
    print(f"Ex14 — one-sample t-test: t={t:.4f}, p={p:.4f}, reject H0: {p < 0.05}")

def ex15():
    """Two-sample t-test: are means equal?"""
    np.random.seed(0)
    group1 = np.random.normal(5.0, 1.5, 30)
    group2 = np.random.normal(6.0, 1.5, 30)
    t, p = stats.ttest_ind(group1, group2)
    print(f"Ex15 — two-sample t-test: t={t:.4f}, p={p:.4f}, reject H0: {p < 0.05}")

def ex16():
    """Paired t-test (before vs after)"""
    np.random.seed(0)
    before = np.random.normal(70, 5, 20)
    after  = before + np.random.normal(3, 2, 20)
    t, p = stats.ttest_rel(before, after)
    print(f"Ex16 — paired t-test: t={t:.4f}, p={p:.4f}, reject H0: {p < 0.05}")

def ex17():
    """Mann-Whitney U test (non-parametric)"""
    np.random.seed(0)
    g1 = np.random.normal(5.0, 2.0, 30)
    g2 = np.random.normal(6.5, 2.0, 30)
    u, p = stats.mannwhitneyu(g1, g2, alternative='two-sided')
    print(f"Ex17 — Mann-Whitney U={u:.1f}, p={p:.4f}, reject H0: {p < 0.05}")

def ex18():
    """Chi-square test of independence"""
    observed = np.array([[20, 30], [15, 35]])
    chi2, p, dof, expected = stats.chi2_contingency(observed)
    print(f"Ex18 — chi-square: chi2={chi2:.4f}, p={p:.4f}, dof={dof}")

def ex19():
    """One-way ANOVA"""
    np.random.seed(0)
    g1 = np.random.normal(5.0, 1.0, 20)
    g2 = np.random.normal(6.0, 1.0, 20)
    g3 = np.random.normal(5.5, 1.0, 20)
    F, p = stats.f_oneway(g1, g2, g3)
    print(f"Ex19 — one-way ANOVA: F={F:.4f}, p={p:.4f}, reject H0: {p < 0.05}")

def ex20():
    """Kruskal-Wallis test (non-parametric ANOVA)"""
    np.random.seed(0)
    g1 = np.random.normal(5.0, 2.0, 20)
    g2 = np.random.normal(6.5, 2.0, 20)
    g3 = np.random.normal(5.5, 2.0, 20)
    H, p = stats.kruskal(g1, g2, g3)
    print(f"Ex20 — Kruskal-Wallis: H={H:.4f}, p={p:.4f}")

def ex21():
    """Shapiro-Wilk normality test"""
    np.random.seed(0)
    normal_data = np.random.normal(0, 1, 50)
    skewed_data = np.random.exponential(1.0, 50)
    W_n, p_n = stats.shapiro(normal_data)
    W_s, p_s = stats.shapiro(skewed_data)
    print(f"Ex21 — Shapiro-Wilk: normal p={p_n:.4f}, skewed p={p_s:.4f}")

def ex22():
    """Levene's test for equal variance"""
    np.random.seed(0)
    g1 = np.random.normal(0, 1.0, 30)
    g2 = np.random.normal(0, 3.0, 30)
    W, p = stats.levene(g1, g2)
    print(f"Ex22 — Levene test: W={W:.4f}, p={p:.4f}, equal var: {p >= 0.05}")

def ex23():
    """F-test for regression significance"""
    np.random.seed(0)
    n, p_vars = 50, 2
    X = np.random.randn(n, p_vars)
    beta = np.array([1.5, -0.5])
    y = X @ beta + np.random.randn(n) * 0.5
    y_hat = X @ np.linalg.lstsq(X, y, rcond=None)[0]
    SS_res = np.sum((y - y_hat)**2)
    SS_tot = np.sum((y - y.mean())**2)
    SS_reg = SS_tot - SS_res
    F = (SS_reg / p_vars) / (SS_res / (n - p_vars - 1))
    p_val = 1 - stats.f.cdf(F, p_vars, n - p_vars - 1)
    print(f"Ex23 — F-test for regression: F={F:.4f}, p={p_val:.6f}")

def ex24():
    """Confidence interval for mean (t-distribution)"""
    np.random.seed(0)
    data = np.random.normal(10.0, 3.0, 25)
    n = len(data)
    t_crit = stats.t.ppf(0.975, df=n-1)
    se = data.std(ddof=1) / math.sqrt(n)
    ci = (data.mean() - t_crit * se, data.mean() + t_crit * se)
    print(f"Ex24 — 95% CI: ({ci[0]:.4f}, {ci[1]:.4f}), mean={data.mean():.4f}")

def ex25():
    """Bootstrap confidence interval"""
    np.random.seed(0)
    data = np.random.normal(5.0, 2.0, 40)
    n_boot = 2000
    boot_means = np.array([np.random.choice(data, len(data), replace=True).mean()
                           for _ in range(n_boot)])
    ci = np.percentile(boot_means, [2.5, 97.5])
    print(f"Ex25 — bootstrap 95% CI: ({ci[0]:.4f}, {ci[1]:.4f})")

def ex26():
    """P-value interpretation demo"""
    np.random.seed(0)
    null_stats = np.array([stats.ttest_1samp(np.random.normal(0, 1, 30), 0).statistic
                           for _ in range(10000)])
    pvals = 2 * (1 - stats.t.cdf(np.abs(null_stats), df=29))
    fp_rate = (pvals < 0.05).mean()
    print(f"Ex26 — under null H0: false positive rate={fp_rate:.4f} (expected≈0.05)")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """StatisticalTestSuite class"""
    class StatisticalTestSuite:
        def __init__(self, alpha=0.05):
            self.alpha = alpha
        def normality(self, data):
            _, p = stats.shapiro(data)
            return {"test": "Shapiro-Wilk", "p": round(p, 4), "normal": p >= self.alpha}
        def two_sample(self, g1, g2):
            _, p = stats.ttest_ind(g1, g2)
            return {"test": "t-test", "p": round(p, 4), "different": p < self.alpha}
    np.random.seed(0)
    suite = StatisticalTestSuite()
    d = np.random.normal(0, 1, 50)
    print(f"Ex27 — normality: {suite.normality(d)}")
    print(f"       two-sample: {suite.two_sample(np.random.normal(0,1,30), np.random.normal(1,1,30))}")

def ex28():
    """Effect size calculations: Cohen's d, r, eta²"""
    np.random.seed(0)
    g1 = np.random.normal(5.0, 1.5, 40)
    g2 = np.random.normal(6.5, 1.5, 40)
    pooled_std = math.sqrt(((len(g1)-1)*g1.var(ddof=1) + (len(g2)-1)*g2.var(ddof=1))
                           / (len(g1)+len(g2)-2))
    cohens_d = (g2.mean() - g1.mean()) / pooled_std
    t_stat, _ = stats.ttest_ind(g1, g2)
    n1, n2 = len(g1), len(g2)
    r = math.sqrt(t_stat**2 / (t_stat**2 + n1 + n2 - 2))
    all_data = np.concatenate([g1, g2])
    grand_mean = all_data.mean()
    SS_between = n1*(g1.mean()-grand_mean)**2 + n2*(g2.mean()-grand_mean)**2
    SS_total   = np.sum((all_data - grand_mean)**2)
    eta2 = SS_between / SS_total
    print(f"Ex28 — Cohen's d={cohens_d:.4f}, r={r:.4f}, eta²={eta2:.4f}")

def ex29():
    """Statistical power analysis (t-test)"""
    from scipy.stats import norm as z_dist
    alpha, d, n = 0.05, 0.5, 40
    z_alpha = z_dist.ppf(1 - alpha / 2)
    z_beta  = d * math.sqrt(n) - z_alpha
    power = z_dist.cdf(z_beta)
    print(f"Ex29 — power (d={d}, n={n}, alpha={alpha}): {power:.4f}")

def ex30():
    """Sample size calculator for t-test"""
    def sample_size_ttest(d, alpha=0.05, power=0.80):
        z_a = stats.norm.ppf(1 - alpha / 2)
        z_b = stats.norm.ppf(power)
        return math.ceil(2 * ((z_a + z_b) / d)**2)
    for d_val in [0.2, 0.5, 0.8]:
        n = sample_size_ttest(d_val)
        print(f"Ex30 — n for d={d_val}: {n}")

def ex31():
    """Multiple testing correction: Bonferroni and FDR (Benjamini-Hochberg)"""
    np.random.seed(0)
    pvals = np.array([0.001, 0.01, 0.03, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9])
    m = len(pvals)
    bonferroni = pvals * m
    # BH procedure
    sorted_idx = np.argsort(pvals)
    sorted_p   = pvals[sorted_idx]
    bh_thresh  = (np.arange(1, m+1) / m) * 0.05
    bh_reject  = sorted_p <= bh_thresh
    last_reject = np.where(bh_reject)[0]
    n_rejected_bh = last_reject[-1] + 1 if len(last_reject) else 0
    print(f"Ex31 — Bonferroni rejected: {(bonferroni < 0.05).sum()}, BH rejected: {n_rejected_bh}")

def ex32():
    """A/B test class using z-test for proportions"""
    class ABTest:
        def __init__(self, alpha=0.05):
            self.alpha = alpha
        def run(self, conv_a, n_a, conv_b, n_b):
            p_a, p_b = conv_a / n_a, conv_b / n_b
            p_pool = (conv_a + conv_b) / (n_a + n_b)
            se = math.sqrt(p_pool * (1 - p_pool) * (1/n_a + 1/n_b))
            z = (p_b - p_a) / se
            p_val = 2 * (1 - stats.norm.cdf(abs(z)))
            return {"p_a": round(p_a, 4), "p_b": round(p_b, 4),
                    "z": round(z, 4), "p_value": round(p_val, 4),
                    "significant": p_val < self.alpha}
    ab = ABTest()
    result = ab.run(conv_a=200, n_a=1000, conv_b=240, n_b=1000)
    print(f"Ex32 — A/B test: {result}")

def ex33():
    """Bayesian A/B test class (Beta-Binomial)"""
    class BayesianABTest:
        def __init__(self, a0=1.0, b0=1.0):
            self.a0, self.b0 = a0, b0
        def run(self, conv_a, n_a, conv_b, n_b, n_samples=20000):
            np.random.seed(0)
            alpha_a = self.a0 + conv_a
            beta_a  = self.b0 + (n_a - conv_a)
            alpha_b = self.a0 + conv_b
            beta_b  = self.b0 + (n_b - conv_b)
            samples_a = np.random.beta(alpha_a, beta_a, n_samples)
            samples_b = np.random.beta(alpha_b, beta_b, n_samples)
            prob_b_better = (samples_b > samples_a).mean()
            return {"prob_B_wins": round(prob_b_better, 4)}
    bab = BayesianABTest()
    result = bab.run(conv_a=200, n_a=1000, conv_b=240, n_b=1000)
    print(f"Ex33 — Bayesian A/B: {result}")

def ex34():
    """Regression inference: t-test for coefficients"""
    np.random.seed(0)
    n = 50
    x = np.random.randn(n)
    y = 2.5 * x + np.random.randn(n) * 0.5
    X = np.column_stack([np.ones(n), x])
    beta_hat = np.linalg.lstsq(X, y, rcond=None)[0]
    y_hat = X @ beta_hat
    s2 = np.sum((y - y_hat)**2) / (n - 2)
    XtX_inv = np.linalg.inv(X.T @ X)
    se_beta = np.sqrt(s2 * np.diag(XtX_inv))
    t_stats = beta_hat / se_beta
    p_vals = 2 * (1 - stats.t.cdf(np.abs(t_stats), df=n-2))
    print(f"Ex34 — regression: beta={np.round(beta_hat,4)}, t={np.round(t_stats,4)}, p={np.round(p_vals,4)}")

def ex35():
    """Full hypothesis testing pipeline"""
    np.random.seed(0)
    control = np.random.normal(100, 15, 50)
    treatment = np.random.normal(108, 15, 50)
    # Step 1: normality check
    _, p_norm = stats.shapiro(control)
    # Step 2: equal variance check
    _, p_lev = stats.levene(control, treatment)
    # Step 3: choose test
    equal_var = p_lev >= 0.05
    t, p = stats.ttest_ind(control, treatment, equal_var=equal_var)
    # Step 4: effect size
    pool_std = math.sqrt((control.var(ddof=1) + treatment.var(ddof=1)) / 2)
    d = (treatment.mean() - control.mean()) / pool_std
    print(f"Ex35 — pipeline: normal p={p_norm:.3f}, levene p={p_lev:.3f}, "
          f"t={t:.4f}, p={p:.4f}, d={d:.4f}")

def ex36():
    """Permutation test class"""
    class PermutationTest:
        def __init__(self, n_perm=2000):
            self.n_perm = n_perm
        def run(self, g1, g2, seed=0):
            np.random.seed(seed)
            obs = g2.mean() - g1.mean()
            combined = np.concatenate([g1, g2])
            n1 = len(g1)
            diffs = np.array([
                (lambda p: p[:n1].mean() - p[n1:].mean())(np.random.permutation(combined))
                for _ in range(self.n_perm)])
            p_val = (np.abs(diffs) >= np.abs(obs)).mean()
            return {"obs_diff": round(obs, 4), "p_value": round(p_val, 4)}
    np.random.seed(0)
    g1 = np.random.normal(0, 1, 30)
    g2 = np.random.normal(0.6, 1, 30)
    pt = PermutationTest(n_perm=2000)
    print(f"Ex36 — permutation test: {pt.run(g1, g2)}")

def ex37():
    """Meta-analysis concept: combine effect sizes (inverse-variance weighting)"""
    # Study effect sizes and their variances
    effects = np.array([0.4, 0.6, 0.3, 0.5, 0.7])
    variances = np.array([0.04, 0.02, 0.08, 0.03, 0.05])
    weights = 1.0 / variances
    pooled_effect = np.sum(weights * effects) / np.sum(weights)
    pooled_se = math.sqrt(1.0 / np.sum(weights))
    z = pooled_effect / pooled_se
    p = 2 * (1 - stats.norm.cdf(abs(z)))
    print(f"Ex37 — meta-analysis: pooled d={pooled_effect:.4f}, SE={pooled_se:.4f}, p={p:.6f}")

def ex38():
    """Experimental design planner (required sample size per arm)"""
    def design_experiment(baseline_rate, mde, alpha=0.05, power=0.80):
        z_a = stats.norm.ppf(1 - alpha / 2)
        z_b = stats.norm.ppf(power)
        p1 = baseline_rate
        p2 = baseline_rate + mde
        n = ((z_a * math.sqrt(2 * p1 * (1 - p1)) +
              z_b * math.sqrt(p1*(1-p1) + p2*(1-p2))) / mde)**2
        return math.ceil(n)
    for mde in [0.01, 0.02, 0.05]:
        n = design_experiment(baseline_rate=0.10, mde=mde)
        print(f"Ex38 — n per arm (baseline=10%, MDE={mde*100:.0f}%): {n}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Sequential A/B testing: always-valid p-value concept"""
    np.random.seed(0)
    n_max = 200
    conv_a = np.random.binomial(1, 0.10, n_max)
    conv_b = np.random.binomial(1, 0.12, n_max)
    # mSPRT: mixture sequential probability ratio test (simplified)
    cumulative_pvals = []
    for n in range(10, n_max, 10):
        ca, nb_c = conv_a[:n].sum(), n
        cb, nb_t = conv_b[:n].sum(), n
        if ca == 0 or cb == 0:
            continue
        _, p = stats.fisher_exact([[ca, n-ca], [cb, n-cb]])
        cumulative_pvals.append((n, round(p, 4)))
    print(f"Ex39 — sequential A/B p-values (every 10 obs): {cumulative_pvals[:5]}")

def ex40():
    """Causal inference: Simpson's paradox illustration"""
    # Treatment effect reverses when conditioning on subgroup
    # Combined: treatment worse; within each subgroup: treatment better
    # Subgroup A: mild cases
    conv_treat_A = 200 / 270    # 74%
    conv_ctrl_A  = 10 / 30      # 33%
    # Subgroup B: severe cases
    conv_treat_B = 10 / 30      # 33%
    conv_ctrl_B  = 50 / 270     # 19%
    # Marginal
    conv_treat_all = 210 / 300  # 70%
    conv_ctrl_all  = 60 / 300   # 20%
    print(f"Ex40 — Simpson's paradox:")
    print(f"  Marginal: treat={conv_treat_all:.2f} vs ctrl={conv_ctrl_all:.2f} (treat better)")
    print(f"  Subgroup A: treat={conv_treat_A:.2f} vs ctrl={conv_ctrl_A:.2f} (treat better)")
    print(f"  Subgroup B: treat={conv_treat_B:.2f} vs ctrl={conv_ctrl_B:.2f} (treat better)")

def ex41():
    """Propensity score analysis concept"""
    np.random.seed(0)
    n = 200
    confounder = np.random.randn(n)
    # Propensity score: P(treatment | confounder)
    log_odds = 0.5 * confounder
    propensity = 1 / (1 + np.exp(-log_odds))
    treatment = np.random.binomial(1, propensity)
    outcome = 2.0 * treatment + confounder + np.random.randn(n) * 0.5
    # Stratify by propensity quintile and estimate ATE
    quintiles = np.percentile(propensity, [0, 20, 40, 60, 80, 100])
    ates = []
    for i in range(5):
        mask = (propensity >= quintiles[i]) & (propensity < quintiles[i+1])
        if mask.sum() > 0 and treatment[mask].sum() > 0 and (1-treatment[mask]).sum() > 0:
            ates.append(outcome[mask & (treatment==1)].mean() - outcome[mask & (treatment==0)].mean())
    ate = np.mean(ates)
    print(f"Ex41 — propensity score ATE estimate={ate:.4f} (true=2.0)")

def ex42():
    """Survival analysis: Kaplan-Meier concept"""
    np.random.seed(0)
    n = 30
    times = np.random.exponential(10, n)
    censored = np.random.binomial(1, 0.8, n)  # 1 = event observed
    times_sorted = np.sort(times)
    # Simple KM estimator
    S = 1.0
    km_points = [(0, 1.0)]
    at_risk = n
    for t, c in sorted(zip(times, censored), key=lambda x: x[0]):
        if c == 1:
            S *= (1 - 1 / at_risk)
            km_points.append((round(t, 2), round(S, 4)))
        at_risk -= 1
    print(f"Ex42 — KM survival at t=0,first_event,last_event: {km_points[0]}, {km_points[1]}, {km_points[-1]}")

def ex43():
    """Time-to-event statistics: log-rank test concept"""
    np.random.seed(0)
    group1_times = np.random.exponential(8, 30)
    group2_times = np.random.exponential(12, 30)
    event1 = np.ones(30, dtype=int)
    event2 = np.ones(30, dtype=int)
    # Compare median survival
    med1 = np.percentile(group1_times, 50)
    med2 = np.percentile(group2_times, 50)
    # Approximate log-rank using Wilcoxon on times
    U, p = stats.mannwhitneyu(group1_times, group2_times, alternative='two-sided')
    print(f"Ex43 — survival: median1={med1:.4f}, median2={med2:.4f}, Mann-Whitney p={p:.4f}")

def ex44():
    """Rank-based tests comparison"""
    np.random.seed(0)
    g1 = np.random.exponential(1.0, 30)
    g2 = np.random.exponential(1.5, 30)
    _, p_mw    = stats.mannwhitneyu(g1, g2, alternative='two-sided')
    _, p_wil   = stats.wilcoxon(g1[:len(g2)], g2[:len(g1)])
    _, p_ks    = stats.ks_2samp(g1, g2)
    print(f"Ex44 — rank tests: Mann-Whitney p={p_mw:.4f}, Wilcoxon p={p_wil:.4f}, KS p={p_ks:.4f}")

def ex45():
    """Hotelling's T² test (multivariate two-sample)"""
    np.random.seed(0)
    n, p = 30, 2
    g1 = np.random.multivariate_normal([0, 0], np.eye(p), n)
    g2 = np.random.multivariate_normal([0.5, 0.5], np.eye(p), n)
    diff = g2.mean(axis=0) - g1.mean(axis=0)
    S_pool = (np.cov(g1.T) * (n-1) + np.cov(g2.T) * (n-1)) / (2*n - 2)
    T2 = (n/2) * diff @ np.linalg.inv(S_pool) @ diff
    # Convert T² to F statistic
    F = T2 * (2*n - p - 1) / (p * (2*n - 2))
    p_val = 1 - stats.f.cdf(F, p, 2*n - p - 1)
    print(f"Ex45 — Hotelling T²={T2:.4f}, F={F:.4f}, p={p_val:.4f}")

def ex46():
    """Structural equation modeling concept (path coefficients)"""
    np.random.seed(0)
    n = 200
    X = np.random.randn(n)
    M = 0.6 * X + np.random.randn(n) * 0.5    # mediator
    Y = 0.4 * M + 0.2 * X + np.random.randn(n) * 0.5  # outcome
    # Estimate path coefficients via OLS
    b_XM = np.polyfit(X, M, 1)[0]
    X_mat = np.column_stack([np.ones(n), M, X])
    coefs = np.linalg.lstsq(X_mat, Y, rcond=None)[0]
    b_MY, b_XY_direct = coefs[1], coefs[2]
    indirect = b_XM * b_MY
    print(f"Ex46 — SEM paths: X→M={b_XM:.4f}, M→Y={b_MY:.4f}, "
          f"X→Y(direct)={b_XY_direct:.4f}, indirect={indirect:.4f}")

def ex47():
    """Bayesian hypothesis testing: Bayes factor (BF10)"""
    np.random.seed(0)
    data = np.random.normal(0.5, 1.0, 30)
    n = len(data)
    x_bar = data.mean()
    # BF10 for H1: mu ~ N(0,1) vs H0: mu=0 (analytical for known sigma=1)
    # BF10 = sqrt(n+1) * exp(-n^2 * x_bar^2 / (2*(n+1)))
    sigma = 1.0
    se = sigma / math.sqrt(n)
    z = x_bar / se
    # Approximate Savage-Dickey BF
    prior_ord = stats.norm.pdf(0, 0, 1)      # p(mu=0 | H1)
    post_mean = n * x_bar / (n + 1)           # posterior mean (unit prior)
    post_std  = math.sqrt(1 / (n + 1))
    post_ord  = stats.norm.pdf(0, post_mean, post_std)
    BF10 = prior_ord / post_ord
    print(f"Ex47 — Bayes factor BF10={BF10:.4f} ({'evidence for H1' if BF10>1 else 'evidence for H0'})")

def ex48():
    """Jackknife resampling"""
    np.random.seed(0)
    data = np.random.normal(5.0, 2.0, 30)
    n = len(data)
    jack_means = np.array([np.delete(data, i).mean() for i in range(n)])
    jack_mean  = jack_means.mean()
    jack_se    = math.sqrt((n - 1) / n * np.sum((jack_means - jack_mean)**2))
    print(f"Ex48 — jackknife: mean={data.mean():.4f}, SE={jack_se:.4f}")

def ex49():
    """Delta method for variance estimation"""
    np.random.seed(0)
    data = np.random.exponential(2.0, 100)
    mu_hat = data.mean()
    var_mu = data.var(ddof=1) / len(data)
    # g(mu) = 1/mu (reciprocal), g'(mu) = -1/mu^2
    g_prime = -1.0 / mu_hat**2
    var_g = g_prime**2 * var_mu
    se_g = math.sqrt(var_g)
    g_est = 1.0 / mu_hat
    print(f"Ex49 — delta method: g(mu)=1/mu={g_est:.4f}, SE(g)={se_g:.4f}")

def ex50():
    """Production statistics monitoring (control chart / drift detection)"""
    np.random.seed(0)
    n_baseline = 100
    baseline = np.random.normal(50, 5, n_baseline)
    mu0, sigma0 = baseline.mean(), baseline.std(ddof=1)
    # Simulate production stream: drift at step 30
    production = np.concatenate([
        np.random.normal(50, 5, 30),
        np.random.normal(55, 5, 20)   # mean shift
    ])
    # CUSUM detector
    k, h = 0.5 * sigma0, 5 * sigma0
    C_pos, C_neg = 0.0, 0.0
    alert_idx = None
    for i, x in enumerate(production):
        C_pos = max(0, C_pos + (x - mu0) - k)
        C_neg = max(0, C_neg - (x - mu0) - k)
        if C_pos > h or C_neg > h:
            alert_idx = i
            break
    print(f"Ex50 — CUSUM drift detection: alert at index={alert_idx} "
          f"(drift injected at index=30), mu0={mu0:.2f}, sigma0={sigma0:.2f}")

def main():
    print("=" * 60)
    print("Examples 1.4 — Statistics for ML")
    print("=" * 60)
    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
