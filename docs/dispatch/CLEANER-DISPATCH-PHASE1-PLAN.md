# VelocityMaid — Cleaner Dispatch & Job Execution Phase 1

**Status:** IMPLEMENTED on `feat/cleaner-dispatch-phase1`. **Not deployed. Production flag default OFF.**  
**Market:** Vermont operations first (after acceptance)  
**Date:** 2026-08-28  

**Out of scope (do not touch):** billing-policy logic, invoice reconciliation, Google Calendar event shape/behavior as a product, customer pricing, historical production records (0021/0022/0017, Chipman payments).

Chris’s Chipman invoices **0021** and **0022** are already marked paid in production. This phase does not read or write those rows.

Approved amendments incorporated:

- Finish Job = submitted for QC (`AWAITING_QC`); admin remains billing/completion authority. Do not reuse `COMPLETED` for QC.
- Compensation is an ops-approved snapshot; never derived from a null/uncertain customer price; never exposed as invoice totals.
- Offer TTL is env-configurable (`DISPATCH_OFFER_TTL_MINUTES`, `DISPATCH_OFFER_TTL_MINUTES_URGENT`).
- Access credentials withheld until ACCEPTED.
- Photo sign/register authentication is a Phase 1 release requirement.
- Offer/accept/start/finish never mark `INVOICE_AFTER_SERVICE` jobs PAID.
- Customer commercial approval (`reviewStatus`) stays separate from cleaner acceptance.
- Feature-flagged; Vermont only after acceptance testing.
- Stop after implementation, tests, build, and the acceptance runbook. No deploy from tests passing.

See `docs/dispatch/CLEANER-DISPATCH-PHASE1-ACCEPTANCE.md`.

---

## A. Current-system audit

### What already exists and must be reused

VelocityMaid already has a **cleaner portal execution loop**. It does **not** have a true job **offer**. Today ops **assigns immediately**; the cleaner then accepts or declines **after** `assignedCleanerId` is set.

| Capability | Today | Reuse? |
|---|---|---|
| Scored cleaner picker | `AssignCleanerModal`, `lib/cleaner-assignment.ts` | Yes — picker only, not auto-write |
| Manual assign API | `POST /api/admin/jobs/manual-assign` | Refactor internals: **activate assignment** only after accept |
| Billing assignability | `isJobAssignable` — `INVOICE_AFTER_SERVICE` does **not** require PAID | **Do not change** |
| Cleaner auth + portal | Cookie login `/cleaners/login`, jobs at `/cleaner/jobs/[jobId]` | Yes |
| Accept / decline / start / complete | `PATCH /api/cleaner/jobs/[jobId]/{accept,decline,start,complete}` | Yes — retarget accept to **offer**, not post-assign |
| Checklist | 50-item `CARE_CHECKLIST`, `JobChecklistItem` | Yes |
| Property instructions | `toCleanerPropertyView` (access, linens, trash, standing notes) | Yes |
| Photos | `CleanPhoto` + Supabase `clean-photos` | Yes — add category; do not auto-publish to customer |
| Escalation API | `POST .../escalate` → `JOB_ISSUE_REPORTED` | Yes — add cleaner UI |
| Assignment email | `sendCleanerAssignmentEmail` already links `/cleaner/jobs/{jobId}`, **excludes guest payment** | Yes — retitle as **offer** |
| Admin alerts | `CLEANER_ASSIGNED`, `CLEANER_ACCEPTED`, `CLEANER_DECLINED`, `CLEANER_NO_RESPONSE` | Extend, don’t replace |
| Audit | `AuditLog`, `AssignmentLog` | Yes |
| Ops urgency (derived) | `lib/admin/jobsOperations.ts` — today / overdue badges | Keep; add **stored** SAME_DAY flag |
| Payout math | `calcPayout` on `operationalTotal ?? quotedTotal` | Snapshot **cleaner share only** onto the offer |
| Completion / invoice | Admin `POST /api/jobs/[jobId]/complete` → `runJobCompletionBillingWorkflow` | **Leave on admin QC.** Do not call from cleaner complete in Phase 1 |

### What must not be duplicated

