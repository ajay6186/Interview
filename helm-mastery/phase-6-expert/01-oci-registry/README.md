# Exercise 6.1 — OCI Registry

## What you'll learn
- Package a Helm chart into a `.tgz` archive
- Push a chart to an OCI-compatible registry
- Pull and install a chart from an OCI registry
- Understand the difference between traditional chart repos and OCI

## Instructions
Complete `exercise/push-pull.sh` with the correct `helm` commands to package, push, and pull a chart using OCI.

## Verify
```bash
# Make the script executable and run it
chmod +x exercise/push-pull.sh
./exercise/push-pull.sh
```

## Key concepts
- `helm package <chart-dir>` — creates a `.tgz` archive
- `helm push <chart.tgz> oci://<registry>/<namespace>` — push to OCI registry
- `helm pull oci://<registry>/<namespace>/<name> --version <ver>` — pull from OCI
- `helm install myapp oci://<registry>/<namespace>/<name>` — install directly from OCI
- `helm registry login <registry>` — authenticate before push/pull
- OCI replaces `helm repo add` + `helm repo update` workflow
- Docker Hub, GHCR, ECR, ACR, GCR all support Helm OCI charts
