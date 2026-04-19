# Examples 4.3 — Init Containers (30 examples)

---

### 1. Wait for DB with netcat
```yaml
services:
  wait-db:
    image: busybox
    command: ["sh", "-c", "until nc -z db 5432; do echo waiting; sleep 2; done"]
    depends_on:
      - db

  app:
    image: my-app
    depends_on:
      wait-db:
        condition: service_completed_successfully
```

---

### 2. Run database migrations
```yaml
services:
  migrate:
    image: my-app
    command: ["node", "migrate.js"]
    environment:
      - DB_HOST=db
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app:
    image: my-app
    depends_on:
      migrate:
        condition: service_completed_successfully
```

---

### 3. condition: service_completed_successfully
```yaml
services:
  init:
    image: alpine
    command: ["sh", "-c", "echo 'Init done' && exit 0"]
    restart: "no"

  app:
    depends_on:
      init:
        condition: service_completed_successfully
# app starts only after init exits with code 0
```

---

### 4. service_completed_successfully exit code matters
```bash
# Exit 0 → service_completed_successfully → app starts
# Exit 1 → service_completed_successfully NOT met → app blocked (or fails)
```

---

### 5. Seed database
```yaml
services:
  seed:
    image: my-app
    command: ["node", "seed.js"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
    profiles: [seed]   # only run with --profile seed

  app:
    image: my-app
    depends_on:
      db:
        condition: service_healthy
```

---

### 6. Create directories / set permissions
```yaml
services:
  init-dirs:
    image: alpine
    command: ["sh", "-c", "mkdir -p /data/uploads /data/logs && chmod 777 /data/uploads"]
    volumes:
      - app_data:/data
    restart: "no"

  app:
    image: my-app
    volumes:
      - app_data:/data
    depends_on:
      init-dirs:
        condition: service_completed_successfully

volumes:
  app_data:
```

---

### 7. Download config from remote
```yaml
services:
  fetch-config:
    image: alpine
    command:
      - sh
      - -c
      - wget -qO /config/app.json https://config.example.com/app.json
    volumes:
      - config_vol:/config
    restart: "no"

  app:
    image: my-app
    volumes:
      - config_vol:/app/config
    depends_on:
      fetch-config:
        condition: service_completed_successfully
```

---

### 8. Copy files from init container into shared volume
```yaml
services:
  init:
    image: my-app-builder
    command: ["sh", "-c", "cp -r /app/dist /output/"]
    volumes:
      - static_files:/output
    restart: "no"

  nginx:
    image: nginx:alpine
    volumes:
      - static_files:/usr/share/nginx/html:ro
    depends_on:
      init:
        condition: service_completed_successfully

volumes:
  static_files:
```

---

### 9. Run tests as init container
```yaml
services:
  test:
    build:
      context: .
      target: test
    command: ["npm", "test"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app:
    build: .
    depends_on:
      test:
        condition: service_completed_successfully
```

---

### 10. Wait for Redis
```yaml
services:
  wait-redis:
    image: busybox
    command: ["sh", "-c", "until nc -z cache 6379; do sleep 1; done"]
    depends_on:
      - cache
    restart: "no"

  app:
    image: my-app
    depends_on:
      wait-redis:
        condition: service_completed_successfully
```

---

### 11. Init: decrypt config with sops
```yaml
services:
  decrypt-config:
    image: mozilla/sops
    command: ["sops", "-d", "/secrets/config.enc.yaml"]
    volumes:
      - ./secrets:/secrets
    environment:
      SOPS_KMS_ARN: arn:aws:kms:...
    restart: "no"
```

---

### 12. wait-for-it.sh script
```bash
# Popular shell script that polls TCP port
./wait-for-it.sh db:5432 --timeout=60 -- node index.js
```
```dockerfile
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
CMD ["/wait-for-it.sh", "db:5432", "--", "node", "index.js"]
```

---

### 13. dockerize — wait utility
```dockerfile
ENV DOCKERIZE_VERSION=v0.7.0
RUN wget -qO- https://github.com/jwilder/dockerize/releases/download/${DOCKERIZE_VERSION}/dockerize-alpine-linux-amd64-${DOCKERIZE_VERSION}.tar.gz \
    | tar xz -C /usr/local/bin
CMD dockerize -wait tcp://db:5432 -timeout 60s node index.js
```

---

### 14. healthcheck + depends_on as alternative to init containers
```yaml
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]
      interval: 5s
      retries: 10

  app:
    image: my-app
    depends_on:
      db:
        condition: service_healthy   # preferred over init wait container
```

---

