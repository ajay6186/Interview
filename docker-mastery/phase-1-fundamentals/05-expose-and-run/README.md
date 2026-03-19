# Exercise 1.5 — EXPOSE and Port Mapping

## What you'll learn
- `EXPOSE` documents which port the container listens on (does NOT publish it)
- `-p host:container` to publish ports when running
- Common `docker run` flags: `-d`, `--name`, `--rm`, `-e`
- Viewing containers: `docker ps`, `docker logs`, `docker exec`

## Instructions
Complete `exercise/Dockerfile`, then practice these docker run commands.

## Verify
```bash
cd exercise
docker build -t myapp .

# Run in background, publish port 8080 on host → 3000 in container:
docker run -d -p 8080:3000 --name myapp myapp
curl http://localhost:8080    # Should return: Hello Docker!

# View logs:
docker logs myapp

# Run a command inside the container:
docker exec -it myapp sh

# Stop and remove:
docker stop myapp && docker rm myapp

# Run with env override:
docker run --rm -e PORT=4000 -p 4000:4000 myapp
```

## Key concepts
- `EXPOSE 3000` in Dockerfile ≠ published to host. It's just documentation.
- `-p 8080:3000` means: host port 8080 → container port 3000
- `--rm` automatically removes the container when it stops
- `-d` runs in detached (background) mode
