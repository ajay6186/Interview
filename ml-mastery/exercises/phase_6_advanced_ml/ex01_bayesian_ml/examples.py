# ============================================================
# Examples 6.1 — Bayesian Machine Learning (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import scipy.stats as stats

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Bayes theorem: P(A|B) = P(B|A)*P(A) / P(B)"""
    p_a = 0.01          # prior: disease prevalence
    p_b_given_a = 0.95  # likelihood: test sensitivity
    p_b = 0.05          # marginal: P(positive test)
    posterior = (p_b_given_a * p_a) / p_b
    print(f"Ex01 — Bayes theorem: P(disease|positive) = {posterior:.4f}")

def ex02():
    """Posterior for coin flip: Beta-Binomial conjugate"""
    alpha_prior, beta_prior = 1.0, 1.0   # uniform prior
    heads, tails = 7, 3
    alpha_post = alpha_prior + heads
    beta_post = beta_prior + tails
    posterior_mean = alpha_post / (alpha_post + beta_post)
    print(f"Ex02 — Coin flip posterior: Beta({alpha_post},{beta_post}), mean={posterior_mean:.4f}")

def ex03():
    """Conjugate prior update: Beta + Binomial"""
    alpha, beta_param = 2.0, 2.0  # prior belief: roughly fair coin
    n_obs, k_heads = 20, 14
    alpha_new = alpha + k_heads
    beta_new = beta_param + (n_obs - k_heads)
    mode = (alpha_new - 1) / (alpha_new + beta_new - 2)
    print(f"Ex03 — Conjugate update: Beta({alpha_new},{beta_new}), MAP={mode:.4f}")

def ex04():
    """Gaussian posterior with known variance"""
    mu_prior, sigma_prior = 0.0, 1.0
    sigma_likelihood = 0.5
    observations = np.array([1.2, 0.8, 1.1])
    n = len(observations)
    sigma_post_sq = 1 / (1/sigma_prior**2 + n/sigma_likelihood**2)
    mu_post = sigma_post_sq * (mu_prior/sigma_prior**2 + np.sum(observations)/sigma_likelihood**2)
    print(f"Ex04 — Gaussian posterior: mu={mu_post:.4f}, sigma={np.sqrt(sigma_post_sq):.4f}")

def ex05():
    """Credible interval using scipy.stats.norm.ppf"""
    mu_post, sigma_post = 1.05, 0.15
    lower = stats.norm.ppf(0.025, mu_post, sigma_post)
    upper = stats.norm.ppf(0.975, mu_post, sigma_post)
    print(f"Ex05 — 95% credible interval: [{lower:.4f}, {upper:.4f}]")

def ex06():
    """Prior predictive sampling from Gaussian"""
    rng = np.random.default_rng(42)
    mu_samples = rng.normal(0, 1, 1000)      # sample from prior
    y_pred = rng.normal(mu_samples, 0.5)     # sample from likelihood
    print(f"Ex06 — Prior predictive: mean={y_pred.mean():.4f}, std={y_pred.std():.4f}")

def ex07():
    """Posterior predictive sampling"""
    rng = np.random.default_rng(42)
    alpha_post, beta_post = 8.0, 4.0
    theta_samples = rng.beta(alpha_post, beta_post, 5000)
    y_pred = rng.binomial(1, theta_samples)
    print(f"Ex07 — Posterior predictive P(heads)={y_pred.mean():.4f}")

def ex08():
    """MAP estimate with Gaussian prior"""
    # MAP = argmax log-likelihood + log-prior
    # For Gaussian prior N(mu0, sigma0) and Gaussian likelihood:
    sigma_prior, mu_prior = 1.0, 0.0
    sigma_lik = 0.5
    data = np.array([1.2, 0.9, 1.1])
    # MAP closed form: weighted average
    n = len(data)
    map_est = (mu_prior/sigma_prior**2 + data.sum()/sigma_lik**2) / (1/sigma_prior**2 + n/sigma_lik**2)
    print(f"Ex08 — MAP estimate: {map_est:.4f} (data mean={data.mean():.4f})")

def ex09():
    """MLE vs MAP comparison"""
    data = np.array([1.2, 0.9, 1.1, 0.8, 1.3])
    mle = data.mean()
    mu_prior, sigma_prior, sigma_lik = 0.0, 1.0, 0.5
    n = len(data)
    map_est = (mu_prior/sigma_prior**2 + data.sum()/sigma_lik**2) / (1/sigma_prior**2 + n/sigma_lik**2)
    print(f"Ex09 — MLE={mle:.4f}, MAP={map_est:.4f} (prior pulls toward 0)")

def ex10():
    """Bayesian linear regression concept"""
    print("Ex10 — Bayesian LinReg: w ~ N(0,alpha^-1 I), y|X,w ~ N(Xw, beta^-1 I)")
    print("       Posterior: w|X,y ~ N(m_N, S_N) where S_N^-1 = alpha*I + beta*X^T X")

def ex11():
    """Predictive uncertainty: aleatoric vs epistemic"""
    print("Ex11 — Predictive uncertainty:")
    print("       Aleatoric: irreducible noise in data (sigma^2)")
    print("       Epistemic: model uncertainty from limited data (x^T S_N x)")
    sigma_noise = 0.5
    x_new = np.array([1.0, 2.0])
    # Simulated posterior covariance
    S_N = np.eye(2) * 0.1
    epistemic = x_new @ S_N @ x_new
    print(f"       Epistemic var at x={x_new}: {epistemic:.4f}")

def ex12():
    """Prior sensitivity analysis"""
    data = np.array([0.6, 0.7, 0.65, 0.72])
    priors = [(1,1), (2,2), (10,10)]
    n, k = len(data), int(data.sum() * len(data))
    print("Ex12 — Prior sensitivity (Beta-Binomial):")
    for a, b in priors:
        post_mean = (a + k) / (a + b + n)
        print(f"       Prior Beta({a},{b}) -> posterior mean={post_mean:.4f}")

def ex13():
    """Posterior mean vs mode"""
    alpha, beta_param = 3.0, 7.0
    mean = alpha / (alpha + beta_param)
    mode = (alpha - 1) / (alpha + beta_param - 2)
    median = stats.beta.ppf(0.5, alpha, beta_param)
    print(f"Ex13 — Beta({alpha},{beta_param}): mean={mean:.4f}, mode={mode:.4f}, median={median:.4f}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Beta distribution shapes for different alpha, beta"""
    configs = [(0.5, 0.5), (1, 1), (2, 5), (5, 2), (5, 5)]
    print("Ex14 — Beta distribution shapes:")
    for a, b in configs:
        mean = a / (a + b)
        var = (a * b) / ((a + b)**2 * (a + b + 1))
        print(f"       Beta({a},{b}): mean={mean:.3f}, var={var:.4f}")

