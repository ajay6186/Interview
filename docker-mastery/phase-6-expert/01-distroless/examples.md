# Examples 6.1 — Distroless Images (30 examples)

---

### 1. What is distroless?
```
Distroless images contain ONLY:
  - The application runtime (e.g. Node.js, Python interpreter)
  - Required system libraries (libc)
  - CA certificates

They do NOT contain:
  - Shell (sh, bash)
  - Package manager (apt, apk)
  - Standard OS utilities (ls, curl, cat)
  - Any other programs

Maintained by Google: gcr.io/distroless/
```

---

### 2. Node.js distroless
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .

FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app /app
CMD ["index.js"]
```

---

### 3. Node.js distroless — exec form
```dockerfile
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app /app
USER nonroot
# CMD must be exec form, no shell:
CMD ["index.js"]   # equivalent to: node index.js
```

---

### 4. Python distroless
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --user -r requirements.txt
COPY . .

FROM gcr.io/distroless/python3-debian12
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app
ENV PATH=/root/.local/bin:$PATH
CMD ["app.py"]
```

---

### 5. Static binary in scratch (most minimal)
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM scratch
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

---

### 6. Static binary in distroless/static (with certs)
```dockerfile
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```
> Use `distroless/static` instead of `scratch` when you need CA certificates.

---

### 7. Available distroless images
```
gcr.io/distroless/static-debian12     — no runtime, only libc + certs
gcr.io/distroless/base-debian12       — libc only
gcr.io/distroless/cc-debian12         — with libgcc/libstdc++
gcr.io/distroless/java21-debian12     — JRE 21
gcr.io/distroless/nodejs20-debian12   — Node.js 20
gcr.io/distroless/python3-debian12    — Python 3
```

---

### 8. :nonroot variant
```dockerfile
# Run as UID 65532 (nonroot user)
FROM gcr.io/distroless/nodejs20-debian12:nonroot
COPY --from=builder /app /app
CMD ["index.js"]
```
> The `:nonroot` tag is equivalent to adding `USER nonroot` in the Dockerfile.

---

### 9. :debug variant — has busybox shell
```dockerfile
# Use ONLY for debugging, not production
FROM gcr.io/distroless/nodejs20-debian12:debug
# Has busybox shell:
# docker run --entrypoint /busybox/sh -it my-app
```

---

### 10. Size comparison
```bash
docker images my-app
# my-app:distroless  ~ 170MB  (nodejs20-debian12)
# my-app:alpine      ~ 165MB  (node:20-alpine)
# my-app:slim        ~ 240MB  (node:20-slim)
# my-app:full        ~ 1.1GB  (node:20)

# Go binary:
# my-go:distroless   ~ 27MB   (distroless/static)
# my-go:scratch      ~ 10MB   (binary only)
# my-go:alpine       ~ 22MB   (golang:1.22-alpine runtime)
```

---

### 11. CVE reduction
```bash
# Trivy scan comparison
trivy image node:20-alpine      # ~50 CVEs
trivy image gcr.io/distroless/nodejs20-debian12  # ~5-10 CVEs
# Fewer packages = fewer vulnerabilities
```

---

### 12. No shell — exec form required
```dockerfile
# WORKS — exec form (no shell needed)
CMD ["node", "index.js"]
ENTRYPOINT ["/app/server"]

# FAILS — shell form requires /bin/sh
CMD node index.js        # Error: no such file or directory
ENTRYPOINT /app/server   # Error: no such file or directory
```

---

### 13. No environment variable expansion in CMD
```dockerfile
# PROBLEM: shell form needed for $PORT expansion
CMD node index.js --port $PORT  # no shell in distroless!

# SOLUTION 1: hardcode the port
CMD ["node", "index.js", "--port", "3000"]

# SOLUTION 2: read env in app code
// index.js
const port = process.env.PORT || 3000;
```

---

### 14. Copying node_modules into distroless
```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package.json ./
CMD ["src/index.js"]
```

---

### 15. Java Spring Boot distroless
```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src/ ./src/
RUN mvn package -DskipTests

FROM gcr.io/distroless/java21-debian12
COPY --from=builder /app/target/app.jar /app/app.jar
EXPOSE 8080
CMD ["/app/app.jar"]
```

---

