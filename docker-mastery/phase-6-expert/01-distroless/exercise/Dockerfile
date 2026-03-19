# ============================================================================
# Exercise 6.1 — Distroless Images
# ============================================================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# --- Stage 2: Distroless runtime ---
# TODO: Use the distroless Node.js image as the final stage
# This image has NO shell, no package manager — just node and your app
# FROM gcr.io/distroless/nodejs18-debian12
FROM node:18-alpine     # <-- Replace this with the distroless image above

WORKDIR /app

# TODO: Copy only required files from builder
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app .

EXPOSE 3000

# NOTE: Distroless images use CMD, not ENTRYPOINT
# With distroless nodejs, just specify the script path:
# CMD ["/app/index.js"]
CMD ["index.js"]
