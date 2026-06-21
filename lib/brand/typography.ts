/**
 * VelocityMaid Approved Type Scale — v1 (source of truth)
 *
 * Mirrors the Type Scale table in velocitymaid-brand-guidelines.docx.
 * Headlines/wordmark/buttons = Space Grotesk 700 (font-heading). Body/
 * forms/tables/captions = Inter 400/600 (font-body). Per the guideline's
 * Usage Rules: never mix the two roles, and respect minimum line-heights
 * (1.4x for Inter body copy, 1.1–1.2x for Space Grotesk headlines).
 */
export const approvedType = {
  /** H1 — 40–48pt / 48–56px, Space Grotesk 700, +1% tracking */
  h1: "font-heading font-bold tracking-tight text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.15]",
  /** H2 — 28–32pt / 32–36px, Space Grotesk 700 */
  h2: "font-heading font-bold tracking-tight text-3xl sm:text-4xl leading-[1.15]",
  /** H3 — 20–22pt / 22–26px, Space Grotesk 700 */
  h3: "font-heading font-bold tracking-tight text-xl sm:text-2xl leading-[1.2]",
  /** Wordmark — Space Grotesk 700, +4 tracking, ALL CAPS */
  wordmark: "font-heading font-bold uppercase tracking-[0.2em]",
  /**
   * Tagline — Space Grotesk/Inter 9–11px, +3 tracking, ALL CAPS,
   * 38–45% opacity. Always render the approved copy verbatim:
   * "COME HOME TO CLEAN."
   */
  tagline:
    "font-body font-normal uppercase tracking-[0.15em] text-[10px] text-vm-muted opacity-40",
  /** Body — Inter 400, 10–11pt / 15–16px */
  body: "font-body font-normal text-base leading-relaxed text-vm-text",
  /** Caption / helper — Inter 400, 8–9pt / 12–13px, Muted color */
  caption: "font-body font-normal text-xs text-vm-muted",
  /** Button / CTA — Space Grotesk 700, 10–12pt / 14–16px, +2% tracking */
  button: "font-heading font-bold uppercase tracking-wider text-xs",
} as const;

/**
 * @deprecated LEGACY — "UX/DS v2.0.0" scale, built on font-serif (Playfair
 * Display) and font-sans (Plus Jakarta Sans), neither of which is in the
 * approved brand guidelines ("Display: Space Grotesk Bold. Body: Inter
 * Regular/SemiBold. No alternate fonts."). Still referenced by ~20 files —
 * see Brand Audit Report §2 and the Component Standardization Plan for the
 * migration path. Do not use in new code — use approvedType above.
 */
export const typeScale = {
  hero: "text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold tracking-tight",
  section: "text-3xl sm:text-4xl font-serif font-bold tracking-tight",
  cardTitle: "text-xl font-serif font-bold tracking-tight",
  body: "text-sm sm:text-base font-sans font-medium text-brand-slate/80 leading-relaxed",
  label: "text-xs font-sans font-bold uppercase tracking-wider",
  dashboardLabel:
    "text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground",
  table: "text-xs sm:text-sm font-sans font-medium text-brand-slate",
  helper: "text-[11px] font-sans font-semibold text-destructive",
} as const;
