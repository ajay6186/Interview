#!/bin/sh
# ============================================================================
# Solution 6.2 — buildx commands
# ============================================================================

# Create and activate a multi-platform builder
docker buildx create --name multiarch --use

# Build and push a multi-arch image (replace YOUR_REGISTRY)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t YOUR_REGISTRY/multi-arch-app:latest \
  --push \
  .

# Inspect the manifest to confirm both architectures
docker buildx imagetools inspect YOUR_REGISTRY/multi-arch-app:latest

# For local testing (single platform, no push needed):
# docker buildx build --platform linux/amd64 -t multi-arch-app --load .
