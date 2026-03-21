# ============================================================
# Examples 6.1 — AI System Design (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import math

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """What makes a good AI system design answer"""
    print("Ex01 — Good AI System Design Answer:")
    answer = """
  1. Clarify requirements (functional + non-functional)
  2. Estimate scale (users, QPS, storage)
  3. High-level architecture (components + data flow)
  4. Deep dive into critical components
  5. Address trade-offs explicitly
  6. Discuss scaling, reliability, monitoring
  7. Summarize and invite questions"""
    print(answer)

def ex02():
    """Requirements gathering template"""
    print("Ex02 — Requirements Gathering Template:")
    template = """
  FUNCTIONAL REQUIREMENTS:
    - Core ML task (classification/regression/generation/ranking)
    - Input/output schema
    - User-facing features
    - Batch vs real-time serving
  NON-FUNCTIONAL REQUIREMENTS:
    - Latency SLA (p50/p95/p99)
    - Throughput (QPS)
    - Availability (99.9% = 8.7 hrs downtime/yr)
    - Data freshness (real-time/hourly/daily)"""
    print(template)

def ex03():
    """Functional vs non-functional requirements"""
    print("Ex03 — Functional vs Non-Functional Requirements:")
    examples = """
  FUNCTIONAL (WHAT the system does):
    - Generate product recommendations for users
    - Detect fraudulent transactions in <100ms
    - Translate text between 50 languages
  NON-FUNCTIONAL (HOW WELL the system does it):
    - Latency: p99 < 200ms
    - Availability: 99.99% uptime
    - Throughput: 50,000 QPS
    - Storage: petabyte-scale"""
    print(examples)

def ex04():
    """Capacity estimation formula"""
    print("Ex04 — Capacity Estimation Formula:")
    formula = """
  QPS  = daily_active_users * requests_per_user / 86400
  Peak = avg_QPS * peak_factor (typically 2-5x)
  Storage/day = QPS * avg_request_size_bytes * 86400
  Bandwidth   = QPS * avg_response_size_bytes"""
    print(formula)
    dau = 10_000_000
    rpd = 5
    qps = dau * rpd / 86400
    print(f"  Example: 10M DAU, 5 req/day → QPS = {qps:.0f}")

def ex05():
    """Back-of-envelope: users → QPS → storage"""
    print("Ex05 — Back-of-Envelope Calculation:")
    users = 100_000_000
    req_per_day = 10
    avg_size_kb = 2
    qps = users * req_per_day / 86400
    peak_qps = qps * 3
    storage_gb_day = (qps * avg_size_kb * 86400) / (1024 ** 2)
    storage_tb_year = storage_gb_day * 365 / 1024
    print(f"  Users: {users:,}")
    print(f"  Avg QPS: {qps:,.0f} | Peak QPS: {peak_qps:,.0f}")
    print(f"  Storage/day: {storage_gb_day:.1f} GB")
    print(f"  Storage/year: {storage_tb_year:.1f} TB")

def ex06():
    """Data flow diagram concept"""
    print("Ex06 — Data Flow Diagram Concept:")
    diagram = """
  [User] → [API Gateway] → [Feature Service] → [Model Server]
                ↓                  ↓                  ↓
          [Auth/Rate]      [Feature Store]     [Prediction]
                                   ↑                  ↓
                         [Data Pipeline]      [Response Cache]
                                   ↑                  ↓
                          [Raw Data Store]      [User/Client]"""
    print(diagram)

def ex07():
    """CAP theorem for ML systems"""
    print("Ex07 — CAP Theorem for ML Systems:")
    cap = """
  CAP: Consistency, Availability, Partition Tolerance (pick 2)
  ML System Examples:
    CP (Consistency + Partition): Model registry, feature store
       → Sacrifice availability for consistent model versions
    AP (Availability + Partition): Recommendation serving
       → Serve stale features rather than fail the request
    CA (Consistency + Availability): Dev/test environments
       → No network partitions assumed
  Rule: In distributed ML, choose AP for serving, CP for training"""
    print(cap)

def ex08():
    """Latency vs throughput tradeoff"""
    print("Ex08 — Latency vs Throughput Tradeoff:")
    tradeoff = """
  LATENCY: Time to complete one request (ms)
    - Optimize: caching, model compression, hardware acceleration
  THROUGHPUT: Requests handled per second (QPS)
    - Optimize: batching, horizontal scaling, async processing
  TRADEOFF:
    Batching ↑ throughput but ↑ latency (wait to fill batch)
    Smaller models ↓ latency but may ↓ accuracy
    More replicas ↑ throughput but ↑ cost
  Rule: optimize for P99 latency, not mean latency"""
    print(tradeoff)

def ex09():
    """Consistency vs availability in ML"""
    print("Ex09 — Consistency vs Availability in ML:")
    analysis = """
  CONSISTENCY (all nodes see same data at same time):
    - Model versions consistent across replicas
    - Feature values consistent between training and serving
    - Critical for: fraud detection, financial ML
  AVAILABILITY (system always responds):
    - Return cached prediction if model is updating
    - Serve previous model version during deployment
    - Critical for: recommendation, search ranking
  EVENTUAL CONSISTENCY: Most ML systems use this
    - Features eventually consistent across data centers
    - Model updates propagate gradually"""
    print(analysis)

def ex10():
    """ACID vs BASE for ML data"""
    print("Ex10 — ACID vs BASE for ML Data:")
    comparison = """
  ACID (SQL databases, e.g., PostgreSQL):
    Atomicity, Consistency, Isolation, Durability
    Use for: labels, annotations, model metadata, lineage
  BASE (NoSQL, e.g., Cassandra, DynamoDB):
    Basically Available, Soft state, Eventually consistent
    Use for: feature store, high-throughput logs, events
  ML DATA STRATEGY:
    Training data → ACID (correctness critical)
    Online features → BASE (availability > consistency)
    Model metadata → ACID (versioning, lineage)"""
    print(comparison)

