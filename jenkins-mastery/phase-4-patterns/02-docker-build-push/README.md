# Exercise 4.2 — Docker Build and Push

## What you'll learn
- Build a Docker image in a Jenkins pipeline
- Tag the image with the Git commit SHA and branch name
- Push to Docker Hub (or any registry) using stored credentials
- Clean up local images after push

## Instructions
Complete `exercise/Jenkinsfile` — build the sample app Docker image, tag it, and push to a registry.

## Verify
```bash
# Requires Docker Hub credentials stored as "docker-hub-creds" in Jenkins

# After pipeline runs:
docker pull myorg/myapp:latest
docker pull myorg/myapp:<git-commit-sha>
```

## Key concepts
- `sh "docker build -t ${IMAGE}:${TAG} ."` — build with dynamic tag
- `docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-creds')` — DSL
- Tag conventions: `latest`, branch name, commit SHA (e.g., `abc1234`)
- `sh 'docker rmi ${IMAGE}:${TAG}'` — clean up after push to save disk space
- `docker.image('...').push()` — Jenkins Docker plugin DSL (alternative to sh)
