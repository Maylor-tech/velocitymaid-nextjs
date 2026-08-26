# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

VelocityMaid is a multi-branch cleaning-services platform (Next.js 14 App Router + TypeScript + Prisma/Postgres via Supabase). It's not just a marketing site — it runs the full operational loop: customer booking → Stripe payment → cleaner assignment/dispatch → job completion → cleaner payout, plus admin ops, a customer portal, a cleaner portal, and a separate multi-tenant "SaaS" product living in the same app.

`RULES.md` at the repo root describes an earlier "Phase 0" scope (booking-only, admin/branch-owner/pilot disabled). That has been superseded — admin, branch-owner, and pilot modules are implemented and in active use (see `app/admin`, `app/branch-owner`, `app/pilot`). Don't treat `RULES.md` as current; treat it as historical intent. The root directory also contains ~250 dated status/implementation `.md` files (`PHASE_*`, `*_IMPLEMENTATION.md`, `*_FIX*.md`, etc.) from prior work sessions — these are historical logs, not living docs. Don't use them as a source of truth for current behavior; read the code.

## Commands

```bash
npm run dev              # start dev server (localhost:3000)
npm run build             # prisma generate && next build
npm run lint               # next lint
npm test                    # vitest run
npm run test:watch     # vitest watch mode
npm run test:ui           # vitest UI
```

Single test file: `npx vitest run lib/payout/__tests__/eligibilityRules.test.ts`

Prisma:
```bash
npx prisma generate
npx dotenv-cli -e .env.local -- npx prisma migrate deploy
npx prisma validate
```
Prisma reads `.env` (not `.env.local`) for `DATABASE_URL`/`DIRECT_URL` — keep both files in sync if you touch DB config. Stop `npm run dev` before running `prisma generate` on Windows or it can EPERM on the query engine.

**Build does not fail on type or lint errors** — `next.config.js` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Run `tsc --noEmit`/`npm run lint` yourself if you want those checks; Vercel won't block a broken build on them.

Local end-to-end job-loop testing (deposit → payout) is documented in `docs/full-job-loop-test.md` — it's the most reliable way to verify booking/payout changes actually work, including seed scripts (`scripts/setup-admin.ts`, `scripts/seed-cleaner.ts`) and useful troubleshooting for cookie/session issues per portal.

## Architecture

### Multiple portals, one codebase, separate auth per portal

This is the single most important thing to understand before touching routing, auth, or layouts. There is no unified session — each portal has its own cookie and auth mechanism, enforced in `middleware.ts`:

| Portal | Routes | Cookie / auth | Notes |
|---|---|---|---|
| Admin/ops | `/admin/*`, `/dashboard/*`, `/api/admin/*` | `admin_session` cookie (JSON `{userId, isBranchScoped}` or legacy `'true'`) | `/dashboard` is an alias that redirects into `/admin`. Branch-scoped admins (`isBranchScoped: true`) are restricted to an allowlist of paths — see `lib/auth/adminScope.ts` (`isPathAllowedForBranchScopedAdmin`/`...Api`) — and get redirected/403'd out of anything else, landing on `/admin/jobs`. |
| Customer portal | `/customer/*` | signed session token in cookie `vm_customer_session` (`lib/customerSession.ts`) | `/customer/dashboard` is legacy, redirects to `/customer/jobs`. Guest tip flow (`/customer/tip`) is public and redirects to `/tip`, bypassing the session check. |
| Cleaner portal | `/cleaner/*` (job workflow) and `/cleaners/*` (login/apply) | `cleanerId` cookie holding the real `User.id` (`lib/cleanerAuth.ts`) | Login is passwordless/email-only. Public paths under `/cleaners`: `login`, `apply`, `apply/success`, plus `/verify/certificate/*`. |
| SaaS product | `/saas/*` | JWT in `saas_token` cookie (`lib/auth/jwt.ts`), multi-tenant (`tenantId` in payload) | Distinct product bolted onto the same app; also has a legacy `saas_user_id` cookie fallback. |
| Branch owner / Pilot | `/branch-owner/*`, `/pilot/*` | separate auth in `lib/auth/branchOwnerAuth.ts` / `branchOperatorAuth.ts` | Blocked with a 404 in production by `middleware.ts` — still under active development, not yet public-facing. |

`middleware.ts` is the entry point for all of this routing/auth logic — read it fully before changing any portal's access rules, it's dense but it's the actual source of truth (not `RULES.md`).

### Branch-centric data model

