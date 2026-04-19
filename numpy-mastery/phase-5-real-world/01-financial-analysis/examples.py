# ============================================================================
# Examples 5.1 — Financial Analysis  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# Simulate daily closing prices for a stock over 252 trading days
prices = 100 * np.cumprod(1 + np.random.normal(0.0005, 0.02, 252))

# --- BASIC ---

# 1. simple daily returns: (P_t - P_{t-1}) / P_{t-1}
returns = np.diff(prices) / prices[:-1]
print("Ex01 first 5 returns:", returns[:5].round(4))

# 2. log returns: ln(P_t / P_{t-1})
log_returns = np.log(prices[1:] / prices[:-1])
print("Ex02 first 5 log returns:", log_returns[:5].round(4))

# 3. cumulative return over the period
cum_return = (prices[-1] / prices[0]) - 1
print("Ex03 cumulative return:", round(cum_return, 4))

# 4. mean daily return
mean_ret = returns.mean()
print("Ex04 mean daily return:", round(mean_ret, 6))

# 5. daily return standard deviation (volatility)
daily_vol = returns.std()
print("Ex05 daily volatility:", round(daily_vol, 6))

# 6. annualized volatility (252 trading days)
annual_vol = daily_vol * np.sqrt(252)
print("Ex06 annual volatility:", round(annual_vol, 4))

# 7. annualized return
annual_ret = mean_ret * 252
print("Ex07 annualized return:", round(annual_ret, 4))

# 8. max price
print("Ex08 max price:", round(prices.max(), 2))

# 9. min price
print("Ex09 min price:", round(prices.min(), 2))

# 10. index of max price (peak)
print("Ex10 peak day:", np.argmax(prices))

# 11. price range
print("Ex11 price range:", round(prices.max() - prices.min(), 2))

# 12. days with positive return
positive_days = np.sum(returns > 0)
print("Ex12 positive days:", positive_days)

# 13. days with negative return
negative_days = np.sum(returns < 0)
print("Ex13 negative days:", negative_days)

# 14. median daily return
print("Ex14 median return:", round(np.median(returns), 6))

# 15. percentile returns (5th, 25th, 75th, 95th)
pcts = np.percentile(returns, [5, 25, 75, 95])
print("Ex15 percentiles:", pcts.round(4))

# --- INTERMEDIATE ---

# 16. rolling 20-day mean (simple moving average)
def rolling_mean(arr, window):
    return np.array([arr[i-window:i].mean() for i in range(window, len(arr)+1)])
sma_20 = rolling_mean(prices, 20)
print("Ex16 SMA20 last value:", round(sma_20[-1], 2))

# 17. rolling 20-day std (rolling volatility)
def rolling_std(arr, window):
    return np.array([arr[i-window:i].std() for i in range(window, len(arr)+1)])
rvol_20 = rolling_std(returns, 20)
print("Ex17 rolling vol (last):", round(rvol_20[-1], 6))

# 18. Sharpe ratio (risk-free rate = 0)
sharpe = (annual_ret) / annual_vol
print("Ex18 Sharpe ratio:", round(sharpe, 4))

# 19. Sharpe ratio with risk-free rate = 5% annually
rf = 0.05
sharpe_rf = (annual_ret - rf) / annual_vol
print("Ex19 Sharpe (rf=5%):", round(sharpe_rf, 4))

# 20. drawdown series
running_max = np.maximum.accumulate(prices)
drawdown = (prices - running_max) / running_max
print("Ex20 max drawdown:", round(drawdown.min(), 4))

# 21. maximum drawdown value
max_dd = drawdown.min()
print("Ex21 max drawdown %:", round(max_dd * 100, 2))

# 22. drawdown duration (longest consecutive drawdown in days)
in_dd = drawdown < 0
dd_lengths = []
count = 0
for v in in_dd:
    if v:
        count += 1
    else:
        if count > 0:
            dd_lengths.append(count)
        count = 0
max_dd_duration = max(dd_lengths) if dd_lengths else 0
print("Ex22 max drawdown duration:", max_dd_duration, "days")

# 23. VaR at 95% confidence (historical)
var_95 = np.percentile(returns, 5)
print("Ex23 VaR 95%:", round(var_95, 4))

# 24. VaR at 99% confidence
var_99 = np.percentile(returns, 1)
print("Ex24 VaR 99%:", round(var_99, 4))

# 25. Expected Shortfall (CVaR) at 95%
cvar_95 = returns[returns <= var_95].mean()
print("Ex25 CVaR 95%:", round(cvar_95, 4))

# 26. two-asset portfolio return (equal weights)
prices2 = 100 * np.cumprod(1 + np.random.normal(0.0003, 0.015, 252))
returns2 = np.diff(prices2) / prices2[:-1]
port_returns = 0.5 * returns + 0.5 * returns2
print("Ex26 portfolio mean return:", round(port_returns.mean(), 6))

