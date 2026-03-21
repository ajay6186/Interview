# ============================================================
# Exercise 4.4 — Model Monitoring & Drift Detection
# ============================================================
# Topics:
#   • Data drift detection (compare train vs production distributions)
#   • Concept drift detection
#   • PSI (Population Stability Index)
#   • KL divergence
#   • Statistical tests: KS test, chi-square test
#   • Feature drift and prediction drift
#   • Monitoring dashboard data structure
#   • Alerting thresholds
#   • Monitoring pipeline design
# ============================================================

import numpy as np
from scipy import stats


# ---------------------------------------------------------------------------
# TODO 1: Calculate Population Stability Index (PSI)
# PSI = sum((actual% - expected%) * ln(actual% / expected%))
# Bins: split into n_bins equal-width bins over the combined range
# PSI < 0.1 → no shift; 0.1–0.2 → moderate; > 0.2 → significant shift
# Return the PSI value as a float
# ---------------------------------------------------------------------------
def calculate_psi(
    expected: np.ndarray,
    actual: np.ndarray,
    n_bins: int = 10,
) -> float:
    pass  # TODO: implement PSI calculation


# ---------------------------------------------------------------------------
# TODO 2: Interpret a PSI value
# Return: "no_shift", "moderate_shift", or "significant_shift"
# ---------------------------------------------------------------------------
def interpret_psi(psi: float) -> str:
    pass  # TODO: apply PSI thresholds


# ---------------------------------------------------------------------------
# TODO 3: Run a Kolmogorov-Smirnov test between two continuous distributions
# Use scipy.stats.ks_2samp()
# Return a dict: {"statistic": float, "p_value": float, "is_drifted": bool}
# Use p_value < 0.05 as the drift threshold
# ---------------------------------------------------------------------------
def ks_test(reference: np.ndarray, production: np.ndarray) -> dict:
    pass  # TODO: implement KS test


# ---------------------------------------------------------------------------
# TODO 4: Run a chi-square test for categorical feature drift
# Compute observed and expected frequencies from the two distributions
# Use scipy.stats.chisquare()
# Return a dict: {"statistic": float, "p_value": float, "is_drifted": bool}
# ---------------------------------------------------------------------------
def chi_square_test(reference: np.ndarray, production: np.ndarray) -> dict:
    pass  # TODO: implement chi-square test for categorical drift


# ---------------------------------------------------------------------------
# TODO 5: Calculate KL divergence between two probability distributions
# KL(P || Q) = sum(P * log(P / Q))
# Add epsilon to avoid division by zero
# Return the KL divergence as a float
# ---------------------------------------------------------------------------
def kl_divergence(p: np.ndarray, q: np.ndarray, epsilon: float = 1e-10) -> float:
    pass  # TODO: implement KL divergence


# ---------------------------------------------------------------------------
# TODO 6: Detect feature drift across multiple features
# Given reference_data and production_data as 2D arrays (n_samples, n_features)
# Run KS test for each feature
# Return a dict: {feature_idx: {"statistic": float, "p_value": float, "is_drifted": bool}}
# ---------------------------------------------------------------------------
def detect_feature_drift(
    reference_data: np.ndarray,
    production_data: np.ndarray,
) -> dict:
    pass  # TODO: loop over features, run ks_test() for each


# ---------------------------------------------------------------------------
# TODO 7: Detect prediction drift
# Compare the distribution of model predictions on reference vs production data
# Use PSI for prediction drift (predictions are probabilities 0-1)
# Return a dict: {"psi": float, "interpretation": str, "is_drifted": bool}
# ---------------------------------------------------------------------------
def detect_prediction_drift(
    reference_predictions: np.ndarray,
    production_predictions: np.ndarray,
) -> dict:
    pass  # TODO: calculate PSI on prediction distributions


# ---------------------------------------------------------------------------
# TODO 8: Calculate summary statistics for drift monitoring dashboard
# For each feature, compute: mean, std, min, max, null_rate
# Return a list of dicts, one per feature
# ---------------------------------------------------------------------------
def compute_feature_statistics(data: np.ndarray, feature_names: list) -> list:
    pass  # TODO: compute stats per feature, handle NaN for null_rate


