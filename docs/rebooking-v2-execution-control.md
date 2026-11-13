# Rebooking reminder v2 execution control

This is the local Stage 5A-I2 design. It does not retarget the production scheduler and it does not enable sending.

## Authorization flow

`/api/cron/rebooking-reminders-v2` allows a run only when every gate passes, in this order:

1. `REBOOKING_REMINDERS_ENABLED` is exactly `true` after trimming and lowercasing. Unset, blank, `false`, and every other value fail closed. This is separate from the legacy helper, which treats an unset value as enabled.
2. `VERCEL_ENV` is exactly `production`.
3. The existing `verifyCronAuth` check accepts the bearer token or `x-cron-secret`.
4. `VERCEL_DEPLOYMENT_ID` and `VERCEL_GIT_COMMIT_SHA` are present and match the platform formats.
5. The singleton `rebooking_execution_controls` row exists, is enabled, names that same deployment and commit, has a positive generation, and has operator attribution.
6. The generation captured for the run is still current before ledger recovery, immediately before each claim, and immediately before each provider call.

Runtime identity is read only from `process.env`. Request headers, the body, the query string, the hostname, and the user agent are not identity sources.

The delivery module is imported only after the route gates pass. A failed gate does not claim a row or call the provider.

## Control record

The worker key is exactly `rebooking-reminders`. The migration inserts that row disabled, with generation `0`, null deployment and commit, and migration attribution. A database check rejects an enabled row that lacks a `dpl_` deployment id, a 40-character lowercase commit, a positive generation, or an operator name.

Generation changes on both authorization and revocation. An operator updates the row with a privileged database role: enabling or changing the approved deployment or commit increments generation, and disabling the row also increments generation and clears the approved identity. The worker has no update privilege on this table. A changed generation fails the next claim and the next provider call.

The check immediately before a provider call and the provider call itself are not one database transaction. A revocation that arrives after the provider has accepted the request cannot recall that request. The ledger then records the provider result, or `UNKNOWN` when the result is uncertain.

## Claim interruption

- Revoked before claim: no row is created and the provider is not called.
- Revoked after claim and before the provider call: the `CLAIMED` row, its first-attempt clock, and its fingerprint stay as they are. A later authorized retry can use the same idempotency key while the claim is inside the existing 22-hour window.
- Provider result uncertain, including timeout, a missing message id, `invalid_idempotent_request`, and `concurrent_idempotent_requests`: the owned claim is recorded as `UNKNOWN`.
- Provider acceptance followed by a failed ledger write: the response is `accepted_unrecorded`. The code does not write a second outcome and does not clear the first-attempt clock.

A terminal `ACCEPTED` or `UNKNOWN` row is not claimed again. A historical `ACCEPTED` row remains terminal when its fingerprint is null.

## Payload fingerprint

The provider request is built once. That object is both hashed and passed to the send function. The canonical form is UTF-8 JSON with these keys in order:

`attachments`, `bcc`, `cc`, `from`, `headers`, `html`, `idempotencyKey`, `replyTo`, `subject`, `text`, `to`.

Fields this sender does not use are JSON `null`. The fingerprint is the lowercase hex SHA-256 of that JSON. It is stored on the first successful claim. A database trigger rejects any later change, including a null-to-value backfill.

An identical retry may send the same request with the original key `rebooking-reminder-${jobId}`. A different fingerprint does not call the provider, does not mint a new key, and moves the owned nonterminal row to `UNKNOWN` for reconciliation. A nonterminal row with a null fingerprint is held the same way. The key stays within Resend's 256-character limit or the delivery is held.

The retry window remains 22 hours from `firstProviderAttemptAt`. The stale-claim window remains 15 minutes. Those clocks are not reset.

## Candidates

Eligibility is unchanged: the checkout day seven days ahead, a customer, not archived, not cancelled, a sendable email, and no turnover follow-up in the existing window. The query orders by `preferredDate`, then `id`, and takes five. The same limit is applied again in memory. There is no catch-up for a missed day.

The scheduler remains daily at 08:00 UTC on `/api/cron/rebooking-reminders`. A failed or claimed delivery whose first attempt is more than 22 hours old is parked as `UNKNOWN` before it can be retried on the next day's run. This implementation does not widen that window or change `vercel.json`.

The checkout window uses the server's local calendar day. Production runs in UTC, so the selected day is the UTC day seven days ahead.

## Original route

`GET` and `POST /api/cron/rebooking-reminders` return the disabled body and do not authenticate, claim, or send. The production firewall deny on that exact path stays in place.

## Permission boundary

Row security and a restricted role can be demonstrated on a disposable database. The shared Next.js runtime uses the application database role, which can bypass row security. That does not establish an independent authorization boundary. See the Stage 5A-I3 closeout. No production role or grant is changed by this package.
