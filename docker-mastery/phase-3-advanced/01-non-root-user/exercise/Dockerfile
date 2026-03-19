# ============================================================================
# Exercise 3.1 — Running as Non-Root User
# ============================================================================

FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm install
COPY . .

# TODO: Create a system group "appgroup" and user "appuser"
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# TODO: Give appuser ownership of the /app directory
# RUN chown -R appuser:appgroup /app

# TODO: Switch to appuser (so the process doesn't run as root)
# USER appuser

EXPOSE 3000
CMD ["node", "index.js"]
