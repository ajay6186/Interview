# ============================================================
# Solution 5.3 — Batch vs Real-time Inference
# ============================================================
#
# pip install numpy pandas scikit-learn

import time
import numpy as np
import pandas as pd
from typing import Callable


# ---------------------------------------------------------------------------
# Simulated model
# ---------------------------------------------------------------------------
class FakeModel:
    def __init__(self, latency_ms: float = 5.0):
        self.latency_ms    = latency_ms
        self.predict_calls = 0

    def predict(self, X: np.ndarray) -> np.ndarray:
        compute_time = self.latency_ms * (1 + 0.01 * len(X)) / 1000
        time.sleep(compute_time)
        self.predict_calls += 1
        return np.random.randint(0, 3, size=len(X))

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        compute_time = self.latency_ms * (1 + 0.01 * len(X)) / 1000
        time.sleep(compute_time)
        return np.random.dirichlet(np.ones(3), size=len(X))


# ---------------------------------------------------------------------------
# SOLUTION 1: Real-time inference (one record at a time)
# ---------------------------------------------------------------------------
def realtime_inference(model: FakeModel, df: pd.DataFrame) -> tuple:
    """
    Models the latency a user would experience in a live serving scenario.
    Each row is processed independently — highest latency visibility per request.
    """
    predictions = []
    latencies   = []
    feature_cols = [c for c in df.columns if c != "label"]

    for _, row in df.iterrows():
        X  = row[feature_cols].values.reshape(1, -1).astype(np.float32)
        t0 = time.perf_counter()
        pred = model.predict(X)
        latency_ms = (time.perf_counter() - t0) * 1000
        predictions.append(int(pred[0]))
        latencies.append(latency_ms)

    return predictions, latencies


# ---------------------------------------------------------------------------
# SOLUTION 2: Batch inference (entire dataset at once)
# ---------------------------------------------------------------------------
def batch_inference(model: FakeModel, df: pd.DataFrame) -> tuple:
    """
    Best for offline scoring (nightly jobs, ETL pipelines).
    Single model call = lowest overhead, highest throughput.
    """
    feature_cols = [c for c in df.columns if c != "label"]
    X  = df[feature_cols].values.astype(np.float32)
    t0 = time.perf_counter()
    predictions  = model.predict(X)
    total_time_ms = (time.perf_counter() - t0) * 1000
    return predictions, total_time_ms


# ---------------------------------------------------------------------------
# SOLUTION 3: Micro-batch inference
# ---------------------------------------------------------------------------
def micro_batch_inference(
    model: FakeModel,
    df: pd.DataFrame,
    micro_batch_size: int = 32,
) -> tuple:
    """
    Balances latency (small batches → frequent results) and throughput.
    Used in streaming systems: process every N records or every T ms.
    """
    feature_cols = [c for c in df.columns if c != "label"]
    all_preds    = []
    batch_times  = []

    for start in range(0, len(df), micro_batch_size):
        chunk = df.iloc[start:start + micro_batch_size]
        X     = chunk[feature_cols].values.astype(np.float32)
        t0    = time.perf_counter()
        preds = model.predict(X)
        batch_ms = (time.perf_counter() - t0) * 1000
        all_preds.extend(preds.tolist())
        batch_times.append(batch_ms)

    return all_preds, batch_times


# ---------------------------------------------------------------------------
# SOLUTION 4: Compute throughput and latency percentiles
# ---------------------------------------------------------------------------
def compute_stats(latencies_ms: list, n_records: int) -> dict:
    arr           = np.array(latencies_ms)
    total_time_s  = arr.sum() / 1000 if len(arr) > 1 else arr[0] / 1000
    throughput    = n_records / total_time_s if total_time_s > 0 else 0
    return {
        "throughput_rps": round(throughput, 1),
        "p50_ms":         round(float(np.percentile(arr, 50)), 3),
        "p95_ms":         round(float(np.percentile(arr, 95)), 3),
        "p99_ms":         round(float(np.percentile(arr, 99)), 3),
        "mean_ms":        round(float(arr.mean()), 3),
        "total_time_ms":  round(float(arr.sum()), 1),
    }


