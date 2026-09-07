# Dispatch Production Readiness / Staging Isolation

Status: **NOT READY to activate Production.**  
Current production `main`: `0e1867919ab5bd3cf5fa3738d1d13905fe5c872d`.

This document is the gate for turning `DISPATCH_OFFERS_VERMONT=true` in Production. Until every activation condition below is true, keep the Production flag off or unset.

## Phase A — Current Vercel targeting

Secrets are not listed. Targets from `vercel env ls` (2026-09-07).

| Variable | Vercel targets | Preview shares Production backend? |
|---|---|---|
| `DATABASE_URL` | Preview-only Secret; Production+Development Config | **No — Preview retargeted** |
| `DIRECT_URL` | Preview-only Secret; Production+Development Config | **No — Preview retargeted** |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview-only; Production+Development separate | **No — Preview is `wfudxrziqyfvrdgnocky`** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview-only; Production+Development separate | **No** |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview-only Secret; Production+Development Config | **No** |
| `CRON_SECRET` | Production, Preview | Yes — same secret |
| `RESEND_API_KEY` | Production, Preview | Yes — same sender |
| `STRIPE_SECRET_KEY` | Production, Preview, Development | Yes — same Stripe account |
| `DISPATCH_OFFERS_VERMONT` | **Production only** | Preview unset → flag **OFF** |
| `DISPATCH_STAGING` | **Preview only** | n/a |
| `DISPATCH_STAGING_DB_CONFIRMED` | **Preview only** | n/a |
| `DISPATCH_NOTIFICATIONS` | **Preview only** (`off`) | n/a |

Staging public host: `wfudxrziqyfvrdgnocky.supabase.co`.  
Production project ref remains `chsahtnpwssyfrqzcncz`.

`vercel env pull` cannot read Preview `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_SERVICE_ROLE_KEY` because they are Sensitive. Do not fall back to local `.env` / `.env.local` (those are Production). Paste Preview connection strings into `.env.staging` before `migrate deploy`.

Do not run dispatch acceptance until staging migrations and seed succeed against `.env.staging`.

## Phase B — Staging architecture

```
Vercel Production  →  Production Supabase  (live jobs, real cleaners)
Vercel Preview     →  Staging Supabase     (fixtures only)
Local development  →  explicit .env.staging or local Postgres
```

Required Preview-only values (do **not** copy Production rows):

- `DATABASE_URL` — staging pooler
- `DIRECT_URL` — staging direct
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended Preview-only dispatch env (after the DB switch):

```
DISPATCH_STAGING=true
DISPATCH_STAGING_DB_CONFIRMED=true
DISPATCH_OFFERS_VERMONT=true
DISPATCH_OFFERS_BRANCH_SLUGS=vermont-staging
DISPATCH_NOTIFICATIONS=off
# or, if you must send mail:
# DISPATCH_NOTIFICATION_ALLOWLIST=you@your-test-inbox.example
```

Leave Production `DISPATCH_OFFERS_VERMONT` unset/`false`.

Code guards (already in this branch):

- Preview/local with the flag on and `DISPATCH_STAGING_DB_CONFIRMED` missing → `409 STAGING_DB_REQUIRED` (no offers).
- Preview/staging outbound email is denied unless the recipient is on `DISPATCH_NOTIFICATION_ALLOWLIST`, or `DISPATCH_NOTIFICATIONS=off` blocks all send.

## Phase C — Schema parity / staging setup

No new Production migration is required. Staging applies the **existing** Prisma migration history, including:

- `20260829010000_add_job_offer_dispatch`
- `20260829020000_dispatch_qc_and_compensation_basis`
- `20260825180000_add_billing_policy`

### Procedure (human provisions Supabase first)

1. Create a new Supabase project named `velocitymaid-staging`. Empty database. Do not restore a Production dump.
2. Copy only the connection strings and API keys for **that** project.
3. In Vercel, **edit Preview (and optionally Development)** targets for the five Supabase variables so they no longer include Production. Production keeps the live project.
4. From a local shell pointed at staging only. `.env.staging` must contain real Preview `DATABASE_URL` and `DIRECT_URL` (not `[SENSITIVE]` placeholders, not Production `.env`):

```bash
node scripts/inspect-preview-env-identity.mjs .env.staging
# must print matchesKnownProductionRef: false and a non-production projectRef
npx dotenv-cli -e .env.staging -- npx prisma migrate deploy
npx dotenv-cli -e .env.staging -- npm run dispatch:staging-verify
```

5. Confirm verify output lists `JobOffer`, `Job` (`billingPolicy`, `dispatchUrgency`), `User`, `Branch`, `Customer`, `Property`, `CleanerProfile`, `Invoice`, `AuditLog`.
6. Set Preview `DISPATCH_STAGING_DB_CONFIRMED=true` **only after** step 3 is done.

Do not run `migrate deploy` or the seed with Production `DATABASE_URL`.

## Phase D — Staging fixtures

