# ============================================================
# Exercise 5.5 — High-Traffic ML API Design
# ============================================================
# Topics:
#   • Load balancing strategy for ML APIs
#   • Rate limiting implementation (token bucket, sliding window)
#   • Circuit breaker pattern (Closed → Open → Half-Open)
#   • Request queuing (bounded queue with backpressure)
#   • Autoscaling triggers (CPU/GPU utilization thresholds)
#   • Multi-model serving (route requests to different models)
#   • Model warm-up (pre-load model before receiving traffic)
#   • Connection pooling concept
#   • Caching layers (Redis TTL-based caching concept)
#   • Kubernetes HPA configuration for ML workloads
# ============================================================

import time
import threading
from collections import deque
from typing import Callable, Any


# ---------------------------------------------------------------------------
# TODO 1: Implement a Token Bucket rate limiter
# - capacity: max tokens in bucket
# - refill_rate: tokens added per second
# - A request consumes 1 token
# - Returns True if allowed, False if rate-limited
# Thread-safe using threading.Lock
# ---------------------------------------------------------------------------
class TokenBucketRateLimiter:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity     = capacity
        self.refill_rate  = refill_rate
        self.tokens       = capacity
        self.last_refill  = time.monotonic()
        self.lock         = threading.Lock()

    def allow_request(self) -> bool:
        pass  # TODO: refill tokens based on elapsed time, consume 1 if available


# ---------------------------------------------------------------------------
# TODO 2: Implement a Sliding Window rate limiter
# - window_size_s: time window in seconds
# - max_requests: max requests allowed in the window
# - Track request timestamps in a deque
# - Returns True if allowed, False if over limit
# ---------------------------------------------------------------------------
class SlidingWindowRateLimiter:
    def __init__(self, window_size_s: float, max_requests: int):
        self.window_size  = window_size_s
        self.max_requests = max_requests
        self.timestamps   = deque()
        self.lock         = threading.Lock()

    def allow_request(self) -> bool:
        pass  # TODO: remove expired timestamps, check count, append new timestamp


# ---------------------------------------------------------------------------
# TODO 3: Implement a Circuit Breaker
# States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery)
# - failure_threshold: consecutive failures to open
# - recovery_timeout_s: seconds before trying HALF_OPEN
# - success_threshold: successes in HALF_OPEN to close
# ---------------------------------------------------------------------------
class CircuitBreaker:
    CLOSED    = "CLOSED"
    OPEN      = "OPEN"
    HALF_OPEN = "HALF_OPEN"

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout_s: float = 30.0,
        success_threshold: int = 2,
    ):
        self.failure_threshold  = failure_threshold
        self.recovery_timeout   = recovery_timeout_s
        self.success_threshold  = success_threshold
        self.state              = self.CLOSED
        self.failure_count      = 0
        self.success_count      = 0
        self.opened_at          = None

    def can_execute(self) -> bool:
        pass  # TODO: CLOSED=True, OPEN=check timeout (→HALF_OPEN), HALF_OPEN=True

    def record_success(self) -> None:
        pass  # TODO: HALF_OPEN: increment success, maybe close; CLOSED: reset failure count

    def record_failure(self) -> None:
        pass  # TODO: CLOSED: increment failure, open if threshold reached; HALF_OPEN: reopen


# ---------------------------------------------------------------------------
# TODO 4: Implement a bounded request queue with backpressure
# - max_size: maximum queue length
# - If full, reject new requests (return False from enqueue)
# - Dequeue returns (item, wait_time_ms) or (None, 0) if empty
# ---------------------------------------------------------------------------
class BoundedRequestQueue:
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.queue    = deque()
        self.lock     = threading.Lock()

    def enqueue(self, item: Any) -> bool:
        pass  # TODO: add item with enqueue_time if not full, else return False

    def dequeue(self) -> tuple:
        pass  # TODO: pop item, compute wait_time_ms since enqueue, return (item, wait_ms)

    @property
    def size(self) -> int:
        pass  # TODO: return current queue length

    @property
    def utilization(self) -> float:
        pass  # TODO: return size / max_size


