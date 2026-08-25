# Incident #001 — Invoice Safeguard Design Spec (P0–P5)

**Status:** **APPROVED** — Phase 1 planning authorized; production code **FROZEN**  
**Scope:** Chipman Park billing failure; platform-wide invoice integrity  
**Production code:** **FROZEN** until this spec is approved  
**Prerequisite for:** Chris reconciliation email + statement of account  

---

## Core principle

> **A sent invoice is an accounting artifact, not a live database view.**

Once an invoice reaches **SENT**, VelocityMaid preserves exactly what the customer received: **number, line items, total, service date, sent timestamp, PDF snapshot, recipient**. Any later financial change produces a **revision or superseding document** — never a silent rewrite of history.

---

## Current gaps (why Incident #001 happened)

| Gap | Today | Incident symptom |
|---|---|---|
| Manual numbers | PDFs can use VM-#### outside `Invoice` table | Customer got **0017**; DB used **0021** for same $500.63 |
| Send before complete | Completion workflow can **SENT @ $300** immediately | Chris received **$300**; DB later **$500.63** / **$337.80** |
| Post-send mutation | `PATCH /api/admin/invoices/[id]` edits **SENT** invoices (only CANCELLED blocked) | Email PDF ≠ final DB |
| No sent snapshot | No stored artifact of what was emailed | Disputes unresolvable |
| No reimbursement gate | Line items added ad hoc after create | Errands/reimbursements not in customer PDF |
| No pre-send bundle | Send route flips status only | Duplicate/conflicting sends undetected |

---

## P0 — No manual invoice numbers outside the platform

**Rule:** A customer-facing **VM-YYYY-####** may only exist if reserved in the shared ledger and bound to an `Invoice` row **before** PDF generation or email.

**Requirements:**

1. All invoice PDFs and emails render from platform data (`Invoice` + `InvoiceItem`), not standalone Word/templates with hand-typed numbers.
2. Number allocation uses existing `allocateUniqueInvoiceNumber` / `nextVmReference` — checks both `Job.jobReference` and `Invoice.invoiceNumber`.
3. Ops interim (until P1–P3 ship): **checklist** — no manual VM numbers; create DRAFT in admin → add lines → send from platform only.

**Acceptance:** Impossible to email a VM number with no corresponding `Invoice.id` (enforced in P3 send gate).

---

## P1 — One invoice number = one immutable identity

**Rule:** Each **VM-YYYY-####** maps to exactly one `Invoice.id` for the life of the system.

**Requirements:**

1. `Invoice.invoiceNumber` remains `@unique`; number assigned at DRAFT create, **never reassigned**.
2. Job-linked invoices reuse `job.jobReference` only when that reference is already bound to this invoice (existing `nextInvoiceNumber(jobReference)` pattern).
3. If manual/off-platform number was used historically (0017), correction is via **supersede/credit**, not renumbering the DB row.
4. Admin UI shows **number + invoice id + status**; warn if job reference exists without invoice or vice versa.

**Acceptance:** Query `Invoice` by number returns ≤1 row; no second receivable can claim the same number.

---

## P2 — SENT invoices cannot silently mutate

**Rule:** After first successful send, financial and identity fields on the invoice are **immutable**.

**Immutable after SENT** (block on `PATCH`, admin UI read-only):

- `invoiceNumber`, `jobDate`, `propertyAddress`, `clientName`, `clientEmail`
- All `InvoiceItem` rows (description, qty, unit price, line total)
- `subtotal`, `tax`, `discount`, `total` (except via payment-driven `amountPaid` / `balanceDue` / status derivation)

**Allowed after SENT:**

- `notes` (internal only — must not appear on customer PDF retroactively)
- Payment recording, reminders, status transitions (PAID, OVERDUE)
- Linking audit metadata

**Correction path:** **Revision invoice** or **credit memo + new invoice** with explicit `supersedesInvoiceId` / `revisionOfInvoiceId` and customer notification.

**Acceptance:** Attempt to change line items on SENT invoice returns **409** with message directing to revision flow.

---

## P3 — Sent PDF snapshot must equal DB at send time

**Rule:** At send, rendered PDF total and line items must match DB; that exact payload is frozen.

**Requirements:**

1. **Pre-send render check:** Build PDF (or canonical JSON) from current DB → assert `sum(items) === invoice.total === renderedTotal`.
2. **Persist snapshot** on send (new fields or `InvoiceSentSnapshot` table):
   - `sentAt`, `sentToEmail`
   - `snapshotJson` (line items, totals, service date, number)
   - `snapshotPdfUrl` or `snapshotPdfHash` (storage TBD)
