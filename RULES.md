# VelocityMaid — Platform Rules & AI Guardrails

**(Authoritative – must be followed by humans & AI tools)**

---

## 0. Purpose of this file

This document defines the non-negotiable rules for the VelocityMaid platform.

**Any change that violates these rules is considered incorrect, even if it compiles.**

This file exists to:

- Prevent architectural drift
- Prevent AI over-refactoring
- Protect production stability
- Enable phased development without rebuild chaos

---

## 1. Platform Definition (Read First)

VelocityMaid is a **branch-centric, multi-country cleaning platform**.

**Core truth:**

- Every booking, cleaner, and operation belongs to **exactly one branch**.
- Country is context, not logic.
- Branch is logic, not decoration.

---

## 2. Phase Definitions (CRITICAL)

### Phase 0 — Public Launch (ACTIVE)

**Only the following modules exist in Phase 0:**

✅ **Allowed (must compile)**
- Customer booking flow
- Stripe payment & confirmation
- Customer dashboard (read-only)
- Cleaner application (intake only)
- Public branch discovery

❌ **Disabled (must NOT compile or be imported)**
- Admin dashboard
- Branch owner tools
- Pilot / assignment engine
- Cleaner payouts
- Finance & metrics

**If Phase 0 code imports disabled modules, the change is invalid.**

---

## 3. Active Routes (Phase 0)

**Only these routes are considered production-critical:**

- `/` (public)
- `/book` (booking flow)
- `/book/confirmation`
- `/customer/*` (customer dashboard)
- `/cleaners/apply`
- `/api/branches`
- `/api/bookings/*`
- `/api/stripe/*`
- `/api/cleaners/apply`
- `/api/customer/*`

**Any other route is out of scope for Phase 0.**

---

## 4. Disabled Routes (Phase 1+ Only)

**The following directories are explicitly forbidden in Phase 0 imports:**

- `/app/admin/**`
- `/app/branch-owner/**`
- `/app/pilot/**`
- `/app/finance/**`
- `/app/metrics/**`

**Rules:**

- Do NOT "fix" these files during Phase 0
- Do NOT import from them
- Do NOT reference their APIs
- If they cause build issues → isolate or exclude them

---

## 5. Context Rules (NON-NEGOTIABLE)

### Context order (must always be enforced)

**Country → Branch → Flow**

**Rules:**

- Country MUST be selected before branch
- Branch MUST be selected before:
  - booking
  - cleaner application
- Branch list MUST be filtered by country
- Backend MUST validate:
  - branch exists
  - `branch.country` matches selected country
- No hardcoded defaults (e.g., Jamaica).

---

## 6. Branch Rules (ABSOLUTE)

- Every Job has `branchId`
- Every Cleaner Application has `branchId`
- No branch = invalid state
- No "global" jobs or cleaners

**If `branchId` is missing, the flow is broken.**

---

## 7. API Contract Rules

### Phase 0 API whitelist

**Only these APIs may be used:**

- `/api/branches` (public)
- `/api/bookings/*` (public)
- `/api/stripe/*` (public)
- `/api/cleaners/apply` (public)
- `/api/customer/*` (public)

🚫 **Forbidden in Phase 0:**

- `/api/admin/*`
- `/api/branch-owner/*`
- `/api/pilot/*`
- `/api/finance/*`

**If data is needed for Phase 0:**

- Create a public Phase-0 API
- Do NOT reuse admin APIs

---

## 8. Stripe & Payments

- Stripe payment is the single source of truth
- Jobs must NEVER be created before payment confirmation
- Webhook confirmation is required
- Dashboard only shows PAID jobs
- Payment logic is frozen in Phase 0.

---

## 9. Build & Import Rules

### Imports

- `@/` alias is allowed and preferred
- Relative imports are allowed if correct
- No cross-phase imports (Phase 0 → Phase 1)

### Build discipline

- Phase 0 build must succeed without admin code
- Fixing a build by refactoring disabled modules is forbidden
- If a disabled file breaks build → exclude it

---

## 10. AI Tool Rules (Cursor / ChatGPT)

**When using AI tools:**

**ALWAYS state:**
- Current phase (Phase 0)
- Active modules
- Forbidden modules
- Exact scope of work

**AI MUST NOT:**

- Refactor architecture
- Move folders
- Rename routes
- Change Stripe logic
- Change database schema
- "Clean up" unrelated files
- Claim "final fix" without a successful build

**If requirements are ambiguous:**

- **STOP AND ASK**

---

## 11. What "Done" Means (Phase 0)

**Phase 0 is complete when:**

- ✅ Booking requires country + branch
- ✅ Cleaner apply requires country + branch
- ✅ `/api/branches` is the only branch source
- ✅ No admin imports exist in Phase 0
- ✅ Build passes locally
- ✅ Build passes on Vercel
- ✅ Stripe test payment completes end-to-end

---

## 12. Phase 1 Preview (Not Active Yet)

**Future phases may include:**

- Admin dashboards
- Branch owner portals
- Cleaner scheduling & payouts
- Metrics & finance

**These MUST be implemented after Phase 0 is stable.**

---

## 13. Enforcement Statement

**Any change that violates this document:**

- Is considered incorrect
- Must be reverted
- Should not be deployed

**This file overrides ad-hoc instructions, quick fixes, or AI suggestions.**

---

## Final Note

**This document exists so VelocityMaid can scale without collapsing under its own complexity.**

- Respect the rules.
- Ship with confidence.
- Expand deliberately.

