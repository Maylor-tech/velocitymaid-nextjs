# VelocityMaid — Website & Dashboard Redesign Handoff for Cursor

**Version:** 1.2 · 17 Nov 2026 (launch decisions; Vermont hosts page; no starting prices) · **Owner:** Brian Bruce Maylor, VelocityMaid LLC
**Design source of truth:** the VelocityMaid design system (tokens, logo v2.3) and the "VelocityMaid Brand in Use" canvas.

---

## 1. How to use this package (start here)

1. Create a new branch in your VelocityMaid repo, for example `redesign/brand-v2.3`.
2. Copy this folder's contents into the **root** of the repo:
   - `public/brand/` → logos and web icons (goes into your existing `public/` folder)
   - `styles/velocitymaid-tokens.css` → design tokens (CSS variables)
   - `styles/tailwind.velocitymaid.ts` → the same tokens for Tailwind
   - `.cursor/rules/velocitymaid-brand.mdc` → rules Cursor follows automatically on every change
   - `reference/*.html` → the approved mockups. Open them in a browser to see the target. Cursor reads them too.
   - `CURSOR_HANDOFF.md` → this file
3. Open the repo in Cursor and run the prompts in **Section 9**, one at a time, checking the result after each.
4. Nothing goes to production until Section 10's checklist passes and you approve a Preview deployment.

> The reference HTML files are **pictures in code form**. Cursor should rebuild them as proper components with the tokens, not paste their inline styles into the app.

---

## 2. Goals

1. **Trust in five seconds.** A first-time visitor should see who we are, where we work, and why we're safe to let into a home before scrolling.
2. **Not generic.** Most cleaning sites say the same things. Ours shows the product: the photo report a host gets after every clean.
3. **Copy that closes.** Every section ends in a clear next step: Vermont host intake or New Jersey online booking.
4. **One brand everywhere.** Website, admin, cleaner app and customer portal all use the same tokens, logo and voice.

---

## 3. What competitors do, and what we're changing

| What the market does | Who does it | Our decision |
| --- | --- | --- |
| Puts insured / background-checked / guarantee right at the top | National maid brands (Merry Maids, Molly Maid) | **Adopt.** Trust strip above the header and check-marks under the hero. Using only the claims Brian confirmed: insured, background-checked team, re-clean guarantee. |
| Puts its guarantee in a named, simple promise | Merry Maids (24-hour guarantee), Molly Maid / Neighborly ("done right" promise) | **Adopt** as "Our re-clean guarantee: tell us within 24 hours and we'll come back and fix it, free." |
| Photo-verified checklists and problem reporting for hosts | Turno, Properly (host software) | **Make it our headline.** These are software tools hosts set up themselves. We're a service that hands hosts the photo proof, so the hero shows a sample turnover report. |
| Calendar sync with Airbnb/VRBO so turnovers schedule themselves | Turno, Properly | **"Coming soon" only** (planned, not live). In the FAQ, not the hero. |
| Local tenure and word of mouth | Established Okemo-area cleaners (some advertise 15+ years locally) | **Counter with process and story:** the founder's 13 years in Royal Caribbean hospitality, plus photo evidence. Don't compete on years in town. |
| Real reviews, real team photos, before/after photos | Nearly everyone who converts well | **Adopt, with real content only.** Review cards and the founder photo are placeholders until Brian supplies the real ones. Hide the reviews section until then. |
| Click-to-call everywhere, clear service area | Conversion guides for home services | **Adopt.** Both phone numbers in the top strip, on each market card and in the footer. |

**What makes VelocityMaid different (use this angle everywhere):** *you see every room before you pay.* Vermont hosts get the photo report after QC and only then the invoice. That's a promise national brands and solo cleaners rarely make in writing.

---

## 4. Brand rules (summary — full rules in `.cursor/rules/velocitymaid-brand.mdc`)

- **Colours:** navy `#0F1C2E` (frame), cyan `#00C2CB` (accent), canvas `#F5F7FA`, text `#1B2D42`, muted `#65778C`, line `#E1E8EF`, cyan-dark `#007B84` for cyan text on white.
- **Type:** Space Grotesk 700 headings (−0.025em tracking), Inter body. Load both from Google Fonts with `display=swap`.
- **Logo files (in `public/brand/`):**

