# VelocityMaid Phase 0 Scope - Platform Contract

**Status:** Active  
**Launch Date:** Phase 0 (Current)  
**Last Updated:** December 2024

---

## Core Principle

> **Platform Contract First. Code Obeys It.**

This document defines what exists, what's disabled, and the rules all code must follow. No guessing. No fixing symptoms.

---

## Phase 0 Active Modules (ONLY THESE EXIST)

### Public Customer Routes
- `/book` - Primary booking flow
- `/book/confirmation` - Booking confirmation page
- `/customer/dashboard` - Read-only customer job view
- `/customer/login` - Customer authentication
- `/customer/verify` - Customer verification
- `/customer/jobs` - Customer job list
- `/customer/jobs/[jobId]` - Individual job details

### Cleaner Intake
- `/cleaners/apply` - Cleaner application form
- `/cleaners/apply/success` - Application success page

### Supporting Routes
- `/` - Homepage
- `/review/[jobId]` - Review submission
- `/auth/customer/callback` - Auth callback

### API Routes (Phase 0 Only)
- `/api/booking/*` - Booking creation, quote, create
- `/api/checkout` - Stripe payment processing
- `/api/cleaners/apply` - Cleaner application submission
- `/api/customer/*` - Customer authentication and data
- `/api/auth/customer-magic-link` - Customer magic link auth
- `/api/branches` - Public branch listing (Phase 0)

---

## Disabled Modules (DO NOT BUILD, IMPORT, OR REFERENCE)

### Completely Disabled Routes
- `/app/admin/**` - All admin pages and routes
- `/app/branch-owner/**` - All branch owner pages and routes  
- `/app/pilot/**` - All pilot program pages and routes
- `/app/dashboard/**` - Admin dashboard (different from customer dashboard)
- `/app/cleaner/**` - Cleaner dashboard (not same as `/cleaners/apply`)

### Disabled API Routes
- `/api/admin/**` - All admin API routes
- `/api/branch-owner/**` - All branch owner API routes
- `/api/pilot/**` - All pilot API routes
- `/api/dashboard/**` - Admin dashboard APIs

### Build Exclusion Rules
1. These routes MUST return 404 in production (implemented in `middleware.ts`)
2. These routes MUST use `export const dynamic = "force-dynamic"` to prevent static generation
3. These routes MUST NOT be imported by Phase 0 code
4. If a file imports disabled code, it is NOT Phase 0

---

## Country & Branch Requirements (CRITICAL)

### Booking Flow Requirements
The booking flow MUST collect:
1. **Country** (required field)
2. **Branch** (required field, derived from country/location)

**Implementation:**
- `app/book/page.tsx` uses `BookingContext` which requires `branchSlug`
- Validation in `components/booking/BookingContext.tsx` enforces branch selection
- No booking can proceed without branch selection

### Cleaner Application Requirements  
The cleaner application MUST collect:
1. **Country** (required field)
2. **Preferred Branch** (required field)

**Implementation:**
- `app/cleaners/apply/page.tsx` has `branchId` field marked as required
- Form validation enforces branch selection before submission
- Uses `/api/branches` (Phase 0 route) to fetch available branches

### Branch Logic Rules
- Jamaica and US are separate branches with separate currencies
- No booking can exist without a `branchId`
- No cleaner application can exist without a `branchId`
- Branch determines: currency, pricing, cleaner pool, payout rules

---

## Build Rules (Non-Negotiable)

### Rule 1: Phase 0 Only
- If a file is not used by Phase 0 routes, DO NOT fix it
- If a file imports disabled modules, isolate or exclude it
- Build must succeed with ONLY Phase 0 routes compiled

### Rule 2: No Refactoring Outside Scope
- DO NOT refactor admin logic
- DO NOT refactor pilot logic  
- DO NOT refactor branch-owner logic
- DO NOT touch business logic unrelated to booking or cleaner apply

### Rule 3: Build Success Criteria
- `npm run build` must pass locally
- Vercel build must pass
- Only Phase 0 routes appear in build output
- No errors from disabled modules

### Rule 4: Import Boundaries
- Phase 0 code MUST NOT import from `/app/admin/**`
- Phase 0 code MUST NOT import from `/app/branch-owner/**`
- Phase 0 code MUST NOT import from `/app/pilot/**`
- Phase 0 code MUST NOT import from `/components/admin/**`
- Phase 0 code MUST NOT import from `/components/branch-owner/**`
- Phase 0 code MUST NOT import from `/components/pilot/**`
- If an import breaks, check if it's from a disabled module first

---

## Current Implementation Status

### Already Implemented
- ✅ Middleware blocks disabled routes in production (`middleware.ts`)
- ✅ Disabled pages use `force-dynamic` to prevent build-time evaluation
- ✅ Webpack alias configuration for `@/` paths (`next.config.js`)
- ✅ Booking flow requires branch selection
- ✅ Cleaner application requires branch selection
- ✅ Phase 0 API route `/api/branches` created (replaces `/api/admin/branches`)

### Verification Complete
- ✅ No Phase 0 code imports from disabled modules
- ✅ Build excludes disabled routes from compilation
- ✅ All Phase 0 routes compile successfully

---

## Success Criteria

### Build Success
- ✅ Vercel build passes without errors
- ✅ Only Phase 0 routes compiled
- ✅ No disabled module code in build output

### Functional Success
- ✅ Customer can complete booking → payment → confirmation
- ✅ Cleaner can submit application form
- ✅ Customer can view jobs in dashboard
- ✅ All Phase 0 routes accessible

### Failure Indicators
- ❌ Build fails due to disabled module code
- ❌ Booking flow doesn't require branch
- ❌ Cleaner application doesn't require branch
- ❌ Phase 0 code imports disabled modules

---

## Platform Contract Summary

**What exists:** Booking, payment, confirmation, customer dashboard (read-only), cleaner application form.

**What doesn't exist:** Admin, branch-owner, pilot, finance, metrics, cleaner dashboard, training portal.

**Rules:** No disabled code in build. Branch required for booking and cleaner apply. Country determines branch.

**Success:** Vercel builds. Customers book. Cleaners apply. Nothing else matters for Phase 0.

---

## Files Modified for Phase 0 Compliance

1. **Created:** `app/api/branches/route.ts` - Phase 0 public branch API
2. **Modified:** `app/cleaners/apply/page.tsx` - Changed from `/api/admin/branches` to `/api/branches`

---

## Next Phase Considerations

When Phase 1 is ready:
- Re-enable admin routes with proper authentication
- Re-enable branch-owner routes
- Re-enable pilot routes
- Add cleaner dashboard
- Add training portal

Until then, these modules remain disabled and excluded from builds.

