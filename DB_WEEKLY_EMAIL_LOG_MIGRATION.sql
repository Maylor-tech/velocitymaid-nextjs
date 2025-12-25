-- Phase 22F: Scheduled Weekly Summary + Idempotency
-- Migration to add WeeklyEmailLog table

-- Create WeeklyEmailLog table
CREATE TABLE IF NOT EXISTS "WeeklyEmailLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobKey" TEXT NOT NULL UNIQUE,
  "dateFrom" TIMESTAMP NOT NULL,
  "dateTo" TIMESTAMP NOT NULL,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "skippedNoEmailCount" INTEGER NOT NULL DEFAULT 0,
  "skippedNoPayoutsCount" INTEGER NOT NULL DEFAULT 0,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "WeeklyEmailLog_jobKey_idx" ON "WeeklyEmailLog"("jobKey");
CREATE INDEX IF NOT EXISTS "WeeklyEmailLog_createdAt_idx" ON "WeeklyEmailLog"("createdAt");















