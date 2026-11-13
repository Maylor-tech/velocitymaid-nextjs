-- Disposable Stage 5A-I3 rehearsal. Refuses any database that is not the local cluster.
\set ON_ERROR_STOP on

DO $$
BEGIN
  IF current_database() <> 'velocitymaid_rebooking_v2' THEN
    RAISE EXCEPTION 'refusing database %', current_database();
  END IF;
  IF inet_server_addr() <> '127.0.0.1'::inet OR inet_server_port() <> 54329 THEN
    RAISE EXCEPTION 'refusing endpoint %:%', inet_server_addr(), inet_server_port();
  END IF;
  IF (SELECT system_identifier FROM pg_control_system()) = 7642734024280108049 THEN
    RAISE EXCEPTION 'refusing production system identifier';
  END IF;
END $$;

SELECT current_database() AS database_name,
       inet_server_addr() AS server_addr,
       inet_server_port() AS server_port,
       current_user,
       (SELECT system_identifier FROM pg_control_system()) AS system_identifier,
       version() AS postgres_version;

INSERT INTO "Branch" (
  id, name, slug, state, city, timezone, "primaryPhone", "whatsappNumber", "updatedAt"
) VALUES (
  'branch-rehearsal', 'Rehearsal', 'rehearsal', 'VT', 'Burlington', 'America/New_York', '802-000-0000', '802-000-0000', CURRENT_TIMESTAMP
);

INSERT INTO "Job" (id, "branchId") VALUES
  ('hist-1', 'branch-rehearsal'),
  ('hist-2', 'branch-rehearsal'),
  ('hist-3', 'branch-rehearsal'),
  ('failed-1', 'branch-rehearsal'),
  ('claimed-1', 'branch-rehearsal'),
  ('worker-1', 'branch-rehearsal');

INSERT INTO "rebooking_reminder_deliveries" (
  id, "jobId", status, "createdAt", "updatedAt"
) VALUES
  ('row-hist-1', 'hist-1', 'ACCEPTED', TIMESTAMPTZ '2026-01-01', TIMESTAMPTZ '2026-01-01'),
  ('row-hist-2', 'hist-2', 'ACCEPTED', TIMESTAMPTZ '2026-01-02', TIMESTAMPTZ '2026-01-02'),
  ('row-hist-3', 'hist-3', 'ACCEPTED', TIMESTAMPTZ '2026-01-03', TIMESTAMPTZ '2026-01-03');

