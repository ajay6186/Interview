# ============================================================
# Examples 1.3 — Probability for ML (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import scipy.stats as stats
import math

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Uniform distribution sample"""
    np.random.seed(0)
    samples = np.random.uniform(0, 1, 5)
    print(f"Ex01 — uniform samples: {np.round(samples, 4)}")

def ex02():
    """Normal distribution sample"""
    np.random.seed(0)
    samples = np.random.normal(loc=0, scale=1, size=5)
    print(f"Ex02 — normal samples: {np.round(samples, 4)}")

def ex03():
    """Compute P(X < x) for N(0,1)"""
    x = 1.645
    prob = stats.norm.cdf(x)
    print(f"Ex03 — P(X < {x}) for N(0,1): {prob:.4f}")

def ex04():
    """P(a < X < b) for normal distribution"""
    mu, sigma, a, b = 0, 1, -1, 1
    prob = stats.norm.cdf(b, mu, sigma) - stats.norm.cdf(a, mu, sigma)
    print(f"Ex04 — P(-1 < X < 1) for N(0,1): {prob:.4f}")

def ex05():
    """Bernoulli trial simulation"""
    np.random.seed(0)
    p = 0.7
    trials = np.random.binomial(1, p, 10)
    print(f"Ex05 — Bernoulli(p=0.7) trials: {trials}, mean={trials.mean():.2f}")

def ex06():
    """Binomial PMF"""
    n, p, k = 10, 0.5, 3
    pmf = stats.binom.pmf(k, n, p)
    print(f"Ex06 — P(X={k}) for Binomial(n={n},p={p}): {pmf:.4f}")

def ex07():
    """Poisson PMF"""
    lam, k = 3.0, 2
    pmf = stats.poisson.pmf(k, lam)
    print(f"Ex07 — P(X={k}) for Poisson(lambda={lam}): {pmf:.4f}")

def ex08():
    """Expected value calculation"""
    values = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    probs  = np.array([0.1, 0.2, 0.4, 0.2, 0.1])
    ev = np.dot(values, probs)
    print(f"Ex08 — E[X] = {ev:.4f}")

def ex09():
    """Variance calculation"""
    values = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    probs  = np.array([0.1, 0.2, 0.4, 0.2, 0.1])
    ev = np.dot(values, probs)
    var = np.dot(probs, (values - ev)**2)
    print(f"Ex09 — Var[X] = {var:.4f}")

def ex10():
    """Standard deviation"""
    data = np.array([2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0])
    std = np.std(data)
    print(f"Ex10 — std(data) = {std:.4f}")

def ex11():
    """Covariance between two arrays"""
    x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y = np.array([2.0, 4.0, 5.0, 4.0, 5.0])
    cov = np.cov(x, y, ddof=1)[0, 1]
    print(f"Ex11 — Cov(x, y) = {cov:.4f}")

def ex12():
    """Correlation coefficient"""
    x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y = np.array([2.0, 4.0, 5.0, 4.0, 5.0])
    r = np.corrcoef(x, y)[0, 1]
    print(f"Ex12 — Pearson r = {r:.4f}")

def ex13():
    """Law of large numbers: coin flip convergence"""
    np.random.seed(0)
    ns = [10, 100, 1000, 10000]
    for n in ns:
        mean = np.random.binomial(1, 0.5, n).mean()
        print(f"Ex13 — n={n:5d}: sample mean = {mean:.4f} (true p=0.5)")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Bayes theorem: P(A|B) = P(B|A)*P(A)/P(B)"""
    P_A = 0.01          # prior: disease prevalence
    P_B_given_A = 0.99  # sensitivity: test+ given disease
    P_B_given_notA = 0.05  # false positive rate
    P_B = P_B_given_A * P_A + P_B_given_notA * (1 - P_A)
    P_A_given_B = P_B_given_A * P_A / P_B
    print(f"Ex14 — P(disease|test+) = {P_A_given_B:.4f}")

def ex15():
    """Beta-Binomial: update Beta prior with coin flip data"""
    alpha0, beta0 = 1.0, 1.0   # uniform prior
    heads, tails = 7, 3
    alpha_post = alpha0 + heads
    beta_post  = beta0  + tails
    mode_post = (alpha_post - 1) / (alpha_post + beta_post - 2)
    print(f"Ex15 — posterior Beta({alpha_post},{beta_post}), mode={mode_post:.4f}")

