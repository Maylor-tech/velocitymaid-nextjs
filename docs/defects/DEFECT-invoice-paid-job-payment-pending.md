# Defect: invoice paid, job payment still PENDING

**Status:** Open. Not repaired in production.  
**Tracked:** 2026-10-16  
**Related:** FIN-001 (`syncJobPaymentFromInvoice` on new payments), Incident #001 (VM-2026-0021 / VM-2026-0022)

## What is wrong

Some completed jobs still have `Job.paymentStatus = PENDING`, `amountPaid = 0`, and `balanceDue` equal to the job price, while the linked invoice is `PAID` with `balanceDue = 0`.

Example from the earlier readonly phase 5a2 snapshot (not re-queried for this note):

| Record | Invoice | Invoice total / paid | Job price | Job payment |
|---|---|---:|---:|---|
| Aug 20 Chipman turnover | VM-2026-0021 PAID | $500.63 / $500.63 | $300 | PENDING, paid $0 |
| Aug 23 Chipman turnover | VM-2026-0022 PAID | $337.80 / $337.80 | $300 | PENDING, paid $0 |

The snapshot labeled these `invoice_paid_job_not_paid`. The same pattern can exist on other rows. This note does not export or update the live database.

## Root cause

Invoice money and job money were written by different paths.

1. Invoice payments (admin record-payment, mark-paid, and the Stripe invoice webhook) update `Invoice.amountPaid`, `balanceDue`, and `status`.
2. Until FIN-001, that write did not mirror onto `Job.paymentStatus`. The job kept the booking snapshot: price $300 and `paymentStatus` PENDING.
3. Incident #001 then changed invoice line items after send ($300 emailed, database later $500.63 and $337.80) without changing `Job.totalPrice`. So a later mirror must not copy the invoice total onto the job price.
4. `syncJobPaymentFromInvoice` now runs after a new `recordInvoicePayment`. It sets job `amountPaid`, `balanceDue`, and `paymentStatus` only. It does not change `Job.status` or any price field. It does not revisit invoices that were already paid.
5. If that sync throws, the payment is already committed. The audit row is still written (`syncFailed: true`) and the request then fails, so the stale job is visible instead of silent.

`creditJobDepositToInvoice` updates both sides together and is not this defect. Admin job mark-paid updates the job without the invoice; that is the opposite mismatch.

## Repair, not applied

`planInvoicePaidJobPendingRepair` in `lib/invoices/invoiceJobPaymentMismatch.ts` is the allowed field set:

- When the invoice is `PAID`, `balanceDue` is 0, and the job payment status is `PENDING` or `BALANCE_DUE`, a future backfill may set job `paymentStatus` to `PAID`, `amountPaid` to the invoice amount paid, and `balanceDue` to 0.
- It must not write `totalPrice`, `quotedTotal`, or the service `status`.
- Refunded jobs are out of scope.
- Run it as a dry report first, one invoice at a time, with an audit row per change, and only after an explicit approval.
- Do not use it to "correct" the $300 job price up to $500.63 or $337.80. That price split stays with Incident #001.

No historical balance or job price was changed while recording this defect.
