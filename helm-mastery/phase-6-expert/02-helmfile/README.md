# Exercise 6.2 — Helmfile

## What you'll learn
- Use Helmfile to manage multiple Helm releases declaratively
- Define releases, repositories, and environments in `helmfile.yaml`
- Use Helmfile environments for dev/staging/prod
- Sync, diff, and destroy with Helmfile

## Instructions
Complete `exercise/helmfile.yaml` to declare three releases (frontend, backend, database) with environment-specific overrides.

## Verify
```bash
# Install helmfile: https://github.com/helmfile/helmfile

# Preview what will be applied
helmfile diff

# Apply all releases
helmfile sync

# Apply only one release
helmfile sync --selector name=backend

# Render manifests without applying
helmfile template

# Tear down all releases
helmfile destroy
```

## Key concepts
- `helmfile.yaml` — single file declaring all Helm releases for an environment
- `releases:` — list of Helm releases with chart, values, namespace
- `environments:` — define per-environment value overrides
- `repositories:` — Helm chart repos to add (replaces `helm repo add`)
- `helmfile sync` — equivalent to `helm install` or `helm upgrade --install`
- `helmfile diff` — uses helm-diff plugin to show pending changes
