# ============================================================
# Examples 4.3 — Anomaly Detection (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.covariance import EllipticEnvelope
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
from sklearn.metrics import (precision_score, recall_score, f1_score,
                              roc_auc_score, average_precision_score)
from scipy import stats
from scipy.spatial.distance import mahalanobis
from statsmodels.tsa.seasonal import seasonal_decompose
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)
# Normal data + injected anomalies
X_normal = np.random.randn(270, 2)
X_anom = np.random.randn(30, 2) * 0.3 + 4.0
X = np.vstack([X_normal, X_anom])
y_true = np.array([0] * 270 + [1] * 30)  # 1 = anomaly

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Z-score anomaly detection"""
    data = np.concatenate([np.random.randn(95), [8.0, -7.5, 9.2, 0.1, 0.3]])
    z_scores = np.abs(stats.zscore(data))
    anomalies = np.where(z_scores > 3)[0]
    print("Ex01 — Z-score anomalies:", anomalies, "values:", np.round(data[anomalies], 2))

def ex02():
    """IQR anomaly detection"""
    data = np.concatenate([np.random.randn(95), [8.0, -7.5, 9.2, 0.1, 0.3]])
    Q1, Q3 = np.percentile(data, 25), np.percentile(data, 75)
    IQR = Q3 - Q1
    lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
    anomalies = np.where((data < lower) | (data > upper))[0]
    print("Ex02 — IQR bounds: [{:.2f}, {:.2f}], anomalies: {}".format(lower, upper, len(anomalies)))

def ex03():
    """Mahalanobis distance anomaly detection"""
    cov = np.cov(X.T)
    cov_inv = np.linalg.pinv(cov)
    mean = X.mean(axis=0)
    dists = np.array([mahalanobis(x, mean, cov_inv) for x in X])
    threshold = np.percentile(dists, 97)
    anomalies = np.sum(dists > threshold)
    print("Ex03 — Mahalanobis: threshold={:.2f}, anomalies={}".format(threshold, anomalies))

def ex04():
    """Isolation Forest fit + predict"""
    iso = IsolationForest(contamination=0.1, random_state=42)
    preds = iso.fit_predict(X)
    n_anomalies = np.sum(preds == -1)
    print("Ex04 — IsolationForest: flagged {} anomalies".format(n_anomalies))

def ex05():
    """Local Outlier Factor"""
    lof = LocalOutlierFactor(n_neighbors=20, contamination=0.1)
    preds = lof.fit_predict(X)
    n_anomalies = np.sum(preds == -1)
    print("Ex05 — LOF: flagged {} anomalies".format(n_anomalies))

def ex06():
    """One-Class SVM"""
    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)
    oc_svm = OneClassSVM(nu=0.1, kernel='rbf', gamma='scale')
    oc_svm.fit(X_s[:200])
    preds = oc_svm.predict(X_s)
    n_anomalies = np.sum(preds == -1)
    print("Ex06 — One-Class SVM: flagged {} anomalies".format(n_anomalies))

def ex07():
    """Elliptic Envelope (assumes Gaussian)"""
    ee = EllipticEnvelope(contamination=0.1, random_state=42)
    preds = ee.fit_predict(X)
    n_anomalies = np.sum(preds == -1)
    print("Ex07 — EllipticEnvelope: flagged {} anomalies".format(n_anomalies))

def ex08():
    """Modified Z-score using MAD"""
    data = np.concatenate([np.random.randn(95), [8.0, -7.5, 9.2]])
    median = np.median(data)
    mad = np.median(np.abs(data - median))
    modified_z = 0.6745 * (data - median) / (mad + 1e-9)
    anomalies = np.where(np.abs(modified_z) > 3.5)[0]
    print("Ex08 — Modified Z-score (MAD) anomalies:", len(anomalies), "indices:", anomalies[:5])

def ex09():
    """Percentile-based threshold"""
    scores = np.concatenate([np.random.exponential(1, 290), np.random.exponential(5, 10)])
    threshold = np.percentile(scores, 95)
    anomalies = np.sum(scores > threshold)
    print("Ex09 — Percentile threshold: {:.2f}, anomalies={}".format(threshold, anomalies))

def ex10():
    """IQR outlier count per feature"""
    df = pd.DataFrame(X, columns=['x', 'y'])
    for col in df.columns:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        count = ((df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)).sum()
        print(f"Ex10 — IQR outliers in '{col}': {count}")

def ex11():
    """Rolling mean ± 3std time series anomaly"""
    ts = np.concatenate([np.random.randn(80), [6.0], np.random.randn(18), [-5.5]])
    s = pd.Series(ts)
    roll_mean = s.rolling(10, min_periods=1).mean()
    roll_std = s.rolling(10, min_periods=1).std().fillna(1.0)
    upper = roll_mean + 3 * roll_std
    lower = roll_mean - 3 * roll_std
    anomalies = s[(s > upper) | (s < lower)].index.tolist()
    print("Ex11 — Rolling 3-std anomaly indices:", anomalies)

def ex12():
    """DBSCAN noise points as anomalies"""
    db = DBSCAN(eps=0.5, min_samples=5).fit(X)
    noise_idx = np.where(db.labels_ == -1)[0]
    print("Ex12 — DBSCAN noise points:", len(noise_idx))

def ex13():
    """Contamination parameter effect on IsolationForest"""
    for cont in [0.05, 0.10, 0.20]:
        iso = IsolationForest(contamination=cont, random_state=42)
        preds = iso.fit_predict(X)
        n = np.sum(preds == -1)
        print(f"Ex13 — contamination={cont}: flagged {n} anomalies")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Isolation Forest anomaly score distribution"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    print("Ex14 — Anomaly score stats: min={:.4f}, max={:.4f}, mean={:.4f}".format(
        scores.min(), scores.max(), scores.mean()))
    threshold = np.percentile(scores, 90)
    print("       90th percentile threshold:", round(threshold, 4))

def ex15():
    """LOF novelty detection (novelty=True)"""
    lof = LocalOutlierFactor(n_neighbors=20, novelty=True)
    lof.fit(X[:200])
    scores = -lof.score_samples(X)
    preds = lof.predict(X)
    n_anom = np.sum(preds == -1)
    print("Ex15 — LOF novelty: flagged {}, score range [{:.3f}, {:.3f}]".format(
        n_anom, scores.min(), scores.max()))

def ex16():
    """Multiple feature anomaly: Mahalanobis on 2D"""
    cov = np.cov(X.T)
    cov_inv = np.linalg.pinv(cov)
    mean = X.mean(axis=0)
    dists = np.array([mahalanobis(x, mean, cov_inv) for x in X])
    top5 = np.argsort(dists)[-5:]
    print("Ex16 — Top 5 Mahalanobis anomalies:", top5)
    print("       Distances:", np.round(dists[top5], 3))

def ex17():
    """Anomaly precision/recall with known labels"""
    iso = IsolationForest(contamination=0.1, random_state=42)
    preds = iso.fit_predict(X)
    pred_labels = (preds == -1).astype(int)
    prec = precision_score(y_true, pred_labels)
    rec = recall_score(y_true, pred_labels)
    f1 = f1_score(y_true, pred_labels)
    print("Ex17 — IsoForest: precision={:.4f}, recall={:.4f}, F1={:.4f}".format(prec, rec, f1))

def ex18():
    """Anomaly threshold tuning with ROC AUC"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    auc = roc_auc_score(y_true, scores)
    ap = average_precision_score(y_true, scores)
    print("Ex18 — IsoForest ROC-AUC:", round(auc, 4), "Avg Precision:", round(ap, 4))

