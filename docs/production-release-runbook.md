# Production runbook — PR #81 and PR #82

Local integration record only. This branch is not pushed, not merged, and not a production approval.

Heads checked together:

- PR #81 `3ed214fcba34a38aee9608b448115a316ab34643` (draft)
- PR #82 `8e29dd65cd07155ccf4f7ebad6c153dabf3cbe35` (draft)

The merge keeps signed admin sessions, password enforcement, branch restrictions, and owner checks from PR #82. It keeps the reminder ledger, mobile invoice layout, and sanitized invoice errors from PR #81. Preview-only login modules from PR #81 are present and are not called by login, middleware, or `requireRole`.

## Release checklist

### Verified

- Both pull requests are still drafts. Neither has been merged.
- PR #81 quality gate, isolated billing PostgreSQL verification, and its earlier Vercel preview passed on `3ed214f`. The PostgreSQL run is disposable CI, not a Neon pass. Run `41950251964`.
- PR #82 quality gate and Vercel preview passed on `de78017`. Commit `8e29dd6` adds the assignment checks and was pushed to the same draft branch. Its new checks must be read again before any approval.
- Job price changes (`totalPrice`, `quotedTotal`) require the owner account on the general job PATCH and the dedicated pricing PATCH. A multi-branch non-owner receives 403 and no write.
- Cleaner assignment on the general job PATCH, manual assign, team replacement, and change-cleaner uses the same eligibility rule.
- Ordinary notes edits and an eligible assignment still succeed in the regression tests.
- The combined tree still requires a configured password, signs `admin_session` with `ADMIN_SESSION_SECRET`, and limits non-owners to verified memberships.
- Invoice email cards remain `width:100%` and `max-width:600px`. Reminder sends still allow only `SENT`, `OVERDUE`, and `PARTIALLY_PAID` with `balanceDue > 0`.

### Remaining technical work

- PR #82 commit `8e29dd6` quality gate and Vercel preview succeeded. The pull request remains draft.
- Combined-tree checks under Node 22.23.4 in this local worktree: Prisma generate and schema validation passed against a dummy localhost URL. Focused auth, invoice, email, and cron tests: 223 passed, and 7 disposable-PostgreSQL tests skipped. Invoice immutability: 8 passed. `quality:changed` passed for 104 files. `git diff --check` passed. This is not a hosted Neon pass and not a production deploy.
- A later merge of the two pull requests will conflict in login, middleware, `requireRole`, and the manual reminder route. Resolve them the same way as this worktree: keep the PR #82 auth files, and keep `sendRecordedInvoiceReminder` behind `assertSuperAdmin` (the owner-account alias).
- Do not treat local or CI database tests as a hosted Neon pass.

### Actions only Brian can take

- Approve a protected Preview of the combined release candidate, then enter the setting names below into that Preview only.
- Sign in on that Preview as the owner, a single-branch admin, and a multi-branch non-owner.
- Take or confirm a fresh production backup before any production migration.
- Give a separate approval before production deploy, and another separate approval before expanded reminders are enabled.
- Do not type secrets into chat.

## Required settings

Names and scopes only. No values belong in this document, in git, or in chat.

| Name | Scope | Release rule |
|---|---|---|
| `ADMIN_SESSION_SECRET` | Preview first, Production only after approval | At least 32 characters. Required before admin login works. Do not reuse `PREVIEW_ADMIN_SESSION_SECRET`. |
| `ADMIN_EMAIL` | Same environment as the secret | The one owner account. Branch count does not grant owner authority. |
| `ADMIN_PASSWORD_<EMAIL>` | Same environment, one name per active admin | `@` and `.` in the email become `_`, then the name is uppercased. Minimum 16 characters. |
| `CARYLL_ADMIN_PASSWORD` | Same environment | Existing name for `caryll@velocitymaid.com` only. |
| `PREVIEW_ADMIN_SESSION_SECRET` | Existing Preview protection | Not the credential for this release. The combined tree does not accept it as an admin session. |
| `INVOICE_REMINDER_STAGES_ENABLED` | Production and Preview | Leave unset or false for the initial release. |
| `CRON_SECRET` | Existing cron bearer | Do not rotate it as part of this release. Invoice reminders stay on the existing daily schedule. |
| `VERCEL_ENV` | Platform | Preview verification happens only where this is `preview`. |

## Production migration compatibility

Observed production commit `28a10318aaa312a9a87ed2c51fb21257b85b7e02` is an ancestor of both heads. `origin/main` does not contain `20261031230000_invoice_reminder_deliveries`.

PR #82 adds no migration. PR #81 adds one additive migration:

