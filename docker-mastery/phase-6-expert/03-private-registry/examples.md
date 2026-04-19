# Examples 6.3 — Private Registry (30 examples)

---

### 1. What is a private registry?
```
Options:
  Docker Hub         — docker.io (public, free tier = 1 private repo)
  GitHub Container   — ghcr.io (free for public, paid for private)
  AWS ECR            — <account>.dkr.ecr.<region>.amazonaws.com
  GCP Artifact Reg.  — <region>-docker.pkg.dev/<project>/...
  Azure ACR          — <name>.azurecr.io
  Self-hosted        — registry:2 (Docker open source)
  Harbor             — enterprise self-hosted with RBAC + scanning
```

---

### 2. Run a local registry
```bash
docker run -d \
  -p 5000:5000 \
  --name registry \
  --restart unless-stopped \
  -v registry_data:/var/lib/registry \
  registry:2
```

---

### 3. Push to local registry
```bash
# Tag image with registry prefix
docker tag my-app:latest localhost:5000/my-app:latest

# Push
docker push localhost:5000/my-app:latest

# Pull
docker pull localhost:5000/my-app:latest
```

---

### 4. Compose using local registry
```yaml
services:
  app:
    image: localhost:5000/my-app:latest
    pull_policy: always    # always pull latest
```

---

### 5. Docker Hub login
```bash
docker login
# or
docker login -u myusername

# In CI (non-interactive):
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
```

---

### 6. GitHub Container Registry (ghcr.io)
```bash
# Login
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

# Tag and push
docker tag my-app:latest ghcr.io/myorg/my-app:latest
docker push ghcr.io/myorg/my-app:latest
```

---

### 7. AWS ECR login
```bash
# Authenticate (token valid for 12 hours)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

# Push
docker tag my-app:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
```

---

### 8. Create ECR repository
```bash
aws ecr create-repository \
  --repository-name my-app \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1
```

---

### 9. GCP Artifact Registry
```bash
# Authenticate
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push
docker tag my-app:latest \
  us-central1-docker.pkg.dev/my-project/my-repo/my-app:latest
docker push us-central1-docker.pkg.dev/my-project/my-repo/my-app:latest
```

---

### 10. Azure ACR
```bash
# Login
az acr login --name myregistry

# Push
docker tag my-app:latest myregistry.azurecr.io/my-app:latest
docker push myregistry.azurecr.io/my-app:latest
```

---

### 11. Registry with TLS (self-hosted)
```bash
# Generate self-signed cert
openssl req -newkey rsa:4096 -nodes -sha256 \
  -keyout domain.key -x509 -days 365 -out domain.crt \
  -subj "/CN=myregistry.internal"

# Run registry with TLS
docker run -d -p 443:443 \
  -v $(pwd)/certs:/certs \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:443 \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/domain.key \
  registry:2
```

---

### 12. Registry with basic auth
```bash
# Create htpasswd file
mkdir auth
docker run --rm \
  --entrypoint htpasswd \
  httpd:2 -Bbn admin secretpassword > auth/htpasswd

# Run registry with auth
docker run -d -p 5000:5000 \
  -v $(pwd)/auth:/auth \
  -e REGISTRY_AUTH=htpasswd \
  -e REGISTRY_AUTH_HTPASSWD_REALM="Registry" \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  registry:2
```

---

### 13. Registry in compose
```yaml
services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    volumes:
      - registry_data:/var/lib/registry
      - ./auth:/auth
    environment:
      REGISTRY_AUTH: htpasswd
      REGISTRY_AUTH_HTPASSWD_REALM: Registry
      REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd

volumes:
  registry_data:
```

---

### 14. Insecure registry (dev only)
```json
// /etc/docker/daemon.json  (or Docker Desktop Settings → Docker Engine)
{
  "insecure-registries": ["localhost:5000", "myregistry.internal:5000"]
}
```
> Allows HTTP (non-TLS). Never use in production.

---

### 15. Registry API — list repositories
```bash
curl -s http://localhost:5000/v2/_catalog | python3 -m json.tool
# {"repositories": ["my-app", "my-other-app"]}
```

---

### 16. Registry API — list tags
```bash
curl -s http://localhost:5000/v2/my-app/tags/list | python3 -m json.tool
# {"name": "my-app", "tags": ["latest", "1.0.0", "1.0.1"]}
```

---