```bash
DISPATCH_STAGING=true DISPATCH_STAGING_DB_CONFIRMED=true npx dotenv-cli -e .env.staging -- npm run dispatch:staging-seed
```

Creates only `@example.test` identities labeled `STAGING TEST — DO NOT SERVICE`:

| Role | Email / ref |
|---|---|
| Admin | `staging.admin@example.test` |
| Cleaner | `staging.cleaner@example.test` |
| Customer | `staging.customer@example.test` |
| Branch | `vermont-staging` |
| Job | `VM-STAGING-0001` |
| Offer | portal channel, $90 flat, 120 minute TTL |

The seed **exits** if `VERCEL_ENV=production` or the staging confirm flags are missing.

## Phase E — Notification safety

Code-enforced. Do not rely on operators remembering not to send.

| Environment | Email | WhatsApp |
|---|---|---|
| Production | Intended recipient | Intended number |
| Preview / `DISPATCH_STAGING=true` / test | Blocked unless `DISPATCH_NOTIFICATION_ALLOWLIST` | Blocked unless `DISPATCH_WHATSAPP_ALLOWLIST` |
| `DISPATCH_NOTIFICATIONS=off` | Always blocked | Always blocked |

Choke points:

- Shared Resend client (`lib/email/resendClient.ts`) filters `emails.send`
- Offer, assignment, and auto-assign emails also check the recipient before send
- `sendWhatsAppMessage` and `sendWhatsAppTemplate` refuse non-production numbers unless allowlisted

Admin in-app notifications stay in the staging DB only.

Do not point Preview `RESEND_API_KEY` at Production if you can use a Resend test key; the allowlist is still required. A few older `new Resend()` call sites outside dispatch still exist — keep `DISPATCH_NOTIFICATIONS=off` on Preview until those are migrated.

## Phase F — Acceptance suite

Automated (this repo, no staging DB required):

- Feature flag default OFF
- Timestamp expiry (UI/API treat stale `OFFERED` as `EXPIRED`; accept/decline 409)
- Duplicate assignment 409
- Compensation required / not customer total
- Preview email blocked
- Preview mutations blocked without `DISPATCH_STAGING_DB_CONFIRMED`

Live Preview E2E (only after isolation):

1. Admin creates offer  
2. Cleaner sees offer  
3. Cleaner accepts  
4. Competing open offer closes / cannot double-assign  
5. Assignment persisted; `paymentStatus` unchanged  
6. Cleaner declines (separate offer)  
7. Admin cancels  
8. Offer expires by timestamp  
9. Expired accept → 409 `OFFER_EXPIRED`  
10. UI shows Expired before cron  
11. Daily cron `/api/cron/dispatch-offer-expire` persists `EXPIRED`  
12. Flag OFF → `DISPATCH_OFFERS_DISABLED`  
13. Other cleaner cannot accept  
14. Non-admin cannot create/cancel  
15. Compensation matches stored offer  
16. No duplicate assignment  
17. No real email (allowlist empty or `DISPATCH_NOTIFICATIONS=off`)

**Live results:** not run — staging Supabase does not exist yet.

## Rollback

1. Preview: unset `DISPATCH_OFFERS_VERMONT` and `DISPATCH_STAGING_DB_CONFIRMED`. Redeploy Preview.
2. Production: keep `DISPATCH_OFFERS_VERMONT` unset/`false`. If it were ever set to `true`, set it `false` and redeploy — immediate assign returns; open `OFFERED` rows can be cancelled in admin.
3. Code path: `409 STAGING_DB_REQUIRED` if Preview flag is on without isolation.

Rollback of the **flag** is an env change, not a migration.

## Production activation checklist

Do **not** set Production `DISPATCH_OFFERS_VERMONT=true` until **all** of the following are true:

- [ ] Preview `DATABASE_URL` / Supabase keys are a **different** project from Production
- [ ] `prisma migrate deploy` succeeded on staging only
- [ ] `dispatch:staging-verify` passed
- [ ] Staging seed used `@example.test` fixtures only
- [ ] All 17 live acceptance cases passed on Preview
- [ ] Feature-flag OFF on Preview blocks offer create
- [ ] Preview/staging sent **zero** emails to real cleaners or customers
- [ ] Production runtime logs clean after the latest `main` deploy
- [ ] Operator can cancel an open offer and use immediate assign as fallback
- [ ] Rollback (`DISPATCH_OFFERS_VERMONT=false` on Production) rehearsed on Preview

Exact activation command (human, Production Vercel only, after the list above):

```
DISPATCH_OFFERS_VERMONT=true
```

Scope: Production target only. Vermont slug allowlist remains default `vermont` unless `DISPATCH_OFFERS_BRANCH_SLUGS` is set.

## What this branch does **not** do

- Does not create a Supabase project (requires your Supabase account)
- Does not retarget Vercel Production env
- Does not enable Production dispatch
- Does not mutate Production data
- Does not delete `stash@{0}` or `dispatch-stash.patch`
