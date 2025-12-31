-- CreateEnum
CREATE TYPE "ComplianceIssueType" AS ENUM ('CUSTOMER_COMPLAINT', 'NO_SHOW', 'PROPERTY_DAMAGE', 'FRAUD_SUSPECTED', 'PAYMENT_DISPUTE', 'POLICY_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceIssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ComplianceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "ComplianceIssue" (
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

-- CreateIndex
CREATE INDEX "ComplianceIssue_cleanerId_status_idx" ON "ComplianceIssue"("cleanerId", "status");

-- CreateIndex
CREATE INDEX "ComplianceIssue_jobId_idx" ON "ComplianceIssue"("jobId");

-- AddForeignKey
ALTER TABLE "ComplianceIssue" ADD CONSTRAINT "ComplianceIssue_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceIssue" ADD CONSTRAINT "ComplianceIssue_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

