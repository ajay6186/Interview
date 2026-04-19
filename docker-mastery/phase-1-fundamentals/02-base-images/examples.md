# Examples 1.2 — Base Images (30 examples)

---

### 1. Node.js image variants
```dockerfile
FROM node:20           # Full Debian — ~1GB, most compatible
FROM node:20-slim      # Debian slim — ~220MB, fewer tools
FROM node:20-alpine    # Alpine Linux — ~120MB, minimal
FROM node:20-bookworm  # Explicit Debian Bookworm full
FROM node:20-bookworm-slim  # Explicit Debian Bookworm slim
```

---

### 2. Python image variants
```dockerfile
FROM python:3.12           # Full Debian
FROM python:3.12-slim      # Debian slim (recommended for production)
FROM python:3.12-alpine    # Alpine (watch for C-extension issues)
FROM python:3.12-bookworm  # Explicit Debian Bookworm
```

---

### 3. Alpine — why it's small
```
Alpine uses musl libc + BusyBox instead of glibc + GNU coreutils.
Package manager: apk (not apt/yum)
Default shell:   /bin/sh (not bash)
Size:            ~5MB base OS
```

---

### 4. Installing packages on Alpine
```dockerfile
FROM alpine:3.19
RUN apk add --no-cache curl bash git
```
> `--no-cache` skips the local package index cache, keeping the layer small.

---

### 5. Installing packages on Debian/Ubuntu
```dockerfile
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```
> `--no-install-recommends` skips suggested packages. Always clean `/var/lib/apt/lists/*`.

---

### 6. Ubuntu base image
```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y python3 && \
    rm -rf /var/lib/apt/lists/*
```

---

### 7. Debian bookworm-slim — recommended for most apps
```dockerfile
FROM debian:bookworm-slim
# Smaller than full Debian, more compatible than Alpine
```

---

### 8. Scratch — truly minimal (for compiled binaries)
```dockerfile
FROM scratch
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
# Zero OS — only your binary inside
```

---

### 9. Distroless — no shell, no package manager
```dockerfile
FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app /app
WORKDIR /app
CMD ["index.js"]
```

---

### 10. Official vs community images
```
Official:    node, python, nginx, postgres — maintained by Docker/upstream teams
Verified:    bitnami/nginx — verified publisher
Community:   username/image — use with care; review Dockerfile
```

---

### 11. Pinning to a specific version (tag)
```dockerfile
FROM node:20.11.0-alpine3.19   # very specific — most reproducible
FROM node:20-alpine            # minor versions float — usually fine
FROM node:20                   # major version only — risky
FROM node:latest               # never use in production
```

---

### 12. Pinning to digest
```dockerfile
FROM node:20-alpine@sha256:b4d299311845147e7e47c970566...
# sha256 digest never changes — fully reproducible builds
```

---

### 13. Checking image size
```bash
docker images node
# REPOSITORY  TAG            SIZE
# node        20             1.1GB
# node        20-slim        232MB
# node        20-alpine      130MB
```

---

### 14. Alpine vs Debian — compatibility gotcha
```dockerfile
# Alpine uses musl libc; some npm packages with native bindings may fail
# If you hit build errors on Alpine, switch to -slim
FROM node:20-slim
```

---

### 15. Python on Alpine — common pitfall
```dockerfile
# Pure-Python packages work fine
# Packages with C extensions (pandas, numpy) need build tools:
FROM python:3.12-alpine
RUN apk add --no-cache gcc musl-dev linux-headers
RUN pip install pandas
# OR: just use python:3.12-slim instead
```

---

### 16. Multi-stage: fat builder + slim runtime
```dockerfile
FROM node:20 AS builder       # full image for building
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine           # slim for production
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

---

### 17. Using an LTS tag
```dockerfile
FROM node:lts-alpine    # Long Term Support version
FROM node:current-alpine  # latest — changes more often
```

---

### 18. nginx base image
```dockerfile
FROM nginx:1.25-alpine    # lightweight nginx
FROM nginx:1.25           # Debian-based nginx
FROM nginx:mainline-alpine  # latest nginx features
```

---

### 19. Postgres base image
```dockerfile
FROM postgres:16-alpine
ENV POSTGRES_DB=mydb
ENV POSTGRES_USER=user
ENV POSTGRES_PASSWORD=secret
```

---

### 20. Redis base image
```dockerfile
FROM redis:7-alpine
# Redis Alpine is tiny and production-ready
```

---

### 21. Checking base image vulnerabilities
```bash
docker scout cves node:20-alpine
# or
docker run --rm aquasec/trivy image node:20-alpine
```

---

### 22. Renovate / Dependabot — auto-update base images
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: docker
    directory: "/"
    schedule:
      interval: weekly
```

---

### 23. What's inside an image
```bash
docker run --rm -it node:20-alpine sh
# Explore: ls, cat /etc/os-release, node --version, npm --version
```

---

### 24. os-release — identify the base OS
```bash
docker run --rm node:20-alpine cat /etc/os-release
# NAME="Alpine Linux"
# VERSION_ID=3.19.x

docker run --rm node:20-slim cat /etc/os-release
# NAME="Debian GNU/Linux"
# VERSION_ID="12"
```

---

### 25. Choosing between Alpine and slim
```
Use Alpine when:
  - Image size is critical
  - No native C extensions needed
  - Alpine-compatible binaries confirmed

Use -slim when:
  - You need glibc compatibility
  - Working with native npm/pip packages
  - More predictable behavior
```

---

### 26. Custom base image for shared tooling
```dockerfile
# base.Dockerfile — published as registry.example.com/base:1.0
FROM node:20-alpine
RUN apk add --no-cache curl bash
WORKDIR /app

# App Dockerfile
FROM registry.example.com/base:1.0
COPY . .
RUN npm install
CMD ["node", "index.js"]
```

---

### 27. Verify what user an image runs as
```bash
docker run --rm node:20-alpine id
# uid=0(root) gid=0(root) groups=0(root)
# → running as root; add USER directive to switch
```

---

### 28. Alpine image creation date
```bash
docker inspect node:20-alpine --format '{{.Created}}'
```

---

### 29. Pull a specific platform image
```bash
docker pull --platform linux/amd64 node:20-alpine
docker pull --platform linux/arm64 node:20-alpine
```

---

### 30. Best practice summary
```
1. Use official images
2. Pin to a specific minor version tag (e.g. node:20.11-alpine3.19)
3. Prefer -slim or -alpine for smaller attack surface
4. Only install packages you need
5. Use multi-stage builds to keep runtime image minimal
6. Regularly update base images for security patches
```