def ex11():
    """Microservices vs monolith for ML"""
    print("Ex11 — Microservices vs Monolith for ML:")
    comparison = """
  MONOLITH ML:
    + Simple deployment, easy debugging
    + No network latency between components
    - Hard to scale individual components
    - Tech lock-in (all Python, all GPU)
    Good for: startups, prototypes, <10 engineers
  MICROSERVICES ML:
    + Independent scaling (feature store vs model server)
    + Technology diversity (Go API + Python ML)
    + Independent deployment and testing
    - Distributed systems complexity
    Good for: scale, large teams, production systems"""
    print(comparison)

def ex12():
    """Event-driven architecture for ML"""
    print("Ex12 — Event-Driven Architecture for ML:")
    architecture = """
  EVENT-DRIVEN ML PATTERN:
    Producer: User action → Kafka topic "user-events"
    Consumer 1: Feature pipeline → update feature store
    Consumer 2: Retraining trigger → detect data drift
    Consumer 3: Monitoring → alert on anomalies
  BENEFITS:
    - Decoupled components (producers don't know consumers)
    - Natural audit log for training data
    - Easy to add new consumers (A/B testing)
  TOOLS: Kafka, Kinesis, Pub/Sub, EventBridge"""
    print(architecture)

def ex13():
    """API-first design for ML"""
    print("Ex13 — API-First Design for ML:")
    design = """
  API-FIRST APPROACH:
    1. Define API contract before implementation
    2. Mock API for frontend/client development
    3. Versioning from day 1 (v1, v2)
  ML PREDICTION API:
    POST /v1/predict
    Request:  {"user_id": str, "context": dict, "k": int}
    Response: {"predictions": list, "model_version": str,
               "latency_ms": float, "request_id": str}
  PRINCIPLES:
    - Stable interface decouples model from clients
    - Version to allow backward-compatible changes
    - Include metadata (model_version, latency) always"""
    print(design)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Design a recommendation system"""
    print("Ex14 — Design: Recommendation System")
    design = """
  OVERVIEW: Personalized item recommendations at scale (Netflix/Amazon style)

  COMPONENTS:
    - Candidate Generation: ANN search on user/item embeddings (FAISS)
    - Ranking Model: Deep learning model scoring top-K candidates
    - Feature Store: Real-time user features (last 10 interactions)
    - A/B Testing Layer: Experiment framework for ranking models
    - Result Cache: Redis cache for non-personalized top-N

  DATA FLOW:
    Offline: User-item interactions → collaborative filtering →
             item/user embeddings stored in vector DB
    Online:  Request → fetch user embedding → ANN search 500 candidates
             → ranking model scores candidates → return top-10

  SCALING:
    - Candidate generation: FAISS index sharded across nodes
    - Ranking: GPU inference, batch users in single request
    - 100M users: partition embeddings by user_id % num_shards

  TRADE-OFFS:
    - Accuracy vs Latency: fewer candidates = faster but less accurate
    - Freshness vs Cost: real-time features cost 10x batch features
    - Diversity vs Relevance: pure relevance leads to filter bubbles"""
    print(design)

def ex15():
    """Design a fraud detection system"""
    print("Ex15 — Design: Fraud Detection System")
    design = """
  OVERVIEW: Real-time transaction fraud detection (<100ms p99)

  COMPONENTS:
    - Rule Engine: Fast hard rules (amount > $10K, new country)
    - ML Scorer: Gradient boosting on 200+ features
    - Graph Engine: Transaction network analysis (ring fraud)
    - Case Management: Analyst review queue for borderline cases
    - Feedback Loop: Confirmed fraud → retraining pipeline

  DATA FLOW:
    Transaction → Rule Engine (block obvious fraud) →
    Feature Service (200ms window aggregations) →
    ML Model (fraud probability score) →
    Decision: approve / review / decline

  SCALING:
    - Sub-100ms: pre-compute aggregation features in Redis
    - Rule engine in Rust/Go for microsecond latency
    - Model: XGBoost with ONNX runtime for fast inference

  TRADE-OFFS:
    - Precision vs Recall: false positive = customer friction,
      false negative = financial loss
    - Speed vs Accuracy: real-time rules + async deep model
    - Explainability: SHAP values for analyst review"""
    print(design)

def ex16():
    """Design a content moderation system"""
    print("Ex16 — Design: Content Moderation System")
    design = """
  OVERVIEW: Automated + human content moderation at platform scale

  COMPONENTS:
    - Text Classifier: Hate speech, spam, misinformation detection
    - Image/Video Scanner: NSFW, violence, copyright detection
    - Appeal System: User appeals → human review queue
    - Policy Engine: Country-specific content rules
    - Shadow Ban / Soft Moderation: hide without notifying

  DATA FLOW:
    Content upload → async moderation pipeline →
    Multi-modal classifiers → confidence threshold →
    High confidence: auto-action | Low: human queue

  SCALING:
    - Async processing: decouple upload from moderation
    - Priority queue: viral content moderated first
    - Active learning: human labels → retrain classifiers

  TRADE-OFFS:
    - False positives harm creators (over-moderation)
    - False negatives harm users (under-moderation)
    - Speed vs Accuracy: 2-stage (fast → deep)"""
    print(design)

def ex17():
    """Design a search ranking system"""
    print("Ex17 — Design: Search Ranking System")
    design = """
  OVERVIEW: Relevance-ranked search over large document corpus

  COMPONENTS:
    - Query Understanding: intent classification, entity extraction
    - Retrieval: BM25 + dense retrieval (bi-encoder embeddings)
    - Ranking: cross-encoder reranker on top-100 candidates
    - Personalization: user query history, click signals
    - Query Serving: low-latency serving layer with caching

  DATA FLOW:
    Query → parse intent → BM25 recall 1000 docs →
    Dense retrieval recall 500 docs → merge → dedup →
    Reranker scores top-100 → personalization boost →
    Return top-10 with snippets

  SCALING:
    - Inverted index sharded by document hash
    - Embedding index: HNSW graph, approximate NN
    - Cache popular queries (80% cache hit for top-1% queries)

  TRADE-OFFS:
    - BM25 (fast, keyword) vs Dense (slow, semantic)
    - Two-stage: retrieval recall vs ranking precision
    - Personalization: relevance vs filter bubble"""
    print(design)

def ex18():
    """Design a real-time translation system"""
    print("Ex18 — Design: Real-Time Translation System")
    design = """
  OVERVIEW: Low-latency neural machine translation (speech/text)

  COMPONENTS:
    - Language Detection: fastText classifier (<1ms)
    - Text Translation: MarianMT / NLLB-200 model
    - Speech-to-Text: Whisper (streaming mode)
    - Text-to-Speech: neural TTS for output
    - Streaming Pipeline: chunk-based translation

  DATA FLOW:
    Audio stream → ASR (speech-to-text, 200ms chunks) →
    Language detect → translation model →
    TTS → audio output stream (end-to-end ~500ms)

  SCALING:
    - GPU batching: group requests by language pair
    - Model distillation: 6-layer vs 12-layer for 2x speedup
    - Regional deployment: co-locate with users

  TRADE-OFFS:
    - Quality vs Speed: larger model better quality, more latency
    - Streaming vs Sentence-level: streaming faster, lower quality
    - Generic vs Domain: general model vs medical/legal specialized"""
    print(design)

def ex19():
    """Design a predictive maintenance system"""
    print("Ex19 — Design: Predictive Maintenance System")
    design = """
  OVERVIEW: Predict equipment failures before they occur (IoT + ML)

  COMPONENTS:
    - IoT Data Ingestion: sensor streams (temperature, vibration)
    - Time-Series Feature Engineering: rolling stats, FFT features
    - Anomaly Detection: isolation forest + LSTM autoencoder
    - Failure Prediction: gradient boosting (RUL estimation)
    - Alert System: priority-based maintenance scheduling

  DATA FLOW:
    Sensors (10Hz) → Kafka → stream processing (windowed features) →
    Anomaly detector → threshold alert →
    Failure predictor (daily batch) → maintenance calendar

  SCALING:
    - Edge processing: lightweight model on device for latency
    - Time-series DB: InfluxDB or TimescaleDB
    - Federated models: one model per machine type

  TRADE-OFFS:
    - Early warning vs False alarms: tune recall vs precision
    - Edge vs Cloud inference: latency vs model complexity
    - Unsupervised (anomaly) vs Supervised (failure labels)"""
    print(design)

def ex20():
    """Design a churn prediction system"""
    print("Ex20 — Design: Churn Prediction System")
    design = """
  OVERVIEW: Predict and prevent customer churn (subscription businesses)

  COMPONENTS:
    - Feature Engineering: engagement metrics, payment history
    - Churn Scorer: gradient boosting (weekly batch scoring)
    - Segmentation: high/medium/low risk segments
    - Intervention Engine: personalized retention offers
    - Lift Model: measure intervention effectiveness

  DATA FLOW:
    Weekly: all active users → feature extraction →
    Churn model scores → risk segments →
    High risk → intervention campaign →
    A/B test: control vs treatment → measure retention lift

  SCALING:
    - Batch scoring: 10M users in <1 hour with Spark
    - Feature store: pre-computed engagement features
    - Experiment tracking: MLflow for model versions

  TRADE-OFFS:
    - Intervention cost vs Churn cost: only intervene if ROI > 0
    - Model accuracy vs Explainability: SHAP for business buy-in
    - Proactive vs Reactive: predict 30/60/90 days ahead"""
    print(design)

def ex21():
    """Design a price optimization system"""
    print("Ex21 — Design: Price Optimization System")
    design = """
  OVERVIEW: Dynamic pricing to maximize revenue (e-commerce/ride-share)

  COMPONENTS:
    - Demand Forecasting: time-series model (LightGBM)
    - Price Elasticity Model: estimate demand change per $1
    - Optimization Engine: maximize revenue given constraints
    - Competitor Price Monitor: scrape and index competitor prices
    - Pricing Rules: floor/ceiling prices, promotions override

  DATA FLOW:
    Market signals + inventory + competitor prices →
    Demand forecast + elasticity estimation →
    Revenue optimization (LP/RL solver) →
    Price recommendation → rules override →
    Published price (updated hourly)

  SCALING:
    - Per-SKU models: millions of items need distributed compute
    - Near real-time: Spark Streaming + pre-cached elasticities
    - Guardrails: hard constraints on price changes (max ±20%)

  TRADE-OFFS:
    - Short-term revenue vs Customer trust (price fairness)
    - Personalized vs Market prices: legal/ethical concerns
    - Optimization complexity vs Explainability"""
    print(design)

def ex22():
    """Data pipeline design (ETL/ELT)"""
    print("Ex22 — Data Pipeline Design: ETL vs ELT")
    design = """
  ETL (Extract, Transform, Load):
    Data Source → Transform (in pipeline) → Data Warehouse
    + Transformed data ready to query immediately
    + Sensitive data can be masked before loading
    - Transform bottleneck limits scale
    Tools: Apache Spark, dbt (with external compute)

  ELT (Extract, Load, Transform):
    Data Source → Raw Data Lake → Transform (in warehouse)
    + Raw data preserved for reprocessing
    + Transform leverages warehouse compute
    - Raw data may contain PII / sensitive info
    Tools: Fivetran + dbt + Snowflake/BigQuery

  ML DATA PIPELINE:
    Raw events → Data Lake (S3) → dbt transforms →
    Feature Store → Training data → Model →
    Predictions → Monitoring"""
    print(design)

def ex23():
    """Feature store design"""
    print("Ex23 — Feature Store Design")
    design = """
  OVERVIEW: Centralized repository for ML features (training + serving)

  ARCHITECTURE:
    Offline Store: historical features for training
      - S3/GCS parquet files, partitioned by date
      - Point-in-time correct joins (no data leakage)
    Online Store: low-latency features for serving
      - Redis / DynamoDB, key = entity_id
      - p99 latency < 10ms
    Feature Registry: metadata, lineage, documentation

  DATA FLOW (Feature Pipeline):
    Raw data → feature computation → write to offline store
    Batch sync: offline → online store (hourly)
    Stream: Kafka → feature computation → online store (real-time)

  KEY CONCEPTS:
    - Point-in-time correctness: training mimics serving
    - Feature reuse: one feature, many models
    - Backfilling: compute historical features

  TOOLS: Feast, Tecton, Vertex AI Feature Store, Hopsworks"""
    print(design)

def ex24():
    """Model registry design"""
    print("Ex24 — Model Registry Design")
    design = """
  OVERVIEW: Versioned catalog of ML models with lifecycle management

  COMPONENTS:
    - Model Storage: versioned artifacts (weights, code, config)
    - Metadata: metrics, training params, data version
    - Lineage: data → training run → model version
    - Stage Management: Staging → Canary → Production
    - Access Control: who can promote/deprecate models

  LIFECYCLE STATES:
    None → Staging (passed unit tests) →
    Canary (5% traffic, A/B test) →
    Production (100% traffic) →
    Archived (deprecated)

  API:
    register_model(name, version, artifact_uri, metrics)
    promote_model(name, version, stage)
    load_model(name, stage="Production")

  TOOLS: MLflow Model Registry, SageMaker Model Registry"""
    print(design)

def ex25():
    """ML gateway design"""
    print("Ex25 — ML Gateway Design")
    design = """
  OVERVIEW: Single entry point for all ML model serving (like API gateway)

  COMPONENTS:
    - Request Router: route to correct model/version
    - Authentication: API key / JWT validation
    - Rate Limiter: per-client QPS limits
    - Request/Response Logging: for monitoring and debugging
    - A/B Test Engine: traffic splitting across model versions
    - Circuit Breaker: fallback if model service down
    - Response Cache: cache identical requests

  REQUEST FLOW:
    Client → TLS termination → Auth → Rate limit →
    A/B split → Model service → Log → Cache →
    Response to client

  BENEFITS:
    - Decouple clients from model versions
    - Centralized auth, logging, rate limiting
    - Easy canary deployments (5% → 50% → 100%)

  TOOLS: NGINX + Lua, Envoy, Kong, custom FastAPI gateway"""
    print(design)

def ex26():
    """Design a real-time + batch hybrid ML system"""
    print("Ex26 — Design: Hybrid Real-Time + Batch ML System")
    design = """
  OVERVIEW: Lambda architecture adapted for ML workloads

  BATCH LAYER (high accuracy, high latency):
    - Full historical data reprocessing
    - Complex feature engineering
    - Model retraining (daily/weekly)
    - Output: precomputed recommendations, embeddings

  SPEED LAYER (low accuracy, low latency):
    - Real-time event processing (last N minutes)
    - Simple features (count, recency)
    - Lightweight model or rule-based
    - Output: real-time personalization signals

  SERVING LAYER:
    - Merge batch + speed layer outputs
    - Batch result = base score
    - Speed layer = recency boost
    - Final score = α * batch + (1-α) * real_time

  EXAMPLE: Recommendations
    Batch: weekly collaborative filtering scores
    Speed: real-time click/search session features
    Serving: combine for personalized ranking"""
    print(design)

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """System design capacity calculator class"""
    print("Ex27 — System Design Capacity Calculator:")
    class CapacityCalculator:
        def __init__(self, dau, requests_per_user, avg_request_kb, replication=3):
            self.dau = dau
            self.rpd = requests_per_user
            self.req_kb = avg_request_kb
            self.replication = replication
        def qps(self): return self.dau * self.rpd / 86400
        def peak_qps(self, factor=3): return self.qps() * factor
        def storage_gb_per_day(self):
            return self.qps() * self.req_kb * 86400 / (1024 ** 2)
        def storage_tb_per_year(self):
            return self.storage_gb_per_day() * 365 * self.replication / 1024
        def report(self):
            print(f"  DAU: {self.dau:,} | Requests/day/user: {self.rpd}")
            print(f"  Avg QPS: {self.qps():,.0f} | Peak QPS: {self.peak_qps():,.0f}")
            print(f"  Storage/day: {self.storage_gb_per_day():.1f} GB")
            print(f"  Storage/year (x{self.replication} replication): {self.storage_tb_per_year():.1f} TB")
    calc = CapacityCalculator(dau=50_000_000, requests_per_user=20, avg_request_kb=5)
    calc.report()

def ex28():
    """Design document template generator"""
    print("Ex28 — Design Document Template Generator:")
    def generate_design_doc(system_name, scale, latency_sla):
        return f"""
  # {system_name} — System Design Document
  ## 1. Requirements
     Functional: [list core features]
     Non-Functional: Scale={scale}, Latency={latency_sla}
  ## 2. Capacity Estimation
     [QPS, storage, bandwidth calculations]
  ## 3. High-Level Design
     [Architecture diagram description]
  ## 4. Component Deep Dives
     [Per-component design decisions]
  ## 5. Data Model
     [Schema, storage choices]
  ## 6. API Design
     [Endpoints, request/response]
  ## 7. Scaling & Reliability
     [Horizontal scaling, replication, failover]
  ## 8. Trade-offs & Alternatives
     [Decisions made and why]"""
    print(generate_design_doc("Fraud Detection System", "10M txn/day", "p99 < 100ms"))

def ex29():
    """Trade-off analysis function"""
    print("Ex29 — Trade-Off Analysis Function:")
    def analyze_tradeoffs(option_a, option_b, dimensions):
        print(f"  TRADE-OFF: {option_a} vs {option_b}")
        print(f"  {'Dimension':<20} {option_a:<20} {option_b:<20}")
        print("  " + "-" * 60)
        for dim, (score_a, score_b) in dimensions.items():
            winner = option_a if score_a > score_b else option_b
            print(f"  {dim:<20} {score_a:<20} {score_b:<20} ← {winner}")
    tradeoffs = {
        "Latency":      (9, 5),
        "Accuracy":     (6, 9),
        "Cost":         (8, 5),
        "Scalability":  (7, 8),
        "Simplicity":   (9, 4),
    }
    analyze_tradeoffs("Rule-Based", "ML Model", tradeoffs)

def ex30():
    """Component dependency mapper"""
    print("Ex30 — Component Dependency Mapper:")
    dependencies = {
        "API Gateway":      ["Auth Service", "Rate Limiter", "Model Server"],
        "Model Server":     ["Feature Store", "Model Registry"],
        "Feature Store":    ["Feature Pipeline", "Online Store", "Offline Store"],
        "Feature Pipeline": ["Raw Data Lake", "Stream Processor"],
        "Monitoring":       ["Model Server", "Feature Store", "API Gateway"],
    }
    def print_deps(deps, visited=None, indent=0):
        if visited is None:
            visited = set()
        for component, children in deps.items():
            if component not in visited:
                visited.add(component)
                print(f"  {'  ' * indent}{component}")
                for child in children:
                    print(f"  {'  ' * (indent+1)}└─ {child}")
    print_deps(dependencies)

def ex31():
    """SLA calculator (availability %, downtime budget)"""
    print("Ex31 — SLA Calculator (Availability & Downtime Budget):")
    slas = [99.0, 99.9, 99.95, 99.99, 99.999]
    print(f"  {'SLA':<10} {'Downtime/Year':<20} {'Downtime/Month':<20} {'Downtime/Week'}")
    print("  " + "-" * 70)
    for sla in slas:
        unavail = 1 - sla / 100
        yr  = unavail * 365 * 24 * 60
        mo  = unavail * 30 * 24 * 60
        wk  = unavail * 7 * 24 * 60
        def fmt(m):
            if m >= 60: return f"{m/60:.1f} hr"
            elif m >= 1: return f"{m:.1f} min"
            else: return f"{m*60:.0f} sec"
        print(f"  {sla:<10} {fmt(yr):<20} {fmt(mo):<20} {fmt(wk)}")

def ex32():
    """Error budget calculator"""
    print("Ex32 — Error Budget Calculator:")
    def error_budget(sla_pct, window_days=30, daily_requests=1_000_000):
        allowed_downtime_min = (1 - sla_pct/100) * window_days * 24 * 60
        total_requests = daily_requests * window_days
        allowed_errors = total_requests * (1 - sla_pct/100)
        print(f"  SLA: {sla_pct}% over {window_days} days")
        print(f"  Allowed downtime: {allowed_downtime_min:.1f} minutes")
        print(f"  Allowed errors: {allowed_errors:,.0f} / {total_requests:,} total requests")
        print(f"  Error rate budget: {(1-sla_pct/100)*100:.4f}%")
        burn_rate = 5  # 5x normal rate
        budget_exhaustion_days = window_days / burn_rate
        print(f"  At {burn_rate}x burn rate: budget exhausted in {budget_exhaustion_days:.1f} days")
    error_budget(99.9)

def ex33():
    """System design review checklist"""
    print("Ex33 — System Design Review Checklist:")
    checklist = {
        "Requirements": [
            "Functional requirements defined",
            "Non-functional requirements (latency, QPS, availability) defined",
            "Scale estimated (users, data volume)",
        ],
        "Architecture": [
            "High-level diagram described",
            "Key components identified",
            "Data flow explained end-to-end",
        ],
        "Data": [
            "Data model defined",
            "Storage technology justified",
            "Data pipeline described",
        ],
        "Reliability": [
            "Single points of failure addressed",
            "Replication strategy defined",
            "Failover mechanism described",
        ],
        "Trade-offs": [
            "Alternatives considered",
            "Trade-offs explicitly stated",
            "Design decisions justified",
        ],
    }
    for section, items in checklist.items():
        print(f"  [{section}]")
        for item in items:
            print(f"    ☐ {item}")

def ex34():
    """Architecture diagram description generator"""
    print("Ex34 — Architecture Diagram Description Generator:")
    def describe_architecture(layers):
        print("  ML SYSTEM ARCHITECTURE:")
        print("  " + "=" * 50)
        for layer_name, components in layers.items():
            print(f"  ┌─ {layer_name.upper()} LAYER ─────────────────────┐")
            for comp in components:
                print(f"  │  [{comp}]")
            print("  └" + "─" * 42 + "┘")
    layers = {
        "Client":   ["Web App", "Mobile App", "API Client"],
        "Gateway":  ["Load Balancer", "API Gateway", "Auth Service"],
        "ML":       ["Feature Service", "Model Server", "A/B Router"],
        "Data":     ["Feature Store", "Model Registry", "Data Lake"],
        "Training": ["Spark Cluster", "GPU Training", "Experiment Tracker"],
    }
    describe_architecture(layers)

def ex35():
    """Scalability analysis"""
    print("Ex35 — Scalability Analysis:")
    def scalability_analysis(current_qps, target_multiplier):
        target_qps = current_qps * target_multiplier
        print(f"  Scaling from {current_qps:,} to {target_qps:,} QPS ({target_multiplier}x)")
        strategies = [
            ("Vertical scaling", "CPU/RAM upgrade", current_qps * 4, "Simple but has limits"),
            ("Horizontal scaling", "Add replicas", current_qps * 20, "Linear cost, preferred"),
            ("Caching", "Redis/CDN", current_qps * 10, "Only for cacheable requests"),
            ("Sharding", "Partition data", current_qps * 50, "Complex, but unlimited scale"),
        ]
        print(f"  {'Strategy':<22} {'Mechanism':<18} {'Max QPS':<12} {'Notes'}")
        for s, m, cap, note in strategies:
            sufficient = "✓" if cap >= target_qps else "✗"
            print(f"  {s:<22} {m:<18} {cap:<12,} {sufficient} {note}")
    scalability_analysis(10_000, 30)

def ex36():
    """Data consistency analysis"""
    print("Ex36 — Data Consistency Analysis:")
    analysis = """
  CONSISTENCY LEVELS (weakest → strongest):
  1. Eventual Consistency
     - All replicas converge given enough time
     - Latency: LOW | Availability: HIGH
     - ML use: feature store reads, recommendation cache
  2. Monotonic Read Consistency
     - User never reads older data after newer read
     - ML use: model version tracking per user
  3. Read-Your-Writes Consistency
     - Client always reads its own writes
     - ML use: user preference updates
  4. Strong Consistency
     - All reads reflect latest write
     - Latency: HIGH | Availability: LOWER
     - ML use: model registry promotions, labels

  RECOMMENDATION FOR ML:
    Training data writes: STRONG (no label corruption)
    Feature reads: EVENTUAL (availability > consistency)
    Model registry: STRONG (version conflicts catastrophic)"""
    print(analysis)

def ex37():
    """Security analysis for ML system"""
    print("Ex37 — Security Analysis for ML System:")
    security_layers = {
        "Network":    ["TLS 1.3 for all traffic", "VPC isolation", "Firewall rules"],
        "Auth":       ["API key for external", "mTLS for internal", "RBAC for data access"],
        "Data":       ["Encrypt at rest (AES-256)", "Encrypt in transit", "PII masking"],
        "Model":      ["Model artifact signing", "Adversarial input detection", "Output filtering"],
        "Audit":      ["All predictions logged", "Data access audit trail", "Model version lineage"],
        "Compliance": ["GDPR right to erasure", "Data residency", "Model explainability"],
    }
    print("  ML SYSTEM SECURITY LAYERS:")
    for layer, controls in security_layers.items():
        print(f"  [{layer.upper()}]")
        for control in controls:
            print(f"    → {control}")

def ex38():
    """Full system design: e-commerce recommendation"""
    print("Ex38 — Full System Design: E-Commerce Recommendation Engine")
    design = """
  SCALE: 50M DAU, 500M products, p99 < 200ms, 99.99% availability

  CAPACITY:
    QPS: 50M * 15 / 86400 ≈ 8,680 avg | 26,000 peak
    Storage: embeddings 500M * 128 * 4 bytes = 256 GB
    Feature store: 50M users * 1KB = 50 GB (fits in Redis)

  ARCHITECTURE:
    [Client] → [CDN (non-personalized)] → [API Gateway]
    → [Recommendation Service]
       ├─ [Candidate Gen: FAISS ANN on item embeddings]
       ├─ [Ranking: LightGBM with 100 features]
       └─ [Business Rules: inventory, margin, banned items]

  TRAINING PIPELINE:
    User events (Kafka) → Feature Store → Weekly training →
    Model Registry → A/B test → Canary → Production

  DATA STORES:
    User embeddings: Redis (50 GB, <1ms lookup)
    Item embeddings: FAISS (256 GB, <10ms ANN)
    Training data: S3 Parquet (2 years, ~100 TB)

  TRADE-OFFS:
    Two-stage (recall + rank): balances speed vs quality
    Weekly retraining: freshness vs cost
    Pre-computed non-personalized: performance vs personalization"""
    print(design)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Design for 1M users (step-by-step)"""
    print("Ex39 — Design for 1M Users (Step-by-Step):")
    design = """
  SCALE: 1M DAU — starter scale, manageable complexity

  STEP 1: Single-server estimation
    QPS: 1M * 10 / 86400 ≈ 116 req/s (single server handles this)
    Storage: 116 * 1KB * 86400 ≈ 10 GB/day

  STEP 2: Architecture
    [User] → [Single App Server + ML model] → [PostgreSQL]
    Add Redis cache for predictions (cache-aside)
    Background job for model retraining (cron)

  STEP 3: Single points of failure
    App server: add 1 standby (active-passive)
    Database: Postgres with streaming replication
    Cache: Redis Sentinel for failover

  STEP 4: ML serving
    Flask/FastAPI serving loaded model in memory
    Model reloaded on file change (no downtime)
    Prediction cache: 80% cache hit on popular items

  STEP 5: Monitoring
    Prometheus metrics, Grafana dashboards
    Alerting: p99 > 500ms or error rate > 1%

  VERDICT: Monolith + cache + replication is sufficient at 1M users"""
    print(design)

