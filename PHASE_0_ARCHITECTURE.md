# VelocityMaid Phase 0 Architecture

**Visual Reference:** Think of this as a single Figma page with stacked frames

---

## 🟦 FRAME 1 — Public Entry Layer (Top)

```
┌──────────────────────────────────────┐
│           Public Website              │
│                                      │
│  Home / Pricing / About / Contact    │
│                                      │
│  [ Book a Cleaning ]                 │
│  [ Apply as Cleaner ]                │
└──────────────────────────────────────┘
```

**Rules:**
- ✅ No auth required
- ✅ No admin imports
- ✅ No country assumptions

**Implementation:**
- Route: `/` - Homepage (`app/page.tsx`)
- Entry points: "Book a Cleaning" → `/book`, "Apply as Cleaner" → `/cleaners/apply`

---

## 🟩 FRAME 2 — Context Selection Layer (CRITICAL)

```
┌──────────────────────────────────────┐
│        Context Resolution Layer       │
│                                      │
│  Country Selector                    │
│   └─ Jamaica                         │
│   └─ USA (future)                    │
│                                      │
│  Branch Selector                     │
│   └─ Kingston                        │
│   └─ Portland                        │
│   └─ New Jersey                      │
└──────────────────────────────────────┘
```

**✅ This is the heart of the fix**

**Nothing continues without:**
- ✅ `country` (required)
- ✅ `branchId` / `branchSlug` (required)

**This applies to:**
- ✅ Booking
- ✅ Cleaner application
- ✅ Pricing
- ✅ Availability

**Current Implementation Status:**
- ⚠️ **Booking Flow:** Currently selects branch directly (hardcoded list in `ServiceStep.tsx`)
  - Needs: Country selection first, then branch filtered by country
- ✅ **Cleaner Application:** Selects branch from API (`/api/branches`)
  - Branch includes country data, but no explicit country selector
  - Needs: Country selection first, then branch filtered by country

**Required Fix:**
Both flows must have explicit country selection BEFORE branch selection.

---

## 🟨 FRAME 3 — Phase 0 Functional Flows

### A) Customer Booking Flow

```
┌──────────────────────────────────────┐
│          Booking Flow                │
│                                      │
│  Service Type                        │
│  Home Details                        │
│  Extras                              │
│  Schedule                            │
│  Price Calculation                  │
│                                      │
│  → Stripe Checkout                   │
│                                      │
│  → Booking Confirmation              │
└──────────────────────────────────────┘
```

**APIs used:**
- ✅ `/api/branches` - Get available branches
- ✅ `/api/booking/create` - Create booking
- ✅ `/api/booking/quote` - Calculate price
- ✅ `/api/checkout` - Stripe payment session
- ✅ `/api/webhooks/stripe` - Payment confirmation

**❌ No admin APIs**
**❌ No branch-owner APIs**

**Implementation:**
- Route: `/book` (`app/book/page.tsx`)
- Components: `components/booking/*`
- Flow: ServiceStep → HomeDetailsStep → DateTimeStep → ExtrasStep → ContactInfoStep → ReviewStep → ConfirmationStep

### B) Cleaner Application Flow

```
┌──────────────────────────────────────┐
│      Cleaner Apply Flow              │
│                                      │
│  Personal Info                       │
│  Country                             │
│  Preferred Branch                    │
│  Experience                          │
│  Availability                        │
│                                      │
│  → Submit Application                │
└──────────────────────────────────────┘
```

**APIs used:**
- ✅ `/api/branches` - Get available branches (Phase 0 route)
- ✅ `/api/cleaners/apply` - Submit application

**🚫 NOT `/api/admin/branches` (this was the killer bug - FIXED)**

**Implementation:**
- Route: `/cleaners/apply` (`app/cleaners/apply/page.tsx`)
- Validates: name, email, phone, branchId (all required)
- Success: `/cleaners/apply/success`

---

## 🟧 FRAME 4 — Phase 0 Backend Contract

```
┌──────────────────────────────────────┐
│            Backend (Phase 0)         │
│                                      │
│  Public APIs Only                    │
│                                      │
│  /api/branches                       │
│  /api/booking/*                      │
│  /api/checkout                       │
│  /api/cleaners/apply                 │
│  /api/customer/*                     │
│  /api/auth/customer-magic-link       │
│                                      │
│  Prisma ORM                          │
│   └─ Branch                          │
│   └─ Job (Booking)                   │
│   └─ Customer                        │
│   └─ CleanerApplication              │
└──────────────────────────────────────┘
```

**Hard Rule:**
Phase 0 code must NEVER import admin, pilot, finance, or branch-owner modules.

