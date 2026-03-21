# ============================================================
# Examples 4.1 — FastAPI Model Serving (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import json
import time
import hashlib
import uuid
from datetime import datetime

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """FastAPI app structure"""
    code = """
from fastapi import FastAPI

app = FastAPI(title="ML Model API", version="1.0.0")

@app.get("/")
def root():
    return {"message": "ML Model API is running"}
"""
    print("Ex01 — FastAPI App Structure:")
    print(code)

def ex02():
    """GET endpoint pattern"""
    code = """
@app.get("/model/info")
def model_info():
    return {
        "model_name": "RandomForest",
        "version": "1.2.0",
        "features": ["age", "income", "score"]
    }
"""
    print("Ex02 — GET Endpoint Pattern:")
    print(code)

def ex03():
    """POST endpoint pattern"""
    code = """
@app.post("/predict")
def predict(data: dict):
    features = data["features"]
    prediction = model.predict([features])[0]
    return {"prediction": prediction}
"""
    print("Ex03 — POST Endpoint Pattern:")
    print(code)

def ex04():
    """Pydantic request model"""
    code = """
from pydantic import BaseModel, Field
from typing import List

class PredictRequest(BaseModel):
    age: float = Field(..., ge=0, le=120, description="Age in years")
    income: float = Field(..., ge=0, description="Annual income")
    credit_score: int = Field(..., ge=300, le=850)

    class Config:
        json_schema_extra = {
            "example": {"age": 35, "income": 75000, "credit_score": 720}
        }
"""
    print("Ex04 — Pydantic Request Model:")
    print(code)

def ex05():
    """Pydantic response model"""
    code = """
from pydantic import BaseModel
from typing import Optional

class PredictResponse(BaseModel):
    prediction: int
    probability: float
    model_version: str
    request_id: str
    latency_ms: Optional[float] = None

# Usage:
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    ...
"""
    print("Ex05 — Pydantic Response Model:")
    print(code)

def ex06():
    """Health check endpoint"""
    code = """
import time

startup_time = time.time()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "uptime_seconds": round(time.time() - startup_time, 2),
        "model_loaded": model is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/ready")
def readiness():
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "ready"}
"""
    print("Ex06 — Health Check Endpoint:")
    print(code)

def ex07():
    """Model loading pattern"""
    code = """
import joblib
from pathlib import Path

MODEL_PATH = Path("models/model_v1.pkl")
model = None

def load_model():
    global model
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded from {MODEL_PATH}")
    return model

# Load at startup (not inside endpoint to avoid reload on each call)
@app.on_event("startup")
async def startup_event():
    load_model()
"""
    print("Ex07 — Model Loading Pattern:")
    print(code)

def ex08():
    """Prediction endpoint"""
    code = """
import numpy as np

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    start = time.time()
    features = np.array([[req.age, req.income, req.credit_score]])
    pred = model.predict(features)[0]
    prob = model.predict_proba(features)[0].max()
    latency = (time.time() - start) * 1000
    return PredictResponse(
        prediction=int(pred),
        probability=float(prob),
        model_version="1.2.0",
        request_id=str(uuid.uuid4()),
        latency_ms=round(latency, 3)
    )
"""
    print("Ex08 — Prediction Endpoint:")
    print(code)

def ex09():
    """Input validation"""
    code = """
from pydantic import BaseModel, validator, Field
from typing import List

class BatchRequest(BaseModel):
    records: List[dict]
    max_batch_size: int = 100

    @validator("records")
    def validate_records(cls, v):
        if len(v) == 0:
            raise ValueError("records list cannot be empty")
        if len(v) > 1000:
            raise ValueError("Max 1000 records per batch")
        return v

    @validator("records", each_item=True)
    def validate_each_record(cls, item):
        required = {"age", "income"}
        missing = required - set(item.keys())
        if missing:
            raise ValueError(f"Missing fields: {missing}")
        return item
"""
    print("Ex09 — Input Validation:")
    print(code)

def ex10():
    """Error response"""
    code = """
from fastapi import HTTPException
from fastapi.responses import JSONResponse

class ModelError(Exception):
    def __init__(self, detail: str, code: int = 500):
        self.detail = detail
        self.code = code

@app.exception_handler(ModelError)
async def model_error_handler(request, exc):
    return JSONResponse(
        status_code=exc.code,
        content={"error": exc.detail, "type": "ModelError"}
    )

# Usage inside endpoint:
# if not model:
#     raise HTTPException(status_code=503, detail="Model not available")
"""
    print("Ex10 — Error Response:")
    print(code)

