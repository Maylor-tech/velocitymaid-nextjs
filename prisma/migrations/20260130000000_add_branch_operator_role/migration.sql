-- Add BRANCH_OPERATOR to UserRole enum (scoped by region via primaryBranchId/UserBranch)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'BRANCH_OPERATOR'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'BRANCH_OPERATOR';
    END IF;
END $$;