# 27. portfolio volatility
print("Ex27 portfolio volatility:", round(port_returns.std(), 6))

# 28. correlation between two assets
corr = np.corrcoef(returns, returns2)[0, 1]
print("Ex28 correlation:", round(corr, 4))

# 29. covariance matrix
cov_mat = np.cov(np.stack([returns, returns2]))
print("Ex29 covariance matrix:\n", cov_mat.round(8))

# 30. beta of asset 1 vs asset 2 (systematic risk)
beta = cov_mat[0, 1] / cov_mat[1, 1]
print("Ex30 beta:", round(beta, 4))

# --- ADVANCED ---

# 31. multi-asset portfolio (5 assets, random weights)
n_assets = 5
asset_returns = np.random.normal(0.0005, 0.02, (251, n_assets))
weights = np.random.dirichlet(np.ones(n_assets))  # sum to 1
port_ret_multi = asset_returns @ weights
print("Ex31 multi-asset port mean:", round(port_ret_multi.mean(), 6))

# 32. minimum variance portfolio weights (analytical)
cov_5 = np.cov(asset_returns.T)
inv_cov = np.linalg.inv(cov_5)
ones = np.ones(n_assets)
mvp_weights = inv_cov @ ones / (ones @ inv_cov @ ones)
print("Ex32 MVP weights sum:", round(mvp_weights.sum(), 6))

# 33. portfolio variance with given weights
port_var = weights @ cov_5 @ weights
print("Ex33 portfolio variance:", round(port_var, 8))

# 34. Calmar ratio: annualized return / max drawdown
port_prices = np.cumprod(1 + port_returns) * 100
port_running_max = np.maximum.accumulate(port_prices)
port_dd = (port_prices - port_running_max) / port_running_max
calmar = (port_returns.mean() * 252) / abs(port_dd.min())
print("Ex34 Calmar ratio:", round(calmar, 4))

# 35. Sortino ratio (downside deviation only)
target = 0.0
downside_returns = returns[returns < target]
downside_dev = np.sqrt((downside_returns**2).mean()) * np.sqrt(252)
sortino = annual_ret / downside_dev if downside_dev > 0 else np.inf
print("Ex35 Sortino ratio:", round(sortino, 4))

# 36. rolling 60-day Sharpe ratio
window = 60
rolling_sharpe = np.array([
    (returns[i:i+window].mean() * 252) / (returns[i:i+window].std() * np.sqrt(252))
    for i in range(len(returns) - window + 1)
])
print("Ex36 rolling Sharpe range:", round(rolling_sharpe.min(), 2), "to", round(rolling_sharpe.max(), 2))

# 37. exponentially weighted moving average (EWMA)
def ewma(arr, span):
    alpha = 2 / (span + 1)
    result = np.empty_like(arr, dtype=float)
    result[0] = arr[0]
    for i in range(1, len(arr)):
        result[i] = alpha * arr[i] + (1 - alpha) * result[i-1]
    return result
ewma_vol = ewma(np.abs(returns), 20)
print("Ex37 EWMA vol (last 3):", ewma_vol[-3:].round(6))

# 38. Information ratio (active return vs tracking error)
benchmark_ret = np.random.normal(0.0004, 0.018, 251)
active_ret = returns - benchmark_ret
tracking_error = active_ret.std() * np.sqrt(252)
info_ratio = active_ret.mean() * 252 / tracking_error
print("Ex38 Information ratio:", round(info_ratio, 4))

# 39. autocorrelation of returns (lag-1)
autocorr_1 = np.corrcoef(returns[:-1], returns[1:])[0, 1]
print("Ex39 autocorrelation lag-1:", round(autocorr_1, 4))

# 40. GARCH(1,1) variance forecast concept
omega, alpha_g, beta_g = 0.000001, 0.05, 0.90
sigma2 = np.empty(len(returns))
sigma2[0] = returns.var()
for t in range(1, len(returns)):
    sigma2[t] = omega + alpha_g * returns[t-1]**2 + beta_g * sigma2[t-1]
print("Ex40 GARCH vol (last):", round(np.sqrt(sigma2[-1]), 6))

# 41. momentum factor (12-1 month, using 60-day vs 20-day return)
momentum = prices[-20] / prices[-80] - 1 if len(prices) >= 80 else 0.0
print("Ex41 momentum signal:", round(momentum, 4))

# 42. pairs trading: spread between two cointegrated assets
prices_a = 50 + np.cumsum(np.random.normal(0, 0.5, 252))
prices_b = 50 + np.cumsum(np.random.normal(0, 0.5, 252))
spread = prices_a - prices_b
z_score = (spread - spread.mean()) / spread.std()
print("Ex42 spread z-score range:", round(z_score.min(), 2), "to", round(z_score.max(), 2))

