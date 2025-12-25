# Database Connection Fix Guide

## Problem
Prisma migrations are failing with `P1001: Can't reach database server` error.

## Root Cause
Prisma requires `DIRECT_URL` for migrations, but it's not set in your `.env.local` file.

## Solution

### Step 1: Get Your Supabase Connection Strings

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to: **Settings** → **Database**
3. Find **Connection string** section
4. You'll see two connection strings:

#### For `DATABASE_URL` (Pooled - for app queries):
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### For `DIRECT_URL` (Direct - for migrations):
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Step 2: Update `.env.local`

Add both connection strings to your `.env.local` file:

```env
# Pooled connection (for app queries)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=10"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
```

**Important Notes:**
- Replace `[PROJECT_REF]` with your actual Supabase project reference
- Replace `[PASSWORD]` with your database password
- Replace `[REGION]` with your region (e.g., `us-east-1`)
- `DIRECT_URL` must use port `5432` (direct connection)
- `DATABASE_URL` can use port `6543` (pooled connection) or `5432` (direct)

### Step 3: Verify Connection

Test the connection:

```bash
# Test direct connection (for migrations)
npx prisma db pull

# Or test with migrate status
npx prisma migrate status
```

### Step 4: Apply Migrations

Once connected, apply pending migrations:

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

## Alternative: Use `db push` (Development Only)

If migrations still fail, you can use `db push` to sync schema directly (bypasses migrations):

```bash
npx prisma db push
```

**Warning:** `db push` is for development only. Don't use in production.

## Troubleshooting

### Error: "P1000: Authentication failed"
- Check your database password is correct
- Make sure password doesn't contain special characters that need URL encoding
- Try resetting your database password in Supabase dashboard

### Error: "P1001: Can't reach database server"
- Check if Supabase project is paused (unpause it)
- Verify firewall isn't blocking port 5432
- Try using the connection string from Supabase dashboard directly
- Check if your IP is allowed (Supabase → Settings → Database → Connection Pooling)

### Error: "Shadow database" issues
- Prisma creates a shadow database for validation
- If shadow database fails, you can skip it: `npx prisma migrate dev --skip-seed`
- Or use `db push` instead

## Quick Fix (If You Have DATABASE_URL)

If you only have `DATABASE_URL` and it's a direct connection (port 5432), you can set:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
```

Both can be the same if using direct connection.
















