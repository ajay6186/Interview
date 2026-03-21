# ============================================================
# Examples 5.3 — Batch vs Real-time Inference (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import time
import json
import io
import csv
import multiprocessing

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Single sample inference (simulate)"""
    def infer_single(x):
        return float(np.tanh(np.dot(x, np.random.randn(len(x)))))

    np.random.seed(42)
    sample = np.random.randn(64).astype(np.float32)
    t0 = time.time()
    result = infer_single(sample)
    latency_ms = (time.time() - t0) * 1000
    print(f"Ex01 — Single sample inference: result={result:.4f}, latency={latency_ms:.3f}ms")

def ex02():
    """Batch inference on array"""
    np.random.seed(1)
    batch = np.random.randn(32, 64).astype(np.float32)
    weights = np.random.randn(64).astype(np.float32)
    t0 = time.time()
    results = np.tanh(batch @ weights)
    latency_ms = (time.time() - t0) * 1000
    print(f"Ex02 — Batch inference (32×64): shape={results.shape}, latency={latency_ms:.3f}ms, mean={results.mean():.4f}")

def ex03():
    """Timing single vs batch inference"""
    np.random.seed(2)
    n = 128
    dim = 64
    data = np.random.randn(n, dim).astype(np.float32)
    weights = np.random.randn(dim).astype(np.float32)

    t0 = time.time()
    single_results = [float(np.tanh(np.dot(data[i], weights))) for i in range(n)]
    single_ms = (time.time() - t0) * 1000

    t0 = time.time()
    batch_results = np.tanh(data @ weights)
    batch_ms = (time.time() - t0) * 1000

    speedup = single_ms / max(batch_ms, 1e-6)
    print(f"Ex03 — Single loop={single_ms:.2f}ms vs Batch={batch_ms:.3f}ms, speedup={speedup:.1f}×")

def ex04():
    """Batch size effect on throughput"""
    np.random.seed(3)
    dim = 128
    weights = np.random.randn(dim).astype(np.float32)
    print("Ex04 — Batch size vs throughput:")
    for bs in [1, 8, 32, 128, 512]:
        data = np.random.randn(bs, dim).astype(np.float32)
        t0 = time.time()
        for _ in range(20):
            np.tanh(data @ weights)
        elapsed = (time.time() - t0) / 20
        tps = bs / elapsed
        print(f"  batch={bs:>4}, time={elapsed*1000:.3f}ms, throughput={tps:.0f} items/s")

def ex05():
    """Pandas batch processing"""
    try:
        import pandas as pd
        np.random.seed(4)
        df = pd.DataFrame(np.random.randn(100, 5), columns=[f"f{i}" for i in range(5)])
        t0 = time.time()
        df["prediction"] = np.tanh(df.values @ np.random.randn(5))
        elapsed_ms = (time.time() - t0) * 1000
        print(f"Ex05 — Pandas batch (100 rows, 5 features): predictions shape={df['prediction'].shape}, mean={df['prediction'].mean():.3f}, time={elapsed_ms:.2f}ms")
    except ImportError:
        print("Ex05 — Pandas batch: numpy fallback (100 rows, 5 features) — pandas not installed")

def ex06():
    """NumPy batch operations"""
    np.random.seed(5)
    data = np.random.randn(1000, 32).astype(np.float32)
    # sigmoid activation
    out = 1 / (1 + np.exp(-data @ np.random.randn(32).astype(np.float32)))
    print(f"Ex06 — NumPy batch ops (1000×32): out shape={out.shape}, min={out.min():.3f}, max={out.max():.3f}, mean={out.mean():.3f}")

def ex07():
    """Chunked file processing"""
    chunk_size = 100
    total_rows = 500
    np.random.seed(6)
    processed = 0
    chunk_count = 0
    for start in range(0, total_rows, chunk_size):
        end = min(start + chunk_size, total_rows)
        chunk = np.random.randn(end - start, 32).astype(np.float32)
        _ = np.tanh(chunk.sum(axis=1))
        processed += len(chunk)
        chunk_count += 1
    print(f"Ex07 — Chunked processing: {total_rows} rows in {chunk_count} chunks of {chunk_size}: processed={processed}")

def ex08():
    """Streaming single item (generator)"""
    def data_stream(n=10):
        for i in range(n):
            yield np.random.randn(32).astype(np.float32)

    np.random.seed(7)
    results = []
    for item in data_stream(10):
        score = float(np.dot(item, np.random.randn(32)))
        results.append(score)
    print(f"Ex08 — Streaming single items: processed={len(results)}, scores_mean={np.mean(results):.3f}")

def ex09():
    """Micro-batch: N items at once"""
    def micro_batch_stream(data, batch_size=4):
        for i in range(0, len(data), batch_size):
            yield data[i:i+batch_size]

    np.random.seed(8)
    data = np.random.randn(20, 32).astype(np.float32)
    weights = np.random.randn(32).astype(np.float32)
    results = []
    for batch in micro_batch_stream(data, batch_size=4):
        out = np.tanh(batch @ weights)
        results.extend(out.tolist())
    print(f"Ex09 — Micro-batch (size=4, total=20): processed={len(results)}, mean={np.mean(results):.3f}")

def ex10():
    """Throughput calculation (items/sec)"""
    np.random.seed(9)
    n_items = 10000
    dim = 64
    data = np.random.randn(n_items, dim).astype(np.float32)
    weights = np.random.randn(dim).astype(np.float32)
    t0 = time.time()
    _ = np.tanh(data @ weights)
    elapsed = time.time() - t0
    throughput = n_items / elapsed
    print(f"Ex10 — Throughput: {n_items} items in {elapsed*1000:.2f}ms = {throughput:.0f} items/sec")

def ex11():
    """Latency calculation (ms/item)"""
    np.random.seed(10)
    n_samples = 100
    latencies = []
    for _ in range(n_samples):
        x = np.random.randn(64).astype(np.float32)
        t0 = time.time()
        _ = np.tanh(np.dot(x, np.random.randn(64)))
        latencies.append((time.time() - t0) * 1000)
    arr = np.array(latencies)
    print(f"Ex11 — Per-item latency ({n_samples} samples): mean={arr.mean():.4f}ms, p95={np.percentile(arr, 95):.4f}ms, p99={np.percentile(arr, 99):.4f}ms")

def ex12():
    """Memory per batch estimate"""
    def estimate_memory(batch_size, dim, dtype=np.float32):
        bytes_per_element = np.dtype(dtype).itemsize
        input_bytes = batch_size * dim * bytes_per_element
        output_bytes = batch_size * bytes_per_element
        total_mb = (input_bytes + output_bytes) / (1024 ** 2)
        return total_mb

    print("Ex12 — Memory per batch (dim=1536):")
    for bs in [1, 32, 128, 512, 2048]:
        mb = estimate_memory(bs, 1536)
        print(f"  batch={bs:>5}: {mb:.3f} MB")

def ex13():
    """I/O-bound vs compute-bound inference"""
    concept = """
