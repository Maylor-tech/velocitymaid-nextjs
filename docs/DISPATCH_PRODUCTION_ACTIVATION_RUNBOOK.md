# Dispatch Production Activation Runbook

**Phase:** 5 — Production activation procedure (documentation only)  
**Baseline:** `origin/main` merge commit `cde5e0abe0d0de6f2a95beef2f0968f3d0d56ca0`  
**Production flag today:** `DISPATCH_OFFERS_VERMONT` must remain **OFF** until a human follows this runbook.  
**This document does not activate Production.** Setting the flag is a separate, controlled decision.

Related:

- Isolation / staging gate: `docs/DISPATCH_PRODUCTION_READINESS.md`
- Earlier acceptance notes: `docs/dispatch/CLEANER-DISPATCH-PHASE1-ACCEPTANCE.md`

Do not put secrets, connection strings, cookies, bypass tokens, or real cleaner/customer credentials in this file or in incident notes that will be committed.

---

## 1. Prerequisites

All of the following must already be true before anyone touches Production env:

| Prerequisite | Evidence |
|---|---|
| Isolation code is on Production `main` | Merge of PR #10 at `cde5e0a` (or a later `main` that contains it) |
| Production deploy of that SHA is READY | Vercel Production deployment for `main` |
| Isolated staging Supabase exists | Preview project ref `wfudxrziqyfvrdgnocky` (not Production `chsahtnpwssyfrqzcncz`) |
| Staging schema + seed completed | 76 migrations applied; `dispatch:staging-verify` passed; `@example.test` fixtures only |
| Live staging acceptance | **17/17 PASS** on isolated Preview / staging DB |
| Preview notifications stay blocked | Preview `DISPATCH_NOTIFICATIONS=off` (do not copy this onto Production) |
| Production dispatch is still OFF | Production `DISPATCH_OFFERS_VERMONT` is unset or `false` — never `true` until §6 |
| Operator + rollback owner are named | Same person may hold both; they must be available through first-accept |
| First job and first cleaner are pre-selected | See §3 — one Vermont job, one Vermont cleaner |
| Immediate-assign fallback still works | Non-Vermont markets, and Vermont while the flag is OFF |

Do **not**:

- Copy staging `DATABASE_URL` / `DIRECT_URL` / Supabase keys into Production
- Set `DISPATCH_STAGING` or `DISPATCH_STAGING_DB_CONFIRMED` on Production
- Set `DISPATCH_NOTIFICATIONS=off` on Production (that would silently block real offer email)
- Use Chipman invoices **0021**, **0022**, or **0017** as test jobs
- Create Production `JobOffer` rows before the flag is intentionally turned on

---

## 2. Go / no-go checklist

**GO** only if every box is checked. One miss is **NO-GO**.

- [ ] Production `main` includes `cde5e0a` and the current Production deploy is READY
- [ ] Production runtime looks healthy (no dispatch-related 500s; booking / host request / assign still work)
- [ ] Staging 17/17 is complete and was **not** run against Production data
- [ ] Production `DISPATCH_OFFERS_VERMONT` is still OFF
- [ ] Preview still uses staging Supabase; Production still uses Production Supabase
- [ ] Preview `DISPATCH_NOTIFICATIONS=off` remains Preview-only
- [ ] First-live job meets §3 (Vermont, future date, assignable, not Chipman)
- [ ] First-live cleaner is an approved, active Vermont cleaner who can open the cleaner portal
- [ ] Ops can cancel an open offer while the flag is ON (`Dispatch` panel → Cancel offer)
- [ ] Rollback owner can set Production `DISPATCH_OFFERS_VERMONT=false` and redeploy
- [ ] Manual assign still works on a non-Vermont job (or on Vermont while flag is OFF)
- [ ] No other Production env edits are queued in the same window

**NO-GO (stop, do not set the flag):**

- Production deploy is not READY, or SHA is before `cde5e0a`
- Preview and Production share a database
- Anyone proposes copying staging secrets into Production
- First job is already assigned, in the past, PREPAY-unpaid, or a Chipman fingerprint invoice
- Rollback owner is unavailable
- A production incident is already open

---

## 3. First-live-dispatch criteria

First live dispatch is **one job, one cleaner, Vermont only**.

Job:

