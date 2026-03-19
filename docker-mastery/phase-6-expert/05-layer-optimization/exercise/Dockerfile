# ============================================================================
# Exercise 6.5 — Layer Optimization
# This Dockerfile has 5 problems. Find and fix them all.
# ============================================================================

# PROBLEM 1: Full node image is ~1GB. Alpine is ~150MB.
FROM node:18

# PROBLEM 2: apt update and install are SEPARATE — cache is stale after update layer expires
RUN apt-get update
RUN apt-get install -y curl wget
# apt cache NOT cleaned — bloats the image layer

WORKDIR /app

# PROBLEM 3: Source code copied BEFORE npm install — any code change busts npm cache
COPY . .
COPY package*.json ./
RUN npm install

# PROBLEM 4: Multiple separate RUN commands — each creates a layer
RUN echo "Build step 1"
RUN echo "Build step 2"
RUN echo "Build step 3"

EXPOSE 3000
CMD ["node", "index.js"]