# ---------------------------------------------------------------------------
# TODO 9: Check if any metric has breached an alert threshold
# thresholds: dict like {"accuracy": 0.85, "psi": 0.2, "null_rate": 0.05}
# current_metrics: dict with same keys and current values
# For accuracy: alert if current < threshold (lower is bad)
# For psi, null_rate: alert if current > threshold (higher is bad)
# Return list of dicts: [{"metric": str, "threshold": float, "current": float, "breached": bool}]
# ---------------------------------------------------------------------------
ALERT_DIRECTION = {
    "accuracy": "below",    # alert if below threshold
    "f1_score": "below",
    "psi": "above",         # alert if above threshold
    "null_rate": "above",
    "latency_p99": "above",
}

def check_alert_thresholds(
    thresholds: dict,
    current_metrics: dict,
) -> list:
    pass  # TODO: check each metric against its threshold and direction


# ---------------------------------------------------------------------------
# TODO 10: Build a monitoring report as a structured dict
# Given reference data, production data, and model predictions
# Combine: feature drift, prediction drift, statistics, alerts
# Return a single dict with all monitoring information
# ---------------------------------------------------------------------------
def build_monitoring_report(
    reference_data: np.ndarray,
    production_data: np.ndarray,
    reference_preds: np.ndarray,
    production_preds: np.ndarray,
    feature_names: list,
    thresholds: dict,
) -> dict:
    pass  # TODO: aggregate all monitoring functions into a report


# ---------------------------------------------------------------------------
# TODO 11: Simulate concept drift
# Generate two datasets: one from a "stable" distribution, one from a "drifted" distribution
# Stable:  X ~ N(0, 1), y = 1 if X > 0 else 0
# Drifted: X ~ N(1, 1), y = 1 if X > 0.5 else 0  (both input and boundary shifted)
# Return (X_stable, y_stable, X_drifted, y_drifted)
# ---------------------------------------------------------------------------
def simulate_concept_drift(n_samples: int = 1000) -> tuple:
    pass  # TODO: generate stable and drifted datasets


# ---------------------------------------------------------------------------
# TODO 12: Calculate the Jensen-Shannon divergence (symmetric KL)
# JSD(P || Q) = 0.5 * KL(P || M) + 0.5 * KL(Q || M)  where M = 0.5*(P+Q)
# JSD is bounded in [0, 1] when using log base 2
# Return the JSD value
# ---------------------------------------------------------------------------
def js_divergence(p: np.ndarray, q: np.ndarray) -> float:
    pass  # TODO: implement JSD using kl_divergence()


def main():
    print("=== Exercise 4.4: Model Monitoring & Drift Detection ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1",  "calculate_psi()             — Population Stability Index"),
        ("TODO 2",  "interpret_psi()             — PSI threshold interpretation"),
        ("TODO 3",  "ks_test()                   — Kolmogorov-Smirnov test"),
        ("TODO 4",  "chi_square_test()           — Chi-square for categorical drift"),
        ("TODO 5",  "kl_divergence()             — KL(P || Q)"),
        ("TODO 6",  "detect_feature_drift()      — Multi-feature KS test"),
        ("TODO 7",  "detect_prediction_drift()   — PSI on prediction distribution"),
        ("TODO 8",  "compute_feature_statistics()— Mean/std/min/max/null_rate per feature"),
        ("TODO 9",  "check_alert_thresholds()    — Breach detection for monitoring metrics"),
        ("TODO 10", "build_monitoring_report()   — Full monitoring report dict"),
        ("TODO 11", "simulate_concept_drift()    — Generate drifted dataset"),
        ("TODO 12", "js_divergence()             — Jensen-Shannon divergence"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("Drift detection rules of thumb:")
    print("  PSI < 0.1  : no significant shift (safe)")
    print("  PSI 0.1-0.2: moderate shift (monitor closely)")
    print("  PSI > 0.2  : significant shift (retrain model)")
    print("  KS p < 0.05: distributions are significantly different")
    print("  JSD = 0    : identical distributions")
    print("  JSD = 1    : completely different distributions")


if __name__ == "__main__":
    main()
