-- CreateTable
CREATE TABLE "BranchMetrics" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "jobsToday" INTEGER NOT NULL DEFAULT 0,
    "jobsThisWeek" INTEGER NOT NULL DEFAULT 0,
    "revenueThisWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unassignedJobs" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerRunLog" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "WorkerRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchMetrics_branchId_key" ON "BranchMetrics"("branchId");

-- CreateIndex
CREATE INDEX "BranchMetrics_branchId_idx" ON "BranchMetrics"("branchId");

-- CreateIndex
CREATE INDEX "WorkerRunLog_branchId_idx" ON "WorkerRunLog"("branchId");

-- CreateIndex
CREATE INDEX "WorkerRunLog_jobType_idx" ON "WorkerRunLog"("jobType");

-- CreateIndex
CREATE INDEX "WorkerRunLog_status_idx" ON "WorkerRunLog"("status");

-- CreateIndex
CREATE INDEX "WorkerRunLog_startedAt_idx" ON "WorkerRunLog"("startedAt");

-- AddForeignKey
ALTER TABLE "BranchMetrics" ADD CONSTRAINT "BranchMetrics_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerRunLog" ADD CONSTRAINT "WorkerRunLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
