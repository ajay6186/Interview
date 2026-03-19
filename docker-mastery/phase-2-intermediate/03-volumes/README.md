# Exercise 2.3 — Volumes and Bind Mounts

## What you'll learn
- **Named volumes**: managed by Docker, persist between container restarts
- **Bind mounts**: map a host directory into the container (hot reload in dev)
- `docker volume create`, `docker volume ls`, `docker volume inspect`
- Declaring volumes at the top level in docker-compose

## Instructions
Complete `exercise/docker-compose.yml`:
1. Add a named volume `db-data` for PostgreSQL data persistence
2. Add a bind mount for web: `./web` → `/app` (for hot reload)

## Verify
```bash
cd exercise
docker compose up -d
docker compose down
docker compose up -d    # PostgreSQL data persists!
docker volume ls        # See db-data volume
```

## Key concepts
- `db-data:/var/lib/postgresql/data` = named volume (Docker manages it)
- `./web:/app` = bind mount (host path → container path)
- Named volumes persist even after `docker compose down`
- Use `docker compose down -v` to also remove volumes
