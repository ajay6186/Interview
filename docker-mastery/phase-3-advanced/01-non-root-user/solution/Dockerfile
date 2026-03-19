# ============================================================================
# Solution 3.1 — Running as Non-Root User
# ============================================================================

FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm install
COPY . .

# Create a system group and user
# -S = system account (no password, no login shell)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Give appuser ownership of the app directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user — all subsequent RUN/CMD/ENTRYPOINT runs as appuser
USER appuser

EXPOSE 3000
CMD ["node", "index.js"]