def ex15():
    """Dirichlet distribution sample"""
    rng = np.random.default_rng(42)
    alpha = np.array([2.0, 3.0, 5.0])
    samples = rng.dirichlet(alpha, size=5)
    means = samples.mean(axis=0)
    print(f"Ex15 — Dirichlet({alpha}) samples mean: {np.round(means, 4)}")
    print(f"       Expected: {np.round(alpha/alpha.sum(), 4)}")

def ex16():
    """Gamma distribution as conjugate prior for Poisson rate"""
    alpha_prior, beta_prior = 2.0, 1.0  # Gamma(shape, rate)
    observations = np.array([3, 5, 4, 6, 3])  # Poisson observations
    n = len(observations)
    alpha_post = alpha_prior + observations.sum()
    beta_post = beta_prior + n
    post_mean = alpha_post / beta_post
    print(f"Ex16 — Gamma-Poisson conjugate: posterior Gamma({alpha_post},{beta_post})")
    print(f"       Posterior mean lambda={post_mean:.4f}")

def ex17():
    """Gaussian-Gaussian conjugate update"""
    mu0, sigma0 = 0.0, 2.0
    sigma_lik = 1.0
    data = np.array([2.1, 1.8, 2.3, 2.0])
    n = len(data)
    var_post = 1 / (1/sigma0**2 + n/sigma_lik**2)
    mu_post = var_post * (mu0/sigma0**2 + data.sum()/sigma_lik**2)
    print(f"Ex17 — Gaussian conjugate: mu_post={mu_post:.4f}, sigma_post={np.sqrt(var_post):.4f}")

def ex18():
    """Full Bayesian linear regression closed form"""
    rng = np.random.default_rng(42)
    X = np.column_stack([np.ones(20), rng.uniform(0, 2, 20)])
    true_w = np.array([1.0, 2.0])
    y = X @ true_w + rng.normal(0, 0.3, 20)
    alpha, beta_lik = 1.0, 1/0.09
    S0_inv = alpha * np.eye(2)
    S_N_inv = S0_inv + beta_lik * X.T @ X
    S_N = np.linalg.inv(S_N_inv)
    m_N = beta_lik * S_N @ X.T @ y
    print(f"Ex18 — Bayesian LinReg posterior weights: {np.round(m_N, 4)}")

def ex19():
    """Predictive distribution: mean and variance"""
    rng = np.random.default_rng(42)
    X = np.column_stack([np.ones(15), rng.uniform(0, 2, 15)])
    y = X @ np.array([1.0, 2.0]) + rng.normal(0, 0.3, 15)
    beta_lik = 1/0.09
    S_N_inv = np.eye(2) + beta_lik * X.T @ X
    S_N = np.linalg.inv(S_N_inv)
    m_N = beta_lik * S_N @ X.T @ y
    x_new = np.array([1.0, 1.5])
    mu_pred = x_new @ m_N
    var_pred = 1/beta_lik + x_new @ S_N @ x_new
    print(f"Ex19 — Predictive dist at x=1.5: mean={mu_pred:.4f}, std={np.sqrt(var_pred):.4f}")

