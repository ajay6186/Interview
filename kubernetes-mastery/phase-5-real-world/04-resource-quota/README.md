# Exercise 5.4 — ResourceQuota

## What you'll learn
- ResourceQuota: enforce resource limits per namespace
- Limit total CPU, memory, and object counts in a namespace
- LimitRange: set default requests/limits for containers
- How teams share a cluster with guardrails

## Instructions
Complete `exercise/manifest.yaml` — apply a ResourceQuota to a namespace.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl describe resourcequota team-quota -n team-a
kubectl describe limitrange default-limits -n team-a

# Try to exceed quota (create too many pods):
kubectl -n team-a run pod1 --image=nginx:alpine
kubectl -n team-a run pod2 --image=nginx:alpine
kubectl -n team-a run pod3 --image=nginx:alpine
# 3rd pod should be rejected if quota is max 2

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- ResourceQuota = team/project budget for a namespace
- Exceeding quota → API server rejects new resources
- `requests.cpu`, `requests.memory` = total across all pods in namespace
- `count/pods`, `count/deployments.apps` = object count limits
- LimitRange + ResourceQuota together = complete namespace governance
