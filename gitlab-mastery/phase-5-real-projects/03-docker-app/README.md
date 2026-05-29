# Phase 5.3 — Full Docker App Pipeline

This demonstrates the complete industry-standard Docker CI/CD flow:
Build → Integration Test → Push to Registry → Deploy Staging → Deploy Production (manual) → Rollback

---

## What This Project Shows

| Feature | Where |
|---------|-------|
| Multi-stage Docker build | `Dockerfile` |
| Image saved as artifact between jobs | `.gitlab-ci.yml` (build stage) |
| Integration test (run container + call it) | `.gitlab-ci.yml` (integration-test stage) |
| Push with multiple tags (SHA + branch + latest) | `.gitlab-ci.yml` (push stage) |
| Zero-downtime deploy concept | `.gitlab-ci.yml` (production stage) |
| Rollback job | `.gitlab-ci.yml` (rollback-production) |
| Environment tracking | `environment:` blocks |

---

## How to Use

1. Create a new GitLab project
2. Copy all files from this directory into it
3. Push — the pipeline starts automatically
4. Watch it fail at `push-image` (no registry configured locally in demo)

To make it fully work:
- Enable Container Registry in your GitLab project
- The `CI_REGISTRY_*` variables are auto-populated by GitLab

---

## Pipeline Flow

```
[build] ──→ [integration-test] ──→ [push-image] ──→ [deploy-staging]
                                                           │
                                                    (manual approval)
                                                           │
                                                    [deploy-production]
                                                           │
                                                    (if broken, manual)
                                                           │
                                                    [rollback-production]
```

---

## Key Concepts

### Image saved to artifact (no registry needed between jobs)
```yaml
# Build job saves image to file
docker save "$SHA_TAG" | gzip > image.tar.gz

# Test job loads it back
docker load < image.tar.gz
```

### Integration test (real live test of the container)
```yaml
# Start the app
docker run -d --name test-app -p 3000:3000 "$SHA_TAG"
sleep 5
# Call it
curl -f http://localhost:3000/health
# Stop it
docker stop test-app
```

### Multiple image tags
```
gitlab.local:5050/root/app:abc1234   ← exact commit (immutable)
gitlab.local:5050/root/app:main      ← latest on main branch
gitlab.local:5050/root/app:latest    ← overall latest (main only)
```

### Rollback pattern
When production breaks, trigger `rollback-production` manually,
set `ROLLBACK_IMAGE` to the previous good SHA tag:
```
ROLLBACK_IMAGE = gitlab.local:5050/root/app:def5678
```
