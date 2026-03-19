# Exercise 5.5 — GitOps Pipeline

## What you'll learn
- Implement a GitOps workflow from Jenkins
- Build + push image, then update the image tag in a GitOps config repo
- Commit and push the tag change so ArgoCD/Flux picks it up
- Separate the CI pipeline (build) from the CD pipeline (deploy)

## Instructions
Complete `exercise/Jenkinsfile` — after building and pushing the image, update the image tag in a separate config repo and commit it.

## Verify
```
Stage: Build+Push → builds myapp:abc1234, pushes to registry
Stage: Update GitOps → clones config repo, updates image tag, commits, pushes
ArgoCD/Flux detects the commit and deploys the new image automatically
```

## Key concepts
- GitOps: the desired state (image tag) lives in Git, not in the pipeline
- The pipeline only changes the tag in Git — it does not `kubectl apply` directly
- ArgoCD / Flux watches the config repo and auto-syncs to the cluster
- Separate CI repo (app code) from CD repo (k8s manifests / Helm values)
