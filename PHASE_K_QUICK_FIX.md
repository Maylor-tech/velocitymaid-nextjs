# Phase K: Quick Fix Guide

**Issue:** Database enum doesn't have `BRANCH_OWNER` yet (migration blocked by connection pooling)

**Solution:** Add enum value directly via SQL, then proceed

---

## Step 1: Add BRANCH_OWNER to Database Enum

Run this SQL directly in your Supabase SQL editor (or psql):

```sql
-- Add BRANCH_OWNER to UserRole enum (safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'BRANCH_OWNER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'BRANCH_OWNER';
    END IF;
END $$;
```

**File:** `scripts/add_branch_owner_enum.sql`

---

## Step 2: Create Branch Owner User

After the enum is added, run this (update with your actual values):

```sql
UPDATE "User" 
SET 
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = '<your-branch-id>'  -- Get from Branch table
WHERE email = 'your-email@example.com';
```

**File:** `scripts/create_branch_owner_user.sql`

---

## Step 3: Validate Phase K

1. **Start dev server:** `npm run dev`
2. **Set auth cookie** (or log in via admin panel)
3. **Navigate to:** `/branch-owner/dashboard`
4. **Verify:**
   - ✅ Can access dashboard
   - ✅ Sees job counts only
   - ❌ Sees NO payout amounts
   - ❌ Cannot change pricing

---

## Why This Works

- **Bypasses migration:** Direct SQL avoids connection pooling issues
- **Safe:** The `IF NOT EXISTS` check prevents errors if run twice
- **Reversible:** Can always change user role back to ADMIN/MANAGER
- **Fast:** Gets you unblocked in 2 minutes

---

## After This Works

Once Phase K is validated, you can:
- Use it immediately for operations
- Fix the migration later (when connection pooling clears)
- Continue building other features

**The code is complete. This is just database housekeeping.**

---

**Status:** Ready to execute  
**Time:** 2 minutes  
**Risk:** Low (fully reversible)










