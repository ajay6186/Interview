# Exercise 5.4 — Monitoring Chart (Prometheus + Grafana)

## What you'll learn
- Add Prometheus scrape annotations to pod templates
- Create a ServiceMonitor for Prometheus Operator
- Add a Grafana dashboard via ConfigMap
- Toggle monitoring components via values

## Instructions
Complete `exercise/templates/` to add Prometheus scraping annotations and an optional ServiceMonitor.

## Verify
```bash
# Render with monitoring disabled
helm template my-app exercise/

# Render with monitoring enabled
helm template my-app exercise/ --set monitoring.enabled=true

# Check annotations are on pods
helm template my-app exercise/ --set monitoring.enabled=true \
  | grep -A 3 "prometheus.io"
```

## Key concepts
- `prometheus.io/scrape: "true"` — tells Prometheus to scrape this pod
- `prometheus.io/port: "9090"` — metrics port
- `prometheus.io/path: "/metrics"` — metrics endpoint path
- `ServiceMonitor` — Prometheus Operator CRD for scrape config
- Annotations go on the **pod template** (`spec.template.metadata.annotations`), not the Deployment
