# ============================================================
# Solution 5.2 — Async Inference & Request Batching
# ============================================================
#
# pip install numpy
# All asyncio code uses the standard library only.

import asyncio
import time
import numpy as np
from typing import Any, List


# ---------------------------------------------------------------------------
# Simulated slow model inference
# ---------------------------------------------------------------------------
INFERENCE_LATENCY_MS = 20

async def fake_model_predict(batch: np.ndarray) -> np.ndarray:
    await asyncio.sleep(INFERENCE_LATENCY_MS / 1000)
    return np.random.rand(len(batch))


# ---------------------------------------------------------------------------
# SOLUTION 1: Single async inference
# ---------------------------------------------------------------------------
async def infer_single(features: list) -> tuple:
    t0      = time.perf_counter()
    X       = np.array(features, dtype=np.float32).reshape(1, -1)
    results = await fake_model_predict(X)
    latency_ms = (time.perf_counter() - t0) * 1000
    return (float(results[0]), round(latency_ms, 3))


# ---------------------------------------------------------------------------
# SOLUTION 2: Concurrent inference with asyncio.gather
# ---------------------------------------------------------------------------
async def infer_concurrent(feature_list: list) -> tuple:
    """
    asyncio.gather() schedules all coroutines concurrently.
    They all start before the first await completes, so wall time ≈ single inference time
    rather than N × single inference time (serial).
    """
    t0          = time.perf_counter()
    coros       = [infer_single(f) for f in feature_list]
    results     = await asyncio.gather(*coros)
    wall_time_ms = (time.perf_counter() - t0) * 1000
    return results, round(wall_time_ms, 3)


# ---------------------------------------------------------------------------
# SOLUTION 3: Manual batch inference
# ---------------------------------------------------------------------------
async def infer_batched(feature_list: list, batch_size: int = 16) -> tuple:
    """
    Group N requests into chunks, run each chunk as a single model call.
    Better GPU utilization than one-by-one; fewer model calls than concurrent.
    """
    t0      = time.perf_counter()
    all_results = []

    for start in range(0, len(feature_list), batch_size):
        chunk = feature_list[start:start + batch_size]
        X     = np.array(chunk, dtype=np.float32)
        preds = await fake_model_predict(X)
        all_results.extend(preds.tolist())

    wall_time_ms = (time.perf_counter() - t0) * 1000
    return all_results, round(wall_time_ms, 3)


