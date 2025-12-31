-- CreateEnum
CREATE TYPE "InvestorAccessStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "InvestorAccessRequest" ADD COLUMN "status" "InvestorAccessStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "InvestorAccessRequest" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "InvestorAccessRequest" ADD COLUMN "approvedBy" TEXT;


