# Exercise 5.3 — Nginx Reverse Proxy

## What you'll learn
- Using Nginx as a reverse proxy in front of a Node.js app
- Mounting a custom `nginx.conf` into the Nginx container
- `proxy_pass` directive to forward requests upstream
- Setting proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-For`)

## Instructions
1. Complete `exercise/nginx.conf` with the proxy configuration
2. Complete `exercise/docker-compose.yml` to mount the config and wire services

## Verify
```bash
cd exercise
docker compose up -d
curl http://localhost:8080
# Should show response from the Node.js app (proxied through Nginx)
curl -I http://localhost:8080
# Headers should show nginx as server
docker compose down
```

## Key concepts
- Nginx terminates client connections and opens new ones to the upstream
- Services communicate by name: `proxy_pass http://app:3000`
- The app does NOT expose ports to the host — only Nginx does
- Proxy headers tell the app the original client IP and host