| File | Use |
| --- | --- |
| `vm-compact-light.svg` | Website header (40px tall), customer portal header |
| `vm-compact-reversed.svg` | Admin and cleaner app navy sidebar/header, website footer |
| `vm-primary-horizontal.svg` | Large placements on light grounds (about page, PDFs, invoices) |
| `vm-reversed-dark.svg` | Large placements on navy (comes with its own navy background) |
| `vm-servicemark-dark.svg` | Square avatar, email signature, social profile |
| `vm-appicon-fullbleed.svg` | Source for app/home-screen icons |
| `web/*` | `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` |

- **Head tags:**
  ```html
  <link rel="icon" href="/brand/web/favicon.ico" sizes="any">
  <link rel="icon" href="/brand/web/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/brand/web/apple-touch-icon.png">
  <meta name="theme-color" content="#0F1C2E">
  ```
  In Next.js App Router, put these in `app/layout.tsx` metadata (`icons`, `themeColor`).

---

## 5. Homepage spec — `reference/homepage.html`

Build these sections in this order. The copy below is final unless it's in [brackets].

**5.1 Trust strip** (navy, 13px)
- Left: `Insured · Background-checked team · Re-clean guarantee`
- Right: `VT (802) 733-5348` · `NJ (973) 280-9190` — both `tel:` links.

**5.2 Header** (white, sticky)
- `vm-compact-light.svg` at 40px tall, linking home.
- Nav: Vacation rentals · Home cleaning · How it works · About · **Get a quote** (navy button).
- Mobile: logo + "Get a quote" + menu button. The menu opens a sheet with the nav and both phone numbers.

**5.3 Hero** (navy)
- Eyebrow: `VERMONT · NEW JERSEY` (cyan)
- H1: **A hotel-standard clean. Photo proof every time.**
- Sub: *Vacation-rental turnovers and home cleaning, run by a 13-year hospitality veteran. You see every room before you pay.*
- Buttons: `I host in Vermont →` (cyan, → `/vermont/host-intake`) · `Clean my home in NJ →` (white, → `/book?branch=new-jersey`)
- Check list: Insured · Background-checked team · Re-clean guarantee
- Right: **sample turnover report card**: 3 photo thumbnails, "Checklist 32 of 32 done", "Noted during the clean: Paper towels low", "Guest-ready 2:40 pm", "QC approved". Label it `TURNOVER REPORT · EXAMPLE`. Replace the grey boxes with 3 real, cropped job photos (no guest belongings, no addresses).

**5.4 Choose your area** — two cards
- **Vermont hosts** · (802) 733-5348 · "Turnovers between check-out and check-in, quoted per property. Deep cleans, post-construction cleans and residential cleaning by quote." Bullets: beds and linens reset, kitchen and baths guest-ready · photo report after QC, before you're invoiced · anything we notice during the clean is noted in your report. Button `Start host intake →`. Small print: "Invoiced after the clean passes QC."
- **New Jersey homes** · (973) 280-9190 · "Recurring and one-time home cleaning, deep cleans and move-outs." Bullets: checklist and photos, based on the service you book · choose your date and pay securely online · re-clean guarantee on every visit. Button `Book in New Jersey →`. Small print: "Pay online when you book. Price confirmed before you pay."

**5.5 What happens on every clean** — 4 numbered steps
01 Room-by-room checklist · 02 Before and after photos · 03 Quality check · 04 Your report, then the invoice ("See the work first, plus anything we noticed during the clean.").

**5.6 Founder** — photo + story
- Eyebrow `WHY WE CLEAN LIKE THIS`, H2 **Thirteen years of hospitality, in every room.**
- Body: "Before VelocityMaid, founder Brian Bruce Maylor spent 13 years with Royal Caribbean, in the galley and as a dining room lead, where a room has to be guest-ready on a deadline, every time. That's the standard we bring to your property: a checklist, a clock, and someone checking the work."
- [Founder photo: Brian on a job, natural light, 4:5.]

