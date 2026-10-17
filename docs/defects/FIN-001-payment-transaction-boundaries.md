# FIN-001 payment transaction boundaries

`recordInvoicePayment` does not put the invoice write, the job mirror, and the audit row in one transaction. Each step commits on its own. A later failure does not undo an earlier commit.

| Step | What it writes | If it fails |
|---|---|---|
| Invoice payment transaction | One `InvoicePayment` row, plus invoice `amountPaid`, `balanceDue`, `status`, and `paidAt` when the invoice becomes paid. The job is not touched. | The transaction rolls back. No payment row, no invoice total change, no job change, no audit row. |
| Job-payment sync | After the payment commits, a second transaction locks the invoice and the job, re-reads the invoice totals, and may update job `amountPaid`, `balanceDue`, `paymentStatus`, and `paidAt` / `paymentMethod` only when the job becomes paid. It does not write `status`, `totalPrice`, or `quotedTotal`. | The payment and the invoice totals stay as committed. The job keeps its previous money fields. The request still writes an audit row with `jobSync: "failed"` and `syncFailed: true`, then throws. Checkout-session expiry is still attempted for a new payment. |
| Audit log | A new `AuditLog` row. It is append-only. | The payment stays. The job sync stays if it already succeeded. `logAuditEntry` does not throw, so a failed audit does not roll the payment back. A foreign-key rejection of `actorId` is retried with `actorId` null and `changes.actorIdRejected` set to the rejected id. |
| Duplicate retry | No second payment and no second invoice total update. Sync runs again. If the job was left behind, this write repairs `amountPaid`, `balanceDue`, and `paymentStatus` from the locked invoice. A new `INVOICE_PAYMENT_IDEMPOTENT` audit row is appended. The earlier row, including a `syncFailed` row, is left in place. | Same rules as the step that failed. A sync failure on the retry still keeps the original payment and both audit rows. |

Concurrent syncs take the invoice row lock and then the job row lock before reading the totals they write. A sync that observed an older total cannot commit that total after a sync that already wrote a newer one.

Rejected actor ids are audit metadata only. `attributeInvoicePaymentAudit` does not authenticate or authorize. Admin payment routes call `requireRole` before `recordInvoicePayment`. `local-admin` and any id the `User` foreign key rejects are stored as `unresolvedActorId` or `actorIdRejected`, not as `AuditLog.actorId`, and they do not create a session.

Historical job prices and balances are not repaired by this path. A duplicate retry repairs only the job payment fields for the payment that is being retried.
