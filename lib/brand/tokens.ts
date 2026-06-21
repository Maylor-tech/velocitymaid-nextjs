/**
 * @deprecated LEGACY — "VelocityMaid Unified Experience System" brand
 * tokens v2.0.0. This forest/gold/ivory/slate palette is NOT part of the
 * approved velocitymaid-brand-guidelines.docx (approved palette is Navy
 * #0F1C2E / Cyan #00C2CB / White, see lib/brand/colors.ts). Still
 * referenced by ~32 files including the global header, footer, and most
 * marketing pages — see Brand Audit Report §3–§5 and the Component
 * Standardization Plan for the phased migration. Do not use in new code.
 */
export const brand = {
  forest: "#0B221E",
  forestHover: "#091916",
  gold: "#D4AF37",
  goldHover: "#C19A2E",
  ivory: "#FBF9F4",
  slate: "#2C3E3B",
  white: "#FFFFFF",
} as const;

export const brandClasses = {
  /** Global page shell */
  bgPage: "bg-brand-ivory min-h-screen",
  /** Primary CTA */
  btnPrimary:
    "bg-brand-forest text-brand-ivory font-sans font-bold uppercase tracking-wider text-xs px-6 py-3 rounded shadow-md hover:bg-brand-forest/90 btn-tactile",
  /** Secondary / accent CTA */
  btnSecondary:
    "bg-brand-gold hover:bg-brand-gold-hover text-brand-forest font-sans font-bold uppercase tracking-wider text-xs px-6 py-3 rounded shadow-md btn-tactile",
  /** Outline */
  btnOutline:
    "border border-brand-forest/20 hover:border-brand-forest text-brand-forest font-sans font-bold uppercase tracking-wider text-xs px-6 py-3 rounded bg-transparent btn-tactile",
  link: "text-brand-forest hover:underline",
  input:
    "w-full bg-white border border-border rounded px-3 py-2 text-sm text-brand-slate focus:outline-none focus:border-brand-forest transition-colors placeholder:text-muted-foreground/50",
  card: "bg-white rounded-lg shadow-xl border border-border/50 p-6 lg:p-8",
  calmAlert:
    "flex items-start gap-3 bg-brand-forest/5 p-4 rounded border border-brand-forest/10",
  trustBadge:
    "flex items-center gap-2.5 px-3 py-1.5 bg-brand-forest/5 rounded-full border border-brand-forest/10 w-fit",
  heroTitle:
    "text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-brand-forest",
  sectionTitle:
    "text-3xl sm:text-4xl font-serif font-bold tracking-tight text-brand-forest",
  body: "text-sm sm:text-base font-sans font-medium text-brand-slate/80 leading-relaxed",
  label:
    "text-xs font-sans font-bold uppercase tracking-wider text-brand-slate",
} as const;