def ex11():
    """CORS setup"""
    code = """
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myapp.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# For development (allow all):
# allow_origins=["*"]
"""
    print("Ex11 — CORS Setup:")
    print(code)

def ex12():
    """Background task"""
    code = """
from fastapi import BackgroundTasks

def log_prediction(request_id: str, prediction: int, latency: float):
    # Write to DB, send to monitoring system, etc.
    with open("predictions.log", "a") as f:
        f.write(f"{request_id},{prediction},{latency}\\n")

@app.post("/predict")
def predict(req: PredictRequest, background_tasks: BackgroundTasks):
    pred = model.predict([[req.age, req.income]])[0]
    request_id = str(uuid.uuid4())
    background_tasks.add_task(log_prediction, request_id, int(pred), 12.5)
    return {"prediction": int(pred), "request_id": request_id}
"""
    print("Ex12 — Background Task:")
    print(code)

def ex13():
    """Startup/shutdown events"""
    code = """
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Loading model...")
    app.state.model = joblib.load("model.pkl")
    app.state.start_time = time.time()
    print("Model loaded, server ready")
    yield
    # Shutdown
    print("Shutting down gracefully...")
    # flush logs, close DB connections, etc.

app = FastAPI(lifespan=lifespan)

# Legacy way (still works):
# @app.on_event("startup") / @app.on_event("shutdown")
"""
    print("Ex13 — Startup/Shutdown Events:")
    print(code)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Batch prediction endpoint"""
    code = """
from typing import List
import numpy as np

class BatchPredictRequest(BaseModel):
    instances: List[List[float]]

class BatchPredictResponse(BaseModel):
    predictions: List[int]
    probabilities: List[float]
    count: int

@app.post("/predict/batch", response_model=BatchPredictResponse)
def batch_predict(req: BatchPredictRequest):
    X = np.array(req.instances)
    preds = model.predict(X).tolist()
    probs = model.predict_proba(X).max(axis=1).tolist()
    return BatchPredictResponse(
        predictions=preds, probabilities=probs, count=len(preds)
    )
"""
    print("Ex14 — Batch Prediction Endpoint:")
    print(code)

def ex15():
    """Async prediction endpoint"""
    code = """
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

def _predict_sync(features):
    return model.predict([features])[0]

@app.post("/predict/async")
async def async_predict(req: PredictRequest):
    loop = asyncio.get_event_loop()
    features = [req.age, req.income, req.credit_score]
    # Run CPU-bound model in thread pool to avoid blocking event loop
    pred = await loop.run_in_executor(executor, _predict_sync, features)
    return {"prediction": int(pred)}
"""
    print("Ex15 — Async Prediction Endpoint:")
    print(code)

def ex16():
    """Model versioning endpoint"""
    code = """
from typing import Dict

models: Dict[str, object] = {}

def load_all_models():
    models["v1"] = joblib.load("models/model_v1.pkl")
    models["v2"] = joblib.load("models/model_v2.pkl")
    models["latest"] = models["v2"]

@app.post("/predict/{version}")
def versioned_predict(version: str, req: PredictRequest):
    if version not in models:
        raise HTTPException(404, f"Model version '{version}' not found")
    m = models[version]
    pred = m.predict([[req.age, req.income]])[0]
    return {"prediction": int(pred), "version": version}
"""
    print("Ex16 — Model Versioning Endpoint:")
    print(code)

def ex17():
    """Authentication (API key)"""
    code = """
from fastapi.security.api_key import APIKeyHeader
from fastapi import Security, HTTPException

API_KEY = "secret-key-123"
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

@app.post("/predict", dependencies=[Depends(verify_api_key)])
def protected_predict(req: PredictRequest):
    return {"prediction": 1}

# Client usage:
# curl -H "X-API-Key: secret-key-123" -X POST /predict ...
"""
    print("Ex17 — Authentication (API Key):")
    print(code)

def ex18():
    """Rate limiting concept"""
    code = """
from collections import defaultdict
import time

request_counts = defaultdict(list)
RATE_LIMIT = 100  # requests per minute