def ex19():
    """Contamination rate estimation"""
    percentiles = [95, 97, 99]
    for p in percentiles:
        iso = IsolationForest(contamination=(100 - p) / 100, random_state=42)
        n_flagged = np.sum(iso.fit_predict(X) == -1)
        print(f"Ex19 — {p}th percentile → contamination={(100-p)/100}, flagged: {n_flagged}")

def ex20():
    """Feature contribution to anomaly score"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    most_anomalous = X[np.argmax(scores)]
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    contributions = np.abs((most_anomalous - mean) / (std + 1e-9))
    print("Ex20 — Most anomalous point:", np.round(most_anomalous, 3))
    print("       Feature contributions:", np.round(contributions, 3))

def ex21():
    """Time series anomaly via seasonal decomposition residuals"""
    t = np.arange(120)
    ts = (np.sin(2 * np.pi * t / 12) + 0.1 * np.random.randn(120))
    ts[60] += 5.0
    ts[90] -= 4.5
    s = pd.Series(ts, index=pd.date_range('2020-01', periods=120, freq='ME'))
    result = seasonal_decompose(s, model='additive', period=12)
    resid = result.resid.dropna()
    z = np.abs(stats.zscore(resid))
    anomaly_dates = resid.index[z > 2.5].tolist()
    print("Ex21 — Time series anomaly dates:", [str(d)[:10] for d in anomaly_dates])

def ex22():
    """Multivariate time series anomaly: sliding window Mahalanobis"""
    data = np.random.randn(100, 3)
    data[50] += 5
    window = 20
    scores = []
    for i in range(window, len(data)):
        win = data[i - window:i]
        cov_inv = np.linalg.pinv(np.cov(win.T))
        d = mahalanobis(data[i], win.mean(axis=0), cov_inv)
        scores.append(d)
    scores = np.array(scores)
    top = np.argmax(scores) + window
    print("Ex22 — Multivariate TS anomaly: max score at index", top, "score:", round(scores.max(), 3))

def ex23():
    """Streaming window anomaly detection"""
    stream = np.concatenate([np.random.randn(180), [7.0, -6.0, 8.5], np.random.randn(17)])
    window_size = 30
    anomalies = []
    for i in range(window_size, len(stream)):
        window = stream[i - window_size:i]
        z = abs(stream[i] - window.mean()) / (window.std() + 1e-9)
        if z > 3:
            anomalies.append(i)
    print("Ex23 — Streaming window anomalies:", anomalies)

def ex24():
    """Anomaly score distribution (normal vs anomaly)"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    normal_scores = scores[y_true == 0]
    anom_scores = scores[y_true == 1]
    print("Ex24 — Normal score: mean={:.4f}, std={:.4f}".format(
        normal_scores.mean(), normal_scores.std()))
    print("       Anomaly score: mean={:.4f}, std={:.4f}".format(
        anom_scores.mean(), anom_scores.std()))

