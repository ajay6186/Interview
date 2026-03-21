# ============================================================
# Exercise 5.2 — Async Inference & Request Batching
# ============================================================
# Topics:
#   • asyncio basics for ML (async/await, event loop)
#   • async FastAPI endpoints
#   • Request batching: collect N requests, batch infer together
#   • Dynamic batching (fill a batch within a timeout window)
#   • asyncio.Queue for request buffering
#   • Concurrent inference simulation
#   • Async model loading (startup)
#   • Background tasks in FastAPI
#   • Performance benchmarking: serial vs concurrent vs batched
# ============================================================

import asyncio
import time
import numpy as np
from typing import Any


# ---------------------------------------------------------------------------
# Simulated slow model inference (replace with real model.predict in prod)
# ---------------------------------------------------------------------------
INFERENCE_LATENCY_MS = 20  # simulate 20ms per batch inference call

async def fake_model_predict(batch: np.ndarray) -> np.ndarray:
    """Simulate async model inference with a fixed latency."""
    await asyncio.sleep(INFERENCE_LATENCY_MS / 1000)
    return np.random.rand(len(batch))


# ---------------------------------------------------------------------------
# TODO 1: Run a single inference request asynchronously
# Call fake_model_predict with a (1, n_features) array
# Return (result, latency_ms) tuple
# ---------------------------------------------------------------------------
async def infer_single(features: list) -> tuple:
    pass  # TODO: measure time, call fake_model_predict, return (result, latency_ms)


# ---------------------------------------------------------------------------
# TODO 2: Run N requests concurrently using asyncio.gather()
# Each request is an independent call to infer_single()
# Return list of (result, latency_ms) and total wall time
# Hint: asyncio.gather(*[infer_single(f) for f in feature_list])
# ---------------------------------------------------------------------------
async def infer_concurrent(feature_list: list) -> tuple:
    pass  # TODO: gather all coroutines, measure wall time


# ---------------------------------------------------------------------------
# TODO 3: Implement a simple manual batch inference
# Group requests into batches of batch_size, run each batch with one model call
# Return list of results and total wall time
# ---------------------------------------------------------------------------
async def infer_batched(feature_list: list, batch_size: int = 16) -> tuple:
    pass  # TODO: chunk feature_list, stack into numpy array, call fake_model_predict


# ---------------------------------------------------------------------------
# TODO 4: Implement a BatchProcessor class
# - Holds an asyncio.Queue of (features, future) pairs
# - A background worker loop drains the queue:
#     wait up to max_wait_ms OR until max_batch_size items accumulate
#     then run a single batch inference call
#     set the result on each future
# - Client coroutines call submit(features) and await the future
# ---------------------------------------------------------------------------
class BatchProcessor:
    def __init__(self, max_batch_size: int = 32, max_wait_ms: float = 10.0):
        self.max_batch_size = max_batch_size
        self.max_wait_ms    = max_wait_ms
        self.queue          = asyncio.Queue()
        self._task          = None

    async def start(self):
        pass  # TODO: launch the background worker as an asyncio task

    async def stop(self):
        pass  # TODO: cancel the background worker task

    async def submit(self, features: list) -> float:
        pass  # TODO: put (features, future) on queue, await the future

    async def _worker(self):
        pass  # TODO: drain queue, batch, infer, resolve futures


# ---------------------------------------------------------------------------
# TODO 5: Benchmark serial vs concurrent vs batched inference
# Run N requests with each approach and compare total time
# Return a dict: {"serial_ms": float, "concurrent_ms": float, "batched_ms": float}
# Serial: call infer_single() one at a time in a loop
# ---------------------------------------------------------------------------
async def benchmark_inference_strategies(
    n_requests: int = 50,
    n_features: int = 10,
) -> dict:
    pass  # TODO: implement all three strategies, measure each


# ---------------------------------------------------------------------------
# TODO 6: Write a FastAPI async predict endpoint as a string
# Use "async def predict(...)" with await for model inference
# Include a background task that logs the prediction asynchronously
# ---------------------------------------------------------------------------
def async_fastapi_endpoint_code() -> str:
    pass  # TODO: return endpoint code as a string


# ---------------------------------------------------------------------------
# TODO 7: Implement async model loading
# Simulate loading a large model file: await asyncio.sleep(0.5) then set a global
# Show how this avoids blocking the event loop during startup
# Return the "loaded model" object (can be a dict)
# ---------------------------------------------------------------------------
async def async_load_model(model_path: str) -> dict:
    pass  # TODO: simulate async model load, return model dict


# ---------------------------------------------------------------------------
# TODO 8: Implement a timeout-based dynamic batch collector
# Collect requests from a queue for up to max_wait_ms ms
# If max_batch_size is reached before the timeout, stop early
# Return the collected batch as a list of feature arrays
# ---------------------------------------------------------------------------
async def collect_batch(
    queue: asyncio.Queue,
    max_batch_size: int,
    max_wait_ms: float,
) -> list:
    pass  # TODO: poll queue with timeout, stop at size or timeout


# ---------------------------------------------------------------------------
# TODO 9: Compare throughput: serial vs batch processor
# Use BatchProcessor to process N_REQUESTS
# Measure requests per second for both approaches
# Return {"serial_rps": float, "batch_rps": float, "speedup": float}
# ---------------------------------------------------------------------------
async def compare_throughput(n_requests: int = 100) -> dict:
    pass  # TODO: benchmark serial and BatchProcessor throughput


def main():
    print("=== Exercise 5.2: Async Inference & Request Batching ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1", "infer_single()               — Single async inference with timing"),
        ("TODO 2", "infer_concurrent()           — N concurrent requests with gather()"),
        ("TODO 3", "infer_batched()              — Manual batch grouping"),
        ("TODO 4", "BatchProcessor              — Queue-based dynamic batcher class"),
        ("TODO 5", "benchmark_inference_strategies() — Serial vs concurrent vs batched"),
        ("TODO 6", "async_fastapi_endpoint_code()    — Async FastAPI endpoint string"),
        ("TODO 7", "async_load_model()           — Non-blocking model load"),
        ("TODO 8", "collect_batch()              — Timeout-based batch collector"),
        ("TODO 9", "compare_throughput()         — Serial vs BatchProcessor RPS"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("Key concepts:")
    print("  asyncio.gather() : run coroutines concurrently (not in parallel threads)")
    print("  asyncio.Queue    : thread-safe queue for producer-consumer patterns")
    print("  Dynamic batching : wait up to T ms, then process whatever arrived")
    print("  Batching benefit : amortize model overhead across N requests")
    print("  Rule of thumb    : batching improves GPU utilization from 30% to 90%+")


if __name__ == "__main__":
    main()
