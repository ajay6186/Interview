# ============================================================
# Examples 4.2 — Docker for ML (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Dockerfile basics"""
    content = """
# Dockerfile — a text file with instructions to build a Docker image
# Each instruction creates a new read-only layer in the image
# Layers are cached: unchanged layers are reused on rebuild

# Basic structure:
# FROM   — base image
# WORKDIR — set working directory
# COPY   — copy files into image
# RUN    — execute shell command during build
# ENV    — set environment variable
# EXPOSE — declare port (documentation only)
# CMD    — default command to run container
"""
    print("Ex01 — Dockerfile Basics:")
    print(content)

def ex02():
    """FROM instruction"""
    content = """
# FROM sets the base image — always the first instruction

FROM python:3.11-slim          # Official Python, Debian slim (~130MB)
FROM python:3.11-alpine        # Alpine Linux (~50MB, but may have issues)
FROM ubuntu:22.04              # Full Ubuntu (~70MB base)
FROM nvidia/cuda:12.1-runtime-ubuntu22.04  # GPU support

# Multi-stage: use a build stage name
FROM python:3.11 AS builder

# Best practice for ML:
# Use python:3.11-slim — good balance of size and compatibility
# Avoid alpine for numpy/pandas (compiling C extensions is complex)
"""
    print("Ex02 — FROM Instruction:")
    print(content)

def ex03():
    """WORKDIR instruction"""
    content = """
# WORKDIR sets the working directory for subsequent instructions
# Created automatically if it doesn't exist

FROM python:3.11-slim

WORKDIR /app          # All following commands run in /app

# Without WORKDIR, files land in / (root) — messy and insecure
# WORKDIR also affects CMD and ENTRYPOINT

# Multiple WORKDIRs are valid (relative paths stack):
WORKDIR /app
WORKDIR src           # → /app/src
WORKDIR ..            # → /app
"""
    print("Ex03 — WORKDIR Instruction:")
    print(content)

def ex04():
    """COPY files"""
    content = """
FROM python:3.11-slim
WORKDIR /app

# COPY <src> <dest>
# src is relative to build context (your local directory)
# dest is inside the container

COPY requirements.txt .               # copy single file
COPY models/model.pkl models/          # copy to subdirectory
COPY app/ app/                         # copy entire directory
COPY . .                               # copy everything (avoid — use .dockerignore)

# ADD vs COPY:
# COPY — simple file copy (preferred)
# ADD  — also handles URLs and auto-extracts .tar.gz (use only when needed)
"""
    print("Ex04 — COPY Files:")
    print(content)

def ex05():
    """RUN pip install"""
    content = """
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .

# RUN executes during image BUILD (not runtime)
# --no-cache-dir: don't store pip cache (saves space)
# --upgrade pip: ensure latest pip
RUN pip install --upgrade pip && \\
    pip install --no-cache-dir -r requirements.txt

# Install specific packages inline:
RUN pip install --no-cache-dir \\
    fastapi==0.110.0 \\
    uvicorn[standard]==0.29.0 \\
    scikit-learn==1.4.0 \\
    numpy==1.26.4 \\
    joblib==1.3.2

# Chain commands with && to reduce layer count
"""
    print("Ex05 — RUN pip install:")
    print(content)

def ex06():
    """ENV variables"""
    content = """
FROM python:3.11-slim
WORKDIR /app

# ENV sets environment variables available at build AND runtime
ENV PYTHONDONTWRITEBYTECODE=1    # no .pyc files
ENV PYTHONUNBUFFERED=1           # stdout/stderr not buffered (important for logs)
ENV MODEL_PATH=/app/models/model.pkl
ENV API_HOST=0.0.0.0
ENV API_PORT=8000
ENV LOG_LEVEL=info
ENV WORKERS=4

# Override at runtime:
# docker run -e LOG_LEVEL=debug -e WORKERS=2 my-image

# Access in Python:
# import os
# model_path = os.getenv("MODEL_PATH", "/app/models/model.pkl")
"""
    print("Ex06 — ENV Variables:")
    print(content)

def ex07():
    """EXPOSE port"""
    content = """
FROM python:3.11-slim
WORKDIR /app

ENV API_PORT=8000

# EXPOSE documents which port the container listens on
# It does NOT actually publish the port — that's done with -p on docker run
EXPOSE 8000

# To actually publish the port at runtime:
# docker run -p 8000:8000 my-image     # host:container
# docker run -p 80:8000 my-image       # map container 8000 → host 80
# docker run -P my-image               # auto-map all EXPOSEd ports

# Multiple ports:
EXPOSE 8000   # API
EXPOSE 8001   # metrics/prometheus
"""
    print("Ex07 — EXPOSE Port:")
    print(content)

def ex08():
    """CMD entrypoint"""
    content = """
FROM python:3.11-slim
WORKDIR /app

# CMD — default command when container starts
# Can be overridden by: docker run my-image <override-cmd>

# Exec form (preferred — no shell, signal handling works):
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Shell form (spawns /bin/sh -c):
# CMD uvicorn app.main:app --host 0.0.0.0 --port 8000

# Override at runtime:
# docker run my-image python train.py
# docker run my-image /bin/bash

# Only one CMD per Dockerfile (last one wins)
"""
    print("Ex08 — CMD Entrypoint:")
    print(content)

