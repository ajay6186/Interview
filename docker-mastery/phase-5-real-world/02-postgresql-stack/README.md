# Exercise 5.2 — PostgreSQL Stack

## What you'll learn
- Connecting a web service to PostgreSQL in Compose
- Named volumes for database persistence
- Environment variables for database credentials
- `depends_on` to control startup order

## Instructions
Complete `exercise/docker-compose.yml` to connect the web app to PostgreSQL.

## Verify
```bash
cd exercise
docker compose up -d
docker compose logs web
# Should show: Connected to database
curl http://localhost:3000
# Should show: DB status: connected

docker compose down           # stops containers (data persists)
docker compose down -v        # stops AND deletes the volume (data gone)
```

## Key concepts
- Services communicate by service name (e.g., `db` resolves to the postgres container IP)
- Named volumes (`postgres_data`) outlive containers — data is not lost on restart
- `depends_on` only waits for container start, not for postgres to be ready
  - Use a health check + `condition: service_healthy` for true readiness (exercise 2.5)