INSERT INTO "rebooking_reminder_deliveries" (
  id, "jobId", status, "claimedAt", "firstProviderAttemptAt", "payloadFingerprint", "createdAt", "updatedAt"
) VALUES (
  'row-claimed-1', 'claimed-1', 'CLAIMED', TIMESTAMPTZ '2026-11-13', TIMESTAMPTZ '2026-11-13',
  repeat('ab', 32), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "rebooking_reminder_deliveries" (
  id, "jobId", status, "firstProviderAttemptAt", "createdAt", "updatedAt"
) VALUES (
  'row-failed-1', 'failed-1', 'FAILED', TIMESTAMPTZ '2026-11-13', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

SELECT 'before-fixtures' AS marker, status, count(*)
FROM "rebooking_reminder_deliveries"
GROUP BY status
ORDER BY status;

SELECT "workerKey", enabled, "approvedDeploymentId" IS NULL AS deployment_null,
       "approvedCommitSha" IS NULL AS commit_null, generation, "updatedBy"
FROM "rebooking_execution_controls";

DO $$
BEGIN
  BEGIN
    INSERT INTO "rebooking_execution_controls" (
      "workerKey", enabled, generation, "updatedAt", "updatedBy"
    ) VALUES (
      'other-worker', false, 0, CURRENT_TIMESTAMP, 'rehearsal'
    );
    RAISE EXCEPTION 'duplicate worker key unexpectedly inserted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS duplicate worker key rejected';
  END;

  BEGIN
    UPDATE "rebooking_execution_controls"
    SET enabled = true, generation = 1, "updatedBy" = 'rehearsal'
    WHERE "workerKey" = 'rebooking-reminders';
    RAISE EXCEPTION 'enabled row without identity unexpectedly stored';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS enabled row without identity rejected';
  END;

  BEGIN
    UPDATE "rebooking_reminder_deliveries"
    SET "payloadFingerprint" = repeat('cd', 32)
    WHERE "jobId" = 'hist-1';
    RAISE EXCEPTION 'fingerprint overwrite unexpectedly stored';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'rebooking payload fingerprint is immutable' THEN
      RAISE;
    END IF;
    RAISE NOTICE 'PASS fingerprint overwrite rejected';
  END;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rebooking_worker') THEN
    CREATE ROLE rebooking_worker NOINHERIT LOGIN NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rebooking_operator') THEN
    CREATE ROLE rebooking_operator NOINHERIT NOLOGIN NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'public_app') THEN
    CREATE ROLE public_app NOINHERIT NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE rebooking_worker LOGIN NOINHERIT NOBYPASSRLS;
ALTER ROLE rebooking_operator NOLOGIN NOINHERIT NOBYPASSRLS;
ALTER ROLE public_app NOLOGIN NOINHERIT NOBYPASSRLS;

CREATE POLICY rebooking_worker_read_control
  ON "rebooking_execution_controls"
  FOR SELECT
  TO rebooking_worker
  USING (true);

CREATE POLICY rebooking_operator_control
  ON "rebooking_execution_controls"
  FOR ALL
  TO rebooking_operator
  USING (true)
  WITH CHECK (true);

CREATE POLICY rebooking_worker_read_job
  ON "Job"
  FOR SELECT
  TO rebooking_worker
  USING (true);

CREATE POLICY rebooking_worker_ledger
  ON "rebooking_reminder_deliveries"
  FOR ALL
  TO rebooking_worker
  USING (true)
  WITH CHECK (true);

CREATE POLICY rebooking_worker_audit_insert
  ON "AuditLog"
  FOR INSERT
  TO rebooking_worker
  WITH CHECK (true);

GRANT SELECT (
  "workerKey", enabled, "approvedDeploymentId", "approvedCommitSha", generation, "updatedAt", "updatedBy"
) ON "rebooking_execution_controls" TO rebooking_worker;

GRANT SELECT, UPDATE (
  enabled, "approvedDeploymentId", "approvedCommitSha", generation, "updatedAt", "updatedBy"
) ON "rebooking_execution_controls" TO rebooking_operator;

GRANT SELECT ("id", "customerId", "preferredDate", "address", status, "archivedAt")
  ON "Job" TO rebooking_worker;

GRANT SELECT, INSERT ON "rebooking_reminder_deliveries" TO rebooking_worker;
GRANT UPDATE (status, "providerMessageId", "sendError", "claimedAt")
  ON "rebooking_reminder_deliveries" TO rebooking_worker;
GRANT EXECUTE ON FUNCTION "rebooking_payload_fingerprint_immutable"() TO rebooking_worker;

GRANT INSERT ("id", action, "entityType", "entityId") ON "AuditLog" TO rebooking_worker;

DO $$
BEGIN
  SET LOCAL ROLE rebooking_worker;

  IF (SELECT enabled FROM "rebooking_execution_controls" WHERE "workerKey" = 'rebooking-reminders') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'worker could not read the disabled control row';
  END IF;
  RAISE NOTICE 'PASS worker read control';

  PERFORM id FROM "Job" WHERE id = 'hist-1';
  RAISE NOTICE 'PASS worker read candidate';

  INSERT INTO "rebooking_reminder_deliveries" (
    id, "jobId", status, "claimedAt", "firstProviderAttemptAt", "payloadFingerprint", "createdAt", "updatedAt"
  ) VALUES (
    'row-worker-1', 'worker-1', 'CLAIMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, repeat('ef', 32), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );
  UPDATE "rebooking_reminder_deliveries"
  SET status = 'ACCEPTED', "providerMessageId" = 'fake-message'
  WHERE "jobId" = 'worker-1' AND status = 'CLAIMED';
  RAISE NOTICE 'PASS worker ledger claim and outcome';

  INSERT INTO "AuditLog" (id, action, "entityType", "entityId")
  VALUES ('audit-worker-1', 'REBOOKING_REMINDER_SENT', 'Job', 'worker-1');
  RAISE NOTICE 'PASS worker audit insert';

  BEGIN
    UPDATE "rebooking_execution_controls" SET enabled = true WHERE "workerKey" = 'rebooking-reminders';
    RAISE EXCEPTION 'worker enable unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker cannot enable itself';
  END;

  BEGIN
    UPDATE "rebooking_execution_controls"
    SET "approvedDeploymentId" = 'dpl_Fake', generation = 9
    WHERE "workerKey" = 'rebooking-reminders';
    RAISE EXCEPTION 'worker identity change unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker cannot change identity or generation';
  END;

  BEGIN
    DELETE FROM "rebooking_execution_controls";
    RAISE EXCEPTION 'worker delete unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker cannot delete control';
  END;

  BEGIN
    INSERT INTO "rebooking_execution_controls" (
      "workerKey", enabled, generation, "updatedAt", "updatedBy"
    ) VALUES ('rebooking-reminders', false, 0, CURRENT_TIMESTAMP, 'worker');
    RAISE EXCEPTION 'worker replace unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker cannot insert control';
  END;

  BEGIN
    UPDATE "rebooking_reminder_deliveries"
    SET "payloadFingerprint" = repeat('11', 32)
    WHERE "jobId" = 'worker-1';
    RAISE EXCEPTION 'worker fingerprint overwrite unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker cannot update fingerprint column';
  END;

  BEGIN
    EXECUTE 'CREATE ROLE rebooking_escalated';
    RAISE EXCEPTION 'worker create role unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker cannot create a role';
  END;

  BEGIN
    EXECUTE 'GRANT rebooking_operator TO rebooking_worker';
    RAISE EXCEPTION 'worker grant unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker cannot grant itself a role';
  END;

  RESET ROLE;
END $$;

DO $$
BEGIN
  SET LOCAL ROLE public_app;
  BEGIN
    PERFORM "workerKey" FROM "rebooking_execution_controls";
    RAISE EXCEPTION 'public role read unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS public role cannot read control';
  END;
  BEGIN
    UPDATE "rebooking_execution_controls" SET enabled = true;
    RAISE EXCEPTION 'public role update unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS public role cannot update control';
  END;
  RESET ROLE;
END $$;

DO $$
DECLARE
  granted boolean;
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM "workerKey" FROM "rebooking_execution_controls";
    RAISE EXCEPTION 'anon read unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS anon cannot read control';
  END;
  RESET ROLE;

  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM "workerKey" FROM "rebooking_execution_controls";
    RAISE EXCEPTION 'authenticated read unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS authenticated cannot read control';
  END;
  RESET ROLE;

  SET LOCAL ROLE service_role;
  BEGIN
    PERFORM "workerKey" FROM "rebooking_execution_controls";
    RAISE EXCEPTION 'service_role read unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS service_role cannot read control';
  END;
  RESET ROLE;

  SELECT rolbypassrls INTO granted FROM pg_roles WHERE rolname = 'rebooking_worker';
  IF granted THEN
    RAISE EXCEPTION 'worker has bypassrls';
  END IF;
  RAISE NOTICE 'PASS worker does not bypass row security';
END $$;

DO $$
BEGIN
  SET LOCAL ROLE rebooking_operator;
  UPDATE "rebooking_execution_controls"
  SET enabled = true,
      "approvedDeploymentId" = 'dpl_RehearsalOnly',
      "approvedCommitSha" = 'e0dfe44cf94423910c9c5c9d2a05863db224fcfd',
      generation = generation + 1,
      "updatedBy" = 'operator:rehearsal'
  WHERE "workerKey" = 'rebooking-reminders';
  RAISE NOTICE 'PASS operator authorized a rehearsal identity';

  UPDATE "rebooking_execution_controls"
  SET enabled = false,
      "approvedDeploymentId" = NULL,
      "approvedCommitSha" = NULL,
      generation = generation + 1,
      "updatedBy" = 'operator:rehearsal-revoke'
  WHERE "workerKey" = 'rebooking-reminders';
  RAISE NOTICE 'PASS operator revoked authorization and incremented generation';
  RESET ROLE;
END $$;

SELECT 'after-control' AS marker, enabled, "approvedDeploymentId", "approvedCommitSha", generation, "updatedBy"
FROM "rebooking_execution_controls";

SELECT 'after-historical' AS marker, "jobId", status, "claimedAt", "firstProviderAttemptAt", "payloadFingerprint"
FROM "rebooking_reminder_deliveries"
WHERE "jobId" IN ('hist-1', 'hist-2', 'hist-3')
ORDER BY "jobId";

SELECT conname
FROM pg_constraint
WHERE conrelid = 'rebooking_reminder_deliveries'::regclass
ORDER BY conname;

SELECT indexname
FROM pg_indexes
WHERE tablename = 'rebooking_reminder_deliveries'
ORDER BY indexname;

SELECT count(*) AS control_rows FROM "rebooking_execution_controls";
SELECT count(*) AS successful_migrations,
       count(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL) AS unfinished_migrations
FROM "_prisma_migrations";

-- SET ROLE follows the session user. A superuser's SET ROLE does not prove
-- that the worker session is unable to switch roles, so this connects directly.
\connect velocitymaid_rebooking_v2 rebooking_worker 127.0.0.1 54329

DO $$
BEGIN
  IF current_user <> 'rebooking_worker' OR session_user <> 'rebooking_worker' THEN
    RAISE EXCEPTION 'expected a worker session, got % / %', current_user, session_user;
  END IF;
  BEGIN
    EXECUTE 'SET ROLE rebooking_operator';
    RAISE EXCEPTION 'worker set role unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker session cannot switch into the operator';
  END;
  BEGIN
    EXECUTE 'SET ROLE rebooking_v2';
    RAISE EXCEPTION 'worker set role to owner unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker session cannot switch into the owner';
  END;
  BEGIN
    EXECUTE 'SET ROLE postgres';
    RAISE EXCEPTION 'worker set role to postgres unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS worker session cannot switch into postgres';
  END;
END $$;