def check_rate_limit(client_ip: str):
    now = time.time()
    minute_ago = now - 60
    # Remove old entries
    request_counts[client_ip] = [
        t for t in request_counts[client_ip] if t > minute_ago
    ]
    if len(request_counts[client_ip]) >= RATE_LIMIT:
        raise HTTPException(429, "Rate limit exceeded (100 req/min)")
    request_counts[client_ip].append(now)

@app.post("/predict")
def rate_limited_predict(req: PredictRequest, request: Request):
    check_rate_limit(request.client.host)
    return {"prediction": 1}

# Production: use slowapi or redis-based rate limiting
"""
    print("Ex18 — Rate Limiting Concept:")
    print(code)

def ex19():
    """Caching predictions"""
    code = """
import hashlib, json
from functools import lru_cache

prediction_cache = {}

def get_cache_key(features: dict) -> str:
    return hashlib.md5(json.dumps(features, sort_keys=True).encode()).hexdigest()

@app.post("/predict")
def cached_predict(req: PredictRequest):
    features = req.dict()
    cache_key = get_cache_key(features)
    if cache_key in prediction_cache:
        result = prediction_cache[cache_key]
        result["from_cache"] = True
        return result
    pred = model.predict([[req.age, req.income]])[0]
    result = {"prediction": int(pred), "from_cache": False}
    prediction_cache[cache_key] = result
    return result

# Production: use Redis via aioredis or redis-py
"""
    print("Ex19 — Caching Predictions:")
    print(code)

def ex20():
    """Model warm-up"""
    code = """
import numpy as np

def warmup_model(model, n_calls: int = 10):
    dummy = np.zeros((1, 3))  # match your feature count
    times = []
    for _ in range(n_calls):
        start = time.perf_counter()
        model.predict(dummy)
        times.append(time.perf_counter() - start)
    avg_ms = (sum(times) / len(times)) * 1000
    print(f"Warmup done: avg latency = {avg_ms:.2f}ms over {n_calls} calls")
    return avg_ms

@app.on_event("startup")
async def startup():
    app.state.model = joblib.load("model.pkl")
    warmup_model(app.state.model)
"""
    print("Ex20 — Model Warm-Up:")
    print(code)

def ex21():
    """Metrics endpoint (prometheus-style)"""
    code = """
from prometheus_client import Counter, Histogram, generate_latest
from fastapi.responses import PlainTextResponse

PREDICT_COUNT = Counter("predict_total", "Total predictions", ["status"])
PREDICT_LATENCY = Histogram("predict_latency_seconds", "Prediction latency")

@app.post("/predict")
def predict_with_metrics(req: PredictRequest):
    with PREDICT_LATENCY.time():
        try:
            pred = model.predict([[req.age, req.income]])[0]
            PREDICT_COUNT.labels(status="success").inc()
            return {"prediction": int(pred)}
        except Exception as e:
            PREDICT_COUNT.labels(status="error").inc()
            raise HTTPException(500, str(e))

@app.get("/metrics")
def metrics():
    return PlainTextResponse(generate_latest())
"""
    print("Ex21 — Metrics Endpoint (Prometheus-style):")
    print(code)

def ex22():
    """Logging middleware"""
    code = """
import logging
from fastapi import Request
import time

logger = logging.getLogger("ml_api")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[{request_id}] {request.method} {request.url.path}")
    response = await call_next(request)
    latency = (time.time() - start) * 1000
    logger.info(
        f"[{request_id}] status={response.status_code} latency={latency:.1f}ms"
    )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Latency-Ms"] = str(round(latency, 1))
    return response
"""
    print("Ex22 — Logging Middleware:")
    print(code)

def ex23():
    """Request ID tracking"""
    code = """
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

# Access in endpoint:
@app.post("/predict")
def predict(req: PredictRequest, request: Request):
    rid = request.state.request_id
    return {"prediction": 1, "request_id": rid}
"""
    print("Ex23 — Request ID Tracking:")
    print(code)

def ex24():
    """Input schema with examples"""
    code = """
from pydantic import BaseModel, Field

class LoanRequest(BaseModel):
    age: float = Field(..., example=35, ge=18, le=100)
    income: float = Field(..., example=75000.0, ge=0)
    debt_ratio: float = Field(..., example=0.35, ge=0, le=1)
    employment_years: int = Field(..., example=5, ge=0)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"age": 35, "income": 75000, "debt_ratio": 0.3, "employment_years": 5},
                {"age": 55, "income": 120000, "debt_ratio": 0.15, "employment_years": 20}
            ]
        }
    }
