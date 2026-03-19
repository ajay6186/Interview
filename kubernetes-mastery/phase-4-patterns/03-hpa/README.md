# Exercise 4.3 — Horizontal Pod Autoscaler (HPA)

## What you'll learn
- HPA: automatically scale pod replicas based on CPU/memory usage
- Metrics Server: required for HPA to get resource metrics
- `minReplicas` and `maxReplicas` bounds
- Custom metrics (preview)

## Prerequisites
```bash
# Install metrics-server (required for HPA):
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# For minikube: minikube addons enable metrics-server
```

## Instructions
Complete `exercise/manifest.yaml` with an HPA targeting 50% CPU utilization.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get hpa
# Wait for metrics to populate (1-2 min):
kubectl get hpa -w

# Generate CPU load to trigger scaling:
kubectl run load --image=busybox --rm -it -- sh -c "while true; do wget -q -O- http://php-apache; done"

# Watch pods scale up:
kubectl get pods -w

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- HPA checks metrics every 15 seconds (default)
- Scale-up: immediate when threshold exceeded
- Scale-down: waits 5 minutes (stabilization window) to avoid thrashing
- `targetAverageUtilization: 50` = scale when avg CPU > 50% of request
