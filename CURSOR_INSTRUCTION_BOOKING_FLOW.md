# 🚨 CURSOR INSTRUCTION: Canonical Booking Flow

**CRITICAL RULE - READ THIS FIRST BEFORE ANY BOOKING-RELATED CHANGES**

---

## ✅ THE RULE

**The ONLY booking flow is `/book` (app/book route).**

**DO NOT modify `/booking` or any legacy booking components.**

**If any change touches booking, it must be applied ONLY to `/book` and its API routes.**

---

## 📍 Canonical Booking Flow

### Primary Route:
- **`/book`** - The ONLY production booking flow
- **Location:** `app/book/page.tsx`
- **Components:** `components/booking/*`

### API Routes (Canonical):
- **`/api/booking/create`** - Creates jobs
- **`/api/booking/quote`** - Calculates pricing
- **`/api/booking/send-estimate`** - Sends email estimates
- **`/api/checkout`** - Stripe checkout integration

---

## 🔄 Redirects (Automatic)

### Legacy Routes (Auto-Redirect):
- **`/booking`** → **`/book`** (301 redirect)
- **`/booking/*`** → **`/book`** (301 redirect)
- **`/booking?branch=miami`** → **`/book?branch=miami`** (preserves query params)

**Implementation:**
- Middleware redirect: `middleware.ts` (primary)
- Route handler: `app/booking/[[...path]]/route.ts` (backup)

**DO NOT add booking logic to redirect routes - they are redirects only.**

---

## ❌ What NOT to Modify

### Deprecated/Legacy:
- ❌ `app/_deprecated_booking/` - DO NOT TOUCH
- ❌ `app/booking/` - Redirects only, no logic
- ❌ Any files referencing legacy booking forms

### What to Ignore:
- ❌ Old booking form code
- ❌ Legacy booking API routes (if any exist)
- ❌ Any `/booking` route handlers (except redirects)

---

## ✅ What TO Modify

### Canonical Booking Flow:
- ✅ `app/book/page.tsx` - Main booking page
- ✅ `components/booking/*` - All booking components
- ✅ `app/api/booking/*` - Booking API routes
- ✅ `app/api/checkout/route.ts` - Checkout integration

### Components Structure:
```
components/booking/
  ├── BookingContext.tsx       # State management
  ├── BookingLayout.tsx         # Layout wrapper
  ├── steps/
  │   ├── ServiceStep.tsx       # Step 1: Service & Location
  │   ├── HomeDetailsStep.tsx   # Step 2: Home details
  │   ├── DateTimeStep.tsx      # Step 3: Date & Time
  │   ├── ExtrasStep.tsx        # Step 4: Add-ons
  │   ├── ContactInfoStep.tsx   # Step 5: Contact info
  │   ├── ReviewStep.tsx        # Step 6: Review & Quote
  │   └── ConfirmationStep.tsx # Step 7: Confirmation
  └── types.ts                  # TypeScript types
```

---

## 🎯 When Making Booking Changes

### Always Start With:
> "IMPORTANT: The canonical booking flow is `/book`. Ignore `/booking` and any legacy booking forms."

### Checklist:
1. ✅ Is this change for `/book` route? → Proceed
2. ❌ Is this for `/booking`? → Redirect to `/book` instead
3. ✅ Are you modifying `components/booking/*`? → Proceed
4. ❌ Are you modifying `app/_deprecated_booking/*`? → STOP - Don't modify

---

## 🔍 How to Verify

### Test Redirects:
1. Visit `http://localhost:3000/booking`
   - Should redirect to `/book`
2. Visit `http://localhost:3000/booking?branch=miami`
   - Should redirect to `/book?branch=miami`

### Test Canonical Flow:
1. Visit `http://localhost:3000/book`
   - Should show booking wizard
2. Complete a test booking
   - Should work end-to-end

---

## 📝 Current Status

### ✅ Implemented:
- ✅ Canonical booking flow at `/book`
- ✅ Automatic redirects from `/booking` → `/book`
- ✅ Query parameter preservation
- ✅ Middleware + route handler redirects
- ✅ Legacy booking deprecated

### ✅ Fixed Issues:
- ✅ Customer ID auto-generation
- ✅ Job ID auto-generation
- ✅ Address fields (using defaultAddress/homeZipCode)
- ✅ Time validation (parsing ranges)
- ✅ pricingReferenceId temporarily disabled
- ✅ Customer portal authentication fixed

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T:
1. Create new booking routes outside `/book`
2. Modify `app/_deprecated_booking/` folder
3. Add logic to `app/booking/` redirect routes
4. Use `/booking` in new code (use `/book` instead)
5. Create duplicate booking components

### ✅ DO:
1. Always use `/book` for new booking links
2. Modify only `components/booking/*` components
3. Test on `/book` route, not `/booking`
4. Update existing `/booking` links to `/book` when possible
5. Preserve query parameters when redirecting

---

## 📚 Reference Files

### Source of Truth:
- `app/book/page.tsx` - Main booking page (has source-of-truth comment)
- `components/booking/BookingContext.tsx` - State management
- `app/api/booking/create/route.ts` - Job creation

### Redirect Implementation:
- `middleware.ts` - Primary redirect logic
- `app/booking/[[...path]]/route.ts` - Backup redirect handler

### Documentation:
- `BOOKING_FLOW_CONSOLIDATION_COMPLETE.md` - Original consolidation
- `BOOKING_REDIRECT_IMPLEMENTATION.md` - Redirect details
- `COMPREHENSIVE_PROJECT_AUDIT_DECEMBER_2024.md` - Full audit

---

## 🎯 Quick Reference

**For Cursor/AI Prompts:**

```
IMPORTANT: The canonical booking flow is /book. 
Ignore /booking and any legacy booking forms.

All booking changes must go in:
- app/book/page.tsx
- components/booking/*
- app/api/booking/*
```

**For Code Changes:**

- ✅ Modify: `app/book/*` and `components/booking/*`
- ❌ Don't modify: `app/_deprecated_booking/*` or `app/booking/*` (redirects only)

---

**Last Updated:** December 28, 2024  
**Status:** ✅ Active and Enforced








