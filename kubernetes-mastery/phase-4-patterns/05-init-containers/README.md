# Exercise 4.5 — Init Containers

## What you'll learn
- initContainers: run before the main container starts
- Use cases: wait for dependencies, database migrations, fetch secrets
- Init containers run sequentially (one at a time, in order)
- If an init container fails, the pod restarts

## Instructions
Complete `exercise/manifest.yaml` with an init container that waits for a service.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# Watch init container running:
kubectl get pods -w
kubectl describe pod init-demo
# Look for: Init Containers section

# The main app only starts after the init container completes
kubectl logs init-demo -c wait-for-db
kubectl logs init-demo -c app

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Init containers complete before any app container starts
- They run in order: init-1 must complete before init-2 starts
- They share volumes with the main container (great for seeding data)
- Each has its own image — use a lightweight image (busybox, alpine)
- Common patterns: wait for DB, run migrations, fetch config from vault
