# VelocityMaid Design System — v1.0 (locked)

**Status: v1.0 — canonical, locked.** The tokens, components, and the **digital filled-house logo** are the approved brand system. Treat them as frozen: extend by adding new components/screens that consume these tokens, never by forking colors, type, or the mark. Changes to tokens or the logo require an explicit version bump (v1.1+).

The permanent source of truth for VelocityMaid's brand and product UI — web, mobile, marketing, Canva templates, uniforms, vehicles, and operations tooling. Every future page and asset should inherit from this system rather than re-deriving styles.

> **Brand is approved and frozen.** Do not redesign the logo, recolor the palette, or substitute fonts. This system codifies the existing brand; it does not reinvent it.

---

## 1. Company context

**VelocityMaid** is a premium residential cleaning and short-term-rental (STR) turnover company operating in **New Jersey** and **Vermont**, built to scale into additional states without diluting the brand. The positioning is *luxury hospitality*, not discount cleaning — calm, trustworthy, fast, and detail-obsessed. Tagline: **"Come home to clean."**

Products / surfaces represented in this system:

- **Marketing website** — homepage, pricing (per-market), services, testimonials, partner/investor pages.
- **Booking flow** — multi-step wizard (service → home details → schedule → contact → review → confirmation).
- **Customer portal** — manage bookings, view job detail, photo reports, rebook, tip.
- **Cleaner portal** — job checklists, payout setup (Stripe Connect), training/onboarding.
- **Admin / operations dashboard** — KPIs, jobs table, cleaner management, assignment, finance.
- **Mobile app** — customer home, quick book, specialist chat.
- **Physical brand** — uniforms, vehicle magnets, business cards, QR review/tip cards (see `assets/brand/uniform-kit.png`).

### Sources of truth (provided)

- **Codebase:** local mounted folder `components/` — a Next.js + Tailwind + Radix/shadcn app. Key files audited:
  - `components/ui/{button,card,badge,toast}.tsx` (shadcn primitives), `components/Button.tsx` (legacy pill button)
  - `components/brand/{BrandLogo,VelocityMaidWordmark}.tsx` (logo system; `velocitymaid-logo-system-v1`)
  - `components/layout/SiteHeader.tsx`, `components/Footer.tsx` (nav + footer patterns)
  - `components/home/PricingSection.tsx`, `components/PricingTiers.tsx`, `components/TestimonialsSection.tsx`
  - `components/booking/steps/*` (booking wizard), `components/customer/jobs/*`, `components/admin/metrics/*`
  - Tailwind tokens referenced as `vm-navy / vm-cyan / vm-cyan-dark / vm-surface / vm-text / vm-muted / vm-white / vm-border`, fonts `font-heading` (Space Grotesk) / `font-body` (Inter). The `lib/` folder (with `lib/brand/colors.ts`, `lib/brand/buttons.ts`) was **not** in the mount — token values below come from the brand spec + observed Tailwind class usage.
- **Uniform kit reference:** `uploads/unifomkit.png` → copied to `assets/brand/uniform-kit.png`.
- **Brand spec:** colors, fonts, and design philosophy provided directly by the brand owner.

---

## 2. Content fundamentals (voice & copy)

**Vibe:** premium hospitality meets modern SaaS. Calm, confident, warm, never gimmicky or discount-y. Think a boutique hotel's concierge, not a coupon flyer.

