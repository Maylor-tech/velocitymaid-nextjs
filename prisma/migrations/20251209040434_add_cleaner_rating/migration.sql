-- CreateTable
CREATE TABLE "CleanerRating" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "customerId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerRating_jobId_key" ON "CleanerRating"("jobId");

-- CreateIndex
CREATE INDEX "CleanerRating_cleanerId_idx" ON "CleanerRating"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerRating_customerId_idx" ON "CleanerRating"("customerId");

-- CreateIndex
CREATE INDEX "CleanerRating_rating_idx" ON "CleanerRating"("rating");

-- CreateIndex
CREATE INDEX "CleanerRating_createdAt_idx" ON "CleanerRating"("createdAt");

-- AddForeignKey
ALTER TABLE "CleanerRating" ADD CONSTRAINT "CleanerRating_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerRating" ADD CONSTRAINT "CleanerRating_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerRating" ADD CONSTRAINT "CleanerRating_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