- Do **not** add a second `assignedCleanerId`.
- Do **not** add Jamaica WhatsApp YES/NO (`sendJobOffer`, `schedule/assign` with invalid `'pending'` status) as the Vermont path.
- Do **not** add Prisma `REASSIGN_PENDING` (exists only in `lib/jobStatus.ts`; decline writes it and can fail). Offers replace that.
- Do **not** keep two auto-assign implementations as the Vermont dispatcher (`lib/cleaner-assignment.ts` vs `lib/dispatch/autoAssignCleaner.ts`).
- Do **not** use legacy `PATCH /api/cleaners/jobs` for the new portal.

### Gaps (schema / API / UI)

| Gap | Effect |
|---|---|
| No `JobOffer` (or equivalent) | Cannot offer without assigning |
| Assign sets `assignedCleanerId` immediately | Two cleaners cannot be sequenced; job is “theirs” before they say yes |
| No offer expiry / 30-minute same-day SLA | `cleaner-response-check` is **daily 15:00 UTC**, default **2 hours**, and only after ASSIGNED |
| No persisted `startedAt` | Start only flips `IN_PROGRESS`; timer cannot be server-derived |
| `cleanDurationMins` set only on **admin** complete | Cleaner finish does not record duration |
| Photos have `caption` only, never set by upload UI | No BEFORE/AFTER/ISSUE categories; report split is caption heuristic |
| Photo sign/register APIs unauthenticated | Safety hole |
| Cleaner complete ≠ admin complete | No completion report / invoice from cleaner finish (good for billing isolation; need explicit QC handoff) |
| Escalate API has no cleaner UI | Issues not flagged in portal |
| Offer compensation not shown | Email has pay **method**, not amount; must not show invoice total |
| No Job-level SAME_DAY / URGENT column | Host “same-day turnover” is buried in `internalNotes` |
| Cleaner in-app `Notification` model missing from Prisma | `/cleaner/notifications` is not a reliable channel |
| Auto-assign skips `isJobAssignable` | Host PENDING jobs could still be auto-assigned |

### Current vs target (Vermont)

```
TODAY:  Ops Assign → Job ASSIGNED + assignedCleanerId → Cleaner Accept → ON_THE_WAY
TARGET: Ops Offer  → JobOffer OFFERED (job still needs cleaner) → Accept → then ASSIGNED
```

---

## B. Proposed data model

### 1. `JobOffer` (new) — source of truth for dispatch

Offer states live **on the offer**, not as new `JobStatus` values. Job stays `RECEIVED` / `CONFIRMED` until accept.

```
JobOffer
  id
  jobId                 FK Job
  cleanerId             FK User (CLEANER)
  status                JobOfferStatus  // OFFERED | ACCEPTED | DECLINED | EXPIRED | CANCELLED
  offeredAt
  expiresAt
  respondedAt           // accept or decline
  declineReason         String?
  compensationAmount    Decimal         // snapshot — cleaner pay, never customer total
  compensationCurrency  String          // default USD
  estimatedDurationMins Int?
  operationalNotes      String?         // snapshot shown on the offer
  channel               String          // EMAIL | PORTAL
  createdByAdminId      String?
  cancelledAt           DateTime?
  cancelledByAdminId    String?
  createdAt / updatedAt

Indexes:
  (jobId, status)
  (cleanerId, status)
  (expiresAt) where status = OFFERED
```

**Invariants (enforced in transaction, not only UI):**

- At most **one** `OFFERED` row per `jobId` (single-cleaner Vermont Phase 1).
- At most **one** `ACCEPTED` row per `jobId`.
- Accept is allowed only if `status = OFFERED` and `expiresAt > now()` and `Job.assignedCleanerId IS NULL`.
- Customer `quotedTotal` / `totalPrice` / invoice totals are **not** stored on the offer and **not** returned on cleaner offer APIs.

### 2. Job columns (additive, nullable — no rewrite of historical rows)

| Column | Purpose |
|---|---|
| `dispatchUrgency` | `STANDARD` \| `SAME_DAY` \| `URGENT` (default `STANDARD`) |
| `startedAt` | Set when cleaner Start Job → `IN_PROGRESS` |
| `estimatedDurationMins` | Optional ops estimate (offer copies this) |

Do **not** add `REASSIGN_PENDING` to Prisma.  
Do **not** add `NEEDS_CLEANER` as a Job enum. Ops label **Cleaner needed** is derived:

