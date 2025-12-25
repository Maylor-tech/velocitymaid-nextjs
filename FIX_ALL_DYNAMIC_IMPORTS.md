# 🔧 Fix All Dynamic Imports with @/ Aliases

**Issue:** Vercel build fails with `Module not found: Can't resolve '@/lib/...'`  
**Solution:** Replace dynamic imports using `@/` aliases with relative paths

---

## ✅ Already Fixed

1. **`lib/auth/requireRole.ts`** ✅
   - Changed from: `await import("@/lib/auth/branchOwnerAuth")`
   - Changed to: Static import `import { getAuthenticatedBranchOwner } from "./branchOwnerAuth"`

2. **`lib/pilot/customerExperience.ts`** ✅
   - Changed from: `await import("@/lib/pricing/refund")`
   - Changed to: `await import("../pricing/refund")`

3. **`app/api/cleaners/scorecard/route.ts`** ✅
   - Changed from: `await import('@/lib/prisma')`
   - Changed to: `await import('../../../../lib/prisma')`

---

## 🔴 Remaining Files to Fix

These files still have dynamic imports with `@/` aliases that may cause build issues:

### High Priority (Likely to cause build errors):

1. **`app/api/cleaners/jobs/route.ts`** (line 291)
   ```typescript
   const { sendReviewRequest } = await import('@/lib/sendReviewRequest');
   ```
   **Fix:** `await import('../../../../lib/sendReviewRequest')`

2. **`app/api/cleaner/jobs/[jobId]/complete/route.ts`** (line 197)
   ```typescript
   const { verifyJobCompletion, checkJobCompletionIssues } = await import("@/lib/pilot/dayOfJob");
   ```
   **Fix:** `await import('../../../../../lib/pilot/dayOfJob')`

3. **`app/api/pilot/validate-territory/route.ts`** (line 81)
   ```typescript
   const { getAllowedZipCodes, getServiceHours } = await import("@/lib/pilot/territory");
   ```
   **Fix:** `await import('../../../../lib/pilot/territory')`

4. **`app/api/cleaner/payment-method/route.ts`** (lines 28, 94)
   ```typescript
   const { maskPaymentDetails } = await import("@/lib/paymentMasking");
   const { PAYMENT_METHODS } = await import("@/lib/paymentMethods");
   ```
   **Fix:** 
   - `await import('../../../../lib/paymentMasking')`
   - `await import('../../../../lib/paymentMethods')`

### Medium Priority (May cause issues):

5. **`lib/cleanerAuth.ts`** (line 61)
   ```typescript
   const { findCleanerById } = await import("@/utils/cleanerData");
   ```
   **Fix:** `await import("../utils/cleanerData")`

6. **`app/api/admin/branches/[branchId]/assign-cleaner/route.ts`** (line 184)
   ```typescript
   const { getUserBranches, findUserById, getUsersByRole } = await import('@/utils/userData');
   ```
   **Fix:** `await import('../../../../../../utils/userData')`

7. **`app/api/training/lesson/[lessonId]/submit-quiz/route.ts`** (line 178)
   ```typescript
   const { createCertificate } = await import('@/utils/certificateGenerator');
   ```
   **Fix:** `await import('../../../../../../utils/certificateGenerator')`

8. **`app/api/admin/training/[cleanerId]/override/route.ts`** (line 68)
   ```typescript
   const { createCertificate } = await import('@/utils/certificateGenerator');
   ```
   **Fix:** `await import('../../../../../../utils/certificateGenerator')`

### Lower Priority (Less likely to cause build errors):

9. **`app/api/dev/seed/route.ts`** (line 27)
   ```typescript
   const { seedDemoData } = await import('@/scripts/seed-demo-data');
   ```

10. **`app/api/admin/payouts/jamaica/create/route.ts`** (line 47)
    ```typescript
    const paymentMethod = await import('@/app/services/payouts/jamaicaPayoutService')
    ```

11. **`utils/cleanerScorecardQueries.ts`** (line 369)
    ```typescript
    const { calculateReviewStats } = await import('@/utils/reviewData');
    ```

---

## 📝 How to Calculate Relative Paths

For a file at: `app/api/cleaners/jobs/route.ts`
- Target: `lib/sendReviewRequest.ts`
- Go up: `../../../../` (4 levels: jobs → cleaners → api → app → root)
- Path: `../../../../lib/sendReviewRequest`

For a file at: `lib/pilot/customerExperience.ts`
- Target: `lib/pricing/refund.ts`
- Go up: `../` (1 level: pilot → lib)
- Path: `../pricing/refund`

---

## 🚀 Quick Fix Script

You can use find/replace in your editor:

**Find:** `await import\("@/lib/`
**Replace with:** `await import("../../../../lib/` (adjust `../` count based on file location)

**Or better:** Fix each file individually with the correct relative path.

---

## ✅ Verification

After fixing, test locally:
```bash
npm run build
```

If build succeeds, push to trigger Vercel deployment.

---

**Status:** In Progress - 3 files fixed, ~11 remaining

