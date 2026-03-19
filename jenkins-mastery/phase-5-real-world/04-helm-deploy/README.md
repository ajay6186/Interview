# Exercise 5.4 — Deploy with Helm

## What you'll learn
- Run `helm upgrade --install` from a Jenkins pipeline
- Pass dynamic values (image tag, environment) at deploy time
- Use `helm diff` to preview changes before applying
- Rollback with `helm rollback` on failure

## Instructions
Complete `exercise/Jenkinsfile` — build and push a Docker image, then deploy using Helm.

## Verify
```bash
# After pipeline runs:
helm list -n default
helm get values myapp
kubectl get pods -l app.kubernetes.io/instance=myapp
```
