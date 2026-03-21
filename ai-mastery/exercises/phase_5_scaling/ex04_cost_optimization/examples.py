# ============================================================
# Examples 5.4 — ML Cost Optimization (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import math
import json

rng = np.random.default_rng(42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """GPU cost calculator — hours × $/hr for common instance types"""
    instances = {
        "AWS p3.2xlarge  (V100 16GB)":  3.06,
        "AWS p4d.24xlarge (8×A100 80GB)": 32.77,
        "GCP n1-standard-8 + T4":        0.95,
        "GCP a2-highgpu-1g (A100 40GB)": 3.67,
        "Azure NC6s_v3 (V100 16GB)":     3.06,
    }
    hours = 72
    print(f"Ex01 — GPU Cost Calculator ({hours}h training run):")
    for name, rate in instances.items():
        total = rate * hours
        print(f"  {name}: ${rate:.2f}/hr × {hours}h = ${total:.2f}")

def ex02():
    """Token cost calculator — tokens × $/1K for popular models"""
    models = {
        "GPT-4o":          {"input": 0.005,  "output": 0.015},
        "GPT-4o-mini":     {"input": 0.00015,"output": 0.00060},
        "GPT-3.5-turbo":   {"input": 0.0005, "output": 0.0015},
        "Claude 3 Opus":   {"input": 0.015,  "output": 0.075},
        "Claude 3 Haiku":  {"input": 0.00025,"output": 0.00125},
    }
    input_tokens = 1500
    output_tokens = 500
    print(f"Ex02 — Token Cost ({input_tokens} in + {output_tokens} out tokens):")
    for name, pricing in models.items():
        cost = (input_tokens / 1000 * pricing["input"]) + (output_tokens / 1000 * pricing["output"])
        print(f"  {name:30s}: ${cost:.6f} per call")

def ex03():
    """Monthly cost from daily requests"""
    daily_requests = 50000
    cost_per_request = 0.000125  # $0.125 per 1000 requests
    days_per_month = 30
    monthly_total = daily_requests * cost_per_request * days_per_month
    annual_total = monthly_total * 12
    print(f"Ex03 — Monthly Cost from {daily_requests:,} daily requests:")
    print(f"  Cost/request : ${cost_per_request:.6f}")
    print(f"  Monthly      : ${monthly_total:,.2f}")
    print(f"  Annual       : ${annual_total:,.2f}")

def ex04():
    """Model memory usage — params × bytes"""
    models = {
        "BERT-base (110M params)":     110e6,
        "GPT-2 (1.5B params)":         1.5e9,
        "LLaMA-7B":                    7e9,
        "LLaMA-70B":                   70e9,
        "ResNet-50 (25M params)":      25e6,
    }
    print("Ex04 — Model Memory Requirements:")
    for name, params in models.items():
        fp32_gb = params * 4 / 1e9
        fp16_gb = params * 2 / 1e9
        int8_gb = params * 1 / 1e9
        print(f"  {name:40s}: FP32={fp32_gb:.2f}GB, FP16={fp16_gb:.2f}GB, INT8={int8_gb:.2f}GB")

def ex05():
    """Batch size vs throughput — numpy simulation"""
    batch_sizes = [1, 4, 8, 16, 32, 64, 128]
    base_latency_ms = 5.0   # base overhead
    per_item_ms = 0.8       # time per item in batch
    print("Ex05 — Batch Size vs Throughput:")
    for bs in batch_sizes:
        latency_ms = base_latency_ms + per_item_ms * bs * (1 - 0.6 * math.log(bs, 2) / 10)
        throughput = (bs / latency_ms) * 1000  # items/sec
        efficiency = throughput / (bs * (1000 / (base_latency_ms + per_item_ms)))
        print(f"  batch={bs:3d}: latency={latency_ms:.1f}ms, throughput={throughput:.0f} items/s, efficiency={efficiency:.2f}")

def ex06():
    """Inference cost per 1000 requests"""
    configs = {
        "GPU p3.2xlarge":    {"cost_per_hr": 3.06, "requests_per_hr": 72000},
        "GPU g4dn.xlarge":   {"cost_per_hr": 0.526, "requests_per_hr": 18000},
        "CPU c5.4xlarge":    {"cost_per_hr": 0.68, "requests_per_hr": 3600},
        "Lambda (serverless)": {"cost_per_hr": None, "cost_per_1k": 0.20},
    }
    print("Ex06 — Inference Cost per 1000 Requests:")
    for name, cfg in configs.items():
        if cfg.get("cost_per_1k"):
            cost = cfg["cost_per_1k"]
        else:
            cost = (cfg["cost_per_hr"] / cfg["requests_per_hr"]) * 1000
        print(f"  {name:30s}: ${cost:.4f} per 1K requests")

def ex07():
    """Training cost estimate — GPU hours × price"""
    experiments = [
        {"name": "BERT fine-tune (24h, 1×V100)", "gpu_hours": 24, "price_per_hr": 3.06},
        {"name": "GPT-2 fine-tune (72h, 4×A100)", "gpu_hours": 72 * 4, "price_per_hr": 3.67},
        {"name": "ResNet-50 ImageNet (12h, 8×V100)", "gpu_hours": 12 * 8, "price_per_hr": 3.06},
        {"name": "LLM from scratch (2880h, 512×A100)", "gpu_hours": 2880 * 512, "price_per_hr": 3.67},
    ]
    print("Ex07 — Training Cost Estimates:")
    for exp in experiments:
        cost = exp["gpu_hours"] * exp["price_per_hr"]
        print(f"  {exp['name']:50s}: ${cost:,.2f}")

def ex08():
    """Cloud instance comparison table"""
    table = """Ex08 — Cloud GPU Instance Comparison:
  ┌────────────────────────┬───────┬──────┬────────────┬──────────┐
  │ Instance               │ GPU   │ VRAM │ $/hr (on-d)│ $/hr spot│
  ├────────────────────────┼───────┼──────┼────────────┼──────────┤
  │ AWS p3.2xlarge         │ V100  │ 16GB │   $3.06    │  $0.92   │
  │ AWS p4d.24xlarge       │8×A100 │320GB │  $32.77    │  $9.83   │
  │ AWS g4dn.xlarge        │  T4   │ 16GB │   $0.526   │  $0.158  │
  │ GCP n1+T4              │  T4   │ 16GB │   $0.95    │  $0.29   │
  │ GCP a2-highgpu-1g      │ A100  │ 40GB │   $3.67    │  $1.10   │
  │ Azure NC6s_v3          │ V100  │ 16GB │   $3.06    │  $0.92   │
  │ Lambda Labs A100       │ A100  │ 80GB │   $1.10    │   N/A    │
  └────────────────────────┴───────┴──────┴────────────┴──────────┘"""
    print(table)

def ex09():
    """Spot instance savings — 70% discount calculation"""
    on_demand_rates = {
        "p3.2xlarge":     3.06,
        "p4d.24xlarge":  32.77,
        "g4dn.xlarge":    0.526,
        "a2-highgpu-1g":  3.67,
    }
    spot_discount = 0.70
    print(f"Ex09 — Spot Instance Savings ({spot_discount*100:.0f}% discount):")
    for inst, rate in on_demand_rates.items():
        spot_rate = rate * (1 - spot_discount)
        monthly_on_demand = rate * 24 * 30
        monthly_spot = spot_rate * 24 * 30
        saving = monthly_on_demand - monthly_spot
        print(f"  {inst:20s}: ${rate:.3f}/hr on-demand → ${spot_rate:.3f}/hr spot, saves ${saving:,.0f}/mo")

def ex10():
    """Reserved instance savings — 40% discount"""
    on_demand_monthly = {
        "p3.2xlarge (1yr RI)":    3.06 * 24 * 30,
        "g4dn.xlarge (1yr RI)":   0.526 * 24 * 30,
        "c5.4xlarge (1yr RI)":    0.68 * 24 * 30,
    }
    ri_discount = 0.40
    print(f"Ex10 — Reserved Instance Savings ({ri_discount*100:.0f}% discount):")
    for inst, monthly_od in on_demand_monthly.items():
        monthly_ri = monthly_od * (1 - ri_discount)
        annual_saving = (monthly_od - monthly_ri) * 12
        print(f"  {inst:35s}: OD=${monthly_od:,.0f}/mo → RI=${monthly_ri:,.0f}/mo, saves ${annual_saving:,.0f}/yr")

def ex11():
    """Cost per prediction formula"""
    def cost_per_prediction(instance_cost_hr, predictions_per_hour, overhead_factor=1.10):
        raw = instance_cost_hr / predictions_per_hour
        with_overhead = raw * overhead_factor
        return raw, with_overhead
    scenarios = [
        ("GPU API server (p3, 5K req/hr)", 3.06, 5000),
        ("GPU API server (p3, 50K req/hr)", 3.06, 50000),
        ("CPU API server (c5, 2K req/hr)", 0.34, 2000),
    ]
    print("Ex11 — Cost per Prediction:")
    for name, cost_hr, reqs_hr in scenarios:
        raw, total = cost_per_prediction(cost_hr, reqs_hr)
        print(f"  {name}: raw=${raw:.6f}, with overhead=${total:.6f} = ${total*1000:.4f} per 1K")

def ex12():
    """API vs self-hosted breakeven analysis"""
    api_cost_per_1k = 0.005  # OpenAI GPT-4o input pricing
    daily_requests = 100000
    daily_api_cost = (daily_requests / 1000) * api_cost_per_1k
    monthly_api_cost = daily_api_cost * 30
    self_hosted_monthly = {
        "GPU instance (p3.2xlarge, 1 server)": 3.06 * 24 * 30,
        "GPU instance (g4dn.xlarge, 3 servers)": 0.526 * 24 * 30 * 3,
        "Inference cluster (2×p3 + ops)": 3.06 * 24 * 30 * 2 + 2000,
    }
    print(f"Ex12 — API vs Self-Hosted Breakeven ({daily_requests:,} req/day):")
    print(f"  API (GPT-4o): ${monthly_api_cost:,.2f}/month")
    for name, cost in self_hosted_monthly.items():
        breakeven_reqs = cost / (api_cost_per_1k / 1000)
        flag = "SELF-HOST CHEAPER" if cost < monthly_api_cost else "API CHEAPER"
        print(f"  Self-host {name}: ${cost:,.2f}/mo → breakeven at {breakeven_reqs:,.0f} req/mo → {flag}")

def ex13():
    """Monthly budget planner"""
    budget = {
        "Training compute (EC2 spot)":     2400.00,
        "Inference (p3.2xl, reserved)":    1650.00,
        "Data storage (S3)":                320.00,
        "Data transfer (egress)":           180.00,
        "MLflow tracking server":            95.00,
        "Monitoring (Datadog)":             350.00,
        "API gateway + logging":            120.00,
        "Miscellaneous":                    200.00,
    }
    total = sum(budget.values())
    print("Ex13 — Monthly ML Budget Planner:")
    print(f"  {'Category':40s} {'Amount':>12s} {'% of Total':>12s}")
    print("  " + "-" * 66)
    for category, amount in sorted(budget.items(), key=lambda x: -x[1]):
        pct = amount / total * 100
        print(f"  {category:40s} ${amount:>10,.2f} {pct:>10.1f}%")
    print("  " + "-" * 66)
    print(f"  {'TOTAL':40s} ${total:>10,.2f}")

# ─── INTERMEDIATE (14–26) ────────────────────────────────────

def ex14():
    """INT8 quantization memory savings (4x reduction from FP32)"""
    model_sizes_fp32_gb = {"BERT-base": 0.44, "LLaMA-7B": 28.0, "LLaMA-70B": 280.0}
    print("Ex14 — INT8 Quantization Memory Savings:")
    for model, fp32_gb in model_sizes_fp32_gb.items():
        int8_gb = fp32_gb / 4
        saving_gb = fp32_gb - int8_gb
        print(f"  {model:15s}: FP32={fp32_gb:.2f}GB → INT8={int8_gb:.2f}GB, saved={saving_gb:.2f}GB (75%)")
    # Throughput impact
    throughput_ratio = rng.uniform(1.5, 2.0)
    print(f"  INT8 throughput uplift vs FP32: ~{throughput_ratio:.2f}x (hardware dependent)")

def ex15():
    """FP16 vs FP32 memory — 2x reduction"""
    param_counts = {"ResNet-50": 25e6, "BERT-base": 110e6, "GPT-2": 1.5e9}
    print("Ex15 — FP16 vs FP32 Memory Comparison:")
    for model, params in param_counts.items():
        fp32_gb = params * 4 / 1e9
        fp16_gb = params * 2 / 1e9
        gpu_vram_t4 = 16.0
        fits_fp16 = fp16_gb <= gpu_vram_t4
        fits_fp32 = fp32_gb <= gpu_vram_t4
        print(f"  {model:15s}: FP32={fp32_gb:.3f}GB (T4 fit:{fits_fp32}), FP16={fp16_gb:.3f}GB (T4 fit:{fits_fp16})")

def ex16():
    """Model pruning effect — sparsity → size reduction"""
    sparsity_levels = np.array([0.0, 0.3, 0.5, 0.7, 0.9])
    base_size_mb = 440  # BERT-base FP32
    # Sparse storage savings (approximate: linear for unstructured pruning)
    effective_sizes = base_size_mb * (1 - sparsity_levels * 0.85)  # 85% storage eff.
    base_accuracy = 0.921
    accuracy_drop = sparsity_levels * 0.15 * rng.uniform(0.5, 1.5, len(sparsity_levels))
    accuracies = base_accuracy - accuracy_drop
    print("Ex16 — Model Pruning Effect:")
    for sp, size, acc in zip(sparsity_levels, effective_sizes, accuracies):
        print(f"  sparsity={sp:.0%}: size={size:.0f}MB ({(1-size/base_size_mb):.0%} reduction), accuracy={max(acc, 0.80):.4f}")

def ex17():
    """Knowledge distillation — teacher → student size reduction"""
    teacher_params = 340e6  # BERT-large
    student_configs = [
        ("DistilBERT (6L/768H)", 66e6,  0.97),
        ("TinyBERT (4L/312H)",   14.5e6, 0.94),
        ("MobileBERT (24L/128H)", 25.3e6, 0.99),
        ("Custom tiny (2L/128H)", 4.4e6,  0.88),
    ]
    print(f"Ex17 — Knowledge Distillation (Teacher: {teacher_params/1e6:.0f}M params):")
    for name, params, perf_retention in student_configs:
        compression = teacher_params / params
        size_reduction = (1 - params / teacher_params) * 100
        speedup = compression * 0.6  # approximate inference speedup
        print(f"  {name:35s}: {params/1e6:.1f}M params, {compression:.1f}x compression, "
              f"perf={perf_retention:.0%}, ~{speedup:.1f}x faster")

def ex18():
    """Cache hit rate effect on cost"""
    total_requests_per_day = 200000
    cost_per_cache_miss = 0.002   # full model inference
    cost_per_cache_hit = 0.00001  # Redis lookup
    hit_rates = np.array([0.0, 0.20, 0.40, 0.60, 0.80, 0.95])
    print("Ex18 — Cache Hit Rate Effect on Daily Cost:")
    for hr in hit_rates:
        misses = total_requests_per_day * (1 - hr)
        hits = total_requests_per_day * hr
        daily_cost = misses * cost_per_cache_miss + hits * cost_per_cache_hit
        saving_vs_no_cache = (total_requests_per_day * cost_per_cache_miss) - daily_cost
        print(f"  hit_rate={hr:.0%}: daily_cost=${daily_cost:,.2f}, saving=${saving_vs_no_cache:,.2f}/day")

def ex19():
    """Request deduplication savings simulation"""
    rng2 = np.random.default_rng(10)
    n_requests = 100000
    duplicate_pct = 0.35
    cost_per_inference = 0.003
    unique_requests = int(n_requests * (1 - duplicate_pct))
    cost_without_dedup = n_requests * cost_per_inference
    cost_with_dedup = unique_requests * cost_per_inference + n_requests * 0.00001
    savings = cost_without_dedup - cost_with_dedup
    print(f"Ex19 — Request Deduplication ({duplicate_pct:.0%} duplicates):")
    print(f"  Total requests      : {n_requests:,}")
    print(f"  Unique requests     : {unique_requests:,}")
    print(f"  Cost without dedup  : ${cost_without_dedup:,.2f}")
    print(f"  Cost with dedup     : ${cost_with_dedup:,.2f}")
    print(f"  Daily savings       : ${savings:,.2f} ({savings/cost_without_dedup:.1%})")

def ex20():
    """Batching efficiency — cost per item: single vs batch"""
    overhead_ms = 8.0   # request overhead
    per_item_ms = 1.2   # marginal cost per item
    instance_cost_hr = 3.06
    batch_sizes = [1, 4, 8, 16, 32]
    print("Ex20 — Batching Efficiency (cost per item):")
    for bs in batch_sizes:
        latency_ms = overhead_ms + per_item_ms * bs
        items_per_sec = (bs / latency_ms) * 1000
        cost_per_item = instance_cost_hr / (items_per_sec * 3600)
        efficiency_gain = (1 / overhead_ms) / (1 / latency_ms * bs) if bs > 1 else 1.0
        print(f"  batch={bs:2d}: {items_per_sec:6.0f} items/s, cost/item=${cost_per_item:.6f}, "
              f"vs single: {(items_per_sec / (1000 / (overhead_ms + per_item_ms))):.2f}x faster")

def ex21():
    """Model selection by cost-quality Pareto frontier"""
    models = [
        {"name": "GPT-4o",          "quality": 0.96, "cost_per_1k": 5.00},
        {"name": "GPT-4o-mini",     "quality": 0.87, "cost_per_1k": 0.15},
        {"name": "Claude 3 Haiku",  "quality": 0.85, "cost_per_1k": 0.25},
        {"name": "LLaMA-3-8B",      "quality": 0.82, "cost_per_1k": 0.05},
        {"name": "LLaMA-3-70B",     "quality": 0.91, "cost_per_1k": 0.80},
        {"name": "Gemma-2B",        "quality": 0.74, "cost_per_1k": 0.02},
    ]
    # Pareto: not dominated (no model better in both quality AND cost)
    pareto = []
    for m in models:
        dominated = any(
            (o["quality"] >= m["quality"] and o["cost_per_1k"] <= m["cost_per_1k"] and o != m)
            for o in models
        )
        if not dominated:
            pareto.append(m)
    print("Ex21 — Cost-Quality Pareto Frontier:")
    for m in sorted(models, key=lambda x: x["cost_per_1k"]):
        on_pareto = m in pareto
        print(f"  {'★' if on_pareto else ' '} {m['name']:20s}: quality={m['quality']:.2f}, "
              f"cost=${m['cost_per_1k']:.2f}/1K {'← PARETO' if on_pareto else ''}")

def ex22():
    """Token reduction techniques comparison"""
    table = """Ex22 — Token Reduction Techniques:
  ┌───────────────────────────────┬──────────────┬──────────────────────────────┐
  │ Technique                     │ Token Savings│ Notes                        │
  ├───────────────────────────────┼──────────────┼──────────────────────────────┤
  │ Prompt compression (LLMLingua)│  30–70%      │ Some quality loss possible   │
  │ Retrieval-based (RAG trim)    │  20–50%      │ Include only top-k chunks    │
  │ Summary truncation            │  40–60%      │ Replace history with summary │
  │ Structured prompt templates   │  10–25%      │ Remove boilerplate           │
  │ Output length constraints     │  20–40%      │ max_tokens parameter         │
  │ Few-shot → zero-shot          │  15–30%      │ Remove examples if possible  │
  │ Model routing (small→large)   │  60–80%      │ Route easy queries to small  │
  └───────────────────────────────┴──────────────┴──────────────────────────────┘"""
    print(table)

def ex23():
    """Auto-scaling cost model — scale up/down simulation"""
    hourly_traffic = np.array([100, 150, 300, 800, 2000, 3500, 4800, 5200,
                                4600, 3800, 3200, 2800, 2500, 3000, 3500, 3800,
                                4000, 3600, 2800, 1800, 1000, 600, 300, 150])
    max_rps_per_instance = 500
    cost_per_instance_hr = 3.06
    min_instances = 1
    print("Ex23 — Auto-Scaling Cost Model (24h simulation):")
    total_cost = 0
    for hr, rps in enumerate(hourly_traffic):
        instances_needed = max(min_instances, math.ceil(rps / max_rps_per_instance))
        hourly_cost = instances_needed * cost_per_instance_hr
        total_cost += hourly_cost
        bar = "█" * min(instances_needed, 12)
        print(f"  Hour {hr:02d}: {rps:5.0f} rps, {instances_needed:2d} inst ({bar}), ${hourly_cost:.2f}")
    print(f"  Total daily cost: ${total_cost:.2f}")

def ex24():
    """Idle resource cost detection"""
    resources = [
        {"name": "training-gpu-1", "type": "p3.2xlarge", "cost_hr": 3.06, "utilization_pct": 5},
        {"name": "inference-gpu-2","type": "g4dn.xlarge", "cost_hr": 0.526,"utilization_pct": 82},
        {"name": "dev-notebook",   "type": "p3.2xlarge", "cost_hr": 3.06, "utilization_pct": 2},
        {"name": "staging-cpu-3",  "type": "c5.xlarge",  "cost_hr": 0.17, "utilization_pct": 12},
        {"name": "prod-cpu-1",     "type": "c5.4xlarge", "cost_hr": 0.68, "utilization_pct": 67},
    ]
    idle_threshold = 20
    print(f"Ex24 — Idle Resource Detection (threshold: <{idle_threshold}% utilization):")
    total_idle_cost_month = 0
    for r in resources:
        is_idle = r["utilization_pct"] < idle_threshold
        monthly_cost = r["cost_hr"] * 24 * 30
        if is_idle:
            total_idle_cost_month += monthly_cost
        flag = "⚠ IDLE" if is_idle else "ok"
        print(f"  {r['name']:20s} ({r['type']:14s}): {r['utilization_pct']:3d}% util, "
              f"${monthly_cost:6.0f}/mo → {flag}")
    print(f"  Total wasted on idle resources: ${total_idle_cost_month:,.0f}/month")

def ex25():
    """Rightsizing recommendation — current vs optimal GPU"""
    workloads = [
        {"name": "fraud_inference",  "vram_used_gb": 4.2,  "current": "V100 16GB ($3.06/hr)", "optimal": "T4 16GB ($0.53/hr)"},
        {"name": "bert_training",    "vram_used_gb": 13.8, "current": "V100 16GB ($3.06/hr)", "optimal": "V100 16GB ($3.06/hr)"},
        {"name": "gpt2_finetuning",  "vram_used_gb": 28.1, "current": "A100 40GB ($3.67/hr)", "optimal": "A100 40GB ($3.67/hr)"},
        {"name": "resnet_inference", "vram_used_gb": 1.8,  "current": "T4 16GB ($0.53/hr)",   "optimal": "CPU or Inf1 ($0.18/hr)"},
    ]
    print("Ex25 — Rightsizing Recommendations:")
    for w in workloads:
        same = w["current"] == w["optimal"]
        status = "OK" if same else "RIGHTSIZE →"
        print(f"  {w['name']:20s}: VRAM={w['vram_used_gb']:.1f}GB used")
        print(f"    Current : {w['current']}")
        if not same:
            print(f"    Optimal : {w['optimal']} {status}")

def ex26():
    """Cost per accuracy point tradeoff curve"""
    models_data = [
        ("tiny_bert", 76.2, 0.12),
        ("distilbert", 84.1, 0.28),
        ("bert_base", 88.5, 1.00),
        ("bert_large", 91.2, 2.80),
        ("deberta_base", 92.3, 1.50),
        ("gpt4o_mini", 90.8, 4.00),
        ("gpt4o", 95.1, 35.0),
    ]
    baseline_acc, baseline_cost = models_data[0]
    print("Ex26 — Cost vs Accuracy Tradeoff (cost per accuracy point gained vs baseline):")
    print(f"  {'Model':20s} {'Accuracy':>10s} {'Cost/1K':>10s} {'$/acc-pt':>12s}")
    print("  " + "-" * 56)
    for name, acc, cost_1k in models_data:
        acc_gain = acc - baseline_acc
        cost_per_acc_pt = cost_1k / max(acc_gain, 0.1)
        print(f"  {name:20s} {acc:>10.1f} {cost_1k:>10.2f} {cost_per_acc_pt:>12.3f}")

# ─── NESTED (27–38) ──────────────────────────────────────────

def ex27():
    """CostCalculator class — GPU/API/storage costs"""
    class CostCalculator:
        GPU_RATES = {"v100": 3.06, "a100_40": 3.67, "a100_80": 10.00, "t4": 0.526}
        API_RATES = {"gpt4o": 0.005, "gpt4o_mini": 0.00015, "claude_haiku": 0.00025}
        STORAGE_RATE_PER_GB_MONTH = 0.023  # S3 standard
        def gpu_cost(self, gpu_type, hours, n_gpus=1):
            rate = self.GPU_RATES.get(gpu_type, 0)
            return rate * hours * n_gpus
        def api_cost(self, model, input_tokens_k, output_tokens_k):
            rate = self.API_RATES.get(model, 0)
            return rate * (input_tokens_k + output_tokens_k * 3)  # output ~3x pricier avg
        def storage_cost(self, size_gb, months=1):
            return size_gb * self.STORAGE_RATE_PER_GB_MONTH * months
        def total_monthly(self, gpu_hours_by_type, api_calls_k, model, data_gb):
            gpu_total = sum(self.gpu_cost(g, h) for g, h in gpu_hours_by_type.items())
            api_total = self.api_cost(model, api_calls_k * 1.5, api_calls_k * 0.5)
            storage_total = self.storage_cost(data_gb)
            return {"gpu": round(gpu_total, 2), "api": round(api_total, 2),
                    "storage": round(storage_total, 2),
                    "total": round(gpu_total + api_total + storage_total, 2)}
    calc = CostCalculator()
    result = calc.total_monthly(
        gpu_hours_by_type={"v100": 720, "t4": 360},
        api_calls_k=500, model="gpt4o_mini", data_gb=2000
    )
    print(f"Ex27 — CostCalculator monthly breakdown: {result}")

def ex28():
    """CostOptimizer — find cheapest config for target latency"""
    class CostOptimizer:
        CONFIGS = [
            {"name": "CPU-only",      "cost_hr": 0.17, "latency_ms": 85,  "max_rps": 40},
            {"name": "T4-single",     "cost_hr": 0.526,"latency_ms": 18,  "max_rps": 200},
            {"name": "V100-single",   "cost_hr": 3.06, "latency_ms": 10,  "max_rps": 500},
            {"name": "A100-single",   "cost_hr": 3.67, "latency_ms": 6,   "max_rps": 900},
            {"name": "T4×2",          "cost_hr": 1.052,"latency_ms": 18,  "max_rps": 400},
            {"name": "V100×2",        "cost_hr": 6.12, "latency_ms": 10,  "max_rps": 1000},
        ]
        def optimize(self, target_latency_ms, target_rps):
            candidates = [c for c in self.CONFIGS
                          if c["latency_ms"] <= target_latency_ms and c["max_rps"] >= target_rps]
            if not candidates:
                return None
            return min(candidates, key=lambda c: c["cost_hr"])
    opt = CostOptimizer()
    scenarios = [(50, 100), (20, 300), (10, 800)]
    print("Ex28 — CostOptimizer Results:")
    for lat, rps in scenarios:
        best = opt.optimize(target_latency_ms=lat, target_rps=rps)
        if best:
            monthly = best["cost_hr"] * 24 * 30
            print(f"  Target: latency≤{lat}ms, RPS≥{rps} → {best['name']}: "
                  f"${best['cost_hr']:.3f}/hr, ${monthly:,.0f}/mo")
        else:
            print(f"  Target: latency≤{lat}ms, RPS≥{rps} → No config meets requirements")

def ex29():
    """ModelCostComparison — compare N models"""
    class ModelCostComparison:
        def __init__(self, monthly_requests):
            self.monthly_requests = monthly_requests
        def compare(self, models):
            results = []
            for m in models:
                monthly_cost = (self.monthly_requests / 1000) * m["cost_per_1k"]
                results.append({**m, "monthly_cost": round(monthly_cost, 2)})
            return sorted(results, key=lambda x: x["monthly_cost"])
        def print_table(self, results):
            print(f"  {'Model':25s} {'Quality':>8s} {'$/1K':>8s} {'$/month':>12s}")
            print("  " + "-" * 57)
            for r in results:
                print(f"  {r['name']:25s} {r['quality']:>8.2f} {r['cost_per_1k']:>8.4f} ${r['monthly_cost']:>10,.2f}")
    cmp = ModelCostComparison(monthly_requests=5_000_000)
    models = [
        {"name": "GPT-4o",         "quality": 0.96, "cost_per_1k": 5.00},
        {"name": "GPT-4o-mini",    "quality": 0.87, "cost_per_1k": 0.15},
        {"name": "Claude 3 Haiku", "quality": 0.85, "cost_per_1k": 0.25},
        {"name": "LLaMA-3-8B",     "quality": 0.82, "cost_per_1k": 0.05},
    ]
    results = cmp.compare(models)
    print(f"Ex29 — ModelCostComparison (5M requests/month):")
    cmp.print_table(results)

def ex30():
    """ROI calculator — savings vs implementation cost"""
    class ROICalculator:
        def __init__(self, implementation_cost, ongoing_monthly_cost):
            self.impl_cost = implementation_cost
            self.ongoing = ongoing_monthly_cost
        def calculate(self, monthly_savings, months=12):
            cumulative = []
            for m in range(1, months + 1):
                net = monthly_savings * m - self.ongoing * m - self.impl_cost
                cumulative.append(net)
            breakeven_month = next((m for m, net in enumerate(cumulative, 1) if net > 0), None)
            total_roi = cumulative[-1]
            roi_pct = total_roi / self.impl_cost * 100
            return {"breakeven_month": breakeven_month, "total_net": round(total_roi, 2),
                    "roi_pct": round(roi_pct, 1), "monthly_savings": monthly_savings}
    calc = ROICalculator(implementation_cost=25000, ongoing_monthly_cost=800)
    result = calc.calculate(monthly_savings=4500, months=12)
    print(f"Ex30 — ROI Calculator:")
    print(f"  Implementation cost : $25,000")
    print(f"  Monthly savings     : ${result['monthly_savings']:,}")
    print(f"  Monthly overhead    : $800")
    print(f"  Breakeven month     : {result['breakeven_month']}")
    print(f"  12-month net saving : ${result['total_net']:,}")
    print(f"  12-month ROI        : {result['roi_pct']}%")

def ex31():
    """CostMonitor — track spend over time"""
    class CostMonitor:
        def __init__(self, monthly_budget):
            self.budget = monthly_budget
            self.spend_log = []
        def record(self, date_str, amount, category):
            self.spend_log.append({"date": date_str, "amount": amount, "category": category})
        def total_spend(self):
            return sum(e["amount"] for e in self.spend_log)
        def by_category(self):
            cats = {}
            for e in self.spend_log:
                cats[e["category"]] = cats.get(e["category"], 0) + e["amount"]
            return cats
        def budget_status(self):
            spent = self.total_spend()
            remaining = self.budget - spent
            pct = spent / self.budget * 100
            return {"spent": round(spent, 2), "remaining": round(remaining, 2),
                    "pct_used": round(pct, 1), "over_budget": spent > self.budget}
    monitor = CostMonitor(monthly_budget=5000)
    entries = [
        ("2026-03-01", 1200, "gpu_training"), ("2026-03-05", 820, "inference"),
        ("2026-03-10", 340, "storage"), ("2026-03-15", 1100, "gpu_training"),
        ("2026-03-20", 680, "inference"), ("2026-03-21", 200, "monitoring"),
    ]
    for d, amt, cat in entries:
        monitor.record(d, amt, cat)
    status = monitor.budget_status()
    print(f"Ex31 — CostMonitor: spent=${status['spent']:,}, "
          f"remaining=${status['remaining']:,}, {status['pct_used']}% of budget used")
    print(f"  By category: {monitor.by_category()}")

def ex32():
    """BudgetAlert — alert when over threshold"""
    class BudgetAlert:
        def __init__(self, monthly_budget, alert_thresholds=(0.75, 0.90, 1.0)):
            self.budget = monthly_budget
            self.thresholds = sorted(alert_thresholds)
            self.fired_alerts = []
            self._current_spend = 0
        def add_spend(self, amount):
            self._current_spend += amount
            pct = self._current_spend / self.budget
            for t in self.thresholds:
                if pct >= t and t not in self.fired_alerts:
                    self.fired_alerts.append(t)
                    msg = (f"ALERT: Spent ${self._current_spend:,.2f} "
                           f"({pct:.1%} of ${self.budget:,} budget)")
                    print(f"  [{t:.0%} THRESHOLD] {msg}")
    alert = BudgetAlert(monthly_budget=5000)
    spends = [1000, 800, 600, 500, 700, 600, 400, 300]
    print("Ex32 — BudgetAlert ($5,000 budget):")
    for s in spends:
        alert.add_spend(s)
    print(f"  Total spend: ${alert._current_spend:,}")
    print(f"  Alerts fired at: {[f'{t:.0%}' for t in alert.fired_alerts]}")

def ex33():
    """CostAllocation — allocate by team/project"""
    class CostAllocation:
        def __init__(self):
            self.allocations = {}
        def record(self, team, project, resource_type, cost):
            key = (team, project)
            if key not in self.allocations:
                self.allocations[key] = {}
            self.allocations[key][resource_type] = self.allocations[key].get(resource_type, 0) + cost
        def report(self):
            total = sum(sum(v.values()) for v in self.allocations.values())
            print(f"  {'Team':15s} {'Project':20s} {'Total':>10s} {'%':>7s}")
            print("  " + "-" * 56)
            for (team, proj), costs in sorted(self.allocations.items()):
                t = sum(costs.values())
                print(f"  {team:15s} {proj:20s} ${t:>8,.2f} {t/total*100:>5.1f}%")
            print("  " + "-" * 56)
            print(f"  {'TOTAL':36s} ${total:>8,.2f}")
    alloc = CostAllocation()
    data = [
        ("data-science", "fraud_model_v2", "gpu", 1800),
        ("data-science", "fraud_model_v2", "api", 320),
        ("platform", "inference_cluster", "gpu", 2100),
        ("platform", "monitoring", "compute", 400),
        ("research", "llm_experiment", "gpu", 3200),
    ]
    for team, proj, rtype, cost in data:
        alloc.record(team, proj, rtype, cost)
    print("Ex33 — CostAllocation Report:")
    alloc.report()

def ex34():
    """InfrastructureCostBreakdown class"""
    class InfrastructureCostBreakdown:
        CATEGORIES = ["compute", "storage", "network", "monitoring", "licensing"]
        def __init__(self):
            self.costs = {c: 0.0 for c in self.CATEGORIES}
        def add(self, category, amount):
            self.costs[category] += amount
        def breakdown(self):
            total = sum(self.costs.values())
            return {k: {"amount": round(v, 2), "pct": round(v / total * 100, 1) if total else 0}
                    for k, v in self.costs.items()}
        def total(self):
            return round(sum(self.costs.values()), 2)
    breakdown = InfrastructureCostBreakdown()
    breakdown.add("compute", 3800); breakdown.add("storage", 420)
    breakdown.add("network", 280); breakdown.add("monitoring", 350); breakdown.add("licensing", 150)
    print(f"Ex34 — InfrastructureCostBreakdown: total=${breakdown.total():,.2f}")
    for cat, info in breakdown.breakdown().items():
        bar = "█" * int(info["pct"] / 5)
        print(f"  {cat:12s}: ${info['amount']:>8,.2f} ({info['pct']:5.1f}%) {bar}")

def ex35():
    """OptimizationRecommendationEngine class"""
    class OptimizationRecommendationEngine:
        def analyze(self, metrics):
            recommendations = []
            if metrics.get("gpu_utilization_pct", 100) < 30:
                rec = "GPU underutilized — consider smaller instance or sharing"
                savings_est = metrics.get("gpu_monthly_cost", 0) * 0.4
                recommendations.append({"rec": rec, "savings_est": savings_est, "priority": "HIGH"})
            if metrics.get("cache_hit_rate", 1.0) < 0.5:
                rec = "Low cache hit rate — increase cache size or improve key design"
                savings_est = metrics.get("inference_monthly_cost", 0) * 0.3
                recommendations.append({"rec": rec, "savings_est": savings_est, "priority": "MEDIUM"})
            if metrics.get("spot_usage_pct", 100) < 30:
                rec = "Low spot usage — move fault-tolerant workloads to spot for 70% savings"
                savings_est = metrics.get("training_monthly_cost", 0) * 0.5
                recommendations.append({"rec": rec, "savings_est": savings_est, "priority": "HIGH"})
            return sorted(recommendations, key=lambda x: -x["savings_est"])
    engine = OptimizationRecommendationEngine()
    recs = engine.analyze({
        "gpu_utilization_pct": 22, "gpu_monthly_cost": 3200,
        "cache_hit_rate": 0.35, "inference_monthly_cost": 1800,
        "spot_usage_pct": 10, "training_monthly_cost": 2400,
    })
    print(f"Ex35 — OptimizationRecommendationEngine: {len(recs)} recommendations")
    for r in recs:
        print(f"  [{r['priority']}] ${r['savings_est']:,.0f}/mo savings — {r['rec']}")

def ex36():
    """CostTrendAnalyzer — linear regression on spend"""
    class CostTrendAnalyzer:
        def __init__(self):
            self.history = []
        def add(self, month, cost):
            self.history.append((month, cost))
        def trend(self):
            if len(self.history) < 2:
                return {}
            months = np.array([x[0] for x in self.history], dtype=float)
            costs = np.array([x[1] for x in self.history], dtype=float)
            slope, intercept = np.polyfit(months, costs, 1)
            r_squared = np.corrcoef(months, costs)[0, 1] ** 2
            return {"slope_per_month": round(slope, 2), "intercept": round(intercept, 2),
                    "r_squared": round(r_squared, 4),
                    "trend": "INCREASING" if slope > 50 else "STABLE" if abs(slope) <= 50 else "DECREASING"}
    analyzer = CostTrendAnalyzer()
    costs = [3200, 3450, 3800, 4100, 4350, 4700]
    for m, c in enumerate(costs, 1):
        analyzer.add(m, c)
    t = analyzer.trend()
    print(f"Ex36 — CostTrendAnalyzer: trend={t['trend']}, slope=${t['slope_per_month']:+.0f}/month, "
          f"R²={t['r_squared']:.4f}")

def ex37():
    """CostForecaster — project next 3 months"""
    class CostForecaster:
        def __init__(self, history_costs):
            self.history = np.array(history_costs, dtype=float)
        def forecast(self, n_months=3, growth_rate=None):
            if growth_rate is None:
                # Estimate from linear regression
                x = np.arange(len(self.history), dtype=float)
                slope, _ = np.polyfit(x, self.history, 1)
                growth_rate = slope / self.history.mean()
            last = self.history[-1]
            forecasts = []
            for i in range(1, n_months + 1):
                projected = last * (1 + growth_rate) ** i
                ci_lo = projected * 0.85
                ci_hi = projected * 1.15
                forecasts.append({"month": i, "projected": round(projected, 2),
                                  "ci_lo": round(ci_lo, 2), "ci_hi": round(ci_hi, 2)})
            return forecasts
    forecaster = CostForecaster([3200, 3450, 3800, 4100, 4350, 4700])
    forecasts = forecaster.forecast(n_months=3)
    print("Ex37 — CostForecaster (next 3 months):")
    for f in forecasts:
        print(f"  Month +{f['month']}: projected=${f['projected']:,.0f} "
              f"(CI: ${f['ci_lo']:,.0f}–${f['ci_hi']:,.0f})")

def ex38():
    """FullCostOptimizationReport class"""
    class FullCostOptimizationReport:
        def __init__(self, team_name):
            self.team = team_name
            self.sections = []
        def add_section(self, title, data):
            self.sections.append({"title": title, "data": data})
        def generate(self):
            lines = ["=" * 60, f"COST OPTIMIZATION REPORT — {self.team}", "=" * 60]
            for sec in self.sections:
                lines.append(f"\n{sec['title']}")
                lines.append("-" * 40)
                if isinstance(sec["data"], dict):
                    for k, v in sec["data"].items():
                        lines.append(f"  {k}: {v}")
                elif isinstance(sec["data"], list):
                    for item in sec["data"]:
                        lines.append(f"  • {item}")
            lines.append("=" * 60)
            return "\n".join(lines)
    report = FullCostOptimizationReport("ML Platform Team")
    report.add_section("CURRENT SPEND", {"GPU Compute": "$4,700/mo", "API Costs": "$1,200/mo",
                                         "Storage": "$420/mo", "Total": "$6,320/mo"})
    report.add_section("TOP SAVINGS OPPORTUNITIES",
        ["Spot instances for training → save $1,500/mo",
         "Cache embedding layer → save $400/mo",
         "Downsize idle dev GPU → save $660/mo",
         "Total potential savings: $2,560/mo (40%)"])
    report.add_section("90-DAY ROADMAP",
        ["Week 1: Enable spot instances for batch jobs",
         "Week 2: Deploy Redis cache for embedding lookups",
         "Week 4: Implement auto-shutdown for idle notebooks",
         "Week 8: Optimize batch sizes for GPU utilization"])
    print("Ex38 — FullCostOptimizationReport:")
    print(report.generate())

# ─── ADVANCED (39–50) ────────────────────────────────────────

def ex39():
    """TCO model — total cost of ownership over 3 years"""
    def tco_model(name, year1_capex, monthly_opex, monthly_savings, years=3):
        total_cost = year1_capex
        total_savings = 0
        print(f"  {name}:")
        for y in range(1, years + 1):
            annual_opex = monthly_opex * 12
            annual_savings = monthly_savings * 12
            total_cost += annual_opex
            total_savings += annual_savings
            net = total_savings - total_cost
            print(f"    Year {y}: opex=${annual_opex:,}, savings=${annual_savings:,}, "
                  f"cumulative net=${net:,}")
        print(f"    TCO over {years}yr: ${total_cost:,}, Net value: ${total_savings - total_cost:,}")
    print("Ex39 — TCO Model (3 Years):")
    tco_model("API-Only (GPT-4o-mini)", year1_capex=5000, monthly_opex=800, monthly_savings=12000)
    tco_model("Self-Hosted (LLaMA-70B)", year1_capex=50000, monthly_opex=3500, monthly_savings=12000)

def ex40():
    """Build vs buy analysis — decision framework"""
    framework = """Ex40 — Build vs Buy Decision Framework:
  FRAMEWORK (score each criterion 1–5):
  ┌─────────────────────────────────┬──────────┬─────────┐
  │ Criterion                       │ Build    │ Buy/API │
  ├─────────────────────────────────┼──────────┼─────────┤
  │ Time-to-production              │ 3 months │ 1 week  │
  │ Upfront cost                    │ $50K+    │ $500    │
  │ Cost at scale (10M req/mo)      │ $800/mo  │ $8,000+ │
  │ Data privacy / compliance       │ FULL     │ PARTIAL │
  │ Customization control           │ FULL     │ LIMITED │
  │ Maintenance burden              │ HIGH     │ LOW     │
  │ Vendor lock-in risk             │ NONE     │ HIGH    │
  └─────────────────────────────────┴──────────┴─────────┘

  DECISION RULE:
  → BUY if: <1M requests/month OR no privacy concerns OR fast MVP needed
  → BUILD if: >10M requests/month AND data privacy required AND 6mo runway
  → HYBRID: Use API for <2M req/mo, migrate to self-hosted above threshold

  BREAKEVEN CALCULATION:
    Build cost: $50K setup + $800/mo ops
    Buy cost:   $0 setup + $0.005/1K tokens × volume
    Breakeven:  50000 / (0.005*1000 - 0.8) ≈ 1.2M requests/month"""
    print(framework)

def ex41():
    """Multi-cloud cost comparison — AWS/GCP/Azure"""
    comparison = {
        "AWS": {
            "A100 40GB (p4d node/8)": "$4.097/hr per GPU",
            "T4 16GB (g4dn.xlarge)": "$0.526/hr",
            "Inf1 (Inferentia)": "$0.228/hr (2× TOPS vs T4 at 0.43× price)",
            "S3 storage": "$0.023/GB/mo",
            "Data egress": "$0.09/GB",
        },
        "GCP": {
            "A100 40GB (a2-highgpu-1g)": "$3.673/hr",
            "T4 16GB (n1+T4)": "$0.950/hr",
            "TPU v4 (per chip)": "$4.80/hr (10× ML throughput)",
            "GCS storage": "$0.020/GB/mo",
            "Data egress": "$0.08/GB",
        },
        "Azure": {
            "A100 80GB (ND A100 v4/8)": "$3.40/hr per GPU",
            "T4 16GB (NC4as T4 v3)": "$0.526/hr",
            "Blob storage": "$0.018/GB/mo (LRS)",
            "Data egress": "$0.087/GB",
        },
    }
    print("Ex41 — Multi-Cloud Cost Comparison:")
    for cloud, prices in comparison.items():
        print(f"\n  [{cloud}]")
        for service, price in prices.items():
            print(f"    {service:40s}: {price}")

def ex42():
    """Spot instance fault tolerance pattern"""
    pattern = """Ex42 — Spot Instance Fault Tolerance Pattern:
import boto3, time

class FaultTolerantSpotTrainer:
    def __init__(self, checkpoint_interval=300):
        self.checkpoint_interval = checkpoint_interval  # seconds
        self.last_checkpoint = 0
        self.global_step = 0

    def train_step(self, model, batch):
        # Normal training step
        loss = model.forward_backward(batch)
        self.global_step += 1
        # Checkpoint periodically
        if time.time() - self.last_checkpoint > self.checkpoint_interval:
            self.save_checkpoint(model, self.global_step)
            self.last_checkpoint = time.time()
        return loss

    def save_checkpoint(self, model, step):
        # Save to S3 immediately (survives instance termination)
        boto3.client("s3").upload_file(
            f"/tmp/ckpt_step_{step}.pt",
            "ml-checkpoints",
            f"runs/{self.run_id}/ckpt_{step}.pt"
        )

    def handle_interruption(self):
        # AWS sends SIGTERM 2 minutes before spot reclamation
        import signal
        signal.signal(signal.SIGTERM, lambda sig, frame: self.save_checkpoint(self.model, self.global_step))

# Cost: V100 spot $0.92/hr vs $3.06/hr on-demand = 70% saving
# With checkpointing every 5 min: max 5 min of wasted work on reclaim"""
    print(pattern)

def ex43():
    """Preemption handling — checkpoint + resume logic"""
    class CheckpointManager:
        def __init__(self, save_dir):
            self.save_dir = save_dir
            self.checkpoints = []
        def save(self, step, metrics):
            path = f"{self.save_dir}/ckpt_{step:06d}.json"
            ckpt = {"step": step, "metrics": metrics, "timestamp": "2026-03-21T10:00:00Z"}
            self.checkpoints.append(ckpt)
            return path
        def latest(self):
            return self.checkpoints[-1] if self.checkpoints else None
        def resume_from_latest(self):
            ckpt = self.latest()
            if ckpt:
                return ckpt["step"], ckpt["metrics"]
            return 0, {}
    mgr = CheckpointManager("/tmp/checkpoints")
    for step, loss in [(1000, 2.34), (2000, 1.87), (3000, 1.42)]:
        path = mgr.save(step, {"loss": loss, "lr": 1e-4})
    resume_step, metrics = mgr.resume_from_latest()
    print(f"Ex43 — CheckpointManager: {len(mgr.checkpoints)} checkpoints saved")
    print(f"  Latest checkpoint: step={mgr.latest()['step']}, loss={mgr.latest()['metrics']['loss']}")
    print(f"  Resume from: step={resume_step}, metrics={metrics}")

def ex44():
    """Fractional GPU sharing concept"""
    concept = """Ex44 — Fractional GPU Sharing:
  TECHNOLOGIES:
  1. NVIDIA MIG (Multi-Instance GPU) — A100/H100 only
     - Splits GPU into up to 7 isolated instances
     - Each instance has dedicated memory + compute
     - Use case: multiple small models on one A100 80GB
     - Config: 7× 1g.10gb (7 instances, 10GB VRAM each)

  2. NVIDIA MPS (Multi-Process Service)
     - Shares GPU time among multiple processes
     - No memory isolation (less safe)
     - Lower overhead than MIG
     - Use case: multiple inference workers, same model

  3. Kubernetes Device Plugin (k8s fractional GPU)
     resources:
       limits:
         nvidia.com/gpu: "0.5"   # half a GPU
     # Achieved via time-slicing or MIG partitioning

  COST EXAMPLE (A100 80GB, $3.67/hr):
    Without sharing: 4 models × 1 A100 = $14.68/hr
    With MIG 7-way:  4 models × 0.15 A100 = $2.20/hr (85% saving)"""
    print(concept)

def ex45():
    """Serverless inference cost model"""
    def serverless_cost(requests_per_month, avg_duration_ms, memory_mb, price_per_gb_sec=0.0000166667):
        duration_sec = avg_duration_ms / 1000
        gb_seconds = (memory_mb / 1024) * duration_sec * requests_per_month
        compute_cost = gb_seconds * price_per_gb_sec
        request_cost = requests_per_month * 0.0000002  # $0.20 per 1M requests
        total = compute_cost + request_cost
        return {"gb_seconds": round(gb_seconds, 0), "compute_cost": round(compute_cost, 4),
                "request_cost": round(request_cost, 4), "total": round(total, 4)}
    scenarios = [
        ("Light (1M req, 100ms, 512MB)", 1_000_000, 100, 512),
        ("Medium (5M req, 500ms, 2GB)", 5_000_000, 500, 2048),
        ("Heavy (10M req, 2s, 4GB)", 10_000_000, 2000, 4096),
    ]
    print("Ex45 — Serverless Inference Cost (AWS Lambda pricing):")
    for name, reqs, dur_ms, mem in scenarios:
        result = serverless_cost(reqs, dur_ms, mem)
        print(f"  {name}: total=${result['total']:,.2f}/mo "
              f"(compute=${result['compute_cost']:,.2f}, requests=${result['request_cost']:,.2f})")

def ex46():
    """Edge inference cost model"""
    edge_model = """Ex46 — Edge Inference Cost Model:
  DEPLOYMENT TARGETS:
  ┌──────────────────────┬──────────────┬───────────┬──────────────────────┐
  │ Platform             │ Hardware     │ Cost      │ Power (W)            │
  ├──────────────────────┼──────────────┼───────────┼──────────────────────┤
  │ NVIDIA Jetson Nano   │ 128-core GPU │ $99 device│ 5–10W                │
  │ NVIDIA Jetson AGX    │ 512-core GPU │ $499 device│ 10–30W              │
  │ Google Coral USB     │ TPU Edge     │ $60 device│ 2W                  │
  │ Apple M2 (iPhone 14) │ Neural Eng. │ device amort│ 3–6W               │
  │ Raspberry Pi 4 + TPU │ CPU + Coral  │ $75 device│ 5W + 2W             │
  └──────────────────────┴──────────────┴───────────┴──────────────────────┘

  COST MODEL (per 1M inferences, edge vs cloud):
    Edge (Jetson Nano):  device_amort=$0.001 + power=$0.0005 = ~$0.0015/1M
    Cloud (Lambda GPU):  ~$2.00/1M (100ms inference, 1GB)
    Cloud (EC2 T4):      ~$0.53/1M at full utilization
    → Edge is 100–1000× cheaper per inference at high volume
    → Break-even: ~10K inferences/day to justify Jetson Nano cost"""
    print(edge_model)

def ex47():
    """RAG cost optimization — cache embeddings"""
    def rag_cost_analysis(n_queries_day, n_docs, embedding_dim=1536, cache_hit_rate=0.60):
        # Embedding costs
        avg_tokens_per_doc = 500
        embedding_cost_per_1k_tokens = 0.0001  # text-embedding-3-small
        # Without cache: re-embed all queries each day
        tokens_per_query = 100
        daily_embed_cost_no_cache = n_queries_day * (tokens_per_query / 1000) * embedding_cost_per_1k_tokens
        # With cache: only unique queries cost
        daily_embed_cost_with_cache = daily_embed_cost_no_cache * (1 - cache_hit_rate)
        # Storage for cached embeddings
        embedding_size_bytes = embedding_dim * 4  # float32
        cache_storage_gb = n_queries_day * 30 * embedding_size_bytes / 1e9  # 30-day window
        storage_cost_month = cache_storage_gb * 0.023  # Redis ~$0.023/GB
        return {
            "daily_embed_no_cache": round(daily_embed_cost_no_cache, 4),
            "daily_embed_with_cache": round(daily_embed_cost_with_cache, 4),
            "monthly_saving": round((daily_embed_cost_no_cache - daily_embed_cost_with_cache) * 30, 2),
            "cache_storage_gb": round(cache_storage_gb, 3),
            "storage_cost_month": round(storage_cost_month, 2),
        }
    result = rag_cost_analysis(n_queries_day=50000, n_docs=100000, cache_hit_rate=0.65)
    print(f"Ex47 — RAG Cost Optimization (50K queries/day, 65% cache hit):")
    print(f"  Daily embed cost (no cache): ${result['daily_embed_no_cache']}")
    print(f"  Daily embed cost (cached)  : ${result['daily_embed_with_cache']}")
    print(f"  Monthly savings            : ${result['monthly_saving']:,}")
    print(f"  Cache storage overhead     : {result['cache_storage_gb']}GB (${result['storage_cost_month']}/mo)")

def ex48():
    """LLM routing by cost — small model first, fallback to large"""
    class LLMRouter:
        def __init__(self, models):
            self.models = sorted(models, key=lambda m: m["cost_per_1k"])
        def route(self, query, confidence_threshold=0.85):
            for model in self.models:
                simulated_conf = rng.uniform(0.6, 0.98)
                if simulated_conf >= confidence_threshold or model == self.models[-1]:
                    return {"model": model["name"], "confidence": round(simulated_conf, 3),
                            "cost_per_1k": model["cost_per_1k"]}
            return {"model": self.models[-1]["name"], "confidence": 1.0,
                    "cost_per_1k": self.models[-1]["cost_per_1k"]}
    router = LLMRouter([
        {"name": "LLaMA-3-8B",    "cost_per_1k": 0.05},
        {"name": "GPT-4o-mini",   "cost_per_1k": 0.15},
        {"name": "GPT-4o",        "cost_per_1k": 5.00},
    ])
    queries = [f"query_{i}" for i in range(10)]
    routes = [router.route(q) for q in queries]
    from collections import Counter
    model_counts = Counter(r["model"] for r in routes)
    avg_cost = np.mean([r["cost_per_1k"] for r in routes])
    print(f"Ex48 — LLM Routing (10 queries, threshold=0.85): {dict(model_counts)}")
    print(f"  Avg cost/1K: ${avg_cost:.4f} vs always-GPT-4o: $5.0000")

def ex49():
    """FinOps for ML teams — 10 practices"""
    practices = """Ex49 — FinOps for ML Teams (10 Key Practices):
   1. TAG EVERYTHING: Apply team/project/env tags to all cloud resources
      → Enables chargeback and identifies waste by team

   2. IMPLEMENT COST DASHBOARDS: Daily cost reports in Slack/email
      → Engineers see their cost impact immediately

   3. BUDGET ALERTS: Set per-team monthly budgets with 75%/90%/100% alerts
      → Stop surprise bills before they compound

   4. SPOT-FIRST POLICY: All batch training must use spot/preemptible
      → Typical saving: 60–70% on training costs

   5. AUTO-SHUTDOWN: Jupyter notebooks/dev VMs shut down after 1h idle
      → Eliminates the #1 source of wasted spend: forgotten instances

   6. RIGHTSIZING REVIEWS: Monthly review of instance utilization
      → GPU < 20% utilization → downsize or share

   7. RESERVED INSTANCES: Commit 1yr for baseline inference capacity
      → 35–40% discount on predictable steady-state workloads

   8. COST-PER-PREDICTION METRIC: Track $/1K predictions over time
      → Makes optimization wins visible and quantifiable

   9. MODEL EFFICIENCY GATES: Include inference cost in model review
      → Block models that are >2× more expensive without quality gain

  10. QUARTERLY ARCHITECTURE REVIEW: Re-evaluate build vs buy decisions
      → APIs that made sense at 1M req/mo may need self-hosting at 50M"""
    print(practices)

def ex50():
    """Production cost optimization checklist — 20 items"""
    checklist = """Ex50 — Production ML Cost Optimization Checklist (20 Items):

  COMPUTE:
   1. All training workloads on spot/preemptible instances (save 60–70%)
   2. GPU utilization > 70% for inference servers (rightsize if lower)
   3. CPU-only inference for models < 100ms SLA that fit in CPU memory
   4. Batch inference scheduled nightly for non-realtime predictions
   5. Auto-scaling configured with correct min/max and cooldown periods

  MODELS:
   6. INT8 quantization applied to all production inference models
   7. Knowledge distillation evaluated for any model > 1B parameters
   8. Model pruning (50–70% sparsity) evaluated for large models
   9. LLM routing enabled: small model → large model fallback pattern
  10. Embedding models cached in Redis with 24h TTL

  APIs & CACHING:
  11. Response caching for deterministic queries (LRU + TTL)
  12. Request deduplication for high-traffic identical queries
  13. Semantic similarity cache for near-duplicate LLM prompts
  14. Batch prediction API used for all bulk inference jobs
  15. Token budget enforced per request (max_tokens parameter)

  INFRASTRUCTURE:
  16. Reserved instances for >$500/mo steady-state workloads (1yr commit)
  17. S3 intelligent-tiering for model artifacts older than 30 days
  18. Multi-region disabled until traffic justifies it (>500ms target)
  19. Logging to S3 (not CloudWatch) for high-volume prediction logs
  20. Monthly FinOps review: cost per team, top 5 waste sources addressed"""
    print(checklist)


def main():
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print("Examples 5.4 — ML Cost Optimization")
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