def ex20():
    """Evidence (marginal likelihood) for model comparison"""
    # Log evidence for Gaussian likelihood, Gaussian prior (1D)
    data = np.array([1.1, 0.9, 1.2, 1.0])
    mu0, sigma0, sigma_lik = 0.0, 2.0, 0.5
    n = len(data)
    # Marginal: y ~ N(mu0, sigma0^2 + sigma_lik^2) for each obs
    sigma_marginal = np.sqrt(sigma0**2 + sigma_lik**2)
    log_evidence = np.sum(stats.norm.logpdf(data, mu0, sigma_marginal))
    print(f"Ex20 — Log marginal likelihood (evidence): {log_evidence:.4f}")

def ex21():
    """Bayes factor for model comparison"""
    data = np.array([1.1, 0.9, 1.2, 1.0])
    # Model 1: mu ~ N(1, 1), sigma=0.5
    # Model 2: mu ~ N(0, 1), sigma=0.5
    sigma_lik = 0.5
    for i, mu0 in enumerate([1.0, 0.0], 1):
        sigma_m = np.sqrt(1.0 + sigma_lik**2)
        log_ev = np.sum(stats.norm.logpdf(data, mu0, sigma_m))
        print(f"Ex21 — Model {i} (mu0={mu0}) log-evidence: {log_ev:.4f}")

def ex22():
    """Bayesian model averaging"""
    # Two models with equal prior, combine predictions
    preds_m1 = np.array([2.1, 1.9, 2.2])
    preds_m2 = np.array([1.8, 2.1, 2.0])
    log_ev = np.array([-12.3, -13.1])
    ev = np.exp(log_ev - log_ev.max())
    weights = ev / ev.sum()
    bma_preds = weights[0] * preds_m1 + weights[1] * preds_m2
    print(f"Ex22 — BMA weights: {np.round(weights, 4)}, averaged preds: {np.round(bma_preds, 4)}")

def ex23():
    """Prior elicitation concept"""
    print("Ex23 — Prior elicitation strategies:")
    print("       1. Expert knowledge: encode domain beliefs directly")
    print("       2. Historical data: fit prior to past observations")
    print("       3. Weakly informative: N(0,1) or Half-Normal(1)")
    print("       4. Entropy maximization: least informative prior")
    # Show weakly informative prior for scale parameter
    x = np.linspace(0, 3, 5)
    half_normal_pdf = 2 * stats.norm.pdf(x, 0, 1)
    print(f"       Half-Normal(1) pdf at [0,0.75,1.5,2.25,3]: {np.round(half_normal_pdf, 3)}")

def ex24():
    """Empirical Bayes: estimate hyperparameters from data"""
    data = np.array([0.6, 0.7, 0.65, 0.72, 0.68])
    # Method of moments for Beta prior
    m = data.mean()
    v = data.var()
    alpha_eb = m * (m*(1-m)/v - 1)
    beta_eb = (1-m) * (m*(1-m)/v - 1)
    print(f"Ex24 — Empirical Bayes Beta prior: alpha={alpha_eb:.4f}, beta={beta_eb:.4f}")

def ex25():
    """Metropolis-Hastings single step"""
    rng = np.random.default_rng(42)
    def log_target(x):
        return stats.norm.logpdf(x, 2.0, 1.0)
    current = 0.0
    proposal = current + rng.normal(0, 0.5)
    log_accept = log_target(proposal) - log_target(current)
    accepted = np.log(rng.uniform()) < log_accept
    new_state = proposal if accepted else current
    print(f"Ex25 — MH step: current={current:.4f}, proposal={proposal:.4f}, "
          f"accepted={accepted}, new={new_state:.4f}")

def ex26():
    """Gibbs sampling step for bivariate Gaussian"""
    rng = np.random.default_rng(42)
    rho = 0.7  # correlation
    x, y = 0.0, 0.0
    # Full conditionals: x|y ~ N(rho*y, 1-rho^2), y|x ~ N(rho*x, 1-rho^2)
    cond_std = np.sqrt(1 - rho**2)
    x_new = rng.normal(rho * y, cond_std)
    y_new = rng.normal(rho * x_new, cond_std)
    print(f"Ex26 — Gibbs step: (x,y)=({x:.4f},{y:.4f}) -> ({x_new:.4f},{y_new:.4f})")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """BayesianEstimator class: prior + likelihood + posterior"""
    class BayesianEstimator:
        def __init__(self, alpha0=1.0, beta0=1.0):
            self.alpha = alpha0
            self.beta = beta0
        def update(self, heads, tails):
            self.alpha += heads
            self.beta += tails
        def posterior_mean(self):
            return self.alpha / (self.alpha + self.beta)
        def credible_interval(self, ci=0.95):
            lo = (1 - ci) / 2
            return stats.beta.ppf([lo, 1-lo], self.alpha, self.beta)

    est = BayesianEstimator(1, 1)
    est.update(14, 6)
    ci = est.credible_interval()
    print(f"Ex27 — BayesianEstimator: mean={est.posterior_mean():.4f}, 95% CI=[{ci[0]:.4f},{ci[1]:.4f}]")

