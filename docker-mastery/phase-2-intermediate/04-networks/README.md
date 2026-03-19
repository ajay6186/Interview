# Exercise 2.4 — Docker Networks

## What you'll learn
- Custom bridge networks for service isolation
- Services on different networks cannot communicate
- `networks:` key in docker-compose
- Network aliases

## Instructions
Complete `exercise/docker-compose.yml`:
1. Create networks `frontend` and `backend`
2. `web` → frontend only
3. `api` → both frontend AND backend
4. `db` → backend only (isolated from web)

## Verify
```bash
cd exercise
docker compose up -d
docker compose exec api ping web    # Should work (same frontend network)
docker compose exec web ping db     # Should FAIL (different networks)
docker compose down
```

## Key concepts
- Default compose network: all services can reach each other
- Custom networks: services only see each other if on the same network
- `api` on both networks = acts as a bridge between tiers
