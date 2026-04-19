# ============================================================================
# Exercise 5.1 — Financial Analysis
# ============================================================================
# Use NumPy to perform core financial calculations: returns, risk metrics,
# portfolio construction, and option pricing.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

np.random.seed(0)

# Simulate 252 trading days of prices for two assets
prices_a = 100 * np.cumprod(1 + np.random.normal(0.0005, 0.02, 252))
prices_b = 100 * np.cumprod(1 + np.random.normal(0.0003, 0.015, 252))

# ---------------------------------------------------------------------------
# 1. Daily simple returns for asset A
# ---------------------------------------------------------------------------

# TODO: compute simple daily returns: (P_t - P_{t-1}) / P_{t-1}
returns_a = None  # replace None

# ---------------------------------------------------------------------------
# 2. Annualized mean return and volatility for asset A
# ---------------------------------------------------------------------------

# TODO: annualize mean daily return (multiply by 252)
annual_return_a = None  # replace None

# TODO: annualize daily std (multiply by sqrt(252))
annual_vol_a = None  # replace None

# ---------------------------------------------------------------------------
# 3. Sharpe ratio for asset A (risk-free rate = 0)
# ---------------------------------------------------------------------------

# TODO: compute Sharpe ratio = annual_return / annual_vol
sharpe_a = None  # replace None

# ---------------------------------------------------------------------------
# 4. Maximum drawdown for asset A
# ---------------------------------------------------------------------------

# TODO: compute running maximum of prices_a
running_max_a = None  # replace None

# TODO: compute drawdown series: (prices - running_max) / running_max
drawdown_a = None  # replace None

# TODO: store the maximum drawdown (most negative value)
max_drawdown_a = None  # replace None

# ---------------------------------------------------------------------------
# 5. Value-at-Risk at 95% confidence (historical)
# ---------------------------------------------------------------------------

# TODO: compute 5th percentile of returns_a
var_95_a = None  # replace None

# ---------------------------------------------------------------------------
# 6. Returns for asset B and correlation
# ---------------------------------------------------------------------------

# TODO: compute simple daily returns for asset B
returns_b = None  # replace None

# TODO: compute correlation between returns_a and returns_b
correlation_ab = None  # replace None

# ---------------------------------------------------------------------------
# 7. Equal-weight portfolio return and volatility
# ---------------------------------------------------------------------------

# TODO: compute equal-weight portfolio daily returns (50% each asset)
port_returns = None  # replace None

# TODO: annualize portfolio volatility
port_annual_vol = None  # replace None

# ---------------------------------------------------------------------------
# 8. Covariance matrix of returns_a and returns_b
# ---------------------------------------------------------------------------

# TODO: compute 2x2 covariance matrix using np.cov
cov_matrix = None  # replace None

# ---------------------------------------------------------------------------
# 9. European call option price via Black-Scholes
# ---------------------------------------------------------------------------

S0, K, T, r, sigma = 100., 100., 1., 0.05, 0.20

# TODO: compute d1 = (ln(S0/K) + (r + 0.5*sigma^2)*T) / (sigma*sqrt(T))
d1 = None  # replace None

# TODO: compute d2 = d1 - sigma * sqrt(T)
d2 = None  # replace None

# TODO: compute N(d1) and N(d2) using the error function:
#       N(x) = 0.5 * (1 + math.erf(x / math.sqrt(2)))  — import math first
N_d1 = None  # replace None
N_d2 = None  # replace None

# TODO: compute call price = S0*N(d1) - K*exp(-r*T)*N(d2)
call_price = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert returns_a is not None, "returns_a must be defined"
    assert len(returns_a) == 251, f"returns_a should have 251 elements, got {len(returns_a)}"
    assert returns_a.dtype in [np.float64, np.float32], "returns_a should be float"

    assert annual_return_a is not None, "annual_return_a must be defined"
    assert np.isclose(annual_return_a, returns_a.mean() * 252), "annual_return_a = mean * 252"

    assert annual_vol_a is not None, "annual_vol_a must be defined"
    assert np.isclose(annual_vol_a, returns_a.std() * np.sqrt(252)), "annual_vol_a = std * sqrt(252)"

    assert sharpe_a is not None, "sharpe_a must be defined"
    assert np.isclose(sharpe_a, annual_return_a / annual_vol_a), "Sharpe = annual_ret / annual_vol"

    assert running_max_a is not None, "running_max_a must be defined"
    assert len(running_max_a) == len(prices_a), "running_max_a should match prices length"
    assert np.all(running_max_a >= prices_a), "running_max should always >= current price"

    assert drawdown_a is not None, "drawdown_a must be defined"
    assert np.all(drawdown_a <= 0), "drawdown should always be <= 0"

    assert max_drawdown_a is not None, "max_drawdown_a must be defined"
    assert max_drawdown_a <= 0, "max drawdown should be negative"
    assert np.isclose(max_drawdown_a, drawdown_a.min()), "max_drawdown_a = drawdown.min()"

    assert var_95_a is not None, "var_95_a must be defined"
    assert np.isclose(var_95_a, np.percentile(returns_a, 5)), "VaR 95% = 5th percentile"
    assert var_95_a < 0, "5th percentile return should be negative"

    assert returns_b is not None, "returns_b must be defined"
    assert len(returns_b) == 251, "returns_b should have 251 elements"

    assert correlation_ab is not None, "correlation_ab must be defined"
    assert -1 <= correlation_ab <= 1, "correlation must be in [-1, 1]"
    assert np.isclose(correlation_ab, np.corrcoef(returns_a, returns_b)[0, 1]), "use np.corrcoef"

    assert port_returns is not None, "port_returns must be defined"
    assert np.allclose(port_returns, 0.5 * returns_a + 0.5 * returns_b), "equal weight portfolio"

    assert port_annual_vol is not None, "port_annual_vol must be defined"
    assert np.isclose(port_annual_vol, port_returns.std() * np.sqrt(252)), "annualize with sqrt(252)"

    assert cov_matrix is not None, "cov_matrix must be defined"
    assert cov_matrix.shape == (2, 2), "covariance matrix should be 2x2"
    assert np.allclose(cov_matrix, cov_matrix.T), "covariance matrix should be symmetric"

    assert d1 is not None, "d1 must be defined"
    d1_expected = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma * np.sqrt(T))
    assert np.isclose(d1, d1_expected), f"d1 should be {d1_expected:.6f}"

    assert d2 is not None, "d2 must be defined"
    assert np.isclose(d2, d1 - sigma * np.sqrt(T)), "d2 = d1 - sigma*sqrt(T)"

    assert N_d1 is not None, "N_d1 must be defined"
    assert N_d2 is not None, "N_d2 must be defined"
    assert 0 < N_d1 < 1, "N_d1 should be between 0 and 1"
    assert 0 < N_d2 < 1, "N_d2 should be between 0 and 1"

    assert call_price is not None, "call_price must be defined"
    assert call_price > 0, "call price should be positive"
    call_expected = S0*N_d1 - K*np.exp(-r*T)*N_d2
    assert np.isclose(call_price, call_expected, rtol=1e-5), f"call_price should be {call_expected:.4f}"

    print("Exercise 5.1 — All assertions passed!")

if __name__ == "__main__":
    main()