**5.7 Reviews** — "What our clients say". One featured review card (real, from Google, verbatim excerpts):
- Big quote: "We have since hired Velocity Maid for our turnover Airbnb cleanings and never looked back. Our house looks brand new every-time we have a cleaning and our guests are commenting the same."
- Second quote: "Brian and his team were incredibly thorough and spent more than the allotted time to be sure the house was left to our liking."
- 5 stars (this review's own rating), **Jeffrey L.**, "Post-construction clean, then Airbnb turnovers · Okemo Valley, VT", link "Read the full review on Google →" to the review on Google Maps.
- Store reviews as data (`lib/marketing/reviews.ts`: quote, secondQuote?, name, context, stars, sourceUrl). Render the section only when the array has items. Keep quotes word-for-word, including "Velocity Maid" and "every-time" as written.
- **No aggregate "5.0 ★" badge and no review/rating JSON-LD** until there are several reviews.

**5.8 Guarantee band** (cyan-tint): "Our re-clean guarantee — If we missed something, tell us within 24 hours and we'll come back and fix it, free." + `Get a quote`.

**5.9 FAQ** (`<details>` accordion): insured / who's in my home · what if something is missed · how do I pay (VT invoice after QC, NJ online) · calendar sync ("coming soon").

**5.10 Closing CTA** (navy): "Come home to clean." + both market buttons.

**5.11 Footer:** `vm-compact-reversed.svg`, email, both phones, © VelocityMaid LLC.

**SEO basics:**
- Title: "VelocityMaid — Vacation-rental turnovers & home cleaning in Vermont and New Jersey"
- Meta description: "Hotel-standard turnovers and home cleaning with a photo report after every clean. Insured, background-checked team, re-clean guarantee."
- Add `LocalBusiness` JSON-LD (name, phones, url, areaServed: Vermont, New Jersey). Never add review stars until real reviews exist.

---

## 5B. Vermont hosts page spec — `/vermont/host-intake`, `reference/vermont-hosts.html`

Replace the current page layout. Keep the route, the intake API, every field name and the validation rules. This is presentation, copy and form flow only.

1. **Shared chrome:** the same TrustStrip, SiteHeader and SiteFooter as the homepage (`components/vm/*`). "Vacation rentals" shows as the active nav item. Remove the old 9-item navy header from all marketing pages.
2. **Hero** (navy, left-aligned): eyebrow `VERMONT HOSTS · OKEMO VALLEY & MIDDLEBURY`. H1 **Guest-ready properties, every turnover.** ("every turnover." in cyan). Sub: "Turnovers that follow your property's own checklist, with a photo report after every clean. You see the work before you pay." Buttons: `Get my turnover quote` (cyan, scrolls to the form) · `Call or text (802) 733-5348` (outline, `tel:`). Small: "No card needed to get a quote." Right: "What you get · Example" report card (Checklist: your property's list, completed · Photos: room by room · Noted during the clean: Paper towels low · Then: one payment link · pill "QC approved").
3. **Reviews** directly under the hero: Jeffrey L. (featured, verbatim) and Tiffany P., Ludlow, VT ("Thorough and a great job — the photos looked awesome!", existing review on the current page). Both come from `lib/marketing/reviews.ts`; add Tiffany there with `market: "vermont"`.
4. **How it works**, 4 steps: Tell us about the property (two minutes, no card) · One price, agreed first · The turnover · Photo report, then pay.
5. **What a turnover covers:** kitchen and bathrooms reset · beds made and trash removed · your property's own checklist · photos of finished rooms · anything we notice during the clean, noted in your report. **Also available** (no prices): large-property turnovers, deep and seasonal cleans, post-construction cleans, guest welcome setup. Pricing line: "Every property is different, so we quote after a quick review of size, scope and schedule. You get one price before we start."
6. **REMOVE the whole "Turnover pricing" section** ($225 / $275 / $325 starting prices and all add-on prices) until Brian approves prices. Remove "Guest-ready inspection" everywhere: no inspection promise.
7. **Gallery:** keep the existing approved photos, 3 across, with captions (Fern Hill · Perkinsville; Ludlow · Okemo Valley; Middlebury · Addison County).
8. **Intake form, two steps on one page.** Same endpoint, same field names, single submit at the end.
   - Step 1 "Your property": full name, mobile, email, property address (+ town), bedrooms, bathrooms, "What do you need?" chips (Turnovers, Deep / seasonal, Post-construction, Welcome setup; maps to the existing service-type values). Button "Continue to turnover details →" validates step 1 only.
   - Step 2 "Turnover details": the existing required fields (access type, linens, same-day turnovers, busy season), then everything optional (contact preference, best time, square footage, beds, amenities, platforms, check-in/out times, frequency, current cleaner, notice period, notes) inside a collapsed "Add more details (optional)" section.
   - Submit: "Request my turnover quote". Under it: "No card needed." Keep "We'll reply within one business day" ONLY if Brian confirms it.
   - Step indicator pills, a Back link on step 2, errors shown inline, focus moves to the first error. Works with keyboard and at 375px.
9. **Contact block** beside the form: call or text, email, WhatsApp.
10. **Host FAQ:** areas covered · how pricing is set · who provides linens · how do I pay · what if something is missed (24-hour re-clean) · calendar sync (coming soon).

## 6. Admin dashboard spec — `reference/admin-jobs.html`

Keep every existing route, permission, query and state transition. These are **visual and layout** changes plus three new panels that read existing data.

1. **Sidebar:** navy, 250px, `vm-compact-reversed.svg` at 200px wide. Active item: `#25435B` fill with a 3px cyan inset bar on the left. Only the signed-in role's items, scoped by branch.
2. **Top bar:** branch selector (Vermont / New Jersey), global search ("Search jobs, properties, people"), sample-data badge in non-production only.
3. **Metrics row:** Scheduled · Needs cleaner · New requests · Awaiting QC. Show "—" when a figure is unknown, never a guess.
4. **Calendar** (week/month) with job days tinted cyan-tint and labelled by property.
5. **Needs attention:** every row shows the *exact* offer state, e.g. "Offer created · email delivered · not yet accepted". States: created → notification attempted → delivered / failed / unknown → accepted / declined / expired → assigned.
6. **NEW — Flagged in reports:** damage or low supplies a cleaner flagged, with photo, and whether the host has been told. Action: `Notify host →`.
7. **NEW — Reports and invoices:** QC-approved reports not yet sent (`Send report`), then invoices and their payment status. The rule: the host gets the report first, then the invoice.
8. **Session expiry on dispatch:** if the session expired, show "No offer was created by this attempt", re-authenticate, check for an existing offer, then allow one retry. Never auto-retry.

---

## 7. Cleaner app and customer portal

- **Cleaner offer** (`reference/cleaner-offer.html`): navy header with compact reversed logo. Offer card shows compensation (flat rate), schedule (check-out → next check-in), job type, respond-by deadline. Buttons: Decline (secondary) / Accept offer (primary). Note: "You're assigned only after you accept."
- **Customer report** (`reference/customer-report.html`): light header with compact light logo. Report shows QC status, checklist count, photo count, guest-ready time, photo grid, then the invoice. Bottom nav: Overview · Request · Properties · Reports.
- Cleaner payout amounts are never shown to customers. Customer prices are never shown to cleaners.

---

## 8. Confirm before launch (Brian)

These are in the design but need a yes from you, or real content:

- [ ] Re-clean guarantee wording: "tell us within 24 hours and we'll come back and fix it, free"
- [x] Issues: report what's noticed during service; never promise a full inspection (decision Nov 17)
- [x] NJ checklist and photo report: provided according to the booked service package (decision Nov 17)
- [ ] NJ service list: recurring, one-time, deep cleans, move-outs
- [x] Vermont pricing: **no starting prices on the site** until Brian approves (decision Nov 17)
- [ ] Vermont payment methods for the FAQ (card / Zelle / PayPal?)
- [ ] "We'll reply within one business day": confirm or remove
- [ ] 3 real job photos for the hero report card (no guest items, no addresses)
- [ ] Founder photo
- [x] First real review received (Jeffrey Lajoie, Google, 5★). Courtesy: let Jeff know you're quoting him on the site
- [ ] More reviews (use Google's "Get more reviews" link with recent clients)
- [ ] Service-area towns for each market (for the footer and local SEO pages)

---

## 9. Cursor prompts — run in order

Paste one prompt, review the diff, run the app, then move on.

**Prompt 1 — Setup and tokens**
> Read `CURSOR_HANDOFF.md` and `.cursor/rules/velocitymaid-brand.mdc`. On the current branch, import `styles/velocitymaid-tokens.css` globally and merge `styles/tailwind.velocitymaid.ts` into the Tailwind theme (`theme.extend`). Load Space Grotesk (500, 700) and Inter (400, 600, 700) with next/font or Google Fonts `display=swap`. Replace the existing favicon and app icons with the files in `public/brand/web/` and set `themeColor` to `#0F1C2E`. Don't change any page layouts yet. List every file you changed.

**Prompt 2 — Shared components**
> Using only the tokens, create or update these shared components: Button (primary navy, accent cyan with navy text, secondary white, danger, link), Tag/StatusPill (info, warning, danger, success), Callout (note, warning), Card, MetricCard (cyan 36×4 accent bar), SiteHeader, TrustStrip, SiteFooter, Logo (picks `vm-compact-light.svg` or `vm-compact-reversed.svg` by a `tone` prop). All controls ≥44px, visible 3px cyan focus ring. No page changes yet.

**Prompt 3 — Homepage**
> Rebuild the homepage to match `reference/homepage.html` and Section 5 of `CURSOR_HANDOFF.md`, using the shared components. Keep the copy exactly as written. Vermont buttons go to `/vermont/host-intake`, New Jersey buttons to `/book?branch=new-jersey`. Make the reviews section render only when a `reviews` array has items (start it empty). Phone numbers are `tel:` links. Add the title, meta description and LocalBusiness JSON-LD from Section 5, with no ratings. The page must work at 375px wide: stacked cards, wrapping buttons, mobile menu.

**Prompt 4 — Admin dashboard visuals**
> Restyle the admin layout and Jobs page to match `reference/admin-jobs.html` and Section 6. Do NOT change auth, Prisma schema, queries, dispatch logic or job state transitions. Use existing data for the Needs attention, Flagged in reports, and Reports and invoices panels. If the data for a panel doesn't exist yet, render an empty state ("Nothing flagged") and list what's missing instead of inventing a model.

**Prompt 5 — Cleaner and customer views**
> Restyle the cleaner offer screen and the customer report screen to match `reference/cleaner-offer.html` and `reference/customer-report.html`. Keep existing endpoints and state changes. Accepting an offer must keep its existing confirmation step.

**Prompt 6 — QA pass**
> Audit the changed pages against Section 10 of `CURSOR_HANDOFF.md`. Report each item as pass or fail with the file and line. Fix only visual or accessibility failures. List anything else for me to decide.

**Prompt 7 — Launch decisions + Vermont hosts page (v1.2)**
> Apply the v1.2 launch decisions to the homepage (Section 5.3/5.4/5.5 wording, no $225), then rebuild /vermont/host-intake per Section 5B and reference/vermont-hosts.html. Keep the route, intake API, field names and validation. Remove the pricing section and every "inspection" promise. Grep the public site for "$225", "$275", "$325", "starting" and "inspection" and list every hit. Screenshots vermont-hosts-1440-v1.png and vermont-hosts-375-v1.png (and the form on step 2). Tests, list files changed, stop.

---

## 10. Acceptance checklist

- [ ] No hex colours outside the token files; no white text on cyan anywhere
- [ ] Logo is always a file from `public/brand/`, never typed text
- [ ] Trust strip, hero CTAs and both phone numbers are visible without scrolling at 1440px and 375px
- [ ] Vermont and New Jersey CTAs route correctly; the two payment journeys stay separate
- [ ] No invented reviews, ratings, awards or claims; reviews hidden while empty
- [ ] Every button and link ≥44px tall with a visible keyboard focus ring
- [ ] Text contrast ≥4.5:1 (check muted grey text on the canvas background)
- [ ] Offer states in admin match the five-stage lifecycle exactly
- [ ] No duplicate offer or customer message can come from a retry
- [ ] Lighthouse: Accessibility ≥95, Performance ≥85 on mobile for the homepage
- [ ] Reviewed on a Vercel **Preview** deployment and approved by Brian before production
