# ============================================================
# Exercise 4.2 — Docker for ML
# ============================================================
# Topics:
#   • Dockerfile for ML app
#   • Multi-stage builds
#   • docker-compose for ML stack
#   • Environment variables and volume mounts for models
#   • Health checks, resource limits, docker networks
#   • Building, tagging images, container registry push/pull
# ============================================================

# ---------------------------------------------------------------------------
# TODO 1: Write a single-stage Dockerfile for a FastAPI ML app
# Base image: python:3.11-slim
# Install: fastapi uvicorn scikit-learn joblib numpy
# Copy app source, expose port 8000, set CMD
# ---------------------------------------------------------------------------
def dockerfile_single_stage() -> str:
    pass  # TODO: return the Dockerfile content as a string


# ---------------------------------------------------------------------------
# TODO 2: Write a multi-stage Dockerfile
# Stage 1 (builder): install all deps including build tools
# Stage 2 (runtime): python:3.11-slim, copy only installed packages
# Result: smaller final image
# ---------------------------------------------------------------------------
def dockerfile_multi_stage() -> str:
    pass  # TODO: return the multi-stage Dockerfile content as a string


# ---------------------------------------------------------------------------
# TODO 3: Write a docker-compose.yml for an ML stack
# Services: api (FastAPI), mlflow (tracking server), postgres (mlflow backend)
# Include: volumes, env vars, ports, depends_on
# ---------------------------------------------------------------------------
def docker_compose_ml_stack() -> str:
    pass  # TODO: return the docker-compose.yml content as a string


# ---------------------------------------------------------------------------
# TODO 4: Write a .dockerignore file content
# Exclude: __pycache__, *.pyc, .git, venv/, data/large_files, *.ipynb
# ---------------------------------------------------------------------------
def dockerignore_content() -> str:
    pass  # TODO: return the .dockerignore content as a string


# ---------------------------------------------------------------------------
# TODO 5: Return the docker CLI command to build and tag an image
# Image name: myorg/ml-api, tag: v1.2.3
# Also build with a "latest" tag in the same command
# ---------------------------------------------------------------------------
def docker_build_command(image_name: str, tag: str) -> str:
    pass  # TODO: return the docker build command string


# ---------------------------------------------------------------------------
# TODO 6: Return the docker CLI command to push an image to a registry
# Registry: registry.example.com
# Image: myorg/ml-api:v1.2.3
# ---------------------------------------------------------------------------
def docker_push_command(registry: str, image: str) -> str:
    pass  # TODO: return the docker push command string


# ---------------------------------------------------------------------------
# TODO 7: Write an ENTRYPOINT script (entrypoint.sh) for the ML container
# Steps: wait for the model file to exist, then start uvicorn
# Use a loop with sleep to poll for the model file
# ---------------------------------------------------------------------------
def entrypoint_script(model_path: str, port: int) -> str:
    pass  # TODO: return the shell script content as a string


# ---------------------------------------------------------------------------
# TODO 8: Write a Dockerfile snippet that adds a HEALTHCHECK
# Check: curl http://localhost:8000/health every 30s
# Timeout: 10s, start period: 40s, retries: 3
# ---------------------------------------------------------------------------
def dockerfile_healthcheck() -> str:
    pass  # TODO: return the HEALTHCHECK Dockerfile instruction(s) as a string


# ---------------------------------------------------------------------------
# TODO 9: Return the docker run command with resource limits
# CPU: 2 cores, memory: 4g
# Mount a local ./models directory to /app/models in the container
# Pass an env var MODEL_PATH=/app/models/model.pkl
# ---------------------------------------------------------------------------
def docker_run_with_limits(image: str) -> str:
    pass  # TODO: return the docker run command string


# ---------------------------------------------------------------------------
# TODO 10: Write docker network commands
# Create a custom bridge network named "ml-network"
# Return two strings: the create command and the run command that uses it
# ---------------------------------------------------------------------------
def docker_network_commands(image: str) -> tuple:
    pass  # TODO: return (create_network_cmd, run_with_network_cmd)


# ---------------------------------------------------------------------------
# TODO 11: Explain the key differences between COPY and ADD in a Dockerfile
# Return a dict with keys: "COPY", "ADD", "recommendation"
# ---------------------------------------------------------------------------
def copy_vs_add() -> dict:
    pass  # TODO: return explanation dict


# ---------------------------------------------------------------------------
# TODO 12: Write a docker-compose override file for development
# Override the api service: mount source code as a volume, enable hot-reload
# Add a jupyter service for experimentation
# ---------------------------------------------------------------------------
def docker_compose_override() -> str:
    pass  # TODO: return docker-compose.override.yml content as a string


# ---------------------------------------------------------------------------
# TODO 13: Calculate the layer caching benefit
# Given a list of Dockerfile instructions, identify which layers will be
# cached on a second build if only the source code changed
# Return the indices of cached layers (0-indexed)
# ---------------------------------------------------------------------------
SAMPLE_INSTRUCTIONS = [
    "FROM python:3.11-slim",
    "WORKDIR /app",
    "COPY requirements.txt .",
    "RUN pip install -r requirements.txt",
    "COPY . .",
    "CMD [\"uvicorn\", \"main:app\"]",
]

def cached_layers_on_code_change(instructions: list) -> list:
    pass  # TODO: return list of indices of layers that will be cached


def main():
    print("=== Exercise 4.2: Docker for ML ===\n")
    print("TODOs to implement:")
    todos = [
        ("TODO 1",  "dockerfile_single_stage()    — Basic Dockerfile for FastAPI ML app"),
        ("TODO 2",  "dockerfile_multi_stage()     — Multi-stage Dockerfile (smaller image)"),
        ("TODO 3",  "docker_compose_ml_stack()    — docker-compose with api+mlflow+postgres"),
        ("TODO 4",  "dockerignore_content()       — .dockerignore for ML projects"),
        ("TODO 5",  "docker_build_command()       — docker build with multiple tags"),
        ("TODO 6",  "docker_push_command()        — docker push to registry"),
        ("TODO 7",  "entrypoint_script()          — Shell entrypoint with model wait loop"),
        ("TODO 8",  "dockerfile_healthcheck()     — HEALTHCHECK instruction"),
        ("TODO 9",  "docker_run_with_limits()     — docker run with CPU/memory limits"),
        ("TODO 10", "docker_network_commands()    — Create and use custom network"),
        ("TODO 11", "copy_vs_add()                — COPY vs ADD explanation"),
        ("TODO 12", "docker_compose_override()    — Dev override with hot-reload + jupyter"),
        ("TODO 13", "cached_layers_on_code_change() — Layer cache analysis"),
    ]
    for label, desc in todos:
        print(f"  {label}: {desc}")
    print()
    print("Key concepts:")
    print("  - Layer caching: order instructions from least to most frequently changed")
    print("  - Multi-stage builds reduce final image size by 60-80%")
    print("  - Volume mounts allow model updates without rebuilding the image")
    print("  - Health checks enable orchestrators (K8s, ECS) to manage container lifecycle")


if __name__ == "__main__":
    main()
