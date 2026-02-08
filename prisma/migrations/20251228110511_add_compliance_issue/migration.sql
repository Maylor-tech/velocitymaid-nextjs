-- CreateEnum (idempotent: skip if already exists)
DO $$ BEGIN
  CREATE TYPE "ComplianceIssueType" AS ENUM ('CUSTOMER_COMPLAINT', 'NO_SHOW', 'PROPERTY_DAMAGE', 'FRAUD_SUSPECTED', 'PAYMENT_DISPUTE', 'POLICY_VIOLATION', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ComplianceIssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ComplianceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable (idempotent: skip if already exists from 20250101000000_add_compliance_issue)
CREATE TABLE IF NOT EXISTS "ComplianceIssue" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "jobId" TEXT,
    "type" "ComplianceIssueType" NOT NULL,
    "status" "ComplianceIssueStatus" NOT NULL,
    "severity" "ComplianceSeverity" NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ComplianceIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "ComplianceIssue_cleanerId_status_idx" ON "ComplianceIssue"("cleanerId", "status");
CREATE INDEX IF NOT EXISTS "ComplianceIssue_jobId_idx" ON "ComplianceIssue"("jobId");

-- AddForeignKey (idempotent: skip if constraint already exists)
DO $$ BEGIN
  ALTER TABLE "ComplianceIssue" ADD CONSTRAINT "ComplianceIssue_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "ComplianceIssue" ADD CONSTRAINT "ComplianceIssue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