def ex09():
    """ENTRYPOINT vs CMD"""
    content = """
# ENTRYPOINT — fixed executable, cannot be overridden easily
# CMD         — default arguments, easily overridden

# Pattern 1: ENTRYPOINT only
ENTRYPOINT ["python", "app.py"]
# docker run my-image          → runs: python app.py
# docker run my-image --port 9000  → runs: python app.py --port 9000  ✓

# Pattern 2: ENTRYPOINT + CMD (best for ML APIs)
ENTRYPOINT ["uvicorn", "app.main:app"]
CMD ["--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
# docker run my-image                  → uses CMD defaults
# docker run my-image --workers 8      → overrides CMD

# Pattern 3: Shell script entrypoint
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["serve"]
# Useful for setup logic (wait for DB, set secrets, etc.)
"""
    print("Ex09 — ENTRYPOINT vs CMD:")
    print(content)

def ex10():
    """.dockerignore"""
    content = """
# .dockerignore — prevents files from being sent to Docker build context
# Analogous to .gitignore
# Smaller build context = faster builds

# .dockerignore file contents:
__pycache__/
*.pyc
*.pyo
.git/
.gitignore
.env
.env.*
*.env
venv/
.venv/
env/
.pytest_cache/
.coverage
htmlcov/
*.egg-info/
dist/
build/
docs/
tests/              # exclude test files from production image
notebooks/          # exclude Jupyter notebooks
*.ipynb
mlruns/             # MLflow runs (can be large)
data/raw/           # large data files
README.md
Makefile
"""
    print("Ex10 — .dockerignore:")
    print(content)

def ex11():
    """Build image command"""
    content = """
# docker build [OPTIONS] PATH
# PATH = build context (usually current directory)

# Basic build:
# docker build -t my-ml-api:1.0 .

# With specific Dockerfile:
# docker build -f Dockerfile.prod -t my-ml-api:prod .

# Build with build args (override ARG instructions):
# docker build --build-arg MODEL_VERSION=2.1 -t my-ml-api .

# No cache (force full rebuild):
# docker build --no-cache -t my-ml-api:latest .

# Multi-platform build (requires buildx):
# docker buildx build --platform linux/amd64,linux/arm64 -t my-ml-api .

# Tag with registry:
# docker build -t registry.company.com/ml/loan-api:v1.2.0 .

# Show build progress:
# docker build --progress=plain -t my-ml-api .
"""
    print("Ex11 — Build Image Command:")
    print(content)

def ex12():
    """Run container command"""
    content = """
# docker run [OPTIONS] IMAGE [COMMAND]

# Basic run:
# docker run my-ml-api:1.0

# Detached (background):
# docker run -d --name ml-api my-ml-api:1.0

# Port mapping:
# docker run -d -p 8000:8000 --name ml-api my-ml-api:1.0

# Environment variables:
# docker run -d -p 8000:8000 \\
#   -e LOG_LEVEL=debug \\
#   -e MODEL_VERSION=2 \\
#   my-ml-api:1.0

# Volume mount (for model artifacts):
# docker run -d -p 8000:8000 \\
#   -v $(pwd)/models:/app/models:ro \\
#   my-ml-api:1.0

# Resource limits:
# docker run -d --memory="2g" --cpus="2.0" my-ml-api:1.0

# Interactive shell:
# docker run -it my-ml-api:1.0 /bin/bash
"""
    print("Ex12 — Run Container Command:")
    print(content)

def ex13():
    """List containers"""
    content = """
# List running containers:
# docker ps

# List all containers (including stopped):
# docker ps -a

# Formatted output:
# docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"

# Filter by name:
# docker ps --filter "name=ml-api"

# List images:
# docker images
# docker images --filter "reference=my-ml-api"

# Inspect container details:
# docker inspect ml-api

# Container stats (live):
# docker stats ml-api

# Stop / remove:
# docker stop ml-api
# docker rm ml-api
# docker rm -f ml-api     (force-stop then remove)

# Remove all stopped containers:
# docker container prune
"""
    print("Ex13 — List Containers:")
    print(content)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Multi-stage build"""
    content = """
# Multi-stage: separate build environment from runtime image
# Result: much smaller final image (no build tools)

# Stage 1: builder
FROM python:3.11 AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: runtime (slim final image)
FROM python:3.11-slim AS runtime
WORKDIR /app

# Copy ONLY installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ app/
COPY models/ models/

RUN adduser --disabled-password appuser
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Result: ~200MB instead of ~1GB (no pip, no build caches)
"""
    print("Ex14 — Multi-Stage Build:")
    print(content)

def ex15():
    """requirements.txt copy pattern"""
    content = """
# Optimized layer caching: copy requirements BEFORE source code
# If requirements.txt unchanged → pip install layer is cached

FROM python:3.11-slim
WORKDIR /app

# Step 1: copy requirements first
COPY requirements.txt .

# Step 2: install — cached unless requirements.txt changes
RUN pip install --no-cache-dir -r requirements.txt

# Step 3: copy source code last (changes most often)
COPY app/ app/
COPY models/ models/

# requirements.txt for ML API:
# fastapi==0.110.0
# uvicorn[standard]==0.29.0
# scikit-learn==1.4.0
# numpy==1.26.4
# pandas==2.2.0
# joblib==1.3.2
# pydantic==2.5.3
# python-dotenv==1.0.0
"""
    print("Ex15 — requirements.txt Copy Pattern:")
    print(content)

def ex16():
    """Model file copy"""
    content = """
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model artifact — put AFTER pip install (changes independently)
COPY models/model_v2.pkl models/model.pkl

# Alternative: use ARG to parameterize model version
ARG MODEL_VERSION=v2
COPY models/model_${MODEL_VERSION}.pkl models/model.pkl

# Build with specific version:
# docker build --build-arg MODEL_VERSION=v3 -t ml-api:v3 .

