# ============================================================
# Solution 4.3 — Anomaly Detection
# ============================================================

import numpy as np
from sklearn.datasets import make_blobs
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.covariance import EllipticEnvelope
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler

np.random.seed(42)

X_normal, _ = make_blobs(n_samples=300, centers=1, cluster_std=0.5,
                          random_state=42)
X_anomalies = np.random.uniform(low=-6, high=6, size=(20, 2))
X_all = np.vstack([X_normal, X_anomalies])
y_true = np.array([0] * 300 + [1] * 20)

signal = np.concatenate([np.random.normal(0, 1, 200),
                          np.array([8.0, -7.5, 9.0, -8.5])])
signal_labels = np.array([0] * 200 + [1] * 4)


# ---------------------------------------------------------------------------
# Solution 1: Z-Score
# ---------------------------------------------------------------------------

def zscore_anomaly(signal: np.ndarray, threshold: float = 3.0) -> np.ndarray:
    mu = np.mean(signal)
    sigma = np.std(signal)
    z = np.abs((signal - mu) / (sigma + 1e-10))
    return (z > threshold).astype(int)


# ---------------------------------------------------------------------------
# Solution 2: IQR
# ---------------------------------------------------------------------------

def iqr_anomaly(signal: np.ndarray) -> np.ndarray:
    q1 = np.percentile(signal, 25)
    q3 = np.percentile(signal, 75)
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return ((signal < lower) | (signal > upper)).astype(int)


# ---------------------------------------------------------------------------
# Solution 3: Mahalanobis 1D
# ---------------------------------------------------------------------------

def mahalanobis_1d(signal: np.ndarray, threshold: float = 3.0) -> np.ndarray:
    mu = np.mean(signal)
    sigma = np.std(signal)
    dist = np.abs(signal - mu) / (sigma + 1e-10)
    return (dist > threshold).astype(int)


# ---------------------------------------------------------------------------
# Solution 4: Isolation Forest
# ---------------------------------------------------------------------------

def isolation_forest(X: np.ndarray) -> np.ndarray:
    clf = IsolationForest(contamination=0.05, random_state=42)
    preds = clf.fit_predict(X)
    return (preds == -1).astype(int)


# ---------------------------------------------------------------------------
# Solution 5: LOF
# ---------------------------------------------------------------------------

def local_outlier_factor(X: np.ndarray) -> np.ndarray:
    clf = LocalOutlierFactor(n_neighbors=20, contamination=0.05)
    preds = clf.fit_predict(X)
    return (preds == -1).astype(int)


# ---------------------------------------------------------------------------
# Solution 6: One-Class SVM
# ---------------------------------------------------------------------------

def one_class_svm(X_train: np.ndarray, X_all: np.ndarray) -> np.ndarray:
    clf = OneClassSVM(nu=0.05, kernel='rbf')
    clf.fit(X_train)
    preds = clf.predict(X_all)
    return (preds == -1).astype(int)


# ---------------------------------------------------------------------------
# Solution 7: Elliptic Envelope
# ---------------------------------------------------------------------------

def elliptic_envelope(X: np.ndarray) -> np.ndarray:
    clf = EllipticEnvelope(contamination=0.05, random_state=42)
    preds = clf.fit_predict(X)
    return (preds == -1).astype(int)


# ---------------------------------------------------------------------------
# Solution 8: Multivariate Mahalanobis
# ---------------------------------------------------------------------------

def mahalanobis_multivariate(X: np.ndarray, threshold: float = 3.5) -> np.ndarray:
    mu = X.mean(axis=0)
    cov = np.cov(X.T)
    cov_inv = np.linalg.pinv(cov)
    diff = X - mu
    # D²_i = diff_i @ cov_inv @ diff_i
    D2 = np.einsum('ij,jk,ik->i', diff, cov_inv, diff)
    D = np.sqrt(np.maximum(D2, 0))
    return (D > threshold).astype(int)


# ---------------------------------------------------------------------------
# Solution 9: Time Series Rolling Anomaly
# ---------------------------------------------------------------------------

def timeseries_anomaly(ts: np.ndarray, window: int = 20) -> np.ndarray:
    n = len(ts)
    anomalies = np.zeros(n, dtype=int)
    for i in range(n):
        start = max(0, i - window + 1)
        window_data = ts[start:i + 1]
        mu = np.mean(window_data)
        sigma = np.std(window_data)
        if sigma > 0 and abs(ts[i] - mu) > 3 * sigma:
            anomalies[i] = 1
    return anomalies


# ---------------------------------------------------------------------------
# Solution 10: DBSCAN Noise
# ---------------------------------------------------------------------------

def dbscan_anomaly(X: np.ndarray) -> np.ndarray:
    model = DBSCAN(eps=0.7, min_samples=5)
    labels = model.fit_predict(X)
    return (labels == -1).astype(int)


# ---------------------------------------------------------------------------
# Solution 11: Autoencoder Anomaly (PCA proxy)
# ---------------------------------------------------------------------------

def autoencoder_anomaly(X_train: np.ndarray, X_all: np.ndarray) -> np.ndarray:
    pca = PCA(n_components=1)
    pca.fit(X_train)
    X_recon = pca.inverse_transform(pca.transform(X_all))
    errors = np.mean((X_all - X_recon) ** 2, axis=1)
    threshold = np.percentile(errors, 95)
    return (errors > threshold).astype(int)


