# ============================================================
# Solution 4.1 — FastAPI Model Serving
# ============================================================
#
# pip install fastapi uvicorn scikit-learn joblib pydantic
#
# Run with: uvicorn solution:app --reload
# Or: python solution.py  (trains model, then describes API)

from fastapi import FastAPI, HTTPException, Header, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional, List
import joblib
import numpy as np
import logging
import time
import os
import json
from datetime import datetime

# ---------------------------------------------------------------------------
# Train and save a sample model (Iris classifier) so the app has something
# to load.  We write it next to this file.
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
MODEL_META_PATH = os.path.join(os.path.dirname(__file__), "model_meta.json")

def train_and_save_model():
    from sklearn.datasets import load_iris
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler

    iris = load_iris()
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    RandomForestClassifier(n_estimators=100, random_state=42)),
    ])
    pipeline.fit(iris.data, iris.target)
    joblib.dump(pipeline, MODEL_PATH)

    meta = {
        "model_type":      "RandomForestClassifier",
        "n_features":      iris.data.shape[1],
        "n_classes":       len(iris.target_names),
        "classes":         list(iris.target_names),
        "version":         "1.0.0",
        "trained_at":      datetime.utcnow().isoformat(),
        "train_samples":   iris.data.shape[0],
    }
    with open(MODEL_META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    return meta

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger("api")

# ---------------------------------------------------------------------------
# SOLUTION 1: FastAPI app instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ML Model Serving API",
    version="1.0.0",
    description="Serves a trained sklearn model over HTTP.",
)

# ---------------------------------------------------------------------------
# SOLUTION 11: CORS middleware (add before routes)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# SOLUTION 10: Request logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d  (%.1f ms)",
        request.method, request.url.path, response.status_code, elapsed,
    )
    return response

# ---------------------------------------------------------------------------
# SOLUTION 2: Pydantic request model
# ---------------------------------------------------------------------------
EXPECTED_FEATURES = 4  # iris dataset

class PredictRequest(BaseModel):
    features: List[float]

    @validator("features")
    def check_feature_count(cls, v):
        if len(v) != EXPECTED_FEATURES:
            raise ValueError(
                f"Expected {EXPECTED_FEATURES} features, got {len(v)}"
            )
        return v

# ---------------------------------------------------------------------------
# SOLUTION 3: Pydantic response model
# ---------------------------------------------------------------------------
class PredictResponse(BaseModel):
    prediction:  float
    confidence:  float
    class_name:  str

class BatchPredictRequest(BaseModel):
    inputs: List[PredictRequest]

# ---------------------------------------------------------------------------
# SOLUTION 6: Load model (module-level so it's available immediately)
# ---------------------------------------------------------------------------
model = None
model_meta: dict = {}

def load_model():
    global model, model_meta
    if not os.path.exists(MODEL_PATH):
        logger.info("No saved model found — training a sample model...")
        model_meta = train_and_save_model()
    else:
        with open(MODEL_META_PATH) as f:
            model_meta = json.load(f)
    try:
        model = joblib.load(MODEL_PATH)
        logger.info("Model loaded: %s", model_meta.get("model_type"))
    except Exception as e:
        logger.error("Failed to load model: %s", e)
        model = None

