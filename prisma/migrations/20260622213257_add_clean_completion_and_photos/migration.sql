-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "cleanDurationMins" INTEGER,
ADD COLUMN     "completedBy" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "marketLabel" TEXT,
ADD COLUMN     "notifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "clean_photos" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clean_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clean_photos_jobId_idx" ON "clean_photos"("jobId");

-- AddForeignKey
ALTER TABLE "clean_photos" ADD CONSTRAINT "clean_photos_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
