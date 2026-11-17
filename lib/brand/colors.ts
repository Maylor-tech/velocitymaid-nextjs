/**
 * VelocityMaid brand colour literals for email/PDF/SVG fills.
 *
 * SOLE SOURCE OF COLOUR VALUES: styles/velocitymaid-tokens.css
 * Do not invent new hex here. When tokens change, update that CSS file first,
 * then keep these TypeScript literals in lockstep for non-CSS consumers.
 *
 * Prefer Tailwind `vm-*` utilities in JSX (wired via app/globals.css channels).
 */
export const colors = {
  // Primary palette — Navy/White ≈ 60% of any layout, Cyan ≈ 10% accent.
  /** Dominant brand color — backgrounds, headlines, primary buttons */
  primaryNavy: "#0F1C2E",
  /** Accent — icon mark, CTAs, highlights (fill/border). Never white text on cyan. */
  primaryCyan: "#00C2CB",
  /** Base surface, reversed text, negative space */
  white: "#FFFFFF",

  // Supporting palette — remaining ≈ 30%.
  /**
   * Cyan for text and links on white only (#007B84).
   * Not a fill or border color — use primaryCyan (#00C2CB) for fills/borders.
   */
  cyanDark: "#007B84",
  /** Page / section background (canvas) */
  surface: "#F5F7FA",
  /** Body copy on white/surface backgrounds */
  text: "#1B2D42",
  /** Captions, helper text, disabled states */
  muted: "#65778C",
} as const;

export type BrandColorToken = keyof typeof colors;

/**
 * Color Ratio Guidance (from approved guidelines):
 * 60% Navy/White · 30% Surface/Text/Muted · 10% Cyan accent.
 * "Cyan is an accent, not a background fill for large text blocks."
 */
export const colorRatioGuidance = {
  navyWhite: 0.6,
  surfaceTextMuted: 0.3,
  cyanAccent: 0.1,
  note: "Cyan is an accent, not a background fill for large text blocks. Text on cyan is always navy.",
} as const;

/** Tailwind utility class lookups for the approved palette (see tailwind.config.ts vm-*). */
export const colorClasses = {
  bg: {
    navy: "bg-vm-navy",
    cyan: "bg-vm-cyan",
    /** Fills must use cyan (#00C2CB), never cyan-dark */
    cyanDark: "bg-vm-cyan",
    surface: "bg-vm-surface",
    white: "bg-vm-white",
  },
  text: {
    navy: "text-vm-navy",
    cyan: "text-vm-cyan",
    /** Accessible cyan text/links on white */
    cyanDark: "text-vm-cyan-dark",
    body: "text-vm-text",
    muted: "text-vm-muted",
    white: "text-vm-white",
  },
  border: {
    navy: "border-vm-navy",
    cyan: "border-vm-cyan",
    surface: "border-vm-surface",
  },
} as const;

/**
 * Composed layout/class strings built from vm-* utilities.
 * Prefer <Button variant="navy|cyan|navyOutline"> for CTAs when possible.
 * Buttons use sentence case — no uppercase transform.
 */
export const brandClasses = {
  /** Global page shell */
  bgPage: "bg-vm-surface min-h-screen",
  /** Primary CTA */
  btnPrimary:
    "bg-vm-navy text-vm-white font-heading font-bold tracking-tight text-sm px-6 py-3 rounded-vm-md shadow-md hover:bg-vm-navy/90 btn-tactile min-h-touch",
  /** Secondary / accent CTA — navy text on cyan (never white on cyan) */
  btnSecondary:
    "bg-vm-cyan hover:bg-vm-cyan/90 text-vm-navy font-heading font-bold tracking-tight text-sm px-6 py-3 rounded-vm-md shadow-md btn-tactile min-h-touch",
  /** Outline */
  btnOutline:
    "border border-vm-navy/20 hover:border-vm-navy text-vm-navy font-heading font-bold tracking-tight text-sm px-6 py-3 rounded-vm-md bg-transparent btn-tactile min-h-touch",
  link: "text-vm-cyan-dark hover:underline",
  input:
    "w-full bg-white border border-vm-field-border rounded-vm-md px-3 py-2 text-sm text-vm-text focus:outline-none focus:border-vm-navy transition-colors placeholder:text-vm-muted/50",
  card: "bg-white rounded-vm-lg shadow-vm-card border border-vm-line p-6 lg:p-8",
  calmAlert:
    "flex items-start gap-3 bg-vm-navy/5 p-4 rounded-vm-md border border-vm-navy/10",
  trustBadge:
    "flex items-center gap-2.5 px-3 py-1.5 bg-vm-navy/5 rounded-full border border-vm-navy/10 w-fit",
  heroTitle:
    "text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-vm-navy",
  sectionTitle:
    "text-3xl sm:text-4xl font-heading font-bold tracking-tight text-vm-navy",
  body: "text-sm sm:text-base font-body font-normal text-vm-text leading-relaxed",
  label: "text-xs font-body font-semibold tracking-wide text-vm-muted",
} as const;

/**
 * WCAG contrast ratios for approved pairings.
 * White on cyan is NOT accessible for text — always use navy on cyan.
 */
export const approvedContrastPairs = [
  { fg: "Navy", bg: "White", ratio: "16.5:1", passesAA: true },
  {
    fg: "Cyan",
    bg: "White",
    ratio: "2.2:1",
    passesAA: false,
    note: "Fails AA for body text — accent/icon use only, never body copy.",
  },
  { fg: "White", bg: "Navy", ratio: "16.5:1", passesAA: true },
  {
    fg: "White",
    bg: "Cyan",
    ratio: "n/a",
    passesAA: false,
    note: "NOT accessible. Text on cyan is always navy #0F1C2E.",
  },
  {
    fg: "Cyan Dark (#007B84)",
    bg: "White",
    ratio: "~4.6:1",
    passesAA: true,
    note: "Use for links and cyan-colored text on white.",
  },
  {
    fg: "Navy",
    bg: "Cyan",
    ratio: "~8:1",
    passesAA: true,
    note: "Required pairing for text/icons on cyan fills.",
  },
] as const;
