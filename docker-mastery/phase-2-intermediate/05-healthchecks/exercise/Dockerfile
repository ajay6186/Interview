# ============================================================================
# Exercise 2.5 — Health Checks
# ============================================================================

FROM node:18-alpine

RUN apk add --no-cache wget

WORKDIR /app
COPY . .

EXPOSE 3000

# TODO: Add a HEALTHCHECK that:
# - Runs every 30 seconds (--interval=30s)
# - Times out after 10 seconds (--timeout=10s)
# - Waits 5 seconds before first check (--start-period=5s)
# - Retries 3 times before marking unhealthy (--retries=3)
# - Command: wget --quiet --tries=1 --spider http://localhost:3000/health
# HEALTHCHECK ...

CMD ["node", "index.js"]