def ex25():
    """Anomaly clustering: group anomaly types"""
    iso = IsolationForest(contamination=0.1, random_state=42)
    preds = iso.fit_predict(X)
    anomaly_data = X[preds == -1]
    from sklearn.cluster import KMeans
    if len(anomaly_data) >= 2:
        km = KMeans(n_clusters=min(3, len(anomaly_data)), random_state=42, n_init=10)
        km.fit(anomaly_data)
        print("Ex25 — Anomaly type clusters:", np.unique(km.labels_, return_counts=True)[1])

def ex26():
    """Semi-supervised anomaly: use labeled normal data for One-Class SVM"""
    normal_data = X[y_true == 0]
    scaler = StandardScaler().fit(normal_data)
    X_normal_s = scaler.transform(normal_data)
    X_all_s = scaler.transform(X)
    oc_svm = OneClassSVM(nu=0.05, kernel='rbf', gamma='scale').fit(X_normal_s)
    preds = oc_svm.predict(X_all_s)
    pred_labels = (preds == -1).astype(int)
    f1 = f1_score(y_true, pred_labels)
    print("Ex26 — Semi-supervised OC-SVM F1:", round(f1, 4))

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """AnomalyDetector class: fit/predict/score"""
    class AnomalyDetector:
        def __init__(self, method='isoforest', contamination=0.1):
            self.method = method
            self.contamination = contamination
            self.model_ = None

        def fit(self, X):
            if self.method == 'isoforest':
                self.model_ = IsolationForest(contamination=self.contamination, random_state=42)
            elif self.method == 'lof':
                self.model_ = LocalOutlierFactor(contamination=self.contamination, novelty=True)
            self.model_.fit(X)
            return self

        def predict(self, X):
            return (self.model_.predict(X) == -1).astype(int)

        def score_samples(self, X):
            return -self.model_.score_samples(X)

    det = AnomalyDetector(method='isoforest').fit(X)
    preds = det.predict(X)
    f1 = f1_score(y_true, preds)
    print("Ex27 — AnomalyDetector F1:", round(f1, 4), "flagged:", preds.sum())

