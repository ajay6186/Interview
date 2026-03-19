# Exercise 4.2 — Umbrella Chart

## What you'll learn
- Compose multiple subcharts into a single umbrella chart
- Configure subcharts via parent `values.yaml`
- Use `global` values shared across all subcharts
- Understand subchart value scoping

## Instructions
Complete `exercise/Chart.yaml` to declare the local subcharts as dependencies, then fill in `exercise/values.yaml` to configure each subchart.

## Verify
```bash
# Subcharts are already in charts/ — no dependency update needed
helm template my-platform exercise/

# See both frontend and backend deployments rendered
helm template my-platform exercise/ | grep "^kind:"

# Override a subchart value at install time
helm install my-platform exercise/ --set frontend.replicaCount=3
```

## Key concepts
- `dependencies:` in `Chart.yaml` declares subcharts
- `repository: "file://charts/frontend"` — local subchart path
- Subchart values are nested under the subchart name in parent `values.yaml`
- `global:` values are accessible in all subcharts as `.Values.global`
- Subcharts in `charts/` directory are included automatically
