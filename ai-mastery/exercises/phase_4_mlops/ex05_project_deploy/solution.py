# ============================================================
# Solution 4.5 — Project: Deploy ML Model End-to-End
# ============================================================
#
# pip install scikit-learn joblib numpy fastapi uvicorn pydantic
#
# Run main() to see all deployment artifacts printed.
# Start the API: uvicorn app:app --reload  (after generating app.py)

import os
import json
import joblib
import numpy as np
from datetime import datetime
from sklearn.datasets import load_iris
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


# ---------------------------------------------------------------------------
# SOLUTION 1: Train and save model
# ---------------------------------------------------------------------------
def train_and_save_model(
    model_dir: str = "./models",
    version: str = "1.0.0",
) -> str:
    os.makedirs(model_dir, exist_ok=True)

    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2, random_state=42
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    GradientBoostingClassifier(
            n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42
        )),
    ])
    pipeline.fit(X_train, y_train)

    acc = accuracy_score(y_test, pipeline.predict(X_test))

    model_path = os.path.join(model_dir, f"model_v{version}.pkl")
    meta_path  = os.path.join(model_dir, f"model_v{version}_meta.json")

    joblib.dump(pipeline, model_path)

    meta = {
        "version":        version,
        "model_type":     "GradientBoostingClassifier",
        "n_features":     iris.data.shape[1],
        "feature_names":  list(iris.feature_names),
        "classes":        list(iris.target_names),
        "accuracy":       round(acc, 4),
        "trained_at":     datetime.utcnow().isoformat(),
        "train_samples":  X_train.shape[0],
        "test_samples":   X_test.shape[0],
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"    Saved model  : {model_path}")
    print(f"    Saved meta   : {meta_path}")
    print(f"    Test accuracy: {acc:.4f}")
    return model_path


# ---------------------------------------------------------------------------
# SOLUTION 2: Pydantic request schema
# ---------------------------------------------------------------------------
def pydantic_request_schema() -> str:
    return '''\
from pydantic import BaseModel, validator
from typing import List, Optional

class PredictRequest(BaseModel):
    features: List[float]
    model_version: Optional[str] = "latest"

    @validator("features")
    def check_feature_count(cls, v):
        if len(v) != 4:
            raise ValueError(f"Expected exactly 4 features, got {len(v)}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "features": [5.1, 3.5, 1.4, 0.2],
                "model_version": "1.0.0"
            }
        }
'''


# ---------------------------------------------------------------------------
# SOLUTION 3: Pydantic response schema
# ---------------------------------------------------------------------------
def pydantic_response_schema() -> str:
    return '''\
from pydantic import BaseModel

class PredictResponse(BaseModel):
    prediction:    int
    class_name:    str
    confidence:    float
    model_version: str
    latency_ms:    float
'''


# ---------------------------------------------------------------------------
# SOLUTION 4: Health endpoint
# ---------------------------------------------------------------------------
def health_endpoint_code() -> str:
    return '''\
import time

_start_time = time.time()

@app.get("/health")
def health():
    return {
        "status":          "healthy",
        "model_loaded":    model is not None,
        "model_version":   model_meta.get("version", "unknown"),
        "uptime_seconds":  round(time.time() - _start_time, 1),
        "timestamp":       datetime.utcnow().isoformat(),
    }
'''


# ---------------------------------------------------------------------------
# SOLUTION 5: Predict endpoint
# ---------------------------------------------------------------------------
def predict_endpoint_code() -> str:
    return '''\
import time
from fastapi import HTTPException

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    t0 = time.perf_counter()
    try:
        X = np.array(request.features).reshape(1, -1)
        pred_idx      = int(model.predict(X)[0])
        probabilities = model.predict_proba(X)[0]
        confidence    = float(probabilities[pred_idx])
        classes       = model_meta.get("classes", [])
        class_name    = classes[pred_idx] if classes else str(pred_idx)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    latency_ms = (time.perf_counter() - t0) * 1000

    return PredictResponse(
        prediction=pred_idx,
        class_name=class_name,
        confidence=confidence,
        model_version=model_meta.get("version", "unknown"),
        latency_ms=round(latency_ms, 3),
    )
'''


