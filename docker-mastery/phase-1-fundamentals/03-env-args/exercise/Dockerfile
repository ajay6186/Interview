# ============================================================================
# Exercise 1.3 — ENV and ARG
# ============================================================================

FROM node:18-alpine

# TODO: Declare a build-time ARG named APP_VERSION with default value 1.0.0
# ARG ...

# TODO: Set ENV variable NODE_ENV to production
# ENV ...

# TODO: Set ENV variable PORT to 3000
# ENV ...

# TODO: Make the ARG available at runtime by copying it into an ENV named VERSION
# ENV VERSION=$APP_VERSION

WORKDIR /app
COPY index.js .

CMD ["node", "index.js"]
