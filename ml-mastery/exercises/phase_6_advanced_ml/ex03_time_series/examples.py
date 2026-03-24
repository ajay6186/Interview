# ============================================================
# Examples 6.3 — Time Series Analysis (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np

np.random.seed(42)


def _generate(n=120, seed=42):
    rng = np.random.default_rng(seed)
    t = np.arange(n)
    return 0.05 * t + np.sin(2 * np.pi * t / 12) + rng.normal(0, 0.5, n)

SERIES = _generate()

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Generate a synthetic time series with trend + seasonal + noise"""
    ts = _generate(n=60)
    print("Ex01 — shape:", ts.shape, "| first 5:", np.round(ts[:5], 3))

def ex02():
    """Simple moving average (window=3)"""
    ts = np.array([1.0, 3.0, 5.0, 7.0, 9.0, 11.0])
    result = np.full(len(ts), np.nan)
    for i in range(2, len(ts)):
        result[i] = ts[i-2:i+1].mean()
    print("Ex02 — MA(3):", np.round(result, 4))

def ex03():
    """Moving average (window=12) on SERIES"""
    window = 12
    result = np.full(len(SERIES), np.nan)
    for i in range(window - 1, len(SERIES)):
        result[i] = SERIES[i - window + 1 : i + 1].mean()
    print("Ex03 — MA(12) first valid:", round(float(result[11]), 4),
          "| last:", round(float(result[-1]), 4))

def ex04():
    """Simple exponential smoothing (alpha=0.3)"""
    alpha = 0.3
    s = np.zeros(len(SERIES))
    s[0] = SERIES[0]
    for t in range(1, len(SERIES)):
        s[t] = alpha * SERIES[t] + (1 - alpha) * s[t - 1]
    print("Ex04 — SES first 5:", np.round(s[:5], 4))

def ex05():
    """Train/test split for time series (preserve order)"""
    split = int(len(SERIES) * 0.8)
    train, test = SERIES[:split], SERIES[split:]
    print("Ex05 — train:", len(train), "| test:", len(test))

def ex06():
    """First-order differencing"""
    diff1 = np.diff(SERIES)
    print("Ex06 — original shape:", SERIES.shape, "| diff1 shape:", diff1.shape,
          "| first 5:", np.round(diff1[:5], 4))

def ex07():
    """Second-order differencing"""
    diff2 = np.diff(SERIES, n=2)
    print("Ex07 — diff2 shape:", diff2.shape, "| first 5:", np.round(diff2[:5], 4))

def ex08():
    """Auto-correlation at lag 1"""
    ts = SERIES
    mean = ts.mean()
    var  = np.sum((ts - mean) ** 2)
    cov  = np.sum((ts[:-1] - mean) * (ts[1:] - mean))
    acf1 = cov / var
    print("Ex08 — ACF(lag=1):", round(float(acf1), 4))

def ex09():
    """Rolling statistics: mean and std"""
    window = 12
    rolling_mean = np.full(len(SERIES), np.nan)
    rolling_std  = np.full(len(SERIES), np.nan)
    for i in range(window - 1, len(SERIES)):
        rolling_mean[i] = SERIES[i - window + 1 : i + 1].mean()
        rolling_std[i]  = SERIES[i - window + 1 : i + 1].std()
    print("Ex09 — rolling mean[11]:", round(float(rolling_mean[11]), 4),
          "| rolling std[11]:", round(float(rolling_std[11]), 4))

def ex10():
    """Lag feature construction"""
    ts = np.array([10.0, 12.0, 14.0, 13.0, 15.0, 17.0])
    lag1 = np.full(len(ts), np.nan); lag1[1:] = ts[:-1]
    lag2 = np.full(len(ts), np.nan); lag2[2:] = ts[:-2]
    X = np.column_stack([ts, lag1, lag2])
    print("Ex10 — lag features (first 3 rows):\n", np.round(X[:4], 4))

def ex11():
    """Forecasting evaluation: MAE and RMSE"""
    actual    = np.array([10.0, 12.0, 14.0, 13.0, 15.0])
    predicted = np.array([10.5, 11.5, 14.2, 13.3, 14.7])
    mae  = float(np.mean(np.abs(actual - predicted)))
    rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))
    print("Ex11 — MAE:", round(mae, 4), "| RMSE:", round(rmse, 4))

def ex12():
    """MAPE: mean absolute percentage error"""
    actual    = np.array([10.0, 12.0, 14.0, 13.0, 15.0])
    predicted = np.array([10.5, 11.5, 14.2, 13.3, 14.7])
    mape = float(np.mean(np.abs((actual - predicted) / actual)) * 100)
    print("Ex12 — MAPE:", round(mape, 4), "%")

def ex13():
    """Random walk simulation"""
    rng = np.random.default_rng(42)
    steps = rng.choice([-1, 1], size=100)
    walk  = np.cumsum(steps).astype(float)
    print("Ex13 — random walk final:", float(walk[-1]),
          "| std:", round(float(walk.std()), 4))

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """ACF values for multiple lags"""
    n = len(SERIES)
    mean = SERIES.mean()
    var  = np.sum((SERIES - mean) ** 2)
    acf = []
    for lag in range(1, 6):
        cov = np.sum((SERIES[:n-lag] - mean) * (SERIES[lag:] - mean))
        acf.append((lag, round(float(cov / var), 4)))
    print("Ex14 — ACF lags 1-5:", acf)

def ex15():
    """Detect stationarity via ADF test (manual trend check)"""
    # Informal check: does the series have increasing mean over time?
    split = len(SERIES) // 2
    mean_first = SERIES[:split].mean()
    mean_second = SERIES[split:].mean()
    likely_stationary = abs(mean_second - mean_first) < 1.0
    print("Ex15 — mean first half:", round(float(mean_first), 4),
          "| mean second half:", round(float(mean_second), 4),
          "| likely stationary:", likely_stationary)

def ex16():
    """Seasonal decomposition (manual)"""
    period = 12
    n = len(SERIES)
    # Trend: centered moving average
    trend = np.full(n, np.nan)
    for i in range(period // 2, n - period // 2):
        trend[i] = SERIES[i - period // 2 : i + period // 2 + 1].mean()
    detrended = SERIES - np.where(np.isnan(trend), 0, trend)
    # Seasonal pattern
    seasonal = np.zeros(n)
    for i in range(period):
        idxs = np.arange(i, n, period)
        seasonal[idxs] = np.nanmean(detrended[idxs])
    residual = SERIES - np.where(np.isnan(trend), SERIES, trend) - seasonal
    print("Ex16 — trend[20]:", round(float(trend[20]), 4),
          "| seasonal[0]:", round(float(seasonal[0]), 4))

def ex17():
    """Holt's double exponential smoothing (trend)"""
    ts = SERIES
    alpha, beta = 0.3, 0.1
    L = np.zeros(len(ts))
    B = np.zeros(len(ts))
    L[0] = ts[0]
    B[0] = ts[1] - ts[0]
    for t in range(1, len(ts)):
        L[t] = alpha * ts[t] + (1 - alpha) * (L[t-1] + B[t-1])
        B[t] = beta * (L[t] - L[t-1]) + (1 - beta) * B[t-1]
    forecast = L[-1] + B[-1]  # 1-step ahead
    print("Ex17 — Holt last L:", round(float(L[-1]), 4),
          "| B:", round(float(B[-1]), 4),
          "| 1-step forecast:", round(float(forecast), 4))

