# ============================================================
# Solution 5.4 — ML Cost Optimization
# ============================================================
#
# pip install numpy
# Pure Python + numpy — no external ML libraries required.

import time
import hashlib
import numpy as np
from typing import Any


# ---------------------------------------------------------------------------
# SOLUTION 1: Quantization concept
# ---------------------------------------------------------------------------
def quantization_concept() -> dict:
    return {
        "description": (
            "Quantization reduces the numerical precision of model weights and activations "
            "from high-precision floats (FP32) to lower-precision formats (FP16, INT8, INT4). "
            "This shrinks model memory, increases inference speed, and reduces power consumption "
            "at the cost of a small accuracy drop."
        ),
        "types": {
            "FP32": "32-bit float — default training precision. 4 bytes/param. Highest accuracy.",
            "FP16": "16-bit float (half precision). 2 bytes/param. ~2× smaller, ~2× faster on modern GPUs. Near-identical accuracy.",
            "BF16": "16-bit bfloat. Same exponent range as FP32, lower mantissa. Preferred for LLM training.",
            "INT8": "8-bit integer. 1 byte/param. ~4× smaller, ~3× faster. ~0.5-1% accuracy drop for most models.",
            "INT4": "4-bit integer. 0.5 bytes/param. ~8× smaller. Used in GPTQ, AWQ for LLM serving. ~2-3% accuracy drop.",
        },
        "memory_comparison": (
            "A 7B parameter model: "
            "FP32=28GB, FP16=14GB, INT8=7GB, INT4=3.5GB"
        ),
        "speed_improvement": (
            "Typical speedups over FP32 on GPU: "
            "FP16=1.5-2×, INT8=3-4×, INT4=6-8×. "
            "Speedup depends on hardware (A100 has INT8 tensor cores)."
        ),
        "accuracy_impact": (
            "For classification: < 0.5% accuracy drop with INT8 post-training quantization. "
            "For generation (LLMs): minor quality degradation, invisible to most users. "
            "Quantization-aware training (QAT) recovers most accuracy."
        ),
        "when_to_use": [
            "Serving on edge devices / mobile (INT8 or INT4)",
            "LLM serving with limited GPU memory (INT8 / GPTQ)",
            "High-throughput inference where GPU memory is the bottleneck",
            "Cost reduction: fit 2× larger model on same GPU (INT8 vs FP32)",
        ],
    }


# ---------------------------------------------------------------------------
# SOLUTION 2: Quantization memory savings
# ---------------------------------------------------------------------------
def quantization_memory_savings(n_parameters: int) -> dict:
    fp32_bytes = n_parameters * 4
    fp16_bytes = n_parameters * 2
    int8_bytes = n_parameters * 1

    def to_mb(b): return round(b / 1e6, 2)

    return {
        "n_parameters":   n_parameters,
        "FP32_MB":        to_mb(fp32_bytes),
        "FP16_MB":        to_mb(fp16_bytes),
        "INT8_MB":        to_mb(int8_bytes),
        "FP16_vs_FP32":   "50.0% reduction (2×)",
        "INT8_vs_FP32":   "75.0% reduction (4×)",
        "FP16_reduction": f"{to_mb(fp32_bytes - fp16_bytes)} MB saved ({100*(1-0.5):.0f}%)",
        "INT8_reduction": f"{to_mb(fp32_bytes - int8_bytes)} MB saved ({100*(1-0.25):.0f}%)",
    }


# ---------------------------------------------------------------------------
# SOLUTION 3: Knowledge distillation
# ---------------------------------------------------------------------------
def knowledge_distillation_concept() -> dict:
    return {
        "description": (
            "Knowledge distillation trains a small 'student' model to mimic "
            "the outputs of a large 'teacher' model. The student learns from the "
            "teacher's soft probability outputs (logits) rather than hard labels, "
            "which carry more information (the teacher's uncertainty)."
        ),
        "teacher_model": (
            "A large, high-accuracy model (e.g., GPT-4, BERT-Large). "
            "Never deployed — only used to generate training signal."
        ),
        "student_model": (
            "A small, fast model (e.g., DistilBERT: 40% smaller, 60% faster, 97% BERT accuracy). "
            "This is the model that gets deployed."
        ),
        "training_objective": (
            "Loss = α × cross_entropy(student_logits, hard_labels) "
            "     + (1-α) × KL_divergence(student_softmax, teacher_softmax) "
            "The KL term forces the student to match the teacher's probability distribution."
        ),
        "typical_compression": (
            "DistilBERT: BERT → 66M params (40% fewer), 40% faster, 97% MNLI accuracy. "
            "TinyBERT: 4× smaller, 9× faster, 96% BERT accuracy. "
            "PaLM 2 Gecko: 30× smaller than PaLM 2, near-equivalent on many tasks."
        ),
        "use_cases": [
            "Edge deployment (mobile, IoT)",
            "Cost reduction in production serving",
            "Regulatory environments requiring smaller models",
            "Real-time applications where latency is critical",
        ],
    }


