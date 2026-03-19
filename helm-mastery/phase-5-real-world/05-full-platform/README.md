# Exercise 5.5 — Full Platform Chart

## What you'll learn
- Combine all previous patterns into one production-grade umbrella chart
- Manage frontend, backend, database, ingress, and monitoring together
- Use per-environment values files for the full stack
- Practice reading and modifying a complex chart

## Instructions
The `exercise/` chart has TODOs scattered across multiple templates. Complete them all to produce a working full-platform chart.

## Verify
```bash
# Render the full platform
helm template my-platform exercise/

# Render for production
helm template my-platform exercise/ -f exercise/values-prod.yaml

# Count resources rendered
helm template my-platform exercise/ | grep "^kind:" | sort | uniq -c

# Install
helm install my-platform exercise/ -f exercise/values-prod.yaml
kubectl get all -l app.kubernetes.io/instance=my-platform
```

## Key concepts
- A real platform chart manages 10+ Kubernetes resources
- `_helpers.tpl` is essential for DRY label/selector definitions
- Each subsystem (frontend, backend, db) should be toggleable via `enabled: true/false`
- Production values override dev defaults: replicas, resources, image tags, TLS
