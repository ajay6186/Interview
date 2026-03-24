# ============================================================
# Exercise 1.3 — Probability for ML
# ============================================================
# Topics:
#   • Sampling from distributions (uniform, normal)
#   • PDF, CDF of normal distribution
#   • Bayes' theorem, MLE, MAP
#   • Discrete distributions: Bernoulli, Binomial, Poisson
#   • Expected value, variance
#   • Law of large numbers, Central limit theorem
#   • Conditional and joint probability
# ============================================================

import numpy as np
from scipy import stats
from typing import Tuple

# ---------------------------------------------------------------------------
# TODO 1: Sample from Uniform Distribution
# ---------------------------------------------------------------------------
# Return n samples uniformly distributed in [low, high].
# Expected: sample_uniform(5, 0, 1) returns array of 5 values in [0,1]

def sample_uniform(n: int, low: float = 0.0, high: float = 1.0, seed: int = 42) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: Sample from Normal Distribution
# ---------------------------------------------------------------------------
# Return n samples from N(mu, sigma^2).
# Expected: sample_normal(5, 0, 1) returns array of 5 values

def sample_normal(n: int, mu: float = 0.0, sigma: float = 1.0, seed: int = 42) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: PDF of Normal Distribution
# ---------------------------------------------------------------------------
# Compute the probability density function of N(mu, sigma^2) at value x:
#   pdf = (1 / (sigma * sqrt(2*pi))) * exp(-0.5 * ((x - mu) / sigma)^2)
# Expected: normal_pdf(0, 0, 1) ≈ 0.3989

def normal_pdf(x: float, mu: float = 0.0, sigma: float = 1.0) -> float:
    pass  # TODO: implement (do not use scipy; use numpy math)


# ---------------------------------------------------------------------------
# TODO 4: CDF of Normal Distribution
# ---------------------------------------------------------------------------
# Compute P(X <= x) for X ~ N(mu, sigma^2) using scipy.stats.norm.cdf.
# Expected: normal_cdf(0, 0, 1) == 0.5

def normal_cdf(x: float, mu: float = 0.0, sigma: float = 1.0) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Bayes' Theorem
# ---------------------------------------------------------------------------
# Given:
#   P(B|A), P(A), P(B)
# Compute P(A|B) = P(B|A) * P(A) / P(B)
# Expected: bayes_theorem(p_b_given_a=0.9, p_a=0.01, p_b=0.108) ≈ 0.0833

def bayes_theorem(p_b_given_a: float, p_a: float, p_b: float) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: MLE for Gaussian
# ---------------------------------------------------------------------------
# Given data array, compute the Maximum Likelihood Estimates for mu and sigma.
# MLE: mu_hat = mean(data), sigma_hat = std(data, ddof=0)
# Expected: mle_gaussian([1,2,3,4,5]) → (3.0, ~1.414)

def mle_gaussian(data: np.ndarray) -> Tuple[float, float]:
    pass  # TODO: implement — return (mu_hat, sigma_hat)


# ---------------------------------------------------------------------------
# TODO 7: MAP Estimate (Gaussian Prior)
# ---------------------------------------------------------------------------
# Given data from N(mu, sigma^2) and a Gaussian prior mu ~ N(mu0, tau^2),
# the MAP estimate of mu is:
#   mu_MAP = (n * sigma^{-2} * x_bar + tau^{-2} * mu0) / (n * sigma^{-2} + tau^{-2})
# Expected: map_gaussian_mean(data, sigma=1, mu0=0, tau=1) pulls estimate toward 0

def map_gaussian_mean(data: np.ndarray, sigma: float, mu0: float, tau: float) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Bernoulli Distribution Probability
# ---------------------------------------------------------------------------
# P(X = k) for X ~ Bernoulli(p), where k in {0, 1}.
# Expected: bernoulli_pmf(1, 0.7) == 0.7, bernoulli_pmf(0, 0.7) == 0.3

def bernoulli_pmf(k: int, p: float) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Binomial Distribution Probability
# ---------------------------------------------------------------------------
# P(X = k) for X ~ Binomial(n, p).
# Expected: binomial_pmf(3, 10, 0.5) ≈ 0.1172

def binomial_pmf(k: int, n: int, p: float) -> float:
    pass  # TODO: implement (use scipy.stats.binom.pmf)