# ---------------------------------------------------------------------------
# SOLUTION 5: Compare all three strategies
# ---------------------------------------------------------------------------
def compare_strategies(df: pd.DataFrame, n_features: int = 10) -> list:
    n = len(df)
    results = []

    # Real-time
    model_rt = FakeModel(latency_ms=3.0)
    model_rt.predict_calls = 0
    preds, latencies = realtime_inference(model_rt, df)
    stats = compute_stats(latencies, n)
    results.append({
        "strategy":      "real-time",
        "throughput_rps": stats["throughput_rps"],
        "p50_ms":        stats["p50_ms"],
        "p95_ms":        stats["p95_ms"],
        "p99_ms":        stats["p99_ms"],
        "model_calls":   model_rt.predict_calls,
    })

    # Batch
    model_b = FakeModel(latency_ms=3.0)
    model_b.predict_calls = 0
    preds, total_ms = batch_inference(model_b, df)
    # All records have the same "latency" = total_ms / n
    batch_latencies = [total_ms / n] * n
    stats = compute_stats(batch_latencies, n)
    results.append({
        "strategy":      "batch",
        "throughput_rps": stats["throughput_rps"],
        "p50_ms":        stats["p50_ms"],
        "p95_ms":        stats["p95_ms"],
        "p99_ms":        stats["p99_ms"],
        "model_calls":   model_b.predict_calls,
    })

    # Micro-batch
    model_mb = FakeModel(latency_ms=3.0)
    model_mb.predict_calls = 0
    preds, batch_times = micro_batch_inference(model_mb, df, micro_batch_size=32)
    # Expand batch latencies to per-record (all records in a batch share the latency)
    per_record_latencies = []
    batch_idx = 0
    for start in range(0, n, 32):
        chunk_size = min(32, n - start)
        per_record_latencies.extend([batch_times[batch_idx] / chunk_size] * chunk_size)
        batch_idx += 1
    stats = compute_stats(per_record_latencies, n)
    results.append({
        "strategy":      "micro-batch (size=32)",
        "throughput_rps": stats["throughput_rps"],
        "p50_ms":        stats["p50_ms"],
        "p95_ms":        stats["p95_ms"],
        "p99_ms":        stats["p99_ms"],
        "model_calls":   model_mb.predict_calls,
    })

    return results


# ---------------------------------------------------------------------------
# SOLUTION 6: Strategy guide
# ---------------------------------------------------------------------------
def strategy_guide() -> dict:
    return {
        "real_time": {
            "latency_target": "< 100ms (ideally < 20ms)",
            "throughput":     "Low to medium (< 500 RPS per instance)",
            "use_cases": [
                "User-facing predictions (fraud detection at checkout)",
                "Interactive recommendations",
                "Real-time content moderation",
            ],
            "examples": "FastAPI + joblib model, TorchServe single-request mode",
        },
        "micro_batch": {
            "latency_target": "100ms – 2s (acceptable slight delay)",
            "throughput":     "Medium to high (500–10,000 RPS)",
            "use_cases": [
                "Click-stream predictions",
                "IoT sensor scoring",
                "High-volume API with async batching",
            ],
            "examples": "Triton Inference Server, vLLM, custom asyncio BatchProcessor",
        },
        "batch": {
            "latency_target": "Minutes to hours (latency irrelevant)",
            "throughput":     "Very high (millions of records/hour)",
            "use_cases": [
                "Nightly churn scoring on all customers",
                "Weekly product ranking refresh",
                "Offline feature engineering",
            ],
            "examples": "Spark MLlib, pandas + joblib, Databricks batch jobs",
        },
    }


