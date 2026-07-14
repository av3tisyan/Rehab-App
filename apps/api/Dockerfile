# syntax=docker/dockerfile:1
# Build context is the repo root (see docker-compose.yml).

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Install workspace deps (cached on manifest changes) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @rehab/api... --filter @rehab/shared

# ---- Build shared lib + api ----
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @rehab/shared build \
  && pnpm --filter @rehab/api build \
  && pnpm --filter @rehab/api --prod deploy /app/deploy

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/deploy/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
