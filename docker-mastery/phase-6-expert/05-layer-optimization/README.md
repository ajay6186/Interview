# Exercise 6.5 — Layer Optimization

## What you'll learn
- Identifying inefficient Dockerfile patterns
- Combining RUN commands to reduce layer count
- Cache-busting problems and how to avoid them
- Using `--no-install-recommends` and cleaning apt cache in one layer

## Instructions
The `exercise/Dockerfile` has multiple inefficiencies. Find and fix them all.

## Verify
```bash
cd exercise
docker build -t bad-image -f Dockerfile .
docker history bad-image

cd ../solution
docker build -t good-image -f Dockerfile .
docker history good-image

# Compare sizes:
docker images | grep -E "bad-image|good-image"

# Count layers:
docker history bad-image | wc -l
docker history good-image | wc -l
```

## Problems to fix (hints)
1. `apt-get update` and `apt-get install` are in separate RUN commands → cache problem
2. apt cache is not cleaned up after install → wastes space in the layer
3. Source code is copied before `npm install` → kills caching
4. Multiple separate `RUN echo` commands → each creates a layer
5. Uses `node:18` (huge) when `node:18-alpine` would be much smaller
