# ============================================================================
# Solution 1.4 — Layers and Build Cache
# ============================================================================

FROM node:18-alpine

WORKDIR /app

# Step 1: Copy dependency files FIRST
# This layer is only invalidated when package.json changes
COPY package.json package-lock.json* ./

# Step 2: Install dependencies (cached unless package.json changed)
RUN npm install

# Step 3: Copy source code AFTER installing dependencies
# Changing source code does NOT bust the npm install cache layer
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
