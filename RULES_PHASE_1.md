## VelocityMaid — Phase 1 Rules (Ops + Assignment + Readiness)

**Status:** Active governance for Phase 1 development  
**Phase 0:** Frozen and must remain stable

This file extends `RULES.md` and applies to all Phase 1 work.

---

## 0. Purpose

Phase 1 introduces internal operations (admin, branch owner, cleaner dashboard) while preserving Phase 0 stability.

This document exists to:
- Prevent Phase 0 regressions
- Enforce clean module boundaries
- Stop AI tools from refactoring or cross-importing
- Keep branch-centric rules consistent across all layers

**If a change violates these rules, it must be reverted.**

---

## 1. Phase 0 is Frozen (Non-negotiable)

### Phase 0 modules must not be modified unless it is a critical emergency:
- Customer booking flow
- Stripe checkout & webhook logic
- Confirmation page logic
- Customer dashboard logic
- Public branch discovery API (`/api/branches`)
- Cleaner application intake flow (`/cleaners/apply`)

**Emergency definition (only):**
- Customers cannot complete payment
- Jobs are not created after confirmed payment
- Production is down

All other improvements belong in a future scheduled release.

---

## 2. Phase 1 Scope (What is allowed)

Phase 1 adds operational capability:

### Allowed Phase 1 modules
- Admin portal (approval workflows)
- Branch owner portal (branch-level ops)
- Cleaner dashboard (post-approval)
- Manual job assignment
- Earnings ledger tracking (readiness only)
- Operational audit logs

### Explicitly out of scope for Phase 1
- Automated assignment (Phase 2)
- Automated payouts + cron payouts (Phase 2)
- Complex BI metrics / dashboards (Phase 2)
- Referral commission automation (Phase 2)

---

## 3. Module Boundaries (The Most Important Rule)

### 3.1 Allowed dependency direction
✅ Phase 1 code MAY depend on Phase 0 tables and shared libs.  
❌ Phase 0 code MUST NEVER depend on Phase 1 code.

**Direction rule:**
Phase 1 → Phase 0 ✅ OK
Phase 0 → Phase 1 ❌ Forbidden

### 3.2 Directory boundaries

**Phase 0 (frozen)**
```
app/book/**
app/customer/**
app/cleaners/apply/**
app/api/branches/**
app/api/booking/**
app/api/stripe/**
app/api/webhooks/**
components/booking/**
lib/** (shared)
```

**Phase 1 (new)**
```
app/admin/**
app/branch-owner/**
app/pilot/**
app/cleaner/**
app/api/admin/**
app/api/branch-owner/**
app/api/pilot/**
app/api/finance/**
```

---

## 4. Import Rules

### 4.1 Forbidden imports FROM Phase 0
Phase 0 files MUST NOT import from any of these paths:

- `@/app/admin/**`
- `@/app/branch-owner/**`
- `@/app/pilot/**`
- `@/app/cleaner/**`
- `@/app/finance/**`
- `@/app/metrics/**`
- `@/app/api/admin/**`
- `@/app/api/branch-owner/**`
- `@/app/api/pilot/**`
- `@/app/api/finance/**`

### 4.2 Allowed imports IN Phase 1
Phase 1 files MAY import from Phase 0 shared libraries and models:

✅ Allowed:
- `@/lib/**`
- `@/components/**` (shared only)
- Prisma models
- `@/app/api/branches` (read-only use)
- Phase 0 types that are stable and shared

### 4.3 Shared code policy
If Phase 1 needs reusable UI or functions:
- Place them in a `shared/` folder or in existing shared locations (`lib/`, `components/`)
- Shared modules MUST NOT import from `app/admin`, `app/branch-owner`, `app/pilot`, or `app/cleaner`

---

## 5. Data Integrity Rules (Branch-centric Operations)

### 5.1 Branch is mandatory everywhere
- Jobs already require `branchId`
- Phase 1 entities MUST also require `branchId`

### 5.2 Assignment must be branch-consistent
A job can only be assigned to a cleaner in the same branch:

```yaml
job.branchId === cleaner.branchId
```

If mismatch → reject at API level.

### 5.3 Country consistency
Country may be derived from branch, but if the client supplies country, validate it matches branch.

---

## 6. Roles & Access Control Rules

### Roles introduced/used in Phase 1
- `ADMIN` — platform-wide authority
- `PILOT` — multi-branch ops oversight
- `BRANCH_OWNER` — branch-scoped ops
- `CLEANER` — post-approval worker dashboard
- `CUSTOMER` — Phase 0

### Access rules
- Branch owners can only access data within their branch.
- Cleaners can only access their own assignments and earnings.
- Pilot/Admin can view across branches depending on permissions.

All access control must be enforced in the API layer (not only in UI).

---

## 7. Phase 1 Operational Workflows (Manual-first)

### 7.1 Approve cleaner application
- Admin reviews `CleanerApplication`
- Approves → creates `Cleaner`
- Optional: invites cleaner via onboarding magic link

### 7.2 Manual assignment
- Branch owner assigns a PAID job to a cleaner
- Creates `JobAssignment` record
- Cleaner accepts/declines

### 7.3 Completion and ledger
- On job completion: record earnings as `EARNED`
- Do not attempt automatic payout in Phase 1

---

## 8. Build Safety Rules

### 8.1 Phase 0 build must remain green
Every Phase 1 PR must verify:
- `npm run lint:strict` passes
- `npm run build` passes
- No new forbidden imports in Phase 0 code

### 8.2 Feature flags (recommended)
If Phase 1 UI routes are not ready, gate them behind:
- environment flag (e.g., `PHASE_1_ENABLED=true`)
- or route-level auth checks

But do not hide broken code behind flags; it must still build cleanly.

---

## 9. AI Tool Rules (Cursor / ChatGPT)

When asking AI to implement Phase 1:
- Always state: "Phase 1 task"
- Always list allowed files
- Always list forbidden files
- Always state acceptance criteria
- Forbid refactors unless explicitly required

AI must never:
- Refactor booking/Stripe logic
- Modify Phase 0 API contracts
- Alter database schema without an approved migration plan
- Touch more than the scoped files

If ambiguous:
**STOP AND ASK**.

---

## 10. Definition of Done (Phase 1 Governance)

Phase 1 governance is working when:
- Phase 0 remains stable and unchanged
- Phase 1 features build and deploy without pulling Phase 0 into chaos
- Import boundaries are enforced with ESLint rules
- Any violation fails CI immediately

---

## 11. Next enforcement step (recommended)

Create ESLint overrides so:
- Phase 0 files have strict forbidden-import rules
- Phase 1 files may import Phase 0 shared libs
- Shared libs cannot import Phase 1 routes

(Implementation will be documented in `ESLINT_PHASE_1.md`.)

