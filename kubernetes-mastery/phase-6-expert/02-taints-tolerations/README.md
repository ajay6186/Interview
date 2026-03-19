# Exercise 6.2 — Taints and Tolerations

## What you'll learn
- Taints: mark a node to repel pods
- Tolerations: allow a pod to be scheduled on a tainted node
- Taint effects: NoSchedule, PreferNoSchedule, NoExecute
- Use case: dedicated nodes for specific workloads

## Instructions
Complete `exercise/manifest.yaml` with tolerations to schedule on a tainted node.

## Verify
```bash
# Taint a node:
kubectl taint node <node-name> dedicated=gpu:NoSchedule

kubectl apply -f exercise/manifest.yaml
# Regular pod should be Pending (can't tolerate taint)
kubectl get pods
kubectl describe pod regular-pod   # Look for "didn't match node selector"

# GPU pod should schedule (has toleration):
kubectl describe pod gpu-pod

# Remove taint:
kubectl taint node <node-name> dedicated=gpu:NoSchedule-

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Taint syntax: `key=value:effect` or `key:effect`
- `NoSchedule`: new pods without toleration won't schedule here
- `PreferNoSchedule`: soft version — scheduler avoids but doesn't block
- `NoExecute`: evicts existing pods + blocks new ones (used for node problems)
- `operator: Exists` in toleration matches any value for the key
