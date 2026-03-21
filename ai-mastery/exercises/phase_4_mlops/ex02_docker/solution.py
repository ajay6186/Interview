# ============================================================
# Solution 4.2 — Docker for ML
# ============================================================

def dockerfile_single_stage() -> str:
    return """\
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
        curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn scikit-learn joblib numpy

# Copy application source
COPY . .

# Create non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Expose the API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Start the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
"""


def dockerfile_multi_stage() -> str:
    return """\
# ---- Stage 1: Builder ----
FROM python:3.11 AS builder

WORKDIR /build

# Install build tools and Python deps into a prefix
RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install \\
    fastapi uvicorn scikit-learn joblib numpy

# ---- Stage 2: Runtime ----
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install only runtime system libs
RUN apt-get update && apt-get install -y --no-install-recommends \\
        curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Builder stage ~900 MB → Runtime stage ~150 MB (83% reduction)
"""


def docker_compose_ml_stack() -> str:
    return """\
version: "3.9"

services:
  # ── FastAPI inference API ───────────────────────────────────────────────
  api:
    build: .
    image: myorg/ml-api:latest
    container_name: ml-api
    ports:
      - "8000:8000"
    environment:
      MODEL_PATH: /app/models/model.pkl
      MLFLOW_TRACKING_URI: http://mlflow:5000
      API_KEY: ${API_KEY:-secret-key-123}
    volumes:
      - ./models:/app/models:ro      # mount trained models (read-only)
    depends_on:
      mlflow:
        condition: service_healthy
    networks:
      - ml-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G

  # ── MLflow tracking server ───────────────────────────────────────────────
  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.10.0
    container_name: mlflow
    ports:
      - "5000:5000"
    environment:
      MLFLOW_BACKEND_STORE_URI: postgresql://mlflow:mlflow@postgres:5432/mlflow
      MLFLOW_DEFAULT_ARTIFACT_ROOT: /mlflow/artifacts
    volumes:
      - mlflow_artifacts:/mlflow/artifacts
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ml-network
    command: >
      mlflow server
        --backend-store-uri postgresql://mlflow:mlflow@postgres:5432/mlflow
        --default-artifact-root /mlflow/artifacts
        --host 0.0.0.0
        --port 5000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    restart: unless-stopped

  # ── PostgreSQL (MLflow backend store) ────────────────────────────────────
  postgres:
    image: postgres:15-alpine
    container_name: mlflow-db
    environment:
      POSTGRES_USER: mlflow
      POSTGRES_PASSWORD: mlflow
      POSTGRES_DB: mlflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ml-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mlflow"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mlflow_artifacts:
  postgres_data:

networks:
  ml-network:
    driver: bridge
"""


def dockerignore_content() -> str:
    return """\
# Python artifacts
__pycache__/
*.py[cod]
*.pyo
*.pyd
.Python
*.egg-info/
dist/
build/

# Virtual environments
venv/
.venv/
env/
ENV/

# Version control
.git/
.gitignore

# Jupyter notebooks (large, not needed in container)
*.ipynb
.ipynb_checkpoints/

# Large data files
data/raw/
data/large_files/
*.csv
*.parquet

# Model artifacts (mounted at runtime via volume)
models/*.pkl
models/*.h5
models/*.onnx

# IDE and OS files
.idea/
.vscode/
*.DS_Store
Thumbs.db

# Test files
tests/
*.test.py
pytest.ini
.pytest_cache/

# CI/CD
.github/
Jenkinsfile

# Documentation
docs/
*.md
"""


def docker_build_command(image_name: str, tag: str) -> str:
    return (
        f"docker build "
        f"-t {image_name}:{tag} "
        f"-t {image_name}:latest "
        f"--label git-commit=$(git rev-parse --short HEAD) "
        f"--label build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ) "
        f"."
    )