- Branch slug `vermont` (default allowlist; do not set `DISPATCH_OFFERS_BRANCH_SLUGS` on Production unless a later phase expands markets)
- Future service date
- Status `RECEIVED` or `CONFIRMED`
- `assignedCleanerId` is null
- Assignable under `isJobAssignable` — prefer a host job with `billingPolicy=INVOICE_AFTER_SERVICE` and `paymentStatus=PENDING`
- Not Chipman 0021 / 0022 / 0017
- Urgency `STANDARD` unless ops explicitly needs a shorter TTL

Cleaner:

- Role `CLEANER`, `isActive=true`
- Same Vermont branch
- Approved application **or** internal team
- Can log into `/cleaner` and open `/cleaner/jobs/{jobId}`
- Expects a real offer email (Production sends to the intended address)

Success for “first live dispatch” is **not** “dispatcher exists.” It is:

1. One offer created
2. Cleaner notified (email logged `SUCCESS`, or portal-only fallback documented)
3. Cleaner accepts
4. Job becomes `ASSIGNED` with that cleaner
5. `paymentStatus` and `reviewStatus` unchanged
6. Calendar sync runs on accept, not on offer
7. Admin UI shows Assigned

---

## 4. One-job / one-cleaner controlled rollout

Until Phase 1 is declared operational (§17):

- Send **at most one** live `OFFERED` row at a time
- Do not offer a second cleaner until the first offer is `ACCEPTED`, `DECLINED`, `EXPIRED`, or `CANCELLED`
- Do not enable other branch slugs
- Do not turn on auto-offer / blast / WhatsApp offer paths
- Keep Jamaica / New Jersey on immediate assign
- After the first accept, pause and complete §8–§13 before a second job

---

## 5. Expected database state (by stage)

| Stage | `DISPATCH_OFFERS_VERMONT` | Job | JobOffer | Assignment / money |
|---|---|---|---|---|
| **A. Pre-activation** | OFF / not `true` | Unassigned, `RECEIVED` or `CONFIRMED` | No Production offer for this job | `assignedCleanerId` null; `paymentStatus` unchanged |
| **B. Flag ON, no offer yet** | `true` | Same | Still none | Immediate assign on Vermont returns `409 USE_SEND_OFFER`; auto-assign reason `dispatch_offers_required` |
| **C. Offer sent** | `true` | Still unassigned | One row `OFFERED`, `expiresAt` in the future, snapshot `compensationAmount` / `compensationBasis` | `AuditLog` `JOB_OFFER_CREATED`; `IntegrationEventLog` `SEND_CLEANER_OFFER_EMAIL` SUCCESS or FAILED; admin `CLEANER_OFFERED` |
| **D. Cleaner accepted** | `true` | `ASSIGNED`, `assignedCleanerId` set, `assignedAt` set | That row `ACCEPTED`, `respondedAt` set | `AssignmentLog` `ASSIGNED`; `AuditLog` `JOB_OFFER_ACCEPTED`; payment/review unchanged |
| **E. Declined / cancelled / expired** | `true` | Unassigned | Terminal `DECLINED` / `CANCELLED` / `EXPIRED` | Job stays cleaner-needed; payment/review unchanged |
| **F. Rolled back** | OFF | Unchanged by the flag itself | Existing rows remain; new creates `409 DISPATCH_OFFERS_DISABLED` | Vermont immediate assign returns after redeploy |

Expiry is **timestamp-authoritative**. Stored `OFFERED` + `expiresAt <= now` is effectively `EXPIRED` even before the daily cron (`15 4 * * *` UTC, `/api/cron/dispatch-offer-expire`) persists the row.

---

## 6. Exact activation procedure

Do this only after §2 is GO. Do not do it as part of merging a runbook PR.

1. Confirm Production deploy SHA is `cde5e0a` or later and READY.
2. Confirm Production `DISPATCH_OFFERS_VERMONT` is not `true`. Do not print or paste the value into chat/docs.
3. Confirm Preview still has `DISPATCH_NOTIFICATIONS=off` and still points at staging Supabase.
4. Name the first job id / `jobReference` and first cleaner id in the incident/activation note (not in this repo file).
5. In Vercel → Production env only, set:

   ```
   DISPATCH_OFFERS_VERMONT=true
   ```

   Scope: **Production target only**. Leave Preview as-is (Preview may stay `false` after staging rollback).
6. Do **not** add to Production: `DISPATCH_STAGING`, `DISPATCH_STAGING_DB_CONFIRMED`, `DISPATCH_NOTIFICATIONS`, staging database URLs, or `DISPATCH_OFFERS_BRANCH_SLUGS` unless expanding markets (not Phase 1).
7. Redeploy Production so serverless functions pick up the env change. Wait until the new Production deploy is READY.
8. Continue to §7 immediately. If verification fails, go to §15.

