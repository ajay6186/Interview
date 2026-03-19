# Exercise 1.3 — ENV and ARG

## What you'll learn
- `ENV` — sets environment variables available at **runtime**
- `ARG` — build-time variables (NOT available at runtime)
- Difference: ARG is for building, ENV is for running
- Passing build args: `docker build --build-arg NAME=VALUE`

## Instructions
Complete `exercise/Dockerfile` so it:
1. Declares a build ARG `APP_VERSION` with default `1.0.0`
2. Sets `NODE_ENV=production` as ENV
3. Sets `PORT=3000` as ENV
4. Exposes the ARG as an ENV variable named `VERSION`

## Verify
```bash
cd exercise
docker build -t env-demo .
docker run --rm env-demo
# Expected: App v1.0.0 running in production mode on port 3000

docker build -t env-demo --build-arg APP_VERSION=2.0.0 .
docker run --rm env-demo
# Expected: App v2.0.0 running in production mode on port 3000

# Override ENV at runtime:
docker run --rm -e PORT=4000 env-demo
```

## Key concepts
- `ARG` is only available during `docker build`
- `ENV` persists in the image and is available when the container runs
- To make an ARG available at runtime, copy it into an ENV: `ENV VERSION=$APP_VERSION`
