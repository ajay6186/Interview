# ============================================================
# Solution 4.4 — Model Monitoring & Drift Detection
# ============================================================
#
# pip install numpy scipy
# All functions are runnable with standard scientific Python libs.

import numpy as np
from scipy import stats


# ---------------------------------------------------------------------------
# SOLUTION 1: PSI (Population Stability Index)
# ---------------------------------------------------------------------------
def calculate_psi(
    expected: np.ndarray,
    actual: np.ndarray,
    n_bins: int = 10,
) -> float:
    """
    PSI measures how much a distribution has shifted between two periods.
    Built on the same bins as the expected (reference) data.
    """
    # Build bin edges from the combined range
    min_val = min(expected.min(), actual.min())
    max_val = max(expected.max(), actual.max())
    bins = np.linspace(min_val, max_val, n_bins + 1)

    # Compute frequencies (proportions)
    expected_counts, _ = np.histogram(expected, bins=bins)
    actual_counts, _   = np.histogram(actual,   bins=bins)

    # Avoid zero — add small epsilon then re-normalise
    epsilon = 1e-6
    expected_pct = (expected_counts + epsilon) / (expected_counts.sum() + epsilon * n_bins)
    actual_pct   = (actual_counts   + epsilon) / (actual_counts.sum()   + epsilon * n_bins)

    psi = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(psi)


# ---------------------------------------------------------------------------
# SOLUTION 2: PSI interpretation
# ---------------------------------------------------------------------------
def interpret_psi(psi: float) -> str:
    if psi < 0.1:
        return "no_shift"
    elif psi < 0.2:
        return "moderate_shift"
    else:
        return "significant_shift"


# ---------------------------------------------------------------------------
# SOLUTION 3: KS test
# ---------------------------------------------------------------------------
def ks_test(reference: np.ndarray, production: np.ndarray) -> dict:
    """
    The KS test checks whether two samples come from the same distribution.
    High statistic + low p-value → distributions are different (drift).
    """
    result = stats.ks_2samp(reference, production)
    return {
        "statistic":  float(result.statistic),
        "p_value":    float(result.pvalue),
        "is_drifted": bool(result.pvalue < 0.05),
    }


# ---------------------------------------------------------------------------
# SOLUTION 4: Chi-square test for categorical drift
# ---------------------------------------------------------------------------
def chi_square_test(reference: np.ndarray, production: np.ndarray) -> dict:
    """
    Compare category proportions between reference and production.
    Works on integer or string category labels.
    """
    all_categories = np.union1d(np.unique(reference), np.unique(production))

    # Count occurrences of each category in both arrays
    ref_counts  = np.array([np.sum(reference  == c) for c in all_categories], dtype=float)
    prod_counts = np.array([np.sum(production == c) for c in all_categories], dtype=float)

    # Scale expected counts to match observed total
    scale = prod_counts.sum() / ref_counts.sum() if ref_counts.sum() > 0 else 1.0
    expected = ref_counts * scale

    # Avoid zero expected values
    epsilon  = 1e-6
    expected = np.where(expected == 0, epsilon, expected)

    result = stats.chisquare(f_obs=prod_counts, f_exp=expected)
    return {
        "statistic":  float(result.statistic),
        "p_value":    float(result.pvalue),
        "is_drifted": bool(result.pvalue < 0.05),
    }


# ---------------------------------------------------------------------------
# SOLUTION 5: KL divergence
# ---------------------------------------------------------------------------
def kl_divergence(p: np.ndarray, q: np.ndarray, epsilon: float = 1e-10) -> float:
    """
    Kullback-Leibler divergence KL(P || Q).
    Not symmetric: KL(P||Q) ≠ KL(Q||P).
    Returns ∞ if Q has zero mass where P has positive mass.
    """
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float)

    # Normalise to probability distributions
    p = p / p.sum()
    q = q / q.sum()

    # Add epsilon for numerical stability
    p = p + epsilon
    q = q + epsilon

    return float(np.sum(p * np.log(p / q)))


# ---------------------------------------------------------------------------
# SOLUTION 6: Multi-feature drift detection
# ---------------------------------------------------------------------------
def detect_feature_drift(
    reference_data: np.ndarray,
    production_data: np.ndarray,
) -> dict:
    """Run a KS test for each feature column independently."""
    n_features = reference_data.shape[1]
    results = {}
    for i in range(n_features):
        results[i] = ks_test(reference_data[:, i], production_data[:, i])
    return results


# ---------------------------------------------------------------------------
# SOLUTION 7: Prediction drift
# ---------------------------------------------------------------------------
def detect_prediction_drift(
    reference_predictions: np.ndarray,
    production_predictions: np.ndarray,
) -> dict:
    psi = calculate_psi(reference_predictions, production_predictions, n_bins=10)
    interpretation = interpret_psi(psi)
    return {
        "psi":            psi,
        "interpretation": interpretation,
        "is_drifted":     psi >= 0.1,
    }


