# ============================================================================
# Solution 6.2 — Multi-Architecture Dockerfile
# ============================================================================

ARG TARGETARCH=amd64

FROM node:18-alpine

# Re-declare after FROM — build args don't persist across FROM
ARG TARGETARCH

WORKDIR /app

# Log which architecture this layer is building for
RUN echo "Building for architecture: $TARGETARCH"

COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]

# ADVANCED: conditional logic per arch
# RUN case "$TARGETARCH" in \
#   amd64) echo "installing x86 tool" ;; \
#   arm64) echo "installing arm tool" ;; \
# esac
