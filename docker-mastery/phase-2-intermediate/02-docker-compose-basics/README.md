# Exercise 2.2 — Docker Compose Basics

## What you'll learn
- `docker-compose.yml` structure: version, services
- `image`, `build`, `ports`, `environment`, `depends_on`
- `docker compose up` / `docker compose down`
- Service names act as hostnames inside the compose network

## Instructions
Complete `exercise/docker-compose.yml` to run a Node.js app + Redis:
1. `web` service: build from `./web`, port 3000:3000, depends on `redis`
2. `redis` service: use `redis:7-alpine`, port 6379:6379

## Verify
```bash
cd exercise
docker compose up
# Visit http://localhost:3000 — shows visit count from Redis
docker compose down
```

## Key concepts
- In Docker Compose, service names are DNS hostnames
- `web` can reach `redis` at `redis:6379` (not localhost!)
- `depends_on` starts `redis` before `web` (but doesn't wait for healthy)