def ex40():
    """Design for 100M users (scaling)"""
    print("Ex40 — Design for 100M Users (Scaling Strategy):")
    design = """
  SCALE: 100M DAU — requires distributed architecture

  QPS: 100M * 10 / 86400 ≈ 11,600 | Peak: ~35,000

  SCALING CHANGES FROM 1M → 100M:
    App Tier: 10+ stateless servers behind load balancer
    Database: Read replicas (80% reads) + write primary
    Cache: Redis Cluster (distributed, 100GB+ data)
    CDN: Static assets + non-personalized content
    ML Serving: Dedicated GPU inference servers
    Feature Store: Distributed (Redis Cluster + Cassandra)
    Message Queue: Kafka for async event processing

  MICROSERVICES SPLIT:
    - API Service: routing, auth, rate limiting
    - Feature Service: real-time feature assembly
    - Prediction Service: model inference
    - Training Service: offline model training
    - Monitoring Service: drift detection, alerting

  DATABASE SHARDING:
    User data: shard by user_id % N_shards
    Item data: shard by item_id % N_shards
    Consistent hashing for shard routing

  VERDICT: Microservices + sharding + dedicated ML serving"""
    print(design)

def ex41():
    """Global ML system (multi-region)"""
    print("Ex41 — Global ML System (Multi-Region Design):")
    design = """
  SCALE: 500M global users, <100ms latency worldwide

  REGIONS: US-East, EU-West, APAC-Singapore, APAC-Tokyo

  ARCHITECTURE:
    Global:  GeoDNS routes users to nearest region
             Global load balancer (Anycast)
    Regional: Full ML serving stack in each region
              Local feature store (Redis)
              Local model replicas
    Global sync: Model weights synced to all regions
                 Training: centralized or federated

  DATA RESIDENCY (GDPR):
    EU users: data must stay in EU-West region
    US users: US-East + US-West replication only
    APAC: Singapore (primary) + Tokyo (DR)

  MODEL SYNC:
    New model → Model Registry (global) →
    Push to all regional stores (S3 CRR) →
    Regional servers hot-reload model →
    Total propagation: < 5 minutes

  CONSISTENCY CHALLENGE:
    Features may lag between regions (eventual consistency)
    Solution: serve with locally available features
    Training: use point-in-time features to avoid leakage

  LATENCY TARGETS:
    US: p99 < 50ms (co-located)
    EU: p99 < 80ms
    APAC: p99 < 100ms"""
    print(design)

