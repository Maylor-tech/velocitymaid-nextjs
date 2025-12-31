-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'REVIEWED', 'REPLIED');

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW';