"""
    print("Ex24 — Input Schema with Examples:")
    print(code)

def ex25():
    """Streaming response"""
    code = """
from fastapi.responses import StreamingResponse
import json, time

def generate_predictions(instances):
    for i, inst in enumerate(instances):
        pred = model.predict([inst])[0]
        result = {"index": i, "prediction": int(pred)}
        yield json.dumps(result) + "\\n"
        time.sleep(0.01)  # simulate processing

@app.post("/predict/stream")
def stream_predict(req: BatchPredictRequest):
    return StreamingResponse(
        generate_predictions(req.instances),
        media_type="application/x-ndjson"
    )
# Client reads line-by-line (NDJSON = newline-delimited JSON)
"""
    print("Ex25 — Streaming Response:")
    print(code)

def ex26():
    """OpenAPI schema customization"""
    code = """
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title="Loan Approval ML API",
        version="2.1.0",
        description="Predicts loan approval using RandomForest",
        contact={"name": "ML Team", "email": "ml@company.com"},
        license_info={"name": "MIT"},
        routes=app.routes,
    )
    schema["info"]["x-model-version"] = "rf_v2.1"
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi
"""
    print("Ex26 — OpenAPI Schema Customization:")
    print(code)

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Full FastAPI ML app (complete code string)"""
    code = """
# === full_ml_api.py ===
import joblib, uuid, time
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager

class PredictRequest(BaseModel):
    age: float = Field(..., ge=0, le=120)
    income: float = Field(..., ge=0)
    credit_score: int = Field(..., ge=300, le=850)

class PredictResponse(BaseModel):
    prediction: int
    probability: float
    request_id: str
    latency_ms: float

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = joblib.load("model.pkl")
    yield

app = FastAPI(title="Loan API", version="1.0", lifespan=lifespan)

@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    t0 = time.perf_counter()
    X = np.array([[req.age, req.income, req.credit_score]])
    pred = int(app.state.model.predict(X)[0])
    prob = float(app.state.model.predict_proba(X)[0].max())
    return PredictResponse(
        prediction=pred, probability=prob,
        request_id=str(uuid.uuid4()),
        latency_ms=round((time.perf_counter() - t0) * 1000, 3)
    )
"""
    print("Ex27 — Full FastAPI ML App:")
    print(code)

def ex28():
    """Model registry class"""
    code = """
class ModelRegistry:
    def __init__(self):
        self._models = {}
        self._default = None

    def register(self, name: str, version: str, model_obj):
        key = f"{name}:{version}"
        self._models[key] = model_obj
        self._default = key
        print(f"Registered model '{key}'")

    def get(self, name: str, version: str = "latest"):
        if version == "latest":
            keys = [k for k in self._models if k.startswith(name + ":")]
            key = sorted(keys)[-1] if keys else None
        else:
            key = f"{name}:{version}"
        if key not in self._models:
            raise KeyError(f"Model '{key}' not found")
        return self._models[key]

    def list_models(self):
        return list(self._models.keys())

registry = ModelRegistry()
"""
    print("Ex28 — Model Registry Class:")
    print(code)

def ex29():
    """Prediction service class"""
    code = """
import numpy as np, time

class PredictionService:
    def __init__(self, model, preprocessor=None, postprocessor=None):
        self.model = model
        self.preprocessor = preprocessor
        self.postprocessor = postprocessor
        self.call_count = 0
        self.total_latency_ms = 0.0

    def predict(self, features: list) -> dict:
        t0 = time.perf_counter()
        X = np.array([features])
        if self.preprocessor:
            X = self.preprocessor.transform(X)
        raw = self.model.predict(X)[0]
        prob = self.model.predict_proba(X)[0].max()
        result = {"prediction": int(raw), "probability": float(prob)}
        if self.postprocessor:
            result = self.postprocessor(result)
        self.call_count += 1
        self.total_latency_ms += (time.perf_counter() - t0) * 1000
        return result

    def stats(self) -> dict:
        avg = self.total_latency_ms / self.call_count if self.call_count else 0
        return {"calls": self.call_count, "avg_latency_ms": round(avg, 3)}
"""
    print("Ex29 — Prediction Service Class:")
    print(code)