def ex42():
    """Real-time + batch hybrid system"""
    print("Ex42 — Real-Time + Batch Hybrid ML System (Lambda + Kappa):")
    design = """
  LAMBDA ARCHITECTURE FOR ML:
    Batch Layer: Spark jobs, daily/weekly model retraining
                 High accuracy, high latency (hours)
    Speed Layer: Kafka Streams, real-time feature updates
                 Lower accuracy, low latency (ms)
    Serving Layer: Merge batch + speed outputs for queries

  KAPPA ARCHITECTURE (simplified):
    Single stream processing system handles both
    Reprocessing: replay Kafka log for "batch" updates
    Pros: simpler, one codebase
    Cons: reprocessing at scale is expensive

  ML HYBRID EXAMPLE (Recommendations):
    Batch (weekly): Matrix factorization on full history
                    User/item embeddings → FAISS index
    Speed (real-time): Session features (last 10 clicks)
                       Real-time CTR signals
    Serving: score = 0.7 * batch_score + 0.3 * rt_score

  WHEN TO USE WHICH:
    Real-time only: fraud detection (must be fresh)
    Batch only: weekly email recommendations
    Hybrid: personalized feeds, search ranking"""
    print(design)

def ex43():
    """ML system migration strategy"""
    print("Ex43 — ML System Migration Strategy:")
    design = """
  SCENARIO: Migrate legacy rule-based system to ML

  PHASE 1: SHADOW MODE (Month 1-2)
    - Deploy ML model alongside rules
    - ML runs on every request but output discarded
    - Compare ML predictions vs rule decisions offline
    - Zero user impact, measure disagreement rate

  PHASE 2: CANARY (Month 3)
    - Route 5% of traffic to ML system
    - Monitor: accuracy, latency, error rate
    - A/B test: measure business metrics (revenue, CTR)
    - Rollback if regression detected

  PHASE 3: RAMP (Month 4)
    - Gradually increase: 5% → 20% → 50% → 100%
    - Each step: wait 1 week, measure metrics
    - Keep rule system hot for instant rollback

  PHASE 4: CUTOVER (Month 5)
    - 100% traffic to ML system
    - Rule system in standby (30 days)
    - Decommission after stability confirmed

  ROLLBACK PLAN:
    Feature flag: switch back in <5 minutes
    Data: preserve all prediction logs for analysis
    Monitoring: automated rollback if error rate > threshold"""
    print(design)

