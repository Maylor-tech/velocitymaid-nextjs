# Quick Fix: Apply Migration Manually

The migration file exists but may not have been applied to the database. Here's how to apply it:

## Option 1: Use Prisma DB Push (Recommended)

Run this command in your terminal:

```powershell
npx prisma db push
```

This will sync your Prisma schema directly to the database, adding the `pricingReferenceId` column.

## Option 2: Apply SQL Directly

If you have access to your Supabase database, run this SQL:

```sql
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "pricingReferenceId" TEXT;
CREATE INDEX IF NOT EXISTS "Job_pricingReferenceId_idx" ON "Job"("pricingReferenceId");
```

Then run:
```powershell
npx prisma generate
```

## Option 3: Use Prisma Migrate Deploy

```powershell
npx prisma migrate deploy
```

Then:
```powershell
npx prisma generate
```

---

After applying, restart your dev server and test the booking again.

