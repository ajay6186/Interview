# ============================================================================
# Exercise 5.5 — Monte Carlo Simulation
# ============================================================================
# Use NumPy random sampling to implement Monte Carlo methods: pi estimation,
# geometric Brownian motion, option pricing, and bootstrap confidence intervals.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

np.random.seed(42)

# ---------------------------------------------------------------------------
# 1. Estimate pi using Monte Carlo
# ---------------------------------------------------------------------------

n_pi = 1_000_000

# TODO: sample n_pi uniform points in [-1,1] x [-1,1]
x_mc = None  # replace None
y_mc = None  # replace None

# TODO: estimate pi as 4 * fraction of points inside unit circle
pi_est = None  # replace None

# ---------------------------------------------------------------------------
# 2. Monte Carlo integration of f(x) = x^3 over [0, 1]
# ---------------------------------------------------------------------------

n_int = 200_000

# TODO: sample n_int uniform values in [0, 1]
x_int = None  # replace None

# TODO: estimate the integral as the mean of f(x_int) = x_int^3
mc_integral = None  # replace None   (exact = 0.25)

# ---------------------------------------------------------------------------
# 3. Geometric Brownian Motion — simulate stock prices
# ---------------------------------------------------------------------------

S0, mu, sigma_gbm, dt = 100., 0.08, 0.20, 1/252
n_paths, n_periods = 2000, 252

# TODO: generate standard normal shocks of shape (n_paths, n_periods)
Z = None  # replace None

# TODO: compute log returns per step: (mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z
log_returns = None  # replace None

# TODO: compute final prices: S0 * exp(cumsum of log_returns along axis=1)
#       prices[:, -1] are final prices
prices = None  # replace None

# ---------------------------------------------------------------------------
# 4. European call option price (risk-neutral Monte Carlo)
# ---------------------------------------------------------------------------

r_rn, K_opt, T_opt = 0.05, 100., 1.
sigma_opt = 0.20
n_option = 100_000

# TODO: sample n_option standard normal values
Z_call = None  # replace None

# TODO: compute terminal stock prices under risk-neutral measure:
#       S_T = S0 * exp((r - 0.5*sigma^2)*T + sigma*sqrt(T)*Z)
S_T = None  # replace None

# TODO: compute call payoffs: max(S_T - K, 0)
call_payoffs = None  # replace None

# TODO: discount payoffs: exp(-r*T) * mean(payoffs)
call_price_mc = None  # replace None

# ---------------------------------------------------------------------------
# 5. Bootstrap confidence interval for the mean of exponential data
# ---------------------------------------------------------------------------

np.random.seed(10)
data_exp = np.random.exponential(scale=3.0, size=500)
n_boot = 5_000

# TODO: generate n_boot bootstrap samples (sample with replacement from data_exp)
#       and compute their means → boot_means, shape (n_boot,)
boot_means = None  # replace None

# TODO: compute 2.5th and 97.5th percentiles of boot_means → ci_low, ci_high
ci_low  = None  # replace None
ci_high = None  # replace None

# ---------------------------------------------------------------------------
# 6. Value-at-Risk via Monte Carlo (1-day, 99% confidence)
# ---------------------------------------------------------------------------

np.random.seed(42)
port_mu, port_sigma = 0.0005, 0.015  # daily mean and std
n_var = 100_000

# TODO: simulate n_var daily returns from N(port_mu, port_sigma^2)
sim_returns = None  # replace None

# TODO: compute VaR as the 1st percentile (np.percentile at 1)
var_99 = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert x_mc is not None and y_mc is not None, "x_mc and y_mc must be defined"
    assert len(x_mc) == n_pi and len(y_mc) == n_pi, "x_mc and y_mc length mismatch"
    assert x_mc.min() >= -1 and x_mc.max() <= 1, "x_mc should be in [-1, 1]"

    assert pi_est is not None, "pi_est must be defined"
    assert np.isclose(pi_est, np.pi, atol=0.02), \
        f"pi estimate should be near {np.pi:.4f}, got {pi_est:.4f}"

    assert x_int is not None, "x_int must be defined"
    assert len(x_int) == n_int, "x_int length mismatch"

    assert mc_integral is not None, "mc_integral must be defined"
    assert np.isclose(mc_integral, 0.25, atol=0.01), \
        f"MC integral of x^3 should be ≈ 0.25, got {mc_integral:.4f}"

    assert Z is not None, "Z must be defined"
    assert Z.shape == (n_paths, n_periods), f"Z shape should be ({n_paths}, {n_periods})"

    assert log_returns is not None, "log_returns must be defined"
    assert log_returns.shape == (n_paths, n_periods), "log_returns shape mismatch"

    assert prices is not None, "prices must be defined"
    assert prices.shape == (n_paths, n_periods), f"prices shape should be ({n_paths}, {n_periods})"
    assert np.all(prices > 0), "all simulated prices should be positive"
    assert np.isclose(prices[:, 0].mean() / S0,
                      np.exp((mu - 0.5*sigma_gbm**2)*dt + sigma_gbm*np.sqrt(dt)*Z[:, 0].mean()), rtol=0.05)

    assert Z_call is not None, "Z_call must be defined"
    assert len(Z_call) == n_option, "Z_call length mismatch"

    assert S_T is not None, "S_T must be defined"
    assert len(S_T) == n_option, "S_T length mismatch"
    assert np.all(S_T > 0), "all terminal stock prices should be positive"

    assert call_payoffs is not None, "call_payoffs must be defined"
    assert np.all(call_payoffs >= 0), "call payoffs should be non-negative"

    assert call_price_mc is not None, "call_price_mc must be defined"
    assert call_price_mc > 0, "call price should be positive"
    # Black-Scholes analytical price ≈ 10.45 for these parameters
    assert np.isclose(call_price_mc, 10.45, atol=0.5), \
        f"MC call price should be near 10.45, got {call_price_mc:.4f}"

    assert boot_means is not None, "boot_means must be defined"
    assert len(boot_means) == n_boot, "boot_means length mismatch"
    assert np.isclose(boot_means.mean(), data_exp.mean(), atol=0.05), \
        "bootstrap mean should be close to sample mean"

    assert ci_low is not None and ci_high is not None, "ci_low and ci_high must be defined"
    assert ci_low < ci_high, "ci_low should be less than ci_high"
    assert ci_low < data_exp.mean() < ci_high, \
        "sample mean should be within bootstrap CI"

    assert sim_returns is not None, "sim_returns must be defined"
    assert len(sim_returns) == n_var, "sim_returns length mismatch"

    assert var_99 is not None, "var_99 must be defined"
    assert var_99 < 0, "VaR (1st percentile) should be negative"
    assert np.isclose(var_99, np.percentile(sim_returns, 1)), "var_99 = 1st percentile"

    print("Exercise 5.5 — All assertions passed!")

if __name__ == "__main__":
    main()