3. Customer portal / dispute view reads **snapshot** for SENT invoices, not live editable rows.
4. Completion workflow (`runJobCompletionBillingWorkflow`) creates **DRAFT** only — never auto-SENT until P4 + P5 pass.

**Acceptance:** For any SENT invoice, `snapshot.total ===` amount shown in archived PDF; reproducible from stored snapshot.

---

## P4 — Reimbursement gate before send

**Rule:** Invoice cannot transition **DRAFT → SENT** while known reimbursable items are unresolved.

**Requirements:**

1. **Phase 1 (minimal):** Send blocked if `invoice.total !== sum(invoice.items)` OR `items.length === 0` OR linked job has `totalPrice` differing from invoice total without admin **override reason** logged.
2. **Phase 2 (full):** `ReimbursementRequest` per job: `PENDING | APPROVED | ATTACHED | REJECTED` with receipt reference; send blocked while any `PENDING` for that job.
3. Admin “Send invoice” shows checklist: all reimbursements attached or explicitly waived.
4. Auto-invoice on job complete → **DRAFT** with turnover line only; ops adds reimbursement lines → send when complete.

**Acceptance:** No automated email leaves the system with a single $300 turnover line when approved reimbursements exist on the job.

---

## P5 — Pre-send validation bundle

**Rule:** One server-side gate runs immediately before send; all checks must pass or be explicitly overridden.

**Checks (hard fail unless override):**

| # | Check |
|---|---|
| 1 | Invoice status is **DRAFT** (or PARTIALLY_PAID resend N/A — new send only from DRAFT) |
| 2 | `invoiceNumber` unique and bound to this `Invoice.id` |
| 3 | `sum(lineItems) === invoice.total` (P3) |
| 4 | `items.length >= 1` |
| 5 | `clientEmail` present |
| 6 | If `jobId` set: customer, property address, `jobDate`/`preferredDate` consistent |
| 7 | No other **SENT** invoice for same **normalized property + service date** (unless `supersedesInvoiceId` set) |
| 8 | Warn/block: another invoice to same customer + property within **24h** |
| 9 | P4 reimbursement gate satisfied |
| 10 | Rendered PDF total matches DB (P3) |

**Override:** Admin role + mandatory `overrideReason` → `AuditLog` entry.

**Implementation locus:** Single function `validateInvoiceSendable(invoiceId)` called by `POST .../invoices/[id]/send` and any future bulk send.

**Acceptance:** Incident #001 scenario (0021/0022 @ $300 with pending lines) is rejected at send time.

---

## Implementation phases (post sign-off)

| Phase | Deliverable | Schema change |
|---|---|---|
| **1** | P2 PATCH guard + P5 checks + DRAFT-only completion workflow | Optional: audit only |
| **2** | P3 snapshot storage + portal reads snapshot | Yes — snapshot fields/table |
| **3** | P4 `ReimbursementRequest` entity | Yes — new model |
| **4** | Revision/supersede invoice flow + UI | Yes — relation fields |

Phase 1 can ship without migration; Phases 2–4 require migrations (still out of scope until Phase 1 approved).

---

## Out of scope (this spec)

- Chris reconciliation email (after sign-off + ops questions)
- ServiceOccurrence business key (P6 — follow-on)
- Separate JOB- vs INV- numbering series (P7 — follow-on)
- Historical backfill of Chipman 0017/0021/0022 snapshots

---

## Sign-off

| Role | Status | Date | Notes |
|---|---|---|---|
| Operations | **APPROVED** | 2026-08-24 | P0–P5 direction accepted |
| Engineering | **APPROVED FOR PHASE-1 PLANNING** | 2026-08-24 | Implementation tasks next; no code until plan review |
| Principal / Brian | **APPROVED** | 2026-08-24 | Based on spec summary in incident thread |

**Gate:** Design approved → **Phase 1 implementation plan** → ops evidence resolved → **code change authorization after plan review** → client statement of account + email.

**Parallel (ops, before client comms):**

1. Who created manual VM-2026-0017 PDF?
2. Who changed VM-2026-0021 / 0022 after send?
3. Any Aug 23 receivable beyond the identified $37.80 gap?

---

*Incident #001 — one page. Full forensic record: `INCIDENT-001-invoice-billing-chipman.md`*
