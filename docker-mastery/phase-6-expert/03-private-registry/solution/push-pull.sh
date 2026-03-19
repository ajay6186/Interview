#!/bin/sh
# ============================================================================
# Solution 6.3 — Push and Pull from Private Registry
# ============================================================================

REGISTRY="localhost:5000"
IMAGE="my-app"
TAG="v1.0"

# Build a test image
docker build -t $IMAGE:$TAG - <<'EOF'
FROM alpine
CMD echo "Hello from private registry!"
EOF

# Tag for private registry: REGISTRY_HOST:PORT/IMAGE:TAG
docker tag $IMAGE:$TAG $REGISTRY/$IMAGE:$TAG
echo "Tagged: $REGISTRY/$IMAGE:$TAG"

# Push to private registry
docker push $REGISTRY/$IMAGE:$TAG
echo "Pushed to $REGISTRY"

# Remove local copy (simulate a fresh environment)
docker rmi $REGISTRY/$IMAGE:$TAG
echo "Removed local copy"

# Pull from private registry
docker pull $REGISTRY/$IMAGE:$TAG
echo "Pulled from $REGISTRY"

# Run from registry
docker run --rm $REGISTRY/$IMAGE:$TAG

# List all repositories in the registry
echo ""
echo "Registry catalog:"
curl -s http://$REGISTRY/v2/_catalog
echo ""
echo "Tags for $IMAGE:"
curl -s http://$REGISTRY/v2/$IMAGE/tags/list