Estimated clock time for steps 5–7: **about 5–15 minutes** (env edit + Production rebuild).

---

## 7. Verification immediately after activation

Before sending a real offer:

1. Open a **Vermont** assignable job in `/admin/jobs/{jobId}`.
2. Confirm the **Dispatch** panel is visible (Send offer), not **Assign Cleaner**.
3. Confirm compensation is a required ops field (not a customer invoice total).
4. Open a **non-Vermont** assignable job. Confirm **Assign Cleaner** is still present.
5. Optional read-only API checks (admin session; do not POST an offer yet):
   - `GET /api/admin/jobs/{vermontJobId}/offers` → `dispatchOffersEnabled: true`
   - `POST /api/admin/jobs/manual-assign` on that Vermont job → `409 USE_SEND_OFFER`
6. Confirm Production logs have no new 500s on those GETs.

If Dispatch is missing on Vermont, or Assign is missing on other markets, **rollback (§15)** before creating an offer.

---

## 8. First real offer procedure

One job, one cleaner:

1. On the Vermont job, set urgency (`STANDARD` unless same-day).
2. Enter **approved cleaner pay** and basis (`FLAT` / `HOURLY` / `OTHER`). Do not type the customer quoted total / invoice total.
3. Optional: short TTL override only if the cleaner is standing by (otherwise use the default: STANDARD 120 minutes, SAME_DAY/URGENT 30 minutes unless env overrides exist).
4. Select the pre-chosen cleaner. Click **Send offer**.
5. Expected HTTP: `200` with `offer.status=OFFERED` and `expiresAt`.
6. Expected job row: still unassigned. **Do not** treat the offer as an assignment.
7. Expected admin badge: `Offer sent to {cleaner}`.
8. Immediately run §9–§11.

If create returns `DISPATCH_OFFERS_DISABLED`, the Production flag is not live — do not retry blindly; re-check env target and redeploy.

If create returns `OFFER_OPEN`, cancel or wait out the existing live offer first.

If create returns `ALREADY_ASSIGNED` / `PAYMENT_REQUIRED` / `REVIEW_REQUIRED` / `INVALID_STATUS`, stop and pick a different job.

---

## 9. Notification verification

Offer create **succeeds even if email fails**. `notifyCleanerOfOffer` is fire-and-forget.

Check `IntegrationEventLog` for this `jobId`:

| Result | Meaning | Action |
|---|---|---|
| `SEND_CLEANER_OFFER_EMAIL` `SUCCESS` | Production Resend accepted the send | Ask the cleaner to check inbox + portal |
| `FAILED` with a provider error | Offer exists; email did not send | Contact the cleaner out of band; they can still accept in the portal |
| No row | Notify helper crashed before logging | Treat as portal-only; do not recreate the offer |

Email copy must be an **offer**, include cleaner pay + expiry + portal link, and must **not** include customer invoice totals or lockbox/gate codes.

Do **not** turn on Preview sends to “test” Production. Do not send WhatsApp offers in Phase 1.

Admin in-app: `CLEANER_OFFERED` should appear for the job.

---

## 10. Cleaner acceptance verification

1. Cleaner opens `/cleaner/jobs` and `/cleaner/jobs/{jobId}`.
2. They see an offer (pay, expiry, area — not property access) while the job is unassigned.
3. They accept via `POST /api/cleaner/offers/{offerId}/accept` (portal button).
4. Expected: `200`, job `ASSIGNED`, `assignedCleanerId` = that cleaner.
5. After accept, access / address / standing notes become visible.
6. Decline path (only if testing a second offer later): `POST /api/cleaner/offers/{offerId}/decline` → job unassigned, admin `CLEANER_DECLINED`.

Reject cases that must remain true:

- Other cleaner → `403 OFFER_NOT_YOURS`
- After `expiresAt` → `409 OFFER_EXPIRED` (even if stored status is still `OFFERED`)
- After assignment → `409 ALREADY_ASSIGNED`

The assigned-job “I’m on the way” route (`PATCH /api/cleaner/jobs/{jobId}/accept`) is **not** the offer-accept path. If the job is still unassigned, it returns `409 RESPOND_TO_OFFER`.

---

## 11. Assignment verification

On accept, confirm **all** of:

