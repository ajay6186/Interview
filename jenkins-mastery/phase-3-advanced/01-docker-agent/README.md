# Exercise 3.1 — Docker Agent

## What you'll learn
- Run pipeline steps inside a Docker container
- Use `dockerfile` agent to build and use a custom image
- Mount volumes into the Docker agent
- Use `docker.image().inside {}` in scripted syntax

## Instructions
Complete `exercise/Jenkinsfile` — run build and test steps inside different Docker containers.

## Verify
```
Stage 1: node --version prints v18.x  (inside node:18-alpine)
Stage 2: python --version prints 3.11 (inside python:3.11-slim)
Stage 3: runs using the local Dockerfile
```

## Key concepts
- `agent { docker { image 'node:18-alpine' } }` — spin up container for the stage
- `agent { dockerfile true }` — build Dockerfile in repo root and use it
- `agent { dockerfile { filename 'docker/Dockerfile.ci' } }` — custom Dockerfile path
- `agent { docker { image '...' args '--network host -v /cache:/cache' } }` — extra args
- Each stage gets a fresh container — no state leaks between stages
- Containers are removed automatically after the stage completes
