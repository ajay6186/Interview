# Exercise 3.5 — BuildKit Secrets

## What you'll learn
- Why you must NEVER bake secrets into images (they stay in layer history)
- BuildKit `--secret` flag for safe secret injection during build
- `RUN --mount=type=secret,...` syntax
- Verifying secrets are NOT in the final image

## Instructions
Complete `exercise/Dockerfile` to use a BuildKit secret for npm auth during install.

## Verify
```bash
cd exercise
echo "fake-npm-token" > .token

DOCKER_BUILDKIT=1 docker build \
  --secret id=npmtoken,src=.token \
  -t buildkit-demo .

# Verify secret is NOT in image layers:
docker run --rm buildkit-demo cat /root/.npmrc 2>&1 || echo "Secret not in image!"
```

## Key concepts
- The secret is mounted ONLY during the RUN step
- It is NOT stored in any image layer
- Use `# syntax=docker/dockerfile:1` at the top to enable BuildKit features
