# ============================================================================
# Examples 5.5 — Monte Carlo Simulation  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# --- BASIC ---

# 1. estimate pi using Monte Carlo
n = 1_000_000
x_mc, y_mc = np.random.uniform(-1, 1, n), np.random.uniform(-1, 1, n)
pi_est = 4 * np.mean(x_mc**2 + y_mc**2 <= 1)
print("Ex01 pi estimate:", round(pi_est, 4))

# 2. standard error of pi estimate
pi_samples = 4 * (x_mc**2 + y_mc**2 <= 1).astype(float)
print("Ex02 pi std error:", round(pi_samples.std() / np.sqrt(n), 6))

# 3. MC integration of f(x) = x^2 over [0, 1]
x_int = np.random.uniform(0, 1, 100_000)
mc_integral = x_int**2
print("Ex03 MC integral x^2:", round(mc_integral.mean(), 4))  # exact = 1/3

# 4. MC integration error convergence
sizes = [100, 1000, 10000, 100000]
errors = []
for sz in sizes:
    xi = np.random.uniform(0, 1, sz)
    errors.append(abs(np.mean(xi**2) - 1/3))
print("Ex04 integration errors:", [round(e, 6) for e in errors])

# 5. random walk (1D, 1000 steps)
steps_rw = np.random.choice([-1, 1], 1000)
positions = np.cumsum(steps_rw)
print("Ex05 final position:", positions[-1])

# 6. random walk — expected RMS distance ~ sqrt(n)
n_walks = 10000
n_steps = 1000
walks = np.random.choice([-1, 1], (n_walks, n_steps)).cumsum(axis=1)
rms_dist = np.sqrt(np.mean(walks[:, -1]**2))
print("Ex06 RMS distance:", round(rms_dist, 2), "vs sqrt(n):", round(np.sqrt(n_steps), 2))

# 7. geometric Brownian motion (stock price simulation)
S0, mu, sigma_gbm, T, dt = 100., 0.10, 0.20, 1., 1/252
n_paths, n_periods = 1000, int(T / dt)
Z = np.random.standard_normal((n_paths, n_periods))
returns_gbm = (mu - 0.5 * sigma_gbm**2) * dt + sigma_gbm * np.sqrt(dt) * Z
prices_gbm = S0 * np.exp(returns_gbm.cumsum(axis=1))
print("Ex07 GBM final price (mean):", round(prices_gbm[:, -1].mean(), 2))

# 8. GBM — probability of price > 110 at maturity
prob_above = np.mean(prices_gbm[:, -1] > 110)
print("Ex08 P(S_T > 110):", round(prob_above, 4))

# 9. European call option price (risk-neutral MC)
r_rn, K_opt = 0.05, 100.
Z_rn = np.random.standard_normal(100_000)
S_T = S0 * np.exp((r_rn - 0.5 * sigma_gbm**2) * T + sigma_gbm * np.sqrt(T) * Z_rn)
call_payoff = np.maximum(S_T - K_opt, 0)
call_mc = np.exp(-r_rn * T) * call_payoff.mean()
print("Ex09 MC call price:", round(call_mc, 4))

# 10. Black-Scholes analytical call price for comparison
d1_bs = (np.log(S0/K_opt) + (r_rn + 0.5*sigma_gbm**2)*T) / (sigma_gbm*np.sqrt(T))
d2_bs = d1_bs - sigma_gbm*np.sqrt(T)
from scipy.special import ndtr as N  # normal CDF, or fallback below
# N = lambda z: 0.5*(1 + np.erf(z/np.sqrt(2)))  # requires scipy
call_bs = S0*N(d1_bs) - K_opt*np.exp(-r_rn*T)*N(d2_bs)
print("Ex10 BS call:", round(call_bs, 4), "error:", round(abs(call_mc - call_bs), 4))

# 11. birthday problem — P(collision in room of n people)
def birthday_mc(n_people, n_sims=100_000):
    rooms = np.random.randint(1, 366, (n_sims, n_people))
    return np.mean([len(np.unique(r)) < n_people for r in rooms])
prob_23 = birthday_mc(23, n_sims=10_000)
print("Ex11 birthday P(n=23):", round(prob_23, 3))  # ≈ 0.507

