# Incident #001 — Phase 1 Implementation Plan

**Status:** REVISED — **APPROVED AFTER REVISIONS** (conditional approval corrections incorporated); **no code authorized yet**  
**Parent spec:** `INCIDENT-001-safeguard-design-spec.md` (P0–P5 **APPROVED**)  
**Phase 1 scope:** P2 (partial), P4 (minimal — honest human gate), P5 (full) + completion workflow DRAFT-only  
**Phase 1 excludes:** P3 snapshots (Phase 2), `ReimbursementRequest` model (Phase 3), revision/supersede UI (Phase 4)

**Governing standard (do not lose sight of this):**

> Phase 1 does not need to solve the entire billing architecture. It **must** make it impossible to reproduce the known Incident #001 failure path — silent post-send mutation **and** an unresolved-reimbursement invoice leaving at `$300`.

---

## Review corrections incorporated (conditional approval)

The six material corrections from Phase 1 plan review are now folded into the tasks below:

| # | Area | Correction | Where |
|---|---|---|---|
| 1 | **P4 reimbursement gate** | C8 (math) **cannot** detect a known-but-unrecorded reimbursement when `job.totalPrice == invoice.total == $300`. Phase 1 no longer claims to solve this by math. Add a **human completeness assertion** at send time, persisted to `AuditLog`. | Task 2 · C8b |
| 2 | **Send atomicity** | Idempotent send: atomically claim the DRAFT (`WHERE id=? AND status='DRAFT'`) **before** mail dispatch; a concurrent second send returns conflict and never sends a second email. | Task 2 · Wire-up |
| 3 | **Due-date immutability** | Lock `dueDate` after SENT — it appears on the customer artifact. Term extensions are separate audit metadata, not silent mutation. | Task 1 |
| 4 | **Service-date comparison** | Do **not** use UTC-day equality. Compare service date as a date-only value (property/business timezone), not a UTC-converted timestamp. | Task 2 · C7 |
| 5 | **Customer/job consistency** | Validate customer identity (`customerId` when available; else normalized `clientEmail`/`clientName` fallback) before send. | Task 2 · C6b |
| 6 | **24-hour conflict** | C10 is a **warning requiring acknowledgement**, not a hard failure. Same property + same service date is the dangerous case → that is C9 (hard fail). | Task 2 · errors vs warnings |

**Schema reality (no migration in Phase 1):**
- `Invoice` has **no** `reimbursementsResolved` field → the human completeness assertion is captured from the send request and written to `AuditLog` (`action: 'INVOICE_SEND_REIMBURSEMENT_CONFIRMED'`). It is **not** persisted on the invoice.
- `AuditLog` exists (`actorId`, `actorRole`, `action`, `entityType`, `entityId`, `description`, `changes` Json) → real persistence, no `console`-only TODO.
- `Invoice` has `dueDate`, `customerId`, `clientEmail`, `clientName` → corrections 3 and 5 need no migration.

---

## Objective

Stop recurrence of Incident #001 failure modes **without schema migration**:

1. SENT invoices cannot have financial/identity/customer-artifact fields (incl. `dueDate`) mutated via API  
2. One centralized `validateInvoiceSendable()` gate before every send, split into **errors** (block) and **warnings** (require explicit acknowledgement)  
3. Send is **idempotent** — a DRAFT is atomically claimed before email; no double-send  
4. Job completion creates **DRAFT** invoice only — never auto-SENT @ `$300`  
5. A send requires an explicit **human reimbursement-completeness confirmation** (the only honest Phase 1 defense against the `0022 @ $300` failure), audited  
6. Tests prove **$300 → $500.63 silent mutation**, **post-SENT PATCH**, **unresolved-reimbursement send**, and **concurrent double-send** are all blocked  

---

## New module layout

```
lib/invoices/
  invoiceImmutability.ts      # isSentInvoice(), assertInvoiceDraftEditable(), field guards
  validateInvoiceSendable.ts  # P5 gate + minimal P4 checks
  __tests__/
    invoiceImmutability.test.ts
    validateInvoiceSendable.test.ts
    invoiceSendGuard.integration.test.ts   # route-level mocks
```

---

## Task 1 — Invoice immutability helpers (P2)

**Owner:** Engineering  
**Files:** new `lib/invoices/invoiceImmutability.ts`

### Deliverables

