import type { Config } from "tailwindcss";
import { velocitymaid } from "./styles/tailwind.velocitymaid";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Opacity-capable brand colors — RGB channels in app/globals.css
        // (mirrors styles/velocitymaid-tokens.css hex SoT, v2.3).
        "vm-navy": "rgb(var(--vm-navy) / <alpha-value>)", // #0F1C2E
        "vm-cyan": "rgb(var(--vm-cyan) / <alpha-value>)", // #00C2CB
        "vm-cyan-dark": "rgb(var(--vm-cyan-dark) / <alpha-value>)", // #007B84 text/links
        "vm-surface": "rgb(var(--vm-surface) / <alpha-value>)", // #F5F7FA
        "vm-canvas": "rgb(var(--vm-canvas) / <alpha-value>)", // #F5F7FA
        "vm-text": "rgb(var(--vm-text) / <alpha-value>)", // #1B2D42
        "vm-muted": "rgb(var(--vm-muted) / <alpha-value>)", // #65778C
        "vm-white": "rgb(var(--vm-white) / <alpha-value>)", // #FFFFFF
        "vm-border": "rgb(var(--vm-border) / <alpha-value>)", // #E1E8EF
        "vm-line": "rgb(var(--vm-line) / <alpha-value>)",
        "vm-field-border": "rgb(var(--vm-field-border) / <alpha-value>)",
        "vm-cyan-ink": "rgb(var(--vm-cyan-ink) / <alpha-value>)",
        "vm-cyan-tint": "rgb(var(--vm-cyan-tint) / <alpha-value>)",
        "vm-cyan-border": "rgb(var(--vm-cyan-border) / <alpha-value>)",
        "vm-event-border": "rgb(var(--vm-event-border) / <alpha-value>)",
        "vm-nav-active": "rgb(var(--vm-nav-active) / <alpha-value>)",
        "vm-nav-text": "rgb(var(--vm-nav-text) / <alpha-value>)",
        "vm-nav-muted": "rgb(var(--vm-nav-muted) / <alpha-value>)",
        "vm-brand-tagline": "rgb(var(--vm-brand-tagline) / <alpha-value>)",
        "vm-success": "rgb(var(--vm-success) / <alpha-value>)",
        "vm-success-bg": "rgb(var(--vm-success-bg) / <alpha-value>)",
        "vm-warning": "rgb(var(--vm-warning) / <alpha-value>)",
        "vm-warning-bg": "rgb(var(--vm-warning-bg) / <alpha-value>)",
        "vm-warning-border": "rgb(var(--vm-warning-border) / <alpha-value>)",
        "vm-danger": "rgb(var(--vm-danger) / <alpha-value>)",
        "vm-danger-bg": "rgb(var(--vm-danger-bg) / <alpha-value>)",
        "vm-info": "rgb(var(--vm-info) / <alpha-value>)",
        "vm-info-bg": "rgb(var(--vm-info-bg) / <alpha-value>)",
        "vm-progress": "rgb(var(--vm-progress) / <alpha-value>)",
        "vm-progress-bg": "rgb(var(--vm-progress-bg) / <alpha-value>)",
        // Handoff nested mirror (hex) — available as bg-vm-* via flatten below
        // when not already defined above. Kept for Prompt 1 parity.
        ...Object.fromEntries(
          Object.entries(velocitymaid.colors.vm).map(([key, value]) => [
            `vm-handoff-${key}`,
            value,
          ])
        ),
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
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        ...velocitymaid.borderRadius,
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        lg: "var(--shadow-lg)",
        ...velocitymaid.boxShadow,
      },
      minHeight: {
        ...velocitymaid.minHeight,
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        display: velocitymaid.fontFamily.display,
        /**
         * @deprecated LEGACY — Plus Jakarta Sans / Playfair Display are not
         * in the approved brand guidelines. Use font-body / font-heading.
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
        marketing: "var(--container-marketing)",
        portal: "90rem",
      },
      spacing: {
        20: "var(--space-20)",
      },
    },
  },
  plugins: [],
};
export default config;