def ex28():
    """BayesianLinearRegression: fit, predict, uncertainty"""
    class BayesianLinearRegression:
        def __init__(self, alpha=1.0, beta=25.0):
            self.alpha = alpha
            self.beta = beta
            self.m_N = None
            self.S_N = None
        def fit(self, X, y):
            S0_inv = self.alpha * np.eye(X.shape[1])
            self.S_N = np.linalg.inv(S0_inv + self.beta * X.T @ X)
            self.m_N = self.beta * self.S_N @ X.T @ y
        def predict(self, X_new):
            mu = X_new @ self.m_N
            var = 1/self.beta + np.diag(X_new @ self.S_N @ X_new.T)
            return mu, np.sqrt(var)

    rng = np.random.default_rng(42)
    X = np.column_stack([np.ones(20), rng.uniform(0, 2, 20)])
    y = X @ np.array([1.0, 2.0]) + rng.normal(0, 0.2, 20)
    blr = BayesianLinearRegression()
    blr.fit(X, y)
    X_new = np.array([[1, 0.5], [1, 1.5]])
    mu, sigma = blr.predict(X_new)
    print(f"Ex28 — BayesianLinReg predictions: mu={np.round(mu,4)}, sigma={np.round(sigma,4)}")

def ex29():
    """GaussianProcess class with RBF kernel and posterior"""
    class GaussianProcess:
        def __init__(self, length_scale=1.0, noise=0.1):
            self.ls = length_scale
            self.noise = noise
        def rbf_kernel(self, X1, X2):
            diffs = X1[:, None] - X2[None, :]
            return np.exp(-0.5 * diffs**2 / self.ls**2)
        def fit_predict(self, X_train, y_train, X_test):
            K = self.rbf_kernel(X_train, X_train) + self.noise * np.eye(len(X_train))
            K_s = self.rbf_kernel(X_train, X_test)
            K_ss = self.rbf_kernel(X_test, X_test)
            K_inv = np.linalg.inv(K)
            mu = K_s.T @ K_inv @ y_train
            cov = K_ss - K_s.T @ K_inv @ K_s
            return mu, np.sqrt(np.diag(cov).clip(0))

    rng = np.random.default_rng(42)
    X_tr = np.array([0.0, 1.0, 2.0, 3.0])
    y_tr = np.sin(X_tr) + rng.normal(0, 0.1, 4)
    X_te = np.array([0.5, 1.5, 2.5])
    gp = GaussianProcess()
    mu, sigma = gp.fit_predict(X_tr, y_tr, X_te)
    print(f"Ex29 — GP posterior: mu={np.round(mu,4)}, sigma={np.round(sigma,4)}")

def ex30():
    """MCMCSampler: Metropolis-Hastings, N steps"""
    class MCMCSampler:
        def __init__(self, log_target, proposal_std=0.5, seed=42):
            self.log_target = log_target
            self.proposal_std = proposal_std
            self.rng = np.random.default_rng(seed)
        def sample(self, x0, n_steps):
            chain = [x0]
            current = x0
            accepts = 0
            for _ in range(n_steps):
                proposal = current + self.rng.normal(0, self.proposal_std)
                log_r = self.log_target(proposal) - self.log_target(current)
                if np.log(self.rng.uniform()) < log_r:
                    current = proposal
                    accepts += 1
                chain.append(current)
            return np.array(chain), accepts / n_steps

    sampler = MCMCSampler(lambda x: stats.norm.logpdf(x, 2.0, 1.0))
    chain, rate = sampler.sample(0.0, 2000)
    print(f"Ex30 — MCMC: accept_rate={rate:.4f}, chain_mean={chain[500:].mean():.4f}, "
          f"chain_std={chain[500:].std():.4f}")

def ex31():
    """BayesianOptimizer: GP + UCB acquisition"""
    class BayesianOptimizer:
        def __init__(self, kappa=2.0, noise=0.05):
            self.kappa = kappa
            self.noise = noise
            self.X_obs = []
            self.y_obs = []
        def rbf(self, x1, x2, ls=1.0):
            return np.exp(-0.5 * (x1 - x2)**2 / ls**2)
        def gp_posterior(self, X_test):
            X_tr = np.array(self.X_obs)
            y_tr = np.array(self.y_obs)
            K = np.array([[self.rbf(a, b) for b in X_tr] for a in X_tr])
            K += self.noise * np.eye(len(X_tr))
            k_s = np.array([[self.rbf(xt, a) for a in X_tr] for xt in X_test])
            K_inv = np.linalg.inv(K)
            mu = k_s @ K_inv @ y_tr
            var = np.array([self.rbf(x, x) - k_s[i] @ K_inv @ k_s[i] for i, x in enumerate(X_test)])
            return mu, var.clip(0)
        def suggest(self, X_candidates):
            mu, var = self.gp_posterior(X_candidates)
            ucb = mu + self.kappa * np.sqrt(var)
            return X_candidates[np.argmax(ucb)]
        def observe(self, x, y):
            self.X_obs.append(x)
            self.y_obs.append(y)

    opt = BayesianOptimizer()
    rng = np.random.default_rng(42)
    for x in [0.0, 1.0, 3.0]:
        opt.observe(x, np.sin(x) + rng.normal(0, 0.05))
    candidates = np.linspace(0, 4, 20)
    suggestion = opt.suggest(candidates)
    print(f"Ex31 — BayesianOptimizer UCB suggestion: x={suggestion:.4f}")