Nearly every operational record is scoped to a `Branch` (`prisma/schema.prisma`): `Job`, `CleanerApplication`, `Lead`, pricing, service areas, payout rules, SOPs, etc. Country is not itself a data dimension for logic — branches carry their own service area, pricing model, payout rules, and automation config (`BranchServiceArea`, `BranchPayoutRules`, `BranchAutomationConfig`, `BranchLandingContent`, `BranchSops`). When adding a feature that touches jobs/cleaners/pricing, check whether it needs to be branch-scoped (most things do) rather than global.

### Job lifecycle drives payments and payouts

`Job.status` (service) and `Job.paymentStatus` (money) progress independently. Never hide a valid Job from the customer because payment is `PENDING`. Never flip `paymentStatus` to `PAID` to unlock ops.

Two commercial workflows:

| Policy (`BillingPolicy`) | Product | Assignment | Payment |
|---|---|---|---|
| `INVOICE_AFTER_SERVICE` | Host portal Add Cleaning — operational request, not a prepaid booking | Allowed while payment stays `PENDING` | Invoice after service; snapshot on the Job at create |
| `PREPAY` | Public `/book` + Stripe | Requires `PAID` or approved `DEPOSIT_PAID` | Stripe webhook is the source of truth — never flip `paymentStatus` from a client action alone |

Host submission (`POST /api/customer/properties/[id]/cleanings`) creates `RECEIVED` / `PENDING`, emails **Request Received** immediately, and writes an ops `HOST_CLEANING_REQUEST` notification. HTTP success must not depend on email.

`JobPayout` is created only after `paymentStatus` reaches `PAID` (via Stripe webhook, idempotent per `jobId`). Cleaner payout eligibility/amount is computed from branch payout rules (`lib/payoutRules.ts`, `lib/evaluatePayoutEligibility.ts`, `lib/assignment-scoring.ts`). Assignment gating lives in `lib/billing/billingPolicy.ts` (`isJobAssignable`) — do not reintroduce a global “PAID jobs only” filter on `/api/customer/jobs` or `/api/customer/home`.

Two Stripe charge modes exist, controlled by env: `BOOKING_PAYMENT_MODE=full` (charge full quote at checkout) vs `deposit` (charge `BOOKING_DEPOSIT_CENTS` up front, balance charged after job completion). The client reads the effective mode from `/api/booking/payment-config` at runtime rather than trusting `NEXT_PUBLIC_*` build-time values, since Vercel env changes require a redeploy but this endpoint doesn't.

### Cron jobs

`vercel.json` only wires up 4 crons (`send-review-requests`, `invoice-reminders`, `rebooking-reminders`, `lead-followup`), but `app/api/cron/` contains ~25 endpoints (payouts, W9 reminders, training nudges, promos, weekly digests, tax-year archiving, etc.). The rest are either triggered manually/externally (e.g. Zapier) or not yet scheduled — check `vercel.json` before assuming a cron endpoint runs automatically. All cron routes expect a `CRON_SECRET` bearer token.

### Path alias and Windows/Vercel quirks

`@/*` resolves to repo root (`tsconfig.json` + explicit webpack alias override in `next.config.js` — the override exists because Vercel's build previously failed to resolve `@/` without it; don't remove it without testing a Vercel build). Several `_disabled`/`_deprecated` directories exist (`app/_admin_disabled`, `app/_deprecated_booking`, `__archive/`) and are excluded from `tsconfig.json` — treat them as dead code, not something to fix or import from.

### Key domains under `lib/`

`lib/` is organized by domain rather than by layer — e.g. `lib/payout/`, `lib/pricing/`, `lib/dispatch/`, `lib/cleaners/`, `lib/customer/`, `lib/invoices/`, `lib/leadCenter/`, `lib/tax/`, `lib/whatsapp/`. When adding logic for a domain, check for an existing folder there first rather than putting business logic directly in route handlers. `lib/prisma.ts` exports the singleton Prisma client (standard Next.js dev-hot-reload guard pattern) — always import from there, never instantiate a new `PrismaClient`.

### Notifications are multi-channel

Email (Resend, `lib/email*`, `lib/emailTemplates.ts`), WhatsApp (`lib/whatsapp*`, Meta Graph API), and admin webhooks (`ADMIN_WEBHOOK_URL`, Zapier) are all wired into the job/booking lifecycle at various points (`lib/sendAdminNotification.ts`, `lib/sendCleanerAssignment.ts`, `lib/sendCustomerConfirmation.ts`, etc.) — a feature that changes job state often needs to trigger one of these, check for an existing `send*.ts` helper before adding a new notification path.
