# Incident #001 — Chipman Park invoice billing confusion

**Status:** OPEN — root cause established (DB + Drive artifacts); P0–P5 design **APPROVED**; production code **FROZEN**  
**Property:** 198 Chipman Park, Middlebury, VT  
**Customer:** Chris Ray Hautchamp (`hautchamp26@gmail.com`)  
**Evidence:** Production Postgres, Gmail/Drive communications folder  
**Opened:** 2026-08-24  
**Last updated:** 2026-08-24 (Drive artifact confirmation)

---

## Executive summary

Chris received **conflicting invoice identities and totals** from VelocityMaid over 48 hours. Her written complaint and the Drive communications folder confirm she was **not misreading or inventing numbers** — the platform, manual PDFs, and automated emails **did not reconcile with each other**.

This incident is **more serious than duplicate detection alone**. There were **five competing customer-facing or system representations** for three receivables:

| Representation | Number | Total Chris saw | Total in DB (final) |
|---|---|---:|---:|
| Manual PDF (Aug 22 email) | **VM-2026-0017** | **$500.63** | *(no Invoice row)* |
| Automated email (Aug 23) | **VM-2026-0022** | **$300.00** | **$337.80** |
| Automated email (Aug 23) | **VM-2026-0021** | **$300.00** | **$500.63** |
| System-of-record (current) | **0021** = Aug 20 bill | — | **$500.63** |
| Intended final (0022) | Aug 23 bill | — | **$337.80** |

**Chris's mental model (reasonable from artifacts):**

- **0017** = valid **$500.63** Aug 20 + Aug 22 expenses *(manual PDF, Aug 22)*  
- **0022** = suspicious **$300** Aug 23 duplicate *(automated, arrived first)*  
- **0021** = suspicious **$300** Aug 23 duplicate *(automated, arrived 34 min later)*  

She stopped payment because **her paperwork did not reconcile with itself** — not because she failed to understand the system.

**Engineering verdict:** VelocityMaid sent contradictory invoice records. The corrective path is **acknowledge cleanly → one authoritative statement of account → immutability/sync safeguards** — not argue which number she "should" have understood.

---

## Drive / email evidence (confirmed)

Source: VelocityMaid Drive communications folder — customer complaint, emailed invoice PDFs, thread.

### Aug 22 — manual `VM-2026-0017` ($500.63)

- Email **literally attached/sent a manual PDF labeled `VM-2026-0017`**
- Covered: Aug 20 turnover, Aug 22 emergency visit, reimbursements, errand fees
- **Total: $500.63**
- **Customer was correct** to cite 0017; this was not a mislabel in her research

**DB divergence:** No `Invoice` row for `VM-2026-0017` on Chipman. Number **0017** is consumed by an unrelated **cancelled Lou Lou's Landing pilot job**. The receivable later appeared in DB as **`VM-2026-0021` at $500.63** — a **different number for the same economic bill**.

### Aug 23 ~11:58 — automated `VM-2026-0022` ($300.00 received)

- Automated email Chris received: **one line** — Vacation Rental Turnover **$300.00**
- **Total Due: $300.00**
- DB final state: **$337.80** (turnover + key duplication $12.80 + errand $25.00)

**The $37.80 was not necessarily missing from the intended charge — it was missing from the invoice Chris actually received.** Line items were added or DB updated **after** the $300 email went out (silent mutation).

### Aug 23 ~12:32 — automated `VM-2026-0021` ($300.00 received)

- Automated email Chris received: **Vacation Rental Turnover $300.00** only
- DB final state: **$500.63** (turnover + reimbursements + emergency + errand fees)

**Chris received $300; DB later shows $500.63** — same silent-mutation pattern as 0022.

### Customer complaint (explicit)

Chris states: **0022** arrived first at **$300**, then **0021** arrived second at **$300**, while she believed **0017** was the valid **$500.63** Aug 20 bill. That matches Drive artifacts exactly.

---

## Timeline (DB + artifacts)

