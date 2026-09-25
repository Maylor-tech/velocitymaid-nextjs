-- P0 NJ relaunch: extend Lead capture for Elaine territory follow-up.
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "addressLine" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "serviceType" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "frequency" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredDate" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "followUpStatus" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "opsAssignee" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_followUpStatus_idx" ON "Lead"("followUpStatus");
CREATE INDEX IF NOT EXISTS "Lead_opsAssignee_idx" ON "Lead"("opsAssignee");
CREATE INDEX IF NOT EXISTS "Lead_city_idx" ON "Lead"("city");
CREATE INDEX IF NOT EXISTS "Lead_serviceType_idx" ON "Lead"("serviceType");