# 12. dice simulation — expected value of sum of 2d6
dice = np.random.randint(1, 7, (100_000, 2)).sum(axis=1)
print("Ex12 E[2d6] ≈ 7:", round(dice.mean(), 4))

# 13. coin flip — P(7 heads in 10 flips)
flips = np.random.randint(0, 2, (100_000, 10)).sum(axis=1)
print("Ex13 P(X=7):", round(np.mean(flips == 7), 4))  # exact ≈ 0.1172

# 14. Buffon's needle problem — estimate pi
l_needle, d_lines = 1., 2.
x_center = np.random.uniform(0, d_lines/2, 100_000)
theta = np.random.uniform(0, np.pi/2, 100_000)
crossings = x_center <= (l_needle/2) * np.sin(theta)
pi_buffon = (2 * l_needle) / (d_lines * crossings.mean())
print("Ex14 Buffon's needle pi:", round(pi_buffon, 4))

# 15. acceptance-rejection sampling (uniform → triangle distribution)
def sample_triangle(n_s, a=0., b=1.):
    samples_list = []
    while len(samples_list) < n_s:
        x_s = np.random.uniform(a, b, n_s * 3)
        u_s = np.random.uniform(0, 1, n_s * 3)
        # triangle PDF: f(x) = 2x for x in [0,1]
        accepted = x_s[u_s < 2 * x_s]
        samples_list.extend(accepted[:n_s - len(samples_list)])
    return np.array(samples_list[:n_s])
tri_samples = sample_triangle(10_000)
print("Ex15 triangle mean:", round(tri_samples.mean(), 4))  # exact = 2/3

# --- INTERMEDIATE ---

# 16. importance sampling for rare event (P(X > 4) for N(0,1))
n_is = 100_000
x_std = np.random.standard_normal(n_is)
rare_naive = np.mean(x_std > 4)
# IS with proposal N(4, 1)
x_prop = np.random.normal(4, 1, n_is)
weights = np.exp(-0.5*x_prop**2) / np.exp(-0.5*(x_prop-4)**2)
rare_is = np.mean((x_prop > 4) * weights)
print("Ex16 P(X>4) naive:", round(rare_naive, 8), "IS:", round(rare_is, 8))

# 17. antithetic variates (variance reduction)
u_mc = np.random.uniform(0, 1, 50_000)
u_anti = 1 - u_mc
f_u = np.exp(u_mc)
f_anti = np.exp(u_anti)
mc_av = (f_u + f_anti).mean() / 2
print("Ex17 AV estimate e-1:", round(mc_av - 1, 6))  # exact = e-1 ≈ 1.718

# 18. control variates (reduce variance using E[X] = 0.5)
n_cv = 50_000
u_cv = np.random.uniform(0, 1, n_cv)
g_cv = np.exp(u_cv)  # estimating E[e^U]
h_cv = u_cv         # control variate with E[U] = 0.5
c_opt = -np.cov(g_cv, h_cv)[0, 1] / np.var(h_cv)
g_cv_adj = g_cv + c_opt * (h_cv - 0.5)
print("Ex18 CV estimate:", round(g_cv_adj.mean(), 6))  # exact e-1 ≈ 1.71828

# 19. stratified sampling
n_strat = 10_000
strata = np.random.uniform(np.linspace(0, 0.9, 10), np.linspace(0.1, 1.0, 10), (n_strat, 10))
strat_est = np.exp(strata).mean()
print("Ex19 stratified estimate:", round(strat_est, 6))

# 20. bootstrap confidence interval for mean
data_boot = np.random.exponential(2, 500)
n_boot = 10_000
boot_means = np.array([np.random.choice(data_boot, 500, replace=True).mean()
                       for _ in range(n_boot)])
ci_95 = np.percentile(boot_means, [2.5, 97.5])
print("Ex20 bootstrap 95% CI:", ci_95.round(4))

# 21. permutation test for two-sample mean difference
group_a = np.random.normal(5, 1, 50)
group_b = np.random.normal(5.5, 1, 50)
obs_diff = group_b.mean() - group_a.mean()
combined = np.concatenate([group_a, group_b])
perm_diffs = np.array([
    np.random.permutation(combined)[:50].mean() - np.random.permutation(combined)[50:].mean()
    for _ in range(5000)
])
p_value = np.mean(np.abs(perm_diffs) >= abs(obs_diff))
print("Ex21 permutation p-value:", round(p_value, 4))