def ex30():
    """Middleware pipeline"""
    code = """
from fastapi import Request
import time, uuid

# Middleware executes in LIFO order — add in reverse priority
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    return await call_next(request)

@app.middleware("http")
async def add_latency_header(request: Request, call_next):
    t0 = time.time()
    response = await call_next(request)
    response.headers["X-Latency-Ms"] = str(round((time.time()-t0)*1000, 1))
    return response

@app.middleware("http")
async def validate_content_type(request: Request, call_next):
    if request.method == "POST" and "application/json" not in request.headers.get("content-type",""):
        return JSONResponse(status_code=415, content={"error": "JSON only"})
    return await call_next(request)
"""
    print("Ex30 — Middleware Pipeline:")
    print(code)

def ex31():
    """Dependency injection for model"""
    code = """
from fastapi import Depends

class ModelDep:
    def __init__(self):
        self._model = None

    def load(self, path: str):
        import joblib
        self._model = joblib.load(path)

    def __call__(self):
        if self._model is None:
            raise RuntimeError("Model not loaded")
        return self._model

model_dep = ModelDep()

@app.on_event("startup")
def startup():
    model_dep.load("model.pkl")

@app.post("/predict")
def predict(req: PredictRequest, model=Depends(model_dep)):
    pred = model.predict([[req.age, req.income]])[0]
    return {"prediction": int(pred)}
"""
    print("Ex31 — Dependency Injection for Model:")
    print(code)

def ex32():
    """A/B testing endpoint"""
    code = """
import random

models_ab = {"A": None, "B": None}  # loaded at startup

@app.post("/predict/ab")
def ab_predict(req: PredictRequest):
    # Route 20% traffic to model B, 80% to model A
    variant = "B" if random.random() < 0.2 else "A"
    model = models_ab[variant]
    pred = model.predict([[req.age, req.income]])[0]
    # Log variant for analysis
    return {
        "prediction": int(pred),
        "variant": variant,
        "request_id": str(uuid.uuid4())
    }

# Analyze A/B results by querying logs filtered by variant
"""
    print("Ex32 — A/B Testing Endpoint:")
    print(code)

def ex33():
    """Shadow mode endpoint"""
    code = """
from fastapi import BackgroundTasks

def run_shadow_model(features, primary_pred, request_id):
    shadow_pred = shadow_model.predict([features])[0]
    match = int(primary_pred) == int(shadow_pred)
    # Log discrepancy for analysis
    print(f"[Shadow] req={request_id} primary={primary_pred} shadow={shadow_pred} match={match}")

@app.post("/predict/shadow")
def shadow_predict(req: PredictRequest, background_tasks: BackgroundTasks):
    features = [req.age, req.income, req.credit_score]
    primary_pred = primary_model.predict([features])[0]
    request_id = str(uuid.uuid4())
    # Shadow runs in background — no effect on response
    background_tasks.add_task(run_shadow_model, features, primary_pred, request_id)
    return {"prediction": int(primary_pred), "request_id": request_id}
"""
    print("Ex33 — Shadow Mode Endpoint:")
    print(code)

def ex34():
    """Feature extraction + predict pipeline"""
    code = """
import numpy as np
from sklearn.pipeline import Pipeline

class FeatureExtractor:
    def transform(self, raw: dict) -> np.ndarray:
        age_norm = raw["age"] / 100.0
        income_log = np.log1p(raw["income"]) / 15.0
        score_norm = (raw["credit_score"] - 300) / 550.0
        debt_ratio = raw.get("debt_ratio", 0.3)
        return np.array([[age_norm, income_log, score_norm, debt_ratio]])

extractor = FeatureExtractor()

@app.post("/predict/pipeline")
def pipeline_predict(req: dict):
    features = extractor.transform(req)
    pred = model.predict(features)[0]
    prob = model.predict_proba(features)[0].max()
    return {"prediction": int(pred), "probability": round(float(prob), 4)}
"""
    print("Ex34 — Feature Extraction + Predict Pipeline:")
    print(code)

