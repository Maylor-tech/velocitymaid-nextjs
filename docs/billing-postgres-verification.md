# Disposable PostgreSQL verification for PR #81

This is a test-only addition to the existing billing PR. It does not require a
running Docker engine on the Windows laptop, a cloud database purchase, a
production database URL or email-provider credentials.

## What the GitHub job does

The PR-triggered workflow starts the official PostgreSQL 16 service inside the
GitHub-hosted runner. It uses Node 22 and the unchanged project lockfile. The
fixture initializer accepts only the literal localhost fixture URL and explicit
test flag. It refuses any nonempty database; it never resets an existing target.

It builds a schema baseline from the recorded pre-PR commit, applies the exact
additive reminder SQL, then runs database tests with the email module mocked.
The database service is discarded when the job ends. Its password is a public,
throwaway fixture value, not an application credential. No repository secrets,
production connection strings or deployment tokens are referenced by this job.

The tests verify:

- The reminder table has RLS enabled; anon/authenticated fixture roles cannot
  read or insert ledger rows despite receiving table-level grants.
- An explicitly privileged fixture server role can access the ledger. This
  does not verify the privileges of an actual hosted staging/production role.
- Both unique claim constraints and the invoice foreign key reject violations.
- Concurrent manual/cron sends produce one mocked provider call.
- Separate invoices sharing a case-insensitive recipient are serialized.
- Paid, cancelled and paused invoices do not send.
- Unknown provider outcomes remain held, without an automatic resend.
- Partial-payment reminders use the remaining balance.

## How to complete this step

Add the fixture script, integration test, workflow and this note to
`codex/branded-invoice-reminders`, the branch already backing PR #81. Do not apply
the earlier 23-file patch again. Run the default tests and changed-file ratchet
with `RUN_BILLING_POSTGRES_TESTS` unset. The seven integration tests must show
SKIPPED locally when no disposable PostgreSQL service exists.

Push the test-only commit to that feature branch. Wait for **Billing PostgreSQL
verification → Isolated migration, RLS and concurrent claims** to finish. Review
the logs and fix any real PostgreSQL failures; do not mark this step passed until
the database job succeeds on the exact PR commit. This workflow is newly prepared
and has not yet executed in this environment.

Keep PR #81 a draft. A passing disposable-database job resolves the local database
engine obstacle; it does not replace staged application/mobile UI checks,
internal email-rendering checks, hosted server-role validation, contact/payment
reconciliation or separate production migration/release approval. Expanded
reminders remain off. No customer communication is authorized by these tests.
