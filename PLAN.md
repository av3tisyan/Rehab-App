# Rehab Clinic Web App — Implementation Plan

> Status: proposal for review. No application code is written until the open decisions
> (bottom of this doc) are confirmed.

## 1. Guiding principles (from the brief)

- **Multi-tenant from day one** — `clinic_id` on every clinical row, RLS-ready.
- **Structured measurements, never free text** — comparison math is pure SQL on typed columns.
- **Tablet-first, touch-first UX** — 44px targets, tap-based entry, interactive SVG body diagram.
- **Extensible tests without migrations** — `assessment_types` catalog + `type` + `JSONB payload`.
- **Deploy identically on-prem and cloud** — Docker from the start.
- **i18n from the start** — Armenian (`hy`) + English (`en`).
- **Medical PII** — architecture must not block encryption-at-rest, audit logging, data residency.

## 2. Recommended tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Monorepo | pnpm workspaces + Turborepo | Share TS types across FE/BE; one image build pipeline |
| Frontend | React 18 + TypeScript + Vite | Fast, mature, PWA-friendly for offline |
| UI kit | **Mantine** (recommended) | Batteries-included touch components (Slider, SegmentedControl, Stepper, Tabs), strong form + hooks story; shadcn is more assembly work for a data-entry app |
| State/data | TanStack Query (server) + Zustand (local UI) | SWR caching enables offline-tolerance |
| Offline | PWA (vite-plugin-pwa) + IndexedDB outbox | Graceful degradation; queue writes, sync on reconnect |
| Charts | Recharts (or visx) | Trend charts for comparison view |
| Backend | **NestJS + TypeScript** (recommended) | End-to-end TS + shared types; modular DI scales to multi-clinic; mature, well-documented. (FastAPI is the alternative — see decisions) |
| API style | REST + OpenAPI (typed client generated) | Simpler offline/HTTP caching + tooling than tRPC; still fully typed |
| DB access | **Drizzle ORM + drizzle-kit migrations** | Type-safe, keeps hand-written SQL power for `DISTINCT ON` comparison query and JSONB; migrations as versioned SQL |
| Database | PostgreSQL 16 | As specified; JSONB + RLS + `pgcrypto`/`citext` |
| Auth | JWT (access+refresh), Argon2 password hash | `users` table already models this |
| i18n | i18next (FE) + ICU messages | `hy` + `en` locale files |
| Deploy | Docker Compose (db + api + web + nginx) | One image set, env-driven config |
| Tests | Vitest (unit), Supertest (API), Playwright (E2E) | 80% coverage target |

## 3. Folder structure (monorepo)

```
rehab-app/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── package.json                 # pnpm workspace root
├── turbo.json
├── packages/
│   └── shared/                  # shared TS types, enums, comparison logic, zod schemas
│       ├── src/
│       │   ├── domain/          # Patient, Episode, Encounter, Assessment types
│       │   ├── assessments/     # catalog codes, ROM norms, Oxford scale, VAS
│       │   ├── comparison/      # delta/percent + green/red direction logic
│       │   └── i18n/            # shared message keys
├── apps/
│   ├── api/                     # NestJS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/          # guards, interceptors (audit, tenant), filters
│   │   │   ├── auth/
│   │   │   ├── clinics/
│   │   │   ├── patients/
│   │   │   ├── episodes/
│   │   │   ├── encounters/
│   │   │   ├── assessments/     # includes comparison endpoint
│   │   │   ├── documents/       # anamnesis + epicrisis generation
│   │   │   └── db/
│   │   │       ├── schema.ts    # Drizzle schema (mirrors DDL)
│   │   │       ├── migrations/  # versioned SQL
│   │   │       └── seed/        # assessment_types + clinical reference data
│   │   └── test/
│   └── web/                     # React + Vite
│       ├── src/
│       │   ├── main.tsx
│       │   ├── app/             # router, providers, layout (bottom/side nav)
│       │   ├── features/
│       │   │   ├── patients/
│       │   │   ├── anamnesis/   # tabbed forms
│       │   │   ├── assessment/  # BODY DIAGRAM + ROM + MMT + VAS  ← first slice
│       │   │   ├── comparison/  # baseline→latest table + trend chart
│       │   │   └── epicrisis/
│       │   ├── components/      # BodyDiagram.svg, SegmentedGrade, RomDialog, PainSlider
│       │   ├── lib/             # api client, offline outbox, query hooks
│       │   ├── i18n/            # en.json, hy.json
│       │   └── styles/          # tokens.css (touch sizes, spacing)
│       └── tests/               # vitest + playwright
```

