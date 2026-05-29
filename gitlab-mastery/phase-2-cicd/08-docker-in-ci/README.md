# 2.8 — Docker in CI

**Goal:** Build a Docker image inside a CI pipeline and push it to the Container Registry.

## How to use
1. Enable Container Registry: Project → Settings → General → Visibility → Container Registry ✓
2. Copy `.gitlab-ci.yml` to a project that has a `Dockerfile`
3. Push → watch the build and push happen automatically

## Two methods explained

### Method 1: Docker-in-Docker (dind)
```yaml
image: docker:24                    # Docker CLI
services:
  - docker:24-dind                  # Docker daemon runs as a sidecar
variables:
  DOCKER_HOST: tcp://docker:2375    # Point CLI at sidecar daemon
```
- Simpler to understand
- Requires `privileged: true` on the runner
- Good for getting started

### Method 2: Kaniko (production preferred)
```yaml
image:
  name: gcr.io/kaniko-project/executor:debug
  entrypoint: [""]
```
- Builds images **without** a Docker daemon
- No privileged mode needed — more secure
- Works perfectly in Kubernetes
- Slower than dind for the first build, faster after (layer cache)

## The CI_REGISTRY_* variables (auto-provided by GitLab)

| Variable | What it is |
|----------|-----------|
| `CI_REGISTRY` | `gitlab.local:5050` |
| `CI_REGISTRY_USER` | `gitlab-ci-token` |
| `CI_REGISTRY_PASSWORD` | auto-rotated job token |
| `CI_REGISTRY_IMAGE` | `gitlab.local:5050/root/my-app` |

You never need to set these — GitLab fills them in automatically when the registry is enabled.

## Tagging strategy (industry standard)
```
my-app:abc1234      ← immutable (git SHA) — exact version
my-app:main         ← latest on main branch
my-app:latest       ← latest overall (same as main, usually)
my-app:v1.2.3       ← release tag
```

## View pushed images
Project → **Deploy → Container Registry**