# ---------------------------------------------------------------------------
# SOLUTION 7: Spark batch scoring concept
# ---------------------------------------------------------------------------
def spark_batch_scoring_concept() -> dict:
    return {
        "architecture": (
            "Spark distributes data across worker nodes. "
            "Each partition is scored independently in parallel using a UDF or "
            "Spark MLlib pipeline. Results are written back to a data lake (Parquet, Delta)."
        ),
        "steps": [
            "1. Load input data from S3/HDFS into a Spark DataFrame",
            "2. Apply feature engineering transformations (StringIndexer, VectorAssembler)",
            "3. Load the trained model via MLflow or pyspark.ml.PipelineModel.load()",
            "4. Call model.transform(df) — Spark distributes across partitions",
            "5. Write predictions to output table (Delta Lake, Hive, BigQuery)",
            "6. Schedule as a daily/weekly job (Databricks Jobs, Airflow, EMR Step)",
        ],
        "pros": [
            "Scales to terabytes of data with linear cost",
            "Fault-tolerant (re-runs failed partitions automatically)",
            "Integrates with data lake / warehouse ecosystem",
        ],
        "cons": [
            "High latency (minutes to hours — not for real-time)",
            "Complex cluster setup and tuning",
            "Serialization overhead for Python UDFs (use Pandas UDFs for speed)",
        ],
        "example_code": '''\
# PySpark batch scoring with an MLflow model
from pyspark.sql import SparkSession
import mlflow.pyfunc

spark = SparkSession.builder.appName("batch-scoring").getOrCreate()

# Load data
df = spark.read.parquet("s3://bucket/features/2024-01-01/")

# Load model as a Spark UDF
model_uri = "models:/MyModel/Production"
predict_udf = mlflow.pyfunc.spark_udf(spark, model_uri)

# Score all rows (distributed across Spark workers)
predictions = df.withColumn(
    "prediction",
    predict_udf(*[df[c] for c in feature_columns])
)

# Write results
predictions.write.mode("overwrite").parquet("s3://bucket/predictions/2024-01-01/")
spark.stop()
''',
    }


# ---------------------------------------------------------------------------
# SOLUTION 8: Streaming inference concept
# ---------------------------------------------------------------------------
def streaming_inference_concept() -> dict:
    return {
        "architecture": (
            "Events flow through Kafka topics. A consumer reads events, "
            "runs model inference, and publishes predictions to an output topic. "
            "Each consumer is stateless and can be scaled horizontally."
        ),
        "steps": [
            "1. Events published to Kafka input topic (user actions, transactions)",
            "2. Consumer group reads events in order",
            "3. Deserialize event → extract features",
            "4. Run model.predict(features) in real time",
            "5. Publish prediction to Kafka output topic",
            "6. Downstream services consume predictions (alerting, storage, UI update)",
        ],
        "latency_target": "< 100ms end-to-end (event in → prediction out)",
        "frameworks": ["Kafka + Python consumer", "Faust (Python stream processor)",
                       "Apache Flink", "Spark Structured Streaming"],
        "example_code": '''\
# Simple Kafka consume-predict-produce loop
import json
import joblib
import numpy as np
from kafka import KafkaConsumer, KafkaProducer

model = joblib.load("model.pkl")

consumer = KafkaConsumer(
    "ml-input-events",
    bootstrap_servers=["kafka:9092"],
    value_deserializer=lambda v: json.loads(v),
    group_id="ml-scorer",
)
producer = KafkaProducer(
    bootstrap_servers=["kafka:9092"],
    value_serializer=lambda v: json.dumps(v).encode(),
)

for message in consumer:
    event    = message.value
    features = np.array(event["features"]).reshape(1, -1)
    pred     = int(model.predict(features)[0])
    output   = {"event_id": event["id"], "prediction": pred}
    producer.send("ml-output-predictions", value=output)
''',
    }


# ---------------------------------------------------------------------------
# SOLUTION 9: Cost comparison
# ---------------------------------------------------------------------------
def cost_comparison(strategies_rps: dict) -> list:
    """
    Cost model:
      - GPU instance (A10G): $3.00/hour → good for high-throughput or DL models
      - CPU instance (c5.2xlarge): $0.34/hour → good for sklearn / low volume
    """
    results = []
    TARGET_RECORDS = 1_000_000

    for strategy, rps in strategies_rps.items():
        # Time to process 1M records
        seconds_needed   = TARGET_RECORDS / rps
        hours_needed     = seconds_needed / 3600

        # Use CPU for batch, GPU for real-time/stream
        if "batch" in strategy.lower():
            instance_cost = 0.34  # CPU
            instance_type = "CPU (c5.2xlarge)"
        else:
            instance_cost = 3.00  # GPU
            instance_type = "GPU (A10G)"

        cost_per_1M = hours_needed * instance_cost

        results.append({
            "strategy":          strategy,
            "rps":               rps,
            "seconds_for_1M":    round(seconds_needed, 1),
            "instance_type":     instance_type,
            "cost_per_1M_usd":   round(cost_per_1M, 4),
        })

    return sorted(results, key=lambda x: x["cost_per_1M_usd"])


