# ============================================================
# Exercise 6.3 — Time Series Analysis
# ============================================================
# Topics:
#   • Generate time series with trend + seasonality + noise
#   • Moving average (rolling mean)
#   • Exponential smoothing (EWM)
#   • Seasonal decomposition
#   • ACF values
#   • PACF values
#   • Stationarity test (ADF)
#   • Differencing
#   • ARIMA model (statsmodels)
#   • Simple exponential smoothing forecast
#   • Holt-Winters concept
#   • Time series train/test split
#   • Time series cross-validation (expanding window)
#   • Forecast evaluation (MAPE, RMSE)
#   • Anomaly detection (rolling std)
# ============================================================

import numpy as np


# --- TODO 1: Generate time series ---
# trend = 0.05 * t, seasonal = sin(2*pi*t/12), noise = N(0, 0.5).
# Return array of length n.
def generate_time_series(n: int = 120, seed: int = 42) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 2: Moving average ---
# Rolling mean with given window size.
# Return array of same length (NaN-padded at start).
def moving_average(series: np.ndarray, window: int = 12) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 3: Exponential smoothing ---
# EWM with smoothing factor alpha.
# Return smoothed array.
def exponential_smoothing(series: np.ndarray, alpha: float = 0.3) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 4: Seasonal decomposition ---
# Additive decomposition: y = trend + seasonal + residual.
# Use statsmodels.tsa.seasonal.seasonal_decompose.
# Return (trend, seasonal, residual) as numpy arrays.
def seasonal_decompose(series: np.ndarray, period: int = 12) -> tuple:
    pass  # TODO: implement


# --- TODO 5: ACF values ---
# Compute autocorrelation for lags 0..max_lag.
# Return list of (lag, acf_value).
def acf_values(series: np.ndarray, max_lag: int = 20) -> list:
    pass  # TODO: implement


# --- TODO 6: PACF values ---
# Compute partial autocorrelation using statsmodels.
# Return list of (lag, pacf_value).
def pacf_values(series: np.ndarray, max_lag: int = 20) -> list:
    pass  # TODO: implement


# --- TODO 7: Stationarity test (ADF) ---
# Use statsmodels adfuller. Return (adf_stat, p_value, is_stationary).
# is_stationary = p_value < 0.05.
def adf_test(series: np.ndarray) -> tuple:
    pass  # TODO: implement


# --- TODO 8: Differencing ---
# First difference: diff[t] = series[t] - series[t-1].
# Return differenced array (length n-1).
def difference(series: np.ndarray, order: int = 1) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 9: ARIMA model ---
# Fit ARIMA(p,d,q) using statsmodels. Guard with try/except.
# Return (fitted AIC, in-sample residual std) or ("failed", error_msg).
def fit_arima(series: np.ndarray, order: tuple = (1, 1, 1)) -> tuple:
    pass  # TODO: implement


# --- TODO 10: Simple exponential smoothing forecast ---
# Fit SimpleExpSmoothing. Return forecast for next h steps.
def ses_forecast(train: np.ndarray, h: int = 12) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 11: Holt-Winters concept ---
# Return a string explaining triple exponential smoothing.
def holt_winters_concept() -> str:
    pass  # TODO: implement


# --- TODO 12: Time series train/test split ---
# Split at index split_idx (no shuffle).
# Return (train, test) arrays.
def ts_train_test_split(series: np.ndarray, test_size: float = 0.2) -> tuple:
    pass  # TODO: implement


# --- TODO 13: Time series cross-validation (expanding window) ---
# Initial training window = init_train_size.
# Expand by step each fold; return list of (train_end, val_indices).
def ts_cross_val(series: np.ndarray, init_train_size: int = 60,
                 step: int = 10, horizon: int = 10) -> list:
    pass  # TODO: implement


# --- TODO 14: Forecast evaluation ---
# Given actual and predicted arrays, return dict {mape, rmse}.
def forecast_evaluation(actual: np.ndarray, predicted: np.ndarray) -> dict:
    pass  # TODO: implement


# --- TODO 15: Anomaly detection (rolling std) ---
# Mark point t as anomaly if |series[t] - rolling_mean[t]| > k * rolling_std[t].
# Return boolean array (True = anomaly).
def rolling_anomaly_detection(series: np.ndarray, window: int = 12,
                               k: float = 2.0) -> np.ndarray:
    pass  # TODO: implement


def main():
    print("=== Exercise 6.3: Time Series Analysis ===\n")

    np.random.seed(42)
    series = generate_time_series(120)
    print("TODO 1  - Series shape:", series.shape if series is not None else None, "first 5:", series[:5] if series is not None else None)

    ma = moving_average(series)
    print("TODO 2  - Moving average (first non-NaN):", ma[11] if ma is not None else None)

    es = exponential_smoothing(series)
    print("TODO 3  - Exp smoothing (first 5):", es[:5] if es is not None else None)

    result = seasonal_decompose(series)
    if result:
        trend, seasonal, residual = result
        print("TODO 4  - Seasonal decompose trend shape:", trend.shape)

    acf = acf_values(series)
    print("TODO 5  - ACF lags 1-5:", acf[1:6] if acf else None)

    pacf = pacf_values(series)
    print("TODO 6  - PACF lags 1-5:", pacf[1:6] if pacf else None)

    adf_stat, p_val, is_stat = adf_test(series) or (None, None, None)
    print("TODO 7  - ADF test: stat={}, p={}, stationary={}".format(adf_stat, p_val, is_stat))

    diff = difference(series)
    print("TODO 8  - Differenced series shape:", diff.shape if diff is not None else None)

    aic, res_std = fit_arima(series) or (None, None)
    print("TODO 9  - ARIMA AIC:", aic, "residual std:", res_std)

    train, test = ts_train_test_split(series) or (None, None)
    forecast = ses_forecast(train) if train is not None else None
    print("TODO 10 - SES forecast (12 steps):", forecast[:5] if forecast is not None else None)

    print("TODO 11 - Holt-Winters concept:", holt_winters_concept())
    print("TODO 12 - Train/test sizes:", (len(train), len(test)) if train is not None else None)
    print("TODO 13 - TS CV splits:", ts_cross_val(series))

    actual = series[-12:]
    pred   = series[-24:-12] + np.random.randn(12) * 0.2
    print("TODO 14 - Forecast evaluation:", forecast_evaluation(actual, pred))

    anomalies = rolling_anomaly_detection(series)
    print("TODO 15 - Anomaly count:", anomalies.sum() if anomalies is not None else None)


if __name__ == "__main__":
    main()
