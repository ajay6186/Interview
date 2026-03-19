# Exercise 3.3 — Docker Compose Profiles

## What you'll learn
- `profiles:` key assigns services to named groups
- Services without a profile always start
- `docker compose --profile tools up` to start optional services
- Use case: optional admin UIs, debuggers, seeders

## Instructions
Complete `exercise/docker-compose.yml`:
- `web` and `db` always start (no profile)
- `adminer` only with profile `tools`
- `seeder` only with profile `dev`

## Verify
```bash
cd exercise
docker compose up                         # Only web + db
docker compose --profile tools up         # web + db + adminer
docker compose --profile dev up           # web + db + seeder
docker compose --profile tools --profile dev up  # all
```
