# VDES-01A — Handoff reconciliation

Visual / layout work for admin Jobs (Prompt 4 + QA round 1) stays within existing models. Items below need separate product + schema approval before the desk can show real rows.

## Backend gaps (needs separate approval)

### Flagged in reports panel

- **Available today:** `CleanPhoto` categories such as DAMAGE / SUPPLY / ISSUE (and related photo records on a job).
- **Missing for this desk:** a durable flag record that includes host-notification state (whether the host has been told), and a Notify-host action feed scoped to Jobs & Calendar.
- **UI until approved:** plain empty copy — “Nothing flagged yet.”

### Reports and invoices panel

- **Available today:** `CompletionReport.status` and `CompletionReport.sentAt`. Both are set together (`SENT` plus the send time) only after the report email succeeds, in `lib/billing/jobCompletionWorkflow.ts` and `lib/billing/jobBillingSteps.ts`. Invoice rows already have their own `sentAt`. `Job.reviewStatus` is QC, separate from report send.
- **Desk:** the panel lists completed jobs whose service date is today or earlier. Each row shows “Report not sent” or “Report sent” with that time, and “Invoice not sent” or “Invoice sent” with the invoice time. A null timestamp stays “not sent”; the desk does not invent a clock time. The callout “Hosts get the report first, then the invoice.” is shown because this timestamp is real. An amber row means the invoice went out with no report time, or the report time is later than the invoice time. That row links to the job’s existing completion step (“Send report”). The link does not send the report.

### Offer lifecycle on the monthly jobs payload

- Needs attention can show offer status from `openOffer`.
- Monthly list payload does **not** include `IntegrationEventLog` for `SEND_CLEANER_OFFER_EMAIL`. Delivery must stay `NOT_RECORDED` / unknown unless that log is joined — never invent “delivered.”
