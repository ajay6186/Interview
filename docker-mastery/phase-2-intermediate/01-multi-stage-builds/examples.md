# Examples 2.1 — Multi-Stage Builds (30 examples)

---

### 1. Basic two-stage build (Node.js)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

### 2. Copy only production deps
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

### 3. Go binary in scratch
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM scratch
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

---

### 4. TypeScript — compile then run JS
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

---

### 5. Python wheel build
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["python", "app.py"]
```

---

### 6. React app build
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
```

---

### 7. Named stages with AS
```dockerfile
FROM node:18-alpine AS base
FROM base AS development
FROM base AS test
FROM base AS production
# Each stage inherits from base — changes to base affect all
```

---

### 8. Build specific stage only
```bash
docker build --target builder -t my-app:builder .
docker build --target development -t my-app:dev .
```

---

### 9. Testing stage — run tests during build
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS test
COPY . .
RUN npm test   # build fails if tests fail

FROM deps AS production
COPY src/ ./src/
CMD ["node", "src/index.js"]
```

---

### 10. COPY --from external image
```dockerfile
FROM alpine AS final
# Copy a binary directly from another Docker image
COPY --from=mikefarah/yq /usr/bin/yq /usr/bin/yq
COPY --from=bitnami/kubectl:1.28 /opt/bitnami/kubectl/bin/kubectl /usr/local/bin/kubectl
```

---

### 11. Multi-stage for security scanning
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM aquasec/trivy AS scanner
COPY --from=builder /app /app
RUN trivy fs /app

FROM node:18-alpine
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

---

### 12. Rust binary in distroless
```dockerfile
FROM rust:1.75-alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
COPY --from=builder /app/target/release/server /server
ENTRYPOINT ["/server"]
```

---

### 13. Java Spring Boot
```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src/ ./src/
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
COPY --from=builder /app/target/app.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

---

### 14. Layer reuse between stages — COPY order matters
```dockerfile
# builder and production share deps layer
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production  # reused if unchanged

FROM node:18-alpine
COPY --from=deps /app/node_modules ./node_modules
```

---

### 15. Debug target with extra tools
```dockerfile
FROM node:18-alpine AS production
WORKDIR /app
COPY . .
RUN npm ci --only=production
CMD ["node", "index.js"]

FROM production AS debug
RUN apk add --no-cache curl bash strace
# docker build --target debug -t my-app:debug .
```

---

### 16. Multi-stage with shared base
```dockerfile
ARG NODE_VERSION=18-alpine
FROM node:${NODE_VERSION} AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY . .
RUN npm run build

FROM base AS final
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
```

---

### 17. Comparing stage sizes
```bash
docker build -t my-app .
docker images my-app
# REPOSITORY  TAG     SIZE
# my-app      latest  95MB   ← final stage only
docker build --target builder -t my-app:builder .
docker images my-app:builder
# my-app  builder  450MB  ← full builder with devDeps
```

---

### 18. COPY --from with stage index (by position)
```dockerfile
FROM node:18 AS stage0
FROM nginx:alpine AS stage1
COPY --from=0 /app/dist /usr/share/nginx/html  # reference by index
# Named stages (AS) are clearer — prefer those
```

---

### 19. Passing build args to specific stages
```dockerfile
FROM node:18-alpine AS builder
ARG NODE_ENV=production
RUN echo "Building in $NODE_ENV mode"

FROM node:18-alpine
# ARG not visible here — each stage has its own scope
```

---

### 20. Multi-stage in docker-compose
```yaml
services:
  web:
    build:
      context: .
      target: production    # build only the production stage
```

---

### 21. .dockerignore is still important in multi-stage
```
# .dockerignore
node_modules/
dist/
.git/
# The build context (COPY . .) is the same for all stages
# .dockerignore applies to ALL COPY . . instructions
```

---

### 22. Caching multi-stage builds in CI
```bash
docker buildx build \
  --cache-from type=registry,ref=my-registry/my-app:buildcache \
  --cache-to type=registry,ref=my-registry/my-app:buildcache,mode=max \
  --target production \
  -t my-app:latest .
```

---

### 23. Multi-stage for static analysis
```dockerfile
FROM node:18-alpine AS lint
WORKDIR /app
COPY . .
RUN npm install
RUN npm run lint   # fails build on lint errors

FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
```

---

### 24. Copying certificates from a stage
```dockerfile
FROM alpine AS certs
RUN apk add --no-cache ca-certificates

FROM scratch
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

---

### 25. Multi-stage for database migrations
```dockerfile
FROM flyway/flyway AS migrate
COPY migrations/ /flyway/sql/
# Run migrations: docker build --target migrate . && docker run ...

FROM node:18-alpine AS app
COPY . .
CMD ["node", "index.js"]
```

---

### 26. Output artifact from build stage
```bash
docker build --output type=local,dest=./output .
# Copies files from final stage to ./output on host
# Useful for build artifacts (binary, dist folder)
```

---

### 27. Conditional stages with build args
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY . .
RUN npm install

FROM base AS with-tests
RUN npm test

FROM base AS without-tests
# Skip tests

FROM without-tests AS final
CMD ["node", "index.js"]
# docker build --target with-tests .   ← runs tests
# docker build --target final .         ← skips tests
```

---

### 28. Multi-stage for compiled assets (webpack)
```dockerfile
FROM node:20 AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim AS backend
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
COPY --from=frontend /frontend/dist ./static
CMD ["python", "app.py"]
```

---

### 29. Multi-stage pitfall — COPY path must exist in source stage
```dockerfile
# If builder stage fails before creating /app/dist:
COPY --from=builder /app/dist ./dist
# Error: failed to solve: failed to compute cache key: "/app/dist" not found
```

---

### 30. When to use multi-stage builds
```
✓ Compiled languages (Go, Rust, Java, TypeScript)
✓ Frontend assets (React/Vue/Angular → nginx)
✓ When you want to include test/lint steps in the build
✓ When build tools are large and not needed at runtime
✓ When building from source (e.g. compiling a custom nginx)

✗ Simple interpreted scripts (Python, Node.js) that don't need compilation
  → But still use a separate deps stage for layer caching
```