### 15. Flyway migrations as init service
```yaml
services:
  flyway:
    image: flyway/flyway:10
    command: migrate
    volumes:
      - ./migrations:/flyway/sql:ro
    environment:
      FLYWAY_URL: jdbc:postgresql://db:5432/mydb
      FLYWAY_USER: user
      FLYWAY_PASSWORD: secret
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app:
    depends_on:
      flyway:
        condition: service_completed_successfully
```

---

### 16. Alembic migrations (Python)
```yaml
services:
  migrate:
    image: my-python-app
    command: ["alembic", "upgrade", "head"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
```

---

### 17. Django migrations
```yaml
services:
  migrate:
    image: my-django-app
    command: ["python", "manage.py", "migrate", "--noinput"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
```

---

### 18. Rails migrations
```yaml
services:
  migrate:
    image: my-rails-app
    command: ["bundle", "exec", "rails", "db:migrate"]
    environment:
      DATABASE_URL: postgres://user:secret@db/mydb
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
```

---

### 19. Kubernetes InitContainers equivalent
```yaml
# k8s pod with initContainers
spec:
  initContainers:
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c', 'until nc -z db 5432; do sleep 1; done']
  - name: migrate
    image: my-app
    command: ['node', 'migrate.js']
  containers:
  - name: app
    image: my-app
```

---

### 20. Sequential init containers
```yaml
services:
  init-1:
    image: alpine
    command: ["sh", "-c", "echo 'Step 1' && sleep 2"]
    restart: "no"

  init-2:
    image: alpine
    command: ["sh", "-c", "echo 'Step 2'"]
    depends_on:
      init-1:
        condition: service_completed_successfully
    restart: "no"

  app:
    image: my-app
    depends_on:
      init-2:
        condition: service_completed_successfully
```

---

### 21. Warm up cache
```yaml
services:
  cache-warmer:
    image: my-app
    command: ["node", "scripts/warm-cache.js"]
    environment:
      REDIS_URL: redis://cache:6379
    depends_on:
      cache:
        condition: service_healthy
    restart: "no"

  app:
    depends_on:
      cache-warmer:
        condition: service_completed_successfully
```

---

### 22. Generate SSL certificate
```yaml
services:
  gen-cert:
    image: alpine
    command:
      - sh
      - -c
      - |
        apk add --no-cache openssl
        openssl req -x509 -newkey rsa:4096 -keyout /certs/key.pem \
          -out /certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
    volumes:
      - certs_vol:/certs
    restart: "no"
```

---

### 23. Install plugins / extensions
```yaml
services:
  install-plugins:
    image: grafana/grafana
    command: ["grafana-cli", "plugins", "install", "grafana-piechart-panel"]
    volumes:
      - grafana_plugins:/var/lib/grafana/plugins
    restart: "no"
```

---

### 24. Verify image integrity
```yaml
services:
  verify:
    image: aquasec/trivy
    command: ["image", "--exit-code", "1", "--severity", "CRITICAL", "my-app:latest"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: "no"

  app:
    image: my-app
    depends_on:
      verify:
        condition: service_completed_successfully
```

---

### 25. Collect garbage before start
```yaml
services:
  cleanup:
    image: alpine
    command: ["sh", "-c", "find /data/tmp -mtime +7 -delete"]
    volumes:
      - app_data:/data
    restart: "no"
```

---

### 26. Init container failure handling
```yaml
services:
  migrate:
    image: my-app
    command: ["node", "migrate.js"]
    restart: on-failure    # retry on failure
    # Note: service_completed_successfully requires exit 0
    # If retries are needed, set restart: on-failure and max_attempts
```

---

### 27. One-time init with profile
```yaml
services:
  create-admin:
    image: my-app
    command: ["node", "scripts/create-admin.js"]
    profiles: [init]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"
```
```bash
# Run once on first deploy
docker compose --profile init run --rm create-admin
```

---

### 28. Init container logs
```bash
docker compose logs migrate
docker compose logs -f migrate   # follow until complete
```

---

### 29. Skip init in production (already migrated)
```bash
# Skip migration if DB is already up to date
docker compose run --rm migrate node migrate.js || true
# Or use migration tool's --check flag
```

---

### 30. Init container checklist
```
✓ Use depends_on condition: service_completed_successfully
✓ Set restart: "no" to prevent infinite retry loop
✓ Use healthcheck + condition: service_healthy for DB readiness
✓ Run migrations before app start
✓ One-time inits (create-admin, seed) behind profiles
✓ Keep init containers lightweight (no web server, just scripts)
✓ Log output from init containers for debugging
```
