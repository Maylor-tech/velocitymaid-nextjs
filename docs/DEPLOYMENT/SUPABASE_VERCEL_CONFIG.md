# Supabase + Prisma + Vercel Configuration

**Purpose:** Authoritative configuration guide to prevent "FATAL: Tenant or user not found" errors  
**Status:** Production-ready configuration

---

## Root Cause

Supabase has two database access modes, and Prisma must use both correctly:

| Use Case | Correct Connection |
|----------|-------------------|
| Runtime queries (API, pages) | Connection pooler (port 6543) |
| Migrations / introspection | Direct DB (port 5432) |

**Problem:** Prisma runtime queries sometimes hit the direct DB → Supabase rejects them → "tenant not found"

---

## ✅ The Correct Production Setup

### 1️⃣ Supabase → Get the RIGHT URLs

In **Supabase Dashboard → Settings → Database → Connection string**

You need **two URLs**:

#### A. Pooled (Runtime)
```
postgresql://postgres:<PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

#### B. Direct (Migrations only)
```
postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

**Key Differences:**
- Pooled: `pooler.supabase.com:6543` + `pgbouncer=true`
- Direct: `db.<project-ref>.supabase.co:5432` (no pgBouncer)

---

### 2️⃣ Vercel Environment Variables (CRITICAL)

In **Vercel → Project → Settings → Environment Variables**

Set **both**:

```env
# Runtime queries (API, pages)
DATABASE_URL=postgresql://postgres:<PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

# Migrations only
DIRECT_URL=postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

⚠️ **Critical Rules:**
- ✅ Do NOT swap these
- ✅ Do NOT omit `sslmode=require`
- ✅ Do NOT use `DIRECT_URL` in runtime code
- ✅ `DATABASE_URL` = pooled (runtime)
- ✅ `DIRECT_URL` = direct (migrations only)

---

### 3️⃣ Prisma Schema (Verify This Exists)

**File:** `prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection (runtime)
  directUrl = env("DIRECT_URL")        // Direct connection (migrations)
}
```

✅ **If `directUrl` is missing → add it**

---

### 4️⃣ Prisma Client Instantiation (Very Important)

**File:** `lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Why this matters:**
- Prevents connection storms on Vercel
- Reuses single client instance
- Proper cleanup in development

---

### 5️⃣ Remove Any Direct DB Usage Elsewhere ❌

**Search your codebase for:**
- `new PrismaClient()` (outside shared file)
- Hardcoded connection strings
- `process.env.DIRECT_URL` usage in API routes

**There should be ONE Prisma client only** (from `lib/prisma.ts`)

**Exception:** Scripts can use `new PrismaClient()` directly (they're not runtime)

---

### 6️⃣ Local Development (.env.local)

**File:** `.env.local`

```env
# Pooled connection (runtime)
DATABASE_URL=postgresql://postgres:<PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

# Direct connection (migrations)
DIRECT_URL=postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

⚠️ **Note:** Local dev may still be flaky — that's acceptable. Production stability is the priority.

---

## Verification Checklist

### Before Deploying

- [ ] `prisma/schema.prisma` has `directUrl = env("DIRECT_URL")`
- [ ] `lib/prisma.ts` uses singleton pattern
- [ ] No `new PrismaClient()` in API routes
- [ ] Vercel has both `DATABASE_URL` and `DIRECT_URL` set
- [ ] `DATABASE_URL` uses pooled connection (port 6543)
- [ ] `DIRECT_URL` uses direct connection (port 5432)

### After Deploying

- [ ] Check Vercel logs for Prisma errors
- [ ] Test contact form submission
- [ ] Test investor request submission
- [ ] Test cleaner login
- [ ] Test admin actions
- [ ] Verify no "FATAL: Tenant or user not found" errors

---

## Troubleshooting

### Error: "FATAL: Tenant or user not found"

**Cause:** Prisma is using direct connection for runtime queries

**Fix:**
1. Verify `DATABASE_URL` uses pooled connection (port 6543)
2. Verify `DIRECT_URL` is set but NOT used in runtime code
3. Verify `lib/prisma.ts` uses singleton pattern
4. Redeploy on Vercel

### Error: "Can't reach database server"

**Cause:** Connection string format incorrect or Supabase paused

**Fix:**
1. Check Supabase project is active (not paused)
2. Verify connection string format matches exactly
3. Ensure `sslmode=require` is present
4. Check firewall/IP restrictions

### Error: "Connection pool timeout"

**Cause:** Too many connections or pool exhausted

**Fix:**
1. Verify using pooled connection (port 6543)
2. Check Prisma client singleton pattern
3. Review connection pool settings in Supabase

---

## Migration Commands

**Local:**
```bash
npx prisma migrate dev
```

**Production (Vercel):**
```bash
npx prisma migrate deploy
```

**Note:** Migrations automatically use `DIRECT_URL` (Prisma handles this)

---

## What "Fixed" Looks Like

After this configuration:

✅ No more "FATAL: Tenant or user not found"  
✅ Contact form works  
✅ Investor requests save  
✅ Cleaner login stable  
✅ Admin actions reliable  
✅ Same config works on Vercel prod

⚠️ Local dev may still be flaky — that's acceptable

---

## Quick Reference

| Variable | Purpose | Port | Used By |
|----------|---------|------|---------|
| `DATABASE_URL` | Runtime queries | 6543 | Prisma Client (API routes) |
| `DIRECT_URL` | Migrations | 5432 | Prisma Migrate |

---

**Last Updated:** 2025-01-03  
**Version:** 1.0

