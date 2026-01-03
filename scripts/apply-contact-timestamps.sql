-- Apply missing timestamp columns to ContactMessage table
-- This fixes the P2022 error: "The column 'ContactMessage.reviewedAt' does not exist"

-- Add timestamp columns if they don't exist
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ContactMessage'
AND column_name IN ('reviewedAt', 'repliedAt', 'archivedAt')
ORDER BY column_name;

