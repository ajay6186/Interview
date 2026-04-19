# Exercise 2.1 — Secrets

## What you'll learn
- Creating Secrets (Opaque, docker-registry)
- Base64 encoding of secret values
- Injecting secrets as env vars and volume mounts
- Why Secrets ≠ encryption (and what to do about it)

## Instructions
Complete `exercise/` so that:
1. `secret.yaml` — Secret `db-secret` with:
   - `DB_USER=admin`
   - `DB_PASSWORD=s3cur3pass`
   *(values must be base64-encoded in the YAML)*
2. `deployment.yaml` — Deployment that reads both keys as env vars

## Apply & Verify
```bash
vagrant ssh master

# Encode values first
echo -n "admin" | base64        # YWRtaW4=
echo -n "s3cur3pass" | base64   # czNjdXIzcGFzcw==

kubectl apply -f /vagrant/phase-2-intermediate/01-secrets/exercise/
kubectl get secret db-secret
kubectl describe secret db-secret   # values are hidden

# Verify env vars
kubectl exec -it $(kubectl get pod -l app=db-app -o name | head -1) -- env | grep DB_

# Decode a secret value
kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# Cleanup
kubectl delete -f /vagrant/phase-2-intermediate/01-secrets/exercise/
```

## Key concepts
- Secret values are base64-encoded (NOT encrypted) by default
- `kubectl describe` hides values; `kubectl get -o yaml` reveals base64
- For production: enable etcd encryption at rest + use Sealed Secrets or Vault
- `stringData` field accepts plain text (Kubernetes encodes it automatically)