def docker_push_command(registry: str, image: str) -> str:
    # image is e.g. "myorg/ml-api:v1.2.3"
    full_image = f"{registry}/{image}"
    lines = [
        f"# Tag the image with the registry prefix",
        f"docker tag {image} {full_image}",
        f"",
        f"# Authenticate (if not already logged in)",
        f"docker login {registry}",
        f"",
        f"# Push to registry",
        f"docker push {full_image}",
        f"",
        f"# Also push the latest tag",
        f"docker tag {image.split(':')[0]}:latest {registry}/{image.split(':')[0]}:latest",
        f"docker push {registry}/{image.split(':')[0]}:latest",
    ]
    return "\n".join(lines)


def entrypoint_script(model_path: str, port: int) -> str:
    return f"""\
#!/bin/sh
# entrypoint.sh — wait for model file, then start the API server

set -e

MODEL_PATH="{model_path}"
MAX_WAIT=120   # seconds to wait for model
ELAPSED=0

echo "[entrypoint] Waiting for model at $MODEL_PATH ..."
while [ ! -f "$MODEL_PATH" ]; do
    if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
        echo "[entrypoint] ERROR: model not found after ${{MAX_WAIT}}s. Exiting."
        exit 1
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo "[entrypoint] Still waiting... (${{ELAPSED}}s elapsed)"
done

echo "[entrypoint] Model found. Starting uvicorn on port {port}."
exec uvicorn main:app --host 0.0.0.0 --port {port} --workers 2
"""


def dockerfile_healthcheck() -> str:
    return """\
# Install curl in the image so the health check can use it
RUN apt-get update && apt-get install -y --no-install-recommends curl \\
    && rm -rf /var/lib/apt/lists/*

# Health check configuration
# --interval:     how often to run the check
# --timeout:      how long to wait for a response before marking unhealthy
# --start-period: grace period after container starts (don't count failures)
# --retries:      consecutive failures needed to mark UNHEALTHY
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1
"""


def docker_run_with_limits(image: str) -> str:
    return (
        f"docker run -d "
        f"--name ml-api "
        f"--cpus=2 "
        f"--memory=4g "
        f"--memory-swap=4g "
        f"-v $(pwd)/models:/app/models:ro "
        f"-e MODEL_PATH=/app/models/model.pkl "
        f"-e LOG_LEVEL=INFO "
        f"-p 8000:8000 "
        f"--restart unless-stopped "
        f"{image}"
    )


def docker_network_commands(image: str) -> tuple:
    create_cmd = (
        "docker network create "
        "--driver bridge "
        "--subnet 172.20.0.0/16 "
        "ml-network"
    )
    run_cmd = (
        f"docker run -d "
        f"--name ml-api "
        f"--network ml-network "
        f"--network-alias api "
        f"-p 8000:8000 "
        f"{image}"
    )
    return (create_cmd, run_cmd)


def copy_vs_add() -> dict:
    return {
        "COPY": (
            "Copies files/directories from the build context into the image. "
            "Transparent and predictable — no implicit behaviour. "
            "Supports --chown flag to set ownership. "
            "Cannot fetch remote URLs."
        ),
        "ADD": (
            "Superset of COPY with two extra powers: "
            "(1) auto-extracts .tar, .tar.gz, .zip archives into the destination, "
            "(2) can fetch files from remote URLs (http/https). "
            "The auto-extraction behaviour can be surprising and invalidates cache."
        ),
        "recommendation": (
            "Prefer COPY for all normal file copies — it is explicit and cacheable. "
            "Use ADD only when you specifically need archive auto-extraction. "
            "Never use ADD to fetch remote URLs in production Dockerfiles; "
            "use RUN curl/wget instead so you can verify the download."
        ),
    }


def docker_compose_override() -> str:
    return """\
# docker-compose.override.yml  — development overrides
# Automatically merged with docker-compose.yml by 'docker compose up'

version: "3.9"

services:
  api:
    build:
      context: .
      target: builder        # use the builder stage for dev deps
    volumes:
      - .:/app               # mount source code for hot-reload
      - /app/__pycache__     # anonymous volume prevents pycache sync
    environment:
      ENV: development
      LOG_LEVEL: debug
    command: >
      uvicorn main:app
        --host 0.0.0.0
        --port 8000
        --reload
        --reload-dir /app

  # ── Jupyter notebook for experimentation ─────────────────────────────
  jupyter:
    image: jupyter/scipy-notebook:latest
    container_name: ml-jupyter
    ports:
      - "8888:8888"
    volumes:
      - ./notebooks:/home/jovyan/work
      - ./models:/home/jovyan/models
    environment:
      JUPYTER_ENABLE_LAB: "yes"
      JUPYTER_TOKEN: devtoken
    networks:
      - ml-network
"""


