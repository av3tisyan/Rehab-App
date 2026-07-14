# Rehabilitation Clinic Web App — Build Prompt

## Project overview

Build a web application for **rehabilitation specialists and kinesiotherapists** to manage patients, record clinical histories, perform standardized physical assessments, and generate discharge reports. The app must have excellent UX and work well on **tablets** (touch-first), since clinicians use it bedside.

Start as a single-clinician tool, but architect from day one to scale to **multiple clinics** later.

## Core requirements

The clinician workflow follows a patient journey:

1. **Patient registration** — quick, low-friction intake (name, age, contact, referring physician, and static biometrics: height, blood type, dominant hand).
2. **Anamnesis** — tabbed forms for:
   - Life history (anamnesis vitae)
   - Disease history (anamnesis morbi)
   - Comorbidities, medications, contraindications / red flags
3. **Objective assessment** — the UX-critical part:
   - **Goniometry (ROM)**: interactive body diagram (SVG) where tapping a joint opens range-of-motion entry (active/passive, left/right, in degrees).
   - **Muscle strength (MMT)**: Oxford scale 0–5, entered via tap (segmented control, not keyboard).
   - **Pain**: VAS/NRS slider (0–10).
   - Extensible: adding a new test type must not require a schema migration.
4. **Diagnosis & treatment plan** — SMART goals, interventions.
5. **Discharge epicrisis** — auto-generated from collected data, including a **baseline vs. final comparison** (the key feature).

## The comparison feature (most important)

Every measurement is stored with a `type` and a `timestamp`. The app must:
- Pull the first and latest measurements of the same type.
- Compute the delta (Δ) and percentage change.
- Display a comparison table (baseline → latest) and a trend chart over time.
- Color-code: green = improvement, red = decline.

This is only possible because measurements are stored as **structured data (numbers), not free text**. Enforce this in the data model.

## Tech stack

Choose mature, well-documented tools that support both **on-prem and cloud** deployment:

- **Frontend**: React + TypeScript. A touch-friendly UI library (Mantine or shadcn/ui). TypeScript is required — clinical data structures are complex and type safety prevents errors.
- **Backend**: REST or tRPC API. Node.js (NestJS) or Python (FastAPI) — pick one and justify briefly.
- **Database**: PostgreSQL (relational core + JSONB fields for flexible test payloads).
- **Deployment**: Docker containers from the start, so the same image runs on-prem and in the cloud without changes.

## Non-functional requirements

- **Tablet-optimized**: touch targets ≥ 44px; scale/grade entry via tap (segmented controls, steppers), not keyboard; interactive SVG body diagram works by touch; bottom or side navigation for one-handed holding.
- **Offline-tolerant**: the app should degrade gracefully when the clinic network drops (offline-first is a plus).
- **Forms**: short, tabbed, not endless scroll. Pre-fill recurring data from the previous visit. Support templates/presets for common diagnoses.
- **i18n-ready**: build with internationalization support from the start (initial locales: Armenian and English).
- **Data privacy**: this is medical PII. Build the architecture to support encryption at rest, audit logging, and data-residency control. (Legal compliance — Armenian Personal Data Protection Law, and GDPR if EU-facing — is out of scope for the code but the architecture must not block it.)

---

## Database schema (PostgreSQL)

Implement the following schema as versioned migrations. It is **multi-tenant from day one**: every clinical record carries a `clinic_id`, even though only one clinic exists initially. Do not skip this — retrofitting tenancy later is a painful migration.

Design principles baked into this schema:
- All primary keys are `UUID` (generated with `gen_random_uuid()` from the `pgcrypto` extension) — avoids exposing sequential IDs and eases future data merging across deployments.
- Test measurements use a `type` + `JSONB payload` pattern so new test types need no schema change. **But** the numeric result that drives comparisons is extracted into typed columns (`primary_value`, `side`, `measure_kind`) so baseline-vs-final math is pure SQL, not JSON parsing.
- Soft-delete via `deleted_at` on clinical tables (never hard-delete medical records).
- `created_at` / `updated_at` audit timestamps everywhere; a separate `audit_log` table records who changed what.
- Referential integrity enforced with foreign keys; tenant isolation enforceable later with Postgres Row-Level Security (RLS) keyed on `clinic_id`.

