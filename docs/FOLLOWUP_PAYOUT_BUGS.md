# Follow-up: payout and 1099 bugs

Not fixed in this release. Production builds still run with `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`.

## `generatePayouts.ts` is missing

`workers/generatePayouts.ts` is an empty file, so it is not a module (`TS2306`). These routes import `generatePayouts` from it and cannot run:

- `app/api/admin/payouts/generate/route.ts`
- `app/api/admin/payout-shadow/run/route.ts`

## `PayoutPolicyVersion` model is missing

`schema.prisma` has no `PayoutPolicyVersion` model. `JobPayout.policyVersionId` is only a string. `prisma.payoutPolicyVersion` is still called from:

- `app/api/admin/payouts/list/route.ts`
- `workers/payoutShadowBacktest.ts`
- `scripts/validate-payout-engine.ts`
- `scripts/create-nj-payout-policy.ts`

`prisma.payoutPolicyAssignment` is also missing from the client. It is used by `services/payout/getActivePolicyVersion.ts` and `scripts/create-nj-payout-policy.ts`.

## 1099 call-sheet button

On `app/admin/taxes/1099/page.tsx`, Download Call Sheet renders only when the year is not archived, the Jan 31 countdown is active, and `callList.length > 0`:

`!isArchived && readinessData?.countdown?.active && callList.length > 0`

The load effect calls `fetchCallList()`, and that function is not defined (`TS2304`). `callList` stays empty, so the button never appears. The PDF route is already at `/api/admin/1099/[year]/call-sheet.pdf`. This is product behavior. Do not delete the call list or change the condition to silence the type error.

## Old error count

`npx tsc --noEmit --pretty false` reports **813** `error TS` diagnostics on this tree (measured 2026-11-19, after the two branch-file type fixes). That is the deferred debt. Files changed on `feature/ops-desk-v2` versus `main` are held to zero TypeScript and ESLint errors by `npm run quality:changed`.