COPY app/ app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Note: for large models, prefer volume mounts or cloud storage
# Baking model into image works well for models < 500MB
"""
    print("Ex16 — Model File Copy:")
    print(content)

def ex17():
    """Volume mount"""
    content = """
# Volumes persist data beyond container lifecycle
# Two types: named volumes (Docker-managed) and bind mounts (host path)

# Bind mount — share host directory:
# docker run -v /host/models:/app/models my-ml-api

# Named volume — Docker manages storage:
# docker volume create ml-models
# docker run -v ml-models:/app/models my-ml-api

# Read-only mount (model files shouldn't change at runtime):
# docker run -v $(pwd)/models:/app/models:ro my-ml-api

# Declare in Dockerfile (creates anonymous volume):
VOLUME ["/app/models", "/app/logs"]

# docker-compose volume:
# volumes:
#   - ./models:/app/models:ro
#   - logs_data:/app/logs

# Inspect volumes:
# docker volume ls
# docker volume inspect ml-models
"""
    print("Ex17 — Volume Mount:")
    print(content)

def ex18():
    """docker-compose basics"""
    content = """
# docker-compose.yml — define multi-container applications

version: "3.9"
services:
  ml-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=info
      - MODEL_PATH=/app/models/model.pkl
    volumes:
      - ./models:/app/models:ro
    restart: unless-stopped

# Commands:
# docker-compose up -d          # start all services detached
# docker-compose down           # stop and remove containers
# docker-compose logs -f ml-api # follow logs
# docker-compose ps             # list services
# docker-compose exec ml-api bash  # shell into running service
# docker-compose build          # rebuild images
"""
    print("Ex18 — docker-compose Basics:")
    print(content)

def ex19():
    """docker-compose for ML stack"""
    content = """
# docker-compose.yml — full ML serving stack

version: "3.9"
services:
  ml-api:
    build: .
    ports: ["8000:8000"]
    environment:
      REDIS_URL: redis://redis:6379/0
      DB_URL: postgresql://user:pass@postgres/mldb
    depends_on: [redis, postgres]
    deploy:
      replicas: 2
      resources:
        limits: {memory: 2G, cpus: "2.0"}

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mldb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes: [pg_data:/var/lib/postgresql/data]

volumes:
  redis_data:
  pg_data:
"""
    print("Ex19 — docker-compose for ML Stack:")
    print(content)

def ex20():
    """Environment variables from .env"""
    content = """
# .env file (never commit to git!)
# API_KEY=secret123
# MODEL_PATH=/app/models/model.pkl
# DB_PASSWORD=dbpass
# LOG_LEVEL=info

# docker run with .env file:
# docker run --env-file .env my-ml-api

# docker-compose auto-loads .env in same directory:
version: "3.9"
services:
  ml-api:
    image: my-ml-api
    env_file:
      - .env
      - .env.local    # local overrides
    environment:
      # Can still override individual vars:
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - WORKERS=${WORKERS:-4}

# In Python:
# from dotenv import load_dotenv
# import os
# load_dotenv()
# api_key = os.getenv("API_KEY")
"""
    print("Ex20 — Environment Variables from .env:")
    print(content)

def ex21():
    """Health check in Dockerfile"""
    content = """
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# HEALTHCHECK — Docker polls this to determine container health
HEALTHCHECK --interval=30s \\
            --timeout=10s  \\
            --start-period=20s \\
            --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# --interval: how often to check (30s)
# --timeout: time before check considered failed (10s)
# --start-period: grace period before first check (model loading time)
# --retries: consecutive failures to mark unhealthy (3)

# Check health:
# docker inspect --format='{{.State.Health.Status}}' my-container

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
    print("Ex21 — Health Check in Dockerfile:")
    print(content)

def ex22():
    """Resource limits"""
    content = """
# Limit container resources to prevent runaway processes

# Memory limit (container killed if exceeded):
# docker run --memory="2g" my-ml-api         # 2 GB
# docker run --memory="512m" my-ml-api       # 512 MB
# docker run --memory="2g" --memory-swap="2g" my-ml-api  # no swap

# CPU limits:
# docker run --cpus="2.0" my-ml-api          # max 2 CPU cores
# docker run --cpus="0.5" my-ml-api          # max 50% of 1 core
# docker run --cpu-shares=512 my-ml-api      # relative weight (default 1024)

# docker-compose resource limits:
# deploy:
#   resources:
#     limits:
#       memory: 4G
#       cpus: "4.0"
#     reservations:
#       memory: 2G
#       cpus: "2.0"

# Check runtime stats:
# docker stats my-ml-api
"""
    print("Ex22 — Resource Limits:")
    print(content)

def ex23():
    """Docker network"""
    content = """
# Docker networks enable container-to-container communication

# Network types:
# bridge  — default; containers on same bridge can communicate by name
# host    — share host network stack (fastest, no isolation)
# none    — no networking
# overlay — multi-host (swarm/k8s)

# Create custom bridge network:
# docker network create ml-network

# Run containers on same network:
# docker run -d --network ml-network --name redis redis:7-alpine
# docker run -d --network ml-network --name ml-api -e REDIS_URL=redis://redis:6379 my-ml-api

# In docker-compose, services auto-join a default network:
# ml-api can reach redis at hostname "redis"

# Inspect network:
# docker network inspect ml-network

# docker-compose custom network:
# networks:
#   ml-net:
#     driver: bridge
"""
    print("Ex23 — Docker Network:")
    print(content)

