#!/usr/bin/env bash
# Exercise 6.3 — Diff and Upgrade workflow (SOLUTION)

set -euo pipefail

RELEASE_NAME="my-app"

echo "=== Installing v1 ==="
helm install ${RELEASE_NAME} v1/

echo "=== Diffing v1 → v2 ==="
helm diff upgrade ${RELEASE_NAME} v2/

echo "=== Upgrading to v2 ==="
helm upgrade ${RELEASE_NAME} v2/ --atomic --timeout 3m

echo "=== Release history ==="
helm history ${RELEASE_NAME}

# Roll back to revision 1 if needed:
# helm rollback ${RELEASE_NAME} 1