def ex18():
    """Walk-forward validation (expanding window)"""
    train_end = 60
    horizon   = 5
    errors = []
    while train_end + horizon <= len(SERIES):
        train = SERIES[:train_end]
        test  = SERIES[train_end:train_end + horizon]
        # Naive forecast: last value
        pred = np.full(horizon, train[-1])
        errors.append(float(np.sqrt(np.mean((test - pred) ** 2))))
        train_end += horizon
    print("Ex18 — walk-forward RMSE steps:", [round(e, 4) for e in errors[:5]])

def ex19():
    """Time-series cross-validation splits"""
    init_train = 60
    step = 10
    horizon = 10
    splits = []
    train_end = init_train
    while train_end + horizon <= len(SERIES):
        splits.append((train_end, list(range(train_end, train_end + horizon))))
        train_end += step
    print("Ex19 — number of splits:", len(splits),
          "| first (train_end, val[0]):", splits[0][0], splits[0][1][0])

def ex20():
    """Naive forecast: last value"""
    train, test = SERIES[:96], SERIES[96:]
    pred = np.full(len(test), train[-1])
    rmse = float(np.sqrt(np.mean((test - pred) ** 2)))
    print("Ex20 — naive forecast RMSE:", round(rmse, 4))

def ex21():
    """Seasonal naive forecast: repeat last season"""
    period = 12
    train, test = SERIES[:96], SERIES[96:]
    pred = train[-period:][:len(test)]  # repeat last season
    rmse = float(np.sqrt(np.mean((test - pred) ** 2)))
    print("Ex21 — seasonal naive RMSE:", round(rmse, 4))

