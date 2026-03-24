# ============================================================
# Exercise 6.1 — Bayesian Machine Learning
# ============================================================
# Topics:
#   • Bayes theorem
#   • Beta-Binomial conjugate prior → posterior
#   • Gaussian prior + Gaussian likelihood → posterior
#   • Bayesian linear regression (closed form)
#   • Predictive distribution (mean + uncertainty)
#   • Credible interval
#   • Gaussian Process prior over functions
#   • GP RBF kernel
#   • GP posterior conditioning on data
#   • GP prediction (mean + std)
#   • Bayesian model comparison (marginal likelihood)
#   • MCMC: Metropolis-Hastings step
#   • Variational inference concept
#   • Empirical Bayes (type II MLE)
#   • Bayesian optimization acquisition function (UCB)
# ============================================================

import numpy as np
from scipy import stats


# --- TODO 1: Bayes theorem ---
# P(A|B) = P(B|A) * P(A) / P(B).
# Return posterior probability.
def bayes_theorem(prior: float, likelihood: float, evidence: float) -> float:
    pass  # TODO: implement


# --- TODO 2: Beta-Binomial conjugate update ---
# Prior: Beta(alpha, beta). Observe k heads in n flips.
# Posterior: Beta(alpha + k, beta + n - k).
# Return (posterior_alpha, posterior_beta, posterior_mean).
def beta_binomial_posterior(alpha: float, beta: float, k: int, n: int) -> tuple:
    pass  # TODO: implement


# --- TODO 3: Gaussian prior + Gaussian likelihood → posterior ---
# Prior: N(mu_0, sigma_0^2). Likelihood: N(x_obs | theta, sigma_l^2).
# Posterior: N(mu_n, sigma_n^2) via conjugate update.
# Return (mu_n, sigma_n).
def gaussian_posterior(mu_0: float, sigma_0: float, x_obs: float, sigma_l: float) -> tuple:
    pass  # TODO: implement


# --- TODO 4: Bayesian linear regression (closed form) ---
# Posterior over weights: w ~ N(m_N, S_N).
# m_N = S_N @ (S_0^{-1} @ m_0 + beta * X^T @ y)
# S_N^{-1} = S_0^{-1} + beta * X^T @ X
# Return (m_N, S_N) as numpy arrays.
def bayesian_linear_regression(X: np.ndarray, y: np.ndarray,
                                alpha: float = 1.0, beta: float = 25.0) -> tuple:
    pass  # TODO: implement


# --- TODO 5: Predictive distribution ---
# p(y* | x*, X, y) = N(y* | m_N^T @ x*, sigma_N^2(x*))
# sigma_N^2(x*) = 1/beta + x*^T @ S_N @ x*
# Return (predictive_mean, predictive_std) for each row of X_new.
def predictive_distribution(X_new: np.ndarray, m_N: np.ndarray, S_N: np.ndarray,
                             beta: float = 25.0) -> tuple:
    pass  # TODO: implement


# --- TODO 6: Credible interval ---
# Return (lower, upper) for 95% credible interval of a Gaussian.
def credible_interval(mean: float, std: float, credibility: float = 0.95) -> tuple:
    pass  # TODO: implement


# --- TODO 7: Gaussian Process prior ---
# Sample 3 functions from GP prior with zero mean and RBF kernel.
# Return array of shape (3, n_points).
def gp_prior_samples(x: np.ndarray, length_scale: float = 1.0) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 8: RBF kernel ---
# k(x1, x2) = exp(-||x1 - x2||^2 / (2 * l^2))
# Return kernel matrix K of shape (n, m).
def rbf_kernel(X1: np.ndarray, X2: np.ndarray, length_scale: float = 1.0,
               sigma_f: float = 1.0) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 9: GP posterior ---
# Conditioning GP on observed data (X_train, y_train).
# Return (mu_posterior, K_posterior) using standard GP equations.
def gp_posterior(X_train: np.ndarray, y_train: np.ndarray,
                 X_test: np.ndarray, noise: float = 0.1,
                 length_scale: float = 1.0) -> tuple:
    pass  # TODO: implement


# --- TODO 10: GP prediction (mean + std) ---
# Call gp_posterior and return (mean, std) per test point.
def gp_predict(X_train: np.ndarray, y_train: np.ndarray,
               X_test: np.ndarray, noise: float = 0.1) -> tuple:
    pass  # TODO: implement


