# Exercise 5.1 — Production-Ready Node.js Dockerfile

## What you'll learn
- Combining multi-stage build + non-root user + health check in one Dockerfile
- `npm ci` for reproducible installs (vs `npm install`)
- `HEALTHCHECK` instruction so Docker monitors container health
- Copying only required files into the final image

## Instructions
Complete `exercise/Dockerfile` applying all production best practices.

## Verify
```bash
cd exercise
docker build -t prod-node .
docker run -d -p 3000:3000 --name test prod-node
sleep 10
docker inspect --format='{{.State.Health.Status}}' test
# Should show: healthy
docker run --rm prod-node whoami
# Should print: appuser (NOT root)
docker stop test && docker rm test
```

## Key concepts
- Multi-stage: the builder stage has full tooling; the final stage is lean
- `npm ci`: reads package-lock.json exactly — no version drift
- `HEALTHCHECK`: Docker marks container unhealthy after N failures; orchestrators use this
- Non-root user: if the container is compromised, attacker has no root on host
