# ============================================================
# Solution 6.1 — AI System Design
# ============================================================


def design_recommendation_system():
    print("""
[DESIGN] Recommendation System
=================================
OVERVIEW:
  Personalized recommendation engine serving 10M+ users in real time.
  Goal: increase CTR / engagement by surfacing relevant items.

COMPONENTS:
  1. Embedding Layer
     - User embeddings: learned via matrix factorization (ALS) or neural CF
     - Item embeddings: content + collaborative signals; stored in vector DB
     - Embedding dimension: 128–256; updated nightly via batch job

  2. Retrieval (ANN — Approximate Nearest Neighbors)
     - Candidate generation: top-K items per user via FAISS / ScaNN
     - Two-tower model: user tower + item tower, inner-product similarity
     - Filters: availability, geography, already-seen exclusion

  3. Ranking Model
     - Light GBM or 2-layer MLP on (user, item, context) features
     - Features: recency, CTR history, category affinity, session context
     - Output: P(click) or P(purchase); sorted descending

  4. Feedback Loop
     - Impression + click + conversion events streamed via Kafka
     - Labels joined to training data in feature store within 24 h
     - Retraining triggered weekly or when AUC drifts > 0.02

  5. Cold-Start Handling
     - New users: popularity-based fallback → demographic cohort embeddings
     - New items: content-based embedding from item metadata (text/image)
     - Onboarding quiz to gather initial preferences

  6. A/B Testing Layer
     - Traffic split by user hash; experiments fully isolated
     - Primary metric: 7-day CTR; guardrail: session duration, revenue
     - Auto-stop if guardrail degrades > 5%

SCALING:
  - Retrieval: sharded FAISS cluster, ~5 ms p99
  - Ranking: model server with GPU batching, ~20 ms p99
  - Caching: user candidate lists cached in Redis (TTL 10 min)

DATA FLOW:
  User request → Feature lookup → ANN retrieval → Ranker → Response
  Click event  → Kafka → Feature store → Training pipeline → Model registry
""")


def design_fraud_detection():
    print("""
[DESIGN] Real-Time Fraud Detection System
==========================================
OVERVIEW:
  Sub-100 ms decision on every transaction. Minimize false positives
  (block legitimate users) while catching fraud at high recall.

COMPONENTS:
  1. Feature Engineering
     - Velocity features: txn count per user/card in last 1 m / 10 m / 1 h
     - Graph features: shared device / IP clusters (GraphSAGE embeddings)
     - Historical features: avg spend, merchant category ratios (from feature store)
     - Real-time features computed in Flink; historical from Redis

  2. Streaming Inference
     - Kafka topic: payment_events → Flink consumer → feature assembly
     - Model inference: XGBoost + neural network ensemble via gRPC model server
     - Decision output: fraud_score ∈ [0, 1] within 50 ms

  3. Model Ensemble
     - Base models: XGBoost (tabular), LSTM (sequence), GNN (graph)
     - Stacked with logistic regression meta-learner
     - Diversity reduces individual model blind spots

  4. Thresholds & Decision Policy
     - Low risk (< 0.3): auto-approve
     - Medium risk (0.3–0.7): step-up auth (OTP / biometric)
     - High risk (> 0.7): auto-decline + alert
     - Thresholds tuned per merchant category; reviewed monthly

  5. Alert Pipeline
     - Fraud alerts → SNS → case management system
     - Analyst review queue with explanation (SHAP values surfaced)
     - Feedback labels fed back to retraining pipeline

SCALING:
  - Flink cluster: 50 parallelism, auto-scaled
  - Feature store: Redis Cluster with 6 shards, ~1 ms lookup
  - Throughput: 50,000 txn/s at peak (Black Friday)

RISKS:
  - Concept drift: fraud patterns shift monthly → online learning + frequent retraining
  - Class imbalance: ~0.1% fraud → oversample minority + adjust thresholds
""")


