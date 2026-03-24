# ============================================================
# Exercise 4.3 — Anomaly Detection
# ============================================================
# Topics:
#   • Z-score and IQR-based detection
#   • Mahalanobis distance (univariate and multivariate)
#   • Isolation Forest, LOF, One-Class SVM, Elliptic Envelope
#   • Time series anomaly (rolling statistics)
#   • DBSCAN noise as anomalies
#   • Autoencoder-based concept
#   • Evaluation: precision/recall, threshold tuning
#   • Streaming and production concepts
# ============================================================

import numpy as np
from sklearn.datasets import make_blobs
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.covariance import EllipticEnvelope
from sklearn.cluster import DBSCAN
from sklearn.metrics import precision_score, recall_score
from sklearn.preprocessing import StandardScaler

np.random.seed(42)

# Normal data + injected anomalies
X_normal, _ = make_blobs(n_samples=300, centers=1, cluster_std=0.5,
                          random_state=42)
X_anomalies = np.random.uniform(low=-6, high=6, size=(20, 2))
X_all = np.vstack([X_normal, X_anomalies])
y_true = np.array([0] * 300 + [1] * 20)  # 0 = normal, 1 = anomaly

# Univariate signal with outliers
signal = np.concatenate([np.random.normal(0, 1, 200),
                          np.array([8.0, -7.5, 9.0, -8.5])])
signal_labels = np.array([0] * 200 + [1] * 4)


# ---------------------------------------------------------------------------
# TODO 1: Z-Score Anomaly Detection
# ---------------------------------------------------------------------------
# Compute z-score for each point in the 1-D array `signal`.
# Flag as anomaly if |z| > threshold (default 3.0).
# Return binary array: 1 = anomaly, 0 = normal.

def zscore_anomaly(signal: np.ndarray, threshold: float = 3.0) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: IQR Anomaly Detection
# ---------------------------------------------------------------------------
# Compute IQR for the 1-D array `signal`.
# Flag as anomaly if x < Q1 - 1.5*IQR or x > Q3 + 1.5*IQR.
# Return binary array: 1 = anomaly, 0 = normal.

