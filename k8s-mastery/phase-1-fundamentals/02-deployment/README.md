# Exercise 1.2 — Deployment

## What you'll learn
- `Deployment` resource and `spec.replicas`
- `selector.matchLabels` and `template.labels` must match
- Rolling updates and rollback
- `kubectl scale`, `kubectl rollout`

## Instructions
Complete `exercise/deployment.yaml` so that:
1. Creates a Deployment named `nginx-deploy`
2. Runs `3` replicas of `nginx:1.25`
3. Labels pods with `app: nginx`
4. Sets container port to `80`

## Apply & Verify
```bash
vagrant ssh master

kubectl apply -f /vagrant/phase-1-fundamentals/02-deployment/exercise/
kubectl get deployments
kubectl get pods -l app=nginx
kubectl rollout status deployment/nginx-deploy

# Scale up
kubectl scale deployment nginx-deploy --replicas=5
kubectl get pods

# Trigger a rolling update
kubectl set image deployment/nginx-deploy nginx=nginx:1.26
kubectl rollout status deployment/nginx-deploy

# Rollback
kubectl rollout undo deployment/nginx-deploy
kubectl rollout history deployment/nginx-deploy

# Cleanup
kubectl delete -f /vagrant/phase-1-fundamentals/02-deployment/exercise/
```

## Key concepts
- Deployment manages a ReplicaSet, which manages Pods
- `selector.matchLabels` tells the Deployment which Pods it owns
- Rolling update replaces old Pods one by one — zero downtime
- `kubectl rollout undo` reverts to the previous ReplicaSet
