# SQL Syntax Fix

**Error:** `trailing junk after numeric literal`

**Cause:** UUID and email values need to be in quotes!

---

## ❌ Wrong (What You Had)

```sql
UPDATE "User"
SET
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = 932dd27c-8ebb-4891-a4fa-ff3566285f10  -- ❌ No quotes!
WHERE email = admin@test.com;  -- ❌ No quotes!
```

---

## ✅ Correct (Fixed)

```sql
UPDATE "User"
SET
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = '932dd27c-8ebb-4891-a4fa-ff3566285f10'  -- ✅ Quotes!
WHERE email = 'admin@test.com';  -- ✅ Quotes!
```

---

## 📋 Complete Fixed Query

```sql
-- Step 1: Promote user
UPDATE "User"
SET
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = '932dd27c-8ebb-4891-a4fa-ff3566285f10'
WHERE email = 'admin@test.com';

-- Step 2: Get the ID
SELECT id, email
FROM "User" 
WHERE email = 'admin@test.com';
```

**Copy the `id` value from the result!**

---

## 🎯 Quick Rule

**In SQL, ALL string values need quotes:**
- ✅ `'text'` 
- ✅ `'932dd27c-8ebb-4891-a4fa-ff3566285f10'`
- ✅ `'admin@test.com'`
- ❌ `932dd27c-8ebb-4891-a4fa-ff3566285f10` (no quotes = error!)

---

**File saved:** `scripts/fix_promote_user.sql`



