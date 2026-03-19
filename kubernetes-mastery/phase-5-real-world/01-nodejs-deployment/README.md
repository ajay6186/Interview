# Exercise 5.1 — Node.js Deployment Stack

## What you'll learn
- Full deployment stack: Deployment + Service + ConfigMap combined
- Connecting config to a Node.js app via environment variables
- Readiness probes to control traffic routing

## Instructions
Complete `exercise/manifest.yaml` — a production-style Node.js deployment.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get all -l app=node-api
kubectl exec deploy/node-api -- printenv NODE_ENV
kubectl port-forward service/node-api-service 8080:80
curl http://localhost:8080
kubectl delete -f exercise/manifest.yaml
```
