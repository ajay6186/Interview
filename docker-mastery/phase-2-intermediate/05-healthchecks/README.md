# Exercise 2.5 — Health Checks

## What you'll learn
- `HEALTHCHECK` Dockerfile instruction
- `healthcheck:` in docker-compose
- `depends_on` with `condition: service_healthy`
- `docker ps` shows health status: healthy / unhealthy / starting

## Instructions
1. Add a `HEALTHCHECK` to `exercise/Dockerfile`
2. Complete `exercise/docker-compose.yml` so `api` only starts when `web` is healthy

## Verify
```bash
cd exercise
docker compose up
docker ps    # Look for "(healthy)" in STATUS column
```

## Key concepts
- Health check runs inside the container (the CMD must be available)
- `--start-period`: grace period before Docker checks health
- `condition: service_healthy`: stronger than `depends_on` — waits for health check to pass
