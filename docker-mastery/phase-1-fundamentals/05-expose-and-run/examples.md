# Examples 1.5 — EXPOSE, CMD, and ENTRYPOINT (30 examples)

---

### 1. EXPOSE — document the port
```dockerfile
EXPOSE 3000        # TCP (default)
EXPOSE 3000/tcp    # explicit TCP
EXPOSE 5353/udp    # UDP
EXPOSE 80 443      # multiple ports
```
> EXPOSE does NOT publish the port. It is documentation for operators.

---

### 2. Publishing ports at runtime
```bash
docker run -p 3000:3000 my-app      # host:container
docker run -p 8080:3000 my-app      # host port 8080 → container 3000
docker run -p 127.0.0.1:3000:3000 my-app  # bind to localhost only
docker run -P my-app                # auto-publish all EXPOSE'd ports
```

---

### 3. CMD — exec form (preferred)
```dockerfile
CMD ["node", "index.js"]
CMD ["npm", "start"]
CMD ["python", "app.py"]
CMD ["nginx", "-g", "daemon off;"]
```
> Exec form: no shell, signals go directly to process (PID 1). Use this.

---

### 4. CMD — shell form (avoid for PID 1)
```dockerfile
CMD node index.js
# Runs as: /bin/sh -c "node index.js"
# Problem: node is a child of sh, not PID 1. SIGTERM won't reach it.
```

---

### 5. ENTRYPOINT — set the executable
```dockerfile
ENTRYPOINT ["node"]
CMD ["index.js"]
# docker run my-app         → node index.js
# docker run my-app other.js → node other.js
```

---

### 6. ENTRYPOINT only
```dockerfile
ENTRYPOINT ["node", "index.js"]
# CMD is not needed; ENTRYPOINT has all args
```

---

### 7. CMD only (most apps)
```dockerfile
CMD ["node", "index.js"]
# docker run my-app                  → node index.js
# docker run my-app node server.js   → node server.js (overrides CMD)
```

---

### 8. ENTRYPOINT + CMD — default arguments
```dockerfile
ENTRYPOINT ["python", "manage.py"]
CMD ["runserver", "0.0.0.0:8000"]
# docker run my-app                  → python manage.py runserver 0.0.0.0:8000
# docker run my-app migrate          → python manage.py migrate
```

---

### 9. Override ENTRYPOINT at runtime
```bash
docker run --entrypoint /bin/sh my-app
docker run --entrypoint node my-app other.js
```

---

### 10. Shell form of ENTRYPOINT — avoid
```dockerfile
ENTRYPOINT python app.py   # shell form
# Problem: /bin/sh becomes PID 1, app.py doesn't receive signals
# Use exec form instead
```

---

### 11. exec form with shell variable expansion
```dockerfile
# exec form doesn't expand $VAR — use shell form or sh -c
CMD ["sh", "-c", "node index.js --port $PORT"]
# Or use an entrypoint script:
```

---

### 12. Entrypoint shell script
```bash
#!/bin/sh
# entrypoint.sh
set -e

# Perform initialization
echo "Starting in $NODE_ENV mode"

# Use exec to replace shell with the main process (preserves PID 1)
exec "$@"
```
```dockerfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "index.js"]
```

---

### 13. exec "$@" — always end entrypoint scripts with this
```bash
#!/bin/sh
# Run migrations, wait for DB, etc.
./wait-for-it.sh db:5432 -- echo "DB ready"

exec "$@"   # hand off to CMD with proper signal handling
```

---

### 14. Signal handling — why exec form matters
```
PID 1 receives SIGTERM when container stops.
Shell form: sh (PID 1) → node (PID 2) — SIGTERM doesn't reach node
Exec form:  node is PID 1 — receives SIGTERM directly
```

---

### 15. Graceful shutdown in Node.js
```javascript
// index.js
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
```
```dockerfile
CMD ["node", "index.js"]   # exec form ensures SIGTERM reaches node
```

---

### 16. STOPSIGNAL — change the stop signal
```dockerfile
STOPSIGNAL SIGINT   # default is SIGTERM
# Nginx uses SIGQUIT for graceful shutdown
FROM nginx:alpine
STOPSIGNAL SIGQUIT
```

---

### 17. docker stop timeout
```bash
docker stop --time 30 my-container   # wait 30s for graceful shutdown
# Default: 10 seconds, then SIGKILL
```

---

### 18. Tini — tiny init for containers
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
# Tini properly reaps zombie processes and forwards signals
```
```bash
# Or use Docker's built-in init
docker run --init my-app
```

---

### 19. EXPOSE with protocol
```dockerfile
EXPOSE 53/udp    # DNS
EXPOSE 514/udp   # syslog
EXPOSE 5000/tcp  # HTTP API
```

---

### 20. CMD in docker-compose override
```yaml
services:
  web:
    image: my-app
    command: ["node", "server.js"]   # overrides Dockerfile CMD
```

---

### 21. Multiple commands with CMD (antipattern)
```dockerfile
# WRONG — only last CMD applies
CMD ["node", "worker.js"]
CMD ["node", "index.js"]   # this one wins

# If you need multiple processes, use supervisord or a script
```

---

### 22. Running multiple processes with supervisord
```dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*
COPY supervisord.conf /etc/supervisor/supervisord.conf
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
```

---

### 23. health-cmd and CMD interaction
```dockerfile
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "index.js"]
```

---

### 24. Docker Desktop port mapping UI
```
When you run -p 3000:3000, Docker Desktop shows the port in the container list.
Click the port to open http://localhost:3000 in your browser.
```

---

### 25. Verify port is published
```bash
docker ps
# PORTS: 0.0.0.0:3000->3000/tcp
docker port my-container 3000
# 0.0.0.0:3000
```

---

### 26. -p vs -P
```bash
docker run -p 3000:3000 my-app   # publish specific port
docker run -P my-app              # publish ALL EXPOSE'd ports to random host ports
docker port my-container          # shows the random port mappings
```

---

### 27. Port already in use error
```bash
# Error: Bind for 0.0.0.0:3000 failed: port is already allocated
lsof -i :3000    # find what's using the port
# Or use a different host port:
docker run -p 3001:3000 my-app
```

---

### 28. Binding to localhost only (security)
```bash
docker run -p 127.0.0.1:3000:3000 my-app
# Port is only accessible from localhost, not from the network
```

---

### 29. CMD for one-off tasks
```dockerfile
# Development image — defaults to running tests
CMD ["npm", "test"]
# docker run --rm my-app               → runs tests
# docker run --rm my-app node index.js → runs server
```

---

### 30. CMD vs ENTRYPOINT decision guide
```
Use CMD alone when:
  - You want easy override of the entire command
  - The image runs a single, obvious command

Use ENTRYPOINT + CMD when:
  - Image behaves like an executable tool
  - CMD provides default arguments
  - Example: docker run my-db-tool --host db --query "SELECT 1"

Use ENTRYPOINT script when:
  - You need initialization (wait for DB, set up config)
  - You want to inject env vars or secrets before starting
```
