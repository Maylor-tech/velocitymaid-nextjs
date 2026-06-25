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
