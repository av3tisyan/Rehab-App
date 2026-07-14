# Rehab Clinic Web App

Web application for rehabilitation specialists and kinesiotherapists to manage patients,
record clinical histories, perform standardized assessments (ROM / MMT / VAS), and generate
discharge reports with **baseline-vs-final comparison**. Tablet-first, multi-tenant, i18n-ready
(Armenian + English).

See [PLAN.md](PLAN.md) for the full implementation plan and confirmed decisions.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Frontend:** React + TypeScript + Vite + Mantine (`apps/web`)
- **Backend:** NestJS + TypeScript, REST + OpenAPI (`apps/api`)
- **Shared:** types, enums, comparison logic (`packages/shared`)
- **Database:** PostgreSQL 16 (Drizzle ORM + migrations)
- **Deploy:** Docker Compose (same images on-prem and cloud)

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker + Docker Compose (for containerized run)

## Local development

```bash
pnpm install
cp .env.example .env      # adjust values as needed

# Run everything in watch mode (once DB is up — see below):
pnpm dev

# Or per app:
pnpm --filter @rehab/api dev     # http://localhost:3001  (docs at /api/docs)
pnpm --filter @rehab/web dev     # http://localhost:5173
```

## Run with Docker

```bash
cp .env.example .env
docker compose up --build
# web → http://localhost:5173 · api → http://localhost:3001 · db → localhost:5432
```

## Workspace scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests |
| `pnpm format` | Prettier write |

## Project layout

```
apps/api        NestJS API (auth, patients, episodes, encounters, assessments, comparison)
apps/web        React + Mantine tablet UI
packages/shared Shared TS types, enums, comparison logic
```
