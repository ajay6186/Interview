# ============================================================
# Solution 5.5 — High-Traffic ML API Design
# ============================================================
#
# Pure Python standard library only — no external dependencies.
# All classes are production-grade patterns implemented for educational clarity.

import time
import threading
import hashlib
from collections import deque
from typing import Callable, Any, Dict


# ---------------------------------------------------------------------------
# SOLUTION 1: Token Bucket Rate Limiter
# ---------------------------------------------------------------------------
class TokenBucketRateLimiter:
    """
    Token bucket algorithm:
    - Bucket fills at refill_rate tokens/second (up to capacity).
    - Each request consumes 1 token.
    - Allows short bursts (up to capacity) then smooths to refill_rate.
    - Widely used: AWS API Gateway, Nginx, Envoy.
    """
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity    = float(capacity)
        self.refill_rate = refill_rate
        self.tokens      = float(capacity)
        self.last_refill = time.monotonic()
        self.lock        = threading.Lock()

    def allow_request(self) -> bool:
        with self.lock:
            now     = time.monotonic()
            elapsed = now - self.last_refill
            # Add tokens earned since last check
            self.tokens = min(
                self.capacity,
                self.tokens + elapsed * self.refill_rate,
            )
            self.last_refill = now

            if self.tokens >= 1.0:
                self.tokens -= 1.0
                return True
            return False


# ---------------------------------------------------------------------------
# SOLUTION 2: Sliding Window Rate Limiter
# ---------------------------------------------------------------------------
class SlidingWindowRateLimiter:
    """
    Sliding window counter:
    - Maintains a log of request timestamps within the window.
    - More accurate than fixed window (no burst at window boundary).
    - Memory: O(max_requests) — bounded by the limit itself.
    """
    def __init__(self, window_size_s: float, max_requests: int):
        self.window_size  = window_size_s
        self.max_requests = max_requests
        self.timestamps   = deque()
        self.lock         = threading.Lock()

    def allow_request(self) -> bool:
        with self.lock:
            now     = time.monotonic()
            cutoff  = now - self.window_size

            # Remove timestamps outside the window
            while self.timestamps and self.timestamps[0] < cutoff:
                self.timestamps.popleft()

            if len(self.timestamps) < self.max_requests:
                self.timestamps.append(now)
                return True
            return False