# ---------------------------------------------------------------------------
# SOLUTION 4: InferenceCache
# ---------------------------------------------------------------------------
class InferenceCache:
    def __init__(self, ttl_seconds: float = 300.0, max_size: int = 10_000):
        self.ttl      = ttl_seconds
        self.max_size = max_size
        self.cache: dict = {}   # key -> {"result": Any, "ts": float}
        self.hits   = 0
        self.misses = 0

    def _make_key(self, features: list) -> str:
        serialised = ",".join(f"{v:.6f}" if isinstance(v, float) else str(v)
                              for v in features)
        return hashlib.md5(serialised.encode()).hexdigest()

    def get(self, features: list) -> tuple:
        key = self._make_key(features)
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["ts"] <= self.ttl:
                self.hits += 1
                return entry["result"], True
            else:
                del self.cache[key]    # expired
        self.misses += 1
        return None, False

    def set(self, features: list, result: Any) -> None:
        if len(self.cache) >= self.max_size:
            # Evict the oldest entry (simple FIFO)
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        key = self._make_key(features)
        self.cache[key] = {"result": result, "ts": time.time()}

    @property
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0


# ---------------------------------------------------------------------------
# SOLUTION 5: RequestDeduplicator
# ---------------------------------------------------------------------------
class RequestDeduplicator:
    """
    Prevents duplicate in-flight requests from all calling the model.
    First request runs inference; duplicates wait and receive the same result.
    In production, implement with asyncio.Event or threading.Event.
    """
    def __init__(self):
        self.in_flight: dict = {}   # key -> result (None = still processing)

    def should_deduplicate(self, key: str) -> bool:
        return key in self.in_flight

    def register(self, key: str) -> None:
        self.in_flight[key] = None   # mark as in-flight, result pending

    def complete(self, key: str, result: Any) -> None:
        self.in_flight[key] = result

    def get_result(self, key: str) -> Any:
        return self.in_flight.get(key)

    def cleanup(self, key: str) -> None:
        self.in_flight.pop(key, None)


# ---------------------------------------------------------------------------
# SOLUTION 6: GPU cost calculator
# ---------------------------------------------------------------------------
def gpu_cost_calculator(
    n_requests_per_day: int,
    avg_latency_ms: float,
    gpu_price_per_hour: float = 3.00,
    n_gpus: int = 1,
) -> dict:
    """
    Assumes requests are processed serially on each GPU.
    In practice, batching reduces compute time; this is a conservative estimate.
    """
    # Total compute time needed per day (seconds)
    total_inference_seconds = (n_requests_per_day * avg_latency_ms) / 1000

    # With n_gpus processing in parallel
    compute_seconds_per_day = total_inference_seconds / n_gpus

    # Convert to GPU-hours (each GPU runs for this many hours)
    compute_hours_per_day = compute_seconds_per_day / 3600

    daily_cost    = compute_hours_per_day * gpu_price_per_hour * n_gpus
    monthly_cost  = daily_cost * 30
    cost_per_1k   = (daily_cost / n_requests_per_day) * 1000

    return {
        "n_requests_per_day":     n_requests_per_day,
        "avg_latency_ms":         avg_latency_ms,
        "n_gpus":                 n_gpus,
        "compute_hours_per_day":  round(compute_hours_per_day, 3),
        "daily_cost_usd":         round(daily_cost, 4),
        "monthly_cost_usd":       round(monthly_cost, 2),
        "cost_per_1k_requests_usd": round(cost_per_1k, 6),
        "gpu_price_per_hour":     gpu_price_per_hour,
    }