def design_rag_search():
    print("""
[DESIGN] Document Search System (RAG at Scale)
===============================================
OVERVIEW:
  Enterprise search over 100M+ documents with LLM-generated answers.
  Combines dense retrieval accuracy with generative summarization.

COMPONENTS:
  1. Ingestion Pipeline
     - Sources: S3, SharePoint, web crawl, database exports
     - Orchestrated by Airflow; incremental + full-refresh modes
     - Document parsing: Unstructured.io / Tika → clean text + metadata

  2. Chunking Strategy
     - Recursive character text splitter: chunk_size=512, overlap=64 tokens
     - Sentence-boundary aware; preserve headings as metadata
     - Chunk IDs: content hash for deduplication

  3. Embedding Model
     - text-embedding-3-large (OpenAI) or BGE-large (open-source)
     - Batch embedding via async GPU workers; ~$0.0001/chunk
     - Embeddings stored in Pinecone / Weaviate / pgvector

  4. Vector Store
     - HNSW index; M=16, ef_construction=200 for recall/latency balance
     - Metadata filters: doc_type, date_range, department
     - Namespace isolation per tenant

  5. Hybrid Retrieval
     - Dense: cosine similarity top-K (K=20) from vector DB
     - Sparse: BM25 via Elasticsearch on same corpus
     - Fusion: Reciprocal Rank Fusion (RRF) to merge results
     - Re-ranker: cross-encoder (ms-marco-MiniLM) on top-20 → top-5

  6. Generation
     - Prompt: system instructions + top-5 chunks + user query
     - LLM: GPT-4o with citations (chunk_id → source URL)
     - Streaming response; hallucination check via faithfulness score

SCALING:
  - Ingestion: 10 parallel workers; process 1M docs/day
  - Retrieval: ~30 ms p99; vector DB horizontally sharded
  - Cache: frequent query → cached answer (Redis, TTL 1 h)

METRICS:
  - Retrieval recall@5, MRR; Generation: faithfulness, answer relevance
""")


def design_multitenant_llm_api():
    print("""
[DESIGN] Multi-Tenant LLM API Service
======================================
OVERVIEW:
  SaaS platform exposing LLM capabilities to 1,000+ enterprise tenants.
  Isolation, cost control, and low latency are primary concerns.

COMPONENTS:
  1. Tenant Isolation
     - JWT with tenant_id claim; validated at API gateway
     - Separate namespaces in vector DB and prompt history store
     - No cross-tenant data leakage; audit log per tenant

  2. Rate Limiting
     - Token-bucket algorithm: per-tenant RPM + TPM (tokens/min)
     - Redis-backed counters with Lua scripts for atomicity
     - Tiered plans: Free (10 RPM), Pro (100 RPM), Enterprise (custom)

  3. Model Routing
     - Router selects model based on: task type, latency SLA, cost budget
     - Fast tasks (classification) → GPT-3.5 / Haiku
     - Complex tasks (reasoning) → GPT-4o / Claude-3-Opus
     - Fallback chain: primary model → secondary if timeout

  4. Cost Accounting
     - Token usage metered per API call; stored in DynamoDB
     - Daily rollup jobs produce invoice line items
     - Alerts when tenant nears quota (80%, 100%)

  5. Caching
     - Exact-match cache: SHA-256(prompt) → Redis (TTL 24 h)
     - Semantic cache: embed query, cosine similarity > 0.97 → cache hit
     - Cache bypass header: X-No-Cache for real-time needs

  6. Security Boundaries
     - Prompt injection scanner on input (regex + classifier)
     - PII detector; redact before logging
     - TLS everywhere; model server not publicly exposed

SCALING:
  - API gateway: AWS API GW + Lambda or Kubernetes ingress
  - Async request queue: SQS for bursty workloads
  - Auto-scaling model servers based on GPU queue depth
""")


