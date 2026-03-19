#!/usr/bin/env bash
# Exercise 6.1 — OCI Registry workflow
# Fill in all ??? placeholders

set -euo pipefail

REGISTRY="ghcr.io"
NAMESPACE="myorg"
CHART_NAME="my-app"
CHART_VERSION="1.0.0"

# TODO: Step 1 — Authenticate to the registry
# helm registry login <registry> --username <user> --password <token>
helm registry login ??? --username ??? --password ???

# TODO: Step 2 — Package the chart into a .tgz
# helm package <chart-directory>
helm package ???

# TODO: Step 3 — Push the packaged chart to the OCI registry
# helm push <chart-tgz> oci://<registry>/<namespace>
helm push ${CHART_NAME}-${CHART_VERSION}.tgz oci://???/???

# TODO: Step 4 — Pull the chart from the OCI registry
# helm pull oci://<registry>/<namespace>/<name> --version <version>
helm pull oci://???/???/??? --version ???

# TODO: Step 5 — Install the chart directly from OCI (without pulling first)
# helm install <release-name> oci://<registry>/<namespace>/<name> --version <version>
helm install my-release oci://???/???/??? --version ???

echo "Done! Chart pushed to and installed from OCI registry."
