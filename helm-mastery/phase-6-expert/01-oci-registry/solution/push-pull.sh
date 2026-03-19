#!/usr/bin/env bash
# Exercise 6.1 — OCI Registry workflow (SOLUTION)

set -euo pipefail

REGISTRY="ghcr.io"
NAMESPACE="myorg"
CHART_NAME="my-app"
CHART_VERSION="1.0.0"

# Step 1 — Authenticate to the registry
helm registry login ${REGISTRY} \
  --username "${GITHUB_USER}" \
  --password "${GITHUB_TOKEN}"

# Step 2 — Package the chart into a .tgz
helm package ./exercise/

# Step 3 — Push the packaged chart to the OCI registry
helm push ${CHART_NAME}-${CHART_VERSION}.tgz oci://${REGISTRY}/${NAMESPACE}

# Step 4 — Pull the chart from the OCI registry
helm pull oci://${REGISTRY}/${NAMESPACE}/${CHART_NAME} --version ${CHART_VERSION}

# Step 5 — Install the chart directly from OCI
helm install my-release oci://${REGISTRY}/${NAMESPACE}/${CHART_NAME} \
  --version ${CHART_VERSION}

echo "Done! Chart pushed to and installed from OCI registry."