# ---------------------------------------------------------------------------
# SOLUTION 7: Pareto-optimal models
# ---------------------------------------------------------------------------
MODEL_OPTIONS = [
    {"name": "tiny",   "params_M": 7,    "accuracy": 0.82, "latency_ms": 5,   "memory_gb": 0.1},
    {"name": "small",  "params_M": 125,  "accuracy": 0.87, "latency_ms": 20,  "memory_gb": 0.5},
    {"name": "medium", "params_M": 350,  "accuracy": 0.91, "latency_ms": 50,  "memory_gb": 1.4},
    {"name": "large",  "params_M": 1300, "accuracy": 0.94, "latency_ms": 180, "memory_gb": 5.2},
    {"name": "xlarge", "params_M": 7000, "accuracy": 0.96, "latency_ms": 900, "memory_gb": 28},
]

def find_pareto_models(models: list) -> list:
    """
    A model is Pareto-optimal (on the accuracy–latency tradeoff) if no other model
    has BOTH strictly higher accuracy AND strictly lower latency.
    """
    pareto = []
    for candidate in models:
        dominated = False
        for other in models:
            if other is candidate:
                continue
            # 'other' dominates 'candidate' if it's better on BOTH axes
            if (other["accuracy"] >= candidate["accuracy"] and
                    other["latency_ms"] <= candidate["latency_ms"] and
                    (other["accuracy"] > candidate["accuracy"] or
                     other["latency_ms"] < candidate["latency_ms"])):
                dominated = True
                break
        if not dominated:
            pareto.append(candidate)
    return pareto


# ---------------------------------------------------------------------------
# SOLUTION 8: GPU utilization strategies
# ---------------------------------------------------------------------------
def gpu_utilization_strategies() -> dict:
    return {
        "problem": (
            "A GPU sitting at 30% utilization means you're paying for 70% idle capacity. "
            "Goal: push GPU utilization to 80%+ through smarter batching and scheduling."
        ),
        "strategies": [
            {
                "name":           "Request Batching",
                "description":    "Collect multiple requests and run them as a single batch on the GPU.",
                "improvement":    "GPU utilization from 30% → 80%+. Throughput 5-10× higher.",
                "implementation": "asyncio.Queue-based BatchProcessor or Triton dynamic batching.",
            },
            {
                "name":           "Model Parallelism (Tensor Parallelism)",
                "description":    "Split a large model across multiple GPUs (each GPU holds part of each layer).",
                "improvement":    "Enables models larger than single-GPU memory. ~Linear throughput scaling.",
                "implementation": "PyTorch DeviceMesh, Megatron-LM, vLLM tensor parallel.",
            },
            {
                "name":           "Pipeline Parallelism",
                "description":    "Different layers run on different GPUs simultaneously (like an assembly line).",
                "improvement":    "Reduces idle time (bubble fraction) for large batch training.",
                "implementation": "GPipe, PipeDream, DeepSpeed pipeline stages.",
            },
            {
                "name":           "Mixed Precision Inference (FP16/BF16)",
                "description":    "Use FP16 Tensor Cores which have 2× arithmetic throughput vs FP32.",
                "improvement":    "1.5-2× inference throughput. 2× memory → larger batch fits in GPU.",
                "implementation": "torch.autocast('cuda'), TensorRT FP16 mode.",
            },
            {
                "name":           "Continuous Batching (for LLMs)",
                "description":    "Add new requests to a running batch as slots free up (avoid waiting for fixed-size batch).",
                "improvement":    "GPU utilization from 40% → 90%+ for generative models.",
                "implementation": "vLLM, TGI (Text Generation Inference), Triton with custom scheduler.",
            },
            {
                "name":           "Kernel Fusion / Compiled Ops",
                "description":    "Fuse multiple GPU operations into one kernel call (fewer launches, less memory traffic).",
                "improvement":    "1.2-2× latency reduction for small operations.",
                "implementation": "torch.compile(), FlashAttention, xFormers memory-efficient attention.",
            },
        ],
    }


