-- Extend cleaner application talent portal fields and status workflow
ALTER TYPE "CleanerApplicationStatus" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "CleanerApplicationStatus" ADD VALUE IF NOT EXISTS 'REVIEWING';
ALTER TYPE "CleanerApplicationStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "CleanerApplicationStatus" ADD VALUE IF NOT EXISTS 'TRAINING_INVITED';

ALTER TABLE "CleanerApplication" ADD COLUMN IF NOT EXISTS "preferredName" TEXT;
ALTER TABLE "CleanerApplication" ADD COLUMN IF NOT EXISTS "applicationData" JSONB;