- `Job.status = ASSIGNED`
- `Job.assignedCleanerId` = accepting cleaner
- `Job.assignedAt` set
- `JobTeamMember` has that cleaner
- `Job.paymentStatus` unchanged (host jobs often stay `PENDING`)
- `Job.reviewStatus` unchanged
- `AssignmentLog.outcome = ASSIGNED`, reason `Cleaner accepted offer`
- `AuditLog.action = JOB_OFFER_ACCEPTED`
- Google Calendar sync ran **on accept**, not when the offer was created
- A second offer cannot be created (`409 ALREADY_ASSIGNED` or job no longer offerable)

---

## 12. Admin verification

- Dispatch badge: `Assigned: {name}`
- Offer history shows `ACCEPTED`
- Vermont job no longer shows Send offer while assigned
- QC / invoice path is unchanged: cleaner **Finish** goes to `AWAITING_QC`; ops still Mark Clean Complete / invoice
- If the cleaner later walk-off declines an **assigned** job (`PATCH /api/cleaner/jobs/{jobId}/decline`), the job returns to unassigned and ops can send a new offer while the flag is ON

---

## 13. Monitoring checklist (first 24 hours)

Watch, do not scrape Production for “test offers”:

- [ ] New `JOB_OFFER_CREATED` / `ACCEPTED` / `DECLINED` / `CANCELLED` / `EXPIRED` audit rows look coherent
- [ ] `SEND_CLEANER_OFFER_EMAIL` SUCCESS vs FAILED rate
- [ ] No `500` on `/api/admin/jobs/{id}/offers` or `/api/cleaner/offers/{id}/accept`
- [ ] No Vermont immediate-assign `200` while the flag is ON (should be `409 USE_SEND_OFFER`)
- [ ] Auto-assign cron skips Vermont with `dispatch_offers_required`
- [ ] Non-Vermont assign + booking + host Add Cleaning still work
- [ ] No Production rows labeled `STAGING TEST — DO NOT SERVICE`
- [ ] Daily expire cron runs (`/api/cron/dispatch-offer-expire`); UI already treats stale `OFFERED` as expired
- [ ] `paymentStatus` never flipped to unlock assignment

---

## 14. Rollback triggers

Rollback **immediately** if any of:

- Offers created on the wrong branch / wrong environment
- Customer invoice totals or access codes appear in offer email
- Double assignment, or `paymentStatus` / `reviewStatus` mutated by accept
- Production sending from a staging identity, or staging DB receiving Production jobs
- Repeated 500s on create/accept/cancel
- Cleaners cannot see or accept a live offer and ops cannot recover via portal + cancel
- Any Production `JobOffer` created accidentally before a GO decision

Do **not** rollback for a single failed email if the offer is in the portal and the cleaner can accept.

---

## 15. Exact rollback procedure

Turning the flag to `false` **immediately prevents new offers** after Production redeploys (`409 DISPATCH_OFFERS_DISABLED`). It does **not** delete rows and does **not** unassign jobs.

### Preferred (planned rollback)

1. While the flag is still ON, open each live Vermont job with an effectively open offer.
2. Click **Cancel offer** (or `POST /api/admin/jobs/{jobId}/offers/{offerId}/cancel`).
3. Confirm each row is `CANCELLED` and the job is unassigned (`Cleaner needed`).
4. Set Production `DISPATCH_OFFERS_VERMONT=false` (Production target only).
5. Redeploy Production. Wait READY.
6. Confirm Vermont admin UI shows **Assign Cleaner** again.
7. Confirm `POST /api/admin/jobs/{jobId}/offers` returns `409 DISPATCH_OFFERS_DISABLED`.
8. Use immediate assign as needed (§16).
9. Leave Preview `DISPATCH_NOTIFICATIONS=off`. Do not touch staging Supabase.

### Emergency (flag off first)

1. Set Production `DISPATCH_OFFERS_VERMONT=false` and redeploy now.
2. New creates stop. Already-`OFFERED` rows **remain**.
3. Cleaner accept/decline of those rows **still works** (offer routes do not re-check the flag). That is intentional: an in-flight offer can still complete or be refused.
4. Admin **Dispatch** panel is hidden while the flag is OFF, so Cancel is not in the usual UI. Cancel via:

   `POST /api/admin/jobs/{jobId}/offers/{offerId}/cancel`

   or wait until `expiresAt` (timestamp expiry still rejects accept).
