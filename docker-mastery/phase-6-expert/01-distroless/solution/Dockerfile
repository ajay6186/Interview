# ============================================================================
# Solution 6.1 — Distroless Images
# ============================================================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# --- Stage 2: Distroless — no shell, no package manager ---
# gcr.io/distroless/nodejs18-debian12 contains only:
#   - Node.js runtime
#   - A minimal subset of glibc
#   - Your application files (copied in)
FROM gcr.io/distroless/nodejs18-debian12

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js     ./index.js

EXPOSE 3000

# With distroless nodejs, CMD is the script path (node is the entrypoint)
CMD ["/app/index.js"]

# FOR DEBUGGING: use the :debug variant which includes busybox
# FROM gcr.io/distroless/nodejs18-debian12:debug
# docker run --entrypoint /busybox/sh distroless-app
