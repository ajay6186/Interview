# Exercise 3.2 — Library Charts

## What you'll learn
- Library chart: `type: library` — provides shared templates, cannot be installed
- Consuming a library chart as a dependency
- Sharing label templates, fullname helpers across multiple charts

## Instructions
1. Review `exercise/my-library/` — a library chart with shared helpers
2. Complete `exercise/my-app/Chart.yaml` to depend on the library
3. Use the library's templates in `exercise/my-app/templates/deployment.yaml`

## Verify
```bash
helm dependency update exercise/my-app/
helm template my-release exercise/my-app/
helm lint exercise/my-app/
```

## Key concepts
- Library chart: `type: library` in Chart.yaml
- Cannot be installed directly — only used as a dependency
- Templates in library charts must be named templates (`{{- define "..." -}}`)
- Consumer imports via `dependencies` in Chart.yaml
- Pattern: one library chart shared by many application charts
