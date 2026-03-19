# Exercise 4.5 — Debug Tricks

## What you'll learn
- Use `helm template` to render templates locally without a cluster
- Use `helm lint` to catch template errors
- Use `helm install --dry-run --debug` to simulate a release
- Use `helm get manifest` to inspect what's deployed
- Find and fix common template bugs

## Instructions
The `exercise/` chart has **5 intentional bugs**. Use debug commands to find and fix them all.

## Debug commands
```bash
# Render templates locally (no cluster needed)
helm template my-app exercise/

# Lint the chart for errors and warnings
helm lint exercise/

# Simulate install with full debug output (requires cluster)
helm install my-app exercise/ --dry-run --debug

# After install: inspect what was actually deployed
helm get manifest my-app
helm get values my-app

# Check template rendering for a specific file
helm template my-app exercise/ --show-only templates/deployment.yaml

# Pass values during template render
helm template my-app exercise/ --set replicaCount=3

# Enable verbose output
helm template my-app exercise/ --debug 2>&1 | head -50
```

## Key concepts
- `helm template` — renders manifests locally; catches syntax errors
- `helm lint` — validates chart structure and best practices
- `--dry-run --debug` — server-side validation + rendered output
- `helm get manifest` — shows exactly what Helm deployed
- Common bugs: wrong indentation, missing `quote`, undefined values, wrong apiVersion
