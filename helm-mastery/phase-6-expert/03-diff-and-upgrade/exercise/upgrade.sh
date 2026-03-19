#!/usr/bin/env bash
# Exercise 6.3 — Diff and Upgrade workflow
# Fill in all ??? placeholders

set -euo pipefail

RELEASE_NAME="my-app"

# Step 1: Install v1
echo "=== Installing v1 ==="
# TODO: helm install command
helm install ??? v1/

# Step 2: Preview what v2 will change using helm-diff
echo "=== Diffing v1 → v2 ==="
# TODO: helm diff upgrade command (requires helm-diff plugin)
helm diff upgrade ??? v2/

# Step 3: Apply the upgrade to v2
echo "=== Upgrading to v2 ==="
# TODO: helm upgrade command with --atomic flag and 3m timeout
helm upgrade ??? v2/ ??? ???

# Step 4: Check release history
echo "=== Release history ==="
# TODO: helm history command
helm history ???

# Step 5 (optional): Roll back to revision 1
# TODO: helm rollback command
# helm rollback ??? 1
