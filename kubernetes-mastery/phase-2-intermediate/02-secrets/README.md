# Exercise 2.2 — Secrets

## What you'll learn
- Storing sensitive data in Kubernetes Secrets
- `stringData` (plaintext) vs `data` (base64-encoded)
- Injecting secrets as env vars and as volume-mounted files
- Why Secrets are not truly secret by default (and what to use instead)

## Instructions
Complete `exercise/manifest.yaml` — create a Secret and consume it.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml

# View the secret (base64 encoded):
kubectl get secret db-secret -o yaml

# Decode a value:
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d

# Check env var in pod:
kubectl exec deploy/app -- printenv DB_PASSWORD

# Check file mount:
kubectl exec deploy/app -- cat /etc/secrets/password

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- `stringData:` — write plain text; Kubernetes base64-encodes it on save
- `data:` — must provide already base64-encoded values
- Secrets are base64-encoded but NOT encrypted by default
- For real security: enable EncryptionConfiguration or use External Secrets Operator
- Mounted as files is safer than env vars (less likely to appear in logs/crash dumps)