def ex16():
    """MLE for Gaussian: estimate mean and variance from data"""
    np.random.seed(1)
    data = np.random.normal(5.0, 2.0, 200)
    mu_mle = data.mean()
    sigma2_mle = data.var()
    print(f"Ex16 — MLE: mu={mu_mle:.4f} (true 5.0), sigma²={sigma2_mle:.4f} (true 4.0)")

def ex17():
    """MAP estimate with Gaussian prior"""
    # Prior: mu ~ N(mu0, sigma0^2), Likelihood: x_i ~ N(mu, sigma^2)
    np.random.seed(0)
    sigma2, mu0, sigma0_sq = 4.0, 3.0, 1.0
    data = np.random.normal(5.0, np.sqrt(sigma2), 10)
    n = len(data)
    mu_map = (mu0 / sigma0_sq + data.sum() / sigma2) / (1 / sigma0_sq + n / sigma2)
    print(f"Ex17 — MAP estimate: mu_map={mu_map:.4f} (MLE={data.mean():.4f}, prior={mu0})")

def ex18():
    """MLE for Bernoulli"""
    data = np.array([1, 0, 1, 1, 0, 1, 1, 0, 1, 1])
    p_mle = data.mean()
    print(f"Ex18 — MLE Bernoulli: p={p_mle:.4f}")

def ex19():
    """Conjugate priors: Beta-Binomial and Gaussian-Gaussian"""
    # Beta-Binomial
    a, b, n_heads, n_tails = 2.0, 2.0, 8, 2
    a_post, b_post = a + n_heads, b + n_tails
    # Gaussian-Gaussian
    mu0, tau0_sq = 0.0, 1.0
    sigma_sq, n = 1.0, 5
    x_bar = 2.5
    mu_post = (mu0 / tau0_sq + n * x_bar / sigma_sq) / (1 / tau0_sq + n / sigma_sq)
    print(f"Ex19 — Beta posterior: Beta({a_post},{b_post}), Gaussian posterior mu={mu_post:.4f}")

def ex20():
    """Mixture of two Gaussians: sample and compute mixture density"""
    np.random.seed(0)
    pi1, mu1, s1 = 0.6, -2.0, 0.5
    pi2, mu2, s2 = 0.4,  3.0, 1.0
    x = 0.0
    density = pi1 * stats.norm.pdf(x, mu1, s1) + pi2 * stats.norm.pdf(x, mu2, s2)
    print(f"Ex20 — Mixture density at x=0: {density:.6f}")

def ex21():
    """Marginal probability from joint P(X,Y)"""
    joint = np.array([[0.1, 0.2, 0.1],
                      [0.1, 0.3, 0.2]])
    p_x = joint.sum(axis=1)  # marginal over Y
    p_y = joint.sum(axis=0)  # marginal over X
    print(f"Ex21 — P(X): {p_x}, P(Y): {p_y}")

def ex22():
    """Conditional probability P(A|B)"""
    joint = np.array([[0.1, 0.2], [0.3, 0.4]])
    P_B = joint[:, 1].sum()         # P(B=1) = sum over A
    P_A1_B1 = joint[1, 1] / P_B    # P(A=1 | B=1)
    print(f"Ex22 — P(A=1|B=1) = {P_A1_B1:.4f}")

def ex23():
    """Independence test: check if P(A,B) = P(A)*P(B)"""
    joint = np.array([[0.1, 0.2], [0.2, 0.5]])
    p_a = joint.sum(axis=1)
    p_b = joint.sum(axis=0)
    expected = np.outer(p_a, p_b)
    is_independent = np.allclose(joint, expected, atol=1e-6)
    print(f"Ex23 — independent: {is_independent} (diff={np.abs(joint-expected).max():.4f})")

def ex24():
    """Jensen's inequality: E[f(X)] >= f(E[X]) for convex f"""
    np.random.seed(0)
    X = np.random.uniform(0, 4, 10000)
    f = lambda x: x**2
    E_fX = np.mean(f(X))
    f_EX = f(np.mean(X))
    print(f"Ex24 — Jensen: E[X²]={E_fX:.4f} >= (E[X])²={f_EX:.4f}: {E_fX >= f_EX}")