# ---------------------------------------------------------------------------
# SOLUTION 3: Circuit Breaker
# ---------------------------------------------------------------------------
class CircuitBreaker:
    """
    Circuit Breaker state machine:

    CLOSED → normal operation, failures counted
         ↓ (failures >= threshold)
    OPEN   → all requests rejected immediately (fail-fast)
         ↓ (after recovery_timeout seconds)
    HALF_OPEN → one trial request allowed
         ↓ success (>= success_threshold)  → CLOSED
         ↓ failure                         → OPEN (reset timer)

    Protects downstream services from cascading overload.
    """
    CLOSED    = "CLOSED"
    OPEN      = "OPEN"
    HALF_OPEN = "HALF_OPEN"

    def __init__(
        self,
        failure_threshold: int   = 5,
        recovery_timeout_s: float = 30.0,
        success_threshold: int   = 2,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout  = recovery_timeout_s
        self.success_threshold = success_threshold
        self.state             = self.CLOSED
        self.failure_count     = 0
        self.success_count     = 0
        self.opened_at: float  = None
        self.lock              = threading.Lock()

    def can_execute(self) -> bool:
        with self.lock:
            if self.state == self.CLOSED:
                return True
            if self.state == self.OPEN:
                if time.monotonic() - self.opened_at >= self.recovery_timeout:
                    self.state         = self.HALF_OPEN
                    self.success_count = 0
                    return True
                return False
            # HALF_OPEN: allow one request at a time to probe recovery
            return True

    def record_success(self) -> None:
        with self.lock:
            if self.state == self.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    self.state         = self.CLOSED
                    self.failure_count = 0
            elif self.state == self.CLOSED:
                self.failure_count = 0   # reset on success

    def record_failure(self) -> None:
        with self.lock:
            if self.state == self.CLOSED:
                self.failure_count += 1
                if self.failure_count >= self.failure_threshold:
                    self.state     = self.OPEN
                    self.opened_at = time.monotonic()
            elif self.state == self.HALF_OPEN:
                # Trial request failed — back to OPEN
                self.state     = self.OPEN
                self.opened_at = time.monotonic()


# ---------------------------------------------------------------------------
# SOLUTION 4: Bounded Request Queue
# ---------------------------------------------------------------------------
class BoundedRequestQueue:
    """
    Backpressure queue: when full, new requests are rejected (HTTP 429 / 503).
    This prevents the system from taking on more work than it can process,
    which would cause cascading latency increases across all requests.
    """
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.queue    = deque()
        self.lock     = threading.Lock()

    def enqueue(self, item: Any) -> bool:
        with self.lock:
            if len(self.queue) >= self.max_size:
                return False   # backpressure: reject
            self.queue.append({"item": item, "enqueue_time": time.perf_counter()})
            return True

    def dequeue(self) -> tuple:
        with self.lock:
            if not self.queue:
                return None, 0.0
            entry        = self.queue.popleft()
            wait_time_ms = (time.perf_counter() - entry["enqueue_time"]) * 1000
            return entry["item"], round(wait_time_ms, 3)

    @property
    def size(self) -> int:
        with self.lock:
            return len(self.queue)

    @property
    def utilization(self) -> float:
        return self.size / self.max_size


# ---------------------------------------------------------------------------
# SOLUTION 5: Multi-Model Router
# ---------------------------------------------------------------------------
class MultiModelRouter:
    """
    Routes requests to different model instances/sizes:
    - Round-robin: distribute load evenly across instances
    - Hash-based: ensure same input always hits the same model (for caching)
    - Rule-based: route high-value users to larger / more expensive models
    """
    def __init__(self, models: dict):
        self.models      = models
        self.model_names = list(models.keys())
        self._rr_index   = 0
        self.lock        = threading.Lock()

    def route_round_robin(self) -> str:
        with self.lock:
            name          = self.model_names[self._rr_index % len(self.model_names)]
            self._rr_index += 1
            return name

    def route_by_hash(self, key: str) -> str:
        digest = int(hashlib.md5(key.encode()).hexdigest(), 16)
        return self.model_names[digest % len(self.model_names)]

    def route_by_rule(self, features: dict) -> str:
        if features.get("premium") and "large_model" in self.models:
            return "large_model"
        if "small_model" in self.models:
            return "small_model"
        return self.model_names[0]


# ---------------------------------------------------------------------------
# SOLUTION 6: Model warm-up
# ---------------------------------------------------------------------------
N_WARMUP_REQUESTS = 10

def warmup_model(
    model_fn: Callable,
    dummy_input: Any,
    n_requests: int = N_WARMUP_REQUESTS,
) -> float:
    """
    Warm-up is critical for:
    - Python JIT (PyPy, torch.compile): first calls compile; subsequent calls use cache
    - CUDA: first kernel launch loads the binary; subsequent launches are fast
    - Model loading: ensure weights are in GPU memory before real traffic
    Rule: run >= 3 warm-up calls; discard timings; only then open for traffic.
    """
    t0 = time.perf_counter()
    for _ in range(n_requests):
        model_fn(dummy_input)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    return round(elapsed_ms, 3)


# ---------------------------------------------------------------------------
# SOLUTION 7: Kubernetes HPA manifest
# ---------------------------------------------------------------------------
def k8s_hpa_manifest() -> str:
    return """\
# kubernetes/hpa.yaml
# Horizontal Pod Autoscaler for the ML inference API
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-api-hpa
  namespace: ml-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-api

  minReplicas: 2   # always have at least 2 for HA
  maxReplicas: 20  # cap to control costs

  metrics:
    # Scale up when average CPU utilization exceeds 70%
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # Scale up when average memory exceeds 75%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75

    # Custom metric: GPU utilization from Prometheus (requires adapter)
    - type: External
      external:
        metric:
          name: gpu_utilization_percent
          selector:
            matchLabels:
              deployment: ml-api
        target:
          type: AverageValue
          averageValue: "80"

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # wait 60s before scaling up again
      policies:
        - type: Pods
          value: 4          # add at most 4 pods at once
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # wait 5 min before scaling down
      policies:
        - type: Percent
          value: 20         # remove at most 20% of pods at once
          periodSeconds: 60
"""


# ---------------------------------------------------------------------------
# SOLUTION 8: Load balancing strategies
# ---------------------------------------------------------------------------
def load_balancing_strategies() -> list:
    return [
        {
            "name":           "Round Robin",
            "description":    "Distribute requests evenly across all replicas in sequence.",
            "best_for":       "Homogeneous replicas with uniform request cost.",
            "implementation": "Default nginx/HAProxy / Kubernetes Service mode.",
        },
        {
            "name":           "Least Connections",
            "description":    "Send new request to the replica with fewest active connections.",
            "best_for":       "ML APIs where inference time varies significantly per request.",
            "implementation": "nginx least_conn; Envoy least_request; HAProxy leastconn.",
        },
        {
            "name":           "Consistent Hashing",
            "description":    "Hash the request key (user_id, input hash) to always hit the same replica.",
            "best_for":       "Maximizing in-process cache hits (same inputs → same replica).",
            "implementation": "nginx hash $request_uri consistent; Envoy ring hash LB policy.",
        },
        {
            "name":           "Weighted (GPU Utilization)",
            "description":    "Give higher weight to replicas with lower GPU utilization.",
            "best_for":       "Heterogeneous GPU fleet (some GPUs faster than others).",
            "implementation": "Custom Envoy EDS with dynamic weights from Prometheus scrape.",
        },
        {
            "name":           "Session Affinity (Sticky Sessions)",
            "description":    "Route all requests from a client to the same replica.",
            "best_for":       "Stateful ML systems (multi-turn conversation, incremental models).",
            "implementation": "Kubernetes Service sessionAffinity: ClientIP; Envoy hash policy.",
        },
    ]


# ---------------------------------------------------------------------------
# SOLUTION 9: Redis caching layer
# ---------------------------------------------------------------------------
def redis_caching_layer() -> dict:
    return {
        "pattern": (
            "Look-aside cache: client checks Redis before calling the model. "
            "On cache miss: run inference → store result in Redis with TTL. "
            "On cache hit: return Redis value directly, skipping inference."
        ),
        "ttl_strategy": (
            "Set TTL based on how quickly the model output becomes stale. "
            "Static features (product description embedding): TTL = 24h. "
            "Dynamic features (real-time user context): TTL = 60s. "
            "Use EXPIRE to extend TTL on access (LRU-like behaviour)."
        ),
        "cache_key_design": (
            "Key = MD5(sorted(features_dict)) + ':' + model_version. "
            "Include model version in the key so model updates automatically "
            "invalidate stale cached predictions."
        ),
        "eviction_policy": (
            "Redis maxmemory-policy: allkeys-lru "
            "(evict least-recently-used keys when memory is full). "
            "Size Redis to hold your hot working set: "
            "top 10% of inputs often covers 90% of traffic (power law)."
        ),
        "example_code": '''\
import redis
import json
import hashlib

r = redis.Redis(host="redis", port=6379, decode_responses=True)

def make_cache_key(features: list, model_version: str) -> str:
    feat_str = json.dumps(features, sort_keys=True)
    return f"pred:{model_version}:{hashlib.md5(feat_str.encode()).hexdigest()}"

def predict_with_cache(features: list, model, model_version: str, ttl: int = 300):
    key = make_cache_key(features, model_version)

    # Check cache first
    cached = r.get(key)
    if cached is not None:
        return json.loads(cached), True  # (result, cache_hit)

    # Cache miss — run inference
    import numpy as np
    X      = np.array(features).reshape(1, -1)
    result = float(model.predict(X)[0])

    # Store in Redis with TTL
    r.setex(key, ttl, json.dumps(result))
    return result, False  # (result, cache_hit)
''',
    }


# ---------------------------------------------------------------------------
# SOLUTION 10: Health check aggregator
# ---------------------------------------------------------------------------
def aggregate_health_checks(
    checks: dict,
    timeout_s: float = 2.0,
) -> dict:
    """
    Run all health-check callables in parallel threads.
    Each check returns a dict with at least {"status": "healthy"|"unhealthy"}.
    Overall status:
      - all healthy                → "healthy"
      - some healthy, some failing → "degraded"
      - all failing                → "unhealthy"
    """
    results: Dict[str, Any] = {}
    threads: Dict[str, threading.Thread] = {}

    def run_check(name: str, fn: Callable):
        t0 = time.perf_counter()
        try:
            result = fn()
            result["check_ms"] = round((time.perf_counter() - t0) * 1000, 2)
            results[name] = result
        except Exception as e:
            results[name] = {
                "status":   "unhealthy",
                "error":    str(e),
                "check_ms": round((time.perf_counter() - t0) * 1000, 2),
            }

    t_start = time.perf_counter()

    for name, fn in checks.items():
        t = threading.Thread(target=run_check, args=(name, fn), daemon=True)
        threads[name] = t
        t.start()

    for name, t in threads.items():
        remaining = timeout_s - (time.perf_counter() - t_start)
        t.join(timeout=max(0, remaining))
        if t.is_alive():
            results[name] = {"status": "unhealthy", "error": "timeout"}

    statuses = [v.get("status", "unhealthy") for v in results.values()]
    if all(s == "healthy" for s in statuses):
        overall = "healthy"
    elif any(s == "healthy" for s in statuses):
        overall = "degraded"
    else:
        overall = "unhealthy"

    return {
        "overall":       overall,
        "services":      results,
        "check_time_ms": round((time.perf_counter() - t_start) * 1000, 2),
    }


def main():
    print("=== Solution 5.5: High-Traffic ML API Design ===\n")

    # 1. Token Bucket
    print("1. Token Bucket Rate Limiter (capacity=5, refill=2/s)")
    limiter = TokenBucketRateLimiter(capacity=5, refill_rate=2.0)
    for i in range(8):
        allowed = limiter.allow_request()
        print(f"   Request {i+1}: {'ALLOWED' if allowed else 'REJECTED'}")
    print()

    # 2. Sliding Window
    print("2. Sliding Window Rate Limiter (window=1s, max=3)")
    sw = SlidingWindowRateLimiter(window_size_s=1.0, max_requests=3)
    for i in range(5):
        allowed = sw.allow_request()
        print(f"   Request {i+1}: {'ALLOWED' if allowed else 'REJECTED'}")
    print()

    # 3. Circuit Breaker
    print("3. Circuit Breaker (failure_threshold=3, recovery=0.1s)")
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout_s=0.1, success_threshold=2)
    print(f"   Initial state: {cb.state}")
    for _ in range(3):
        cb.record_failure()
    print(f"   After 3 failures: {cb.state}")
    print(f"   can_execute: {cb.can_execute()}")
    time.sleep(0.15)
    print(f"   After recovery timeout:")
    print(f"   can_execute: {cb.can_execute()}  state={cb.state}")
    cb.record_success()
    cb.record_success()
    print(f"   After 2 successes: {cb.state}")
    print()

    # 4. Bounded Queue
    print("4. Bounded Request Queue (max_size=3)")
    q = BoundedRequestQueue(max_size=3)
    for i in range(5):
        ok = q.enqueue(f"request_{i}")
        print(f"   Enqueue request_{i}: {'OK' if ok else 'REJECTED (backpressure)'}")
    print(f"   Queue size: {q.size}  utilization: {q.utilization:.0%}")
    item, wait_ms = q.dequeue()
    print(f"   Dequeued: {item}  wait={wait_ms}ms")
    print()

    # 5. Multi-Model Router
    print("5. Multi-Model Router")
    router = MultiModelRouter({
        "small_model": lambda x: x,
        "large_model": lambda x: x,
    })
    print(f"   Round-robin (3 requests): ", end="")
    print(", ".join(router.route_round_robin() for _ in range(4)))
    print(f"   Hash-based ('user_123'): {router.route_by_hash('user_123')}")
    print(f"   Rule-based (premium=True):  {router.route_by_rule({'premium': True})}")
    print(f"   Rule-based (premium=False): {router.route_by_rule({'premium': False})}")
    print()

    # 6. Model warm-up
    print("6. Model warm-up")
    def dummy_model(x): return sum(x) * 0.01
    warmup_ms = warmup_model(dummy_model, [1.0] * 10, n_requests=5)
    print(f"   Warm-up time (5 requests): {warmup_ms:.1f} ms")
    print()

    # 7. Kubernetes HPA
    print("7. Kubernetes HPA manifest (first 20 lines):")
    manifest_lines = k8s_hpa_manifest().strip().split("\n")
    for line in manifest_lines[:20]:
        print(f"   {line}")
    print()

    # 8. Load balancing strategies
    print("8. Load balancing strategies:")
    for strat in load_balancing_strategies():
        print(f"   {strat['name']:<25}: {strat['best_for']}")
    print()

    # 9. Redis caching
    print("9. Redis caching layer:")
    redis_info = redis_caching_layer()
    print(f"   Pattern: {redis_info['pattern'][:80]}...")
    print(f"   TTL: {redis_info['ttl_strategy'][:80]}...")
    print()

    # 10. Health check aggregation
    print("10. Health check aggregator:")
    def check_model():
        time.sleep(0.01)
        return {"status": "healthy", "model_version": "1.0.0"}
    def check_db():
        time.sleep(0.02)
        return {"status": "healthy", "latency_ms": 20}
    def check_cache():
        time.sleep(0.05)
        return {"status": "healthy", "hit_rate": 0.72}

    health = aggregate_health_checks({
        "model": check_model,
        "database": check_db,
        "cache": check_cache,
    }, timeout_s=1.0)
    print(f"   Overall: {health['overall']}")
    print(f"   Check time: {health['check_time_ms']:.1f} ms (parallel, not sequential)")
    for name, result in health["services"].items():
        print(f"   {name:10s}: {result['status']}")


if __name__ == "__main__":
    main()