def ex22():
    """Anomaly detection: z-score method"""
    mean = SERIES.mean()
    std  = SERIES.std()
    z_scores = np.abs((SERIES - mean) / (std + 1e-8))
    anomalies = np.where(z_scores > 2.5)[0]
    print("Ex22 — anomaly indices:", anomalies.tolist()[:5],
          "| n anomalies:", len(anomalies))

def ex23():
    """Rolling anomaly detection: sliding window z-score"""
    window = 12
    anomalies = np.zeros(len(SERIES), dtype=bool)
    for i in range(window, len(SERIES)):
        sub = SERIES[i - window : i]
        mean = sub.mean()
        std  = sub.std()
        if std > 0:
            anomalies[i] = abs(SERIES[i] - mean) > 2.0 * std
    print("Ex23 — rolling anomalies:", int(anomalies.sum()),
          "| indices:", np.where(anomalies)[0].tolist()[:5])

def ex24():
    """Trend removal via linear detrending"""
    t = np.arange(len(SERIES))
    # Fit linear trend
    coeffs = np.polyfit(t, SERIES, 1)
    trend  = np.polyval(coeffs, t)
    detrended = SERIES - trend
    print("Ex24 — trend slope:", round(float(coeffs[0]), 6),
          "| detrended mean:", round(float(detrended.mean()), 4))

def ex25():
    """Periodogram: find dominant frequency (manual)"""
    n = len(SERIES)
    # Compute DFT magnitudes
    fft_vals = np.abs(np.fft.rfft(SERIES - SERIES.mean()))
    freqs    = np.fft.rfftfreq(n)
    dominant_freq = freqs[np.argmax(fft_vals[1:]) + 1]
    dominant_period = 1 / dominant_freq if dominant_freq > 0 else np.inf
    print("Ex25 — dominant period:", round(float(dominant_period), 2), "steps")

def ex26():
    """Forecast evaluation: MAPE and RMSE on test set"""
    train, test = SERIES[:96], SERIES[96:]
    # Exponential smoothing forecast
    alpha = 0.3
    s = np.zeros(len(train))
    s[0] = train[0]
    for t in range(1, len(train)):
        s[t] = alpha * train[t] + (1 - alpha) * s[t - 1]
    pred = np.full(len(test), s[-1])
    rmse = float(np.sqrt(np.mean((test - pred) ** 2)))
    mape = float(np.mean(np.abs((test - pred) / (np.abs(test) + 1e-8))) * 100)
    print("Ex26 — SES forecast RMSE:", round(rmse, 4), "| MAPE:", round(mape, 4), "%")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """TimeSeriesModel class: fit, predict, evaluate"""
    class ExponentialSmoothing:
        def __init__(self, alpha=0.3):
            self.alpha = alpha
        def fit(self, train):
            self.s = np.zeros(len(train))
            self.s[0] = train[0]
            for t in range(1, len(train)):
                self.s[t] = self.alpha * train[t] + (1 - self.alpha) * self.s[t-1]
            self.last_level = self.s[-1]
            return self
        def forecast(self, h):
            return np.full(h, self.last_level)
        def evaluate(self, actual):
            pred = self.forecast(len(actual))
            return {"rmse": round(float(np.sqrt(np.mean((actual - pred)**2))), 4),
                    "mape": round(float(np.mean(np.abs((actual-pred)/(np.abs(actual)+1e-8)))*100), 4)}
    train, test = SERIES[:96], SERIES[96:]
    model = ExponentialSmoothing(alpha=0.3).fit(train)
    print("Ex27 — ES evaluate:", model.evaluate(test))

