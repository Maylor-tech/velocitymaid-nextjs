-- AlterTable
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "pricingReferenceId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_pricingReferenceId_idx" ON "Job"("pricingReferenceId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Job_pricingReferenceId_fkey'
    ) THEN
        ALTER TABLE "Job" ADD CONSTRAINT "Job_pricingReferenceId_fkey" 
        FOREIGN KEY ("pricingReferenceId") 
        REFERENCES "ServicePricing"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

