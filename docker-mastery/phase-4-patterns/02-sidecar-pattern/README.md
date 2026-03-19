# Exercise 4.2 — Sidecar Pattern

## What you'll learn
- Sidecar: a helper container that runs alongside the main container
- Sharing volumes between containers in the same service group
- Log aggregation sidecar use case
- This is the same pattern Kubernetes uses for sidecars

## Instructions
Complete `exercise/docker-compose.yml`:
- `web` writes logs to a shared volume
- `log-shipper` sidecar reads and forwards those logs

## Verify
```bash
cd exercise
docker compose up
# You should see log-shipper printing web's logs
docker compose down
```
