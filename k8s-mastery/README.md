# Kubernetes Mastery

30 hands-on exercises across 6 phases — Beginner to Expert.

## How to use
1. Read the `README.md` inside each exercise folder
2. Edit files in `exercise/` to complete the TODOs
3. Apply: `kubectl apply -f exercise/`
4. Check `solution/` when you're stuck

## Prerequisites
- kubectl installed and configured
- A local cluster: minikube, kind, or Docker Desktop Kubernetes

## Quick Start
```bash
minikube start
kubectl apply -f phase-1-fundamentals/01-pod/exercise/
kubectl get all
kubectl delete -f phase-1-fundamentals/01-pod/exercise/
```

## Phases
| Phase | Topic | Exercises |
|-------|-------|-----------|
| 1 | Fundamentals | Pod, Deployment, Service, Namespace, ConfigMap |
| 2 | Intermediate | Secrets, PV/PVC, Ingress, Resource Limits, Health Probes |
| 3 | Advanced | StatefulSet, DaemonSet, Jobs/CronJobs, RBAC, NetworkPolicies |
| 4 | Patterns | Sidecar, Init Containers, Blue/Green, Canary, HPA |
| 5 | Real World | Microservices, PostgreSQL, Redis, Multi-tier, Monitoring |
| 6 | Expert | CRDs, PodDisruptionBudget, ResourceQuota, Taints, GitOps |
