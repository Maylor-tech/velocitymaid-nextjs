-- Phase M: Miami Pilot Setup Script
-- 
-- This script sets up the Miami branch for the pilot program.
-- Run this after creating the branch in the admin UI or via Prisma.
--
-- Usage:
-- 1. Create Miami branch via admin UI or Prisma Studio
-- 2. Get the branch ID
-- 3. Update the branch_id variable below
-- 4. Run this script

-- ============================================
-- STEP 1: Create Miami Branch (if not exists)
-- ============================================
-- Note: Run this via Prisma Studio or admin UI first
-- Or uncomment and run:

/*
INSERT INTO "Branch" (
  id,
  name,
  slug,
  country,
  state,
  city,
  timezone,
  "primaryPhone",
  "whatsappNumber",
  status,
  currency,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Miami',
  'miami',
  'US',
  'FL',
  'Miami',
  'America/New_York',
  '+1-305-XXX-XXXX',
  '+1-305-XXX-XXXX',
  'ACTIVE',
  'USD',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;
*/

-- ============================================
-- STEP 2: Set Branch ID Variable
-- ============================================
-- Replace 'YOUR_BRANCH_ID' with the actual Miami branch ID
DO $$
DECLARE
  branch_id TEXT := 'YOUR_BRANCH_ID'; -- UPDATE THIS
  miami_branch_id TEXT;
BEGIN
  -- Find Miami branch if ID not provided
  IF branch_id = 'YOUR_BRANCH_ID' THEN
    SELECT id INTO miami_branch_id
    FROM "Branch"
    WHERE slug = 'miami'
    LIMIT 1;
    
    IF miami_branch_id IS NULL THEN
      RAISE EXCEPTION 'Miami branch not found. Please create it first.';
    END IF;
    
    branch_id := miami_branch_id;
  END IF;

  -- ============================================
  -- STEP 3: Add Miami-Dade Core ZIP Codes
  -- ============================================
  -- Add ZIP codes to BranchServiceArea
  INSERT INTO "BranchServiceArea" (
    id,
    "branchId",
    "zipCode",
    priority,
    city,
    state,
    "createdAt",
    "updatedAt"
  ) VALUES
    (gen_random_uuid(), branch_id, '33101', 1, 'Miami', 'FL', NOW(), NOW()), -- Downtown Miami
    (gen_random_uuid(), branch_id, '33125', 1, 'Miami', 'FL', NOW(), NOW()), -- Little Havana
    (gen_random_uuid(), branch_id, '33126', 1, 'Miami', 'FL', NOW(), NOW()), -- West Flagler
    (gen_random_uuid(), branch_id, '33127', 1, 'Miami', 'FL', NOW(), NOW()), -- Allapattah
    (gen_random_uuid(), branch_id, '33130', 1, 'Miami', 'FL', NOW(), NOW()), -- Brickell
    (gen_random_uuid(), branch_id, '33131', 1, 'Miami', 'FL', NOW(), NOW()), -- Coconut Grove
    (gen_random_uuid(), branch_id, '33132', 1, 'Miami', 'FL', NOW(), NOW()), -- Coral Gables
    (gen_random_uuid(), branch_id, '33133', 1, 'Miami', 'FL', NOW(), NOW()), -- Coral Gables
    (gen_random_uuid(), branch_id, '33134', 1, 'Miami', 'FL', NOW(), NOW()), -- Coral Gables
    (gen_random_uuid(), branch_id, '33135', 1, 'Miami', 'FL', NOW(), NOW()), -- West Miami
    (gen_random_uuid(), branch_id, '33136', 1, 'Miami', 'FL', NOW(), NOW()), -- Coral Gables
    (gen_random_uuid(), branch_id, '33137', 1, 'Miami', 'FL', NOW(), NOW()), -- North Miami
    (gen_random_uuid(), branch_id, '33138', 1, 'Miami', 'FL', NOW(), NOW()), -- North Miami Beach
    (gen_random_uuid(), branch_id, '33139', 1, 'Miami', 'FL', NOW(), NOW()), -- Miami Beach
    (gen_random_uuid(), branch_id, '33140', 1, 'Miami', 'FL', NOW(), NOW())  -- Miami Beach
  ON CONFLICT ("branchId", "zipCode") DO NOTHING;

  RAISE NOTICE 'Miami pilot ZIP codes added for branch: %', branch_id;

  -- ============================================
  -- STEP 4: Create Branch Config (if needed)
  -- ============================================
  INSERT INTO "BranchConfig" (
    id,
    "branchId",
    "maxDailyJobs",
    "createdAt",
    "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    branch_id,
    20, -- Max 20 jobs per day for pilot
    NOW(),
    NOW()
  ) ON CONFLICT ("branchId") DO UPDATE
  SET "maxDailyJobs" = 20,
      "updatedAt" = NOW();

  RAISE NOTICE 'Branch config created/updated for Miami pilot';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check Miami branch exists
SELECT id, name, slug, status, city, state
FROM "Branch"
WHERE slug = 'miami';

-- Check ZIP codes added
SELECT "zipCode", city, state, priority
FROM "BranchServiceArea"
WHERE "branchId" = (SELECT id FROM "Branch" WHERE slug = 'miami')
ORDER BY priority, "zipCode";

-- Check branch config
SELECT "maxDailyJobs", "createdAt"
FROM "BranchConfig"
WHERE "branchId" = (SELECT id FROM "Branch" WHERE slug = 'miami');











