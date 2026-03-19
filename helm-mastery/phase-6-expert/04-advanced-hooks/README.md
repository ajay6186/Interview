# Exercise 6.4 — Advanced Hooks

## What you'll learn
- Use multiple hooks in the same chart (pre-install, post-install, pre-upgrade, pre-delete)
- Control hook execution order with `hook-weight`
- Clean up hook resources with `hook-delete-policy`
- Run database migrations as a pre-upgrade Job

## Instructions
Complete `exercise/templates/` to add a pre-upgrade database migration Job and a post-install notification Job.

## Verify
```bash
helm install my-app exercise/

# Check that post-install hook ran
kubectl get jobs -l helm.sh/chart=advanced-hooks

helm upgrade my-app exercise/ --set image.tag=2.0.0

# Check that pre-upgrade migration ran
kubectl get jobs
kubectl logs job/my-app-db-migrate
```

## Key concepts
- `helm.sh/hook: pre-upgrade` — runs before the upgrade manifests are applied
- `helm.sh/hook-weight: "-5"` — lower weight runs first (negative weights run early)
- `helm.sh/hook-delete-policy: before-hook-creation` — delete old Job before creating a new one
- `helm.sh/hook-delete-policy: hook-succeeded` — delete Job after it succeeds
- Multiple hooks can run in the same lifecycle event, ordered by weight
- Hook Jobs must complete successfully or the release fails (unless `--no-hooks` is passed)
