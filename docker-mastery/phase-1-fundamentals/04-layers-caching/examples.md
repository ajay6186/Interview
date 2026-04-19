# Examples 1.4 — Layers and Caching (30 examples)

---

### 1. Every instruction creates a layer
```dockerfile
FROM node:18-alpine      # layer 1
WORKDIR /app             # layer 2
COPY package.json .      # layer 3
RUN npm install          # layer 4
COPY . .                 # layer 5
CMD ["node", "index.js"] # layer 6 (metadata only)
```

---

### 2. Layer cache invalidation — the key rule
```
If a layer changes, all subsequent layers are rebuilt.
Order your instructions from least-changing to most-changing.
```

---

### 3. Bad order — invalidates npm install on every code change
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .              # code change → this layer changes
RUN npm install       # always rebuilds even if package.json unchanged!
```

---

### 4. Good order — cache npm install separately
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./   # only changes when deps change
RUN npm install                          # cached unless deps change
COPY . .                                 # code changes here
```

---

### 5. Python — pip requirements before source code
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .     # cache pip install separately
RUN pip install --no-cache-dir -r requirements.txt
COPY . .                    # source changes don't invalidate pip layer
```

---

### 6. Golang — download modules first
```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download          # cached unless go.mod changes
COPY . .
RUN go build -o server .
```

---

### 7. .dockerignore — exclude files from COPY context
```
# .dockerignore
node_modules/
.git/
.env
*.log
dist/
coverage/
.DS_Store
```
> Without .dockerignore, `COPY . .` sends node_modules (100k+ files) to the build context.

---

### 8. .dockerignore — Python project
```
# .dockerignore
__pycache__/
*.pyc
*.pyo
.env
.venv/
.git/
*.egg-info/
dist/
```

---

### 9. Viewing layers
```bash
docker history my-app
# Shows each layer, its size, and the command that created it
docker inspect my-app --format '{{range .RootFS.Layers}}{{.}}{{"\n"}}{{end}}'
```

---

### 10. Layer sizes
```bash
docker history --no-trunc my-app
# SIZE column shows how much each layer adds to the image
```

---

### 11. Squash layers (experimental)
```bash
docker build --squash -t my-app .
# Merges all new layers into one — smaller image, but no layer caching
# Rarely needed; multi-stage builds are a better approach
```

---

### 12. BuildKit cache mount — npm
```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
CMD ["node", "index.js"]
```
> Cache mount persists across builds but is NOT included in the image.

---

### 13. BuildKit cache mount — pip
```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
COPY . .
```

---

### 14. BuildKit cache mount — apt
```dockerfile
# syntax=docker/dockerfile:1
FROM debian:bookworm-slim
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && apt-get install -y curl
```

---

### 15. COPY --chown avoids extra chmod layer
```dockerfile
# Bad: two layers
COPY . .
RUN chown -R node:node /app

# Good: one layer
COPY --chown=node:node . .
```

---

### 16. RUN && chaining — collapse into one layer
```dockerfile
# 3 layers (wasteful)
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# 1 layer
RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*
```

---

### 17. Temp files in RUN — must be cleaned in same layer
```dockerfile
# Bad: temp file is IN the layer even after removal in next RUN
RUN wget https://example.com/big-tool.tar.gz
RUN tar xzf big-tool.tar.gz
RUN rm big-tool.tar.gz

# Good: clean up in same RUN layer
RUN wget https://example.com/big-tool.tar.gz \
    && tar xzf big-tool.tar.gz \
    && rm big-tool.tar.gz
```

---

### 18. Layer sharing between images
```
Images that share a base image share those layers.
docker pull saves download time by reusing local layers.
This is why all your Node apps should use the same base tag.
```

---

### 19. Cache invalidation with ARG (cache busting)
```dockerfile
ARG CACHEBUST=1
RUN curl -sL https://example.com/config.json -o config.json
# docker build --build-arg CACHEBUST=$(date +%s) .   ← forces re-run
```

---

### 20. Separate test layer from production layer
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS test
COPY . .
RUN npm test

FROM deps AS production
COPY . .
CMD ["node", "index.js"]
```

---

### 21. apt-get clean pattern
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
```

---

### 22. apk --no-cache (Alpine)
```dockerfile
RUN apk add --no-cache curl bash git
# --no-cache: don't save the apk index cache in this layer
```

---

### 23. COPY specific directories instead of everything
```dockerfile
# Instead of COPY . .
COPY src/ ./src/
COPY public/ ./public/
COPY package.json tsconfig.json ./
# More precise — unrelated file changes won't invalidate this layer
```

---

### 24. Context size matters
```bash
docker build -t my-app .
# "Sending build context to Docker daemon  142MB"
# If context is large, check .dockerignore
```

---

### 25. Build context from specific directory
```bash
docker build -t my-app -f docker/Dockerfile ./src
# Uses ./src as build context, Dockerfile from docker/Dockerfile
```

---

### 26. Inline .dockerignore (BuildKit)
```dockerfile
# syntax=docker/dockerfile:1
# syntax=docker/dockerfile:1.2
# Use .dockerignore in the same directory as Dockerfile
# Or use --file to specify a different .dockerignore
```

---

### 27. Layer reuse in CI
```bash
# Pull the previous image to use as cache
docker pull my-app:latest
docker build --cache-from my-app:latest -t my-app:${CI_SHA} .
```

---

### 28. BuildKit inline cache export
```bash
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from my-app:latest \
  -t my-app:latest .
```

---

### 29. dive — explore layers visually
```bash
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive my-app
# Interactive UI showing each layer's file changes and efficiency
```

---

### 30. Layer optimization checklist
```
✓ .dockerignore excludes node_modules, .git, *.log
✓ Dependencies installed BEFORE source code is copied
✓ Multiple RUN commands chained with && to reduce layers
✓ Temp files cleaned in same RUN instruction
✓ BuildKit cache mounts used for package managers
✓ COPY --chown used instead of separate RUN chown
✓ Specific COPY paths instead of blanket COPY . .
```