def ex44():
    """Legacy to ML system modernization"""
    print("Ex44 — Legacy to ML System Modernization:")
    design = """
  LEGACY PROBLEMS:
    - Hard-coded business rules (brittle, hard to maintain)
    - No learning from data (static rules)
    - Expert knowledge bottleneck
    - Poor generalization to new patterns

  MODERNIZATION APPROACH:
    Step 1: Instrument legacy system (log decisions + outcomes)
    Step 2: Collect 6-12 months of labeled data
    Step 3: Train ML model on historical data
    Step 4: Validate ML vs legacy (offline evaluation)
    Step 5: Shadow mode → canary → production

  TECHNICAL DEBT REDUCTION:
    - Extract features from rule conditions (domain knowledge)
    - Use rules as features in ML model (hybrid)
    - Gradually replace rules with model predictions

  ORGANIZATIONAL CHALLENGES:
    - Domain experts resist (fear of job loss)
    - No ground truth labels (create labeling pipeline)
    - Model explainability for stakeholders
    - Regulatory requirements (model cards, audits)

  SUCCESS METRICS:
    Technical: accuracy, latency, coverage
    Business: revenue impact, cost reduction
    Operations: maintenance hours, incident rate"""
    print(design)

def ex45():
    """ML system observability design"""
    print("Ex45 — ML System Observability Design:")
    design = """
  THREE PILLARS FOR ML:
  1. METRICS (quantitative signals):
     Infrastructure: CPU, memory, latency, error rate
     ML-specific: prediction distribution, feature drift,
                  model accuracy (if labels available)
     Business: CTR, conversion, revenue per prediction

  2. LOGS (events and decisions):
     Request logs: input features, prediction, confidence
     Model logs: version, inference time, batch size
     Error logs: failed requests, fallbacks triggered
     Audit logs: who changed model in production

  3. TRACES (request journey):
     Distributed tracing across microservices
     Identify bottlenecks (feature fetch vs inference)
     Correlate prediction → downstream business event

  ML-SPECIFIC MONITORING:
    Data drift: KL divergence or PSI on feature distributions
    Concept drift: model accuracy degrades over time
    Prediction drift: output distribution shifts
    Label drift: ground truth distribution changes

  ALERTING STRATEGY:
    P0: system down, error rate > 5%
    P1: latency p99 > SLA, feature drift PSI > 0.2
    P2: model accuracy drop > 2%, prediction drift

  TOOLS: Prometheus + Grafana, Evidently, Fiddler, Arize"""
    print(design)