```sql
-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";         -- case-insensitive email

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE user_role        AS ENUM ('admin', 'clinician');
CREATE TYPE patient_sex      AS ENUM ('male', 'female', 'other', 'unknown');
CREATE TYPE episode_status   AS ENUM ('active', 'discharged', 'on_hold', 'cancelled');
CREATE TYPE body_side        AS ENUM ('left', 'right', 'bilateral', 'not_applicable');
CREATE TYPE rom_kind         AS ENUM ('active', 'passive');
CREATE TYPE document_type    AS ENUM ('anamnesis_vitae', 'anamnesis_morbi', 'epicrisis', 'note');
CREATE TYPE goal_status      AS ENUM ('open', 'achieved', 'partially_achieved', 'not_achieved');

-- ============================================================
-- Tenancy & identity
-- ============================================================
CREATE TABLE clinics (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    address       TEXT,
    phone         TEXT,
    locale        TEXT NOT NULL DEFAULT 'hy',        -- default UI language
    timezone      TEXT NOT NULL DEFAULT 'Asia/Yerevan',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    email          CITEXT NOT NULL,
    password_hash  TEXT NOT NULL,
    full_name      TEXT NOT NULL,
    role           user_role NOT NULL DEFAULT 'clinician',
    is_active      BOOLEAN NOT NULL DEFAULT true,
    last_login_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (clinic_id, email)
);
CREATE INDEX idx_users_clinic ON users(clinic_id);

-- ============================================================
-- Patients
-- ============================================================
CREATE TABLE patients (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id          UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    first_name         TEXT NOT NULL,
    last_name          TEXT NOT NULL,
    date_of_birth      DATE,
    sex                patient_sex NOT NULL DEFAULT 'unknown',
    phone              TEXT,
    email              CITEXT,
    referring_physician TEXT,
    -- Static / identity-level biometrics (things that don't trend over a rehab course):
    height_cm          NUMERIC(5,1),    -- e.g. 178.0; height is effectively static in adults
    blood_type         TEXT,
    dominant_hand      TEXT,            -- 'left' / 'right' — clinically relevant for rehab
    notes              TEXT,
    created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ
);
CREATE INDEX idx_patients_clinic ON patients(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_name   ON patients(clinic_id, last_name, first_name) WHERE deleted_at IS NULL;

-- ============================================================
-- Episodes (a treatment case: e.g. "right shoulder", "left knee")
-- ============================================================
CREATE TABLE episodes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id        UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,                    -- e.g. "Right shoulder rehab"
    primary_complaint TEXT,
    diagnosis        TEXT,
    icd10_code       TEXT,
    status           episode_status NOT NULL DEFAULT 'active',
    started_at       DATE NOT NULL DEFAULT CURRENT_DATE,
    discharged_at    DATE,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ
);
CREATE INDEX idx_episodes_patient ON episodes(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_episodes_clinic  ON episodes(clinic_id, status) WHERE deleted_at IS NULL;

-- ============================================================
-- Encounters (individual visits / sessions)
-- ============================================================
CREATE TABLE encounters (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    episode_id     UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    clinician_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    encounter_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_number INTEGER,                            -- visit 1, 2, 3...
    subjective     TEXT,                               -- SOAP: patient-reported
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ
);
CREATE INDEX idx_encounters_episode ON encounters(episode_id, encounter_date) WHERE deleted_at IS NULL;

-- ============================================================
-- Assessment catalog: defines available test types (reference data)
-- ============================================================
CREATE TABLE assessment_types (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          TEXT NOT NULL UNIQUE,               -- 'ROM', 'MMT', 'VAS', ...
    name          TEXT NOT NULL,
    unit          TEXT,                               -- 'deg', 'grade', 'score'
    min_value     NUMERIC,
    max_value     NUMERIC,
    higher_is_better BOOLEAN NOT NULL DEFAULT true,   -- drives green/red coloring
    schema        JSONB,                              -- optional JSON-schema for payload validation
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Assessments (measurements). Flexible payload + extracted typed columns.
-- ============================================================
CREATE TABLE assessments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id          UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    encounter_id       UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    episode_id         UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,  -- denormalized for fast comparison queries
    assessment_type_id UUID NOT NULL REFERENCES assessment_types(id) ON DELETE RESTRICT,

    -- Extracted, typed fields that drive baseline-vs-final comparison:
    body_region        TEXT,          -- e.g. 'shoulder', 'knee'
    side               body_side NOT NULL DEFAULT 'not_applicable',
    measure_kind       TEXT,          -- e.g. 'flexion', 'abduction', 'deltoid', 'active'/'passive' via rom_kind in payload
    primary_value      NUMERIC,       -- the number that gets compared over time

    -- Full flexible detail (the whole measurement as entered):
    payload            JSONB NOT NULL DEFAULT '{}'::jsonb,

    measured_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ
);
-- Composite index is the workhorse for the comparison feature:
CREATE INDEX idx_assessments_comparison
    ON assessments(episode_id, assessment_type_id, body_region, side, measure_kind, measured_at)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_encounter ON assessments(encounter_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_payload   ON assessments USING GIN (payload);

-- ============================================================
-- Documents (anamnesis, epicrisis, notes)
-- ============================================================
CREATE TABLE documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    episode_id    UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    encounter_id  UUID REFERENCES encounters(id) ON DELETE SET NULL,
    type          document_type NOT NULL,
    title         TEXT,
    content       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- structured form content
    rendered_text TEXT,                                 -- generated prose (for epicrisis)
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_documents_episode ON documents(episode_id, type) WHERE deleted_at IS NULL;

-- ============================================================
-- Treatment goals (SMART goals for the plan)
-- ============================================================
CREATE TABLE treatment_goals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    episode_id    UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    description   TEXT NOT NULL,
    target_value  NUMERIC,
    target_date   DATE,
    status        goal_status NOT NULL DEFAULT 'open',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_episode ON treatment_goals(episode_id);

-- ============================================================
-- Audit log (who changed what — for medical-record accountability)
-- ============================================================
CREATE TABLE audit_log (
    id          BIGGENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id   UUID,
    user_id     UUID,
    action      TEXT NOT NULL,          -- 'create', 'update', 'delete', 'view'
    entity      TEXT NOT NULL,          -- table name
    entity_id   UUID,
    diff        JSONB,                  -- before/after snapshot
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_clinic_time ON audit_log(clinic_id, created_at);
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
```

