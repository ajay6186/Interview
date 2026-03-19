# Exercise 5.5 — Full Stack Application

## What you'll learn
- Composing a full stack: Nginx + Node.js API + PostgreSQL + Redis
- Network segmentation (public-facing vs internal networks)
- Combining everything from phase 5 into one Compose file

## Instructions
Complete `exercise/docker-compose.yml` — wire up all four services together.

## Architecture
```
Client → Nginx (port 8080) → Node.js API → PostgreSQL
                                         → Redis
```

## Verify
```bash
cd exercise
docker compose up -d
curl http://localhost:8080/health
# {"status":"ok"}
curl http://localhost:8080
# Full stack response with DB + cache status
docker compose ps
docker compose down -v
```

## Key concepts
- Nginx is the only service exposed to the host (single entry point)
- API service talks to db and redis by service name
- Two networks: `frontend` (nginx↔api) and `backend` (api↔db, api↔redis)
- Only the api is on both networks — db and redis are isolated from nginx