# ---------------------------------------------------------------------------
# Solution 12: Evaluate Anomaly
# ---------------------------------------------------------------------------

def evaluate_anomaly(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    return {
        'precision': round(prec, 4),
        'recall': round(rec, 4),
        'f1': round(f1, 4),
    }


# ---------------------------------------------------------------------------
# Solution 13: Threshold Tuning
# ---------------------------------------------------------------------------

def tune_threshold(scores: np.ndarray, y_true: np.ndarray) -> tuple:
    percentiles = np.linspace(10, 99, 20)
    thresholds = np.percentile(scores, percentiles)
    best_f1 = -1.0
    best_thresh = thresholds[0]
    for t in thresholds:
        preds = (scores >= t).astype(int)
        f1 = float(f1_score(y_true, preds, zero_division=0))
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = t
    return float(best_thresh), float(best_f1)


# ---------------------------------------------------------------------------
# Solution 14: Streaming Anomaly Concept
# ---------------------------------------------------------------------------

def streaming_anomaly_concept() -> dict:
    concept = {
        'approach': (
            'Maintain running statistics (mean, std) updated incrementally. '
            'Flag points that deviate from the online model. '
            'Common algorithms: ADWIN, CUSUM, Hoeffding trees.'
        ),
        'update_rule': (
            'Online mean: mu_new = mu_old + (x - mu_old) / n. '
            'Online variance uses Welford\'s algorithm. '
            'Drift detection: monitor when distribution shifts.'
        ),
        'challenges': (
            'Concept drift: normal patterns change over time. '
            'Memory constraints: cannot store all history. '
            'Latency: must detect anomalies in real time. '
            'Seasonality: periodic patterns complicate simple stats.'
        ),
    }
    print("\nStreaming Anomaly Detection:")
    for k, v in concept.items():
        print(f"  {k}: {v}")
    return concept


# ---------------------------------------------------------------------------
# Solution 15: Production Pipeline
# ---------------------------------------------------------------------------

def production_pipeline() -> list:
    steps = [
        "1. Data ingestion: collect features from logs/metrics in real time",
        "2. Preprocessing: normalize/standardize features, handle missing values",
        "3. Feature engineering: rolling stats, lag features, time-based features",
        "4. Model training: Isolation Forest or Autoencoder on historical normal data",
        "5. Scoring: compute anomaly score for each new observation",
        "6. Threshold: set contamination rate or percentile-based cutoff",
        "7. Alerting: trigger alert if score exceeds threshold",
        "8. Human review: analyst reviews flagged anomalies, provides feedback",
        "9. Model retraining: periodically retrain on verified normal data",
        "10. Monitoring: track false positive rate, precision, recall over time",
    ]
    print("\nProduction Anomaly Detection Pipeline:")
    for step in steps:
        print(f"  {step}")
    return steps


def main():
    print("=== Solution 4.3: Anomaly Detection ===\n")

    zs = zscore_anomaly(signal)
    print("Result 1 — Z-score anomaly indices:", np.where(zs == 1)[0],
          "| true:", np.where(signal_labels == 1)[0])

    iqr = iqr_anomaly(signal)
    print("Result 2 — IQR anomaly indices:", np.where(iqr == 1)[0])

    mah1 = mahalanobis_1d(signal)
    print("Result 3 — Mahalanobis 1D anomaly indices:", np.where(mah1 == 1)[0])

    iso = isolation_forest(X_all)
    print("Result 4 — Isolation Forest:", evaluate_anomaly(y_true, iso))

    lof = local_outlier_factor(X_all)
    print("Result 5 — LOF:", evaluate_anomaly(y_true, lof))

    ocsvm = one_class_svm(X_normal, X_all)
    print("Result 6 — One-Class SVM:", evaluate_anomaly(y_true, ocsvm))

    ee = elliptic_envelope(X_all)
    print("Result 7 — Elliptic Envelope:", evaluate_anomaly(y_true, ee))

    mah_mv = mahalanobis_multivariate(X_all)
    print("Result 8 — Mahalanobis MV:", evaluate_anomaly(y_true, mah_mv))

    ts = np.concatenate([np.sin(np.linspace(0, 20, 200)),
                          np.array([5.0, -5.0, 5.5, -5.5])])
    ts_anom = timeseries_anomaly(ts)
    print("Result 9 — Time series anomaly indices:", np.where(ts_anom == 1)[0])

    db_anom = dbscan_anomaly(X_all)
    print("Result 10 — DBSCAN anomaly:", evaluate_anomaly(y_true, db_anom))

    ae_anom = autoencoder_anomaly(X_normal, X_all)
    print("Result 11 — Autoencoder anomaly:", evaluate_anomaly(y_true, ae_anom))

    iso2 = isolation_forest(X_all)
    print("Result 12 — Evaluation:", evaluate_anomaly(y_true, iso2))

    clf = IsolationForest(contamination=0.05, random_state=42).fit(X_all)
    scores = -clf.score_samples(X_all)
    best_thresh, best_f1 = tune_threshold(scores, y_true)
    print("Result 13 — Best threshold:", round(best_thresh, 4),
          "| Best F1:", round(best_f1, 4))

    stream = streaming_anomaly_concept()
    print("Result 14 — Keys:", list(stream.keys()))

    pipeline = production_pipeline()
    print("Result 15 — Pipeline steps:", len(pipeline))


if __name__ == "__main__":
    main()
