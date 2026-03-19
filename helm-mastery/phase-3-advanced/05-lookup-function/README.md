# Exercise 3.5 — The lookup Function

## What you'll learn
- `lookup`: query the live Kubernetes cluster from within a template
- Check if a resource already exists before creating it
- Read cluster state to make decisions (existing secrets, etc.)
- Limitations of lookup (only works with `helm install/upgrade`, not `helm template`)

## Instructions
Complete `exercise/templates/secret.yaml` — only create a secret if one doesn't exist.

## Verify
```bash
helm install my-release exercise/
# First install: secret created

helm upgrade my-release exercise/
# Upgrade: existing secret is preserved (not overwritten)

kubectl get secret my-release-app-secret -o yaml
helm uninstall my-release
```

## Key concepts
- `lookup "v1" "Secret" "namespace" "name"` — returns the resource or empty dict
- Empty dict is falsy: `if not (lookup ...)` → doesn't exist
- Use case: generate a random password on first install, keep it on upgrades
- `randAlphaNum 32` — generate a random alphanumeric string
- Lookup only runs during live cluster operations (not `helm template`)
