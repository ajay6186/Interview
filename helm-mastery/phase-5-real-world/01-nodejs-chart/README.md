# Exercise 5.1 — Production Node.js Chart

## What you'll learn
- Build a complete, production-ready chart from scratch
- Combine Deployment + Service + ConfigMap + HPA in one chart
- Wire liveness and readiness probes from values
- Use named templates for labels and selectors

## Instructions
Complete all `???` placeholders in `exercise/templates/` to produce a working Node.js chart with health probes and autoscaling.

## Verify
```bash
helm template my-app exercise/

# With HPA enabled
helm template my-app exercise/ --set hpa.enabled=true

# Full install
helm install my-app exercise/
kubectl get deploy,svc,hpa -l app.kubernetes.io/instance=my-app
```

## Key concepts
- `livenessProbe` — restart container if it stops responding
- `readinessProbe` — stop routing traffic while container is initializing
- `HorizontalPodAutoscaler` — scale replicas based on CPU/memory
- `envFrom.configMapRef` — load all ConfigMap keys as env vars
- Named template `{{ include "nodejs.labels" . }}` for DRY label sets
