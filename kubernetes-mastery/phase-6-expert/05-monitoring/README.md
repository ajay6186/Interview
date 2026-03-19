# Exercise 6.5 — Monitoring with Prometheus Annotations

## What you'll learn
- Prometheus scraping annotations on pods and services
- ServiceMonitor CRD (if prometheus-operator is installed)
- Exposing application metrics via `/metrics` endpoint
- `kubectl top` for basic resource monitoring

## Instructions
Complete `exercise/manifest.yaml` — annotate a deployment for Prometheus scraping.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# Check annotations:
kubectl describe pod -l app=metrics-app
# Look for: prometheus.io/scrape, prometheus.io/port, prometheus.io/path

# Resource usage (requires metrics-server):
kubectl top pods -l app=metrics-app

# If you have Prometheus installed:
# Check http://prometheus:9090/targets — metrics-app should appear

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- `prometheus.io/scrape: "true"` — opt-in for scraping
- `prometheus.io/port: "3000"` — which port exposes /metrics
- `prometheus.io/path: "/metrics"` — metrics endpoint path
- These are just annotations — Prometheus Operator reads them via ServiceMonitor
- `kubectl top` uses Metrics Server (lighter than Prometheus)
