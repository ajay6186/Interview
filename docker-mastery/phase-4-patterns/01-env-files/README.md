# Exercise 4.1 — Environment Files (.env)

## What you'll learn
- `.env` file is automatically loaded by Docker Compose
- `env_file:` to load env vars from a specific file
- Keeping secrets out of `docker-compose.yml`
- `.env` vs `.env.example` pattern

## Instructions
Complete `exercise/docker-compose.yml` to load env vars from `.env.db` for the database service.

## Verify
```bash
cd exercise
docker compose up -d
docker compose exec db env | grep POSTGRES
docker compose down
```
