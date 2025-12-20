# Phase J: Quick Start Implementation

**Goal:** Build cleaner payout readiness dashboard in 2-3 hours

---

## 🎯 What We're Building

1. **API Endpoint:** `/api/cleaner/payout-readiness` - Returns eligibility status
2. **Page:** `/cleaner/earnings` - Shows payout readiness with blockers
3. **Components:** Status card, checklist, blockers list

---

## 📋 Implementation Steps

### Step 1: Create API Endpoint (30 min)

**File:** `app/api/cleaner/payout-readiness/route.ts`

**Key Logic:**
- Get authenticated cleaner ID
- Check payment method status (exists, verified, rejected)
- Count completed jobs
- Count pending payouts
- Build blockers array with human-readable reasons
- Return JSON response

**Use Existing Functions:**
- `requireRole(request, "CLEANER")` - Auth
- `hasVerifiedPaymentMethod(cleanerId)` - Check verification
- `prisma.cleanerPaymentMethod.findFirst()` - Get payment method
- `prisma.job.findMany()` - Get completed jobs
- `prisma.jobPayout.count()` - Count payouts

---

### Step 2: Create Earnings Page (60 min)

**File:** `app/cleaner/earnings/page.tsx`

**Components Needed:**
1. **Status Badge** - Green (Ready) / Yellow (Not Ready)
2. **Blockers List** - Shows why not ready
3. **Eligibility Checklist** - Visual checklist
4. **Pending Payouts** - Count of pending payouts
5. **Link to Payment Method** - If not verified

**UI Elements:**
- Use `Card`, `CardHeader`, `CardContent` from `@/components/ui/card`
- Use `Button` from `@/components/ui/button`
- Use `Badge` from `@/components/ui/badge`
- Use icons: `CheckCircle2`, `XCircle`, `AlertCircle` from `lucide-react`

---

### Step 3: Test & Polish (30 min)

**Test Scenarios:**
1. Cleaner without payment method
2. Cleaner with pending payment method
3. Cleaner with verified payment method
4. Cleaner with rejected payment method
5. Cleaner with completed jobs
6. Cleaner with pending payouts

---

## 🔑 Key Code Snippets

### API Response Structure

```typescript
{
  success: true,
  readiness: {
    eligible: boolean,
    blockers: [
      {
        reason: "No payment method on file",
        action: "Add a payment method to receive payouts",
        link: "/cleaner/payments",
        severity: "error"
      }
    ],
    paymentMethod: {
      exists: boolean,
      verified: boolean,
      status: "none" | "pending" | "verified" | "rejected"
    },
    completedJobs: number,
    pendingPayouts: number
  }
}
```

### Blocker Reasons

1. **No payment method:** `"No payment method on file"` → Link to `/cleaner/payments`
2. **Pending verification:** `"Payment method pending verification"` → Link to `/cleaner/payments`
3. **Rejected:** `"Payment method was rejected"` → Link to `/cleaner/payments`
4. **No jobs:** `"No completed jobs yet"` → No link (informational)

---

## ✅ Completion Checklist

- [ ] API endpoint created and tested
- [ ] Page created and renders
- [ ] Status badge shows correct state
- [ ] Blockers list displays correctly
- [ ] Checklist shows checkmarks/X marks
- [ ] Links work (payment method page)
- [ ] Mobile responsive
- [ ] Demo mode safe
- [ ] No console errors

---

## 🚀 Ready to Code?

1. Start with API endpoint (`app/api/cleaner/payout-readiness/route.ts`)
2. Then create page (`app/cleaner/earnings/page.tsx`)
3. Test each scenario
4. Polish UI/UX

**Full details:** See `PHASE_J_CLEANER_ONBOARDING_IMPLEMENTATION.md`

---

**Time Estimate:** 2-3 hours  
**Difficulty:** Medium  
**Dependencies:** Existing payment method system, cleaner auth