5. **Do not immediate-assign a job that still has a live `OFFERED` row** unless you have cancelled or it has expired. Accept uses a job-row lock: a later accept would return `409 ALREADY_ASSIGNED`, but the leftover `OFFERED` row is confusing until cancelled/expired.
6. Then §16.

Rollback is an **env change + redeploy**, not a migration. Do not drop `JobOffer` tables or columns.

Already-`ACCEPTED` / assigned jobs are normal assignments. Leave them. Do not reverse payment or invoices.

---

## 16. Manual-dispatch fallback

When the flag is OFF (or the job is not Vermont):

- Admin job page: **Assign Cleaner**
- API: `POST /api/admin/jobs/manual-assign` with `{ jobId, cleanerId }`
- Auto-assign cron / Stripe / booking auto-assign use `lib/cleaner-assignment.ts` and no longer skip Vermont with `dispatch_offers_required`

When the flag is ON for Vermont:

- Manual assign returns `409 USE_SEND_OFFER`
- Use Send offer, or roll back, then assign

Fallback does not require deleting offer history. Terminal offer rows are the audit trail.

---

## 17. Incident documentation procedure

For activation, first offer, rollback, or any trigger in §14, write a note (ops channel or private doc — not this repo unless asked) containing:

- UTC timestamp
- Production deploy URL / SHA
- Job id / `jobReference` (no customer PII beyond what ops already stores)
- Cleaner id (not password, not session cookie)
- Offer id and stored + effective status
- Flag value intended (`true` / `false`) — not other secrets
- HTTP status + dispatch `code` if any (`USE_SEND_OFFER`, `OFFER_EXPIRED`, …)
- `AuditLog` actions and `IntegrationEventLog` status for the job
- Whether email was SUCCESS or FAILED
- Whether assignment, payment, and review matched §5 / §11
- Decision: continue / pause / rollback
- Who executed rollback and when Production was READY again

Never commit `.env.staging`, bypass secrets, or Production connection strings.

---

## 18. Criteria for declaring Dispatch Phase 1 operational

Declare Phase 1 operational only when **all** are true:

- [ ] Production flag has been ON through at least one real Vermont accept (§3)
- [ ] That accept matched §11 (assignment yes, payment/review unchanged)
- [ ] Offer email either succeeded or the failure was understood and the portal path worked
- [ ] No rollback trigger from §14 remains open
- [ ] A planned or emergency rollback was understood by the operator (cancel-then-flag, or flag-then-API-cancel)
- [ ] Immediate assign still works for non-Vermont
- [ ] Preview remains isolated; `DISPATCH_NOTIFICATIONS=off` on Preview; Production secrets were not overwritten
- [ ] Monitoring §13 is quiet for the first live job
- [ ] A second Vermont job is **not** required to declare Phase 1, but do not expand slugs or automation until after that first accept review

Until then, keep the rollout at one-job / one-cleaner (§4).

---

## 19. Rollback safety (implementation facts)

`isDispatchOffersEnabledForBranch` requires `DISPATCH_OFFERS_VERMONT === 'true'` **and** branch slug in the allowlist (default `vermont`).

| Path | Flag OFF | Flag ON (Vermont) |
|---|---|---|
| `POST /api/admin/jobs/{id}/offers` | `409 DISPATCH_OFFERS_DISABLED` | Create (after staging-DB gate; Production always passes that gate) |
| `POST /api/admin/jobs/manual-assign` | Immediate assign | `409 USE_SEND_OFFER` |
| Auto-assign | Runs | `dispatch_offers_required` |
| Cleaner offer accept/decline | Still allowed for existing rows | Allowed |
| Admin cancel API | Still allowed | Allowed |
| Admin Dispatch UI | Hidden — use cancel API if a live offer remains | Visible |
| Timestamp expiry + daily cron | Still apply | Apply |
| Existing `ACCEPTED` assignment | Unchanged | Unchanged |

**Conclusion:** Setting the flag back to `false` and redeploying immediately stops **new** offers. Already-created offers stay in a safe state: they can be accepted, declined, cancelled, or expire; accept cannot double-assign; payment is not touched. The understandable ops sequence is **cancel live offers, then flip the flag**, so the Dispatch panel is not hidden while a live offer still needs Cancel.

---

## 20. What this runbook does not do

- Does not set Production `DISPATCH_OFFERS_VERMONT=true`
- Does not modify Production or Preview env
- Does not create Production `JobOffer` rows
- Does not send notifications
- Does not merge or deploy
- Does not delete `.env.staging`, `dispatch-stash.patch`, or git stash entries
