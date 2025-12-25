# Phase L: Pricing & Revenue Locks — Implementation Guide

**Status:** Ready for Implementation  
**Scope:** Protect Provision — Lock Every Revenue Path  
**Estimated Time:** 6-8 hours

---

## 🎯 Goal

Lock the system so every job preserves margin, dignity, and predictability.

**Core Principle:** "Price once. Enforce everywhere. Sleep better."

---

## 📋 Implementation Plan

### L1. Single Source of Truth (Non-Negotiable)

**Create Authoritative Pricing Tables:**

1. **ServiceType** - Standard service definitions
2. **ServicePricing** - Base pricing per service type
3. **RegionPricingModifier** - Geographic pricing adjustments

**Rule:** Jobs reference pricing by ID, never copy values.

---

### L2. Role-Based Pricing Permissions (Hard Locks)

| Role | View Prices | Edit Prices | Apply Discounts |
|------|-------------|-------------|-----------------|
| Admin | ✅ | ✅ | ✅ (logged) |
| Branch Owner | ✅ (read-only) | ❌ | ❌ |
| Cleaner | ❌ (never sees totals) | ❌ | ❌ |
| Customer | ✅ (quoted only) | ❌ | ❌ |

**🔒 No exceptions. Every attempt is blocked server-side.**

---

### L3. Immutable Job Pricing Snapshot

When a job is confirmed:
- Store pricing snapshot (service price, modifiers, fees, tax)
- Mark `priceLockedAt = timestamp`
- After lock: ❌ No edits (even admin) without void + rebook
- ✅ Audit trail preserved

---

### L4. Discount & Promo Guardrails

**Discounts:**
- Admin-only
- Require: reason code, percentage cap (e.g., max 10%), expiration
- Auto-block: Branch Owners cannot apply or suggest discounts in UI
- API rejects any discount payload from non-admin roles

---

### L5. Cleaner Payout Independence (Critical)

Cleaner payout is derived, not editable:
- % of locked job price OR fixed per service
- Calculated server-side
- Stored separately from customer price

**Result:** Pricing mistakes don't cascade, no disputes.

---

### L6. Cancellation & Refund Rules (Predictable Cash)

**Cancellation windows:**
- < 24h: fee applies
- No-show: fee applies
- Admin can override with reason

**Refund logic:**
- References pricing snapshot
- Partial refunds are formula-based
- All refunds logged
- No ad-hoc refunds. Ever.

---

### L7. UI Safeguards (Quiet but Firm)

**Branch Owner UI:**
- Prices visible as labels, not inputs
- "Pricing managed by admin" note

**Admin UI:**
- Confirmation modal before save
- Shows impact preview ("affects future jobs only")

---

### L8. Enforcement at the API (Most Important)

Every write path checks:
```typescript
assertRole(user, 'ADMIN')
assertPriceUnlocked(job)
```

If violated:
- Reject request
- Log attempt
- Return neutral error message

**Never trust the client.**

---

### L9. Audit & Alerts (Early Warning)

Track:
- Price change events
- Discount usage frequency
- Margin anomalies by service/region

Alert admin if:
- Discounts spike
- Margin drops below threshold
- Overrides repeat

---

## 🏗️ Technical Implementation

### Step 1: Update Prisma Schema

Add pricing snapshot and lock fields to Job model:

```prisma
model Job {
  // ... existing fields ...
  
  // Pricing Lock
  priceLockedAt        DateTime?
  pricingSnapshot      Json?      // Full pricing breakdown at lock time
  pricingReferenceId   String?    // Reference to ServicePricing ID
  
  // Pricing Components (snapshot)
  basePrice            Decimal?   @db.Decimal(10, 2)
  modifiers            Decimal?   @db.Decimal(10, 2)
  fees                 Decimal?   @db.Decimal(10, 2)
  tax                  Decimal?   @db.Decimal(10, 2)
  
  // Discount (admin-only)
  discountAmount       Decimal?   @db.Decimal(10, 2)
  discountReason      String?
  discountApprovedBy   String?    // Admin ID who approved
  
  // ... rest of fields ...
}
```

### Step 2: Create Pricing Tables