# ---------------------------------------------------------------------------
# SOLUTION 6: Batch predict endpoint
# ---------------------------------------------------------------------------
def batch_predict_endpoint_code() -> str:
    return '''\
from typing import List
import time

@app.post("/predict/batch", response_model=List[PredictResponse])
def predict_batch(requests: List[PredictRequest]):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not requests:
        return []

    t0 = time.perf_counter()
    try:
        X             = np.array([r.features for r in requests])
        pred_indices  = model.predict(X).tolist()
        probabilities = model.predict_proba(X)
        classes       = model_meta.get("classes", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {e}")

    latency_ms = (time.perf_counter() - t0) * 1000 / len(requests)
    version    = model_meta.get("version", "unknown")

    results = []
    for i, pred_idx in enumerate(pred_indices):
        confidence = float(probabilities[i][pred_idx])
        class_name = classes[pred_idx] if classes else str(pred_idx)
        results.append(PredictResponse(
            prediction=pred_idx,
            class_name=class_name,
            confidence=confidence,
            model_version=version,
            latency_ms=round(latency_ms, 3),
        ))
    return results
'''


# ---------------------------------------------------------------------------
# SOLUTION 7: Dockerfile
# ---------------------------------------------------------------------------
def api_dockerfile() -> str:
    return """\
FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
        curl \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (layer cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app.py .
COPY models/ ./models/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Use 2 workers; tune WEB_CONCURRENCY env var for production
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
"""


# ---------------------------------------------------------------------------
# SOLUTION 8: Model versioning strategy
# ---------------------------------------------------------------------------
def model_versioning_strategy() -> dict:
    return {
        "strategy": "Semantic versioning (MAJOR.MINOR.PATCH) + git SHA suffix",
        "directory_structure": (
            "models/\n"
            "  model_v1.0.0.pkl          ← production\n"
            "  model_v1.0.0_meta.json\n"
            "  model_v1.1.0.pkl          ← staging (new feature)\n"
            "  model_v1.1.0_meta.json\n"
            "  latest -> model_v1.0.0.pkl  ← symlink or manifest file\n"
        ),
        "promotion_flow": (
            "1. Train → save to models/model_v{version}.pkl\n"
            "2. Evaluate on held-out test set → must exceed baseline accuracy\n"
            "3. Register in MLflow Model Registry (status: None → Staging)\n"
            "4. Integration tests pass → promote to Production\n"
            "5. Update 'latest' symlink / manifest pointing to new version\n"
            "6. Archive old production version\n"
        ),
        "rollback": (
            "Keep the previous N model versions in the models/ directory.\n"
            "To roll back:\n"
            "  1. Update the 'latest' symlink to point to the previous version\n"
            "  2. Send SIGTERM to the API → it re-reads model on startup\n"
            "  OR use blue-green: redirect traffic back to the old (blue) deployment\n"
        ),
    }


# ---------------------------------------------------------------------------
# SOLUTION 9: CI/CD pipeline YAML
# ---------------------------------------------------------------------------
def cicd_pipeline_yaml() -> str:
    return """\
# .github/workflows/deploy.yml
name: Build and Deploy ML API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/ml-api

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest httpx

      - name: Run tests
        run: pytest tests/ -v --tb=short

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Train model (bake into image)
        run: python train.py --output-dir ./models

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to production (rolling update)
        run: |
          kubectl set image deployment/ml-api \\
            api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \\
            --record

          kubectl rollout status deployment/ml-api --timeout=120s

      - name: Smoke test production
        run: |
          sleep 10
          curl -f https://api.example.com/health
"""


# ---------------------------------------------------------------------------
# SOLUTION 10: Blue-green deployment
# ---------------------------------------------------------------------------
def blue_green_deployment() -> dict:
    return {
        "description": (
            "Run two identical production environments (blue = current, green = new). "
            "Deploy the new version to green while blue keeps serving traffic. "
            "Switch traffic from blue to green instantly. "
            "Blue stays live as immediate rollback target."
        ),
        "steps": [
            "1. Blue environment serves 100% of production traffic",
            "2. Deploy new model version to green environment (zero user impact)",
            "3. Run smoke tests and integration tests against green",
            "4. Switch load balancer / ingress to route 100% traffic to green",
            "5. Monitor green for 10-30 minutes (error rates, latency, drift)",
            "6. If healthy: decommission blue (or keep for next cycle)",
            "7. If unhealthy: switch load balancer back to blue (< 30s rollback)",
        ],
        "benefits": [
            "Zero-downtime deployments",
            "Instant rollback — just flip the load balancer",
            "Can run A/B tests by splitting traffic (10% green / 90% blue)",
            "New version fully warmed up before receiving traffic",
        ],
        "risks": [
            "Requires 2× infrastructure cost during transition",
            "Database migrations must be backward-compatible",
            "Stateful services (caches, sessions) require careful handling",
        ],
        "traffic_switch_command": (
            "# Kubernetes: update Service selector to point at green pods\n"
            "kubectl patch service ml-api-service \\\n"
            "  -p '{\"spec\":{\"selector\":{\"slot\":\"green\"}}}'\n\n"
            "# nginx: reload with upstream pointing to green\n"
            "sed -i 's/server blue-api/server green-api/' /etc/nginx/upstream.conf\n"
            "nginx -s reload"
        ),
    }


