-- AlterTable
ALTER TABLE "BranchServicePackage" ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "pricingData" JSONB;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "paymentMethod" TEXT;
