-- Add BRANCH_OWNER to UserRole enum
-- Run this directly in your database (Supabase SQL editor or psql)
-- This bypasses the Prisma migration connection pooling issue

-- Check if BRANCH_OWNER already exists (safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'BRANCH_OWNER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'BRANCH_OWNER';
    END IF;
END $$;

-- Verify it was added
SELECT unnest(enum_range(NULL::"UserRole"))::text AS role
ORDER BY role;













