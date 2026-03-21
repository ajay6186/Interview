# ============================================================
# Examples 5.5 — High-Traffic ML API Design (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import time
import math
import random
import threading
import queue
import uuid
import asyncio
import heapq
from collections import deque, OrderedDict
import hashlib

rng = random.Random(42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Token bucket rate limiter — 10 tokens/sec"""
    class SimpleTokenBucket:
        def __init__(self, rate=10, capacity=10):
            self.rate = rate
            self.capacity = capacity
            self.tokens = capacity
            self.last_refill = time.monotonic()
        def consume(self, n=1):
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_refill = now
            if self.tokens >= n:
                self.tokens -= n
                return True
            return False
    bucket = SimpleTokenBucket(rate=10, capacity=10)
    results = [bucket.consume() for _ in range(15)]
    allowed = results.count(True)
    denied = results.count(False)
    print(f"Ex01 — Token Bucket (10 tok/s, capacity=10): "
          f"15 requests → {allowed} allowed, {denied} denied")

def ex02():
    """Fixed window counter — count requests per minute"""
    class FixedWindowCounter:
        def __init__(self, window_sec=60, limit=100):
            self.window_sec = window_sec
            self.limit = limit
            self._counts = {}
        def _window_key(self):
            return int(time.time() // self.window_sec)
        def is_allowed(self, client_id):
            key = (client_id, self._window_key())
            self._counts[key] = self._counts.get(key, 0) + 1
            return self._counts[key] <= self.limit
    counter = FixedWindowCounter(window_sec=60, limit=5)
    results = [counter.is_allowed("user_A") for _ in range(8)]
    print(f"Ex02 — Fixed Window Counter (limit=5/min, 8 requests): "
          f"allowed={results.count(True)}, denied={results.count(False)}")
    print(f"  Pattern: {['OK' if r else 'DENY' for r in results]}")

def ex03():
    """Sliding window rate limiter — deque-based"""
    class SlidingWindowLimiter:
        def __init__(self, window_sec=10, limit=5):
            self.window_sec = window_sec
            self.limit = limit
            self.requests = {}  # client_id → deque of timestamps
        def is_allowed(self, client_id, now=None):
            if now is None:
                now = time.monotonic()
            if client_id not in self.requests:
                self.requests[client_id] = deque()
            dq = self.requests[client_id]
            cutoff = now - self.window_sec
            while dq and dq[0] < cutoff:
                dq.popleft()
            if len(dq) < self.limit:
                dq.append(now)
                return True
            return False
    limiter = SlidingWindowLimiter(window_sec=1.0, limit=5)
    now = time.monotonic()
    results = [limiter.is_allowed("user_B", now + i * 0.1) for i in range(8)]
    print(f"Ex03 — Sliding Window Limiter (5 req/s, 8 requests over 0.8s): "
          f"allowed={results.count(True)}, denied={results.count(False)}")

def ex04():
    """Request counter class — thread-safe"""
    class ThreadSafeCounter:
        def __init__(self):
            self._count = 0
            self._lock = threading.Lock()
            self._per_endpoint = {}
        def increment(self, endpoint="/predict"):
            with self._lock:
                self._count += 1
                self._per_endpoint[endpoint] = self._per_endpoint.get(endpoint, 0) + 1
                return self._count
        def get(self):
            with self._lock:
                return self._count
        def by_endpoint(self):
            with self._lock:
                return dict(self._per_endpoint)
    counter = ThreadSafeCounter()
    threads = []
    for ep in ["/predict", "/predict", "/health", "/predict", "/batch"]:
        t = threading.Thread(target=counter.increment, args=(ep,))
        threads.append(t)
        t.start()
    for t in threads:
        t.join()
    print(f"Ex04 — ThreadSafeCounter: total={counter.get()}, by_endpoint={counter.by_endpoint()}")

def ex05():
    """Throttle decorator — limit calls per second"""
    def throttle(calls_per_sec):
        min_interval = 1.0 / calls_per_sec
        last_called = [0.0]
        def decorator(fn):
            def wrapper(*args, **kwargs):
                now = time.monotonic()
                elapsed = now - last_called[0]
                if elapsed < min_interval:
                    return None  # throttled
                last_called[0] = now
                return fn(*args, **kwargs)
            return wrapper
        return decorator
    @throttle(calls_per_sec=3)
    def fast_predict(x):
        return x * 2
    results = []
    for i in range(10):
        r = fast_predict(i)
        results.append(r)
        time.sleep(0.15)  # 6.7 calls/sec attempted; throttled to 3/sec
    valid = [r for r in results if r is not None]
    throttled = [r for r in results if r is None]
    print(f"Ex05 — Throttle Decorator (3/s, 10 calls at 6.7/s): "
          f"{len(valid)} passed, {len(throttled)} throttled")

def ex06():
    """Circuit breaker — 3 states: closed/open/half-open"""
    class SimpleCircuitBreaker:
        CLOSED = "CLOSED"; OPEN = "OPEN"; HALF_OPEN = "HALF_OPEN"
        def __init__(self, failure_threshold=3, timeout_sec=5):
            self.state = self.CLOSED
            self.failures = 0
            self.threshold = failure_threshold
            self.timeout = timeout_sec
            self._open_at = None
        def call(self, fn, *args):
            if self.state == self.OPEN:
                if time.monotonic() - self._open_at > self.timeout:
                    self.state = self.HALF_OPEN
                else:
                    raise RuntimeError("Circuit OPEN — request rejected")
            try:
                result = fn(*args)
                if self.state == self.HALF_OPEN:
                    self.state = self.CLOSED
                    self.failures = 0
                return result
            except Exception:
                self.failures += 1
                if self.failures >= self.threshold:
                    self.state = self.OPEN
                    self._open_at = time.monotonic()
                raise
    cb = SimpleCircuitBreaker(failure_threshold=3, timeout_sec=1)
    def flaky():
        raise ValueError("service down")
    def ok():
        return "ok"
    states = []
    for i in range(5):
        try:
            cb.call(flaky)
        except Exception:
            pass
        states.append(cb.state)
    print(f"Ex06 — Circuit Breaker: states after 5 failures = {states}")
    print(f"  Final state: {cb.state}")

def ex07():
    """Health check response dict"""
    def health_check(model_loaded=True, db_ok=True, cache_ok=True):
        start = time.perf_counter()
        latency_ms = round((time.perf_counter() - start) * 1000, 3)
        status = "healthy" if model_loaded and db_ok else "degraded"
        return {
            "status": status,
            "version": "v2.1.0",
            "uptime_seconds": 86412,
            "checks": {
                "model": "ok" if model_loaded else "error",
                "database": "ok" if db_ok else "error",
                "cache": "ok" if cache_ok else "error",
            },
            "latency_ms": latency_ms,
        }
    result = health_check()
    print(f"Ex07 — Health Check: status={result['status']}, "
          f"checks={result['checks']}, latency={result['latency_ms']}ms")

def ex08():
    """Readiness check — model loaded + DB connected simulation"""
    def readiness_check():
        checks = {}
        # Model: check file exists (simulated)
        checks["model_loaded"] = True
        checks["model_version"] = "v2.1.0"
        # DB: test connection (simulated)
        checks["db_connected"] = True
        checks["db_latency_ms"] = round(rng.uniform(1, 5), 2)
        # Cache: ping (simulated)
        checks["cache_connected"] = True
        checks["cache_latency_ms"] = round(rng.uniform(0.2, 1.0), 2)
        # Warm-up: at least 10 predictions served
        checks["warmup_complete"] = True
        checks["predictions_served"] = 50
        ready = all([checks["model_loaded"], checks["db_connected"], checks["cache_connected"]])
        return {"ready": ready, **checks}
    result = readiness_check()
    print(f"Ex08 — Readiness Check: ready={result['ready']}, "
          f"db_ms={result['db_latency_ms']}, cache_ms={result['cache_latency_ms']}")

def ex09():
    """Liveness check — always returns True if process is running"""
    def liveness_check():
        # Simple: if this code runs, the process is alive
        return {
            "alive": True,
            "pid": 12345,
            "memory_mb": round(rng.uniform(400, 600), 1),
            "cpu_pct": round(rng.uniform(10, 40), 1),
            "gc_collections": [142, 18, 3],
        }
    result = liveness_check()
    print(f"Ex09 — Liveness Check: alive={result['alive']}, "
          f"memory={result['memory_mb']}MB, cpu={result['cpu_pct']}%")

def ex10():
    """Request ID generator — UUID"""
    def generate_request_id(prefix="req"):
        return f"{prefix}_{uuid.uuid4().hex[:12]}"
    ids = [generate_request_id() for _ in range(5)]
    # Verify uniqueness
    assert len(set(ids)) == 5, "Collision detected!"
    print(f"Ex10 — Request ID Generator: {ids}")
    print(f"  All unique: {len(set(ids)) == len(ids)}")

def ex11():
    """Request logger — append to list"""
    class RequestLogger:
        def __init__(self, max_size=1000):
            self.log = deque(maxlen=max_size)
            self._lock = threading.Lock()
        def record(self, request_id, endpoint, status_code, latency_ms):
            entry = {"id": request_id, "endpoint": endpoint,
                     "status": status_code, "latency_ms": latency_ms,
                     "ts": time.time()}
            with self._lock:
                self.log.append(entry)
        def stats(self):
            with self._lock:
                entries = list(self.log)
            if not entries:
                return {}
            latencies = [e["latency_ms"] for e in entries]
            errors = sum(1 for e in entries if e["status"] >= 400)
            import statistics
            return {"count": len(entries), "error_rate": round(errors / len(entries), 4),
                    "avg_latency": round(sum(latencies) / len(latencies), 2),
                    "max_latency": round(max(latencies), 2)}
    logger = RequestLogger()
    for i in range(20):
        logger.record(f"req_{i}", "/predict", 200 if i % 8 != 0 else 500,
                      round(rng.uniform(5, 150), 2))
    s = logger.stats()
    print(f"Ex11 — RequestLogger: count={s['count']}, error_rate={s['error_rate']}, "
          f"avg_latency={s['avg_latency']}ms, max={s['max_latency']}ms")

def ex12():
    """Response time measurement — decorator"""
    latency_store = []
    def measure_latency(fn):
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            result = fn(*args, **kwargs)
            elapsed_ms = (time.perf_counter() - start) * 1000
            latency_store.append(elapsed_ms)
            return result
        return wrapper
    @measure_latency
    def mock_predict(x):
        # Simulate variable latency
        time.sleep(rng.uniform(0.002, 0.020))
        return x * 2
    for i in range(10):
        mock_predict(i)
    import statistics
    p50 = sorted(latency_store)[len(latency_store) // 2]
    p99 = sorted(latency_store)[int(len(latency_store) * 0.99)]
    print(f"Ex12 — Response Time Measurement (10 calls): "
          f"avg={sum(latency_store)/len(latency_store):.2f}ms, "
          f"p50={p50:.2f}ms, max={max(latency_store):.2f}ms")

def ex13():
    """Retry with exponential backoff"""
    def retry_with_backoff(fn, max_retries=5, base_delay=0.01, max_delay=0.5, jitter=True):
        for attempt in range(max_retries):
            try:
                return fn(), attempt
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                delay = min(base_delay * (2 ** attempt), max_delay)
                if jitter:
                    delay *= rng.uniform(0.8, 1.2)
                time.sleep(delay)
        raise RuntimeError("max retries exceeded")
    attempt_count = [0]
    def flaky_service():
        attempt_count[0] += 1
        if attempt_count[0] < 4:
            raise ConnectionError("service unavailable")
        return "success"
    result, attempts = retry_with_backoff(flaky_service, max_retries=5, base_delay=0.001)
    print(f"Ex13 — Retry with Backoff: result='{result}', succeeded on attempt {attempts + 1}")

# ─── INTERMEDIATE (14–26) ────────────────────────────────────

def ex14():
    """TokenBucket class — full implementation"""
    class TokenBucket:
        def __init__(self, rate, capacity, burst_factor=1.5):
            self.rate = rate
            self.capacity = capacity
            self.burst = capacity * burst_factor
            self.tokens = capacity
            self.last_refill = time.monotonic()
            self._lock = threading.Lock()
        def consume(self, n=1) -> tuple:
            with self._lock:
                now = time.monotonic()
                elapsed = now - self.last_refill
                self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
                self.last_refill = now
                if self.tokens >= n:
                    self.tokens -= n
                    return True, self.tokens
                return False, self.tokens
        def remaining(self):
            with self._lock:
                return round(self.tokens, 2)
    tb = TokenBucket(rate=100, capacity=100, burst_factor=1.5)
    allowed = sum(1 for _ in range(200) if tb.consume()[0])
    print(f"Ex14 — TokenBucket (rate=100/s, cap=100, burst=1.5x): "
          f"200 burst requests → {allowed} allowed, remaining={tb.remaining():.2f}")

def ex15():
    """SlidingWindowCounter class — deque + timestamps"""
    class SlidingWindowCounter:
        def __init__(self, window_sec=60, limit=100):
            self.window_sec = window_sec
            self.limit = limit
            self._timestamps = {}
            self._lock = threading.Lock()
        def is_allowed(self, client_id, now=None):
            if now is None:
                now = time.monotonic()
            with self._lock:
                if client_id not in self._timestamps:
                    self._timestamps[client_id] = deque()
                dq = self._timestamps[client_id]
                cutoff = now - self.window_sec
                while dq and dq[0] < cutoff:
                    dq.popleft()
                if len(dq) < self.limit:
                    dq.append(now)
                    return True, len(dq)
                return False, len(dq)
        def count(self, client_id):
            with self._lock:
                return len(self._timestamps.get(client_id, []))
    swc = SlidingWindowCounter(window_sec=1.0, limit=10)
    now = time.monotonic()
    results = [swc.is_allowed("clientA", now + i * 0.08) for i in range(15)]
    print(f"Ex15 — SlidingWindowCounter (10/s, 15 req in 1.2s): "
          f"allowed={sum(r[0] for r in results)}, denied={sum(not r[0] for r in results)}")

def ex16():
    """CircuitBreaker class — full state machine"""
    class CircuitBreaker:
        CLOSED = "CLOSED"; OPEN = "OPEN"; HALF_OPEN = "HALF_OPEN"
        def __init__(self, failure_threshold=5, success_threshold=2,
                     timeout_sec=10, half_open_max=3):
            self.failure_threshold = failure_threshold
            self.success_threshold = success_threshold
            self.timeout = timeout_sec
            self.half_open_max = half_open_max
            self._state = self.CLOSED
            self._failures = 0; self._successes = 0
            self._half_open_count = 0; self._open_time = None
        @property
        def state(self):
            if self._state == self.OPEN:
                if time.monotonic() - self._open_time > self.timeout:
                    self._state = self.HALF_OPEN
                    self._half_open_count = 0
            return self._state
        def record_success(self):
            if self.state == self.HALF_OPEN:
                self._successes += 1
                if self._successes >= self.success_threshold:
                    self._state = self.CLOSED
                    self._failures = 0; self._successes = 0
            else:
                self._failures = max(0, self._failures - 1)
        def record_failure(self):
            self._failures += 1
            if self._failures >= self.failure_threshold:
                self._state = self.OPEN
                self._open_time = time.monotonic()
        def allow_request(self):
            s = self.state
            if s == self.CLOSED:
                return True
            if s == self.HALF_OPEN:
                self._half_open_count += 1
                return self._half_open_count <= self.half_open_max
            return False
    cb = CircuitBreaker(failure_threshold=3, timeout_sec=0.1)
    states = []
    for _ in range(3):
        cb.record_failure()
        states.append(cb.state)
    time.sleep(0.15)
    cb.record_success(); cb.record_success()
    states.append(cb.state)
    print(f"Ex16 — CircuitBreaker: states after 3 failures + wait + 2 successes = {states}")

def ex17():
    """Bulkhead class — limit concurrent per category"""
    class Bulkhead:
        def __init__(self, limits):
            self.limits = limits
            self._active = {k: 0 for k in limits}
            self._lock = threading.Lock()
        def acquire(self, category):
            with self._lock:
                if self._active[category] < self.limits[category]:
                    self._active[category] += 1
                    return True
                return False
        def release(self, category):
            with self._lock:
                self._active[category] = max(0, self._active[category] - 1)
        def status(self):
            with self._lock:
                return {k: f"{self._active[k]}/{self.limits[k]}" for k in self.limits}
    bh = Bulkhead(limits={"premium": 50, "standard": 20, "free": 5})
    acquired = []
    for category in ["premium"] * 10 + ["free"] * 8:
        ok = bh.acquire(category)
        acquired.append((category, ok))
    print(f"Ex17 — Bulkhead: {bh.status()}")
    free_denied = sum(1 for cat, ok in acquired if cat == "free" and not ok)
    print(f"  Free tier requests denied: {free_denied}/8 (limit=5)")

def ex18():
    """TimeoutWrapper class — raise if over limit"""
    class TimeoutWrapper:
        def __init__(self, timeout_sec):
            self.timeout = timeout_sec
        def run(self, fn, *args, **kwargs):
            result = [None]; error = [None]
            def target():
                try:
                    result[0] = fn(*args, **kwargs)
                except Exception as e:
                    error[0] = e
            t = threading.Thread(target=target, daemon=True)
            t.start()
            t.join(timeout=self.timeout)
            if t.is_alive():
                raise TimeoutError(f"Exceeded {self.timeout}s timeout")
            if error[0]:
                raise error[0]
            return result[0]
    wrapper = TimeoutWrapper(timeout_sec=0.05)
    def fast_fn():
        return "fast result"
    def slow_fn():
        time.sleep(0.2)
        return "slow result"
    fast_result = wrapper.run(fast_fn)
    try:
        slow_result = wrapper.run(slow_fn)
        slow_status = "succeeded (unexpected)"
    except TimeoutError as e:
        slow_status = f"TimeoutError: {e}"
    print(f"Ex18 — TimeoutWrapper (50ms limit):")
    print(f"  Fast fn: {fast_result}")
    print(f"  Slow fn: {slow_status}")

def ex19():
    """RetryWithJitter class — jitter ± 20%"""
    class RetryWithJitter:
        def __init__(self, max_retries=5, base_ms=100, multiplier=2.0, jitter_pct=0.20):
            self.max_retries = max_retries
            self.base_ms = base_ms
            self.multiplier = multiplier
            self.jitter_pct = jitter_pct
        def delay_ms(self, attempt):
            base = self.base_ms * (self.multiplier ** attempt)
            jitter = base * rng.uniform(-self.jitter_pct, self.jitter_pct)
            return round(base + jitter, 2)
        def delays_preview(self):
            return [self.delay_ms(i) for i in range(self.max_retries)]
    r = RetryWithJitter(max_retries=5, base_ms=10, multiplier=2.0, jitter_pct=0.20)
    delays = r.delays_preview()
    print(f"Ex19 — RetryWithJitter delays (ms): {delays}")
    print(f"  Total max wait: {sum(delays):.1f}ms")

def ex20():
    """LoadShedder class — drop requests when queue full"""
    class LoadShedder:
        def __init__(self, max_queue_size=100, shed_pct_when_full=0.50):
            self.max_queue_size = max_queue_size
            self.shed_pct = shed_pct_when_full
            self._queue_size = 0
            self._shed_count = 0
            self._accept_count = 0
            self._lock = threading.Lock()
        def should_accept(self, request_id):
            with self._lock:
                fill_ratio = self._queue_size / self.max_queue_size
                if fill_ratio > 0.9 and rng.random() < self.shed_pct:
                    self._shed_count += 1
                    return False
                self._queue_size = min(self.max_queue_size, self._queue_size + 1)
                self._accept_count += 1
                return True
        def complete(self):
            with self._lock:
                self._queue_size = max(0, self._queue_size - 1)
        def stats(self):
            return {"accepted": self._accept_count, "shed": self._shed_count,
                    "queue_size": self._queue_size}
    shedder = LoadShedder(max_queue_size=10, shed_pct_when_full=0.5)
    for _ in range(5):
        shedder._queue_size = 9  # simulate near-full
    results = [shedder.should_accept(f"r_{i}") for i in range(30)]
    s = shedder.stats()
    print(f"Ex20 — LoadShedder (max_q=10, shed=50% when >90% full):")
    print(f"  30 requests: accepted={s['accepted']}, shed={s['shed']}")

def ex21():
    """PriorityRequestQueue — heapq-based"""
    class PriorityRequest:
        def __init__(self, priority, request_id, payload):
            self.priority = priority
            self.request_id = request_id
            self.payload = payload
            self._seq = time.monotonic()
        def __lt__(self, other):
            if self.priority != other.priority:
                return self.priority < other.priority  # lower = higher priority
            return self._seq < other._seq
    class PriorityRequestQueue:
        def __init__(self, maxsize=1000):
            self._heap = []
            self.maxsize = maxsize
            self._lock = threading.Lock()
        def put(self, priority, request_id, payload):
            with self._lock:
                if len(self._heap) >= self.maxsize:
                    return False
                heapq.heappush(self._heap, PriorityRequest(priority, request_id, payload))
                return True
        def get(self):
            with self._lock:
                if self._heap:
                    return heapq.heappop(self._heap)
                return None
        def size(self):
            return len(self._heap)
    q = PriorityRequestQueue()
    for i, (priority, rid) in enumerate([(2, "std_1"), (1, "prem_1"), (3, "free_1"),
                                          (1, "prem_2"), (2, "std_2")]):
        q.put(priority, rid, {"idx": i})
    order = [q.get().request_id for _ in range(5)]
    print(f"Ex21 — PriorityRequestQueue: dequeue order={order}")
    print(f"  (priority 1=premium first, then 2=standard, then 3=free)")

def ex22():
    """ConnectionPool class — fixed pool of N workers"""
    class ConnectionPool:
        def __init__(self, pool_size=5):
            self.pool_size = pool_size
            self._semaphore = threading.Semaphore(pool_size)
            self._active = 0
            self._lock = threading.Lock()
        def acquire(self, timeout=1.0):
            ok = self._semaphore.acquire(timeout=timeout)
            if ok:
                with self._lock:
                    self._active += 1
            return ok
        def release(self):
            with self._lock:
                self._active = max(0, self._active - 1)
            self._semaphore.release()
        def active(self):
            with self._lock:
                return self._active
    pool = ConnectionPool(pool_size=3)
    results = []
    def task(pool, results, idx):
        ok = pool.acquire(timeout=0.1)
        results.append(ok)
        if ok:
            time.sleep(0.05)
            pool.release()
    threads = [threading.Thread(target=task, args=(pool, results, i)) for i in range(8)]
    for t in threads: t.start()
    for t in threads: t.join()
    print(f"Ex22 — ConnectionPool (size=3, 8 concurrent): "
          f"acquired={results.count(True)}, rejected={results.count(False)}")

def ex23():
    """CacheAside class — get/set/invalidate"""
    class CacheAside:
        def __init__(self, ttl_sec=300):
            self._store = {}
            self._ttl = ttl_sec
            self._hits = 0; self._misses = 0
        def get(self, key):
            if key in self._store:
                value, expires_at = self._store[key]
                if time.monotonic() < expires_at:
                    self._hits += 1
                    return value
                del self._store[key]
            self._misses += 1
            return None
        def set(self, key, value, ttl=None):
            ttl = ttl or self._ttl
            self._store[key] = (value, time.monotonic() + ttl)
        def invalidate(self, key):
            self._store.pop(key, None)
        def hit_rate(self):
            total = self._hits + self._misses
            return round(self._hits / total, 4) if total else 0.0
    cache = CacheAside(ttl_sec=60)
    for i in range(10):
        cache.set(f"key_{i}", f"value_{i}")
    hits = sum(1 for i in range(15) if cache.get(f"key_{i}") is not None)
    print(f"Ex23 — CacheAside: {hits}/15 hits (keys 0-9 set, 0-14 queried), "
          f"hit_rate={cache.hit_rate():.2f}")

def ex24():
    """WriteThroughCache class"""
    class WriteThroughCache:
        def __init__(self):
            self._cache = {}
            self._db = {}  # simulated database
            self._writes = 0
        def write(self, key, value):
            # Write to both cache and DB atomically
            self._cache[key] = value
            self._db[key] = value
            self._writes += 1
        def read(self, key):
            return self._cache.get(key)  # always in cache after write
        def cache_size(self):
            return len(self._cache)
        def consistency_check(self):
            return all(self._cache.get(k) == v for k, v in self._db.items())
    wtc = WriteThroughCache()
    for i in range(10):
        wtc.write(f"pred_{i}", {"label": i % 2, "score": round(rng.uniform(0.5, 0.99), 4)})
    print(f"Ex24 — WriteThroughCache: {wtc._writes} writes, "
          f"cache_size={wtc.cache_size()}, consistent={wtc.consistency_check()}")

def ex25():
    """LRUCache class — collections.OrderedDict"""
    class LRUCache:
        def __init__(self, capacity):
            self.capacity = capacity
            self._store = OrderedDict()
            self._hits = 0; self._misses = 0
        def get(self, key):
            if key in self._store:
                self._store.move_to_end(key)
                self._hits += 1
                return self._store[key]
            self._misses += 1
            return None
        def put(self, key, value):
            if key in self._store:
                self._store.move_to_end(key)
            self._store[key] = value
            if len(self._store) > self.capacity:
                self._store.popitem(last=False)
        def size(self):
            return len(self._store)
        def hit_rate(self):
            total = self._hits + self._misses
            return round(self._hits / total, 4) if total else 0.0
    cache = LRUCache(capacity=5)
    for i in range(8):
        cache.put(f"k{i}", f"v{i}")
    # Access recently used keys
    for i in range(10):
        cache.get(f"k{i % 7}")
    print(f"Ex25 — LRUCache (capacity=5): size={cache.size()}, "
          f"hits={cache._hits}, misses={cache._misses}, hit_rate={cache.hit_rate()}")

def ex26():
    """TTLCache class — expire after N seconds"""
    class TTLCache:
        def __init__(self, default_ttl=60):
            self.default_ttl = default_ttl
            self._store = {}
            self._expired_count = 0
        def set(self, key, value, ttl=None):
            ttl = ttl or self.default_ttl
            self._store[key] = (value, time.monotonic() + ttl)
        def get(self, key):
            if key in self._store:
                value, expires = self._store[key]
                if time.monotonic() <= expires:
                    return value
                del self._store[key]
                self._expired_count += 1
            return None
        def purge_expired(self):
            now = time.monotonic()
            expired = [k for k, (_, exp) in self._store.items() if now > exp]
            for k in expired:
                del self._store[k]
                self._expired_count += 1
            return len(expired)
    ttl_cache = TTLCache(default_ttl=10)
    ttl_cache.set("long_lived", "hello", ttl=100)
    ttl_cache.set("short_lived", "bye", ttl=0.001)
    time.sleep(0.01)
    long_result = ttl_cache.get("long_lived")
    short_result = ttl_cache.get("short_lived")  # should be expired
    print(f"Ex26 — TTLCache: long_lived={long_result}, short_lived(expired)={short_result}, "
          f"expired_count={ttl_cache._expired_count}")

# ─── NESTED (27–38) ──────────────────────────────────────────

def ex27():
    """RateLimiter combining token bucket + sliding window"""
    class HybridRateLimiter:
        def __init__(self, rate_per_sec, burst_capacity, window_sec=60, window_limit=None):
            self.tb_rate = rate_per_sec
            self.tb_capacity = burst_capacity
            self.tb_tokens = float(burst_capacity)
            self.tb_last = time.monotonic()
            self.window_sec = window_sec
            self.window_limit = window_limit or rate_per_sec * window_sec
            self._window_reqs = {}
            self._lock = threading.Lock()
        def _refill_tokens(self, now):
            elapsed = now - self.tb_last
            self.tb_tokens = min(self.tb_capacity, self.tb_tokens + elapsed * self.tb_rate)
            self.tb_last = now
        def is_allowed(self, client_id, now=None):
            if now is None:
                now = time.monotonic()
            with self._lock:
                self._refill_tokens(now)
                # Token bucket check
                if self.tb_tokens < 1:
                    return False, "token_bucket"
                # Sliding window check
                if client_id not in self._window_reqs:
                    self._window_reqs[client_id] = deque()
                dq = self._window_reqs[client_id]
                cutoff = now - self.window_sec
                while dq and dq[0] < cutoff:
                    dq.popleft()
                if len(dq) >= self.window_limit:
                    return False, "sliding_window"
                # Both passed
                self.tb_tokens -= 1
                dq.append(now)
                return True, "ok"
    rl = HybridRateLimiter(rate_per_sec=5, burst_capacity=10, window_sec=1, window_limit=8)
    now = time.monotonic()
    results = [rl.is_allowed("u1", now + i * 0.08) for i in range(15)]
    print(f"Ex27 — HybridRateLimiter (5/s, burst=10, window=8/s): "
          f"15 requests → allowed={sum(r[0] for r in results)}, "
          f"denied={sum(not r[0] for r in results)}")

def ex28():
    """CircuitBreaker + retry composition"""
    class ResilientClient:
        def __init__(self, failure_threshold=3, max_retries=3, backoff_base_ms=10):
            self._failures = 0
            self._state = "CLOSED"
            self._open_at = None
            self.failure_threshold = failure_threshold
            self.max_retries = max_retries
            self.backoff_base_ms = backoff_base_ms
            self.call_log = []
        def call(self, fn, *args):
            # Circuit check
            if self._state == "OPEN":
                if time.monotonic() - self._open_at > 0.1:
                    self._state = "HALF_OPEN"
                else:
                    self.call_log.append("circuit_open")
                    raise RuntimeError("Circuit is OPEN")
            for attempt in range(self.max_retries):
                try:
                    result = fn(*args)
                    self._failures = max(0, self._failures - 1)
                    if self._state == "HALF_OPEN":
                        self._state = "CLOSED"
                    self.call_log.append(f"ok(attempt={attempt})")
                    return result
                except Exception as e:
                    self._failures += 1
                    if self._failures >= self.failure_threshold:
                        self._state = "OPEN"
                        self._open_at = time.monotonic()
                    if attempt < self.max_retries - 1:
                        time.sleep(self.backoff_base_ms * (2 ** attempt) / 1000)
            self.call_log.append("failed_all_retries")
            raise RuntimeError("All retries exhausted")
    attempt_n = [0]
    def unreliable():
        attempt_n[0] += 1
        if attempt_n[0] <= 4:
            raise ConnectionError("down")
        return "recovered"
    client = ResilientClient(failure_threshold=5, max_retries=3, backoff_base_ms=1)
    for _ in range(3):
        try:
            r = client.call(unreliable)
            client.call_log[-1] = f"final_ok: {r}"
        except Exception:
            pass
    print(f"Ex28 — CircuitBreaker+Retry: log={client.call_log}, state={client._state}")

def ex29():
    """RequestRouter class — round-robin + least-connections + random"""
    class RequestRouter:
        def __init__(self, servers):
            self.servers = servers
            self._rr_idx = 0
            self._connections = {s: 0 for s in servers}
            self._lock = threading.Lock()
        def round_robin(self):
            with self._lock:
                s = self.servers[self._rr_idx % len(self.servers)]
                self._rr_idx += 1
                return s
        def least_connections(self):
            with self._lock:
                return min(self._connections, key=self._connections.get)
        def random_server(self):
            return rng.choice(self.servers)
        def acquire(self, server):
            with self._lock:
                self._connections[server] += 1
        def release(self, server):
            with self._lock:
                self._connections[server] = max(0, self._connections[server] - 1)
    router = RequestRouter(["s1:8000", "s2:8000", "s3:8000"])
    # Simulate some connections
    for s in ["s1:8000", "s1:8000", "s2:8000"]:
        router.acquire(s)
    rr_results = [router.round_robin() for _ in range(9)]
    lc_result = router.least_connections()
    rand_results = [router.random_server() for _ in range(9)]
    from collections import Counter
    print(f"Ex29 — RequestRouter:")
    print(f"  Round-Robin  (9 req): {dict(Counter(rr_results))}")
    print(f"  Least-Conn   (pick) : {lc_result} (connections={router._connections})")
    print(f"  Random       (9 req): {dict(Counter(rand_results))}")

def ex30():
    """LoadBalancer class — track server loads"""
    class LoadBalancer:
        def __init__(self, servers):
            self.servers = {s: {"connections": 0, "total_requests": 0,
                                 "errors": 0, "healthy": True} for s in servers}
            self._lock = threading.Lock()
        def get_server(self):
            with self._lock:
                healthy = {s: m for s, m in self.servers.items() if m["healthy"]}
                if not healthy:
                    raise RuntimeError("No healthy servers")
                return min(healthy, key=lambda s: healthy[s]["connections"])
        def record_request(self, server, success=True):
            with self._lock:
                self.servers[server]["total_requests"] += 1
                if not success:
                    self.servers[server]["errors"] += 1
                    err_rate = self.servers[server]["errors"] / self.servers[server]["total_requests"]
                    if err_rate > 0.5 and self.servers[server]["total_requests"] > 10:
                        self.servers[server]["healthy"] = False
        def stats(self):
            return {s: {"req": m["total_requests"], "err": m["errors"],
                        "healthy": m["healthy"]} for s, m in self.servers.items()}
    lb = LoadBalancer(["api-1", "api-2", "api-3"])
    for i in range(30):
        s = lb.get_server()
        lb.servers[s]["connections"] += 1
        lb.record_request(s, success=rng.random() > 0.1)
        lb.servers[s]["connections"] -= 1
    stats = lb.stats()
    print(f"Ex30 — LoadBalancer: {stats}")

def ex31():
    """RequestBatcher class — batch up to N or wait T ms"""
    class RequestBatcher:
        def __init__(self, max_batch=8, max_wait_ms=20):
            self.max_batch = max_batch
            self.max_wait_ms = max_wait_ms
            self._pending = []
            self._results = {}
            self._lock = threading.Lock()
            self.batches_processed = 0
            self.total_requests = 0
        def submit(self, request_id, data):
            event = threading.Event()
            with self._lock:
                self._pending.append((request_id, data, event))
                self.total_requests += 1
                should_flush = len(self._pending) >= self.max_batch
            if should_flush:
                self._flush()
            return event
        def _flush(self):
            with self._lock:
                batch = self._pending[:]
                self._pending.clear()
            if not batch:
                return
            self.batches_processed += 1
            # Process batch (simulated)
            for req_id, data, event in batch:
                self._results[req_id] = f"result_{req_id}"
                event.set()
    batcher = RequestBatcher(max_batch=4, max_wait_ms=10)
    events = [batcher.submit(f"req_{i}", {"x": i}) for i in range(12)]
    batcher._flush()  # flush remaining
    print(f"Ex31 — RequestBatcher (batch=4, wait=20ms): "
          f"{batcher.total_requests} requests → {batcher.batches_processed} batches, "
          f"avg_batch_size={batcher.total_requests/max(batcher.batches_processed,1):.1f}")

def ex32():
    """PredictionCache class — LRU + TTL combined"""
    class PredictionCache:
        def __init__(self, capacity=1000, ttl_sec=300):
            self.capacity = capacity
            self.ttl = ttl_sec
            self._store = OrderedDict()
            self._hits = 0; self._misses = 0
            self._lock = threading.Lock()
        def _make_key(self, features):
            if isinstance(features, dict):
                return hashlib.md5(str(sorted(features.items())).encode()).hexdigest()
            return hashlib.md5(str(features).encode()).hexdigest()
        def get(self, features):
            key = self._make_key(features)
            with self._lock:
                if key in self._store:
                    value, expires = self._store[key]
                    if time.monotonic() <= expires:
                        self._store.move_to_end(key)
                        self._hits += 1
                        return value
                    del self._store[key]
                self._misses += 1
                return None
        def set(self, features, prediction):
            key = self._make_key(features)
            with self._lock:
                self._store[key] = (prediction, time.monotonic() + self.ttl)
                self._store.move_to_end(key)
                if len(self._store) > self.capacity:
                    self._store.popitem(last=False)
        def hit_rate(self):
            total = self._hits + self._misses
            return round(self._hits / total, 4) if total else 0.0
    pcache = PredictionCache(capacity=5, ttl_sec=60)
    for i in range(8):
        pcache.set({"feature_1": i, "feature_2": i * 2}, {"label": i % 2, "score": 0.9})
    for i in range(12):
        pcache.get({"feature_1": i % 6, "feature_2": (i % 6) * 2})
    print(f"Ex32 — PredictionCache: hits={pcache._hits}, misses={pcache._misses}, "
          f"hit_rate={pcache.hit_rate():.3f}, size={len(pcache._store)}")

def ex33():
    """MiddlewarePipeline class — chain of handlers"""
    class MiddlewarePipeline:
        def __init__(self):
            self.handlers = []
        def use(self, fn):
            self.handlers.append(fn)
            return self
        def process(self, request):
            context = {"request": request, "logs": [], "start": time.perf_counter()}
            for handler in self.handlers:
                result = handler(context)
                if result is False:
                    return context  # short-circuit
            context["elapsed_ms"] = round((time.perf_counter() - context["start"]) * 1000, 3)
            return context
    def auth_middleware(ctx):
        token = ctx["request"].get("token", "")
        ctx["authenticated"] = token.startswith("Bearer ")
        ctx["logs"].append(f"auth={'ok' if ctx['authenticated'] else 'fail'}")
        if not ctx["authenticated"]:
            ctx["error"] = "Unauthorized"
            return False
    def rate_limit_middleware(ctx):
        ctx["rate_limit_ok"] = True
        ctx["logs"].append("rate_limit=ok")
    def predict_middleware(ctx):
        ctx["prediction"] = {"label": 1, "score": 0.87}
        ctx["logs"].append("predict=ok")
    def log_middleware(ctx):
        ctx["logs"].append(f"elapsed={ctx.get('elapsed_ms', 'N/A')}ms")
    pipeline = MiddlewarePipeline()
    pipeline.use(auth_middleware).use(rate_limit_middleware).use(predict_middleware)
    r1 = pipeline.process({"token": "Bearer abc123", "features": [1, 2, 3]})
    r2 = pipeline.process({"token": "invalid", "features": [1, 2, 3]})
    print(f"Ex33 — MiddlewarePipeline:")
    print(f"  Authorized request  : {r1.get('prediction')}, logs={r1['logs']}")
    print(f"  Unauthorized request: error={r2.get('error')}, logs={r2['logs']}")

def ex34():
    """TrafficShaper class — smooth traffic spikes"""
    class TrafficShaper:
        def __init__(self, target_rps, smoothing_window=10):
            self.target_rps = target_rps
            self._interval = 1.0 / target_rps
            self._last_emit = time.monotonic() - self._interval
            self._queue = deque()
            self._window = smoothing_window
            self._processed = 0
            self._delayed = 0
        def submit(self, request, now=None):
            if now is None:
                now = time.monotonic()
            expected_emit = self._last_emit + self._interval
            if now >= expected_emit:
                self._last_emit = now
                self._processed += 1
                return "immediate", 0
            else:
                delay_ms = (expected_emit - now) * 1000
                self._last_emit = expected_emit
                self._delayed += 1
                return "delayed", round(delay_ms, 2)
    shaper = TrafficShaper(target_rps=100)
    now = time.monotonic()
    results = [shaper.submit(f"req_{i}", now + i * 0.002) for i in range(30)]
    immediate = sum(1 for r, _ in results if r == "immediate")
    delayed = sum(1 for r, _ in results if r == "delayed")
    avg_delay = sum(d for _, d in results if d > 0) / max(delayed, 1)
    print(f"Ex34 — TrafficShaper (100 RPS, 30 req at 500 RPS): "
          f"immediate={immediate}, delayed={delayed}, avg_delay={avg_delay:.1f}ms")

def ex35():
    """ABTestSplitter class — consistent hash-based"""
    class ABTestSplitter:
        def __init__(self, experiments):
            self.experiments = experiments
        def assign(self, user_id, experiment_name):
            exp = self.experiments.get(experiment_name)
            if not exp:
                return "control"
            h = int(hashlib.sha256(f"{user_id}:{experiment_name}".encode()).hexdigest(), 16)
            bucket = (h % 10000) / 10000.0
            cumulative = 0
            for variant, weight in exp.items():
                cumulative += weight
                if bucket < cumulative:
                    return variant
            return list(exp.keys())[-1]
        def assignments_distribution(self, n_users, experiment_name):
            users = [f"user_{i}" for i in range(n_users)]
            assignments = [self.assign(u, experiment_name) for u in users]
            from collections import Counter
            return dict(Counter(assignments))
    splitter = ABTestSplitter({
        "cta_test": {"control": 0.50, "variant_a": 0.30, "variant_b": 0.20},
    })
    dist = splitter.assignments_distribution(1000, "cta_test")
    print(f"Ex35 — ABTestSplitter (1000 users, 50/30/20 split): {dist}")

def ex36():
    """ShadowTrafficDuplicator class"""
    class ShadowTrafficDuplicator:
        def __init__(self, shadow_pct=0.10):
            self.shadow_pct = shadow_pct
            self.shadow_log = []
            self.live_log = []
            self.disagreements = []
        def handle(self, request_id, features, live_model_fn, shadow_model_fn):
            live_pred = live_model_fn(features)
            self.live_log.append((request_id, live_pred))
            if rng.random() < self.shadow_pct:
                shadow_pred = shadow_model_fn(features)
                self.shadow_log.append((request_id, shadow_pred))
                if live_pred != shadow_pred:
                    self.disagreements.append((request_id, live_pred, shadow_pred))
            return live_pred  # only live response returned to client
        def stats(self):
            return {"total": len(self.live_log), "shadow_checked": len(self.shadow_log),
                    "disagreements": len(self.disagreements),
                    "agree_rate": 1 - len(self.disagreements) / max(len(self.shadow_log), 1)}
    def live_model(x):
        return 1 if sum(x) > 0 else 0
    def shadow_model(x):
        return 1 if sum(x) > 0.1 else 0
    dup = ShadowTrafficDuplicator(shadow_pct=0.20)
    for i in range(100):
        features = [rng.uniform(-1, 1) for _ in range(5)]
        dup.handle(f"req_{i}", features, live_model, shadow_model)
    s = dup.stats()
    print(f"Ex36 — ShadowTrafficDuplicator (10% shadow): total={s['total']}, "
          f"shadow_checked={s['shadow_checked']}, disagree={s['disagreements']}, "
          f"agree_rate={s['agree_rate']:.3f}")

def ex37():
    """RequestTracer class — timing each middleware step"""
    class RequestTracer:
        def __init__(self, request_id):
            self.request_id = request_id
            self.spans = []
            self._start = time.perf_counter()
        def span(self, name):
            class Span:
                def __init__(self, tracer, name):
                    self.tracer = tracer; self.name = name
                def __enter__(self):
                    self._t = time.perf_counter(); return self
                def __exit__(self, *_):
                    elapsed_ms = (time.perf_counter() - self._t) * 1000
                    self.tracer.spans.append({"name": self.name, "ms": round(elapsed_ms, 3)})
            return Span(self, name)
        def report(self):
            total_ms = (time.perf_counter() - self._start) * 1000
            return {"request_id": self.request_id,
                    "spans": self.spans,
                    "total_ms": round(total_ms, 3)}
    tracer = RequestTracer("req_abc123")
    with tracer.span("auth"):
        time.sleep(0.001)
    with tracer.span("rate_limit"):
        pass
    with tracer.span("cache_lookup"):
        time.sleep(0.002)
    with tracer.span("model_inference"):
        time.sleep(0.008)
    with tracer.span("response_serialization"):
        time.sleep(0.001)
    report = tracer.report()
    print(f"Ex37 — RequestTracer: total={report['total_ms']:.1f}ms")
    for span in report["spans"]:
        bar = "█" * max(1, int(span["ms"]))
        print(f"  {span['name']:30s}: {span['ms']:6.3f}ms {bar}")

def ex38():
    """Full high-traffic API simulation — 1000 requests through pipeline"""
    class HighTrafficSimulation:
        def __init__(self, rate_limit=500, cache_size=100):
            self.rate_limiter = TokenBucketSim(rate=rate_limit, capacity=rate_limit)
            self.cache = LRUCacheSim(capacity=cache_size)
            self.stats = {"total": 0, "rate_limited": 0, "cache_hit": 0,
                          "cache_miss": 0, "served": 0}
        def handle(self, request_id, features_key, now):
            self.stats["total"] += 1
            # 1. Rate limit
            if not self.rate_limiter.consume(now):
                self.stats["rate_limited"] += 1
                return "rate_limited"
            # 2. Cache lookup
            if self.cache.get(features_key):
                self.stats["cache_hit"] += 1
                self.stats["served"] += 1
                return "cache_hit"
            # 3. Model inference (simulated)
            self.cache.put(features_key, f"pred_{features_key}")
            self.stats["cache_miss"] += 1
            self.stats["served"] += 1
            return "model_inference"
    class TokenBucketSim:
        def __init__(self, rate, capacity):
            self.rate = rate; self.capacity = capacity
            self.tokens = float(capacity); self.last = 0
        def consume(self, now):
            if self.last == 0: self.last = now
            self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
            self.last = now
            if self.tokens >= 1: self.tokens -= 1; return True
            return False
    class LRUCacheSim:
        def __init__(self, capacity):
            self.capacity = capacity; self._store = OrderedDict()
        def get(self, key):
            if key in self._store: self._store.move_to_end(key); return self._store[key]
            return None
        def put(self, key, value):
            self._store[key] = value; self._store.move_to_end(key)
            if len(self._store) > self.capacity: self._store.popitem(last=False)
    sim = HighTrafficSimulation(rate_limit=800, cache_size=50)
    start = 0.0
    n = 1000
    # Simulate 1000 requests arriving over 1 second (1000 RPS)
    for i in range(n):
        key = f"feat_{i % 60}"  # 60 unique feature sets → cache will hit
        now = start + i / 1000.0
        sim.handle(f"req_{i}", key, now)
    s = sim.stats
    print(f"Ex38 — High-Traffic Simulation (1000 req in 1s, limit=800/s):")
    print(f"  Total: {s['total']}, Served: {s['served']}, Rate-limited: {s['rate_limited']}")
    print(f"  Cache hits: {s['cache_hit']}, Cache misses: {s['cache_miss']}")
    print(f"  Cache hit rate: {s['cache_hit']/max(s['served'],1):.2%}")

# ─── ADVANCED (39–50) ────────────────────────────────────────

def ex39():
    """Throughput benchmark — 1000 requests with rate limiter, measure actual RPS"""
    class BenchmarkTokenBucket:
        def __init__(self, rate):
            self.rate = rate; self.tokens = float(rate)
            self.last = time.perf_counter(); self._lock = threading.Lock()
        def consume(self):
            with self._lock:
                now = time.perf_counter()
                self.tokens = min(self.rate, self.tokens + (now - self.last) * self.rate)
                self.last = now
                if self.tokens >= 1: self.tokens -= 1; return True
                return False
    limiter = BenchmarkTokenBucket(rate=500)
    n = 1000
    start = time.perf_counter()
    allowed = 0
    for _ in range(n):
        if limiter.consume():
            allowed += 1
    elapsed = time.perf_counter() - start
    actual_rps = allowed / elapsed
    print(f"Ex39 — Throughput Benchmark: {n} requests in {elapsed*1000:.1f}ms")
    print(f"  Allowed: {allowed}, Denied: {n-allowed}")
    print(f"  Effective throughput: {actual_rps:.0f} RPS")

def ex40():
    """Latency percentiles — p50/p95/p99 from simulated latencies"""
    import statistics
    # Simulate realistic latency distribution (mostly fast, some slow)
    latencies = []
    for _ in range(1000):
        r = rng.random()
        if r < 0.80:
            latencies.append(rng.uniform(5, 25))       # normal: 5–25ms
        elif r < 0.95:
            latencies.append(rng.uniform(25, 80))      # slightly slow: 25–80ms
        elif r < 0.99:
            latencies.append(rng.uniform(80, 200))     # slow: 80–200ms
        else:
            latencies.append(rng.uniform(200, 1000))   # very slow: 200ms–1s
    latencies.sort()
    n = len(latencies)
    p50 = latencies[int(n * 0.50)]
    p90 = latencies[int(n * 0.90)]
    p95 = latencies[int(n * 0.95)]
    p99 = latencies[int(n * 0.99)]
    p999 = latencies[int(n * 0.999)]
    avg = sum(latencies) / n
    print(f"Ex40 — Latency Percentiles (N={n}, simulated ML API):")
    print(f"  avg={avg:.1f}ms | p50={p50:.1f}ms | p90={p90:.1f}ms | "
          f"p95={p95:.1f}ms | p99={p99:.1f}ms | p99.9={p999:.1f}ms")
    print(f"  SLA 100ms compliance: {sum(1 for l in latencies if l <= 100)/n:.1%}")

def ex41():
    """Overload simulation — queue fills up → shedding kicks in"""
    class OverloadSimulator:
        def __init__(self, queue_capacity=20, worker_rps=50):
            self.queue = deque()
            self.capacity = queue_capacity
            self.worker_rps = worker_rps
            self.stats = {"received": 0, "shed": 0, "processed": 0}
        def simulate(self, incoming_rps_over_time, duration_sec=1.0):
            dt = 0.01  # 10ms ticks
            ticks = int(duration_sec / dt)
            for tick in range(ticks):
                # Incoming requests this tick
                incoming_rps = incoming_rps_over_time[min(tick, len(incoming_rps_over_time)-1)]
                new_reqs = int(incoming_rps * dt)
                for _ in range(new_reqs):
                    self.stats["received"] += 1
                    if len(self.queue) < self.capacity:
                        self.queue.append(tick)
                    else:
                        self.stats["shed"] += 1
                # Process requests
                workers_can_handle = int(self.worker_rps * dt)
                for _ in range(min(workers_can_handle, len(self.queue))):
                    self.queue.popleft()
                    self.stats["processed"] += 1
    sim = OverloadSimulator(queue_capacity=20, worker_rps=100)
    # Ramp from 50 to 500 RPS (10× overload)
    traffic_profile = [50] * 20 + [200] * 20 + [500] * 20 + [100] * 20 + [50] * 20
    sim.simulate(traffic_profile, duration_sec=1.0)
    shed_rate = sim.stats["shed"] / max(sim.stats["received"], 1)
    print(f"Ex41 — Overload Simulation (queue=20, worker=100 RPS):")
    print(f"  Received: {sim.stats['received']}, Processed: {sim.stats['processed']}, "
          f"Shed: {sim.stats['shed']} ({shed_rate:.1%})")

def ex42():
    """Cascading failure simulation — circuit breakers stop cascade"""
    class ServiceNode:
        def __init__(self, name, dependency=None, cb_threshold=3):
            self.name = name
            self.dependency = dependency
            self._failures = 0
            self.cb_threshold = cb_threshold
            self._state = "CLOSED"
            self.call_log = []
        def call(self):
            if self._state == "OPEN":
                self.call_log.append(f"{self.name}: circuit_open (cascade blocked)")
                return False
            if self.dependency:
                dep_ok = self.dependency.call()
                if not dep_ok:
                    self._failures += 1
                    if self._failures >= self.cb_threshold:
                        self._state = "OPEN"
                    self.call_log.append(f"{self.name}: dep_failed, failures={self._failures}")
                    return False
            self.call_log.append(f"{self.name}: ok")
            return True
    db = ServiceNode("db")
    model_svc = ServiceNode("model_service", dependency=db, cb_threshold=3)
    api = ServiceNode("api_gateway", dependency=model_svc, cb_threshold=3)
    # DB starts failing
    db._state = "OPEN"
    results = [api.call() for _ in range(8)]
    all_logs = db.call_log + model_svc.call_log + api.call_log
    print(f"Ex42 — Cascading Failure: {results.count(True)} OK, {results.count(False)} FAIL")
    print(f"  api state: {api._state}, model state: {model_svc._state}")
    for log in api.call_log[:4]:
        print(f"  {log}")

def ex43():
    """Chaos engineering — random failure injection"""
    class ChaosMiddleware:
        def __init__(self, failure_rate=0.05, latency_spike_rate=0.10,
                     latency_spike_ms=500):
            self.failure_rate = failure_rate
            self.latency_spike_rate = latency_spike_rate
            self.latency_spike_ms = latency_spike_ms
            self.injected_failures = 0
            self.injected_latencies = 0
            self.total = 0
        def handle(self, request_id):
            self.total += 1
            r = rng.random()
            if r < self.failure_rate:
                self.injected_failures += 1
                raise RuntimeError(f"[CHAOS] Injected failure on {request_id}")
            if r < self.failure_rate + self.latency_spike_rate:
                self.injected_latencies += 1
                time.sleep(self.latency_spike_ms / 1000 * 0.1)  # scaled for test
                return f"slow_{request_id}"
            return f"ok_{request_id}"
    chaos = ChaosMiddleware(failure_rate=0.05, latency_spike_rate=0.10)
    successes, failures, slow = 0, 0, 0
    for i in range(200):
        try:
            r = chaos.handle(f"req_{i}")
            if "slow" in r: slow += 1
            else: successes += 1
        except RuntimeError:
            failures += 1
    print(f"Ex43 — Chaos Engineering (200 requests, 5% fail, 10% slow):")
    print(f"  Success={successes}, Failures={failures} ({failures/200:.1%}), "
          f"Slow={slow} ({slow/200:.1%})")

def ex44():
    """Auto-scaling trigger logic — CPU threshold → scale decision"""
    class AutoScaler:
        def __init__(self, min_replicas=1, max_replicas=20,
                     scale_up_cpu=70, scale_down_cpu=30, cooldown_sec=60):
            self.min = min_replicas; self.max = max_replicas
            self.scale_up_threshold = scale_up_cpu
            self.scale_down_threshold = scale_down_cpu
            self.cooldown = cooldown_sec
            self.replicas = min_replicas
            self._last_scale = -cooldown_sec
            self.events = []
        def decide(self, avg_cpu_pct, now=None):
            if now is None: now = time.monotonic()
            if now - self._last_scale < self.cooldown:
                return self.replicas, "COOLDOWN"
            if avg_cpu_pct > self.scale_up_threshold and self.replicas < self.max:
                new_replicas = min(self.max, self.replicas * 2)
                action = f"SCALE_UP {self.replicas}→{new_replicas}"
                self.replicas = new_replicas; self._last_scale = now
                self.events.append(action)
                return self.replicas, action
            elif avg_cpu_pct < self.scale_down_threshold and self.replicas > self.min:
                new_replicas = max(self.min, self.replicas // 2)
                action = f"SCALE_DOWN {self.replicas}→{new_replicas}"
                self.replicas = new_replicas; self._last_scale = now
                self.events.append(action)
                return self.replicas, action
            return self.replicas, "NO_CHANGE"
    scaler = AutoScaler(min_replicas=2, max_replicas=16, cooldown_sec=0)
    cpu_readings = [20, 25, 75, 85, 90, 88, 82, 40, 25, 18, 15]
    print("Ex44 — AutoScaler:")
    for cpu in cpu_readings:
        replicas, action = scaler.decide(cpu)
        print(f"  CPU={cpu:3d}% → {action}, replicas={replicas}")

def ex45():
    """Kubernetes HPA manifest with custom ML metrics"""
    manifest = """Ex45 — Kubernetes HPA with Custom ML Metrics (YAML):
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-api-hpa
  namespace: ml-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fraud-classifier
  minReplicas: 2
  maxReplicas: 50
  metrics:
  # Standard CPU metric
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  # Custom: requests per second (from Prometheus)
  - type: External
    external:
      metric:
        name: ml_api_requests_per_second
        selector:
          matchLabels:
            model: fraud-classifier
      target:
        type: AverageValue
        averageValue: "100"
  # Custom: inference queue depth
  - type: External
    external:
      metric:
        name: ml_inference_queue_depth
      target:
        type: Value
        value: "50"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300"""
    print(manifest)

def ex46():
    """Service mesh concept — Istio VirtualService YAML"""
    yaml_str = """Ex46 — Istio VirtualService for ML API:
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: fraud-classifier-vs
  namespace: ml-production
spec:
  hosts:
  - fraud-classifier
  http:
  # Canary: 10% to new version
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: fraud-classifier
        subset: v2-1-0
  # Normal traffic split: 90% stable, 10% canary
  - route:
    - destination:
        host: fraud-classifier
        subset: v2-0-0
      weight: 90
    - destination:
        host: fraud-classifier
        subset: v2-1-0
      weight: 10
    retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: 5xx,gateway-error,connect-failure
    timeout: 5s
    fault:
      delay:
        percentage: {value: 0.1}
        fixedDelay: 5s  # chaos injection for testing
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: fraud-classifier-dr
spec:
  host: fraud-classifier
  trafficPolicy:
    connectionPool:
      tcp: {maxConnections: 100}
      http: {h2UpgradePolicy: UPGRADE, http1MaxPendingRequests: 1000}
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s"""
    print(yaml_str)

def ex47():
    """API gateway pattern — Kong/nginx config snippet"""
    config = """Ex47 — API Gateway Pattern (Kong declarative config):
_format_version: "3.0"

services:
  - name: fraud-classifier-service
    url: http://fraud-classifier.ml-production.svc.cluster.local:80
    connect_timeout: 5000
    read_timeout: 30000

routes:
  - name: predict-route
    service: fraud-classifier-service
    paths:
      - /api/v1/predict
    methods: [POST]
    plugins:
      - name: rate-limiting
        config:
          minute: 1000
          hour: 50000
          policy: redis
          redis_host: redis.infra.svc
      - name: jwt
        config:
          secret_is_base64: false
      - name: request-size-limiting
        config:
          allowed_payload_size: 1
      - name: prometheus
      - name: response-ratelimiting
        config:
          limits:
            sms: {minute: 20}

  - name: health-route
    service: fraud-classifier-service
    paths: [/health, /ready]
    methods: [GET]
    # No auth required for health checks"""
    print(config)

def ex48():
    """Multi-region failover logic — health check + redirect"""
    class MultiRegionFailover:
        def __init__(self, regions):
            self.regions = regions  # [{name, endpoint, priority, healthy}]
        def health_check(self, region):
            # Simulate: randomly fail some regions
            return rng.random() > 0.2
        def refresh_health(self):
            for r in self.regions:
                r["healthy"] = self.health_check(r["name"])
        def get_endpoint(self, user_region=None):
            healthy = sorted([r for r in self.regions if r["healthy"]],
                             key=lambda r: (r["name"] != user_region, r["priority"]))
            if not healthy:
                raise RuntimeError("All regions down")
            return healthy[0]
    regions = [
        {"name": "us-east-1", "endpoint": "https://us-east.api.com", "priority": 1, "healthy": True},
        {"name": "eu-west-1", "endpoint": "https://eu-west.api.com", "priority": 2, "healthy": True},
        {"name": "ap-se-1",   "endpoint": "https://ap-se.api.com",   "priority": 3, "healthy": True},
    ]
    fo = MultiRegionFailover(regions)
    fo.refresh_health()
    # Simulate us-east-1 down
    fo.regions[0]["healthy"] = False
    endpoint = fo.get_endpoint(user_region="us-east-1")
    healthy_names = [r["name"] for r in fo.regions if r["healthy"]]
    print(f"Ex48 — Multi-Region Failover:")
    print(f"  Healthy regions: {healthy_names}")
    print(f"  us-east-1 down → routed to: {endpoint['name']} ({endpoint['endpoint']})")

def ex49():
    """10K RPS architecture — print design with components"""
    design = """Ex49 — 10K RPS ML API Architecture:
  ┌─────────────────────────────────────────────────────────────────┐
  │                 10,000 RPS ML API ARCHITECTURE                  │
  ├──────────────────────────────────────────────────────────────── ┤
  │  [CLIENT]                                                        │
  │    Mobile / Web / Partner APIs (globally distributed)           │
  │         │                                                        │
  │  [CDN + WAF] (Cloudflare / AWS CloudFront)                      │
  │    DDoS protection, SSL termination, edge caching               │
  │         │                                                        │
  │  [API GATEWAY] (Kong / AWS API GW)                              │
  │    Rate limiting: 1000 RPS per client                           │
  │    Auth: JWT validation (cached in Redis)                       │
  │    Routing: /predict → ML cluster, /embed → embed cluster       │
  │         │                                                        │
  │  [LOAD BALANCER] (NLB / Nginx)                                  │
  │    20 ML API pods × 500 RPS each = 10K RPS capacity            │
  │    Algorithm: Least-connections                                  │
  │         │                                                        │
  │  [ML API LAYER] (FastAPI + Uvicorn, 20 replicas)               │
  │    Prediction cache (Redis, TTL=5min, hit rate ~60%)            │
  │    Request deduplication (fingerprint → dedup key)              │
  │    Batch collation: 8 requests per GPU forward pass             │
  │         │                                                        │
  │  [GPU INFERENCE] (10× A100, served via Triton Inference Server) │
  │    TensorRT optimized model: 2ms p50, 8ms p99                  │
  │    Dynamic batching: max_batch=32, max_delay=5ms                │
  │         │                                                        │
  │  [DATA LAYER]                                                    │
  │    Redis (cache + rate limit state): 3-node cluster, 12M ops/s │
  │    PostgreSQL (request logs): partitioned, async writes         │
  │    S3 (model artifacts): versioned, cross-region replicated     │
  ├─────────────────────────────────────────────────────────────────┤
  │  CAPACITY: 10K RPS sustained | 15K RPS burst (30s)             │
  │  LATENCY:  p50=5ms | p95=25ms | p99=80ms (end-to-end)         │
  │  COST:     ~$35,000/month (spot instances + reserved cache)     │
  └─────────────────────────────────────────────────────────────────┘"""
    print(design)

def ex50():
    """Production high-traffic ML API checklist — 25 items"""
    checklist = """Ex50 — Production High-Traffic ML API Checklist (25 Items):

  RATE LIMITING & PROTECTION:
   1. Token bucket rate limiter per client (burst allowance configured)
   2. Sliding window global rate limit (protect backend from storms)
   3. DDoS protection at CDN/WAF layer (Cloudflare / AWS Shield)
   4. Request size limits enforced at gateway (1MB max body)
   5. Circuit breakers on ALL downstream dependencies

  PERFORMANCE:
   6. p99 latency SLA defined and enforced in load tests (<100ms)
   7. Dynamic batching enabled on GPU inference servers (Triton)
   8. Connection pooling to all databases (no per-request connections)
   9. Async I/O throughout (FastAPI + asyncio, non-blocking Redis)
  10. CPU/GPU affinity set to prevent scheduling overhead

  CACHING:
  11. Prediction cache (LRU + TTL) for deterministic inputs
  12. Auth token validation cached in Redis (avoid DB per request)
  13. Feature lookup cached (30s TTL for slowly-changing features)
  14. Response caching at CDN for read-heavy endpoints

  RESILIENCE:
  15. Graceful degradation: fallback model if primary unavailable
  16. Load shedding configured (queue depth threshold)
  17. Priority queue: premium users served first under load
  18. Retry with exponential backoff + jitter (never fixed retry delay)
  19. Timeout set at EVERY network call (no unbounded waits)
  20. Health + readiness probes configured and tested

  OBSERVABILITY:
  21. Request tracing (OpenTelemetry) sampling at 1% in production
  22. Latency histogram (p50/p95/p99/p99.9) exported to Prometheus
  23. Error rate, throughput, queue depth dashboards in Grafana
  24. PagerDuty alerts for: error_rate > 1%, p99 > 200ms, queue > 80%

  OPERATIONS:
  25. Runbook documented: scale-up, rollback, incident response, drain"""
    print(checklist)


def main():
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print("Examples 5.5 — High-Traffic ML API Design")
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