### 17. Delete image from registry
```bash
# Get digest
DIGEST=$(curl -sI \
  -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  http://localhost:5000/v2/my-app/manifests/latest \
  | grep Docker-Content-Digest | tr -d '\r' | awk '{print $2}')

# Delete manifest
curl -X DELETE \
  http://localhost:5000/v2/my-app/manifests/$DIGEST

# Run garbage collection
docker exec registry \
  bin/registry garbage-collect /etc/docker/registry/config.yml
```

---

### 18. Harbor — enterprise registry
```bash
# Harbor adds: RBAC, vulnerability scanning, image signing, audit logs
# Deploy with docker compose:
wget https://github.com/goharbor/harbor/releases/download/v2.10.0/harbor-online-installer-v2.10.0.tgz
tar xzf harbor-online-installer-v2.10.0.tgz
cd harbor && ./install.sh
```

---

### 19. GitHub Actions — login and push
```yaml
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  uses: docker/build-push-action@v6
  with:
    push: true
    tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

---

### 20. GitHub Actions — multi-registry push
```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  uses: docker/build-push-action@v6
  with:
    push: true
    tags: |
      myuser/my-app:latest
      ghcr.io/myuser/my-app:latest
```

---

### 21. Image tagging strategy
```bash
# Tag by git SHA (immutable)
docker tag my-app:latest my-registry/my-app:$GIT_SHA

# Tag by semver
docker tag my-app:latest my-registry/my-app:1.2.3

# Tag as latest (mutable)
docker tag my-app:latest my-registry/my-app:latest

# Tag by branch
docker tag my-app:latest my-registry/my-app:main
```

---

### 22. Pull with specific digest (immutable)
```bash
# Digest is immutable — always gets the exact same image
docker pull nginx@sha256:abc123...

# In Dockerfile
FROM nginx@sha256:abc123def456...
```

---

### 23. Credential helpers
```bash
# Use OS credential store instead of plaintext in ~/.docker/config.json
# macOS: uses Keychain automatically
# Linux: install docker-credential-secretservice or pass

# ~/.docker/config.json
{
  "credsStore": "secretservice"
}
```

---

### 24. Pull secrets in Kubernetes
```bash
# Create secret
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=myuser \
  --docker-password=$GITHUB_TOKEN

# Use in pod spec
spec:
  imagePullSecrets:
    - name: regcred
```

---

### 25. ECR lifecycle policy
```json
{
  "rules": [{
    "rulePriority": 1,
    "description": "Keep last 10 images",
    "selection": {
      "tagStatus": "untagged",
      "countType": "imageCountMoreThan",
      "countNumber": 10
    },
    "action": { "type": "expire" }
  }]
}
```

---

### 26. Image signing with cosign
```bash
# Install cosign
brew install sigstore/tap/cosign

# Sign image after push
cosign sign --key cosign.key ghcr.io/myorg/my-app:latest

# Verify
cosign verify --key cosign.pub ghcr.io/myorg/my-app:latest
```

---

### 27. Registry mirror / pull-through cache
```json
// /etc/docker/daemon.json
{
  "registry-mirrors": ["https://mirror.my-company.com"],
  "insecure-registries": []
}
```
```yaml
# registry:2 as pull-through cache
environment:
  REGISTRY_PROXY_REMOTEURL: https://registry-1.docker.io
```

---

### 28. Skopeo — copy between registries
```bash
# Copy image between registries without pulling locally
skopeo copy \
  docker://docker.io/nginx:alpine \
  docker://my-registry.internal/nginx:alpine

# Copy multi-arch manifest
skopeo copy --all \
  docker://nginx:alpine \
  docker://my-registry/nginx:alpine
```

---

### 29. Scan images in registry
```bash
# Trivy scan a registry image
trivy image ghcr.io/myorg/my-app:latest

# In CI — fail on HIGH/CRITICAL
trivy image \
  --exit-code 1 \
  --severity HIGH,CRITICAL \
  ghcr.io/myorg/my-app:${{ github.sha }}
```

---

### 30. Private registry checklist
```
Security:
✓ TLS enabled (never HTTP in production)
✓ Authentication (htpasswd, OAuth, OIDC)
✓ Vulnerability scanning on push
✓ Image signing (cosign)
✓ Rotate credentials regularly

Operations:
✓ Lifecycle/retention policies (auto-delete old images)
✓ Pull-through cache for public images (reduce Docker Hub rate limits)
✓ Immutable tags (use SHA digest for production deploys)
✓ Tag strategy: SHA for immutability, semver for release, latest for convenience

CI/CD:
✓ Login via --password-stdin (never plaintext in commands)
✓ Use token scopes — push-only tokens for CI
✓ Multi-registry push for redundancy
```