def ex24():
    """Linking containers"""
    content = """
# Modern way: use networks (--network flag)
# Legacy: --link (deprecated but still works)

# Network-based linking (recommended):
version: "3.9"
networks:
  ml-net:
    driver: bridge

services:
  ml-api:
    image: my-ml-api
    networks: [ml-net]
    environment:
      REDIS_HOST: redis       # use service name as hostname
      REDIS_PORT: 6379

  redis:
    image: redis:7-alpine
    networks: [ml-net]
    # No ports exposed to host — only accessible within ml-net

  postgres:
    image: postgres:15-alpine
    networks: [ml-net]
    environment:
      POSTGRES_DB: mldb

# ml-api connects to redis via: redis://redis:6379
# ml-api connects to DB via: postgresql://postgres/mldb
"""
    print("Ex24 — Linking Containers:")
    print(content)

def ex25():
    """Docker logs"""
    content = """
# View container logs (stdout + stderr)

# Follow live logs:
# docker logs -f my-ml-api

# Last N lines:
# docker logs --tail 100 my-ml-api

# With timestamps:
# docker logs -t my-ml-api

# Since specific time:
# docker logs --since "2025-01-01T00:00:00" my-ml-api

# docker-compose logs:
# docker-compose logs -f              # all services
# docker-compose logs -f ml-api       # specific service
# docker-compose logs --tail=50 ml-api

# Configure logging driver in docker-compose:
# logging:
#   driver: json-file
#   options:
#     max-size: "10m"
#     max-file: "3"

# For production: use fluentd, cloudwatch, or datadog logging driver
"""
    print("Ex25 — Docker Logs:")
    print(content)

def ex26():
    """Docker exec"""
    content = """
# docker exec — run a command inside a RUNNING container

# Open interactive bash shell:
# docker exec -it my-ml-api bash

# Run one-off command:
# docker exec my-ml-api python -c "import sklearn; print(sklearn.__version__)"

# Check model file exists:
# docker exec my-ml-api ls -la /app/models/

# Check environment:
# docker exec my-ml-api env | grep MODEL

# Tail log file inside container:
# docker exec -it my-ml-api tail -f /app/logs/api.log

# Trigger health check manually:
# docker exec my-ml-api curl -s http://localhost:8000/health

# Copy file from running container:
# docker cp my-ml-api:/app/models/model.pkl ./downloaded_model.pkl

# Copy file into running container:
# docker cp new_model.pkl my-ml-api:/app/models/model.pkl
"""
    print("Ex26 — Docker Exec:")
    print(content)

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Complete ML Dockerfile (Python + sklearn)"""
    content = """
# Dockerfile — sklearn classification API
# ===========================================

FROM python:3.11-slim AS builder
WORKDIR /build

RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- runtime stage ---
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    MODEL_PATH=/app/models/model.pkl \\
    API_PORT=8000

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy app and model
COPY models/model.pkl models/
COPY app/ app/

# Security: non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
"""
    print("Ex27 — Complete ML Dockerfile (Python + sklearn):")
    print(content)

def ex28():
    """Complete FastAPI + model Dockerfile"""
    content = """
# Dockerfile — production FastAPI ML API
# ========================================

ARG PYTHON_VERSION=3.11
ARG MODEL_VERSION=latest

FROM python:${PYTHON_VERSION}-slim AS base
ENV PIP_NO_CACHE_DIR=1 PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

# --- builder ---
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# --- runtime ---
FROM base AS runtime
COPY --from=builder /install /usr/local
WORKDIR /app

ARG MODEL_VERSION
COPY models/model_${MODEL_VERSION}.pkl models/model.pkl
COPY app/ app/
COPY alembic.ini .

RUN adduser --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8000 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \\
    CMD curl -sf http://localhost:8000/health || exit 1

ENTRYPOINT ["gunicorn", "app.main:app"]
CMD ["-k", "uvicorn.workers.UvicornWorker", "--workers", "4",
     "--bind", "0.0.0.0:8000", "--timeout", "120"]

LABEL maintainer="ml-team@company.com" \\
      version="${MODEL_VERSION}" \\
      description="Loan Approval ML API"
"""
    print("Ex28 — Complete FastAPI + Model Dockerfile:")
    print(content)

def ex29():
    """docker-compose: FastAPI + Redis + Postgres"""
    content = """
# docker-compose.yml — FastAPI + Redis + Postgres ML stack

version: "3.9"

services:
  ml-api:
    build:
      context: .
      args: { MODEL_VERSION: v2 }
    ports: ["8000:8000"]
    env_file: [.env]
    environment:
      REDIS_URL: redis://redis:6379/0
      DB_URL: postgresql://mluser:mlpass@postgres:5432/mldb
    depends_on:
      redis: { condition: service_healthy }
      postgres: { condition: service_healthy }
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 2G, cpus: "2.0" }

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s; timeout: 5s; retries: 3
    volumes: [redis_data:/data]

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mldb
      POSTGRES_USER: mluser
      POSTGRES_PASSWORD: mlpass
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mluser -d mldb"]
      interval: 10s; timeout: 5s; retries: 5
    volumes: [pg_data:/var/lib/postgresql/data]

volumes:
  redis_data:
  pg_data:
"""
    print("Ex29 — docker-compose: FastAPI + Redis + Postgres:")
    print(content)

def ex30():
    """Multi-service ML stack"""
    content = """
# docker-compose.yml — full ML platform stack