def iqr_anomaly(signal: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 3: Mahalanobis Distance (univariate)
# ---------------------------------------------------------------------------
# For a 1-D signal, Mahalanobis distance simplifies to |x - μ| / σ.
# Flag as anomaly if distance > threshold (default 3.0).
# Return binary array: 1 = anomaly, 0 = normal.

def mahalanobis_1d(signal: np.ndarray, threshold: float = 3.0) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 4: Isolation Forest
# ---------------------------------------------------------------------------
# Fit IsolationForest(contamination=0.05, random_state=42) on X_all.
# Convert predictions: sklearn uses 1=normal, -1=anomaly.
# Return binary array: 1 = anomaly, 0 = normal.

def isolation_forest(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 5: Local Outlier Factor
# ---------------------------------------------------------------------------
# Fit LocalOutlierFactor(n_neighbors=20, contamination=0.05) on X_all.
# Convert predictions (1=normal → 0, -1=anomaly → 1).
# Return binary array.

def local_outlier_factor(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 6: One-Class SVM
# ---------------------------------------------------------------------------
# Fit OneClassSVM(nu=0.05, kernel='rbf') on X_normal (train on normal data only).
# Predict on X_all. Convert: 1=normal → 0, -1=anomaly → 1.
# Return binary array.

def one_class_svm(X_train: np.ndarray, X_all: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 7: Elliptic Envelope
# ---------------------------------------------------------------------------
# Fit EllipticEnvelope(contamination=0.05, random_state=42) on X_all.
# Convert: 1=normal → 0, -1=anomaly → 1.
# Return binary array.

def elliptic_envelope(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 8: Multivariate Mahalanobis Distance
# ---------------------------------------------------------------------------
# For 2-D data X:
#   1. Compute mean vector μ and covariance matrix Σ from X.
#   2. For each point x: D² = (x-μ)^T Σ^-1 (x-μ). Take sqrt.
#   3. Flag as anomaly if D > threshold.
# Return binary array.

def mahalanobis_multivariate(X: np.ndarray, threshold: float = 3.5) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 9: Time Series Anomaly (Rolling Mean ± 3 Std)
# ---------------------------------------------------------------------------
# Given a 1-D time series `ts`:
#   - Compute rolling mean and rolling std with window size `window`.
#   - Flag as anomaly if |ts[i] - rolling_mean[i]| > 3 * rolling_std[i].
#   - For points before the first full window, use cumulative stats.
# Return binary array: 1 = anomaly, 0 = normal.

def timeseries_anomaly(ts: np.ndarray, window: int = 20) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 10: DBSCAN Noise as Anomalies
# ---------------------------------------------------------------------------
# Fit DBSCAN(eps=0.7, min_samples=5) on X_all.
# Noise points (label == -1) are anomalies.
# Return binary array: 1 = anomaly (noise), 0 = normal.

def dbscan_anomaly(X: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Autoencoder-Based Anomaly (concept)
# ---------------------------------------------------------------------------
# Simulate autoencoder anomaly detection:
#   1. Fit PCA(n_components=1) on X_normal as a linear "autoencoder".
#   2. Reconstruct: X_reconstructed = pca.inverse_transform(pca.transform(X_all)).
#   3. Compute reconstruction error per sample (MSE per row).
#   4. Flag as anomaly if error > threshold (use 95th percentile of errors as threshold).
# Return binary array.

def autoencoder_anomaly(X_train: np.ndarray, X_all: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 12: Evaluation — Precision and Recall
# ---------------------------------------------------------------------------
# Given y_true and y_pred (binary: 1=anomaly):
# Return a dict with 'precision', 'recall', 'f1'.

def evaluate_anomaly(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 13: Anomaly Threshold Tuning
# ---------------------------------------------------------------------------
# Given anomaly scores (higher = more anomalous) and y_true:
# Try thresholds from 10th to 99th percentile of scores (20 evenly spaced).
# Return the threshold and F1 score that maximize F1.

def tune_threshold(scores: np.ndarray, y_true: np.ndarray) -> tuple:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 14: Streaming Anomaly Detection Concept
# ---------------------------------------------------------------------------
# Print the concept of streaming anomaly detection.
# Return a dict with keys: 'approach', 'update_rule', 'challenges'.

def streaming_anomaly_concept() -> dict:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 15: Production Anomaly Detection Pipeline
# ---------------------------------------------------------------------------
# Print a description of a production-ready anomaly detection pipeline.
# Return a list of pipeline steps (strings).

def production_pipeline() -> list:
    pass  # TODO: implement


def main():
    print("=== Exercise 4.3: Anomaly Detection ===\n")

    zs = zscore_anomaly(signal)
    print("TODO 1 — Z-score anomalies:", np.where(zs == 1)[0])

    iqr = iqr_anomaly(signal)
    print("TODO 2 — IQR anomalies:", np.where(iqr == 1)[0])

    mah1 = mahalanobis_1d(signal)
    print("TODO 3 — Mahalanobis 1D anomalies:", np.where(mah1 == 1)[0])

    iso = isolation_forest(X_all)
    print("TODO 4 — Isolation Forest anomaly count:", iso.sum() if iso is not None else None)

    lof = local_outlier_factor(X_all)
    print("TODO 5 — LOF anomaly count:", lof.sum() if lof is not None else None)

    ocsvm = one_class_svm(X_normal, X_all)
    print("TODO 6 — One-Class SVM anomaly count:", ocsvm.sum() if ocsvm is not None else None)

    ee = elliptic_envelope(X_all)
    print("TODO 7 — Elliptic Envelope anomaly count:", ee.sum() if ee is not None else None)

    mah_mv = mahalanobis_multivariate(X_all)
    print("TODO 8 — Mahalanobis MV anomaly count:", mah_mv.sum() if mah_mv is not None else None)

    ts = np.concatenate([np.sin(np.linspace(0, 20, 200)),
                          np.array([5.0, -5.0, 5.5, -5.5])])
    ts_anom = timeseries_anomaly(ts)
    print("TODO 9 — Time series anomalies:", np.where(ts_anom == 1)[0])

    db_anom = dbscan_anomaly(X_all)
    print("TODO 10 — DBSCAN anomaly count:", db_anom.sum() if db_anom is not None else None)

    ae_anom = autoencoder_anomaly(X_normal, X_all)
    print("TODO 11 — Autoencoder anomaly count:", ae_anom.sum() if ae_anom is not None else None)

    iso_for_eval = isolation_forest(X_all)
    eval_res = evaluate_anomaly(y_true, iso_for_eval) if iso_for_eval is not None else None
    print("TODO 12 — Evaluation:", eval_res)

    from sklearn.ensemble import IsolationForest as IF
    clf = IF(contamination=0.05, random_state=42).fit(X_all)
    scores = -clf.score_samples(X_all)  # higher = more anomalous
    best_thresh, best_f1 = tune_threshold(scores, y_true) if tune_threshold else (None, None)
    print("TODO 13 — Best threshold:", round(best_thresh, 4) if best_thresh else None,
          "| F1:", round(best_f1, 4) if best_f1 else None)

    stream = streaming_anomaly_concept()
    print("TODO 14 — Streaming concept keys:", list(stream.keys()) if stream else None)

    pipeline = production_pipeline()
    print("TODO 15 — Pipeline steps:", len(pipeline) if pipeline else None)


if __name__ == "__main__":
    main()
