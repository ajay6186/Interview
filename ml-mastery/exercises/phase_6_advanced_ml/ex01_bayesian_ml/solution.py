# ============================================================
# Solution 6.1 — Bayesian Machine Learning
# ============================================================

import numpy as np
from scipy import stats


def bayes_theorem(prior: float, likelihood: float, evidence: float) -> float:
    return round(likelihood * prior / evidence, 6)


def beta_binomial_posterior(alpha: float, beta: float, k: int, n: int) -> tuple:
    post_alpha = alpha + k
    post_beta  = beta + n - k
    post_mean  = post_alpha / (post_alpha + post_beta)
    return (post_alpha, post_beta, round(post_mean, 4))


def gaussian_posterior(mu_0: float, sigma_0: float, x_obs: float, sigma_l: float) -> tuple:
    sigma_0_sq = sigma_0 ** 2
    sigma_l_sq = sigma_l ** 2
    sigma_n_sq = 1.0 / (1.0 / sigma_0_sq + 1.0 / sigma_l_sq)
    mu_n = sigma_n_sq * (mu_0 / sigma_0_sq + x_obs / sigma_l_sq)
    return (round(float(mu_n), 4), round(float(np.sqrt(sigma_n_sq)), 4))


def bayesian_linear_regression(X: np.ndarray, y: np.ndarray,
                                alpha: float = 1.0, beta: float = 25.0) -> tuple:
    D = X.shape[1]
    S_0_inv = alpha * np.eye(D)
    m_0 = np.zeros(D)
    S_N_inv = S_0_inv + beta * X.T @ X
    S_N = np.linalg.inv(S_N_inv)
    m_N = S_N @ (S_0_inv @ m_0 + beta * X.T @ y)
    return (m_N, S_N)


def predictive_distribution(X_new: np.ndarray, m_N: np.ndarray, S_N: np.ndarray,
                             beta: float = 25.0) -> tuple:
    means = X_new @ m_N
    stds  = np.sqrt(1.0 / beta + np.einsum("ij,jk,ik->i", X_new, S_N, X_new))
    return (np.round(means, 4).tolist(), np.round(stds, 4).tolist())


def credible_interval(mean: float, std: float, credibility: float = 0.95) -> tuple:
    alpha = (1 - credibility) / 2
    lower = mean + stats.norm.ppf(alpha) * std
    upper = mean + stats.norm.ppf(1 - alpha) * std
    return (round(lower, 4), round(upper, 4))


def rbf_kernel(X1: np.ndarray, X2: np.ndarray, length_scale: float = 1.0,
               sigma_f: float = 1.0) -> np.ndarray:
    X1 = np.atleast_2d(X1)
    X2 = np.atleast_2d(X2)
    sq_dists = np.sum((X1[:, None, :] - X2[None, :, :]) ** 2, axis=2)
    return sigma_f ** 2 * np.exp(-sq_dists / (2.0 * length_scale ** 2))


def gp_prior_samples(x: np.ndarray, length_scale: float = 1.0) -> np.ndarray:
    X = x.reshape(-1, 1)
    K = rbf_kernel(X, X, length_scale=length_scale)
    K += 1e-8 * np.eye(len(x))  # jitter for numerical stability
    L = np.linalg.cholesky(K)
    samples = (L @ np.random.randn(len(x), 3)).T
    return samples


def gp_posterior(X_train: np.ndarray, y_train: np.ndarray,
                 X_test: np.ndarray, noise: float = 0.1,
                 length_scale: float = 1.0) -> tuple:
    X_train = np.atleast_2d(X_train)
    X_test  = np.atleast_2d(X_test)
    K_tt = rbf_kernel(X_train, X_train, length_scale) + noise ** 2 * np.eye(len(X_train))
    K_ss = rbf_kernel(X_test,  X_test,  length_scale)
    K_ts = rbf_kernel(X_test,  X_train, length_scale)
    K_inv = np.linalg.inv(K_tt)
    mu_post = K_ts @ K_inv @ y_train
    K_post  = K_ss - K_ts @ K_inv @ K_ts.T
    return (mu_post, K_post)


def gp_predict(X_train: np.ndarray, y_train: np.ndarray,
               X_test: np.ndarray, noise: float = 0.1) -> tuple:
    mu, K = gp_posterior(X_train, y_train, X_test, noise)
    std = np.sqrt(np.maximum(np.diag(K), 0.0))
    return (np.round(mu, 4).tolist(), np.round(std, 4).tolist())


def log_marginal_likelihood(X: np.ndarray, y: np.ndarray,
                            alpha: float = 1.0, beta: float = 25.0) -> float:
    n, D = X.shape
    m_N, S_N = bayesian_linear_regression(X, y, alpha, beta)
    S_0 = (1.0 / alpha) * np.eye(D)
    S_0_inv = alpha * np.eye(D)
    S_N_inv = np.linalg.inv(S_N)
    sign_A, logdet_A = np.linalg.slogdet(S_0_inv)
    sign_N, logdet_N = np.linalg.slogdet(S_N)
    rss = float(np.sum((y - X @ m_N) ** 2))
    reg = float(m_N @ m_N)
    log_ml = (
        0.5 * logdet_A
        - 0.5 * logdet_N
        - 0.5 * beta * rss
        - 0.5 * alpha * reg
        - 0.5 * n * np.log(2 * np.pi / beta)
    )
    return round(float(log_ml), 4)


