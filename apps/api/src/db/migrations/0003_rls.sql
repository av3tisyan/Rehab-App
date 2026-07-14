-- ============================================================
-- 0003_rls — Row-Level Security policies for tenant isolation
--
-- SAFE / NON-BREAKING: RLS is ENABLED (not FORCED). The application connects as
-- the table OWNER, which bypasses RLS, so behaviour is unchanged today. The
-- policies below become active only when the app connects as a NON-owner role
-- (or the tables are set to FORCE ROW LEVEL SECURITY). This makes the schema
-- multi-tenant-enforceable at the database level without a future migration.
--
-- To ENFORCE later:
--   1. Create a limited role:  CREATE ROLE rehab_app NOLOGIN;  GRANT ... ;
--   2. Have the API set the tenant per transaction:
--        SET LOCAL app.current_clinic = '<clinic-uuid>';
--   3. Either connect as rehab_app, or: ALTER TABLE <t> FORCE ROW LEVEL SECURITY;
--
-- current_setting('app.current_clinic', true) returns NULL when unset (missing_ok),
-- so an unconfigured restricted session sees no rows — a safe default.
-- ============================================================

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'users', 'patients', 'episodes', 'encounters',
    'assessments', 'documents', 'treatment_goals'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (clinic_id = current_setting(''app.current_clinic'', true)::uuid)
         WITH CHECK (clinic_id = current_setting(''app.current_clinic'', true)::uuid);',
      t
    );
  END LOOP;

  -- clinics: the tenant root — scope by the clinic's own id.
  EXECUTE 'ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;';
  EXECUTE 'CREATE POLICY tenant_isolation ON clinics
             USING (id = current_setting(''app.current_clinic'', true)::uuid)
             WITH CHECK (id = current_setting(''app.current_clinic'', true)::uuid);';
END $$;
