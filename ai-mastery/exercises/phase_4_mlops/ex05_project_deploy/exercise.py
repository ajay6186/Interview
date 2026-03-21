# ============================================================
# Exercise 4.5 — Project: Deploy ML Model End-to-End
# ============================================================
# Topics:
#   • Train and save a model with joblib
#   • FastAPI app for inference (request/response schemas)
#   • Health endpoint and batch prediction endpoint
#   • Pydantic schemas for validation
#   • Model versioning strategy
#   • Dockerfile for the API service
#   • CI/CD pipeline concept (GitHub Actions)
#   • Blue-green deployment strategy
#   • Production readiness checklist
# ============================================================

import os
import joblib
import numpy as np
from sklearn.datasets import load_iris
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


# ---------------------------------------------------------------------------
# TODO 1: Train a GradientBoosting classifier on the Iris dataset
# Wrap it in a sklearn Pipeline (StandardScaler + GradientBoostingClassifier)
# Save the model to model_dir/model_v{version}.pkl using joblib
# Also save metadata to model_dir/model_v{version}_meta.json
# Return the path of the saved model file
# ---------------------------------------------------------------------------
def train_and_save_model(
    model_dir: str = "./models",
    version: str = "1.0.0",
) -> str:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 2: Write the Pydantic request schema as a string (FastAPI app code)
# Fields: features (list[float]), model_version (str, optional, default "latest")
# Include a validator: exactly 4 features required
# ---------------------------------------------------------------------------
def pydantic_request_schema() -> str:
    pass  # TODO: return Python class definition as string


# ---------------------------------------------------------------------------
# TODO 3: Write the Pydantic response schema as a string
# Fields: prediction (int), class_name (str), confidence (float),
#         model_version (str), latency_ms (float)
# ---------------------------------------------------------------------------
def pydantic_response_schema() -> str:
    pass  # TODO: return Python class definition as string


# ---------------------------------------------------------------------------
# TODO 4: Write the FastAPI health endpoint as a string
# GET /health → returns: status, model_loaded, model_version, uptime_seconds
# ---------------------------------------------------------------------------
def health_endpoint_code() -> str:
    pass  # TODO: return the endpoint function code as a string


# ---------------------------------------------------------------------------
# TODO 5: Write the FastAPI /predict endpoint as a string
# POST /predict → accepts PredictRequest, returns PredictResponse
# Include latency measurement, error handling
# ---------------------------------------------------------------------------
def predict_endpoint_code() -> str:
    pass  # TODO: return the endpoint function code as a string


# ---------------------------------------------------------------------------
# TODO 6: Write the FastAPI /predict/batch endpoint as a string
# POST /predict/batch → accepts list[PredictRequest], returns list[PredictResponse]
# Process all inputs as a single numpy array for efficiency
# ---------------------------------------------------------------------------
def batch_predict_endpoint_code() -> str:
    pass  # TODO: return the batch endpoint function code as a string


# ---------------------------------------------------------------------------
# TODO 7: Write a complete Dockerfile for the ML API
# Include: base image, non-root user, health check, multi-worker uvicorn CMD
# ---------------------------------------------------------------------------
def api_dockerfile() -> str:
    pass  # TODO: return Dockerfile content as a string


# ---------------------------------------------------------------------------
# TODO 8: Write a model versioning strategy explanation
# Return a dict with keys:
#   "strategy": name (e.g., "semantic versioning + git SHA")
#   "directory_structure": how model files are organized
#   "promotion_flow": how a model moves from dev to prod
#   "rollback": how to roll back to a previous version
# ---------------------------------------------------------------------------
def model_versioning_strategy() -> dict:
    pass  # TODO: return explanation dict


# ---------------------------------------------------------------------------
# TODO 9: Write a GitHub Actions CI/CD pipeline YAML for the ML API
# Steps: checkout, setup python, install deps, run tests, build docker image,
#        push to registry, deploy (kubectl rollout or docker compose pull+up)
# ---------------------------------------------------------------------------
def cicd_pipeline_yaml() -> str:
    pass  # TODO: return .github/workflows/deploy.yml content as a string


# ---------------------------------------------------------------------------
# TODO 10: Explain the blue-green deployment strategy for ML APIs
# Return a dict with keys: "description", "steps", "benefits", "risks",
#   "traffic_switch_command" (example kubectl or nginx command)
# ---------------------------------------------------------------------------
def blue_green_deployment() -> dict:
    pass  # TODO: return blue-green explanation dict


# ---------------------------------------------------------------------------
# TODO 11: Write a production readiness checklist
# Return a list of dicts: [{"category": str, "item": str, "done": bool}]
# Categories: security, observability, reliability, performance, data
# At least 15 items total
# ---------------------------------------------------------------------------
def production_checklist() -> list:
    pass  # TODO: return checklist list of dicts


# ---------------------------------------------------------------------------
# TODO 12: Write the complete FastAPI app as a single string
# Combine all pieces: imports, app creation, schemas, endpoints, startup event
# Should be importable/runnable with uvicorn
# ---------------------------------------------------------------------------
def full_fastapi_app_code() -> str:
    pass  # TODO: return the complete app.py content as a string


def main():
    print("=== Exercise 4.5: Deploy ML Model End-to-End ===\n")
    print("TODOs to implement:\n")
    todos = [
        ("TODO 1",  "train_and_save_model()       — Train GBT, save .pkl + meta.json"),
        ("TODO 2",  "pydantic_request_schema()    — PredictRequest with validator"),
        ("TODO 3",  "pydantic_response_schema()   — PredictResponse with latency field"),
        ("TODO 4",  "health_endpoint_code()       — GET /health endpoint"),
        ("TODO 5",  "predict_endpoint_code()      — POST /predict endpoint"),
        ("TODO 6",  "batch_predict_endpoint_code()— POST /predict/batch endpoint"),
        ("TODO 7",  "api_dockerfile()             — Production Dockerfile"),
        ("TODO 8",  "model_versioning_strategy()  — Versioning approach dict"),
        ("TODO 9",  "cicd_pipeline_yaml()         — GitHub Actions deploy.yml"),
        ("TODO 10", "blue_green_deployment()      — Blue-green strategy dict"),
        ("TODO 11", "production_checklist()       — 15+ item prod readiness checklist"),
        ("TODO 12", "full_fastapi_app_code()      — Complete app.py as string"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("End-to-end deployment pipeline:")
    print("  1. Train model  → save to ./models/model_v1.0.0.pkl")
    print("  2. Build API    → FastAPI + Pydantic schemas")
    print("  3. Containerize → docker build -t ml-api:v1.0.0 .")
    print("  4. Test         → curl /health && curl /predict")
    print("  5. Deploy       → docker push; kubectl apply or docker compose up")
    print("  6. Monitor      → health checks, latency, drift detection")


if __name__ == "__main__":
    main()
