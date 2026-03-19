# Exercise 1.4 — Deployments

## What you'll learn
- Deployment: manages a ReplicaSet which manages Pods
- Rolling updates: zero-downtime updates by gradually replacing pods
- Self-healing: Deployment recreates crashed pods automatically
- Scaling: change replicas up/down

## Instructions
Complete `exercise/manifest.yaml` to create a Deployment with 3 replicas.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get deployments
kubectl get pods -l app=nginx-app

# Watch rolling update:
kubectl set image deployment/nginx-deployment nginx=nginx:1.25
kubectl rollout status deployment/nginx-deployment

# Scale:
kubectl scale deployment nginx-deployment --replicas=5
kubectl get pods

# Kill a pod — watch it get recreated:
kubectl delete pod <pod-name>
kubectl get pods

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- `selector.matchLabels` MUST match `template.metadata.labels`
- `strategy.type: RollingUpdate` — replaces pods gradually (default)
- `strategy.type: Recreate` — kills all pods then recreates (causes downtime)
- `maxSurge` / `maxUnavailable` control rolling update speed
