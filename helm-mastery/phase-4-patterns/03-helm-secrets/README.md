# Exercise 4.3 — Helm Secrets Pattern

## What you'll learn
- Why secrets should never live in `values.yaml` or chart files
- Reference pre-existing Kubernetes Secrets from pod environment variables
- Use `secretKeyRef` with `valueFrom` in deployments
- Safe secret delivery patterns for production

## Instructions
Complete `exercise/templates/deployment.yaml` to reference environment variables from pre-existing Kubernetes Secrets (not hardcoded values).

## Verify
```bash
# Create the secrets separately (out-of-band from Helm)
kubectl create secret generic myapp-db-credentials \
  --from-literal=db-password=supersecret \
  --from-literal=db-host=postgres:5432

kubectl create secret generic myapp-api-credentials \
  --from-literal=api-key=myapikey123

# Install the chart that references those secrets
helm install my-app exercise/ \
  --set secrets.dbSecretName=myapp-db-credentials \
  --set secrets.apiSecretName=myapp-api-credentials

# Verify env vars are wired up
kubectl exec deploy/my-app-app -- env | grep -E "DB_|API_"
```

## Key concepts
- **Never** store actual secret values in `values.yaml` — they end up in Helm release history in plain text
- Pattern 1: `--set db.password=secret` at install time (stored in Helm history — avoid for sensitive data)
- Pattern 2: Reference pre-existing Kubernetes Secrets via `secretKeyRef` (preferred)
- Pattern 3: External Secrets Operator / Vault Agent for production (syncs from secret manager)
- `optional: true` on a `secretKeyRef` — pod starts even if the key doesn't exist
