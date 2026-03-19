# Exercise 5.4 — Redis Caching

## What you'll learn
- Adding Redis as a caching layer in a Compose stack
- Connecting to Redis from a Node.js service by service name
- Redis named volumes for data persistence
- Using `depends_on` for service ordering

## Instructions
Complete `exercise/docker-compose.yml` to add a Redis service and wire it to the web app.

## Verify
```bash
cd exercise
docker compose up -d
curl http://localhost:3000
# First visit: "Cache MISS — fetched fresh data"
curl http://localhost:3000
# Second visit: "Cache HIT — served from Redis"
docker compose down
```

## Key concepts
- Redis is an in-memory data store — ideal for caching, sessions, queues
- Service name resolution: `redis://redis:6379` (service name = DNS hostname)
- Named volumes on Redis persist data across restarts (optional for a cache)
- For a pure cache, you may skip the volume (data loss on restart is acceptable)
