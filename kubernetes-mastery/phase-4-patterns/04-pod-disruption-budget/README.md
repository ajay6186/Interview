# Exercise 4.4 — PodDisruptionBudget

## What you'll learn
- PodDisruptionBudget (PDB): guarantees availability during voluntary disruptions
- `minAvailable`: minimum pods that must remain available
- `maxUnavailable`: maximum pods that can be disrupted at once
- Voluntary vs involuntary disruptions

## Instructions
Complete `exercise/manifest.yaml` to protect a Deployment with a PDB.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

kubectl get pdb
# Shows minAvailable, maxUnavailable, ALLOWED, DISRUPTIONS

# Simulate a node drain (voluntary disruption):
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
# PDB prevents draining if it would violate the budget

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- **Voluntary disruptions**: node drain, cluster upgrade, manual pod delete
- **Involuntary disruptions**: hardware failure, kernel panic (PDB doesn't help here)
- Use PDB for deployments with multiple replicas in production
- `minAvailable: "80%"` = at least 80% of pods must be up (percentage string)
- `maxUnavailable: 1` = at most 1 pod can be down at once
