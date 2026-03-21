# ============================================================
# Examples 4.5 — ML Deployment Project (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import json
import os
import tempfile
import hashlib
import time

rng = np.random.default_rng(42)

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Train and save model using sklearn + joblib to tempfile"""
    X, y = make_classification(n_samples=500, n_features=10, random_state=42)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=20, random_state=42)
    model.fit(X_tr, y_tr)
    path = os.path.join(tempfile.gettempdir(), "ex01_model.joblib")
    joblib.dump(model, path)
    acc = accuracy_score(y_te, model.predict(X_te))
    size_kb = os.path.getsize(path) / 1024
    print(f"Ex01 — Train & Save: acc={acc:.4f}, saved to {path} ({size_kb:.1f} KB)")

def ex02():
    """Load saved model and predict"""
    path = os.path.join(tempfile.gettempdir(), "ex01_model.joblib")
    if not os.path.exists(path):
        X, y = make_classification(n_samples=500, n_features=10, random_state=42)
        model = RandomForestClassifier(n_estimators=20, random_state=42).fit(X, y)
        joblib.dump(model, path)
    model = joblib.load(path)
    X_new = rng.standard_normal((5, 10))
    preds = model.predict(X_new)
    probas = model.predict_proba(X_new)[:, 1]
    print(f"Ex02 — Load & Predict: preds={preds.tolist()}, probas={[round(p,4) for p in probas]}")

def ex03():
    """Model pickle vs joblib comparison (characteristics)"""
    comparison = {
        "pickle": {"speed": "slow for large arrays", "compression": "none by default",
                   "numpy_support": "basic", "use_case": "small models, portability"},
        "joblib": {"speed": "fast (memory-mapped)", "compression": "built-in (gzip/lz4)",
                   "numpy_support": "optimized (mmap)", "use_case": "sklearn models, large arrays"},
    }
    print("Ex03 — Pickle vs Joblib:")
    for tool, props in comparison.items():
        print(f"  [{tool}]")
        for k, v in props.items():
            print(f"    {k:20s}: {v}")

def ex04():
    """Save model metadata as JSON"""
    metadata = {
        "model_name": "fraud_classifier",
        "version": "v2.1.0",
        "framework": "sklearn",
        "algorithm": "RandomForestClassifier",
        "trained_on": "2026-03-20",
        "training_samples": 142857,
        "features": ["amount", "merchant_cat", "time_of_day", "card_age_days"],
        "metrics": {"accuracy": 0.9421, "f1": 0.8873, "roc_auc": 0.9712},
        "hyperparameters": {"n_estimators": 200, "max_depth": 12, "min_samples_leaf": 10},
        "artifacts": {"model_path": "models/fraud_v2.1.0.joblib",
                      "scaler_path": "models/scaler_v2.1.0.joblib"},
    }
    path = os.path.join(tempfile.gettempdir(), "model_metadata.json")
    with open(path, "w") as f:
        json.dump(metadata, f, indent=2)
    with open(path) as f:
        loaded = json.load(f)
    print(f"Ex04 — Metadata JSON: version={loaded['version']}, "
          f"acc={loaded['metrics']['accuracy']}, saved to {path}")

def ex05():
    """Model version naming convention"""
    versions = [
        "v1.0.0  — initial release (semver: major.minor.patch)",
        "v1.1.0  — new feature added (retrained with extra data)",
        "v1.1.1  — bug fix in preprocessing",
        "v2.0.0  — breaking change (new feature schema)",
        "fraud_classifier-20260321-a3f9b  — date + git hash format",
        "fraud_classifier-prod-v2.1-20260321  — env + semver + date",
        "fraud_classifier.20260321.rf.200trees  — algo params in name",
    ]
    print("Ex05 — Model Version Naming Conventions:")
    for v in versions:
        print(f"  {v}")

def ex06():
    """Model card template"""
    card = """Ex06 — Model Card Template:
  ┌─────────────────────────────────────────────────┐
  │ MODEL CARD: fraud_classifier v2.1               │
  ├─────────────────────────────────────────────────┤
  │ Intended Use    : Detect fraudulent transactions│
  │ Out-of-scope    : Not for credit scoring        │
  │ Training Data   : 2M transactions Jan–Dec 2025  │
  │ Evaluation Data : 200K holdout (Jan 2026)       │
  ├─────────────────────────────────────────────────┤
  │ PERFORMANCE METRICS                             │
  │   Accuracy  : 0.9421                           │
  │   Precision : 0.8831  (fraud class)            │
  │   Recall    : 0.8917  (fraud class)            │
  │   ROC-AUC   : 0.9712                           │
  ├─────────────────────────────────────────────────┤
  │ FAIRNESS                                        │
  │   Demographic parity diff  : 0.023             │
  │   Equal opportunity diff   : 0.018             │
  ├─────────────────────────────────────────────────┤
  │ LIMITATIONS & BIASES                            │
  │   Under-represents transactions > $50K         │
  │   Retrain every 30 days recommended            │
  └─────────────────────────────────────────────────┘"""
    print(card)

def ex07():
    """Inference input schema (Pydantic-style dict)"""
    input_schema = {
        "type": "object",
        "required": ["amount", "merchant_category", "hour_of_day", "card_age_days"],
        "properties": {
            "amount": {"type": "number", "minimum": 0.01, "maximum": 1000000},
            "merchant_category": {"type": "string", "enum": ["retail", "food", "travel", "online", "other"]},
            "hour_of_day": {"type": "integer", "minimum": 0, "maximum": 23},
            "card_age_days": {"type": "integer", "minimum": 0},
            "user_id": {"type": "string", "description": "optional, for audit trail"},
        },
        "example": {"amount": 149.99, "merchant_category": "online",
                    "hour_of_day": 14, "card_age_days": 365}
    }
    print(f"Ex07 — Inference Input Schema: {list(input_schema['properties'].keys())}")
    example = input_schema["example"]
    print(f"  Example input: {example}")

def ex08():
    """Inference output schema"""
    def predict(amount, merchant_category, hour_of_day, card_age_days):
        # mock prediction
        score = min(1.0, max(0.0, (amount / 500) * 0.3 + (hour_of_day > 20) * 0.4))
        label = "fraud" if score > 0.5 else "legitimate"
        return {
            "prediction": label,
            "confidence": round(abs(score - 0.5) * 2, 4),
            "fraud_probability": round(score, 4),
            "model_version": "v2.1.0",
            "latency_ms": 8.3,
            "request_id": "req_a1b2c3d4",
        }
    result = predict(amount=892.50, merchant_category="online", hour_of_day=23, card_age_days=45)
    print(f"Ex08 — Inference Output Schema: {result}")

def ex09():
    """Health check function"""
    def health_check():
        model_path = os.path.join(tempfile.gettempdir(), "ex01_model.joblib")
        return {
            "status": "healthy",
            "model_loaded": os.path.exists(model_path),
            "version": "v2.1.0",
            "uptime_seconds": 3601,
            "checks": {
                "model_file": "ok" if os.path.exists(model_path) else "missing",
                "memory_mb": 512,
                "cpu_percent": 23.4,
            }
        }
    result = health_check()
    print(f"Ex09 — Health Check: status={result['status']}, model_loaded={result['model_loaded']}, "
          f"model_file={result['checks']['model_file']}")

def ex10():
    """Model warm-up function — run N dummy predictions"""
    model_path = os.path.join(tempfile.gettempdir(), "ex01_model.joblib")
    if not os.path.exists(model_path):
        X, y = make_classification(n_samples=500, n_features=10, random_state=42)
        joblib.dump(RandomForestClassifier(n_estimators=20, random_state=42).fit(X, y), model_path)
    model = joblib.load(model_path)
    n_warmup = 50
    dummy_input = rng.standard_normal((1, 10))
    start = time.perf_counter()
    for _ in range(n_warmup):
        model.predict(dummy_input)
    elapsed_ms = (time.perf_counter() - start) * 1000
    avg_ms = elapsed_ms / n_warmup
    print(f"Ex10 — Warm-up: {n_warmup} predictions in {elapsed_ms:.1f}ms, avg={avg_ms:.2f}ms/pred")

def ex11():
    """Graceful shutdown pattern — print code"""
    code = """Ex11 — Graceful Shutdown Pattern:
  import signal, sys

  class MLServer:
      def __init__(self):
          self.model = load_model()
          self.request_count = 0
          signal.signal(signal.SIGTERM, self.shutdown)
          signal.signal(signal.SIGINT, self.shutdown)

      def shutdown(self, signum, frame):
          print(f'Shutting down... served {self.request_count} requests')
          # 1. Stop accepting new requests (set flag)
          self.accepting = False
          # 2. Wait for in-flight requests to complete
          self.drain_requests(timeout_sec=30)
          # 3. Flush metrics to Prometheus/CloudWatch
          self.flush_metrics()
          # 4. Save any stateful data (e.g., rolling stats)
          self.save_state()
          # 5. Release GPU memory
          del self.model
          sys.exit(0)"""
    print(code)

def ex12():
    """Deployment checklist"""
    items = [
        "1.  Model trained and validated on holdout set (acc/F1/AUC within SLA)",
        "2.  Unit tests passing for preprocessing and postprocessing",
        "3.  Integration tests passing (API schema validation)",
        "4.  Model artifact stored in versioned registry (MLflow/S3)",
        "5.  Docker image built and pushed to container registry",
        "6.  Smoke test run on staging environment (5 sample requests)",
        "7.  Load test passed (target RPS with p99 latency within budget)",
        "8.  Monitoring configured (drift alerts + latency + error rate)",
        "9.  Rollback procedure documented and tested",
        "10. Stakeholder sign-off obtained for production deployment",
    ]
    print("Ex12 — Deployment Checklist:")
    for item in items:
        print(f"  {item}")

def ex13():
    """Model file size check"""
    model_path = os.path.join(tempfile.gettempdir(), "ex01_model.joblib")
    if not os.path.exists(model_path):
        X, y = make_classification(n_samples=500, n_features=10, random_state=42)
        joblib.dump(RandomForestClassifier(n_estimators=20, random_state=42).fit(X, y), model_path)
    size_bytes = os.path.getsize(model_path)
    size_kb = size_bytes / 1024
    size_mb = size_kb / 1024
    limits = {"mobile_edge": 10 * 1024, "api_service": 500 * 1024, "batch": float("inf")}
    print(f"Ex13 — Model File Size: {size_bytes} bytes ({size_kb:.1f} KB, {size_mb:.3f} MB)")
    for env, limit_kb in limits.items():
        status = "OK" if size_kb < limit_kb else "TOO LARGE"
        print(f"  {env}: limit={limit_kb}KB → {status}")

# ─── INTERMEDIATE (14–26) ────────────────────────────────────

def ex14():
    """FastAPI prediction app — print complete code string"""
    code = """Ex14 — FastAPI Prediction App:
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib, numpy as np

