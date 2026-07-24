-- ============================================================
-- 0006_goal_metric_link — optionally tie a treatment goal to a measured metric
--
-- When a goal is linked to a metric (e.g. ROM shoulder flexion, right), the app
-- auto-computes progress: baseline → current (latest assessment) → target_value.
-- All columns are nullable — goals can stay purely descriptive.
-- ============================================================
ALTER TABLE treatment_goals
  ADD COLUMN metric_type_code    TEXT,        -- 'ROM' | 'MMT' | 'VAS' | ...  (assessment_types.code)
  ADD COLUMN metric_body_region  TEXT,
  ADD COLUMN metric_side         body_side,
  ADD COLUMN metric_measure_kind TEXT;
