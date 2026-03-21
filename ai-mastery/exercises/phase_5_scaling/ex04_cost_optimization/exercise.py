# ============================================================
# Exercise 5.4 — ML Cost Optimization
# ============================================================
# Topics:
#   • Model quantization concept (INT8, FP16, FP32)
#   • Knowledge distillation concept
#   • Model pruning concept
#   • Caching inference results (TTL-based)
#   • Request deduplication
#   • Choosing the right model size for cost
#   • GPU utilization optimization
#   • Spot instance strategy
#   • Cost calculator (GPU hours × price)
#   • ROI analysis for ML systems
# ============================================================

import time
import hashlib
import numpy as np
from typing import Callable, Any


# ---------------------------------------------------------------------------
# TODO 1: Explain model quantization
# Return a dict with keys: "description", "types", "memory_comparison",
#   "speed_improvement", "accuracy_impact", "when_to_use"
# types should be a dict: {"FP32": ..., "FP16": ..., "INT8": ..., "INT4": ...}
# ---------------------------------------------------------------------------
def quantization_concept() -> dict:
    pass  # TODO: return quantization explanation dict


# ---------------------------------------------------------------------------
# TODO 2: Simulate memory savings from quantization
# Given a model with n_parameters, calculate memory usage for each precision
# FP32 = 4 bytes/param, FP16 = 2 bytes/param, INT8 = 1 byte/param
# Return a dict: {"FP32_MB": float, "FP16_MB": float, "INT8_MB": float,
#                 "FP16_reduction": str, "INT8_reduction": str}
# ---------------------------------------------------------------------------
def quantization_memory_savings(n_parameters: int) -> dict:
    pass  # TODO: compute memory for each precision, reduction percentages


# ---------------------------------------------------------------------------
# TODO 3: Explain knowledge distillation
# Return a dict with keys: "description", "teacher_model", "student_model",
#   "training_objective", "typical_compression", "use_cases"
# ---------------------------------------------------------------------------
def knowledge_distillation_concept() -> dict:
    pass  # TODO: return knowledge distillation explanation


# ---------------------------------------------------------------------------
# TODO 4: Implement a simple inference result cache (TTL-based LRU)
# Use a dict to store {hash(features): (result, timestamp)}
# Cache lookup: check if hash exists and TTL not expired
# Return (result, cache_hit: bool)
# ---------------------------------------------------------------------------
class InferenceCache:
    def __init__(self, ttl_seconds: float = 300.0, max_size: int = 10_000):
        self.ttl         = ttl_seconds
        self.max_size    = max_size
        self.cache: dict = {}
        self.hits        = 0
        self.misses      = 0

    def _make_key(self, features: list) -> str:
        pass  # TODO: hash features list to a string key (use hashlib.md5)

    def get(self, features: list) -> tuple:
        pass  # TODO: look up cache, check TTL, return (result, hit_bool)

    def set(self, features: list, result: Any) -> None:
        pass  # TODO: evict oldest if at max_size, store (result, timestamp)

    @property
    def hit_rate(self) -> float:
        pass  # TODO: hits / (hits + misses)


# ---------------------------------------------------------------------------
# TODO 5: Implement request deduplication
# If two requests with identical features arrive within dedup_window_ms,
# only the first runs inference; the second waits and gets the same result
# Simulate with a dict tracking in-flight requests
# ---------------------------------------------------------------------------
class RequestDeduplicator:
    def __init__(self):
        self.in_flight: dict = {}  # key -> result (or None if still processing)

    def should_deduplicate(self, key: str) -> bool:
        pass  # TODO: return True if key is already in flight

    def register(self, key: str) -> None:
        pass  # TODO: mark key as in-flight

    def complete(self, key: str, result: Any) -> None:
        pass  # TODO: store result for key, mark done

    def get_result(self, key: str) -> Any:
        pass  # TODO: return stored result for key


# ---------------------------------------------------------------------------
# TODO 6: GPU cost calculator
# Calculate the cost of running ML inference given:
# - n_requests_per_day: daily request volume
# - avg_latency_ms: average inference latency per request
# - gpu_price_per_hour: $/hour for one GPU instance
# - n_gpus: number of GPU instances
# Return dict: {"compute_hours_per_day": float, "daily_cost_usd": float,
#               "monthly_cost_usd": float, "cost_per_1k_requests_usd": float}
# ---------------------------------------------------------------------------
def gpu_cost_calculator(
    n_requests_per_day: int,
    avg_latency_ms: float,
    gpu_price_per_hour: float = 3.00,
    n_gpus: int = 1,
) -> dict:
    pass  # TODO: compute costs