def metropolis_hastings_step(theta: float, log_prob_fn, step_size: float = 0.5) -> tuple:
    theta_proposed = theta + np.random.randn() * step_size
    log_accept = log_prob_fn(theta_proposed) - log_prob_fn(theta)
    accepted = np.log(np.random.rand()) < log_accept
    new_theta = float(theta_proposed) if accepted else float(theta)
    return (round(new_theta, 4), bool(accepted))


def variational_inference_concept() -> str:
    return (
        "Variational Inference (VI) approximates the intractable posterior p(z|x) with a simpler "
        "distribution q(z; phi) from a tractable family (e.g., mean-field: q(z) = prod_i q_i(z_i)). "
        "We maximize the ELBO: L(phi) = E_q[log p(x,z)] - E_q[log q(z)] = log p(x) - KL[q||p]. "
        "Maximizing ELBO is equivalent to minimizing KL[q(z)||p(z|x)]. "
        "VI is faster than MCMC and scales well, but gives approximate posteriors."
    )


def empirical_bayes(X: np.ndarray, y: np.ndarray) -> float:
    alphas = np.logspace(-3, 2, 50)
    best_alpha, best_lml = None, -np.inf
    for alpha in alphas:
        lml = log_marginal_likelihood(X, y, alpha=alpha, beta=25.0)
        if lml > best_lml:
            best_lml = lml
            best_alpha = alpha
    return round(float(best_alpha), 4)


def ucb_acquisition(mu: np.ndarray, sigma: np.ndarray,
                    candidates: np.ndarray, kappa: float = 2.0) -> float:
    ucb = mu + kappa * sigma
    return round(float(candidates[np.argmax(ucb)]), 4)


def main():
    print("=== Solution 6.1: Bayesian Machine Learning ===\n")

    np.random.seed(42)

    print("Result 1  - Bayes theorem P(A|B):", bayes_theorem(0.01, 0.9, 0.0891 + 0.0001))
    print("Result 2  - Beta-Binomial posterior (a=2,b=2,k=7,n=10):", beta_binomial_posterior(2, 2, 7, 10))
    print("Result 3  - Gaussian posterior:", gaussian_posterior(0.0, 1.0, 2.5, 0.5))

    X_lr = np.column_stack([np.ones(20), np.linspace(0, 5, 20)])
    y_lr = 1.5 * X_lr[:, 1] + np.random.randn(20) * 0.3
    m_N, S_N = bayesian_linear_regression(X_lr, y_lr)
    print("Result 4  - Bayesian LinReg m_N:", np.round(m_N, 4))
    print("           S_N diagonal:", np.round(np.diag(S_N), 6))

    X_new = np.column_stack([np.ones(3), [1.0, 2.5, 4.0]])
    pred_mean, pred_std = predictive_distribution(X_new, m_N, S_N)
    print("Result 5  - Predictive mean:", pred_mean, "std:", pred_std)
    print("Result 6  - 95% Credible interval (mu=2, sigma=0.5):", credible_interval(2.0, 0.5))

    x_pts = np.linspace(-3, 3, 30)
    samples = gp_prior_samples(x_pts)
    print("Result 7  - GP prior samples shape:", samples.shape)

    X1 = np.array([[0.0], [1.0], [2.0]])
    X2 = np.array([[0.5], [1.5]])
    print("Result 8  - RBF kernel:\n", np.round(rbf_kernel(X1, X2), 4))

    X_tr = np.array([[1.0], [2.0], [3.0]])
    y_tr = np.array([1.2, 2.1, 2.9])
    X_te = np.array([[1.5], [2.5]])
    mu_p, K_p = gp_posterior(X_tr, y_tr, X_te)
    print("Result 9  - GP posterior mean:", np.round(mu_p, 4))

    mean, std = gp_predict(X_tr, y_tr, X_te)
    print("Result 10 - GP prediction mean:", mean, "std:", std)
    print("Result 11 - Log marginal likelihood:", log_marginal_likelihood(X_lr, y_lr))

    log_prob = lambda t: stats.norm.logpdf(t, loc=2.0, scale=1.0)
    results = [metropolis_hastings_step(1.0, log_prob) for _ in range(5)]
    print("Result 12 - MH steps (theta, accepted):", results)
    print("Result 13 - VI concept:\n ", variational_inference_concept())
    print("Result 14 - Empirical Bayes best alpha:", empirical_bayes(X_lr, y_lr))

    candidates = np.linspace(0, 5, 100)
    mu_c    = np.sin(candidates)
    sigma_c = 0.2 + 0.1 * np.cos(candidates) ** 2
    print("Result 15 - UCB next x:", ucb_acquisition(mu_c, sigma_c, candidates))


if __name__ == "__main__":
    main()