def design_feature_store():
    print("""
[DESIGN] ML Feature Store
==========================
OVERVIEW:
  Centralized store enabling feature reuse, consistency between
  training and serving, and low-latency online lookups.

COMPONENTS:
  1. Offline Store (Batch / Training)
     - Storage: Delta Lake on S3 or BigQuery partitioned tables
     - Contains full historical feature values with timestamps
     - Used for: training dataset generation, backfills, exploration

  2. Online Store (Low-Latency Serving)
     - Storage: Redis Cluster or DynamoDB; single-digit ms lookups
     - Holds latest feature values per entity (user_id, item_id)
     - Synced from offline store via materialization jobs

  3. Feature Pipelines
     - Batch pipelines: Spark / dbt jobs running hourly/daily
     - Streaming pipelines: Flink / Kafka Streams for real-time features
     - Feature definitions as code (Feast / Tecton / Hopsworks)

  4. Point-in-Time Correctness
     - Training rows joined to feature values at label timestamp
     - Prevents data leakage (future features used for past labels)
     - Implemented via AS-OF join in Spark or time-travel in Delta

  5. Feature Versioning
     - Each feature has a semantic version; breaking changes bump major
     - Old versions retained for reproducibility (model re-evaluation)
     - Feature lineage tracked: source table → transformation → feature

  6. Governance
     - Feature catalog with owner, description, SLA
     - Access control: team-level read/write permissions
     - Data quality monitors: null rate, distribution drift alerts

BENEFITS:
  - Eliminate training-serving skew (single feature definition)
  - Reuse features across 50+ models without recomputation
  - Reduce feature engineering time by 60%
""")


def design_ab_testing_framework():
    print("""
[DESIGN] A/B Testing Framework for ML Models
=============================================
OVERVIEW:
  Rigorous experimentation platform to validate ML model improvements
  before full rollout. Supports 100+ concurrent experiments.

COMPONENTS:
  1. Traffic Splitting
     - Hash-based assignment: hash(user_id + experiment_id) % 100
     - Ensures sticky assignment (same user always in same bucket)
     - Multi-armed bandit option for faster convergence on clear winners

  2. Assignment Consistency
     - Assignment stored in Redis on first request; subsequent requests
       read from cache to handle hash collisions across services
     - Holdout groups: 10% users excluded from all experiments

  3. Metric Collection
     - Events logged to Kafka → Flink aggregations → metrics warehouse
     - Primary metrics: CTR, conversion rate, revenue per user
     - Guardrail metrics: latency p99, error rate, session duration

  4. Statistical Significance Testing
     - Two-sample t-test for continuous metrics; chi-square for rates
     - Minimum detectable effect (MDE) calculated at design time
     - Sequential testing (mSPRT) to allow early stopping without p-hacking
     - Default: 95% confidence, 80% power

  5. Guardrail Metrics
     - Automated alerts if guardrail degrades > threshold
     - Auto-pause experiment if latency p99 > 500 ms
     - Requires explicit override to continue degraded experiment

  6. Reporting Dashboard
     - Real-time lift estimates with confidence intervals
     - Segment breakdowns: new vs returning, mobile vs desktop
     - Experiment log with hypothesis, owner, rollout timeline

GOTCHAS:
  - Network effects: social features require cluster-based randomization
  - Novelty effect: new UI features inflate early metrics; run 2+ weeks
  - Multiple comparisons: Bonferroni correction for many metrics
""")


def design_training_pipeline():
    print("""
[DESIGN] Model Training Pipeline (Orchestration)
=================================================
OVERVIEW:
  End-to-end automated pipeline from raw data to deployed model.
  Reproducible, auditable, and triggered on schedule or data drift.

COMPONENTS:
  1. Data Ingestion
     - Source connectors: S3, Snowflake, Kafka snapshots
     - Data versioning: DVC or Delta Lake time-travel
     - Schema validation at ingestion gate; fail fast on schema drift

  2. Preprocessing
     - Distributed Spark jobs: cleaning, joins, feature engineering
     - Train / validation / test split with stratification
     - Preprocessing artifacts (scalers, encoders) saved to registry

  3. Distributed Training
     - Framework: PyTorch DDP (data parallel) or DeepSpeed (LLM)
     - Cluster: Ray on Kubernetes; auto-scale GPU nodes
     - Mixed precision (fp16/bf16) for 2× throughput
     - Checkpointing every epoch to S3

  4. Evaluation Gates
     - Gate 1: offline metrics (AUC, F1, RMSE) vs baseline threshold
     - Gate 2: fairness metrics across demographic slices
     - Gate 3: latency benchmark (model must meet serving SLA)
     - Failed gate → alert oncall, block promotion

  5. Artifact Registry
     - MLflow or W&B: model binaries, metrics, hyperparameters, lineage
     - Immutable artifact IDs; signed with SHA-256
     - Linked to training run, data version, git commit

  6. Deployment Trigger
     - On gate pass: create PR to model config repo
     - CI/CD pipeline runs integration tests on staging
     - Shadow deploy → canary (5%) → full rollout
     - Rollback: flip config, old model still in registry

ORCHESTRATION:
  - Airflow DAG or Kubeflow Pipeline; retry logic with backoff
  - SLA alerts if pipeline doesn't complete within 6 h
""")


