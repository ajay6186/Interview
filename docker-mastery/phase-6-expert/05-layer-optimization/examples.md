# Examples 6.5 — Layer Optimization (30 examples)

---

### 1. How layers work
```
Each instruction creates a layer:
  FROM      → base layer (read-only)
  RUN       → new layer (commands executed)
  COPY/ADD  → new layer (files added)
  ENV/LABEL → metadata layer (tiny)

Layers are:
  - Cached by Docker (reused if inputs unchanged)
  - Shared between images (same SHA = one copy on disk)
  - Stacked read-only + one writable container layer on top
```

---

### 2. Layer inspection
```bash
docker history my-app:latest
# Shows each layer, size, and command

docker history --no-trunc my-app:latest
# Full command text

dive my-app:latest
# Interactive TUI — see files per layer, wasted space
```

---

### 3. Cache invalidation rule
```
When a layer changes, ALL subsequent layers are invalidated.
Order matters — put frequently changing content LAST.

# BAD — source code before dependencies
COPY . .               # changes on every commit → invalidates next line
RUN npm install        # re-runs on every commit!

# GOOD
COPY package.json package-lock.json ./   # rarely changes → cached
RUN npm install                          # cached when package.json unchanged
COPY . .                                 # changes often, but no RUN after it
```

---

### 4. Optimal Node.js layer order
```dockerfile
FROM node:20-alpine
WORKDIR /app

# 1. Dependencies (rarely change)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 2. Source (changes often — but no heavy RUN after)
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
```

---

### 5. Optimal Python layer order
```dockerfile
FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["python", "app.py"]
```

---

### 6. Combine RUN commands
```dockerfile
# BAD — 3 layers, intermediate state cached
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# GOOD — 1 layer
RUN apt-get update \
    && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*
```

---

### 7. Clean up in the same RUN
```dockerfile
# IMPORTANT: cleanup must be in the SAME RUN instruction
# A separate RUN rm won't reduce image size — the files exist in prior layer

RUN apt-get update \
    && apt-get install -y \
        build-essential \
        libpq-dev \
    && make install \
    && apt-get purge -y build-essential \    # remove build tools
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*          # remove apt cache
```

---

### 8. .dockerignore
```
# .dockerignore — prevents COPY from adding these to image context
node_modules/
.git/
.github/
dist/
build/
*.log
.env
.env.local
coverage/
.DS_Store
**/*.test.js
**/*.spec.ts
README.md
Dockerfile
docker-compose*.yml
```

---

### 9. .dockerignore impact
```bash
# Without .dockerignore:
# COPY . . sends node_modules (hundreds of MB) to build context
# Causes: slow builds, large context, stale modules in image

# Verify build context size:
docker buildx build . 2>&1 | head -5
# Sending build context to Docker daemon  45.23MB  ← should be small
```

---

### 10. Multi-stage — discard build tools
```dockerfile
FROM node:20-alpine AS builder    # 160MB+ with build tools
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build                  # produces /app/dist

FROM nginx:alpine                  # 20MB — no node, no npm
COPY --from=builder /app/dist /usr/share/nginx/html
# Final image: ~25MB instead of 160MB
```

---

### 11. Copy only what's needed from builder
```dockerfile
# BAD — copies everything including dev deps
COPY --from=builder /app /app

# GOOD — only the built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
```

---

### 12. BuildKit cache mounts
```dockerfile
# npm — persist node_modules cache across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# pip — persist pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# apt — persist apt cache
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y curl
```

---

### 13. Go — statically linked binary
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download          # cache module downloads

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \       # strip debug symbols → smaller binary
    -o server .

FROM scratch                 # no OS — just the binary
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
# Final image: ~10MB
```

---

### 14. -ldflags for smaller binaries
```bash
# Strip debug symbols and DWARF info
go build -ldflags="-s -w" -o server .

# -s: omit symbol table
# -w: omit DWARF debug info
# Typically reduces binary size by 20-30%

# Also: UPX compression (tradeoff: slower startup)
upx --best server
```

---

### 15. npm ci vs npm install
```dockerfile
# npm ci:
# ✓ Faster (uses lockfile exactly)
# ✓ Reproducible (no version resolution)
# ✓ Deletes node_modules before install (clean)
RUN npm ci --only=production

# npm install:
# ✗ Slower (resolves versions)
# ✗ May update lockfile
```

---

### 16. pip — no cache, compile wheels
```dockerfile
# --no-cache-dir: don't store .whl in image
RUN pip install --no-cache-dir -r requirements.txt

# Or pre-compile wheels in builder, copy to runtime
FROM python:3.12-slim AS builder
RUN pip wheel --no-cache-dir --wheel-dir=/wheels -r requirements.txt

FROM python:3.12-slim
COPY --from=builder /wheels /wheels
RUN pip install --no-index --find-links=/wheels -r requirements.txt
```

---

### 17. squash layers (experimental)
```bash
# Merge all layers into one (removes intermediate layer waste)
# Loses layer sharing — use only when image won't be pushed as base
docker build --squash -t my-app .

