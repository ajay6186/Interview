# ============================================================
# Examples 4.4 — Model Monitoring & Drift Detection (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from scipy import stats
from sklearn.metrics import accuracy_score, f1_score
from collections import deque, defaultdict
import math
import time

rng = np.random.default_rng(42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Mean shift detection between reference and current data"""
    ref = rng.normal(0.0, 1.0, 1000)
    cur = rng.normal(0.4, 1.0, 1000)
    shift = abs(cur.mean() - ref.mean())
    flag = "DRIFT" if shift > 0.1 else "OK"
    print(f"Ex01 — Mean Shift: ref={ref.mean():.3f}, cur={cur.mean():.3f}, shift={shift:.3f} → {flag}")

def ex02():
    """Variance change detection"""
    ref = rng.normal(0, 1.0, 1000)
    cur = rng.normal(0, 2.5, 1000)
    ratio = cur.std() / ref.std()
    flag = "VARIANCE DRIFT" if ratio > 1.5 or ratio < 0.67 else "OK"
    print(f"Ex02 — Variance Change: ref_std={ref.std():.3f}, cur_std={cur.std():.3f}, ratio={ratio:.3f} → {flag}")

def ex03():
    """Min/max range check — flag values outside reference range"""
    ref = rng.uniform(0, 10, 500)
    new_data = np.array([1.0, 5.0, 11.5, -2.0, 8.0, 12.0])
    lo, hi = ref.min(), ref.max()
    out_of_range = new_data[(new_data < lo) | (new_data > hi)]
    print(f"Ex03 — Range Check: [{lo:.2f}, {hi:.2f}], out-of-range={out_of_range}, count={len(out_of_range)}")

def ex04():
    """Null rate monitoring — count and fraction of NaNs"""
    data = np.array([1.0, np.nan, 3.0, np.nan, 5.0, np.nan, 7.0, 8.0, np.nan, 10.0])
    nan_count = np.isnan(data).sum()
    nan_rate = nan_count / len(data)
    flag = "HIGH NULL RATE" if nan_rate > 0.2 else "OK"
    print(f"Ex04 — Null Rate: {nan_count}/{len(data)} = {nan_rate:.1%} → {flag}")

def ex05():
    """Data type validation — check expected dtypes"""
    schema = {"age": np.float64, "income": np.float64, "score": np.float64}
    data = {"age": np.array([25.0, 30.0]), "income": np.array([50000.0, 60000.0]), "score": np.array([0.8, 0.9])}
    results = {k: "OK" if data[k].dtype == schema[k] else "TYPE_MISMATCH" for k in schema}
    print(f"Ex05 — Type Validation: {results}")

def ex06():
    """Class distribution comparison — expected vs actual"""
    expected = {"cat_A": 0.50, "cat_B": 0.30, "cat_C": 0.20}
    labels = rng.choice(["cat_A", "cat_B", "cat_C"], size=300, p=[0.45, 0.35, 0.20])
    unique, counts = np.unique(labels, return_counts=True)
    actual = dict(zip(unique, counts / len(labels)))
    for k in expected:
        diff = abs(actual.get(k, 0) - expected[k])
        flag = "DRIFT" if diff > 0.05 else "OK"
        print(f"Ex06 — Class '{k}': expected={expected[k]:.2f}, actual={actual.get(k, 0):.2f}, diff={diff:.2f} → {flag}")

def ex07():
    """Feature correlation change — compare two correlation matrices"""
    ref = rng.normal(0, 1, (200, 3))
    cur = rng.normal(0, 1, (200, 3))
    cur[:, 2] = cur[:, 0] * 0.9 + rng.normal(0, 0.1, 200)  # introduce correlation
    corr_ref = np.corrcoef(ref.T)
    corr_cur = np.corrcoef(cur.T)
    delta = np.abs(corr_cur - corr_ref).mean()
    print(f"Ex07 — Correlation Change: mean |Δcorr| = {delta:.4f} → {'DRIFT' if delta > 0.1 else 'OK'}")

def ex08():
    """Prediction distribution stats — mean/std/min/max"""
    preds = rng.beta(2, 5, 1000)
    print(f"Ex08 — Prediction Stats: mean={preds.mean():.4f}, std={preds.std():.4f}, "
          f"min={preds.min():.4f}, max={preds.max():.4f}, p5={np.percentile(preds, 5):.4f}, p95={np.percentile(preds, 95):.4f}")

def ex09():
    """Latency measurement — simulate single inference timing"""
    def mock_inference(x):
        time.sleep(0.001)
        return float(np.sum(x))
    data = rng.normal(0, 1, 100)
    start = time.perf_counter()
    for _ in range(10):
        mock_inference(data)
    elapsed = (time.perf_counter() - start) / 10 * 1000
    print(f"Ex09 — Avg Inference Latency: {elapsed:.2f} ms")

def ex10():
    """Error rate tracking — running average of errors"""
    outcomes = rng.choice([0, 1], size=100, p=[0.95, 0.05])  # 1 = error
    window = deque(maxlen=20)
    rates = []
    for o in outcomes:
        window.append(o)
        rates.append(np.mean(window))
    print(f"Ex10 — Error Rate: overall={outcomes.mean():.3f}, final_rolling20={rates[-1]:.3f}, max_rolling={max(rates):.3f}")

def ex11():
    """Throughput calculation — requests per second"""
    n_requests = 10000
    elapsed_sec = 4.73
    throughput = n_requests / elapsed_sec
    print(f"Ex11 — Throughput: {n_requests} requests in {elapsed_sec}s = {throughput:.1f} req/s")

def ex12():
    """Simple threshold alert — value > threshold"""
    metrics = {"error_rate": 0.07, "latency_p99_ms": 320.0, "null_rate": 0.03}
    thresholds = {"error_rate": 0.05, "latency_p99_ms": 300.0, "null_rate": 0.10}
    for metric, value in metrics.items():
        flag = "ALERT" if value > thresholds[metric] else "OK"
        print(f"Ex12 — {metric}: value={value}, threshold={thresholds[metric]} → {flag}")

def ex13():
    """Rolling mean of last 10 values"""
    stream = rng.normal(0, 1, 30)
    window = deque(maxlen=10)
    rolling = []
    for v in stream:
        window.append(v)
        rolling.append(np.mean(window))
    print(f"Ex13 — Rolling Mean (last 10): final={rolling[-1]:.4f}, min={min(rolling):.4f}, max={max(rolling):.4f}")

# ─── INTERMEDIATE (14–26) ────────────────────────────────────

def ex14():
    """PSI (Population Stability Index) calculation"""
    def psi(expected, actual, bins=10):
        breakpoints = np.percentile(expected, np.linspace(0, 100, bins + 1))
        breakpoints[0] -= 1e-10; breakpoints[-1] += 1e-10
        exp_cnt, _ = np.histogram(expected, bins=breakpoints)
        act_cnt, _ = np.histogram(actual, bins=breakpoints)
        exp_pct = np.where(exp_cnt == 0, 1e-6, exp_cnt / len(expected))
        act_pct = np.where(act_cnt == 0, 1e-6, act_cnt / len(actual))
        psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
        return psi_val
    ref = rng.normal(0, 1, 2000)
    shifted = rng.normal(0.5, 1, 2000)
    score = psi(ref, shifted)
    level = "LOW" if score < 0.1 else "MEDIUM" if score < 0.25 else "HIGH"
    print(f"Ex14 — PSI: {score:.4f} → {level} shift")

def ex15():
    """KL divergence (discrete distributions)"""
    def kl_div(p, q):
        p = np.array(p, dtype=float); q = np.array(q, dtype=float)
        p /= p.sum(); q /= q.sum()
        q = np.where(q == 0, 1e-10, q)
        return np.sum(p * np.log(p / q))
    ref_dist = [0.3, 0.4, 0.2, 0.1]
    cur_dist = [0.25, 0.35, 0.25, 0.15]
    kl = kl_div(ref_dist, cur_dist)
    print(f"Ex15 — KL Divergence: ref={ref_dist}, cur={cur_dist}, KL={kl:.4f}")

def ex16():
    """Jensen-Shannon divergence"""
    def js_div(p, q):
        p = np.array(p, dtype=float); q = np.array(q, dtype=float)
        p /= p.sum(); q /= q.sum()
        m = 0.5 * (p + q)
        def kl(a, b): return np.sum(a * np.log(np.where(a == 0, 1, a / np.where(b == 0, 1e-10, b))))
        return 0.5 * kl(p, m) + 0.5 * kl(q, m)
    p = [0.4, 0.3, 0.2, 0.1]
    q = [0.2, 0.3, 0.3, 0.2]
    jsd = js_div(p, q)
    print(f"Ex16 — JS Divergence: {jsd:.4f} (0=identical, 1=maximally different, log2 scale)")

def ex17():
    """Wasserstein distance (earth mover's distance)"""
    ref = rng.normal(0, 1, 500)
    cur = rng.normal(0.8, 1.2, 500)
    dist = stats.wasserstein_distance(ref, cur)
    print(f"Ex17 — Wasserstein Distance: {dist:.4f} (ref~N(0,1) vs cur~N(0.8,1.2))")

def ex18():
    """KS test for distribution drift"""
    ref = rng.normal(0, 1, 1000)
    cur_no_drift = rng.normal(0.05, 1.0, 1000)
    cur_drift = rng.normal(1.0, 1.5, 1000)
    ks1, p1 = stats.ks_2samp(ref, cur_no_drift)
    ks2, p2 = stats.ks_2samp(ref, cur_drift)
    print(f"Ex18 — KS Test: no-drift → stat={ks1:.4f}, p={p1:.4f} | drift → stat={ks2:.4f}, p={p2:.6f}")

def ex19():
    """Chi-square test for categorical drift"""
    ref_counts = np.array([500, 300, 200])
    cur_counts = np.array([420, 350, 230])
    chi2, p = stats.chisquare(f_obs=cur_counts, f_exp=ref_counts * cur_counts.sum() / ref_counts.sum())
    print(f"Ex19 — Chi-Square Test: chi2={chi2:.4f}, p={p:.4f} → {'DRIFT' if p < 0.05 else 'OK'}")

def ex20():
    """Cramér's V statistic for categorical association strength"""
    obs = np.array([[50, 30], [20, 40], [30, 30]])
    chi2, p, dof, _ = stats.chi2_contingency(obs)
    n = obs.sum()
    cramers_v = math.sqrt(chi2 / (n * (min(obs.shape) - 1)))
    print(f"Ex20 — Cramér's V: {cramers_v:.4f} (0=no assoc, 1=perfect), chi2={chi2:.3f}, p={p:.4f}")

def ex21():
    """Feature drift score per column using KS test"""
    n = 500
    ref = {f"feat_{i}": rng.normal(i * 0.1, 1, n) for i in range(5)}
    drift_factors = [0.0, 0.2, 0.8, 0.0, 1.5]
    print("Ex21 — Per-Feature Drift Scores (KS statistic):")
    for i, (feat, ref_vals) in enumerate(ref.items()):
        cur_vals = rng.normal(i * 0.1 + drift_factors[i], 1, n)
        ks_stat, p_val = stats.ks_2samp(ref_vals, cur_vals)
        flag = "DRIFT" if p_val < 0.05 else "OK"
        print(f"  {feat}: KS={ks_stat:.4f}, p={p_val:.4f} → {flag}")

def ex22():
    """Concept drift simulation — performance drop over time"""
    np.random.seed(0)
    n_windows = 10
    performances = [0.92 - i * 0.03 + rng.normal(0, 0.01) for i in range(n_windows)]
    print("Ex22 — Concept Drift (F1 over time windows):")
    for i, perf in enumerate(performances):
        bar = "█" * int(perf * 20)
        flag = " ← ALERT" if perf < 0.80 else ""
        print(f"  Window {i+1:02d}: {perf:.3f} {bar}{flag}")

def ex23():
    """Gradual drift vs sudden drift detection"""
    n = 100
    gradual = np.array([rng.normal(i * 0.05, 1) for i in range(n)])
    sudden = np.concatenate([rng.normal(0, 1, 50), rng.normal(3.0, 1, 50)])
    grad_ks, _ = stats.ks_2samp(gradual[:50], gradual[50:])
    sudd_ks, _ = stats.ks_2samp(sudden[:50], sudden[50:])
    print(f"Ex23 — Gradual drift KS={grad_ks:.4f} | Sudden drift KS={sudd_ks:.4f}")
    print(f"  Gradual mean shift: {gradual[:50].mean():.2f} → {gradual[50:].mean():.2f}")
    print(f"  Sudden  mean shift: {sudden[:50].mean():.2f} → {sudden[50:].mean():.2f}")

def ex24():
    """Seasonal pattern detection via autocorrelation"""
    t = np.arange(200)
    signal = np.sin(2 * np.pi * t / 24) + rng.normal(0, 0.1, 200)
    autocorr = np.correlate(signal - signal.mean(), signal - signal.mean(), mode='full')
    autocorr = autocorr[len(autocorr) // 2:]
    autocorr /= autocorr[0]
    peak_lag = np.argmax(autocorr[1:25]) + 1
    print(f"Ex24 — Autocorrelation Peak Lag: {peak_lag} (expected ~24), corr at lag={peak_lag}: {autocorr[peak_lag]:.4f}")

def ex25():
    """Model performance degradation simulation"""
    months = 6
    base_acc = 0.94
    drift_per_month = 0.025
    acc_over_time = [base_acc - i * drift_per_month + rng.normal(0, 0.005) for i in range(months)]
    retrain_threshold = 0.85
    print("Ex25 — Performance Degradation Over 6 Months:")
    for m, acc in enumerate(acc_over_time, 1):
        status = "RETRAIN NOW" if acc < retrain_threshold else "ok"
        print(f"  Month {m}: accuracy={acc:.4f} {status}")

def ex26():
    """Monitoring dashboard data structure"""
    dashboard = {
        "timestamp": "2026-03-21T10:00:00Z",
        "model_version": "v2.3.1",
        "metrics": {
            "accuracy_last_24h": round(float(rng.uniform(0.88, 0.93)), 4),
            "p99_latency_ms": round(float(rng.uniform(80, 120)), 1),
            "error_rate": round(float(rng.uniform(0.01, 0.04)), 4),
            "throughput_rps": round(float(rng.uniform(900, 1100)), 1),
            "psi_score": round(float(rng.uniform(0.05, 0.15)), 4),
            "ks_stat_feature1": round(float(rng.uniform(0.03, 0.12)), 4),
        },
        "alerts": [],
        "drift_status": "LOW",
    }
    print("Ex26 — Monitoring Dashboard:")
    for k, v in dashboard["metrics"].items():
        print(f"  {k}: {v}")

# ─── NESTED (27–38) ──────────────────────────────────────────

def ex27():
    """DriftDetector class — PSI-based fit/detect"""
    class DriftDetector:
        def __init__(self, bins=10, threshold=0.2):
            self.bins = bins
            self.threshold = threshold
            self.breakpoints = None
            self.ref_pct = None
        def fit(self, reference):
            bp = np.percentile(reference, np.linspace(0, 100, self.bins + 1))
            bp[0] -= 1e-10; bp[-1] += 1e-10
            self.breakpoints = bp
            cnt, _ = np.histogram(reference, bins=bp)
            self.ref_pct = np.where(cnt == 0, 1e-6, cnt / len(reference))
        def detect(self, current):
            cnt, _ = np.histogram(current, bins=self.breakpoints)
            cur_pct = np.where(cnt == 0, 1e-6, cnt / len(current))
            psi = float(np.sum((cur_pct - self.ref_pct) * np.log(cur_pct / self.ref_pct)))
            return {"psi": round(psi, 4), "drift": psi > self.threshold}
    detector = DriftDetector()
    detector.fit(rng.normal(0, 1, 2000))
    res = detector.detect(rng.normal(0.6, 1.1, 500))
    print(f"Ex27 — DriftDetector: PSI={res['psi']}, drift={res['drift']}")

def ex28():
    """MultiFeatureDriftDetector — run KS per feature"""
    class MultiFeatureDriftDetector:
        def __init__(self, alpha=0.05):
            self.alpha = alpha
            self.reference = {}
        def fit(self, data_dict):
            self.reference = {k: v.copy() for k, v in data_dict.items()}
        def detect(self, new_data_dict):
            results = {}
            for feat, new_vals in new_data_dict.items():
                ks, p = stats.ks_2samp(self.reference[feat], new_vals)
                results[feat] = {"ks": round(ks, 4), "p": round(p, 4), "drift": p < self.alpha}
            n_drift = sum(v["drift"] for v in results.values())
            results["__summary__"] = f"{n_drift}/{len(new_data_dict)} features drifted"
            return results
    ref = {f"f{i}": rng.normal(i, 1, 1000) for i in range(4)}
    cur = {f"f{i}": rng.normal(i + (1.5 if i % 2 == 0 else 0), 1, 300) for i in range(4)}
    mfd = MultiFeatureDriftDetector()
    mfd.fit(ref)
    result = mfd.detect(cur)
    print(f"Ex28 — MultiFeatureDriftDetector: {result['__summary__']}")
    for k, v in result.items():
        if k != "__summary__":
            print(f"  {k}: KS={v['ks']}, drift={v['drift']}")

def ex29():
    """MonitoringPipeline — collect → compute → alert"""
    class MonitoringPipeline:
        def __init__(self, thresholds):
            self.thresholds = thresholds
            self.alerts = []
        def collect(self, predictions, actuals):
            return {"acc": accuracy_score(actuals, predictions),
                    "n": len(predictions)}
        def compute(self, metrics, reference_preds, current_preds):
            ks, p = stats.ks_2samp(reference_preds, current_preds)
            metrics["ks_stat"] = round(ks, 4)
            metrics["ks_p"] = round(p, 4)
            return metrics
        def alert(self, metrics):
            triggered = []
            for metric, threshold in self.thresholds.items():
                val = metrics.get(metric, 0)
                if metric == "acc" and val < threshold:
                    triggered.append(f"LOW_{metric.upper()}({val:.3f}<{threshold})")
                elif metric == "ks_stat" and val > threshold:
                    triggered.append(f"DRIFT_{metric.upper()}({val:.4f}>{threshold})")
            return triggered or ["NONE"]
        def run(self, predictions, actuals, ref_preds, cur_preds):
            m = self.collect(predictions, actuals)
            m = self.compute(m, ref_preds, cur_preds)
            alerts = self.alert(m)
            return m, alerts
    pipe = MonitoringPipeline({"acc": 0.85, "ks_stat": 0.1})
    y_true = rng.choice([0, 1], size=200)
    y_pred = np.where(rng.uniform(size=200) > 0.12, y_true, 1 - y_true)
    ref_p = rng.uniform(0, 1, 500)
    cur_p = rng.beta(2, 2, 200)
    metrics, alerts = pipe.run(y_pred, y_true, ref_p, cur_p)
    print(f"Ex29 — MonitoringPipeline: acc={metrics['acc']:.3f}, KS={metrics['ks_stat']}, alerts={alerts}")

def ex30():
    """AlertSystem — threshold → alert → log"""
    class AlertSystem:
        def __init__(self):
            self.log = []
            self.rules = {}
        def add_rule(self, name, metric, threshold, direction="above"):
            self.rules[name] = {"metric": metric, "threshold": threshold, "direction": direction}
        def check(self, metrics):
            alerts = []
            for name, rule in self.rules.items():
                val = metrics.get(rule["metric"])
                if val is None:
                    continue
                triggered = (val > rule["threshold"]) if rule["direction"] == "above" else (val < rule["threshold"])
                if triggered:
                    msg = f"[ALERT] {name}: {rule['metric']}={val:.4f} {'>' if rule['direction']=='above' else '<'} {rule['threshold']}"
                    alerts.append(msg)
                    self.log.append(msg)
            return alerts
    as_ = AlertSystem()
    as_.add_rule("HighErrorRate", "error_rate", 0.05)
    as_.add_rule("LowAccuracy", "accuracy", 0.85, "below")
    as_.add_rule("HighLatency", "p99_latency_ms", 300)
    current_metrics = {"error_rate": 0.07, "accuracy": 0.81, "p99_latency_ms": 250}
    alerts = as_.check(current_metrics)
    print(f"Ex30 — AlertSystem: {len(alerts)} alerts fired")
    for a in alerts:
        print(f"  {a}")

def ex31():
    """Monitoring report generator — dict → formatted string"""
    def generate_report(data):
        lines = ["=" * 50, f"MONITORING REPORT — {data['timestamp']}", "=" * 50,
                 f"Model: {data['model']}  Version: {data['version']}",
                 f"Requests (24h): {data['requests']:,}", "",
                 "METRICS:", f"  Accuracy   : {data['accuracy']:.4f}",
                 f"  Error Rate : {data['error_rate']:.4f}",
                 f"  P99 Latency: {data['p99_ms']} ms",
                 f"  PSI Score  : {data['psi']:.4f}", "",
                 f"DRIFT STATUS: {data['drift_status']}",
                 f"ALERTS ({len(data['alerts'])}): {', '.join(data['alerts']) or 'None'}",
                 "=" * 50]
        return "\n".join(lines)
    report_data = {
        "timestamp": "2026-03-21", "model": "fraud_classifier", "version": "v3.1",
        "requests": 142857, "accuracy": 0.9123, "error_rate": 0.0312,
        "p99_ms": 87, "psi": 0.0823, "drift_status": "LOW",
        "alerts": ["HighErrorRate"]
    }
    print("Ex31 — Monitoring Report:")
    print(generate_report(report_data))

def ex32():
    """RollingWindowStats — update + get stats"""
    class RollingWindowStats:
        def __init__(self, window_size=50):
            self.window = deque(maxlen=window_size)
        def update(self, value):
            self.window.append(value)
        def stats(self):
            if not self.window:
                return {}
            arr = np.array(self.window)
            return {"mean": round(float(arr.mean()), 4), "std": round(float(arr.std()), 4),
                    "min": round(float(arr.min()), 4), "max": round(float(arr.max()), 4),
                    "p95": round(float(np.percentile(arr, 95)), 4), "n": len(arr)}
    rws = RollingWindowStats(window_size=30)
    stream = rng.exponential(scale=50, size=100)
    for v in stream:
        rws.update(v)
    s = rws.stats()
    print(f"Ex32 — RollingWindowStats (last 30): mean={s['mean']}, std={s['std']}, p95={s['p95']}, n={s['n']}")

def ex33():
    """ExponentialMovingAverage class"""
    class EMA:
        def __init__(self, alpha=0.1):
            self.alpha = alpha
            self.value = None
            self.history = []
        def update(self, x):
            if self.value is None:
                self.value = x
            else:
                self.value = self.alpha * x + (1 - self.alpha) * self.value
            self.history.append(round(self.value, 4))
            return self.value
    ema = EMA(alpha=0.2)
    data = rng.normal(5, 1, 20)
    for v in data:
        ema.update(v)
    print(f"Ex33 — EMA (alpha=0.2): data_mean={data.mean():.4f}, "
          f"ema_final={ema.value:.4f}, first_3={ema.history[:3]}, last_3={ema.history[-3:]}")

def ex34():
    """BaselineComparison — fit baseline, compare new data"""
    class BaselineComparison:
        def __init__(self):
            self.baseline_mean = None
            self.baseline_std = None
        def fit(self, data):
            self.baseline_mean = float(data.mean())
            self.baseline_std = float(data.std())
        def compare(self, new_data):
            z = abs(new_data.mean() - self.baseline_mean) / (self.baseline_std + 1e-9)
            ks_stat, p_val = stats.ks_2samp(
                rng.normal(self.baseline_mean, self.baseline_std, 1000), new_data)
            return {"z_score": round(z, 4), "ks_stat": round(ks_stat, 4),
                    "ks_p": round(p_val, 4), "drift": z > 2.0 or p_val < 0.05}
    bc = BaselineComparison()
    bc.fit(rng.normal(10.0, 2.0, 2000))
    result = bc.compare(rng.normal(11.5, 2.2, 300))
    print(f"Ex34 — BaselineComparison: z={result['z_score']}, KS={result['ks_stat']}, drift={result['drift']}")

def ex35():
    """DriftSeverityClassifier — none/low/medium/high"""
    class DriftSeverityClassifier:
        LEVELS = [(0.0, 0.1, "NONE"), (0.1, 0.2, "LOW"), (0.2, 0.25, "MEDIUM"), (0.25, float("inf"), "HIGH")]
        def classify_psi(self, psi):
            for lo, hi, label in self.LEVELS:
                if lo <= psi < hi:
                    return label
            return "HIGH"
        def classify_ks(self, p_val):
            if p_val >= 0.05: return "NONE"
            if p_val >= 0.01: return "LOW"
            if p_val >= 0.001: return "MEDIUM"
            return "HIGH"
    clf = DriftSeverityClassifier()
    test_psi = [0.05, 0.12, 0.22, 0.31]
    test_ks_p = [0.45, 0.03, 0.005, 0.0001]
    print("Ex35 — DriftSeverityClassifier:")
    for psi_val, ksp in zip(test_psi, test_ks_p):
        print(f"  PSI={psi_val:.2f} → {clf.classify_psi(psi_val)}, KS_p={ksp} → {clf.classify_ks(ksp)}")

def ex36():
    """AutoRetrainingTrigger — trigger on drift score"""
    class AutoRetrainingTrigger:
        def __init__(self, psi_threshold=0.2, acc_threshold=0.85, consecutive=3):
            self.psi_threshold = psi_threshold
            self.acc_threshold = acc_threshold
            self.consecutive = consecutive
            self._trigger_count = 0
            self.events = []
        def check(self, psi, accuracy):
            breach = psi > self.psi_threshold or accuracy < self.acc_threshold
            if breach:
                self._trigger_count += 1
            else:
                self._trigger_count = 0
            should_retrain = self._trigger_count >= self.consecutive
            self.events.append({"psi": psi, "acc": accuracy, "retrain": should_retrain})
            return should_retrain
    trigger = AutoRetrainingTrigger(psi_threshold=0.2, acc_threshold=0.85, consecutive=3)
    checkpoints = [(0.08, 0.92), (0.15, 0.89), (0.22, 0.84), (0.27, 0.81), (0.31, 0.78)]
    print("Ex36 — AutoRetrainingTrigger:")
    for psi, acc in checkpoints:
        retrain = trigger.check(psi, acc)
        print(f"  PSI={psi}, acc={acc} → retrain={retrain}")

def ex37():
    """MonitoringDashboard — all metrics in one place"""
    class MonitoringDashboard:
        def __init__(self, model_name):
            self.model_name = model_name
            self.metrics_history = defaultdict(list)
        def record(self, **kwargs):
            for k, v in kwargs.items():
                self.metrics_history[k].append(v)
        def summary(self):
            print(f"  Model: {self.model_name}")
            for k, vals in self.metrics_history.items():
                arr = np.array(vals)
                print(f"  {k:20s}: n={len(vals)}, mean={arr.mean():.4f}, "
                      f"min={arr.min():.4f}, max={arr.max():.4f}")
    dash = MonitoringDashboard("revenue_predictor_v2")
    for _ in range(20):
        dash.record(
            accuracy=float(rng.uniform(0.87, 0.93)),
            psi=float(rng.uniform(0.02, 0.18)),
            p99_ms=float(rng.uniform(60, 140))
        )
    print("Ex37 — MonitoringDashboard Summary:")
    dash.summary()

def ex38():
    """Full monitoring workflow — end-to-end demo"""
    print("Ex38 — Full Monitoring Workflow:")
    ref_data = rng.normal(0, 1, 2000)
    new_data = rng.normal(0.5, 1.2, 400)
    y_true = rng.choice([0, 1], 400)
    y_pred = np.where(rng.uniform(size=400) > 0.10, y_true, 1 - y_true)
    # Step 1: drift detection
    ks_stat, p_val = stats.ks_2samp(ref_data, new_data)
    # Step 2: performance
    acc = accuracy_score(y_true, y_pred)
    # Step 3: alert logic
    alerts = []
    if p_val < 0.05: alerts.append(f"DATA_DRIFT(KS_p={p_val:.4f})")
    if acc < 0.85: alerts.append(f"LOW_ACCURACY({acc:.4f})")
    # Step 4: report
    print(f"  [1] KS drift test: stat={ks_stat:.4f}, p={p_val:.4f}")
    print(f"  [2] Model accuracy: {acc:.4f}")
    print(f"  [3] Alerts fired: {alerts or ['NONE']}")
    severity = "HIGH" if len(alerts) >= 2 else "MEDIUM" if alerts else "NONE"
    print(f"  [4] Overall severity: {severity}")

# ─── ADVANCED (39–50) ────────────────────────────────────────

def ex39():
    """CUSUM algorithm for change detection"""
    class CUSUM:
        def __init__(self, threshold=5.0, drift=0.5):
            self.threshold = threshold
            self.drift = drift
            self.S_pos = 0.0
            self.S_neg = 0.0
            self.change_points = []
        def update(self, x, idx):
            self.S_pos = max(0, self.S_pos + x - self.drift)
            self.S_neg = max(0, self.S_neg - x - self.drift)
            if self.S_pos > self.threshold or self.S_neg > self.threshold:
                self.change_points.append(idx)
                self.S_pos = 0.0; self.S_neg = 0.0
    cusum = CUSUM(threshold=5.0, drift=0.5)
    data = np.concatenate([rng.normal(0, 1, 100), rng.normal(2.0, 1, 100)])
    for i, v in enumerate(data):
        cusum.update(v, i)
    print(f"Ex39 — CUSUM: change points detected at indices {cusum.change_points[:5]} "
          f"(true change at idx=100)")

def ex40():
    """ADWIN algorithm concept — print explanation + pseudocode"""
    adwin_info = """Ex40 — ADWIN (ADaptive WINdowing) Algorithm:
  Concept: Maintains an adaptive window over a data stream.
           Shrinks the window when statistical change is detected.
  Key property: No fixed window size — adapts to the data.
  Detection: Splits window [W] into sub-windows [W0, W1].
             If |mean(W0) - mean(W1)| >= epsilon_cut → change detected.

  Pseudocode:
    W = []  # adaptive window
    for each new element x:
        W.append(x)
        while change_detected(W):
            drop oldest element from W
            emit CHANGE_POINT
    epsilon_cut = sqrt((1/(2*m)) * ln(4*n/delta))  # Hoeffding bound
    where m = min(|W0|, |W1|), n = |W|, delta = confidence param

  Complexity: O(log n) amortized per element
  Use cases: Online learning, concept drift in streams"""
    print(adwin_info)

def ex41():
    """DDM (Drift Detection Method) concept — stats + pseudocode"""
    print("Ex41 — DDM (Drift Detection Method):")
    print("  Tracks error rate p_t and std sigma_t = sqrt(p_t(1-p_t)/t)")
    print("  WARNING zone : p_t + sigma_t > p_min + 2*sigma_min")
    print("  DRIFT zone   : p_t + sigma_t > p_min + 3*sigma_min")
    print("")
    # Simulate DDM logic
    errors = np.concatenate([rng.binomial(1, 0.05, 500), rng.binomial(1, 0.20, 200)])
    p_min, s_min, drift_points = 1.0, 1.0, []
    for t, err in enumerate(errors, 1):
        if t == 1:
            p_t = float(err); s_t = 0.0
        else:
            p_t = np.mean(errors[:t])
        s_t = math.sqrt(p_t * (1 - p_t) / t) if t > 1 else 0.0
        if p_t + s_t < p_min + s_min:
            p_min, s_min = p_t, s_t
        if p_t + s_t > p_min + 3 * s_min and t > 30:
            drift_points.append(t); break
    print(f"  DDM detected drift at t={drift_points[0] if drift_points else 'N/A'} (true change at t=500)")

def ex42():
    """Statistical Process Control (SPC) — control charts"""
    data = np.concatenate([rng.normal(10.0, 1.0, 50), rng.normal(12.5, 1.0, 20)])
    mean = data[:30].mean()
    std = data[:30].std()
    ucl = mean + 3 * std
    lcl = mean - 3 * std
    violations = np.where((data > ucl) | (data < lcl))[0]
    print(f"Ex42 — SPC Control Chart: mean={mean:.3f}, UCL={ucl:.3f}, LCL={lcl:.3f}")
    print(f"  Violations (out-of-control points): indices={violations[:8].tolist()}, total={len(violations)}")

def ex43():
    """Monitoring for NLP models — text length and vocab drift"""
    rng2 = np.random.default_rng(7)
    ref_lengths = rng2.integers(10, 200, 1000)
    cur_lengths = rng2.integers(50, 400, 300)
    ref_vocab_size = 8000
    cur_vocab_size = int(rng2.integers(7200, 8400))
    oov_rate = max(0, (cur_vocab_size - ref_vocab_size) / ref_vocab_size)
    ks_stat, p_val = stats.ks_2samp(ref_lengths, cur_lengths)
    print(f"Ex43 — NLP Monitoring:")
    print(f"  Text length drift  : KS={ks_stat:.4f}, p={p_val:.6f}")
    print(f"  Ref vocab={ref_vocab_size}, Cur vocab={cur_vocab_size}, OOV rate={oov_rate:.3f}")
    print(f"  Avg ref len={ref_lengths.mean():.1f}, Avg cur len={cur_lengths.mean():.1f}")

def ex44():
    """Embedding drift detection — cosine similarity shift over time"""
    def cosine_sim(a, b):
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))
    dim = 128
    ref_centroid = rng.normal(0, 1, dim)
    ref_centroid /= np.linalg.norm(ref_centroid)
    sims = []
    for t in range(5):
        noise = rng.normal(0, 0.1 + t * 0.1, dim)
        cur_emb = ref_centroid + noise
        cur_emb /= np.linalg.norm(cur_emb)
        sim = cosine_sim(ref_centroid, cur_emb)
        sims.append(round(sim, 4))
    print(f"Ex44 — Embedding Drift (cosine sim to ref centroid over time): {sims}")
    print(f"  Drift magnitude (1 - sim): {[round(1-s, 4) for s in sims]}")

def ex45():
    """Production monitoring architecture — print design"""
    design = """Ex45 — Production Monitoring Architecture:
  ┌─────────────────────────────────────────────────────┐
  │                  MONITORING STACK                   │
  ├──────────────┬──────────────┬───────────────────────┤
  │ Data Layer   │ Compute      │ Storage               │
  │ ─────────    │ ──────       │ ──────                │
  │ Kafka/Kinesis│ Spark/Flink  │ InfluxDB / Prometheus │
  │ (stream)     │ (aggregation)│ (time-series)         │
  ├──────────────┴──────────────┴───────────────────────┤
  │ Drift Engine : PSI, KS, Wasserstein per feature     │
  │ Alert Engine : PagerDuty / Slack / OpsGenie         │
  │ Dashboard    : Grafana + custom ML metrics panels   │
  │ Retraining   : Airflow / Kubeflow trigger on drift  │
  └─────────────────────────────────────────────────────┘
  Key SLAs: drift check every 1h, latency every 5m, acc every 24h"""
    print(design)

def ex46():
    """Prometheus metrics format — print example metrics"""
    metrics = """Ex46 — Prometheus Metrics Format:
# HELP ml_model_accuracy Current model accuracy on live traffic
# TYPE ml_model_accuracy gauge
ml_model_accuracy{model="fraud_v3",env="prod"} 0.9231

# HELP ml_prediction_latency_seconds Prediction latency histogram
# TYPE ml_prediction_latency_seconds histogram
ml_prediction_latency_seconds_bucket{le="0.01"} 4523
ml_prediction_latency_seconds_bucket{le="0.05"} 9871
ml_prediction_latency_seconds_bucket{le="0.1"} 9998
ml_prediction_latency_seconds_bucket{le="+Inf"} 10000
ml_prediction_latency_seconds_sum 312.4
ml_prediction_latency_seconds_count 10000

# HELP ml_psi_score Population Stability Index per feature
# TYPE ml_psi_score gauge
ml_psi_score{feature="age",model="fraud_v3"} 0.0823
ml_psi_score{feature="income",model="fraud_v3"} 0.1540

# HELP ml_error_rate Running error rate (5m window)
# TYPE ml_error_rate gauge
ml_error_rate{model="fraud_v3"} 0.0312"""
    print(metrics)

def ex47():
    """Grafana dashboard concept — print JSON snippet"""
    grafana_snippet = """Ex47 — Grafana Dashboard JSON (snippet):
{
  "title": "ML Model Monitoring",
  "panels": [
    {
      "title": "Model Accuracy (24h)",
      "type": "stat",
      "targets": [{"expr": "ml_model_accuracy{env='prod'}"}],
      "thresholds": {"steps": [
        {"color": "red", "value": 0},
        {"color": "yellow", "value": 0.85},
        {"color": "green", "value": 0.90}
      ]}
    },
    {
      "title": "P99 Latency",
      "type": "graph",
      "targets": [{"expr": "histogram_quantile(0.99, ml_prediction_latency_seconds_bucket)"}]
    },
    {
      "title": "PSI Drift Score",
      "type": "heatmap",
      "targets": [{"expr": "ml_psi_score"}],
      "alert": {"conditions": [{"evaluator": {"params": [0.2], "type": "gt"}}]}
    }
  ]
}"""
    print(grafana_snippet)

def ex48():
    """SLA compliance checker — uptime, latency budget"""
    class SLAChecker:
        def __init__(self, uptime_target=0.999, p99_budget_ms=100, error_budget=0.01):
            self.uptime_target = uptime_target
            self.p99_budget_ms = p99_budget_ms
            self.error_budget = error_budget
        def check(self, uptime, p99_ms, error_rate):
            results = {
                "uptime": ("PASS" if uptime >= self.uptime_target else "FAIL", uptime, self.uptime_target),
                "p99_latency": ("PASS" if p99_ms <= self.p99_budget_ms else "FAIL", p99_ms, self.p99_budget_ms),
                "error_rate": ("PASS" if error_rate <= self.error_budget else "FAIL", error_rate, self.error_budget),
            }
            return results
    checker = SLAChecker()
    report = checker.check(uptime=0.9987, p99_ms=112.3, error_rate=0.0087)
    print("Ex48 — SLA Compliance Checker:")
    for sla, (status, actual, target) in report.items():
        print(f"  {sla:15s}: {status} (actual={actual}, target={target})")

def ex49():
    """Incident response workflow — print runbook"""
    runbook = """Ex49 — Incident Response Runbook (Model Drift Alert):
  SEVERITY: HIGH (PSI > 0.25 or Accuracy < 0.80)

  STEP 1 — TRIAGE (0–5 min)
    □ Acknowledge alert in PagerDuty
    □ Check Grafana dashboard for affected model(s)
    □ Identify drift start time from time-series

  STEP 2 — ASSESS (5–15 min)
    □ Run drift analysis: psi_score, ks_test, wasserstein
    □ Check data pipeline for upstream issues (schema change?)
    □ Compare prediction distributions: today vs baseline
    □ Check feature importances — top drifted features

  STEP 3 — CONTAIN (15–30 min)
    □ If data issue: fix upstream, backfill if needed
    □ If model degradation: roll back to previous version
    □ Enable shadow mode for new model candidate

  STEP 4 — RESOLVE (30 min–4 hr)
    □ Trigger automated retraining pipeline (MLflow)
    □ Validate new model on holdout + A/B test
    □ Deploy new model via blue-green deployment

  STEP 5 — POST-MORTEM
    □ Document root cause, impact, TTD/TTR metrics
    □ Add new monitoring rule to prevent recurrence"""
    print(runbook)

def ex50():
    """Monitoring best practices checklist — 20 items"""
    checklist = """Ex50 — Model Monitoring Best Practices (20 Items):
   1. Monitor both input data drift AND output prediction drift
   2. Use PSI for continuous features; chi-square for categorical
   3. Set separate thresholds for WARNING and CRITICAL drift levels
   4. Track model performance metrics (accuracy/F1/AUC) with 24h lag
   5. Monitor prediction latency at p50, p95, p99 percentiles
   6. Set up per-feature drift dashboards, not just aggregate scores
   7. Use statistical tests (KS, chi2) alongside PSI for robustness
   8. Implement rolling baselines: compare to last 7d, not just training
   9. Monitor data quality: null rates, schema violations, value ranges
  10. Track class imbalance changes in classification models
  11. Use concept drift detection (DDM/ADWIN) for high-volume streams
  12. Log every prediction with inputs for offline drift recomputation
  13. Set error budgets and automate alerts via Prometheus/PagerDuty
  14. Link monitoring to automated retraining pipelines (Kubeflow/Airflow)
  15. Monitor embedding drift for deep learning / NLP models
  16. Track business KPIs alongside technical ML metrics
  17. Separate canary monitoring from full production monitoring
  18. Run monitoring checks at multiple time granularities (5m/1h/24h)
  19. Version monitoring configs alongside model artifacts in MLflow
  20. Conduct monthly monitoring reviews and threshold recalibration"""
    print(checklist)


def main():
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print("Examples 4.4 — Model Monitoring & Drift Detection")
    print("=" * 60)
    print("\n─── BASIC (1–13) ───")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n─── INTERMEDIATE (14–26) ───")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n─── NESTED (27–38) ───")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n─── ADVANCED (39–50) ───")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