**Database Models (Phase 0):**
- `Branch` - Country, location, status
- `Job` - Booking with `branchId` (required)
- `Customer` - Customer data with `branchId`
- `CleanerApplication` - Application with `branchId` (required)

---

## 🟥 FRAME 5 — Disabled (Greyed Out in Figma)

```
┌──────────────────────────────────────┐
│        🚫 NOT ACTIVE (Phase 1+)      │
│                                      │
│  Admin Dashboard                     │
│  Branch Owner Portal                 │
│  Pilot Assignment                    │
│  Cleaner Payouts                     │
│  Finance & Metrics                   │
└──────────────────────────────────────┘
```

**In Figma:**
- Grey background
- Lock icon
- Label: "Phase 1+ — DO NOT IMPORT"

**Implementation:**
- Routes return 404 in production (`middleware.ts`)
- Routes use `export const dynamic = "force-dynamic"`
- Not compiled in build
- Not imported by Phase 0 code

---

## Architecture Rules

### Rule 1: Context First
**Nothing happens without country and branch.**
- Country selection → Branch selection → Everything else
- No hardcoded assumptions
- No "default" country

### Rule 2: Public APIs Only
**Phase 0 uses ONLY public APIs:**
- ✅ `/api/branches`
- ✅ `/api/booking/*`
- ✅ `/api/checkout`
- ✅ `/api/cleaners/apply`
- ✅ `/api/customer/*`
- ✅ `/api/auth/customer-magic-link`

**Forbidden:**
- ❌ `/api/admin/**`
- ❌ `/api/branch-owner/**`
- ❌ `/api/pilot/**`

### Rule 3: Import Boundaries
**Phase 0 code MUST NOT import:**
- `/app/admin/**`
- `/app/branch-owner/**`
- `/app/pilot/**`
- `/components/admin/**`
- `/components/branch-owner/**`
- `/components/pilot/**`

### Rule 4: Branch-Centric Logic
**Every entity requires branch:**
- Booking → `branchId` (required)
- Cleaner Application → `branchId` (required)
- Pricing → determined by branch
- Currency → determined by branch country
- Cleaner pool → filtered by branch

---

## Current Implementation Gaps

### Gap 1: Country Selection Missing
**Issue:** Both booking and cleaner application skip explicit country selection.

**Current:**
- Booking: Hardcoded branch list (includes Jamaica and US branches mixed)
- Cleaner: Branch dropdown (includes all countries)

**Required:**
1. Country selector first (Jamaica / USA)
2. Branch selector filtered by selected country
3. No proceeding without both

### Gap 2: Branch Hardcoding
**Issue:** `ServiceStep.tsx` has hardcoded branch list.

**Current:**
```typescript
const branches = [
  { slug: 'new-jersey', label: 'New Jersey', sublabel: 'Newark Area' },
  { slug: 'vermont', label: 'Vermont', sublabel: 'Ludlow Area' },
  { slug: 'miami', label: 'Miami', sublabel: 'South Florida' },
  { slug: 'port-antonio', label: 'Jamaica', sublabel: 'Port Antonio' },
];
```

**Required:**
- Fetch branches from `/api/branches`
- Filter by country after country selection
- No hardcoded lists

---

## Success Criteria

### Architecture Compliance
- ✅ Country selection before branch selection
- ✅ Branch selection required for all flows
- ✅ No hardcoded country/branch assumptions
- ✅ Public APIs only
- ✅ No disabled module imports

### Functional Success
- ✅ Customer selects country → branch → completes booking
- ✅ Cleaner selects country → branch → submits application
- ✅ Pricing calculated by branch
- ✅ Currency determined by branch country

---

## Cursor Prompt (Copy/Paste)

```
You are working on VelocityMaid Phase 0.

STRICT RULES:
- Phase 0 includes ONLY: booking, stripe payment, customer dashboard, cleaner application.
- Use ONLY public APIs: /api/branches, /api/booking/*, /api/checkout, /api/cleaners/apply, /api/customer/*.
- NEVER import admin, branch-owner, pilot, finance, or metrics code.
- All flows MUST require country and branch selection (country FIRST, then branch).
- If a feature requires admin data, stop and do not implement it.

Follow the Phase 0 architecture exactly.
```

---

## Next Steps

1. **Add Country Selection to Booking Flow**
   - Create country selector component
   - Add country to BookingContext
   - Filter branches by selected country
   - Update ServiceStep to fetch branches from API

2. **Add Country Selection to Cleaner Application**
   - Add country selector before branch selector
   - Filter branches by selected country
   - Ensure country is saved with application

3. **Remove Hardcoded Branch Lists**
   - Replace hardcoded lists with API calls
   - Ensure all branches come from `/api/branches`

---

**This architecture is the source of truth. All code must obey it.**

