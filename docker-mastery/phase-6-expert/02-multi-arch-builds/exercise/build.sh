#!/bin/sh
# ============================================================================
# Exercise 6.2 — buildx commands
# ============================================================================

# TODO 1: Create a new buildx builder instance named "multiarch"
# docker buildx create --name multiarch --use

# TODO 2: Build for both amd64 and arm64 and push to a registry
# Replace YOUR_REGISTRY with your Docker Hub username or registry URL
# docker buildx build \
#   --platform linux/amd64,linux/arm64 \
#   -t YOUR_REGISTRY/multi-arch-app:latest \
#   --push \
#   .

# TODO 3: Inspect the multi-arch manifest
# docker buildx imagetools inspect YOUR_REGISTRY/multi-arch-app:latest

# Build for current platform only (for local testing without a registry):
docker buildx build --platform linux/amd64 -t multi-arch-app --load .
echo "Built for amd64. Run: docker run --rm multi-arch-app"
