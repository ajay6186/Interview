# Exercise 1.2 — Labels and Selectors

## What you'll learn
- Labels: key/value metadata attached to any resource
- Selectors: how Services and Deployments find their pods
- Annotations: non-identifying metadata (URLs, descriptions, monitoring config)
- Filtering resources with `-l` flag

## Instructions
Complete `exercise/manifest.yaml` with proper labels on all resources.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# Filter by label:
kubectl get pods -l app=myapp
kubectl get pods -l env=staging
kubectl get pods -l app=myapp,env=staging

# Describe service to see selector and endpoints:
kubectl describe service myapp-service

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Labels are for selection and grouping (used by selectors)
- Annotations are for metadata (tool info, URLs) — not used for selection
- Service `selector` must match pod `labels` to route traffic
- Common label conventions: `app`, `version`, `env`, `tier`, `component`
