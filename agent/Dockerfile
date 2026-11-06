# syntax=docker/dockerfile:1
# Built by LiveKit Cloud (`lk agent deploy`). Based on LiveKit's Node agent template, with npm.
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base
# The LiveKit SDK's native core reads the system CA bundle, which slim images don't ship.
RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm prune --omit=dev

FROM base
ARG UID=10001
RUN adduser --disabled-password --gecos "" --home "/app" --shell "/sbin/nologin" --uid "${UID}" appuser
WORKDIR /app
COPY --from=build --chown=appuser:appuser /app /app
USER appuser
ENV NODE_ENV=production
CMD ["npm", "start"]
