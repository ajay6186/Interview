# Examples 4.4 — Blue-Green Deployments (30 examples)

---

### 1. Blue-green concept
```
Blue  = current live version (v1)
Green = new version (v2)

Steps:
1. Deploy green alongside blue
2. Test green
3. Switch traffic to green (nginx upstream)
4. Remove blue after verification
```

---

### 2. Two app services in compose
```yaml
services:
  app-blue:
    image: my-app:v1
    expose:
      - "3000"

  app-green:
    image: my-app:v2
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

---

### 3. nginx.conf — point to blue
```nginx
upstream backend {
    server app-blue:3000;
}
server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

---

### 4. nginx.conf — switch to green
```nginx
upstream backend {
    server app-green:3000;   # change here to switch traffic
}
server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

---

### 5. Reload nginx without downtime
```bash
docker compose exec nginx nginx -s reload
# Zero-downtime configuration reload
```

---

### 6. Use environment variable to select active slot
```yaml
services:
  nginx:
    image: nginx:alpine
    environment:
      - ACTIVE_SLOT=${ACTIVE_SLOT:-blue}
    volumes:
      - ./nginx.conf.template:/etc/nginx/templates/default.conf.template
```
```bash
ACTIVE_SLOT=green docker compose up -d nginx
```

---

### 7. nginx template with envsubst
```nginx
# nginx.conf.template
upstream backend {
    server app-${ACTIVE_SLOT}:3000;
}
server {
    listen 80;
    location / { proxy_pass http://backend; }
}
```
> nginx:alpine processes `*.template` files with envsubst automatically.

---

### 8. Switch with zero downtime — script
```bash
#!/bin/bash
# deploy-green.sh
docker compose pull app-green
docker compose up -d app-green
# Wait for green to be healthy
until docker compose exec app-green curl -sf http://localhost:3000/health; do
  sleep 2
done
# Switch nginx
ACTIVE_SLOT=green docker compose up -d nginx
docker compose exec nginx nginx -s reload
echo "Switched to green"
```

---

### 9. Rollback script
```bash
#!/bin/bash
# rollback.sh
ACTIVE_SLOT=blue docker compose up -d nginx
docker compose exec nginx nginx -s reload
echo "Rolled back to blue"
docker compose stop app-green
```

---

### 10. Canary traffic splitting
```nginx
upstream backend {
    server app-blue:3000 weight=9;    # 90% to blue
    server app-green:3000 weight=1;   # 10% to green (canary)
}
```

---

### 11. Health check before switching
```bash
# Check green is healthy before switching
GREEN_STATUS=$(docker compose inspect app-green --format '{{.State.Health.Status}}')
if [ "$GREEN_STATUS" = "healthy" ]; then
    ACTIVE_SLOT=green docker compose up -d nginx
fi
```

---

### 12. Labels to track active slot
```yaml
services:
  app-blue:
    image: my-app:v1
    labels:
      - "deployment.slot=blue"
      - "deployment.version=v1"

  app-green:
    image: my-app:v2
    labels:
      - "deployment.slot=green"
      - "deployment.version=v2"
```

---

### 13. Shared database (both versions)
```yaml
services:
  app-blue:
    image: my-app:v1
    environment:
      DB_HOST: db

  app-green:
    image: my-app:v2
    environment:
      DB_HOST: db

  db:
    image: postgres:16-alpine
    # Both versions must be compatible with same DB schema!
```

---

### 14. Database migration strategy
```
Option A: Run backward-compatible migrations before switching
  v1 works with new schema? Deploy migration → switch to v2

Option B: Expand-Contract pattern
  1. Add new column (both v1 and v2 compatible)
  2. Deploy v2 (writes to new column)
  3. Remove old column in next release
```

---

### 15. nginx upstream keepalive
```nginx
upstream backend {
    server app-green:3000;
    keepalive 32;
}
server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

---

### 16. Health check endpoint
```javascript
// app/index.js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: process.env.APP_VERSION });
});
```

---

### 17. Verify active version
```bash
curl http://localhost/health
# {"status":"ok","version":"v2"}
```

---

### 18. nginx rate limiting per slot
```nginx
limit_req_zone $binary_remote_addr zone=green:10m rate=100r/s;
server {
    location / {
        limit_req zone=green burst=20;
        proxy_pass http://app-green:3000;
    }
}
```

---

### 19. Traefik as alternative to nginx
```yaml
services:
  traefik:
    image: traefik:v3
    command:
      - --providers.docker=true
      - --entrypoints.web.address=:80
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  app-blue:
    image: my-app:v1
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`app.localhost`)"
      - "traefik.http.services.app.loadbalancer.server.port=3000"
```

---

### 20. Traefik switching via labels
```bash
# Switch to green: add traefik labels to green, remove from blue
docker compose up -d app-green  # green starts routing
docker compose stop app-blue    # blue goes down
```

---

### 21. Monitor during switch
```bash
# In another terminal, watch request success rate
watch -n 1 'curl -so /dev/null -w "%{http_code}" http://localhost/'
# Should stay 200 during switch
```

---

### 22. Graceful shutdown of old slot
```bash
# Give blue 30 seconds to finish existing requests
docker compose stop --timeout 30 app-blue
```

---

### 23. Separate compose projects
```bash
# Run blue and green as separate projects
docker compose -p myapp-blue up -d
docker compose -p myapp-green -f docker-compose.green.yml up -d
# Nginx points to one or the other
```

---

### 24. Automated blue-green in CI/CD
```yaml
# .github/workflows/deploy.yml
- name: Deploy green
  run: |
    docker pull my-app:${{ github.sha }}
    ACTIVE_SLOT=green IMAGE_TAG=${{ github.sha }} docker compose up -d app-green
    ./scripts/wait-healthy.sh app-green
    ACTIVE_SLOT=green docker compose up -d nginx
    docker compose exec nginx nginx -s reload
    docker compose stop app-blue
```

---

### 25. Feature flags as alternative to blue-green
```javascript
if (featureFlags.isEnabled('new-checkout', user.id)) {
  return newCheckout(cart);
}
return oldCheckout(cart);
// No deployment needed to switch features
```

---

### 26. Blue-green vs rolling update
```
Blue-Green:
  + Instant switch, easy rollback
  - Double the resources during transition
  - Database compatibility required

Rolling update:
  + Lower resource overhead
  + Good for stateless services
  - Mix of versions briefly running
```

---

### 27. Session persistence during switch
```nginx
upstream backend {
    server app-green:3000;
    # Sticky sessions — keep user on same server
    ip_hash;
}
```

---

### 28. Smoke test green before switching
```bash
# Test green directly (not through nginx)
docker compose exec app-green curl -f http://localhost:3000/health
docker compose exec app-green curl -f http://localhost:3000/api/ping
```

---

### 29. Clean up old slot
```bash
docker compose rm -f app-blue
docker rmi my-app:v1
```

---

### 30. Blue-green checklist
```
✓ Both versions can connect to same DB (schema compatible)
✓ Green is healthy before switching nginx
✓ nginx reloads without downtime (nginx -s reload)
✓ Rollback is a single nginx reload (not a full redeploy)
✓ Old slot kept running until green is verified
✓ Automate the switch in CI/CD
✓ Monitor success rate during switch
✓ Database migrations are backward-compatible
```