# 22. VaR via Monte Carlo
portfolio_rets = np.random.normal(0.001, 0.02, 10_000)
mc_var_99 = np.percentile(portfolio_rets, 1)
print("Ex22 portfolio MC VaR 99%:", round(mc_var_99, 6))

# 23. CVaR (Expected Shortfall)
mc_cvar = portfolio_rets[portfolio_rets <= mc_var_99].mean()
print("Ex23 portfolio MC CVaR:", round(mc_cvar, 6))

# 24. multi-path simulation (Heston model simplified)
def heston_mc(S0_h, v0, kappa, theta_h, xi, rho_h, r_h, T_h, n_paths_h, n_steps_h):
    dt_h = T_h / n_steps_h
    S = np.full(n_paths_h, S0_h)
    v = np.full(n_paths_h, v0)
    for _ in range(n_steps_h):
        Z1 = np.random.standard_normal(n_paths_h)
        Z2 = rho_h * Z1 + np.sqrt(1 - rho_h**2) * np.random.standard_normal(n_paths_h)
        v = np.maximum(v + kappa * (theta_h - v) * dt_h + xi * np.sqrt(np.maximum(v, 0) * dt_h) * Z2, 0)
        S = S * np.exp((r_h - 0.5*v) * dt_h + np.sqrt(np.maximum(v, 0) * dt_h) * Z1)
    return S
S_heston = heston_mc(100, 0.04, 2, 0.04, 0.5, -0.7, 0.05, 1, 1000, 252)
print("Ex24 Heston final mean:", round(S_heston.mean(), 2))

# 25. Asian option price (arithmetic mean payoff)
n_asian = 50_000
n_steps_a = 252
S_paths = np.ones((n_asian, n_steps_a + 1)) * S0
Z_a = np.random.standard_normal((n_asian, n_steps_a))
for t in range(1, n_steps_a + 1):
    S_paths[:, t] = S_paths[:, t-1] * np.exp((r_rn - 0.5*sigma_gbm**2)*dt + sigma_gbm*np.sqrt(dt)*Z_a[:, t-1])
avg_price = S_paths.mean(axis=1)
asian_call = np.exp(-r_rn * T) * np.maximum(avg_price - K_opt, 0).mean()
print("Ex25 Asian call price:", round(asian_call, 4))

# 26. barrier option (down-and-out call, barrier B=80)
B_barrier = 80.
knocked_out = np.any(S_paths < B_barrier, axis=1)
barrier_payoff = np.maximum(S_paths[:, -1] - K_opt, 0)
barrier_payoff[knocked_out] = 0
barrier_call = np.exp(-r_rn * T) * barrier_payoff.mean()
print("Ex26 barrier call price:", round(barrier_call, 4))

# 27. delta hedging P&L distribution
delta_sim = N(d1_bs)
delta_pnl = delta_sim * (S_T[:1000] - S0) - np.maximum(S_T[:1000] - K_opt, 0) + call_bs
print("Ex27 delta hedge P&L std:", round(delta_pnl.std(), 4))

# 28. jump-diffusion model (Merton)
n_jd = 10_000
lam_jd, mu_j, sigma_j = 5., -0.02, 0.05  # jump intensity, mean, std
Z_jd = np.random.standard_normal(n_jd)
N_jumps = np.random.poisson(lam_jd * dt * n_periods, n_jd)
J_size = np.random.normal(mu_j, sigma_j, n_jd)
S_jd = S0 * np.exp((r_rn - 0.5*sigma_gbm**2 - lam_jd*(np.exp(mu_j + 0.5*sigma_j**2)-1))*T +
                    sigma_gbm*np.sqrt(T)*Z_jd + N_jumps*J_size)
jd_call = np.exp(-r_rn * T) * np.maximum(S_jd - K_opt, 0).mean()
print("Ex28 jump-diffusion call:", round(jd_call, 4))

# 29. quasi-Monte Carlo with Halton sequence
def halton(n_hq, base):
    seq = np.zeros(n_hq)
    for i in range(n_hq):
        f, r = 1.0, 0.0
        j = i + 1
        while j > 0:
            f /= base
            r += f * (j % base)
            j //= base
        seq[i] = r
    return seq
