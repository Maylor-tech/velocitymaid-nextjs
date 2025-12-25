# How to Get Branch Owner User ID

**Current Status:** No branch owners exist yet. You need to create one first.

---

## 🚀 Quick Steps (3 minutes)

### Step 1: See Available Users

Run this to see existing users you can promote:

```sql
SELECT id, email, role, "isActive"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Step 2: See Available Branches

Run this to see branch IDs:

```sql
SELECT id, name, slug, city, state
FROM "Branch"
ORDER BY name;
```

### Step 3: Promote a User to Branch Owner

**Option A: Promote an existing user**

```sql
-- Replace 'your-email@example.com' with an actual email from Step 1
-- Replace the branch ID with one from Step 2
UPDATE "User" 
SET 
    role = 'BRANCH_OWNER',
    "isActive" = true,
    "primaryBranchId" = (SELECT id FROM "Branch" LIMIT 1)
WHERE email = 'your-email@example.com';
```

**Option B: Create a new branch owner user**

```sql
INSERT INTO "User" (id, email, role, "isActive", "primaryBranchId", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'branchowner@example.com',  -- Change this
    'BRANCH_OWNER',
    true,
    (SELECT id FROM "Branch" LIMIT 1),  -- Or use specific branch ID
    NOW(),
    NOW()
);
```

### Step 4: Get the User ID

After promoting/creating, run:

```sql
SELECT id, email, role
FROM "User" 
WHERE role = 'BRANCH_OWNER';
```

**Copy the `id` value** - that's what you need!

### Step 5: Use the ID

1. Go to: `http://localhost:3000/branch-owner/test-auth`
2. Paste the `id` value
3. Click "Set Auth Cookie & Go to Dashboard"

---

## 📋 Complete Script

All steps in one file: `scripts/get_or_create_branch_owner.sql`

---

## ⚠️ Important Notes

- **Email must exist:** If promoting, the user must already exist
- **Branch must exist:** The `primaryBranchId` must point to a real branch
- **Enum must exist:** Make sure you ran the enum SQL first (from `scripts/add_branch_owner_enum.sql`)

---

## 🎯 Example

```sql
-- 1. See users
SELECT id, email FROM "User" LIMIT 5;
-- Result: id='abc123', email='admin@example.com'

-- 2. See branches  
SELECT id, name FROM "Branch" LIMIT 1;
-- Result: id='branch-1', name='New Jersey'

-- 3. Promote user
UPDATE "User" 
SET role = 'BRANCH_OWNER', "primaryBranchId" = 'branch-1'
WHERE email = 'admin@example.com';

-- 4. Get the ID
SELECT id FROM "User" WHERE email = 'admin@example.com';
-- Result: id='abc123' ← Use this in test auth page!
```

---

**That's it!** Copy the ID and paste it in the test auth page.











