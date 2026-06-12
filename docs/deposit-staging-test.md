# Deposit Model — Staging / Local E2E Test

Use this checklist before enabling `BOOKING_PAYMENT_MODE=deposit` in production.

## Stripe test-mode safety (required)

**Never use live Stripe keys (`sk_live_` / `pk_live_`) for deposit E2E testing.**

1. Copy [`.env.deposit-test.example`](../.env.deposit-test.example) values into `.env.local`.
2. In [Stripe Dashboard → Test mode](https://dashboard.stripe.com/test/apikeys), copy:
   - **Secret key** → `STRIPE_SECRET_KEY=sk_test_...`
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
3. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Paste the `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET`.

4. With `BOOKING_PAYMENT_MODE=deposit`, checkout and pay-balance APIs **reject live keys** and return an error if `sk_live_` is configured.

5. **Do not commit** `.env.local` or any file containing real Stripe keys.

---

## Prerequisites

1. `.env.local` (local) or staging env — see [`.env.deposit-test.example`](../.env.deposit-test.example)

2. Database migration applied:

```bash
npx dotenv-cli -e .env.local -- npx prisma migrate deploy
npx prisma generate
```

3. Admin account: `npx dotenv-cli -e .env.local -- npx tsx scripts/setup-admin.ts`

---

## End-to-end flow (happy path)

| Step | Actor | Action | Expected result |
|------|--------|--------|-----------------|
| 1 | Customer | Complete `/book` wizard → pay at Stripe **test** card `4242...` | Checkout shows **$25** deposit |
| 2 | System | Redirect to `/book/confirmation` | Job: `DEPOSIT_PAID`, `reviewStatus=PENDING` |
| 3 | Admin | Job detail → Payment Summary | Quoted total, deposit, balance due visible |
| 4 | Admin | **Approve Booking** | `reviewStatus=APPROVED`, `CONFIRMED` |
| 5 | Admin | Assign cleaner | Assignment succeeds |
| 6 | Cleaner | Complete job | `COMPLETED`, `paymentStatus=BALANCE_DUE`, **no payout yet** |
| 7 | Customer | Job detail → **Pay Remaining Balance** | Stripe balance checkout |
| 8 | Customer | Pay with test card | Return with success banner |
| 9 | Webhook | `checkout.session.completed` (balance) | `paymentStatus=PAID`, `JobPayout` created (`READY`) |
| 10 | Admin | Refresh job detail | Balance **$0**, payout status shown, eligibility **Not eligible** (record exists) |

---

## Refund test path (admin reject)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Customer pays $25 deposit | `DEPOSIT_PAID`, `reviewStatus=PENDING` |
| 2 | Admin → **Reject** on job detail | Toast: deposit refunded (or error if Stripe fails) |
| 3 | Job row | `reviewStatus=REJECTED`, `status=CANCELLED`, `paymentStatus=REFUNDED` |
| 4 | Stripe Dashboard (test) | Refund on deposit PaymentIntent |
| 5 | Reject again (duplicate) | Idempotent — no double refund |
| 6 | Customer portal | No pay-balance CTA (not completed / rejected) |

---

## Payout eligibility test path

| Condition | Payout created? | Admin UI |
|-----------|-----------------|----------|
| `DEPOSIT_PAID` only | No | “Full payment required…” |
| `COMPLETED` + `BALANCE_DUE` | No | “Full payment required…” |
| `COMPLETED` + `PAID` + cleaner assigned | Yes (via webhook) | JobPayout `READY` |
| `COMPLETED` + `PAID`, no cleaner | No | “No cleaner assigned” |
| Second webhook delivery | No duplicate | “Payout record exists” |

Verify webhook log:

```
Balance payment recorded for job <id>; payout: { ok: true, reason: 'CREATED', ... }
```

---

## Negative cases

- **Before completion:** No Pay Balance button.
- **After full pay:** Button hidden; “fully paid” message.
- **Rejected booking:** No assignment; no balance pay CTA.
- **Live keys + deposit mode:** Checkout blocked with clear error.

---

## Production cutover (later)

Do **not** enable deposit mode in production until this checklist passes on staging.

```env
BOOKING_PAYMENT_MODE=deposit
NEXT_PUBLIC_BOOKING_PAYMENT_MODE=deposit
```

Keep `BOOKING_PAYMENT_MODE=full` as rollback for 2 weeks after cutover.

---

## E2E run log

### Run 1 — 2026-06-10 (local)

| Field | Value |
|-------|--------|
| **Date** | 2026-06-10 |
| **Environment** | Local (`http://localhost:3000`, Supabase Postgres) |
| **Stripe mode** | Test (`sk_test_` / `pk_test_`) — keys present, **API key expired** (CLI expiry `2026-03-23`) |
| **Test booking ID** | — (not created; Stripe blocked) |
| **Job ID** | — |
| **Prisma validate** | Pass |
| **Prisma generate** | Pass (after stopping Next.js dev server to release `query-engine-windows.exe` lock) |
| **Prisma migrate deploy** | Pass — no pending migrations (50 applied, incl. `20260607120000_add_job_deposit_payment_fields`) |

#### Path results

| Path | Result | Notes |
|------|--------|-------|
| Happy path E2E | **BLOCKED** | Stripe test API returns `api_key_expired`. `STRIPE_WEBHOOK_SECRET` still placeholder (`whsec_REPLACE_FROM_stripe_listen`). |
| Refund path E2E | **BLOCKED** | Same Stripe key expiry. |
| Payout duplicate guard | **FAIL** | `JobPayout` model missing from `prisma/schema.prisma` — `prisma.jobPayout` is `undefined` at runtime; `createPayoutIfEligible` throws before duplicate check. |
| Stripe key safety | **PASS** | Test keys configured; live keys not used; `BOOKING_PAYMENT_MODE=deposit`. |

#### Issues found

1. **Stripe test API key expired** — refresh at [Stripe Dashboard → Test mode](https://dashboard.stripe.com/test/apikeys), update `.env.local`, then run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`.
2. **`JobPayout` schema drift** — payout code (`createPayoutIfEligible`, admin payout APIs) references `prisma.jobPayout`, but no `JobPayout` model exists in schema or migrations. Must be restored before payout E2E can pass.
3. **No active cleaners in DB** — happy-path assign step needs `npx dotenv-cli -e .env.local -- npx tsx scripts/seed-cleaner.ts` or demo seed.
4. **Prisma generate on Windows** — stop `npm run dev` before `npx prisma generate` if `EPERM` on query engine.

#### Re-run command

```bash
# Terminal 1
npm run dev

# Terminal 2 (after fresh Stripe test keys + webhook secret)
npx dotenv-cli -e .env.local -- npx tsx scripts/deposit-e2e-verify.ts
```

#### Production readiness (this run)

**Not ready.** Blockers: expired Stripe test key, missing `JobPayout` Prisma model, full happy/refund paths not executed.