h2 = halton(10_000, 2)
h3 = halton(10_000, 3)
pi_qmc = 4 * np.mean((2*h2-1)**2 + (2*h3-1)**2 <= 1)
print("Ex29 QMC pi estimate:", round(pi_qmc, 4))

# 30. Latin hypercube sampling (LHS)
def lhs(n_samples, n_dims):
    result = np.zeros((n_samples, n_dims))
    for d in range(n_dims):
        perm = np.random.permutation(n_samples)
        result[:, d] = (perm + np.random.uniform(0, 1, n_samples)) / n_samples
    return result
lhs_samples = lhs(1000, 3)
print("Ex30 LHS shape:", lhs_samples.shape, "range:", round(lhs_samples.min(), 3), round(lhs_samples.max(), 3))

# --- ADVANCED ---

# 31. portfolio VaR (multi-asset, correlated)
n_assets_mc = 3
mu_assets = np.array([0.001, 0.0008, 0.0012])
cov_assets = np.array([[0.0004, 0.0002, 0.0001],
                        [0.0002, 0.0003, 0.00015],
                        [0.0001, 0.00015, 0.0005]])
w_assets = np.array([0.4, 0.3, 0.3])
chol_assets = np.linalg.cholesky(cov_assets)
Z_port = np.random.standard_normal((100_000, n_assets_mc))
sim_rets = Z_port @ chol_assets.T + mu_assets
port_sim_rets = sim_rets @ w_assets
port_var_mc = np.percentile(port_sim_rets, 5)
print("Ex31 multi-asset VaR 95%:", round(port_var_mc, 6))

# 32. stress testing: fat-tail simulation
t_df = 5  # Student-t degrees of freedom
z_t = np.random.standard_t(t_df, 100_000)
z_t = z_t / np.sqrt(t_df / (t_df - 2))  # normalize to unit variance
stressed_rets = mu_assets[0] + np.sqrt(cov_assets[0, 0]) * z_t
stressed_var = np.percentile(stressed_rets, 1)
print("Ex32 stressed VaR:", round(stressed_var, 6))

# 33. credit risk — probability of default (Merton model)
D_merton = 80.  # debt face value
T_merton = 1.
V_assets_mc = np.random.lognormal(np.log(S0) + (r_rn - 0.5*sigma_gbm**2)*T_merton,
                                    sigma_gbm * np.sqrt(T_merton), 100_000)
pd_merton = np.mean(V_assets_mc < D_merton)
print("Ex33 Merton PD:", round(pd_merton, 4))

# 34. Markov Chain Monte Carlo (Metropolis-Hastings)
def metropolis_hastings(log_p, x0_mh, n_iter, step_mh=0.5):
    x_mh = x0_mh
    samples_mh = np.empty(n_iter)
    for i in range(n_iter):
        x_prop = x_mh + np.random.normal(0, step_mh)
        log_alpha = log_p(x_prop) - log_p(x_mh)
        if np.log(np.random.uniform()) < log_alpha:
            x_mh = x_prop
        samples_mh[i] = x_mh
    return samples_mh
# Target: N(3, 1)
log_normal_3 = lambda x_ln: -0.5 * (x_ln - 3)**2
mh_samples = metropolis_hastings(log_normal_3, 0., 50_000, step_mh=1.0)
burn_in = 5000
print("Ex34 MCMC mean:", round(mh_samples[burn_in:].mean(), 4))  # ≈ 3

# 35. nested Monte Carlo (ABC concept)
def abc_likelihood(theta_abc, obs_abc, n_sim=500, eps=0.2):
    sim_abc = np.random.normal(theta_abc, 1, n_sim)
    return abs(sim_abc.mean() - obs_abc) < eps
obs_data = 2.5
theta_prior = np.random.uniform(0, 5, 10_000)
accepted = theta_prior[np.array([abc_likelihood(t, obs_data) for t in theta_prior])]
print("Ex35 ABC posterior mean:", round(accepted.mean(), 4) if len(accepted) else "no accepted")

