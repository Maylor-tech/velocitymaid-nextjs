# WR-2H Release Hardening Notes

Local release-hardening package on `feature/winter-readiness-growth`. No remote push or Preview refresh under WR-2H.

## Fixture safety

Removed runtime `wr2Fixture` query-parameter bypasses from `app/cleaner/jobs/page.tsx`.

Offers error/empty and unknown-training UI branches remain production UI paths driven by real API failures and empty responses. Regression: `app/cleaner/jobs/__tests__/noRuntimeFixtures.test.ts`.

## Arrival and required photos

`evaluateFinishPhotos` no longer treats `arrivalCondition == null` as a silent pass. Null arrival now sets `needsArrival: true` and still reports missing required AFTER slots. Cleaner Finish returns HTTP 400 with an actionable message.

Legacy / stuck IN_PROGRESS jobs without arrival remain finishable via admin photo-review `override-finish` (existing path). No date-based legacy exemption and no schema change.

## Training status

Cleaner portal certification for the jobs banner is authoritative via `getCertificationSummary` (module + quiz completion), not `TrainingStatus.overallStatus` (used for Jamaica dispatch PASSED checks). UI copy now distinguishes not-started, in-progress, unknown, and certified.

## NJ deduplication

90-second progressive-quote dedupe remains best-effort lookup-then-create. Deduped responses skip lead create, customer create, deposit, nurture, WhatsApp, and `notifyNjLeadFollowUp`. Concurrent races can still create duplicates without a unique constraint; that stronger guarantee is out of WR-2H scope.