`assignedCleanerId == null` AND no `JobOffer` with `status = OFFERED`.

### 3. `CleanPhoto` (additive)

| Column | Purpose |
|---|---|
| `category` | `BEFORE` \| `AFTER` \| `ISSUE` \| `DAMAGE` \| `SUPPLY` \| `OTHER` (default `OTHER`) |
| `customerVisible` | Boolean, default **false** |

Photos remain Job-owned operational evidence. Completion-report customer exposure stays on the **admin QC / billing** path, unchanged in Phase 1.

### 4. Audit

Write `AuditLog` for: offer created, sent, accepted, declined, expired, cancelled, assignment activated, job started, job completed, photos, issues, notes.

Also write `AssignmentLog` on **accept** (`ASSIGNED`) and **decline** (`DECLINED`) so the existing drawer timeline still works.

### 5. Compensation snapshot rule

Ops must enter an explicit cleaner pay snapshot before Send Offer:

- `compensationAmount` (required, positive)
- `compensationBasis` (`FLAT` | `HOURLY` | `OTHER`, default `FLAT`)

Preview may be suggested from `operationalTotal` via `calcPayout` — **never** from `quotedTotal` / `totalPrice`.

The cleaner **must** see this compensation on the offer (portal + email) before accept, along with service date/time, general location, estimated duration, and service type.

The cleaner must **never** see customer invoice total, quotedTotal, totalPrice, operational/platform margin, or customer billing details. Compensation is its own offer field and cannot be inferred from customer pricing.

---

## C. Proposed state machine

### Job (service)

```
RECEIVED / CONFIRMED  →  (offer outstanding; still unassigned)
       └─ accept  → ASSIGNED → ON_THE_WAY → IN_PROGRESS → AWAITING_QC → COMPLETED
Decline / expire / cancel offer → stay RECEIVED/CONFIRMED, assignedCleanerId null
Admin cancel job → CANCELLED (cancel open offer first)
```

Cleaner **Finish Job** sets `AWAITING_QC` + `submittedForQcAt`. It does **not** set `COMPLETED` or `completedAt`.

Admin QC (existing Mark Clean Complete / billing workflow) is the only path that sets `COMPLETED` and triggers invoice/customer completion actions.

`COMPLETED` cannot mean Submitted for QC: customer portal, billing invoice-ready, payout eligibility, loyalty, post-clean feedback, and reporting all treat `COMPLETED` as final business completion.

`isJobAssignable` remains the **only** gate for sending an offer. Accept **must not** set `Job.paymentStatus = PAID`. Accept is not customer price approval.

### Offer

```
          send offer
RECEIVED/CONFIRMED ──► OFFERED
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      ACCEPTED       DECLINED        EXPIRED
          │              │              │
          ▼              ▼              ▼
   activate assign   Cleaner needed  Cleaner needed
   Job ASSIGNED      (may re-offer)  (may re-offer)

Admin cancel outstanding: OFFERED → CANCELLED → Cleaner needed
```

Same-day / URGENT default `expiresAt = offeredAt + 30 minutes` (env `DISPATCH_OFFER_TTL_MINUTES_URGENT`, default 30).  
STANDARD default `DISPATCH_OFFER_TTL_MINUTES` (proposed 120).

### Single-cleaner race

Accept in a serializable transaction:

1. Lock job row.
2. Assert no `assignedCleanerId`.
3. Assert this offer is `OFFERED` and not expired.
4. Set offer `ACCEPTED`, job `assignedCleanerId` + `ASSIGNED` + `assignedAt`, upsert `JobTeamMember` (existing pattern).
5. Calendar sync **here** (same as today’s assign) — not at offer time. Do not change Calendar payload.

A second cleaner with a stale link gets 409.

---

## D. API changes

Feature flag: `DISPATCH_OFFERS_VERMONT=true` (or branch slug `vermont`). Other markets keep immediate assign until later phases.

### New

