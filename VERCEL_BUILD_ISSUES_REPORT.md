# Vercel Build Issues Report

**Date:** December 28, 2024  
**Status:** Issues Found - Fixes Applied

---

## 🔴 CRITICAL ISSUES (Must Fix)

### 1. **File System Operations in Serverless** ❌
**File:** `app/api/cleaners/apply/upload/route.ts`

**Problem:**
- Uses `fs/promises`, `path`, and `fs` modules
- Writes files to local filesystem (`public/uploads/applications/`)
- **Vercel serverless functions are read-only** - cannot write to filesystem

**Impact:** This route will **fail in production** on Vercel

**Solution Options:**
- Option A: Use Vercel Blob Storage or S3 for file uploads
- Option B: Temporarily disable this route (add `export const runtime = "nodejs"` and comment out file operations)
- Option C: Move to a different hosting solution that supports file writes

**Current Code:**
```typescript
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const uploadsDir = join(process.cwd(), 'public', 'uploads', 'applications');
await writeFile(filepath, buffer); // ❌ Will fail on Vercel
```

---

### 2. **Module-Level Resend Initialization Without Env Check** ❌
**Files:**
- `app/api/booking/create/route.ts` (line 20)
- `app/api/booking/send-estimate/route.ts` (line 11)

**Problem:**
- `Resend` is initialized at module level without checking if `RESEND_API_KEY` exists
- During build, if env var is missing, this will cause build failure

**Impact:** Build may fail if `RESEND_API_KEY` is not set in Vercel

**Solution:** Move Resend initialization inside functions (lazy initialization)

**Current Code:**
```typescript
const resend = new Resend(process.env.RESEND_API_KEY); // ❌ No check
```

**Fixed Code:**
```typescript
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null; // Or throw error if required
  }
  return new Resend(process.env.RESEND_API_KEY);
}
```

---

## ✅ SAFE (No Issues)

### 3. **Crypto Module Usage** ✅
**Files:**
- `app/api/admin/payouts/bulk/confirm-paid/route.ts`
- `app/api/cron/weekly-payout-summary/route.ts`
- `app/api/admin/payouts/[payoutId]/mark-paid/route.ts`
- `app/api/admin/payouts/[payoutId]/approve/route.ts`

**Status:** ✅ Safe
- `randomUUID` from `crypto` is available in Node.js runtime
- These are used inside functions, not at module level
- No build-time execution

---

### 4. **Process.env Usage** ✅
**Status:** ✅ Mostly Safe
- Most `process.env` usage has proper checks
- `getStripe()` functions properly validate env vars
- Only issue is module-level Resend (fixed above)

---

## 📋 SUMMARY

| Issue | Severity | Status | Fix Required |
|-------|----------|--------|--------------|
| File upload route (fs/path) | 🔴 Critical | Found | Yes - Disable or refactor |
| Module-level Resend (booking/create) | 🔴 Critical | Found | Yes - Move inside function |
| Module-level Resend (send-estimate) | 🔴 Critical | Found | Yes - Move inside function |
| Crypto imports | ✅ Safe | OK | No |
| Other process.env usage | ✅ Safe | OK | No |

---

## 🚀 FIXES APPLIED

1. ✅ Fixed module-level Resend in `app/api/booking/create/route.ts`
2. ✅ Fixed module-level Resend in `app/api/booking/send-estimate/route.ts`
3. ⚠️ File upload route needs decision: disable or refactor

---

## 🧪 VERIFICATION

After fixes:
1. Run `npm run build` locally
2. Check Vercel build logs
3. Test file upload route (if not disabled)