def ex28():
    """EnsembleAnomalyDetector: average scores from multiple detectors"""
    class EnsembleAnomalyDetector:
        def __init__(self, contamination=0.1):
            self.detectors = [
                IsolationForest(contamination=contamination, random_state=42),
                LocalOutlierFactor(contamination=contamination, novelty=True),
                EllipticEnvelope(contamination=contamination, random_state=42),
            ]

        def fit(self, X):
            for d in self.detectors:
                d.fit(X)
            return self

        def score_samples(self, X):
            scores = np.column_stack([-d.score_samples(X) for d in self.detectors])
            return scores.mean(axis=1)

        def predict(self, X, threshold_percentile=90):
            s = self.score_samples(X)
            return (s > np.percentile(s, threshold_percentile)).astype(int)

    ens = EnsembleAnomalyDetector().fit(X)
    preds = ens.predict(X)
    f1 = f1_score(y_true, preds)
    auc = roc_auc_score(y_true, ens.score_samples(X))
    print("Ex28 — EnsembleDetector: F1={:.4f}, AUC={:.4f}".format(f1, auc))

def ex29():
    """TimeSeriesAnomalyDetector class"""
    class TimeSeriesAnomalyDetector:
        def __init__(self, window=20, z_threshold=3.0):
            self.window = window
            self.z_threshold = z_threshold

        def detect(self, series):
            anomalies = []
            for i in range(self.window, len(series)):
                w = series[i - self.window:i]
                z = abs(series[i] - w.mean()) / (w.std() + 1e-9)
                if z > self.z_threshold:
                    anomalies.append({'index': i, 'value': series[i], 'z': round(z, 2)})
            return anomalies

    ts = np.concatenate([np.random.randn(150), [7.0, -6.5], np.random.randn(48)])
    det = TimeSeriesAnomalyDetector(window=20, z_threshold=3.0)
    anomalies = det.detect(ts)
    print("Ex29 — TS anomalies found:", len(anomalies))
    for a in anomalies[:3]:
        print("       ", a)

def ex30():
    """StreamingAnomalyDetector: sliding window statistics"""
    class StreamingAnomalyDetector:
        def __init__(self, window_size=50, threshold=3.0):
            self.window_size = window_size
            self.threshold = threshold
            self.window_ = []
            self.anomaly_count_ = 0

        def update(self, value):
            self.window_.append(value)
            if len(self.window_) > self.window_size:
                self.window_.pop(0)
            if len(self.window_) >= 10:
                mean = np.mean(self.window_[:-1])
                std = np.std(self.window_[:-1]) + 1e-9
                z = abs(value - mean) / std
                if z > self.threshold:
                    self.anomaly_count_ += 1
                    return True
            return False

    det = StreamingAnomalyDetector(window_size=50)
    stream = np.concatenate([np.random.randn(80), [8.0, -7.5], np.random.randn(18)])
    for v in stream:
        det.update(v)
    print("Ex30 — StreamingAnomalyDetector: total anomalies=", det.anomaly_count_)

def ex31():
    """AnomalyExplainer: feature contributions"""
    class AnomalyExplainer:
        def __init__(self, X_train):
            self.mean_ = X_train.mean(axis=0)
            self.std_ = X_train.std(axis=0) + 1e-9

        def explain(self, x, feature_names=None):
            contributions = np.abs((x - self.mean_) / self.std_)
            names = feature_names or [f'f{i}' for i in range(len(x))]
            ranked = sorted(zip(names, contributions), key=lambda t: -t[1])
            return ranked

    explainer = AnomalyExplainer(X[:200])
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    top_anom = X[np.argmax(scores)]
    explanation = explainer.explain(top_anom, feature_names=['x', 'y'])
    print("Ex31 — AnomalyExplainer for top anomaly:", top_anom.round(3))
    for feat, cont in explanation:
        print(f"       Feature '{feat}': contribution {round(cont, 3)}")

