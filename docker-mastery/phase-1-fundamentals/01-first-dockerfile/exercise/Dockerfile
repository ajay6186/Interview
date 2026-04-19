# ============================================================================
# Exercise 1.1 — Your First Dockerfile
# Complete all the TODO items below.
# ============================================================================

# TODO: Use node:18-alpine as the base image
FROM node:18-alpine

# TODO: Set /app as the working directory
# WORKDIR ...
WORKDIR /app

# TODO: Copy package.json to the working directory
# COPY ...
COPY package.json .
# TODO: Run npm install to install dependencies
# RUN ...

RUN npm install

# TODO: Copy all remaining source files
# COPY ...

COPY . .

# TODO: Expose port 3000
# EXPOSE ...
EXPOSE 3000

# TODO: Set the default command to run: node index.js
# CMD ...

CMD ["node", "index.js"]
