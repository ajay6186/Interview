# ============================================================================
# Exercise 6.2 — Multi-Architecture Dockerfile
# ============================================================================

# TODO: Declare TARGETARCH as a build arg (Docker sets this automatically during buildx)
# This lets you use it in RUN commands for conditional logic
# ARG TARGETARCH
ARG TARGETARCH=amd64

FROM node:18-alpine

# TARGETARCH is available after FROM (re-declare after FROM to use it)
ARG TARGETARCH

WORKDIR /app

# TODO: Add a RUN command that echoes which architecture is being built
# This demonstrates that TARGETARCH is set correctly per platform
# RUN echo "Building for architecture: $TARGETARCH"
RUN echo "Building for: unknown (add TARGETARCH echo here)"

COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
