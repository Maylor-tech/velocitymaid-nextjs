-- LeadStatus: add pipeline stages for Customer
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'INTAKE_RECEIVED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'WALKTHROUGH_SCHEDULED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'QUOTE_SENT';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'FOLLOW_UP';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'WON';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'ACTIVE_CLIENT';

-- PipelineLead: new columns + customer link
ALTER TABLE "pipeline_leads" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "pipeline_leads" ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP(3);
ALTER TABLE "pipeline_leads" ADD COLUMN IF NOT EXISTS "followUpEnteredAt" TIMESTAMP(3);
ALTER TABLE "pipeline_leads" ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "pipeline_leads_customerId_key" ON "pipeline_leads"("customerId");
CREATE INDEX IF NOT EXISTS "pipeline_leads_customerId_idx" ON "pipeline_leads"("customerId");
CREATE INDEX IF NOT EXISTS "pipeline_leads_followUpDate_idx" ON "pipeline_leads"("followUpDate");

DO $$ BEGIN
  ALTER TABLE "pipeline_leads" ADD CONSTRAINT "pipeline_leads_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Replace PipelineLeadStage enum with 7-stage pipeline
ALTER TYPE "PipelineLeadStage" RENAME TO "PipelineLeadStage_old";

CREATE TYPE "PipelineLeadStage" AS ENUM (
  'NEW_LEAD',
  'INTAKE_RECEIVED',
  'WALKTHROUGH_SCHEDULED',
  'QUOTE_SENT',
  'FOLLOW_UP',
  'WON',
  'ACTIVE_CLIENT'
);

ALTER TABLE "pipeline_leads"
  ALTER COLUMN "stage" DROP DEFAULT;

ALTER TABLE "pipeline_leads"
  ALTER COLUMN "stage" TYPE "PipelineLeadStage"
  USING (
    CASE "stage"::text
      WHEN 'CONTACTED' THEN 'NEW_LEAD'
      WHEN 'LOST' THEN 'NEW_LEAD'
      WHEN 'DISCOVERY_CALL' THEN 'WALKTHROUGH_SCHEDULED'
      ELSE "stage"::text
    END
  )::"PipelineLeadStage";

ALTER TABLE "pipeline_leads" ALTER COLUMN "stage" SET DEFAULT 'NEW_LEAD';

DROP TYPE "PipelineLeadStage_old";