| Time | Event | Customer saw | DB (final) |
|---|---|---|---|
| Aug 22 15:11 UTC | Job `3a64fa62…` created, ref **0021**, service **Aug 20** | — | Job only |
| **Aug 22** | **Manual email: PDF `VM-2026-0017` $500.63** | **0017 / $500.63** | **No matching Invoice row** |
| Aug 23 21:50 | Job `7f77a9ce…` created, ref **0022**, service **Aug 23** | — | Job only |
| Aug 23 21:58:43 | Job 0022 **COMPLETED** | — | |
| Aug 23 21:58:45 | Invoice **0022 SENT** (automated) | **0022 / $300.00** | **$337.80** |
| Aug 23 22:32:29 | Job 0021 **COMPLETED** | — | |
| Aug 23 22:32:31 | Invoice **0021 SENT** (automated) | **0021 / $300.00** | **$500.63** |

**0022 emailed before 0021** because the lower-numbered job (0021, Aug 20) was completed/invoiced later than Aug 23 job 0022.

---

## Record reconstruction

### Receivable A — Aug 20 turnover + Aug 22 emergency/expenses ($500.63)

| Lens | Number | Amount | Notes |
|---|---|---:|---|
| **Customer-facing (Aug 22 manual)** | **VM-2026-0017** | **$500.63** | PDF + email; Chris relied on this |
| **Automated email (Aug 23)** | VM-2026-0021 | **$300.00** | Single turnover line only |
| **DB system-of-record** | VM-2026-0021 | **$500.63** | Full line items post-send mutation |
| Job | `3a64fa62…` | preferredDate **Aug 20** | Created Aug 22; completed Aug 23 22:32 |

**Disposition:** **Valid receivable $500.63** — economic bill is real. **Number identity is broken** (0017 manual vs 0021 system). **Total identity is broken** ($300 sent vs $500.63 DB).

**Do not void** unless ops disproves underlying work.

### Receivable B — Aug 23 turnover (+ keys/errand) ($337.80 intended)

| Lens | Number | Amount | Notes |
|---|---|---:|---|
| **Automated email (Aug 23)** | VM-2026-0022 | **$300.00** | What Chris paid against mentally |
| **DB / intended final** | VM-2026-0022 | **$337.80** | + keys $12.80 + errand $25.00 |
| Job | `7f77a9ce…` | preferredDate **Aug 23** | Same-day create → complete → invoice |

**Disposition:** **Valid receivable** — confirm whether any **additional** Aug 23 reimbursements remain beyond the $37.80 already in DB but not emailed.

### VM-2026-0017 — numbering collision (platform)

| Field | Value |
|---|---|
| Manual PDF (Chipman) | **$500.63** — customer-facing, Aug 22 |
| `Invoice` row | **None** for Chipman at 0017 |
| `Job.jobReference` | `5a648b77…` — **Tiffany Mayo / Thomson Drive**, CANCELLED pilot |

**0017 was used twice in the business's own records** — once manually to Chris, once as an unrelated job ref in DB.

---

## Correct ledger (authoritative statement of account — ops to issue)

Do **not** ask Chris to reconcile conflicting PDFs. Issue **one** statement:

| Service | Scope | Correct amount | Supersedes |
|---|---|---:|---|
| Aug 20, 2026 | Turnover + Aug 22 emergency/reimbursements/errands | **$500.63** | Manual **0017** PDF; partial automated **0021 @ $300** |
| Aug 23, 2026 | Turnover + key duplication + supply/errand | **$337.80** | Automated **0022 @ $300** |

**Total due: $838.43** (+ any ops-confirmed Aug 23 reimbursement delta not yet in either bill).

**Void / supersede guidance:**

- Treat manual **0017** and automated **0021 @ $300** / **0022 @ $300** as **superseded presentations**, not collectible duplicates
- Do **not** collect 0017 + 0021 + 0022 as three separate bills
- DB invoices **0021** and **0022** at final totals are the intended system anchors **after correction comms**