version: "3.9"
services:
  ml-api:
    build: ./api
    ports: ["8000:8000"]
    depends_on: [redis, postgres, mlflow]

  mlflow:
    image: ghcr.io/mlflow/mlflow:latest
    ports: ["5000:5000"]
    command: mlflow server --host 0.0.0.0 --backend-store-uri postgresql://mluser:mlpass@postgres/mlflowdb --default-artifact-root s3://my-bucket/mlflow
    depends_on: [postgres]

  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes: [./prometheus.yml:/etc/prometheus/prometheus.yml]

  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    depends_on: [prometheus]
    volumes: [grafana_data:/var/lib/grafana]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  postgres:
    image: postgres:15-alpine
    environment: {POSTGRES_PASSWORD: mlpass, POSTGRES_USER: mluser}

volumes:
  grafana_data:
"""
    print("Ex30 — Multi-Service ML Stack:")
    print(content)

def ex31():
    """CI/CD docker build script"""
    content = """
#!/bin/bash
# ci_build.sh — CI/CD Docker build + push script

set -euo pipefail

IMAGE_NAME="registry.company.com/ml/loan-api"
VERSION=$(git describe --tags --always --dirty)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Building $IMAGE_NAME:$VERSION"

# Build with BuildKit for better caching
DOCKER_BUILDKIT=1 docker build \\
  --build-arg MODEL_VERSION="${MODEL_VERSION:-latest}" \\
  --cache-from "$IMAGE_NAME:cache" \\
  --build-arg BUILDKIT_INLINE_CACHE=1 \\
  -t "$IMAGE_NAME:$VERSION" \\
  -t "$IMAGE_NAME:${BRANCH//\\//-}" \\
  .

# Tag as latest if on main branch
if [ "$BRANCH" = "main" ]; then
  docker tag "$IMAGE_NAME:$VERSION" "$IMAGE_NAME:latest"
fi

# Push all tags
docker push "$IMAGE_NAME:$VERSION"
docker push "$IMAGE_NAME:${BRANCH//\\//-}"
[ "$BRANCH" = "main" ] && docker push "$IMAGE_NAME:latest"

echo "Build complete: $IMAGE_NAME:$VERSION"
"""
    print("Ex31 — CI/CD Docker Build Script:")
    print(content)

def ex32():
    """Automated testing in Docker"""
    content = """
# Dockerfile.test — test stage in multi-stage build

FROM python:3.11-slim AS test
WORKDIR /app

COPY requirements.txt requirements-test.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-test.txt

COPY . .

# Run tests during build (fails build if tests fail):
RUN pytest tests/ -v --tb=short --junitxml=test-results.xml

# Or use as separate test target:
# docker build --target test -t ml-api:test .
# docker run --rm ml-api:test pytest tests/ -v

# docker-compose test service:
# test:
#   build:
#     context: .
#     target: test
#   command: pytest tests/ --cov=app --cov-report=term-missing
#   environment:
#     - TESTING=true
"""
    print("Ex32 — Automated Testing in Docker:")
    print(content)

def ex33():
    """Development vs production Dockerfile"""
    content = """
# Dockerfile with dev and prod targets

FROM python:3.11-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# --- development target ---
FROM base AS dev
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-dev.txt
# Mount source code as volume (hot reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# --- production target ---
FROM base AS prod
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY models/ models/
COPY app/ app/

RUN adduser --system --no-create-home appuser && chown -R appuser /app
USER appuser

CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "--workers", "4", "--bind", "0.0.0.0:8000"]

# Build commands:
# docker build --target dev -t ml-api:dev .
# docker build --target prod -t ml-api:prod .
"""
    print("Ex33 — Development vs Production Dockerfile:")
    print(content)

def ex34():
    """Model artifact management in Docker"""
    content = """
# Strategies for model artifacts in Docker:

# Strategy 1: Bake model into image (simple, <500MB models)
COPY models/model_v2.pkl /app/models/model.pkl
# Pro: self-contained, reproducible
# Con: large image, rebuild needed for model updates

# Strategy 2: Volume mount at runtime
# docker run -v /shared/models:/app/models my-api
# Pro: update model without rebuild
# Con: must manage files on host

# Strategy 3: Download from object storage at startup
# ENV MODEL_S3_URI=s3://my-bucket/models/model_v2.pkl
# In app startup: aws s3 cp $MODEL_S3_URI /app/models/model.pkl

# Strategy 4: MLflow model registry pull
# In startup: mlflow.sklearn.load_model("models:/LoanModel/Production")

# Strategy 5: Docker build with model URL
ARG MODEL_URL
RUN curl -o /app/models/model.pkl "${MODEL_URL}"
# docker build --build-arg MODEL_URL=https://storage/model.pkl .
"""
    print("Ex34 — Model Artifact Management in Docker:")
    print(content)

def ex35():
    """GPU Docker concept (nvidia-docker)"""
    content = """
# GPU-accelerated Docker with NVIDIA Container Toolkit

# Base image with CUDA:
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Install Python + PyTorch with CUDA:
RUN apt-get update && apt-get install -y python3.11 python3-pip
RUN pip install torch==2.2.0+cu121 -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install fastapi uvicorn

COPY app/ app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Run with GPU access:
# docker run --gpus all -p 8000:8000 ml-gpu-api
# docker run --gpus '"device=0"' -p 8000:8000 ml-gpu-api  # specific GPU

# docker-compose with GPU:
# deploy:
#   resources:
#     reservations:
#       devices:
#         - driver: nvidia
#           count: 1
#           capabilities: [gpu]

# Check GPU inside container:
# docker run --gpus all nvidia/cuda:12.1-base nvidia-smi
"""
    print("Ex35 — GPU Docker Concept (nvidia-docker):")
    print(content)

def ex36():
    """Docker layer caching optimization"""
    content = """
