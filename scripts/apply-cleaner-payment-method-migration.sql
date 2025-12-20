-- Safe migration script for CleanerPaymentMethod
-- This script checks for existing objects before creating them

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS "CleanerPaymentMethod" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "label" TEXT,
    "details" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CleanerPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "CleanerPaymentMethod_cleanerId_isActive_idx" 
    ON "CleanerPaymentMethod"("cleanerId", "isActive");

CREATE INDEX IF NOT EXISTS "CleanerPaymentMethod_cleanerId_idx" 
    ON "CleanerPaymentMethod"("cleanerId");

-- Add foreign key constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'CleanerPaymentMethod_cleanerId_fkey'
        AND table_name = 'CleanerPaymentMethod'
    ) THEN
        ALTER TABLE "CleanerPaymentMethod" 
            ADD CONSTRAINT "CleanerPaymentMethod_cleanerId_fkey" 
            FOREIGN KEY ("cleanerId") REFERENCES "User"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;







