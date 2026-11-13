-- One rebooking reminder delivery per job.
-- Historical REBOOKING_REMINDER_SENT rows are recorded as ACCEPTED so the
-- new cron does not send them again. Those backfill rows are not claims:
-- leave claimedAt and firstProviderAttemptAt null.

CREATE TABLE "rebooking_reminder_deliveries" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "sendError" TEXT,
    "claimedAt" TIMESTAMP(3),
    "firstProviderAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rebooking_reminder_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rebooking_reminder_deliveries_jobId_key"
ON "rebooking_reminder_deliveries"("jobId");

CREATE INDEX "rebooking_reminder_deliveries_status_claimedAt_idx"
ON "rebooking_reminder_deliveries"("status", "claimedAt");

CREATE INDEX "rebooking_reminder_deliveries_status_firstProviderAttemptAt_idx"
ON "rebooking_reminder_deliveries"("status", "firstProviderAttemptAt");

ALTER TABLE "rebooking_reminder_deliveries"
ADD CONSTRAINT "rebooking_reminder_deliveries_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "rebooking_reminder_deliveries" (
    "id",
    "jobId",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'rbkbackfill_' || "entityId",
    "entityId",
    'ACCEPTED',
    MIN("createdAt"),
    MIN("createdAt")
FROM "AuditLog"
WHERE "action" = 'REBOOKING_REMINDER_SENT'
  AND "entityType" = 'Job'
  AND EXISTS (
    SELECT 1 FROM "Job" WHERE "Job"."id" = "AuditLog"."entityId"
  )
GROUP BY "entityId"
ON CONFLICT ("jobId") DO NOTHING;

-- Server-only delivery ledger. No public/anon/authenticated policies.
ALTER TABLE "rebooking_reminder_deliveries" ENABLE ROW LEVEL SECURITY;
