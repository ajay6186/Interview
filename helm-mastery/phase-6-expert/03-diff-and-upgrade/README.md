# Exercise 6.3 — Diff and Upgrade

## What you'll learn
- Use `helm-diff` plugin to preview changes before upgrading
- Perform safe upgrades with review
- Use `helm history` and `helm rollback`
- Understand atomic upgrades and timeouts

## Instructions
Install the chart at v1, then upgrade to v2 using `helm-diff` to preview changes first.

## Verify
```bash
# Install helm-diff plugin
helm plugin install https://github.com/databus23/helm-diff

# Install v1 of the chart
helm install my-app exercise/v1/

# Preview what upgrade to v2 will change
helm diff upgrade my-app exercise/v2/

# Apply the upgrade
helm upgrade my-app exercise/v2/

# Atomic upgrade (auto-rollback on failure)
helm upgrade my-app exercise/v2/ --atomic --timeout 5m

# Show release history
helm history my-app

# Roll back to revision 1
helm rollback my-app 1
```

## Key concepts
- `helm diff upgrade` — shows a diff of what will change (like `git diff`)
- `--atomic` — automatically rolls back if the upgrade fails
- `--timeout` — how long to wait for pods to become ready
- `helm history` — lists all revisions of a release
- `helm rollback <release> <revision>` — revert to a specific revision
- Always `helm diff` before `helm upgrade` in production