app = FastAPI(title="Fraud Classifier API", version="2.1.0")
model = joblib.load("models/fraud_v2.1.0.joblib")

class PredictRequest(BaseModel):
    amount: float
    merchant_category: str
    hour_of_day: int
    card_age_days: int

class PredictResponse(BaseModel):
    prediction: str
    fraud_probability: float
    model_version: str = "v2.1.0"

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    features = np.array([[request.amount, request.hour_of_day,
                          request.card_age_days, 0]])
    prob = float(model.predict_proba(features)[0][1])
    return PredictResponse(prediction="fraud" if prob > 0.5 else "legitimate",
                           fraud_probability=round(prob, 4))

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": True}"""
    print(code)

def ex15():
    """Docker file for ML API"""
    dockerfile = """Ex15 — Dockerfile for ML API:
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY models/ ./models/

# Non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Expose port and set startup command
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000",
     "--workers", "4", "--timeout-keep-alive", "30"]

# Build:  docker build -t fraud-api:v2.1.0 .
# Run:    docker run -p 8000:8000 --memory=2g fraud-api:v2.1.0"""
    print(dockerfile)

def ex16():
    """CI/CD pipeline YAML — GitHub Actions"""
    yaml_content = """Ex16 — GitHub Actions CI/CD YAML:
name: ML Model CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.11'}
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v --cov=src --cov-report=xml
      - run: python scripts/validate_model.py  # accuracy gates

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with: {username: ${{ secrets.DOCKER_USER }},
               password: ${{ secrets.DOCKER_PASS }}}
      - run: |
          docker build -t fraud-api:${{ github.sha }} .
          docker push fraud-api:${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deploy/fraud-api api=fraud-api:${{ github.sha }}
      - run: python scripts/smoke_test.py --env staging"""
    print(yaml_content)

def ex17():
    """Blue-green deployment concept"""
    description = """Ex17 — Blue-Green Deployment:
  ┌─────────────────────────────────────────────────────┐
  │  LOAD BALANCER (100% traffic)                       │
  │           │                                         │
  │    ┌──────▼──────┐        ┌─────────────┐          │
  │    │  BLUE (live)│        │GREEN (new)  │          │
  │    │  v2.0.0     │        │ v2.1.0      │          │
  │    │  3 replicas │        │ 3 replicas  │          │
  │    └─────────────┘        └─────────────┘          │
  │                                                     │
  │  Switchover steps:                                  │
  │  1. Deploy v2.1.0 to GREEN (zero traffic)          │
  │  2. Run smoke tests + integration tests on GREEN    │
  │  3. Shift 100% traffic: BLUE → GREEN (instant)     │
  │  4. Monitor GREEN for 15 min                       │
  │  5. Keep BLUE hot for 30 min (instant rollback)    │
  │  6. Decommission BLUE after stability confirmed    │
  │                                                     │
  │  Key benefit: Zero-downtime, instant rollback      │
  └─────────────────────────────────────────────────────┘"""
    print(description)

