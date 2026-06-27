/**
 * VelocityMaid Approved Spacing Tokens — v1
 *
 * The approved brand guidelines don't prescribe a numeric spacing system,
 * so this scale standardizes the padding/gap values already in use across
 * the codebase's most brand-aligned components (approved-palette buttons,
 * cards, marketing section rhythm, logo clear space) into one named source —
 * rather than inventing new spacing values. Use these tokens for new or
 * updated components instead of re-deriving ad hoc padding/gap classes.
 */
export const spacing = {
  // Component-level
  /** Button horizontal padding */
  buttonX: "px-6",
  /** Button vertical padding */
  buttonY: "py-3",
  /** Card internal padding (mobile / desktop) */
  cardPadding: "p-6 lg:p-8",
  /** Form input horizontal padding */
  inputX: "px-3",
  /** Form input vertical padding */
  inputY: "py-2",
  /** Logo icon-to-wordmark gap at standard header size */
  logoGap: "gap-2.5",
  /**
   * Logo clear space — approved guideline requires 1 icon-width on all
   * sides. p-6 (24px) approximates 1 icon-width at the "header" logo size.
   */
  logoClearSpace: "p-6",

  // Section-level (marketing pages) — DS §10: 80px vertical rhythm (--space-20 / py-20)
  sectionY: "py-20",
  sectionYCompact: "py-16",

  // Layout containers (see tailwind.config.ts maxWidth.marketing/portal)
  containerMarketing: "mx-auto max-w-marketing px-4 sm:px-6 lg:px-8",
  containerPortal: "mx-auto max-w-portal px-4 sm:px-6 lg:px-8",
} as const;

export type SpacingToken = keyof typeof spacing;