# ---------------------------------------------------------------------------
# TODO 5: Implement a multi-model router
# Routes requests to different models based on a routing key
# Routing strategies: round-robin, hash-based, rule-based
# ---------------------------------------------------------------------------
class MultiModelRouter:
    def __init__(self, models: dict):
        # models: {"model_name": callable_or_object}
        self.models      = models
        self.model_names = list(models.keys())
        self._rr_index   = 0
        self.lock        = threading.Lock()

    def route_round_robin(self) -> str:
        pass  # TODO: return next model name in round-robin order

    def route_by_hash(self, key: str) -> str:
        pass  # TODO: deterministically pick model by hash(key) % n_models

    def route_by_rule(self, features: dict) -> str:
        pass  # TODO: simple rule: if "premium" in features and features["premium"],
              #       route to "large_model", else to "small_model"


# ---------------------------------------------------------------------------
# TODO 6: Implement model warm-up
# Given a model (callable), run N_WARMUP_REQUESTS with dummy input
# to fill JIT caches, load CUDA kernels, etc.
# Return the warmup time in milliseconds
# ---------------------------------------------------------------------------
N_WARMUP_REQUESTS = 10

def warmup_model(model_fn: Callable, dummy_input: Any, n_requests: int = N_WARMUP_REQUESTS) -> float:
    pass  # TODO: call model_fn(dummy_input) n_requests times, return elapsed ms


# ---------------------------------------------------------------------------
# TODO 7: Write the Kubernetes HPA manifest for an ML API
# Target: 70% CPU utilization
# Min replicas: 2, Max replicas: 20
# Also add a custom metric: GPU utilization > 80%
# Return the YAML content as a string
# ---------------------------------------------------------------------------
def k8s_hpa_manifest() -> str:
    pass  # TODO: return K8s HorizontalPodAutoscaler YAML as a string


# ---------------------------------------------------------------------------
# TODO 8: Describe load balancing strategies for ML APIs
# Return a list of dicts: {"name": str, "description": str,
#   "best_for": str, "implementation": str}
# Include: round-robin, least-connections, consistent-hashing,
#          weighted (by GPU utilization), session-affinity
# ---------------------------------------------------------------------------
def load_balancing_strategies() -> list:
    pass  # TODO: return list of load balancing strategy dicts


# ---------------------------------------------------------------------------
# TODO 9: Describe the Redis caching layer for ML APIs
# Return a dict: "pattern", "ttl_strategy", "cache_key_design",
#   "eviction_policy", "example_code" (Python redis snippet)
# ---------------------------------------------------------------------------
def redis_caching_layer() -> dict:
    pass  # TODO: return Redis caching description


# ---------------------------------------------------------------------------
# TODO 10: Implement a health-check aggregator
# Given a list of service health-check callables, run all in parallel (threads)
# Return overall status and per-service status within timeout_s
# Return a dict: {"overall": "healthy"|"degraded"|"unhealthy",
#                 "services": {name: status_dict}, "check_time_ms": float}
# ---------------------------------------------------------------------------
def aggregate_health_checks(
    checks: dict,
    timeout_s: float = 2.0,
) -> dict:
    pass  # TODO: run each check in a thread, collect results with timeout


def main():
    print("=== Exercise 5.5: High-Traffic ML API Design ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1", "TokenBucketRateLimiter   — Token bucket with thread-safe refill"),
        ("TODO 2", "SlidingWindowRateLimiter — Sliding window request counter"),
        ("TODO 3", "CircuitBreaker           — CLOSED/OPEN/HALF_OPEN state machine"),
        ("TODO 4", "BoundedRequestQueue      — Backpressure queue with utilization"),
        ("TODO 5", "MultiModelRouter         — Round-robin, hash, rule-based routing"),
        ("TODO 6", "warmup_model()           — Pre-warm JIT caches before traffic"),
        ("TODO 7", "k8s_hpa_manifest()       — Kubernetes HPA YAML"),
        ("TODO 8", "load_balancing_strategies()— 5 LB strategies comparison"),
        ("TODO 9", "redis_caching_layer()    — Redis pattern for ML inference caching"),
        ("TODO 10","aggregate_health_checks()— Parallel health check aggregation"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("High-traffic ML API design patterns:")
    print("  Rate limiting    : protect the service from being overwhelmed")
    print("  Circuit breaker  : stop cascading failures when a dependency is down")
    print("  Request queue    : absorb traffic spikes, apply backpressure")
    print("  Multi-model      : A/B test models, route by SLA/cost")
    print("  Autoscaling      : match capacity to demand automatically")
    print("  Caching          : avoid redundant inference for repeated inputs")


if __name__ == "__main__":
    main()
