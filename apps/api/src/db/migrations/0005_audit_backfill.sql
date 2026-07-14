-- ============================================================
-- 0005_audit_backfill — chain any pre-existing audit rows
--
-- Rows inserted before 0004 have NULL hash columns. Compute the hash chain over
-- the entire table in id order so verify_audit_chain() covers all history and
-- returns 'intact'. The append-only UPDATE trigger is temporarily disabled for
-- this one-time backfill (owner-only), then re-enabled.
-- ============================================================

ALTER TABLE audit_log DISABLE TRIGGER audit_log_no_update;

DO $$
DECLARE
  r       RECORD;
  running TEXT := '';
  h       TEXT;
BEGIN
  FOR r IN SELECT * FROM audit_log ORDER BY id ASC LOOP
    h := encode(
      digest(
        audit_log_row_payload(
          running, r.id, r.clinic_id, r.user_id, r.action,
          r.entity, r.entity_id, r.diff, r.ip_address, r.created_at
        ),
        'sha256'
      ),
      'hex'
    );
    UPDATE audit_log SET prev_hash = running, row_hash = h WHERE id = r.id;
    running := h;
  END LOOP;
END $$;

ALTER TABLE audit_log ENABLE TRIGGER audit_log_no_update;
