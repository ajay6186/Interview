# ============================================================
# Exercise 5.3 — Batch vs Real-time Inference
# ============================================================
# Topics:
#   • Batch inference pipeline (process a CSV/DataFrame of inputs)
#   • Real-time inference (single request, sub-100ms target)
#   • Near-real-time / micro-batch (process small windows)
#   • Throughput measurement (records per second)
#   • Latency measurement (p50, p95, p99)
#   • Choosing the right inference strategy
#   • Spark batch scoring concept
#   • Streaming inference concept (Kafka + model)
#   • Cost comparison across strategies
#   • Hybrid approach (real-time + nightly batch refresh)
# ============================================================

import time
import numpy as np
import pandas as pd
from typing import Callable


# ---------------------------------------------------------------------------
# Simulated model (replace with real model.predict in production)
# ---------------------------------------------------------------------------
class FakeModel:
    """Simulates a GradientBoosting classifier with configurable latency."""
    def __init__(self, latency_ms: float = 5.0):
        self.latency_ms  = latency_ms
        self.predict_calls = 0

    def predict(self, X: np.ndarray) -> np.ndarray:
        # Simulate compute time (scales with batch size for realism)
        compute_time = self.latency_ms * (1 + 0.01 * len(X)) / 1000
        time.sleep(compute_time)
        self.predict_calls += 1
        return np.random.randint(0, 3, size=len(X))

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        compute_time = self.latency_ms * (1 + 0.01 * len(X)) / 1000
        time.sleep(compute_time)
        raw = np.random.dirichlet(np.ones(3), size=len(X))
        return raw


# ---------------------------------------------------------------------------
# TODO 1: Real-time inference — process one record at a time
# For each row in df, call model.predict on a (1, n_features) array
# Record per-request latency in milliseconds
# Return (predictions list, latency_list)
# ---------------------------------------------------------------------------
def realtime_inference(model: FakeModel, df: pd.DataFrame) -> tuple:
    pass  # TODO: loop over rows, time each call, collect predictions and latencies


# ---------------------------------------------------------------------------
# TODO 2: Batch inference — process the entire DataFrame as one batch
# Stack all features into a single numpy array, call model.predict once
# Return (predictions np.ndarray, total_time_ms float)
# ---------------------------------------------------------------------------
def batch_inference(model: FakeModel, df: pd.DataFrame) -> tuple:
    pass  # TODO: model.predict on the whole array, measure time


# ---------------------------------------------------------------------------
# TODO 3: Micro-batch inference — process the DataFrame in chunks of micro_batch_size
# Call model.predict once per chunk
# Return (predictions list, batch_times list of ms per batch)
# ---------------------------------------------------------------------------
def micro_batch_inference(
    model: FakeModel,
    df: pd.DataFrame,
    micro_batch_size: int = 32,
) -> tuple:
    pass  # TODO: chunk df, predict per chunk, collect timing


# ---------------------------------------------------------------------------
# TODO 4: Compute throughput and latency statistics
# Given a list of per-request latencies (ms), compute:
# - throughput: records per second (n_records / total_time_s)
# - p50, p95, p99 latency (percentiles)
# Return a dict with those keys
# ---------------------------------------------------------------------------
def compute_stats(latencies_ms: list, n_records: int) -> dict:
    pass  # TODO: use np.percentile and compute throughput


# ---------------------------------------------------------------------------
# TODO 5: Run all three strategies and build a comparison table
# Return a list of dicts: [{"strategy": str, "throughput_rps": float,
#                            "p50_ms": float, "p95_ms": float, "p99_ms": float,
#                            "model_calls": int}]
# ---------------------------------------------------------------------------
def compare_strategies(df: pd.DataFrame, n_features: int = 10) -> list:
    pass  # TODO: run realtime, batch, micro-batch, compute stats for each


# ---------------------------------------------------------------------------
# TODO 6: Describe when to use each inference strategy
# Return a dict: {"real_time": {...}, "micro_batch": {...}, "batch": {...}}
# Each value is a dict with: "latency_target", "throughput", "use_cases", "examples"
# ---------------------------------------------------------------------------
def strategy_guide() -> dict:
    pass  # TODO: return strategy selection guide


# ---------------------------------------------------------------------------
# TODO 7: Describe how Spark batch scoring works
# Return a dict with keys: "architecture", "steps", "pros", "cons", "example_code"
# example_code: a PySpark snippet string showing .transform() pattern
# ---------------------------------------------------------------------------
def spark_batch_scoring_concept() -> dict:
    pass  # TODO: return Spark scoring description


# ---------------------------------------------------------------------------
# TODO 8: Describe streaming inference (Kafka + model)
# Return a dict: architecture, steps, latency_target, frameworks, example_code
# example_code: a simple consume-predict-produce loop as a string
# ---------------------------------------------------------------------------
def streaming_inference_concept() -> dict:
    pass  # TODO: return streaming inference description


# ---------------------------------------------------------------------------
# TODO 9: Cost comparison across strategies
# Assumptions: GPU instance = $3/hour, CPU instance = $0.10/hour
# Given: n_records, records_per_second per strategy
# Compute: compute_hours needed per strategy, cost per 1M records
# Return a list of dicts: [{"strategy": str, "rps": int, "cost_per_1M_usd": float}]
# ---------------------------------------------------------------------------
def cost_comparison(strategies_rps: dict) -> list:
    pass  # TODO: compute cost per 1M records for each strategy


# ---------------------------------------------------------------------------
# TODO 10: Explain the hybrid inference architecture
# Return a dict: "description", "diagram_ascii", "real_time_component",
#   "batch_component", "synchronization", "example_use_case"
# ---------------------------------------------------------------------------
def hybrid_architecture() -> dict:
    pass  # TODO: return hybrid architecture description


def main():
    print("=== Exercise 5.3: Batch vs Real-time Inference ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1",  "realtime_inference()        — One-by-one inference with latency tracking"),
        ("TODO 2",  "batch_inference()           — Single batch call for the whole dataset"),
        ("TODO 3",  "micro_batch_inference()     — Chunked inference pipeline"),
        ("TODO 4",  "compute_stats()             — Throughput + p50/p95/p99 latency"),
        ("TODO 5",  "compare_strategies()        — Run and compare all three strategies"),
        ("TODO 6",  "strategy_guide()            — When to use each strategy"),
        ("TODO 7",  "spark_batch_scoring_concept()— Spark .transform() pattern"),
        ("TODO 8",  "streaming_inference_concept()— Kafka consumer-predict-produce loop"),
        ("TODO 9",  "cost_comparison()           — Cost per 1M records per strategy"),
        ("TODO 10", "hybrid_architecture()       — Real-time + batch combined"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("Strategy selection rules of thumb:")
    print("  Latency < 100ms required   → Real-time (single request)")
    print("  Throughput > 1000 RPS      → Async batching or micro-batch")
    print("  Periodic scoring of data   → Batch (Spark, pandas, joblib)")
    print("  Continuous stream of events→ Streaming (Kafka + model)")


if __name__ == "__main__":
    main()
