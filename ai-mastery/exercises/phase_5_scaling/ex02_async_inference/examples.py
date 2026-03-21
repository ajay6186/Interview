# ============================================================
# Examples 5.2 — Async Inference & Request Batching (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import asyncio
import time
import random
import numpy as np
from collections import deque

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Sync vs async concept"""
    concept = """
Sync vs Async Inference:
  Sync:  request → model → response  (blocks thread while waiting)
  Async: request → await model → response  (releases thread while waiting)
  Benefit: 1 thread handles 100s of concurrent requests (I/O-bound tasks)
  Key rule: async shines when waiting for I/O (network, disk), not for CPU-bound ops
"""
    print(f"Ex01 — Sync vs Async:{concept}")

def ex02():
    """asyncio.sleep demo"""
    async def demo():
        t0 = time.time()
        await asyncio.sleep(0.01)
        elapsed = (time.time() - t0) * 1000
        return elapsed
    elapsed = asyncio.run(demo())
    print(f"Ex02 — asyncio.sleep(0.01): elapsed={elapsed:.1f}ms")

def ex03():
    """Async function definition"""
    async def greet(name):
        await asyncio.sleep(0)
        return f"Hello, {name}!"
    result = asyncio.run(greet("Model"))
    print(f"Ex03 — Async function: {result}")

def ex04():
    """Await keyword demonstration"""
    async def step_one():
        await asyncio.sleep(0)
        return 42

    async def pipeline():
        result = await step_one()
        return result * 2

    val = asyncio.run(pipeline())
    print(f"Ex04 — Await chain: {val}")

def ex05():
    """asyncio.run() entry point"""
    async def compute():
        data = list(range(10))
        total = sum(data)
        return total

    result = asyncio.run(compute())
    print(f"Ex05 — asyncio.run(): sum(0..9) = {result}")

def ex06():
    """Async model inference simulation"""
    async def fake_model_infer(input_id, latency_ms=10):
        await asyncio.sleep(latency_ms / 1000)
        return {"id": input_id, "score": round(random.uniform(0.1, 0.99), 3)}

    result = asyncio.run(fake_model_infer(input_id=7, latency_ms=5))
    print(f"Ex06 — Async inference simulation: {result}")

def ex07():
    """asyncio.gather for parallel tasks"""
    async def task(name, delay):
        await asyncio.sleep(delay)
        return f"{name} done"

    async def main():
        t0 = time.time()
        results = await asyncio.gather(
            task("A", 0.02), task("B", 0.02), task("C", 0.02)
        )
        elapsed = (time.time() - t0) * 1000
        return results, elapsed

    results, elapsed = asyncio.run(main())
    print(f"Ex07 — gather (3×20ms parallel): {results}, elapsed={elapsed:.0f}ms (not 60ms)")

def ex08():
    """asyncio.create_task"""
    async def main():
        async def work(n):
            await asyncio.sleep(0.01)
            return n * n

        task1 = asyncio.create_task(work(3))
        task2 = asyncio.create_task(work(4))
        r1, r2 = await task1, await task2
        return r1, r2

    r1, r2 = asyncio.run(main())
    print(f"Ex08 — create_task: 3²={r1}, 4²={r2}")

def ex09():
    """asyncio timeout"""
    async def slow_op():
        await asyncio.sleep(10)
        return "done"

    async def main():
        try:
            result = await asyncio.wait_for(slow_op(), timeout=0.05)
            return result
        except asyncio.TimeoutError:
            return "TimeoutError caught"

    result = asyncio.run(main())
    print(f"Ex09 — Timeout (0.05s on 10s task): {result}")

def ex10():
    """Async generator"""
    async def stream_tokens(text):
        for token in text.split():
            await asyncio.sleep(0.001)
            yield token

    async def main():
        tokens = []
        async for tok in stream_tokens("The quick brown fox"):
            tokens.append(tok)
        return tokens

    tokens = asyncio.run(main())
    print(f"Ex10 — Async generator tokens: {tokens}")

def ex11():
    """Async context manager"""
    class AsyncModelSession:
        async def __aenter__(self):
            await asyncio.sleep(0.001)  # simulate connection
            return self
        async def __aexit__(self, *args):
            await asyncio.sleep(0.001)  # simulate cleanup
        async def infer(self, x):
            return x * 2

    async def main():
        async with AsyncModelSession() as session:
            return await session.infer(21)

    result = asyncio.run(main())
    print(f"Ex11 — Async context manager: infer(21)={result}")

def ex12():
    """Async queue concept"""
    async def main():
        q = asyncio.Queue(maxsize=10)
        await q.put("request_1")
        await q.put("request_2")
        item1 = await q.get()
        item2 = await q.get()
        return item1, item2, q.qsize()

    i1, i2, size = asyncio.run(main())
    print(f"Ex12 — Async queue: got={i1}, {i2}, remaining={size}")

def ex13():
    """Event loop internals"""
    async def main():
        loop = asyncio.get_event_loop()
        loop_type = type(loop).__name__
        is_running = loop.is_running()
        return loop_type, is_running

    loop_type, running = asyncio.run(main())
    print(f"Ex13 — Event loop: type={loop_type}, is_running_inside_coro={running}")

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Concurrent requests simulation with asyncio.gather"""
    async def fake_infer(req_id, latency=0.02):
        await asyncio.sleep(latency)
        return {"req": req_id, "result": req_id * 10}

    async def main():
        t0 = time.time()
        tasks = [fake_infer(i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        elapsed = (time.time() - t0) * 1000
        return results, elapsed

    results, elapsed = asyncio.run(main())
    print(f"Ex14 — 10 concurrent requests (each 20ms): elapsed={elapsed:.0f}ms, results={[r['result'] for r in results]}")

def ex15():
    """Sequential vs parallel timing comparison"""
    async def job(ms):
        await asyncio.sleep(ms / 1000)
        return ms

    async def sequential(jobs):
        t0 = time.time()
        for j in jobs:
            await job(j)
        return (time.time() - t0) * 1000

    async def parallel(jobs):
        t0 = time.time()
        await asyncio.gather(*[job(j) for j in jobs])
        return (time.time() - t0) * 1000

    async def main():
        jobs = [20] * 5
        seq = await sequential(jobs)
        par = await parallel(jobs)
        return seq, par

    seq, par = asyncio.run(main())
    print(f"Ex15 — Sequential={seq:.0f}ms vs Parallel={par:.0f}ms (5×20ms tasks)")

def ex16():
    """Async batch collect (gather N items)"""
    async def fetch_embedding(text):
        await asyncio.sleep(0.005)
        return np.random.randn(64).astype(np.float32)

    async def batch_embed(texts):
        embeddings = await asyncio.gather(*[fetch_embedding(t) for t in texts])
        return np.stack(embeddings)

    texts = [f"sentence_{i}" for i in range(8)]
    matrix = asyncio.run(batch_embed(texts))
    print(f"Ex16 — Async batch embed: {len(texts)} texts → matrix shape={matrix.shape}")

def ex17():
    """asyncio.Queue for request buffering"""
    async def main():
        q = asyncio.Queue(maxsize=100)
        # producer
        for i in range(5):
            await q.put({"id": i, "data": f"input_{i}"})
        # consumer
        results = []
        while not q.empty():
            req = await q.get()
            results.append(req["id"])
            q.task_done()
        return results, q.qsize()

    results, remaining = asyncio.run(main())
    print(f"Ex17 — Async queue buffer: processed={results}, remaining={remaining}")

def ex18():
    """Producer-consumer pattern"""
    async def producer(queue, n):
        for i in range(n):
            await asyncio.sleep(0.002)
            await queue.put(i)
        await queue.put(None)  # sentinel

    async def consumer(queue, results):
        while True:
            item = await queue.get()
            if item is None:
                break
            results.append(item * 2)
            queue.task_done()

    async def main():
        q = asyncio.Queue()
        results = []
        await asyncio.gather(producer(q, 5), consumer(q, results))
        return results

    results = asyncio.run(main())
    print(f"Ex18 — Producer-consumer: {results}")

def ex19():
    """Async semaphore (limit concurrency)"""
    async def limited_infer(sem, req_id):
        async with sem:
            await asyncio.sleep(0.01)
            return req_id

    async def main():
        sem = asyncio.Semaphore(3)  # max 3 concurrent
        t0 = time.time()
        results = await asyncio.gather(*[limited_infer(sem, i) for i in range(9)])
        elapsed = (time.time() - t0) * 1000
        return results, elapsed

    results, elapsed = asyncio.run(main())
    print(f"Ex19 — Semaphore(3), 9 tasks×10ms: results={results}, elapsed={elapsed:.0f}ms (~30ms in 3 waves)")

def ex20():
    """Dynamic batching: collect up to N or wait T ms"""
    async def dynamic_batcher(queue, max_batch=4, timeout_ms=20):
        batch = []
        deadline = time.time() + timeout_ms / 1000
        while len(batch) < max_batch:
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            try:
                item = await asyncio.wait_for(queue.get(), timeout=remaining)
                batch.append(item)
            except asyncio.TimeoutError:
                break
        return batch

    async def main():
        q = asyncio.Queue()
        for i in range(3):  # only 3 items, less than max_batch=4
            await q.put(f"req_{i}")
        batch = await dynamic_batcher(q, max_batch=4, timeout_ms=30)
        return batch

    batch = asyncio.run(main())
    print(f"Ex20 — Dynamic batch (max=4, timeout=30ms): collected={batch} (flushed by timeout)")

def ex21():
    """Timeout per request"""
    async def infer_with_timeout(req_id, model_latency, timeout):
        try:
            await asyncio.wait_for(asyncio.sleep(model_latency), timeout=timeout)
            return {"id": req_id, "status": "ok"}
        except asyncio.TimeoutError:
            return {"id": req_id, "status": "timeout"}

    async def main():
        results = await asyncio.gather(
            infer_with_timeout(1, 0.01, 0.05),
            infer_with_timeout(2, 0.10, 0.05),  # will timeout
            infer_with_timeout(3, 0.02, 0.05),
        )
        return results

    results = asyncio.run(main())
    print(f"Ex21 — Per-request timeout: {results}")

def ex22():
    """Async retry logic"""
    async def unreliable_infer(req_id, fail_prob=0.6):
        await asyncio.sleep(0.005)
        if random.random() < fail_prob:
            raise ValueError("Model error")
        return f"result_{req_id}"

    async def retry(coro_fn, *args, max_retries=5):
        for attempt in range(max_retries):
            try:
                return await coro_fn(*args)
            except Exception as e:
                if attempt == max_retries - 1:
                    return f"failed_after_{max_retries}_retries"
        return None

    random.seed(42)
    result = asyncio.run(retry(unreliable_infer, 99, fail_prob=0.6, max_retries=5))
    print(f"Ex22 — Async retry (fail_prob=0.6, max=5): {result}")

def ex23():
    """Async circuit breaker"""
    class AsyncCircuitBreaker:
        def __init__(self, failure_threshold=3, reset_timeout=0.1):
            self.failures = 0
            self.threshold = failure_threshold
            self.reset_timeout = reset_timeout
            self.open_until = 0
            self.state = "closed"

        async def call(self, coro):
            if self.state == "open":
                if time.time() < self.open_until:
                    return "circuit_open"
                self.state = "half-open"
            try:
                result = await coro
                self.failures = 0
                self.state = "closed"
                return result
            except Exception:
                self.failures += 1
                if self.failures >= self.threshold:
                    self.state = "open"
                    self.open_until = time.time() + self.reset_timeout
                return "error"

    async def main():
        cb = AsyncCircuitBreaker(failure_threshold=2)
        async def fail():
            raise RuntimeError("fail")
        async def ok():
            return "ok"
        r1 = await cb.call(fail())
        r2 = await cb.call(fail())
        r3 = await cb.call(ok())   # circuit open
        return r1, r2, r3, cb.state

    results = asyncio.run(main())
    print(f"Ex23 — Circuit breaker: results={results[:3]}, state='{results[3]}'")

def ex24():
    """Rate limiter: token bucket (async)"""
    class AsyncTokenBucket:
        def __init__(self, rate, capacity):
            self.rate = rate
            self.capacity = capacity
            self.tokens = capacity
            self.last = time.time()

        async def acquire(self):
            now = time.time()
            self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
            self.last = now
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            await asyncio.sleep(1.0 / self.rate)
            self.tokens = 0
            return True

    async def main():
        bucket = AsyncTokenBucket(rate=100, capacity=5)
        results = []
        for _ in range(5):
            allowed = await bucket.acquire()
            results.append(allowed)
        return results

    results = asyncio.run(main())
    print(f"Ex24 — Token bucket rate limiter (5 requests): {results}")

def ex25():
    """Connection pool concept (async)"""
    class AsyncConnectionPool:
        def __init__(self, max_size=5):
            self._pool = asyncio.Queue(maxsize=max_size)
            self._max = max_size
            self._created = 0

        async def acquire(self):
            if not self._pool.empty():
                return await self._pool.get()
            if self._created < self._max:
                self._created += 1
                return f"conn_{self._created}"
            return await self._pool.get()  # wait

        async def release(self, conn):
            await self._pool.put(conn)

    async def main():
        pool = AsyncConnectionPool(max_size=3)
        c1 = await pool.acquire()
        c2 = await pool.acquire()
        await pool.release(c1)
        c3 = await pool.acquire()
        return c1, c2, c3, pool._created

    c1, c2, c3, created = asyncio.run(main())
    print(f"Ex25 — Connection pool: acquired={c1},{c2},{c3}, total_created={created}")

def ex26():
    """Async file I/O concept"""
    concept = """
Async File I/O with aiofiles:
  import aiofiles
  async def read_prompts(path):
      async with aiofiles.open(path, 'r') as f:
          content = await f.read()
      return content.splitlines()

  async def write_results(path, results):
      async with aiofiles.open(path, 'w') as f:
          for r in results:
              await f.write(json.dumps(r) + '\\n')

  # Can pipeline: read batch → infer batch → write batch
  # without blocking event loop on disk I/O
"""
    print(f"Ex26 — Async file I/O:{concept}")

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """AsyncBatchProcessor class"""
    class AsyncBatchProcessor:
        def __init__(self, batch_size=8, timeout_ms=50):
            self.batch_size = batch_size
            self.timeout_ms = timeout_ms
            self._queue = asyncio.Queue()

        async def submit(self, item):
            await self._queue.put(item)

        async def _fake_model(self, batch):
            await asyncio.sleep(0.005)
            return [x * 2 for x in batch]

        async def process_all(self):
            all_results = []
            while not self._queue.empty():
                batch = []
                while not self._queue.empty() and len(batch) < self.batch_size:
                    batch.append(await self._queue.get())
                results = await self._fake_model(batch)
                all_results.extend(results)
            return all_results

    async def main():
        bp = AsyncBatchProcessor(batch_size=4)
        for i in range(10):
            await bp.submit(i)
        return await bp.process_all()

    results = asyncio.run(main())
    print(f"Ex27 — AsyncBatchProcessor (batch=4, 10 items): {results}")

def ex28():
    """AsyncRequestQueue class"""
    class AsyncRequestQueue:
        def __init__(self, max_size=100):
            self._q = asyncio.Queue(maxsize=max_size)
            self._processed = 0

        async def enqueue(self, req):
            await self._q.put(req)

        async def dequeue(self):
            item = await self._q.get()
            self._q.task_done()
            self._processed += 1
            return item

        @property
        def depth(self):
            return self._q.qsize()

    async def main():
        rq = AsyncRequestQueue()
        for i in range(5):
            await rq.enqueue({"id": i})
        depth_before = rq.depth
        items = [await rq.dequeue() for _ in range(3)]
        return depth_before, rq.depth, rq._processed, [i["id"] for i in items]

    before, after, processed, ids = asyncio.run(main())
    print(f"Ex28 — AsyncRequestQueue: depth {before}→{after}, processed={processed}, ids={ids}")

def ex29():
    """AsyncModelServer class"""
    class AsyncModelServer:
        def __init__(self, max_concurrent=3):
            self._sem = asyncio.Semaphore(max_concurrent)
            self._total = 0

        async def infer(self, data):
            async with self._sem:
                await asyncio.sleep(0.01)
                self._total += 1
                return {"input": data, "output": data * 3, "req_num": self._total}

    async def main():
        server = AsyncModelServer(max_concurrent=3)
        t0 = time.time()
        results = await asyncio.gather(*[server.infer(i) for i in range(6)])
        elapsed = (time.time() - t0) * 1000
        return results, elapsed

    results, elapsed = asyncio.run(main())
    outputs = [r["output"] for r in results]
    print(f"Ex29 — AsyncModelServer (concurrency=3, 6 reqs): outputs={outputs}, elapsed={elapsed:.0f}ms")

def ex30():
    """Async inference pipeline (preprocess → infer → postprocess)"""
    async def preprocess(raw):
        await asyncio.sleep(0.002)
        return raw.strip().lower()

    async def infer(processed):
        await asyncio.sleep(0.005)
        return {"text": processed, "score": len(processed) / 100}

    async def postprocess(result):
        await asyncio.sleep(0.001)
        return {**result, "label": "positive" if result["score"] > 0.1 else "negative"}

    async def pipeline(raw):
        p = await preprocess(raw)
        r = await infer(p)
        return await postprocess(r)

    async def main():
        inputs = ["  Hello World  ", "Hi", "A long sentence that has many words in it"]
        return await asyncio.gather(*[pipeline(x) for x in inputs])

    results = asyncio.run(main())
    print(f"Ex30 — Async pipeline: {[(r['text'][:15], r['label']) for r in results]}")

def ex31():
    """Concurrent ML inference simulation"""
    async def ml_infer(request_id, dim=64):
        latency = random.uniform(0.005, 0.020)
        await asyncio.sleep(latency)
        vec = np.random.randn(dim).astype(np.float32)
        return {"id": request_id, "latency_ms": round(latency * 1000, 1), "norm": round(float(np.linalg.norm(vec)), 3)}

    async def main():
        random.seed(1)
        np.random.seed(1)
        t0 = time.time()
        results = await asyncio.gather(*[ml_infer(i) for i in range(20)])
        elapsed = (time.time() - t0) * 1000
        latencies = [r["latency_ms"] for r in results]
        return elapsed, min(latencies), max(latencies), np.mean(latencies)

    elapsed, mn, mx, avg = asyncio.run(main())
    print(f"Ex31 — 20 concurrent ML inferences: total={elapsed:.0f}ms, min={mn}ms, max={mx}ms, avg={avg:.1f}ms")

def ex32():
    """Async feature extraction"""
    async def extract_features(text):
        await asyncio.sleep(0.003)
        words = text.split()
        return {
            "length": len(text),
            "word_count": len(words),
            "embedding": np.random.randn(32).astype(np.float32)
        }

    async def main():
        texts = [f"Sample sentence number {i} with extra words" for i in range(5)]
        features = await asyncio.gather(*[extract_features(t) for t in texts])
        return [(f["word_count"], f["length"]) for f in features]

    stats = asyncio.run(main())
    print(f"Ex32 — Async feature extraction (5 texts): word_counts={[s[0] for s in stats]}")

def ex33():
    """Async preprocessing + inference pipeline"""
    async def preprocess_batch(texts):
        await asyncio.sleep(0.005)
        return [t.lower().split() for t in texts]

    async def embed_batch(token_lists):
        await asyncio.sleep(0.010)
        return np.random.randn(len(token_lists), 64).astype(np.float32)

    async def classify_batch(embeddings):
        await asyncio.sleep(0.005)
        scores = np.random.rand(len(embeddings))
        return (scores > 0.5).tolist()

    async def main():
        texts = [f"text example {i}" for i in range(6)]
        t0 = time.time()
        tokens = await preprocess_batch(texts)
        embeddings = await embed_batch(tokens)
        labels = await classify_batch(embeddings)
        elapsed = (time.time() - t0) * 1000
        return labels, elapsed

    labels, elapsed = asyncio.run(main())
    print(f"Ex33 — Async preprocess+embed+classify (6 items): labels={labels}, elapsed={elapsed:.0f}ms")

def ex34():
    """Async result streaming (generator)"""
    async def stream_inference(prompt, n_tokens=5):
        for i in range(n_tokens):
            await asyncio.sleep(0.005)
            yield f"token_{i}"

    async def main():
        tokens = []
        async for token in stream_inference("Generate something", n_tokens=5):
            tokens.append(token)
        return tokens

    tokens = asyncio.run(main())
    print(f"Ex34 — Streaming inference (async gen): {tokens}")

def ex35():
    """Async health monitoring"""
    class AsyncHealthMonitor:
        def __init__(self):
            self.checks = {}

        async def check(self, name, coro):
            try:
                result = await asyncio.wait_for(coro, timeout=0.05)
                self.checks[name] = {"status": "healthy", "value": result}
            except asyncio.TimeoutError:
                self.checks[name] = {"status": "timeout"}
            except Exception as e:
                self.checks[name] = {"status": "error", "msg": str(e)}

        @property
        def all_healthy(self):
            return all(v["status"] == "healthy" for v in self.checks.values())

    async def db_ping():
        await asyncio.sleep(0.01)
        return "pong"

    async def model_ping():
        await asyncio.sleep(0.02)
        return "ready"

    async def main():
        monitor = AsyncHealthMonitor()
        await asyncio.gather(monitor.check("db", db_ping()), monitor.check("model", model_ping()))
        return monitor.checks, monitor.all_healthy

    checks, healthy = asyncio.run(main())
    print(f"Ex35 — Health monitor: {[(k, v['status']) for k, v in checks.items()]}, all_healthy={healthy}")

def ex36():
    """Async worker pool"""
    async def worker(worker_id, job_queue, results):
        while True:
            try:
                job = job_queue.get_nowait()
                await asyncio.sleep(0.005)
                results.append((worker_id, job, job * job))
                job_queue.task_done()
            except asyncio.QueueEmpty:
                break

    async def main():
        q = asyncio.Queue()
        for i in range(10):
            await q.put(i)
        results = []
        workers = [asyncio.create_task(worker(wid, q, results)) for wid in range(3)]
        await asyncio.gather(*workers)
        return sorted(results, key=lambda x: x[1])

    results = asyncio.run(main())
    print(f"Ex36 — Worker pool (3 workers, 10 jobs): {[(wid, job, sq) for wid, job, sq in results[:5]]}...")

def ex37():
    """Async request deduplication"""
    class AsyncDeduplicator:
        def __init__(self):
            self._pending = {}

        async def get_or_compute(self, key, coro_fn):
            if key in self._pending:
                return await self._pending[key]
            fut = asyncio.ensure_future(coro_fn())
            self._pending[key] = fut
            result = await fut
            del self._pending[key]
            return result

    async def expensive_compute(x):
        await asyncio.sleep(0.010)
        return x ** 2

    async def main():
        dedup = AsyncDeduplicator()
        t0 = time.time()
        results = await asyncio.gather(
            dedup.get_or_compute("key_5", lambda: expensive_compute(5)),
            dedup.get_or_compute("key_5", lambda: expensive_compute(5)),  # deduped
            dedup.get_or_compute("key_7", lambda: expensive_compute(7)),
        )
        elapsed = (time.time() - t0) * 1000
        return results, elapsed

    results, elapsed = asyncio.run(main())
    print(f"Ex37 — Request deduplication: results={results}, elapsed={elapsed:.0f}ms (~10ms, not 30ms)")

def ex38():
    """Async caching layer"""
    class AsyncCache:
        def __init__(self, ttl_s=60):
            self._store = {}
            self._expiry = {}
            self.hits = 0
            self.misses = 0
            self.ttl = ttl_s

        async def get(self, key, compute_fn):
            if key in self._store and time.time() < self._expiry[key]:
                self.hits += 1
                return self._store[key]
            self.misses += 1
            value = await compute_fn()
            self._store[key] = value
            self._expiry[key] = time.time() + self.ttl
            return value

    async def slow_embed(text):
        await asyncio.sleep(0.010)
        return hash(text) % 1000

    async def main():
        cache = AsyncCache(ttl_s=60)
        texts = ["hello", "world", "hello", "hello", "world"]
        results = []
        for t in texts:
            r = await cache.get(t, lambda: slow_embed(t))
            results.append(r)
        return results, cache.hits, cache.misses

    results, hits, misses = asyncio.run(main())
    print(f"Ex38 — Async cache: results={results}, hits={hits}, misses={misses}")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Throughput benchmark: sync vs async"""
    async def async_infer(x):
        await asyncio.sleep(0.001)
        return x * 2

    async def run_async(n):
        t0 = time.time()
        await asyncio.gather(*[async_infer(i) for i in range(n)])
        return (time.time() - t0)

    def run_sync(n):
        t0 = time.time()
        for i in range(n):
            time.sleep(0.001)
        return (time.time() - t0)

    n = 50
    async_time = asyncio.run(run_async(n))
    sync_time = run_sync(n)
    speedup = sync_time / async_time
    print(f"Ex39 — Throughput benchmark ({n} tasks×1ms): sync={sync_time*1000:.0f}ms, async={async_time*1000:.0f}ms, speedup={speedup:.1f}×")

def ex40():
    """Latency percentiles (p50/p95/p99)"""
    async def variable_latency_infer(i):
        latency = np.random.exponential(scale=0.010)
        await asyncio.sleep(min(latency, 0.100))
        return latency * 1000

    async def main():
        np.random.seed(42)
        latencies = await asyncio.gather(*[variable_latency_infer(i) for i in range(200)])
        arr = np.array(latencies)
        return np.percentile(arr, [50, 95, 99])

    p50, p95, p99 = asyncio.run(main())
    print(f"Ex40 — Latency percentiles (200 requests): p50={p50:.1f}ms, p95={p95:.1f}ms, p99={p99:.1f}ms")

def ex41():
    """Load testing simulation with asyncio"""
    async def mock_api_call(req_id):
        latency = random.uniform(0.005, 0.030)
        await asyncio.sleep(latency)
        return latency * 1000

    async def load_test(rps, duration_s=0.2):
        interval = 1.0 / rps
        tasks = []
        start = time.time()
        req_id = 0
        while time.time() - start < duration_s:
            tasks.append(asyncio.create_task(mock_api_call(req_id)))
            req_id += 1
            await asyncio.sleep(interval)
        latencies = await asyncio.gather(*tasks)
        return len(latencies), np.mean(latencies), np.percentile(latencies, 99)

    random.seed(10)
    n, avg, p99 = asyncio.run(load_test(rps=100, duration_s=0.2))
    print(f"Ex41 — Load test (100 RPS, 200ms): requests={n}, avg={avg:.1f}ms, p99={p99:.1f}ms")

def ex42():
    """Adaptive batching: adjust batch size based on queue depth"""
    async def adaptive_batcher(queue, results):
        while True:
            depth = queue.qsize()
            if depth == 0:
                break
            batch_size = min(depth, max(1, depth // 2))
            batch = []
            for _ in range(batch_size):
                if queue.empty():
                    break
                batch.append(await queue.get())
            await asyncio.sleep(0.002)  # simulate processing
            results.append({"batch_size": len(batch), "items": batch})

    async def main():
        q = asyncio.Queue()
        for i in range(16):
            await q.put(i)
        results = []
        await adaptive_batcher(q, results)
        return [(r["batch_size"], r["items"]) for r in results]

    batches = asyncio.run(main())
    print(f"Ex42 — Adaptive batching (16 items): batch_sizes={[b[0] for b in batches]}")

def ex43():
    """Priority queue inference"""
    async def priority_infer(pq, results):
        while not pq.empty():
            priority, req_id = await pq.get()
            await asyncio.sleep(0.003)
            results.append((priority, req_id))

    async def main():
        pq = asyncio.PriorityQueue()
        requests = [(3, "low_1"), (1, "high_1"), (2, "med_1"), (1, "high_2"), (3, "low_2")]
        for prio, req in requests:
            await pq.put((prio, req))
        results = []
        await priority_infer(pq, results)
        return results

    results = asyncio.run(main())
    print(f"Ex43 — Priority queue inference (1=high): {results}")

def ex44():
    """Async inference with backpressure"""
    class BackpressureServer:
        def __init__(self, max_queue=5):
            self._q = asyncio.Queue(maxsize=max_queue)
            self.dropped = 0

        async def submit(self, req):
            try:
                self._q.put_nowait(req)
                return True
            except asyncio.QueueFull:
                self.dropped += 1
                return False

        async def drain(self):
            processed = []
            while not self._q.empty():
                item = await self._q.get()
                await asyncio.sleep(0.002)
                processed.append(item)
            return processed

    async def main():
        server = BackpressureServer(max_queue=5)
        accepted = sum(1 for i in range(10) if asyncio.get_event_loop().run_until_complete(server.submit(i)) if False)
        results_acc = []
        for i in range(10):
            ok = await server.submit(i)
            results_acc.append(ok)
        processed = await server.drain()
        return results_acc, server.dropped, len(processed)

    accepted, dropped, processed = asyncio.run(main())
    print(f"Ex44 — Backpressure (queue=5, 10 requests): accepted={accepted.count(True)}, dropped={dropped}, processed={processed}")

def ex45():
    """WebSocket streaming inference (concept + simulation)"""
    async def ws_stream_simulation():
        tokens = ["The", "model", "generates", "tokens", "one", "by", "one"]
        streamed = []
        for token in tokens:
            await asyncio.sleep(0.005)  # simulate token generation time
            streamed.append(token)
        return streamed

    concept = """
WebSocket Streaming Pattern:
  Client:  ws = await websockets.connect("ws://api/stream")
           await ws.send(json.dumps({"prompt": "Tell me..."}))
           async for message in ws:
               token = json.loads(message)["token"]
               print(token, end="", flush=True)
  Server:  async for token in model.generate_stream(prompt):
               await ws.send(json.dumps({"token": token}))
"""
    tokens = asyncio.run(ws_stream_simulation())
    print(f"Ex45 — WS streaming inference: tokens={tokens}\n{concept}")

def ex46():
    """gRPC async concept"""
    concept = """
gRPC Async Inference (concept):
  proto definition:
    service Predictor {
      rpc Predict (PredictRequest) returns (PredictResponse);
      rpc PredictStream (PredictRequest) returns (stream Token);
    }

  Python async client:
    async with grpc.aio.insecure_channel('localhost:50051') as channel:
        stub = PredictorStub(channel)
        response = await stub.Predict(PredictRequest(text="hello"))

  Advantages over REST:
    - Binary protocol (protobuf): 3-10× smaller payload
    - HTTP/2: multiplexing, header compression
    - Streaming: server-side, client-side, bidirectional
    - Latency: ~30% lower than JSON/REST at scale
"""
    print(f"Ex46 — gRPC async:{concept}")

def ex47():
    """Async inference with fallback"""
    async def primary_model(text):
        await asyncio.sleep(0.008)
        if random.random() < 0.4:
            raise RuntimeError("Primary model overloaded")
        return {"model": "primary", "result": f"primary_{text}"}

    async def fallback_model(text):
        await asyncio.sleep(0.003)
        return {"model": "fallback", "result": f"fallback_{text}"}

    async def infer_with_fallback(text, timeout=0.020):
        try:
            return await asyncio.wait_for(primary_model(text), timeout=timeout)
        except (RuntimeError, asyncio.TimeoutError):
            return await fallback_model(text)

    async def main():
        random.seed(5)
        texts = [f"text_{i}" for i in range(6)]
        results = await asyncio.gather(*[infer_with_fallback(t) for t in texts])
        from collections import Counter
        model_counts = Counter(r["model"] for r in results)
        return results[0], dict(model_counts)

    first, counts = asyncio.run(main())
    print(f"Ex47 — Inference with fallback: example={first}, model_usage={counts}")

def ex48():
    """Multi-model async router"""
    async def small_model(text):
        await asyncio.sleep(0.002)
        return {"model": "small", "score": 0.7}

    async def large_model(text):
        await asyncio.sleep(0.012)
        return {"model": "large", "score": 0.95}

    async def route(text, complexity_score):
        if complexity_score < 0.4:
            return await small_model(text)
        else:
            return await large_model(text)

    async def main():
        requests = [(f"text_{i}", random.uniform(0, 1)) for i in range(8)]
        random.seed(7)
        requests = [(f"text_{i}", random.uniform(0, 1)) for i in range(8)]
        results = await asyncio.gather(*[route(t, c) for t, c in requests])
        from collections import Counter
        return Counter(r["model"] for r in results)

    counts = asyncio.run(main())
    print(f"Ex48 — Multi-model router (threshold=0.4): {dict(counts)}")

def ex49():
    """Kubernetes HPA trigger metrics"""
    metrics = """
Kubernetes HPA for Async Inference Service:
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata:
    name: inference-hpa
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: inference-service
    minReplicas: 2
    maxReplicas: 20
    metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: External
      external:
        metric:
          name: queue_depth          # Custom metric from Prometheus
        target:
          type: AverageValue
          averageValue: "100"        # Scale when avg queue depth > 100
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
"""
    print(f"Ex49 — Kubernetes HPA:\n{metrics}")

def ex50():
    """Production async inference architecture"""
    arch = """
Production Async Inference Architecture:
  ┌──────────────┐    ┌──────────────────────────────────┐
  │  Client      │───▶│  API Gateway (rate limit, auth)   │
  └──────────────┘    └─────────────┬────────────────────┘
                                    │ HTTP/2 or WebSocket
                      ┌─────────────▼────────────────────┐
                      │  Async Inference Service           │
                      │  (FastAPI + asyncio, 4 workers)   │
                      │  ┌────────────────────────────┐   │
                      │  │ Request Queue (asyncio)    │   │
                      │  │ Dynamic Batcher (50ms win) │   │
                      │  │ Semaphore (concurrency=32) │   │
                      │  └────────────┬───────────────┘   │
                      └───────────────┼───────────────────┘
                                      │
                      ┌───────────────▼───────────────────┐
                      │  Model Server (Triton/TorchServe) │
                      │  GPU batch processing             │
                      └───────────────────────────────────┘
                                      │
                      ┌───────────────▼───────────────────┐
                      │  Result Cache (Redis, TTL=5min)   │
                      └───────────────────────────────────┘
  Key metrics: p50<10ms, p99<100ms, throughput>5000 RPS
"""
    print(f"Ex50 — Production async architecture:\n{arch}")

# ─── MAIN ───────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Examples 5.2 — Async Inference & Request Batching")
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