# 36. parallel Monte Carlo paths with structured output
n_paths_struct = 5000
path_data = np.empty(n_paths_struct, dtype=[('S_T', float), ('max_S', float), ('payoff', float)])
Z_s = np.random.standard_normal((n_paths_struct, n_periods))
paths = S0 * np.exp(np.cumsum((r_rn - 0.5*sigma_gbm**2)*dt + sigma_gbm*np.sqrt(dt)*Z_s, axis=1))
path_data['S_T'] = paths[:, -1]
path_data['max_S'] = paths.max(axis=1)
path_data['payoff'] = np.maximum(paths[:, -1] - K_opt, 0)
print("Ex36 structured MC payoff mean:", round(path_data['payoff'].mean(), 4))

# 37. lookback option (floating strike)
lookback_payoff = path_data['S_T'] - paths.min(axis=1)
lookback_price = np.exp(-r_rn * T) * lookback_payoff.mean()
print("Ex37 lookback call price:", round(lookback_price, 4))

# 38. variance swap payoff (realized vs implied volatility)
realized_vol = np.sqrt(252 * np.mean(np.diff(np.log(paths[:100]), axis=1)**2, axis=1))
K_var = sigma_gbm**2  # implied variance
var_swap_pnl = realized_vol**2 - K_var
print("Ex38 variance swap mean P&L:", round(var_swap_pnl.mean(), 6))

# 39. confidence interval for MC estimator
n_rep = 1000
rep_estimates = np.array([np.random.uniform(0, 1, 1000).mean() for _ in range(n_rep)])
ci = np.percentile(rep_estimates, [2.5, 97.5])
print("Ex39 MC CI for E[U]:", ci.round(4))  # should contain 0.5

# 40. multilevel Monte Carlo concept (coarse vs fine grid)
def gbm_path(n_steps_ml, seed=None):
    if seed is not None:
        np.random.seed(seed)
    Z_ml = np.random.standard_normal(n_steps_ml)
    dt_ml = T / n_steps_ml
    log_prices = np.cumsum((r_rn - 0.5*sigma_gbm**2)*dt_ml + sigma_gbm*np.sqrt(dt_ml)*Z_ml)
    return S0 * np.exp(log_prices[-1])
coarse_payoffs = np.array([np.maximum(gbm_path(10, s) - K_opt, 0) for s in range(5000)])
fine_payoffs = np.array([np.maximum(gbm_path(252, s) - K_opt, 0) for s in range(5000)])
mlmc_correction = fine_payoffs.mean() - coarse_payoffs.mean()
print("Ex40 MLMC correction:", round(mlmc_correction, 4))

# 41. Sobol sequence low-discrepancy (simplified)
def sobol_1d(n_sob):
    seq = np.zeros(n_sob)
    gray_code_prev = 0
    v = 1.0 / 2**np.arange(1, 33)[::-1]
    for i in range(n_sob):
        gray_code = i ^ (i >> 1)
        changed_bits = gray_code ^ gray_code_prev
        seq[i] = seq[i-1] if i > 0 else 0
        bit_pos = int(np.log2(changed_bits + 1)) if changed_bits > 0 else 0
        seq[i] += (1 if gray_code & (1 << bit_pos) else -1) * v[bit_pos] if changed_bits > 0 else 0
        seq[i] = abs(seq[i]) % 1
        gray_code_prev = gray_code
    return seq
sobol_s = sobol_1d(1000)
print("Ex41 Sobol-like discrepancy:", round(abs(sobol_s.mean() - 0.5), 4))

# 42. simulation-based sensitivity analysis (Sobol indices concept)
def mc_sensitivity(f_sens, n_sens, d_sens):
    A = np.random.uniform(0, 1, (n_sens, d_sens))
    B = np.random.uniform(0, 1, (n_sens, d_sens))
    f_A = f_sens(A)
    f_B = f_sens(B)
    V_total = f_A.var()
    S_i = np.zeros(d_sens)
    for i_s in range(d_sens):
        AB_i = A.copy(); AB_i[:, i_s] = B[:, i_s]
        f_AB_i = f_sens(AB_i)
        S_i[i_s] = np.mean(f_B * (f_AB_i - f_A)) / V_total
    return S_i
sobol_idx = mc_sensitivity(lambda X_s: X_s[:, 0]**2 + 2*X_s[:, 1] + 0.5*X_s[:, 2],
                           n_sens=10000, d_sens=3)
print("Ex42 Sobol indices:", sobol_idx.round(4))

# --- EXPERT ---

