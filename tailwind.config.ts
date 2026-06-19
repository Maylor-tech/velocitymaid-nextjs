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
        "vm-navy": "#061B44",
        "vm-cyan": "#22D3EE",
        "vm-cyan-dark": "#1BB8D4",
        "vm-surface": "#FFFFFF",
        "vm-text": "#1A1A2E",
        "vm-muted": "#6B7280",
        "vm-border": "#E0E4EA",
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
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
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