- **Person:** speak to the customer as **"you"**; the company is **"we"**. ("We handle the rest." / "Your home is in good hands.")
- **Tone:** reassuring and concrete. Lead with trust and outcomes ("hospitality-level attention to every detail", "deposit-ready finish"), not hype.
- **Casing:** Sentence case for headings and body ("Transparent pricing", "What our customers say"). **UPPERCASE with wide tracking** only for eyebrows, the tagline, button labels, and table headers. Title Case for nav items, plan names, and proper nouns (markets, cities).
- **Buttons:** short imperative verbs — *Book Now, Book a clean, Get a quote, Continue, Reschedule*. Button text renders uppercase via the type system; write it in sentence case in code.
- **Numbers/trust:** specific and earned — "100+ five-star cleans", "★ 4.9 · 240 cleans", real phone numbers per market. Avoid invented stats.
- **Emoji:** essentially none in marketing/product chrome. A single friendly 👋 in a personal greeting (mobile home) is the ceiling — never in CTAs, nav, or formal copy.
- **Pricing voice:** transparent and plain — "No hidden fees, just clean homes." Always footnote that price varies by home size/condition.
- **Markets:** NJ copy references Newark / Jersey City / Paterson; Vermont references Ludlow / Okemo Valley / Middlebury and STR/turnover language. Keep market-specific phone numbers and service names intact.

---

## 3. Visual foundations

**Palette (approved — never extend the hue set):** Navy `#0F1C2E`, Cyan `#00C2CB`, Dark Cyan `#00A8B0` (cyan hover/press), Surface `#F4F6F9`, Text `#1A1A2E`, Muted `#6B7280`, White `#FFFFFF`. Derived-only: cyan tint `#E6FAFB` (selected/soft highlight), border `#E2E8F0`. Status tints are intentionally **calm** (muted green/amber/red on pale backgrounds), never neon — see `tokens/colors.css`. The **one sanctioned non-navy/cyan accent** is `--vm-progress #4338CA` (indigo), used *only* for the `in_progress` job state so the active state stays distinguishable from scheduled/cyan; it is a named token, not an ad-hoc literal.

- **Color usage:** Navy is the anchor — headers, footers, primary CTA fill, dark hero sections, sidebars. Cyan is the *accent*, used sparingly for highlights, secondary CTAs, selected states, icons, and the logo sparkle. White/Surface carry the generous negative space. Navy and cyan never compete; on a navy field cyan does the pointing.
- **Typography:** **Space Grotesk** for all headings, display, button labels, table headers, and the wordmark (700; large display tightens to `-0.02em`). **Inter** for body and UI text (400/500/600). Line-height 1.5–1.65 for body, 1.05–1.15 for display. See `tokens/typography.css`.
- **Spacing:** 4px base grid; sections breathe at 80px vertical rhythm; cards use 24–32px padding. Generous whitespace is a brand signal of premium-ness — when in doubt, add space. See `tokens/spacing.css`.
- **Corners:** rounded throughout. Buttons/inputs 6px, cards 8–12px, feature/pricing cards 16px, pills/badges/avatars fully round. Nothing sharp-cornered.
- **Elevation:** minimal, soft, **navy-tinted** shadows (`rgba(15,28,46,…)`) — never gray or harsh. Default cards sit on a 1px `#E2E8F0` border + `shadow-sm`; they lift to `shadow-lg` on hover. A cyan glow (`--shadow-cyan`) is reserved for accent CTAs (e.g. the mobile FAB). See `tokens/spacing.css` + the Elevation card.
- **Cards:** white surface, hairline border, soft shadow, rounded. The "selected"/"most popular" treatment is a **2px cyan ring** (and cyan-tint fill for selectable option cards). No colored left-border-accent cards, no heavy drop shadows.
- **Backgrounds:** mostly flat white and `#F4F6F9` surface. The one sanctioned gradient is a subtle **navy→darker-navy** vertical on hero/CTA bands (`#0F1C2E → #13243b`) — never bright/rainbow gradients. Photography (homes, cleaning detail) should read clean and bright with cool-neutral white balance; the uniform kit shows the physical-brand photographic tone.
- **Hover / press:** links and nav fade navy/white → **cyan**. Filled buttons darken slightly (navy → 90%, cyan → dark-cyan). Press uses the tactile `translateY(1px) scale(0.99)` (`.btn-tactile`). Cards lift `-2px` with a larger shadow. Inputs show a cyan border + soft cyan focus ring.
- **Motion:** quiet and functional. `--duration-fast 150ms` for interactive feedback, `--duration-base 300ms` for hover/card transitions, all on `cubic-bezier(0.4,0,0.2,1)`. Fades and small translates only — **no bounces, no infinite decorative loops**. Respect `prefers-reduced-motion`.
- **Transparency/blur:** sparing. White/cyan at low opacity for borders and secondary text on navy (`rgba(255,255,255,0.1–0.7)`). No glassmorphism.
- **Focus:** visible 2px cyan outline, 2px offset — accessibility is a brand value.

