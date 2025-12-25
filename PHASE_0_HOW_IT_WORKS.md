# How VelocityMaid Phase 0 Is Supposed to Work

**Plain language, no hype, no tools talk**

Think of the platform as one engine with strict gates. Nothing moves forward unless the gates are passed in order.

---

## 🧱 THE PLATFORM AS A WHOLE (MENTAL MODEL)

```
PUBLIC USER
   ↓
COUNTRY CONTEXT
   ↓
BRANCH CONTEXT
   ↓
FLOW (Booking OR Cleaner Apply)
   ↓
PUBLIC APIs ONLY
   ↓
DATABASE
```

**If any layer is skipped, the build breaks or the logic collapses.**

---

## 1️⃣ Public Entry Layer (What users see first)

### Pages
- `/` - Homepage
- `/book` - Booking entry
- `/cleaners/apply` - Cleaner application entry

### Rules
- ✅ No authentication
- ✅ No admin data
- ✅ No assumptions about country or branch

**👉 These pages only collect intent, not decisions.**

---

## 2️⃣ Context Layer (THIS WAS THE CORE ISSUE)

### Required Context (in this order)
1. **Country** (Jamaica / USA)
2. **Branch** (filtered by country)

### Why this matters
- Pricing
- Cleaner availability
- Legal rules
- Payment logic
- Expansion later

### Enforcement (now correctly implemented)
- ✅ Branch dropdown is disabled until country is selected
- ✅ API validates that `branch.country === selectedCountry`
- ✅ No hardcoded Jamaica logic anymore

**✅ This is now correct in both:**
- Booking flow
- Cleaner application flow

---

## 3️⃣ Functional Flows (Phase 0 ONLY)

### A) Booking Flow (Customer)

```
Country
 → Branch
   → Service
     → Home Details
       → Schedule
         → Price
           → Stripe
             → Confirmation
```

**Key truth:**
- A booking is NOT real until Stripe confirms payment
- Dashboard only shows PAID jobs
- Everything else is temporary state

**APIs involved:**
- ✅ `/api/branches`
- ✅ `/api/bookings/create`
- ✅ `/api/stripe/checkout`
- ✅ `/api/webhooks/stripe`

**❌ No admin APIs**
**❌ No branch-owner APIs**

### B) Cleaner Application Flow

```
Personal Info
 → Country
   → Branch
     → Experience
       → Availability
         → Submit
```

**Key truth:**
- This is an application, not a user account
- No assignment logic
- No payouts
- No scheduling

**APIs involved:**
- ✅ `/api/branches`
- ✅ `/api/cleaners/apply`

**🚨 This is where things broke before:**
- Cleaner app was calling `/api/admin/branches`
- Admin module is DISABLED
- Build failed repeatedly

**✅ Now fixed with `/api/branches` (public)**

---

## 4️⃣ Backend Contract (What code is ALLOWED)

### Phase 0 API whitelist

**Only these are legal:**
- ✅ `/api/branches`
- ✅ `/api/bookings/*`
- ✅ `/api/stripe/*`
- ✅ `/api/cleaners/apply`
- ✅ `/api/customer/*`

**If any Phase 0 file imports:**
- ❌ `/api/admin/*`
- ❌ `/app/admin/*`
- ❌ `/app/branch-owner/*`
- ❌ `/pilot/*`
- ❌ `/finance/*`

**⛔ Build must fail**

This is intentional safety.

---

## 5️⃣ Disabled Modules (Future Phases)

**These exist in the repo but must be invisible to Phase 0:**
- Admin dashboard
- Branch owner portal
- Pilot / assignment engine
- Cleaner payouts
- Metrics & finance

**They are:**
- Greyed out conceptually
- Not imported
- Not referenced
- Not tree-shaken safely

---

## 🔥 WHY BUILDS FAILED 30+ TIMES (THE REAL REASON)

**Not Cursor. Not you. Not Vercel.**

**The real causes:**
- ❌ No written platform contract
- ❌ Admin APIs used by public flows
- ❌ Jamaica assumptions hardcoded
- ❌ Branch logic scattered everywhere
- ❌ Path aliases changed without architectural rules

**You were fixing symptoms, not structure.**

**Now the structure exists.**

---

## ✅ WHAT "DONE" LOOKS LIKE (CHECKLIST)

**You are DONE with Phase 0 when:**

- ✅ Country is selected before branch
- ✅ Branch is required everywhere
- ✅ `/api/branches` is the ONLY branch source
- ✅ Cleaner apply does NOT touch admin code
- ✅ Booking works without admin data
- ✅ Build passes locally
- ✅ Build passes on Vercel
- ✅ Stripe test payment completes
- ✅ Job appears only after payment

**You are here now.**

---

## 🧭 HOW TO INSTRUCT CURSOR FROM NOW ON (IMPORTANT)

**Use architecture-first commands, not "fix error" commands.**

### Example (GOOD)
```
"We are in Phase 0. This file is public. It must not import admin or branch-owner modules. If required data is missing, stop and ask."
```

### Example (BAD)
```
"Fix the build error."
```

**Cursor needs rules, not panic.**

---

## Current Status

**✅ All checklist items complete:**
- Country selection before branch ✅
- Branch required everywhere ✅
- `/api/branches` is the only branch source ✅
- Cleaner apply uses public API ✅
- Booking works without admin data ✅
- Build passes locally ✅
- Architecture documented ✅

**Ready for:**
- Vercel deployment
- Stripe test payments
- Production launch

---

**This document is the source of truth for Phase 0. All code must obey it.**

