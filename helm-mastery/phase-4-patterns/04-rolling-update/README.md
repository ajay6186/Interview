# Exercise 4.4 — Rolling Update Strategy

## What you'll learn
- Configure `RollingUpdate` strategy with `maxSurge` and `maxUnavailable`
- Use `helm upgrade` to trigger a rolling update
- Use `helm rollback` to revert a bad release
- Add `checksum/config` annotation to trigger pod restarts on ConfigMap changes

## Instructions
Complete `exercise/templates/deployment.yaml` with a proper rolling update strategy, then complete `exercise/templates/configmap.yaml` to trigger automatic pod restarts when config changes.

## Verify
```bash
# Install the chart
helm install my-app exercise/

# Trigger a rolling update by upgrading
helm upgrade my-app exercise/ --set image.tag=2.0.0

# Watch the rollout
kubectl rollout status deployment/my-app-app

# Simulate a bad upgrade
helm upgrade my-app exercise/ --set image.tag=broken

# Roll back to previous release
helm rollback my-app 2

# View release history
helm history my-app
```

## Key concepts
- `strategy.type: RollingUpdate` — default; replaces pods gradually
- `maxSurge: 1` — max extra pods during update (can be % like "25%")
- `maxUnavailable: 0` — max pods that can be down during update
- `checksum/config` annotation — forces pod restart when ConfigMap data changes
- `helm rollback <release> <revision>` — revert to a previous release
- `helm history` — see all revisions of a release
