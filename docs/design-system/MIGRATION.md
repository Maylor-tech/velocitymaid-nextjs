# VelocityMaid — Codebase Migration Plan

**Goal:** move the production `components/` codebase fully onto the v1.0 design-system tokens and components, and remove every remaining legacy styling inconsistency (forest/gold palette, `primary-*`/`gray-*`/`blue-*` literals, the retired wordmark, ad-hoc status colors).

This plan maps the **audit findings** (README §6) to concrete, sequenced changes. It assumes the existing Next.js + Tailwind setup.

> **Migration status (this repo):** Phases **0–6 complete** on branch `ds/legacy-palette-migration` (June 2025). Production wiring lives in `app/globals.css` (RGB-channel `--vm-*` + semantic tokens), `tailwind.config.ts` (`vm-*` with `<alpha-value>`), `lib/brand/{colors,buttons,spacing,status}.ts`, and `.eslintrc.json` (`no-restricted-syntax` at **error** for legacy palette literals). Legacy `brand-*` / `primary-*` Tailwind colors and `__archive/` are removed. Booking markets: NJ + Vermont only (`components/booking/steps/ServiceStep.tsx`).

---

## Phase 0 — Token foundation (1 PR, no visual change)

Make the design-system tokens the single source Tailwind reads from, so every utility class resolves to a brand value.

1. **Adopt the token CSS.** Import this system's `styles.css` (or copy `tokens/*.css`) into the app's global stylesheet so the `--vm-*` and semantic custom properties exist at runtime.
2. **Point Tailwind at the tokens.** In `tailwind.config.js`, define the palette from the CSS vars (single source of truth).

   > ⚠️ **Alpha-capability gotcha (learned the hard way).** If you map a color to `var(--vm-navy)` where the token is a plain hex (`--vm-navy: #0F1C2E`), Tailwind **cannot** apply opacity modifiers — `bg-vm-navy/10`, `border-vm-border/40`, etc. silently break the build/utility. The product code uses `bg-vm-navy/10` in ~240 places, so you **must** use the RGB-channel + `<alpha-value>` pattern from day one:
   > ```css
   > /* globals.css — store tokens as space-separated RGB channels */
   > :root { --vm-navy: 15 28 46; --vm-cyan: 0 194 203; --vm-border: 226 232 240; /* … */ }
   > ```
   > ```js
   > // tailwind.config — wrap each in rgb(var(--x) / <alpha-value>)
   > colors: {
   >   'vm-navy':      'rgb(var(--vm-navy) / <alpha-value>)',
   >   'vm-cyan':      'rgb(var(--vm-cyan) / <alpha-value>)',
   >   'vm-cyan-dark': 'rgb(var(--vm-cyan-dark) / <alpha-value>)',
   >   'vm-surface':   'rgb(var(--vm-surface) / <alpha-value>)',
   >   'vm-text':      'rgb(var(--vm-text) / <alpha-value>)',
   >   'vm-muted':     'rgb(var(--vm-muted) / <alpha-value>)',
   >   'vm-white':     'rgb(var(--vm-white) / <alpha-value>)',
   >   'vm-border':    'rgb(var(--vm-border) / <alpha-value>)',
   > },
   > ```
   > The DS's own `tokens/colors.css` keeps hex values (its components use them via inline `style` / `var()`, where alpha isn't needed). The RGB-channel form is **specifically for the Tailwind consumer**. Apply the same pattern to every `vm-*` color, including the semantic status tokens added in Phase 3.0. Build-test `bg-vm-navy/10` before moving on.

   ```js
   fontFamily: { heading: ['Space Grotesk', ...], body: ['Inter', ...] },
   borderRadius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
   ```
3. **Keep, but freeze, legacy tokens.** Leave `brand-forest/gold/ivory`, `primary-*` defined for now so nothing breaks, but mark them `@deprecated` in config comments. They get deleted in Phase 5.

**Exit:** app looks identical; tokens are now centrally defined.

---

## Phase 1 — Buttons (highest-impact, highest-risk)

Resolves audit **#1**.

1. **Standardize on `components/ui/button.tsx`** with the approved `navy | cyan | navyOutline` variants (+ add `ghost`/`link` to match the DS API).
2. **Delete the deprecated variants** `brand | brandGold | brandOutline` from `button.tsx`. Grep for each (`variant="brand"`, etc.) and replace:
   - `brand` / forest fill → `navy`
   - `brandGold` → `cyan`
   - `brandOutline` → `navyOutline`
