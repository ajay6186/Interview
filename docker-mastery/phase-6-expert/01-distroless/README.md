# Exercise 6.1 — Distroless Images

## What you'll learn
- What "distroless" means and why it matters for security
- Using `gcr.io/distroless/nodejs18-debian12` as a final stage
- Multi-stage build: full builder → distroless runtime

## Instructions
Complete `exercise/Dockerfile` to use a distroless final image.

## Verify
```bash
cd exercise
docker build -t distroless-app .
docker run -p 3000:3000 distroless-app
curl http://localhost:3000

# Compare image sizes:
docker images | grep -E "distroless-app|node:18-alpine"

# Try shelling in (should FAIL — no shell in distroless):
docker run --rm -it distroless-app sh
# Error: no such file or directory
```

## Key concepts
- Distroless: no shell, no package manager, no OS utilities — just your app
- Dramatically reduces attack surface (fewer CVEs to patch)
- Smaller image size than full OS images
- Debugging: use `docker run --entrypoint /busybox/sh gcr.io/distroless/nodejs18-debian12:debug`
- Trade-off: harder to debug — use a separate debug build target if needed