def ex46():
    """Data governance for ML"""
    print("Ex46 — Data Governance for ML:")
    design = """
  DATA GOVERNANCE COMPONENTS:

  1. DATA CATALOG:
     - Register all datasets with schema, owner, lineage
     - Tag with PII, sensitivity level
     - Tools: DataHub, Apache Atlas, Collibra

  2. DATA LINEAGE:
     - Track: raw data → features → training set → model
     - Enables: impact analysis, debugging, compliance
     - Tools: OpenLineage, dbt lineage, Marquez

  3. ACCESS CONTROL:
     - Role-based access (engineer/scientist/analyst)
     - Attribute-based: restrict PII to approved roles
     - Column-level masking for sensitive fields

  4. DATA QUALITY:
     - Schema validation (Great Expectations)
     - Statistical checks (null rates, distributions)
     - Freshness checks (SLA on data arrival)

  5. RETENTION & DELETION:
     - GDPR right to erasure: delete user data on request
     - Cascade deletion: remove from training sets too
     - Retention policy: raw logs 90 days, features 2 years

  6. MODEL GOVERNANCE:
     - Model cards: document training data, performance, limitations
     - Fairness audits before production deployment
     - Version control for models and training data"""
    print(design)

def ex47():
    """ML system cost architecture"""
    print("Ex47 — ML System Cost Architecture:")
    design = """
  COST BREAKDOWN FOR ML SYSTEMS:
    Training:   30-40% (GPU compute, spot instances)
    Serving:    40-50% (inference, often CPU/GPU)
    Storage:    10-15% (data lake, feature store)
    Data Infra:  5-10% (Kafka, Spark, orchestration)

  COST OPTIMIZATION STRATEGIES:

  TRAINING:
    - Use spot/preemptible instances (60-80% cheaper)
    - Mixed precision (FP16): 2x memory, 2x speed
    - Gradient checkpointing: trade compute for memory
    - Early stopping: stop when validation plateaus

  SERVING:
    - Model quantization (INT8): 4x cheaper inference
    - Knowledge distillation: smaller model same accuracy
    - Dynamic batching: fill GPU to reduce per-request cost
    - CPU inference for small models (< 100M params)
    - Spot instances for async/batch inference

  STORAGE:
    - Tiered storage: hot (SSD) → warm (HDD) → cold (S3 Glacier)
    - Feature store TTL: expire unused features
    - Parquet compression: 5-10x reduction vs CSV

  COST MONITORING:
    - Tag all resources with team/model/project
    - Cost per prediction alert
    - Monthly cost reviews per model"""
    print(design)

