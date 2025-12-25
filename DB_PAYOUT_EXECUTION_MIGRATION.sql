-- Phase 22A: Admin Payout Execution & Settlement
-- Migration to add execution fields to JobPayout table

-- Add execution fields (safe IF NOT EXISTS for idempotency)
ALTER TABLE "JobPayout"
ADD COLUMN IF NOT EXISTS "executedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "executionMethod" TEXT,
ADD COLUMN IF NOT EXISTS "externalReferenceId" TEXT,
ADD COLUMN IF NOT EXISTS "executionNote" TEXT;

-- Add constraints for data validation
-- Note: These are added as CHECK constraints if your database supports them
-- For PostgreSQL, you can add length constraints via application logic or triggers

-- Add index on executionMethod for filtering
CREATE INDEX IF NOT EXISTS "JobPayout_executionMethod_idx" ON "JobPayout"("executionMethod");

-- Add index on executedAt for date-based queries
CREATE INDEX IF NOT EXISTS "JobPayout_executedAt_idx" ON "JobPayout"("executedAt");

-- Ensure paymentMethodId and paymentMethodSnapshot exist (from Phase 21)
ALTER TABLE "JobPayout"
ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMethodSnapshot" JSONB;

-- Add index on paymentMethodId if not exists
CREATE INDEX IF NOT EXISTS "JobPayout_paymentMethodId_idx" ON "JobPayout"("paymentMethodId");
















