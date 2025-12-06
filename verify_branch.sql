-- Verify the branch was created successfully
SELECT 
  id, 
  name, 
  slug, 
  state, 
  city, 
  timezone,
  status,
  "primaryPhone",
  "whatsappNumber"
FROM "Branch" 
WHERE slug IN ('new-jersey-branch', 'nj', 'new-jersey')
ORDER BY "createdAt" DESC;

