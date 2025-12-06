-- Corrected INSERT statement for Branch table
-- Required fields: name, slug, state, city, timezone, primaryPhone, whatsappNumber

INSERT INTO "Branch" (
  id, 
  name, 
  slug, 
  country, 
  state, 
  city, 
  timezone,
  primaryPhone,
  whatsappNumber,
  status, 
  currency
) VALUES 
  (
    gen_random_uuid(), 
    'New Jersey', 
    'new-jersey-branch', 
    'US', 
    'NJ', 
    'East Orange', 
    'America/New_York',  -- Required: timezone
    '+19735551234',      -- Required: primaryPhone (replace with actual number)
    '+19735551234',      -- Required: whatsappNumber (replace with actual number)
    'ACTIVE', 
    'USD'
  ),
  (
    gen_random_uuid(), 
    'New Jersey', 
    'nj', 
    'US', 
    'NJ', 
    'East Orange', 
    'America/New_York',  -- Required: timezone
    '+19735551234',      -- Required: primaryPhone (replace with actual number)
    '+19735551234',      -- Required: whatsappNumber (replace with actual number)
    'ACTIVE', 
    'USD'
  )
ON CONFLICT (slug) DO NOTHING;

