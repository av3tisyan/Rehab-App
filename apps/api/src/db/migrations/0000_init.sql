-- ============================================================
-- 0000_init — core clinical schema
-- Multi-tenant from day one: every clinical record carries clinic_id.
-- Faithful to the specified DDL, with corrections noted inline.
-- ============================================================

-- ---- Extensions ----
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";        -- case-insensitive email

-- ---- Enums ----
CREATE TYPE user_role      AS ENUM ('admin', 'clinician');
CREATE TYPE patient_sex    AS ENUM ('male', 'female', 'other', 'unknown');
CREATE TYPE episode_status AS ENUM ('active', 'discharged', 'on_hold', 'cancelled');
CREATE TYPE body_side      AS ENUM ('left', 'right', 'bilateral', 'not_applicable');
CREATE TYPE rom_kind       AS ENUM ('active', 'passive');
CREATE TYPE document_type  AS ENUM ('anamnesis_vitae', 'anamnesis_morbi', 'epicrisis', 'note');
CREATE TYPE goal_status    AS ENUM ('open', 'achieved', 'partially_achieved', 'not_achieved');

-- ---- Tenancy & identity ----
CREATE TABLE clinics (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    address    TEXT,
    phone      TEXT,
    locale     TEXT NOT NULL DEFAULT 'hy',
    timezone   TEXT NOT NULL DEFAULT 'Asia/Yerevan',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    email         CITEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    role          user_role NOT NULL DEFAULT 'clinician',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (clinic_id, email)
);
CREATE INDEX idx_users_clinic ON users(clinic_id);

-- ---- Patients ----
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id           UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    date_of_birth       DATE,
    sex                 patient_sex NOT NULL DEFAULT 'unknown',
    phone               TEXT,
    email               CITEXT,
    referring_physician TEXT,
    -- Static / identity-level biometrics (do not trend over a rehab course):
    height_cm           NUMERIC(5,1),
    blood_type          TEXT,
    dominant_hand       TEXT,
    notes               TEXT,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_patients_clinic ON patients(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_name   ON patients(clinic_id, last_name, first_name) WHERE deleted_at IS NULL;

-- ---- Episodes (a treatment case: e.g. "right shoulder") ----
CREATE TABLE episodes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id         UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    primary_complaint TEXT,
    diagnosis         TEXT,
    icd10_code        TEXT,
    status            episode_status NOT NULL DEFAULT 'active',
    started_at        DATE NOT NULL DEFAULT CURRENT_DATE,
    discharged_at     DATE,
    assigned_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_episodes_patient ON episodes(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_episodes_clinic  ON episodes(clinic_id, status) WHERE deleted_at IS NULL;

-- ---- Encounters (individual visits / sessions) ----
CREATE TABLE encounters (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    episode_id     UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    clinician_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    encounter_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_number INTEGER,
    subjective     TEXT,   -- SOAP: patient-reported
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ
);
CREATE INDEX idx_encounters_episode ON encounters(episode_id, encounter_date) WHERE deleted_at IS NULL;

-- ---- Assessment catalog: defines available test types (reference data) ----
CREATE TABLE assessment_types (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             TEXT NOT NULL UNIQUE,          -- 'ROM', 'MMT', 'VAS', ...
    name             TEXT NOT NULL,
    unit             TEXT,                          -- 'deg', 'grade', 'score'
    min_value        NUMERIC,
    max_value        NUMERIC,
    higher_is_better BOOLEAN NOT NULL DEFAULT true, -- drives green/red coloring
    is_directional   BOOLEAN NOT NULL DEFAULT true, -- false = range-based vital (neutral coloring)
    is_computed      BOOLEAN NOT NULL DEFAULT false,-- true = derived (e.g. BMI), not entered directly
    schema           JSONB,                         -- optional JSON-schema for payload validation
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Assessments (measurements): flexible payload + extracted typed columns ----
CREATE TABLE assessments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id          UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    encounter_id       UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    episode_id         UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE, -- denormalized for fast comparison
    assessment_type_id UUID NOT NULL REFERENCES assessment_types(id) ON DELETE RESTRICT,

    -- Extracted, typed fields that drive baseline-vs-final comparison:
    body_region        TEXT,
    side               body_side NOT NULL DEFAULT 'not_applicable',
    measure_kind       TEXT,                         -- e.g. 'flexion', 'abduction', 'deltoid'
    primary_value      NUMERIC,                      -- the number compared over time

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

-- ---- Documents (anamnesis, epicrisis, notes) ----
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

-- ---- Treatment goals (SMART goals for the plan) ----
CREATE TABLE treatment_goals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
    episode_id   UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    description  TEXT NOT NULL,
    target_value NUMERIC,
    target_date  DATE,
    status       goal_status NOT NULL DEFAULT 'open',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_episode ON treatment_goals(episode_id);

-- ---- Audit log (who changed what) ----
-- Correction: DDL's "BIGGENERATED" is a typo — use BIGINT GENERATED ALWAYS AS IDENTITY.
CREATE TABLE audit_log (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinic_id  UUID,
    user_id    UUID,
    action     TEXT NOT NULL,   -- 'create', 'update', 'delete', 'view'
    entity     TEXT NOT NULL,   -- table name
    entity_id  UUID,
    diff       JSONB,           -- before/after snapshot
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_clinic_time ON audit_log(clinic_id, created_at);
CREATE INDEX idx_audit_entity      ON audit_log(entity, entity_id);