def ex25():
    """Markov chain: 2-state transition matrix"""
    P = np.array([[0.9, 0.1],
                  [0.4, 0.6]])
    state = np.array([1.0, 0.0])   # start in state 0
    for _ in range(10):
        state = state @ P
    print(f"Ex25 — Markov chain after 10 steps: {np.round(state, 4)}")

def ex26():
    """Steady-state distribution via eigenvector"""
    P = np.array([[0.9, 0.1],
                  [0.4, 0.6]])
    eigvals, eigvecs = np.linalg.eig(P.T)
    stat_idx = np.argmin(np.abs(eigvals - 1.0))
    pi = np.real(eigvecs[:, stat_idx])
    pi = np.abs(pi) / np.abs(pi).sum()
    print(f"Ex26 — steady-state: {np.round(pi, 4)}")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """ProbabilityDistribution class"""
    class ProbabilityDistribution:
        def __init__(self, mu=0.0, sigma=1.0):
            self.mu, self.sigma = mu, sigma
        def pdf(self, x):
            return stats.norm.pdf(x, self.mu, self.sigma)
        def cdf(self, x):
            return stats.norm.cdf(x, self.mu, self.sigma)
        def sample(self, n, seed=0):
            np.random.seed(seed)
            return np.random.normal(self.mu, self.sigma, n)
    dist = ProbabilityDistribution(mu=2.0, sigma=0.5)
    s = dist.sample(5)
    print(f"Ex27 — ProbDist samples: {np.round(s, 4)}, P(X<2)={dist.cdf(2):.4f}")

def ex28():
    """BayesianEstimator class (Beta-Binomial)"""
    class BayesianEstimator:
        def __init__(self, alpha=1.0, beta=1.0):
            self.alpha, self.beta = alpha, beta
        def update(self, heads, tails):
            self.alpha += heads
            self.beta += tails
        def mean(self):
            return self.alpha / (self.alpha + self.beta)
        def mode(self):
            return (self.alpha - 1) / (self.alpha + self.beta - 2)
    est = BayesianEstimator(alpha=1, beta=1)
    est.update(heads=6, tails=4)
    print(f"Ex28 — Bayesian p estimate: mean={est.mean():.4f}, mode={est.mode():.4f}")

def ex29():
    """Gaussian Mixture EM from scratch (2 components, 2D simplified to 1D)"""
    np.random.seed(42)
    data = np.concatenate([np.random.normal(-2, 0.5, 50), np.random.normal(3, 0.8, 50)])
    mu1, mu2, sig1, sig2, pi1 = -3.0, 2.0, 1.0, 1.0, 0.5
    pi2 = 1 - pi1
    for _ in range(30):
        r1 = pi1 * stats.norm.pdf(data, mu1, sig1)
        r2 = pi2 * stats.norm.pdf(data, mu2, sig2)
        denom = r1 + r2
        r1, r2 = r1 / denom, r2 / denom
        mu1 = np.dot(r1, data) / r1.sum()
        mu2 = np.dot(r2, data) / r2.sum()
        sig1 = np.sqrt(np.dot(r1, (data - mu1)**2) / r1.sum())
        sig2 = np.sqrt(np.dot(r2, (data - mu2)**2) / r2.sum())
        pi1, pi2 = r1.mean(), r2.mean()
    print(f"Ex29 — GMM EM: mu1={mu1:.4f}, mu2={mu2:.4f} (true: -2, 3)")

def ex30():
    """Monte Carlo integration: estimate π via random points in unit square"""
    np.random.seed(0)
    n = 100000
    x, y = np.random.uniform(-1, 1, n), np.random.uniform(-1, 1, n)
    inside = (x**2 + y**2) <= 1.0
    pi_est = 4 * inside.mean()
    print(f"Ex30 — Monte Carlo π estimate: {pi_est:.4f} (true: {math.pi:.4f})")

