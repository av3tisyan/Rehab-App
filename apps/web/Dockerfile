# syntax=docker/dockerfile:1
# Build context is the repo root (see docker-compose.yml).

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @rehab/web... --filter @rehab/shared

FROM deps AS build
# VITE_API_URL is baked at build time. Leave EMPTY for the production reverse-proxy
# setup (the app then calls the API at a relative /api on the same origin).
# Override only for split-origin setups (e.g. dev compose).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @rehab/shared build && pnpm --filter @rehab/web build

# ---- Serve static build via nginx ----
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