def ex35():
    """Multi-model serving"""
    code = """
from enum import Enum

class ModelType(str, Enum):
    classifier = "classifier"
    regressor  = "regressor"
    anomaly    = "anomaly"

loaded_models = {
    ModelType.classifier: clf_model,
    ModelType.regressor:  reg_model,
    ModelType.anomaly:    iso_model,
}

@app.post("/predict/{model_type}")
def multi_model_predict(model_type: ModelType, req: PredictRequest):
    model = loaded_models.get(model_type)
    if model is None:
        raise HTTPException(404, f"Model type '{model_type}' not found")
    X = [[req.age, req.income, req.credit_score]]
    if model_type == ModelType.anomaly:
        score = model.decision_function(X)[0]
        return {"anomaly_score": float(score)}
    pred = model.predict(X)[0]
    return {"prediction": float(pred), "model_type": model_type}
"""
    print("Ex35 — Multi-Model Serving:")
    print(code)

def ex36():
    """Model fallback chain"""
    code = """
import logging

logger = logging.getLogger(__name__)

class FallbackChain:
    def __init__(self, models: list, labels: list):
        self.chain = list(zip(labels, models))

    def predict(self, features):
        for label, model in self.chain:
            try:
                pred = model.predict([features])[0]
                logger.info(f"Predicted with '{label}'")
                return {"prediction": int(pred), "model_used": label}
            except Exception as e:
                logger.warning(f"Model '{label}' failed: {e}, trying next")
        raise RuntimeError("All models in fallback chain failed")

fallback = FallbackChain(
    models=[primary_model, backup_model, default_model],
    labels=["primary", "backup", "default"]
)
"""
    print("Ex36 — Model Fallback Chain:")
    print(code)

def ex37():
    """Request batching service"""
    code = """
import asyncio, numpy as np
from collections import deque

class BatchingService:
    def __init__(self, model, batch_size=32, timeout_ms=50):
        self.model = model
        self.batch_size = batch_size
        self.timeout = timeout_ms / 1000
        self.queue = deque()

    async def add_request(self, features: list):
        future = asyncio.get_event_loop().create_future()
        self.queue.append((features, future))
        if len(self.queue) >= self.batch_size:
            await self._flush()
        return await future

    async def _flush(self):
        batch, futures = [], []
        while self.queue:
            feat, fut = self.queue.popleft()
            batch.append(feat); futures.append(fut)
        preds = self.model.predict(np.array(batch))
        for fut, pred in zip(futures, preds):
            fut.set_result(int(pred))
"""
    print("Ex37 — Request Batching Service:")
    print(code)

def ex38():
    """Production FastAPI patterns"""
    code = """
# === production_patterns.py ===

# 1. Use lifespan (not deprecated on_event)
# 2. Store model on app.state (not global var)
# 3. Run with uvicorn + gunicorn workers
# 4. Add health + readiness + liveness endpoints
# 5. Use structured JSON logging
# 6. Add Prometheus metrics
# 7. Set timeout for model inference
# 8. Validate all inputs with Pydantic
# 9. Use async endpoints with ThreadPoolExecutor for CPU work
# 10. Rate limit per API key, not per IP

# Run command:
# gunicorn app:app -k uvicorn.workers.UvicornWorker \\
#   --workers 4 --bind 0.0.0.0:8000 \\
#   --timeout 30 --keep-alive 5 \\
#   --access-logfile - --error-logfile -
"""
    print("Ex38 — Production FastAPI Patterns:")
    print(code)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Async model loading"""
    code = """
import asyncio, aiofiles, pickle
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)

async def load_model_async(path: str):
    loop = asyncio.get_event_loop()
    # Run blocking joblib.load in thread pool
    model = await loop.run_in_executor(executor, joblib.load, path)
    return model

async def load_multiple_models(paths: dict):
    tasks = {name: load_model_async(p) for name, p in paths.items()}
    results = await asyncio.gather(*tasks.values())
    return dict(zip(tasks.keys(), results))

# Usage in lifespan:
# models = await load_multiple_models({"v1": "m1.pkl", "v2": "m2.pkl"})
"""
    print("Ex39 — Async Model Loading:")
    print(code)

def ex40():
    """Concurrent request handling concept"""
    code = """
# Concurrency model for FastAPI ML serving:
#
# ┌─────────────────────────────────────────┐
# │  Gunicorn (process manager)             │
# │   ├── Worker 1 (Uvicorn event loop)     │
# │   │     ├── Req A → async endpoint      │
# │   │     ├── Req B → async endpoint      │
# │   │     └── Req C → ThreadPoolExec      │
# │   ├── Worker 2 ...                      │
# │   └── Worker N ...                      │
# └─────────────────────────────────────────┘
#
# Key insight: sklearn models are NOT async-safe
# Wrap predict() in run_in_executor to avoid blocking
# Use semaphore to cap concurrent model calls:

