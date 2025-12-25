-- Check current schema of CleanerPaymentMethod table
-- Run this first to see what columns exist

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'CleanerPaymentMethod'
ORDER BY ordinal_position;

-- If verifiedAt, verifiedBy, and verificationNote are missing, run this:

ALTER TABLE "CleanerPaymentMethod" 
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "verificationNote" TEXT;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'CleanerPaymentMethod'
ORDER BY ordinal_position;











