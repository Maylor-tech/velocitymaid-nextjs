# VDES-01A — Handoff reconciliation

Visual / layout work for admin Jobs (Prompt 4 + QA round 1) stays within existing models. Items below need separate product + schema approval before the desk can show real rows.

## Backend gaps (needs separate approval)

### Flagged in reports panel

- **Available today:** `JobFlag` (`job_flags`). A cleaner DAMAGE, SUPPLY, or ISSUE photo creates one flag for that photo. Marking arrival as ISSUES creates one ARRIVAL flag for the job. Repeating the same photo or arrival does not create a second flag.
- **Desk:** open flags, newest first. Each row shows the property, kind, note, photo when there is one, and “Host not told yet” or “Host told” with the time and channel. An admin can mark the host notified (email, text, call, or in the report) or resolve the flag. The action records the admin. It does not send a message.
- **Host wording:** a damage, supply, or issue photo requires the cleaner’s note (140 characters). That note is the photo caption and the main line on the desk. A flag with no note still shows “Noticed during the clean.” Do not say inspection or inspected.

### Reports and invoices panel

- **Available today:** `CompletionReport.status` and `CompletionReport.sentAt`. Both are set together (`SENT` plus the send time) only after the report email succeeds, in `lib/billing/jobCompletionWorkflow.ts` and `lib/billing/jobBillingSteps.ts`. Invoice rows already have their own `sentAt`. `Job.reviewStatus` is QC, separate from report send.
- **Desk:** the panel lists completed jobs whose service date is today or earlier. Each row shows “Report not sent” or “Report sent” with that time, and “Invoice not sent” or “Invoice sent” with the invoice time. A null timestamp stays “not sent”; the desk does not invent a clock time. The callout “Hosts get the report first, then the invoice.” is shown because this timestamp is real. An amber row means the invoice went out with no report time, or the report time is later than the invoice time. That row links to the job’s existing completion step (“Send report”). The link does not send the report.

### Offer lifecycle on the monthly jobs payload

- Needs attention can show offer status from `openOffer`.
- Monthly list payload does **not** include `IntegrationEventLog` for `SEND_CLEANER_OFFER_EMAIL`. Delivery must stay `NOT_RECORDED` / unknown unless that log is joined — never invent “delivered.”
