# Exercise 4.1 — Multibranch Pipeline

## What you'll learn
- Write a Jenkinsfile that behaves differently per branch
- Feature branches: build + test only
- Main branch: build + test + deploy staging
- Release branches: build + test + deploy staging + prod approval

## Instructions
Complete `exercise/Jenkinsfile` — the same file handles all branch types via `when` conditions.

## Verify
```bash
# Simulate different branches with BRANCH_NAME env var:
# feature/* → Build + Test only
# main       → Build + Test + Deploy Staging
# release/*  → Build + Test + Deploy Staging + Deploy Prod (with approval)
```

## Key concepts
- `env.BRANCH_NAME` — available in Multibranch Pipeline jobs
- `when { branch 'main' }` — match exact branch name
- `when { branch 'release/*' }` — wildcard branch matching
- A single Jenkinsfile handles all branches — no duplication
- Multibranch Pipeline auto-discovers branches and creates a job per branch
