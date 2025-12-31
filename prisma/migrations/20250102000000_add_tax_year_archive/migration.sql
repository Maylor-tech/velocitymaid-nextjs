-- Phase 3H.11: Add TaxYearArchive model
-- CreateTable
CREATE TABLE IF NOT EXISTS "TaxYearArchive" (
    "year" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedBy" TEXT,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "summaryJson" JSONB NOT NULL,

    CONSTRAINT "TaxYearArchive_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaxYearArchive_year_idx" ON "TaxYearArchive"("year");


