# Examples 4.5 — Compose Watch (30 examples)

---

### 1. Enable watch in compose
```yaml
services:
  web:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json
```
```bash
docker compose watch
# Or: docker compose up --watch
```

---

### 2. sync action — copy files without rebuild
```yaml
develop:
  watch:
    - action: sync
      path: ./src
      target: /app/src
      # File changes in ./src → synced to /app/src immediately
```

---

### 3. rebuild action — rebuild image on change
```yaml
develop:
  watch:
    - action: rebuild
      path: package.json
    - action: rebuild
      path: Dockerfile
    - action: rebuild
      path: package-lock.json
```

---

### 4. sync+restart action — sync files then restart container
```yaml
develop:
  watch:
    - action: sync+restart
      path: ./config
      target: /app/config
      # Syncs config files and restarts container (cheaper than rebuild)
```

---

### 5. Multiple watch rules
```yaml
services:
  api:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: sync+restart
          path: ./config
          target: /app/config
        - action: rebuild
          path: package.json
        - action: rebuild
          path: Dockerfile
```

---

### 6. Full Node.js hot reload setup
```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    command: ["node", "--watch", "src/index.js"]   # Node.js 18+ built-in watch
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json
```

---

### 7. Node.js with nodemon
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npx", "nodemon", "src/index.js"]
```
```yaml
develop:
  watch:
    - action: sync
      path: ./src
      target: /app/src
```

---

### 8. Python Flask with hot reload
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV FLASK_ENV=development
CMD ["flask", "run", "--host=0.0.0.0", "--reload"]
```
```yaml
develop:
  watch:
    - action: sync
      path: .
      target: /app
      ignore:
        - __pycache__
        - "*.pyc"
    - action: rebuild
      path: requirements.txt
```

---

### 9. Ignore patterns in watch
```yaml
develop:
  watch:
    - action: sync
      path: ./src
      target: /app/src
      ignore:
        - "*.test.js"
        - "*.spec.ts"
        - node_modules
        - .git
        - "*.log"
```

---

### 10. React/Vite dev server
```yaml
services:
  frontend:
    build:
      context: .
      target: development
    ports:
      - "5173:5173"
    command: ["npm", "run", "dev", "--", "--host"]
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: sync
          path: ./public
          target: /app/public
        - action: rebuild
          path: package.json
```

---

### 11. Compose watch vs bind mounts
```
Bind mount (.:/app):
  - All files synced (including node_modules if not excluded)
  - Works on all OS but slow on macOS/Windows
  - No control over what triggers rebuild

Compose watch:
  - Selective sync (only specific paths)
  - Faster on macOS/Windows (no VirtioFS overhead)
  - Granular control: sync vs rebuild vs sync+restart
```

---

### 12. Compose watch requires Docker 23.0+
```bash
docker compose version
# Docker Compose version v2.22.0+
# watch requires Compose v2.22.0 and Docker Engine 23.0+
```

---

### 13. Combined watch + bind mount (migration path)
```yaml
services:
  web:
    build: .
    # Old approach: volumes:
    #  - ./src:/app/src
    # New approach:
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
```

---

### 14. Go with air (hot reload)
```dockerfile
FROM golang:1.22-alpine AS dev
RUN go install github.com/cosmtrek/air@latest
WORKDIR /app
CMD ["air"]
```
```yaml
develop:
  watch:
    - action: sync
      path: .
      target: /app
      ignore:
        - tmp/
        - "*.test.go"
    - action: rebuild
      path: go.mod
```

---

### 15. Django with runserver reload
```yaml
services:
  web:
    build: .
    command: ["python", "manage.py", "runserver", "0.0.0.0:8000"]
    develop:
      watch:
        - action: sync
          path: .
          target: /app
          ignore:
            - __pycache__
            - "*.pyc"
            - .venv
        - action: rebuild
          path: requirements.txt
```

---

### 16. sync+restart use case — config files
```yaml
services:
  nginx:
    image: nginx:alpine
    develop:
      watch:
        - action: sync+restart
          path: ./nginx.conf
          target: /etc/nginx/nginx.conf
        - action: sync+restart
          path: ./conf.d
          target: /etc/nginx/conf.d
```

---

### 17. Multiple services watching
```yaml
services:
  api:
    build: ./api
    develop:
      watch:
        - action: sync
          path: ./api/src
          target: /app/src
        - action: rebuild
          path: ./api/package.json

  frontend:
    build: ./frontend
    develop:
      watch:
        - action: sync
          path: ./frontend/src
          target: /app/src
        - action: rebuild
          path: ./frontend/package.json
```

---

### 18. Watch output
```bash
docker compose watch
# Watch enabled for service: web, building...
# [web] Syncing ./src to /app/src
# [web] Rebuilding service web due to changes in package.json...
```

---

### 19. Stop watch
```bash
# Ctrl+C stops watch
# Or run in background:
docker compose watch --no-up &  # don't start services, just watch
```

---

### 20. Watch vs docker compose up with --build
```bash
docker compose up --build     # rebuilds on startup; does NOT watch
docker compose watch          # rebuilds/syncs automatically as files change
docker compose up --watch     # starts AND watches
```

---

### 21. TypeScript hot reload
```dockerfile
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]
```
```yaml
develop:
  watch:
    - action: sync
      path: ./src
      target: /app/src
    - action: rebuild
      path: package.json
```

---

### 22. Frontend + API full-stack watch
```yaml
services:
  api:
    build: ./api
    ports: ["3001:3001"]
    develop:
      watch:
        - action: sync
          path: ./api/src
          target: /app/src

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    develop:
      watch:
        - action: sync
          path: ./frontend/src
          target: /app/src
    environment:
      REACT_APP_API_URL: http://localhost:3001
```

---

### 23. Watch with healthcheck
```yaml
services:
  web:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 5s
    develop:
      watch:
        - action: rebuild
          path: package.json
        - action: sync
          path: ./src
          target: /app/src
```

---

### 24. Watch with volumes (hybrid approach)
```yaml
services:
  web:
    build: .
    volumes:
      - node_modules:/app/node_modules  # cached
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json

volumes:
  node_modules:
```

---

### 25. Compose watch ignoring test files
```yaml
develop:
  watch:
    - action: sync
      path: ./src
      target: /app/src
      ignore:
        - "**/*.test.ts"
        - "**/*.spec.ts"
        - "__tests__/"
```

---

### 26. watch vs COPY in Dockerfile
```dockerfile
# In dev Dockerfile: don't COPY src — watch will sync it
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
# Don't COPY . . here for dev — watch handles it
CMD ["npm", "run", "dev"]
```

---

### 27. Production Dockerfile (separate from dev)
```dockerfile
# Dockerfile.prod — full copy for production
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY src/ ./src/
CMD ["node", "src/index.js"]
```

---

### 28. Using target stages for dev/prod
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install

FROM base AS development
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```
```yaml
services:
  web:
    build:
      context: .
      target: development
    develop:
      watch: [...]
```

---

### 29. Compose watch in team workflow
```bash
# Each developer runs:
docker compose watch

# CI/CD runs:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# No --watch in production
```

---

### 30. Compose watch checklist
```
✓ Use develop.watch instead of bind mounts for better performance
✓ Use sync for source code (fast, no restart)
✓ Use rebuild for package.json, Dockerfile changes
✓ Use sync+restart for config files that need a restart
✓ Add ignore patterns for __pycache__, node_modules, *.pyc
✓ Keep dev and production Dockerfiles/targets separate
✓ Requires Docker Compose v2.22.0 and Docker Engine 23.0+
```
