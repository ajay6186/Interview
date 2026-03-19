#!/bin/sh
# ============================================================================
# Exercise 6.3 — Push and Pull from Private Registry
# ============================================================================

REGISTRY="localhost:5000"
IMAGE="my-app"
TAG="v1.0"

# Step 1: Build a simple test image
docker build -t $IMAGE:$TAG - <<'EOF'
FROM alpine
CMD echo "Hello from private registry!"
EOF

echo "Built: $IMAGE:$TAG"

# TODO 2: Tag the image for the private registry
# Format: REGISTRY/IMAGE:TAG
# docker tag $IMAGE:$TAG $REGISTRY/$IMAGE:$TAG
echo "TODO: tag the image for $REGISTRY"

# TODO 3: Push the tagged image to the local registry
# docker push $REGISTRY/$IMAGE:$TAG
echo "TODO: push to $REGISTRY"

# TODO 4: Remove the local image (to prove pull works)
# docker rmi $REGISTRY/$IMAGE:$TAG
echo "TODO: remove local copy"

# TODO 5: Pull the image back from the registry
# docker pull $REGISTRY/$IMAGE:$TAG
echo "TODO: pull from $REGISTRY"

# TODO 6: Run the image from the registry
# docker run --rm $REGISTRY/$IMAGE:$TAG
echo "TODO: run from $REGISTRY"

# List all images in the registry (via API):
echo ""
echo "Registry catalog:"
curl -s http://$REGISTRY/v2/_catalog
