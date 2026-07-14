-- ============================================================
-- 0001_reference_tables — clinical reference data (global catalog)
-- These are shared, non-tenant reference lists that drive the assessment UI:
-- normal ROM ranges per joint motion, MMT muscle groups, and ordinal scale labels.
-- Seeded with published defaults by the seed script (marked "review needed").
-- ============================================================

-- Normal range-of-motion norms per joint + motion (drives the goniometry UI).
CREATE TABLE rom_norms (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    body_region    TEXT NOT NULL,              -- 'shoulder', 'knee', ...
    joint          TEXT NOT NULL,              -- 'glenohumeral', 'tibiofemoral', ...
    motion         TEXT NOT NULL,              -- 'flexion', 'abduction', ...
    plane          TEXT,                        -- 'sagittal', 'frontal', 'transverse'
    side_specific  BOOLEAN NOT NULL DEFAULT true,
    normal_min     NUMERIC NOT NULL DEFAULT 0,  -- degrees
    normal_max     NUMERIC NOT NULL,            -- degrees
    unit           TEXT NOT NULL DEFAULT 'deg',
    source         TEXT,                        -- provenance of the norm (e.g. 'AAOS')
    review_needed  BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (body_region, joint, motion)
);
CREATE INDEX idx_rom_norms_region ON rom_norms(body_region);

-- MMT muscle groups (drives the manual-muscle-test selection).
CREATE TABLE muscle_groups (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          TEXT NOT NULL UNIQUE,        -- 'DELTOID', 'QUADRICEPS', ...
    name          TEXT NOT NULL,
    body_region   TEXT NOT NULL,
    related_joint TEXT,
    action        TEXT,                         -- primary action tested
    myotome       TEXT,                         -- nerve root, e.g. 'C5'
    review_needed BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_muscle_groups_region ON muscle_groups(body_region);

-- Ordinal scale points (Oxford 0-5, VAS 0-10) — labels for the tap controls.
CREATE TABLE scale_points (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scale_code  TEXT NOT NULL,                  -- 'OXFORD', 'VAS'
    value       NUMERIC NOT NULL,
    label       TEXT NOT NULL,                  -- short label
    description TEXT,                            -- clinical description
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (scale_code, value)
);
CREATE INDEX idx_scale_points_scale ON scale_points(scale_code, value);
