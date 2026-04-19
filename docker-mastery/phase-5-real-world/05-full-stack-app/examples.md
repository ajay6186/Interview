# Examples 5.5 — Full-Stack App (30 examples)

---

### 1. Full-stack compose — all services
```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    depends_on: [api, frontend]

  frontend:
    build: ./frontend
    expose: ["5000"]

  api:
    build: ./api
    expose: ["3000"]
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  pgdata:
```

---

### 2. nginx routing — frontend + API
```nginx
upstream api     { server api:3000; }
upstream frontend { server frontend:5000; }

server {
    listen 80;
    location /api/ {
        proxy_pass http://api/;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location / {
        proxy_pass http://frontend;
    }
}
```

---

### 3. React frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 5000
```

---

### 4. Vue/Next.js/Nuxt with SSR
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./
RUN npm install --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

---

### 5. API Dockerfile (Node.js)
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["node", "index.js"]
```

---

### 6. API Dockerfile (FastAPI)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 7. Shared network topology
```yaml
networks:
  public:      # nginx ↔ frontend, nginx ↔ api
  backend:     # api ↔ db, api ↔ cache
  db_only:     # db only (no direct access from frontend)

services:
  nginx:    networks: [public]
  frontend: networks: [public]
  api:      networks: [public, backend]
  db:       networks: [backend]
  cache:    networks: [backend]
```

---

### 8. Environment management
```yaml
services:
  api:
    env_file:
      - .env
      - .env.local   # gitignored
    environment:
      - NODE_ENV=production   # override
      - DB_HOST=db
      - REDIS_URL=redis://cache:6379
```

---

### 9. Startup ordering
```yaml
services:
  migrate:
    image: my-api
    command: ["node", "migrate.js"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  api:
    depends_on:
      migrate:
        condition: service_completed_successfully
      cache:
        condition: service_healthy

  nginx:
    depends_on:
      - api
      - frontend
```

---

### 10. Makefile for common tasks
```makefile
.PHONY: up down build logs shell migrate

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

shell-api:
	docker compose exec api sh

migrate:
	docker compose run --rm migrate

seed:
	docker compose --profile seed run --rm seed
```

---

### 11. .env.example
```bash
# App
NODE_ENV=production
PORT=3000
JWT_SECRET=

# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=mydb
DB_USER=user
DB_PASS=

# Redis
REDIS_URL=redis://cache:6379

# API keys
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=
```

---

### 12. Development override
```yaml
# docker-compose.override.yml
services:
  api:
    build: ./api
    command: ["node", "--watch", "src/index.js"]
    develop:
      watch:
        - action: sync
          path: ./api/src
          target: /app/src
        - action: rebuild
          path: ./api/package.json
    environment:
      NODE_ENV: development

  frontend:
    develop:
      watch:
        - action: sync
          path: ./frontend/src
          target: /app/src
```

---

### 13. Health checks for all services
```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      retries: 3

  frontend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000"]
      interval: 30s

  db:
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]
      interval: 5s
      retries: 5

  cache:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
```

---

### 14. CI/CD pipeline
```yaml
# .github/workflows/deploy.yml
- name: Build and push
  run: |
    docker buildx build --push -t my-registry/api:${{ github.sha }} ./api
    docker buildx build --push -t my-registry/frontend:${{ github.sha }} ./frontend

- name: Deploy
  run: |
    IMAGE_TAG=${{ github.sha }} docker compose up -d
```

---

### 15. Logging aggregation
```yaml
services:
  loki:
    image: grafana/loki:latest
    ports: ["3100:3100"]
    profiles: [monitoring]

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
    profiles: [monitoring]
```

---

### 16. Tracing with Jaeger
```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
    profiles: [monitoring]
```

---

### 17. Database migrations in CI
```bash
# CI: run migrations before tests
docker compose up -d db
docker compose run --rm migrate
docker compose run --rm test
docker compose down -v
```

