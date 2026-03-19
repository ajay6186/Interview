# Exercise 1.2 — Choosing the Right Base Image

## What you'll learn
- Difference between `ubuntu`, `alpine`, `slim` base images
- How image size affects pull/build time
- Trade-offs between size and compatibility

## Instructions
Complete `exercise/Dockerfile.alpine` and `exercise/Dockerfile.slim` to run the same Python app on different base images, then compare sizes.

## Verify
```bash
cd exercise
docker build -t python-ubuntu -f Dockerfile.ubuntu .
docker build -t python-alpine -f Dockerfile.alpine .
docker build -t python-slim   -f Dockerfile.slim .
docker images | grep python-
# Notice the dramatic size difference!
```

## Key concepts
- `ubuntu` — full OS, largest (~70MB+), most compatible
- `alpine` — tiny (~5MB), uses musl libc, some packages differ
- `-slim` — stripped official image (~20MB), good balance
- Always pick the **smallest** image that works for your app