# ---------------------------------------------------------------------------
# TODO 7: Model size vs cost vs accuracy tradeoff
# Given a list of model options (name, params_M, accuracy, latency_ms, memory_GB),
# Return the Pareto-optimal models (no other model dominates on all axes)
# A model is dominated if another model has BOTH higher accuracy AND lower latency
# ---------------------------------------------------------------------------
MODEL_OPTIONS = [
    {"name": "tiny",   "params_M": 7,    "accuracy": 0.82, "latency_ms": 5,   "memory_gb": 0.1},
    {"name": "small",  "params_M": 125,  "accuracy": 0.87, "latency_ms": 20,  "memory_gb": 0.5},
    {"name": "medium", "params_M": 350,  "accuracy": 0.91, "latency_ms": 50,  "memory_gb": 1.4},
    {"name": "large",  "params_M": 1300, "accuracy": 0.94, "latency_ms": 180, "memory_gb": 5.2},
    {"name": "xlarge", "params_M": 7000, "accuracy": 0.96, "latency_ms": 900, "memory_gb": 28},
]

def find_pareto_models(models: list) -> list:
    pass  # TODO: return list of non-dominated model dicts


# ---------------------------------------------------------------------------
# TODO 8: GPU utilization optimization strategies
# Return a dict: {"problem": str, "strategies": list of dicts with
#   "name", "description", "improvement", "implementation"}
# At least 5 strategies
# ---------------------------------------------------------------------------
def gpu_utilization_strategies() -> dict:
    pass  # TODO: return GPU optimization strategies


# ---------------------------------------------------------------------------
# TODO 9: Spot instance strategy for ML training
# Return a dict: "what_are_spot_instances", "savings_percent",
#   "risks", "mitigations", "when_to_use", "when_to_avoid",
#   "checkpoint_strategy"
# ---------------------------------------------------------------------------
def spot_instance_strategy() -> dict:
    pass  # TODO: return spot instance strategy explanation


# ---------------------------------------------------------------------------
# TODO 10: ROI analysis for an ML system
# Given: development_cost, monthly_infrastructure_cost, monthly_revenue_gain,
#        monthly_cost_savings
# Compute: monthly_net_benefit, months_to_breakeven, annual_roi_percent
# Return a dict with those keys plus a recommendation string
# ---------------------------------------------------------------------------
def roi_analysis(
    development_cost: float,
    monthly_infra_cost: float,
    monthly_revenue_gain: float,
    monthly_cost_savings: float,
) -> dict:
    pass  # TODO: compute ROI metrics


# ---------------------------------------------------------------------------
# TODO 11: Simulate the cache speedup
# Run N requests where P% are cache hits
# With cache: cache hits return instantly (no model call)
# Without cache: all requests call the model
# Return {"without_cache_ms": float, "with_cache_ms": float, "speedup": float}
# ---------------------------------------------------------------------------
def simulate_cache_benefit(
    n_requests: int = 1000,
    cache_hit_rate: float = 0.6,
    model_latency_ms: float = 20.0,
) -> dict:
    pass  # TODO: simulate timing with and without cache


def main():
    print("=== Exercise 5.4: ML Cost Optimization ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1",  "quantization_concept()         — INT8/FP16/FP32 explanation"),
        ("TODO 2",  "quantization_memory_savings()  — Memory per precision level"),
        ("TODO 3",  "knowledge_distillation_concept()— Teacher-student training"),
        ("TODO 4",  "InferenceCache                 — TTL-based result cache class"),
        ("TODO 5",  "RequestDeduplicator            — In-flight request dedup"),
        ("TODO 6",  "gpu_cost_calculator()          — Daily/monthly GPU cost"),
        ("TODO 7",  "find_pareto_models()           — Accuracy vs latency Pareto front"),
        ("TODO 8",  "gpu_utilization_strategies()   — 5+ GPU optimization techniques"),
        ("TODO 9",  "spot_instance_strategy()       — Spot/preemptible instance guide"),
        ("TODO 10", "roi_analysis()                 — Breakeven and annual ROI"),
        ("TODO 11", "simulate_cache_benefit()       — Cache hit rate speedup simulation"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("Cost optimization priority order:")
    print("  1. Right-size the model (biggest lever)")
    print("  2. Quantize the model (INT8 → 4× memory reduction, ~3× speedup)")
    print("  3. Cache frequent/repeated requests")
    print("  4. Batch requests (amortize GPU overhead)")
    print("  5. Use spot/preemptible instances for training")
    print("  6. Optimize GPU utilization (target > 80%)")


if __name__ == "__main__":
    main()