# --- EXPERT ---

# 43. efficient frontier (Monte Carlo simulation)
n_portfolios = 1000
ef_weights = np.random.dirichlet(np.ones(n_assets), n_portfolios)
ef_returns = ef_weights @ asset_returns.mean(axis=0) * 252
ef_vols = np.sqrt(np.array([w @ cov_5 @ w for w in ef_weights])) * np.sqrt(252)
ef_sharpes = ef_returns / ef_vols
best_idx = np.argmax(ef_sharpes)
print("Ex43 best Sharpe:", round(ef_sharpes[best_idx], 4))

# 44. risk parity weights (equal risk contribution)
asset_vols = np.sqrt(np.diag(cov_5))
rp_weights_raw = 1.0 / asset_vols
rp_weights = rp_weights_raw / rp_weights_raw.sum()
print("Ex44 risk parity weights:", rp_weights.round(4))

# 45. Black-Litterman blending concept
# Market cap weights (prior)
market_weights = np.array([0.3, 0.25, 0.2, 0.15, 0.1])
tau = 0.05
sigma_bl = tau * cov_5
# Views: asset 0 outperforms by 2% annually
P = np.zeros((1, n_assets)); P[0, 0] = 1
Q = np.array([0.02])
omega_bl = np.diag([0.001])
M_inv = np.linalg.inv(sigma_bl)
bl_return = np.linalg.solve(
    M_inv + P.T @ np.linalg.inv(omega_bl) @ P,
    M_inv @ (asset_returns.mean(axis=0) * 252) + P.T @ np.linalg.inv(omega_bl) @ Q
)
print("Ex45 BL combined return:", bl_return.round(4))

# 46. yield curve bootstrapping (simplified)
maturities = np.array([0.25, 0.5, 1, 2, 5, 10, 30])
yields = np.array([0.045, 0.047, 0.050, 0.049, 0.047, 0.046, 0.045])
# Discount factors
discount_factors = np.exp(-yields * maturities)
print("Ex46 discount factors:", discount_factors.round(4))

# 47. bond price and duration
coupon = 0.05
face = 1000
n_periods = 10
r = 0.04
cash_flows = np.full(n_periods, coupon * face)
cash_flows[-1] += face
t = np.arange(1, n_periods + 1)
pv_cf = cash_flows / (1 + r)**t
bond_price = pv_cf.sum()
duration = (t * pv_cf).sum() / bond_price
print("Ex47 bond price:", round(bond_price, 2), "duration:", round(duration, 4))

# 48. option Greeks — delta and gamma (Black-Scholes)
S, K_opt, T_opt, r_opt, sigma_opt = 100., 100., 1., 0.05, 0.2
d1 = (np.log(S/K_opt) + (r_opt + 0.5*sigma_opt**2)*T_opt) / (sigma_opt * np.sqrt(T_opt))
d2 = d1 - sigma_opt * np.sqrt(T_opt)
from numpy import exp
import math
N_d1 = 0.5 * (1 + math.erf(d1 / math.sqrt(2)))
N_d2 = 0.5 * (1 + math.erf(d2 / math.sqrt(2)))
call_price = S * N_d1 - K_opt * exp(-r_opt * T_opt) * N_d2
delta = N_d1
gamma = exp(-d1**2/2) / (np.sqrt(2*np.pi) * S * sigma_opt * np.sqrt(T_opt))
print("Ex48 call price:", round(call_price, 2), "delta:", round(delta, 4), "gamma:", round(gamma, 6))

# 49. rolling beta calculation (60-day windows)
n_windows = len(returns) - 60 + 1
rolling_beta = np.array([
    np.cov(returns[i:i+60], benchmark_ret[i:i+60])[0, 1] / np.var(benchmark_ret[i:i+60])
    for i in range(n_windows)
])
print("Ex49 rolling beta range:", round(rolling_beta.min(), 4), "to", round(rolling_beta.max(), 4))

# 50. Monte Carlo portfolio simulation (10-day VaR)
n_simulations = 10000
chol = np.linalg.cholesky(cov_5)
rand_shocks = np.random.standard_normal((n_simulations, n_assets, 10))
# 10-day cumulative return for equal-weight portfolio
port_10d = np.array([
    (rand_shocks[s] @ chol.T + asset_returns.mean(axis=0)).sum(axis=0) @ np.ones(n_assets)/n_assets
    for s in range(n_simulations)
])
mc_var_95 = np.percentile(port_10d, 5)
print("Ex50 MC 10-day VaR 95%:", round(mc_var_95, 4))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