def ex28():
    """ARIMA-like AR(1) model from scratch"""
    train, test = SERIES[:96], SERIES[96:]
    # Estimate AR(1) coefficient via OLS: y_t = phi * y_{t-1} + const
    y  = train[1:]
    X  = np.column_stack([np.ones(len(y)), train[:-1]])
    coeffs = np.linalg.lstsq(X, y, rcond=None)[0]
    const, phi = coeffs
    # Forecast h steps ahead
    h = len(test)
    forecasts = []
    last = train[-1]
    for _ in range(h):
        nxt = const + phi * last
        forecasts.append(nxt)
        last = nxt
    pred = np.array(forecasts)
    rmse = float(np.sqrt(np.mean((test - pred) ** 2)))
    print("Ex28 — AR(1) phi:", round(float(phi), 4),
          "| const:", round(float(const), 4),
          "| RMSE:", round(rmse, 4))

def ex29():
    """Holt-Winters triple exponential smoothing (additive)"""
    period = 12
    alpha, beta, gamma = 0.3, 0.1, 0.1
    n = len(SERIES)
    L = np.zeros(n)
    B = np.zeros(n)
    S = np.zeros(n + period)
    # Initialise
    L[0] = SERIES[:period].mean()
    B[0] = (SERIES[period:2*period].mean() - SERIES[:period].mean()) / period
    for i in range(period):
        S[i] = SERIES[i] - L[0]
    for t in range(1, n):
        sp = t - period
        L[t] = alpha * (SERIES[t] - S[t]) + (1 - alpha) * (L[t-1] + B[t-1])
        B[t] = beta * (L[t] - L[t-1]) + (1 - beta) * B[t-1]
        S[t + period] = gamma * (SERIES[t] - L[t]) + (1 - gamma) * S[t]
    # Forecast 12 steps
    forecasts = [L[-1] + (k+1)*B[-1] + S[n + k] for k in range(12)]
    print("Ex29 — Holt-Winters forecast (12 steps):", np.round(forecasts[:4], 4).tolist(), "...")

def ex30():
    """Ensemble forecast: average of multiple methods"""
    train, test = SERIES[:96], SERIES[96:]
    h = len(test)
    # Method 1: naive
    pred1 = np.full(h, train[-1])
    # Method 2: seasonal naive
    period = 12
    pred2 = train[-period:][:h] if len(train) >= period else pred1
    # Method 3: SES
    alpha = 0.3
    s = np.zeros(len(train)); s[0] = train[0]
    for t in range(1, len(train)):
        s[t] = alpha * train[t] + (1 - alpha) * s[t-1]
    pred3 = np.full(h, s[-1])
    # Average
    pred_avg = (pred1 + pred2[:h] + pred3) / 3
    rmse_avg = float(np.sqrt(np.mean((test[:h] - pred_avg[:h]) ** 2)))
    print("Ex30 — ensemble forecast RMSE:", round(rmse_avg, 4))

def ex31():
    """Rolling window model (re-fit at each step)"""
    window = 24
    preds = []
    for i in range(window, min(window + 20, len(SERIES))):
        sub = SERIES[i - window : i]
        # Simple AR(1)
        y  = sub[1:]
        X  = np.column_stack([np.ones(len(y)), sub[:-1]])
        coeffs = np.linalg.lstsq(X, y, rcond=None)[0]
        pred = coeffs[0] + coeffs[1] * sub[-1]
        preds.append(pred)
    actual = SERIES[window : window + len(preds)]
    rmse = float(np.sqrt(np.mean((actual - np.array(preds)) ** 2)))
    print("Ex31 — rolling AR(1) RMSE:", round(rmse, 4))

