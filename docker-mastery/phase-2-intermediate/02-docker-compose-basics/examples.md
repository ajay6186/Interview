# Examples 2.2 — Docker Compose Basics (30 examples)

---

### 1. Minimal docker-compose.yml
```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
```

---

### 2. Build from Dockerfile
```yaml
services:
  web:
    build: .           # uses ./Dockerfile
    ports:
      - "3000:3000"
```

---

### 3. Build with context and Dockerfile path
```yaml
services:
  web:
    build:
      context: ./app
      dockerfile: docker/Dockerfile.prod
    ports:
      - "3000:3000"
```

---

### 4. Two services — web + database
```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
```

---

### 5. depends_on — start order
```yaml
services:
  web:
    depends_on:
      - db        # db starts before web
  db:
    image: postgres:16-alpine
```
> `depends_on` controls start ORDER, not readiness. Web may still start before DB is accepting connections.

---

### 6. depends_on with condition
```yaml
services:
  web:
    depends_on:
      db:
        condition: service_healthy   # waits for health check to pass
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]
      interval: 5s
      timeout: 5s
      retries: 5
```

---

### 7. environment — list form
```yaml
services:
  web:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=db
```

---

### 8. environment — map form
```yaml
services:
  web:
    environment:
      NODE_ENV: production
      PORT: "3000"
      DB_HOST: db
```

---

### 9. env_file
```yaml
services:
  web:
    env_file:
      - .env
      - .env.local   # overrides .env
```

---

### 10. Compose CLI commands
```bash
docker compose up            # start all services (foreground)
docker compose up -d         # detached (background)
docker compose up --build    # rebuild images before starting
docker compose down          # stop and remove containers
docker compose down -v       # also remove volumes
docker compose ps            # list running services
docker compose logs          # show logs
docker compose logs -f web   # follow logs for web service
```

---

### 11. Restart policies
```yaml
services:
  web:
    restart: no            # default — don't restart
  worker:
    restart: always        # always restart
  db:
    restart: on-failure    # restart on non-zero exit
  cache:
    restart: unless-stopped # restart unless manually stopped
```

---

### 12. Named volumes
```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:   # Docker manages this volume
```

---

### 13. Bind mount (development)
```yaml
services:
  web:
    build: .
    volumes:
      - ./src:/app/src   # host:container — live code reload
    ports:
      - "3000:3000"
```

---

### 14. networks — custom network
```yaml
services:
  web:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
```

---

### 15. Service discovery — use service name as hostname
```yaml
services:
  web:
    environment:
      DB_HOST: db      # service name = hostname on the compose network
  db:
    image: postgres:16-alpine
```

---

### 16. ports vs expose
```yaml
services:
  web:
    ports:
      - "3000:3000"    # published to host — accessible externally

  db:
    image: postgres:16-alpine
    expose:
      - "5432"         # accessible only to other services, not host
```

---

### 17. Command override
```yaml
services:
  web:
    image: my-app
    command: ["node", "worker.js"]   # overrides Dockerfile CMD
```

---

### 18. Entrypoint override
```yaml
services:
  debug:
    image: my-app
    entrypoint: ["/bin/sh"]
    command: ["-c", "while true; do sleep 1; done"]
```

---

### 19. Service name aliasing
```yaml
services:
  web:
    image: my-app
    networks:
      backend:
        aliases:
          - api
          - web-service
```

---

### 20. Container name
```yaml
services:
  web:
    container_name: my-web-container   # fixed name (no suffix)
```
> With a fixed `container_name` you can't scale with `--scale`.

---

### 21. Scaling services
```bash
docker compose up -d --scale web=3
# Starts 3 instances of the web service
# Don't use container_name when scaling
```

---

### 22. exec into a running service
```bash
docker compose exec web sh
docker compose exec db psql -U user -d mydb
```

---

### 23. Run a one-off command
```bash
docker compose run --rm web node seed.js
docker compose run --rm web npm test
```

---

### 24. Build args in compose
```yaml
services:
  web:
    build:
      context: .
      args:
        - NODE_ENV=production
        - APP_VERSION=2.0.0
```

---

### 25. Image tagging in compose
```yaml
services:
  web:
    build:
      context: .
    image: my-registry.io/my-app:latest   # tag the built image
```

---

### 26. Healthcheck in compose
```yaml
services:
  web:
    image: my-app
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

---

### 27. Working directory override
```yaml
services:
  web:
    working_dir: /app/src
```

---

### 28. User override
```yaml
services:
  web:
    user: "1000:1000"   # uid:gid
```

---

### 29. Profiles — start only certain services
```yaml
services:
  web:
    image: my-app
  tools:
    image: my-tools
    profiles:
      - tools    # only starts with: docker compose --profile tools up
```

---

### 30. docker-compose.yml vs docker compose (V2)
```bash
# V1: docker-compose (hyphenated, Python binary)
docker-compose up

# V2: docker compose (plugin, part of Docker CLI)
docker compose up

# V2 is the current standard — use it
# Check: docker compose version
```
