# Exercise 3.2 — StatefulSets

## What you'll learn
- StatefulSet: stable network identities and stable persistent storage
- Ordered startup/shutdown (pod-0 first, then pod-1, etc.)
- `volumeClaimTemplates`: each pod gets its own PVC automatically
- Headless Service for stable DNS per pod

## Instructions
Complete `exercise/manifest.yaml` to create a StatefulSet.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get statefulset
kubectl get pods -l app=db -o wide
# Notice: db-0, db-1, db-2 (stable names)

kubectl get pvc
# Notice: data-db-0, data-db-1, data-db-2 (one PVC per pod)

# DNS resolution (from inside a pod):
kubectl exec db-0 -- nslookup db-0.db-headless.default.svc.cluster.local

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Pod names: `statefulset-0`, `statefulset-1`, ... (NOT random like Deployments)
- DNS per pod: `<pod-name>.<headless-service>.<namespace>.svc.cluster.local`
- `volumeClaimTemplates`: K8s creates a PVC per pod — data is isolated per replica
- Headless Service (`clusterIP: None`): no load balancing, just DNS per pod
- Use for: databases, message brokers, distributed systems needing stable identity
