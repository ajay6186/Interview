# Examples 6.2 — Multi-Arch Builds (30 examples)

---

### 1. What is multi-arch?
```
Multi-arch images work on multiple CPU architectures:
  linux/amd64   — standard x86_64 (Intel/AMD servers, most desktops)
  linux/arm64   — 64-bit ARM (Apple M1/M2, AWS Graviton, Raspberry Pi 4)
  linux/arm/v7  — 32-bit ARM (Raspberry Pi 2/3)
  linux/s390x   — IBM Z (mainframe)
  linux/ppc64le — PowerPC

A single image tag (e.g. nginx:alpine) works on all platforms.
```

---

### 2. Check current platform
```bash
docker info --format '{{.Architecture}}'
# x86_64 or aarch64

uname -m
# x86_64 / aarch64 / armv7l
```

---

### 3. Enable multi-arch with buildx
```bash
# buildx is included in Docker Desktop by default
# On Linux, enable explicitly:
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap
# Verify platforms listed: linux/amd64, linux/arm64, linux/arm/v7
```

---

### 4. Build for single platform (no push)
```bash
docker buildx build \
  --platform linux/arm64 \
  -t my-app:arm64 \
  --load \        # load into local docker images
  .
```

---

### 5. Build and push multi-arch manifest
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t my-registry/my-app:latest \
  --push \        # push directly (can't --load multi-arch)
  .
```

---

### 6. Multi-arch with GitHub Container Registry
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/myuser/my-app:latest \
  -t ghcr.io/myuser/my-app:1.0.0 \
  --push \
  .
```

---

### 7. TARGETPLATFORM ARG
```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder
ARG TARGETOS TARGETARCH

WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -o server .

FROM scratch
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

---

### 8. Available build ARGs
```dockerfile
# Docker automatically sets these when building multi-arch:
ARG BUILDPLATFORM    # platform of build host (e.g. linux/amd64)
ARG BUILDOS          # OS of build host
ARG BUILDARCH        # arch of build host
ARG TARGETPLATFORM   # target platform (e.g. linux/arm64)
ARG TARGETOS         # target OS
ARG TARGETARCH       # target arch (amd64, arm64, arm)
ARG TARGETVARIANT    # variant (e.g. v7 for arm/v7)
```

---

### 9. Cross-compilation vs QEMU emulation
```
Cross-compilation:
  Build binary for arm64 ON amd64 host (fast, requires CC support)
  Use: GOOS=linux GOARCH=arm64 go build ...

QEMU emulation:
  Run arm64 instructions on amd64 host via emulation (slow but universal)
  Used automatically when native cross-compile is not possible
  Required for: npm install, pip install on foreign arch
```

---

### 10. QEMU emulation setup
```bash
# Register QEMU handlers (Linux host only)
docker run --rm --privileged \
  multiarch/qemu-user-static --reset -p yes
# After this, Docker can run/build for arm64, arm/v7, etc.
```

---

### 11. Use BUILDPLATFORM for build stage
```dockerfile
# Build stage runs on native platform (fast), target stage runs on TARGETPLATFORM
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine   # automatically pulled for TARGETPLATFORM
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

---

### 12. Platform-specific packages
```dockerfile
FROM debian:bookworm-slim
ARG TARGETARCH

RUN case "$TARGETARCH" in \
      amd64) ARCH_PKG="amd64" ;; \
      arm64) ARCH_PKG="arm64" ;; \
      *) echo "Unsupported: $TARGETARCH" && exit 1 ;; \
    esac \
    && apt-get update \
    && apt-get install -y some-package:${ARCH_PKG}
```

---

### 13. Download arch-specific binary
```dockerfile
ARG TARGETARCH
RUN case "$TARGETARCH" in \
      amd64) URL="https://example.com/app-linux-amd64" ;; \
      arm64) URL="https://example.com/app-linux-arm64" ;; \
    esac \
    && curl -Lo /usr/local/bin/app "$URL" \
    && chmod +x /usr/local/bin/app
```

---

### 14. Inspect manifest list
```bash
docker buildx imagetools inspect nginx:alpine
# Shows:
# MediaType: application/vnd.docker.distribution.manifest.list.v2+json
# Manifests:
#   linux/amd64  sha256:abc...
#   linux/arm64  sha256:def...
#   linux/arm/v7 sha256:ghi...
```

---

### 15. Create manifest list manually
```bash
# Build and push individual arch images
docker buildx build --platform linux/amd64 -t my-app:amd64 --push .
docker buildx build --platform linux/arm64 -t my-app:arm64 --push .

# Create manifest list
docker buildx imagetools create \
  --tag my-registry/my-app:latest \
  my-app:amd64 \
  my-app:arm64
```