# ---------------------------------------------------------------------------
# SOLUTION 11: Production readiness checklist
# ---------------------------------------------------------------------------
def production_checklist() -> list:
    return [
        # Security
        {"category": "security",       "item": "API key or OAuth2 authentication on all prediction endpoints", "done": False},
        {"category": "security",       "item": "HTTPS / TLS termination at load balancer", "done": False},
        {"category": "security",       "item": "Non-root container user", "done": True},
        {"category": "security",       "item": "Secrets managed via environment variables or vault (not hard-coded)", "done": False},
        {"category": "security",       "item": "Dependency vulnerability scan in CI (pip audit / snyk)", "done": False},
        # Observability
        {"category": "observability",  "item": "Structured JSON logging with request IDs", "done": False},
        {"category": "observability",  "item": "Prometheus metrics endpoint (/metrics)", "done": False},
        {"category": "observability",  "item": "Distributed tracing (OpenTelemetry)", "done": False},
        {"category": "observability",  "item": "Prediction logging to data warehouse for drift analysis", "done": False},
        # Reliability
        {"category": "reliability",    "item": "Health check endpoint (/health) used by orchestrator", "done": True},
        {"category": "reliability",    "item": "Graceful shutdown (handle SIGTERM, drain in-flight requests)", "done": False},
        {"category": "reliability",    "item": "Readiness probe separate from liveness probe (Kubernetes)", "done": False},
        {"category": "reliability",    "item": "Circuit breaker for downstream model registry calls", "done": False},
        # Performance
        {"category": "performance",    "item": "Batch prediction endpoint for high-throughput use cases", "done": True},
        {"category": "performance",    "item": "Response caching for repeated identical inputs (Redis)", "done": False},
        {"category": "performance",    "item": "Load tested to target RPS before go-live", "done": False},
        # Data
        {"category": "data",           "item": "Input validation with Pydantic (schema enforcement)", "done": True},
        {"category": "data",           "item": "Model version recorded in every response for traceability", "done": True},
        {"category": "data",           "item": "Drift monitoring alerts configured", "done": False},
    ]