```prisma
model ServiceType {
  id          String   @id
  code        String   @unique  // "STANDARD", "DEEP", "MOVE_OUT"
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime
  
  ServicePricing ServicePricing[]
  
  @@index([code])
  @@index([isActive])
}

model ServicePricing {
  id              String      @id
  serviceTypeId   String
  branchId        String?
  basePrice       Decimal     @db.Decimal(10, 2)
  hourlyRate      Decimal?    @db.Decimal(10, 2)
  currency        String      @default("USD")
  effectiveFrom   DateTime    @default(now())
  effectiveTo     DateTime?
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime
  
  ServiceType     ServiceType @relation(fields: [serviceTypeId], references: [id])
  Branch          Branch?     @relation(fields: [branchId], references: [id])
  Job             Job[]
  
  @@index([serviceTypeId])
  @@index([branchId])
  @@index([isActive])
  @@index([effectiveFrom, effectiveTo])
}

model RegionPricingModifier {
  id              String   @id
  branchId        String
  regionType      String   // "CITY", "ZIP", "STATE"
  regionValue     String   // City name, ZIP code, or state code
  modifierPercent Decimal  @db.Decimal(5, 2)  // e.g., 10.00 = +10%
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime
  
  Branch          Branch   @relation(fields: [branchId], references: [id])
  
  @@unique([branchId, regionType, regionValue])
  @@index([branchId])
  @@index([isActive])
}
```

### Step 3: Create Permissions System

**File:** `lib/permissions/pricing.ts`

```typescript
export const PRICING_PERMISSIONS = {
  ADMIN: {
    canViewPrices: true,
    canEditPrices: true,
    canApplyDiscounts: true,
    canViewPricingHistory: true,
    canOverridePriceLock: true, // With void + rebook
  },
  BRANCH_OWNER: {
    canViewPrices: true,
    canEditPrices: false,
    canApplyDiscounts: false,
    canViewPricingHistory: false,
    canOverridePriceLock: false,
  },
  CLEANER: {
    canViewPrices: false, // Never sees totals
    canEditPrices: false,
    canApplyDiscounts: false,
    canViewPricingHistory: false,
    canOverridePriceLock: false,
  },
  CUSTOMER: {
    canViewPrices: true, // Quoted only
    canEditPrices: false,
    canApplyDiscounts: false,
    canViewPricingHistory: false,
    canOverridePriceLock: false,
  },
} as const;
```

### Step 4: Create Pricing Lock Functions

**File:** `lib/pricing/lock.ts`

```typescript
export async function lockJobPricing(jobId: string, adminId: string) {
  // Store snapshot, set priceLockedAt
}

export function isPriceLocked(job: Job): boolean {
  return !!job.priceLockedAt;
}

export function assertPriceUnlocked(job: Job) {
  if (isPriceLocked(job)) {
    throw new Error("Job pricing is locked. Void and rebook to change.");
  }
}
```

### Step 5: API Enforcement Middleware

**File:** `lib/middleware/pricingGuard.ts`

```typescript
export async function requirePricingPermission(
  request: NextRequest,
  permission: 'view' | 'edit' | 'discount'
) {
  const auth = await requireRole(request, ['ADMIN', 'BRANCH_OWNER']);
  const role = auth.role;
  
  if (!PRICING_PERMISSIONS[role][`can${permission}Prices`]) {
    throw new Error("Permission denied");
  }
}
```

---

## 📝 Files to Create/Modify

### New Files

1. `lib/permissions/pricing.ts` - Pricing permissions
2. `lib/pricing/lock.ts` - Pricing lock functions
3. `lib/pricing/snapshot.ts` - Pricing snapshot management
4. `lib/middleware/pricingGuard.ts` - API enforcement
5. `lib/pricing/discount.ts` - Discount guardrails
6. `lib/pricing/refund.ts` - Refund rules
7. `app/api/admin/pricing/route.ts` - Admin pricing management
8. `app/api/admin/pricing/[id]/lock/route.ts` - Lock pricing endpoint

### Modified Files

1. `prisma/schema.prisma` - Add pricing tables and Job fields
2. `app/api/branch-owner/jobs/route.ts` - Remove pricing edit capability
3. `app/branch-owner/jobs/page.tsx` - Make prices read-only
4. `app/admin/jobs/[id]/page.tsx` - Add pricing lock UI

---

## 🧪 Testing Checklist

- [ ] Admin can view and edit prices
- [ ] Branch Owner can view but not edit prices
- [ ] Cleaner cannot see price totals
- [ ] Customer sees quoted price only
- [ ] Pricing locks when job is confirmed
- [ ] Locked pricing cannot be edited (even by admin)
- [ ] Discounts require admin role
- [ ] Discounts are capped (e.g., max 10%)
- [ ] Refunds reference pricing snapshot
- [ ] All pricing changes are audited
- [ ] API rejects unauthorized pricing changes

---

## 🚀 Deployment Checklist

- [ ] Schema migration applied
- [ ] Pricing tables populated
- [ ] Permissions enforced in all APIs
- [ ] UI inputs locked for non-admins
- [ ] Audit logging enabled
- [ ] Alerts configured for anomalies

---

**Last Updated:** 2025-01-13  
**Status:** Ready for Implementation  
**Estimated Time:** 6-8 hours












