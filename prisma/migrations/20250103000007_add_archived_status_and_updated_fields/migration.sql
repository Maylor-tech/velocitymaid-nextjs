-- AlterEnum: Add ARCHIVED to ContactMessageStatus
ALTER TYPE "ContactMessageStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- AlterTable: Add updatedAt to ContactMessage
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Make repliedByAdminId nullable in ContactReply
ALTER TABLE "ContactReply" ALTER COLUMN "repliedByAdminId" DROP NOT NULL;

-- AlterTable: Add sentViaEmail to ContactReply
ALTER TABLE "ContactReply" ADD COLUMN IF NOT EXISTS "sentViaEmail" BOOLEAN NOT NULL DEFAULT true;