---

## 4. Iconography

- **Library:** [**Lucide**](https://lucide.dev) (the codebase imports `lucide-react`). 24×24 grid, **2px stroke, rounded line caps/joins**, single-color. This is the only icon system — do not mix in other sets.
- **Color:** tint navy (default), cyan/dark-cyan (accent or selected), muted gray (inactive), or white (on navy). Never multicolor an icon.
- **In static HTML / cards / Canva exports:** pull individual SVGs from the CDN, e.g. `https://unpkg.com/lucide-static@0.460.0/icons/home.svg`. To recolor an `<img>` icon to a brand color, render it as a CSS `mask` over a brand-colored background (see the `ic()` helper used throughout the UI kits) rather than relying on the SVG's own fill. In React product code, use `lucide-react` components directly.
- **Common icons in use:** `home, sparkles, calendar, clock, check, check-circle, star, map-pin, user, users, truck, bed-double, bell, message-circle, shield-check, leaf, dollar-sign, plus, arrow-right`.
- **Emoji as icons:** no (one friendly 👋 in a personal greeting is the only exception). **Unicode glyphs as icons:** avoid — use Lucide.
- **Logo mark** is its own asset, never an "icon": house + 4-point sparkle, in `assets/logo/` (see Logo usage).

---

## 5. Logo usage

The approved mark (`velocitymaid-logo-system-v1`) is a **house** silhouette with a small **4-point sparkle** accent. Recreated faithfully from `components/brand/BrandLogo.tsx`.

- **Light backgrounds:** navy house, **cyan** sparkle, white center dot. (`assets/logo/mark-navy.svg`, or `<BrandLogo theme="light" />`)
- **Navy/dark backgrounds:** **cyan** house, white sparkle, navy dot. (`assets/logo/mark-white.svg`, or `<BrandLogo theme="dark" />`)
- **Sparkle-drop rule (§2.3):** at icon sizes **≤32px**, drop the sparkle — the house alone holds down to 16px. (`mark-*-sm.svg`, handled automatically by `BrandLogo`.)
- **Wordmark:** "VELOCITYMAID" in Space Grotesk 700, uppercase, slight tracking, with optional "COME HOME TO CLEAN." tagline beneath.
- **Don'ts:** never recolor outside navy/cyan/white, never stretch/rotate/shadow the mark, and never use the **retired V-chevron wordmark** (`VelocityMaidWordmark.tsx` is deprecated) or the old forest/gold palette.
- Assets: `assets/logo/{mark-navy, mark-white, mark-cyan, mark-mono-navy, mark-mono-white, mark-navy-sm, mark-white-sm, favicon}.svg`.

### Production / logo adaptations — Embroidery / Uniform Icon (secondary)

For physical workwear the digital filled mark is replaced by an **outlined** house + sparkle adaptation that stitches cleanly on knit fabric. This is a **secondary, production-only variant** — it never substitutes for the digital logo in web/app/marketing/Canva contexts.

- **Form:** same house + 4-point sparkle, but the house is an **open outline** (satin-stitch edge) rather than a solid fill; the door reads as a gap. Icon only — **no wordmark**.
- **Dark workwear (navy polos/tees/fleece/caps):** cyan outline house, **white** sparkle. `assets/logo/embroidery-mark.svg` (transparent).
- **Light fabric:** one-color **navy** outline + navy sparkle. `assets/logo/embroidery-mark-navy.svg`.
- **Stitch spec (per uniform kit):** **2.5″ wide** left-chest; threads **Isacord 4071 (cyan)** + **white** (star). On-fabric preview: `assets/logo/embroidery-mark-on-navy.svg`.
- **Where it applies:** left-chest embroidery, hats, polos, fleece, name badges, and other workwear. Vehicle magnets / business cards / QR cards use the **digital** mark, not the embroidery variant.
- See the **Embroidery / Uniform Mark** card in the Design System → Brand group.

---

## 6. Audit — inconsistencies found & recommendations

Findings from auditing the `components/` codebase against the approved brand. This system resolves all of them; flagged here so the codebase can be migrated.

1. **Two parallel button systems.** `components/ui/button.tsx` carries the approved `navy / cyan / navyOutline` variants **plus deprecated** `brand / brandGold / brandOutline` (retired forest/gold). Separately, `components/Button.tsx` is a rounded-full `primary-600` pill using a different palette entirely. → **Standardize on the DS `Button`** (navy/cyan/navyOutline/ghost/link, `pill` for marketing). Retire forest/gold and `primary-*`.
2. **Legacy palette leakage.** `KpiCard`, `EmptyState`, `Toast`, `FormRow`, `TestimonialsSection` use `gray-*`, `primary-600`, `blue-600`, `yellow-400` literals instead of `vm-*` tokens. → Replace with semantic tokens (`--text-muted`, `--vm-cyan`, status tokens). DS components already do this.
3. **`CalmAlert` still on forest/gold.** Uses `bg-brand-forest/5` + `text-brand-gold`. → Replace with DS `Alert` (calm cyan/semantic tints).
4. **Status color drift.** `JobStatusBadge` mixes Tailwind `yellow/purple/green/red-100` with `vm-cyan/15`. → DS `StatusBadge` is the single source for job lifecycle states; in the repo this is mirrored by `lib/brand/status.ts` (`JOB_STATUS_STYLE`), added in migration Phase 3.0.
5. **Deprecated wordmark + per-market taglines.** `VelocityMaidWordmark` (V-chevron, "VERMONT"/"NEW JERSEY") is retired in favor of the single house+sparkle mark and fixed tagline. → Use `BrandLogo` only.
6. **Toast styling** uses `bg-blue-500/green-500/red-500`. → DS `Toast` (navy surface + semantic accent bar).
7. **Booking `ServiceStep`** references countries `Jamaica / USA` while the brand is NJ + Vermont. → **Resolved (Phase 6A):** market picker uses `new-jersey` / `vermont`; `branchSlug` still drives quote/checkout.

---

## 7. Tokens, components & kits (index / manifest)

**Root**
- `styles.css` — the single entry point consumers link. `@import`s everything below.
- `SKILL.md` — Agent-Skills-compatible wrapper.
- `readme.md` — this guide.
- `MIGRATION.md` — phased plan to move the production `components/` codebase onto these tokens and remove all legacy styling.

**`tokens/`** (all reachable from `styles.css`)
- `colors.css` — palette + semantic aliases + status tints
- `typography.css` — families, weights, type scale, tracking
- `spacing.css` — spacing grid, radii, shadows, layout widths, motion
- `fonts.css` — Space Grotesk + Inter (Google Fonts)
- `base.css` — resets, `.vm-eyebrow`, `.btn-tactile`, `.card-hover`, focus ring

**`assets/`**
- `logo/` — 8 SVG logo/mark/favicon variants
- `brand/uniform-kit.png` — physical brand reference

**`components/`** (React primitives — `window.<Namespace>.<Name>` from the compiled bundle)
- `actions/` — **Button**, **IconButton**
- `forms/` — **Input**, **Select**, **Checkbox**, **Switch**, **FormRow**
- `data-display/` — **Card** (+ CardTitle/CardDescription), **Badge**, **StatusBadge**, **KpiCard**, **Avatar**, **Table**
- `feedback/` — **Alert**, **Toast**
- `navigation/` — **Tabs**
- `brand/` — **BrandLogo**

**`ui_kits/`** (full-screen recreations composing the primitives)
- `marketing/` — homepage (hero, services, per-market pricing, testimonials, CTA, footer)
- `booking/` — 4-step booking wizard
- `customer-portal/` — bookings dashboard + job detail
- `admin/` — operations dashboard (sidebar, KPIs, filterable jobs table)
- `mobile/` — customer mobile app home

**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.

---

## 8. Accessibility standards

- **Contrast:** navy/text on white and white on navy clear WCAG AA. Cyan `#00C2CB` is an *accent*, not a text color on white — pair cyan **fills with navy text** (the approved cyan CTA), and use **dark-cyan `#00A8B0`** for cyan-colored text/links on light surfaces.
- **Focus:** every interactive element shows the 2px cyan focus ring (`:focus-visible`). Never remove outlines without a replacement.
- **Targets:** ≥44px touch targets (buttons default to 44px tall; mobile tab/FAB sized accordingly).
- **Semantics:** real `<button>`/`<a>`/`<label>` elements; `aria-label` on icon-only buttons (`IconButton` requires it); status messages use `role="status"`/`role="alert"`.
- **Forms:** every field wrapped in `FormRow` with a visible label, required marker, and inline error text (not color-only).
- **Motion:** keep transitions subtle; honor `prefers-reduced-motion`.

---

## 9. Motion guidelines

- Durations: `--duration-fast 150ms` (press, focus, color), `--duration-base 300ms` (hover lift, card shadow). Easing: `--ease-standard cubic-bezier(0.4,0,0.2,1)`.
- Allowed: opacity fades, small `translateY` (≤2–4px), shadow/elevation changes, the tactile press scale.
- Avoid: bounces, springy overshoot, parallax, infinite decorative loops, anything that delays content.

---

## 10. Responsive rules

- **Breakpoints (Tailwind-aligned):** `sm 640 · md 768 · lg 1024 · xl 1280`. Marketing content max-width `--container-marketing 1200px`; wide app shells `1280px`; prose `720px`.
- **Marketing:** 3–4 column grids (services, pricing, testimonials) collapse to 1 column under `md`; hero two-column collapses to stacked. Section padding eases from 80px → 48px on small screens.
- **Portal/Admin:** sidebar collapses to a top bar / drawer under `lg`; tables scroll horizontally inside their card (`overflow-x: auto`) rather than reflowing.
- **Mobile:** 390px design width; bottom tab bar with center FAB; ≥44px targets; single-column stacks.
- **Type:** display sizes step down on small screens (e.g. 56→36px hero); body stays ≥16px. Slides/fixed canvases letterbox-scale; flow pages reflow.

---

## How to use

**Consuming project:** link the one stylesheet and mount components from the bundle namespace —
```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
<!-- const { Button, Card, StatusBadge } = window.<Namespace> -->
```
Call `check_design_system` for the exact namespace. For HTML artifacts/mocks, copy the assets you need and reference brand tokens via the CSS custom properties — never hard-code hexes that aren't in `tokens/colors.css`.

**Tailwind consumers — alpha-capability note.** The DS `tokens/colors.css` stores plain hex (the DS components consume them via inline `style`/`var()`, where opacity isn't needed). If you wire these into a **Tailwind** config, do **not** map utilities to `var(--vm-navy)` directly — a plain-hex var can't take Tailwind opacity modifiers, so `bg-vm-navy/10`, `border-vm-border/40`, etc. break. Store the tokens as space-separated **RGB channels** (`--vm-navy: 15 28 46`) and wrap each utility as `rgb(var(--vm-navy) / <alpha-value>)`. See `MIGRATION.md` Phase 0 for the full pattern — it bit the production migration (~240 `/opacity` usages) and is the recommended setup for any Tailwind integration.

**Production app:** token source of truth is `app/globals.css` + `tailwind.config.ts`; canonical docs are in this folder (`README.md`, `MIGRATION.md`, `tokens/`).
