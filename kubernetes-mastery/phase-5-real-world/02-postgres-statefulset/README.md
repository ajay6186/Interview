# Exercise 5.2 — PostgreSQL StatefulSet

## What you'll learn
- PostgreSQL as a StatefulSet with persistent storage
- Storing DB credentials in a Secret
- Injecting secrets into StatefulSet pods
- Headless Service for stable pod DNS

## Instructions
Complete `exercise/manifest.yaml` — a production-style PostgreSQL StatefulSet.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get statefulset postgres
kubectl get pvc

# Connect to the DB:
kubectl exec -it postgres-0 -- psql -U myuser -d mydb
# \l   (list databases)
# \q   (quit)
kubectl delete -f exercise/manifest.yaml
```