# ---------------------------------------------------------------------------
# SOLUTION 8: Feature statistics for dashboard
# ---------------------------------------------------------------------------
def compute_feature_statistics(data: np.ndarray, feature_names: list) -> list:
    stats_list = []
    for i, name in enumerate(feature_names):
        col = data[:, i].astype(float)
        null_rate = float(np.sum(np.isnan(col)) / len(col))
        col_clean = col[~np.isnan(col)]
        stats_list.append({
            "feature":   name,
            "mean":      float(np.mean(col_clean)) if len(col_clean) else None,
            "std":       float(np.std(col_clean))  if len(col_clean) else None,
            "min":       float(np.min(col_clean))  if len(col_clean) else None,
            "max":       float(np.max(col_clean))  if len(col_clean) else None,
            "null_rate": null_rate,
        })
    return stats_list


# ---------------------------------------------------------------------------
# SOLUTION 9: Alert threshold checker
# ---------------------------------------------------------------------------
ALERT_DIRECTION = {
    "accuracy":    "below",
    "f1_score":    "below",
    "psi":         "above",
    "null_rate":   "above",
    "latency_p99": "above",
}

def check_alert_thresholds(thresholds: dict, current_metrics: dict) -> list:
    alerts = []
    for metric, threshold in thresholds.items():
        if metric not in current_metrics:
            continue
        current   = current_metrics[metric]
        direction = ALERT_DIRECTION.get(metric, "above")
        if direction == "below":
            breached = current < threshold
        else:
            breached = current > threshold

        alerts.append({
            "metric":    metric,
            "threshold": threshold,
            "current":   current,
            "direction": direction,
            "breached":  breached,
        })
    return alerts


# ---------------------------------------------------------------------------
# SOLUTION 10: Full monitoring report
# ---------------------------------------------------------------------------
def build_monitoring_report(
    reference_data: np.ndarray,
    production_data: np.ndarray,
    reference_preds: np.ndarray,
    production_preds: np.ndarray,
    feature_names: list,
    thresholds: dict,
) -> dict:
    feature_drift  = detect_feature_drift(reference_data, production_data)
    pred_drift     = detect_prediction_drift(reference_preds, production_preds)
    ref_stats      = compute_feature_statistics(reference_data,  feature_names)
    prod_stats     = compute_feature_statistics(production_data, feature_names)

    # Aggregate current metrics for alerting
    drifted_features = sum(1 for v in feature_drift.values() if v["is_drifted"])
    current_metrics = {
        "psi":              pred_drift["psi"],
        "drifted_features": drifted_features,
    }
    # Merge in any provided current metrics (e.g., accuracy from labels)
    current_metrics.update({k: v for k, v in thresholds.items()
                             if k not in ("psi", "drifted_features")})

    alerts = check_alert_thresholds(thresholds, current_metrics)

    return {
        "summary": {
            "total_features":       len(feature_names),
            "drifted_features":     drifted_features,
            "prediction_psi":       pred_drift["psi"],
            "prediction_drift":     pred_drift["interpretation"],
            "alerts_triggered":     sum(1 for a in alerts if a["breached"]),
        },
        "feature_drift":            feature_drift,
        "prediction_drift":         pred_drift,
        "reference_statistics":     ref_stats,
        "production_statistics":    prod_stats,
        "alerts":                   alerts,
    }


# ---------------------------------------------------------------------------
# SOLUTION 11: Simulate concept drift
# ---------------------------------------------------------------------------
def simulate_concept_drift(n_samples: int = 1000) -> tuple:
    rng = np.random.default_rng(42)

    # Stable distribution: X ~ N(0,1), decision boundary at X=0
    X_stable  = rng.normal(0, 1, (n_samples, 1))
    y_stable  = (X_stable[:, 0] > 0).astype(int)

    # Drifted distribution: X ~ N(1,1), decision boundary shifted to X=0.5
    # Both the input distribution AND the labelling rule have changed
    X_drifted = rng.normal(1, 1, (n_samples, 1))
    y_drifted = (X_drifted[:, 0] > 0.5).astype(int)

    return X_stable, y_stable, X_drifted, y_drifted


# ---------------------------------------------------------------------------
# SOLUTION 12: Jensen-Shannon divergence
# ---------------------------------------------------------------------------
def js_divergence(p: np.ndarray, q: np.ndarray) -> float:
    """
    JSD is the symmetric, smoothed version of KL divergence.
    JSD ∈ [0, 1] (when using log base 2).
    JSD = 0 means identical distributions.
    """
    p = np.asarray(p, dtype=float)
    q = np.asarray(q, dtype=float)
    p = p / p.sum()
    q = q / q.sum()
    m = 0.5 * (p + q)
    # Use natural log version (divide by ln(2) to normalise to [0,1])
    jsd = 0.5 * kl_divergence(p, m) + 0.5 * kl_divergence(q, m)
    return float(jsd / np.log(2))  # normalise to [0, 1]


