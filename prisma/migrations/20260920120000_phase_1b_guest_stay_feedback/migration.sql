-- Phase 1B: guest stay identity + multi-source ServiceFeedback (HOST | GUEST)

-- CreateEnum
CREATE TYPE "ServiceFeedbackSource" AS ENUM ('HOST', 'GUEST');

-- AlterTable: Property opaque guest access
ALTER TABLE "properties" ADD COLUMN "guestAccessToken" TEXT;
ALTER TABLE "properties" ADD COLUMN "guestAccessTokenCreatedAt" TIMESTAMP(3);
ALTER TABLE "properties" ADD COLUMN "guestAccessRevokedAt" TIMESTAMP(3);
ALTER TABLE "properties" ADD COLUMN "guestDisplayName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "properties_guestAccessToken_key" ON "properties"("guestAccessToken");

-- AlterTable: ServiceFeedback source (existing rows become HOST)
ALTER TABLE "service_feedback" ADD COLUMN "source" "ServiceFeedbackSource" NOT NULL DEFAULT 'HOST';

-- Explicit backfill (idempotent with default; preserves ratings/status/timestamps/tokens)
UPDATE "service_feedback" SET "source" = 'HOST' WHERE "source" IS DISTINCT FROM 'HOST';

-- DropIndex
DROP INDEX IF EXISTS "service_feedback_jobId_key";

-- CreateIndex
CREATE UNIQUE INDEX "service_feedback_jobId_source_key" ON "service_feedback"("jobId", "source");

-- CreateIndex
CREATE INDEX "service_feedback_source_idx" ON "service_feedback"("source");
