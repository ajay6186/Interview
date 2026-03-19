# Exercise 3.2 — docker-compose.override.yml

## What you'll learn
- Docker Compose automatically merges `docker-compose.override.yml` with `docker-compose.yml`
- Override file: add dev-only settings without touching the base file
- Use `-f` to select specific files (for production)

## Instructions
Given `docker-compose.yml` (production base), complete `docker-compose.override.yml` for development:
1. Override `NODE_ENV` to `development`
2. Add a bind mount for hot reload
3. Add debug port 9229

## Verify
```bash
cd exercise
# Development (merges both files automatically):
docker compose up

# Production only:
docker compose -f docker-compose.yml up
```
