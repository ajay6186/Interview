# Multi-stage Dockerfile — industry standard pattern
# Stage 1: Install dependencies
# Stage 2: Run app with minimal image size

# ── STAGE 1: Dependencies ────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files first (layer caching — only re-run npm install if these change)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ── STAGE 2: Production image ────────────────────────────────
FROM node:18-alpine AS production

# Security: don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY src/ ./src/
COPY package.json ./

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check (Docker will monitor this)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the app
CMD ["node", "src/index.js"]