def ex18():
    """Canary deployment — traffic split logic in Python"""
    class CanaryRouter:
        def __init__(self, canary_pct=0.05):
            self.canary_pct = canary_pct
        def route(self, request_id: str) -> str:
            h = int(hashlib.md5(request_id.encode()).hexdigest(), 16)
            bucket = (h % 100) / 100.0
            return "canary_v2.1" if bucket < self.canary_pct else "stable_v2.0"
    router = CanaryRouter(canary_pct=0.10)
    requests_sample = [f"user_{i}" for i in range(1000)]
    routes = [router.route(r) for r in requests_sample]
    canary_count = routes.count("canary_v2.1")
    print(f"Ex18 — Canary Router (10%): canary={canary_count}/1000 ({canary_count/10:.1f}%), "
          f"stable={1000-canary_count}/1000")

def ex19():
    """Shadow mode deployment — print code pattern"""
    code = """Ex19 — Shadow Mode Deployment Pattern:
  async def predict_shadow(request):
      # 1. Send to LIVE model (returns to user)
      live_response = await live_model.predict(request)

      # 2. Asynchronously send same request to SHADOW model
      asyncio.create_task(
          shadow_predict_and_compare(request, live_response)
      )

      # 3. User only sees live response — no latency impact
      return live_response

  async def shadow_predict_and_compare(request, live_resp):
      shadow_resp = await shadow_model.predict(request)
      # Log disagreements for analysis
      if live_resp.prediction != shadow_resp.prediction:
          metrics.increment('shadow_disagreement')
          logger.info(f'Disagree: live={live_resp.prediction}, '
                      f'shadow={shadow_resp.prediction}')

  # Benefits:
  # - Test new model on real traffic with zero risk
  # - Measure accuracy diff before promoting new model
  # - No user impact from shadow model errors"""
    print(code)

def ex20():
    """Rollback procedure"""
    steps = """Ex20 — Rollback Procedure:
  TRIGGER CONDITIONS:
    - Error rate > 2x baseline for 5 consecutive minutes
    - P99 latency > 500ms for 10 minutes
    - Accuracy drops below 0.80 (if labels available)
    - Manual trigger by on-call engineer

  AUTOMATED ROLLBACK STEPS:
  1. PagerDuty alert fires → on-call notified
  2. Rollback script checks: is previous version available?
  3. kubectl rollout undo deployment/fraud-api
     (or) helm rollback fraud-api 1
  4. Verify rollback: kubectl rollout status deployment/fraud-api
  5. Run smoke tests on rolled-back version
  6. Confirm error rate returns to baseline
  7. Notify stakeholders via Slack #ml-alerts

  POST-ROLLBACK:
  - Disable failed canary/blue-green version
  - Archive logs and metrics for RCA
  - Open incident ticket with timeline

  Target RTO: < 5 minutes  |  Target RPO: 0 (stateless API)"""
    print(steps)

def ex21():
    """A/B test deployment — route by user hash"""
    class ABTestRouter:
        def __init__(self, experiments):
            self.experiments = experiments  # {"exp_name": {"models": [...], "weights": [...]}}
        def route(self, user_id: str, experiment: str) -> str:
            exp = self.experiments[experiment]
            h = int(hashlib.sha256(f"{user_id}:{experiment}".encode()).hexdigest(), 16)
            bucket = (h % 1000) / 1000.0
            cumulative = 0
            for model, weight in zip(exp["models"], exp["weights"]):
                cumulative += weight
                if bucket < cumulative:
                    return model
            return exp["models"][-1]
    router = ABTestRouter({
        "pricing_test": {"models": ["rf_v2.0", "xgb_v1.5"], "weights": [0.5, 0.5]}
    })
    users = [f"u{i}" for i in range(200)]
    assignments = [router.route(u, "pricing_test") for u in users]
    counts = {m: assignments.count(m) for m in ["rf_v2.0", "xgb_v1.5"]}
    print(f"Ex21 — A/B Test Router (50/50): {counts} from 200 users")

def ex22():
    """Feature flags for models — dict-based flag system"""
    class FeatureFlags:
        def __init__(self, flags: dict):
            self._flags = flags
        def is_enabled(self, flag: str, context: dict = None) -> bool:
            config = self._flags.get(flag, {"enabled": False})
            if not config.get("enabled", False):
                return False
            if "rollout_pct" in config and context:
                h = int(hashlib.md5(context.get("user_id", "").encode()).hexdigest(), 16)
                return (h % 100) < config["rollout_pct"]
            return True
    flags = FeatureFlags({
        "use_xgb_v2": {"enabled": True, "rollout_pct": 20},
        "llm_fallback": {"enabled": False},
        "gpu_inference": {"enabled": True},
    })
    test_users = [{"user_id": f"u{i}"} for i in range(100)]
    enabled_count = sum(flags.is_enabled("use_xgb_v2", u) for u in test_users)
    print(f"Ex22 — Feature Flags: use_xgb_v2 enabled for {enabled_count}/100 users (~20%)")
    print(f"  llm_fallback={flags.is_enabled('llm_fallback')}, gpu_inference={flags.is_enabled('gpu_inference')}")

def ex23():
    """Environment-specific config — dev/staging/prod"""
    configs = {
        "dev": {
            "model_path": "models/dev/latest.joblib",
            "workers": 1, "log_level": "DEBUG",
            "enable_profiling": True, "db_url": "sqlite:///dev.db",
            "rate_limit_rps": 10, "cache_ttl_sec": 0,
        },
        "staging": {
            "model_path": "models/staging/v2.1.0.joblib",
            "workers": 2, "log_level": "INFO",
            "enable_profiling": False, "db_url": "postgresql://staging-db/ml",
            "rate_limit_rps": 500, "cache_ttl_sec": 300,
        },
        "prod": {
            "model_path": "models/prod/v2.1.0.joblib",
            "workers": 8, "log_level": "WARNING",
            "enable_profiling": False, "db_url": "postgresql://prod-db/ml",
            "rate_limit_rps": 5000, "cache_ttl_sec": 3600,
        },
    }
    print("Ex23 — Environment Configs:")
    for env, cfg in configs.items():
        print(f"  [{env:8s}] workers={cfg['workers']}, log={cfg['log_level']}, "
              f"rate_limit={cfg['rate_limit_rps']}rps, cache_ttl={cfg['cache_ttl_sec']}s")