def design_realtime_nlp_pipeline():
    print("""
[DESIGN] Real-Time NLP Pipeline (Stream Processing)
====================================================
OVERVIEW:
  Process millions of text events per day (social media, support tickets,
  chat messages) with ML inference within strict latency SLOs.

COMPONENTS:
  1. Ingestion (Kafka / Kinesis)
     - Producers: mobile apps, web hooks, database CDC
     - Kafka topics partitioned by tenant_id (parallelism = 32)
     - Retention: 7 days for replay; compacted topics for state

  2. Tokenization
     - Flink operator: SentencePiece / HuggingFace tokenizer
     - Batch window: 10 ms micro-batch for GPU efficiency
     - Filter: skip empty, deduplicate by content hash

  3. Model Inference
     - Triton Inference Server with ONNX / TensorRT models
     - Dynamic batching: collect events for 5 ms, infer together
     - Models: sentiment (distilBERT), NER (BERT-NER), intent classifier
     - GPU utilization target: 70–80%

  4. Post-Processing
     - Decode logits → labels + confidence scores
     - Business rule overlay: suppress low-confidence predictions
     - Enrich with entity normalization (NER → canonical form)

  5. Output Sink
     - Results → Kafka output topic → downstream consumers
     - High-confidence alerts → SNS → PagerDuty (e.g., toxicity > 0.9)
     - Aggregate metrics → InfluxDB → Grafana dashboard

  6. Latency SLOs
     - p50: < 20 ms end-to-end (Kafka receipt to output topic)
     - p99: < 100 ms
     - Throughput: 50,000 events/sec sustained

MONITORING:
  - Kafka consumer lag (alert if > 10,000 messages)
  - Model drift: rolling F1 on sampled + labeled events
  - GPU memory and utilization dashboards
""")


def design_inference_trade_offs():
    print("""
[DESIGN] Offline vs Online Inference Trade-Offs
================================================

1. BATCH SCORING (Offline Inference)
   - Pattern: run model on large dataset on a schedule
   - Latency: hours (acceptable; results pre-computed)
   - Throughput: very high (1B+ rows/run via Spark + GPU)
   - Cost: low $/prediction (large batches, spot instances)
   - Use when:
     * Predictions needed daily (e.g., nightly email recommendations)
     * Labels don't need to reflect real-time state
     * Feature computation is expensive; amortize over batch
   - Examples: churn prediction, next-best-offer, fraud batch review

2. ONLINE SERVING (Synchronous Inference)
   - Pattern: model server receives request, returns prediction < 100 ms
   - Latency: p99 < 100 ms
   - Throughput: moderate (100–10,000 RPS per GPU)
   - Cost: higher $/prediction (always-on GPU fleet)
   - Use when:
     * Prediction must reflect current user context
     * User is waiting for the result (search ranking, chatbot)
     * Real-time personalization required
   - Examples: ad ranking, fraud scoring at payment, search

3. NEAR-REAL-TIME (Micro-Batch / Streaming)
   - Pattern: Flink / Spark Streaming; infer every 1–30 seconds
   - Latency: seconds (not milliseconds)
   - Throughput: high (event stream processing)
   - Use when:
     * Need freshness but not strict real-time
     * Aggregation window needed before inference
     * Cost of full online serving is too high
   - Examples: sentiment on tweet stream, anomaly detection on logs

DECISION GUIDE:
  User waiting synchronously → Online serving
  Scheduled / bulk scoring → Batch
  Stream events, seconds acceptable → Near-real-time (Flink)
  Cost is primary concern → Batch on spot instances
""")


