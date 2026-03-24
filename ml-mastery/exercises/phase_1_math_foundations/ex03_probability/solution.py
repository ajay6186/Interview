# ============================================================
# Solution 1.3 — Probability for ML
# ============================================================

import numpy as np
from scipy import stats
from typing import Tuple


def sample_uniform(n: int, low: float = 0.0, high: float = 1.0, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.uniform(low, high, size=n)


def sample_normal(n: int, mu: float = 0.0, sigma: float = 1.0, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.normal(mu, sigma, size=n)


def normal_pdf(x: float, mu: float = 0.0, sigma: float = 1.0) -> float:
    coefficient = 1.0 / (sigma * np.sqrt(2 * np.pi))
    exponent = -0.5 * ((x - mu) / sigma) ** 2
    return coefficient * np.exp(exponent)


def normal_cdf(x: float, mu: float = 0.0, sigma: float = 1.0) -> float:
    return stats.norm.cdf(x, loc=mu, scale=sigma)


def bayes_theorem(p_b_given_a: float, p_a: float, p_b: float) -> float:
    return (p_b_given_a * p_a) / p_b


def mle_gaussian(data: np.ndarray) -> Tuple[float, float]:
    data = np.asarray(data, dtype=float)
    mu_hat = np.mean(data)
    sigma_hat = np.std(data, ddof=0)  # MLE uses ddof=0
    return mu_hat, sigma_hat


def map_gaussian_mean(data: np.ndarray, sigma: float, mu0: float, tau: float) -> float:
    data = np.asarray(data, dtype=float)
    n = len(data)
    x_bar = np.mean(data)
    precision_likelihood = n / (sigma ** 2)
    precision_prior = 1.0 / (tau ** 2)
    mu_map = (precision_likelihood * x_bar + precision_prior * mu0) / (precision_likelihood + precision_prior)
    return mu_map


def bernoulli_pmf(k: int, p: float) -> float:
    return p if k == 1 else (1 - p)


def binomial_pmf(k: int, n: int, p: float) -> float:
    return stats.binom.pmf(k, n, p)


def poisson_pmf(k: int, lam: float) -> float:
    return stats.poisson.pmf(k, lam)


def expected_value_variance(values: np.ndarray, probs: np.ndarray) -> Tuple[float, float]:
    values = np.asarray(values, dtype=float)
    probs = np.asarray(probs, dtype=float)
    ex = np.sum(values * probs)
    ex2 = np.sum(values ** 2 * probs)
    var = ex2 - ex ** 2
    return ex, var


def lln_demo(n: int = 10000, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    rolls = rng.integers(1, 7, size=n).astype(float)
    running_mean = np.cumsum(rolls) / np.arange(1, n + 1)
    return running_mean


def clt_demo(n_experiments: int = 1000, sample_size: int = 30, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    samples = rng.uniform(0, 1, size=(n_experiments, sample_size))
    return samples.mean(axis=1)


def conditional_prob(joint: np.ndarray, a: int, b: int) -> float:
    p_b = joint[:, b].sum()
    return joint[a, b] / p_b


def is_independent(joint: np.ndarray, tol: float = 1e-6) -> bool:
    p_a = joint.sum(axis=1)  # marginal over B
    p_b = joint.sum(axis=0)  # marginal over A
    expected = np.outer(p_a, p_b)
    return np.max(np.abs(joint - expected)) < tol


def main():
    print("=== Solution 1.3: Probability for ML ===\n")

    print("Result 1 — Uniform samples:", np.round(sample_uniform(5), 4))
    print("Result 2 — Normal samples:", np.round(sample_normal(5), 4))
    print("Result 3 — Normal PDF at 0 (expect ~= 0.3989):", round(normal_pdf(0.0), 6))
    print("Result 4 — Normal CDF at 0 (expect 0.5):", normal_cdf(0.0))
    print("Result 5 — Bayes (expect ~= 0.0833):", round(bayes_theorem(0.9, 0.01, 0.108), 6))

    data = np.array([2.5, 3.1, 2.8, 3.4, 2.9, 3.0])
    mu_hat, sigma_hat = mle_gaussian(data)
    print(f"Result 6 — MLE: mu={round(mu_hat,4)}, sigma={round(sigma_hat,4)}")
    print(f"Result 7 — MAP estimate: {round(map_gaussian_mean(data, sigma=1.0, mu0=0.0, tau=1.0), 4)}")

    print("Result 8 — Bernoulli PMF(1, 0.7):", bernoulli_pmf(1, 0.7))
    print("Result 9 — Binomial PMF(3, 10, 0.5) (expect ~= 0.1172):", round(binomial_pmf(3, 10, 0.5), 6))
    print("Result 10 — Poisson PMF(3, 2) (expect ~= 0.1804):", round(poisson_pmf(3, 2), 6))

    vals = np.array([1, 2, 3])
    probs = np.array([1/3, 1/3, 1/3])
    ex, var = expected_value_variance(vals, probs)
    print(f"Result 11 — E[X]={round(ex,4)}, Var[X]={round(var,4)}")

    running_mean = lln_demo(10000)
    print("Result 12 — LLN final mean (expect ~= 3.5):", round(running_mean[-1], 4))

    means = clt_demo()
    print(f"Result 13 — CLT: mean={round(np.mean(means),4)}, std={round(np.std(means),4)} (expect ~= 0.5, {round(1/np.sqrt(12*30),4)})")

    joint = np.array([[0.12, 0.08], [0.28, 0.22], [0.20, 0.10]])
    print("Result 14 — P(A=1|B=0):", round(conditional_prob(joint, a=1, b=0), 4))

    # Build a truly independent joint from fixed marginals
    pa = np.array([0.3, 0.2, 0.5])
    pb = np.array([0.4, 0.6])
    joint_indep = np.outer(pa, pb)
    print("Result 15 — Independent (True):", is_independent(joint_indep))
    print("           Dependent (False):", is_independent(joint))


if __name__ == "__main__":
    main()
