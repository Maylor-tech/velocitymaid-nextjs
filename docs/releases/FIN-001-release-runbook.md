# FIN-001 release runbook

This runbook covers only the payment-idempotency release on `fix/fin-001-payment-reconciliation`. It does not repair historical invoice or job balances, and it is not a full disaster-recovery procedure.

## Release commit

Deploy the head of `fix/fin-001-payment-reconciliation` that contains this file. That head must contain ancestor `25947f2d8415cafb6c4b9a2ae198fdcd6efb9536` (`Repair a missing job-payment mirror when the same invoice payment is retried`). Record `git rev-parse HEAD` at deploy time and confirm it matches the open draft PR.

The only pending database change is `prisma/migrations/20261016000000_fin001_payment_reconciliation`. It adds three partial unique indexes and does not update or delete payment, invoice, or job rows.

## Already proven on the 2026-10-17 production snapshot

These steps were run against a localhost restore of the logical dump taken at 2026-10-17 08:39:15 EDT. They were not run on production.

- Duplicate groups: Stripe session 0, transaction reference 0, ledger reference pair 0.
- `prisma migrate deploy` applied only `20261016000000_fin001_payment_reconciliation`. Exit 0. The two older unfinished rows are the two rolled-back rows, and each name also has a successful row, so they did not block deploy. Do not run `migrate resolve` for them.
- Invoice, invoice-payment, ledger, payout, and job counts and sums were unchanged. Job price totals were unchanged.
- The three indexes existed after migration and did not exist before it.
- Local Supabase role names were created with `NOLOGIN` and no password hashes. `pg_authid.rolpassword` was null for `anon`, `authenticated`, `authenticator`, and `service_role`.
- All 154 `public` policies from the dump were restored: 77 `allow_postgres_full_access` and 77 `allow_service_role_full_access`. `Invoice` and `Job` each have both, `FOR ALL`.
- Row Level Security is enabled on those tables and is not forced. The application connects as `postgres`, which is superuser and table owner, so this path bypasses RLS. A role with no policy (`anon`) saw 0 invoice rows.
- `recordInvoicePayment` on that `postgres` connection created one partial payment, ignored the same Stripe session on retry, then recorded the remainder. The job stayed `RECEIVED`, its price stayed 100, and its payment fields became paid. Audit rows were `INVOICE_PAYMENT_RECORDED`, `INVOICE_PAYMENT_IDEMPOTENT`, and `INVOICE_PAYMENT_RECORDED`. The fixture was deleted. Stripe and email environment variables were unset.

Ownership and grants were not restored. Grant behavior remains untested. Vault is outside this release; see `docs/releases/VAULT-restore-limitation.md`.

## Production order

1. Confirm the deploy SHA and that PR #66 is still the reviewed head. Do not merge as part of preparing this checklist.
2. Take a fresh logical `pg_dump` custom archive through the session connection (`DIRECT_URL`, port 5432). Do not use the transaction pooler on port 6543. Store it outside git, checksum it, and keep the globals file private if one is produced. A schema-only dump is not a backup.
3. Run the duplicate probe below on production, read-only. Stop if any query returns a row. Do not delete or merge rows in this release.
4. Apply the migration with `prisma migrate deploy` using the production direct connection. Stop on any error. Do not run `migrate resolve`, a balance backfill, or a job-price update.
5. Deploy the application at the recorded SHA only after the migration succeeds. The indexes are the database backstop; the new code retries a saved payment and syncs job money fields after commit.
6. Run the post-release checks.

## Duplicate probe

```sql
SELECT "stripeSessionId", COUNT(*)
FROM "InvoicePayment"
WHERE "stripeSessionId" IS NOT NULL
GROUP BY 1
HAVING COUNT(*) > 1;

SELECT "transactionReference", COUNT(*)
FROM "InvoicePayment"
WHERE "transactionReference" IS NOT NULL
GROUP BY 1
HAVING COUNT(*) > 1;

SELECT "referenceId", "referenceType", COUNT(*)
FROM "TransactionLedger"
WHERE "referenceId" IS NOT NULL AND "referenceType" IS NOT NULL
GROUP BY 1, 2
HAVING COUNT(*) > 1;
```

The 08:39 EDT snapshot had zero groups. Production may have changed since then. The fresh probe in step 3 is required even though the snapshot probe passed.

## Failure handling

- Probe returns a row: do not migrate. Leave the rows in place.
- `CREATE UNIQUE INDEX` fails: PostgreSQL rolls that migration back. Do not mark it applied. Do not continue to the application deploy. A Prisma row with `finished_at` null and `rolled_back_at` null would block the next deploy; inspect it before any resolve.
- Application deploy fails after the migration: roll the application back. Leave the indexes. They are additive and do not change balances.
- A live payment commits and job sync then fails: the payment and invoice totals stay. The audit row has `jobSync` `failed`. Retry that same payment reference. Do not insert a second payment. The retry syncs job `amountPaid`, `balanceDue`, and `paymentStatus` only. It does not change job `status`, `totalPrice`, or `quotedTotal`.
- Audit insert fails: the payment still stands. A rejected actor id is stored as metadata and does not grant access.

## Post-release checks

- The three indexes exist: `InvoicePayment_stripeSessionId_unique`, `InvoicePayment_transactionReference_global_unique`, `TransactionLedger_referenceId_referenceType_unique`.
- The duplicate probe still returns no rows.
- The next real payment creates one `InvoicePayment`, updates that job's payment fields, leaves job service status and prices unchanged, and writes an audit row.
- No historical balance or job-price repair was run.

## Not part of this release

- Repairing invoices that are paid while the linked job payment is still `PENDING`.
- Changing historical job prices.
- Restoring Supabase Vault, Storage object bytes, role passwords, ownership, or grants.
- `migrate resolve` on the June 28 lead-stage failure or the July 15 RLS failure. Both already have a later successful row.
