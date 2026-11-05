# Branded invoice reminders — controlled rollout

Prepared October 31, 2026. Code change only; no live billing policy, invoice,
customer communication, contract, payment, deployment or database is changed by
this document. Use the existing admin invoice screen and invoice ledger.

## What changes

- Manual and scheduled invoice reminders use the existing branded invoice
  renderer, card link, manually verified Zelle wording and business reply-to.
- Provider acceptance requires a message ID. Resolved SDK errors are failures;
  network/5xx/ambiguous outcomes require reconciliation, not blind retries.
- Reminder delivery has a durable stage claim and a recipient-wide 24-hour
  cooldown across invoices. A recipient/day uniqueness constraint and a short
  PostgreSQL advisory-lock transaction protect competing claims. No transaction
  is held open during a mail-provider call.
- Paid, draft, cancelled, zero-balance and reminder-paused invoices are skipped.
  Invoice state and recipient are reread just before the provider call. A payment
  concurrent with the provider call can still cross an in-flight reminder; the
  system does not claim atomicity between a database and an external email API.
- Admins can pause reminders without cancelling service, see recent reminder
  outcomes and record an already-sent Gmail/text message. Recording external
  contact records its current reconciliation time, not a fabricated send time.
- Partial-payment confirmations state the remaining invoice balance, not that
  the whole account is settled. Success means provider acceptance, not delivery
  to the inbox, reading, or payment.
- Public photo wording documents evidence rather than asserting photos alone
  prove readiness. Payment wording defers to the agreed service terms.

## Default and opt-in behavior

`INVOICE_REMINDER_STAGES_ENABLED` defaults to false/unset. The overdue-only
selection is retained until explicitly enabled. The shared sender/ledger still
requires the additive migration below, even with this flag off.

When enabled, the scheduler selects one stage appropriate to the invoice's
current calendar age: tomorrow, today, 1–6 days overdue, or 7+ days overdue. It
does not replay missed earlier stages. Sent stages do not resend automatically.
Known failed attempts may retry after the cooldown. PENDING and UNKNOWN outcomes
block further automated contact to that recipient until investigated; do not
clear them just to force another email.

Due dates are stored as date inputs at UTC midnight; they retain that calendar
date. The current date and 08:00–18:00 send window use America/New_York. The daily
Vercel schedule is 15:00 UTC (10:00 EST / 11:00 EDT), within that window year-round
and compatible with a once-daily scheduler. A manual administrator send is an
explicit action and is not restricted by the scheduler's quiet-hour gate.

Current batch size is 100 candidate invoices. Filtering excludes completed stages
before the limit, but a large backlog with many held recipients still needs
operator monitoring/pagination. This phase sends individual invoice reminders,
not an aggregated customer statement. Existing due dates, payment methods and
contracts are not rewritten.

## Schema and release order

1. Review the branch diff and run the tests/changed-file quality check.
2. Use an isolated staging database and nonproduction notification safety settings.
   Do not pull production credentials into a test script or put them in chat.
3. Apply `20261031230000_invoice_reminder_deliveries` to staging, then generate the
   Prisma client. Verify the table, both unique indexes, foreign key and enabled
   RLS. The table has no public read/write policy. Validate server-role access.
4. Test concurrent manual/cron claims in PostgreSQL, migration compatibility,
   dispute/pending-transfer pause, cancelled/paid invoices, partial payments and
   provider rejection/unknown outcomes. Mocked unit tests are not evidence these
   database checks have passed. Do not send to a real customer for verification.
5. Verify the admin pause/external-contact/history UI and mobile layout in staging.
   Inspect Gmail/Outlook rendering using an authorized internal recipient only.
6. Reconcile existing out-of-band reminders and payments. Record each already-sent
   message on the relevant invoice(s), and pause disputed or pending-transfer
   cases before enabling expanded reminders. A single external email covering
   several invoices should be recorded against each covered invoice; one
   recipient/day delivery row is sufficient for the shared cooldown.
7. Obtain release approval for the reviewed commit and additive production
   migration. Apply the migration before running the new application. Keep
   expanded reminders disabled for the initial deployment.