def ex32():
    """Multivariate lag features for ML-based forecasting"""
    ts = SERIES
    n = len(ts)
    lags = 3
    X_list, y_list = [], []
    for i in range(lags, n):
        X_list.append(ts[i-lags:i])
        y_list.append(ts[i])
    X_feat = np.array(X_list)
    y_feat = np.array(y_list)
    # Train/test split
    split = int(len(X_feat) * 0.8)
    X_tr2, X_te2 = X_feat[:split], X_feat[split:]
    y_tr2, y_te2 = y_feat[:split], y_feat[split:]
    # Linear regression
    coeffs = np.linalg.lstsq(
        np.column_stack([np.ones(len(X_tr2)), X_tr2]), y_tr2, rcond=None)[0]
    pred = np.column_stack([np.ones(len(X_te2)), X_te2]) @ coeffs
    rmse = float(np.sqrt(np.mean((y_te2 - pred) ** 2)))
    print("Ex32 — ML (lag-3 linear) RMSE:", round(rmse, 4))

def ex33():
    """Forecast combination: optimal weights via OLS"""
    train, test = SERIES[:96], SERIES[96:]
    h = len(test)
    # 3 forecasting methods
    pred_naive    = np.full(h, train[-1])
    alpha = 0.3
    s = train[0]
    for v in train[1:]: s = alpha * v + (1 - alpha) * s
    pred_ses = np.full(h, s)
    pred_seasonal = train[-12:][:h] if len(train) >= 12 else pred_naive
    P = np.column_stack([pred_naive, pred_ses, pred_seasonal[:h]])
    # Solve for weights
    weights = np.linalg.lstsq(P, test[:h], rcond=None)[0]
    weights = np.clip(weights, 0, None)
    weights /= weights.sum() + 1e-10
    combined = P @ weights
    rmse = float(np.sqrt(np.mean((test[:h] - combined) ** 2)))
    print("Ex33 — optimal combined RMSE:", round(rmse, 4),
          "| weights:", np.round(weights, 4).tolist())

def ex34():
    """Conformal prediction intervals for time series"""
    train, test = SERIES[:96], SERIES[96:]
    alpha_es = 0.3
    s = train[0]
    residuals = []
    for v in train[1:]:
        residuals.append(abs(v - s))
        s = alpha_es * v + (1 - alpha_es) * s
    # 90th percentile of training residuals as PI width
    pi_width = np.percentile(residuals, 90)
    pred = np.full(len(test), s)
    lower = pred - pi_width
    upper = pred + pi_width
    coverage = float(np.mean((test >= lower) & (test <= upper)))
    print("Ex34 — PI width:", round(float(pi_width), 4),
          "| coverage:", round(coverage, 4))

def ex35():
    """Change point detection: CUSUM"""
    ts = _generate(n=100, seed=0)
    ts[50:] += 2.0  # inject step change at index 50
    mean = ts[:50].mean()
    cusum = np.cumsum(ts - mean)
    change_point = int(np.argmax(np.abs(cusum)))
    print("Ex35 — CUSUM change point detected at:", change_point,
          "(true=50)")

def ex36():
    """Multi-step rolling forecast with AR(1)"""
    train = SERIES[:96]
    y  = train[1:]
    X  = np.column_stack([np.ones(len(y)), train[:-1]])
    c, phi = np.linalg.lstsq(X, y, rcond=None)[0]
    forecasts = []
    last = train[-1]
    for _ in range(24):
        nxt = c + phi * last
        forecasts.append(nxt)
        last = nxt
    actual = SERIES[96:96+24]
    rmse_1step  = float(np.sqrt(np.mean((actual[:1] - np.array(forecasts[:1])) ** 2)))
    rmse_24step = float(np.sqrt(np.mean((actual - np.array(forecasts)) ** 2)))
    print("Ex36 — AR(1) 1-step RMSE:", round(rmse_1step, 4),
          "| 24-step RMSE:", round(rmse_24step, 4))

def ex37():
    """State-space representation concept"""
    print("Ex37 — State-Space (Local Level Model):")
    print("  Observation: y_t = mu_t + epsilon_t,  epsilon ~ N(0, sigma_e²)")
    print("  State:       mu_t = mu_{t-1} + eta_t, eta    ~ N(0, sigma_h²)")
    print("  Kalman filter: predict → update (signal-to-noise ratio drives smoothing)")
    print("  Equivalent to exponential smoothing when sigma_e²/sigma_h² is fixed.")

