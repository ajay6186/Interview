# Exercise 2.1 — Multi-Stage Builds

## What you'll learn
- Multi-stage builds reduce the final image size
- Build stage: install tools, compile, run tests
- Runtime stage: only copy the artifacts needed to run
- `COPY --from=<stage>` to copy between stages

## Instructions
Complete `exercise/Dockerfile` with a 2-stage build:
- Stage 1 (`builder`): install all deps, build the app
- Stage 2 (final): copy only the built output + production deps

## Verify
```bash
cd exercise
docker build -t multi-stage .
docker images multi-stage    # Notice the small size!
docker run --rm multi-stage
```

## Key concepts
- Only the LAST stage ends up in the final image
- Previous stages are discarded (no dev tools, no build artifacts)
- Name stages with `AS`: `FROM node:18-alpine AS builder`
