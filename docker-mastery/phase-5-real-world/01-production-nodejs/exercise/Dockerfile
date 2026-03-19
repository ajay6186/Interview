# ============================================================================
# Exercise 5.1 — Production-Ready Node.js Dockerfile
# Apply ALL production best practices in one Dockerfile.
# ============================================================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./

# TODO: Use "npm ci --only=production" for reproducible installs
# npm ci: reads package-lock.json exactly (no version drift)
# --only=production: skips devDependencies
# RUN npm ci --only=production
RUN npm install

COPY . .

# --- Stage 2: Production runtime ---
# TODO: Start a FRESH node:18-alpine stage (don't carry build tools forward)
# FROM node:18-alpine
FROM node:18-alpine

WORKDIR /app

# TODO: Create a non-root group "appgroup" and user "appuser"
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# TODO: Copy ONLY the required files from the builder stage
# Copy node_modules:
# COPY --from=builder /app/node_modules ./node_modules
# Copy app source:
# COPY --from=builder /app/index.js ./index.js
# COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app .

# TODO: Give appuser ownership of /app
# RUN chown -R appuser:appgroup /app

# TODO: Switch to non-root user before CMD
# USER appuser

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# TODO: Add a HEALTHCHECK that polls /health every 30s (timeout 5s, 3 retries)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
