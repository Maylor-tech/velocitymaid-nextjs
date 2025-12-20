-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "loginCode" TEXT,
ADD COLUMN     "loginCodeExpiresAt" TIMESTAMP(3);
