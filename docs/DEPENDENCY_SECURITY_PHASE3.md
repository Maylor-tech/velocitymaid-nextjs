# Dependency Security Phase 3

Safe, non-breaking reduction of `npm audit` findings. Started from `origin/main` at `95ad574b51b7d82732147a6e11dbcfd53a6fae5e`.

This branch does **not** upgrade Next.js, React, or Prisma majors. It does **not** change `next.config.js` `ignoreBuildErrors` / `ignoreDuringBuilds`. It does **not** use `npm audit fix --force`.

Raw audits:

- Before: [`docs/dependency-audit-before.json`](./dependency-audit-before.json)
- After: [`docs/dependency-audit-after.json`](./dependency-audit-after.json)

## Before / after counts

| Severity | Before (`npm ci` on `95ad574`) | After |
|---|---:|---:|
| Critical | 2 | 0 |
| High | 22 | 8 |
| Moderate | 7 | 0 |
| Low | 1 | 0 |
| **Total** | **32** | **8** |

Dependencies in the audit graph: 694 before → 619 after (fewer nested copies after overrides).

## Packages upgraded (direct)

| Package | From | To | Kind | Why |
|---|---|---|---|---|
| `axios` | 1.13.2 | 1.20.0 | runtime minor | SSRF, prototype-pollution, header-injection advisories |
| `nanoid` | 5.1.6 | 5.1.16 | runtime patch | non-secure generator infinite-loop / overflow |
| `resend` | 6.6.0 | 6.26.0 | runtime minor | pulls patched `svix` / `uuid` |
| `postcss` (direct) | 8.5.6 | 8.5.28 | runtime patch | PostCSS parse DoS (direct copy) |
| `vitest` | 3.2.4 | 3.2.7 | dev patch | critical Vitest UI arbitrary file read / exec |
| `@vitest/ui` | 3.2.4 | 3.2.7 | dev patch | same advisory; stayed on 3.x (not 5.x) |
| `prisma` | 6.19.0 | 6.19.3 | dev patch | latest 6.19.x; does **not** clear `@prisma/config` |
| `@prisma/client` | 6.19.0 | 6.19.3 | runtime patch | keep client aligned with CLI |

No application source files were changed.

## Transitive overrides

Version-specific `package.json` `overrides` (same major line only):

| Override | Resolved to | Used by |
|---|---|---|
| `nanoid@3` | 3.3.18 | Next-bundled PostCSS |
| `browserslist` | 4.28.9 | Autoprefixer (build) |
| `flatted` | 3.4.4 | ESLint / Vitest UI |
| `js-yaml` | 4.3.2 | ESLint |
| `lodash` | 4.18.1 | `archiver` (admin data-room zip) |
| `ajv@6` | 6.15.0 | ESLint |
| `fflate` | 0.8.3 | `@vitest/ui` |
| `qs` | 6.16.0 | `stripe`, `googleapis` |
| `postcss-selector-parser@6` | 6.1.4 | Tailwind |
| `brace-expansion@1/@2/@5` | 1.1.18 / 2.1.4 / 5.0.9 | ESLint / glob / archiver |
| `minimatch@3/@5/@9` | 3.1.5 / 5.1.9 / 9.0.9 | ESLint / glob |
| `picomatch@2/@4` | 2.3.2 / 4.0.7 | Vite / glob |

A nested `next.postcss → 8.5.28` override was tried and **removed**. Next 14.2.35 still installs its own `postcss@8.4.31`; npm reported that override as invalid. Forcing Next's PostCSS would be a behavior change inside the framework.

`package-lock.json`: 666 insertions / 549 deletions.

## Vulnerabilities fixed

Cleared entirely (no longer in `npm audit`):

**Critical**

- `vitest` / `@vitest/ui` ≤ 3.2.5 — Vitest UI arbitrary file read / command execution. Dev-only. Fixed by 3.2.7.

**High / moderate runtime**

