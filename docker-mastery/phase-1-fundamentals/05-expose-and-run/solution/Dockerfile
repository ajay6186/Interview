# ============================================================================
# Solution 1.5 — EXPOSE and Port Mapping
# ============================================================================

FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

# EXPOSE documents the port — it does NOT publish it to the host
# Use -p host:container when running to actually publish
EXPOSE 3000

CMD ["node", "index.js"]
