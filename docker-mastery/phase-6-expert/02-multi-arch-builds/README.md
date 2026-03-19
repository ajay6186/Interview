# Exercise 6.2 — Multi-Architecture Builds

## What you'll learn
- Building images for multiple CPU architectures (amd64 + arm64)
- `docker buildx` and BuildKit for cross-platform builds
- `TARGETARCH` / `TARGETPLATFORM` build args in Dockerfiles
- Pushing a multi-arch manifest to a registry

## Instructions
1. Complete `exercise/Dockerfile` to handle `TARGETARCH`
2. Complete `exercise/build.sh` with the `buildx` commands

## Verify
```bash
# Set up buildx (first time only)
docker buildx create --name multiarch --use

cd exercise
chmod +x build.sh

# Build for current platform only (quick test):
docker buildx build --platform linux/amd64 -t multi-arch-app --load .
docker run --rm multi-arch-app

# Build for both platforms (requires push or --load for single):
# ./build.sh    (see build.sh for full cross-platform command)
```

## Key concepts
- `TARGETARCH`: `amd64`, `arm64`, `arm/v7` — set automatically by buildx
- `TARGETPLATFORM`: `linux/amd64`, `linux/arm64` — full platform string
- `--platform linux/amd64,linux/arm64`: build both in one command
- Multi-arch manifest: one image tag points to architecture-specific images
- Required for Apple Silicon (arm64) ↔ server (amd64) compatibility