def ex24():
    """Secrets management concept"""
    patterns = """Ex24 — Secrets Management Patterns:
  ❌ NEVER DO:
     API_KEY = "sk-live-abc123..."  # hardcoded in code
     os.environ["DB_PASS"] = "mypassword"  # set in code

  ✓ PATTERN 1: Environment variables (12-factor app)
     import os
     db_password = os.environ["DB_PASSWORD"]  # injected at runtime

  ✓ PATTERN 2: AWS Secrets Manager
     import boto3
     secret = boto3.client("secretsmanager").get_secret_value(
         SecretId="prod/fraud-api/db-password")["SecretString"]

  ✓ PATTERN 3: HashiCorp Vault
     import hvac
     client = hvac.Client(url="https://vault.company.com")
     secret = client.secrets.kv.v2.read_secret_version(
         path="fraud-api/db")["data"]["data"]["password"]

  ✓ PATTERN 4: Kubernetes Secrets (mounted as env vars)
     # In pod spec:
     env:
       - name: DB_PASSWORD
         valueFrom:
           secretKeyRef:
             name: fraud-api-secrets
             key: db-password"""
    print(patterns)

def ex25():
    """SSL/TLS concept for ML API — nginx config snippet"""
    nginx_config = """Ex25 — Nginx SSL/TLS Config for ML API:
  server {
      listen 443 ssl http2;
      server_name api.ml.company.com;

      ssl_certificate     /etc/ssl/certs/ml-api.crt;
      ssl_certificate_key /etc/ssl/private/ml-api.key;
      ssl_protocols       TLSv1.2 TLSv1.3;
      ssl_ciphers         ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
      ssl_prefer_server_ciphers on;
      ssl_session_cache   shared:SSL:10m;

      # Security headers
      add_header Strict-Transport-Security "max-age=31536000" always;
      add_header X-Content-Type-Options nosniff;

      location /predict {
          proxy_pass http://ml_api_upstream;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_read_timeout 30s;
      }
  }
  upstream ml_api_upstream {
      least_conn;
      server ml-api-1:8000;
      server ml-api-2:8000;
      server ml-api-3:8000;
  }"""
    print(nginx_config)

def ex26():
    """Load balancer — round-robin in Python"""
    class RoundRobinBalancer:
        def __init__(self, servers):
            self.servers = servers
            self._idx = 0
        def next(self):
            server = self.servers[self._idx % len(self.servers)]
            self._idx += 1
            return server
        def stats(self, n_requests):
            counts = {}
            for _ in range(n_requests):
                s = self.next()
                counts[s] = counts.get(s, 0) + 1
            return counts
    lb = RoundRobinBalancer(["ml-api-1:8000", "ml-api-2:8000", "ml-api-3:8000"])
    distribution = lb.stats(300)
    print(f"Ex26 — Round-Robin Load Balancer (300 requests): {distribution}")

# ─── NESTED (27–38) ──────────────────────────────────────────

def ex27():
    """DeploymentPipeline class — train → validate → deploy"""
    class DeploymentPipeline:
        def __init__(self, accuracy_threshold=0.85):
            self.threshold = accuracy_threshold
            self.log = []
        def train(self, X, y):
            self.log.append("TRAIN: fitting model")
            X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
            model = RandomForestClassifier(n_estimators=30, random_state=42)
            model.fit(X_tr, y_tr)
            acc = accuracy_score(y_te, model.predict(X_te))
            self.log.append(f"TRAIN: accuracy={acc:.4f}")
            return model, acc, X_te, y_te
        def validate(self, model, X_te, y_te, acc):
            if acc < self.threshold:
                self.log.append(f"VALIDATE: FAIL (acc={acc:.4f} < {self.threshold})")
                return False
            self.log.append(f"VALIDATE: PASS (acc={acc:.4f})")
            return True
        def deploy(self, model, passed):
            if passed:
                path = os.path.join(tempfile.gettempdir(), "deployed_model.joblib")
                joblib.dump(model, path)
                self.log.append(f"DEPLOY: saved to {path}")
                return "SUCCESS"
            else:
                self.log.append("DEPLOY: SKIPPED (validation failed)")
                return "SKIPPED"
        def run(self, X, y):
            model, acc, X_te, y_te = self.train(X, y)
            passed = self.validate(model, X_te, y_te, acc)
            status = self.deploy(model, passed)
            return status, self.log
    X, y = make_classification(n_samples=600, n_features=12, random_state=42)
    pipe = DeploymentPipeline(accuracy_threshold=0.85)
    status, log = pipe.run(X, y)
    print(f"Ex27 — DeploymentPipeline: status={status}")
    for line in log:
        print(f"  {line}")

def ex28():
    """ModelRegistry class — register, load, list versions"""
    class ModelRegistry:
        def __init__(self, base_dir=None):
            self.base_dir = base_dir or tempfile.gettempdir()
            self._registry = {}
        def register(self, model, name, version, metrics):
            path = os.path.join(self.base_dir, f"{name}_{version}.joblib")
            joblib.dump(model, path)
            self._registry[f"{name}@{version}"] = {
                "path": path, "metrics": metrics,
                "registered_at": "2026-03-21T10:00:00Z"
            }
            return path
        def load(self, name, version):
            key = f"{name}@{version}"
            if key not in self._registry:
                raise KeyError(f"{key} not found")
            return joblib.load(self._registry[key]["path"])
        def list_versions(self, name):
            return [k for k in self._registry if k.startswith(f"{name}@")]
        def get_best(self, name, metric="accuracy"):
            candidates = {k: v for k, v in self._registry.items() if k.startswith(f"{name}@")}
            return max(candidates.items(), key=lambda kv: kv[1]["metrics"].get(metric, 0))
    X, y = make_classification(n_samples=400, n_features=8, random_state=1)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2)
    registry = ModelRegistry()
    for ver, n_est in [("v1.0", 10), ("v1.1", 30), ("v2.0", 50)]:
        m = RandomForestClassifier(n_estimators=n_est, random_state=42).fit(X_tr, y_tr)
        acc = accuracy_score(y_te, m.predict(X_te))
        registry.register(m, "fraud", ver, {"accuracy": round(acc, 4)})
    versions = registry.list_versions("fraud")
    best_key, best_meta = registry.get_best("fraud")
    print(f"Ex28 — ModelRegistry: versions={versions}")
    print(f"  Best: {best_key}, accuracy={best_meta['metrics']['accuracy']}")

