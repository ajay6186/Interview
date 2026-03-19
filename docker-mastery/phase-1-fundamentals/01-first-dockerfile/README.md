# Exercise 1.1 — Your First Dockerfile

## What you'll learn
- `FROM` — choose a base image
- `WORKDIR` — set the working directory
- `COPY` — copy files into the image
- `RUN` — execute commands during build
- `EXPOSE` — document which port the app listens on
- `CMD` — default command when the container starts

## Instructions
Complete `exercise/Dockerfile` so that:
1. Uses `node:18-alpine` as base image
2. Sets `/app` as working directory
3. Copies `package.json` and runs `npm install`
4. Copies all source files
5. Exposes port 3000
6. Starts the app with `node index.js`

## Verify
```bash
cd exercise
docker build -t my-app .
docker run --rm -p 3000:3000 my-app
# Should print: Server running on port 3000
curl http://localhost:3000
```

## Key concepts
- Every Dockerfile starts with `FROM`
- `WORKDIR` creates the directory if it doesn't exist
- `EXPOSE` is documentation only — use `-p` at runtime to publish
- `CMD` can be overridden with `docker run ... <command>`