def ex48():
    """ML system disaster recovery"""
    print("Ex48 — ML System Disaster Recovery:")
    design = """
  RTO (Recovery Time Objective): max downtime acceptable
  RPO (Recovery Point Objective): max data loss acceptable

  ML SYSTEM DR TARGETS:
    Prediction API:  RTO < 5 min,  RPO = 0 (stateless)
    Feature Store:   RTO < 15 min, RPO < 1 hour
    Model Registry:  RTO < 30 min, RPO < 24 hours
    Training Data:   RTO < 4 hrs,  RPO < 24 hours

  STRATEGIES BY COMPONENT:

  MODEL SERVING (stateless):
    Multi-region active-active with GeoDNS failover
    Model weights replicated to all regions
    Failover: automatic DNS cutover < 60 seconds

  FEATURE STORE:
    Redis: cross-region replication (async)
    Offline: S3 Cross-Region Replication (CRR)
    Fallback: serve degraded recommendations if feature store down

  TRAINING PIPELINE:
    Data: S3 CRR to DR region
    Orchestrator: secondary Airflow in DR region
    Compute: use DR region GPU pool for retraining

  RUNBOOKS:
    For each failure scenario: who, what, how long
    Chaos engineering: regularly test failover
    Game days: quarterly DR drills"""
    print(design)

