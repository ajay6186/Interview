# Exercise 5.1 — Node.js CI Pipeline

## What you'll learn
- Full Node.js CI: install → lint → test → build → archive
- Run inside a Docker container (no Node.js needed on the agent)
- Publish JUnit test results and code coverage
- Cache npm dependencies with Docker volumes

## Instructions
Complete `exercise/Jenkinsfile` — a production-ready Node.js CI pipeline.

## Verify
```
Stage: Install     → npm ci
Stage: Lint        → npm run lint (ESLint)
Stage: Test        → npm test (with JUnit output)
Stage: Build       → npm run build
Post:  always      → publish test results + archive dist/
```
