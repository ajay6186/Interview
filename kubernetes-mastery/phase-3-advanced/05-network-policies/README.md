# Exercise 3.5 — Network Policies

## What you'll learn
- NetworkPolicy: firewall rules for pod-to-pod communication
- Ingress rules: control which pods can SEND traffic to this pod
- Egress rules: control which external destinations this pod can reach
- Default deny policy: block all traffic, then whitelist what's needed

## Prerequisites
Requires a CNI plugin that supports NetworkPolicy (Calico, Cilium, etc.).
With minikube: `minikube start --cni=calico`

## Instructions
Complete `exercise/manifest.yaml` with NetworkPolicy rules.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# Test: api pod CAN reach db pod
kubectl exec -it $(kubectl get pod -l app=api -o name) -- wget -qO- db-service

# Test: frontend pod CANNOT reach db pod directly (should timeout)
kubectl exec -it $(kubectl get pod -l app=frontend -o name) -- wget -qO- --timeout=5 db-service

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Default: all traffic allowed (until you apply a NetworkPolicy)
- `podSelector: {}` (empty) = select ALL pods in the namespace
- `namespaceSelector`: allow traffic from pods in specific namespaces
- Stack multiple policies: they are additive (OR logic)
- `policyTypes: [Ingress, Egress]`: specify which directions to control
