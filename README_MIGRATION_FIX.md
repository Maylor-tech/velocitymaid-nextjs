# Fix: Contact Form Database Error (P2022)

## Problem
The contact form is failing with error:
```
The column 'ContactMessage.reviewedAt' does not exist in the current database.
```

## Root Cause
Migration `20250103000008_add_message_timestamps` hasn't been applied to production database.

## Solution (Choose One)

### ✅ Option 1: Supabase SQL Editor (Recommended - Fastest)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL:

```sql
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
```

3. Click **Run**
4. Verify success - you should see "Success. No rows returned"
5. Test the contact form at `velocitymaid.com/contact`

### Option 2: Node.js Script

If you have production `DATABASE_URL` set locally:

```bash
# Set production DATABASE_URL (use pooled connection)
export DATABASE_URL="postgresql://postgres.wkqglgdoseptvttrkapa:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Run the script
node scripts/apply-contact-timestamps.js
```

### Option 3: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link
vercel login
vercel link

# Pull production env vars
vercel env pull .env.production

# Apply migrations
npx prisma migrate deploy
```

## Verification

After applying, verify in Supabase SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ContactMessage'
AND column_name IN ('reviewedAt', 'repliedAt', 'archivedAt')
ORDER BY column_name;
```

Should return 3 rows.

## After Fix

✅ Contact form should work  
✅ No more P2022 errors  
✅ Messages can be saved successfully

