-- Additive rebooking v2 execution control and an immutable payload fingerprint.
-- The singleton is inserted disabled. It authorizes no deployment.
-- Authorization and revocation both increment generation in application code.
-- This migration does not grant a worker role and does not enable sending.

ALTER TABLE "rebooking_reminder_deliveries"
ADD COLUMN "payloadFingerprint" TEXT;

CREATE OR REPLACE FUNCTION "rebooking_payload_fingerprint_immutable"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."payloadFingerprint" IS DISTINCT FROM NEW."payloadFingerprint" THEN
    RAISE EXCEPTION 'rebooking payload fingerprint is immutable';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION "rebooking_payload_fingerprint_immutable"() FROM PUBLIC;

CREATE TRIGGER "rebooking_payload_fingerprint_immutable"
BEFORE UPDATE ON "rebooking_reminder_deliveries"
FOR EACH ROW
EXECUTE FUNCTION "rebooking_payload_fingerprint_immutable"();

CREATE TABLE "rebooking_execution_controls" (
    "workerKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "approvedDeploymentId" TEXT,
    "approvedCommitSha" TEXT,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "rebooking_execution_controls_pkey" PRIMARY KEY ("workerKey"),
    CONSTRAINT "rebooking_execution_control_worker_key_chk"
      CHECK ("workerKey" = 'rebooking-reminders'),
    CONSTRAINT "rebooking_execution_control_generation_nonnegative_chk"
      CHECK ("generation" >= 0),
    CONSTRAINT "rebooking_execution_control_enabled_state_chk"
      CHECK (
        NOT "enabled"
        OR (
          "approvedDeploymentId" IS NOT NULL
          AND "approvedDeploymentId" ~ '^dpl_[A-Za-z0-9]+$'
          AND "approvedCommitSha" IS NOT NULL
          AND "approvedCommitSha" ~ '^[0-9a-f]{40}$'
          AND "generation" > 0
          AND "updatedBy" IS NOT NULL
          AND length(btrim("updatedBy")) > 0
        )
      )
);

INSERT INTO "rebooking_execution_controls" (
    "workerKey",
    "enabled",
    "approvedDeploymentId",
    "approvedCommitSha",
    "generation",
    "updatedAt",
    "updatedBy"
) VALUES (
    'rebooking-reminders',
    false,
    NULL,
    NULL,
    0,
    CURRENT_TIMESTAMP,
    'migration:20261113140000'
)
ON CONFLICT ("workerKey") DO NOTHING;

ALTER TABLE "rebooking_execution_controls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rebooking_execution_controls" FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "rebooking_execution_controls" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE "rebooking_execution_controls" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE "rebooking_execution_controls" FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'REVOKE ALL ON TABLE "rebooking_execution_controls" FROM service_role';
  END IF;
END $$;

COMMENT ON TABLE "rebooking_execution_controls" IS
  'Singleton rebooking worker authorization. Increment generation on every authorization and every revocation. The inserted row is disabled and names no deployment.';
