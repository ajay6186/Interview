#!/bin/sh
# Git pre-commit hook — re-renders Helm chart when values.yaml changes
# Install: cp pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

CHART_DIR="charts/gke-team-onboarding"
VALUES_FILE="values.yaml"
OUTPUT_DIR="resources"

if git diff --cached --name-only | grep -q "$VALUES_FILE"; then
  echo "[pre-commit] Detected change in $VALUES_FILE — re-rendering Helm chart..."

  mkdir -p "$OUTPUT_DIR"

  helm template my-release "$CHART_DIR" -f "$VALUES_FILE" \
    --output-dir "$OUTPUT_DIR"

  git add "$OUTPUT_DIR"

  echo "[pre-commit] Helm render complete. Rendered files staged."
fi
