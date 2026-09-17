-- Additive Tip liability / Zelle ledger fields (Phase 7C).
-- Does NOT mutate existing tip row values. Historical rows remain readable.

-- New optional attribution / payment / settlement columns
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "jobId" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "beneficiaryCleanerId" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "internalReference" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "providerReference" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "stripeEventId" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3);
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "confirmedByAdminId" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "paidOutAt" TIMESTAMP(3);
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "payoutReference" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "paidOutByAdminId" TEXT;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "paidOutMethod" TEXT;

-- Unique constraints (nullable columns allow multiple NULLs in Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS "tips_internalReference_key" ON "tips"("internalReference");
CREATE UNIQUE INDEX IF NOT EXISTS "tips_stripeEventId_key" ON "tips"("stripeEventId");

CREATE INDEX IF NOT EXISTS "tips_jobId_idx" ON "tips"("jobId");
CREATE INDEX IF NOT EXISTS "tips_beneficiaryCleanerId_idx" ON "tips"("beneficiaryCleanerId");
CREATE INDEX IF NOT EXISTS "tips_status_idx" ON "tips"("status");
CREATE INDEX IF NOT EXISTS "tips_paymentMethod_idx" ON "tips"("paymentMethod");
CREATE INDEX IF NOT EXISTS "tips_propertyId_idx" ON "tips"("propertyId");

-- Foreign keys (nullable; historical tips remain without FKs filled)
DO $$ BEGIN
  ALTER TABLE "tips" ADD CONSTRAINT "tips_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tips" ADD CONSTRAINT "tips_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tips" ADD CONSTRAINT "tips_beneficiaryCleanerId_fkey"
    FOREIGN KEY ("beneficiaryCleanerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tips" ADD CONSTRAINT "tips_confirmedByAdminId_fkey"
    FOREIGN KEY ("confirmedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tips" ADD CONSTRAINT "tips_paidOutByAdminId_fkey"
    FOREIGN KEY ("paidOutByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
