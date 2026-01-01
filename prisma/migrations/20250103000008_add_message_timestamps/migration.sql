-- AlterTable: Add timestamp fields to ContactMessage
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

