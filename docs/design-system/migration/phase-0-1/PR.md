# PR: Design System v1.0 — Phase 0–1 (token foundation + button standardization)

**Branch:** `ds/phase-0-1-tokens-and-buttons`
**Scope:** token foundation + CTA standardization **only**. No behavior changes.
**Type:** styling / config refactor. Non-visual.

> **How this package works.** The VelocityMaid codebase is mounted **read-only** here, so this PR is delivered as an applyable package rather than committed in place. Apply the files under `changed/` to the matching repo paths, open the branch, and run the repo's own `lint`/`typecheck` (see *Verification* — they can't be executed against a read-only mount). Every changed file is listed below.

---

## What changed (every file)

| # | Repo path | Change | Risk |
|---|---|---|---|
| 1 | `components/ui/button.tsx` | **Remove** the 3 deprecated variants `brand` / `brandGold` / `brandOutline` (union members, tactile-transition branch, and their class entries). Keep `navy` / `cyan` / `navyOutline` + shadcn defaults. Drop-in file: `changed/components/ui/button.tsx.txt` (rename to `button.tsx` on apply — `.txt` keeps it out of this project's DS compiler). | **None** — see call-site audit |
| 2 | `tailwind.config.{js,ts}` | **Merge** `changed/tailwind.vm-tokens.js` into `theme.extend`: point existing `vm-*` color utilities at the DS CSS variables; add `font-heading`/`font-body`, radii, `max-w-marketing`, shadows. | None — same values |
| 3 | `app/globals.css` (or global stylesheet) | **Add** the DS token import / `:root` vars from `changed/globals.tokens.css` above the Tailwind directives, so `var(--vm-*)` resolve at runtime. | None — additive |
| 4 | eslint/oxlint config | **Add** rules from `changed/../lint-guard.rules.json` to block legacy palette + deprecated variants in future PRs. | None — lint only |

Supporting files in this folder: `button.tsx.diff` (unified diff of #1), `lint-guard.rules.json`.

---

## Phase 0 — Token foundation

The `vm-*` utilities (`bg-vm-navy`, `text-vm-muted`, `bg-vm-surface`, …) are **already used throughout** the codebase, so the tokens exist — they were just hardcoded. This phase makes the **design system the single source of truth**:

1. Load the DS tokens at runtime (`globals.tokens.css`) so the `--vm-*` custom properties exist.
2. Repoint the Tailwind `vm-*` color/font/radius entries at those CSS variables (`tailwind.vm-tokens.js`). Values are identical to the approved palette → **no visual change**.

Legacy `brand-forest/gold/ivory` + `primary-*` stay defined (untouched) so the still-live forest/gold components keep building; they are removed in **Phase 5** after Phases 2–4 migrate their usages.

## Phase 1 — Button / CTA standardization

`components/ui/button.tsx` is the one approved button. This PR deletes the explicitly-`@deprecated` forest/gold variants so `navy | cyan | navyOutline` (+ shadcn `default/secondary/outline/ghost/link/destructive`) are the only options.

### Call-site audit (why this is zero-risk)

Static search of the mounted `components/` tree:

- `variant="brand" | "brandGold" | "brandOutline"` → **0 occurrences.**
- `brandGold` / `brandOutline` identifiers anywhere → **0 occurrences.**
- The deprecated variants exist **only** in `button.tsx`'s own definition.

So removing them changes no rendered output. (Note: app-level `app/**` pages were **not** in the read-only mount — re-run the grep in *Verification* against the full repo before merge to confirm 0 there too. If any `app/**` page uses a deprecated variant, map it: `brand → navy`, `brandGold → cyan`, `brandOutline → navyOutline`.)

> **Not touched, by design:** the legacy `components/Button.tsx` rounded-pill (separate component) and the forest/gold sweep are **out of scope** for Phase 0–1 — they're Phases 1.5/2–4 in `MIGRATION.md`. No booking, Stripe, API, auth, or database code is read or modified.

---

## Logo / brand

No logo change. The **digital filled-house** `BrandLogo` remains canonical. The **embroidery / uniform** outlined mark added in v1.0 is a **production asset only** (`assets/logo/embroidery-mark*.svg`) for stitching/print — it is not wired into any web/app component and is not part of this PR's runtime.

---

## Verification (run against the real repo — could not be executed on the read-only mount)

```bash
# 1. Type + lint (repo toolchain)
pnpm typecheck        # or: tsc --noEmit
pnpm lint

# 2. Confirm zero deprecated-variant usage across the FULL repo (incl. app/**)
grep -rE 'variant="(brand|brandGold|brandOutline)"' app components
grep -rn 'brandGold\|brandOutline' app components

# 3. Visual diff (expect NO changes)
#    Homepage, /pricing, booking wizard, /customer, /admin
```

### Pre-existing issues found (reported separately — NOT introduced or fixed here)

These surfaced during the audit and are **out of Phase 0–1 scope**; they are the backlog for Phases 2–4 (`MIGRATION.md`):

- **Forest/gold palette still live** in `brand/CalmAlert.tsx`, `brand/BrandPhotoPlaceholder.tsx`, `brand/CareChecklist.tsx`, `brand/JobChecklistSection.tsx`, `cleaner/JobChecklistPanel.tsx`, `DemoModeBanner.tsx`, `PartnerHero.tsx` (`brand-forest`, `brand-gold`, `font-serif`). → Phase 3/4.
- **Raw Tailwind palette literals** (`gray-*`, `primary-*`, `blue-*`, `green/yellow/red-100`) across `admin/cleaners/CleanerProfileDrawer.tsx`, `admin/jobs/*`, `admin/finance/PricingHelper.tsx`, etc. (~200+ hits). → Phase 2.
- **Ad-hoc job-status color maps** duplicated in `admin/jobs/JobDetailDrawer.tsx`, `admin/cleaners/CleanerProfileDrawer.tsx`, `customer/jobs/JobStatusBadge.tsx`. → Phase 3 (single status map).
- **Legacy `components/Button.tsx`** rounded-pill (`primary-600`) coexists with `ui/button.tsx`. → Phase 1.5.

None of the above are touched by this PR. Merging Phase 0–1 is safe and self-contained; the lint guard (file #4) starts flagging them so they don't spread.
