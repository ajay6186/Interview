# ============================================================================
# Solution 6.5 — Layer Optimization
# ============================================================================

# FIX 1: Use Alpine — dramatically smaller base image (~150MB vs ~1GB)
FROM node:18-alpine

# FIX 2: Chain apt commands AND clean cache in ONE layer
# (Alpine uses apk, not apt — but here's the pattern for Debian-based images)
# RUN apt-get update \
#     && apt-get install -y --no-install-recommends curl wget \
#     && rm -rf /var/lib/apt/lists/*
# For Alpine:
RUN apk add --no-cache curl wget

WORKDIR /app

# FIX 3: Copy package files FIRST — npm install layer is cached when code changes
COPY package*.json ./
RUN npm ci --only=production

# Now copy source (invalidates this and subsequent layers, not npm install)
COPY . .

# FIX 4: Combine echo steps into one RUN (fewer layers)
RUN echo "Build step 1" && echo "Build step 2" && echo "Build step 3"

EXPOSE 3000
CMD ["node", "index.js"]

# LAYER OPTIMIZATION RULES:
# 1. Prefer small base images (alpine, slim, distroless)
# 2. Chain RUN commands with && to reduce layer count
# 3. Clean up in the SAME RUN that installs (apt cache, tmp files)
# 4. Copy package files before source code (cache npm install)
# 5. Use .dockerignore to exclude node_modules, .git, tests from context
