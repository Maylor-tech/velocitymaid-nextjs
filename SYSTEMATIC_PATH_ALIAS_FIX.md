# 🔧 Systematic Path Alias Fix Strategy

**Status:** In Progress - Critical files fixed, ~290 remaining

---

## ✅ Files Fixed (7 critical API routes)

1. `app/api/cleaners/jobs/route.ts` ✅
2. `app/api/cleaner/payment-method/route.ts` ✅
3. `app/api/cleaner/jobs/[jobId]/complete/route.ts` ✅
4. `app/api/customer/jobs/route.ts` ✅
5. `app/api/admin/finance/jamaica/pnl/route.ts` ✅
6. `app/api/admin/cleaners/route.ts` ✅
7. `app/api/cleaners/scorecard/route.ts` ✅ (from earlier)

---

## 📋 Path Depth Calculation Guide

### Formula:
For a file at: `app/api/[folder]/[subfolder]/route.ts`
- Count directory levels from file to root
- Each level = one `../`
- Then add the target path

### Examples:

**File:** `app/api/cleaners/jobs/route.ts`
- Levels: `jobs` -> `cleaners` -> `api` -> `app` -> root = 4 levels
- Path: `../../../../lib/prisma`

**File:** `app/api/cleaner/payment-method/route.ts`
- Levels: `payment-method` -> `cleaner` -> `api` -> `app` -> root = 4 levels
- Path: `../../../../lib/prisma`

**File:** `app/api/cleaner/jobs/[jobId]/complete/route.ts`
- Levels: `complete` -> `[jobId]` -> `jobs` -> `cleaner` -> `api` -> `app` -> root = 6 levels
- Path: `../../../../../../lib/prisma`

**File:** `app/api/customer/jobs/route.ts`
- Levels: `jobs` -> `customer` -> `api` -> `app` -> root = 4 levels
- Path: `../../../../lib/prisma`

**File:** `app/api/admin/cleaners/route.ts`
- Levels: `cleaners` -> `admin` -> `api` -> `app` -> root = 4 levels
- Path: `../../../../lib/prisma`

**File:** `app/api/admin/finance/jamaica/pnl/route.ts`
- Levels: `pnl` -> `jamaica` -> `finance` -> `admin` -> `api` -> `app` -> root = 6 levels
- Path: `../../../../../../lib/prisma`

---

## 🔴 Remaining Files (~290 files)

### High Priority (API routes - likely to cause build errors):

**Files with `@/lib/auth/requireRole`:**
- `app/api/admin/jobs/[jobId]/route.ts`
- `app/api/admin/audit/logs/route.ts`
- `app/api/pilot/payouts/schedule/route.ts`
- `app/api/pilot/send-reminders/route.ts`
- ... and ~100+ more API routes

### Medium Priority (Components and utilities):
- Component files in `app/` and `components/`
- Utility files

### Lower Priority (Scripts, docs):
- Scripts in `scripts/`
- Documentation files (can be ignored)

---

## 🚀 Next Steps

### Option 1: Fix as errors appear (Recommended)
1. Push current fixes
2. Monitor Vercel build
3. Fix files that cause errors one by one
4. This is the safest approach

### Option 2: Bulk fix all API routes
1. Use the script `fix-path-aliases.js` (needs refinement)
2. Or manually fix all files in `app/api/`
3. Test thoroughly before pushing

### Option 3: Fix webpack config (Already done)
- Added webpack alias config in `next.config.js`
- Changed `moduleResolution` to `node` in `tsconfig.json`
- This should help, but may not be enough for Vercel

---

## 📝 Quick Reference: Common Paths

| From File Location | To `lib/` | To `utils/` | To `components/` |
|-------------------|-----------|-------------|------------------|
| `app/api/*/route.ts` | `../../../../lib/` | `../../../../utils/` | `../../../components/` |
| `app/api/*/*/route.ts` | `../../../../../lib/` | `../../../../../utils/` | `../../../../components/` |
| `app/api/*/*/*/route.ts` | `../../../../../../lib/` | `../../../../../../utils/` | `../../../../../components/` |

---

## ✅ Current Status

- **Build:** ✅ Compiles successfully locally
- **Critical Routes:** ✅ Fixed (7 files)
- **Remaining:** ~290 files with `@/` imports
- **Strategy:** Fix as build errors appear

---

**Next:** Monitor Vercel build. If it fails, fix the specific file mentioned in the error.