# --- TODO 11: Bayesian model comparison ---
# Marginal likelihood for linear Gaussian model (log evidence).
# log p(y|X, alpha, beta) = 0.5*(log|A| - log|S_N| - beta*||y - X@m_N||^2 - alpha*||m_N||^2 - n*log(2pi/beta))
# Return log marginal likelihood.
def log_marginal_likelihood(X: np.ndarray, y: np.ndarray,
                            alpha: float = 1.0, beta: float = 25.0) -> float:
    pass  # TODO: implement


# --- TODO 12: Metropolis-Hastings step ---
# One MH step: propose theta' = theta + N(0, step_size).
# Accept with probability min(1, p(theta') / p(theta)).
# log_prob_fn: callable that returns log probability.
# Return (new_theta, accepted: bool).
def metropolis_hastings_step(theta: float, log_prob_fn, step_size: float = 0.5) -> tuple:
    pass  # TODO: implement


# --- TODO 13: Variational inference concept ---
# Return a string explaining VI's core idea (ELBO, mean-field).
def variational_inference_concept() -> str:
    pass  # TODO: implement


# --- TODO 14: Empirical Bayes ---
# Maximize marginal likelihood over hyperparameter alpha.
# For Bayesian linreg, search alpha in [0.001..100] and return
# the alpha that maximizes log p(y|X, alpha, beta=25).
def empirical_bayes(X: np.ndarray, y: np.ndarray) -> float:
    pass  # TODO: implement


# --- TODO 15: Bayesian optimization UCB acquisition ---
# UCB(x) = mu(x) + kappa * sigma(x)
# Return x_next = argmax UCB over candidate points.
def ucb_acquisition(mu: np.ndarray, sigma: np.ndarray,
                    candidates: np.ndarray, kappa: float = 2.0) -> float:
    pass  # TODO: implement


def main():
    print("=== Exercise 6.1: Bayesian Machine Learning ===\n")

    np.random.seed(42)

    print("TODO 1  - Bayes theorem P(A|B):", bayes_theorem(0.01, 0.9, 0.0891 + 0.0001))
    print("TODO 2  - Beta-Binomial posterior:", beta_binomial_posterior(2, 2, 7, 10))
    print("TODO 3  - Gaussian posterior:", gaussian_posterior(0.0, 1.0, 2.5, 0.5))

    # Linear regression data
    X_lr = np.column_stack([np.ones(20), np.linspace(0, 5, 20)])
    y_lr = 1.5 * X_lr[:, 1] + np.random.randn(20) * 0.3
    m_N, S_N = bayesian_linear_regression(X_lr, y_lr) or (None, None)
    print("TODO 4  - Bayesian LinReg m_N:", m_N)
    if m_N is not None:
        X_new = np.column_stack([np.ones(3), [1.0, 2.5, 4.0]])
        print("TODO 5  - Predictive dist:", predictive_distribution(X_new, m_N, S_N))
    print("TODO 6  - Credible interval (mu=2, sigma=0.5, 95%):", credible_interval(2.0, 0.5))

    x_pts = np.linspace(-3, 3, 50)
    print("TODO 7  - GP prior samples shape:", gp_prior_samples(x_pts).shape if gp_prior_samples(x_pts) is not None else None)

    X1 = np.array([[0.0], [1.0], [2.0]])
    X2 = np.array([[0.5], [1.5]])
    print("TODO 8  - RBF kernel:", rbf_kernel(X1, X2))

    X_tr = np.array([[1.0], [2.0], [3.0]])
    y_tr = np.array([1.2, 2.1, 2.9])
    X_te = np.array([[1.5], [2.5]])
    mu_post, K_post = gp_posterior(X_tr, y_tr, X_te) or (None, None)
    print("TODO 9  - GP posterior mean:", mu_post)
    mean, std = gp_predict(X_tr, y_tr, X_te) or (None, None)
    print("TODO 10 - GP prediction (mean, std):", mean, std)
    print("TODO 11 - Log marginal likelihood:", log_marginal_likelihood(X_lr, y_lr))

    log_prob = lambda t: stats.norm.logpdf(t, loc=2.0, scale=1.0)
    print("TODO 12 - MH step:", metropolis_hastings_step(1.0, log_prob))
    print("TODO 13 - VI concept:", variational_inference_concept())
    print("TODO 14 - Empirical Bayes best alpha:", empirical_bayes(X_lr, y_lr))

    candidates = np.linspace(0, 5, 100)
    mu_c = np.sin(candidates)
    sigma_c = 0.2 + 0.1 * np.cos(candidates) ** 2
    print("TODO 15 - UCB next x:", ucb_acquisition(mu_c, sigma_c, candidates))


if __name__ == "__main__":
    main()
