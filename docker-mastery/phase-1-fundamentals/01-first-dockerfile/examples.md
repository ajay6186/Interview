# Examples 1.1 — Your First Dockerfile (30 examples)

---

### 1. Minimal Node.js Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

---

### 2. FROM — official images by tag
```dockerfile
FROM node:18-alpine      # lightweight Alpine Linux
FROM node:18-slim        # Debian slim (larger but more compatible)
FROM node:18             # full Debian (largest, most tools)
FROM node:18-bookworm    # Debian Bookworm full
```

---

### 3. FROM — pinning to digest for reproducibility
```dockerfile
# Tag can change; digest never changes
FROM node:18-alpine@sha256:abc123...
```

---

### 4. WORKDIR — sets and creates the directory
```dockerfile
WORKDIR /app          # creates /app if it doesn't exist
WORKDIR /app/server   # nested — creates both dirs
```

---

### 5. COPY — copy single file
```dockerfile
COPY package.json .           # copy to WORKDIR
COPY package.json /app/       # copy to explicit path
COPY package.json package.json # copy with rename
```

---

### 6. COPY — copy multiple files
```dockerfile
COPY package.json package-lock.json ./
COPY src/ ./src/
COPY . .    # copy everything (filtered by .dockerignore)
```

---

### 7. COPY vs ADD
```dockerfile
# COPY — simple, preferred for local files
COPY config.json .

# ADD — can untar archives and fetch URLs (use sparingly)
ADD app.tar.gz /app/
ADD https://example.com/file.txt /tmp/ # don't do this — use curl in RUN instead
```

---

### 8. RUN — shell form vs exec form
```dockerfile
# Shell form — runs in /bin/sh -c
RUN npm install

# Exec form — no shell, no variable expansion
RUN ["npm", "install"]
```

---

### 9. RUN — chaining commands (fewer layers)
```dockerfile
# Bad: 3 separate layers
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# Good: 1 layer
RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*
```

---

### 10. EXPOSE — document the port
```dockerfile
EXPOSE 3000          # TCP (default)
EXPOSE 3000/tcp      # explicit TCP
EXPOSE 5353/udp      # UDP
EXPOSE 3000 8080     # multiple ports
```
> EXPOSE is documentation only. Use `docker run -p 3000:3000` to actually publish.

---

### 11. CMD — default command
```dockerfile
CMD ["node", "index.js"]          # exec form (preferred)
CMD ["npm", "start"]
CMD node index.js                  # shell form (avoids exec-form array)
```

---

### 12. CMD can be overridden at runtime
```dockerfile
CMD ["node", "index.js"]
# docker run myapp node other.js   ← overrides CMD
```

---

### 13. ENTRYPOINT vs CMD
```dockerfile
# ENTRYPOINT sets the executable; CMD provides default args
ENTRYPOINT ["node"]
CMD ["index.js"]
# docker run myapp server.js  → runs: node server.js
```

---

### 14. ENTRYPOINT exec form (preferred)
```dockerfile
ENTRYPOINT ["node", "index.js"]
# CMD is then extra args; rarely used alone like this
```

---

### 15. Python app Dockerfile
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
```

---

### 16. Go app Dockerfile
```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server .
EXPOSE 8080
CMD ["./server"]
```

---

### 17. Nginx static site Dockerfile
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
# No CMD needed — nginx image provides it
```

---

### 18. LABEL — metadata
```dockerfile
FROM node:18-alpine
LABEL maintainer="alice@example.com"
LABEL version="1.0"
LABEL description="My web app"
```

---

### 19. USER — run as non-root (security)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
USER node    # node:18-alpine includes a 'node' user
CMD ["node", "index.js"]
```

---

### 20. Build the image
```bash
docker build -t my-app .
docker build -t my-app:1.0 .
docker build -t registry.example.com/my-app:1.0 .
docker build -f Dockerfile.prod -t my-app .  # custom Dockerfile name
```

---

### 21. Run the container
```bash
docker run my-app                        # run in foreground
docker run -d my-app                     # detached (background)
docker run -p 3000:3000 my-app           # publish port
docker run --rm my-app                   # auto-remove when stopped
docker run --name web my-app             # named container
```

---

### 22. Run with env vars
```bash
docker run -e NODE_ENV=production my-app
docker run --env-file .env my-app
```

---

### 23. Inspect the container
```bash
docker ps                # running containers
docker ps -a             # all containers (incl. stopped)
docker logs web          # view logs
docker logs -f web       # follow logs
docker exec -it web sh   # open shell in running container
```

---

### 24. docker build --no-cache
```bash
docker build --no-cache -t my-app .   # forces rebuild of all layers
```

---

### 25. Image size comparison
```bash
docker images
# REPOSITORY   TAG        SIZE
# my-app       latest     120MB  (node:18-alpine based)
# my-app       full       900MB  (node:18 based)
```

---

### 26. Multi-process in one container (avoid)
```dockerfile
# DON'T — containers should do one thing
FROM ubuntu
RUN apt-get install -y nginx nodejs
CMD nginx && node app.js   # fragile; signals won't propagate correctly
# DO — use docker-compose with separate containers instead
```

---

### 27. HEALTHCHECK in Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "index.js"]
```

---

### 28. Full Dockerfile with best practices
```dockerfile
FROM node:18-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "index.js"]
```

---

### 29. docker image inspect
```bash
docker image inspect my-app
# Shows: layers, env vars, exposed ports, entrypoint, labels, etc.
```

---

### 30. Remove images and containers
```bash
docker rm web                     # remove stopped container
docker rmi my-app                 # remove image
docker system prune               # remove all unused resources
docker system prune -a            # remove all unused images too
```