def ex32():
    """AnomalyBenchmark: compare methods"""
    class AnomalyBenchmark:
        def __init__(self, contamination=0.1):
            self.methods = {
                'IsolationForest': IsolationForest(contamination=contamination, random_state=42),
                'EllipticEnvelope': EllipticEnvelope(contamination=contamination, random_state=42),
            }
            self.results_ = {}

        def run(self, X, y_true):
            for name, model in self.methods.items():
                model.fit(X)
                preds = (model.predict(X) == -1).astype(int)
                self.results_[name] = {
                    'precision': round(precision_score(y_true, preds), 4),
                    'recall': round(recall_score(y_true, preds), 4),
                    'f1': round(f1_score(y_true, preds), 4),
                }
            return self.results_

    bench = AnomalyBenchmark()
    results = bench.run(X, y_true)
    for method, metrics in results.items():
        print(f"Ex32 — {method}: {metrics}")

def ex33():
    """Full anomaly pipeline: preprocess + detect + explain"""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X_scaled)
    scores = -iso.score_samples(X_scaled)
    preds = (iso.predict(X_scaled) == -1).astype(int)
    auc = roc_auc_score(y_true, scores)
    f1 = f1_score(y_true, preds)
    top5 = np.argsort(scores)[-5:]
    print("Ex33 — Full pipeline: AUC={:.4f}, F1={:.4f}".format(auc, f1))
    print("       Top 5 anomaly indices:", top5.tolist())

def ex34():
    """Anomaly threshold optimizer: maximize F1"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    best_f1, best_thresh = 0, 0
    for p in np.linspace(80, 99, 20):
        thresh = np.percentile(scores, p)
        preds = (scores > thresh).astype(int)
        f1 = f1_score(y_true, preds)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh
    print("Ex34 — Threshold optimizer: best_F1={:.4f}, threshold={:.4f}".format(
        best_f1, best_thresh))

def ex35():
    """Production anomaly system"""
    class ProductionAnomalySystem:
        def __init__(self, contamination=0.1):
            self.scaler = StandardScaler()
            self.detector = IsolationForest(contamination=contamination, random_state=42)
            self.threshold_ = None

        def fit(self, X):
            X_s = self.scaler.fit_transform(X)
            self.detector.fit(X_s)
            scores = -self.detector.score_samples(X_s)
            self.threshold_ = np.percentile(scores, 90)
            return self

        def predict(self, X):
            X_s = self.scaler.transform(X)
            scores = -self.detector.score_samples(X_s)
            return (scores > self.threshold_).astype(int), scores

    system = ProductionAnomalySystem().fit(X[:200])
    preds, scores = system.predict(X)
    print("Ex35 — ProductionAnomalySystem: threshold={:.4f}, flagged={}".format(
        system.threshold_, preds.sum()))

def ex36():
    """Anomaly alert system: priority levels"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    p90, p95, p99 = np.percentile(scores, [90, 95, 99])

    def get_alert_level(score):
        if score > p99:
            return 'CRITICAL'
        elif score > p95:
            return 'HIGH'
        elif score > p90:
            return 'MEDIUM'
        return 'NORMAL'

    top5_scores = sorted(scores, reverse=True)[:5]
    levels = [get_alert_level(s) for s in top5_scores]
    print("Ex36 — Alert levels for top 5 anomalies:", levels)

