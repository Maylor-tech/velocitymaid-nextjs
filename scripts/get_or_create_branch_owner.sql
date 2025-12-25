-- Step 1: First, make sure BRANCH_OWNER enum exists (run this first if you haven't)
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

-- Step 2: Get all existing users to see who you can promote
SELECT id, email, role, "isActive", "primaryBranchId"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Step 3: Get all branches to see available branch IDs
SELECT id, name, slug, city, state
FROM "Branch"
ORDER BY name;

-- Step 4: Promote an existing user to Branch Owner
-- Replace 'your-email@example.com' with an actual user email
-- Replace '<branch-id>' with an actual branch ID from Step 3
UPDATE "User" 
SET 
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = (SELECT id FROM "Branch" LIMIT 1) -- Or use specific branch ID
WHERE email = 'your-email@example.com'; -- CHANGE THIS to your actual email

-- Step 5: Verify the branch owner was created
SELECT id, email, role, "isActive", "primaryBranchId"
FROM "User" 
WHERE role = 'BRANCH_OWNER';

-- Step 6: Copy the 'id' value from the result above
-- That's the ID you need for the test auth page!













