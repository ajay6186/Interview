# Exercise 4.4 — Blue/Green Deployment

## What you'll learn
- Blue/green: two identical environments, one active
- Zero-downtime deployments by switching Nginx upstream
- Nginx upstream blocks for load balancing

## Instructions
1. Complete `exercise/nginx.conf` pointing to blue by default
2. Switch to green by updating nginx.conf and reloading

## Verify
```bash
cd exercise
docker compose up -d
curl http://localhost:8080    # Blue version

# Switch to green (edit nginx.conf, change server to green:3000):
docker compose exec nginx nginx -s reload
curl http://localhost:8080    # Green version!

docker compose down
```