- `axios` 1.13.2 — SSRF (`NO_PROXY` / loopback), prototype-pollution gadgets, header injection, body-limit bypasses. Used only by `app/services/whatsappService.ts` (Meta WhatsApp Cloud API). Fixed by 1.20.0.
- `nanoid` 5.1.6 — infinite loop / overflow in non-secure generators. Used by customer magic-code and change-request IDs. Fixed by 5.1.16. Nested `nanoid@3` under Next PostCSS patched via override to 3.3.18.
- `form-data` / `follow-redirects` — cleared with the axios upgrade.
- `resend` / `svix` / `uuid` — moderate buffer-bounds chain. Cleared by resend 6.26.0.
- `lodash` (via `archiver`) — template / `_.unset` prototype pollution. Cleared by lodash 4.18.1 override.
- `qs` (via Stripe + Google APIs) — cleared by qs 6.16.0 override.

**High / moderate / low tooling**

- `brace-expansion`, `minimatch`, `picomatch`, `browserslist`, `defu`, `flatted`, `js-yaml`, `ajv`, `fflate`, `postcss-selector-parser`, `rollup`, `vite` — patched by overrides or the Vitest 3.2.7 tree.
- Direct `postcss` 8.5.6 → 8.5.28. Remaining PostCSS finding is Next’s nested 8.4.31 (see deferred).

## Vulnerabilities intentionally deferred

All 8 remaining findings are **high**. None are critical. npm’s suggested fix for each is a **major** (or a Prisma **downgrade**).

### Next.js 14.2.35 (runtime) + nested `postcss@8.4.31`

npm `fixAvailable`: `next@16.3.4` (`isSemVerMajor: true`).

Advisories that keep `next` in the high bucket include:

