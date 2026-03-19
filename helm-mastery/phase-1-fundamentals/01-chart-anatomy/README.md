# Exercise 1.1 — Chart Anatomy

## What you'll learn
- The required files in a Helm chart
- `Chart.yaml`: chart metadata (name, version, appVersion, description)
- `values.yaml`: default configuration values
- The `templates/` directory: Kubernetes manifests with Go template syntax

## Instructions
Complete `exercise/Chart.yaml` — every field is required or commonly expected.

## Verify
```bash
helm lint exercise/
# Should show: [INFO] Chart.yaml: icon is recommended

helm show chart exercise/
# Shows the chart metadata

helm template my-release exercise/
# Renders templates with default values
```

## Key concepts
- `apiVersion: v2` — always use v2 for Helm 3
- `version`: the CHART version (SemVer) — bump when chart changes
- `appVersion`: the APPLICATION version — matches Docker image tag
- `type: application` — deployable; `type: library` — shared helpers only
- `name` must be lowercase, no spaces or underscores
