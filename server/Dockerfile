# syntax=docker/dockerfile:1
###############################################################################
# Presight API — Fastify + node:sqlite
#
# node:sqlite is part of the Node runtime, so there is no native addon to
# compile: no python/make/g++ in the builder and no rebuild step in the runner.
###############################################################################
ARG NODE_VERSION=24-alpine

# --- deps: full install, cached on the lockfile alone ------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- build: type-check and emit dist/ ---------------------------------------
FROM deps AS build
WORKDIR /app
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# --- prod-deps: runtime dependencies only ------------------------------------
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# --- runner ------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache curl \
 && mkdir -p /app/data \
 && chown -R node:node /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build     --chown=node:node /app/dist         ./dist
COPY --chown=node:node package.json ./

USER node

ENV HOST=0.0.0.0 \
    PORT=4000 \
    DATABASE_PATH=/app/data/presight.sqlite

EXPOSE 4000
VOLUME ["/app/data"]

HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4000/health || exit 1

CMD ["node", "dist/index.js"]