I/O-bound vs Compute-bound Inference:
  I/O-bound:  waiting on network (API calls), disk reads, DB queries
    → async/await or threading is effective
    → example: calling OpenAI API, loading embeddings from Redis
  Compute-bound: CPU/GPU processing (matrix multiply, attention)
    → async does NOT help (GIL blocks CPU, GPU is already parallel)
    → use multiprocessing, GPU batching, or model parallelism
  How to tell:
    - Profile: if CPU% < 50% while waiting → I/O-bound
    - If CPU% is maxed → compute-bound
  Strategy for inference service:
    - I/O (load model, fetch features): async
    - Compute (forward pass): batch on GPU, use ONNX/TensorRT
"""
    print(f"Ex13 — I/O vs compute-bound:\n{concept}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Batch prediction on CSV (in-memory simulation)"""
    np.random.seed(11)
    csv_data = "feature1,feature2,feature3\n"
    for i in range(20):
        row = ",".join(f"{v:.3f}" for v in np.random.randn(3))
        csv_data += row + "\n"

    rows = []
    reader = csv.DictReader(io.StringIO(csv_data))
    for row in reader:
        rows.append([float(row[f"feature{j}"]) for j in range(1, 4)])

    X = np.array(rows, dtype=np.float32)
    weights = np.array([0.5, -0.3, 0.8], dtype=np.float32)
    preds = (X @ weights > 0).astype(int)
    print(f"Ex14 — Batch CSV prediction: {len(preds)} rows, pos={preds.sum()}, neg={(1-preds).sum()}")

def ex15():
    """Streaming prediction (generator-based)"""
    def stream_predict(data_gen, weights):
        for x in data_gen:
            score = float(np.dot(x, weights))
            label = 1 if score > 0 else 0
            yield {"score": round(score, 4), "label": label}

    np.random.seed(12)
    weights = np.random.randn(32).astype(np.float32)
    def data_gen():
        for _ in range(8):
            yield np.random.randn(32).astype(np.float32)

    results = list(stream_predict(data_gen(), weights))
    labels = [r["label"] for r in results]
    print(f"Ex15 — Streaming prediction (8 items): labels={labels}, pos={sum(labels)}")

def ex16():
    """Micro-batch with configurable size"""
    np.random.seed(13)
    def micro_batch_predict(stream, batch_size, weights):
        buffer = []
        all_preds = []
        for item in stream:
            buffer.append(item)
            if len(buffer) >= batch_size:
                batch = np.stack(buffer)
                preds = (batch @ weights > 0).astype(int)
                all_preds.extend(preds.tolist())
                buffer = []
        if buffer:
            batch = np.stack(buffer)
            preds = (batch @ weights > 0).astype(int)
            all_preds.extend(preds.tolist())
        return all_preds

    weights = np.random.randn(16).astype(np.float32)
    data = [np.random.randn(16).astype(np.float32) for _ in range(15)]
    preds = micro_batch_predict(iter(data), batch_size=4, weights=weights)
    print(f"Ex16 — Micro-batch (size=4, 15 items): preds={preds}, total={len(preds)}")

def ex17():
    """Rolling batch (sliding window)"""
    np.random.seed(14)
    weights = np.random.randn(8).astype(np.float32)
    data = [np.random.randn(8).astype(np.float32) for _ in range(12)]
    window_size = 4
    results = []
    for i in range(len(data) - window_size + 1):
        window = np.stack(data[i:i+window_size])
        avg_pred = float(np.mean(window @ weights))
        results.append(round(avg_pred, 3))
    print(f"Ex17 — Rolling batch (window=4, 12 items): {len(results)} windows, means={results[:5]}...")