### Notes on the schema for you (the implementer)

- **The comparison query** becomes trivial with this design. To get baseline vs. latest for a given metric:
  ```sql
  SELECT DISTINCT ON (side, measure_kind)
         side, measure_kind, primary_value, measured_at
  FROM assessments
  WHERE episode_id = $1
    AND assessment_type_id = $2
    AND body_region = $3
    AND deleted_at IS NULL
  ORDER BY side, measure_kind, measured_at ASC;   -- ASC = baseline; DESC = latest
  ```
  Run once ascending and once descending, join in the app (or use window functions) to compute Δ.

- **`higher_is_better`** on `assessment_types` is what tells the UI whether an increase is green or red — ROM and strength go up (good), pain goes down (good). Don't hardcode this in the frontend.

- **`payload` vs. typed columns**: the JSONB `payload` stores the full richness of a measurement (e.g. all planes of a joint at once); `primary_value` + `side` + `measure_kind` are the extracted fields that make comparison fast and index-friendly. When saving a measurement, the API extracts the comparable number into `primary_value`.

- **Row-Level Security**: not enabled in this DDL, but the `clinic_id` on every table means you can add RLS policies later (`USING (clinic_id = current_setting('app.current_clinic')::uuid)`) to enforce tenant isolation at the database level once you go multi-clinic.

- **`BIGGENERATED`** in `audit_log` is intentional — audit rows are high-volume and don't need UUIDs; a bigint identity is cheaper. (Correct it to `BIGINT GENERATED ALWAYS AS IDENTITY` when implementing.)

### Biometrics & vitals

Patient biometrics split into two categories by whether they trend over time:

- **Static / identity-level** (height, blood type, dominant hand) live directly on the `patients` table — added as columns above. Height is effectively static in adults, so it does not need to trend.
- **Longitudinal** (body weight, blood pressure, heart rate) go through the **same `assessments` mechanism** as ROM/MMT/VAS — no new tables. This gives them baseline-vs-final comparison, trend charts, and history for free. Seed these as assessment types:

```sql
INSERT INTO assessment_types (code, name, unit, min_value, max_value, higher_is_better) VALUES
    ('WEIGHT', 'Body weight',        'kg',    0,   500, true),
    ('BMI',    'Body mass index',    'kg/m2', 0,   100, false),
    ('BP_SYS', 'Systolic BP',        'mmHg',  0,   300, false),
    ('BP_DIA', 'Diastolic BP',       'mmHg',  0,   200, false),
    ('HR',     'Resting heart rate', 'bpm',   0,   250, false);
```

Two important caveats for these vitals:

- **`higher_is_better` doesn't cleanly apply** to weight, BP, or HR — most vitals have a *healthy range*, not a "higher/lower is always better" direction. So the green/red improvement coloring should be **disabled (neutral)** for range-based vitals: show the number and the Δ, but don't color it as improvement/decline. Only color metrics where a direction is genuinely better (ROM up, strength up, pain down). Later you can add `target_min` / `target_max` columns to `assessment_types` and color by "moved toward the healthy range" — but keep it neutral for now.
- **BMI is derived, not stored as an independent measurement.** Compute it as `weight_kg / (height_m)²` whenever both height (from `patients.height_cm`) and a weight assessment exist. Do **not** let clinicians enter BMI directly — storing it independently risks it going stale when weight changes. It's listed as an assessment type above only so it can be displayed/charted as a computed series.


Also seed `assessment_types` and the reference lists (joints with normal ROM ranges, MMT muscle groups, the Oxford 0–5 scale, VAS 0–10) as part of the initial migration. Ask me if you want the clinical reference data specified — I can provide the joint/ROM norms and muscle lists.

---

## What I want you to do first

1. Set up the project structure (frontend, backend, database, Docker Compose).
2. Implement the database schema above as versioned migrations, plus seed data for `assessment_types`.
3. Build the data model and API endpoints for patients, episodes, encounters, and assessments — including the baseline-vs-latest comparison endpoint.
4. Then build the assessment UI (body diagram + ROM sliders + MMT segmented control) as the first vertical slice, since it's the hardest and most UX-critical part.

Before writing code, propose a brief plan and the folder structure, and flag any decisions you'd like me to confirm.