def ex49():
    """ML system compliance (GDPR/HIPAA)"""
    print("Ex49 — ML System Compliance (GDPR/HIPAA):")
    design = """
  GDPR REQUIREMENTS FOR ML SYSTEMS:
    1. Lawful basis: consent or legitimate interest for training data
    2. Right to access: explain which data used for training
    3. Right to erasure: delete user data from all stores
    4. Data minimization: collect only what's needed
    5. Purpose limitation: don't use data beyond stated purpose
    6. Automated decision-making: right to human review

  HIPAA REQUIREMENTS FOR HEALTHCARE ML:
    1. PHI de-identification: remove 18 identifiers
    2. Access controls: audit log for all PHI access
    3. Encryption: PHI at rest (AES-256) and in transit (TLS)
    4. Business Associate Agreement with cloud providers
    5. Minimum necessary: model trained on minimum PHI

  IMPLEMENTATION CHECKLIST:
    ☐ PII scanning in data ingestion pipeline
    ☐ Pseudonymization: replace PII with random IDs
    ☐ Deletion pipeline: GDPR erasure within 30 days
    ☐ Model cards: document training data scope
    ☐ Fairness audits: no protected attribute discrimination
    ☐ Explainability: SHAP values for automated decisions
    ☐ Data Processing Agreements with all vendors
    ☐ DPA (Data Protection Officer) review for new models

  ARCHITECTURAL SAFEGUARDS:
    - Separate PII store (easy deletion)
    - Hashed user IDs in training data
    - Audit log immutable (append-only S3)"""
    print(design)

def ex50():
    """Production ML system design interview guide"""
    print("Ex50 — Production ML System Design Interview Guide:")
    guide = """
  INTERVIEW FRAMEWORK (45-minute session):

  MINUTES 0-5: CLARIFY REQUIREMENTS
    Ask: What is the ML task? Scale? Latency SLA? Freshness?
    Confirm: Training frequency? Online vs batch serving?
    Don't: jump to solution immediately

  MINUTES 5-10: ESTIMATE SCALE
    DAU → QPS → Storage → Bandwidth
    State assumptions out loud
    Round numbers: 10M DAU → ~1,200 QPS

  MINUTES 10-25: HIGH-LEVEL DESIGN
    Draw 5-7 components, explain data flow
    Cover: data pipeline, feature engineering, training,
           serving, monitoring
    Mention A/B testing and feedback loops

  MINUTES 25-40: DEEP DIVE
    Interviewer picks 1-2 components
    Be specific: "I'd use FAISS with HNSW graph because..."
    Acknowledge trade-offs: "This gives us X but costs Y"

  MINUTES 40-45: WRAP UP
    Summarize design in 3 sentences
    Mention what you'd improve with more time
    Ask if interviewer wants to explore anything

  COMMON MISTAKES:
    ✗ No capacity estimation
    ✗ No monitoring/feedback loop
    ✗ No trade-off discussion
    ✗ Over-engineering from the start
    ✗ Ignoring failure modes

  SCORING CRITERIA:
    Problem decomposition, technical depth,
    trade-off awareness, communication clarity,
    practical experience signals"""
    print(guide)

def main():
    print("=" * 60)
    print("Examples 6.1 — AI System Design")
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
