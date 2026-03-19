# ============================================================================
# Exercise 2.1 — Multi-Stage Builds
# ============================================================================

# ---- Stage 1: Builder ----
# TODO: Name this stage "builder": FROM node:18-alpine AS builder
FROM node:18-alpine

WORKDIR /app

# TODO: Copy package files and install ALL dependencies (including devDependencies)
# COPY package.json .
# RUN npm install

# TODO: Copy source files and build
# COPY src/ ./src/
# RUN npm run build

# ---- Stage 2: Runtime ----
# TODO: Start fresh from node:18-alpine (NOT using the builder)
# FROM node:18-alpine

# WORKDIR /app

# TODO: Copy only the built output from the builder stage
# COPY --from=builder /app/dist ./dist

# TODO: Copy package.json and install only production deps
# COPY --from=builder /app/package.json .
# RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "dist/index.js"]