3. **Retire `components/Button.tsx`** (the rounded-full `primary-600` pill). Replace its call sites with `ui/button.tsx` using `size="lg"` + the pill treatment where a marketing pill is wanted. Codemod the prop differences (`icon`/`iconPosition` → `iconLeft`/`iconRight`).
4. Snapshot/visual-diff the homepage, pricing, and portal CTAs.

**Exit:** one button component, approved variants only.

---

## Phase 2 — Color literal sweep (mechanical)

Resolves audit **#2, #6**.

Grep-and-replace legacy literals with semantic tokens. Do it file-by-file with review:

| Legacy | Replace with |
|---|---|
| `text-gray-900` / `text-gray-700` | `text-vm-text` |
| `text-gray-500` / `text-gray-600` | `text-vm-muted` |
| `bg-gray-50` / `bg-gray-100` | `bg-vm-surface` |
| `border-gray-100/200` | `border-vm-border` |
| `bg-primary-600` / `text-primary-600/700` | `bg-vm-navy` / `text-vm-navy` or `text-vm-cyan-dark` for accent text |
| `bg-blue-600` / `bg-blue-500` (Toast/EmptyState) | `bg-vm-navy` (action) |
| `text-yellow-400 fill-yellow-400` (stars) | keep a single `--star: #F5B301` token (ratings only) |

Priority files: `KpiCard.tsx`, `EmptyState.tsx`, `ui/toast.tsx`, `customer/actions/FormRow.tsx`, `TestimonialsSection.tsx`, `admin/metrics/KpiCard.tsx`.

> ⚠️ **Two context-dependent mappings need a visual pass — they're "looks wrong in context" bugs, not lint failures:**
> - **`text-primary-600/700 → text-vm-cyan-dark`** is correct for *accent* text, but **wrong for structural links/headings** — those should be `text-vm-navy`. Sweep to cyan-dark by default, then eyeball each and downgrade the structural ones.
> - **`text-gray-200/300 → text-vm-muted`** is wrong **on dark/navy backgrounds**, where those grays were intentionally *light* text — use `text-vm-white/70` instead. Check every hit that sits on a navy surface.
>
> Scope this sweep across the **entire repo** (`app/**` holds the bulk, not just `components/**`); work directory-by-directory and commit reviewable chunks, reporting the running `no-restricted-syntax` count each time.

**Exit:** zero `gray-*`/`primary-*`/`blue-*` literals in `components/`.

---

## Phase 3.0 — Semantic token prerequisite (additive, non-visual)

Phase 0 shipped only the **8 core `vm-*` colors**. The semantic/status tints and the status→color map that Phase 3 re-skins reference don't exist in the repo yet. This phase adds them. Purely additive — nothing references the new tokens until Phase 3, so there is **zero visual change** here.

1. **Append semantic tokens** to the `:root` block in `app/globals.css` (values from `tokens/colors.css`):
   ```css
   --vm-cyan-tint:#E6FAFB;
   --vm-success:#1F8A5B;  --vm-success-bg:#E7F5EE;
   --vm-warning:#B7791F;  --vm-warning-bg:#FBF3E2;
   --vm-danger:#C0392B;   --vm-danger-bg:#FCEDEC;
   --vm-info:var(--vm-cyan); --vm-info-bg:var(--vm-cyan-tint);
   --vm-progress:#4338CA; --vm-progress-bg:#EEF0FF; /* sanctioned indigo for in_progress */
   ```
2. **Expose them in `tailwind.config.ts`** `theme.extend.colors` (additive — overrides nothing): `vm-cyan-tint, vm-success(-bg), vm-warning(-bg), vm-danger(-bg), vm-info(-bg), vm-progress(-bg)` → `var(--vm-*)`.
3. **Create `lib/brand/status.ts`** — the single source for job-status styling, mirroring the DS `StatusBadge` map (`pending/scheduled/assigned/in_progress/completed/cancelled/reschedule_requested/cancel_requested` → `{ label, bg, fg }` token classes). Don't wire it into any component yet.