1. **`isAccountingLocked(invoice)`** — `true` when:
   - `status` ∈ `{ SENT, PARTIALLY_PAID, PAID, OVERDUE }`, OR
   - `sentAt != null` (belt-and-suspenders for legacy rows)

2. **`assertInvoiceDraftEditable(invoice, patch: UpdateBody)`** — throws `InvoiceImmutableError` (code `INVOICE_IMMUTABLE`) if patch touches locked fields on a locked invoice.

3. **Locked customer-facing fields** (reject PATCH once accounting-locked) — this is the immutable customer artifact:
   - `invoiceNumber`
   - `jobDate`
   - `dueDate` — **now locked** (correction #3: appears on the customer PDF; term extensions are separate audit metadata/communication, never a silent field edit)
   - `propertyAddress`
   - `clientName`, `clientEmail`
   - `serviceType`
   - `items` (any replacement/add/delete)
   - `subtotal`, `tax`, `discount`, `total` (direct or via items)
   - `status` changes **to** DRAFT or **from** SENT back to editable

4. **Allowed on locked invoice:**
   - `notes` — **only** if genuinely internal-only and never rendered on the customer artifact; must not alter the historical customer snapshot
   - Payment paths (unchanged — `recordInvoicePayment`)
   - A payment-term extension is recorded as **audit metadata** (`AuditLog`), not by mutating `dueDate`

### Wire-up (Task 1b)

**File:** `app/api/admin/invoices/[id]/route.ts`

- At top of `PATCH`: if `isAccountingLocked(existing)` → call `assertInvoiceDraftEditable`
- Return **409** `{ code: 'INVOICE_IMMUTABLE', error: '...', hint: 'Use revision invoice (Phase 4)' }`

**File:** `lib/billing/jobBillingSteps.ts` — `generateInvoiceFromJob` update path (if any) — same guard.

### Acceptance criteria

- [ ] PATCH with new `items` on SENT invoice → **409**
- [ ] PATCH `dueDate` on SENT invoice → **409** (correction #3)
- [ ] PATCH `notes` only on SENT invoice → **200** (internal-only)
- [ ] PATCH on DRAFT invoice → unchanged behavior
- [ ] CANCELLED still blocked (existing)

---

## Task 2 — `validateInvoiceSendable()` (P5 + minimal P4)

**Owner:** Engineering  
**Files:** new `lib/invoices/validateInvoiceSendable.ts`

### Signature

The result separates **errors** (cannot send) from **warnings** (require explicit admin acknowledgement) — correction #6. A send is refused if there are any unacknowledged errors **or** any unacknowledged warnings.

```ts
export type InvoiceSendFinding = { code: string; message: string };

export type InvoiceSendValidationResult =
  | { ok: true; warnings: InvoiceSendFinding[] } // warnings all acknowledged (or none)
  | { ok: false; errors: InvoiceSendFinding[]; warnings: InvoiceSendFinding[] };

export async function validateInvoiceSendable(
  invoiceId: string,
  options?: {
    // Human completeness assertion — REQUIRED to pass C8b (P4 honest gate)
    reimbursementsConfirmed?: boolean;
    // Narrowly-scoped warning acknowledgements (see override scope below)
    acknowledgeWarnings?: string[]; // list of warning codes admin explicitly accepted
    adminUserId?: string;
  }
): Promise<InvoiceSendValidationResult>;
```

### Errors (block send — never overridable)

These represent broken accounting or identity. **No override path exists** for any of them (correction: an admin must not be able to override broken accounting arithmetic).

| ID | Check | Error code |
|---|---|---|
| C1 | Invoice exists | `INVOICE_NOT_FOUND` |
| C2 | Status is **DRAFT** only (also enforces idempotency at validation time) | `INVOICE_NOT_DRAFT` |
| C3 | `items.length >= 1` | `INVOICE_NO_LINE_ITEMS` |
| C4 | `sum(lineTotals) === invoice.total === invoice.subtotal` (tax/discount 0 Phase 1) | `INVOICE_TOTAL_MISMATCH` |
| C5 | `clientEmail` present | `INVOICE_NO_CLIENT_EMAIL` |
| C6 | If `jobId`: `invoice.propertyAddress` matches job `address` (normalized trim/lowercase) | `INVOICE_JOB_PROPERTY_MISMATCH` |
| **C6b** | **Customer identity** (correction #5): if `job.customerId` and `invoice.customerId` both present they must match; else fall back to normalized `clientEmail` (preferred) or `clientName` equality against the job's customer | `INVOICE_CUSTOMER_MISMATCH` |
| C7 | If `jobId`: service **date-only** equality — compare `invoice.jobDate` and `job.preferredDate` as calendar dates in the property/business timezone (VT), **not** UTC-day equality (correction #4) | `INVOICE_JOB_DATE_MISMATCH` |
| C9 | No other **SENT/PARTIALLY_PAID/OVERDUE** invoice for same `customerId` (or email fallback) + normalized property + **same service date** (exclude self) — the true duplicate-turnover condition | `INVOICE_DUPLICATE_SERVICE` |
| **C8b** | **Reimbursement completeness assertion** (P4 honest gate, correction #1): `options.reimbursementsConfirmed === true` is REQUIRED. This is the human confirmation that *"all known reimbursements/purchases/errands/approved add-ons are represented as invoice lines, OR no reimbursable expenses exist."* | `INVOICE_REIMBURSEMENTS_UNCONFIRMED` |
| C8a-number | Invoice-number identity conflict (another invoice already owns this `invoiceNumber`) — never overridable | `INVOICE_NUMBER_CONFLICT` |

### Warnings (require explicit acknowledgement — narrowly overridable)

Legitimate-but-suspicious conditions. A send proceeds only if every raised warning code is present in `options.acknowledgeWarnings`. Overrides are **scoped to these codes only**.

| ID | Check | Warning code |
|---|---|---|
| C8 | If `jobId`: `decimalToNumber(job.totalPrice ?? job.quotedTotal) !== invoice.total` (a legitimate reason exists — e.g. reimbursements added — so it is not a hard error) | `INVOICE_JOB_TOTAL_MISMATCH` |
| C10 | Another invoice to same customer+property with `sentAt` within 24h **but NOT same service date** (two legitimate turnovers can be invoiced close together — correction #6) | `INVOICE_RECENT_SEND_CONFLICT` |

> **Why C8 is a warning, not the reimbursement gate:** C8 detects a total *difference*; it can never detect a *missing* reimbursement when `job.totalPrice == invoice.total == $300`. That gap is exactly how `0022` left at `$300`. Only the human assertion **C8b** closes it in Phase 1.

**Override scope (explicit):** `acknowledgeWarnings` may only cover `INVOICE_JOB_TOTAL_MISMATCH` and `INVOICE_RECENT_SEND_CONFLICT`. It can **never** bypass C1, C2, C3, C4, C5, C6, C6b, C7, C8b, C8a-number, or C9. Every acknowledged warning is written to `AuditLog`.

**Audit on send:** on a successful send, write `AuditLog` rows for `INVOICE_SEND_REIMBURSEMENT_CONFIRMED` (with `adminUserId`) and one per acknowledged warning (`action: 'INVOICE_SEND_WARNING_ACK'`, `changes: { code }`).

### Wire-up (Task 2b) — idempotent send (correction #2)

**File:** `app/api/admin/invoices/[id]/send/route.ts`

Replace bare `update({ status: 'SENT' })` with an atomic claim-then-email sequence:

1. Read `body`: `{ reimbursementsConfirmed?: boolean; acknowledgeWarnings?: string[] }`  
2. Load invoice + items + job  
3. `validateInvoiceSendable(id, { reimbursementsConfirmed, acknowledgeWarnings, adminUserId })`  
4. If `!ok` → **400** `{ errors, warnings }`; if `ok` but unacknowledged warnings remain → **409** `{ warnings }` (client must re-submit with acknowledgements). **No email sent.**  
5. **Atomic claim (idempotency):** `prisma.invoice.updateMany({ where: { id, status: 'DRAFT' }, data: { status: 'SENT', sentAt: new Date() } })`.  
   - If `count === 0` → another request already claimed it → return **409** `INVOICE_ALREADY_SENT`; **do not** send a second email.  
   - Only the request whose `updateMany` returned `count === 1` proceeds to dispatch email.  
6. **Failure recovery (defined):** if email dispatch throws *after* a successful claim, the invoice stays SENT (it is now an accounting artifact); record `AuditLog` `INVOICE_SEND_EMAIL_FAILED` and surface a **retry-email** action (email resend does **not** re-run the claim, so it cannot double-send). Do **not** silently roll SENT back to DRAFT — that would reopen the mutation window.  

**File:** `lib/billing/jobBillingSteps.ts` — `sendLinkedInvoiceForJob` → same validator + same atomic-claim pattern.

### Acceptance criteria

- [ ] DRAFT with items summing to total + `reimbursementsConfirmed: true` → **pass**  
- [ ] DRAFT `$300`, job `$300`, `reimbursementsConfirmed` omitted/false → **fail** C8b (`INVOICE_REIMBURSEMENTS_UNCONFIRMED`) — *this is the Incident #001 failure path*  
- [ ] DRAFT `$500.63`, job `$300`, `reimbursementsConfirmed: true`, no ack → **409** warning C8; with `acknowledgeWarnings:['INVOICE_JOB_TOTAL_MISMATCH']` → **pass** + audit  
- [ ] Attempt to acknowledge/override C4 arithmetic mismatch → **still fails** (not in override scope)  
- [ ] Second invoice, same customer+property+**same service date**, first SENT → **fail** C9  
- [ ] Concurrent double-send of one DRAFT → exactly one email; second returns **409** `INVOICE_ALREADY_SENT`  

---

## Task 3 — Completion workflow: DRAFT only (P4/P5)

**Owner:** Engineering  
**Files:** `lib/billing/jobCompletionWorkflow.ts`, optionally `lib/billing/jobBillingSteps.ts`

### Current behavior (remove)

```ts
// jobCompletionWorkflow.ts ~L167-168
status: balanceDue <= 0 ? 'PAID' : 'SENT',
sentAt: balanceDue <= 0 ? null : new Date(),
```

And email block ~L203-210 sends invoice immediately after create.

### Target behavior

1. On job complete, if no invoice: create with **`status: 'DRAFT'`**, **`sentAt: null`**
2. **Do not** call `sendInvoiceSentEmail` from completion workflow  
3. Return `{ invoice, created: true, sendDeferred: true }` in workflow result (extend type)  
4. Admin notification message: *"Invoice draft created — add reimbursements and send from Invoices"*  
5. If `balanceDue <= 0` (prepaid): still DRAFT or auto-PAID? **Decision (approved):** Phase 1 → **PAID** only when `balanceDue <= 0` at create **and** the underlying accounting treatment is already valid (payment recorded / prepaid) — no collection email needed; otherwise **DRAFT**

### Secondary path

**File:** `lib/billing/jobBillingSteps.ts` — `generateInvoiceFromJob`

- Already creates **DRAFT** — verify unchanged  
- Ensure callers cannot skip to send without validator  

### Admin UX (Task 3b — minimal)

**File:** `components/admin/jobs/JobOperationsCard.tsx` or invoice admin UI

- Show banner when linked invoice is DRAFT: *"Add line items / reimbursements, then Send"*  
- **Send dialog must include a required confirmation checkbox** wired to `reimbursementsConfirmed` (C8b): *"I confirm all reimbursable expenses have been added, or none exist."* Send stays disabled until checked.  
- When the API returns **409 warnings** (C8/C10), surface each warning with an explicit "Acknowledge and send anyway" affordance that submits `acknowledgeWarnings`. **Never** render an override affordance for error-class findings.  
- (Full UI polish optional in Phase 1; API behavior is the critical path — but the C8b checkbox is **not** optional)

### Acceptance criteria

- [ ] Job complete with `sendEmails: true` → completion report email **may** send; invoice email **does not**  
- [ ] New invoice after complete → `status === 'DRAFT'`, `sentAt === null`  
- [ ] Invoice sends only via explicit Send action passing `validateInvoiceSendable`

---

## Task 4 — Test suite (incident regression)

**Owner:** Engineering  
**Files:** `lib/invoices/__tests__/*.test.ts`, optional route tests mirroring `app/api/customer/properties/__tests__/route.test.ts` pattern

### 4a — Immutability tests

| Test | Setup | Assert |
|---|---|---|
| `blocks PATCH items on SENT invoice` | Mock prisma SENT + items | 409 `INVOICE_IMMUTABLE` |
| `allows PATCH notes on SENT invoice` | SENT invoice | 200, notes updated |
| `allows full PATCH on DRAFT` | DRAFT | 200 |

### 4b — Validation tests

| Test | Setup | Assert |
|---|---|---|
| `rejects send when items sum ≠ total` | DRAFT, total 300, lines sum 337.80 | error C4 (never overridable) |
| `rejects arithmetic override attempt` | C4 failing + `acknowledgeWarnings:['INVOICE_TOTAL_MISMATCH']` | **still fails** — C4 not in override scope |
| `warns when job total ≠ invoice total` | job $300, invoice $500.63, `reimbursementsConfirmed:true` | 409 warning C8; passes once acknowledged |
| `rejects due-date edit after send` | SENT invoice, PATCH `dueDate` | 409 `INVOICE_IMMUTABLE` |
| `rejects customer mismatch` | job customer ≠ invoice customer/email | error C6b |
| `service-date compare is timezone-safe` | invoice/job evening timestamps that differ by UTC day but same VT date | **no** C7 failure (date-only, VT tz) |
| `rejects duplicate property+same-date send` | existing SENT same service date | error C9 |
| `nearby-but-different-date send is a warning` | prior send within 24h, different service date | warning C10, not a hard fail |

### 4c — Incident #001 regression (critical — must prove the failure path is dead)

| Test | Narrative | Assert |
|---|---|---|
| **`chipman-0022-unresolved-reimbursement-blocked`** *(mandatory)* | Job total `$300`, invoice `$300`, line items = turnover only, ops reimbursement unresolved (`reimbursementsConfirmed` not asserted) | **SEND BLOCKED** — error C8b `INVOICE_REIMBURSEMENTS_UNCONFIRMED`. This is the principal customer-facing failure; without this test Phase 1 is not proven. |
| **`concurrent-send-is-idempotent`** *(mandatory)* | Two Send requests for the same DRAFT arrive nearly simultaneously | **Exactly one** email dispatched; the loser gets 409 `INVOICE_ALREADY_SENT` |
| **`chipman-0022-scenario`** | Complete job → DRAFT $300 → add keys/errand → total $337.80 → `reimbursementsConfirmed:true` → send | Customer receives **$337.80** only after send; no email at $300 |
| **`chipman-silent-mutation-blocked`** | SENT invoice $300 → PATCH items → $500.63 | **409** — cannot reproduce DB/email divergence |
| **`completion-no-auto-send`** | `runJobCompletionBillingWorkflow` mocked | `sendInvoiceSentEmail` **not called**; invoice DRAFT |

### 4d — Integration smoke

- `POST /api/admin/invoices/[id]/send` with vitest mocks for prisma + email  
- Verify send route calls validator before the atomic claim, and that the claim (`updateMany … WHERE status='DRAFT'`) gates the email  

### Acceptance criteria

- [ ] All 4c tests pass — **including the two mandatory tests** (`chipman-0022-unresolved-reimbursement-blocked`, `concurrent-send-is-idempotent`)  
- [ ] `npm test` / focused vitest run documented in PR  
- [ ] No test asserts Phase 2 snapshot behavior (deferred)

---

## Task 5 — Ops interim checklist (P0, no code)

**Owner:** Operations  
**Deliverable:** One-page ops runbook until Phase 1 deploys

1. Never issue VM-#### on manual PDF without creating platform DRAFT first  
2. Never send invoice until all reimbursement lines are on the DRAFT  
3. Never edit line items **or due date** after customer received email — call engineering for revision (Phase 4)  
4. Before send: confirm total matches receipts  
5. At send, actively confirm the completeness assertion: *"I confirm all reimbursable expenses have been added, or none exist."* (this is the interim human control that becomes C8b once Phase 1 ships)  

---

## Implementation sequence (when code authorized)

```
1. Task 1  invoiceImmutability.ts + PATCH guard
2. Task 2  validateInvoiceSendable.ts
3. Task 2b wire send route + sendLinkedInvoiceForJob
4. Task 3  completion workflow DRAFT-only
5. Task 4  tests (write alongside 1–3)
6. npm test + scoped lint + build
7. PR review → code authorization
```

**Estimated touch surface:** ~6 files modified, ~4 files new, ~0 migrations.

---

## Authorization gate (explicit)

| Milestone | Authorized? |
|---|---|
| P0–P5 design | ✅ Approved |
| This Phase 1 plan | ✅ **Approved after revisions** (six corrections incorporated) |
| Write code (Tasks 1–4) | ✅ **AUTHORIZED — implemented** (see status below) |
| Phase 1 send UI | ✅ **AUTHORIZED in same PR — implemented** (operator surface for the API gate) |
| Deploy | ⛔ Not yet — **READY FOR DEPLOY-AUTHORIZATION REVIEW** (see Deploy Readiness Evidence below); production frozen |
| Chris reconciliation email | 🔒 Held — after deploy OR ops runbook active + statement finalized |

**Production code: 🔒 FROZEN (not deployed). Client reconciliation: 🔒 HELD.**

---

## Implementation status (Tasks 1–4 complete — awaiting deploy review)

| Task | Files | Status |
|---|---|---|
| 1 — Immutability (P2) | `lib/invoices/invoiceImmutability.ts` (new) · `app/api/admin/invoices/[id]/route.ts` (PATCH guard → 409 `INVOICE_IMMUTABLE`, incl. `dueDate` lock) | ✅ |
| 2 — Send gate (P5 + honest P4) | `lib/invoices/validateInvoiceSendable.ts` (new; pure `evaluateInvoiceSendable` + DB loader) · `lib/dates/serviceDate.ts` (added `businessDateKey`/`isSameServiceDay` for C7) · `app/api/admin/invoices/[id]/send/route.ts` (validator + atomic claim + audit + email-failure recovery) · `lib/billing/jobBillingSteps.ts` `sendLinkedInvoiceForJob` + `app/api/admin/jobs/[jobId]/billing/route.ts` (same gate) | ✅ |
| 3 — Completion DRAFT-only | `lib/billing/jobCompletionWorkflow.ts` (creates DRAFT; prepaid $0 → PAID; no auto-send; `invoiceSendDeferred` flag + ops notification) | ✅ |
| 4 — Tests (incl. 2 mandatory) | `lib/invoices/__tests__/invoiceImmutability.test.ts` · `validateInvoiceSendable.test.ts` · `invoiceSendGuard.integration.test.ts` · `app/api/admin/invoices/[id]/__tests__/route.immutability.test.ts` · `app/api/admin/invoices/__tests__/route.create.test.ts` · `lib/billing/__tests__/jobCompletionWorkflow.noAutoSend.test.ts` | ✅ 39 tests pass |

| 5 — Send UI (same PR) | `components/admin/invoices/SendInvoiceDialog.tsx` (new) wired into `app/admin/invoices/[id]/page.tsx`, `app/admin/invoices/[id]/edit/page.tsx`, `components/admin/jobs/JobBillingWorkflowPanel.tsx` · closed a PATCH bypass (`status→SENT` escalation now 400 `INVOICE_STATUS_TRANSITION_BLOCKED`) · added optional audited `acknowledgeWarningReasons` to send paths | ✅ |

### Send UI scope (narrow, matches API contract)

- Required checkbox → `reimbursementsConfirmed` (C8b): *"I confirm all known reimbursements, purchases, errands, and approved add-ons have been added to this invoice, or none exist."* Send is disabled until checked.
- Warning acknowledgement area appears only for the two overridable warnings the API returns (`INVOICE_JOB_TOTAL_MISMATCH`, `INVOICE_RECENT_SEND_CONFLICT`); each requires a **reason** before it can be acknowledged. Reasons are sent as optional `acknowledgeWarningReasons` and written to `AuditLog` (no schema change).
- Hard validation errors are displayed read-only with **no override control**.
- No Phase 2/3 concepts: no schema changes, no revision UI, no reimbursement entity.
- The three send surfaces (invoice detail, invoice edit "Save & mark sent", job billing panel) all route through the same dialog + gate. Direct `status→SENT` PATCH is now blocked so issuing always goes through the gate.

**Verification:** full suite `263 passed` across 34 suites. **1 pre-existing, unrelated suite failure**: `services/payout/__tests__/evaluatePayout.test.ts` fails to load because it never imports vitest globals (`describe is not defined`) — it lives in `services/payout`, was not touched by this work, and is not part of Incident #001. `tsc --noEmit`: zero new errors in any touched file (the repo's ~990 baseline errors are pre-existing under `strict:false` + `ignoreBuildErrors:true`). Lint clean on all touched files.

**Approval standard for this PR:** *all Incident #001 tests pass, touched files are type/lint clean, and no new regression is introduced* — not "the entire legacy repo becomes clean."

**PR evidence mapped to the three deploy-review requirements:**
- *Cannot reproduce `$300 → $500.63/$337.80` silent divergence* → `route.immutability.test.ts` (`chipman-silent-mutation-blocked`, PATCH items on SENT → 409) + `invoiceSendGuard.integration.test.ts` (`chipman-0022-unresolved-reimbursement-blocked`, C8b hard block).
- *Concurrent second send cannot dispatch another email* → `invoiceSendGuard.integration.test.ts` (`concurrent-send-is-idempotent`, exactly one email; loser → 409 `INVOICE_ALREADY_SENT`).
- *SENT invoice cannot be financially/identity-mutated through any known path* → `invoiceImmutability.test.ts` + PATCH route guard (incl. `dueDate`), applied at the only write paths.

**UI note:** the send-dialog is now included in this same PR (Task 5 above) — `reimbursementsConfirmed` checkbox + warning acknowledgement with required reasons. The API remains the real enforcement (it refuses to send without confirmation regardless of UI); the dialog just prevents operators from hitting a bare hard-refusal.

---

## Deploy Readiness Evidence (closure review — Aug 25, 2026)

**Status: READY FOR DEPLOY-AUTHORIZATION REVIEW** — production remains 🔒 FROZEN (not deployed).

### Implementation status
Tasks 1–5 complete. One additional send-path bypass was **discovered and closed during this review** (see below).

### Bypass discovered & closed in this review
`POST /api/admin/invoices` (manual invoice create) accepted `markSent:true` and would set `status:'SENT'` + `sentAt` and call `sendInvoiceSentEmail` **without** `validateInvoiceSendable()` — the same ungated create-and-send that produced the manual invoice 0017 ($500.63). Fixed:
- `app/api/admin/invoices/route.ts` POST now **always** creates a `DRAFT` (never `SENT`, never `sentAt`, never emails). `markSent` no longer issues.
- `app/admin/invoices/new/page.tsx` "Save & mark sent" now creates the DRAFT, then routes the send through the shared `SendInvoiceDialog` → gated `/[id]/send` (mirrors the edit page).
- New regression test `app/api/admin/invoices/__tests__/route.create.test.ts` proves create-with-`markSent` persists `DRAFT`/`sentAt:null`.

### Every invoice-issue / `sentAt` write path (audit)
| Path | Behavior | Gated? |
|---|---|---|
| `POST /api/admin/invoices/[id]/send` | validate → atomic DRAFT claim → email | ✅ gate + idempotent claim |
| `sendLinkedInvoiceForJob` (job billing) | same gate + claim | ✅ |
| `POST /api/admin/invoices` (manual create) | DRAFT only, no email | ✅ (issuing forced through `/send`) |
| `generateInvoiceFromJob` | DRAFT only | ✅ |
| `jobCompletionWorkflow` | DRAFT only (prepaid $0 → PAID); no auto-send; no `sentAt` | ✅ |
| `PATCH /api/admin/invoices/[id]` | immutability guard + `status→issued` blocked (400) | ✅ |
| `cancel` route | `CANCELLED` only | n/a (non-send) |
| `invoice-reminders` cron | sets `reminderSentAt` only, for already-issued invoices | n/a (non-send) |
| `recordInvoicePayment` / `refreshInvoiceStatus` | payment-driven status; `refresh` never escalates DRAFT | n/a (non-send accounting; see risk R3) |

The `SENT`/`sentAt` matches in `jobCompletionWorkflow.ts:203/312` and `jobBillingSteps.ts:276/527` write **CompletionReport / Receipt / ReviewRequest**, not Invoice.

### Test counts
- Focused Incident #001 suites: **39 passed** (6 files).
- Full suite: **263 passed** across 34 suites; **1 pre-existing unrelated suite failure** (see baseline).

### Critical regression evidence (control → test)
| Control | Test | Result |
|---|---|---|
| chipman-0022-unresolved-reimbursement-blocked | `invoiceSendGuard.integration.test.ts` + `validateInvoiceSendable.test.ts` (C8b) | ✅ |
| chipman-silent-mutation-blocked | `route.immutability.test.ts` (items on SENT → 409) | ✅ |
| concurrent-send-is-idempotent | `invoiceSendGuard.integration.test.ts` (1 email; loser → 409) | ✅ |
| completion-no-auto-send | `jobCompletionWorkflow.noAutoSend.test.ts` | ✅ |
| direct status-escalation blocked | `route.immutability.test.ts` (DRAFT→SENT PATCH → 400) | ✅ |
| create-and-send bypass blocked | `route.create.test.ts` (markSent → DRAFT) | ✅ |
| due-date mutation blocked | `invoiceImmutability.test.ts` + `route.immutability.test.ts` (dueDate on SENT → 409) | ✅ |
| customer/job mismatch blocked | `validateInvoiceSendable.test.ts` (C6b) | ✅ |
| service-date timezone-safe | `validateInvoiceSendable.test.ts` (VT-day vs UTC-day) + `serviceDate.test.ts` | ✅ |
| hard-error override denied | `validateInvoiceSendable.test.ts` (C4 cannot be acknowledged away) | ✅ |
| allowed warning ack succeeds (+ audit) | `validateInvoiceSendable.test.ts` (C8/C10 warnings) + send route `logAuditEntry` | ✅ |

### Lint / type / build
- **Lint:** clean on all touched files.
- **TypeScript (`tsc --noEmit`):** no new errors in any touched file. One **pre-existing** error remains in a touched file — `app/api/admin/invoices/route.ts` GET `invoices.map(serializeInvoice)` overload mismatch (the documented `serializeInvoice` baseline issue; it only shifted line 74→73 because an import line was removed). Not introduced by and unrelated to Incident #001; intentionally not "cleaned up." Repo carries a large `strict:false` baseline of pre-existing errors.
- **Production build (`npm run build`):** ✅ compiled successfully, 151 static pages generated; all invoice routes present.

### Known unrelated baseline failure
`services/payout/__tests__/evaluatePayout.test.ts` — `ReferenceError: describe is not defined` (never imports vitest globals). Not touched by this diff, unrelated to Incident #001.

### Files changed (Incident #001 only)
Code (modified): `app/api/admin/invoices/route.ts`, `app/api/admin/invoices/[id]/route.ts`, `app/api/admin/invoices/[id]/send/route.ts`, `app/api/admin/jobs/[jobId]/billing/route.ts`, `app/admin/invoices/new/page.tsx`, `app/admin/invoices/[id]/page.tsx`, `app/admin/invoices/[id]/edit/page.tsx`, `components/admin/jobs/JobBillingWorkflowPanel.tsx`, `lib/billing/jobBillingSteps.ts`, `lib/billing/jobCompletionWorkflow.ts`, `lib/dates/serviceDate.ts`.
Code (new): `lib/invoices/invoiceImmutability.ts`, `lib/invoices/validateInvoiceSendable.ts`, `components/admin/invoices/SendInvoiceDialog.tsx`.
Tests (new): `lib/invoices/__tests__/{invoiceImmutability,validateInvoiceSendable,invoiceSendGuard.integration}.test.ts`, `app/api/admin/invoices/[id]/__tests__/route.immutability.test.ts`, `app/api/admin/invoices/__tests__/route.create.test.ts`, `lib/billing/__tests__/jobCompletionWorkflow.noAutoSend.test.ts`.
Docs: `docs/incidents/INCIDENT-001-*.md`.

- **Migrations:** none.
- **Production data changed:** no.
- **Deployed:** no.
- **Customer contacted:** no.

### Remaining known risks (non-blocking; none reproduce the Incident #001 failure path)
- **R1** — Warning-acknowledgement reason is enforced in the UI but is **audit-only** server-side (a raw API client could acknowledge a warning with a null reason). Errors remain non-overridable regardless. Candidate for server-side hardening.
- **R2** — Duplicate-service detection (C9) matches property by normalized string equality; differently-formatted addresses for the same property could evade C9. C8b (human confirmation) + immutability remain the primary controls.
- **R3** — `recordInvoicePayment` escalates a `DRAFT`→`SENT` as a payment side-effect (no customer email) without the C8b reimbursement gate. Pre-existing, non-send; flagged for Phase 2 (should recording payment on an un-reviewed draft require the completeness assertion?).
- **R4** — Generic 500 handlers return `error.message`; consistent with the rest of the codebase, no secrets exposed by the invoice paths.

---

## Ops questions (parallel — blocks client comms only)

| # | Question | Owner | Answer |
|---|---|---|---|
| O1 | Who created manual VM-2026-0017 PDF (Aug 22)? | Ops | _pending_ |
| O2 | Who edited 0021/0022 after send; when? | Ops / Engineering audit | _pending_ |
| O3 | Aug 23 receivables beyond $37.80 (keys+errand)? | Ops + receipts | _pending_ |

---

## Phase 2 preview (not in this plan)

- P3: `InvoiceSentSnapshot` table + PDF hash storage  
- P4 full: `ReimbursementRequest` model  
- P4/P2: Revision + supersede invoice API + admin UI  

---

*Phase 1 plan — Incident #001 — production code remains frozen until code authorization row signed.*
