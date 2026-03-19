# Exercise 3.1 — DaemonSets

## What you'll learn
- DaemonSet: runs exactly one pod per node (automatically)
- Use cases: log collectors, monitoring agents, node-level networking
- How DaemonSets differ from Deployments
- Tolerations to run on control-plane nodes

## Instructions
Complete `exercise/manifest.yaml` to create a DaemonSet.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get daemonset
kubectl get pods -l app=log-collector -o wide
# Notice: one pod per node

# DaemonSet automatically adds pods when new nodes join
kubectl describe daemonset log-collector

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- `replicas` field does NOT exist on DaemonSet (one per node, always)
- DaemonSet respects node taints — add tolerations to run on tainted nodes
- `updateStrategy.type: RollingUpdate` — replaces pods one node at a time
- Common real-world uses: Fluentd, Datadog agent, Prometheus node-exporter, Cilium CNI