# ---------------------------------------------------------------------------
# TODO 10: Poisson Distribution PMF
# ---------------------------------------------------------------------------
# P(X = k) for X ~ Poisson(lam).
# Expected: poisson_pmf(3, 2) ≈ 0.1804

def poisson_pmf(k: int, lam: float) -> float:
    pass  # TODO: implement (use scipy.stats.poisson.pmf)


# ---------------------------------------------------------------------------
# TODO 11: Expected Value and Variance
# ---------------------------------------------------------------------------
# Given a discrete distribution as (values, probabilities), compute:
#   E[X] = sum(x * p)
#   Var[X] = E[X^2] - E[X]^2
# Expected: expected_value_variance([1,2,3],[1/3,1/3,1/3]) → (2.0, 0.667)

def expected_value_variance(values: np.ndarray, probs: np.ndarray) -> Tuple[float, float]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Law of Large Numbers Demo
# ---------------------------------------------------------------------------
# Simulate rolling a fair die n times. Return the running mean (cumulative
# average) as a numpy array. As n grows, this should converge to 3.5.
# Expected: lln_demo(10000)[-1] ≈ 3.5

def lln_demo(n: int = 10000, seed: int = 42) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Central Limit Theorem Demo
# ---------------------------------------------------------------------------
# Draw n_experiments samples, each of size sample_size, from Uniform(0,1).
# Return the array of sample means. By CLT, this should be approximately
# N(0.5, 1/(12*sample_size)).
# Expected: clt_demo(1000, 30) returns array of 1000 means ≈ 0.5

def clt_demo(n_experiments: int = 1000, sample_size: int = 30, seed: int = 42) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Conditional Probability
# ---------------------------------------------------------------------------
# Given a joint probability table as a 2D numpy array P[i,j] = P(A=i, B=j),
# compute P(A=a | B=b).
# Expected: conditional_prob(P, a=1, b=0) = P[1,0] / sum(P[:,0])

def conditional_prob(joint: np.ndarray, a: int, b: int) -> float:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Joint Probability Independence Check
# ---------------------------------------------------------------------------
# Given marginals P(A) and P(B), check if the joint P(A,B) is consistent
# with independence: P(A=i, B=j) ≈ P(A=i) * P(B=j) for all i, j.
# Return True if independent (max abs deviation < tol), False otherwise.

def is_independent(joint: np.ndarray, tol: float = 1e-6) -> bool:
    pass  # TODO: implement (compute outer product of marginals, compare)


def main():
    print("=== Exercise 1.3: Probability for ML ===\n")

    print("TODO 1 — Uniform samples:", sample_uniform(5))
    print("TODO 2 — Normal samples:", sample_normal(5))
    print("TODO 3 — Normal PDF at 0:", normal_pdf(0.0))
    print("TODO 4 — Normal CDF at 0:", normal_cdf(0.0))
    print("TODO 5 — Bayes theorem:", bayes_theorem(0.9, 0.01, 0.108))

    data = np.array([2.5, 3.1, 2.8, 3.4, 2.9, 3.0])
    print("TODO 6 — MLE Gaussian:", mle_gaussian(data))
    print("TODO 7 — MAP estimate:", map_gaussian_mean(data, sigma=1.0, mu0=0.0, tau=1.0))

    print("TODO 8 — Bernoulli PMF(1, 0.7):", bernoulli_pmf(1, 0.7))
    print("TODO 9 — Binomial PMF(3, 10, 0.5):", binomial_pmf(3, 10, 0.5))
    print("TODO 10 — Poisson PMF(3, 2):", poisson_pmf(3, 2))

    vals = np.array([1, 2, 3])
    probs = np.array([1/3, 1/3, 1/3])
    print("TODO 11 — E[X] and Var[X]:", expected_value_variance(vals, probs))

    running_mean = lln_demo(10000)
    print("TODO 12 — LLN final mean (expect ≈ 3.5):", running_mean[-1] if running_mean is not None else None)

    means = clt_demo()
    print("TODO 13 — CLT sample means mean (expect ≈ 0.5):", np.mean(means) if means is not None else None)

    joint = np.array([[0.12, 0.08], [0.28, 0.22], [0.20, 0.10]])
    print("TODO 14 — P(A=1|B=0):", conditional_prob(joint, a=1, b=0))

    joint_indep = np.array([[0.12, 0.18], [0.08, 0.12], [0.20, 0.30]])
    print("TODO 15 — Independent check:", is_independent(joint_indep))


if __name__ == "__main__":
    main()