# ---------------------------------------------------------------------------
# SOLUTION 9: Spot instance strategy
# ---------------------------------------------------------------------------
def spot_instance_strategy() -> dict:
    return {
        "what_are_spot_instances": (
            "Spot (AWS) / Preemptible (GCP) / Low-Priority (Azure) instances "
            "are spare cloud capacity sold at a 60-90% discount. "
            "The cloud provider can reclaim them with 2-minute warning."
        ),
        "savings_percent":  "60-90% vs on-demand pricing",
        "risks": [
            "Instance can be interrupted at any time (2-minute notice on AWS)",
            "Interruption rate varies by instance type and region (0-10%/hour)",
            "If not checkpointing, hours of training can be lost",
        ],
        "mitigations": [
            "Checkpoint model weights every N steps (to S3/GCS)",
            "Use Spot Instance interruption hooks to save state before termination",
            "Mix Spot + On-demand (e.g., 80% Spot / 20% On-demand) for fault tolerance",
            "Use managed training services: AWS SageMaker Managed Spot Training",
            "Keep training jobs idempotent (can restart from latest checkpoint)",
        ],
        "checkpoint_strategy": (
            "Save checkpoint to S3 every 5-10 minutes. "
            "On restart, detect the latest checkpoint and resume training from that step. "
            "Expected loss from interruption: < 5 minutes of training work."
        ),
        "when_to_use": [
            "Model training (can checkpoint and resume)",
            "Batch inference jobs (retryable, not time-sensitive)",
            "Data preprocessing pipelines",
            "Hyperparameter search (each trial is independent)",
        ],
        "when_to_avoid": [
            "Real-time inference serving (can't afford unexpected downtime)",
            "Jobs that cannot be checkpointed or resumed",
            "Latency-sensitive workloads with SLA requirements",
        ],
    }


# ---------------------------------------------------------------------------
# SOLUTION 10: ROI analysis
# ---------------------------------------------------------------------------
def roi_analysis(
    development_cost: float,
    monthly_infra_cost: float,
    monthly_revenue_gain: float,
    monthly_cost_savings: float,
) -> dict:
    monthly_net_benefit = (monthly_revenue_gain + monthly_cost_savings) - monthly_infra_cost
    if monthly_net_benefit <= 0:
        months_to_breakeven = float("inf")
        recommendation      = "NEGATIVE ROI — system costs more than it saves. Consider descoping or choosing a cheaper model."
    else:
        months_to_breakeven = development_cost / monthly_net_benefit
        annual_roi = ((monthly_net_benefit * 12 - development_cost) / development_cost) * 100
        if annual_roi >= 200:
            recommendation = "STRONG ROI — excellent investment. Expand and scale."
        elif annual_roi >= 50:
            recommendation = "GOOD ROI — worthwhile project. Continue and optimize."
        else:
            recommendation = "MARGINAL ROI — consider cost reduction or revenue expansion."

    annual_roi = (
        ((monthly_net_benefit * 12 - development_cost) / development_cost) * 100
        if development_cost > 0 else float("inf")
    )

    return {
        "development_cost":      development_cost,
        "monthly_infra_cost":    monthly_infra_cost,
        "monthly_revenue_gain":  monthly_revenue_gain,
        "monthly_cost_savings":  monthly_cost_savings,
        "monthly_net_benefit":   round(monthly_net_benefit, 2),
        "months_to_breakeven":   round(months_to_breakeven, 1),
        "annual_roi_percent":    round(annual_roi, 1),
        "recommendation":        recommendation,
    }


# ---------------------------------------------------------------------------
# SOLUTION 11: Simulate cache benefit
# ---------------------------------------------------------------------------
def simulate_cache_benefit(
    n_requests: int = 1000,
    cache_hit_rate: float = 0.6,
    model_latency_ms: float = 20.0,
) -> dict:
    """
    Without cache: every request calls the model.
    With cache:    cache hits return instantly (0.1ms), misses call the model.
    """
    rng = np.random.default_rng(42)

    # Without cache: all N requests call the model
    without_cache_ms = n_requests * model_latency_ms

    # With cache: cache hits cost ~0.1ms, misses cost model_latency_ms
    n_hits   = int(n_requests * cache_hit_rate)
    n_misses = n_requests - n_hits
    with_cache_ms = (n_hits * 0.1) + (n_misses * model_latency_ms)

    speedup = without_cache_ms / with_cache_ms if with_cache_ms > 0 else float("inf")

    return {
        "n_requests":         n_requests,
        "cache_hit_rate":     cache_hit_rate,
        "model_latency_ms":   model_latency_ms,
        "without_cache_ms":   round(without_cache_ms, 1),
        "with_cache_ms":      round(with_cache_ms, 1),
        "speedup":            round(speedup, 2),
        "model_calls_saved":  n_hits,
        "cost_reduction_pct": round((1 - 1 / speedup) * 100, 1),
    }