def ex31():
    """Importance sampling: estimate E[X²] under N(3,1) using N(0,1)"""
    np.random.seed(0)
    n = 10000
    q_samples = np.random.normal(0, 1, n)    # proposal: N(0,1)
    p_pdf = stats.norm.pdf(q_samples, 3, 1)  # target: N(3,1)
    q_pdf = stats.norm.pdf(q_samples, 0, 1)  # proposal
    weights = p_pdf / q_pdf
    f_vals = q_samples**2
    estimate = np.mean(weights * f_vals) / np.mean(weights)
    true_val = 3**2 + 1  # E[X^2] = mu^2 + sigma^2
    print(f"Ex31 — IS estimate E[X²]={estimate:.4f} (true={true_val})")

def ex32():
    """Rejection sampling from Beta(2,5) using uniform proposal"""
    np.random.seed(0)
    M = 6.0   # upper bound on Beta(2,5) pdf (max ≈ 5.49)
    samples, n_accepted = [], 0
    np.random.seed(0)
    while len(samples) < 1000:
        x = np.random.uniform(0, 1)
        u = np.random.uniform(0, M)
        if u <= stats.beta.pdf(x, 2, 5):
            samples.append(x)
            n_accepted += 1
    samples = np.array(samples)
    print(f"Ex32 — rejection sampling Beta(2,5): mean={samples.mean():.4f} (true={2/7:.4f})")

def ex33():
    """Bootstrap sampling"""
    np.random.seed(0)
    data = np.array([2.1, 3.5, 4.2, 5.1, 3.8, 2.9, 4.7, 3.3, 5.2, 4.0])
    n_boot = 1000
    boot_means = [np.random.choice(data, len(data), replace=True).mean()
                  for _ in range(n_boot)]
    boot_means = np.array(boot_means)
    ci_low, ci_high = np.percentile(boot_means, [2.5, 97.5])
    print(f"Ex33 — bootstrap 95% CI for mean: [{ci_low:.4f}, {ci_high:.4f}]")

def ex34():
    """Permutation test: test if two groups have same mean"""
    np.random.seed(0)
    group1 = np.random.normal(0, 1, 30)
    group2 = np.random.normal(0.5, 1, 30)
    obs_diff = group2.mean() - group1.mean()
    combined = np.concatenate([group1, group2])
    n_perm = 2000
    perm_diffs = np.array([
        np.random.permutation(combined)[:30].mean() - np.random.permutation(combined)[30:].mean()
        for _ in range(n_perm)])
    p_val = (np.abs(perm_diffs) >= np.abs(obs_diff)).mean()
    print(f"Ex34 — permutation test: obs_diff={obs_diff:.4f}, p_val={p_val:.4f}")

def ex35():
    """Hypothesis test from scratch (one-sample z-test)"""
    np.random.seed(0)
    data = np.random.normal(5.5, 2.0, 50)
    mu0, sigma = 5.0, 2.0
    z = (data.mean() - mu0) / (sigma / math.sqrt(len(data)))
    p_val = 2 * (1 - stats.norm.cdf(abs(z)))
    print(f"Ex35 — z-test: z={z:.4f}, p={p_val:.4f}, reject H0: {p_val < 0.05}")

def ex36():
    """Central Limit Theorem demo"""
    np.random.seed(0)
    population = np.random.exponential(scale=2.0, size=100000)
    sample_means = [np.random.choice(population, 40).mean() for _ in range(2000)]
    sm = np.array(sample_means)
    print(f"Ex36 — CLT: sample mean of means={sm.mean():.4f}, std={sm.std():.4f}, "
          f"expected std≈{2.0/math.sqrt(40):.4f}")

def ex37():
    """Confidence interval via bootstrap"""
    np.random.seed(0)
    data = np.random.normal(10.0, 2.0, 40)
    n_boot = 2000
    boot_means = np.array([np.random.choice(data, len(data), replace=True).mean()
                           for _ in range(n_boot)])
    ci = np.percentile(boot_means, [2.5, 97.5])
    print(f"Ex37 — bootstrap CI: [{ci[0]:.4f}, {ci[1]:.4f}], point est={data.mean():.4f}")