---

### 16. GitHub Actions multi-arch
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Set up QEMU
  uses: docker/setup-qemu-action@v3

- name: Build and push
  uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
```

---

### 17. Cache in multi-arch CI
```yaml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: my-app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

---

### 18. Docker compose multi-arch
```yaml
# docker-compose.yml works on any platform automatically
# The pulled images are architecture-specific
services:
  app:
    image: my-registry/my-app:latest  # multi-arch manifest
    # Docker pulls the correct arch automatically
```

---

### 19. Run arm64 image on amd64 (test)
```bash
# With QEMU registered:
docker run --rm --platform linux/arm64 \
  ubuntu:22.04 uname -m
# aarch64
```

---

### 20. Python multi-arch
```dockerfile
FROM --platform=$BUILDPLATFORM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
# Use cross-compilation wheel cache if available
RUN pip install --user -r requirements.txt

FROM python:3.12-slim
COPY --from=builder /root/.local /root/.local
COPY . .
CMD ["python", "app.py"]
```

---

### 21. Rust multi-arch cross-compilation
```dockerfile
FROM --platform=$BUILDPLATFORM rust:1.75 AS builder
ARG TARGETARCH

RUN case "$TARGETARCH" in \
      arm64) TARGET=aarch64-unknown-linux-gnu \
             && apt-get install -y gcc-aarch64-linux-gnu ;; \
      amd64) TARGET=x86_64-unknown-linux-gnu ;; \
    esac \
    && rustup target add $TARGET

WORKDIR /app
COPY . .
RUN cargo build --release --target $TARGET
```

---

### 22. Java multi-arch
```dockerfile
FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS builder
# Maven cross-compilation works natively — JVM bytecode is arch-independent
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src/ ./src/
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre  # multi-arch JRE image
COPY --from=builder /app/target/app.jar /app.jar
CMD ["java", "-jar", "/app.jar"]
```

---

### 23. Check if image is multi-arch
```bash
docker manifest inspect nginx:alpine | \
  python3 -c "import json,sys; m=json.load(sys.stdin); \
  [print(x['platform']['os']+'/'+x['platform']['architecture']) \
   for x in m.get('manifests',[])]"
```

---

### 24. Build cache per architecture
```bash
# BuildKit caches are platform-specific automatically
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --cache-from type=registry,ref=my-registry/my-app:cache \
  --cache-to type=registry,ref=my-registry/my-app:cache,mode=max \
  --push -t my-registry/my-app:latest .
```

---

### 25. Multi-arch with private base image
```dockerfile
# Private registry images work the same if they have multi-arch manifests
FROM --platform=$BUILDPLATFORM my-registry.internal/base:latest AS builder
```

---

### 26. Native arm64 builder node
```bash
# For faster arm64 builds: use a native arm64 builder node
docker buildx create \
  --name arm64-node \
  --platform linux/arm64 \
  ssh://user@arm64-host
docker buildx create \
  --name multiarch \
  --append arm64-node \
  --use
```

---

### 27. Multi-arch with FROM scratch
```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.22 AS builder
ARG TARGETOS TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -o server .

FROM scratch
COPY --from=builder /server /server
ENTRYPOINT ["/server"]
# Works for both amd64 and arm64
```

---

### 28. Troubleshoot QEMU issues
```bash
# If you get "exec format error":
# 1. Re-register QEMU
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

# 2. Or use --platform on the FROM:
FROM --platform=linux/amd64 node:20-alpine  # force native build

# 3. Check if the base image supports the target platform
docker buildx imagetools inspect node:20-alpine | grep Platform
```

---

### 29. Multi-arch checklist
```
Build:
✓ Use docker buildx (not docker build)
✓ Set up QEMU for non-native platforms
✓ Declare TARGETPLATFORM/TARGETOS/TARGETARCH ARGs
✓ Use --platform=$BUILDPLATFORM on build stages

Performance:
✓ Use cross-compilation where possible (Go, Rust, Java)
✓ Use QEMU only for install stages (pip, npm) when needed
✓ Cache layers per platform

CI/CD:
✓ Use docker/setup-qemu-action and docker/setup-buildx-action
✓ Cache with type=gha or type=registry
✓ Push to registry (--load not supported for multi-arch)
```

---

### 30. Verify multi-arch image after push
```bash
docker buildx imagetools inspect my-registry/my-app:latest

# Expected output shows multiple manifests:
# Name: my-registry/my-app:latest
# MediaType: application/vnd.oci.image.index.v1+json
# ...
# linux/amd64  sha256:...
# linux/arm64  sha256:...
```
