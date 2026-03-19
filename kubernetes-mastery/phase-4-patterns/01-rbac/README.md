# Exercise 4.1 — RBAC (Role-Based Access Control)

## What you'll learn
- ServiceAccount: identity for pods
- Role: list of permissions (namespace-scoped)
- ClusterRole: list of permissions (cluster-wide)
- RoleBinding: grants a Role to a ServiceAccount

## Instructions
Complete `exercise/manifest.yaml` — create a ServiceAccount with read-only pod access.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# Test permissions as the service account:
kubectl auth can-i get pods --as=system:serviceaccount:default:pod-reader
# Expected: yes

kubectl auth can-i delete pods --as=system:serviceaccount:default:pod-reader
# Expected: no

kubectl auth can-i get deployments --as=system:serviceaccount:default:pod-reader
# Expected: no

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- ServiceAccount = identity for pod processes
- Role = what can be done (verbs) on which resources (resources) in a namespace
- RoleBinding = who (subject) gets the Role
- ClusterRole = same but applies across all namespaces
- ClusterRoleBinding = bind a ClusterRole to a subject cluster-wide