# ---------------------------------------------------------------------------
# SOLUTION 4: BatchProcessor — dynamic request batching
# ---------------------------------------------------------------------------
class BatchProcessor:
    """
    Client coroutines call submit(features) and await a result.
    A background worker collects requests into a batch and runs inference once.

    This is the foundation of production ML serving (TorchServe, Triton, vLLM
    all implement this pattern).
    """
    def __init__(self, max_batch_size: int = 32, max_wait_ms: float = 10.0):
        self.max_batch_size = max_batch_size
        self.max_wait_ms    = max_wait_ms
        self.queue: asyncio.Queue = None   # created in start() (event-loop-safe)
        self._task: asyncio.Task  = None

    async def start(self):
        self.queue = asyncio.Queue()
        self._task = asyncio.create_task(self._worker())

    async def stop(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def submit(self, features: list) -> float:
        """Put the request on the queue and wait for the worker to process it."""
        loop   = asyncio.get_event_loop()
        future = loop.create_future()
        await self.queue.put((features, future))
        return await future   # blocks until worker resolves the future

    async def _worker(self):
        """Background loop: drain the queue in batches."""
        while True:
            # ── Wait for at least one item ─────────────────────────────────
            batch_items = []
            try:
                first = await self.queue.get()
                batch_items.append(first)
            except asyncio.CancelledError:
                return

            # ── Collect more items up to max_batch_size within max_wait_ms ─
            deadline = time.perf_counter() + self.max_wait_ms / 1000
            while len(batch_items) < self.max_batch_size:
                remaining = deadline - time.perf_counter()
                if remaining <= 0:
                    break
                try:
                    item = await asyncio.wait_for(self.queue.get(), timeout=remaining)
                    batch_items.append(item)
                except asyncio.TimeoutError:
                    break

            # ── Run batch inference ────────────────────────────────────────
            features_list = [item[0] for item in batch_items]
            futures       = [item[1] for item in batch_items]

            try:
                X       = np.array(features_list, dtype=np.float32)
                results = await fake_model_predict(X)
                for i, fut in enumerate(futures):
                    if not fut.done():
                        fut.set_result(float(results[i]))
            except Exception as e:
                for fut in futures:
                    if not fut.done():
                        fut.set_exception(e)


# ---------------------------------------------------------------------------
# SOLUTION 5: Benchmark strategies
# ---------------------------------------------------------------------------
async def benchmark_inference_strategies(
    n_requests: int = 50,
    n_features: int = 10,
) -> dict:
    rng          = np.random.default_rng(42)
    feature_list = [rng.random(n_features).tolist() for _ in range(n_requests)]

    # Serial
    t0 = time.perf_counter()
    for f in feature_list:
        await infer_single(f)
    serial_ms = (time.perf_counter() - t0) * 1000

    # Concurrent
    _, concurrent_ms = await infer_concurrent(feature_list)

    # Batched (batch_size=16)
    _, batched_ms = await infer_batched(feature_list, batch_size=16)

    return {
        "n_requests":    n_requests,
        "serial_ms":     round(serial_ms, 1),
        "concurrent_ms": round(concurrent_ms, 1),
        "batched_ms":    round(batched_ms, 1),
        "concurrent_speedup": round(serial_ms / concurrent_ms, 1),
        "batched_speedup":    round(serial_ms / batched_ms, 1),
    }


# ---------------------------------------------------------------------------
# SOLUTION 6: Async FastAPI endpoint code
# ---------------------------------------------------------------------------
def async_fastapi_endpoint_code() -> str:
    return '''\
import asyncio
import time
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import numpy as np

app = FastAPI()
model = None   # loaded at startup

class PredictRequest(BaseModel):
    features: list[float]

class PredictResponse(BaseModel):
    prediction: float
    latency_ms: float

async def log_prediction_async(features: list, prediction: float):
    """Background task: non-blocking logging / storage."""
    await asyncio.sleep(0)  # yield to event loop
    print(f"[log] features={features[:3]}...  prediction={prediction:.4f}")

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest, background_tasks: BackgroundTasks):
    t0 = time.perf_counter()

    # await the async model call — does NOT block the event loop
    X      = np.array(request.features, dtype=np.float32).reshape(1, -1)
    result = await model.predict_async(X)          # your async model wrapper
    pred   = float(result[0])
    latency_ms = (time.perf_counter() - t0) * 1000

    # Schedule logging without waiting for it to complete
    background_tasks.add_task(log_prediction_async, request.features, pred)

    return PredictResponse(prediction=pred, latency_ms=round(latency_ms, 3))

@app.on_event("startup")
async def startup():
    global model
    model = await async_load_model("models/model.pkl")
'''


# ---------------------------------------------------------------------------
# SOLUTION 7: Async model loading
# ---------------------------------------------------------------------------
async def async_load_model(model_path: str) -> dict:
    """
    In production, use asyncio.to_thread() to run blocking joblib.load()
    in a thread pool without blocking the event loop.
    """
    print(f"  Loading model from {model_path} (async)...")
    # Simulate I/O-bound file reading
    await asyncio.sleep(0.1)
    # In real code: model = await asyncio.to_thread(joblib.load, model_path)
    model = {
        "type":    "GradientBoostingClassifier",
        "version": "1.0.0",
        "path":    model_path,
        "loaded_at": time.time(),
    }
    print(f"  Model loaded: {model['type']} v{model['version']}")
    return model


# ---------------------------------------------------------------------------
# SOLUTION 8: Timeout-based batch collector
# ---------------------------------------------------------------------------
async def collect_batch(
    queue: asyncio.Queue,
    max_batch_size: int,
    max_wait_ms: float,
) -> list:
    """
    Collect items from the queue until max_batch_size is reached
    OR max_wait_ms elapses — whichever comes first.
    """
    batch    = []
    deadline = time.perf_counter() + max_wait_ms / 1000

    while len(batch) < max_batch_size:
        remaining = deadline - time.perf_counter()
        if remaining <= 0:
            break
        try:
            item = await asyncio.wait_for(queue.get(), timeout=remaining)
            batch.append(item)
        except asyncio.TimeoutError:
            break

    return batch


# ---------------------------------------------------------------------------
# SOLUTION 9: Compare throughput: serial vs BatchProcessor
# ---------------------------------------------------------------------------
async def compare_throughput(n_requests: int = 100) -> dict:
    rng          = np.random.default_rng(0)
    feature_list = [rng.random(10).tolist() for _ in range(n_requests)]

    # Serial
    t0 = time.perf_counter()
    for f in feature_list:
        await infer_single(f)
    serial_s   = time.perf_counter() - t0
    serial_rps = n_requests / serial_s

    # BatchProcessor
    processor = BatchProcessor(max_batch_size=32, max_wait_ms=15.0)
    await processor.start()

    t0 = time.perf_counter()
    await asyncio.gather(*[processor.submit(f) for f in feature_list])
    batch_s   = time.perf_counter() - t0
    batch_rps = n_requests / batch_s

    await processor.stop()

    return {
        "n_requests":  n_requests,
        "serial_rps":  round(serial_rps, 1),
        "batch_rps":   round(batch_rps, 1),
        "speedup":     round(batch_rps / serial_rps, 2),
    }


async def _run_demo():
    print("=== Solution 5.2: Async Inference & Request Batching ===\n")

    print("1. Single async inference:")
    result, latency = await infer_single([1.0, 2.0, 3.0])
    print(f"   result={result:.4f}  latency={latency:.1f}ms\n")

    N = 30
    print(f"2. Concurrent inference ({N} requests):")
    results, wall = await infer_concurrent([[float(i)] * 5 for i in range(N)])
    print(f"   wall_time={wall:.1f}ms  (vs serial ~{N * INFERENCE_LATENCY_MS}ms)\n")

    print(f"3. Manual batched inference ({N} requests, batch_size=8):")
    results, wall = await infer_batched([[float(i)] * 5 for i in range(N)], batch_size=8)
    n_batches = (N + 7) // 8
    print(f"   wall_time={wall:.1f}ms  ({n_batches} batches × ~{INFERENCE_LATENCY_MS}ms)\n")

    print("4. BatchProcessor demo (dynamic batching):")
    processor = BatchProcessor(max_batch_size=16, max_wait_ms=15.0)
    await processor.start()
    t0      = time.perf_counter()
    futures = [processor.submit([float(i)] * 5) for i in range(20)]
    results = await asyncio.gather(*futures)
    wall    = (time.perf_counter() - t0) * 1000
    await processor.stop()
    print(f"   20 requests via BatchProcessor: wall_time={wall:.1f}ms\n")

    print("5. Strategy benchmark (50 requests):")
    bench = await benchmark_inference_strategies(n_requests=50, n_features=8)
    print(f"   Serial     : {bench['serial_ms']:.0f} ms")
    print(f"   Concurrent : {bench['concurrent_ms']:.0f} ms  ({bench['concurrent_speedup']}× faster)")
    print(f"   Batched    : {bench['batched_ms']:.0f} ms  ({bench['batched_speedup']}× faster)\n")

    print("6. FastAPI async endpoint code:")
    print(async_fastapi_endpoint_code())

    print("7. Async model loading:")
    model = await async_load_model("models/model.pkl")
    print(f"   Loaded: {model['type']}\n")

    print("8. Queue-based batch collector demo:")
    q = asyncio.Queue()
    for i in range(5):
        await q.put(f"request_{i}")
    batch = await collect_batch(q, max_batch_size=3, max_wait_ms=5.0)
    print(f"   Collected batch: {batch}\n")

    print("9. Throughput comparison (100 requests):")
    throughput = await compare_throughput(n_requests=100)
    print(f"   Serial    : {throughput['serial_rps']:.0f} req/s")
    print(f"   Batch     : {throughput['batch_rps']:.0f} req/s  ({throughput['speedup']}× speedup)")


def main():
    asyncio.run(_run_demo())


if __name__ == "__main__":
    main()
