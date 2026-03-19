# Kubernetes Mastery

30 hands-on exercises across 6 phases — Beginner to Expert.

## How to use
1. Read the `README.md` inside each exercise folder
2. Edit `exercise/manifest.yaml` to complete the TODOs
3. Apply to your cluster: `kubectl apply -f exercise/manifest.yaml`
4. Verify with the commands listed in each README
5. Check `solution/manifest.yaml` when you're stuck
6. Clean up: `kubectl delete -f exercise/manifest.yaml`

## Prerequisites
- `kubectl` installed
- A running Kubernetes cluster — pick one:
  - `minikube start` (recommended for beginners)
  - `kind create cluster`
  - Docker Desktop → Settings → Kubernetes → Enable

## Quick Reference
```bash
kubectl apply -f file.yaml           # Create/update resources
kubectl get pods                     # List pods
kubectl get all                      # List all resources in namespace
kubectl describe pod <name>          # Detailed info + events
kubectl logs <pod>                   # View pod logs
kubectl exec -it <pod> -- sh         # Shell into pod
kubectl delete -f file.yaml          # Delete resources from file
kubectl get events --sort-by=.lastTimestamp   # Recent events
kubectl explain deployment.spec      # In-terminal API docs
kubectl api-resources                # List all resource types
```

## Phases
| Phase | Topic | Exercises |
|-------|-------|-----------|
| 1 | Fundamentals | Pod, Labels, Namespaces, Deployments, Services |
| 2 | Intermediate | ConfigMap, Secrets, PersistentVolumes, Resources, Probes |
| 3 | Advanced | DaemonSet, StatefulSet, Jobs, Ingress, NetworkPolicy |
| 4 | Patterns | RBAC, SecurityContext, HPA, PodDisruptionBudget, InitContainers |
| 5 | Real World | Node.js stack, PostgreSQL, Ingress TLS, Multi-tenant RBAC, Quotas |
| 6 | Expert | Affinity, Taints/Tolerations, Priority, Kustomize, Monitoring |
