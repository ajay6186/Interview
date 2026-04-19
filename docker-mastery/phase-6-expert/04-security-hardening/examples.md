# Examples 6.4 — Security Hardening (30 examples)

---

### 1. Security layers overview
```
Image security:
  - Minimal base image (distroless/alpine/scratch)
  - No hardcoded secrets in layers
  - Vulnerability scanning

Runtime security:
  - Non-root user
  - Read-only filesystem
  - Drop Linux capabilities
  - No new privileges
  - Seccomp/AppArmor profiles

Supply chain:
  - Pin image digests
  - Sign images (cosign)
  - SBOM (software bill of materials)
```

---

### 2. Non-root user
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
RUN npm ci --only=production
USER node          # Switch to non-root before CMD
EXPOSE 3000
CMD ["node", "index.js"]
```

---

### 3. Create minimal user
```dockerfile
FROM debian:bookworm-slim
RUN groupadd -r appgroup && useradd -r -g appgroup -s /sbin/nologin appuser
COPY --chown=appuser:appgroup . /app
USER appuser
```

---

### 4. Read-only root filesystem
```bash
docker run --read-only my-app
# Any write attempt → permission denied

# Allow specific writable dirs:
docker run --read-only \
  --tmpfs /tmp \
  --tmpfs /var/run \
  my-app
```
```yaml
# compose:
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
```

---

### 5. Drop all capabilities
```bash
docker run --cap-drop ALL my-app

# Add back only what's needed:
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE my-app
```
```yaml
services:
  app:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE   # bind port < 1024 as non-root
```

---

### 6. No new privileges
```bash
docker run --security-opt no-new-privileges my-app
```
```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
```
> Prevents setuid/setgid escalation.

---

### 7. Full hardened compose service
```yaml
services:
  app:
    image: my-registry/my-app:latest@sha256:abc123
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    user: "1001:1001"
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: "0.5"
```

---

### 8. Seccomp profile
```bash
# Default Docker seccomp blocks ~300 syscalls
# Use custom profile:
docker run \
  --security-opt seccomp=/etc/docker/seccomp/default.json \
  my-app

# Or restrict further with custom profile
docker run \
  --security-opt seccomp=my-seccomp.json \
  my-app
```

---

### 9. AppArmor profile
```bash
# Load a profile
sudo apparmor_parser -r -W /etc/apparmor.d/docker-nginx

# Apply to container
docker run --security-opt apparmor=docker-nginx nginx
```

---

### 10. No secrets in ENV
```dockerfile
# BAD — secret stored in image layer forever
ENV API_KEY=secret123

# GOOD — pass at runtime
# docker run -e API_KEY=$API_KEY my-app
# or use Docker secrets / k8s secrets
```

---

### 11. BuildKit secrets — no secret in image
```dockerfile
# --mount=type=secret never stored in any layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install
```
```bash
docker buildx build \
  --secret id=npmrc,src=$HOME/.npmrc \
  -t my-app .
```

---

### 12. Verify no secrets in layers
```bash
docker history my-app --no-trunc | grep -i "secret\|password\|key\|token"

# Dive — inspect layers interactively
dive my-app
```

---

### 13. Scan with Trivy
```bash
# Scan for CVEs
trivy image my-app:latest

# Fail CI on HIGH/CRITICAL
trivy image --exit-code 1 --severity HIGH,CRITICAL my-app:latest

# Scan IaC/Dockerfile
trivy config ./Dockerfile
trivy config ./docker-compose.yml
```

---

### 14. Scan with Snyk
```bash
# Scan image
snyk container test my-app:latest

# Monitor (submit results to Snyk platform)
snyk container monitor my-app:latest \
  --project-name=my-app
```

---

### 15. Dockerfile linting with hadolint
```bash
hadolint Dockerfile

# Common rules:
# DL3008: Pin apt package versions
# DL3018: Pin apk package versions
# DL3025: Use exec form for CMD
# DL3045: COPY to WORKDIR
```

---

### 16. Pin base image by digest
```dockerfile
# Mutable tag (can change without warning)
FROM node:20-alpine

# Immutable digest pin
FROM node:20-alpine@sha256:abc123def456...
```
```bash
# Get current digest
docker pull node:20-alpine
docker inspect node:20-alpine --format '{{index .RepoDigests 0}}'
```

---

### 17. SBOM — software bill of materials
```bash
# Generate SBOM with Syft
syft my-app:latest -o spdx-json > sbom.json

