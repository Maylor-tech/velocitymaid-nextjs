-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "afterHoursMessage" TEXT,
ADD COLUMN     "waitForMorning" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Lead_waitForMorning_idx" ON "Lead"("waitForMorning");
