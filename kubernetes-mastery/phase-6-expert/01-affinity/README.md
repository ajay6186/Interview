# Exercise 6.1 — Node and Pod Affinity

## What you'll learn
- `nodeAffinity`: schedule pods on specific nodes based on node labels
- `podAffinity`: schedule pods NEAR other pods (same node/zone)
- `podAntiAffinity`: spread pods AWAY from each other (high availability)
- Required vs preferred rules

## Instructions
Complete `exercise/manifest.yaml` with affinity rules.

## Verify
```bash
# Label a node first:
kubectl label node <your-node-name> disktype=ssd

kubectl apply -f exercise/manifest.yaml
kubectl get pods -o wide
# Notice which node each pod landed on

kubectl describe pod affinity-demo
# Look for: Node-Selectors, Tolerations, Affinity sections

kubectl delete -f exercise/manifest.yaml
kubectl label node <your-node-name> disktype-
```

## Key concepts
- `requiredDuringSchedulingIgnoredDuringExecution`: HARD rule — pod stays Pending if no match
- `preferredDuringSchedulingIgnoredDuringExecution`: SOFT rule — best effort
- Anti-affinity spreads replicas across nodes → survives node failure
- `topologyKey: kubernetes.io/hostname` = spread per node
- `topologyKey: topology.kubernetes.io/zone` = spread per availability zone