import asyncio

MAX_CONCURRENT = 8
semaphore = asyncio.Semaphore(MAX_CONCURRENT)

async def safe_predict(features):
    async with semaphore:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, model.predict, [features])
"""
    print("Ex40 — Concurrent Request Handling Concept:")
    print(code)

def ex41():
    """Connection pooling"""
    code = """
# Connection pooling for ML API dependencies

# 1. Database pool (for feature store lookups)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@db/features",
    pool_size=10, max_overflow=20, pool_timeout=30
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession)

# 2. Redis pool (for caching predictions)
import aioredis
redis_pool = aioredis.ConnectionPool.from_url("redis://localhost:6379", max_connections=20)

# 3. HTTP client pool (for calling downstream services)
import httpx
http_client = httpx.AsyncClient(limits=httpx.Limits(max_connections=50))

# Dependency injection pattern:
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
"""
    print("Ex41 — Connection Pooling:")
    print(code)

def ex42():
    """Gunicorn + Uvicorn config"""
    code = """
# gunicorn.conf.py
import multiprocessing

# Workers: 2 * CPU_cores + 1 (for I/O-bound)
# For CPU-bound ML: use CPU_count workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:8000"
timeout = 120        # seconds before worker killed
keepalive = 5        # seconds to keep idle connection
graceful_timeout = 30
max_requests = 1000  # restart worker after N requests (memory leak guard)
max_requests_jitter = 100

# Logging
accesslog = "-"
errorlog  = "-"
loglevel  = "info"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s %(D)sµs'

# Start command:
# gunicorn app:app -c gunicorn.conf.py
"""
    print("Ex42 — Gunicorn + Uvicorn Config:")
    print(code)

def ex43():
    """Docker + FastAPI pattern"""
    code = """
# Dockerfile for FastAPI + ML model

FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model artifact
COPY models/model.pkl models/model.pkl

# Copy application code
COPY app/ app/

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker",
     "--workers", "4", "--bind", "0.0.0.0:8000"]
"""
    print("Ex43 — Docker + FastAPI Pattern:")
    print(code)

def ex44():
    """Kubernetes readiness probe"""
    code = """
# k8s deployment snippet for ML API

# In FastAPI:
@app.get("/health/live")   # liveness  — is the process alive?
def liveness():
    return {"status": "alive"}

@app.get("/health/ready")  # readiness — is the model loaded and ready?
def readiness():
    if not hasattr(app.state, "model") or app.state.model is None:
        raise HTTPException(503, "Model not loaded")
    return {"status": "ready"}

# kubernetes yaml:
# livenessProbe:
#   httpGet: { path: /health/live, port: 8000 }
#   initialDelaySeconds: 10
#   periodSeconds: 30
# readinessProbe:
#   httpGet: { path: /health/ready, port: 8000 }
#   initialDelaySeconds: 15
#   periodSeconds: 10
#   failureThreshold: 3
"""
    print("Ex44 — Kubernetes Readiness Probe:")
    print(code)

def ex45():
    """Circuit breaker in FastAPI"""
    code = """
import time

class CircuitBreaker:
    def __init__(self, failure_threshold=5, reset_timeout=60):
        self.failures = 0
        self.threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.state = "CLOSED"   # CLOSED | OPEN | HALF_OPEN
        self.last_failure_time = None

    def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "HALF_OPEN"
            else:
                raise RuntimeError("Circuit OPEN — fast fail")
        try:
            result = func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"; self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.threshold:
                self.state = "OPEN"
            raise

breaker = CircuitBreaker()
"""
    print("Ex45 — Circuit Breaker in FastAPI:")
    print(code)

def ex46():
    """Distributed tracing concept"""
    code = """
# Distributed tracing with OpenTelemetry in FastAPI

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="http://jaeger:4317"))
)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("ml-api")

FastAPIInstrumentor.instrument_app(app)  # auto-instrument all routes

# Manual span in prediction:
@app.post("/predict")
def predict(req: PredictRequest):
    with tracer.start_as_current_span("model.predict") as span:
        span.set_attribute("model.version", "1.2")
        pred = model.predict([[req.age, req.income]])[0]
        span.set_attribute("prediction", int(pred))
        return {"prediction": int(pred)}