> **Note:** `in_progress` uses an **indigo** (`--vm-progress #4338CA`) — the one sanctioned non-navy/cyan accent in the DS, kept so the active state stays distinguishable. It's a named token (not a stray literal) so the lint guard sees it. To make `in_progress` read cyan instead, point `--vm-progress*` at `--vm-cyan-dark`/`--vm-cyan-tint`.

**Exit:** semantic tokens + `lib/brand/status.ts` present; `tsc`/lint clean; no pixels moved.

---

## Phase 3 — Status & feedback components

Resolves audit **#3, #4, #6**. Requires Phase 3.0.

1. **`CalmAlert`** → re-skin to the DS `Alert` (calm cyan/semantic tints — `bg-vm-success-bg`/`text-vm-success`, etc.). Remove `bg-brand-forest/5`, `text-brand-gold`.
2. **`JobStatusBadge`** → replace the hand-mapped Tailwind colors with `JOB_STATUS_STYLE` from `lib/brand/status.ts` (single source for `pending/scheduled/assigned/in_progress/completed/cancelled/...`). Keep the `status` prop and rendered text identical; delete the local `statusConfig` color literals (`yellow-100`, `purple-100`, etc.).
3. **`Toast`** → navy surface + semantic accent bar (DS `Toast`). Drop `bg-blue/green/red-500`.

**Exit:** status colors come from one map; alerts/toasts are on-brand.

---

## Phase 4 — Logo & brand lockups

Resolves audit **#5**.

1. **`BrandLogo.tsx`** is already correct (house + sparkle, navy/white treatments) — keep as the only logo. Optionally simplify its `variant="forest"|"ivory"` legacy prop names to `theme="light"|"dark"` to match the DS, with a back-compat shim.
2. **Delete/quarantine `VelocityMaidWordmark.tsx`** (retired V-chevron + per-market taglines). Confirm zero imports (`SiteHeader`/`BranchLandingNav` already use `BrandLogo`), then remove.
3. **Embroidery variant:** wire `assets/logo/embroidery-mark*.svg` into any uniform/print asset pipeline (not web UI).

**Exit:** one digital logo system; no chevron wordmark.

---

## Phase 5 — Delete legacy tokens & enforce

1. Remove `brand-forest`, `brand-gold`, `brand-ivory`, `brand-slate`, `primary-*` from `tailwind.config.js` and any `lib/brand/tokens.ts`. The build will fail on any straggler — fix those.
2. **Add a lint guard** (the generated `_adherence.oxlintrc.json` / a custom ESLint rule) to fail CI on raw hex values and disallowed color literals in `className`.
3. Update `lib/brand/colors.ts` / `buttons.ts` to re-export the DS tokens (or delete if Tailwind now covers it).

**Exit:** legacy palette is physically gone; CI prevents regressions.

---

## Phase 6 — Booking data + misc

Resolves audit **#7**.

- `booking/steps/ServiceStep.tsx`: replace the stale `Jamaica / USA` country options with the active **New Jersey / Vermont** market model. Verify branch filtering matches real branches.
- Audit remaining `space-y-*`/ad-hoc paddings against the 4px scale; normalize section rhythm to the 80px/`--space-20` standard.

---

## Sequencing & safety

- **Order:** Phase 0 → 1 → 2 → 3 → 4 → 5 → 6. Phases 2–4 can run in parallel branches after Phase 0/1 lands.
- **One concern per PR**, each with a visual diff (Chromatic/Playwright screenshots) of: homepage, pricing, booking wizard, customer portal, admin dashboard.
- **No behavior changes** — this is a styling/token migration only. Functional logic (booking flow, payouts, assignment) stays untouched.
- **Definition of done:** grep for `forest|gold|ivory|primary-\d|gray-\d|blue-\d00` in `components/` returns nothing; all buttons/badges/alerts/logo come from the shared components; CI lint guard is green.

---

## Quick grep checklist

```bash
# legacy palette
grep -rE "brand-(forest|gold|ivory|slate)|primary-[0-9]|bg-(blue|green|red|yellow)-[0-9]{3}|text-gray-[0-9]{3}" components/
# deprecated button variants
grep -rE 'variant="(brand|brandGold|brandOutline)"' components/
# retired wordmark
grep -rn "VelocityMaidWordmark" components/
# raw hex in className (should be none)
grep -rE 'className=.*#[0-9A-Fa-f]{6}' components/
```