def ex29():
    """AutomatedTester class — run test suite before deploy"""
    class AutomatedTester:
        def __init__(self):
            self.tests = []
            self.results = []
        def add_test(self, name, fn):
            self.tests.append((name, fn))
        def run_all(self, model):
            passed = 0
            for name, fn in self.tests:
                try:
                    ok, msg = fn(model)
                    self.results.append((name, "PASS" if ok else "FAIL", msg))
                    if ok: passed += 1
                except Exception as e:
                    self.results.append((name, "ERROR", str(e)))
            return passed, len(self.tests)
    X, y = make_classification(n_samples=400, n_features=10, random_state=42)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25)
    model = RandomForestClassifier(n_estimators=20, random_state=42).fit(X_tr, y_tr)
    tester = AutomatedTester()
    tester.add_test("accuracy_gate",
        lambda m: (accuracy_score(y_te, m.predict(X_te)) > 0.80,
                   f"acc={accuracy_score(y_te, m.predict(X_te)):.4f}"))
    tester.add_test("output_shape",
        lambda m: (len(m.predict(X_te[:5])) == 5, "shape OK"))
    tester.add_test("proba_sums_to_1",
        lambda m: (abs(m.predict_proba(X_te[:3]).sum(axis=1) - 1).max() < 1e-6, "probas OK"))
    passed, total = tester.run_all(model)
    print(f"Ex29 — AutomatedTester: {passed}/{total} tests passed")
    for name, status, msg in tester.results:
        print(f"  {status} {name}: {msg}")

def ex30():
    """PerformanceBenchmark — before/after comparison"""
    class PerformanceBenchmark:
        def __init__(self):
            self.results = {}
        def benchmark(self, name, model, X, n_runs=100):
            latencies = []
            for _ in range(n_runs):
                start = time.perf_counter()
                model.predict(X[:1])
                latencies.append((time.perf_counter() - start) * 1000)
            arr = np.array(latencies)
            self.results[name] = {"mean_ms": round(arr.mean(), 3), "p99_ms": round(np.percentile(arr, 99), 3),
                                  "min_ms": round(arr.min(), 3)}
        def compare(self):
            names = list(self.results.keys())
            if len(names) < 2: return
            a, b = names[0], names[1]
            speedup = self.results[a]["mean_ms"] / self.results[b]["mean_ms"]
            print(f"  Speedup {b} vs {a}: {speedup:.2f}x")
    X, y = make_classification(n_samples=500, n_features=10, random_state=0)
    bench = PerformanceBenchmark()
    m_old = RandomForestClassifier(n_estimators=100, random_state=0).fit(X, y)
    m_new = LogisticRegression(max_iter=200).fit(X, y)
    bench.benchmark("rf_v1", m_old, X, n_runs=50)
    bench.benchmark("lr_v2", m_new, X, n_runs=50)
    print("Ex30 — PerformanceBenchmark:")
    for name, r in bench.results.items():
        print(f"  {name}: mean={r['mean_ms']}ms, p99={r['p99_ms']}ms")
    bench.compare()

def ex31():
    """SmokeTestSuite — 5 smoke tests"""
    class SmokeTestSuite:
        def __init__(self, model):
            self.model = model
        def test_single_prediction(self):
            x = rng.standard_normal((1, 10))
            pred = self.model.predict(x)
            assert len(pred) == 1 and pred[0] in [0, 1], "single pred failed"
            return True, f"pred={pred[0]}"
        def test_batch_prediction(self):
            X = rng.standard_normal((100, 10))
            preds = self.model.predict(X)
            assert len(preds) == 100, "batch size mismatch"
            return True, f"batch=100, unique_labels={np.unique(preds).tolist()}"
        def test_proba_range(self):
            X = rng.standard_normal((50, 10))
            probas = self.model.predict_proba(X)
            ok = (probas >= 0).all() and (probas <= 1).all()
            assert ok, "probas out of [0,1]"
            return True, f"probas in [0,1]={ok}"
        def test_feature_count(self):
            try:
                self.model.predict(rng.standard_normal((1, 5)))
                return False, "should have raised error for wrong feature count"
            except Exception:
                return True, "correctly rejected wrong feature count"
        def test_reproducibility(self):
            X = rng.standard_normal((10, 10))
            p1 = self.model.predict(X)
            p2 = self.model.predict(X)
            ok = np.array_equal(p1, p2)
            return ok, f"deterministic={ok}"
        def run_all(self):
            tests = [self.test_single_prediction, self.test_batch_prediction,
                     self.test_proba_range, self.test_feature_count, self.test_reproducibility]
            passed = 0
            for t in tests:
                ok, msg = t()
                status = "PASS" if ok else "FAIL"
                print(f"  {status} {t.__name__}: {msg}")
                if ok: passed += 1
            return passed, len(tests)
    X, y = make_classification(n_samples=500, n_features=10, random_state=0)
    model = RandomForestClassifier(n_estimators=20, random_state=0).fit(X, y)
    suite = SmokeTestSuite(model)
    print("Ex31 — SmokeTestSuite:")
    passed, total = suite.run_all()
    print(f"  Result: {passed}/{total} passed")

def ex32():
    """IntegrationTestRunner class"""
    class IntegrationTestRunner:
        def __init__(self):
            self.test_cases = []
        def add_case(self, input_data, expected_label, description):
            self.test_cases.append((input_data, expected_label, description))
        def run(self, model):
            passed = 0
            for x, expected, desc in self.test_cases:
                pred = model.predict(np.array([x]))[0]
                ok = pred == expected
                if ok: passed += 1
                print(f"  {'PASS' if ok else 'FAIL'} {desc}: expected={expected}, got={pred}")
            return passed, len(self.test_cases)
    X, y = make_classification(n_samples=500, n_features=4, random_state=42)
    model = RandomForestClassifier(n_estimators=20, random_state=42).fit(X, y)
    runner = IntegrationTestRunner()
    for i in range(4):
        runner.add_case(X[i].tolist(), y[i], f"training_sample_{i}")
    print("Ex32 — IntegrationTestRunner:")
    passed, total = runner.run(model)
    print(f"  Result: {passed}/{total} passed")

def ex33():
    """TrafficRouter class — A/B + canary + shadow"""
    class TrafficRouter:
        def __init__(self, routes):
            self.routes = routes  # {"model_name": weight}
            self._sorted = sorted(routes.items(), key=lambda x: x[0])
        def route(self, request_id: str) -> str:
            h = int(hashlib.md5(request_id.encode()).hexdigest(), 16) % 1000
            cumulative = 0
            total = sum(self.routes.values())
            for name, weight in self._sorted:
                cumulative += (weight / total) * 1000
                if h < cumulative:
                    return name
            return self._sorted[-1][0]
    router = TrafficRouter({"stable_v2.0": 85, "canary_v2.1": 10, "shadow_v3.0": 5})
    results = [router.route(f"req_{i}") for i in range(1000)]
    from collections import Counter
    counts = Counter(results)
    print(f"Ex33 — TrafficRouter (1000 requests): {dict(counts)}")

