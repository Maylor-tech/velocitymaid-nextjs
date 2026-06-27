/**
 * VelocityMaid Approved Button Tokens — v1 (source of truth)
 *
 * Built only from the approved palette (lib/brand/colors.ts) and approved
 * typography (lib/brand/typography.ts → approvedType.button). Wired into
 * components/ui/button.tsx as the "navy" | "cyan" | "navyOutline" variants —
 * use <Button variant="navy"> etc. rather than importing these strings
 * directly, unless you need the raw classes outside a <Button>.
 *
 * Brand guideline mapping:
 *  - Navy  = "Dominant brand color — ... primary buttons"
 *  - Cyan  = "Accent — ... CTAs, highlights"
 *  - Cyan Dark = "Hover/pressed states for cyan elements"
 */
export { colorClasses, brandClasses, colors } from "./colors";

export const buttonTokens = {
  /** Primary CTA — Navy fill, White text */
  primary:
    "bg-vm-navy text-vm-white font-heading font-bold uppercase tracking-wider text-xs px-6 py-3 rounded shadow-md hover:bg-vm-navy/90",
  /** Accent CTA — Cyan fill, Navy text, Cyan Dark on hover */
  accent:
    "bg-vm-cyan text-vm-navy font-heading font-bold uppercase tracking-wider text-xs px-6 py-3 rounded shadow-md hover:bg-vm-cyan-dark",
  /** Outline — Navy border/text, transparent fill */
  outline:
    "border border-vm-navy/20 hover:border-vm-navy text-vm-navy font-heading font-bold uppercase tracking-wider text-xs px-6 py-3 rounded bg-transparent",
} as const;

export type ApprovedButtonVariant = keyof typeof buttonTokens;
