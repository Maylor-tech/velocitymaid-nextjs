/**
 * VelocityMaid Approved Button Tokens — v2.3 (source of truth)
 *
 * Built only from the approved palette (lib/brand/colors.ts) and approved
 * typography. Wired into components/ui/button.tsx as the "navy" | "cyan" |
 * "navyOutline" variants. Sentence case — no uppercase transform.
 *
 * Brand guideline mapping:
 *  - Navy  = primary buttons
 *  - Cyan  = accent CTAs (navy text on cyan — never white on cyan)
 *  - Cyan Dark (#007B84) = text/links on white only, not button fill hover
 */
export { colorClasses, brandClasses, colors } from "./colors";

export const buttonTokens = {
  /** Primary CTA — Navy fill, White text */
  primary:
    "bg-vm-navy text-vm-white font-heading font-bold tracking-tight text-sm px-6 py-3 rounded-vm-md shadow-md hover:bg-vm-navy/90 min-h-touch",
  /** Accent CTA — Cyan fill, Navy text (fill stays #00C2CB) */
  accent:
    "bg-vm-cyan text-vm-navy font-heading font-bold tracking-tight text-sm px-6 py-3 rounded-vm-md shadow-md hover:bg-vm-cyan/90 min-h-touch",
  /** Outline — Navy border/text, transparent fill */
  outline:
    "border border-vm-navy/20 hover:border-vm-navy text-vm-navy font-heading font-bold tracking-tight text-sm px-6 py-3 rounded-vm-md bg-transparent min-h-touch",
} as const;

export type ApprovedButtonVariant = keyof typeof buttonTokens;