def ex34():
    """DeploymentStatusTracker class"""
    class DeploymentStatusTracker:
        STATES = ["pending", "building", "testing", "staging", "promoting", "live", "rolled_back"]
        def __init__(self, model_name, version):
            self.model_name = model_name
            self.version = version
            self.state = "pending"
            self.history = [("pending", "2026-03-21T09:00:00Z")]
        def advance(self, new_state, timestamp="now"):
            if new_state not in self.STATES:
                raise ValueError(f"Unknown state: {new_state}")
            self.state = new_state
            self.history.append((new_state, timestamp))
        def summary(self):
            return {"model": f"{self.model_name}@{self.version}",
                    "current_state": self.state,
                    "steps_completed": len(self.history)}
    tracker = DeploymentStatusTracker("fraud_classifier", "v2.1.0")
    for state in ["building", "testing", "staging", "promoting", "live"]:
        tracker.advance(state)
    s = tracker.summary()
    print(f"Ex34 — DeploymentStatusTracker: model={s['model']}, "
          f"state={s['current_state']}, steps={s['steps_completed']}")
    print(f"  History: {[h[0] for h in tracker.history]}")

def ex35():
    """MultiModelDeploymentManager class"""
    class MultiModelDeploymentManager:
        def __init__(self):
            self.models = {}
        def register(self, name, version, artifact_path, metrics):
            self.models[name] = {
                "version": version, "path": artifact_path,
                "metrics": metrics, "status": "registered"
            }
        def deploy(self, name):
            if name not in self.models:
                raise KeyError(f"Model {name} not registered")
            self.models[name]["status"] = "deployed"
        def get_deployed(self):
            return {k: v for k, v in self.models.items() if v["status"] == "deployed"}
        def summary(self):
            total = len(self.models)
            deployed = sum(1 for v in self.models.values() if v["status"] == "deployed")
            return f"{deployed}/{total} models deployed"
    mgr = MultiModelDeploymentManager()
    mgr.register("fraud_model", "v2.1", "/models/fraud.joblib", {"accuracy": 0.94})
    mgr.register("churn_model", "v1.3", "/models/churn.joblib", {"auc": 0.88})
    mgr.register("ltv_model", "v3.0", "/models/ltv.joblib", {"rmse": 142.3})
    mgr.deploy("fraud_model"); mgr.deploy("ltv_model")
    print(f"Ex35 — MultiModelDeploymentManager: {mgr.summary()}")
    for name, info in mgr.get_deployed().items():
        print(f"  {name} {info['version']}: {info['metrics']}")

def ex36():
    """FullDeploymentValidator — schema + performance + smoke"""
    class FullDeploymentValidator:
        def __init__(self, acc_threshold=0.85, max_latency_ms=50):
            self.acc_threshold = acc_threshold
            self.max_latency_ms = max_latency_ms
            self.checks = []
        def validate_schema(self, model, n_features):
            x = rng.standard_normal((1, n_features))
            try:
                out = model.predict(x)
                ok = out[0] in [0, 1]
            except Exception as e:
                ok = False
            self.checks.append(("schema", ok))
            return ok
        def validate_performance(self, model, X_te, y_te):
            acc = accuracy_score(y_te, model.predict(X_te))
            ok = acc >= self.acc_threshold
            self.checks.append(("performance", ok, round(acc, 4)))
            return ok
        def validate_latency(self, model, X):
            times = []
            for _ in range(20):
                s = time.perf_counter()
                model.predict(X[:1])
                times.append((time.perf_counter() - s) * 1000)
            p99 = np.percentile(times, 99)
            ok = p99 < self.max_latency_ms
            self.checks.append(("latency", ok, round(p99, 2)))
            return ok
        def all_passed(self):
            return all(c[1] for c in self.checks)
    X, y = make_classification(n_samples=500, n_features=10, random_state=0)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2)
    model = RandomForestClassifier(n_estimators=20, random_state=0).fit(X_tr, y_tr)
    validator = FullDeploymentValidator(acc_threshold=0.80, max_latency_ms=100)
    validator.validate_schema(model, 10)
    validator.validate_performance(model, X_te, y_te)
    validator.validate_latency(model, X)
    print(f"Ex36 — FullDeploymentValidator: all_passed={validator.all_passed()}")
    for check in validator.checks:
        status = "PASS" if check[1] else "FAIL"
        print(f"  {status} {check[0]}" + (f": {check[2]}" if len(check) > 2 else ""))

def ex37():
    """RollbackManager — trigger on error rate spike"""
    class RollbackManager:
        def __init__(self, error_threshold=0.05, window=20):
            self.error_threshold = error_threshold
            self.window = deque(maxlen=window)
            self.versions = []
            self.current_version = None
            self.rollbacks = []
        def register_version(self, version):
            self.versions.append(version)
            self.current_version = version
        def record_outcome(self, is_error: bool, request_id: str):
            self.window.append(int(is_error))
            if len(self.window) >= 10:
                rate = np.mean(self.window)
                if rate > self.error_threshold and len(self.versions) >= 2:
                    prev = self.versions[-2]
                    self.rollbacks.append({
                        "from": self.current_version,
                        "to": prev,
                        "trigger": f"error_rate={rate:.3f}"
                    })
                    self.current_version = prev
                    self.window.clear()
                    return True, prev
            return False, None
    mgr = RollbackManager(error_threshold=0.20, window=10)
    mgr.register_version("v2.0"); mgr.register_version("v2.1")
    import collections as col_
    deque_ = col_.deque
    outcomes = [False] * 8 + [True] * 6 + [False] * 5
    rolled = False
    for i, err in enumerate(outcomes):
        triggered, to_ver = mgr.record_outcome(err, f"req_{i}")
        if triggered and not rolled:
            print(f"Ex37 — RollbackManager: rollback triggered at request {i} → {to_ver}")
            rolled = True
    if not rolled:
        print(f"Ex37 — RollbackManager: no rollback triggered, current={mgr.current_version}")
    print(f"  Total rollbacks: {len(mgr.rollbacks)}")

