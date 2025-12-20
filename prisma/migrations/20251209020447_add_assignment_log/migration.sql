-- CreateTable
CREATE TABLE "AssignmentLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT,
    "branchId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentLog_jobId_idx" ON "AssignmentLog"("jobId");

-- CreateIndex
CREATE INDEX "AssignmentLog_branchId_idx" ON "AssignmentLog"("branchId");

-- CreateIndex
CREATE INDEX "AssignmentLog_createdAt_idx" ON "AssignmentLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AssignmentLog" ADD CONSTRAINT "AssignmentLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentLog" ADD CONSTRAINT "AssignmentLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
