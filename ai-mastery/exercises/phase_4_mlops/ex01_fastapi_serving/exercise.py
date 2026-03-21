# ============================================================
# Exercise 4.1 — FastAPI Model Serving
# ============================================================
#
# pip install fastapi uvicorn scikit-learn joblib pydantic
#
# Run with: uvicorn exercise:app --reload
# Or run main() to see structure descriptions.

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional
import joblib
import numpy as np
import logging
import time

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# TODO 1: Create a FastAPI app instance
# ---------------------------------------------------------------------------
# app = FastAPI(title="...", version="...", description="...")
app = None  # replace with FastAPI(...)


# ---------------------------------------------------------------------------
# TODO 2: Define a Pydantic request model
# features: list[float] — the input feature vector
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    features: list  # TODO: type as list[float]
    # Hint: add a validator to check feature count


# ---------------------------------------------------------------------------
# TODO 3: Define a Pydantic response model
# prediction: float, confidence: float
# ---------------------------------------------------------------------------
class PredictResponse(BaseModel):
    pass  # TODO: add prediction: float and confidence: float fields


# ---------------------------------------------------------------------------
# TODO 6: Load a saved sklearn model at startup
# Use joblib.load("model.pkl") inside a try/except
# ---------------------------------------------------------------------------
model = None  # TODO: load model here or in startup event


# ---------------------------------------------------------------------------
# TODO 4: Create a GET / health check endpoint
# Returns: {"status": "healthy", "model_loaded": bool}
# ---------------------------------------------------------------------------
# @app.get("/")
# def health_check():
#     pass


# ---------------------------------------------------------------------------
# TODO 5: Create a POST /predict endpoint
# Accepts PredictRequest, returns PredictResponse
# ---------------------------------------------------------------------------
# @app.post("/predict", response_model=PredictResponse)
# def predict(request: PredictRequest):
#     pass


# ---------------------------------------------------------------------------
# TODO 7: Run inference inside the /predict endpoint
# Use model.predict() and model.predict_proba() for confidence
# ---------------------------------------------------------------------------
# (implement inside the predict function above)


# ---------------------------------------------------------------------------
# TODO 8: Add input validation — check feature count matches model expectation
# Raise HTTPException(status_code=422, detail="...") if wrong count
# ---------------------------------------------------------------------------
EXPECTED_FEATURES = 4  # e.g. iris dataset


# ---------------------------------------------------------------------------
# TODO 9: Add error handling with HTTPException
# Wrap model inference in try/except, raise HTTP 500 on failure
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# TODO 10: Add request logging middleware
# Log method, path, and processing time for every request
# ---------------------------------------------------------------------------
# @app.middleware("http")
# async def log_requests(request: Request, call_next):
#     pass


# ---------------------------------------------------------------------------
# TODO 11: Add CORS middleware
# Allow all origins for development
# ---------------------------------------------------------------------------
# app.add_middleware(CORSMiddleware, ...)


# ---------------------------------------------------------------------------
# TODO 12: Create a GET /model/info endpoint
# Return: model type, feature count, version, last trained date
# ---------------------------------------------------------------------------
# @app.get("/model/info")
# def model_info():
#     pass


# ---------------------------------------------------------------------------
# TODO 13: Create a POST /predict/batch endpoint
# Accepts list of PredictRequest, returns list of PredictResponse
# ---------------------------------------------------------------------------
class BatchPredictRequest(BaseModel):
    inputs: list  # TODO: type as list[PredictRequest]


# @app.post("/predict/batch")
# def predict_batch(batch: BatchPredictRequest):
#     pass


# ---------------------------------------------------------------------------
# TODO 14: Add API key authentication
# Read x-api-key header, reject with 401 if missing or wrong
# ---------------------------------------------------------------------------
API_KEY = "secret-key-123"

# Hint: use Header(None) as a dependency parameter
# def verify_api_key(x_api_key: Optional[str] = Header(None)):
#     if x_api_key != API_KEY:
#         raise HTTPException(status_code=401, detail="Invalid API key")


# ---------------------------------------------------------------------------
# TODO 15: Write startup and shutdown event handlers
# Startup: load model, log "ready"
# Shutdown: log "shutting down"
# ---------------------------------------------------------------------------
# @app.on_event("startup")
# async def startup_event():
#     pass

# @app.on_event("shutdown")
# async def shutdown_event():
#     pass


# ---------------------------------------------------------------------------
# main — describe the API structure (no server started here)
# ---------------------------------------------------------------------------
def main():
    print("=== 4.1 FastAPI Model Serving ===")
    print()
    print("Endpoints to implement:")
    endpoints = [
        ("GET",  "/",               "Health check"),
        ("GET",  "/model/info",     "Model metadata"),
        ("POST", "/predict",        "Single prediction"),
        ("POST", "/predict/batch",  "Batch predictions"),
    ]
    for method, path, desc in endpoints:
        print(f"  {method:<6} {path:<20} — {desc}")

    print()
    print("Middleware to add:")
    print("  - Request logging (timing)")
    print("  - CORS (allow all origins in dev)")

    print()
    print("Auth:")
    print("  - x-api-key header check on /predict routes")

    print()
    print("To run the server:")
    print("  uvicorn exercise:app --reload --port 8000")
    print()
    print("TODO 1  : app = FastAPI(...)")
    print("TODO 2  : PredictRequest with features: list[float]")
    print("TODO 3  : PredictResponse with prediction + confidence")
    print("TODO 4  : GET / -> health check")
    print("TODO 5  : POST /predict -> PredictResponse")
    print("TODO 6  : joblib.load model on startup")
    print("TODO 7  : model.predict + predict_proba")
    print("TODO 8  : validate feature count == EXPECTED_FEATURES")
    print("TODO 9  : try/except around inference, raise HTTP 500")
    print("TODO 10 : @app.middleware('http') logging")
    print("TODO 11 : CORSMiddleware")
    print("TODO 12 : GET /model/info")
    print("TODO 13 : POST /predict/batch")
    print("TODO 14 : x-api-key header auth")
    print("TODO 15 : startup/shutdown events")


if __name__ == "__main__":
    main()