def ex32():
    """BayesianModelComparison: Bayes factors"""
    class BayesianModelComparison:
        def __init__(self):
            self.models = {}
        def add_model(self, name, mu0, sigma0, sigma_lik):
            self.models[name] = (mu0, sigma0, sigma_lik)
        def log_evidence(self, name, data):
            mu0, sigma0, sigma_lik = self.models[name]
            sigma_m = np.sqrt(sigma0**2 + sigma_lik**2)
            return np.sum(stats.norm.logpdf(data, mu0, sigma_m))
        def bayes_factors(self, data):
            log_evs = {n: self.log_evidence(n, data) for n in self.models}
            best = max(log_evs, key=log_evs.get)
            return {n: np.exp(v - log_evs[best]) for n, v in log_evs.items()}

    bmc = BayesianModelComparison()
    bmc.add_model("M1_null", mu0=0.0, sigma0=1.0, sigma_lik=0.5)
    bmc.add_model("M2_alt", mu0=1.0, sigma0=1.0, sigma_lik=0.5)
    data = np.array([0.9, 1.1, 1.0, 1.2, 0.8])
    bfs = bmc.bayes_factors(data)
    print(f"Ex32 — Bayes factors: {{{', '.join(f'{k}={v:.4f}' for k,v in bfs.items())}}}")

def ex33():
    """CredibleInterval class with HDI computation"""
    class CredibleInterval:
        def __init__(self, ci=0.95):
            self.ci = ci
        def equal_tailed(self, samples):
            lo, hi = (1-self.ci)/2, 1-(1-self.ci)/2
            return np.quantile(samples, [lo, hi])
        def hdi(self, samples):
            sorted_s = np.sort(samples)
            n = len(sorted_s)
            width = int(np.floor(self.ci * n))
            intervals = sorted_s[width:] - sorted_s[:n-width]
            idx = np.argmin(intervals)
            return sorted_s[idx], sorted_s[idx + width]

    rng = np.random.default_rng(42)
    samples = rng.beta(5, 2, 10000)
    ci_calc = CredibleInterval(0.95)
    et = ci_calc.equal_tailed(samples)
    hdi = ci_calc.hdi(samples)
    print(f"Ex33 — CredibleInterval: ET=[{et[0]:.4f},{et[1]:.4f}], HDI=[{hdi[0]:.4f},{hdi[1]:.4f}]")

def ex34():
    """Full Bayesian pipeline: prior -> data -> posterior -> predict"""
    rng = np.random.default_rng(42)
    # Step 1: prior
    alpha0, beta0 = 2.0, 2.0
    # Step 2: observe data
    true_p = 0.7
    n_trials = 30
    successes = rng.binomial(n_trials, true_p)
    # Step 3: posterior
    alpha_post = alpha0 + successes
    beta_post = beta0 + (n_trials - successes)
    # Step 4: predict next trial
    post_mean = alpha_post / (alpha_post + beta_post)
    ci = stats.beta.ppf([0.025, 0.975], alpha_post, beta_post)
    print(f"Ex34 — Bayesian pipeline: observed {successes}/{n_trials} successes")
    print(f"       Posterior Beta({alpha_post},{beta_post}): mean={post_mean:.4f}, 95% CI={np.round(ci,4)}")

def ex35():
    """UncertaintyQuantification class"""
    class UncertaintyQuantification:
        def __init__(self, n_bootstrap=500):
            self.n_bootstrap = n_bootstrap
            self.rng = np.random.default_rng(42)
        def bootstrap_ci(self, data, stat_fn, ci=0.95):
            boot_stats = [stat_fn(self.rng.choice(data, len(data), replace=True))
                          for _ in range(self.n_bootstrap)]
            lo, hi = (1-ci)/2, 1-(1-ci)/2
            return np.quantile(boot_stats, [lo, hi])
        def prediction_interval(self, mu, sigma_epistemic, sigma_aleatoric, ci=0.95):
            total_sigma = np.sqrt(sigma_epistemic**2 + sigma_aleatoric**2)
            z = stats.norm.ppf(1-(1-ci)/2)
            return mu - z*total_sigma, mu + z*total_sigma

    uq = UncertaintyQuantification()
    data = np.random.default_rng(42).normal(2.0, 0.5, 50)
    ci = uq.bootstrap_ci(data, np.mean)
    pi = uq.prediction_interval(2.0, 0.1, 0.5)
    print(f"Ex35 — UQ: bootstrap CI for mean=[{ci[0]:.4f},{ci[1]:.4f}], "
          f"prediction interval=[{pi[0]:.4f},{pi[1]:.4f}]")

