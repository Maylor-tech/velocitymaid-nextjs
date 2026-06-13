# Production Deposit Deployment Checklist

**Use after pushing deposit mode + payment idempotency fixes to `main`.**  
Execute sequentially. Do not start new feature work until every section passes.

---

## Phase 1 — Pre-deploy (local)

| Step | Action | Pass |
|------|--------|------|
| 1.1 | `npx prisma validate` | [ ] |
| 1.2 | `npx prisma migrate deploy` (against prod DB only if pending migrations) | [ ] |
| 1.3 | `npm run build` passes locally | [ ] |
| 1.4 | Commit excludes `.env.local`, secrets, `cookies.txt` | [ ] |
| 1.5 | Push to `origin/main` | [ ] |

---

## Phase 2 — Vercel environment (Production)

Set or confirm these in **Vercel → Project → Settings → Environment Variables → Production**:

| Variable | Required value | Pass |
|----------|----------------|------|
| `BOOKING_PAYMENT_MODE` | `deposit` | [ ] |
| `BOOKING_DEPOSIT_CENTS` | `2500` | [ ] |
| `NEXT_PUBLIC_BASE_URL` | `https://www.velocitymaid.com` | [ ] |
| `STRIPE_SECRET_KEY` | `sk_live_...` (VelocityMaid live account) | [ ] |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | [ ] |
| `STRIPE_WEBHOOK_SECRET` | Live webhook signing secret (`whsec_...`) | [ ] |
| `DATABASE_URL` | Supabase pooler (6543, `pgbouncer=true`) | [ ] |
| `DIRECT_URL` | Supabase direct (5432) | [ ] |

Redeploy after any env change (env vars are read at build/runtime per route).

---

## Phase 3 — Deploy verification

| Step | Action | Pass |
|------|--------|------|
| 3.1 | Vercel production deploy from latest `main` commit is **Ready** | [ ] |
| 3.2 | `https://www.velocitymaid.com` returns 200 | [ ] |
| 3.3 | `https://velocitymaid.com` redirects to `www` | [ ] |
| 3.4 | No build/runtime errors in Vercel deployment logs | [ ] |

---

## Phase 4 — API smoke tests (production)

Run after deploy completes:

```bash
# Deposit config (must be live, not 404)
curl -s https://www.velocitymaid.com/api/booking/payment-config

# Expected: {"depositMode":true,"depositDollars":25,...}
```

| Endpoint | Expected | Pass |
|----------|----------|------|
| `GET /api/booking/payment-config` | `depositMode: true`, `depositDollars: 25` | [ ] |
| `GET /book?branch=new-jersey` | Review step: **Pay $25 Deposit & Book** | [ ] |
| `GET /cleaners/login` | Login page loads | [ ] |
| `GET /admin/login` | Admin login loads | [ ] |

---

## Phase 5 — Stripe webhook (live)

In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks) (live mode):

| Step | Action | Pass |
|------|--------|------|
| 5.1 | Endpoint URL: `https://www.velocitymaid.com/api/webhooks/stripe` | [ ] |
| 5.2 | Events include `checkout.session.completed` | [ ] |
| 5.3 | `STRIPE_WEBHOOK_SECRET` in Vercel matches this endpoint | [ ] |
| 5.4 | Send test webhook or complete a real checkout → **200** response in Stripe logs | [ ] |

---

## Phase 6 — Real production booking (smoke test)

**Use a real card in a controlled test.** Cancel or refund in Stripe if needed.

| Step | Actor | Action | Expected | Pass |
|------|--------|--------|----------|------|
| 6.1 | Customer | `/book?branch=new-jersey` → complete wizard | Review shows $25 deposit | [ ] |
| 6.2 | Customer | Pay at Stripe Checkout | Amount **$25.00** (not full quote) | [ ] |
| 6.3 | System | Redirect to `/book/confirmation` | Success page | [ ] |
| 6.4 | System | Stripe webhook fires | Job: `DEPOSIT_PAID`, `reviewStatus=PENDING` | [ ] |
| 6.5 | Admin | `/admin/jobs` → open new job | Payment summary shows deposit + balance | [ ] |

**Do not** re-run cleaner completion on a fully paid job. Use a **fresh job** per full-loop test.

---

## Phase 7 — Payment idempotency (post-deploy)

| Step | Action | Pass |
|------|--------|------|
| 7.1 | Completing a job with `paymentStatus=PAID` does **not** set `BALANCE_DUE` | [ ] |
| 7.2 | Completing when `JobPayout.status=PAID` does **not** downgrade payment | [ ] |
| 7.3 | If drift occurs locally: `scripts/repair-paid-payout-payment-status.ts` (dry-run) | [ ] |

---

## Phase 8 — Go / No-Go

| Criterion | Go? |
|-----------|-----|
| Production deploy Ready | [ ] |
| Deposit config API returns $25 mode | [ ] |
| Live webhook returns 200 on checkout | [ ] |
| Real booking creates `DEPOSIT_PAID` job | [ ] |
| No payment/payout status contradictions | [ ] |

**All checked → deployment verified. New feature work may begin.**

---

## Quick reference

| Item | URL |
|------|-----|
| Site | https://www.velocitymaid.com |
| Book (NJ) | https://www.velocitymaid.com/book?branch=new-jersey |
| Payment config | https://www.velocitymaid.com/api/booking/payment-config |
| Stripe webhook | https://www.velocitymaid.com/api/webhooks/stripe |
| Vercel dashboard | https://vercel.com/dashboard |
