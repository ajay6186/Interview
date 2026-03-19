# ============================================================================
# Solution 2.5 — Health Checks
# ============================================================================

FROM node:18-alpine

RUN apk add --no-cache wget

WORKDIR /app
COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
