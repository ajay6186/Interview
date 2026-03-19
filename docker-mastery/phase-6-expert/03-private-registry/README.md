# Exercise 6.3 — Private Registry

## What you'll learn
- Running a local Docker registry with Compose
- Tagging and pushing images to a private registry
- Pulling from a private registry
- Registry authentication basics

## Instructions
1. Start the registry: `docker compose up -d` (from exercise/)
2. Complete `exercise/push-pull.sh` with the tag/push/pull commands

## Verify
```bash
cd exercise
docker compose up -d
chmod +x push-pull.sh
./push-pull.sh

# Browse the registry API:
curl http://localhost:5000/v2/_catalog
# Should list your pushed images
docker compose down -v
```

## Key concepts
- `localhost:5000` = address of your local registry
- Tag format for private registry: `REGISTRY_HOST:PORT/image:tag`
- `docker push` uploads; `docker pull` downloads
- For TLS/auth in production: use a proper registry like Harbor, ECR, or GCR