def design_model_versioning():
    print("""
[DESIGN] Model Versioning and Rollback System
=============================================
OVERVIEW:
  Treat ML models like software: version, test, and deploy safely
  with the ability to roll back instantly on degradation.

COMPONENTS:
  1. Semantic Versioning
     - Format: MAJOR.MINOR.PATCH
     - MAJOR: architecture change (new input features, different task)
     - MINOR: retrained on new data, same interface
     - PATCH: threshold or config change only
     - All versions immutable once registered

  2. Artifact Storage
     - MLflow Model Registry or custom S3 structure:
       s3://models/{model_name}/{version}/artifacts/
     - Contents: weights, config, preprocessing artifacts, schema
     - SHA-256 checksum verified at load time

  3. Shadow Deployment
     - New model receives production traffic copy; responses discarded
     - Compare distributions: output scores, latency, error rate
     - Run for 24–48 h before promoting to canary
     - Zero user impact; safe validation

  4. Canary Rollout
     - Route 5% → 10% → 25% → 50% → 100% of traffic to new model
     - Each stage: observe primary + guardrail metrics for 1 h
     - Automated progression if metrics within bounds
     - Manual approval gate at 25% → 50% for high-stakes models

  5. Automated Rollback Triggers
     - Error rate > 1% (vs baseline 0.1%) → auto-rollback
     - Latency p99 > 2× baseline → auto-rollback
     - Business metric (CVR, revenue) drops > 5% → auto-rollback
     - Rollback: update load balancer config, drain new model, promote old

  6. Model Lineage
     - Each version records: training data version, git commit, experiment ID
     - Enables full reproducibility and audit trail
     - Linked to A/B experiment results

TOOLING: MLflow, BentoML, Seldon Core, or custom registry on S3 + DynamoDB
""")


def design_vector_db_sharding():
    print("""
[DESIGN] Vector Database Sharding Strategy
==========================================
OVERVIEW:
  Shard a vector index across N nodes to support 1B+ vectors
  while maintaining sub-10 ms retrieval and high availability.

COMPONENTS:
  1. Horizontal Sharding by Embedding Space
     - Cluster embedding space into K clusters (K-Means at index time)
     - Each cluster → one shard; related vectors co-located
     - Reduces cross-shard fan-out for typical queries

  2. Consistent Hashing (Alternative)
     - Hash vector_id → ring position → shard assignment
     - Adding/removing nodes: only 1/N vectors need remapping
     - Better for write-heavy workloads; worse for ANN locality

  3. Replication
     - Each shard: 1 leader + 2 followers (quorum writes, read from any)
     - Raft consensus for leader election
     - Cross-AZ replication for durability; RTO < 30 s on node failure

  4. Query Fan-Out
     - Query sent to all N shards in parallel (scatter phase)
     - Each shard returns top-K local candidates
     - Coordinator merges N×K results, re-scores, returns global top-K
     - Network overhead: N × K × embedding_bytes per query

  5. Merging Results
     - Merge by cosine similarity score (descending)
     - De-duplicate by vector_id
     - Optional: re-rank merged set with full-precision scoring

  6. Rebalancing
     - Triggered when shard size exceeds threshold or cluster grows
     - Incremental migration: copy shard data, verify, then switch routing
     - No downtime; old shard serves reads during migration

TYPICAL NUMBERS:
  - 1B vectors at dim=768 → ~3 TB; 10 shards of 300 GB each
  - Fan-out latency: 5 ms within same AZ
  - Total retrieval: scatter (5 ms) + merge (1 ms) = ~6 ms p50
""")