def ex38():
    """Kalman filter (simple 1D local level)"""
    ts = SERIES
    # Parameters
    sigma_obs = 0.5   # observation noise
    sigma_state = 0.1  # state (process) noise
    # Initial state
    mu = ts[0]
    P  = 1.0
    filtered = []
    for y in ts:
        # Predict
        mu_pred = mu
        P_pred  = P + sigma_state ** 2
        # Update
        K  = P_pred / (P_pred + sigma_obs ** 2)
        mu = mu_pred + K * (y - mu_pred)
        P  = (1 - K) * P_pred
        filtered.append(mu)
    filtered = np.array(filtered)
    residuals = ts - filtered
    print("Ex38 — Kalman filtered RMSE:", round(float(np.sqrt(np.mean(residuals**2))), 4),
          "| filtered[0]:", round(float(filtered[0]), 4))

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """ARIMA model (manual AR(p) + differencing)"""
    ts = SERIES
    # 1. First difference
    diff1 = np.diff(ts)
    # 2. AR(2) on differenced series
    p = 2
    y  = diff1[p:]
    X  = np.column_stack([np.ones(len(y))] + [diff1[p-i-1:len(diff1)-i-1] for i in range(p)])
    coeffs = np.linalg.lstsq(X, y, rcond=None)[0]
    # 3. Forecast 1 step
    recent = diff1[-p:][::-1]
    pred_diff = coeffs[0] + sum(coeffs[i+1] * recent[i] for i in range(p))
    pred_level = ts[-1] + pred_diff
    print("Ex39 — ARIMA(2,1,0) 1-step forecast:", round(float(pred_level), 4),
          "| AR coeffs:", np.round(coeffs[1:], 4).tolist())

def ex40():
    """Seasonal ARIMA concept (SARIMA)"""
    print("Ex40 — SARIMA(p,d,q)(P,D,Q)[m] model:")
    print("  Seasonal period m=12 (monthly data).")
    print("  Non-seasonal: AR(p), I(d), MA(q) on residuals after seasonal removal.")
    print("  Seasonal:     AR(P), I(D), MA(Q) on period-m lagged data.")
    print("  Example SARIMA(1,1,1)(1,1,1)[12]:")
    print("  (1-phi_1*B)(1-Phi_1*B^12)(1-B)(1-B^12)y_t =")
    print("  (1+theta_1*B)(1+Theta_1*B^12)*epsilon_t")

def ex41():
    """Prophet-style decomposition (trend + seasonality + holidays)"""
    t = np.arange(len(SERIES))
    # Trend: linear
    coeffs = np.polyfit(t, SERIES, 1)
    trend_comp = np.polyval(coeffs, t)
    # Seasonal: fit sin/cos with period 12
    from numpy import sin, cos, pi
    X_fourier = np.column_stack([
        sin(2*pi*t/12), cos(2*pi*t/12),
        sin(4*pi*t/12), cos(4*pi*t/12),
    ])
    detrended = SERIES - trend_comp
    c_fourier = np.linalg.lstsq(X_fourier, detrended, rcond=None)[0]
    seasonal_comp = X_fourier @ c_fourier
    residual = detrended - seasonal_comp
    print("Ex41 — trend slope:", round(float(coeffs[0]), 6))
    print("       seasonal amplitude:", round(float(seasonal_comp.std()), 4))
    print("       residual std:", round(float(residual.std()), 4))

def ex42():
    """LSTM concept: sequence-to-one prediction"""
    print("Ex42 — LSTM for time series:")
    print("  Input:  sequence of past W observations [y_{t-W}, ..., y_{t-1}]")
    print("  Cell:   f_t = sigmoid(Wf*[h_{t-1}, x_t] + bf)  (forget gate)")
    print("          i_t = sigmoid(Wi*[h_{t-1}, x_t] + bi)  (input gate)")
    print("          o_t = sigmoid(Wo*[h_{t-1}, x_t] + bo)  (output gate)")
    print("          c_t = f_t * c_{t-1} + i_t * tanh(Wc*[h_{t-1}, x_t])")
    print("          h_t = o_t * tanh(c_t)")
    print("  Output: dense layer on h_T → forecast y_T")
    print("  Training: BPTT, Adam, teacher forcing")
    # Simple linear approximation as proxy
    lags = 5
    X_lag = np.column_stack([SERIES[lags-i-1:len(SERIES)-i] for i in range(lags)][::-1][1:])
    y_lag = SERIES[lags:]
    split = int(len(X_lag) * 0.8)
    coeffs = np.linalg.lstsq(X_lag[:split], y_lag[:split], rcond=None)[0]
    pred = X_lag[split:] @ coeffs
    rmse = float(np.sqrt(np.mean((y_lag[split:] - pred) ** 2)))
    print(f"  Proxy linear model (lag-{lags}) RMSE: {round(rmse, 4)}")

