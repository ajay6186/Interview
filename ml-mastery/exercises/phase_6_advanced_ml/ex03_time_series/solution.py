# ============================================================
# Solution 6.3 — Time Series Analysis
# ============================================================

import numpy as np


def generate_time_series(n: int = 120, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed)
    t = np.arange(n)
    trend    = 0.05 * t
    seasonal = np.sin(2 * np.pi * t / 12)
    noise    = rng.normal(0, 0.5, n)
    return trend + seasonal + noise


def moving_average(series: np.ndarray, window: int = 12) -> np.ndarray:
    result = np.full(len(series), np.nan)
    for i in range(window - 1, len(series)):
        result[i] = series[i - window + 1 : i + 1].mean()
    return result


def exponential_smoothing(series: np.ndarray, alpha: float = 0.3) -> np.ndarray:
    result = np.zeros_like(series, dtype=float)
    result[0] = series[0]
    for t in range(1, len(series)):
        result[t] = alpha * series[t] + (1 - alpha) * result[t - 1]
    return result


def seasonal_decompose(series: np.ndarray, period: int = 12) -> tuple:
    try:
        from statsmodels.tsa.seasonal import seasonal_decompose as sd
        import pandas as pd
        s = pd.Series(series)
        result = sd(s, model="additive", period=period, extrapolate_trend="freq")
        return (
            np.array(result.trend),
            np.array(result.seasonal),
            np.array(result.resid),
        )
    except ImportError:
        # Manual: centered moving average for trend, then seasonal averages
        trend = moving_average(series, window=period)
        detrended = series - np.where(np.isnan(trend), 0, trend)
        seasonal = np.zeros(len(series))
        for i in range(period):
            idxs = np.arange(i, len(series), period)
            seasonal[idxs] = np.nanmean(detrended[idxs])
        residual = series - trend - seasonal
        return (trend, seasonal, residual)


def acf_values(series: np.ndarray, max_lag: int = 20) -> list:
    n = len(series)
    mean = series.mean()
    var  = np.sum((series - mean) ** 2)
    result = []
    for lag in range(max_lag + 1):
        cov = np.sum((series[:n - lag] - mean) * (series[lag:] - mean))
        acf = cov / var if var > 0 else 0.0
        result.append((lag, round(float(acf), 4)))
    return result


def pacf_values(series: np.ndarray, max_lag: int = 20) -> list:
    try:
        from statsmodels.tsa.stattools import pacf
        vals = pacf(series, nlags=max_lag, method="ols")
        return [(lag, round(float(v), 4)) for lag, v in enumerate(vals)]
    except ImportError:
        # Fallback: Yule-Walker
        acf_vals = [v for _, v in acf_values(series, max_lag)]
        pacf_list = [(0, 1.0)]
        for k in range(1, max_lag + 1):
            r = np.array(acf_vals[1:k+1])
            R = np.array([[acf_vals[abs(i-j)] for j in range(k)] for i in range(k)])
            try:
                phi = np.linalg.solve(R, r)
                pacf_list.append((k, round(float(phi[-1]), 4)))
            except np.linalg.LinAlgError:
                pacf_list.append((k, 0.0))
        return pacf_list


def adf_test(series: np.ndarray) -> tuple:
    try:
        from statsmodels.tsa.stattools import adfuller
        result = adfuller(series, autolag="AIC")
        adf_stat = round(float(result[0]), 4)
        p_val    = round(float(result[1]), 4)
        return (adf_stat, p_val, bool(p_val < 0.05))
    except ImportError:
        return ("statsmodels_not_installed", None, None)


def difference(series: np.ndarray, order: int = 1) -> np.ndarray:
    result = series.copy().astype(float)
    for _ in range(order):
        result = np.diff(result)
    return result


def fit_arima(series: np.ndarray, order: tuple = (1, 1, 1)) -> tuple:
    try:
        from statsmodels.tsa.arima.model import ARIMA
        model = ARIMA(series, order=order)
        fitted = model.fit()
        return (round(float(fitted.aic), 4), round(float(fitted.resid.std()), 4))
    except Exception as e:
        return ("failed", str(e))


def ses_forecast(train: np.ndarray, h: int = 12) -> np.ndarray:
    try:
        from statsmodels.tsa.holtwinters import SimpleExpSmoothing
        model = SimpleExpSmoothing(train).fit(optimized=True)
        return np.round(model.forecast(h), 4)
    except ImportError:
        # Manual SES
        alpha = 0.3
        s = exponential_smoothing(train, alpha)
        return np.full(h, round(float(s[-1]), 4))


