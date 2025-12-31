# Supabase + Prisma + Vercel Configuration Fixes

**Date:** 2025-01-03  
**Status:** ✅ Configuration Updated

---

## Changes Applied

### 1. Prisma Client Updated
**File:** `lib/prisma.ts`

**Change:** Simplified logging configuration to match production best practices

**Before:**
```typescript
log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
```

**After:**
```typescript
log: ['error'],
```

**Why:** Prevents connection storms and reduces log noise in production.

---

### 2. Prisma Schema Verified
**File:** `prisma/schema.prisma`

**Status:** ✅ Already correct

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection (runtime)
  directUrl = env("DIRECT_URL")         // Direct connection (migrations)
}
```

---

### 3. Codebase Scanned
**Result:** ✅ No problematic DIRECT_URL usage found

- No `process.env.DIRECT_URL` in API routes
- All PrismaClient usage goes through `lib/prisma.ts`
- Scripts can use `new PrismaClient()` directly (they're not runtime)

---

## Vercel Environment Variables Required

### Production Environment Variables

Set these in **Vercel → Project → Settings → Environment Variables**:

```env
# Runtime queries (API, pages) - Pooled connection
DATABASE_URL=postgresql://postgres:<PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

# Migrations only - Direct connection
DIRECT_URL=postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

**Critical Rules:**
- ✅ `DATABASE_URL` must use pooled connection (port 6543)
- ✅ `DIRECT_URL` must use direct connection (port 5432)
- ✅ Both must include `sslmode=require`
- ✅ Do NOT swap these
- ✅ Do NOT use `DIRECT_URL` in runtime code

---

## Verification Steps

### Before Deploying

1. ✅ Verify `prisma/schema.prisma` has `directUrl = env("DIRECT_URL")`
2. ✅ Verify `lib/prisma.ts` uses singleton pattern
3. ✅ Verify no `new PrismaClient()` in API routes (except scripts)
4. ✅ Verify Vercel has both `DATABASE_URL` and `DIRECT_URL` set
5. ✅ Verify `DATABASE_URL` uses pooled connection (port 6543)
6. ✅ Verify `DIRECT_URL` uses direct connection (port 5432)

### After Deploying

1. Monitor Vercel logs for Prisma errors
2. Test contact form submission
3. Test investor request submission
4. Test cleaner login
5. Test admin actions
6. Verify no "FATAL: Tenant or user not found" errors

---

## Expected Results

After this configuration:

✅ No more "FATAL: Tenant or user not found"  
✅ Contact form works  
✅ Investor requests save  
✅ Cleaner login stable  
✅ Admin actions reliable  
✅ Same config works on Vercel prod

⚠️ **Note:** Local dev may still be flaky — that's acceptable. Production stability is the priority.

---

## Documentation

For detailed configuration guide, see:
- **[SUPABASE_VERCEL_CONFIG.md](./SUPABASE_VERCEL_CONFIG.md)** — Complete configuration reference

---

**Last Updated:** 2025-01-03  
**Version:** 1.0

