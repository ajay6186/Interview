# Examples 3.1 — Non-Root User (30 examples)

---

### 1. Create and switch to a non-root user
```dockerfile
FROM node:18-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --chown=appuser:appgroup . .
RUN npm install
USER appuser
CMD ["node", "index.js"]
```

---

### 2. Use the built-in node user (node image)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --only=production
COPY --chown=node:node . .
USER node
CMD ["node", "index.js"]
```

---

### 3. Debian/Ubuntu — create user with useradd
```dockerfile
FROM python:3.12-slim
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
WORKDIR /app
COPY --chown=appuser:appgroup requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=appuser:appgroup . .
USER appuser
CMD ["python", "app.py"]
```

---

### 4. Why non-root matters
```
If a vulnerability in your app allows container escape:
  - root in container → root on host (catastrophic)
  - UID 1000 in container → unprivileged on host (contained)

Also: compliance requirements (CIS benchmarks, PCI-DSS, SOC2)
```

---

### 5. USER with UID directly (no user creation)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
USER 1000   # use UID directly
CMD ["node", "index.js"]
```

---

### 6. Verify the running user
```bash
docker run --rm my-app whoami
docker run --rm my-app id
# Should show a non-root user
```

---

### 7. File ownership — COPY --chown
```dockerfile
# Without --chown: files are owned by root
COPY . .

# With --chown: files owned by the app user
COPY --chown=node:node . .
```

---

### 8. Fix permissions after RUN as root
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && chown -R node:node /app
USER node
CMD ["node", "index.js"]
```

---

### 9. Switch back to root for privileged operations
```dockerfile
FROM node:18-alpine
# Run as root to install packages
RUN apk add --no-cache curl

# Then switch to non-root
USER node
WORKDIR /home/node
CMD ["node", "index.js"]
```

---

### 10. Run as root in compose for debugging (temporary)
```yaml
services:
  web:
    image: my-app
    user: root   # override for debugging only — remove in production
```

---

### 11. Write permissions for uploads
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY --chown=node:node . .
RUN npm install

# Create uploads dir with correct ownership
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
CMD ["node", "index.js"]
```

---

### 12. tmpfs for writable temp
```yaml
services:
  web:
    image: my-app
    user: "1000:1000"
    tmpfs:
      - /tmp     # writable in-memory mount — no ownership issue
```

---

### 13. Go distroless with non-root
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /app/server /server
USER nonroot
ENTRYPOINT ["/server"]
```

---

### 14. Check with Trivy — root user warning
```bash
trivy image my-app
# Will flag if container runs as root (HIGH severity)
```

---

### 15. Rootless Docker
```bash
# Run Docker daemon as non-root user
dockerd-rootless-setuptool.sh install
# Limits damage if Docker daemon itself is compromised
```

---

### 16. seccomp — restrict syscalls
```yaml
services:
  web:
    security_opt:
      - seccomp:seccomp-profile.json
```

---

### 17. cap_drop — remove Linux capabilities
```yaml
services:
  web:
    cap_drop:
      - ALL         # drop ALL capabilities
    cap_add:
      - NET_BIND_SERVICE   # add back only what's needed
```

---

### 18. read_only filesystem
```yaml
services:
  web:
    read_only: true    # container filesystem is read-only
    tmpfs:
      - /tmp           # writable temp mount
    volumes:
      - uploads:/app/uploads   # writable volume for uploads
```

---

### 19. no-new-privileges
```yaml
services:
  web:
    security_opt:
      - no-new-privileges:true
# Prevents privilege escalation via setuid binaries
```

---

### 20. Docker socket — never expose to untrusted containers
```yaml
services:
  ci-agent:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # Whoever controls this container controls Docker → root on host
    # Avoid, or use rootless Docker / socket proxy
```

---

### 21. Kubernetes runAsNonRoot
```yaml
# k8s pod spec equivalent of USER in Dockerfile
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
```

---

### 22. Python non-root with venv
```dockerfile
FROM python:3.12-slim
RUN useradd -m appuser
WORKDIR /home/appuser/app
USER appuser
COPY --chown=appuser requirements.txt .
RUN pip install --user -r requirements.txt
ENV PATH="/home/appuser/.local/bin:$PATH"
COPY --chown=appuser . .
CMD ["python", "app.py"]
```

---

### 23. Nginx with non-root (run as uid 101)
```dockerfile
FROM nginx:alpine
# nginx:alpine runs as root by default (binds port 80)
# To run non-root, bind to port > 1024:
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf
USER nginx   # nginx image has a 'nginx' user
EXPOSE 8080
```

---

### 24. Numeric UID in Kubernetes
```yaml
securityContext:
  runAsUser: 1000     # numeric UID — doesn't rely on /etc/passwd in image
```
```dockerfile
USER 1000:1000   # also use numeric UID in Dockerfile for consistency
```

---

### 25. allowPrivilegeEscalation: false
```yaml
# Kubernetes
securityContext:
  allowPrivilegeEscalation: false
```
```yaml
# Docker Compose equivalent
security_opt:
  - no-new-privileges:true
```

---

### 26. Hadolint — lint for USER directive
```bash
hadolint Dockerfile
# DL3002: Last USER should not be root
# Will warn if you forget to add USER instruction
```

---

### 27. Multi-stage — root in builder, non-root in final
```dockerfile
FROM node:18-alpine AS builder
# Build as root (need to install packages)
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine
# Switch to non-root in production image
WORKDIR /app
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

---

### 28. Entrypoint script with gosu (privilege de-escalation)
```bash
#!/bin/sh
# entrypoint.sh — runs as root, drops to appuser
exec gosu appuser "$@"
```
```dockerfile
RUN apt-get install -y gosu
COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "index.js"]
```

---

### 29. Volume mount permissions with UID
```bash
# Ensure host directory is owned by same UID as container user
mkdir -p ./data
chown 1000:1000 ./data
```
```yaml
services:
  web:
    user: "1000:1000"
    volumes:
      - ./data:/app/data
```

---

### 30. Non-root checklist
```
✓ Dockerfile ends with USER (non-root)
✓ Files owned by app user (COPY --chown)
✓ Writable directories created before USER switch
✓ Port > 1024 (can't bind low ports as non-root)
✓ cap_drop: ALL with only necessary caps added back
✓ no-new-privileges: true in compose/k8s
✓ read_only: true with tmpfs for /tmp if possible
```
