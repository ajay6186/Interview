# Exercise 3.4 — Resource Limits

## What you'll learn
- Setting CPU and memory limits in docker-compose
- `deploy.resources` configuration
- Monitoring with `docker stats`
- Protecting the host from runaway containers

## Instructions
Complete `exercise/docker-compose.yml`:
- `web`: max 256MB RAM, 0.5 CPU
- `db`: max 512MB RAM, 1 CPU

## Verify
```bash
cd exercise
docker compose up -d
docker stats    # Watch MEM USAGE/LIMIT and CPU %
docker compose down
```