# ---------------------------------------------------------------------------
# SOLUTION 10: Hybrid architecture
# ---------------------------------------------------------------------------
def hybrid_architecture() -> dict:
    return {
        "description": (
            "Combine real-time inference for latency-sensitive paths with "
            "batch inference for high-throughput pre-computation. "
            "Cache batch results so the real-time path can serve them instantly."
        ),
        "diagram_ascii": """\
User Request
     │
     ▼
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Real-time   Cache (Redis)
inference   ┌──────────────┐
(fresh      │ pre-computed │
 features)  │ predictions  │◄── Nightly Batch Job
            └──────────────┘    (Spark / pandas)
""",
        "real_time_component": (
            "For users/items with fresh features (just arrived), "
            "call the model directly. Latency: 20-50ms."
        ),
        "batch_component": (
            "Every night, score all users/items in bulk, "
            "store results in Redis/DynamoDB keyed by user_id. "
            "Throughput: millions of records in minutes."
        ),
        "synchronization": (
            "Cache TTL = batch job interval (e.g., 24h). "
            "On cache miss: fall back to real-time inference. "
            "Use a feature store (Feast, Hopsworks) to share features "
            "between batch and real-time paths."
        ),
        "example_use_case": (
            "E-commerce recommendations: "
            "batch job scores all users nightly → fast page load. "
            "Real-time model handles new users (no batch scores yet) "
            "or responds to the current browsing session in real time."
        ),
    }


def main():
    print("=== Solution 5.3: Batch vs Real-time Inference ===\n")

    # Create sample dataset
    rng = np.random.default_rng(42)
    N   = 200
    n_features = 10
    data = {f"feature_{i}": rng.random(N) for i in range(n_features)}
    data["label"] = rng.integers(0, 3, N)
    df = pd.DataFrame(data)

    print(f"Dataset: {N} records × {n_features} features\n")

    print("1. Comparing inference strategies...")
    comparison = compare_strategies(df, n_features)
    print(f"\n  {'Strategy':<25} {'RPS':>8} {'p50(ms)':>10} {'p95(ms)':>10} {'Calls':>7}")
    print("  " + "-" * 65)
    for row in comparison:
        print(f"  {row['strategy']:<25} {row['throughput_rps']:>8.1f} "
              f"{row['p50_ms']:>10.3f} {row['p95_ms']:>10.3f} {row['model_calls']:>7}")

    print("\n2. Strategy selection guide:")
    guide = strategy_guide()
    for strategy, info in guide.items():
        print(f"   {strategy.upper()}")
        print(f"     Latency: {info['latency_target']}")
        print(f"     RPS:     {info['throughput']}")
        print(f"     Use:     {info['use_cases'][0]}")

    print("\n3. Spark batch scoring concept:")
    spark = spark_batch_scoring_concept()
    print(f"   Architecture: {spark['architecture'][:80]}...")
    print("   Steps:")
    for s in spark["steps"][:4]:
        print(f"     {s}")
    print("   Example (first 5 lines):")
    for line in spark["example_code"].strip().split("\n")[:6]:
        print(f"     {line}")

    print("\n4. Streaming inference concept:")
    stream = streaming_inference_concept()
    print(f"   Architecture: {stream['architecture'][:80]}...")
    print(f"   Latency target: {stream['latency_target']}")
    print(f"   Frameworks: {', '.join(stream['frameworks'][:3])}")

    print("\n5. Cost comparison:")
    strategies_rps = {"real-time": 200, "micro-batch": 2000, "batch": 50000}
    costs = cost_comparison(strategies_rps)
    print(f"  {'Strategy':<15} {'RPS':>8} {'Instance':>20} {'$/1M records':>14}")
    print("  " + "-" * 62)
    for row in costs:
        print(f"  {row['strategy']:<15} {row['rps']:>8,} {row['instance_type']:>20} "
              f"  ${row['cost_per_1M_usd']:>10.4f}")

    print("\n6. Hybrid architecture:")
    hybrid = hybrid_architecture()
    print(hybrid["diagram_ascii"])
    print(f"   Real-time: {hybrid['real_time_component'][:70]}...")
    print(f"   Batch:     {hybrid['batch_component'][:70]}...")


if __name__ == "__main__":
    main()
