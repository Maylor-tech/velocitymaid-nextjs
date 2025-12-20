# Phase K: Branch Owner Controls — Quick Start

**Status:** Foundation Complete — Ready for Full Implementation  
**Time Estimate:** 2-3 hours for remaining components

---

## ✅ What's Already Built

1. **Schema Updated** — `BRANCH_OWNER` role added to `UserRole` enum
2. **Permissions System** — `lib/permissions/branchOwner.ts` with sacred table
3. **Authentication** — `lib/auth/branchOwnerAuth.ts` with branch verification
4. **Dashboard API** — `/api/branch-owner/dashboard` (counts only, no financials)
5. **Dashboard Page** — `/branch-owner/dashboard` with operational metrics
6. **Escalation System** — API and page for escalating issues

---

## 🚧 What Still Needs Building

### 1. Cleaner Oversight Page (30 min)

**File:** `app/branch-owner/cleaners/page.tsx`

**Features:**
- List cleaners assigned to branch
- View profiles (read-only)
- See verification status
- See job history
- See ratings/flags
- Request suspension button
- Request reassignment button

**API:** `app/api/branch-owner/cleaners/route.ts`

**Restrictions:**
- ❌ No payment method editing
- ❌ No payout amounts
- ❌ No financial data

---

### 2. Job Management Page (45 min)

**File:** `app/branch-owner/jobs/page.tsx`

**Features:**
- List jobs in branch
- Filter by status
- Assign jobs to cleaners
- Reassign jobs
- Cancel jobs (with reason)
- Flag jobs for admin review

**API:** `app/api/branch-owner/jobs/route.ts`

**Restrictions:**
- ❌ Cannot change pricing
- ❌ Cannot mark jobs "paid"
- ❌ Cannot override completion rules

**All actions logged.**

---

### 3. Performance Flags Page (30 min)

**File:** `app/branch-owner/performance/page.tsx`

**Features:**
- High cancellation rate indicator
- Repeated cleaner issues
- Slow response times
- Internal only (not public)

**API:** `app/api/branch-owner/performance/route.ts`

---

## 🔧 Next Steps

### Step 1: Run Migration

```bash
npx prisma migrate dev --name add_branch_owner_role
npx prisma generate
```

### Step 2: Create Branch Owner User

Use admin panel or create via script:

```typescript
await prisma.user.create({
  data: {
    email: "branchowner@example.com",
    name: "Branch Owner",
    role: "BRANCH_OWNER",
    primaryBranchId: "your-branch-id",
    isActive: true,
  },
});
```

### Step 3: Test Dashboard

1. Login as branch owner
2. Navigate to `/branch-owner/dashboard`
3. Verify metrics show (counts only)
4. Verify NO financial data visible

### Step 4: Build Remaining Pages

Follow the patterns in:
- Dashboard page (for structure)
- Escalation page (for forms)
- Cleaner portal (for read-only views)

---

## 🔒 Permissions Enforcement

**Critical:** All API endpoints must check permissions:

```typescript
// Example: Job assignment endpoint
import { requireRole } from "@/lib/auth/requireRole";
import { hasBranchOwnerPermission } from "@/lib/permissions/branchOwner";

export async function POST(request: NextRequest) {
  await requireRole(request, "BRANCH_OWNER");
  
  // Check specific permission
  if (!hasBranchOwnerPermission("canAssignJobs")) {
    return NextResponse.json(
      { success: false, error: "Permission denied" },
      { status: 403 }
    );
  }
  
  // ... rest of logic
}
```

---

## 📝 Testing Checklist

- [ ] Branch owner can view dashboard
- [ ] Dashboard shows counts only (no financials)
- [ ] Branch owner can view cleaners (read-only)
- [ ] Branch owner CANNOT see payout amounts
- [ ] Branch owner can assign jobs
- [ ] Branch owner CANNOT change pricing
- [ ] Branch owner can escalate issues
- [ ] Escalations notify admin
- [ ] All actions are logged
- [ ] Cross-branch data is hidden

---

## 🎯 Success Criteria

Phase K is complete when:

1. ✅ Branch owner role exists and works
2. ✅ Dashboard shows operational metrics only
3. ✅ Financial data is completely hidden
4. ✅ Job management works (with restrictions)
5. ✅ Cleaner oversight works (read-only)
6. ✅ Escalation system works
7. ✅ All permissions enforced
8. ✅ All actions logged

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Foundation Complete — Ready for Full Build