def estimate_gpu_capacity():
    print("""
[DESIGN] GPU Capacity Estimation — 1M Requests/Day
===================================================

STEP 1: Request Rate
  1,000,000 req/day ÷ 86,400 s/day ≈ 11.6 req/s (average)
  Peak-to-average ratio: 3× → peak load ≈ 35 req/s

STEP 2: Latency Budget & Throughput per GPU
  Assume: GPT-3.5-class model, ~500 token output
  Inference time per request (no batching): ~1 s on 1× A10G
  With dynamic batching (batch size = 8): ~0.2 s/req amortized
  Throughput per GPU: 1 / 0.2 = 5 req/s sustained

STEP 3: GPUs Required for Average Load
  Average req/s: 11.6
  GPUs needed (average): 11.6 / 5 ≈ 3 GPUs

STEP 4: GPUs Required for Peak Load
  Peak req/s: 35
  GPUs needed (peak): 35 / 5 = 7 GPUs

STEP 5: Redundancy Factor
  N+1 redundancy → add 1 GPU per availability zone (3 AZs)
  Overhead for shadow deployment + canary: +1 GPU
  Total: 7 (peak) + 3 (AZ redundancy) + 1 (canary) = 11 GPUs

STEP 6: Batch Size Optimization
  Larger batch → higher GPU utilization but higher latency
  Latency SLO: p99 < 2 s → max batch size = 16
  Tune: batch_size=8 balances utilization (75%) and latency

SUMMARY:
  Fleet size: 11 × A10G GPUs (or 6 × A100 at 2× throughput)
  Auto-scaling: scale up when GPU utilization > 70% for 60 s
  Cost estimate: 11 × $1.20/hr ≈ $316/day on AWS

VARIABLES THAT CHANGE ESTIMATE:
  - Model size (larger → fewer req/s/GPU)
  - Context length (longer → more memory, lower throughput)
  - Quantization (INT8 → ~2× throughput)
  - Caching hit rate (30% cache hit → reduce fleet by 30%)
""")


def design_llm_caching():
    print("""
[DESIGN] Caching Strategy for LLM Responses
============================================
OVERVIEW:
  Reduce LLM API costs and latency by caching responses.
  Two tiers: exact-match (fast) and semantic (fuzzy).

COMPONENTS:
  1. Exact-Match Cache
     - Key: SHA-256(model + system_prompt + user_message)
     - Storage: Redis with TTL
     - Hit rate: ~15–30% for FAQ-style applications
     - Latency: ~1 ms vs 1–5 s for LLM call
     - Invalidation: manual purge on content update; TTL = 24 h

  2. Semantic Cache
     - Key: embedding of user query (text-embedding-3-small)
     - Storage: vector DB (Redis with VSS or Qdrant)
     - Match: cosine similarity > 0.97 threshold → cache hit
     - Hit rate: ~10–20% additional on top of exact-match
     - Risk: semantically similar ≠ same answer; tune threshold carefully

  3. TTL Policies
     - Static content (documentation Q&A): TTL = 7 days
     - Semi-static (product info): TTL = 1 h
     - Dynamic (personalized, real-time): no caching
     - Time-sensitive queries ("what's today's news"): no caching

  4. Cache Invalidation
     - Content-based: invalidate when source document updated
     - Event-driven: Kafka event on doc update → purge related keys
     - Scheduled: nightly purge of low-hit-rate entries
     - Manual API: POST /cache/invalidate with query pattern

  5. Cache Warming
     - On deployment: pre-compute embeddings for top-1000 queries
     - Background job: embed popular queries from logs during off-peak

  6. Metrics & Monitoring
     - Cache hit rate (target > 25%)
     - Cost savings: (hits × avg_cost_per_call)
     - False positive rate for semantic cache (sample + human review)

IMPLEMENTATION STACK:
  Redis 7.x with RedisJSON + RediSearch for combined exact + vector cache
  Alternatively: Qdrant for semantic + Redis for exact
""")