"""
    print("Ex46 — Distributed Tracing Concept:")
    print(code)

def ex47():
    """gRPC alternative concept"""
    code = """
# gRPC for high-throughput ML serving

# prediction.proto:
# syntax = "proto3";
# service PredictionService {
#   rpc Predict(PredictRequest) returns (PredictResponse);
#   rpc BatchPredict(BatchRequest) returns (BatchResponse);
# }
# message PredictRequest { float age = 1; float income = 2; }
# message PredictResponse { int32 prediction = 1; float prob = 2; }

# Python gRPC server:
import grpc
# class PredictionServicer(prediction_pb2_grpc.PredictionServiceServicer):
#     def Predict(self, request, context):
#         pred = model.predict([[request.age, request.income]])[0]
#         return prediction_pb2.PredictResponse(prediction=int(pred))
#
# server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
# server.add_insecure_port('[::]:50051')
# server.start()

# gRPC advantages over REST:
# - Binary protocol (protobuf) → 3-10x smaller payloads
# - Streaming support (bidirectional)
# - Strong typed contracts
# - ~2x lower latency vs JSON/HTTP
"""
    print("Ex47 — gRPC Alternative Concept:")
    print(code)

def ex48():
    """GraphQL for ML concept"""
    code = """
# GraphQL for flexible ML API queries using Strawberry

import strawberry
from strawberry.fastapi import GraphQLRouter

@strawberry.type
class Prediction:
    prediction: int
    probability: float
    model_version: str

@strawberry.input
class PredictInput:
    age: float
    income: float
    credit_score: int

@strawberry.type
class Query:
    @strawberry.field
    def predict(self, data: PredictInput) -> Prediction:
        pred = model.predict([[data.age, data.income, data.credit_score]])[0]
        prob = model.predict_proba([[data.age, data.income, data.credit_score]])[0].max()
        return Prediction(prediction=int(pred), probability=float(prob), model_version="1.2")

schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")
"""
    print("Ex48 — GraphQL for ML Concept:")
    print(code)

def ex49():
    """WebSocket for streaming predictions"""
    code = """
from fastapi import WebSocket, WebSocketDisconnect
import json, asyncio

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive features as JSON
            data = await websocket.receive_text()
            request = json.loads(data)
            features = [request["age"], request["income"], request["credit_score"]]
            pred = model.predict([features])[0]
            prob = model.predict_proba([features])[0].max()
            await websocket.send_json({
                "prediction": int(pred),
                "probability": round(float(prob), 4)
            })
    except WebSocketDisconnect:
        print("Client disconnected")

# Client:
# import websockets, asyncio, json
# async with websockets.connect("ws://localhost:8000/ws/predict") as ws:
#     await ws.send(json.dumps({"age": 35, "income": 75000, "credit_score": 720}))
#     print(await ws.recv())
"""
    print("Ex49 — WebSocket for Streaming Predictions:")
    print(code)

def ex50():
    """Production FastAPI architecture"""
    code = """
# Production ML API Architecture
#
# ┌──────────────────────────────────────────────────────┐
# │  Client / Frontend                                   │
# └───────────────────┬──────────────────────────────────┘
#                     │ HTTPS
# ┌───────────────────▼──────────────────────────────────┐
# │  Load Balancer (nginx / AWS ALB)                     │
# └───┬───────────────┬──────────────────────────────────┘
#     │               │
# ┌───▼───┐       ┌───▼───┐   FastAPI Pods (k8s)
# │ Pod 1 │       │ Pod N │   each: Gunicorn + 4 Uvicorn workers
# └───┬───┘       └───┬───┘
#     └──────┬─────────┘
#            │
# ┌──────────▼───────────────────────────────────────────┐
# │  Shared Services                                     │
# │  ├── Redis (cache + rate limiting)                   │
# │  ├── PostgreSQL (feature store + prediction logs)    │
# │  ├── MLflow (model registry)                         │
# │  ├── Prometheus + Grafana (monitoring)               │
# │  └── Jaeger (distributed tracing)                    │
# └──────────────────────────────────────────────────────┘
#
# Deployment: ArgoCD / GitOps → k8s HPA auto-scales on CPU/RPS
"""
    print("Ex50 — Production FastAPI Architecture:")
    print(code)


def main():
    print("=" * 60)
    print("Examples 4.1 — FastAPI Model Serving")
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
