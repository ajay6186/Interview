# ============================================================================
# Solution 5.1 — Production-Ready Node.js Dockerfile
# ============================================================================

# --- Stage 1: Install production dependencies ---
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production    # Exact versions from lockfile, no devDeps

COPY . .

# --- Stage 2: Lean production image ---
FROM node:18-alpine

WORKDIR /app

# Create dedicated non-root user (principle of least privilege)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what's needed from builder (no build tools, no cache)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js     ./index.js
COPY --from=builder /app/package.json ./package.json

# Ensure appuser owns the app files
RUN chown -R appuser:appgroup /app

# Drop to non-root before starting the process
USER appuser

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Docker daemon polls /health — marks container unhealthy after 3 failures
# Orchestrators (Swarm, Compose) use health status for replacement decisions
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