def ex18():
    """Batch with progress reporting"""
    np.random.seed(15)
    n_total = 100
    batch_size = 20
    weights = np.random.randn(32).astype(np.float32)
    data = np.random.randn(n_total, 32).astype(np.float32)
    processed = 0
    all_preds = []
    progress_log = []
    for start in range(0, n_total, batch_size):
        batch = data[start:start+batch_size]
        preds = (batch @ weights > 0).astype(int)
        all_preds.extend(preds.tolist())
        processed += len(batch)
        progress_log.append(f"{processed}/{n_total} ({100*processed//n_total}%)")
    print(f"Ex18 — Batch with progress: {progress_log}")

def ex19():
    """Batch error handling (skip bad rows)"""
    np.random.seed(16)
    raw_rows = []
    for i in range(10):
        if i in (2, 5, 8):  # inject bad rows
            raw_rows.append(None)
        else:
            raw_rows.append(np.random.randn(8).astype(np.float32))

    weights = np.random.randn(8).astype(np.float32)
    good, skipped = [], []
    for i, row in enumerate(raw_rows):
        if row is None:
            skipped.append(i)
            continue
        good.append(float(np.dot(row, weights)))
    print(f"Ex19 — Batch error handling: processed={len(good)}, skipped={skipped}, mean={np.mean(good):.3f}")

def ex20():
    """Batch checkpointing (resume from last)"""
    np.random.seed(17)
    n = 50
    data = np.random.randn(n, 8).astype(np.float32)
    weights = np.random.randn(8).astype(np.float32)
    checkpoint = {"last_index": 20, "results": list(range(20))}  # simulate resume

    results = checkpoint["results"].copy()
    start = checkpoint["last_index"]
    for i in range(start, n):
        results.append(int(np.dot(data[i], weights) > 0))
        new_checkpoint = i + 1
    print(f"Ex20 — Batch checkpoint: resumed from index={start}, total processed={len(results)}, last_checkpoint={new_checkpoint}")

def ex21():
    """Batch result aggregation"""
    np.random.seed(18)
    n_batches = 5
    batch_size = 20
    weights = np.random.randn(16).astype(np.float32)
    all_scores = []
    batch_stats = []
    for b in range(n_batches):
        batch = np.random.randn(batch_size, 16).astype(np.float32)
        scores = batch @ weights
        all_scores.extend(scores.tolist())
        batch_stats.append({"batch": b, "mean": float(scores.mean()), "std": float(scores.std())})
    global_mean = np.mean(all_scores)
    print(f"Ex21 — Batch aggregation ({n_batches} batches×{batch_size}): global_mean={global_mean:.3f}, batch_means={[round(s['mean'],3) for s in batch_stats]}")

def ex22():
    """Batch with feature preprocessing"""
    np.random.seed(19)
    raw = np.random.randn(50, 8).astype(np.float32) * 100  # large scale

    # normalize
    mean = raw.mean(axis=0)
    std = raw.std(axis=0) + 1e-6
    normalized = (raw - mean) / std

    weights = np.random.randn(8).astype(np.float32)
    preds = (normalized @ weights > 0).astype(int)
    print(f"Ex22 — Batch w/ preprocessing: raw_mean={raw.mean():.1f}, norm_mean={normalized.mean():.4f}, pos_preds={preds.sum()}/{len(preds)}")

def ex23():
    """Batch vs real-time accuracy comparison"""
    np.random.seed(20)
    n = 200
    X = np.random.randn(n, 16).astype(np.float32)
    true_weights = np.random.randn(16).astype(np.float32)
    true_labels = (X @ true_weights > 0).astype(int)

    model_weights = true_weights + np.random.randn(16).astype(np.float32) * 0.1

    batch_preds = (X @ model_weights > 0).astype(int)
    batch_acc = (batch_preds == true_labels).mean()

    rt_preds = [(1 if np.dot(X[i], model_weights) > 0 else 0) for i in range(n)]
    rt_acc = np.mean(np.array(rt_preds) == true_labels)

    print(f"Ex23 — Batch acc={batch_acc:.4f} vs RT acc={rt_acc:.4f} (should be identical — same model)")

def ex24():
    """Batch scheduling concept"""
    schedule = """
Batch Scheduling Strategies:
  1. Fixed interval (cron): run every hour/day
     - Pros: simple, predictable
     - Cons: stale predictions, high latency for new data
  2. Triggered (event-based): run when N new samples arrive
     - Pros: fresher predictions
     - Cons: variable timing, harder to resource-plan
  3. Deadline-driven: must complete by time T
     - Pros: SLA guarantees
     - Cons: may need to over-provision resources
  4. Backfill: reprocess historical data on model update
     - Use case: A/B test evaluation, feature backfill
  Tool examples: Airflow, Prefect, Kubeflow Pipelines
"""
    print(f"Ex24 — Batch scheduling:{schedule}")

