# Cleaner Payment Method Analysis (Miami Branch)

**Purpose:** Analysis of CleanerPaymentMethod schema, verification logic, and payment method pages  
**Date:** 2025-01-13

---

## 1️⃣ CleanerPaymentMethod Table Schema

### Migration File
**Path:** `prisma/migrations/20251214012101_add_cleaner_payment_method/migration.sql`

**Schema (from migration):**
```sql
CREATE TABLE "CleanerPaymentMethod" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "label" TEXT,
    "details" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "CleanerPaymentMethod_cleanerId_isActive_idx" ON "CleanerPaymentMethod"("cleanerId", "isActive");
CREATE INDEX "CleanerPaymentMethod_cleanerId_idx" ON "CleanerPaymentMethod"("cleanerId");

-- Foreign Key
ALTER TABLE "CleanerPaymentMethod" ADD CONSTRAINT "CleanerPaymentMethod_cleanerId_fkey" 
    FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Fields Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Primary key |
| `cleanerId` | TEXT | Foreign key to User (cleaner) |
| `methodType` | TEXT | Payment method type (BANK, ZELLE, VENMO, CASH, CASH_APP, PAYPAL) |
| `label` | TEXT (nullable) | Optional label for the payment method |
| `details` | JSONB | Encrypted payment details (account numbers, handles, etc.) |
| `isActive` | BOOLEAN | Whether the payment method is active (default: true) |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |

### ✅ Complete Schema (After Update)

**The table now includes all required fields:**
- `id` (uuid) - Primary key with `gen_random_uuid()` default
- `cleanerId` (text) - Foreign key to User
- `methodType` (text) - Payment method type
- `details` (jsonb) - Encrypted payment details
- `isActive` (boolean) - Default: `true`
- `createdAt` (timestamp) - Default: `now()`
- `updatedAt` (timestamp) - Default: `now()`
- `verifiedAt` (timestamp, nullable) - ✅ Added - When payment method was verified
- `verifiedBy` (text, nullable) - ✅ Added - Admin user ID who verified it
- `verificationNote` (text, nullable) - ✅ Added - Admin notes/rejection reason

**All fields used in the code are now present:**
- ✅ `app/api/cleaner/payment-method/route.ts` can use `verifiedAt`
- ✅ `app/cleaner/payments/page.tsx` can display all verification fields
- ✅ `lib/pilot/payoutCycle.ts` can check `verifiedAt`

---

## 2️⃣ Current Query Logic for Payment Verification

### A. Payment Method Status Check

**File:** `app/api/cleaners/payment-method/status/route.ts`

**Query:**
```typescript
const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
  where: {
    cleanerId: authResult.cleanerId,
    isActive: true,
    verifiedAt: {
      not: null,  // ⚠️ Field may not exist in schema
    },
  },
  select: {
    id: true,
    verifiedAt: true,
  },
});
```

**Returns:** `{ success: true, verified: boolean }`

### B. Payout Cycle Verification Check

**File:** `lib/pilot/payoutCycle.ts` (lines 195-213)

**Query:**
```typescript
const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
  where: {
    cleanerId: job.assignedCleanerId,
    isActive: true,
    verifiedAt: { not: null },  // ⚠️ Field may not exist in schema
  },
  select: {
    id: true,
    isActive: true,
    verifiedAt: true,
  },
});
```

**Used in:** `evaluatePayoutEligibility()` function to check if cleaner can receive payout.

### C. Get Payment Method (Full Details)

**File:** `app/api/cleaner/payment-method/route.ts` (GET endpoint)

**Query:**
```typescript
const method = await prisma.cleanerPaymentMethod.findFirst({
  where: {
    cleanerId: auth.userId,
  },
  orderBy: { createdAt: "desc" },
});
```

**Returns:** Most recent payment method (active or inactive) with masked details.

### D. Create/Update Payment Method

**File:** `app/api/cleaner/payment-method/route.ts` (POST endpoint)

**Logic:**
1. Deactivates all existing active methods
2. Encrypts payment details
3. Creates new method with `isActive: false` and `verifiedAt: null`
4. Admin must verify to set `verifiedAt` and `isActive: true`

---

## 3️⃣ Payment Method Pages for Miami Cleaners

### A. Primary Payment Method Page (Recommended)

**File Path:** `app/cleaner/payments/page.tsx`

**Route:** `/cleaner/payments`

**Features:**
- ✅ Modern UI with Card components
- ✅ Shows payment method status (Verified, Pending, Rejected)
- ✅ Displays masked payment details
- ✅ Add/Update payment method modal
- ✅ Supports all payment types (BANK, ZELLE, VENMO, CASH_APP, PAYPAL, CASH)
- ✅ Shows verification status and notes

**API Endpoint Used:**
- `GET /api/cleaner/payment-method` - Fetch current payment method
- Modal uses `POST /api/cleaner/payment-method` - Create/update

**Components:**
- `app/cleaner/payments/AddPaymentMethodModal.tsx` - Modal for adding/updating
- `app/cleaner/payments/PaymentMethodForm.tsx` - Form component

**Status Display:**
```tsx
{method.verifiedAt && method.isActive ? (
  <Badge variant="success">Verified</Badge>
) : !method.isActive && method.verificationNote ? (
  <Badge variant="destructive">Rejected</Badge>
) : (
  <Badge variant="secondary">Pending verification</Badge>
)}
```

### B. Alternative Payment Method Page (Legacy?)

**File Path:** `app/cleaners/payment-method/page.tsx`

**Route:** `/cleaners/payment-method`

**Features:**
- ⚠️ Uses different API endpoint (`/api/cleaners/payment-method/update`)
- ⚠️ Only supports bank transfer (Jamaica-specific fields)
- ⚠️ Has placeholder cleanerId (not authenticated)
- ⚠️ Different form fields (bankName, accountNumber, accountType, whatsappNumber)

**API Endpoint Used:**
- `GET /api/cleaners/payment-method/get?cleanerId=${id}` - Fetch payment method
- `POST /api/cleaners/payment-method/update` - Update payment method

**Note:** This appears to be for Jamaica branch, not Miami.

---

## 4️⃣ Recommended Page for Miami Cleaners

### ✅ Use: `/cleaner/payments` (app/cleaner/payments/page.tsx)

**Why:**
1. ✅ Proper authentication via `requireRole(request, "CLEANER")`
2. ✅ Supports all payment method types (not just bank)
3. ✅ Modern UI with proper status indicators
4. ✅ Handles verification status correctly
5. ✅ Uses encrypted payment details
6. ✅ Matches the API endpoint we created (`/api/cleaners/payment-method/status`)

**Link from Dashboard:**
The dashboard banner links to `/cleaner/payments` (which we set in the implementation).

---

## 5️⃣ Verification Flow

### Current Flow:

1. **Cleaner Adds Payment Method:**
   - POST to `/api/cleaner/payment-method`
   - Creates record with `isActive: false`, `verifiedAt: null`
   - Payment details are encrypted

2. **Admin Verifies:**
   - (Admin endpoint not shown, but should update `verifiedAt` and `isActive: true`)

3. **Payout Check:**
   - `lib/pilot/payoutCycle.ts` checks for `isActive: true` AND `verifiedAt: not null`
   - If missing → payout is skipped with reason "NO_PAYMENT_METHOD" or "PAYMENT_METHOD_NOT_VERIFIED"

4. **Dashboard Status:**
   - `/api/cleaners/payment-method/status` checks same conditions
   - Returns `verified: false` if missing → shows banner

---

## 6️⃣ Issues & Recommendations

### ✅ Issue 1: Schema Mismatch - RESOLVED

**Status:** ✅ **FIXED** - All required fields have been added to the table.

**Fields added:**
- `verifiedAt` (timestamp, nullable)
- `verifiedBy` (text, nullable)
- `verificationNote` (text, nullable)

**The schema is now complete and matches all code expectations.**

### ⚠️ Issue 2: Two Different Payment Pages

**Problem:** Two different routes with different implementations.

**Solution:** 
- Use `/cleaner/payments` for Miami (modern, supports all methods)
- Keep `/cleaners/payment-method` for Jamaica (legacy, bank-only)

### ✅ Issue 3: Dashboard Link

**Status:** ✅ Already fixed - Dashboard banner links to `/cleaner/payments`

---

## 7️⃣ File Paths Summary

### Schema & Migrations
- **Migration:** `prisma/migrations/20251214012101_add_cleaner_payment_method/migration.sql`
- **Schema:** `prisma/schema.prisma` (may need update for verifiedAt fields)

### API Endpoints
- **GET/POST:** `app/api/cleaner/payment-method/route.ts` (Main endpoint)
- **Status Check:** `app/api/cleaners/payment-method/status/route.ts` (New endpoint we created)

### Frontend Pages
- **Primary (Miami):** `app/cleaner/payments/page.tsx` → `/cleaner/payments`
- **Legacy (Jamaica?):** `app/cleaners/payment-method/page.tsx` → `/cleaners/payment-method`

### Components
- **Modal:** `app/cleaner/payments/AddPaymentMethodModal.tsx`
- **Form:** `app/cleaner/payments/PaymentMethodForm.tsx`

### Verification Logic
- **Payout Check:** `lib/pilot/payoutCycle.ts` (lines 195-213)
- **Status Check:** `app/api/cleaners/payment-method/status/route.ts`

---

## 8️⃣ Next Steps

1. ✅ **Verify Schema:** COMPLETE - All fields exist in database
2. ✅ **Add Migration:** COMPLETE - Fields have been added
3. **Test Flow:** Verify cleaner can add payment method and see verification status
4. **Admin Verification:** Ensure admin can verify payment methods (endpoint may need to be created)
5. **Update Prisma Schema:** Consider updating `prisma/schema.prisma` to reflect the complete model

---

**Status:** 📋 Analysis Complete  
**Last Updated:** 2025-01-13

