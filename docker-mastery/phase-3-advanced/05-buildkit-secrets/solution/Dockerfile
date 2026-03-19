# syntax=docker/dockerfile:1
# ============================================================================
# Solution 3.5 — BuildKit Secrets
# ============================================================================

FROM node:18-alpine

WORKDIR /app

COPY package.json .

# The secret is mounted ONLY during this RUN step
# It is NOT stored in the image layer after the step completes
RUN --mount=type=secret,id=npmtoken,target=/root/.npmrc \
    npm install

COPY . .
CMD ["node", "index.js"]
