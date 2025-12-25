-- Create or update a user to be a Branch Owner
-- Replace the values below with your actual data

-- Option 1: Update existing user
UPDATE "User" 
SET 
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = (SELECT id FROM "Branch" LIMIT 1) -- Replace with actual branch ID
WHERE email = 'your-email@example.com'; -- Replace with actual email

-- Option 2: Create new branch owner user (if needed)
-- INSERT INTO "User" (id, email, role, "isActive", "primaryBranchId", "createdAt", "updatedAt")
-- VALUES (
--     gen_random_uuid()::text,
--     'branchowner@example.com',
--     'BRANCH_OWNER',
--     true,
--     (SELECT id FROM "Branch" WHERE slug = 'your-branch-slug'), -- Replace with actual branch slug
--     NOW(),
--     NOW()
-- );

-- Verify the user was created/updated
SELECT id, email, role, "isActive", "primaryBranchId" 
FROM "User" 
WHERE role = 'BRANCH_OWNER';










