-- Fixed SQL: Promote User to Branch Owner
-- Make sure to use quotes around string values!

UPDATE "User"
SET
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = '932dd27c-8ebb-4891-a4fa-ff3566285f10'  -- UUID must be in quotes
WHERE email = 'admin@test.com';  -- Email must be in quotes

-- Verify it worked
SELECT id, email, role, "isActive", "primaryBranchId"
FROM "User" 
WHERE role = 'BRANCH_OWNER';

-- Get the ID to use in test auth page
SELECT id, email
FROM "User" 
WHERE email = 'admin@test.com';