def ex25():
    """Batch job configuration"""
    config = {
        "job_name": "daily_scoring",
        "batch_size": 1024,
        "input_path": "s3://data/features/2026-03-21/",
        "output_path": "s3://predictions/2026-03-21/",
        "model_uri": "models:/MyModel/Production",
        "parallelism": 4,
        "retry_policy": {"max_retries": 3, "backoff_s": 60},
        "resources": {"cpu": "4", "memory": "8Gi", "gpu": "1"},
        "timeout_s": 3600,
    }
    print(f"Ex25 — Batch job config:")
    for k, v in config.items():
        print(f"  {k}: {v}")

def ex26():
    """Near-real-time with Kafka (concept)"""
    concept = """
Near-Real-Time Inference with Kafka:
  Producer (app server):
    producer.send("inference-requests", key=user_id, value=features_json)

  Consumer (inference service):
    consumer = KafkaConsumer("inference-requests", group_id="ml-service")
    batch = []
    for msg in consumer:
        batch.append(deserialize(msg.value))
        if len(batch) >= 32 or elapsed > 50ms:
            results = model.predict_batch(batch)
            for r in results:
                producer.send("inference-results", value=r)
            batch = []

  Latency: ~50-200ms end-to-end (vs 1-10ms for pure sync API)
  Throughput: easily 10K-100K messages/sec with proper partitioning
  Use case: recommendations, fraud scoring, clickstream analysis
"""
    print(f"Ex26 — Kafka near-real-time:{concept}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """BatchPredictor class"""
    class BatchPredictor:
        def __init__(self, weights):
            self.weights = weights
            self.total_processed = 0

        def predict(self, X):
            if X.ndim == 1:
                X = X[np.newaxis, :]
            scores = X @ self.weights
            preds = (scores > 0).astype(int)
            self.total_processed += len(preds)
            return preds

        def predict_proba(self, X):
            if X.ndim == 1:
                X = X[np.newaxis, :]
            return 1 / (1 + np.exp(-(X @ self.weights)))

    np.random.seed(21)
    predictor = BatchPredictor(np.random.randn(16).astype(np.float32))
    X = np.random.randn(50, 16).astype(np.float32)
    preds = predictor.predict(X)
    proba = predictor.predict_proba(X)
    print(f"Ex27 — BatchPredictor: preds shape={preds.shape}, pos={preds.sum()}, proba_mean={proba.mean():.3f}, total_processed={predictor.total_processed}")

def ex28():
    """StreamingPredictor class"""
    class StreamingPredictor:
        def __init__(self, weights):
            self.weights = weights
            self.count = 0
            self.running_mean = 0.0

        def predict_one(self, x):
            score = float(np.dot(x, self.weights))
            label = int(score > 0)
            self.count += 1
            self.running_mean += (score - self.running_mean) / self.count
            return label, score

    np.random.seed(22)
    sp = StreamingPredictor(np.random.randn(8).astype(np.float32))
    data = [np.random.randn(8).astype(np.float32) for _ in range(20)]
    results = [sp.predict_one(x) for x in data]
    labels = [r[0] for r in results]
    print(f"Ex28 — StreamingPredictor (20 items): labels={labels[:8]}..., running_mean={sp.running_mean:.3f}")

def ex29():
    """MicroBatchPredictor class"""
    class MicroBatchPredictor:
        def __init__(self, weights, batch_size=4):
            self.weights = weights
            self.batch_size = batch_size
            self._buffer = []
            self._results = []

        def push(self, x):
            self._buffer.append(x)
            if len(self._buffer) >= self.batch_size:
                self._flush()

        def _flush(self):
            if not self._buffer:
                return
            batch = np.stack(self._buffer)
            preds = (batch @ self.weights > 0).astype(int)
            self._results.extend(preds.tolist())
            self._buffer = []

        def finalize(self):
            self._flush()
            return self._results

    np.random.seed(23)
    mbp = MicroBatchPredictor(np.random.randn(8).astype(np.float32), batch_size=4)
    for _ in range(14):
        mbp.push(np.random.randn(8).astype(np.float32))
    preds = mbp.finalize()
    print(f"Ex29 — MicroBatchPredictor (batch=4, 14 items): preds={preds}, total={len(preds)}")

def ex30():
    """Batch pipeline: preprocess → predict → postprocess"""
    class BatchPipeline:
        def __init__(self, weights):
            self.weights = weights
            self.mean_ = None
            self.std_ = None

        def fit(self, X):
            self.mean_ = X.mean(axis=0)
            self.std_ = X.std(axis=0) + 1e-6

        def preprocess(self, X):
            return (X - self.mean_) / self.std_

        def predict(self, X_norm):
            return 1 / (1 + np.exp(-(X_norm @ self.weights)))

        def postprocess(self, proba, threshold=0.5):
            return (proba >= threshold).astype(int), proba

        def run(self, X):
            X_norm = self.preprocess(X)
            proba = self.predict(X_norm)
            labels, _ = self.postprocess(proba)
            return labels, proba

    np.random.seed(24)
    pipeline = BatchPipeline(np.random.randn(8).astype(np.float32))
    X_train = np.random.randn(100, 8).astype(np.float32)
    pipeline.fit(X_train)
    X_test = np.random.randn(20, 8).astype(np.float32)
    labels, proba = pipeline.run(X_test)
    print(f"Ex30 — BatchPipeline: labels={labels[:8]}..., proba_mean={proba.mean():.3f}, pos={labels.sum()}/{len(labels)}")

def ex31():
    """Streaming pipeline class"""
    class StreamingPipeline:
        def __init__(self, weights, mean, std):
            self.weights = weights
            self.mean = mean
            self.std = std

        def process(self, raw_stream):
            for x in raw_stream:
                x_norm = (x - self.mean) / (self.std + 1e-6)
                score = float(np.dot(x_norm, self.weights))
                proba = 1 / (1 + np.exp(-score))
                yield {"score": round(score, 4), "proba": round(proba, 4), "label": int(proba > 0.5)}

    np.random.seed(25)
    weights = np.random.randn(8).astype(np.float32)
    mean = np.zeros(8, dtype=np.float32)
    std = np.ones(8, dtype=np.float32)
    sp = StreamingPipeline(weights, mean, std)
    stream = (np.random.randn(8).astype(np.float32) for _ in range(6))
    results = list(sp.process(stream))
    print(f"Ex31 — StreamingPipeline (6 items): {[(r['label'], r['proba']) for r in results]}")

def ex32():
    """Batch + streaming hybrid"""
    class HybridPredictor:
        """Batch for high throughput, streaming for low latency"""
        def __init__(self, weights):
            self.weights = weights
            self.batch_calls = 0
            self.stream_calls = 0

        def predict_batch(self, X):
            self.batch_calls += 1
            return (X @ self.weights > 0).astype(int)

        def predict_single(self, x):
            self.stream_calls += 1
            return int(np.dot(x, self.weights) > 0)

        def predict_adaptive(self, inputs):
            if len(inputs) >= 8:
                X = np.stack(inputs)
                return self.predict_batch(X).tolist()
            else:
                return [self.predict_single(x) for x in inputs]

    np.random.seed(26)
    hp = HybridPredictor(np.random.randn(8).astype(np.float32))
    large = [np.random.randn(8).astype(np.float32) for _ in range(12)]
    small = [np.random.randn(8).astype(np.float32) for _ in range(3)]
    r1 = hp.predict_adaptive(large)
    r2 = hp.predict_adaptive(small)
    print(f"Ex32 — Hybrid predictor: batch_calls={hp.batch_calls}, stream_calls={hp.stream_calls}, large_preds={r1[:4]}, small_preds={r2}")

def ex33():
    """Batch result writer (CSV/JSON)"""
    np.random.seed(27)
    n = 10
    ids = [f"item_{i}" for i in range(n)]
    preds = (np.random.rand(n) > 0.5).astype(int).tolist()
    probas = np.random.rand(n).round(4).tolist()

    csv_output = io.StringIO()
    writer = csv.DictWriter(csv_output, fieldnames=["id", "label", "proba"])
    writer.writeheader()
    for id_, label, proba in zip(ids, preds, probas):
        writer.writerow({"id": id_, "label": label, "proba": proba})

    json_output = [{"id": id_, "label": label, "proba": proba}
                   for id_, label, proba in zip(ids, preds, probas)]

    csv_lines = csv_output.getvalue().strip().split("\n")
    print(f"Ex33 — Batch writer: CSV lines={len(csv_lines)}, JSON records={len(json_output)}, sample={json_output[0]}")

def ex34():
    """Batch monitoring (timing each stage)"""
    np.random.seed(28)
    n = 200
    X = np.random.randn(n, 32).astype(np.float32)
    weights = np.random.randn(32).astype(np.float32)
    timings = {}

    t0 = time.time()
    mean = X.mean(axis=0); std = X.std(axis=0) + 1e-6
    X_norm = (X - mean) / std
    timings["preprocess_ms"] = round((time.time() - t0) * 1000, 3)

    t0 = time.time()
    scores = X_norm @ weights
    timings["inference_ms"] = round((time.time() - t0) * 1000, 3)

    t0 = time.time()
    proba = 1 / (1 + np.exp(-scores))
    labels = (proba > 0.5).astype(int)
    timings["postprocess_ms"] = round((time.time() - t0) * 1000, 3)

    timings["total_ms"] = sum(timings.values())
    print(f"Ex34 — Batch monitoring ({n} items): {timings}")

def ex35():
    """Parallel batch processing (multiprocessing concept)"""
    concept = """
Parallel Batch Processing (multiprocessing):
  from multiprocessing import Pool
  import numpy as np

  def predict_chunk(args):
      data_chunk, weights = args
      return (data_chunk @ weights > 0).astype(int)

  n_workers = 4
  data = np.random.randn(10000, 64)
  weights = np.random.randn(64)
  chunks = np.array_split(data, n_workers)
  with Pool(n_workers) as pool:
      results = pool.map(predict_chunk, [(c, weights) for c in chunks])
  final = np.concatenate(results)
  # Speedup: near-linear for CPU-bound numpy (no GIL for numpy ops)
  # Overhead: ~50-200ms for process spawn; worthwhile for large batches
"""
    np.random.seed(29)
    # Simulate the result in-process
    n_workers = 4
    data = np.random.randn(1000, 16).astype(np.float32)
    weights = np.random.randn(16).astype(np.float32)
    chunks = np.array_split(data, n_workers)
    results = [(c @ weights > 0).astype(int) for c in chunks]
    final = np.concatenate(results)
    print(f"Ex35 — Parallel batch (simulated, {n_workers} workers): total={len(final)}, pos={final.sum()}")
    print(f"  (concept):{concept}")

def ex36():
    """Batch deduplication"""
    np.random.seed(30)
    n = 20
    ids = [f"id_{i % 12}" for i in range(n)]  # some duplicates
    features = {id_: np.random.randn(8).astype(np.float32) for id_ in set(ids)}

    seen = set()
    deduped = []
    for id_ in ids:
        if id_ not in seen:
            seen.add(id_)
            deduped.append((id_, features[id_]))

    weights = np.random.randn(8).astype(np.float32)
    X = np.stack([x for _, x in deduped])
    preds = (X @ weights > 0).astype(int)
    print(f"Ex36 — Batch dedup: original={n}, unique={len(deduped)}, duplicates_removed={n-len(deduped)}, preds={preds.tolist()}")

def ex37():
    """Batch with retry logic"""
    np.random.seed(31)
    def unreliable_infer(batch, fail_prob=0.3):
        if np.random.random() < fail_prob:
            raise RuntimeError("Transient model error")
        return (batch @ np.random.randn(8).astype(np.float32) > 0).astype(int)

    def infer_with_retry(batch, max_retries=3):
        for attempt in range(max_retries):
            try:
                return unreliable_infer(batch, fail_prob=0.5)
            except RuntimeError:
                if attempt == max_retries - 1:
                    return np.zeros(len(batch), dtype=int) - 1  # error sentinel
        return None

    batch = np.random.randn(10, 8).astype(np.float32)
    preds = infer_with_retry(batch, max_retries=5)
    print(f"Ex37 — Batch with retry (fail_prob=0.5, max=5): preds={preds.tolist()[:5]}...")

def ex38():
    """Production batch pipeline"""
    class ProductionBatchPipeline:
        def __init__(self, model_weights):
            self.weights = model_weights
            self.stats = {"batches": 0, "items": 0, "errors": 0, "total_ms": 0.0}

        def _validate(self, X):
            if X.ndim != 2 or X.shape[1] != len(self.weights):
                raise ValueError(f"Expected shape (N, {len(self.weights)}), got {X.shape}")
            if np.isnan(X).any():
                raise ValueError("NaN values in input")
            return True

        def _preprocess(self, X):
            mu, sigma = X.mean(axis=0), X.std(axis=0) + 1e-6
            return (X - mu) / sigma

        def _predict(self, X_norm):
            return 1 / (1 + np.exp(-(X_norm @ self.weights)))

        def run(self, X):
            t0 = time.time()
            try:
                self._validate(X)
                X_norm = self._preprocess(X)
                proba = self._predict(X_norm)
                labels = (proba > 0.5).astype(int)
                self.stats["batches"] += 1
                self.stats["items"] += len(X)
                self.stats["total_ms"] += (time.time() - t0) * 1000
                return labels, proba, None
            except Exception as e:
                self.stats["errors"] += 1
                return None, None, str(e)

    np.random.seed(32)
    pipeline = ProductionBatchPipeline(np.random.randn(16).astype(np.float32))
    for _ in range(3):
        X = np.random.randn(50, 16).astype(np.float32)
        labels, proba, err = pipeline.run(X)
    print(f"Ex38 — Production pipeline: stats={pipeline.stats}, last_proba_mean={proba.mean():.3f}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Batch throughput benchmark (different batch sizes)"""
    np.random.seed(33)
    dim = 128
    weights = np.random.randn(dim).astype(np.float32)
    print("Ex39 — Batch throughput benchmark (dim=128):")
    print(f"  {'batch_size':>12} {'latency_ms':>12} {'throughput':>14} {'ms_per_item':>12}")
    for bs in [1, 8, 32, 128, 512, 2048]:
        data = np.random.randn(bs, dim).astype(np.float32)
        times = []
        for _ in range(10):
            t0 = time.time()
            _ = np.tanh(data @ weights)
            times.append((time.time() - t0) * 1000)
        lat = np.mean(times)
        tps = bs / (lat / 1000)
        ms_per = lat / bs
        print(f"  {bs:>12} {lat:>12.3f} {tps:>14.0f} {ms_per:>12.4f}")

def ex40():
    """Streaming latency benchmark"""
    np.random.seed(34)
    dim = 64
    weights = np.random.randn(dim).astype(np.float32)
    n_samples = 200
    latencies = []
    for _ in range(n_samples):
        x = np.random.randn(dim).astype(np.float32)
        t0 = time.time()
        _ = float(np.dot(x, weights))
        latencies.append((time.time() - t0) * 1000)
    arr = np.array(latencies)
    print(f"Ex40 — Streaming latency benchmark ({n_samples} single items):")
    for p in [50, 90, 95, 99, 99.9]:
        print(f"  p{p:.1f} = {np.percentile(arr, p):.4f}ms")

def ex41():
    """Cost per 1M predictions: batch vs real-time"""
    # Assumptions: cloud instance at $2/hr
    hourly_cost = 2.0
    print("Ex41 — Cost per 1M predictions:")
    print(f"  {'Mode':<20} {'Throughput':>12} {'Hours/1M':>10} {'Cost/1M':>10}")
    modes = [
        ("Batch (GPU, bs=1024)", 50_000),
        ("Micro-batch (bs=32)",  5_000),
        ("Real-time (bs=1)",     500),
        ("RT + caching (50%)",   1_000),
    ]
    for mode, tps in modes:
        hours = 1_000_000 / tps / 3600
        cost = hours * hourly_cost
        print(f"  {mode:<20} {tps:>12,} {hours:>10.3f} ${cost:>9.4f}")

def ex42():
    """Spark batch scoring concept"""
    concept = """
Spark Batch Scoring (PySpark):
  from pyspark.sql import SparkSession
  from pyspark.ml.classification import LogisticRegressionModel

  spark = SparkSession.builder.appName("BatchScoring").getOrCreate()
  model = LogisticRegressionModel.load("s3://models/lr_v2")
  df = spark.read.parquet("s3://features/2026-03-21/")
  predictions = model.transform(df)
  predictions.select("id", "prediction", "probability") \\
             .write.mode("overwrite").parquet("s3://predictions/2026-03-21/")

  # Scale: 1B rows, 200 executor cores, ~2hrs wall-clock
  # Cost: 200 × 2hrs × $0.05/core-hr = $20 for 1B predictions
"""
    print(f"Ex42 — Spark batch scoring:{concept}")

def ex43():
    """Kafka streaming inference concept"""
    concept = """
Kafka Streaming Inference:
  from kafka import KafkaConsumer, KafkaProducer
  import json, numpy as np

  consumer = KafkaConsumer("features", bootstrap_servers=["kafka:9092"],
                            group_id="inference-group", auto_offset_reset="latest")
  producer = KafkaProducer(bootstrap_servers=["kafka:9092"])

  batch, batch_ids = [], []
  for msg in consumer:
      record = json.loads(msg.value)
      batch.append(record["features"])
      batch_ids.append(record["id"])
      if len(batch) >= 32:
          X = np.array(batch, dtype="float32")
          scores = model.predict(X)
          for id_, score in zip(batch_ids, scores):
              producer.send("predictions", json.dumps({"id": id_, "score": float(score)}).encode())
          batch, batch_ids = [], []
  # Throughput: 50K msgs/sec per partition, scales with more partitions
"""
    print(f"Ex43 — Kafka streaming inference:{concept}")

def ex44():
    """Flink streaming concept"""
    concept = """
Apache Flink Streaming Inference:
  env = StreamExecutionEnvironment.get_execution_environment()
  stream = env.add_source(FlinkKafkaConsumer("features", schema, props))

  class InferenceFunction(MapFunction):
      def open(self, config):
          self.model = load_model("hdfs://models/v2")
      def map(self, record):
          vec = np.array(record.features, dtype="float32")
          score = float(self.model.predict(vec.reshape(1,-1))[0])
          return {"id": record.id, "score": score, "ts": record.ts}

  results = stream.map(InferenceFunction()).key_by("user_id") \\
                  .time_window(Time.seconds(60)) \\
                  .aggregate(AggregateFunction())  # rolling stats
  results.add_sink(FlinkKafkaProducer("predictions", schema, props))
  env.execute("StreamingInference")
"""
    print(f"Ex44 — Flink streaming:{concept}")

def ex45():
    """Lambda architecture (batch + speed layer)"""
    arch = """
Lambda Architecture for ML Inference:
  ┌─────────────────────────────────────────────────────┐
  │                    Data Sources                      │
  └──────────────┬──────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌──────────┐      ┌──────────┐
  │  Batch   │      │  Speed   │  (streaming layer)
  │  Layer   │      │  Layer   │  Kafka + Flink
  │  Spark   │      │  Real-time│  low-latency approx
  │  (1hr+)  │      │  results │
  └────┬─────┘      └────┬─────┘
       │                 │
       └────────┬────────┘
                ▼
         ┌────────────┐
         │  Serving   │  Merge: recent → speed layer
         │  Layer     │         historical → batch layer
         └────────────┘
  Pros: high accuracy (batch) + low latency (speed)
  Cons: two codebases, complex merge logic
  → Replaced by Kappa (single streaming pipeline) in modern stacks
"""
    print(f"Ex45 — Lambda architecture:\n{arch}")

def ex46():
    """Kappa architecture"""
    arch = """
Kappa Architecture (modern replacement for Lambda):
  ┌──────────┐    ┌──────────────────────┐    ┌──────────┐
  │ Sources  │───▶│  Single Stream       │───▶│ Serving  │
  │(events)  │    │  (Kafka + Flink/Spark│    │  Layer   │
  └──────────┘    │   Structured Stream) │    └──────────┘
                  └──────────────────────┘
  Key insight: reprocess historical data by replaying Kafka from offset 0
  Advantages vs Lambda:
    - Single codebase (no batch/speed mismatch)
    - Easier ops: only Kafka + one stream processor
    - Reprocessing: replay topic from beginning on model update
  Trade-offs:
    - Requires long-retention Kafka (days/weeks)
    - Reprocessing may be slower than dedicated Spark batch job
  Adopted by: LinkedIn (origin), Uber, Netflix
"""
    print(f"Ex46 — Kappa architecture:\n{arch}")

def ex47():
    """Choosing batch vs streaming: decision tree"""
    decision = """
Batch vs Streaming Decision Tree:

  Q1: Is latency requirement < 1 second?
       No  → Batch (hourly/daily jobs are fine)
       Yes → continue...

  Q2: Do you need results as each event arrives?
       No  → Micro-batch (collect 100ms or 32 items)
       Yes → Streaming (Kafka/Flink)

  Q3: Is the feature computation expensive (joins, aggregates)?
       Yes → Pre-compute in batch, serve from feature store
       No  → Compute in real-time

  Q4: Are you processing > 1M events/day?
       No  → Cron job or Lambda function is sufficient
       Yes → Use a streaming framework

  Practical rule of thumb:
    < 1 req/sec   → Batch or simple sync API
    1–100 req/sec → Sync API + optional micro-batch
    100–10K/sec   → Async API + request batching
    > 10K/sec     → Kafka + distributed inference cluster
"""
    print(f"Ex47 — Decision tree:\n{decision}")

def ex48():
    """Batch inference at 1B scale"""
    plan = """
Batch Inference at 1 Billion Predictions Scale:
  Dataset: 1B rows, 128 features (float32) = 512 GB input
  Model:   LightGBM or XGBoost, 100 trees, 64-leaf

  Infrastructure:
    - 50 Spark executors × 16 cores = 800 cores
    - Input: Parquet on S3 (partitioned by date)
    - Processing: 1000 tasks × 1M rows each
    - Each task: ~30s → total wall time: ~45 min
    - Output: Parquet predictions, ~8 GB (float32 scores)

  Cost estimate:
    - 50 × r5.4xlarge (16 vCPU, 128GB RAM) spot: $0.40/hr
    - 0.75 hr × 50 instances = 37.5 instance-hours × $0.40 = $15
    - Cost per 1M predictions: $0.015

  Optimization tips:
    - Use ORC/Parquet columnar: 3× faster reads vs CSV
    - Broadcast small model weights to all executors
    - Avoid Python UDFs (use Pandas UDFs / vectorized ops)
"""
    print(f"Ex48 — 1B scale batch inference:\n{plan}")

def ex49():
    """Streaming inference at 10K RPS"""
    plan = """
Streaming Inference at 10,000 RPS:
  Throughput: 10,000 requests/sec sustained

  Architecture:
    - Load balancer: AWS ALB or NGINX (round-robin, 10 nodes)
    - Inference nodes: 10 × FastAPI (uvicorn, async, 4 workers each)
    - Each worker: handles 250 RPS with batch size=32
    - Model: ONNX Runtime on CPU, 2ms/batch = 32×500 batches/s per worker
    - Request queue: per-worker asyncio.Queue (depth < 500)
    - Caching: Redis (50% cache hit → effective 5K novel inferences/s)

  Capacity:
    - 10 nodes × 4 workers × 250 RPS = 10,000 RPS total
    - With 50% cache: need only 5,000 actual inferences/s

  SLOs:
    - p50 < 5ms, p95 < 20ms, p99 < 50ms
    - Availability: 99.9% (9 of 10 nodes must be up)

  Cost:
    - 10 × c5.2xlarge (8 vCPU): $0.34/hr × 10 = $3.40/hr = $2,448/month
    - Redis: $0.20/hr (r6g.large) = $144/month
    - Total: ~$2,600/month = $0.0086 per 10K requests
"""
    print(f"Ex49 — 10K RPS streaming inference:\n{plan}")

def ex50():
    """Production inference strategy guide"""
    guide = """
Production Inference Strategy Guide:
╔══════════════╦══════════════════╦══════════╦═════════════════════════════╗
║ Use Case     ║ Strategy         ║ Latency  ║ Examples                    ║
╠══════════════╬══════════════════╬══════════╬═════════════════════════════╣
║ Daily report ║ Batch (Spark)    ║ hours    ║ Churn scores, daily recs    ║
║ Hourly feed  ║ Batch (Airflow)  ║ 1hr      ║ Email personalization        ║
║ Near-RT      ║ Kafka micro-batch║ 1-60s    ║ Fraud pre-screen, ad bids   ║
║ Interactive  ║ Sync REST API    ║ 10-200ms ║ Search ranking, chatbot     ║
║ High-traffic ║ Async+batching   ║ 5-50ms   ║ Recommendation API, scoring ║
║ Edge         ║ ONNX / TFLite    ║ 1-10ms   ║ Mobile, IoT device          ║
╚══════════════╩══════════════════╩══════════╩═════════════════════════════╝

Golden Rules:
  1. Start simple (batch) and only add streaming complexity if needed
  2. Always benchmark: measure latency, throughput, cost before choosing
  3. Use the right tool: Spark for batch, Kafka/Flink for streaming, FastAPI for RT
  4. Cache aggressively: 50% cache hit → 2× effective capacity
  5. Monitor always: p99 latency, error rate, throughput, queue depth
"""
    print(f"Ex50 — Production inference strategy guide:\n{guide}")

# ─── MAIN ───────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Examples 5.3 — Batch vs Real-time Inference")
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
