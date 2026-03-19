# ============================================================================
# Solution 2.1 — Multi-Stage Builds
# ============================================================================

# Stage 1: Builder — has all tools, NOT in final image
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .
RUN npm install

COPY src/ ./src/
RUN npm run build

# Stage 2: Runtime — lean final image
FROM node:18-alpine

WORKDIR /app

# Copy only the built app from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "dist/index.js"]