def ex36():
    """Bayesian A/B test class"""
    class BayesianABTest:
        def __init__(self, alpha0=1.0, beta0=1.0):
            self.alpha0, self.beta0 = alpha0, beta0
        def update(self, successes, trials):
            return self.alpha0 + successes, self.beta0 + (trials - successes)
        def prob_b_beats_a(self, a_params, b_params, n_samples=20000):
            rng = np.random.default_rng(42)
            theta_a = rng.beta(*a_params, n_samples)
            theta_b = rng.beta(*b_params, n_samples)
            return (theta_b > theta_a).mean()
        def expected_lift(self, a_params, b_params, n_samples=20000):
            rng = np.random.default_rng(42)
            theta_a = rng.beta(*a_params, n_samples)
            theta_b = rng.beta(*b_params, n_samples)
            return (theta_b - theta_a).mean()

    ab = BayesianABTest()
    a_post = ab.update(40, 100)
    b_post = ab.update(55, 100)
    prob = ab.prob_b_beats_a(a_post, b_post)
    lift = ab.expected_lift(a_post, b_post)
    print(f"Ex36 — Bayesian A/B: P(B>A)={prob:.4f}, Expected lift={lift:.4f}")

def ex37():
    """Predictive interval vs confidence interval"""
    rng = np.random.default_rng(42)
    n, mu_true, sigma_true = 30, 5.0, 1.0
    data = rng.normal(mu_true, sigma_true, n)
    mu_hat = data.mean()
    se = sigma_true / np.sqrt(n)
    z = 1.96
    ci = (mu_hat - z*se, mu_hat + z*se)
    # Predictive interval for new single obs
    sigma_pred = np.sqrt(sigma_true**2 + se**2)
    pi = (mu_hat - z*sigma_pred, mu_hat + z*sigma_pred)
    print(f"Ex37 — CI for mean: [{ci[0]:.4f},{ci[1]:.4f}] width={ci[1]-ci[0]:.4f}")
    print(f"       PI for new obs: [{pi[0]:.4f},{pi[1]:.4f}] width={pi[1]-pi[0]:.4f}")

