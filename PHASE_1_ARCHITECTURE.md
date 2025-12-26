# VelocityMaid — Phase 1 Architecture (Ops + Assignment + Readiness)

**Status:** Planning (No code changes yet)  
**Phase 0:** Frozen + Stable (Do not modify Phase 0 flows)

---

## 1. Purpose

Phase 1 turns Phase 0 demand into operational execution.

### Phase 0 proved:
- Customers can book and pay
- Jobs are created only after payment
- Cleaner applications can be submitted with Country → Branch enforced

### Phase 1 delivers:
- Cleaner onboarding (application → active cleaner)
- Branch-based job assignment
- Cleaner acceptance + job completion updates
- Earnings tracking (payout readiness, not automated payouts yet)
- Branch owner and pilot visibility without breaking production builds

---

## 2. Non-Negotiable Principles

1. **Phase 0 remains untouched**
   - Booking flow, Stripe flow, customer dashboard, public APIs remain stable.
2. **Branch-centric operations**
   - All Phase 1 entities are scoped to a `branchId` and validated.
3. **Country → Branch → Flow remains the universal context**
4. **Manual-first operations**
   - Assignment begins as manual before automation.
5. **Observability before automation**
   - Record events and ledger entries before enabling payout crons.
6. **No cross-phase imports**
   - Phase 0 code must never import Phase 1 modules.

---

## 3. Scope

### 3.1 Phase 1 Includes (New Capabilities)
- Approve cleaner applications
- Create "Cleaner" operational accounts
- Assign jobs to cleaners (branch-scoped)
- Cleaner accept/decline
- Track job completion
- Earnings ledger ("earned" vs "paid")
- Branch owner dashboard (branch-scoped)
- Pilot dashboard (multi-branch oversight)

### 3.2 Phase 1 Excludes (Not Yet)
- Automated assignment engine (Phase 2)
- Automated payouts + cron payouts (Phase 2)
- Referral commissions automation (Phase 2)
- Complex metrics/BI dashboards (Phase 2)
- Multi-provider payment routing (Phase 2+)

---

## 4. Architecture Overview (Lanes)

### 4.1 Phase 0 Lane (Frozen)
**Public**
- `/`
- `/book`
- `/book/confirmation`
- `/customer/*`
- `/cleaners/apply`

**Public APIs**
- `/api/branches`
- `/api/booking/*`
- `/api/stripe/*`
- `/api/webhooks/stripe`
- `/api/cleaners/apply`
- `/api/customer/*`
- `/api/auth/customer-magic-link`

### 4.2 Phase 1 Lane (New)
**Internal**
- `/admin/*` (platform admin)
- `/branch-owner/*` (branch operator)
- `/pilot/*` (ops oversight)
- `/cleaner/*` (post-approval cleaner dashboard)

**Phase 1 APIs**
- `/api/admin/cleaner-applications/*`
- `/api/admin/cleaners/*`
- `/api/branch-owner/jobs/*`
- `/api/branch-owner/assignments/*`
- `/api/cleaner/assignments/*`
- `/api/ops/events/*` (optional event log)
- `/api/finance/ledger/*` (read-only first)

> Important: Phase 1 modules must not be referenced by Phase 0 code.
> Admin modules may use Phase 0 tables, but Phase 0 must never import Phase 1 routes/components.

---

## 5. Data Model (Proposed)

Phase 1 introduces operational entities while preserving Phase 0 truth tables.

### 5.1 Existing Phase 0 tables (assumed)
- `Country`
- `Branch`
- `Customer`
- `Job`
- `CleanerApplication`
- `Payment` (or payment fields on Job)

### 5.2 New Phase 1 tables

#### A) Cleaner
Represents an approved worker tied to a branch.

**Fields**
- `id`
- `branchId` (FK)
- `countryId` (FK) (optional if derivable from branch)
- `email` (unique)
- `phone` (nullable)
- `status` (`ACTIVE`, `PAUSED`, `OFFBOARDING`)
- `createdAt`, `updatedAt`

**Notes**
- Created from approved `CleanerApplication`
- May map to `User` auth record if using role-based login

---

#### B) JobAssignment
Tracks job-to-cleaner assignment history.

**Fields**
- `id`
- `jobId` (FK)
- `cleanerId` (FK)
- `branchId` (FK) (must equal job.branchId)
- `status` (`ASSIGNED`, `ACCEPTED`, `DECLINED`, `CANCELLED`, `COMPLETED`)
- `assignedAt`
- `respondedAt` (nullable)
- `completedAt` (nullable)
- `notes` (nullable)

