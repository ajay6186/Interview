# Examples 3.5 — BuildKit Secrets (30 examples)

---

### 1. Enable BuildKit
```bash
DOCKER_BUILDKIT=1 docker build -t my-app .
# Or permanently in /etc/docker/daemon.json:
# { "features": { "buildkit": true } }
# Docker 23.0+ enables BuildKit by default
```

---

### 2. Syntax directive — enable new features
```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine
```

---

### 3. Mount a secret at build time
```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm install
```
```bash
docker build --secret id=npm_token,src=.npmrc -t my-app .
# OR from environment variable:
echo "$NPM_TOKEN" | docker build --secret id=npm_token,src=/dev/stdin .
```

---

### 4. Secret from file
```bash
docker build --secret id=aws_creds,src=$HOME/.aws/credentials -t my-app .
```
```dockerfile
RUN --mount=type=secret,id=aws_creds \
    AWS_SHARED_CREDENTIALS_FILE=/run/secrets/aws_creds \
    aws s3 cp s3://my-bucket/config .
```

---

### 5. Secret from environment variable
```bash
echo "mypassword" > /tmp/db_pass
docker build --secret id=db_pass,src=/tmp/db_pass -t my-app .
rm /tmp/db_pass
```

---

### 6. Multiple secrets
```bash
docker build \
  --secret id=npm_token,src=.npmrc \
  --secret id=ssh_key,src=$HOME/.ssh/id_rsa \
  -t my-app .
```

---

### 7. SSH forwarding — use host SSH agent
```dockerfile
# syntax=docker/dockerfile:1
FROM alpine
RUN apk add --no-cache openssh-client git
RUN --mount=type=ssh \
    git clone git@github.com:private/repo.git
```
```bash
eval $(ssh-agent)
ssh-add ~/.ssh/id_rsa
docker build --ssh default -t my-app .
```

---

### 8. SSH mount with explicit socket
```bash
docker build --ssh default=$SSH_AUTH_SOCK -t my-app .
```

---

### 9. Private npm registry with secret
```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install
COPY . .
CMD ["node", "index.js"]
```
```bash
docker build --secret id=npmrc,src=$HOME/.npmrc -t my-app .
```

---

### 10. pip with private index
```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN --mount=type=secret,id=pip_conf,target=/root/.pip/pip.conf \
    pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

---

### 11. Secret is NOT in the image (verify)
```bash
# The secret file is NEVER baked into an image layer
docker history my-app --no-trunc
# You will NOT see the secret value in any layer

docker save my-app | tar x && grep -r "mysecret" ./  # not found
```

---

### 12. Why ARG is wrong for secrets
```dockerfile
# NEVER DO THIS
ARG DB_PASSWORD
RUN echo "password=$DB_PASSWORD" > /app/config

# docker history my-app --no-trunc will show:
# /bin/sh -c #(nop)  ARG DB_PASSWORD=mysecret  ← visible in history!
```

---

### 13. RUN --mount=type=cache (not a secret, but related)
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm install
# Cache persists between builds but is not in the image
```

---

### 14. RUN --mount=type=bind
```dockerfile
# Mount a file from build context without copying it into image
RUN --mount=type=bind,source=scripts/build.sh,target=/build.sh \
    /build.sh
# /build.sh is not in the final image
```

---

### 15. Buildx bake with secrets
```hcl
# docker-bake.hcl
target "app" {
  context = "."
  secrets = ["id=npmrc,src=${HOME}/.npmrc"]
}
```

---

### 16. Compose build secrets
```yaml
services:
  web:
    build:
      context: .
      secrets:
        - npm_token
secrets:
  npm_token:
    environment: NPM_TOKEN   # reads from env var
```

---

### 17. Runtime secrets with Docker Swarm
```bash
echo "mysecretvalue" | docker secret create db_password -
docker service create \
  --secret db_password \
  --name web \
  my-app
# Available at /run/secrets/db_password in container
```

---

### 18. Runtime secrets in compose (file-based)
```yaml
services:
  web:
    secrets:
      - db_password
    environment:
      DB_PASS_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

---

### 19. Read secret file in app code
```javascript
// Node.js — read secret from file (better than env var)
const fs = require('fs');
const dbPassword = fs.readFileSync('/run/secrets/db_password', 'utf8').trim();
```

---

### 20. Read secret file in Python
```python
with open('/run/secrets/db_password') as f:
    db_password = f.read().strip()
```

---

### 21. Secret permissions in container
```bash
ls -la /run/secrets/
# -r-------- 1 root root 20 Jan 15 10:00 db_password
# Only readable by root (uid 0)
# Use gosu or su to read as app user, or set uid in secret config
```

---

### 22. Custom secret UID/GID
```yaml
secrets:
  db_password:
    file: ./db_password.txt
    uid: "1000"
    gid: "1000"
    mode: 0440
```

---

### 23. Vault / AWS Secrets Manager in production
```bash
# Fetch secret from Vault, inject at container startup
# Option 1: entrypoint script
#!/bin/sh
DB_PASSWORD=$(vault kv get -field=password secret/db)
export DB_PASSWORD
exec "$@"

# Option 2: vault agent sidecar
# Option 3: AWS Secrets Manager with aws-secrets-manager-agent
```

---

### 24. Docker secrets vs environment variables
```
Environment variables:
  - Visible in docker inspect
  - Visible in /proc/<pid>/environ
  - Logged if app prints env on startup
  - Easy to leak

Docker secrets (file at /run/secrets/):
  - Not visible in docker inspect
  - Only accessible to the container process
  - Not leaked via env
  - Preferred for sensitive values
```

---

### 25. Rotate a secret (Swarm)
```bash
echo "newvalue" | docker secret create db_password_v2 -
docker service update \
  --secret-rm db_password \
  --secret-add db_password_v2 \
  web
docker secret rm db_password
```

---

### 26. BuildKit secret in GitHub Actions
```yaml
- name: Build Docker image
  run: |
    echo "${{ secrets.NPM_TOKEN }}" > /tmp/npm_token
    docker build --secret id=npm_token,src=/tmp/npm_token -t my-app .
    rm /tmp/npm_token
```

---

### 27. Trivy scanning for secrets in images
```bash
docker run --rm aquasec/trivy image --scanners secret my-app
# Scans for accidentally baked-in secrets (API keys, passwords)
```

---

### 28. git-secrets / gitleaks for code scanning
```bash
gitleaks detect --source . --verbose
# Finds secrets committed to git history
```

---

### 29. Secret naming conventions
```
id=npm_token        → /run/secrets/npm_token
id=aws_access_key   → /run/secrets/aws_access_key
id=db_password      → /run/secrets/db_password
id=ssl_cert         → /run/secrets/ssl_cert
```

---

### 30. Secrets checklist
```
Build-time secrets:
✓ Use --mount=type=secret, never ARG
✓ Verify secret not in docker history
✓ Use --ssh for SSH key forwarding

Runtime secrets:
✓ Use /run/secrets/ file mounting, not env vars
✓ Set appropriate file permissions
✓ Rotate secrets without rebuilding images
✓ Use secret management systems (Vault, AWS SM, Doppler) in production
✓ Never commit secrets to git (use .gitignore, git-secrets)
```