---

## Root cause analysis

### RC-1 — Manual invoice numbers issued outside platform ledger

Manual PDF **`VM-2026-0017`** sent to customer **without** a matching reserved `Invoice` row. Same number already assigned to unrelated job in DB.

**Effect:** Customer and system permanently disagree on which number owns the $500.63 receivable.

### RC-2 — Invoices sent before line items finalized (send @ $300, DB later @ $500.63 / $337.80)

Auto-completion workflow creates invoice from `job.totalPrice` (**$300**) and can **send immediately**. Reimbursements/errands added **after send** via silent DB edit.

**Effect:** Customer PDF/email total **≠** DB total. Chris correctly received **$300**; we later described **$337.80** / **$500.63** as if she had those documents.

**Code:** `lib/billing/jobCompletionWorkflow.ts`, `lib/billing/jobBillingSteps.ts`, `app/api/admin/invoices/[id]/send/route.ts`

### RC-3 — No immutability after SENT

Once emailed, invoice line items/totals were **mutated in place** rather than through revision/supersede workflow.

**Effect:** No audit trail; customer artifact frozen at wrong total; ops trusts DB over customer mailbox.

### RC-4 — Shared VM sequence + send order inversion

`Job.jobReference` = `Invoice.invoiceNumber` minted at job creation. **0022** sent before **0021** despite lower number.

**Effect:** Number order contradicts send order; pairs with identical **$300** email bodies → duplicate perception.

### RC-5 — Invoice notes advertised upcoming Aug 23 on Aug 20 bill

0021 notes: `Upcoming Sun Aug 23 — $300` while `jobDate` = Aug 20.

**Effect:** False signal that Aug 23 would be (or was) billed again when 0022 arrived.

### RC-6 — No pre-send validation bundle

No check of: customer + property + service date + invoice number + line-item sum + existing sent invoices + **PDF total === DB total**.

### RC-7 — No reimbursement workflow

Expenses are ad hoc `InvoiceItem` rows; no **Pending → documented → approved → attached → invoiced** gate before SENDABLE.

### RC-8 — Two jobs, two UUIDs, indistinguishable $300 emails

Aug 20 and Aug 23 are **legitimately different service dates**, but automated emails were **identical in presentation** ($300 turnover only).

---

## Ruled out

| Hypothesis | Verdict |
|---|---|
| Customer invented or misread VM-2026-0017 | **Ruled out** — Drive confirms Aug 22 manual PDF |
| Same automated email sent twice | **Ruled out** — two job UUIDs, two sends |
| Pure Gmail duplication | **Ruled out** |
| Only a "duplicate job" bug | **Insufficient** — identity + immutability failures dominate |
| Customer should have understood 0021 = 0017 | **Rejected** — we sent both numbers with different totals |

---

## Safeguard design (approved direction — no production code yet)

Focus: **invoice immutability and synchronization**, not duplicate detection alone.

### P0 — Manual numbering ban (immediate ops)

**Stop manually assigning customer-facing VM numbers outside the platform** unless the number is **formally reserved in the same numbering ledger** (`nextVmReference` / `allocateUniqueInvoiceNumber`) and bound to an `Invoice` row **before** PDF generation.

Manual PDFs must pull number + lines from platform DRAFT, not Word/template.

### P1 — One invoice number = one immutable identity

- A VM-#### number is **permanently bound** to one `Invoice.id` once issued (DRAFT or SENT)
- **Never** reuse a number for a different receivable (0017 manual vs 0017 pilot job)
- Manual 0017 for Chipman should have been reserved or should have used 0021 from ledger at creation time

### P2 — SENT invoices require revision trail, not silent mutation

Once status = **SENT** (or email dispatched):

- **Block** in-place edits to line items, totals, or number
- Changes require **revision invoice** or **credit memo + superseding invoice** with visible trail
- Customer receives **new PDF** for any total change

### P3 — PDF/email total must equal DB total before send

Pre-send gate:

```
sum(lineItems) === invoice.total === renderedPdfTotal
```

Hard block on `POST .../send` mismatch. Store **sent snapshot** (JSON/PDF hash) on `Invoice` for dispute resolution.

### P4 — Reimbursements resolved before SENDABLE

Invoice cannot move **DRAFT → SENT** while:

- Pending reimbursement requests exist for linked job, OR
- `job.totalPrice !== invoice.total` without explicit override + reason

Completion workflow should create **DRAFT only**, not auto-SENT at $300.

### P5 — Pre-send validation bundle

Before send, validate and log:

| Field | Check |
|---|---|
| Customer | Matches job/customer |
| Property | Normalized address match |
| Service date | Matches job `preferredDate` |
| Invoice number | Reserved, unique, bound to this invoice |
| Line items | Non-empty; sum = total |
| Existing sent | Warn/block: same property + service date; same customer + property within 24h |
| Prior manual | No orphan manual PDF for same receivable |

### P6 — Business-key duplicate guard (retained from prior draft)

`ServiceOccurrence` unique key: `customerId | address | serviceDate | serviceType` — one active billable occurrence → one active invoice.

### P7 — Presentation

Email subject/body: **`Aug 23, 2026 — Chipman Park — $337.80 — VM-2026-0022`** (date + amount before number).

Separate **JOB-####** vs **INV-####** sequences optional long-term.

---

## Operational correction (now)

1. **Acknowledge** VelocityMaid sent conflicting identities/totals — Chris's research was accurate  
2. **Issue one statement of account** (table above) — supersedes 0017 PDF, 0021@$300, 0022@$300  
3. **Do not argue** she should have mapped 0017 → 0021  
4. **Ops checklist** until P0–P5 ship: no manual VM numbers; no send until lines final; no post-send edits  
5. **Optional:** Mark DB invoices with internal note `INCIDENT-001 superseded presentations on [date]`  

---

## Open questions (remaining)

| # | Question | Status |
|---|---|---|
| 1 | Aug 22 manual 0017 — who generated, from what template? | **Open** — ops |
| 2 | Post-send edits to 0021/0022 — who/when/what changed? | **Open** — check admin edit logs / invoice `updatedAt` |
| 3 | Additional Aug 23 reimbursements beyond $37.80? | **Open** — match receipts to Chris claim |
| 4 | Backfill: job 0021 created Aug 22 for Aug 20 — intentional? | **Open** — ops |

---

## Next steps

| Step | Owner | Status |
|---|---|---|
| P0–P5 safeguard design | Engineering | ✅ **Approved** (2026-08-24) |
| Phase 1 implementation plan | Engineering | ✅ **Drafted** — `INCIDENT-001-phase1-implementation-plan.md` |
| Code authorization | Engineering | ☐ After plan review |
| Ops O1–O3 | Ops | ☐ Pending |
| Statement of account | Brian / ops | ☐ After O1–O3 |
| Chris reconciliation email | Brian / ops | ☐ After statement + runbook/deploy |
| **Production code** | Engineering | **FROZEN** |

---

## Appendix — code paths

| Path | Role in incident |
|---|---|
| `lib/billing/numbering.ts` | Shared VM-#### allocator |
| `lib/invoices/allocateInvoiceNumber.ts` | Unique invoice number allocation |
| `lib/billing/jobCompletionWorkflow.ts` | Auto-create + **auto-SENT** at job total |
| `lib/billing/jobBillingSteps.ts` | `generateInvoiceFromJob`, send linked invoice |
| `app/api/jobs/[jobId]/complete/route.ts` | Triggers completion billing |
| `app/api/admin/invoices/[id]/send/route.ts` | Send without immutability/total checks |
| `app/api/admin/invoices/[id]/route.ts` | Edit path (likely silent mutation) |
| `lib/invoices/brandedInvoiceDocument.ts` | PDF generation — must match DB at send time |

---

*Incident #001 — production code frozen until safeguard design is signed off.*