def ex38():
    """Probability calibration: reliability diagram data"""
    np.random.seed(0)
    n = 1000
    pred_probs = np.random.uniform(0, 1, n)
    true_labels = (np.random.uniform(0, 1, n) < pred_probs).astype(int)
    bins = np.linspace(0, 1, 6)
    bin_ids = np.digitize(pred_probs, bins) - 1
    bin_ids = np.clip(bin_ids, 0, 4)
    calibration = []
    for b in range(5):
        mask = bin_ids == b
        if mask.sum() > 0:
            calibration.append((bins[b] + 0.1, true_labels[mask].mean()))
    print(f"Ex38 — reliability bins (predicted, actual): "
          f"{[(round(a,2), round(b,2)) for a,b in calibration]}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Multivariate normal distribution"""
    np.random.seed(0)
    mu = np.array([0.0, 1.0])
    cov = np.array([[1.0, 0.8], [0.8, 2.0]])
    samples = np.random.multivariate_normal(mu, cov, 5)
    density = stats.multivariate_normal.pdf(mu, mu, cov)
    print(f"Ex39 — MVN density at mean: {density:.6f}, 5 samples:\n{np.round(samples, 3)}")

def ex40():
    """Wishart distribution concept (sample from Wishart)"""
    np.random.seed(0)
    df, scale = 5, np.eye(2)
    # Wishart sample = sum of df outer products of MVN samples
    samples = [np.outer(v, v) for v in np.random.multivariate_normal(np.zeros(2), scale, df)]
    W_sample = sum(samples)
    print(f"Ex40 — Wishart W_5(I) sample:\n{np.round(W_sample, 4)}")

def ex41():
    """Dirichlet distribution"""
    np.random.seed(0)
    alpha = np.array([2.0, 3.0, 5.0])
    samples = np.random.dirichlet(alpha, 5)
    mean = alpha / alpha.sum()
    print(f"Ex41 — Dirichlet mean: {np.round(mean, 4)}, sample row sums: {samples.sum(axis=1)}")

def ex42():
    """Exponential family: Gaussian as exponential family"""
    # N(mu, sigma^2): natural params eta1=mu/sigma^2, eta2=-1/(2*sigma^2)
    mu, sigma2 = 3.0, 4.0
    eta1 = mu / sigma2
    eta2 = -1.0 / (2 * sigma2)
    # Recover mu, sigma^2 from natural params
    sigma2_rec = -1.0 / (2 * eta2)
    mu_rec = eta1 * sigma2_rec
    print(f"Ex42 — exponential family: eta=({eta1:.4f},{eta2:.4f}), "
          f"recovered mu={mu_rec:.4f}, sigma²={sigma2_rec:.4f}")

def ex43():
    """Variational inference ELBO (for Gaussian VI)"""
    # ELBO = E_q[log p(x|z)] - KL(q||p)
    # For Gaussian q=N(m,s²) and prior p=N(0,1)
    m, s2 = 2.0, 0.5
    # KL(N(m,s²) || N(0,1)) = 0.5*(m² + s² - log(s²) - 1)
    kl = 0.5 * (m**2 + s2 - math.log(s2) - 1)
    # Simulate reconstruction term (log likelihood estimate)
    np.random.seed(0)
    x_obs = np.random.normal(m, math.sqrt(s2), 100)
    recon = np.mean(stats.norm.logpdf(x_obs, m, math.sqrt(s2)))
    elbo = recon - kl
    print(f"Ex43 — VI ELBO: recon={recon:.4f}, KL={kl:.4f}, ELBO={elbo:.4f}")

def ex44():
    """KL divergence minimization: fit q to p"""
    # Fit N(m,1) to minimize KL(q||p) where p=N(5,1)
    # Optimal: m=p_mean
    p_mean = 5.0
    m = 0.0
    lr = 0.5
    for _ in range(30):
        grad_kl = m - p_mean   # dKL/dm = m - p_mean (for equal variances)
        m -= lr * grad_kl
    print(f"Ex44 — KL minimization: q mean → {m:.6f} (target: {p_mean})")

def ex45():
    """EM algorithm: Gaussian mixture (1D, 2 components)"""
    np.random.seed(7)
    data = np.concatenate([np.random.normal(0, 1, 60), np.random.normal(5, 1, 40)])
    mu1, mu2, pi1 = 1.0, 4.0, 0.5
    for _ in range(30):
        r1 = pi1 * stats.norm.pdf(data, mu1, 1)
        r2 = (1-pi1) * stats.norm.pdf(data, mu2, 1)
        r1 /= (r1 + r2)
        r2 = 1 - r1
        pi1 = r1.mean()
        mu1 = np.dot(r1, data) / r1.sum()
        mu2 = np.dot(r2, data) / r2.sum()
    print(f"Ex45 — EM: mu1={mu1:.4f}, mu2={mu2:.4f} (true: 0, 5)")

def ex46():
    """MCMC: Metropolis-Hastings step (target: N(3,1))"""
    np.random.seed(0)
    def log_target(x):
        return stats.norm.logpdf(x, loc=3, scale=1)
    x = 0.0
    samples = [x]
    for _ in range(5000):
        x_prop = x + np.random.normal(0, 0.5)
        log_alpha = log_target(x_prop) - log_target(x)
        if math.log(np.random.uniform()) < log_alpha:
            x = x_prop
        samples.append(x)
    samples = np.array(samples[1000:])   # burn-in
    print(f"Ex46 — Metropolis-Hastings: mean={samples.mean():.4f}, std={samples.std():.4f} (true: 3.0, 1.0)")

def ex47():
    """Hamiltonian Monte Carlo concept (leapfrog step)"""
    def grad_U(q):
        return q    # U(q) = q^2/2, target ~ N(0,1)
    q, p_mom = 2.0, 0.0
    np.random.seed(0)
    eps, L = 0.1, 20
    p_mom = np.random.normal()
    H_initial = 0.5 * p_mom**2 + 0.5 * q**2
    for _ in range(L):
        p_mom = p_mom - (eps / 2) * grad_U(q)
        q = q + eps * p_mom
        p_mom = p_mom - (eps / 2) * grad_U(q)
    H_final = 0.5 * p_mom**2 + 0.5 * q**2
    accept = H_initial - H_final
    print(f"Ex47 — HMC leapfrog: q={q:.4f}, ΔH={accept:.6f} (accept if ΔH>log(u))")

def ex48():
    """Probabilistic graphical model: naïve Bayes (manual)"""
    # P(spam|words) ∝ P(spam)*Π P(w_i|spam)
    P_spam = 0.3
    P_word_given_spam = {'free': 0.6, 'money': 0.5, 'hello': 0.1}
    P_word_given_ham  = {'free': 0.1, 'money': 0.08, 'hello': 0.3}
    words = ['free', 'money']
    log_spam = math.log(P_spam)
    log_ham  = math.log(1 - P_spam)
    for w in words:
        log_spam += math.log(P_word_given_spam[w])
        log_ham  += math.log(P_word_given_ham[w])
    prob_spam = 1 / (1 + math.exp(log_ham - log_spam))
    print(f"Ex48 — Naive Bayes P(spam|free,money)={prob_spam:.4f}")

def ex49():
    """Copula concept: Gaussian copula correlation"""
    np.random.seed(0)
    rho = 0.8
    cov = np.array([[1.0, rho], [rho, 1.0]])
    z = np.random.multivariate_normal([0, 0], cov, 1000)
    u = stats.norm.cdf(z)   # transform to uniform via probability integral transform
    measured_corr = np.corrcoef(u[:, 0], u[:, 1])[0, 1]
    print(f"Ex49 — Gaussian copula: input rho={rho}, measured corr={measured_corr:.4f}")

def ex50():
    """Extreme value theory: Gumbel distribution (max of IID samples)"""
    np.random.seed(0)
    n_trials, n_obs = 5000, 50
    maxima = np.array([np.random.normal(0, 1, n_obs).max() for _ in range(n_trials)])
    mu_gumbel, sigma_gumbel = stats.gumbel_r.fit(maxima)
    ks_stat, ks_p = stats.kstest(maxima, 'gumbel_r', args=(mu_gumbel, sigma_gumbel))
    print(f"Ex50 — Gumbel fit: loc={mu_gumbel:.4f}, scale={sigma_gumbel:.4f}, KS p={ks_p:.4f}")

def main():
    print("=" * 60)
    print("Examples 1.3 — Probability for ML")
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
