-- CORRECT SQL INSERT for Branch table
-- Column names MUST be in double quotes because they are camelCase
-- Based on actual migration file: prisma/migrations/20251201064527_init/migration.sql

INSERT INTO "Branch" (
  "id", 
  "name", 
  "slug", 
  "country", 
  "state", 
  "city", 
  "timezone",
  "primaryPhone",
  "whatsappNumber",
  "status"
) VALUES 
  (
    gen_random_uuid(), 
    'New Jersey', 
    'new-jersey-branch', 
    'US', 
    'NJ', 
    'East Orange', 
    'America/New_York',
    '+19735551234',  -- UPDATE THIS with your actual phone number
    '+19735551234',  -- UPDATE THIS with your actual WhatsApp number
    'ACTIVE'
  ),
  (
    gen_random_uuid(), 
    'New Jersey', 
    'nj', 
    'US', 
    'NJ', 
    'East Orange', 
    'America/New_York',
    '+19735551234',  -- UPDATE THIS with your actual phone number
    '+19735551234',  -- UPDATE THIS with your actual WhatsApp number
    'ACTIVE'
  )
ON CONFLICT ("slug") DO NOTHING;

