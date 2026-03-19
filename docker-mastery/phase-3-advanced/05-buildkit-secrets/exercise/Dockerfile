# syntax=docker/dockerfile:1
# ============================================================================
# Exercise 3.5 — BuildKit Secrets
# ============================================================================

FROM node:18-alpine

WORKDIR /app

COPY package.json .

# TODO: Use a BuildKit secret mount for npm install
# The secret id is "npmtoken" and should be mounted at /root/.npmrc
# Syntax: RUN --mount=type=secret,id=<id>,target=<path> <command>
# RUN --mount=type=secret,...
RUN npm install

COPY . .
CMD ["node", "index.js"]