def main():
    print("=== Solution 5.4: ML Cost Optimization ===\n")

    print("1. Quantization concepts:")
    q = quantization_concept()
    for ptype, desc in q["types"].items():
        print(f"   {ptype:6s}: {desc[:70]}...")
    print()

    print("2. Memory savings — 7B parameter model:")
    mem = quantization_memory_savings(7_000_000_000)
    print(f"   FP32: {mem['FP32_MB']:,.0f} MB")
    print(f"   FP16: {mem['FP16_MB']:,.0f} MB  ({mem['FP16_reduction']})")
    print(f"   INT8: {mem['INT8_MB']:,.0f} MB  ({mem['INT8_reduction']})")
    print()

    print("3. Knowledge distillation:")
    kd = knowledge_distillation_concept()
    print(f"   Description: {kd['description'][:80]}...")
    print(f"   Typical compression: {kd['typical_compression'][:80]}...")
    print()

    print("4. Inference cache simulation:")
    cache = InferenceCache(ttl_seconds=60.0)
    features = [1.0, 2.0, 3.0, 4.0]
    result, hit = cache.get(features)
    print(f"   First lookup → hit={hit}")
    cache.set(features, 0.95)
    result, hit = cache.get(features)
    print(f"   After set    → hit={hit}  result={result}")
    for _ in range(8):
        cache.get(features)
    print(f"   Hit rate: {cache.hit_rate:.2%}")
    print()

    print("5. GPU cost calculator:")
    cost = gpu_cost_calculator(
        n_requests_per_day=1_000_000,
        avg_latency_ms=25,
        gpu_price_per_hour=3.00,
        n_gpus=2,
    )
    print(f"   {cost['n_requests_per_day']:,} req/day × {cost['avg_latency_ms']}ms × {cost['n_gpus']} GPUs")
    print(f"   Compute hours/day : {cost['compute_hours_per_day']}")
    print(f"   Daily cost        : ${cost['daily_cost_usd']:.2f}")
    print(f"   Monthly cost      : ${cost['monthly_cost_usd']:.2f}")
    print(f"   Cost per 1k reqs  : ${cost['cost_per_1k_requests_usd']:.4f}")
    print()

    print("6. Pareto-optimal models (accuracy vs latency):")
    pareto = find_pareto_models(MODEL_OPTIONS)
    print(f"   {'Name':<8} {'Params(M)':>10} {'Accuracy':>10} {'Latency(ms)':>12}")
    print("   " + "-" * 44)
    for m in pareto:
        flag = " ← Pareto"
        print(f"   {m['name']:<8} {m['params_M']:>10,} {m['accuracy']:>10.2f} {m['latency_ms']:>12}")
    print(f"   Pareto front has {len(pareto)}/{len(MODEL_OPTIONS)} models")
    print()

    print("7. GPU utilization strategies (top 3):")
    strats = gpu_utilization_strategies()
    for s in strats["strategies"][:3]:
        print(f"   {s['name']}: {s['improvement']}")
    print()

    print("8. Spot instance strategy:")
    spot = spot_instance_strategy()
    print(f"   Savings: {spot['savings_percent']}")
    print(f"   Key risk: {spot['risks'][0]}")
    print(f"   Mitigation: {spot['mitigations'][0]}")
    print()

    print("9. ROI analysis:")
    roi = roi_analysis(
        development_cost=150_000,
        monthly_infra_cost=5_000,
        monthly_revenue_gain=20_000,
        monthly_cost_savings=8_000,
    )
    print(f"   Monthly net benefit: ${roi['monthly_net_benefit']:,.0f}")
    print(f"   Breakeven:           {roi['months_to_breakeven']:.1f} months")
    print(f"   Annual ROI:          {roi['annual_roi_percent']:.0f}%")
    print(f"   Recommendation:      {roi['recommendation']}")
    print()

    print("10. Cache benefit simulation:")
    sim = simulate_cache_benefit(n_requests=1000, cache_hit_rate=0.6, model_latency_ms=20.0)
    print(f"    Without cache: {sim['without_cache_ms']:,.0f} ms")
    print(f"    With cache   : {sim['with_cache_ms']:,.0f} ms ({sim['cache_hit_rate']:.0%} hit rate)")
    print(f"    Speedup      : {sim['speedup']}×  ({sim['cost_reduction_pct']}% cost reduction)")
    print(f"    Model calls saved: {sim['model_calls_saved']}/{sim['n_requests']}")


if __name__ == "__main__":
    main()
