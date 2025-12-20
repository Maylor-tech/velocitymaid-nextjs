-- AlterTable: Add policy columns to TransactionLedger
ALTER TABLE "TransactionLedger" 
ADD COLUMN IF NOT EXISTS "policyVersionId" TEXT,
ADD COLUMN IF NOT EXISTS "policyEvalHash" TEXT,
ADD COLUMN IF NOT EXISTS "policyEvalDetails" JSONB;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TransactionLedger_policyVersionId_idx" ON "TransactionLedger"("policyVersionId");

-- AddForeignKey (only if PayoutPolicyVersion table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PayoutPolicyVersion') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'TransactionLedger_policyVersionId_fkey'
    ) THEN
      ALTER TABLE "TransactionLedger" 
      ADD CONSTRAINT "TransactionLedger_policyVersionId_fkey" 
      FOREIGN KEY ("policyVersionId") 
      REFERENCES "PayoutPolicyVersion"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;