| Method | Path | Actor | Behavior |
|---|---|---|---|
| POST | `/api/admin/jobs/[jobId]/offers` | Admin | Create OFFERED if `isJobAssignable`; cancel none or reject if another OFFERED exists; notify cleaner |
| POST | `/api/admin/jobs/[jobId]/offers/[offerId]/cancel` | Admin | OFFERED → CANCELLED |
| GET | `/api/admin/jobs/[jobId]/offers` | Admin | History + countdown |
| GET | `/api/cleaner/offers` | Cleaner | Open offers for this cleaner (in addition to assigned jobs) |
| GET | `/api/cleaner/offers/[offerId]` | Cleaner | Offer payload (no customer price) |
| POST | `/api/cleaner/offers/[offerId]/accept` | Cleaner | Activate assignment |
| POST | `/api/cleaner/offers/[offerId]/decline` | Cleaner | Decline + reason |
| GET | `/api/cron/dispatch-offer-expire` | Cron | Expire OFFERED past `expiresAt`; admin `CLEANER_NO_RESPONSE`; job returns to Cleaner needed |

### Reuse / adjust (Vermont flag on)

| Existing | Change |
|---|---|
| `POST /api/admin/jobs/manual-assign` | Vermont: **409** with message to use Send offer (or thin wrapper that creates an offer). Do not silently assign. |
| `PATCH .../accept` | Vermont: if job unassigned, 409 “respond to offer”. After accept, existing ON_THE_WAY transition can remain as **Start travel** or stay combined — see F. |
| `PATCH .../start` | Set `startedAt` |
| `PATCH .../complete` | Set `completedAt`; compute `cleanDurationMins` from `startedAt`/`completedAt` if missing; **do not** call billing workflow |
| `PATCH .../decline` | Only for assigned jobs (post-accept walk-off). Pre-accept uses offer decline. |
| Photo sign/register | Require cleaner assignment **or** valid offer/session; set `category` |
| Auto-assign cron | Skip Vermont jobs when flag on (no immediate assign) |

### Offer JSON (cleaner) — allowed fields

jobReference, serviceType, serviceDate (UTC-safe `formatServiceDate`), preferredTime, address, estimatedDurationMins, compensationAmount, operationalNotes, expiresAt, property cleaner view (after accept, not necessarily on the unauthenticated email).

**Forbidden:** quotedTotal, totalPrice, invoice total, amountPaid, balanceDue, customer email/phone until accepted if product wants that delay — Phase 1: address is required to do the job; customer payment never.

---

## E. Admin UI changes

Primary: `app/admin/jobs/[jobId]/page.tsx` assignment card + `AssignCleanerModal`.

Replace Vermont **Assign** with **Send offer** (same cleaner list/scores).

Show a **Dispatch** panel:

| Derived UI state | When |
|---|---|
| Cleaner needed | Unassigned, no OFFERED |
| Offer sent to [name] | OFFERED |
| Awaiting response | OFFERED |
| Countdown / expiration | `expiresAt` |
| Accepted | ACCEPTED + assigned cleaner |
| Declined / Expired / Cancelled | Terminal offer rows |
| Assigned cleaner | `assignedCleanerId` |
| Cleaner compensation | Offer snapshot (or payout preview) |
| SAME_DAY / URGENT badge | `dispatchUrgency` |

Actions: Cancel offer; Send offer to another cleaner (only after cancel/expire/decline).

List/ops cards (`JobOperationsCard`): show Cleaner needed / Awaiting [name] / Assigned.

Do not add invoice totals to this panel. Do not mark job PAID from this panel.

---

## F. Cleaner portal changes

### Inbox

`/cleaner/jobs` lists:

1. **Offers** (OFFERED, not expired) — Accept / Decline
2. **Assigned work** (existing statuses)

Email deep-links to `/cleaner/jobs/[jobId]` which, if only an offer exists, renders the offer (login required). No magic-link Phase 1 (email login already exists). Do not depend on email alone: portal is the system of record.

### After accept — work order (reuse detail page)

- Property instructions (`toCleanerPropertyView`)
- Operational notes
- Compensation (snapshot)
- Start Job → persist `startedAt`
- Server-derived timer: `now - startedAt` until `completedAt`
- Checklist (existing)
- Photos with category chips; `customerVisible` default false; no customer gallery from this UI
- Flag issue (wire existing escalate)
- Cleaner notes (job-level or escalate notes — prefer a small `cleanerNotes` on complete payload stored on CompletionReport only at **admin QC**, or `AuditLog` in Phase 1 to avoid billing writes)
- Finish Job → `AWAITING_QC` + `submittedForQcAt` + duration; **not** `COMPLETED`, **not** `completedAt`. Admin QC is final completion.

