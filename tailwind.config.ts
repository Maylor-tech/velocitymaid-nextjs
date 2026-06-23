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
        // VelocityMaid approved brand palette — values verified byte-exact
        // against velocitymaid-brand-guidelines.docx (Color System table).
        // Canonical TS source + contrast notes: lib/brand/colors.ts.
        // Do not change these hex values without updating the approved
        // brand guidelines first. See Brand Audit Report §1 for history —
        // these previously held incorrect hex values (e.g. vm-navy was
        // #061B44, vm-cyan was #22D3EE) that did not match the approved
        // guidelines; corrected as part of the brand implementation audit.
        "vm-navy": "#0F1C2E",
        "vm-cyan": "#00C2CB",
        "vm-cyan-dark": "#00A8B0",
        "vm-surface": "#F4F6F9",
        "vm-text": "#1A1A2E",
        "vm-muted": "#6B7280",
        "vm-white": "#FFFFFF",
        // Not part of the approved 7-color palette — utility-only hairline
        // border neutral. Flagged in Brand Audit Report §1 as a non-standard
        // addition; kept as-is to avoid an unreviewed visual change to every
        // bordered component that depends on it.
        "vm-border": "#E0E4EA",
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Approved brand typefaces (velocitymaid-brand-guidelines.docx:
        // "Display: Space Grotesk Bold. Body: Inter Regular/SemiBold. No
        // alternate fonts."). Use font-heading for all headlines/wordmark/
        // buttons and font-body for all body copy/forms/tables.
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
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
        marketing: "80rem",
        portal: "90rem",
      },
    },
  },
  plugins: [],
};
export default config;