# Or with Docker Scout
docker scout sbom my-app:latest

# Attest SBOM to image
syft attest --output spdx-json my-app:latest
```

---

### 18. Image signing with cosign
```bash
# Generate key pair
cosign generate-key-pair

# Sign (after push)
cosign sign --key cosign.key my-registry/my-app:latest

# Verify before pull (in policy enforcement)
cosign verify --key cosign.pub my-registry/my-app:latest
```

---

### 19. Keyless signing (Sigstore/Fulcio)
```bash
# Sign using OIDC identity (no key management)
cosign sign my-registry/my-app:latest
# Opens browser for OIDC login — signature tied to your email

# In CI (GitHub Actions) — keyless with OIDC token
- run: cosign sign --yes my-registry/my-app:${{ github.sha }}
  env:
    COSIGN_EXPERIMENTAL: "1"
```

---

### 20. Docker Content Trust (Notary v1)
```bash
# Enable — requires push to sign
export DOCKER_CONTENT_TRUST=1
docker push my-registry/my-app:latest
# Prompts for signing passphrase

# Verify
docker pull my-registry/my-app:latest  # fails if not signed
```

---

### 21. Limit container network access
```yaml
services:
  app:
    networks:
      - internal
    # No external internet access — only talks to DB

  db:
    networks:
      - internal

networks:
  internal:
    internal: true   # no external connectivity
```

---

### 22. Port exposure minimization
```yaml
# Don't expose DB ports to host in production
services:
  db:
    image: postgres:16-alpine
    # NO ports: entry — only internal network access

  app:
    image: my-app
    ports:
      - "127.0.0.1:3000:3000"  # dev: bind to localhost only
```

---

### 23. Docker daemon security
```json
// /etc/docker/daemon.json
{
  "userns-remap": "default",     // user namespace remapping
  "live-restore": true,          // containers survive daemon restart
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "icc": false,                  // disable inter-container communication by default
  "no-new-privileges": true      // global no-new-privileges
}
```

---

### 24. Rootless Docker
```bash
# Run Docker daemon as non-root user
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock

# Containers cannot escalate beyond the user's UID range
```

---

### 25. Namespace limits (ulimits)
```yaml
services:
  app:
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
      nproc: 100      # limit number of processes
```

---

### 26. Prevent fork bombs
```yaml
services:
  app:
    ulimits:
      nproc:
        soft: 50
        hard: 100
```

---

### 27. Runtime security monitoring with Falco
```yaml
services:
  falco:
    image: falcosecurity/falco:latest
    privileged: true
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - /dev:/host/dev
      - /proc:/host/proc:ro
      - /boot:/host/boot:ro
      - /lib/modules:/host/lib/modules:ro
    profiles: [monitoring]
```

---

### 28. CIS Docker Benchmark
```bash
# Run docker-bench-security to check compliance
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /etc:/etc:ro \
  docker/docker-bench-security

# Checks:
# Host configuration
# Docker daemon configuration
# Docker daemon files
# Container images and build
# Container runtime
# Docker security operations
```

---

### 29. Grype — vulnerability scanner
```bash
# Scan image
grype my-app:latest

# Scan with SBOM (faster, reusable)
syft my-app:latest -o json > sbom.json
grype sbom:./sbom.json

# Fail CI on high severity
grype my-app:latest --fail-on high
```

---

### 30. Security hardening checklist
```
Image:
✓ Minimal base (distroless/alpine)
✓ Non-root USER in Dockerfile
✓ No secrets in ENV or layers
✓ BuildKit secrets for build-time credentials
✓ Pin base images by digest
✓ Scan with Trivy/Grype/Snyk in CI
✓ Lint Dockerfile with hadolint
✓ Sign images with cosign
✓ Generate and attest SBOM

Runtime:
✓ read_only: true + tmpfs for /tmp
✓ cap_drop: ALL + minimal cap_add
✓ security_opt: no-new-privileges:true
✓ User namespace mapping or rootless Docker
✓ Network isolation (internal networks)
✓ Resource limits (memory, CPU, ulimits)

Monitoring:
✓ Runtime security with Falco
✓ Audit logs for registry pulls
✓ CIS Docker Benchmark (docker-bench-security)
```
