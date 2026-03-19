# Exercise 4.5 — Docker Compose Watch

## What you'll learn
- `docker compose watch` (Docker Compose 2.22+ / Docker Desktop 4.24+)
- `develop.watch` configuration for hot reload without bind mounts
- `sync` action: copy changed files to container
- `rebuild` action: rebuild image when key files change

## Instructions
Complete `exercise/docker-compose.yml` with a `develop.watch` config.

## Verify
```bash
cd exercise
docker compose watch
# Edit src/index.js — changes sync automatically!
# Edit package.json — triggers a rebuild!
```
