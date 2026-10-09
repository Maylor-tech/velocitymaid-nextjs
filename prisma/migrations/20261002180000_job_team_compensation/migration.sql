-- Assistant compensation ledger. Independent of JobPayout and customer payment.
-- Does not mutate existing Job / JobPayout / Invoice rows.

CREATE TABLE "JobTeamCompensation" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'OWED',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentRef" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTeamCompensation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobTeamCompensation_jobId_cleanerId_key" ON "JobTeamCompensation"("jobId", "cleanerId");
CREATE INDEX "JobTeamCompensation_jobId_idx" ON "JobTeamCompensation"("jobId");
CREATE INDEX "JobTeamCompensation_cleanerId_idx" ON "JobTeamCompensation"("cleanerId");
CREATE INDEX "JobTeamCompensation_branchId_idx" ON "JobTeamCompensation"("branchId");
CREATE INDEX "JobTeamCompensation_status_idx" ON "JobTeamCompensation"("status");

ALTER TABLE "JobTeamCompensation" ADD CONSTRAINT "JobTeamCompensation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobTeamCompensation" ADD CONSTRAINT "JobTeamCompensation_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobTeamCompensation" ADD CONSTRAINT "JobTeamCompensation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
