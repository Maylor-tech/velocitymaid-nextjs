-- AlterEnum: add ON_THE_WAY to JobStatus
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'ON_THE_WAY';

-- CreateTable
CREATE TABLE "JobPayout" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "cleanerAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'READY',
    "rulesVersion" TEXT,
    "policyVersionId" TEXT,
    "policyEvalDetails" JSONB,
    "paymentMethodSnapshot" JSONB,
    "executionMethod" TEXT,
    "externalReferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "JobPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPayout_jobId_key" ON "JobPayout"("jobId");

-- CreateIndex
CREATE INDEX "JobPayout_cleanerId_idx" ON "JobPayout"("cleanerId");

-- CreateIndex
CREATE INDEX "JobPayout_branchId_idx" ON "JobPayout"("branchId");

-- CreateIndex
CREATE INDEX "JobPayout_status_idx" ON "JobPayout"("status");

-- CreateIndex
CREATE INDEX "JobPayout_createdAt_idx" ON "JobPayout"("createdAt");

-- AddForeignKey
ALTER TABLE "JobPayout" ADD CONSTRAINT "JobPayout_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPayout" ADD CONSTRAINT "JobPayout_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPayout" ADD CONSTRAINT "JobPayout_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