# ---------------------------------------------------------------------------
# SOLUTION 15: Startup / shutdown events
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    load_model()
    logger.info("API is ready.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("API is shutting down.")

# ---------------------------------------------------------------------------
# SOLUTION 14: API key auth dependency
# ---------------------------------------------------------------------------
API_KEY = os.environ.get("API_KEY", "secret-key-123")

def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")

# ---------------------------------------------------------------------------
# SOLUTION 4: GET / health check
# ---------------------------------------------------------------------------
@app.get("/")
def health_check():
    return {
        "status":       "healthy",
        "model_loaded": model is not None,
        "timestamp":    datetime.utcnow().isoformat(),
    }

# ---------------------------------------------------------------------------
# SOLUTION 12: GET /model/info
# ---------------------------------------------------------------------------
@app.get("/model/info")
def model_info():
    if not model_meta:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    return model_meta

# ---------------------------------------------------------------------------
# SOLUTION 5 + 7 + 8 + 9: POST /predict
# ---------------------------------------------------------------------------
@app.post("/predict", response_model=PredictResponse,
          dependencies=[Depends(verify_api_key)])
def predict(request: PredictRequest):
    # SOLUTION 8: feature count is validated by the Pydantic validator above.
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    # SOLUTION 7 + 9: inference with error handling
    try:
        X = np.array(request.features).reshape(1, -1)
        pred_class   = int(model.predict(X)[0])
        probabilities = model.predict_proba(X)[0]
        confidence   = float(probabilities[pred_class])
        class_name   = model_meta.get("classes", [])[pred_class] \
                       if model_meta.get("classes") else str(pred_class)
    except Exception as e:
        logger.exception("Inference error")
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    return PredictResponse(
        prediction=float(pred_class),
        confidence=confidence,
        class_name=class_name,
    )

# ---------------------------------------------------------------------------
# SOLUTION 13: POST /predict/batch
# ---------------------------------------------------------------------------
@app.post("/predict/batch", dependencies=[Depends(verify_api_key)])
def predict_batch(batch: BatchPredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    results = []
    try:
        X = np.array([r.features for r in batch.inputs])
        pred_classes  = model.predict(X).tolist()
        probabilities = model.predict_proba(X)
        classes       = model_meta.get("classes", [])
        for i, pred_class in enumerate(pred_classes):
            confidence = float(probabilities[i][pred_class])
            class_name = classes[pred_class] if classes else str(pred_class)
            results.append({
                "prediction":  float(pred_class),
                "confidence":  confidence,
                "class_name":  class_name,
            })
    except Exception as e:
        logger.exception("Batch inference error")
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {e}")

    return {"predictions": results, "count": len(results)}


# ---------------------------------------------------------------------------
# main — train the model and print a usage summary
# ---------------------------------------------------------------------------
def main():
    print("=== 4.1 FastAPI Model Serving (Solution) ===")
    print()

    # Ensure the model is trained and saved
    if not os.path.exists(MODEL_PATH):
        print("Training sample Iris model...")
        meta = train_and_save_model()
        print(f"  Saved model to: {MODEL_PATH}")
        print(f"  Model type:     {meta['model_type']}")
        print(f"  Features:       {meta['n_features']}")
        print(f"  Classes:        {meta['classes']}")
    else:
        print(f"Model already exists at: {MODEL_PATH}")

    print()
    print("Implemented endpoints:")
    rows = [
        ("GET",  "/",               "Health check — returns model_loaded status"),
        ("GET",  "/model/info",     "Model metadata (type, features, version)"),
        ("POST", "/predict",        "Single prediction (requires x-api-key header)"),
        ("POST", "/predict/batch",  "Batch predictions (requires x-api-key header)"),
    ]
    for method, path, desc in rows:
        print(f"  {method:<6} {path:<20} — {desc}")

    print()
    print("Middleware:")
    print("  - HTTP request logger  (method, path, status, ms)")
    print("  - CORS                 (allow all origins)")

    print()
    print("Auth:")
    print(f"  API_KEY = '{API_KEY}'  (override via API_KEY env var)")
    print("  Pass as:  x-api-key: <key>  header")

    print()
    print("Quick test (server must be running):")
    print('  curl http://localhost:8000/')
    print('  curl -X POST http://localhost:8000/predict \\')
    print('       -H "x-api-key: secret-key-123" \\')
    print('       -H "Content-Type: application/json" \\')
    print('       -d \'{"features": [5.1, 3.5, 1.4, 0.2]}\'')

    print()
    print("To start the server:")
    print("  uvicorn solution:app --reload --port 8000")


if __name__ == "__main__":
    main()