def cached_layers_on_code_change(instructions: list) -> list:
    """
    Docker layer caching rules:
    - Each instruction is a layer.
    - When a layer's content changes, ALL subsequent layers are invalidated.
    - COPY/ADD instructions are cache-busted if the files they copy have changed.
    - If only source code (not requirements.txt) changed, the cache is busted
      at the first COPY that includes source files.
    """
    cached = []
    busted = False
    for i, instruction in enumerate(instructions):
        upper = instruction.upper()
        if busted:
            # All layers after the bust point are rebuilt
            continue

        # Detect the layer that copies source code (not just requirements.txt)
        # In the sample, instruction index 4 is "COPY . ." which copies all source
        if upper.startswith("COPY") and "REQUIREMENTS" not in upper.upper():
            # This copies source code — if code changed, bust starts here
            busted = True
            continue

        cached.append(i)

    return cached


def main():
    print("=== Solution 4.2: Docker for ML ===\n")

    print("─" * 60)
    print("1. Single-stage Dockerfile")
    print("─" * 60)
    print(dockerfile_single_stage())

    print("─" * 60)
    print("2. Multi-stage Dockerfile")
    print("─" * 60)
    print(dockerfile_multi_stage())

    print("─" * 60)
    print("3. docker-compose.yml (api + mlflow + postgres)")
    print("─" * 60)
    print(docker_compose_ml_stack())

    print("─" * 60)
    print("4. .dockerignore")
    print("─" * 60)
    print(dockerignore_content())

    print("─" * 60)
    print("5. Build command")
    print("─" * 60)
    print(docker_build_command("myorg/ml-api", "v1.2.3"))
    print()

    print("─" * 60)
    print("6. Push command")
    print("─" * 60)
    print(docker_push_command("registry.example.com", "myorg/ml-api:v1.2.3"))
    print()

    print("─" * 60)
    print("7. Entrypoint script")
    print("─" * 60)
    print(entrypoint_script("/app/models/model.pkl", 8000))

    print("─" * 60)
    print("8. HEALTHCHECK instruction")
    print("─" * 60)
    print(dockerfile_healthcheck())

    print("─" * 60)
    print("9. docker run with resource limits")
    print("─" * 60)
    print(docker_run_with_limits("myorg/ml-api:v1.2.3"))
    print()

    print("─" * 60)
    print("10. Docker network commands")
    print("─" * 60)
    create_cmd, run_cmd = docker_network_commands("myorg/ml-api:v1.2.3")
    print("Create:", create_cmd)
    print("Run:   ", run_cmd)
    print()

    print("─" * 60)
    print("11. COPY vs ADD")
    print("─" * 60)
    for k, v in copy_vs_add().items():
        print(f"  {k}: {v}")
    print()

    print("─" * 60)
    print("12. docker-compose.override.yml (dev)")
    print("─" * 60)
    print(docker_compose_override())

    print("─" * 60)
    print("13. Layer cache analysis — which layers are cached on code change?")
    print("─" * 60)
    cached = cached_layers_on_code_change(SAMPLE_INSTRUCTIONS)
    for i, instr in enumerate(SAMPLE_INSTRUCTIONS):
        status = "CACHED" if i in cached else "REBUILD"
        print(f"  [{status}] Layer {i}: {instr}")
    print(f"\n  Cached layers: {cached}")
    print(f"  Insight: requirements install is cached because requirements.txt didn't change.")


SAMPLE_INSTRUCTIONS = [
    "FROM python:3.11-slim",
    "WORKDIR /app",
    "COPY requirements.txt .",
    "RUN pip install -r requirements.txt",
    "COPY . .",
    'CMD ["uvicorn", "main:app"]',
]

if __name__ == "__main__":
    main()
