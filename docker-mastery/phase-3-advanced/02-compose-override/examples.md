# Examples 3.2 — Compose Override (30 examples)

---

### 1. docker-compose.override.yml — auto-merged
```yaml
# docker-compose.yml (base)
services:
  web:
    image: my-app
    ports:
      - "3000:3000"
```
```yaml
# docker-compose.override.yml (auto-applied)
services:
  web:
    volumes:
      - .:/app   # adds bind mount for development
    command: ["npm", "run", "dev"]
```
> `docker compose up` merges both files automatically.

---

### 2. Explicit -f flag — specify files manually
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
```

---

### 3. Environment-specific files
```
docker-compose.yml           # base (always applied)
docker-compose.override.yml  # local dev (auto-applied)
docker-compose.prod.yml      # production (apply with -f)
docker-compose.staging.yml   # staging
docker-compose.test.yml      # CI testing
```

---

### 4. Base config — production defaults
```yaml
# docker-compose.yml
services:
  web:
    image: my-app:${IMAGE_TAG:-latest}
    restart: always
    environment:
      - NODE_ENV=production
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: "3"
```

---

### 5. Override for development
```yaml
# docker-compose.override.yml
services:
  web:
    build: .               # build locally instead of pulling image
    environment:
      - NODE_ENV=development
      - DEBUG=*
    volumes:
      - .:/app
      - /app/node_modules
    command: ["npm", "run", "dev"]
    restart: "no"          # don't restart in dev
```

---

### 6. Override for CI/testing
```yaml
# docker-compose.test.yml
services:
  web:
    build:
      context: .
      target: test
    command: ["npm", "test"]
    environment:
      - CI=true
    depends_on:
      db:
        condition: service_healthy

  db:
    environment:
      - POSTGRES_DB=test_db
```

---

### 7. Override for production
```yaml
# docker-compose.prod.yml
services:
  web:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
```

---

### 8. Merging rules — lists are appended
```yaml
# base
environment:
  - NODE_ENV=production

# override
environment:
  - DEBUG=true

# merged result
environment:
  - NODE_ENV=production
  - DEBUG=true
```

---

### 9. Merging rules — mappings are merged/overwritten
```yaml
# base
environment:
  NODE_ENV: production
  PORT: "3000"

# override
environment:
  NODE_ENV: development   # overwrites
  DEBUG: "true"           # adds new key

# merged result
environment:
  NODE_ENV: development
  PORT: "3000"
  DEBUG: "true"
```

---

### 10. Override — add new service
```yaml
# docker-compose.yml — no debug service
services:
  web:
    image: my-app

# docker-compose.override.yml
services:
  web:
    volumes:
      - .:/app
  debug:        # new service only in development
    image: adminer
    ports:
      - "8080:8080"
```

---

### 11. COMPOSE_FILE — set default files
```bash
# .env or shell
export COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml
docker compose up   # uses both files
```

---

### 12. Override — change resource limits
```yaml
# docker-compose.yml
services:
  web:
    image: my-app

# docker-compose.prod.yml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
```

---

### 13. Override — disable healthcheck in dev
```yaml
# docker-compose.override.yml
services:
  web:
    healthcheck:
      disable: true   # speed up dev restart cycle
```

---

### 14. Override — add debugging port
```yaml
# docker-compose.override.yml
services:
  web:
    ports:
      - "9229:9229"   # Node.js inspector port
    command: ["node", "--inspect=0.0.0.0:9229", "index.js"]
```

---

### 15. Override — swap image for local build
```yaml
# docker-compose.yml
services:
  web:
    image: my-registry.io/my-app:latest

# docker-compose.override.yml
services:
  web:
    build: .            # use local build instead of registry image
    image: my-app:local # optional: tag the local build
```

---

### 16. Override — add logging config
```yaml
# docker-compose.prod.yml
services:
  web:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
```

---

### 17. Override — add sidecar service
```yaml
# docker-compose.monitoring.yml
services:
  web:
    labels:
      - "prometheus.scrape=true"
      - "prometheus.port=3000"

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

---

### 18. Override — use .env.test for CI
```yaml
# docker-compose.test.yml
services:
  web:
    env_file:
      - .env.test
```

---

### 19. Prevent override file from being used in production
```bash
# In production Makefile/scripts — explicitly list files
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# Never run plain "docker compose up" in production
```

---

### 20. Override — disable service in certain environments
```yaml
# docker-compose.yml
services:
  web:
    image: my-app
  mailcatcher:
    image: mailhog/mailhog
    ports:
      - "8025:8025"

# docker-compose.prod.yml — don't include mailcatcher
# simply don't mention it; it's excluded when using -f explicitly
```

---

### 21. Merging volumes — extends
```yaml
# docker-compose.yml
services:
  web:
    volumes:
      - uploads:/app/uploads

# docker-compose.override.yml
services:
  web:
    volumes:
      - .:/app          # bind mount added; uploads volume retained
      - /app/node_modules
```

---

### 22. Override — network settings
```yaml
# docker-compose.prod.yml
services:
  web:
    networks:
      - external_proxy

networks:
  external_proxy:
    external: true
```

---

### 23. Config object (v3 style secrets/configs)
```yaml
# docker-compose.prod.yml
services:
  web:
    configs:
      - source: app_config
        target: /app/config.json

configs:
  app_config:
    file: ./config.prod.json
```

---

### 24. Override — change replicas
```yaml
# docker-compose.prod.yml
services:
  web:
    deploy:
      replicas: 5
      update_config:
        parallelism: 2
        delay: 10s
```

---

### 25. Use extends (compose v2 syntax)
```yaml
# common.yml
services:
  base_web:
    build: .
    environment:
      - NODE_ENV=production

# docker-compose.yml
services:
  web:
    extends:
      file: common.yml
      service: base_web
    ports:
      - "3000:3000"
```

---

### 26. .env file with override
```bash
# .env
IMAGE_TAG=v1.2.3
REGISTRY=my-registry.io

# docker-compose.yml
services:
  web:
    image: ${REGISTRY}/my-app:${IMAGE_TAG}
```

---

### 27. Staging overlay pattern
```
Maintain 3 files:
  docker-compose.yml           → base (services, networks, volumes)
  docker-compose.override.yml  → dev (bind mounts, debug ports)
  docker-compose.staging.yml   → staging (specific image tags, limits)

Run:
  Dev:     docker compose up
  Staging: docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
  Prod:    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

### 28. Verify merged config
```bash
docker compose config
# Shows the merged effective configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml config
```

---

### 29. Convert to a single file for deployment
```bash
docker compose config > docker-compose.merged.yml
# Useful for archiving or deploying to environments without overlay support
```

---

### 30. Override best practices
```
✓ docker-compose.yml: production defaults (restart, logging, image)
✓ docker-compose.override.yml: dev extras (build, volumes, debug command)
✓ docker-compose.prod.yml: production extras (replicas, prod network)
✓ docker-compose.test.yml: CI specifics (test command, test DB name)
✓ Use docker compose config to verify merged output
✓ Never commit secrets in any compose file
✓ .env file for environment-specific values
```