def holt_winters_concept() -> str:
    return (
        "Holt-Winters (Triple Exponential Smoothing) extends simple ES with three components:\n"
        "  Level: L_t = alpha*(y_t - S_{t-m}) + (1-alpha)*(L_{t-1} + B_{t-1})\n"
        "  Trend: B_t = beta*(L_t - L_{t-1}) + (1-beta)*B_{t-1}\n"
        "  Seasonal: S_t = gamma*(y_t - L_t) + (1-gamma)*S_{t-m}\n"
        "  Forecast: F_{t+h} = L_t + h*B_t + S_{t-m+h}\n"
        "Three smoothing parameters alpha, beta, gamma (0-1) are typically fit by MLE."
    )


def ts_train_test_split(series: np.ndarray, test_size: float = 0.2) -> tuple:
    split = int(len(series) * (1 - test_size))
    return (series[:split], series[split:])


def ts_cross_val(series: np.ndarray, init_train_size: int = 60,
                 step: int = 10, horizon: int = 10) -> list:
    splits = []
    train_end = init_train_size
    while train_end + horizon <= len(series):
        val_indices = list(range(train_end, min(train_end + horizon, len(series))))
        splits.append((train_end, val_indices))
        train_end += step
    return splits


def forecast_evaluation(actual: np.ndarray, predicted: np.ndarray) -> dict:
    mask = actual != 0
    mape = float(np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100)
    rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))
    return {"mape": round(mape, 4), "rmse": round(rmse, 4)}


def rolling_anomaly_detection(series: np.ndarray, window: int = 12,
                               k: float = 2.0) -> np.ndarray:
    rolling_mean = moving_average(series, window)
    # Rolling std
    rolling_std  = np.full(len(series), np.nan)
    for i in range(window - 1, len(series)):
        rolling_std[i] = series[i - window + 1 : i + 1].std()
    anomalies = np.zeros(len(series), dtype=bool)
    valid = ~np.isnan(rolling_mean) & ~np.isnan(rolling_std) & (rolling_std > 0)
    anomalies[valid] = np.abs(series[valid] - rolling_mean[valid]) > k * rolling_std[valid]
    return anomalies


def main():
    print("=== Solution 6.3: Time Series Analysis ===\n")

    np.random.seed(42)
    series = generate_time_series(120)
    print("Result 1  - Series: n={}, first 5={}".format(len(series), np.round(series[:5], 3)))

    ma = moving_average(series)
    print("Result 2  - Moving average[11]:", round(float(ma[11]), 4))

    es = exponential_smoothing(series)
    print("Result 3  - Exp smoothing first 5:", np.round(es[:5], 4))

    trend, seasonal, residual = seasonal_decompose(series)
    print("Result 4  - Decompose shapes: trend={} seasonal={} resid={}".format(
        trend.shape, seasonal.shape, residual.shape))

    acf = acf_values(series)
    print("Result 5  - ACF lags 1-5:", acf[1:6])

    pacf = pacf_values(series)
    print("Result 6  - PACF lags 1-5:", pacf[1:6])

    print("Result 7  - ADF test:", adf_test(series))

    diff1 = difference(series)
    print("Result 8  - Differenced shape:", diff1.shape, "ADF after diff:", adf_test(diff1))

    print("Result 9  - ARIMA(1,1,1):", fit_arima(series))

    train, test = ts_train_test_split(series)
    forecast = ses_forecast(train)
    print("Result 10 - SES forecast (12 steps):", np.round(forecast, 4))

    print("Result 11 - Holt-Winters concept:\n", holt_winters_concept())
    print("Result 12 - Train/test sizes:", len(train), len(test))

    splits = ts_cross_val(series)
    print("Result 13 - TS CV splits (train_end, first_val_idx):",
          [(s[0], s[1][0]) for s in splits])

    actual = series[-12:]
    rng = np.random.default_rng(0)
    pred   = actual + rng.normal(0, 0.3, 12)
    print("Result 14 - Forecast eval:", forecast_evaluation(actual, pred))

    anomalies = rolling_anomaly_detection(series, k=2.5)
    print("Result 15 - Anomalies detected:", int(anomalies.sum()), "at indices:", np.where(anomalies)[0].tolist())


if __name__ == "__main__":
    main()
