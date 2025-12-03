-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "preferSameCleaner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "jobQualityScore" INTEGER;

-- CreateTable
CREATE TABLE "CleanerAvailability" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "workingDays" JSONB NOT NULL,
    "timeRanges" JSONB NOT NULL,
    "maxDailyJobs" INTEGER NOT NULL DEFAULT 3,
    "blackoutDates" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerAvailability_cleanerId_key" ON "CleanerAvailability"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerAvailability_cleanerId_idx" ON "CleanerAvailability"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerAvailability_isActive_idx" ON "CleanerAvailability"("isActive");

-- CreateIndex
CREATE INDEX "Job_jobQualityScore_idx" ON "Job"("jobQualityScore");

-- AddForeignKey
ALTER TABLE "CleanerAvailability" ADD CONSTRAINT "CleanerAvailability_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