8. Verify the deployed commit, cron schedule/auth and real provider acceptance
   records. Enable expanded stages only after the cadence and contact policy are
   approved. Observe one real scheduled run and audit its recorded outcomes.

No cron endpoint was invoked against production during development. Historical
cron execution could not be verified from runtime logs: the account retained
only one hour, and no matching events appeared in the inspected recent window.
The observed production commit was `28a10318aaa312a9a87ed2c51fb21257b85b7e02`.

## Reconciliation and rollback

The admin screen shows PENDING/UNKNOWN states. Check the provider record and
stable idempotency key before resolving one. An accepted message should be
recorded SENT with its provider ID; a proven rejection can be recorded FAILED.
This release deliberately does not expose a one-click "retry unknown" button.
Database reconciliation remains an authorized operator task after evidence is
checked. Do not infer failure from silence or a client timeout.

Disabling the expanded flag restores overdue-only selection. Per-invoice pauses
stop those reminders through both manual and scheduled paths. Reverting the
application is compatible with leaving the additive columns/table in place;
do not drop the ledger or delete audit history as a rollback shortcut.

## Business decisions deliberately kept separate

- Customer-specific winter rate and start/end dates require actual job costs
  and mutual written acceptance. No new rate or fee is implemented here.
- Clarify whether the proposed "24 hours" refers to payment, cancellation,
  notice, or something else before writing a new contract clause.
- Financial alerts must not automatically cancel jobs or change cleaner pay.
- An upcoming-service account review, account-level statement, automated payment
  reconciliation, provider webhook delivery/bounce status and public pricing
  changes are later increments, not implemented by this patch.

## Validation commands

```sh
npm ci --ignore-scripts
npx prisma generate
npx prisma validate
npx vitest run lib/invoices/__tests__ lib/email/__tests__ app/api/cron/__tests__ app/api/admin/invoices/__tests__
npm run quality:changed
git diff --check
```

Use the project's Node 22 runtime for deployment verification. See the actual laptop validation below.

## Laptop review and validation — October 31, 2026

The compatibility check passed against base `28a10318aaa312a9a87ed2c51fb21257b85b7e02`.
All 23 supplied changed files were reviewed in a separate worktree. Review fixes:
manual reminder sends now enforce super-admin access before billing reads;
payment-confirmation HTML escapes customer-controlled fields; the existing
branded header tagline is retained. Mocked regressions cover these fixes and
pause/recipient changes immediately before sending. An unused helper was removed.
The RLS test now targets its historical migration explicitly and also checks the
new ledger; it no longer assumes an old migration must always be last. An
unneeded CLI shebang that broke the Windows Vitest import was removed; the
quality command still runs through Node as before.

Actual local results using portable Windows Node **22.23.4**, with unchanged lockfile:

- `npm ci --ignore-scripts --no-audit --no-fund`: passed (621 packages).
- Prisma client generation and schema validation: passed with dummy localhost URLs.
- Offline base-to-patched Prisma schema diff: matches migration DDL; RLS is also
  enabled by the migration. This is not an executed database check.
- Focused affected tests: **179 passed across 30 files**, including all documented
  billing/email/cron/admin tests and compatibility regressions.
- Full `npm test`: **1,460 passed across 215 files**.
- `npm run quality:changed`: passed for **21 changed TS/TSX files**. This is the
  repository's changed-file ratchet, not a claim that legacy global type debt is absent.
- Local `npm run build`: passed with dummy database/Supabase endpoints, no email
  credentials, and expanded reminders disabled. This is not staging verification.
- `git diff --check`: passed.

No existing environment/authentication files were copied into this worktree.
Communications were mocked; no customer email or production cron was invoked.
No database migration or customer record change was made. Local Docker returned
an engine/server error, and no other isolated staging target was verified.

**Release gates still pending:** establish a verified isolated PostgreSQL staging
connection; execute the migration and verify constraints/RLS/server access;
exercise real PostgreSQL competing claims and provider-unknown recovery using
mocks; verify staged admin UI/mobile layout and HTML/email rendering without
customer sends; reconcile existing external contact and disputed/pending-transfer
cases; obtain separate production migration/release approval. Expanded reminders
remain off by default and must not be enabled as part of this draft PR.