def ex38():
    """ProductionDeploymentOrchestrator — full flow"""
    class ProductionDeploymentOrchestrator:
        def __init__(self):
            self.stages = []
            self.log = []
        def _stage(self, name, fn):
            start = time.perf_counter()
            result = fn()
            elapsed = round((time.perf_counter() - start) * 1000, 2)
            self.stages.append({"stage": name, "result": result, "elapsed_ms": elapsed})
            self.log.append(f"  [{name}] {'OK' if result else 'FAILED'} ({elapsed}ms)")
            return result
        def run(self, X, y):
            X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
            model_container = [None]
            self._stage("train", lambda: [
                model_container.__setitem__(0, RandomForestClassifier(n_estimators=20, random_state=42).fit(X_tr, y_tr)),
                True][1])
            self._stage("validate", lambda: accuracy_score(y_te, model_container[0].predict(X_te)) > 0.80)
            self._stage("smoke_test", lambda: len(model_container[0].predict(X_te[:5])) == 5)
            self._stage("register", lambda: True)  # simulate registry push
            self._stage("deploy_canary_10pct", lambda: True)
            self._stage("monitor_5min", lambda: True)
            self._stage("promote_to_100pct", lambda: True)
            ok = all(s["result"] for s in self.stages)
            self.log.append(f"  DEPLOYMENT STATUS: {'SUCCESS' if ok else 'FAILED'}")
            return ok
    X, y = make_classification(n_samples=600, n_features=10, random_state=42)
    orch = ProductionDeploymentOrchestrator()
    success = orch.run(X, y)
    print(f"Ex38 — ProductionDeploymentOrchestrator: success={success}")
    for line in orch.log:
        print(line)

# ─── ADVANCED (39–50) ────────────────────────────────────────

def ex39():
    """Kubernetes Deployment manifest"""
    manifest = """Ex39 — Kubernetes Deployment Manifest:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fraud-classifier
  namespace: ml-production
  labels:
    app: fraud-classifier
    version: v2.1.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fraud-classifier
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: fraud-classifier
        version: v2.1.0
    spec:
      containers:
      - name: api
        image: fraud-api:v2.1.0
        ports:
        - containerPort: 8000
        resources:
          requests: {cpu: "500m", memory: "1Gi"}
          limits:   {cpu: "2000m", memory: "4Gi"}
        readinessProbe:
          httpGet: {path: /health, port: 8000}
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet: {path: /health, port: 8000}
          initialDelaySeconds: 30
          periodSeconds: 10"""
    print(manifest)

def ex40():
    """Kubernetes Service manifest"""
    manifest = """Ex40 — Kubernetes Service Manifest:
apiVersion: v1
kind: Service
metadata:
  name: fraud-classifier-svc
  namespace: ml-production
spec:
  selector:
    app: fraud-classifier
  ports:
  - name: http
    port: 80
    targetPort: 8000
    protocol: TCP
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fraud-classifier-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "30"
    nginx.ingress.kubernetes.io/proxy-body-size: "1m"
spec:
  rules:
  - host: fraud-api.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fraud-classifier-svc
            port: {number: 80}"""
    print(manifest)

def ex41():
    """Helm chart values.yaml"""
    values = """Ex41 — Helm Chart values.yaml:
replicaCount: 3

image:
  repository: fraud-api
  tag: v2.1.0
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  host: fraud-api.company.com

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 4Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70

model:
  version: v2.1.0
  registryPath: s3://ml-models/fraud/v2.1.0/model.joblib
  warmupRequests: 100

monitoring:
  prometheusEnabled: true
  grafanaDashboard: true
  alertSlackChannel: "#ml-alerts"

# Deploy: helm upgrade --install fraud-api ./chart -f values.yaml"""
    print(values)

def ex42():
    """Argo CD application manifest"""
    manifest = """Ex42 — Argo CD Application Manifest:
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: fraud-classifier
  namespace: argocd
spec:
  project: ml-production
  source:
    repoURL: https://github.com/company/ml-deployments
    targetRevision: main
    path: charts/fraud-classifier
    helm:
      valueFiles:
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: ml-production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 3
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  # Argo CD watches git repo and auto-deploys on commit to main
  # Health checks use Kubernetes deployment readiness"""
    print(manifest)

def ex43():
    """GitOps workflow concept"""
    workflow = """Ex43 — GitOps Workflow for ML:
  PRINCIPLE: Git is the single source of truth for deployments.
  Any change to production goes through a git commit + PR review.

  WORKFLOW:
  ┌────────────────────────────────────────────────────────┐
  │  1. Data Scientist trains model → logs to MLflow       │
  │  2. CI pipeline: test → build Docker image             │
  │  3. Update image tag in git (values-prod.yaml)         │
  │     git commit -m "deploy fraud-api:v2.1.0"           │
  │  4. PR review → merge to main                         │
  │  5. Argo CD detects git change automatically           │
  │  6. Argo CD syncs k8s state to match git              │
  │  7. Rolling deployment begins (Kubernetes)             │
  │  8. Argo CD reports sync status (Slack/PagerDuty)     │
  └────────────────────────────────────────────────────────┘

  ROLLBACK: git revert <commit> → push → Argo CD auto-reverts
  AUDIT:    git log = full deployment history with author + reason
  TOOLS:    Argo CD / Flux CD / Jenkins X"""
    print(workflow)

def ex44():
    """MLflow + FastAPI integration pattern"""
    pattern = """Ex44 — MLflow + FastAPI Integration:
import mlflow
from fastapi import FastAPI
import mlflow.sklearn

app = FastAPI()

# Load model from MLflow Model Registry at startup
MODEL_URI = "models:/fraud_classifier/Production"
model = mlflow.sklearn.load_model(MODEL_URI)

@app.post("/predict")
async def predict(features: dict):
    import pandas as pd, numpy as np
    X = pd.DataFrame([features])
    prediction = model.predict(X)[0]
    proba = model.predict_proba(X)[0][1]

    # Log prediction back to MLflow for monitoring
    with mlflow.start_run(tags={"type": "inference"}):
        mlflow.log_metric("fraud_probability", proba)
        mlflow.log_param("model_version", MODEL_URI)

    return {"prediction": int(prediction), "probability": round(float(proba), 4)}

# Register new model version:
# mlflow.sklearn.log_model(model, "fraud_classifier",
#     registered_model_name="fraud_classifier")
# client.transition_model_version_stage(name="fraud_classifier",
#     version=3, stage="Production")"""
    print(pattern)

def ex45():
    """BentoML concept"""
    pattern = """Ex45 — BentoML Deployment Pattern:
import bentoml
from bentoml.io import NumpyNdarray

# Save model to BentoML store
runner = bentoml.sklearn.get("fraud_classifier:latest").to_runner()
svc = bentoml.Service("fraud_classifier_svc", runners=[runner])

@svc.api(input=NumpyNdarray(), output=NumpyNdarray())
async def predict(input_data):
    return await runner.predict.async_run(input_data)

# Save a model:
# bentoml.sklearn.save_model("fraud_classifier", trained_model)

# Build Bento (deployable artifact):
# bentoml build  → creates fraud_classifier_svc:v1.0.0

# Serve locally:
# bentoml serve fraud_classifier_svc:latest --port 3000

# Deploy to BentoCloud / AWS / GCP:
# bentoml deploy fraud_classifier_svc --platform aws-ec2

# Key benefits:
# - Automatic Docker image generation
# - Adaptive batching built-in
# - OpenAPI schema auto-generated
# - Supports PyTorch, TensorFlow, sklearn, XGBoost, etc."""
    print(pattern)

