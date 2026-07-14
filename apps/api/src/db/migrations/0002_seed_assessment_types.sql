-- ============================================================
-- 0002_seed_assessment_types — the assessment catalog (FK target)
-- Seeded in a migration (not the app seed script) because assessments
-- reference these rows by FK; they must exist in every environment.
-- Idempotent via ON CONFLICT (code).
--
-- Coloring rules baked in:
--   is_directional = true  → color by higher_is_better (green improvement / red decline)
--   is_directional = false → range-based vital, NEUTRAL coloring (show number + delta only)
--   is_computed    = true  → derived, never entered directly (BMI)
-- ============================================================

INSERT INTO assessment_types
    (code, name, unit, min_value, max_value, higher_is_better, is_directional, is_computed)
VALUES
    -- Core rehab tests (directional):
    ('ROM',    'Range of motion',    'deg',   0,   NULL, true,  true,  false),
    ('MMT',    'Manual muscle test', 'grade', 0,   5,    true,  true,  false),
    ('VAS',    'Pain (VAS/NRS)',     'score', 0,   10,   false, true,  false),
    -- Longitudinal vitals (range-based → neutral coloring):
    ('WEIGHT', 'Body weight',        'kg',    0,   500,  true,  false, false),
    ('BMI',    'Body mass index',    'kg/m2', 0,   100,  false, false, true),
    ('BP_SYS', 'Systolic BP',        'mmHg',  0,   300,  false, false, false),
    ('BP_DIA', 'Diastolic BP',       'mmHg',  0,   200,  false, false, false),
    ('HR',     'Resting heart rate', 'bpm',   0,   250,  false, false, false)
ON CONFLICT (code) DO NOTHING;