Admin still runs existing Mark Clean Complete / billing panel for customer artifacts.

### Timer

Never browser-only. Display = `startedAt` … `completedAt` from API. Refresh from server.

---

## G. Notification design

| Event | Channel | Notes |
|---|---|---|
| Offer sent | Email (reuse `sendCleanerAssignmentEmail`, copy = **job offer**, include expiry + portal URL) | No invoice amount |
| Offer sent | AdminNotification `CLEANER_ASSIGNED` or new `CLEANER_OFFERED` | Prefer new type to avoid implying already assigned |
| Accepted | Existing `CLEANER_ACCEPTED` | |
| Declined | Existing `CLEANER_DECLINED` | |
| Expired | Existing `CLEANER_NO_RESPONSE` | Cron every 5 minutes for OFFERED, not daily |
| WhatsApp | **Not required for Vermont Phase 1** | Keep Jamaica path untouched |

In-app cleaner notifications: out of Phase 1 unless Prisma `Notification` is added; portal inbox is the in-app channel.

---

## H. Test plan

### Unit

- Offer create blocked when `!isJobAssignable` (PREPAY unpaid)
- Offer allowed for `INVOICE_AFTER_SERVICE` + `PENDING`
- Accept does not change `paymentStatus`
- Accept 409 if another accept won
- Expire sets EXPIRED, clears nothing on Job (already unassigned)
- `startedAt` / duration math
- Photo `customerVisible` defaults false
- Cleaner offer serializer omits price fields
- SAME_DAY default TTL 30 minutes

### Integration

- Send offer → email contains portal link and expiry, not $300/$337.80
- Accept → `assignedCleanerId`, ASSIGNED, calendar sync invoked (mock)
- Decline → job Cleaner needed, second offer to other cleaner
- Cancel offer → second offer allowed
- Cleaner complete does **not** create/send invoice
- Auto-assign cron skips flagged Vermont job with/without offer

### UI (browser, after implement)

- Admin countdown and cancel
- Cleaner accept/decline/start/photos/finish
- Host job: still assignable while unpaid

**Do not** use Chipman 0021/0022 as test jobs. Use a future Vermont host job or staging.

---

## I. Migration plan

1. Additive Prisma migration only (`JobOffer`, Job columns, `CleanPhoto.category` / `customerVisible`).
2. Backfill: `customerVisible = false`, `category = OTHER`, `dispatchUrgency = STANDARD`.
3. **No** updates to existing invoices, payments, or Chipman jobs.
4. Expand `AdminNotificationType` union in code (string column already).
5. Feature flag default **off** in production until acceptance plan passes on staging / a safe Vermont test job.

---

## J. Production acceptance plan

**Do not deploy with the first merge.** Sequence:

1. Staging (or production flag off) + migration apply.
2. Vermont test host job, **future date**, `INVOICE_AFTER_SERVICE`, payment `PENDING`.
3. Ops: set SAME_DAY, send offer to a **real Vermont cleaner** (or Brian test cleaner), confirm email + portal.
4. Expire path: short TTL test job → Cleaner needed → re-offer.
5. Happy path: accept → start (timestamp) → checklist → categorized photos → issue flag → finish. Confirm Job not PAID. Confirm no invoice auto-send.
6. Admin QC: existing complete/billing still works.
7. Confirm Calendar event created **on accept**, not on offer; event fields unchanged.
8. Confirm 0021/0022/0017 untouched (read-only fingerprint).
9. Then enable flag for Vermont only.

Rollback: flag off; open OFFERED rows can be cancelled by ops; Job assignment model remains valid.

---

## Implementation order (after approval)

1. Schema + offer domain (`lib/dispatch/jobOffer.ts`) + expire cron  
2. Admin send/cancel/UI  
3. Cleaner offer inbox + accept/decline  
4. `startedAt` + timer + photo categories + escalate UI  
5. Tests + staging gate  
6. Production flag  

**STOP.** Implementation is on `feat/cleaner-dispatch-phase1`. Do not push, migrate production, or deploy without approval. Production flag stays off until the acceptance runbook passes.
