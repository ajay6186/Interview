# Exercise 2.3 — Lifecycle Hooks

## What you'll learn
- Helm hooks: run Jobs at specific points in the release lifecycle
- `pre-install`: runs before any resources are created
- `post-upgrade`: runs after an upgrade completes
- `hook-weight`: order multiple hooks
- `hook-delete-policy`: clean up hook resources after completion

## Instructions
Complete `exercise/templates/pre-install-job.yaml` — a Job that runs before install.

## Verify
```bash
helm install my-release exercise/ --debug
# Notice: hook job runs BEFORE the deployment is created

# List hook resources:
kubectl get jobs -l "helm.sh/chart"

# After install, check if hook job completed:
kubectl get job pre-install-hook
kubectl logs job/pre-install-hook

helm uninstall my-release
```

## Key concepts
- `"helm.sh/hook": pre-install` — annotation that makes this a hook
- `"helm.sh/hook-weight": "0"` — lower numbers run first
- `"helm.sh/hook-delete-policy": hook-succeeded` — delete after success
- Hook lifecycle order: pre-install → install → post-install
- Other hooks: pre-upgrade, post-upgrade, pre-delete, post-delete, pre-rollback
