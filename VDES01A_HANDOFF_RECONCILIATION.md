# VDES-01A — Handoff reconciliation

Visual / layout work for admin Jobs (Prompt 4 + QA round 1) stays within existing models. Items below need separate product + schema approval before the desk can show real rows.

## Backend gaps (needs separate approval)

### Flagged in reports panel

- **Available today:** `CleanPhoto` categories such as DAMAGE / SUPPLY / ISSUE (and related photo records on a job).
- **Missing for this desk:** a durable flag record that includes host-notification state (whether the host has been told), and a Notify-host action feed scoped to Jobs & Calendar.
- **UI until approved:** plain empty copy — “Nothing flagged yet.”

### Reports and invoices panel

- **Available today:** `Job.reviewStatus` (QC) and Invoice rows with `sentAt` / payment status.
- **Missing for this desk:** a first-class customer/host **report-sent** timestamp separate from invoice send, so the desk can honestly order “report first, then the invoice.”
- **UI until approved:** plain empty copy — “No reports waiting.” The “Hosts get the report first, then the invoice.” callout stays **hidden** until a report-sent timestamp exists on the job/report model.

### Offer lifecycle on the monthly jobs payload

- Needs attention can show offer status from `openOffer`.
- Monthly list payload does **not** include `IntegrationEventLog` for `SEND_CLEANER_OFFER_EMAIL`. Delivery must stay `NOT_RECORDED` / unknown unless that log is joined — never invent “delivered.”
