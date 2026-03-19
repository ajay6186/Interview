# Exercise 1.3 — Namespaces

## What you'll learn
- Namespaces for logical isolation within a cluster
- Creating resources in a specific namespace
- Cross-namespace DNS: `service.namespace.svc.cluster.local`
- Default namespaces: `default`, `kube-system`, `kube-public`

## Instructions
Complete `exercise/manifest.yaml` to create a namespace and deploy into it.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# List namespaces:
kubectl get namespaces

# List pods in the staging namespace:
kubectl get pods -n staging

# Compare: default namespace (empty unless you deployed there):
kubectl get pods

# Clean up:
kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- All resources (except Nodes, PersistentVolumes) are namespace-scoped
- `kubectl` defaults to the `default` namespace — use `-n NAME` or set context
- Namespace isolation is soft (network policies needed for network isolation)
- Change default namespace: `kubectl config set-context --current --namespace=staging`
