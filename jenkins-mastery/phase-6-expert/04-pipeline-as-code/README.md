# Exercise 6.4 — Pipeline as Code (Everything Combined)

## What you'll learn
- Combine all patterns: agents, credentials, parallel, matrix, input, notifications
- Structure a complex pipeline cleanly and maintainably
- Use helper functions inside the Jenkinsfile with `def`
- Apply pipeline options: disableConcurrentBuilds, buildDiscarder

## Instructions
Complete `exercise/Jenkinsfile` — a full production pipeline using every technique from Phases 1-5.

## Verify
```
Pipeline has these stages:
1. Build (Docker agent)
2. Quality Gate (parallel: unit tests, lint, security scan)
3. Build Docker Image
4. Push Image (main branch only)
5. Deploy Staging (main branch, auto)
6. Approve Production (main branch, manual with 1h timeout)
7. Deploy Production (main branch, after approval)
```
