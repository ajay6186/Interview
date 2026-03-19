# Exercise 5.3 — Deploy to Kubernetes

## What you'll learn
- Use `kubectl` inside a Jenkins pipeline
- Apply Kubernetes manifests from a pipeline
- Update a Deployment image tag dynamically
- Use kubeconfig credentials in Jenkins

## Instructions
Complete `exercise/Jenkinsfile` — build a Docker image, push it, then deploy to Kubernetes by updating the Deployment image.

## Verify
```bash
# After pipeline runs:
kubectl get deployment myapp -o jsonpath='{.spec.template.spec.containers[0].image}'
# Should show: myorg/myapp:<git-sha>
```
