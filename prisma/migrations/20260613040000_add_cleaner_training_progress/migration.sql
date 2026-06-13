-- CreateTable
CREATE TABLE "CleanerTrainingProgress" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizScore" INTEGER,

    CONSTRAINT "CleanerTrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerTrainingProgress_cleanerId_moduleSlug_key" ON "CleanerTrainingProgress"("cleanerId", "moduleSlug");

-- CreateIndex
CREATE INDEX "CleanerTrainingProgress_cleanerId_idx" ON "CleanerTrainingProgress"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerTrainingProgress_moduleSlug_idx" ON "CleanerTrainingProgress"("moduleSlug");

-- AddForeignKey
ALTER TABLE "CleanerTrainingProgress" ADD CONSTRAINT "CleanerTrainingProgress_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
