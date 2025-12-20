# Phase K: Branch Owner Controls — Implementation Guide

**Status:** Ready for Implementation  
**Scope:** Authority with Guardrails  
**Estimated Time:** 4-6 hours

---

## 🎯 Goal

Give branch owners operational power to manage their territory effectively, while maintaining strict financial and system boundaries.

**Core Principle:** "Authority with guardrails"

---

## 📋 Implementation Plan

### K1. Branch Owner Role Definition

**Add BRANCH_OWNER to UserRole enum**

**File:** `prisma/schema.prisma`

```prisma
enum UserRole {
  ADMIN
  MANAGER
  BRANCH_OWNER  // NEW
  CLEANER
  SUPPORT
}
```

**Migration:** Create migration to add new role

---

### K2. Permissions System

**File:** `lib/permissions/branchOwner.ts`

**Purpose:** Define what branch owners CAN and CANNOT do

**Key Restrictions:**
- ❌ Cannot view payout amounts
- ❌ Cannot trigger payouts
- ❌ Cannot change pricing
- ❌ Cannot override verification
- ✅ Can assign jobs
- ✅ Can manage cleaners (non-financial)
- ✅ Can escalate issues

---

### K3. Branch Owner Dashboard

**File:** `app/branch-owner/dashboard/page.tsx`

**Metrics to Show:**
- Jobs today / this week (counts only)
- Active cleaners (count)
- Jobs needing attention (count)
- Customer issues (count only)

**What NOT to Show:**
- Payout amounts
- Revenue numbers
- Financial totals
- Platform-wide data

---

### K4. Cleaner Oversight

**File:** `app/branch-owner/cleaners/page.tsx`

**Branch Owner CAN:**
- View cleaner profiles (read-only)
- See verification status
- See job history
- See ratings/flags
- Request cleaner suspension
- Request cleaner reassignment

**Branch Owner CANNOT:**
- Edit payment methods
- See payout amounts
- Approve payouts

---

### K5. Job Management

**File:** `app/branch-owner/jobs/page.tsx`

**Branch Owner CAN:**
- Assign jobs to cleaners
- Reassign jobs
- Cancel jobs (with reason)
- Flag jobs for admin review

**Branch Owner CANNOT:**
- Change job pricing
- Mark jobs "paid"
- Override completion rules

**All actions logged.**

---

### K6. Issue Escalation System

**File:** `app/branch-owner/escalate/page.tsx`  
**API:** `app/api/branch-owner/escalate/route.ts`

**Features:**
- Escalate button on job disputes
- Escalate button on cleaner issues
- Escalate button on customer complaints
- Reason selection dropdown
- Optional notes field
- Admin notification

---

### K7. Performance Flags (Internal Only)

**File:** `app/branch-owner/performance/page.tsx`

**Signals:**
- High cancellation rate
- Repeated cleaner issues
- Slow response times

**Display:**
- Internal only (not public)
- Data-informed conversations
- No automatic penalties

---

## 🔒 Permissions Matrix (Sacred)

| Action | Branch Owner |
|--------|--------------|
| Assign jobs | ✅ |
| Manage cleaners (non-financial) | ✅ |
| View payouts | ❌ |
| Trigger payouts | ❌ |
| Change pricing | ❌ |
| Override verification | ❌ |
| Escalate issues | ✅ |
| View branch metrics (counts only) | ✅ |
| View financial totals | ❌ |

**This table is sacred. Do not blur these lines later.**

---

## 🏗️ Technical Implementation

### Step 1: Update Schema

1. Add `BRANCH_OWNER` to `UserRole` enum
2. Run migration: `npx prisma migrate dev --name add_branch_owner_role`
3. Generate Prisma client: `npx prisma generate`

### Step 2: Create Permissions System

**File:** `lib/permissions/branchOwner.ts`

```typescript
export const BRANCH_OWNER_PERMISSIONS = {
  // Allowed
  canAssignJobs: true,
  canManageCleaners: true,
  canEscalateIssues: true,
  canViewBranchMetrics: true,
  
  // Blocked
  canViewPayouts: false,
  canTriggerPayouts: false,
  canChangePricing: false,
  canOverrideVerification: false,
  canViewFinancialTotals: false,
} as const;
```

### Step 3: Create Branch Owner Auth

**File:** `lib/auth/branchOwnerAuth.ts`

```typescript
export async function requireBranchOwner(
  request: NextRequest,
  branchId?: string
): Promise<AuthContext> {
  // Check user is BRANCH_OWNER
  // Verify branch assignment
  // Return auth context
}
```

### Step 4: Build Dashboard API

**File:** `app/api/branch-owner/dashboard/route.ts`

**Returns:**
- Job counts (today, this week)
- Active cleaner count
- Jobs needing attention count
- Customer issues count
- NO financial data

### Step 5: Build UI Components

1. Dashboard page
2. Cleaners list (read-only)
3. Jobs management
4. Escalation form
5. Performance flags (internal)

---

## 📝 Files to Create

### New Files

1. `lib/permissions/branchOwner.ts` - Permissions definitions
2. `lib/auth/branchOwnerAuth.ts` - Branch owner authentication
3. `app/branch-owner/dashboard/page.tsx` - Main dashboard
4. `app/branch-owner/cleaners/page.tsx` - Cleaner oversight
5. `app/branch-owner/jobs/page.tsx` - Job management
6. `app/branch-owner/escalate/page.tsx` - Escalation form
7. `app/branch-owner/performance/page.tsx` - Performance flags
8. `app/api/branch-owner/dashboard/route.ts` - Dashboard API
9. `app/api/branch-owner/cleaners/route.ts` - Cleaners API
10. `app/api/branch-owner/jobs/route.ts` - Jobs API
11. `app/api/branch-owner/escalate/route.ts` - Escalation API
12. `app/api/branch-owner/performance/route.ts` - Performance API

### Modified Files

1. `prisma/schema.prisma` - Add BRANCH_OWNER role
2. `lib/auth/requireRole.ts` - Add branch owner support
3. `utils/userData.ts` - Add BRANCH_OWNER to type

---

## 🧪 Testing Checklist

- [ ] Branch owner can view dashboard
- [ ] Dashboard shows counts only (no financials)
- [ ] Branch owner can assign jobs
- [ ] Branch owner can view cleaners (read-only)
- [ ] Branch owner CANNOT see payout amounts
- [ ] Branch owner CANNOT trigger payouts
- [ ] Branch owner CANNOT change pricing
- [ ] Branch owner can escalate issues
- [ ] Escalations notify admin
- [ ] All actions are logged
- [ ] Cross-branch data is hidden

---

## 🚀 Deployment Checklist

- [ ] Schema migration applied
- [ ] Permissions enforced in all APIs
- [ ] Financial data hidden from branch owners
- [ ] Escalation system working
- [ ] Audit logging enabled
- [ ] Performance flags visible (internal only)

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Ready for Implementation