def ex43():
    """Temporal Fusion Transformer concept"""
    print("Ex43 — Temporal Fusion Transformer (TFT) key components:")
    print("  1. Variable Selection Networks: gate irrelevant features.")
    print("  2. Gated Residual Networks (GRN): non-linear processing with skip connections.")
    print("  3. LSTM encoder-decoder: capture sequential dependencies.")
    print("  4. Multi-head attention: focus on important past time steps.")
    print("  5. Quantile output: generate prediction intervals (p10, p50, p90).")
    print("  State-of-the-art on M5, Kaggle, electricity forecasting benchmarks.")

def ex44():
    """Online learning for streaming time series"""
    alpha = 0.3
    s = SERIES[0]
    online_errors = []
    for t in range(1, len(SERIES)):
        pred = s
        error = abs(SERIES[t] - pred)
        online_errors.append(error)
        s = alpha * SERIES[t] + (1 - alpha) * s
    cumulative_mae = np.cumsum(online_errors) / np.arange(1, len(online_errors) + 1)
    print("Ex44 — online MAE at t=10:", round(float(cumulative_mae[9]), 4),
          "| at t=50:", round(float(cumulative_mae[49]), 4),
          "| final:", round(float(cumulative_mae[-1]), 4))

def ex45():
    """Intermittent demand forecasting (Croston's method concept)"""
    # Simulate intermittent demand
    rng = np.random.default_rng(42)
    demand = rng.choice([0, 0, 0, 1, 2, 3], size=60)
    # Croston: separate average non-zero demand and inter-demand interval
    nz_vals = demand[demand > 0]
    intervals = np.diff(np.where(demand > 0)[0])
    avg_demand = nz_vals.mean() if len(nz_vals) > 0 else 0
    avg_interval = intervals.mean() if len(intervals) > 0 else 1
    croston_forecast = avg_demand / avg_interval
    print("Ex45 — demand sparsity:", round(float((demand == 0).mean()), 4),
          "| avg demand:", round(float(avg_demand), 4),
          "| avg interval:", round(float(avg_interval), 4),
          "| Croston forecast:", round(float(croston_forecast), 4))

def ex46():
    """Causal feature integration (exogenous variables)"""
    n = len(SERIES)
    # Create exogenous: a temperature proxy with seasonal pattern
    t = np.arange(n)
    exog = 5 * np.sin(2 * np.pi * t / 12) + np.random.RandomState(1).randn(n) * 0.3
    # ARX model: y_t = c + phi*y_{t-1} + beta*x_t
    y  = SERIES[1:]
    X  = np.column_stack([np.ones(len(y)), SERIES[:-1], exog[1:]])
    coeffs = np.linalg.lstsq(X, y, rcond=None)[0]
    pred = X @ coeffs
    rmse = float(np.sqrt(np.mean((y - pred) ** 2)))
    print("Ex46 — ARX model: c={:.4f} phi={:.4f} beta={:.4f}".format(*coeffs),
          "| RMSE:", round(rmse, 4))

def ex47():
    """Hierarchical reconciliation (top-down)"""
    # Total = Region1 + Region2
    rng = np.random.default_rng(42)
    region1 = rng.normal(10, 1, 50)
    region2 = rng.normal(15, 1.5, 50)
    total   = region1 + region2
    # Forecast total with SES
    alpha = 0.3
    s = total[0]
    for v in total[1:]:
        s = alpha * v + (1 - alpha) * s
    total_forecast = s
    # Disaggregate proportionally (historical share)
    share1 = region1.mean() / total.mean()
    share2 = 1 - share1
    r1_forecast = share1 * total_forecast
    r2_forecast = share2 * total_forecast
    print("Ex47 — total forecast:", round(float(total_forecast), 4),
          "| R1:", round(float(r1_forecast), 4),
          "| R2:", round(float(r2_forecast), 4))