# 43. Particle filter (Sequential Monte Carlo)
def particle_filter(observations_pf, n_particles=500, sigma_pf=0.5):
    particles = np.random.normal(0, 2, n_particles)
    weights = np.ones(n_particles) / n_particles
    estimates_pf = []
    for obs in observations_pf:
        # predict
        particles += np.random.normal(0, 0.1, n_particles)
        # update (Gaussian likelihood)
        log_w = -0.5 * (obs - particles)**2 / sigma_pf**2
        log_w -= log_w.max()
        weights = np.exp(log_w)
        weights /= weights.sum()
        estimates_pf.append(np.sum(weights * particles))
        # resample
        idx_pf = np.random.choice(n_particles, n_particles, p=weights)
        particles = particles[idx_pf]
        weights = np.ones(n_particles) / n_particles
    return np.array(estimates_pf)
true_state = np.cumsum(np.random.normal(0, 0.1, 50))
observations_pf = true_state + np.random.normal(0, 0.5, 50)
pf_estimates = particle_filter(observations_pf)
pf_error = np.sqrt(np.mean((pf_estimates - true_state)**2))
print("Ex43 particle filter RMSE:", round(pf_error, 4))

# 44. Sequential importance sampling (unnormalized weights)
def sis(target_log_pdf, proposal_sample, n_sis=10_000):
    samples_sis = proposal_sample(n_sis)
    log_w_sis = target_log_pdf(samples_sis) - (-0.5 * samples_sis**2)  # proposal = N(0,1)
    log_w_sis -= log_w_sis.max()
    w_sis = np.exp(log_w_sis)
    w_sis /= w_sis.sum()
    return samples_sis, w_sis
# Target: Laplace distribution with b=1, location=0
target_log_laplace = lambda x_l: -np.abs(x_l)
sis_samples, sis_weights = sis(target_log_laplace, np.random.standard_normal)
sis_mean = np.sum(sis_weights * sis_samples)
print("Ex44 SIS Laplace mean:", round(sis_mean, 4))  # ≈ 0

# 45. replica exchange MCMC (parallel tempering concept)
def parallel_tempering(log_p_pt, n_chains=4, n_iter_pt=10_000, step=0.5):
    temps = np.array([1.0, 2.0, 4.0, 8.0])
    chains = np.zeros(n_chains)
    samples_pt = np.empty((n_chains, n_iter_pt))
    for it in range(n_iter_pt):
        for ch in range(n_chains):
            prop = chains[ch] + np.random.normal(0, step)
            log_a = (log_p_pt(prop) - log_p_pt(chains[ch])) / temps[ch]
            if np.log(np.random.uniform()) < log_a:
                chains[ch] = prop
        # swap adjacent chains
        ch_swap = np.random.randint(0, n_chains - 1)
        log_accept_swap = ((log_p_pt(chains[ch_swap]) - log_p_pt(chains[ch_swap+1])) *
                           (1/temps[ch_swap] - 1/temps[ch_swap+1]))
        if np.log(np.random.uniform()) < log_accept_swap:
            chains[ch_swap], chains[ch_swap+1] = chains[ch_swap+1], chains[ch_swap]
        samples_pt[:, it] = chains
    return samples_pt
log_bimodal = lambda x_b: np.log(0.5 * np.exp(-0.5*(x_b-3)**2) + 0.5 * np.exp(-0.5*(x_b+3)**2) + 1e-300)
pt_samples = parallel_tempering(log_bimodal, n_iter_pt=5_000)
print("Ex45 PT chain 0 mean:", round(pt_samples[0, 2000:].mean(), 4))

# 46. Quasi-MC integration error vs regular MC
def compare_mc_qmc(f_cmp, n_cmp):
    u_reg = np.random.uniform(0, 1, n_cmp)
    mc_est = f_cmp(u_reg).mean()
    # Stratified as QMC proxy
    strata_qmc = (np.arange(n_cmp) + np.random.uniform(0, 1, n_cmp)) / n_cmp
    qmc_est = f_cmp(strata_qmc).mean()
    exact = np.e - 1  # integral of e^x from 0 to 1
    return abs(mc_est - exact), abs(qmc_est - exact)
mc_err, qmc_err = compare_mc_qmc(np.exp, 10_000)
print("Ex46 MC error:", round(mc_err, 6), "QMC error:", round(qmc_err, 6))

