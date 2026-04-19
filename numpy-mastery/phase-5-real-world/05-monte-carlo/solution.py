# ============================================================================
# Solution 5.5 — Monte Carlo Simulation
# ============================================================================

import numpy as np

np.random.seed(42)

# 1. Estimate pi
n_pi = 1_000_000
x_mc = np.random.uniform(-1, 1, n_pi)
y_mc = np.random.uniform(-1, 1, n_pi)
pi_est = 4 * np.mean(x_mc**2 + y_mc**2 <= 1)

# 2. MC integration of x^3 over [0, 1]
n_int = 200_000
x_int = np.random.uniform(0, 1, n_int)
mc_integral = np.mean(x_int**3)

# 3. Geometric Brownian Motion
S0, mu, sigma_gbm, dt = 100., 0.08, 0.20, 1/252
n_paths, n_periods = 2000, 252
Z = np.random.standard_normal((n_paths, n_periods))
log_returns = (mu - 0.5 * sigma_gbm**2) * dt + sigma_gbm * np.sqrt(dt) * Z
prices = S0 * np.exp(log_returns.cumsum(axis=1))

# 4. European call option price
r_rn, K_opt, T_opt = 0.05, 100., 1.
sigma_opt = 0.20
n_option = 100_000
Z_call = np.random.standard_normal(n_option)
S_T = S0 * np.exp((r_rn - 0.5 * sigma_opt**2) * T_opt + sigma_opt * np.sqrt(T_opt) * Z_call)
call_payoffs = np.maximum(S_T - K_opt, 0)
call_price_mc = np.exp(-r_rn * T_opt) * call_payoffs.mean()

# 5. Bootstrap confidence interval
np.random.seed(10)
data_exp = np.random.exponential(scale=3.0, size=500)
n_boot = 5_000
boot_means = np.array([
    np.random.choice(data_exp, size=len(data_exp), replace=True).mean()
    for _ in range(n_boot)
])
ci_low  = np.percentile(boot_means, 2.5)
ci_high = np.percentile(boot_means, 97.5)

# 6. VaR via Monte Carlo
np.random.seed(42)
port_mu, port_sigma = 0.0005, 0.015
n_var = 100_000
sim_returns = np.random.normal(port_mu, port_sigma, n_var)
var_99 = np.percentile(sim_returns, 1)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert x_mc is not None and y_mc is not None
    assert len(x_mc) == n_pi and len(y_mc) == n_pi
    assert x_mc.min() >= -1 and x_mc.max() <= 1

    assert pi_est is not None
    assert np.isclose(pi_est, np.pi, atol=0.02)

    assert x_int is not None
    assert len(x_int) == n_int

    assert mc_integral is not None
    assert np.isclose(mc_integral, 0.25, atol=0.01)

    assert Z is not None
    assert Z.shape == (n_paths, n_periods)

    assert log_returns is not None
    assert log_returns.shape == (n_paths, n_periods)

    assert prices is not None
    assert prices.shape == (n_paths, n_periods)
    assert np.all(prices > 0)

    assert Z_call is not None
    assert len(Z_call) == n_option

    assert S_T is not None
    assert len(S_T) == n_option
    assert np.all(S_T > 0)

    assert call_payoffs is not None
    assert np.all(call_payoffs >= 0)

    assert call_price_mc is not None
    assert call_price_mc > 0
    assert np.isclose(call_price_mc, 10.45, atol=0.5)

    assert boot_means is not None
    assert len(boot_means) == n_boot
    assert np.isclose(boot_means.mean(), data_exp.mean(), atol=0.05)

    assert ci_low is not None and ci_high is not None
    assert ci_low < ci_high
    assert ci_low < data_exp.mean() < ci_high

    assert sim_returns is not None
    assert len(sim_returns) == n_var

    assert var_99 is not None
    assert var_99 < 0
    assert np.isclose(var_99, np.percentile(sim_returns, 1))

    print("Solution 5.5 — All assertions passed!")

if __name__ == "__main__":
    main()