def design_data_flywheel():
    print("""
[DESIGN] Data Flywheel (Model → Data → Retrain Loop)
======================================================
OVERVIEW:
  Virtuous cycle where production usage generates labeled data that
  improves the next model version, which drives more usage.

COMPONENTS:
  1. User Interaction Logging
     - Capture: queries, model outputs, user actions (click, edit, reject)
     - Logged via SDK event tracking → Kafka → data lake (S3/Delta)
     - Schema: {session_id, user_id, input, output, feedback, timestamp}
     - PII scrubbed before storage; consent gating per jurisdiction

  2. Data Quality Filtering
     - Deduplication by content hash
     - Language detection; filter non-target languages
     - Length filters: remove too-short / too-long samples
     - Toxicity / safety classifier to remove harmful content
     - Quality score via reward model; threshold top 80%

  3. Human-in-the-Loop (HITL) Labeling
     - Uncertainty sampling: send low-confidence model outputs to labelers
     - Comparison labeling: A vs B (used for RLHF reward model training)
     - Platforms: Scale AI, LabelBox, or internal annotation tool
     - Inter-annotator agreement (IAA) > 0.8 Kappa required

  4. Retraining Trigger
     - Schedule: weekly retraining if sufficient new data (> 10K samples)
     - Drift trigger: input distribution shift detected (KL divergence > 0.1)
     - Performance trigger: online metrics drop > 3% over 48 h
     - Human trigger: manual kickoff after major product change

  5. Deployment Loop
     - New model: shadow deploy → canary → full rollout (see versioning design)
     - Automated regression tests against golden eval set
     - Rollback if eval set performance drops

FLYWHEEL ACCELERATION:
  - More users → more data → better model → more users
  - Key metric: data collection rate (samples/day) and label quality
  - Bottleneck usually: labeling throughput; invest in active learning

EXAMPLES: Google Search, GitHub Copilot, ChatGPT all use this pattern
""")


def ai_system_design_template():
    print("""
[TEMPLATE] AI System Design Document
=====================================

1. EXECUTIVE SUMMARY
   - Problem statement (1–2 sentences)
   - Proposed solution (1–2 sentences)
   - Key metrics for success
   - Timeline and owners

2. REQUIREMENTS
   Functional:
   - Core capabilities the system must provide
   - User-facing behaviors and outputs
   Non-Functional:
   - Scale: QPS, data volume, user count
   - Latency: p50 / p99 SLOs
   - Availability: 99.9% / 99.99% SLA
   - Cost budget per request

3. ARCHITECTURE DIAGRAM (Description)
   - Data sources → Feature pipeline → Model serving → Output consumers
   - Offline path (training) vs online path (serving)
   - Caching and storage layers
   - Monitoring and observability stack

4. COMPONENT BREAKDOWN
   For each component:
   - Purpose
   - Technology choice + alternatives considered
   - Inputs / outputs / API contract
   - Scaling strategy

5. DATA FLOW
   - Training data: source → processing → storage → training
   - Serving: request → feature lookup → inference → response
   - Feedback: user action → logging → labeling → retraining

6. SLOs (Service Level Objectives)
   - Latency: p50 < X ms, p99 < Y ms
   - Availability: 99.9% uptime (< 8.7 h downtime/year)
   - Accuracy: offline AUC > Z; online CTR lift > W%
   - Data freshness: features updated within N minutes

7. RISKS & MITIGATIONS
   - Data quality risk → validation gates, monitoring
   - Model drift → automated retraining, drift detection
   - Cold start → fallback rules, content-based filtering
   - Privacy breach → PII scrubbing, access controls, audit logs
   - Dependency failure → circuit breakers, fallback models

8. OPEN QUESTIONS
   - What is the labeling strategy for new data?
   - How are model decisions explained to users / regulators?
   - What is the rollback SLA if a bad model is deployed?
""")


def main():
    print("=== Solution 6.1: AI System Design ===\n")
    design_recommendation_system()
    design_fraud_detection()
    design_rag_search()
    design_multitenant_llm_api()
    design_feature_store()
    design_ab_testing_framework()
    design_training_pipeline()
    design_realtime_nlp_pipeline()
    design_inference_trade_offs()
    design_model_versioning()
    design_vector_db_sharding()
    estimate_gpu_capacity()
    design_llm_caching()
    design_data_flywheel()
    ai_system_design_template()


if __name__ == "__main__":
    main()
