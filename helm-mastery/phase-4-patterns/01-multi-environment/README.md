# Exercise 4.1 — Multi-Environment Values

## What you'll learn
- Use multiple values files for different environments
- Override base values per environment with `-f`
- Structure charts for dev/staging/prod workflows
- Merge semantics: later `-f` files win

## Instructions
Fill in `exercise/values-dev.yaml`, `exercise/values-staging.yaml`, and `exercise/values-prod.yaml` with appropriate environment-specific overrides.

## Verify
```bash
# Dev deployment
helm template my-app exercise/ -f exercise/values-dev.yaml

# Staging deployment
helm template my-app exercise/ -f exercise/values-staging.yaml

# Production deployment
helm template my-app exercise/ -f exercise/values-prod.yaml

# Combine two files: base + env override (right file wins)
helm install my-app exercise/ -f exercise/values-prod.yaml
```

## Key concepts
- `helm install -f values-prod.yaml` — merge extra values file on top of `values.yaml`
- Multiple `-f` flags are merged left-to-right (rightmost wins)
- `--set key=value` overrides everything (highest priority)
- Environments only override what they need; base `values.yaml` provides defaults
- Never use `latest` tag in production — pin to a specific image version
