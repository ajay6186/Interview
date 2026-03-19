# ============================================================================
# Solution 1.1 — Your First Dockerfile
# ============================================================================

# Start from the official Node.js 18 Alpine image (lightweight)
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json first (layer cache optimization — see exercise 1.4)
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Document that the container listens on port 3000
EXPOSE 3000

# Default command to start the application
CMD ["node", "index.js"]
