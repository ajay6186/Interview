# Exercise 5.2 — Docker CI/CD Pipeline

## What you'll learn
- Full Docker CI/CD: build → test → push → deploy
- Tag images with semantic version from git tag
- Deploy to a remote server via SSH
- Roll back by redeploying the previous image tag

## Instructions
Complete `exercise/Jenkinsfile` — CI/CD pipeline that builds, tests, pushes, and deploys a Docker image.

## Verify
```
Stage: Build     → docker build
Stage: Test      → docker run and execute tests inside container
Stage: Push      → docker push (on main branch only)
Stage: Deploy    → SSH to server, docker pull + docker-compose up (on main branch only)
```