def ex46():
    """Seldon Core concept"""
    yaml_str = """Ex46 — Seldon Core SeldonDeployment YAML:
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: fraud-classifier
  namespace: ml-production
spec:
  name: fraud-classifier
  predictors:
  - name: default
    replicas: 3
    graph:
      name: fraud-model
      implementation: SKLEARN_SERVER
      modelUri: s3://ml-models/fraud/v2.1.0
      envSecretRefName: aws-credentials
    componentSpecs:
    - spec:
        containers:
        - name: fraud-model
          resources:
            requests: {memory: "1Gi", cpu: "500m"}
            limits:   {memory: "4Gi", cpu: "2000m"}
  # Canary predictor (10% traffic):
  - name: canary
    replicas: 1
    traffic: 10
    graph:
      name: fraud-model-v2
      implementation: SKLEARN_SERVER
      modelUri: s3://ml-models/fraud/v2.2.0"""
    print(yaml_str)

def ex47():
    """KServe concept"""
    yaml_str = """Ex47 — KServe InferenceService YAML:
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: fraud-classifier
  namespace: ml-production
  annotations:
    serving.knative.dev/autoscaling.class: kpa.autoscaling.knative.dev
    serving.knative.dev/autoscaling.metric: concurrency
    serving.knative.dev/autoscaling.target: "100"
spec:
  predictor:
    minReplicas: 1
    maxReplicas: 10
    sklearn:
      storageUri: s3://ml-models/fraud/v2.1.0
      resources:
        requests: {cpu: "500m", memory: "1Gi"}
        limits:   {cpu: "2", memory: "4Gi"}
  transformer:
    containers:
    - name: kserve-container
      image: fraud-transformer:v1.0
      # Pre/post-processing transformer layer

# Key features:
# - Serverless (scale to zero)
# - Canary rollouts via traffic splitting
# - gRPC + REST inference endpoints
# - Model explainability (SHAP) integration"""
    print(yaml_str)

def ex48():
    """Ray Serve concept"""
    pattern = """Ex48 — Ray Serve Deployment Pattern:
import ray
from ray import serve
import joblib

ray.init()
serve.start()

@serve.deployment(
    num_replicas=3,
    ray_actor_options={"num_cpus": 1, "memory": 2 * 1024**3},
    autoscaling_config={
        "min_replicas": 1, "max_replicas": 20,
        "target_num_ongoing_requests_per_replica": 10,
    }
)
class FraudClassifier:
    def __init__(self):
        self.model = joblib.load("fraud_v2.1.0.joblib")

    async def __call__(self, request):
        data = await request.json()
        X = [[data["amount"], data["hour"], data["card_age"]]]
        prob = float(self.model.predict_proba(X)[0][1])
        return {"fraud_probability": prob, "prediction": "fraud" if prob > 0.5 else "ok"}

FraudClassifier.deploy()
# handle = serve.get_deployment("FraudClassifier").get_handle()

# Key benefits:
# - Dynamic autoscaling with fractional CPU/GPU
# - Pipeline composition (chaining models)
# - Batch inference support built-in"""
    print(pattern)

def ex49():
    """Multi-region deployment strategy"""
    strategy = """Ex49 — Multi-Region Deployment Strategy:
  TOPOLOGY:
  ┌────────────────────────────────────────────────────────┐
  │  Global Load Balancer (Route53 / GCP Cloud DNS)        │
  │     Latency-based routing → nearest region             │
  ├─────────────────┬────────────────┬─────────────────────┤
  │   US-EAST-1     │  EU-WEST-1     │  AP-SOUTHEAST-1     │
  │   (primary)     │  (secondary)   │  (secondary)        │
  │   3 replicas    │  3 replicas    │  2 replicas         │
  ├─────────────────┴────────────────┴─────────────────────┤
  │  Model Artifacts: S3 replicated (CRR) across regions   │
  │  Model Version:   Same v2.1.0 everywhere (consistency) │
  │  Failover:        Auto via health checks (< 60s TTL)   │
  │  Monitoring:      Centralized Grafana, per-region tags │
  └────────────────────────────────────────────────────────┘

  DEPLOYMENT ORDER: us-east-1 → validate → eu-west-1 → validate → ap-se-1
  ROLLBACK:         Per-region independent rollback capability
  DATA:             Predictions logged locally, async sync to central store
  COST:             Reserved instances in primary, spot in secondary"""
    print(strategy)

def ex50():
    """Production ML deployment architecture — full design"""
    design = """Ex50 — Production ML Deployment Architecture:
  ┌─────────────────────────────────────────────────────────────┐
  │            FULL PRODUCTION ML DEPLOYMENT STACK              │
  ├───────────────┬────────────────────────────────────────────┤
  │ CLIENT LAYER  │ Auth Gateway (Kong/Apigee), Rate Limiting   │
  ├───────────────┼────────────────────────────────────────────┤
  │ API LAYER     │ FastAPI + Uvicorn (3-8 workers)            │
  │               │ Input validation, schema enforcement        │
  ├───────────────┼────────────────────────────────────────────┤
  │ SERVING LAYER │ KServe / BentoML / Ray Serve               │
  │               │ Model loading, batching, GPU mgmt           │
  ├───────────────┼────────────────────────────────────────────┤
  │ INFRA LAYER   │ Kubernetes (EKS/GKE/AKS)                  │
  │               │ HPA (CPU+custom), PDB, pod anti-affinity   │
  ├───────────────┼────────────────────────────────────────────┤
  │ STORAGE       │ S3 (artifacts), Redis (cache), RDS (logs)  │
  ├───────────────┼────────────────────────────────────────────┤
  │ CICD          │ GitHub Actions → Argo CD (GitOps)          │
  │               │ Blue-green → canary → full rollout         │
  ├───────────────┼────────────────────────────────────────────┤
  │ MONITORING    │ Prometheus + Grafana (metrics)             │
  │               │ MLflow (experiments), ELK (logs)           │
  │               │ Custom drift engine (PSI/KS/Wasserstein)   │
  ├───────────────┼────────────────────────────────────────────┤
  │ ALERTING      │ PagerDuty + Slack (alerts)                 │
  │               │ Auto-retraining trigger via Kubeflow       │
  └───────────────┴────────────────────────────────────────────┘
  TARGET SLAs: 99.9% uptime | P99 < 100ms | Error rate < 1%"""
    print(design)


def main():
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print("Examples 4.5 — ML Deployment Project")
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
