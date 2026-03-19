# Exercise 2.5 — Chart Dependencies

## What you'll learn
- `dependencies` in Chart.yaml: include other charts as subcharts
- `helm dependency update`: download dependency charts to `charts/`
- Overriding subchart values with parent values.yaml
- Enabling/disabling subcharts with `condition`

## Instructions
Complete `exercise/Chart.yaml` with a dependency on the bitnami redis chart.

## Verify
```bash
# Download dependencies:
helm dependency update exercise/

# Check charts/ directory:
ls exercise/charts/

# Render (redis subchart templates included):
helm template my-release exercise/

# Disable redis:
helm template my-release exercise/ --set redis.enabled=false
```

## Key concepts
- `repository`: Helm chart repository URL
- `version`: constraint like ">=17.0.0" or exact "17.3.14"
- `condition`: value path that enables/disables this dependency
- Subchart values: set with `<subchart-name>.<key>: value` in parent values.yaml
- `helm dependency update` → downloads to `charts/` (add `charts/*.tgz` to .gitignore)