- RSC / Server Components DoS — [GHSA-h25m-26qc-wcjf](https://github.com/advisories/GHSA-h25m-26qc-wcjf), [GHSA-q4gf-8mx6-v5v3](https://github.com/advisories/GHSA-q4gf-8mx6-v5v3), [GHSA-8h8q-6873-q5fj](https://github.com/advisories/GHSA-8h8q-6873-q5fj), [GHSA-m99w-x7hq-7vfj](https://github.com/advisories/GHSA-m99w-x7hq-7vfj)
- SSRF (WebSocket upgrades, Server Actions, rewrites) — [GHSA-c4j6-fc7j-m34r](https://github.com/advisories/GHSA-c4j6-fc7j-m34r), [GHSA-89xv-2m56-2m9x](https://github.com/advisories/GHSA-89xv-2m56-2m9x), [GHSA-p9j2-gv94-2wf4](https://github.com/advisories/GHSA-p9j2-gv94-2wf4)
- Pages Router i18n middleware bypass — [GHSA-36qx-fr4f-26g5](https://github.com/advisories/GHSA-36qx-fr4f-26g5)
- Image optimizer / cache DoS and request smuggling (several moderate/high)

Most ranges close at **15.5.x**, not 14.2.x. There is no safe Next 14 patch. Next 15 or 16 is a planned major migration (App Router, React 19 coupling, eslint-config-next 16).

`postcss` remains listed as high because Next 14 still vendors `postcss@8.4.31` (`<=8.5.22`). Our direct PostCSS is already 8.5.28.

**Exposure:** production runtime. Highest leftover risk on this branch. Mitigate with a dedicated Next 15/16 project, not this audit.

### `eslint-config-next` 14.2.35 + `@next/eslint-plugin-next` + `glob`

npm `fixAvailable`: `eslint-config-next@16.3.4` (major, couples to Next 16).

`glob` 10.2–10.4 CLI command injection ([GHSA via glob `-c/--cmd`](https://github.com/advisories)). That CLI is not how VelocityMaid lints; the plugin is **dev-only** and is not shipped to Vercel production.

**Exposure:** developer machines / CI lint. Defer until Next 16.

### Prisma 6.19.3 CLI + `@prisma/config` + `deepmerge-ts`

npm `fixAvailable`: `prisma@6.12.0` with `isSemVerMajor: true`. That is a **downgrade**, not a fix.

`@prisma/config` 6.13–8.1 pulls `deepmerge-ts` (stack exhaustion on recursive merge) and previously `effect`. Prisma **CLI** (`devDependency`) uses this during `prisma generate` / migrate. `@prisma/client` 6.19.3 in production does not execute `@prisma/config`.

Prisma 8 is a major. 6.19.3 is the newest 6.19 patch and was applied.

**Exposure:** local/CI Prisma CLI only. Do not downgrade to 6.12.0.

## Runtime exposure assessment

| Area | Shipped in production? | This branch |
|---|---|---|
| Next.js request handling, RSC, images | Yes | Unchanged (deferred) |
| Stripe checkout / billing / webhooks | Yes (`stripe@19.3.1`) | Stripe SDK not upgraded; `qs` override only |
| Supabase | Yes | Not in audit; not upgraded |
| Google Calendar / Drive / auth | Yes | `googleapis` / `google-auth-library` not upgraded; `qs` override only |
| Resend email (invoices, host receipts, magic links) | Yes | 6.6.0 → 6.26.0 |
| Axios / WhatsApp | Yes | 1.13.2 → 1.20.0 |
| `nanoid` (customer login codes, change requests) | Yes | 5.1.6 → 5.1.16 |
| `archiver` data-room zip | Yes (admin) | archiver 7 unchanged; lodash override |
| Vitest / ESLint / Prisma CLI | No | Patched or deferred as above |
| bcryptjs, Stripe, image `heic2any` | Yes | Not in this audit |

Production-facing criticals: **none remaining**.

Production-facing highs remaining: **Next 14** (and its nested PostCSS). Everything else leftover is Prisma CLI or ESLint.

## Regression check (Phase E)

Inspected call sites for upgraded runtime packages. No app code changes.

| Surface | Evidence |
|---|---|
| Auth / session | `nanoid` still imported the same way in `app/api/customer/auth/request-code`, `lib/magicTokenStore`, `request-change`. Existing auth tests passed. |
| Stripe checkout / billing | `stripe` version unchanged. Portal import test still proves missing `STRIPE_SECRET_KEY` does not throw at module load. Checkout pricing tests passed. |
| Supabase | Client packages unchanged. |
| Google | Existing calendar / Drive / DWD / job-sync / integration-health tests passed after `qs` override. |
| Invoice generate / send | Invoice immutability, send-guard, and host Request Received email tests passed after Resend 6.26.0. |
| Customer portal / admin jobs / cron | `npm run build` compiled those route trees. |

No new tests were added. Existing suites already cover the upgraded surfaces; the upgrades did not change public APIs we call.

## Tests / build results

After every upgrade batch, and again at the end:

| Gate | Result |
|---|---|
| `npm test` | **394 passed** / 67 files |
| `npm run quality:changed` | **pass** (no changed TypeScript files) |
| `npm run build` | **pass** (`prisma generate` + `next build`) |

`next.config.js` ignore flags were not changed. Build still does not typecheck or lint the whole repo.

## Recommended future major upgrades (not this branch)

1. **Next.js 14 → 15.5.x (then 16)** with `eslint-config-next` and a React 19 decision. This is the only way to clear the remaining runtime highs. Treat as its own project: middleware, `next/image`, Server Actions, and App Router behavior.
2. **Prisma 7/8** when the migration guide is accepted — clears `@prisma/config` / `deepmerge-ts`. Do not apply npm’s 6.12.0 “fix”.
3. **Stripe 22** and **archiver 8** when ready — not in the current audit, but `npm outdated` flagged them.
4. Do **not** jump `@vitest/ui` to 5.x just because latest is 5. Stay on Vitest 3 until a planned test-runner upgrade.

## Out of scope / not done

- Production deploy
- Production env changes
- Database migrations
- `stash@{0}` (cleaner-dispatch WIP)
- `npm audit fix --force`
- Application behavior changes