def ex37():
    """Feedback loop: remove false positives from training set"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    preds = iso.predict(X)
    false_positives = np.where((preds == -1) & (y_true == 0))[0]
    X_clean = np.delete(X, false_positives, axis=0)
    y_clean = np.delete(y_true, false_positives)
    iso2 = IsolationForest(contamination=0.1, random_state=42).fit(X_clean)
    preds2 = (iso2.predict(X_clean) == -1).astype(int)
    f1 = f1_score(y_clean, preds2)
    print("Ex37 — After FP removal: removed={}, new F1={:.4f}".format(
        len(false_positives), f1))

def ex38():
    """Root cause analysis concept"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    top_idx = np.argmax(scores)
    top_point = X[top_idx]
    mean = X.mean(axis=0)
    std = X.std(axis=0) + 1e-9
    feature_zscores = np.abs((top_point - mean) / std)
    print("Ex38 — Root cause for anomaly index {}:".format(top_idx))
    for i, (val, z) in enumerate(zip(top_point, feature_zscores)):
        flag = " <-- anomalous" if z > 2 else ""
        print(f"       Feature {i}: value={val:.3f}, z-score={z:.3f}{flag}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Deep one-class classification concept"""
    print("Ex39 — Deep One-Class Classification (Deep SVDD) concept:")
    print("  - Map data to hypersphere in deep feature space")
    print("  - Minimize: sum_i ||phi(x_i) - c||^2 (distance to center c)")
    print("  - phi = deep neural network (e.g. CNN for images)")
    print("  - Normal data maps close to center; anomalies far away")
    print("  - Avoid collapse: don't map all to same point (hypersphere collapse)")
    print("  - Trained only on normal data (no anomaly labels needed)")

def ex40():
    """Autoencoder reconstruction error for anomaly"""
    np.random.seed(42)
    W1 = np.random.randn(2, 1) * 0.5
    W2 = W1.T
    X_enc = X @ W1
    X_rec = X_enc @ W2
    errors = np.mean((X - X_rec) ** 2, axis=1)
    auc = roc_auc_score(y_true, errors)
    print("Ex40 — Autoencoder reconstruction AUC:", round(auc, 4))
    print("       Normal mean error: {:.4f}, Anomaly mean error: {:.4f}".format(
        errors[y_true == 0].mean(), errors[y_true == 1].mean()))

def ex41():
    """VAE-based anomaly (ELBO as score) concept"""
    print("Ex41 — VAE-based Anomaly Detection:")
    print("  - Train VAE on normal data only")
    print("  - Anomaly score = -ELBO = reconstruction_loss + KL_divergence")
    print("  - Normal samples: small reconstruction error + KL close to N(0,1)")
    print("  - Anomalies: large reconstruction error (out-of-distribution)")
    print("  - Can also use: sample multiple z, average reconstruction errors")
    print("  - Works well for image, time series, and tabular anomaly detection")

def ex42():
    """GAN-based anomaly concept (AnoGAN)"""
    print("Ex42 — GAN-based Anomaly Detection (AnoGAN) concept:")
    print("  - Train GAN on normal data to learn the normal manifold")
    print("  - At test time: find z* in latent space minimizing ||G(z*) - x||")
    print("  - Anomaly score = residual_loss + discriminator_loss")
    print("  - High score means x doesn't lie on normal manifold")
    print("  - Limitation: slow at inference (requires optimization per sample)")
    print("  - f-AnoGAN improves this with encoder network for fast inference")

def ex43():
    """Anomaly detection in high-dimensional data"""
    np.random.seed(0)
    X_hd = np.random.randn(200, 50)
    X_hd[190:] += 4
    y_hd = np.array([0] * 190 + [1] * 10)
    scaler = StandardScaler()
    X_hd_s = scaler.fit_transform(X_hd)
    iso = IsolationForest(contamination=0.05, random_state=42).fit(X_hd_s)
    preds = (iso.predict(X_hd_s) == -1).astype(int)
    from sklearn.decomposition import PCA
    X_pca = PCA(n_components=10).fit_transform(X_hd_s)
    iso_pca = IsolationForest(contamination=0.05, random_state=42).fit(X_pca)
    preds_pca = (iso_pca.predict(X_pca) == -1).astype(int)
    print("Ex43 — High-dim anomaly: raw F1={:.4f}, PCA+IsoF F1={:.4f}".format(
        f1_score(y_hd, preds), f1_score(y_hd, preds_pca)))

def ex44():
    """Graph anomaly detection concept"""
    print("Ex44 — Graph Anomaly Detection concept:")
    print("  - Node anomaly: node properties differ from neighborhood")
    print("  - Edge anomaly: unexpected connection between nodes")
    print("  - Subgraph anomaly: unusual community structure")
    print("  - Methods: ODDBALL (egonet features), FRAUDAR (dense subgraph)")
    print("  - GNN-based: train on normal graph structure, flag high reconstruction error")
    print("  - Use case: fraud networks, intrusion detection, social bots")

def ex45():
    """Log anomaly detection concept"""
    print("Ex45 — Log Anomaly Detection concept:")
    print("  - Parse logs into structured templates (Drain/Spell parser)")
    print("  - Count vector: frequency of each log template in time window")
    print("  - PCA/IsolationForest on count vectors for statistical anomaly")
    print("  - DeepLog: LSTM predicts next log key; anomaly if actual key in top-k")
    print("  - LogBERT: masked log key prediction; anomaly score from log likelihood")
    print("  - Challenge: log formats change over time (concept drift)")

def ex46():
    """Anomaly in NLP: perplexity-based"""
    print("Ex46 — NLP Anomaly Detection (Perplexity-based):")
    print("  - Train language model on normal text corpus")
    print("  - Perplexity = exp(-1/N * sum(log P(w_i | context)))")
    print("  - High perplexity = unusual/anomalous text")
    print("  - Use cases: spam detection, fraud in text, prompt injection")
    print("  - BERT-based: log-likelihood of masked tokens as normality score")
    text_lens = np.array([len(t.split()) for t in ["hello world", "normal sentence here",
                                                     "asdf zxcv qwer abnormal!!!#@"]])
    print("  - Example text lengths:", text_lens)

def ex47():
    """Active learning for anomaly detection"""
    iso = IsolationForest(contamination=0.1, random_state=42).fit(X)
    scores = -iso.score_samples(X)
    uncertain = np.where((scores > np.percentile(scores, 45)) &
                         (scores < np.percentile(scores, 55)))[0]
    print("Ex47 — Active learning: uncertain samples to label:", len(uncertain))
    print("  Strategy: query labels for samples near decision boundary")
    print("  Update model with newly labeled data, repeat")
    print("  Reduces labeling effort by 5-10x vs random labeling")

def ex48():
    """Federated anomaly detection concept"""
    print("Ex48 — Federated Anomaly Detection concept:")
    print("  - Each client trains local anomaly detector on private data")
    print("  - Aggregate: FedAvg on model parameters (for neural detectors)")
    print("  - Or: share only summary statistics (mean, covariance) privately")
    print("  - Differential privacy: add Gaussian noise to shared parameters")
    print("  - Challenge: different data distributions per client (non-IID)")
    print("  - Application: fraud detection across banks without sharing transactions")

def ex49():
    """Production anomaly detection architecture"""
    print("Ex49 — Production Anomaly Detection Architecture:")
    print("  1. Data ingestion: Kafka stream → feature extraction service")
    print("  2. Feature store: pre-computed entity features (Redis/Feast)")
    print("  3. Scoring service: IsoForest/autoencoder → anomaly score <10ms")
    print("  4. Threshold engine: adaptive thresholds per entity type")
    print("  5. Alert router: score → alert level (NORMAL/MEDIUM/HIGH/CRITICAL)")
    print("  6. Investigation dashboard: top-k anomalies + feature explanations")
    print("  7. Feedback loop: analyst labels → retraining pipeline")
    print("  8. Monitoring: track FP rate, detection latency, model drift")

def ex50():
    """Anomaly detection checklist"""
    print("Ex50 — Anomaly Detection Checklist:")
    print("  [ ] Define 'normal': what is the baseline distribution?")
    print("  [ ] Choose contamination rate: expected anomaly fraction")
    print("  [ ] Select method: statistical / tree-based / distance / density")
    print("  [ ] Feature engineering: domain-specific features matter most")
    print("  [ ] Evaluation: use PR-AUC (better than ROC-AUC for imbalanced data)")
    print("  [ ] Threshold tuning: optimize F1 or precision@k on validation set")
    print("  [ ] Interpretability: explain WHY a sample is anomalous")
    print("  [ ] Monitoring: retrain when anomaly rate or data distribution shifts")


def main():
    print("=" * 60)
    print("Examples 4.3 — Anomaly Detection")
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
