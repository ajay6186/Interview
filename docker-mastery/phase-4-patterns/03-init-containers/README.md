# Exercise 4.3 — Init Containers Pattern

## What you'll learn
- Simulating Kubernetes init containers with docker-compose
- `depends_on` with `condition: service_completed_successfully`
- Running one-off setup tasks before the app starts
- DB migration before app boot

## Instructions
Complete `exercise/docker-compose.yml`:
- `db-migrate` runs after `db` is healthy
- `web` starts only after `db-migrate` completes successfully

## Verify
```bash
cd exercise
docker compose up
# Order: db → db-migrate → web
docker compose down
```