# Layer caching: each instruction = 1 layer
# Cache invalidated when instruction OR preceding layer changes
# Optimization: order from least-to-most frequently changing

# BAD order (requirements reinstalled on any code change):
COPY . .
RUN pip install -r requirements.txt   # cache miss every code change!

# GOOD order (requirements cached independently):
COPY requirements.txt .
RUN pip install -r requirements.txt   # only reinstalls when requirements.txt changes
COPY app/ app/                        # code changes don't invalidate pip layer
COPY models/ models/                  # model updates don't reinstall packages

# Use --mount=type=cache (BuildKit) for persistent pip cache:
# RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Use cache-from in CI:
# docker build --cache-from registry/my-api:cache --build-arg BUILDKIT_INLINE_CACHE=1 .

# Check layer sizes:
# docker history my-ml-api:latest
"""
    print("Ex36 — Docker Layer Caching Optimization:")
    print(content)

def ex37():
    """Secrets management"""
    content = """
# Never put secrets in ENV (visible in docker inspect + image history)

# Method 1: Docker secrets (Swarm only)
# docker secret create db_password /path/to/password.txt
# In service: secrets: [db_password]
# In container: /run/secrets/db_password

# Method 2: BuildKit secrets (during build only)
# RUN --mount=type=secret,id=aws_creds \\
#     AWS_SHARED_CREDENTIALS_FILE=/run/secrets/aws_creds pip install ...
# docker build --secret id=aws_creds,src=$HOME/.aws/credentials .

# Method 3: Runtime injection via env (from Vault/AWS SSM)
# In entrypoint.sh:
# DB_PASSWORD=$(aws ssm get-parameter --name /ml-api/db-password --with-decryption --query Parameter.Value --output text)
# export DB_PASSWORD

# Method 4: Kubernetes secrets (mapped as env vars or volume)
# envFrom:
#   - secretRef: { name: ml-api-secrets }

# What to avoid:
# ENV DB_PASSWORD=hardcoded       BAD — visible in image layers
# COPY .env .                     BAD — .env baked into image
"""
    print("Ex37 — Secrets Management:")
    print(content)

def ex38():
    """Private registry push/pull"""
    content = """
# Push/pull from private container registry

# Login to registry:
# docker login registry.company.com -u username -p password
# docker login ghcr.io -u github_user -p $GITHUB_TOKEN

# Tag for private registry:
# docker tag my-ml-api:1.0 registry.company.com/ml/loan-api:1.0

# Push:
# docker push registry.company.com/ml/loan-api:1.0
# docker push registry.company.com/ml/loan-api:latest

# Pull:
# docker pull registry.company.com/ml/loan-api:1.0

# AWS ECR:
# aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
# docker tag my-ml-api:1.0 123456789.dkr.ecr.us-east-1.amazonaws.com/ml/loan-api:1.0
# docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ml/loan-api:1.0

# GCP Artifact Registry:
# gcloud auth configure-docker us-central1-docker.pkg.dev
# docker push us-central1-docker.pkg.dev/project/repo/ml-api:1.0
"""
    print("Ex38 — Private Registry Push/Pull:")
    print(content)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Distroless base image concept"""
    content = """
# Distroless images: contain only app + runtime dependencies
# No shell, no package manager, no OS utilities
# Result: minimal attack surface + very small images

# Google distroless Python:
FROM gcr.io/distroless/python3-debian12

WORKDIR /app
COPY --from=builder /install /usr/local
COPY app/ app/
COPY models/ models/

# No CMD with shell syntax — must use exec form
CMD ["app/main.py"]

# Size comparison:
# python:3.11         ~ 900MB
# python:3.11-slim    ~ 130MB
# python:3.11-alpine  ~ 50MB
# distroless/python3  ~ 55MB (no shell = harder to debug)

# Security benefit:
# No shell = no shell injection attacks
# No package manager = smaller CVE surface
# Use debug variant for troubleshooting:
# FROM gcr.io/distroless/python3-debian12:debug
"""
    print("Ex39 — Distroless Base Image Concept:")
    print(content)

def ex40():
    """Docker security scanning"""
    content = """
# Scan images for known CVEs before deploying

# Docker Scout (built into Docker Desktop):
# docker scout cves my-ml-api:latest
# docker scout recommendations my-ml-api:latest

# Trivy (open source, very popular):
# trivy image my-ml-api:latest
# trivy image --severity HIGH,CRITICAL my-ml-api:latest
# trivy image --exit-code 1 --severity CRITICAL my-ml-api:latest  # fail CI on critical

# Snyk:
# snyk container test my-ml-api:latest
# snyk container monitor my-ml-api:latest

# Grype:
# grype my-ml-api:latest

# In CI/CD (GitHub Actions):
# - name: Scan image
#   uses: aquasecurity/trivy-action@master
#   with:
#     image-ref: my-ml-api:${{ github.sha }}
#     format: sarif
#     output: trivy-results.sarif

# Fix: keep base images updated, patch dependencies regularly
"""
    print("Ex40 — Docker Security Scanning:")
    print(content)