def ex48():
    """Quantile regression for prediction intervals"""
    ts = SERIES
    lags = 3
    X_lag = np.column_stack([ts[lags-i-1:len(ts)-i] for i in range(1, lags+1)])[:len(ts)-lags]
    y_lag = ts[lags:]
    split = int(len(X_lag) * 0.8)
    X_tr2, X_te2 = X_lag[:split], X_lag[split:]
    y_tr2, y_te2 = y_lag[:split], y_lag[split:]
    # Fit median regression (L1) as proxy
    coeffs = np.linalg.lstsq(X_tr2, y_tr2, rcond=None)[0]
    pred   = X_te2 @ coeffs
    resids = y_tr2 - X_tr2 @ coeffs
    # 80% PI: 10th and 90th percentile of training residuals
    q10 = np.percentile(resids, 10)
    q90 = np.percentile(resids, 90)
    lower = pred + q10
    upper = pred + q90
    coverage = float(np.mean((y_te2 >= lower) & (y_te2 <= upper)))
    print("Ex48 — 80% PI coverage:", round(coverage, 4),
          "| PI width:", round(float(q90 - q10), 4))

def ex49():
    """Fourier series decomposition for seasonality"""
    from numpy import sin, cos, pi
    t = np.arange(len(SERIES))
    # 2 Fourier harmonics for period 12
    X_fourier = np.column_stack([
        np.ones(len(SERIES)),
        sin(2*pi*t/12), cos(2*pi*t/12),
        sin(4*pi*t/12), cos(4*pi*t/12),
        t,  # linear trend
    ])
    coeffs = np.linalg.lstsq(X_fourier, SERIES, rcond=None)[0]
    fitted = X_fourier @ coeffs
    rmse = float(np.sqrt(np.mean((SERIES - fitted) ** 2)))
    print("Ex49 — Fourier decomposition RMSE:", round(rmse, 4),
          "| trend coeff:", round(float(coeffs[-1]), 6))

def ex50():
    """End-to-end forecasting pipeline: prepare, model, evaluate, monitor"""
    # 1. Prepare
    train, test = SERIES[:96], SERIES[96:]
    h = len(test)
    # 2. Multiple models
    def ses_predict(train, h, alpha=0.3):
        s = train[0]
        for v in train[1:]:
            s = alpha * v + (1 - alpha) * s
        return np.full(h, s)
    def ar1_predict(train, h):
        y = train[1:]; X = np.column_stack([np.ones(len(y)), train[:-1]])
        c, phi = np.linalg.lstsq(X, y, rcond=None)[0]
        preds = []; last = train[-1]
        for _ in range(h):
            nxt = c + phi * last; preds.append(nxt); last = nxt
        return np.array(preds)
    def seasonal_naive(train, h, period=12):
        return train[-period:][:h]
    forecasts = {
        "SES":             ses_predict(train, h),
        "AR1":             ar1_predict(train, h),
        "Seasonal_Naive":  seasonal_naive(train, h),
    }
    # 3. Evaluate
    results = {}
    for name, pred in forecasts.items():
        rmse = float(np.sqrt(np.mean((test[:len(pred)] - pred) ** 2)))
        mape = float(np.mean(np.abs((test[:len(pred)] - pred) / (np.abs(test[:len(pred)]) + 1e-8))) * 100)
        results[name] = {"rmse": round(rmse, 4), "mape": round(mape, 4)}
    best = min(results, key=lambda k: results[k]["rmse"])
    print("Ex50 — forecast results:")
    for name, m in sorted(results.items(), key=lambda x: x[1]["rmse"]):
        print(f"       {name}: RMSE={m['rmse']:.4f} MAPE={m['mape']:.4f}%")
    print("       Best model:", best)


def main():
    print("=" * 60)
    print("Examples 6.3 — Time Series Analysis")
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
