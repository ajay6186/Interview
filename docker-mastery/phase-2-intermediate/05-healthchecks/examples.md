# Examples 2.5 — Healthchecks (30 examples)

---

### 1. HEALTHCHECK in Dockerfile — basic
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

---

### 2. HEALTHCHECK — exec form
```dockerfile
HEALTHCHECK CMD ["curl", "-f", "http://localhost:3000/health"]
```

---

### 3. HEALTHCHECK options
```dockerfile
HEALTHCHECK \
  --interval=30s \    # time between checks (default 30s)
  --timeout=10s \     # max time for check to run (default 30s)
  --start-period=5s \ # grace period before counting failures (default 0s)
  --retries=3 \       # failures needed to become unhealthy (default 3)
  CMD curl -f http://localhost:3000/health || exit 1
```

---

### 4. Healthcheck with wget (Alpine — no curl)
```dockerfile
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
```

---

### 5. Disable inherited healthcheck
```dockerfile
HEALTHCHECK NONE
# Removes healthcheck inherited from base image
```

---

### 6. Healthcheck in docker-compose
```yaml
services:
  web:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

---

### 7. Healthcheck with shell command
```yaml
services:
  web:
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
```
> CMD-SHELL runs in `/bin/sh -c` — allows shell features like `||`.

---

### 8. Postgres healthcheck
```yaml
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user", "-d", "mydb"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
```

---

### 9. MySQL healthcheck
```yaml
services:
  db:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

### 10. Redis healthcheck
```yaml
services:
  cache:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

---

### 11. MongoDB healthcheck
```yaml
services:
  mongo:
    image: mongo:7
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

### 12. RabbitMQ healthcheck
```yaml
services:
  rabbit:
    image: rabbitmq:3-management
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 30s
      timeout: 10s
      retries: 5
```

---

### 13. depends_on with healthcheck
```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]
      interval: 5s
      retries: 5
```
> Web won't start until DB healthcheck passes.

---

### 14. View health status
```bash
docker ps
# STATUS: Up 2 minutes (healthy)
#         Up 30 seconds (health: starting)
#         Up 5 minutes (unhealthy)

docker inspect --format '{{.State.Health.Status}}' my-container
docker inspect --format '{{json .State.Health}}' my-container | jq .
```

---

### 15. Health endpoint in Node.js
```javascript
// index.js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```
```dockerfile
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
```

---

### 16. Health endpoint in Python (Flask)
```python
@app.route('/health')
def health():
    return {'status': 'ok'}, 200
```

---

### 17. Health endpoint in Python (FastAPI)
```python
@app.get('/health')
async def health():
    return {'status': 'ok'}
```

---

### 18. Deep health check — verify DB connection
```javascript
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});
```

---

### 19. Liveness vs readiness (Docker healthcheck is liveness)
```
Liveness:  Is the app running? (Dockerfile HEALTHCHECK)
Readiness: Is the app ready to serve traffic? (Kubernetes readinessProbe)

In Docker Compose, HEALTHCHECK covers both for depends_on purposes.
```

---

### 20. start_period — startup grace
```yaml
services:
  web:
    healthcheck:
      start_period: 30s   # app gets 30s to start before health checks count
      interval: 10s
      retries: 3
# During start_period, failures don't count toward retries
```

---

### 21. Exit codes
```
0 — healthy
1 — unhealthy
2 — reserved (do not use)
```

---

### 22. Healthcheck for a static file server
```dockerfile
FROM nginx:alpine
HEALTHCHECK CMD curl -f http://localhost/ || exit 1
```

---

### 23. Healthcheck for a background worker (no HTTP)
```bash
# Check if a process is running
HEALTHCHECK CMD pgrep -f worker.py || exit 1
# Or check a PID file
HEALTHCHECK CMD cat /var/run/worker.pid | xargs kill -0 || exit 1
```

---

### 24. Healthcheck using nc (netcat)
```dockerfile
HEALTHCHECK CMD nc -z localhost 3000 || exit 1
# Only checks TCP connectivity, not HTTP response
```

---

### 25. Multiple health checks (via script)
```bash
#!/bin/sh
# healthcheck.sh
curl -f http://localhost:3000/health || exit 1
redis-cli ping | grep -q PONG || exit 1
exit 0
```
```dockerfile
COPY healthcheck.sh /healthcheck.sh
HEALTHCHECK CMD /healthcheck.sh
```

---

### 26. Viewing health check logs
```bash
docker inspect --format '{{range .State.Health.Log}}{{.Output}}{{end}}' my-container
```

---

### 27. Restarting unhealthy containers
```yaml
services:
  web:
    restart: on-failure
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
# Docker will restart if container exits; but unhealthy ≠ exited
# Use orchestrators (Kubernetes, Swarm) for auto-restart on unhealthy
```

---

### 28. Wait-for-it pattern (before healthchecks existed)
```dockerfile
# Older pattern: poll until dependency is ready
COPY wait-for-it.sh /wait-for-it.sh
CMD ["/wait-for-it.sh", "db:5432", "--", "node", "index.js"]
# Modern: use depends_on with condition: service_healthy
```

---

### 29. Disable healthcheck in docker-compose
```yaml
services:
  web:
    healthcheck:
      disable: true
```

---

### 30. Healthcheck best practices
```
✓ Implement a /health endpoint in every HTTP service
✓ Use start_period to give slow-starting apps time to initialize
✓ Keep health checks lightweight (< 1s, no expensive DB queries)
✓ Check actual functionality (not just "process is running")
✓ Use depends_on condition: service_healthy for startup ordering
✓ Deep health checks should check DB connectivity
✓ Add retries: 3 or more to avoid flapping on transient errors
```
