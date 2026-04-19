# Examples 1.3 — ENV and ARG (30 examples)

---

### 1. ENV — set environment variable in image
```dockerfile
FROM node:18-alpine
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "index.js"]
```

---

### 2. ENV — multiple variables (single layer)
```dockerfile
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info
```

---

### 3. ARG — build-time variable (not in final image)
```dockerfile
ARG APP_VERSION=1.0.0
RUN echo "Building version $APP_VERSION"
LABEL version=$APP_VERSION
```

---

### 4. ARG — pass at build time
```bash
docker build --build-arg APP_VERSION=2.0.0 -t my-app .
```

---

### 5. ARG before FROM — global build args
```dockerfile
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine

# Re-declare ARG after FROM to use it in instructions
ARG NODE_VERSION
RUN echo "Node version: $NODE_VERSION"
```

---

### 6. ENV vs ARG — key difference
```
ARG:
  - Available only during docker build
  - Not present in running container
  - Set with: --build-arg NAME=value
  - Good for: build-time config (version numbers, registry URLs)

ENV:
  - Baked into the image layer
  - Available in the running container
  - Set with: docker run -e NAME=value (can override)
  - Good for: runtime config (NODE_ENV, PORT)
```

---

### 7. ARG → ENV — promote to runtime
```dockerfile
ARG API_URL=https://api.example.com
ENV API_URL=$API_URL
# Now available at runtime, but value is baked in at build time
```

---

### 8. Using ENV in CMD
```dockerfile
ENV PORT=3000
EXPOSE $PORT
CMD node index.js   # shell form expands $PORT
```

---

### 9. Overriding ENV at runtime
```bash
docker run -e NODE_ENV=development my-app
docker run -e PORT=8080 -e LOG_LEVEL=debug my-app
docker run --env-file .env my-app
```

---

### 10. .env file for docker run
```bash
# .env
NODE_ENV=production
PORT=3000
DB_HOST=db

docker run --env-file .env my-app
```

---

### 11. Viewing env vars in a container
```bash
docker run --rm my-app env
docker exec my-container env
docker inspect my-container --format '{{json .Config.Env}}'
```

---

### 12. ARG — base image version as build arg
```dockerfile
ARG PYTHON_VERSION=3.12-slim
FROM python:${PYTHON_VERSION}
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```
```bash
docker build --build-arg PYTHON_VERSION=3.11-slim -t my-app .
```

---

### 13. ARG with no default — required build arg
```dockerfile
ARG REGISTRY
FROM ${REGISTRY}/base-image:latest
# Must pass: docker build --build-arg REGISTRY=myregistry.io .
```

---

### 14. ARG secret — NEVER use for sensitive values
```dockerfile
# NEVER DO THIS — build args appear in docker history
ARG DB_PASSWORD
RUN echo "DB_PASSWORD=$DB_PASSWORD"
# Use BuildKit secrets instead (see exercise 3.5)
```

---

### 15. NODE_ENV=production effect
```dockerfile
ENV NODE_ENV=production
RUN npm ci --only=production   # skips devDependencies
```

---

### 16. Build-time feature flags
```dockerfile
ARG ENABLE_FEATURE_X=false
RUN if [ "$ENABLE_FEATURE_X" = "true" ]; then npm run build:feature-x; fi
```

---

### 17. ENV for database connection (development defaults)
```dockerfile
ENV DB_HOST=localhost \
    DB_PORT=5432 \
    DB_NAME=mydb
# Override at runtime with docker run -e DB_HOST=prod-db
```

---

### 18. ARG for conditional base image
```dockerfile
ARG TARGET=production

FROM node:18-alpine AS production
WORKDIR /app
COPY . .
RUN npm ci --only=production
CMD ["node", "index.js"]

FROM node:18 AS development
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "dev"]
```
```bash
docker build --target production -t my-app:prod .
docker build --target development -t my-app:dev .
```

---

### 19. PYTHONDONTWRITEBYTECODE + PYTHONUNBUFFERED
```dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
# PYTHONDONTWRITEBYTECODE: don't create .pyc files
# PYTHONUNBUFFERED: print to stdout/stderr immediately (no buffering)
```

---

### 20. PATH — extend PATH with ENV
```dockerfile
ENV PATH="/app/bin:$PATH"
```

---

### 21. Dynamic default with shell in ARG
```dockerfile
ARG BUILD_DATE
RUN echo "Built on: ${BUILD_DATE:-unknown}"
```
```bash
docker build --build-arg BUILD_DATE=$(date +%Y-%m-%d) -t my-app .
```

---

### 22. ARG for registry prefix
```dockerfile
ARG REGISTRY=docker.io/library
FROM ${REGISTRY}/node:18-alpine
```

---

### 23. Inspect all build args used
```bash
docker history my-app
# Shows each layer command — ARG values are visible here!
# This is why ARGs should NOT hold secrets
```

---

### 24. ENV in docker-compose
```yaml
services:
  web:
    image: my-app
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
```

---

### 25. Build args in docker-compose
```yaml
services:
  web:
    build:
      context: .
      args:
        APP_VERSION: "2.0.0"
        REGISTRY: my-registry.io
```

---

### 26. Layer caching and ARG
```dockerfile
ARG CACHEBUST=1
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm install
# Change CACHEBUST to invalidate cache:
# docker build --build-arg CACHEBUST=$(date +%s) .
```

---

### 27. Spring Boot / Java ENV
```dockerfile
FROM eclipse-temurin:21-jre-alpine
ENV JAVA_OPTS="-Xmx512m -Xms128m"
COPY app.jar app.jar
ENTRYPOINT exec java $JAVA_OPTS -jar app.jar
```

---

### 28. ARG for multi-architecture
```dockerfile
ARG TARGETARCH
RUN echo "Building for $TARGETARCH"
RUN if [ "$TARGETARCH" = "amd64" ]; then curl -Lo /bin/tool https://...-amd64; fi
```

---

### 29. docker run -e vs --env-file precedence
```bash
# --env-file values are overridden by -e
docker run --env-file .env -e NODE_ENV=development my-app
# NODE_ENV is "development" regardless of .env contents
```

---

### 30. ENV and ARG best practices
```
1. Use ARG for build-time values (versions, registry URLs)
2. Use ENV for runtime configuration
3. Provide sensible defaults in ENV
4. NEVER store secrets in ARG or ENV — use BuildKit secrets or runtime secret managers
5. Document required env vars in README.md
6. Use .env.example as a template (never commit .env)
```