def ex41():
    """SBOM (software bill of materials) concept"""
    content = """
# SBOM = list of all software components in your container image
# Required for supply chain security compliance (SLSA, SSDF)

# Generate SBOM with Docker Scout:
# docker scout sbom --format spdx my-ml-api:latest > sbom.spdx.json
# docker scout sbom --format cyclonedx my-ml-api:latest > sbom.cyclonedx.json

# Generate with Syft:
# syft my-ml-api:latest -o spdx-json > sbom.spdx.json
# syft my-ml-api:latest -o cyclonedx-json > sbom.json

# Attest SBOM to image (Docker BuildKit):
# docker buildx build --sbom=true --provenance=true -t my-ml-api:latest .

# What SBOM contains:
# - All OS packages (apt/rpm)
# - Python packages (pip)
# - Each package: name, version, license, hash
# - Dependency tree
# - Build provenance

# Use SBOM to:
# 1. Audit licenses (GPL, MIT, Apache)
# 2. Check for vulnerable components
# 3. Comply with security regulations
"""
    print("Ex41 — SBOM (Software Bill of Materials) Concept:")
    print(content)

def ex42():
    """Container signing"""
    content = """
# Sign container images to verify authenticity + integrity

# Cosign (Sigstore — cloud-native signing):
# Install: brew install cosign  /  go install github.com/sigstore/cosign/v2

# Generate key pair:
# cosign generate-key-pair

# Sign image (after push):
# cosign sign --key cosign.key registry.company.com/ml/loan-api:1.0

# Verify signature:
# cosign verify --key cosign.pub registry.company.com/ml/loan-api:1.0

# Keyless signing with OIDC (GitHub Actions):
# COSIGN_EXPERIMENTAL=1 cosign sign registry.company.com/ml/loan-api:${{ github.sha }}

# Sign in CI/CD (GitHub Actions):
# - name: Sign image
#   run: |
#     cosign sign --key env://COSIGN_PRIVATE_KEY $IMAGE_URI
#   env:
#     COSIGN_PRIVATE_KEY: ${{ secrets.COSIGN_PRIVATE_KEY }}

# Enforce signed images in Kubernetes with Sigstore policy controller
"""
    print("Ex42 — Container Signing:")
    print(content)

def ex43():
    """Kaniko for Kubernetes builds"""
    content = """
# Kaniko: build Docker images INSIDE Kubernetes (no Docker daemon needed)
# Useful in CI/CD pipelines running on k8s

# Kaniko pod spec (k8s Job):
# apiVersion: batch/v1
# kind: Job
# spec:
#   template:
#     spec:
#       containers:
#       - name: kaniko
#         image: gcr.io/kaniko-project/executor:latest
#         args:
#           - --context=git://github.com/org/ml-api.git#refs/heads/main
#           - --dockerfile=Dockerfile
#           - --destination=registry.company.com/ml/loan-api:latest
#           - --cache=true
#           - --cache-repo=registry.company.com/ml/cache
#         volumeMounts:
#         - name: docker-config
#           mountPath: /kaniko/.docker

# Advantages over docker-in-docker (DinD):
# - No privileged container needed
# - Layer caching works
# - Secure by design

# Alternatives: Buildah, img, ko (for Go), jib (for Java)
"""
    print("Ex43 — Kaniko for Kubernetes Builds:")
    print(content)

def ex44():
    """BuildKit advanced features"""
    content = """
# BuildKit: next-gen Docker build engine (enabled by default in Docker 23+)
# Enable: DOCKER_BUILDKIT=1 docker build ...

# 1. Mount cache (persistent across builds):
# RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# 2. Secret mount (not stored in image):
# RUN --mount=type=secret,id=aws_key AWS_KEY=$(cat /run/secrets/aws_key) python fetch_model.py
# docker build --secret id=aws_key,src=/home/user/.aws/key .

# 3. SSH mount (for private git repos):
# RUN --mount=type=ssh pip install git+ssh://git@github.com/org/private-pkg.git
# docker build --ssh default .

# 4. Build matrix (via Bake):
# docker buildx bake --file docker-bake.hcl

# 5. Inline cache:
# docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t my-image .
# docker build --cache-from my-image .

# 6. Multi-platform:
# docker buildx build --platform linux/amd64,linux/arm64 -t my-image --push .
"""
    print("Ex44 — BuildKit Advanced Features:")
    print(content)

def ex45():
    """Docker BuildX for multi-platform"""
    content = """
# BuildX: build images for multiple CPU architectures

# Setup buildx builder:
# docker buildx create --name ml-builder --use
# docker buildx inspect --bootstrap

# Build for amd64 + arm64 (Apple M1/M2):
# docker buildx build \\
#   --platform linux/amd64,linux/arm64 \\
#   -t registry.company.com/ml/loan-api:1.0 \\
#   --push .

# Build for all common platforms:
# docker buildx build \\
#   --platform linux/amd64,linux/arm64,linux/arm/v7 \\
#   -t registry.company.com/ml/loan-api:latest --push .

# Load single platform to local Docker:
# docker buildx build --platform linux/amd64 -t ml-api:local --load .

# docker-bake.hcl for multi-platform:
# target "ml-api" {
#   platforms = ["linux/amd64", "linux/arm64"]
#   tags = ["registry.company.com/ml/loan-api:latest"]
# }
# docker buildx bake ml-api
"""
    print("Ex45 — Docker BuildX for Multi-Platform:")
    print(content)

