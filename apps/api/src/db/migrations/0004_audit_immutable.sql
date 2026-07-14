-- ============================================================
-- 0004_audit_immutable — make audit_log append-only & tamper-evident
--
-- Two layers of protection:
--   1. IMMUTABILITY: triggers block UPDATE / DELETE / TRUNCATE on audit_log, so
--      rows can only ever be inserted, never changed or removed.
--   2. TAMPER-EVIDENCE: each row is hash-chained to the previous one
--      (row_hash = sha256(prev_hash || row-contents)). Altering or deleting any
--      row breaks the chain, which verify_audit_chain() detects.
--
-- NOTE ON SUPERUSERS: a Postgres SUPERUSER can disable triggers
-- (session_replication_role = replica) or drop them. For true production
-- immutability, run the application under a NON-superuser role that owns none of
-- these objects. The hash chain still makes any such tampering *detectable*.
-- ============================================================

-- ---- Hash-chain columns (populated by trigger; app never sets them) ----
ALTER TABLE audit_log ADD COLUMN prev_hash TEXT;
ALTER TABLE audit_log ADD COLUMN row_hash  TEXT;

-- ---- 1. Block mutation (append-only) ----
CREATE OR REPLACE FUNCTION audit_log_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_mutation();

-- ---- 2. Hash chain on insert ----
-- Deterministic serialization of a row's immutable contents.
CREATE OR REPLACE FUNCTION audit_log_row_payload(
  p_prev TEXT, p_id BIGINT, p_clinic UUID, p_user UUID, p_action TEXT,
  p_entity TEXT, p_entity_id UUID, p_diff JSONB, p_ip INET, p_created TIMESTAMPTZ
) RETURNS TEXT AS $$
  SELECT p_prev
    || p_id::text || '|'
    || COALESCE(p_clinic::text, '') || '|'
    || COALESCE(p_user::text, '') || '|'
    || p_action || '|'
    || p_entity || '|'
    || COALESCE(p_entity_id::text, '') || '|'
    || COALESCE(p_diff::text, '') || '|'
    || COALESCE(p_ip::text, '') || '|'
    || p_created::text;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION audit_log_hash_chain() RETURNS trigger AS $$
DECLARE
  last_hash TEXT;
BEGIN
  -- Serialize concurrent inserts so the chain never forks.
  PERFORM pg_advisory_xact_lock(4924242424);
  SELECT row_hash INTO last_hash FROM audit_log ORDER BY id DESC LIMIT 1;
  NEW.prev_hash := COALESCE(last_hash, '');
  NEW.row_hash := encode(
    digest(
      audit_log_row_payload(
        NEW.prev_hash, NEW.id, NEW.clinic_id, NEW.user_id, NEW.action,
        NEW.entity, NEW.entity_id, NEW.diff, NEW.ip_address, NEW.created_at
      ),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_chain
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_hash_chain();

-- ---- Chain verification (for an admin "integrity check") ----
CREATE OR REPLACE FUNCTION verify_audit_chain()
RETURNS TABLE(status TEXT, rows_checked BIGINT, first_bad_id BIGINT) AS $$
DECLARE
  r        RECORD;
  running  TEXT := '';
  expected TEXT;
  cnt      BIGINT := 0;
  bad      BIGINT := NULL;
BEGIN
  FOR r IN SELECT * FROM audit_log ORDER BY id ASC LOOP
    expected := encode(
      digest(
        audit_log_row_payload(
          running, r.id, r.clinic_id, r.user_id, r.action,
          r.entity, r.entity_id, r.diff, r.ip_address, r.created_at
        ),
        'sha256'
      ),
      'hex'
    );
    IF r.prev_hash IS DISTINCT FROM running OR r.row_hash IS DISTINCT FROM expected THEN
      bad := r.id;
      EXIT;
    END IF;
    running := r.row_hash;
    cnt := cnt + 1;
  END LOOP;

  IF bad IS NULL THEN
    RETURN QUERY SELECT 'intact'::text, cnt, NULL::bigint;
  ELSE
    RETURN QUERY SELECT 'tampered'::text, cnt, bad;
  END IF;
END;
$$ LANGUAGE plpgsql;
