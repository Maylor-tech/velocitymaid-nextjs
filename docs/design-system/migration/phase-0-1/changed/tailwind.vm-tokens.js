/**
 * VelocityMaid Design System — Phase 0 token foundation (Tailwind).
 *
 * MERGE this into the app's existing `tailwind.config.{js,ts}` under
 * `theme.extend`. Do NOT replace the whole config. The real config was not
 * in the read-only mount, so this is the TARGET shape — reconcile by hand.
 *
 * Goal: the `vm-*` utility classes already used across the codebase
 * (bg-vm-navy, text-vm-muted, …) should resolve to the design-system CSS
 * custom properties — making the DS the single source of truth for color.
 * Values are identical to the approved palette, so this is a NON-VISUAL change.
 *
 * Prereq: the DS tokens must be loaded at runtime so the vars exist — see
 * globals.tokens.css in this folder.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Approved brand palette — now sourced from DS CSS variables.
        "vm-navy": "var(--vm-navy)",        // #0F1C2E
        "vm-cyan": "var(--vm-cyan)",        // #00C2CB
        "vm-cyan-dark": "var(--vm-cyan-dark)", // #00A8B0
        "vm-surface": "var(--vm-surface)",  // #F4F6F9
        "vm-text": "var(--vm-text)",        // #1A1A2E
        "vm-muted": "var(--vm-muted)",      // #6B7280
        "vm-white": "var(--vm-white)",      // #FFFFFF
        "vm-border": "var(--vm-border)",    // #E2E8F0
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "ui-sans-serif", "sans-serif"],
        body: ["var(--font-body)", "Inter", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "ui-sans-serif", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)", // 6px — buttons/inputs
        md: "var(--radius-md)", // 8px — cards
        lg: "var(--radius-lg)", // 12px — tiles
        xl: "var(--radius-xl)", // 16px — feature/pricing cards
      },
      maxWidth: {
        marketing: "var(--container-marketing)", // 1200px
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },

  /**
   * @deprecated — DELETE in Phase 5. Kept defined elsewhere in the real config
   * so the still-live forest/gold components (CalmAlert, BrandPhotoPlaceholder,
   * CareChecklist, …) keep building until Phases 2–4 migrate them. Do NOT add
   * new usages. Tracked: brand-forest, brand-gold, brand-gold-hover,
   * brand-ivory, brand-slate, primary-*.
   */
};