---

### 18. Production compose file
```yaml
# docker-compose.prod.yml
services:
  api:
    image: my-registry/api:${IMAGE_TAG}
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"
```

---

### 19. Secrets management
```yaml
# docker-compose.prod.yml
services:
  api:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

---

### 20. Horizontal scaling
```bash
docker compose up -d --scale api=3
# Requires nginx upstream with multiple API servers
```
```nginx
upstream api {
    server api_1:3000;
    server api_2:3000;
    server api_3:3000;
}
```

---

### 21. File uploads — shared volume
```yaml
services:
  api:
    volumes:
      - uploads:/app/uploads

  nginx:
    volumes:
      - uploads:/uploads:ro

volumes:
  uploads:
```
```nginx
location /uploads/ {
    root /;   # serves from /uploads/
}
```

---

### 22. Background job worker
```yaml
services:
  api:
    build: ./api

  worker:
    build: ./api
    command: ["node", "worker.js"]
    environment:
      REDIS_URL: redis://cache:6379
    depends_on:
      cache:
        condition: service_healthy
    deploy:
      replicas: 2
```

---

### 23. Scheduled tasks with cron container
```yaml
services:
  cron:
    image: my-api
    command: ["node", "cron.js"]
    environment:
      DATABASE_URL: postgres://user:secret@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
```

---

### 24. Metrics collection
```yaml
services:
  api:
    environment:
      METRICS_ENABLED: "true"
    expose:
      - "9090"   # Prometheus metrics port

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    profiles: [monitoring]
```

---

### 25. Cleanup and maintenance
```bash
# Remove stopped containers
docker compose rm -f

# Remove all (containers, networks, volumes)
docker compose down -v --remove-orphans

# Prune unused resources
docker system prune -f

# Rebuild specific service
docker compose up -d --build api
```

---

### 26. Version pinning
```yaml
services:
  db:
    image: postgres:16.1-alpine  # pin minor version
  cache:
    image: redis:7.2-alpine
  nginx:
    image: nginx:1.25-alpine
```

---

### 27. Resource limit summary
```yaml
services:
  nginx:    deploy.resources.limits: { memory: 128M, cpus: "0.25" }
  frontend: deploy.resources.limits: { memory: 256M, cpus: "0.25" }
  api:      deploy.resources.limits: { memory: 512M, cpus: "1.0"  }
  worker:   deploy.resources.limits: { memory: 512M, cpus: "0.5"  }
  db:       deploy.resources.limits: { memory: 2G,   cpus: "2.0"  }
  cache:    deploy.resources.limits: { memory: 512M, cpus: "0.5"  }
```

---

### 28. Full project directory layout
```
my-app/
├── api/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── nginx/
│   └── nginx.conf
├── migrations/
│   └── *.sql
├── docker-compose.yml
├── docker-compose.override.yml
├── docker-compose.prod.yml
├── .env.example
├── Makefile
└── README.md
```

---

### 29. README commands section
```markdown
## Development
cp .env.example .env    # configure environment
make up                 # start all services
make logs               # follow logs
make shell-api          # open API shell

## First run
make migrate            # run database migrations
make seed               # seed test data

## Testing
docker compose run --rm api npm test
```

---

### 30. Full-stack checklist
```
Architecture:
✓ nginx as single entry point (no direct port exposure)
✓ Isolated networks (frontend can't directly reach DB)
✓ Named volumes for persistent data

Security:
✓ Non-root users in all custom images
✓ Secrets via Docker secrets or .env (not hardcoded)
✓ Security headers in nginx

Reliability:
✓ Health checks on all services
✓ depends_on with proper conditions
✓ Migrations before app start
✓ restart: unless-stopped in production

Operations:
✓ Structured JSON logging to stdout
✓ Resource limits on all services
✓ Automated backup for DB
✓ CI/CD pipeline building and pushing images
```