## 4. Build phases

### Phase 0 — Scaffold & infra
- pnpm workspace + Turborepo, TS strict everywhere.
- `docker-compose.yml`: postgres, api, web. `.env.example`.
- CI-ready scripts (lint, typecheck, test, build).

### Phase 1 — Database (the foundation)
- Drizzle schema mirroring the provided DDL, with the two **corrections** noted below.
- Versioned migrations (extensions → enums → tables → indexes).
- Seed migration: `assessment_types` (ROM, MMT, VAS + WEIGHT/BMI/BP_SYS/BP_DIA/HR) and clinical reference data (joint ROM norms, Oxford 0–5, VAS 0–10, MMT muscle list).
- **Correction 1:** `audit_log.id` → `BIGINT GENERATED ALWAYS AS IDENTITY` (the DDL's `BIGGENERATED` is a typo, flagged in the brief).
- **Correction 2:** confirm which clinical reference data you supply vs I default (brief offers to provide joint/ROM norms — see decisions).

### Phase 2 — API core
- Auth (login, JWT, refresh), Argon2 hashing.
- Tenant context: interceptor that pins `clinic_id` per request (RLS-ready via `SET app.current_clinic`).
- Audit interceptor writing to `audit_log` on create/update/delete.
- CRUD: patients → episodes → encounters → assessments (soft-delete respected).
- **Assessment write path**: API extracts `primary_value`/`side`/`measure_kind` from payload into typed columns.
- **Comparison endpoint**: `GET /episodes/:id/comparison?type=ROM&region=shoulder` →
  baseline vs latest per (side, measure_kind), Δ, % change, and `higher_is_better` direction
  (neutral for range-based vitals; BMI computed, never stored).
- OpenAPI spec → generated typed FE client.

### Phase 3 — Assessment UI vertical slice (hardest, UX-critical — done first on FE)
- Interactive **SVG body diagram**: tap a joint → ROM entry dialog (active/passive, L/R, degrees, stepper + slider).
- **MMT**: Oxford 0–5 SegmentedControl (tap, no keyboard).
- **Pain**: VAS/NRS 0–10 slider.
- All touch targets ≥ 44px; bottom nav for one-handed hold.
- Writes flow through offline outbox → sync.

### Phase 4 — Comparison view
- Baseline→latest table with green/red (driven by `higher_is_better`, neutral for vitals).
- Trend chart over time per metric.

### Phase 5 — Anamnesis + Epicrisis
- Tabbed anamnesis forms (vitae/morbi/comorbidities); pre-fill from previous visit.
- Auto-generated epicrisis pulling the comparison data (`rendered_text` + structured `content`).

### Phase 6 — Hardening
- i18n pass (hy/en), a11y, offline sync edge cases, 80% coverage, RLS policies enabled behind a flag.

## 5. Testing strategy
- **Unit**: comparison math (Δ, %, direction), payload→typed-column extraction, BMI derivation.
- **Integration**: API endpoints incl. comparison query correctness (baseline vs latest with `DISTINCT ON`).
- **E2E (Playwright)**: register patient → assess ROM via body diagram → second visit → see green/red comparison.
- Visual regression on the assessment screen at tablet breakpoints (768/1024).

## 6. Confirmed decisions (2026-07-13)

- **Backend: NestJS + TypeScript** — chosen for end-to-end TS and shared types with the
  frontend; REST+OpenAPI boundary keeps a future Python/ML service swappable.
- **UI kit: Mantine.**
- **Offline: graceful degradation only for v1** — cache-load, clear offline state, block
  writes when disconnected. No IndexedDB outbox yet (can add offline-first later without
  rearchitecting, since writes already go through a single API client layer).
- **Clinical reference data: seed sensible published defaults now** (AAOS-style ROM norms,
  Oxford 0–5, VAS 0–10), marked "review needed." Fully editable later — it's seed rows in
  `assessment_types` + reference tables, not schema. An admin edit screen can be added.

## 7. Risks
- Body-diagram SVG interaction complexity on touch → prototype early (Phase 3 first).
- Offline sync conflict handling → start with last-write-wins + outbox, document limits.
- RLS + connection pooling (`SET app.current_clinic` per tx) → validate with pooled connections.
```