**Rules**
- Only one "active" assignment per job at a time
- Assignment must be branch-consistent

---

#### C) CleanerEarningsLedger
Records earnings from completed jobs.

**Fields**
- `id`
- `cleanerId` (FK)
- `jobId` (FK)
- `branchId` (FK)
- `amount`
- `currency`
- `status` (`EARNED`, `HOLD`, `PAID`, `REVERSED`)
- `createdAt`

**Notes**
- Phase 1 uses ledger to calculate payout readiness
- Phase 2 triggers actual payout automation

---

#### D) OpsEventLog (Optional but recommended)
Audit trail for operations.

**Fields**
- `id`
- `type` (e.g., `CLEANER_APPROVED`, `JOB_ASSIGNED`, `JOB_ACCEPTED`, `JOB_COMPLETED`)
- `branchId`
- `actorUserId` (nullable)
- `entityType`
- `entityId`
- `payload` (JSON)
- `createdAt`

---

## 6. Roles & Access Control

### Roles
- `CUSTOMER` — Phase 0
- `CLEANER` — Phase 1 (post-approval)
- `BRANCH_OWNER` — Phase 1 (branch-scoped ops)
- `PILOT` — Phase 1 (multi-branch oversight)
- `ADMIN` — Phase 1 (platform-wide)

### Access rules (high level)
- Customers: only their own jobs
- Cleaners: only assignments and ledger entries tied to them
- Branch owners: only jobs/cleaners/applications in their branch
- Pilot/Admin: broader visibility

---

## 7. Phase 1 User Flows

### 7.1 Admin Approval Flow
1. Admin views `CleanerApplication` list (filtered by branch/country)
2. Admin approves one application
3. System creates `Cleaner`
4. Optionally creates auth account / magic link onboarding

**Outputs**
- Cleaner created
- Event logged (optional)

---

### 7.2 Branch Owner Assignment Flow (Manual First)
1. Branch owner views unassigned PAID jobs in branch
2. Selects cleaner from branch pool
3. Creates `JobAssignment` with status `ASSIGNED`
4. Cleaner notified (Phase 2 notifications optional; Phase 1 can be manual)

---

### 7.3 Cleaner Acceptance Flow
1. Cleaner logs in
2. Sees assigned jobs
3. Accepts or declines
4. Updates assignment status

---

### 7.4 Job Completion → Earnings Ledger
1. When job marked `COMPLETED`
2. Create `CleanerEarningsLedger` entry (`EARNED`)
3. Phase 2: payouts may convert `EARNED` → `PAID`

---

## 8. Operational Guardrails

### 8.1 No Phase 0 changes
- Phase 0 flows are stable and production-tested.
- Phase 1 must not modify booking/payment logic.

### 8.2 Import boundaries
- Phase 0 cannot import Phase 1 code
- ESLint rules enforce forbidden imports (extend for Phase 1)

### 8.3 Manual-first
- No automation until data is reliable
- No cron jobs until ledger is validated

---

## 9. Deliverables (Phase 1 Documentation)

- `PHASE_1_ARCHITECTURE.md` (this file)
- `RULES_PHASE_1.md` (Phase 1 governance + import boundaries)
- `PHASE_1_DB_SCHEMA.md` (detailed tables and enums)
- `PHASE_1_API_CONTRACT.md` (endpoints + payloads)
- `PHASE_1_UI_WIREFRAMES.md` (screens + navigation)

---

## 10. Implementation Sequence (Recommended)

### Phase 1A — Foundations
- Create Cleaner table + approval endpoints
- Add RBAC roles
- Add admin approval UI minimal

### Phase 1B — Assignment
- Create JobAssignment table + branch owner UI
- Cleaner accepts/declines UI

### Phase 1C — Ledger Readiness
- Create earnings ledger entries on completion
- Branch owner and pilot read-only payout readiness view

### Phase 2 — Automation
- Notifications
- Auto-assign
- Cron payout summaries
- Payment disbursement

---

## 11. Definition of Done (Phase 1)

Phase 1 is complete when:
- Admin can approve applications → creates Cleaner
- Branch owner can assign a paid job to a cleaner
- Cleaner can accept and complete a job
- Earnings ledger records EARNED entries
- No Phase 0 build breaks or boundary violations
- ESLint boundary rules prevent cross-phase imports