# BuildKit equivalent: use multi-stage with minimal final stage
```

---

### 18. Image size comparison
```bash
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Typical sizes:
# my-app:full         1.2GB  (node:20)
# my-app:slim         340MB  (node:20-slim)
# my-app:alpine       165MB  (node:20-alpine)
# my-app:multistage    45MB  (alpine + dist only)
# my-app:distroless   170MB  (gcr.io/distroless/nodejs20)
# my-go:scratch        10MB  (Go static binary)
```

---

### 19. Reuse base layers across services
```yaml
# All services using same base → layers shared on host
services:
  api:
    image: my-registry/api:latest    # FROM node:20-alpine
  worker:
    image: my-registry/worker:latest # FROM node:20-alpine (shared!)
```
> The node:20-alpine layers are downloaded once and reused.

---

### 20. Parallel build stages
```dockerfile
# BuildKit builds independent stages in parallel
FROM node:20-alpine AS deps
RUN npm ci

FROM node:20-alpine AS test-runner
RUN npm ci --include=dev

# Both stages above build in parallel!
FROM node:20-alpine AS final
COPY --from=deps /app/node_modules ./node_modules
```

---

### 21. COPY with glob patterns
```dockerfile
# Copy only .js files (exclude .ts, test files)
COPY src/**/*.js ./src/

# Copy specific files
COPY package.json package-lock.json tsconfig.json ./
```

---

### 22. Heredoc in RUN (BuildKit)
```dockerfile
# Cleaner multi-line scripts without && chains
RUN <<EOF
set -e
apt-get update
apt-get install -y curl wget
rm -rf /var/lib/apt/lists/*
useradd -r -s /bin/false appuser
EOF
```

---

### 23. Layer caching in CI
```bash
# Use registry as cache storage (survives CI runner restarts)
docker buildx build \
  --cache-from type=registry,ref=my-registry/my-app:cache \
  --cache-to   type=registry,ref=my-registry/my-app:cache,mode=max \
  -t my-registry/my-app:latest \
  --push \
  .
```

---

### 24. Inline cache
```bash
# Embed cache in image itself
docker buildx build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t my-registry/my-app:latest \
  --push \
  .

# Later builds can use:
docker buildx build \
  --cache-from my-registry/my-app:latest \
  -t my-registry/my-app:new \
  .
```

---

### 25. GitHub Actions cache
```yaml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    push: true
    tags: my-app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
# Fastest CI cache — stored in GitHub's cache service
```

---

### 26. Avoid COPY ADD for URLs
```dockerfile
# BAD — ADD fetches URL, creates layer, can't be cached well
ADD https://example.com/app.tar.gz /app/

# GOOD — fetch in RUN with cache control
RUN --mount=type=cache,target=/tmp/downloads \
    curl -Lo /tmp/downloads/app.tar.gz https://example.com/app.tar.gz \
    && tar xzf /tmp/downloads/app.tar.gz -C /app/
```

---

### 27. Keep WORKDIR consistent
```dockerfile
# Set once and reuse
WORKDIR /app

# All subsequent paths are relative to /app
COPY package.json .          # goes to /app/package.json
COPY src/ ./src/             # goes to /app/src/
RUN npm start                # runs from /app/
```

---

### 28. Measure optimization impact
```bash
# Before optimization
docker build -t my-app:before .
docker images my-app:before --format "{{.Size}}"

# After optimization
docker build -t my-app:after .
docker images my-app:after --format "{{.Size}}"

# Measure build time
time docker build --no-cache -t my-app:timed .

# With Dive — find wasted space
dive my-app:after
# Shows: Image efficiency score, wasted space percentage
```

---

### 29. Common optimization mistakes
```
✗ Copying node_modules into image (instead of running npm ci)
✗ Leaving apt cache (/var/lib/apt/lists/)
✗ Multiple RUN apt-get (splits cleanup from install)
✗ COPY . . before npm install (breaks caching)
✗ No .dockerignore (sends .git, node_modules in context)
✗ Using :latest tag for base (non-deterministic builds)
✗ Installing dev tools in production stage
✗ Large log files or test fixtures in image context
```

---

### 30. Layer optimization checklist
```
Ordering:
✓ Dependencies (package.json, requirements.txt) BEFORE source code
✓ Rarely-changing files first, frequently-changing last

Size reduction:
✓ Multi-stage builds — only copy final artifacts
✓ Minimal base image (alpine/distroless/scratch)
✓ Combine RUN commands and clean up in same layer
✓ .dockerignore (exclude node_modules, .git, tests)
✓ Strip debug symbols from binaries (-ldflags="-s -w")

Build speed:
✓ BuildKit cache mounts for package managers
✓ Registry or GHA cache in CI
✓ --platform=$BUILDPLATFORM on build stage
✓ Parallel independent stages (BuildKit auto-detects)

Verification:
✓ docker history — inspect layer sizes
✓ dive — find wasted space
✓ trivy — scan for CVEs (smaller = fewer)
✓ time docker build --no-cache — measure build time
```