- `Invoice.remindersPaused` boolean, not null, default false
- new `InvoiceReminderDelivery` table, two unique indexes, one status index, foreign key, and row-level security with no public policy

The current production schema can run the old application without this table. The new application expects the migration to be applied first. Expanded reminder selection does not turn on with the migration; it stays off until `INVOICE_REMINDER_STAGES_ENABLED` is set.

## Backup, recovery, and rollback

Before the production migration, take a fresh backup. The recorded November 3 backup does not contain `InvoiceReminderDelivery`.

Apply the migration before deploying the new application. If the new application must be rolled back, redeploy the previous application commit and leave the new column and ledger table in place. Do not drop the ledger or delete reminder history as a rollback shortcut.

Unsetting `INVOICE_REMINDER_STAGES_ENABLED` returns the scheduler to overdue-only selection. Per-invoice pause stops both manual and scheduled reminders for that invoice. Rotating `ADMIN_SESSION_SECRET` or deploying PR #82 ends every existing admin session.

`PENDING` and `UNKNOWN` reminder rows block further automated contact for that recipient until an operator reconciles them against the provider record. This release has no one-click retry for an unknown send.

## Administrator access and forced re-login

After the auth change is deployed, unsigned cookies, `admin_session=true`, `adminId`, `adminSession`, `x-admin-id`, and a bearer user id are not credentials. Every admin must sign in again with the password configured for that environment.

Sessions expire after 30 minutes. The signed cookie audience is `velocitymaid-admin-v1`. A removed membership or inactive account fails closed on the next request.

Owner authority is `ADMIN_EMAIL` only. That account can change an existing job's `totalPrice` or `quotedTotal` and can use global invoice routes. A multi-branch non-owner can open job routes only. An omitted job-branch filter stays inside that admin's verified memberships. Naming an unassigned branch returns 403. Routes outside jobs, including invoices and payouts, return 403 or redirect to `/admin/jobs`.

Single-branch admins stay on the existing branch allowlist. Job pricing, payout, mark-paid, and billing segments stay off that allowlist.

Creating a new manual job may still record its initial price. That is job creation, not an edit of an existing price. Editing an existing price remains owner-only.

## Protected Preview verification

Do this on an isolated Preview of the combined candidate. Do not use Production.

1. Set `ADMIN_SESSION_SECRET`, `ADMIN_EMAIL`, and one password name per active admin in that Preview.
2. Confirm `INVOICE_REMINDER_STAGES_ENABLED` is unset or false.
3. Sign in as the owner. Open invoices. Change a fictional job note and, on a fictional job only, a price.
4. Sign in as a single-branch admin. Confirm invoices are refused and an ordinary job-note edit on an assigned branch still works.
5. Sign in as a multi-branch non-owner. Confirm `/admin/jobs` opens, an omitted branch filter stays inside the memberships, an unassigned branch is rejected, a price change returns 403, and `GET /api/admin/invoices` returns 403.
6. Open `/admin/login` with a stale `adminId` cookie, sign in, and confirm the old alias is cleared.
7. Confirm a removed diagnostic or other retired preview route returns 404.

Brian enters the secret into the Preview secret store and signs in himself. Do not send the secret or the passwords in chat.

## Release with expanded reminders disabled

Ship the application and the additive migration only after the Preview checks and a fresh backup. Leave `INVOICE_REMINDER_STAGES_ENABLED` unset. The daily invoice-reminder cron may continue to run overdue-only selection. Do not send a customer message to prove the deploy.

After deploy, confirm the production commit, that admin login demands the new session, and that the reminder flag is still unset. Do not change production data to create a test invoice.

## Separate prerequisites for enabling customer reminders

Do not enable `INVOICE_REMINDER_STAGES_ENABLED` in the same approval as the code release. All of the following stay outstanding:

- A separate written approval of the reminder cadence and contact policy.
- Reconciliation of already-sent Gmail or text reminders onto the relevant invoices, and pauses for disputed or pending-transfer cases.
- One observed scheduled run after the flag is enabled, with its recorded outcomes audited.
- Hosted Neon fixture verification, which is not done. `cloud_admin` still must revoke PUBLIC `CONNECT` and `TEMPORARY` on database `postgres` and PUBLIC `CONNECT` on `template1`. Owner setup, fixture setup, and the hosted harness were not run. The fixture role remains unable to log in. Disposable CI and local PostgreSQL results are not that hosted pass.
- The smallest next hosted step, when and only when that work is reauthorized, is the `cloud_admin` public-grant ceiling script. Do not restart it for this release.

Enabling reminders is a later change of that one setting after those prerequisites. It is not part of this release candidate.
