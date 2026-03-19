# Exercise 1.1 — Your First Pod

## What you'll learn
- The structure of a Kubernetes manifest (apiVersion, kind, metadata, spec)
- How to define a Pod with a single container
- `kubectl apply`, `kubectl get`, `kubectl describe`, `kubectl logs`

## Instructions
Complete `exercise/manifest.yaml` to create a simple nginx Pod.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get pod my-first-pod
kubectl describe pod my-first-pod
kubectl logs my-first-pod
kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Every manifest needs: `apiVersion`, `kind`, `metadata`, `spec`
- `apiVersion: v1` for core resources (Pod, Service, ConfigMap, Secret)
- `apiVersion: apps/v1` for workload resources (Deployment, ReplicaSet, etc.)
- Pods are ephemeral — for production use Deployments (exercise 1.4)
- `containerPort` is documentation only — it doesn't publish the port
