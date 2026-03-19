# Exercise 1.4 — COPY, Layers, and Build Cache

## What you'll learn
- Docker builds images in **layers** — each instruction is one layer
- Layers are cached: unchanged layers are reused on the next build
- **Order matters**: put frequently changing files last
- `.dockerignore` prevents unwanted files from being copied

## Instructions
Complete `exercise/Dockerfile` with the correct layer ordering:
1. Copy `package.json` first (changes rarely)
2. Run `npm install` (expensive — cache it!)
3. Copy source code last (changes often)

Also complete `exercise/.dockerignore`.

## Verify
```bash
cd exercise
docker build -t layer-demo .    # First build (no cache)
docker build -t layer-demo .    # Second build — see "CACHED" for npm install!

# Edit index.js and rebuild:
echo "// change" >> index.js
docker build -t layer-demo .    # npm install is still CACHED!
```

## Key concepts
- If a layer's inputs haven't changed, Docker reuses the cached layer
- `package.json` before source code = npm install is cached unless dependencies change
- `.dockerignore` works like `.gitignore` — prevents files from entering the build context
