# ============================================================
# Examples 6.5 — Causal ML & A/B Testing (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from scipy import stats

np.random.seed(42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Compute conversion rates for two groups"""
    clicks_a, visitors_a = 120, 1000
    clicks_b, visitors_b = 150, 1000
    rate_a = clicks_a / visitors_a
    rate_b = clicks_b / visitors_b
    lift   = (rate_b - rate_a) / rate_a * 100
    print("Ex01 — Rate A:", round(rate_a, 4), "| Rate B:", round(rate_b, 4),
          "| Lift:", round(lift, 2), "%")

def ex02():
    """Two-proportion Z-test for A/B comparison"""
    clicks_a, visitors_a = 120, 1000
    clicks_b, visitors_b = 150, 1000
    p_a = clicks_a / visitors_a; p_b = clicks_b / visitors_b
    p_pool = (clicks_a + clicks_b) / (visitors_a + visitors_b)
    se = np.sqrt(p_pool * (1 - p_pool) * (1/visitors_a + 1/visitors_b))
    z = (p_b - p_a) / se
    p_val = 2 * (1 - stats.norm.cdf(abs(z)))
    print("Ex02 — Z:", round(float(z), 4), "| p-value:", round(float(p_val), 4),
          "| significant:", p_val < 0.05)

def ex03():
    """Minimum sample size calculation"""
    p1, p2, alpha, power = 0.10, 0.12, 0.05, 0.80
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta  = stats.norm.ppf(power)
    n = (z_alpha + z_beta)**2 * (p1*(1-p1) + p2*(1-p2)) / (p1 - p2)**2
    print("Ex03 — min sample size per group:", int(np.ceil(n)))

def ex04():
    """Statistical power for given sample size"""
    n, p1, p2, alpha = 2000, 0.10, 0.12, 0.05
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    p_pool  = (p1 + p2) / 2
    se_null = np.sqrt(2 * p_pool * (1 - p_pool) / n)
    se_alt  = np.sqrt((p1*(1-p1) + p2*(1-p2)) / n)
    z_power = (abs(p2 - p1) - z_alpha * se_null) / se_alt
    power   = float(stats.norm.cdf(z_power))
    print("Ex04 — power (n=2000):", round(power, 4))

def ex05():
    """One-sample t-test: did revenue increase?"""
    rng = np.random.default_rng(42)
    revenues = rng.normal(105, 20, 100)  # true mean ~ 105
    t, p = stats.ttest_1samp(revenues, popmean=100)
    print("Ex05 — t:", round(float(t), 4), "| p:", round(float(p), 4),
          "| mean:", round(float(revenues.mean()), 4))

def ex06():
    """Two-sample t-test: A vs B revenue"""
    rng = np.random.default_rng(42)
    rev_a = rng.normal(100, 20, 200)
    rev_b = rng.normal(108, 20, 200)
    t, p = stats.ttest_ind(rev_a, rev_b)
    print("Ex06 — A mean:", round(float(rev_a.mean()), 4),
          "| B mean:", round(float(rev_b.mean()), 4),
          "| p:", round(float(p), 4))

def ex07():
    """Cohen's d effect size"""
    rng = np.random.default_rng(42)
    a = rng.normal(100, 20, 200)
    b = rng.normal(108, 20, 200)
    d = (b.mean() - a.mean()) / np.sqrt((a.std()**2 + b.std()**2) / 2)
    magnitude = "small" if abs(d) < 0.5 else ("medium" if abs(d) < 0.8 else "large")
    print("Ex07 — Cohen's d:", round(float(d), 4), "| magnitude:", magnitude)

def ex08():
    """Bonferroni correction for multiple tests"""
    p_values = [0.01, 0.04, 0.20, 0.03, 0.50]
    alpha    = 0.05
    alpha_bonf = alpha / len(p_values)
    rejected = [i for i, p in enumerate(p_values) if p <= alpha_bonf]
    print("Ex08 — Bonferroni alpha:", round(alpha_bonf, 4),
          "| rejected indices:", rejected)

def ex09():
    """Benjamini-Hochberg FDR correction"""
    p_vals = np.array([0.01, 0.04, 0.20, 0.03, 0.50])
    m      = len(p_vals)
    alpha  = 0.05
    order  = np.argsort(p_vals)
    bh_thresh = (np.arange(1, m+1) / m) * alpha
    rejected = order[p_vals[order] <= bh_thresh].tolist()
    print("Ex09 — BH-FDR rejected:", sorted(rejected))

def ex10():
    """Simple randomisation check: covariate balance"""
    rng = np.random.default_rng(42)
    n = 200
    treatment = rng.integers(0, 2, n)
    age = rng.normal(35, 10, n) + treatment * 0.5  # slight imbalance
    t, p = stats.ttest_ind(age[treatment==0], age[treatment==1])
    balanced = p > 0.05
    print("Ex10 — age balance: t=", round(float(t),4), "| p=", round(float(p),4),
          "| balanced:", balanced)

def ex11():
    """Difference in means (ATE)"""
    rng = np.random.default_rng(42)
    n = 500
    T = rng.integers(0, 2, n)
    Y = 2.0 * T + rng.normal(0, 1, n)
    ate = Y[T==1].mean() - Y[T==0].mean()
    print("Ex11 — naive ATE (true≈2.0):", round(float(ate), 4))

def ex12():
    """Observational study vs RCT"""
    print("Ex12 — RCT vs Observational Study:")
    print("  RCT: treatment randomly assigned → groups comparable on all confounders.")
    print("  Obs: treatment self-selected → confounders may differ between groups.")
    print("  Causal claim from obs study requires: no unmeasured confounders (ignorability).")
    print("  Methods to address confounding: PSM, IPW, DiD, IV, RD.")

def ex13():
    """Simpson's paradox example"""
    # Group A: applies to hard depts; Group B: applies to easy depts
    male_overall   = 512 / 825    # ~62%
    female_overall = 89  / 108    # ~82%
    print("Ex13 — Simpson's paradox:")
    print("  Overall male acceptance:", round(male_overall, 3))
    print("  Overall female acceptance:", round(female_overall, 3))
    print("  But within each department, males have lower or equal rates!")
    print("  Cause: females applied to more competitive departments.")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """IPW: Inverse Probability Weighting ATE estimator"""
    rng = np.random.default_rng(42)
    n = 500
    X = rng.standard_normal((n, 3))
    e = 1 / (1 + np.exp(-X[:, 0]))  # propensity score
    T = (rng.random(n) < e).astype(float)
    Y = 2.0 * T + X[:, 0] + rng.normal(0, 0.5, n)
    # Horvitz-Thompson
    ate = np.mean(T * Y / np.clip(e, 1e-6, 1-1e-6)) - \
          np.mean((1-T) * Y / np.clip(1-e, 1e-6, 1-1e-6))
    print("Ex14 — IPW ATE (true≈2.0):", round(float(ate), 4))

def ex15():
    """Propensity score estimation via logistic regression"""
    from sklearn.linear_model import LogisticRegression
    rng = np.random.default_rng(42)
    n = 500
    X = rng.standard_normal((n, 3))
    e_true = 1 / (1 + np.exp(-X[:, 0]))
    T = (rng.random(n) < e_true).astype(int)
    lr = LogisticRegression().fit(X, T)
    e_est = lr.predict_proba(X)[:, 1]
    corr = float(np.corrcoef(e_true, e_est)[0, 1])
    print("Ex15 — propensity score correlation (est vs true):", round(corr, 4))

def ex16():
    """Difference-in-Differences (DiD)"""
    rng = np.random.default_rng(42)
    y_treat_pre  = rng.normal(3, 1, 100)
    y_treat_post = rng.normal(5, 1, 100)
    y_ctrl_pre   = rng.normal(3.5, 1, 100)
    y_ctrl_post  = rng.normal(4, 1, 100)
    delta_treat = y_treat_post.mean() - y_treat_pre.mean()
    delta_ctrl  = y_ctrl_post.mean()  - y_ctrl_pre.mean()
    did = delta_treat - delta_ctrl
    print("Ex16 — DiD (true≈1.5):", round(float(did), 4))

def ex17():
    """Regression Discontinuity Design"""
    rng = np.random.default_rng(42)
    n = 1000
    X = rng.uniform(0, 1, n)
    T = (X >= 0.5).astype(float)
    Y = 2*X + 3*T + rng.normal(0, 0.5, n)  # true LATE=3
    window = 0.15
    left  = (X >= 0.5-window) & (X < 0.5)
    right = (X >= 0.5) & (X < 0.5+window)
    def local_lin(Xs, Ys, x0):
        A = np.column_stack([np.ones(len(Xs)), Xs-x0])
        return float(np.linalg.lstsq(A, Ys, rcond=None)[0][0])
    late = local_lin(X[right], Y[right], 0.5) - local_lin(X[left], Y[left], 0.5)
    print("Ex17 — RD LATE (true≈3.0):", round(float(late), 4))

def ex18():
    """Instrumental Variables (IV) concept"""
    print("Ex18 — IV / Two-Stage Least Squares (2SLS):")
    print("  Problem: T is endogenous (correlated with unobserved U).")
    print("  Instrument Z must satisfy:")
    print("    1. Relevance: Cov(Z, T) ≠ 0.")
    print("    2. Exclusion: Z affects Y only through T.")
    print("    3. Independence: Z ⊥ U.")
    print("  2SLS: Stage 1: regress T on Z → T_hat.")
    print("        Stage 2: regress Y on T_hat → causal estimate of T on Y.")
    print("  Example: distance to college (Z) → education (T) → earnings (Y).")

def ex19():
    """S-learner CATE estimation"""
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(42)
    n = 300
    X = rng.standard_normal((n, 5))
    T = rng.integers(0, 2, n).astype(float)
    Y = (T * 1.5 + X[:, 0] + rng.normal(0, 0.3, n))
    sc = StandardScaler(); X_sc = sc.fit_transform(X)
    model = LinearRegression().fit(np.column_stack([X_sc, T]), Y)
    cate = model.predict(np.column_stack([X_sc, np.ones(n)])) - \
           model.predict(np.column_stack([X_sc, np.zeros(n)]))
    print("Ex19 — S-learner CATE mean:", round(float(cate.mean()), 4),
          "| std:", round(float(cate.std()), 4))

def ex20():
    """T-learner CATE estimation"""
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(42)
    n = 300
    X = rng.standard_normal((n, 5))
    T = rng.integers(0, 2, n).astype(int)
    Y = (T * 1.5 + X[:, 0] + rng.normal(0, 0.3, n))
    sc = StandardScaler(); X_sc = sc.fit_transform(X)
    m1 = LinearRegression().fit(X_sc[T==1], Y[T==1])
    m0 = LinearRegression().fit(X_sc[T==0], Y[T==0])
    cate = m1.predict(X_sc) - m0.predict(X_sc)
    print("Ex20 — T-learner CATE mean:", round(float(cate.mean()), 4))

def ex21():
    """Uplift modeling: T-learner for treatment targeting"""
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(42)
    n = 400
    X = rng.standard_normal((n, 5))
    T = rng.integers(0, 2, n).astype(int)
    Y = ((T * 1.5 + X[:, 0]) > 0).astype(int)
    sc = StandardScaler(); X_sc = sc.fit_transform(X)
    m1 = LogisticRegression(max_iter=500).fit(X_sc[T==1], Y[T==1])
    m0 = LogisticRegression(max_iter=500).fit(X_sc[T==0], Y[T==0])
    uplift = m1.predict_proba(X_sc)[:, 1] - m0.predict_proba(X_sc)[:, 1]
    print("Ex21 — uplift mean:", round(float(uplift.mean()), 4),
          "| high-uplift fraction (>0.2):", round(float((uplift > 0.2).mean()), 4))

def ex22():
    """Causal DAG: identify confounders"""
    print("Ex22 — Causal DAG concepts:")
    print("  Chain:    X → Z → Y      (Z mediates; block Z to isolate X→Y)")
    print("  Fork:     X ← Z → Y      (Z is confounder; condition on Z to block spurious)")
    print("  Collider: X → Z ← Y      (conditioning on Z OPENS blocked path)")
    print("  d-separation: X ⊥ Y | Z if all paths blocked.")
    print("  Backdoor criterion: Z blocks all backdoor paths into X and has no X descendants.")
    print("  Adjustment: P(Y|do(X)) = ∑_z P(Y|X,Z)*P(Z).")

def ex23():
    """Propensity score matching"""
    from sklearn.linear_model import LogisticRegression
    rng = np.random.default_rng(42)
    n = 300
    X = rng.standard_normal((n, 3))
    e = 1 / (1 + np.exp(-X[:, 0]))
    T = (rng.random(n) < e).astype(int)
    Y = 2.0 * T + X[:, 0] + rng.normal(0, 0.5, n)
    lr = LogisticRegression().fit(X, T)
    ps = lr.predict_proba(X)[:, 1]
    treated  = np.where(T == 1)[0]
    control  = np.where(T == 0)[0]
    matched_ctrl = []
    for i in treated:
        dists = np.abs(ps[control] - ps[i])
        matched_ctrl.append(control[np.argmin(dists)])
    att = Y[treated].mean() - Y[np.array(matched_ctrl)].mean()
    print("Ex23 — PSM ATT (true≈2.0):", round(float(att), 4))

def ex24():
    """Parallel trends assumption (DiD check)"""
    rng = np.random.default_rng(42)
    # Pre-treatment: both groups should trend similarly
    t_pre   = np.array([1, 2, 3, 4])  # time points before treatment
    treat_t = rng.normal(10 + 1.5 * t_pre, 1)
    ctrl_t  = rng.normal(8 + 1.5 * t_pre, 1)  # same trend = parallel
    # Check: difference in trends
    trend_treat = np.polyfit(t_pre, treat_t, 1)[0]
    trend_ctrl  = np.polyfit(t_pre, ctrl_t,  1)[0]
    parallel = abs(trend_treat - trend_ctrl) < 0.5
    print("Ex24 — trend treat:", round(float(trend_treat), 4),
          "| trend ctrl:", round(float(trend_ctrl), 4),
          "| parallel:", parallel)

def ex25():
    """Regression DiD with OLS"""
    rng = np.random.default_rng(42)
    n_per = 100
    # Panel: 4 groups
    Y_tp = rng.normal(5, 1, n_per)  # treated post
    Y_t0 = rng.normal(3, 1, n_per)  # treated pre
    Y_cp = rng.normal(4, 1, n_per)  # control post
    Y_c0 = rng.normal(3.5, 1, n_per)  # control pre
    Y = np.concatenate([Y_t0, Y_tp, Y_c0, Y_cp])
    treat = np.concatenate([np.ones(n_per), np.ones(n_per), np.zeros(n_per), np.zeros(n_per)])
    post  = np.concatenate([np.zeros(n_per), np.ones(n_per), np.zeros(n_per), np.ones(n_per)])
    interact = treat * post
    X = np.column_stack([np.ones(4*n_per), treat, post, interact])
    coeffs = np.linalg.lstsq(X, Y, rcond=None)[0]
    print("Ex25 — OLS DiD coefficient (true≈1.5):", round(float(coeffs[3]), 4))

def ex26():
    """Sensitivity analysis: E-value for unmeasured confounding"""
    rr = 1.5  # observed relative risk
    # E-value: minimum confounding strength to explain away the effect
    e_value = rr + np.sqrt(rr * (rr - 1))
    print("Ex26 — Observed RR:", rr)
    print("       E-value:", round(float(e_value), 4))
    print("       Interpretation: confounder must have RR ≥", round(float(e_value), 4),
          "with both treatment and outcome to explain away the effect.")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """ABTestFramework class"""
    class ABTestFramework:
        def __init__(self, alpha=0.05, power=0.80):
            self.alpha = alpha; self.power = power
        def min_sample_size(self, p1, p2):
            z_a = stats.norm.ppf(1 - self.alpha/2)
            z_b = stats.norm.ppf(self.power)
            n = (z_a+z_b)**2*(p1*(1-p1)+p2*(1-p2))/(p1-p2)**2
            return int(np.ceil(n))
        def run_test(self, clicks_a, n_a, clicks_b, n_b):
            p_a = clicks_a/n_a; p_b = clicks_b/n_b
            p_pool = (clicks_a+clicks_b)/(n_a+n_b)
            se = np.sqrt(p_pool*(1-p_pool)*(1/n_a+1/n_b))
            z  = (p_b-p_a)/se
            p  = 2*(1-stats.norm.cdf(abs(z)))
            return {"z": round(float(z),4), "p_value": round(float(p),4),
                    "significant": p < self.alpha,
                    "lift_pct": round((p_b-p_a)/p_a*100, 2)}
    fw = ABTestFramework(alpha=0.05, power=0.80)
    print("Ex27 — min sample (p1=0.10, p2=0.12):", fw.min_sample_size(0.10, 0.12))
    print("       test result:", fw.run_test(120, 1000, 150, 1000))

def ex28():
    """CausalEstimator class: DiD, RD, IPW"""
    class CausalEstimator:
        @staticmethod
        def did(y_tp, y_t0, y_cp, y_c0):
            return float((y_tp.mean()-y_t0.mean()) - (y_cp.mean()-y_c0.mean()))
        @staticmethod
        def ipw_ate(T, Y, e):
            return float(np.mean(T*Y/np.clip(e,1e-6,1-1e-6)) -
                          np.mean((1-T)*Y/np.clip(1-e,1e-6,1-1e-6)))
        @staticmethod
        def rd_late(X, T, Y, cutoff=0.5, window=0.15):
            left  = (X>=cutoff-window)&(X<cutoff)
            right = (X>=cutoff)&(X<cutoff+window)
            def ll(Xs, Ys, x0):
                A=np.column_stack([np.ones(len(Xs)),Xs-x0])
                return float(np.linalg.lstsq(A,Ys,rcond=None)[0][0])
            return ll(X[right],Y[right],cutoff)-ll(X[left],Y[left],cutoff)
    rng = np.random.default_rng(42)
    ce = CausalEstimator()
    y_tp=rng.normal(5,1,100); y_t0=rng.normal(3,1,100)
    y_cp=rng.normal(4,1,100); y_c0=rng.normal(3.5,1,100)
    print("Ex28 — DiD:", round(ce.did(y_tp,y_t0,y_cp,y_c0), 4))
    X=rng.uniform(0,1,1000); T=(X>=0.5).astype(float)
    Y=2*X+3*T+rng.normal(0,0.5,1000)
    e=rng.uniform(0.2,0.8,1000)
    print("       IPW ATE:", round(ce.ipw_ate(T,Y,e),4))
    print("       RD LATE (true≈3):", round(ce.rd_late(X,T,Y),4))

def ex29():
    """Doubly Robust estimator"""
    from sklearn.linear_model import LogisticRegression, LinearRegression
    rng = np.random.default_rng(42)
    n = 500
    X = rng.standard_normal((n, 3))
    e_true = 1/(1+np.exp(-X[:,0]))
    T = (rng.random(n)<e_true).astype(float)
    Y = 2.0*T + X[:,0] + rng.normal(0, 0.5, n)
    # Outcome model
    outcome_m = LinearRegression().fit(np.column_stack([X,T]), Y)
    mu1 = outcome_m.predict(np.column_stack([X,np.ones(n)]))
    mu0 = outcome_m.predict(np.column_stack([X,np.zeros(n)]))
    # Propensity model
    ps_m = LogisticRegression().fit(X, T.astype(int))
    e = np.clip(ps_m.predict_proba(X)[:,1], 1e-6, 1-1e-6)
    # DR estimator
    dr = np.mean((T*(Y-mu1)/e + mu1) - ((1-T)*(Y-mu0)/(1-e) + mu0))
    print("Ex29 — Doubly Robust ATE (true≈2.0):", round(float(dr), 4))

def ex30():
    """X-learner CATE"""
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(42)
    n = 300
    X = rng.standard_normal((n, 5))
    T = rng.integers(0, 2, n).astype(int)
    Y = (T * 1.5 + X[:, 0] + rng.normal(0, 0.3, n))
    sc = StandardScaler(); X_sc = sc.fit_transform(X)
    m1 = LinearRegression().fit(X_sc[T==1], Y[T==1])
    m0 = LinearRegression().fit(X_sc[T==0], Y[T==0])
    # Imputed treatment effects
    D1 = Y[T==1] - m0.predict(X_sc[T==1])
    D0 = m1.predict(X_sc[T==0]) - Y[T==0]
    tau1 = LinearRegression().fit(X_sc[T==1], D1)
    tau0 = LinearRegression().fit(X_sc[T==0], D0)
    # Propensity weights (uniform here)
    g = 0.5
    cate = g * tau1.predict(X_sc) + (1-g) * tau0.predict(X_sc)
    print("Ex30 — X-learner CATE mean:", round(float(cate.mean()), 4))

def ex31():
    """Multiple testing: FWER vs FDR comparison"""
    rng = np.random.default_rng(42)
    n_tests = 20
    # 5 truly significant tests (p ~ 0.005), 15 noise (p ~ uniform)
    p_vals = np.concatenate([rng.uniform(0, 0.01, 5), rng.uniform(0, 1, 15)])
    alpha = 0.05
    # Bonferroni
    bonf = [i for i, p in enumerate(p_vals) if p <= alpha/n_tests]
    # BH
    order = np.argsort(p_vals)
    bh_thresh = (np.arange(1, n_tests+1)/n_tests)*alpha
    bh = sorted(order[p_vals[order] <= bh_thresh].tolist())
    print("Ex31 — Bonferroni rejected:", len(bonf), "| BH-FDR rejected:", len(bh))

def ex32():
    """Sequential testing: always-valid inference"""
    rng = np.random.default_rng(42)
    # Generate stream of outcomes
    n, true_effect = 1000, 0.05
    ya = rng.binomial(1, 0.10, n)
    yb = rng.binomial(1, 0.15, n)
    # Mixin sequential test (approximation)
    crossed_05 = None
    for i in range(10, n, 10):
        pa = ya[:i].mean(); pb = yb[:i].mean()
        p_pool = (ya[:i].sum() + yb[:i].sum()) / (2*i)
        se = np.sqrt(2*p_pool*(1-p_pool)/i) + 1e-10
        z  = (pb-pa)/se
        p  = 2*(1-stats.norm.cdf(abs(z)))
        if p < 0.05 and crossed_05 is None:
            crossed_05 = i
    print("Ex32 — sequential test first crossed 0.05 at n:", crossed_05)

def ex33():
    """Heterogeneous treatment effects: subgroup analysis"""
    from sklearn.linear_model import LinearRegression
    rng = np.random.default_rng(42)
    n = 400
    X = rng.standard_normal((n, 3))
    T = rng.integers(0, 2, n).astype(float)
    # HTE: effect is larger for X[:,0] > 0
    tau = 1.0 + 2.0 * (X[:, 0] > 0).astype(float)
    Y = tau * T + X[:, 0] + rng.normal(0, 0.5, n)
    # S-learner CATE
    model = LinearRegression().fit(np.column_stack([X, T]), Y)
    cate = (model.predict(np.column_stack([X, np.ones(n)])) -
             model.predict(np.column_stack([X, np.zeros(n)])))
    subgroup_pos = cate[X[:, 0] > 0].mean()
    subgroup_neg = cate[X[:, 0] <= 0].mean()
    print("Ex33 — CATE subgroup (X0>0):", round(float(subgroup_pos), 4), "(true≈3)")
    print("       CATE subgroup (X0≤0):", round(float(subgroup_neg), 4), "(true≈1)")

def ex34():
    """Counterfactual prediction: what if treatment was not applied?"""
    from sklearn.linear_model import LinearRegression
    rng = np.random.default_rng(42)
    n = 200
    X = rng.standard_normal((n, 3))
    T = np.ones(n)  # all treated
    Y = 2.0*T + X[:,0] + rng.normal(0,0.5,n)
    model = LinearRegression().fit(np.column_stack([X,T]), Y)
    Y_factual      = model.predict(np.column_stack([X, np.ones(n)]))
    Y_counterfactual = model.predict(np.column_stack([X, np.zeros(n)]))
    individual_effect = Y_factual - Y_counterfactual
    print("Ex34 — mean individual effect (true≈2.0):", round(float(individual_effect.mean()), 4))

def ex35():
    """Mediation analysis: direct and indirect effects"""
    from sklearn.linear_model import LinearRegression
    rng = np.random.default_rng(42)
    n = 300
    # T → M → Y (mediated) + T → Y (direct)
    T = rng.integers(0, 2, n).astype(float)
    M = 0.5 * T + rng.normal(0, 0.5, n)   # mediator
    Y = 1.0 * T + 2.0 * M + rng.normal(0, 0.5, n)
    # Baron-Kenny steps
    a = LinearRegression().fit(T.reshape(-1,1), M).coef_[0]   # T → M
    b_model = LinearRegression().fit(np.column_stack([T, M]), Y)
    b = b_model.coef_[1]                                        # M → Y (controlling T)
    c_direct = b_model.coef_[0]                                 # T → Y (direct)
    c_total  = LinearRegression().fit(T.reshape(-1,1), Y).coef_[0]  # total T → Y
    indirect = a * b                                            # a*b = indirect
    print("Ex35 — mediation: total={:.4f} direct={:.4f} indirect={:.4f}".format(
        float(c_total), float(c_direct), float(indirect)))

def ex36():
    """Uplift decile analysis (gain chart)"""
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(42)
    n = 1000
    X = rng.standard_normal((n, 5))
    T = rng.integers(0, 2, n).astype(int)
    Y = ((T * 1.5 + X[:, 0]) > 0).astype(int)
    sc = StandardScaler(); X_sc = sc.fit_transform(X)
    m1 = LogisticRegression(max_iter=500).fit(X_sc[T==1], Y[T==1])
    m0 = LogisticRegression(max_iter=500).fit(X_sc[T==0], Y[T==0])
    uplift = m1.predict_proba(X_sc)[:,1] - m0.predict_proba(X_sc)[:,1]
    deciles = np.percentile(uplift, np.arange(10, 110, 10))
    print("Ex36 — uplift decile thresholds:", np.round(deciles, 4).tolist()[:5], "...")

def ex37():
    """Instrumental variables 2SLS (manual)"""
    rng = np.random.default_rng(42)
    n = 500
    Z = rng.integers(0, 2, n).astype(float)   # instrument (binary)
    U = rng.normal(0, 1, n)                    # unmeasured confounder
    T = 0.5*Z + 0.5*U + rng.normal(0, 0.5, n)
    Y = 2.0*T + 0.5*U + rng.normal(0, 0.5, n)  # true effect of T=2.0
    # Stage 1: regress T on Z
    from sklearn.linear_model import LinearRegression
    T_hat = LinearRegression().fit(Z.reshape(-1,1), T).predict(Z.reshape(-1,1))
    # Stage 2: regress Y on T_hat
    beta_iv = LinearRegression().fit(T_hat.reshape(-1,1), Y).coef_[0]
    beta_ols = LinearRegression().fit(T.reshape(-1,1), Y).coef_[0]
    print("Ex37 — OLS (biased):", round(float(beta_ols), 4),
          "| IV/2SLS:", round(float(beta_iv), 4), "(true≈2.0)")

def ex38():
    """Regression kink design concept"""
    print("Ex38 — Regression Kink Design (RKD):")
    print("  Variation of RD where assignment variable kinks (changes slope) at cutoff.")
    print("  Example: unemployment benefit formula changes slope at earnings cutoff.")
    print("  Identification: treatment intensity changes discontinuously in slope.")
    print("  Estimator: (slope of Y left of kink - slope right of kink)")
    print("             / (slope of T left - slope right)")
    print("  Assumption: distribution of running variable is smooth at kink.")
    print("  Application: policy evaluation when treatment dose (not take-up) changes.")

# ─── ADVANCED (39–50) ───────────────:

def ex39():
    """Causal forest concept (Wager & Athey 2018)"""
    print("Ex39 — Causal Forest:")
    print("  Extension of Random Forest for heterogeneous treatment effects.")
    print("  Each tree: split to maximise heterogeneity of treatment effect (not variance of Y).")
    print("  Honesty: use separate subsamples for splitting and estimation to avoid overfitting.")
    print("  Output: theta(x) = CATE estimate at each x.")
    print("  Asymptotic normality: standard errors available for inference.")
    print("  Package: grf (R), econml (Python).")
    # Simulate causal forest with gradient boosting residuals
    from sklearn.linear_model import LinearRegression
    rng = np.random.default_rng(42)
    n = 300; X = rng.standard_normal((n, 5))
    T = rng.integers(0, 2, n).astype(float)
    tau_true = 1.0 + X[:, 0]
    Y = tau_true * T + X[:, 0] + rng.normal(0, 0.5, n)
    # R-learner: residualise both T and Y
    Y_model = LinearRegression().fit(X, Y)
    T_model = LinearRegression().fit(X, T)
    Y_res = Y - Y_model.predict(X)
    T_res = T - T_model.predict(X)
    # Weighted regression for CATE
    cate_model = LinearRegression().fit(X * T_res.reshape(-1,1), Y_res)
    cate_est   = cate_model.predict(X * np.ones((n,5)))
    print("  R-learner proxy CATE mean:", round(float(cate_est.mean()), 4),
          "| true mean:", round(float(tau_true.mean()), 4))

def ex40():
    """Causal impact analysis (pre/post with synthetic control)"""
    rng = np.random.default_rng(42)
    n_pre, n_post = 50, 20
    # Treated unit
    treated_pre  = rng.normal(10, 1, n_pre)
    treated_post = rng.normal(14, 1, n_post)  # intervention at period n_pre
    # Control donors
    ctrl1_pre    = rng.normal(9, 1, n_pre); ctrl1_post = rng.normal(9.5, 1, n_post)
    ctrl2_pre    = rng.normal(11, 1, n_pre); ctrl2_post = rng.normal(11.5, 1, n_post)
    # Synthetic control: OLS weights on pre-period
    from sklearn.linear_model import LinearRegression
    X_ctrl_pre = np.column_stack([ctrl1_pre, ctrl2_pre])
    w = LinearRegression(positive=True).fit(X_ctrl_pre, treated_pre).coef_
    w = np.clip(w, 0, None); w /= w.sum() + 1e-10
    X_ctrl_post = np.column_stack([ctrl1_post, ctrl2_post])
    synth_post  = X_ctrl_post @ w
    effect = (treated_post - synth_post).mean()
    print("Ex40 — synthetic control effect (true≈4.0):", round(float(effect), 4))

def ex41():
    """Counterfactual fairness concept"""
    print("Ex41 — Counterfactual Fairness (Kusner 2017):")
    print("  A decision is counterfactually fair if for any individual (x, a):")
    print("    P(Y_hat(a=a) | x) = P(Y_hat(a=a') | x)  (across protected attributes a, a')")
    print("  Implementation:")
    print("    1. Build causal DAG including protected attribute A.")
    print("    2. Identify descendant variables of A (direct effects).")
    print("    3. Train model only on non-descendants of A (or residuals after removing A's effect).")
    print("  Example: loan approval should not change if we counterfactually change race.")
    print("  Different from disparate impact: accounts for causal structure, not just correlation.")

def ex42():
    """Panel data DiD: multiple time periods"""
    rng = np.random.default_rng(42)
    n_units, T_periods = 20, 8
    treat_units = np.arange(10)     # units 0-9 treated from period 5
    treat_start = 5
    Y = np.zeros((n_units, T_periods))
    for u in range(n_units):
        for t in range(T_periods):
            base = rng.normal(10 + u*0.1, 0.5)
            treat_effect = 2.0 if (u in treat_units and t >= treat_start) else 0.0
            Y[u, t] = base + 0.3*t + treat_effect + rng.normal(0, 0.2)
    # Two-way FE DiD (Difference estimator)
    treated_post = Y[treat_units][:, treat_start:].mean()
    treated_pre  = Y[treat_units][:, :treat_start].mean()
    ctrl_post    = Y[10:][:, treat_start:].mean()
    ctrl_pre     = Y[10:][:, :treat_start].mean()
    did_est = (treated_post - treated_pre) - (ctrl_post - ctrl_pre)
    print("Ex42 — panel DiD (true≈2.0):", round(float(did_est), 4))

def ex43():
    """Sensitivity to unmeasured confounding (Rosenbaum bounds)"""
    rng = np.random.default_rng(42)
    n = 200
    X = rng.standard_normal((n, 3))
    e = 1 / (1 + np.exp(-X[:, 0]))
    T = (rng.random(n) < e).astype(int)
    Y = 1.5 * T + X[:, 0] + rng.normal(0, 0.5, n)
    from sklearn.linear_model import LogisticRegression
    ps = LogisticRegression().fit(X, T).predict_proba(X)[:, 1]
    treated = np.where(T == 1)[0]
    control = np.where(T == 0)[0]
    matched = [control[np.argmin(np.abs(ps[control] - ps[i]))] for i in treated]
    diffs = Y[treated] - Y[np.array(matched)]
    t_stat, p_unconfounded = stats.ttest_1samp(diffs, 0)
    # Gamma sensitivity: inflate odds ratio of confounding by Gamma
    for gamma in [1.0, 1.5, 2.0, 3.0]:
        # Upper bound on p-value (simplified Rosenbaum)
        z_upper = (diffs - np.median(diffs) / gamma).mean() / (diffs.std() / np.sqrt(len(diffs)) + 1e-8)
        p_upper = 2 * (1 - stats.norm.cdf(abs(z_upper)))
        print(f"Ex43 — Gamma={gamma:.1f}: approx p_upper={round(float(p_upper),4)}")

def ex44():
    """Causal ML for personalised pricing"""
    from sklearn.linear_model import LinearRegression
    rng = np.random.default_rng(42)
    n = 500
    X = rng.standard_normal((n, 4))
    # Price sensitivity varies with feature X[:,0]
    T = rng.uniform(10, 20, n)  # price (treatment)
    elasticity = -0.5 - 0.3 * X[:, 0]  # individual price elasticity
    Y = elasticity * T + 2 * X[:, 0] + rng.normal(0, 1, n)  # demand
    # R-learner to estimate CATE(elasticity)
    Y_model = LinearRegression().fit(X, Y)
    T_model = LinearRegression().fit(X, T)
    Y_res = Y - Y_model.predict(X)
    T_res = T - T_model.predict(X)
    # Estimate heterogeneous price effect
    cate_m = LinearRegression().fit(X * T_res.reshape(-1,1), Y_res)
    est_elas = cate_m.predict(X * np.ones((n,4)))
    corr = float(np.corrcoef(elasticity, est_elas)[0,1])
    print("Ex44 — price elasticity estimation correlation:", round(corr, 4))

def ex45():
    """CausalML evaluation: AUUC (Area Under Uplift Curve)"""
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(42)
    n = 1000
    X = rng.standard_normal((n, 5))
    T = rng.integers(0, 2, n).astype(int)
    tau_true = (X[:, 0] > 0).astype(float) * 0.3
    Y = ((tau_true * T + X[:, 0]) > 0).astype(int)
    sc = StandardScaler(); X_sc = sc.fit_transform(X)
    m1 = LogisticRegression(max_iter=500).fit(X_sc[T==1], Y[T==1])
    m0 = LogisticRegression(max_iter=500).fit(X_sc[T==0], Y[T==0])
    uplift_pred = m1.predict_proba(X_sc)[:,1] - m0.predict_proba(X_sc)[:,1]
    # Compute gain: cumulative uplift when targeting top k%
    order = np.argsort(uplift_pred)[::-1]
    y_sorted = Y[order]; t_sorted = T[order]
    cumulative_lift = []
    for k in range(0, n, 50):
        subset = slice(0, k+1)
        treat_cr = y_sorted[subset][t_sorted[subset]==1].mean() if t_sorted[subset].sum()>0 else 0
        ctrl_cr  = y_sorted[subset][t_sorted[subset]==0].mean() if (1-t_sorted[subset]).sum()>0 else 0
        cumulative_lift.append(treat_cr - ctrl_cr)
    auuc_approx = float(np.trapz(cumulative_lift)) / n
    print("Ex45 — AUUC (approx):", round(auuc_approx, 6))

def ex46():
    """Experiment design: stratified randomization"""
    rng = np.random.default_rng(42)
    n = 300
    strata = rng.choice(["low", "mid", "high"], n)
    # Assign 50/50 within each stratum
    assignments = np.zeros(n, dtype=int)
    for stratum in ["low", "mid", "high"]:
        idx = np.where(strata == stratum)[0]
        rng.shuffle(idx)
        assignments[idx[:len(idx)//2]] = 1  # treatment
    # Check balance within strata
    for stratum in ["low", "mid", "high"]:
        idx = np.where(strata == stratum)[0]
        t_frac = assignments[idx].mean()
        print(f"Ex46 — stratum {stratum}: n={len(idx)} treatment fraction={t_frac:.3f}")

def ex47():
    """Power analysis for lift detection"""
    print("Ex47 — Power analysis grid (alpha=0.05):")
    alpha = 0.05
    for p1 in [0.05, 0.10, 0.20]:
        for lift in [0.10, 0.20, 0.30]:
            p2 = p1 * (1 + lift)
            z_a = stats.norm.ppf(1 - alpha/2)
            z_b = stats.norm.ppf(0.80)
            n = int(np.ceil((z_a+z_b)**2*(p1*(1-p1)+p2*(1-p2))/(p1-p2)**2))
            print(f"  p1={p1:.2f} lift={lift*100:.0f}%: min n={n}")

def ex48():
    """Bayesian A/B testing"""
    rng = np.random.default_rng(42)
    # Prior: Beta(1,1) = uniform
    alpha_a, beta_a = 1 + 120, 1 + 880  # 120 successes, 880 failures
    alpha_b, beta_b = 1 + 150, 1 + 850
    # Monte Carlo posterior comparison
    samples = 100000
    samples_a = rng.beta(alpha_a, beta_a, samples)
    samples_b = rng.beta(alpha_b, beta_b, samples)
    prob_b_better = float(np.mean(samples_b > samples_a))
    expected_lift = float(np.mean((samples_b - samples_a) / samples_a * 100))
    print("Ex48 — P(B>A):", round(prob_b_better, 4),
          "| expected lift:", round(expected_lift, 2), "%")

def ex49():
    """Quasi-experimental: natural experiment"""
    print("Ex49 — Natural Experiment / Quasi-Experiment:")
    print("  Definition: exogenous variation in treatment from real-world events.")
    print("  Examples:")
    print("    - Card & Krueger (1994): NJ minimum wage increase → border counties comparison.")
    print("    - Vietnam draft lottery: random number → IV for military service → earnings.")
    print("    - School cutoff date: RD design for effect of school entry age → test scores.")
    print("  Key: treatment variation is as-good-as-random (exogenous).")
    print("  Validity threats: parallel trends (DiD), SUTVA (no spillovers), exclusion restriction (IV).")
    print("  Strength: more credible than pure observational studies.")

def ex50():
    """End-to-end causal inference pipeline"""
    from sklearn.linear_model import LogisticRegression, LinearRegression
    from sklearn.preprocessing import StandardScaler
    rng = np.random.default_rng(42)
    n = 600
    # Generate observational data with confounding
    X = rng.standard_normal((n, 4))
    e_true = 1 / (1 + np.exp(-X[:, 0]))          # propensity depends on X0
    T = (rng.random(n) < e_true).astype(float)
    true_ate = 2.0
    Y = true_ate * T + 1.5 * X[:, 0] + rng.normal(0, 0.5, n)
    sc = StandardScaler(); X_sc = sc.fit_transform(X)
    # 1. Naive ATE
    naive_ate = float(Y[T==1].mean() - Y[T==0].mean())
    # 2. IPW ATE
    ps_model = LogisticRegression().fit(X_sc, T.astype(int))
    e_est = np.clip(ps_model.predict_proba(X_sc)[:, 1], 1e-6, 1-1e-6)
    ipw_ate = float(np.mean(T*Y/e_est) - np.mean((1-T)*Y/(1-e_est)))
    # 3. Doubly Robust ATE
    outcome_model = LinearRegression().fit(np.column_stack([X_sc, T]), Y)
    mu1 = outcome_model.predict(np.column_stack([X_sc, np.ones(n)]))
    mu0 = outcome_model.predict(np.column_stack([X_sc, np.zeros(n)]))
    dr_ate = float(np.mean((T*(Y-mu1)/e_est + mu1) - ((1-T)*(Y-mu0)/(1-e_est) + mu0)))
    # 4. CATE via S-learner
    cate = mu1 - mu0
    print(f"Ex50 — True ATE: {true_ate}")
    print(f"       Naive ATE (biased): {round(naive_ate,4)}")
    print(f"       IPW ATE:            {round(ipw_ate,4)}")
    print(f"       DR ATE:             {round(dr_ate,4)}")
    print(f"       CATE mean (S-learner): {round(float(cate.mean()),4)}")
    print(f"       Subgroup CATE (X0>0): {round(float(cate[X[:,0]>0].mean()),4)}")
    print(f"       Subgroup CATE (X0≤0): {round(float(cate[X[:,0]<=0].mean()),4)}")


def main():
    print("=" * 60)
    print("Examples 6.5 — Causal ML & A/B Testing")
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
