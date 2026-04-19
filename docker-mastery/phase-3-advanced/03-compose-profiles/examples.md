# Examples 3.3 — Compose Profiles (30 examples)

---

### 1. Basic profile — optional service
```yaml
services:
  web:
    image: my-app
    ports:
      - "3000:3000"

  adminer:
    image: adminer
    profiles:
      - tools          # only starts with --profile tools
    ports:
      - "8080:8080"
```
```bash
docker compose up                      # starts only: web
docker compose --profile tools up      # starts: web + adminer
```

---

### 2. Multiple profiles on one service
```yaml
services:
  debug-tools:
    image: my-debug-image
    profiles:
      - debug
      - tools
      - development
```
```bash
docker compose --profile debug up
docker compose --profile tools up
docker compose --profile development up
# Any of the above starts debug-tools
```

---

### 3. Multiple active profiles
```bash
docker compose --profile tools --profile monitoring up
```

---

### 4. COMPOSE_PROFILES environment variable
```bash
export COMPOSE_PROFILES=tools,monitoring
docker compose up
# Equivalent to --profile tools --profile monitoring
```

---

### 5. In .env file
```bash
# .env
COMPOSE_PROFILES=tools
```
```bash
docker compose up   # automatically enables tools profile
```

---

### 6. Development extras with profiles
```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"

  mailhog:
    image: mailhog/mailhog
    profiles: [dev]
    ports:
      - "1025:1025"
      - "8025:8025"

  redis-commander:
    image: rediscommander/redis-commander
    profiles: [dev]
    environment:
      REDIS_HOSTS: cache
    ports:
      - "8081:8081"
```

---

### 7. CI/testing profile
```yaml
services:
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]

  test-runner:
    build:
      context: .
      target: test
    profiles: [test]
    command: ["npm", "test"]
    depends_on:
      db:
        condition: service_healthy
```
```bash
docker compose --profile test run --rm test-runner
```

---

### 8. Monitoring profile
```yaml
services:
  web:
    image: my-app
    labels:
      - "prometheus.scrape=true"

  prometheus:
    image: prom/prometheus
    profiles: [monitoring]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    profiles: [monitoring]
    ports:
      - "3000:3000"
```

---

### 9. Migration profile
```yaml
services:
  app:
    image: my-app
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD", "pg_isready"]

  migrate:
    image: my-app
    profiles: [migrate]
    command: ["node", "migrate.js"]
    depends_on:
      db:
        condition: service_healthy
```
```bash
docker compose --profile migrate run --rm migrate
docker compose up   # runs without migrate
```

---

### 10. Seed data profile
```yaml
services:
  seed:
    image: my-app
    profiles: [seed]
    command: ["node", "seed.js"]
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
```
```bash
docker compose --profile seed run --rm seed
```

---

### 11. run with profile
```bash
docker compose --profile tools run --rm adminer   # one-off
docker compose --profile test run --rm test-runner
```

---

### 12. Profile naming conventions
```
dev / development — local development tools
test / ci         — test runner, test DB
tools             — admin UIs, CLI tools
monitoring        — prometheus, grafana
debug             — debug utilities
docs              — documentation server
migrate           — database migrations
seed              — seed data
```

---

### 13. Profiles + depends_on
```yaml
services:
  web:
    profiles: [app]
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    # db has NO profile — always starts when any profile is active
    # and is needed by web
```
> Services without a profile always start (unless you use explicit service selection).

---

### 14. List profiles in compose
```bash
docker compose config --profiles
# Lists all profile names defined in the compose file
```

---

### 15. Start specific service only
```bash
docker compose up web          # start just web
docker compose up db web       # start db and web
```

---

### 16. Profile for SSL termination
```yaml
services:
  nginx:
    image: nginx:alpine
    profiles: [ssl]
    volumes:
      - ./ssl-nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs:ro
    ports:
      - "443:443"
```

---

### 17. Profile for caching layer
```yaml
services:
  web:
    environment:
      CACHE_URL: ${CACHE_URL:-}

  redis:
    image: redis:7-alpine
    profiles: [cache]
```
```bash
export CACHE_URL=redis://redis:6379
docker compose --profile cache up
```

---

### 18. Profile for async workers
```yaml
services:
  api:
    image: my-app
    command: ["node", "api.js"]

  worker:
    image: my-app
    profiles: [workers]
    command: ["node", "worker.js"]
    deploy:
      replicas: 2
```

---

### 19. Profile + override file combination
```bash
# Combine profile with override file
docker compose \
  -f docker-compose.yml \
  -f docker-compose.staging.yml \
  --profile monitoring \
  up -d
```

---

### 20. Profile for one-off initialization
```yaml
services:
  init-db:
    image: my-app
    profiles: [init]
    command: ["node", "scripts/init-db.js"]
    restart: "no"
    depends_on:
      db:
        condition: service_healthy
```
```bash
# Run once during first deployment
docker compose --profile init run --rm init-db
```

---

### 21. Multiple profiles same service
```yaml
services:
  load-generator:
    image: k6
    profiles:
      - perf
      - load-test
    volumes:
      - ./load-test.js:/scripts/load-test.js
    command: run /scripts/load-test.js
```

---

### 22. Profile-only service + depends_on interaction
```yaml
services:
  api:
    image: my-app

  api-docs:
    image: swagger-ui
    profiles: [docs]
    environment:
      API_URL: http://api:3000/openapi.json
    depends_on:
      - api
# When --profile docs is active, api starts too (as dependency)
```

---

### 23. Disable a service completely
```yaml
# Services with profiles are effectively "disabled" by default
# To always exclude a service without profiles, use a separate file
# (docker-compose.override.yml) and don't merge it in production
```

---

### 24. Profile + COMPOSE_PROFILES in CI
```yaml
# .github/workflows/ci.yml
- name: Run tests
  env:
    COMPOSE_PROFILES: test
  run: docker compose up --abort-on-container-exit --exit-code-from test-runner
```

---

### 25. Check active profiles
```bash
docker compose --profile tools config
# Shows which services will be started with given profiles
```

---

### 26. Profile for feature flags
```yaml
services:
  web:
    environment:
      FEATURE_NEW_UI: ${FEATURE_NEW_UI:-false}

  new-ui-preview:
    image: my-app-new-ui
    profiles: [new-ui]
    ports:
      - "3001:3000"
```

---

### 27. Profile for backup agent
```yaml
services:
  backup:
    image: my-backup-tool
    profiles: [backup]
    volumes:
      - pgdata:/data/source:ro
      - ./backups:/data/destination
    environment:
      BACKUP_SCHEDULE: "0 2 * * *"

volumes:
  pgdata:
    external: true
```

---

### 28. Development profile with hot reload
```yaml
services:
  web:
    build:
      context: .
      target: production

  web-dev:
    build:
      context: .
      target: development
    profiles: [dev]
    volumes:
      - .:/app
    command: ["npm", "run", "dev"]
    ports:
      - "3000:3000"
```

---

### 29. Profile + docker compose run
```bash
# One-off command with profile service
docker compose --profile tools run --rm db-admin psql -U user mydb
```

---

### 30. Profiles best practices
```
✓ Keep core services (app, DB) without profiles — always run
✓ Use profiles for: dev tools, monitoring, migration, testing
✓ Name profiles consistently across projects
✓ Document active profiles in README
✓ Use COMPOSE_PROFILES in .env for dev defaults
✓ CI pipelines set COMPOSE_PROFILES explicitly
✓ Avoid too many profiles — 3-5 is usually enough
```