### 16. Rust distroless
```dockerfile
FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
COPY --from=builder /app/target/release/server /server
ENTRYPOINT ["/server"]
```

---

### 17. Debug distroless container
```bash
# No shell in production image!
docker run --rm -it my-app sh  # fails

# Use debug tag
docker run --rm -it \
  --entrypoint /busybox/sh \
  gcr.io/distroless/nodejs20-debian12:debug

# Or use a debug sidecar
docker run --rm --pid container:my-container \
  nicolaka/netshoot
```

---

### 18. Copy SSL certificates from builder
```dockerfile
FROM alpine AS certs
RUN apk add --no-cache ca-certificates

FROM scratch
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server
```

---

### 19. Time zone data
```dockerfile
FROM alpine AS tzdata
RUN apk add --no-cache tzdata

FROM gcr.io/distroless/static-debian12
COPY --from=tzdata /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/server /server
ENV TZ=UTC
```

---

### 20. passwd file for USER lookup
```dockerfile
FROM golang:1.22-alpine AS builder
# ... build ...
# Create /etc/passwd with nonroot user
RUN echo "nonroot:x:65532:65532::/home/nonroot:/sbin/nologin" > /etc/passwd

FROM scratch
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /app/server /server
USER nonroot
```

---

### 21. Distroless vs Alpine security comparison
```
distroless:
  + Smallest possible attack surface (no shell)
  + No package manager (attacker can't install tools)
  - Harder to debug
  - Some languages need special handling

Alpine:
  + Easy to debug (busybox shell)
  + apk available for missing libs
  - Shell = potential attack vector
  - apk = attacker can install tools
```

---

### 22. COPY everything needed — no apt install fallback
```dockerfile
# distroless has no package manager
# Install everything in builder stage and COPY to final

FROM debian:bookworm-slim AS builder
RUN apt-get update && apt-get install -y libvips-dev
RUN npm install

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /usr/lib/x86_64-linux-gnu/libvips.so.42 \
     /usr/lib/x86_64-linux-gnu/libvips.so.42
COPY --from=builder /app /app
CMD ["index.js"]
```

---

### 23. ldd — check dynamic library dependencies
```bash
# In the builder stage, find what libraries your binary needs:
ldd /app/server
# libpthread.so.0 → /lib/x86_64-linux-gnu/libpthread.so.0
# If using distroless/cc, most glibc libs are included
```

---

### 24. Distroless in Kubernetes
```yaml
spec:
  containers:
  - name: app
    image: gcr.io/distroless/nodejs20-debian12
    securityContext:
      runAsNonRoot: true
      runAsUser: 65532
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
```

---

### 25. Multi-platform distroless
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t my-app:latest \
  --push .
# gcr.io/distroless images support amd64 and arm64
```

---

### 26. chainguard images — alternative to distroless
```dockerfile
FROM cgr.dev/chainguard/node:latest AS builder
# Chainguard provides distroless-like images
# with automatic daily vulnerability patches
FROM cgr.dev/chainguard/node:latest
COPY --from=builder /app /app
CMD ["index.js"]
```

---

### 27. wolfi — chainguard's OS
```dockerfile
# wolfi-based images: apk-based but security-hardened
FROM cgr.dev/chainguard/wolfi-base
RUN apk add --no-cache nodejs npm
```

---

### 28. Inspect distroless image
```bash
docker run --rm gcr.io/distroless/nodejs20-debian12 ls
# Error: exec: "ls": executable file not found in $PATH
# Confirm there's no shell

docker image inspect gcr.io/distroless/nodejs20-debian12
# Look at Config.Entrypoint and Layers
```

---

### 29. CI cache with distroless multi-stage
```bash
docker buildx build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from my-app:cache \
  --cache-to type=inline \
  -t my-app:latest \
  -t my-app:cache \
  --push .
```

---

### 30. Distroless checklist
```
✓ Use multi-stage build: full builder → distroless runtime
✓ Only COPY artifacts needed to run the app
✓ Use :nonroot variant or set USER nonroot
✓ Use exec form for CMD/ENTRYPOINT (no shell)
✓ Handle env var expansion in app code (not shell)
✓ Copy CA certificates if making HTTPS requests
✓ Copy timezone data if time zones matter
✓ Use :debug tag in CI for troubleshooting
✓ Verify with trivy — distroless should have < 10 HIGH CVEs
```