def ex38():
    """Production Bayesian service architecture"""
    print("Ex38 — Production Bayesian Service:")
    print("       [Request] -> [Feature extraction]")
    print("       -> [Prior lookup (model registry)]")
    print("       -> [Posterior update (online learning)]")
    print("       -> [Predictive distribution]")
    print("       -> [Decision: MAP or full posterior]")
    print("       -> [Uncertainty flag if sigma > threshold]")
    print("       -> [Response + calibration logging]")
    # Simulate a simple online update
    alpha, beta_param = 10.0, 5.0
    new_success, new_fail = 3, 2
    alpha_new = alpha + new_success
    beta_new = beta_param + new_fail
    print(f"       Online update: Beta({alpha},{beta_param}) + (3,2) -> Beta({alpha_new},{beta_new})")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Gaussian process with observation noise"""
    rng = np.random.default_rng(42)
    def rbf(x1, x2, ls=1.0, sf=1.0):
        return sf**2 * np.exp(-0.5 * (x1[:, None] - x2[None, :])**2 / ls**2)

    X_tr = np.linspace(0, 4, 8)
    y_tr = np.sin(X_tr) + rng.normal(0, 0.2, 8)
    X_te = np.array([0.5, 2.0, 3.5])
    sigma_n = 0.2
    K_tt = rbf(X_tr, X_tr) + sigma_n**2 * np.eye(8)
    K_ts = rbf(X_tr, X_te)
    K_ss = rbf(X_te, X_te)
    K_inv = np.linalg.inv(K_tt)
    mu = K_ts.T @ K_inv @ y_tr
    cov_diag = np.diag(K_ss - K_ts.T @ K_inv @ K_ts).clip(0)
    print(f"Ex39 — GP with noise: mu={np.round(mu,4)}, std={np.round(np.sqrt(cov_diag),4)}")

def ex40():
    """GP hyperparameter optimization via MLE (log marginal likelihood)"""
    rng = np.random.default_rng(42)
    X = np.linspace(0, 4, 10)
    y = np.sin(X) + rng.normal(0, 0.1, 10)

    def log_mll(length_scale, noise):
        K = np.exp(-0.5 * (X[:, None] - X[None, :])**2 / length_scale**2)
        K += noise**2 * np.eye(len(X))
        sign, logdet = np.linalg.slogdet(K)
        if sign <= 0:
            return -np.inf
        K_inv = np.linalg.inv(K)
        return -0.5 * (y @ K_inv @ y + logdet)

    results = []
    for ls in [0.5, 1.0, 2.0]:
        for ns in [0.05, 0.1, 0.2]:
            results.append((ls, ns, log_mll(ls, ns)))
    best = max(results, key=lambda x: x[2])
    print(f"Ex40 — GP MLE hyperparams: length_scale={best[0]}, noise={best[1]}, log_mll={best[2]:.4f}")

def ex41():
    """Sparse GP concept (inducing points)"""
    print("Ex41 — Sparse GP (inducing points / Nystrom approximation):")
    print("       Full GP: O(N^3) train, O(N^2) predict — infeasible for N>10k")
    print("       Sparse GP: choose M << N inducing points Z")
    print("       K_approx = K_NM @ K_MM^-1 @ K_MN (Nystrom)")
    print("       FITC/VFE variational: optimize Z + hyperparams jointly")
    rng = np.random.default_rng(42)
    N, M = 1000, 20
    inducing = np.linspace(0, 10, M)
    print(f"       N={N} training points, M={M} inducing points")
    print(f"       Memory: {N**2*8/1e6:.1f}MB full vs {N*M*8/1e6:.2f}MB sparse")

def ex42():
    """Deep kernel learning concept"""
    print("Ex42 — Deep Kernel Learning (DKL):")
    print("       Idea: k(x,x') = k_GP(f_nn(x), f_nn(x'))")
    print("       f_nn: deep neural network for feature extraction")
    print("       k_GP: standard kernel (RBF) in learned feature space")
    print("       Training: jointly optimize NN params + GP hyperparams")
    print("       Benefit: learns complex non-stationary kernels automatically")
    print("       Libraries: GPyTorch (exact_gp + DeepKernel), BoTorch")

def ex43():
    """Bayesian neural network concept"""
    print("Ex43 — Bayesian Neural Networks (BNN):")
    print("       Prior: p(w) = prod N(w_i; 0, sigma^2)")
    print("       Posterior: p(w|D) = p(D|w)p(w) / p(D)  [intractable]")
    print("       Approx methods:")
    print("         1. MCMC (HMC) — exact but slow")
    print("         2. Variational Bayes (mean-field): q(w)=N(mu,sigma^2)")
    print("         3. MC Dropout: dropout at test time ~ approximate BNN")
    print("         4. Deep Ensembles: train K nets, ensemble predictions")
    # Show MC Dropout uncertainty simulation
    rng = np.random.default_rng(42)
    predictions = rng.normal(2.0, 0.3, 50)  # simulate K forward passes
    print(f"       MC Dropout (50 passes): mean={predictions.mean():.4f}, std={predictions.std():.4f}")

def ex44():
    """Variational Bayes: ELBO maximization"""
    # Simple 1D example: approximate N(2, 0.5) with N(mu, sigma)
    # ELBO = E_q[log p(x)] - KL(q || p_prior)
    rng = np.random.default_rng(42)
    data = rng.normal(2.0, 0.5, 100)

    def elbo(mu_q, log_sigma_q, mu_prior=0.0, sigma_prior=2.0, sigma_lik=0.5):
        sigma_q = np.exp(log_sigma_q)
        # E_q[log likelihood] (analytical for Gaussian)
        n = len(data)
        e_log_lik = -0.5 * n * np.log(2*np.pi*sigma_lik**2) \
                    - 0.5/sigma_lik**2 * (np.sum((data - mu_q)**2) + n*sigma_q**2)
        # KL(q || prior)
        kl = np.log(sigma_prior/sigma_q) + (sigma_q**2 + (mu_q - mu_prior)**2)/(2*sigma_prior**2) - 0.5
        return e_log_lik - kl

    mu_vals = np.linspace(1.5, 2.5, 5)
    elbos = [elbo(mu, np.log(0.5)) for mu in mu_vals]
    best_mu = mu_vals[np.argmax(elbos)]
    print(f"Ex44 — ELBO maximization: best mu={best_mu:.4f} (true=2.0)")
    print(f"       ELBO values: {np.round(elbos, 2)}")

def ex45():
    """Expectation Propagation concept"""
    print("Ex45 — Expectation Propagation (EP):")
    print("       Approximate p(x|D) = Z^-1 prod_i t_i(x)")
    print("       Each factor t_i(x) approximated by exp family q_i(x)")
    print("       Algorithm:")
    print("         1. Initialize all cavity distributions q^\\i")
    print("         2. For each factor i:")
    print("            a. Compute cavity: q^\\i = q / q_i")
    print("            b. Compute tilted: q_hat_i = t_i * q^\\i")
    print("            c. Match moments: update q_i to minimize KL")
    print("         3. Repeat until convergence")
    print("       Use case: Bayesian probit regression, GP classification")

def ex46():
    """Assumed Density Filtering (ADF)"""
    print("Ex46 — Assumed Density Filtering (online EP):")
    # Sequential Bayesian update with moment matching
    rng = np.random.default_rng(42)
    mu, sigma2 = 0.0, 4.0  # prior
    data = rng.normal(2.0, 0.5, 5)
    sigma_lik2 = 0.25
    history = [(mu, sigma2)]
    for y in data:
        sigma2_new = 1.0 / (1.0/sigma2 + 1.0/sigma_lik2)
        mu_new = sigma2_new * (mu/sigma2 + y/sigma_lik2)
        mu, sigma2 = mu_new, sigma2_new
        history.append((mu, sigma2))
    print(f"Ex46 — ADF on {len(data)} obs: final mu={mu:.4f}, sigma={np.sqrt(sigma2):.4f}")
    print(f"       Trajectory: {[(round(m,3), round(np.sqrt(s),3)) for m,s in history]}")

def ex47():
    """Stein Variational Gradient Descent concept"""
    print("Ex47 — Stein Variational Gradient Descent (SVGD):")
    print("       Maintains set of particles {x_i} to approximate posterior")
    print("       Update: x_i <- x_i + eps * phi*(x_i)")
    print("       phi*(x) = (1/n) sum_j [k(x_j,x) grad log p(x_j) + grad_x k(x_j,x)]")
    print("       RBF kernel: k(x,y) = exp(-||x-y||^2 / h)")
    # Simulate 5 particle updates
    rng = np.random.default_rng(42)
    particles = rng.normal(0.0, 0.5, 5)
    target_mu = 2.0
    def grad_log_p(x): return -(x - target_mu)  # Gaussian target
    eps = 0.1
    h = 0.5
    for _ in range(50):
        K = np.exp(-np.subtract.outer(particles, particles)**2 / h)
        glp = grad_log_p(particles)
        grad_K = -2 * np.subtract.outer(particles, particles) * K / h
        phi = (K @ glp + grad_K.sum(axis=0)) / len(particles)
        particles += eps * phi
    print(f"Ex47 — SVGD particles (50 steps): {np.round(particles, 4)}")

def ex48():
    """Normalizing flows for posterior approximation"""
    print("Ex48 — Normalizing Flows for posterior approximation:")
    print("       Idea: transform simple base distribution into complex posterior")
    print("       z_0 ~ N(0,I), z_K = f_K(... f_1(z_0))")
    print("       log q_K(x) = log q_0(z_0) - sum_k log|det J_fk|")
    print("       Flow types: Planar, Radial, RealNVP, Glow, MAF, IAF")
    # Simulate a simple planar flow transformation
    rng = np.random.default_rng(42)
    z = rng.normal(0, 1, 100)
    w, u_param, b = 1.5, 0.5, -1.0
    # planar: f(z) = z + u * tanh(w*z + b)
    z_new = z + u_param * np.tanh(w * z + b)
    print(f"       Planar flow: mean {z.mean():.4f}->{z_new.mean():.4f}, "
          f"std {z.std():.4f}->{z_new.std():.4f}")

def ex49():
    """Amortized inference concept"""
    print("Ex49 — Amortized Inference (Variational Autoencoders):")
    print("       Traditional VI: optimize q(z) for each x separately")
    print("       Amortized VI: train encoder network phi: x -> (mu, sigma)")
    print("       q_phi(z|x) = N(mu_phi(x), sigma_phi(x)^2)")
    print("       ELBO: E_q[log p(x|z)] - KL(q(z|x) || p(z))")
    print("       Reparameterization trick: z = mu + sigma * eps, eps~N(0,I)")
    print("       Benefit: single network handles ALL inputs (amortized cost)")
    # Simulate reparameterization trick
    rng = np.random.default_rng(42)
    mu_enc = np.array([1.5, -0.3])
    log_sigma_enc = np.array([-0.5, -0.2])
    eps = rng.normal(0, 1, (10, 2))
    z_samples = mu_enc + np.exp(log_sigma_enc) * eps
    print(f"       Reparameterized z samples mean: {np.round(z_samples.mean(axis=0), 4)}")

def ex50():
    """Production Bayesian ML architecture"""
    print("Ex50 — Production Bayesian ML Architecture:")
    print("  Layer 1 — Data ingestion:")
    print("    - Streaming data -> feature store")
    print("    - Prior model loaded from model registry")
    print("  Layer 2 — Online posterior update:")
    print("    - Conjugate updates where possible (O(1) per sample)")
    print("    - Approximate updates via Laplace/EP for complex likelihoods")
    print("  Layer 3 — Inference serving:")
    print("    - Return posterior predictive (not just point estimate)")
    print("    - Uncertainty flag: high if posterior variance > threshold")
    print("  Layer 4 — Monitoring:")
    print("    - Track prior-posterior divergence (KL monitoring)")
    print("    - Posterior predictive checks (calibration)")
    print("    - Concept drift: Bayes factor test on sequential data")
    # Mock metrics
    kl_monitor = 0.23
    calibration_err = 0.04
    print(f"  Current: KL={kl_monitor}, calibration_err={calibration_err}")


def main():
    print("=" * 60)
    print("Examples 6.1 — Bayesian Machine Learning")
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
