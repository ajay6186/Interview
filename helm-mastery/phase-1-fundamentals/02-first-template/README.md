# Exercise 1.2 — First Template

## What you'll learn
- Go template syntax in Kubernetes manifests
- `.Values`: access values from values.yaml
- `.Release.Name`: the name given at `helm install`
- `.Chart.Name`, `.Chart.Version`: from Chart.yaml

## Instructions
1. Complete `exercise/values.yaml` with default values
2. Complete `exercise/templates/deployment.yaml` using those values

## Verify
```bash
# Render without a cluster:
helm template my-release exercise/

# Lint:
helm lint exercise/

# Override a value:
helm template my-release exercise/ --set replicaCount=5

# Install:
helm install my-release exercise/
helm uninstall my-release
```

## Key concepts
- `{{ .Values.key }}` — renders a value from values.yaml
- `{{ .Release.Name }}` — the Helm release name (given at install)
- `{{ .Chart.Name }}` — from Chart.yaml `name` field
- `"{{ ... }}"` — wrap template in quotes when value might be a number
- `{{- ... -}}` — strip surrounding whitespace
