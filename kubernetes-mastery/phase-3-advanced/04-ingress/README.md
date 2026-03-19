# Exercise 3.4 — Ingress

## What you'll learn
- Ingress: HTTP/HTTPS routing rules to Services
- Path-based routing: `/api` → api-service, `/` → frontend-service
- Host-based routing: `api.example.com` → api, `app.example.com` → frontend
- Ingress controllers: nginx-ingress, traefik, AWS ALB

## Instructions
Complete `exercise/manifest.yaml` with Ingress routing rules.

## Prerequisites
Install an Ingress controller first:
```bash
# For minikube:
minikube addons enable ingress
# For kind/kubeadm:
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get ingress

# minikube:
minikube tunnel  # Run in separate terminal
curl http://localhost/api/
curl http://localhost/

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- `ingressClassName`: which controller handles this Ingress
- Path types: `Prefix` (matches prefix), `Exact` (exact match)
- Host-based: `host: api.example.com` routes by Host header
- TLS: add `tls:` section with a Secret containing cert + key (exercise 5.3)
