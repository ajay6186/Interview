# ============================================================================
# Solution 1.3 — ENV and ARG
# ============================================================================

FROM node:18-alpine

# ARG is only available during docker build
ARG APP_VERSION=1.0.0

# ENV is available inside the running container
ENV NODE_ENV=production
ENV PORT=3000
# Copy the ARG value into an ENV so it persists at runtime
ENV VERSION=$APP_VERSION

WORKDIR /app
COPY index.js .

CMD ["node", "index.js"]