# 47. multilevel bootstrap (hierarchical)
def multilevel_bootstrap(data_mlb, levels, n_boot_mlb=1000):
    boot_stats = np.empty(n_boot_mlb)
    for b in range(n_boot_mlb):
        level_data = data_mlb.copy()
        for _ in range(levels):
            idx_mlb = np.random.choice(len(level_data), len(level_data), replace=True)
            level_data = level_data[idx_mlb]
        boot_stats[b] = level_data.mean()
    return boot_stats
mlb_stats = multilevel_bootstrap(np.random.normal(0, 1, 100), levels=2)
print("Ex47 multilevel bootstrap mean:", round(mlb_stats.mean(), 4))

# 48. Bayesian credible interval (Gaussian conjugate)
# Prior: N(mu0, sigma0^2), likelihood: N(theta, sigma_l^2)
mu0, sigma0 = 0., 10.
sigma_l = 1.
data_bayes = np.random.normal(3., sigma_l, 30)
n_b = len(data_bayes)
sigma_n = 1. / (1/sigma0**2 + n_b/sigma_l**2)
mu_n = sigma_n * (mu0/sigma0**2 + data_bayes.sum()/sigma_l**2)
posterior_samples = np.random.normal(mu_n, np.sqrt(sigma_n), 100_000)
credible_int = np.percentile(posterior_samples, [2.5, 97.5])
print("Ex48 Bayesian 95% CI:", credible_int.round(4))

# 49. nested sampling (concept — shrinking prior volume)
def nested_sampling(log_L, n_live=100, n_iter_ns=500):
    live_points = np.random.uniform(0, 1, n_live)
    log_Z = -np.inf
    log_w = np.log(1.0 / n_live)
    for i in range(n_iter_ns):
        worst_idx = np.argmin(log_L(live_points))
        log_Li = log_L(live_points[worst_idx])
        log_Z = np.logaddexp(log_Z, log_w + log_Li)
        log_w += -1.0 / n_live
        # replace worst point with new sample above threshold
        while True:
            new_pt = np.random.uniform(0, 1)
            if log_L(new_pt) > log_Li:
                live_points[worst_idx] = new_pt
                break
    return np.exp(log_Z)
# Model: data ~ N(theta, 1), prior theta ~ U(0,1), data=0.5
log_L_ns = lambda theta_ns: -0.5 * (theta_ns - 0.5)**2
Z_ns = nested_sampling(log_L_ns)
print("Ex49 nested sampling log_Z:", round(np.log(Z_ns), 4))

# 50. full simulation pipeline for option pricing
def full_mc_option_pipeline(S0_fp, K_fp, r_fp, sigma_fp, T_fp, n_paths_fp,
                            n_steps_fp, option_type='call', seed=42):
    np.random.seed(seed)
    dt_fp = T_fp / n_steps_fp
    Z_fp = np.random.standard_normal((n_paths_fp, n_steps_fp))
    log_ret_fp = (r_fp - 0.5*sigma_fp**2)*dt_fp + sigma_fp*np.sqrt(dt_fp)*Z_fp
    S_paths_fp = S0_fp * np.exp(log_ret_fp.cumsum(axis=1))
    S_T_fp = S_paths_fp[:, -1]
    if option_type == 'call':
        payoffs_fp = np.maximum(S_T_fp - K_fp, 0)
    elif option_type == 'put':
        payoffs_fp = np.maximum(K_fp - S_T_fp, 0)
    else:
        raise ValueError(f"Unknown option type: {option_type}")
    price_fp = np.exp(-r_fp * T_fp) * payoffs_fp.mean()
    se_fp = np.exp(-r_fp * T_fp) * payoffs_fp.std() / np.sqrt(n_paths_fp)
    return price_fp, se_fp, S_paths_fp
call_p, call_se, _ = full_mc_option_pipeline(100, 100, 0.05, 0.20, 1., 50_000, 252)
put_p, put_se, _ = full_mc_option_pipeline(100, 100, 0.05, 0.20, 1., 50_000, 252, 'put')
print("Ex50 call:", round(call_p, 4), "±", round(call_se*2, 4))
print("Ex50 put:", round(put_p, 4), "±", round(put_se*2, 4))
print("Ex50 put-call parity check:", round(abs(call_p - put_p - S0*1 + K_opt*np.exp(-r_rn*T)), 4))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
