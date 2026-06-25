import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // VelocityMaid approved brand palette — Phase 0: now sourced from the
        // design-system CSS custom properties defined in app/globals.css
        // (from migration/phase-0-1 globals.tokens.css). Values are identical
        // to the approved palette (lib/brand/colors.ts / brand guidelines), so
        // this is a non-visual change. Update the values in globals.tokens.css,
        // not here.
        "vm-navy": "var(--vm-navy)", // #0F1C2E
        "vm-cyan": "var(--vm-cyan)", // #00C2CB
        "vm-cyan-dark": "var(--vm-cyan-dark)", // #00A8B0
        "vm-surface": "var(--vm-surface)", // #F4F6F9
        "vm-text": "var(--vm-text)", // #1A1A2E
        "vm-muted": "var(--vm-muted)", // #6B7280
        "vm-white": "var(--vm-white)", // #FFFFFF
        // Utility-only hairline border neutral (not in the approved 7-color
        // palette). Now sourced from --vm-border. NOTE: the DS token value is
        // #E2E8F0; the repo previously hardcoded #E0E4EA (see globals.tokens.css).
        "vm-border": "var(--vm-border)", // #E2E8F0
        // Semantic status tints (Phase 3.0 prerequisite). Additive only —
        // sourced from --vm-* custom properties in app/globals.css. Calm,
        // never neon. Consumed by the DS status map (lib/brand/status.ts).
        "vm-cyan-tint": "var(--vm-cyan-tint)",
        "vm-success": "var(--vm-success)",
        "vm-success-bg": "var(--vm-success-bg)",
        "vm-warning": "var(--vm-warning)",
        "vm-warning-bg": "var(--vm-warning-bg)",
        "vm-danger": "var(--vm-danger)",
        "vm-danger-bg": "var(--vm-danger-bg)",
        "vm-info": "var(--vm-info)",
        "vm-info-bg": "var(--vm-info-bg)",
        "vm-progress": "var(--vm-progress)",
        "vm-progress-bg": "var(--vm-progress-bg)",
        /**
         * @deprecated LEGACY — "UX/DS v2.0.0" palette. NOT part of the
         * approved VelocityMaid brand guidelines (which specify Navy/Cyan/
         * White only). Still referenced by ~32 files — global header,
         * footer, contact, pricing, partners pages, etc. See Brand Audit
         * Report §3–§5 and the Component Standardization Plan for the
         * phased migration to the vm-* approved tokens above. Do not use
         * in new code.
         */
        brand: {
          forest: "#0B221E",
          "forest-hover": "#091916",
          gold: "#D4AF37",
          "gold-hover": "#C19A2E",
          ivory: "#FBF9F4",
          slate: "#2C3E3B",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#F5F3EE",
          100: "#EBE8DF",
          200: "#D4CFC0",
          300: "#A8A090",
          400: "#5C6B66",
          500: "#3D524E",
          600: "#0B221E",
          700: "#091916",
          800: "#071412",
          900: "#050F0D",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      borderRadius: {
        // Visual Alignment PR: DS radii sourced from globals.css --radius-*.
        // Intentionally overrides the prior shadcn var(--radius) mapping —
        // affects rounded-sm/md/lg/xl repo-wide.
        sm: "var(--radius-sm)", // 6px
        md: "var(--radius-md)", // 8px
        lg: "var(--radius-lg)", // 12px
        xl: "var(--radius-xl)", // 16px
      },
      boxShadow: {
        // Visual Alignment PR: navy-tinted DS elevations (globals.css).
        // Overrides Tailwind's default shadow-sm / shadow-lg.
        sm: "var(--shadow-sm)",
        lg: "var(--shadow-lg)",
      },
      fontFamily: {
        // Approved brand typefaces (velocitymaid-brand-guidelines.docx:
        // "Display: Space Grotesk Bold. Body: Inter Regular/SemiBold. No
        // alternate fonts."). Use font-heading for all headlines/wordmark/
        // buttons and font-body for all body copy/forms/tables.
        // next/font CSS variables stay first (avoids a font-loading regression);
        // named families added only as fallbacks (Visual Alignment PR).
        heading: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        /**
         * @deprecated LEGACY — Plus Jakarta Sans / Playfair Display are not
         * in the approved brand guidelines ("no alternate fonts"). These
         * remain mapped for ~20 existing files that reference font-sans /
         * font-serif (see Brand Audit Report §2). Use font-body / font-heading
         * above for new code.
         */
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
        /** @deprecated LEGACY — see font-sans note above. */
        serif: [
          "var(--font-serif)",
          "Playfair Display",
          "Georgia",
          "ui-serif",
          "serif",
        ],
      },
      maxWidth: {
        marketing: "var(--container-marketing)", // 1200px (was 80rem / 1280px)
        portal: "90rem",
      },
    },
  },
  plugins: [],
};
export default config;
