# Exercise 5.5 — Multi-Tenant RBAC

## What you'll learn
- RBAC pattern for multiple teams sharing one cluster
- Each team gets a namespace + ServiceAccount + Role
- ClusterRole for read-only cluster-wide access
- `kubectl auth can-i` for permission testing

## Instructions
Complete `exercise/manifest.yaml` — set up two teams (team-a, team-b) with isolated RBAC.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# team-a developer can manage pods in team-a:
kubectl auth can-i create pods -n team-a --as=system:serviceaccount:team-a:team-a-developer
# yes

# team-a developer cannot access team-b:
kubectl auth can-i get pods -n team-b --as=system:serviceaccount:team-a:team-a-developer
# no

# Both teams can read nodes (ClusterRole):
kubectl auth can-i get nodes --as=system:serviceaccount:team-a:team-a-developer
# yes

kubectl delete -f exercise/manifest.yaml
```
