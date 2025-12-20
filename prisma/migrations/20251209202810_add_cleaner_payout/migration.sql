-- CreateTable
CREATE TABLE "CleanerPayout" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "totalJobs" INTEGER NOT NULL,
    "grossRevenue" DOUBLE PRECISION NOT NULL,
    "cleanerEarnings" DOUBLE PRECISION NOT NULL,
    "bonuses" DOUBLE PRECISION NOT NULL,
    "penalties" DOUBLE PRECISION NOT NULL,
    "branchProfit" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CleanerPayout_branchId_idx" ON "CleanerPayout"("branchId");

-- CreateIndex
CREATE INDEX "CleanerPayout_cleanerId_idx" ON "CleanerPayout"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerPayout_fromDate_toDate_idx" ON "CleanerPayout"("fromDate", "toDate");

-- CreateIndex
CREATE INDEX "CleanerPayout_status_idx" ON "CleanerPayout"("status");

-- CreateIndex
CREATE INDEX "CleanerPayout_createdAt_idx" ON "CleanerPayout"("createdAt");

-- AddForeignKey
ALTER TABLE "CleanerPayout" ADD CONSTRAINT "CleanerPayout_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerPayout" ADD CONSTRAINT "CleanerPayout_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
