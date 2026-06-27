import React from "react";
import { colors } from "@/lib/brand/colors";

/** Semantic logo sizes — use consistently across header, auth, portal, and mobile. */
export type BrandLogoSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "header"
  | "auth"
  | "portal"
  | "mobile";

export interface BrandLogoProps {
  /**
   * @deprecated Legacy naming from the retired forest/gold/ivory system.
   * Kept so existing call sites don't break. "forest" now renders the
   * approved Navy (vm-navy) treatment for light backgrounds; "ivory" now
   * renders the approved White (vm-white) treatment for dark/navy
   * backgrounds. Both map internally to standardized VelocityMaid
   * Navy/Cyan/White colors — this is a token swap, not a redesign.
   */
  variant?: "forest" | "ivory";
  /**
   * Preferred API. "light" = light background (navy house mark + cyan
   * sparkle); "dark" = dark/navy background (cyan house mark + white
   * sparkle). When set, takes precedence over the legacy `variant`.
   */
  theme?: "light" | "dark";
  /** @deprecated Prefer semantic sizes: header, auth, portal, mobile */
  size?: BrandLogoSize;
  iconOnly?: boolean;
  showTagline?: boolean;
  className?: string;
}

/**
 * `px` is the rendered icon size in pixels for each Tailwind height/width
 * class below — used to apply the approved sparkle-drop rule (brand
 * guidelines §2.3: "drop the sparkle accent at 32px and below; the house
 * mark alone holds clearly down to 16px").
 */
const SIZE_MAP: Record<
  BrandLogoSize,
  { icon: string; px: number; text: string; sub: string; gap: string }
> = {
  /** Mobile nav — icon-forward, compact wordmark */
  mobile: { icon: "h-5 w-5", px: 20, text: "text-sm", sub: "text-[7px]", gap: "gap-2" },
  xs: { icon: "h-4 w-4", px: 16, text: "text-xs", sub: "text-[7px]", gap: "gap-1.5" },
  /** Portal nav, footer */
  sm: { icon: "h-5 w-5", px: 20, text: "text-sm", sub: "text-[8px]", gap: "gap-2" },
  portal: { icon: "h-5 w-5", px: 20, text: "text-sm", sub: "text-[8px]", gap: "gap-2" },
  /** Marketing / branch headers */
  header: { icon: "h-6 w-6", px: 24, text: "text-base", sub: "text-[8px]", gap: "gap-2.5" },
  /** Login pages — proportional, above-the-fold friendly */
  auth: { icon: "h-5 w-5", px: 20, text: "text-sm", sub: "text-[7px]", gap: "gap-2" },
  md: { icon: "h-7 w-7", px: 28, text: "text-lg", sub: "text-[9px]", gap: "gap-2.5" },
  lg: { icon: "h-10 w-10", px: 40, text: "text-2xl", sub: "text-[11px]", gap: "gap-3" },
};

/** Brand guidelines §2.3: drop the sparkle accent at 32px and below. */
const SPARKLE_MIN_PX = 32;

export default function BrandLogo({
  variant,
  theme,
  size = "header",
  iconOnly = false,
  showTagline = true,
  className = "",
}: BrandLogoProps) {
  // Resolve the treatment: the preferred `theme` prop wins; otherwise fall
  // back to the legacy `variant` (forest -> light, ivory -> dark). Neither
  // set defaults to "light" (the prior `variant="forest"` default), so all
  // existing call sites render an identical mark.
  const resolvedTheme = theme ?? (variant === "ivory" ? "dark" : "light");
  // light background -> approved Navy treatment: navy house mark, cyan sparkle.
  // dark/navy background -> approved White treatment: cyan house mark, white sparkle.
  const isNavyTreatment = resolvedTheme === "light";
  const logoColor = isNavyTreatment ? "text-vm-navy" : "text-vm-white";
  const sizeClasses = SIZE_MAP[size];
  const showSparkle = sizeClasses.px > SPARKLE_MIN_PX;

  // Per the approved logo system (velocitymaid-logo-system-v1): the house mark
  // and sparkle swap which one carries the cyan accent depending on
  // background, and the small center dot always matches the surface it sits
  // on so it reads as a tiny punch-through highlight.
  const houseFill = isNavyTreatment ? "currentColor" : colors.primaryCyan;
  const sparkleFill = isNavyTreatment ? colors.primaryCyan : "currentColor";
  const dotFill = isNavyTreatment ? colors.white : colors.primaryNavy;

  return (
    <div
      className={`flex items-center ${sizeClasses.gap} ${logoColor} ${className}`}
    >
      <svg
        className={`${sizeClasses.icon} shrink-0`}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* "V-home" mark — approved icon, velocitymaid-logo-system-v1 */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z"
          fill={houseFill}
        />
        {showSparkle && (
          <>
            <path
              d="M74,14 L75.56,18.44 L80,20 L75.56,21.56 L74,26 L72.44,21.56 L68,20 L72.44,18.44 Z"
              fill={sparkleFill}
            />
            <circle cx="74" cy="20" r="1.5" fill={dotFill} />
          </>
        )}
      </svg>

      {!iconOnly && (
        <div className="flex flex-col text-left min-w-0">
          <span
            className={`font-heading font-bold tracking-widest uppercase leading-none whitespace-nowrap ${sizeClasses.text}`}
          >
            VelocityMaid
          </span>
          {showTagline && (
            <span
              className={`font-body font-bold uppercase tracking-[0.2em] leading-none mt-0.5 ${
                isNavyTreatment ? "text-vm-muted" : "text-vm-white/40"
              } ${sizeClasses.sub}`}
            >
              Come home to clean.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