def ex46():
    """Dockerfile best practices checklist"""
    content = """
# Dockerfile Best Practices Checklist
# =====================================

# ✓ 1.  Use specific base image tags (not :latest)
# ✓ 2.  Use slim or distroless base images
# ✓ 3.  Multi-stage builds (separate build from runtime)
# ✓ 4.  Copy requirements.txt BEFORE source code (layer caching)
# ✓ 5.  Use --no-cache-dir with pip
# ✓ 6.  Run as non-root user
# ✓ 7.  Add .dockerignore to exclude unnecessary files
# ✓ 8.  Set ENV PYTHONUNBUFFERED=1 (logs visible immediately)
# ✓ 9.  Use HEALTHCHECK instruction
# ✓ 10. Chain RUN commands with && to reduce layers
# ✓ 11. Clean apt cache: rm -rf /var/lib/apt/lists/*
# ✓ 12. Use exec form for CMD/ENTRYPOINT (signal handling)
# ✓ 13. Never hardcode secrets (use env vars or mounts)
# ✓ 14. Set WORKDIR (don't use root directory)
# ✓ 15. Scan image for vulnerabilities before deploy
"""
    print("Ex46 — Dockerfile Best Practices Checklist:")
    print(content)

def ex47():
    """Cost optimization (slim images)"""
    content = """
# Reduce image size to cut registry storage + transfer costs

# Techniques:
# 1. Multi-stage builds (biggest win — drop build tools)
# 2. Use slim base images
# 3. Install only needed packages
# 4. Clean apt cache in same RUN layer:
RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl libgomp1 && \\
    rm -rf /var/lib/apt/lists/*

# 5. Use --no-cache-dir with pip
# 6. Remove test/doc files:
RUN pip install --no-cache-dir -r requirements.txt && \\
    find /usr/local/lib/python3.11 -name "*.pyc" -delete && \\
    find /usr/local/lib/python3.11 -name "__pycache__" -type d -exec rm -rf {} +

# 7. Exclude notebooks, tests, docs from COPY

# Size examples:
# python:3.11 + sklearn full build  → ~1.2GB
# python:3.11-slim + multi-stage   → ~350MB
# distroless + multi-stage         → ~180MB

# Analyze image layers:
# docker history --human my-ml-api:latest
# dive my-ml-api:latest   (interactive layer explorer)
"""
    print("Ex47 — Cost Optimization (Slim Images):")
    print(content)

def ex48():
    """Production Docker architecture"""
    content = """
# Production Docker Architecture for ML APIs
# ============================================

# Registry: AWS ECR / GCP Artifact Registry / Harbor
# Signed images via Cosign + SBOM attestation

# Build pipeline (GitHub Actions / GitLab CI):
# 1. git push → CI triggered
# 2. Run tests (pytest in Docker)
# 3. Build image (BuildKit, multi-platform)
# 4. Scan with Trivy (fail on CRITICAL)
# 5. Generate SBOM
# 6. Sign with Cosign
# 7. Push to registry with version + git-sha tags
# 8. Update k8s deployment (GitOps via ArgoCD)

# Deployment strategy:
# - Rolling update (default k8s)
# - Blue-green (two deployments, switch service)
# - Canary (Argo Rollouts — gradual traffic shift)

# Registry cleanup policy:
# - Keep last 10 tags per repo
# - Delete untagged images after 7 days
# - Keep images referenced by k8s deployments

# Monitoring:
# - Container metrics: Prometheus + cAdvisor
# - Log aggregation: Fluentd → Elasticsearch → Kibana
# - Alerting: Alertmanager → PagerDuty
"""
    print("Ex48 — Production Docker Architecture:")
    print(content)

def ex49():
    """Kubernetes pod spec from Docker"""
    content = """
# Translating Docker run to Kubernetes pod spec

# docker run -d -p 8000:8000 \\
#   --memory="2g" --cpus="2.0" \\
#   -e LOG_LEVEL=info \\
#   -v /models:/app/models:ro \\
#   my-ml-api:1.0

# Equivalent k8s Deployment:
# apiVersion: apps/v1
# kind: Deployment
# spec:
#   replicas: 3
#   template:
#     spec:
#       containers:
#       - name: ml-api
#         image: registry.company.com/ml/loan-api:1.0
#         ports: [{containerPort: 8000}]
#         env: [{name: LOG_LEVEL, value: info}]
#         resources:
#           requests: {memory: 1Gi, cpu: "1"}
#           limits:   {memory: 2Gi, cpu: "2"}
#         volumeMounts:
#         - name: models
#           mountPath: /app/models
#           readOnly: true
#       volumes:
#       - name: models
#         persistentVolumeClaim: {claimName: models-pvc}
"""
    print("Ex49 — Kubernetes Pod Spec from Docker:")
    print(content)

def ex50():
    """docker-compose to k8s migration concept"""
    content = """
# Migrating docker-compose to Kubernetes

# Tool: Kompose
# kompose convert -f docker-compose.yml
# Generates: Deployment, Service, PVC YAMLs for each service

# Manual mapping:
# docker-compose service  → k8s Deployment + Service
# ports                   → Service (type: ClusterIP / LoadBalancer)
# volumes                 → PersistentVolumeClaim
# environment             → env / ConfigMap / Secret
# depends_on              → initContainers or readinessProbe
# deploy.replicas         → spec.replicas
# deploy.resources.limits → resources.limits
# healthcheck             → livenessProbe / readinessProbe
# restart: unless-stopped → restartPolicy: Always
# networks                → Kubernetes networking (all pods share namespace)

# Additional k8s concepts with no compose equivalent:
# - HorizontalPodAutoscaler (auto-scale on CPU/custom metrics)
# - PodDisruptionBudget (HA during rolling updates)
# - NetworkPolicy (firewall between pods)
# - ServiceAccount + RBAC (fine-grained permissions)

# After migration: use Helm charts for templating and ArgoCD for GitOps deployment
"""
    print("Ex50 — docker-compose to k8s Migration Concept:")
    print(content)


def main():
    print("=" * 60)
    print("Examples 4.2 — Docker for ML")
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
