# Quick Fix: Database Connection Issue

## ✅ Migration Applied Successfully!

The `CleanerPaymentMethod` table has been created. Now you just need to mark the migration as applied in Prisma.

## Final Step: Mark Migration as Applied

Since the table was created manually via SQL, tell Prisma that the migration is already applied:

```bash
npx prisma migrate resolve --applied 20251214012101_add_cleaner_payment_method
```

If that still fails due to connection issues, you can skip it for now. The table exists and your API will work.

## Verify Table Exists

Run this in Supabase SQL Editor to verify:

```sql
SELECT * FROM "CleanerPaymentMethod" LIMIT 1;
```

If it returns (even if empty), the table exists and is ready to use.

## Regenerate Prisma Client

After marking the migration as applied, regenerate the Prisma client:

```bash
npx prisma generate
```

## Test the API

Once Prisma client is regenerated, your API routes are ready:

- `GET /api/cleaner/payment-method` - Get current payment method
- `POST /api/cleaner/payment-method` - Create/update payment method

## Original Problem (For Reference)

### Root Cause
Prisma cannot connect to Supabase database: `P1001: Can't reach database server`

### Solutions

#### 1. Check Supabase Project Status
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Check if project shows "Paused" or "Inactive"
4. If paused, click "Resume" or "Unpause"

**Free tier projects auto-pause after 7 days of inactivity.**

#### 2. Verify Connection String Format

Your `.env.local` should have:

```env
# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
```

**Get the correct connection string:**
1. Supabase Dashboard → Your Project
2. Settings → Database
3. Connection string section
4. Copy "Direct connection" (port 5432)

#### 3. Try Connection Pooling Instead

Sometimes direct connections fail, but pooled connections work:

```env
# Use pooled connection for both
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

#### 4. Check IP Restrictions

1. Supabase Dashboard → Settings → Database
2. Check "Connection Pooling" → "Allowed IP addresses"
3. Make sure your IP is allowed (or set to "Allow all")

#### 5. Reset Database Password

If password might be wrong:

1. Supabase Dashboard → Settings → Database
2. Click "Reset database password"
3. Copy new password
4. Update `.env.local` with new password