def main():
    print("=== Solution 4.4: Model Monitoring & Drift Detection ===\n")
    rng = np.random.default_rng(42)

    # ── Synthetic data: stable reference, slightly shifted production ──────
    n = 2000
    reference_data   = rng.normal(loc=[0, 5, 10],   scale=[1, 2, 3],   size=(n, 3))
    production_no    = rng.normal(loc=[0, 5, 10],   scale=[1, 2, 3],   size=(n, 3))
    production_drift = rng.normal(loc=[0.5, 6, 12], scale=[1, 2, 3],   size=(n, 3))
    feature_names    = ["feature_0", "feature_1", "feature_2"]

    reference_preds_stable = rng.uniform(0.0, 1.0, n)
    production_preds_drift = rng.uniform(0.3, 1.0, n)  # distribution shifted

    # 1. PSI
    print("1. PSI calculation")
    psi_no    = calculate_psi(reference_data[:, 0], production_no[:, 0])
    psi_drift = calculate_psi(reference_data[:, 0], production_drift[:, 0])
    print(f"   PSI (no drift):        {psi_no:.4f}  → {interpret_psi(psi_no)}")
    print(f"   PSI (with drift):      {psi_drift:.4f}  → {interpret_psi(psi_drift)}")

    # 3. KS test
    print("\n2. KS test")
    ks_no    = ks_test(reference_data[:, 0], production_no[:, 0])
    ks_drift = ks_test(reference_data[:, 0], production_drift[:, 0])
    print(f"   KS (no drift):   stat={ks_no['statistic']:.4f}  p={ks_no['p_value']:.4f}  drifted={ks_no['is_drifted']}")
    print(f"   KS (drifted):    stat={ks_drift['statistic']:.4f}  p={ks_drift['p_value']:.4f}  drifted={ks_drift['is_drifted']}")

    # 4. Chi-square
    print("\n3. Chi-square test (categorical)")
    ref_cat  = rng.integers(0, 3, 1000)
    prod_cat = rng.integers(0, 4, 1000)  # extra category = drift
    chi = chi_square_test(ref_cat, prod_cat)
    print(f"   Chi2: stat={chi['statistic']:.4f}  p={chi['p_value']:.4f}  drifted={chi['is_drifted']}")

    # 5. KL divergence
    print("\n4. KL and JS divergence")
    p = np.array([0.4, 0.3, 0.2, 0.1])
    q = np.array([0.1, 0.2, 0.3, 0.4])
    print(f"   KL(p||q) = {kl_divergence(p, q):.4f}")
    print(f"   KL(q||p) = {kl_divergence(q, p):.4f}  (asymmetric!)")
    print(f"   JSD      = {js_divergence(p, q):.4f}  (symmetric)")

    # 6. Feature drift
    print("\n5. Multi-feature drift detection")
    drift_results = detect_feature_drift(reference_data, production_drift)
    for feat_idx, result in drift_results.items():
        print(f"   {feature_names[feat_idx]}: p={result['p_value']:.4f}  drifted={result['is_drifted']}")

    # 7. Prediction drift
    print("\n6. Prediction drift (PSI on predictions)")
    pred_drift = detect_prediction_drift(reference_preds_stable, production_preds_drift)
    print(f"   PSI={pred_drift['psi']:.4f}  interpretation={pred_drift['interpretation']}  drifted={pred_drift['is_drifted']}")

    # 8. Feature statistics
    print("\n7. Feature statistics (production)")
    feature_stats = compute_feature_statistics(production_drift, feature_names)
    for s in feature_stats:
        print(f"   {s['feature']}: mean={s['mean']:.2f}  std={s['std']:.2f}  null_rate={s['null_rate']:.2%}")

    # 9. Alert thresholds
    print("\n8. Alert threshold check")
    thresholds      = {"accuracy": 0.90, "psi": 0.15, "null_rate": 0.05}
    current_metrics = {"accuracy": 0.87, "psi": pred_drift["psi"], "null_rate": 0.01}
    alerts = check_alert_thresholds(thresholds, current_metrics)
    for a in alerts:
        flag = "ALERT" if a["breached"] else "OK   "
        print(f"   [{flag}] {a['metric']}: current={a['current']:.4f}  threshold={a['threshold']}")

    # 10. Full monitoring report
    print("\n9. Full monitoring report")
    report = build_monitoring_report(
        reference_data, production_drift,
        reference_preds_stable, production_preds_drift,
        feature_names, thresholds,
    )
    summary = report["summary"]
    print(f"   Drifted features:  {summary['drifted_features']}/{summary['total_features']}")
    print(f"   Prediction PSI:    {summary['prediction_psi']:.4f}")
    print(f"   Alerts triggered:  {summary['alerts_triggered']}")

    # 11. Concept drift simulation
    print("\n10. Concept drift simulation")
    X_stable, y_stable, X_drifted, y_drifted = simulate_concept_drift(1000)
    ks_result = ks_test(X_stable[:, 0], X_drifted[:, 0])
    print(f"    Stable  class balance: {y_stable.mean():.2%} positive")
    print(f"    Drifted class balance: {y_drifted.mean():.2%} positive")
    print(f"    KS test on X: stat={ks_result['statistic']:.4f}  drifted={ks_result['is_drifted']}")


if __name__ == "__main__":
    main()
