-- AlterTable (idempotent: only run if CleanerTaxProfile exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'CleanerTaxProfile'
  ) THEN
    ALTER TABLE "CleanerTaxProfile" ADD COLUMN IF NOT EXISTS "lastReminderSentAt" TIMESTAMP(3);
    ALTER TABLE "CleanerTaxProfile" ADD COLUMN IF NOT EXISTS "reminderCount" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

