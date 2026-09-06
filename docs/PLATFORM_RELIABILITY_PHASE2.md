# Platform Reliability Phase 2

Technical-debt ratchet and build-gate preparation. This is **not** a whole-repository TypeScript or ESLint cleanup.

## Why the ratchet exists

VelocityMaid currently ships with Next.js `ignoreBuildErrors` / `ignoreDuringBuilds` turned on. A whole-repo `tsc` / `lint` run reports hundreds of diagnostics, most of them in untouched legacy modules.

Flipping those flags today would block every production build. Cleaning 1,000+ errors in one branch would mix unrelated risk into billing, auth, and cron.

Phase 2 instead:

1. Records a machine-readable baseline.
2. Cleans the highest-risk production modules first.
3. Fails pull requests that introduce **new** TypeScript or ESLint errors **in files they touch**.
4. Leaves legacy debt in unchanged files alone.

## Current debt baseline

Captured on 2026-09-04 at `origin/main` (`207fd7adf43f5bf0cf9a2aee903af05a196532a6`). Full numbers live in [`docs/technical-debt-baseline.json`](./technical-debt-baseline.json).

| Signal | Baseline |
|---|---|
| TypeScript errors | 957 (249 files) |
| ESLint errors | 1301 |
| ESLint warnings | 49 |
| Tests | 377 passed / 60 files |
| `npm run build` | success (flags still ignoring TS/ESLint) |

Top TypeScript codes: `TS2339`, `TS2551`, `TS2322`, `TS2353`, `TS2561`.  
Top directories: `app/api`, `lib/pricing`, `lib/cleaner-assignment.ts`, `scripts/`, `lib/pilot`.

## How developers use it

```bash
npm test
npm run quality:changed
```

`quality:changed` diffs against `origin/main` (override with `QUALITY_BASE`), collects changed `.ts` / `.tsx` files, and fails if those files still have TypeScript or ESLint **errors**. Warnings do not fail the ratchet. Unchanged files are ignored even when they still have legacy diagnostics.

If you touch a dirty file, you own making that file clean.

## How pull requests are checked

[`.github/workflows/quality-gate.yml`](../.github/workflows/quality-gate.yml) runs on every pull request:

1. `npm test`
2. `npm run quality:changed` (against the PR base branch)
3. `npm run build`

The workflow does **not** run whole-repo `tsc --noEmit` or `npm run lint` as a merge gate. Untouched legacy errors must not block a PR.

## What remains legacy debt

Everything outside this Phase 2 target set is still baseline debt, including:

- Most of `app/api/**` (admin 1099, tax profiles, SaaS, booking extras)
- `lib/pricing` (Job lock columns that were never added to Prisma)
- `lib/permissions/pricing.ts` (`BRANCH_OWNER` is not a `UserRole`)
- `lib/pilot`, `lib/cleaner-assignment.ts`, seed scripts, workers
- `CleanerTaxProfile` / `WeeklyEmailLog` / `TaxProfileStatus` / `Tenant` models that application code still names but schema does not define

Target modules cleaned in this branch:

- `lib/billing/**`
- `lib/invoices/**`
- `lib/auth/**`
- `lib/dates/**`
- `lib/audit.ts`
- `app/api/admin/jobs/**`
- `app/api/cron/**`

Inside those modules, stale Prisma names were mapped to the live schema (`Customer` / `Branch` / `User` / `UserBranch` / `TrainingStatus` / `CleanerAvailability`, uppercase `JobStatus`). Missing tables (`cleanerTaxProfile`, `weeklyEmailLog`, `tenant`) are skipped at runtime instead of calling delegates that do not exist. Admin job pricing reads and writes `quotedTotal` / `totalPrice` / `promoDiscount` / `promoApplied`; phantom `basePrice` / `priceLockedAt` columns are no longer selected.

## Cleanup order

1. Keep the changed-file ratchet on every PR.
2. Next: `lib/pricing` + remaining billing/payout helpers (same money path as jobs).
3. Then: `app/api/admin/1099/**` and tax-profile routes — only after `CleanerTaxProfile` exists in Prisma, or after those routes are deleted.
4. Then: seed scripts and workers.
5. Last: marketing / portal UI.

Do not start a whole-repo autofix.

## Condition required before removing Next.js ignore flags

Do **not** set `typescript.ignoreBuildErrors` or `eslint.ignoreDuringBuilds` to `false` until:

1. `npx tsc --noEmit` exits 0 on `main`.
2. `npm run lint` reports 0 errors on `main` (warnings may remain if explicitly accepted).
3. The quality-gate workflow has been green on `main` for at least one release cycle.
4. A follow-up change updates `next.config.js` in its own PR with no other product work.

Until then, `npm run build` succeeding is not proof that TypeScript or ESLint is clean.
