/**
 * VelocityMaid Approved Brand Colors — v1 (source of truth)
 *
 * Mirrors the Color System tables in velocitymaid-brand-guidelines.docx
 * verbatim. These are the ONLY colors approved for use across VelocityMaid
 * properties. Do not add, recolor, or substitute values here without an
 * update to the approved brand guidelines — this file should always be
 * traceable back to that document.
 *
 * Tailwind wiring: tailwind.config.ts → theme.extend.colors["vm-*"] uses
 * these exact hex values. Prefer the Tailwind utility classes (vm-navy,
 * vm-cyan, etc., or the colorClasses helper below) in JSX; import the raw
 * hex values here only where a literal string is required (inline SVG
 * fills/strokes, email/PDF templates, canvas, etc.).
 */
export const colors = {
  // Primary palette — Navy/White ≈ 60% of any layout, Cyan ≈ 10% accent.
  /** Dominant brand color — backgrounds, headlines, primary buttons */
  primaryNavy: "#0F1C2E",
  /** Accent — icon mark, CTAs, highlights, links */
  primaryCyan: "#00C2CB",
  /** Base surface, reversed text, negative space */
  white: "#FFFFFF",

  // Supporting palette — remaining ≈ 30%.
  /** Hover/pressed states for cyan elements; small accent text */
  cyanDark: "#00A8B0",
  /** Light section backgrounds, cards, form fields */
  surface: "#F4F6F9",
  /** Body copy on white/surface backgrounds */
  text: "#1A1A2E",
  /** Captions, helper text, disabled states, tagline on white */
  muted: "#6B7280",
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
  note: "Cyan is an accent, not a background fill for large text blocks.",
} as const;

/** Tailwind utility class lookups for the approved palette (see tailwind.config.ts vm-*). */
export const colorClasses = {
  bg: {
    navy: "bg-vm-navy",
    cyan: "bg-vm-cyan",
    cyanDark: "bg-vm-cyan-dark",
    surface: "bg-vm-surface",
    white: "bg-vm-white",
  },
  text: {
    navy: "text-vm-navy",
    cyan: "text-vm-cyan",
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
 * Composed layout/class strings built from vm-* utilities (mirrors
 * app/globals.css @layer components .btn-brand-* helpers). Prefer
 * <Button variant="navy|cyan|navyOutline"> for CTAs when possible.
 */
export const brandClasses = {
  /** Global page shell */
  bgPage: "bg-vm-surface min-h-screen",
  /** Primary CTA */
  btnPrimary:
    "bg-vm-navy text-vm-white font-sans font-bold uppercase tracking-wider text-xs px-6 py-3 rounded shadow-md hover:bg-vm-navy/90 btn-tactile",
  /** Secondary / accent CTA */
  btnSecondary:
    "bg-vm-cyan hover:bg-vm-cyan-dark text-vm-navy font-sans font-bold uppercase tracking-wider text-xs px-6 py-3 rounded shadow-md btn-tactile",
  /** Outline */
  btnOutline:
    "border border-vm-navy/20 hover:border-vm-navy text-vm-navy font-sans font-bold uppercase tracking-wider text-xs px-6 py-3 rounded bg-transparent btn-tactile",
  link: "text-vm-navy hover:underline",
  input:
    "w-full bg-white border border-border rounded px-3 py-2 text-sm text-vm-text focus:outline-none focus:border-vm-navy transition-colors placeholder:text-muted-foreground/50",
  card: "bg-white rounded-lg shadow-xl border border-border/50 p-6 lg:p-8",
  calmAlert:
    "flex items-start gap-3 bg-vm-navy/5 p-4 rounded border border-vm-navy/10",
  trustBadge:
    "flex items-center gap-2.5 px-3 py-1.5 bg-vm-navy/5 rounded-full border border-vm-navy/10 w-fit",
  heroTitle:
    "text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-vm-navy",
  sectionTitle:
    "text-3xl sm:text-4xl font-serif font-bold tracking-tight text-vm-navy",
  body: "text-sm sm:text-base font-sans font-medium text-vm-text/80 leading-relaxed",
  label:
    "text-xs font-sans font-bold uppercase tracking-wider text-vm-text",
} as const;

/**
 * WCAG contrast ratios documented in the approved brand guidelines.
 * Use to decide accessible color pairings before introducing new UI.
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
  { fg: "White", bg: "Cyan", ratio: "7.5:1", passesAA: true },
  {
    fg: "Cyan Dark",
    bg: "White",
    ratio: "3.0:1",
    passesAA: false,
    note: "Fails AA for normal body text; large text/icons only.",
  },
] as const;
