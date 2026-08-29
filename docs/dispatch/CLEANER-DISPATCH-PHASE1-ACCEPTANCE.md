# Cleaner Dispatch Phase 1 — Production Acceptance Runbook

**Status:** Implementation complete. **Not deployed. Flag default OFF.**  
**Do not enable `DISPATCH_OFFERS_VERMONT` in production until this gate passes.**  
**Do not migrate production, deploy, or modify production data without explicit approval.**

Chris Chipman invoices **0021**, **0022**, and **0017** are out of scope. Do not open, edit, or use them as test jobs.

---

## 0. Preconditions

- Staging (or production with flag **off**) only.
- Additive migration `20260829010000_add_job_offer_dispatch` reviewed and applied on the target environment **only after approval**.
- Env (staging):
  - `DISPATCH_OFFERS_VERMONT=false` until step 8.
  - `DISPATCH_OFFER_TTL_MINUTES` (STANDARD, proposed `120`)
  - `DISPATCH_OFFER_TTL_MINUTES_URGENT` (SAME_DAY / URGENT, proposed `30`)
- Vermont test host job: **future date**, `billingPolicy=INVOICE_AFTER_SERVICE`, `paymentStatus=PENDING`.
- Test cleaner: real Vermont cleaner or Brian test cleaner. Not a Chipman job.

Rollback remains available at every step: leave/set `DISPATCH_OFFERS_VERMONT=false`. Open `OFFERED` rows can be cancelled in admin. Job assignment model is unchanged.

---

## 1. Migration (staging / approved env only)

```bash
npx prisma migrate deploy
```

Verify (read-only):

- `JobOffer` table exists.
- `Job.startedAt`, `Job.estimatedDurationMins`, `Job.dispatchUrgency` exist.
- `clean_photos.category` default `OTHER`, `customerVisible` default `false`.
- No updates to `Invoice` or `Payment` rows.
- Fingerprint 0021 / 0022 / 0017 unchanged (invoice number, status, amounts).

---

## 2. Flag off — existing assign still works (non-Vermont / Vermont until enable)

With `DISPATCH_OFFERS_VERMONT` unset or `false`:

- Admin job page still shows **Assign Cleaner** (immediate assign).
- Auto-assign cron still runs.
- Photo sign/register now require admin or assigned cleaner (this is live as soon as the code ships, even with the dispatcher flag off). Confirm cleaner and admin photo upload still work.

---

## 3. Enable flag on staging only

Set `DISPATCH_OFFERS_VERMONT=true` (Vermont slug only). Redeploy or restart.

Vermont jobs:

- Admin **Assign** is replaced by **Send offer**.
- `POST /api/admin/jobs/manual-assign` returns **409** `USE_SEND_OFFER`.
- Auto-assign returns `dispatch_offers_required` and skips the job.

Other markets keep immediate assign.

---

## 4. Expire path

1. Create/use a future Vermont host job, `SAME_DAY`, short TTL override (e.g. 2 minutes) on Send offer.
2. Confirm email: subject **Job offer**, portal link, expiry, cleaner pay — **no** customer invoice `$300` / `$337.80`.
3. Confirm offer payload has area/city, not lockbox/gate codes.
4. Wait for `/api/cron/dispatch-offer-expire` (or invoke with `Authorization: Bearer $CRON_SECRET`).
5. Offer → `EXPIRED`. Job stays unassigned (`assignedCleanerId` null). UI: **Cleaner needed**.
6. Send a second offer to another cleaner. Must succeed.

---

## 5. Happy path

1. Cancel any leftover offer. Send offer with **ops-entered compensation** (do not skip the amount).
2. Cleaner portal `/cleaner/jobs`: offer in inbox. Deep link `/cleaner/jobs/{jobId}` shows offer, not work order.
3. **Accept** → Job `ASSIGNED`, `assignedCleanerId` set, Calendar sync **on accept not on offer**. Event fields unchanged.
4. Confirm `paymentStatus` still `PENDING`. `reviewStatus` unchanged (customer commercial approval is separate).
5. After accept: property access, address, standing notes visible.
6. **Start Job** → `startedAt` persisted. Timer is server-derived.
7. Checklist + categorized photos (`BEFORE`/`AFTER`/`ISSUE`). `customerVisible` remains false. No customer gallery.
8. Flag issue (escalate) → admin `JOB_ISSUE_REPORTED`.
9. **Finish Job** → submitted for QC. Status `COMPLETED`, duration recorded. **Job not PAID. No invoice created or sent.**
10. Admin QC: existing Mark Clean Complete / billing panel still works. Invoice only from admin path.

---

## 6. Calendar

- No event created at Send offer.
- Event created/updated **on accept** via existing `awaitJobCalendarSync` (payload unchanged).

---

## 7. Chipman fingerprint (read-only)

Confirm invoices 0021, 0022, 0017: same status, amounts, payment records. No new writes.

---

## 8. Production enable (Vermont only, after staging pass)

1. Deploy with flag **off**.
2. Apply migration (approved window).
3. Confirm photo auth did not break production cleaner uploads.
4. Enable `DISPATCH_OFFERS_VERMONT=true` for Vermont only.
5. Repeat a single future-date Vermont host job happy path.
6. Do not enable other branch slugs.

---

## Rollback

1. Set `DISPATCH_OFFERS_VERMONT=false` (immediate assign returns for Vermont).
2. Ops cancel any `OFFERED` rows.
3. Do not drop columns/tables unless a dedicated rollback migration is approved.
4. Do not touch invoices or Chipman payment rows.

---

## Explicitly out of scope

- Historical Chipman invoices / payments / billing reconciliation
- Customer pricing
- Google Calendar event structure
- Jamaica WhatsApp YES/NO offer path
- Enabling the flag because unit tests passed
