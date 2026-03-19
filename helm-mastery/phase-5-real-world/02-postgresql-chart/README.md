# Exercise 5.2 — PostgreSQL StatefulSet Chart

## What you'll learn
- Package a stateful database as a Helm chart
- Use `volumeClaimTemplates` inside a StatefulSet
- Create a headless Service for stable DNS names
- Manage database credentials as Kubernetes Secrets

## Instructions
Complete the `exercise/` chart to deploy PostgreSQL as a StatefulSet with persistent storage and a headless service.

## Verify
```bash
helm template my-pg exercise/

helm install my-pg exercise/ \
  --set auth.postgresPassword=mysecretpassword

kubectl get statefulset,svc,pvc
kubectl exec -it my-pg-postgresql-0 -- psql -U postgres
```

## Key concepts
- `kind: StatefulSet` — ordered, stable pod identity
- `clusterIP: None` — headless service for StatefulSet DNS (`pod-0.svc.namespace.svc.cluster.local`)
- `volumeClaimTemplates` — each pod gets its own PVC automatically
- `initContainers` — ensure correct permissions on the data directory
- `POSTGRES_PASSWORD` from a Secret via `secretKeyRef`