# ---------------------------------------------------------------------------
# SOLUTION 12: Complete FastAPI app code
# ---------------------------------------------------------------------------
def full_fastapi_app_code() -> str:
    return '''\
"""
app.py — Production-ready FastAPI ML inference service
Run with: uvicorn app:app --host 0.0.0.0 --port 8000 --workers 2
"""
import os
import json
import time
import logging
from datetime import datetime
from typing import List, Optional

import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator

# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("ml-api")

# ── Configuration (from environment) ────────────────────────────────────
MODEL_DIR     = os.environ.get("MODEL_DIR",   "./models")
MODEL_VERSION = os.environ.get("MODEL_VERSION", "1.0.0")
MODEL_PATH    = os.path.join(MODEL_DIR, f"model_v{MODEL_VERSION}.pkl")
META_PATH     = os.path.join(MODEL_DIR, f"model_v{MODEL_VERSION}_meta.json")
API_KEY       = os.environ.get("API_KEY", "secret-key-123")

# ── App ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ML Inference API",
    version=MODEL_VERSION,
    description="Serves a trained GradientBoosting classifier for Iris prediction.",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

_start_time = time.time()
model      = None
model_meta: dict = {}

# ── Schemas ───────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    features: List[float]
    model_version: Optional[str] = "latest"

    @validator("features")
    def check_feature_count(cls, v):
        if len(v) != 4:
            raise ValueError(f"Expected 4 features, got {len(v)}")
        return v

class PredictResponse(BaseModel):
    prediction:    int
    class_name:    str
    confidence:    float
    model_version: str
    latency_ms:    float

# ── Middleware ────────────────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - t0) * 1000
    logger.info("%s %s %d %.1fms",
                request.method, request.url.path, response.status_code, ms)
    return response

# ── Auth ──────────────────────────────────────────────────────────────────
def verify_key(x_api_key: Optional[str] = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# ── Startup / Shutdown ────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    global model, model_meta
    try:
        model = joblib.load(MODEL_PATH)
        with open(META_PATH) as f:
            model_meta = json.load(f)
        logger.info("Model loaded: %s v%s  accuracy=%.4f",
                    model_meta.get("model_type"), MODEL_VERSION,
                    model_meta.get("accuracy", 0))
    except FileNotFoundError:
        logger.warning("Model file not found at %s — serving without model", MODEL_PATH)

@app.on_event("shutdown")
async def shutdown():
    logger.info("API shutting down.")

# ── Endpoints ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":         "healthy",
        "model_loaded":   model is not None,
        "model_version":  model_meta.get("version", "unknown"),
        "uptime_seconds": round(time.time() - _start_time, 1),
        "timestamp":      datetime.utcnow().isoformat(),
    }

@app.post("/predict", response_model=PredictResponse,
          dependencies=[Depends(verify_key)])
def predict(request: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    t0 = time.perf_counter()
    try:
        X         = np.array(request.features).reshape(1, -1)
        pred_idx  = int(model.predict(X)[0])
        probs     = model.predict_proba(X)[0]
        confidence= float(probs[pred_idx])
        classes   = model_meta.get("classes", [])
        class_name= classes[pred_idx] if classes else str(pred_idx)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")
    return PredictResponse(
        prediction=pred_idx, class_name=class_name, confidence=confidence,
        model_version=model_meta.get("version", "unknown"),
        latency_ms=round((time.perf_counter() - t0) * 1000, 3),
    )

@app.post("/predict/batch", response_model=List[PredictResponse],
          dependencies=[Depends(verify_key)])
def predict_batch(requests: List[PredictRequest]):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not requests:
        return []
    t0     = time.perf_counter()
    X      = np.array([r.features for r in requests])
    preds  = model.predict(X).tolist()
    probs  = model.predict_proba(X)
    ms_per = (time.perf_counter() - t0) * 1000 / len(requests)
    ver    = model_meta.get("version", "unknown")
    classes= model_meta.get("classes", [])
    return [
        PredictResponse(
            prediction=p,
            class_name=classes[p] if classes else str(p),
            confidence=float(probs[i][p]),
            model_version=ver,
            latency_ms=round(ms_per, 3),
        )
        for i, p in enumerate(preds)
    ]
'''


def main():
    print("=== Solution 4.5: Deploy ML Model End-to-End ===\n")

    print("1. Training and saving model...")
    os.makedirs("./models", exist_ok=True)
    model_path = train_and_save_model("./models", "1.0.0")
    print()

    print("2. Pydantic Request Schema:")
    print(pydantic_request_schema())

    print("3. Pydantic Response Schema:")
    print(pydantic_response_schema())

    print("4. Health Endpoint:")
    print(health_endpoint_code())

    print("5. Predict Endpoint:")
    print(predict_endpoint_code())

    print("6. Batch Predict Endpoint:")
    print(batch_predict_endpoint_code())

    print("7. Dockerfile:")
    print(api_dockerfile())

    print("8. Model Versioning Strategy:")
    for k, v in model_versioning_strategy().items():
        print(f"  {k}:\n    {v.strip()}\n")

    print("9. CI/CD Pipeline YAML:")
    print(cicd_pipeline_yaml())

    print("10. Blue-Green Deployment:")
    bg = blue_green_deployment()
    print(f"  Description: {bg['description']}")
    print("  Steps:")
    for step in bg["steps"]:
        print(f"    {step}")
    print(f"  Traffic switch:\n    {bg['traffic_switch_command'][:80]}...")
    print()

    print("11. Production Checklist:")
    checklist = production_checklist()
    for item in checklist:
        status = "✓" if item["done"] else "○"
        print(f"  [{status}] [{item['category']:14s}] {item['item']}")
    done  = sum(1 for i in checklist if i["done"])
    total = len(checklist)
    print(f"\n  Completed: {done}/{total}")
    print()

    print("12. Full FastAPI App (app.py) — writing to disk...")
    app_code = full_fastapi_app_code()
    app_path = "./app.py"
    with open(app_path, "w") as f:
        f.write(app_code)
    print(f"  Written to: {app_path}")
    print(f"  Start with: uvicorn app:app --reload --port 8000")
    print()
    print("End-to-end deployment complete.")
    print("Test with:")
    print('  curl http://localhost:8000/health')
    print('  curl -X POST http://localhost:8000/predict \\')
    print('       -H "x-api-key: secret-key-123" \\')
    print('       -H "Content-Type: application/json" \\')
    print('       -d \'{"features": [5.1, 3.5, 1.4, 0.2]}\'')


if __name__ == "__main__":
    main()
