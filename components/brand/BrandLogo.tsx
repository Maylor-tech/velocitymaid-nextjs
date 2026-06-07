import React from "react";

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
  variant?: "forest" | "ivory";
  /** @deprecated Prefer semantic sizes: header, auth, portal, mobile */
  size?: BrandLogoSize;
  iconOnly?: boolean;
  showTagline?: boolean;
  className?: string;
}

const SIZE_MAP: Record<
  BrandLogoSize,
  { icon: string; text: string; sub: string; gap: string }
> = {
  /** Mobile nav — icon-forward, compact wordmark */
  mobile: { icon: "h-5 w-5", text: "text-sm", sub: "text-[7px]", gap: "gap-2" },
  xs: { icon: "h-4 w-4", text: "text-xs", sub: "text-[7px]", gap: "gap-1.5" },
  /** Portal nav, footer */
  sm: { icon: "h-5 w-5", text: "text-sm", sub: "text-[8px]", gap: "gap-2" },
  portal: { icon: "h-5 w-5", text: "text-sm", sub: "text-[8px]", gap: "gap-2" },
  /** Marketing / branch headers */
  header: { icon: "h-6 w-6", text: "text-base", sub: "text-[8px]", gap: "gap-2.5" },
  /** Login pages — proportional, above-the-fold friendly */
  auth: { icon: "h-5 w-5", text: "text-sm", sub: "text-[7px]", gap: "gap-2" },
  md: { icon: "h-7 w-7", text: "text-lg", sub: "text-[9px]", gap: "gap-2.5" },
  lg: { icon: "h-10 w-10", text: "text-2xl", sub: "text-[11px]", gap: "gap-3" },
};

export default function BrandLogo({
  variant = "forest",
  size = "header",
  iconOnly = false,
  showTagline = true,
  className = "",
}: BrandLogoProps) {
  const isForest = variant === "forest";
  const logoColor = isForest ? "text-brand-forest" : "text-brand-ivory";
  const sizeClasses = SIZE_MAP[size];

  return (
    <div
      className={`flex items-center ${sizeClasses.gap} ${logoColor} ${className}`}
    >
      <svg
        className={`${sizeClasses.icon} shrink-0`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M15 10L45 85C47 90 53 90 55 85L85 10"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M35 10L50 50L65 10"
          stroke="#D4AF37"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {!iconOnly && (
        <div className="flex flex-col text-left min-w-0">
          <span
            className={`font-serif font-bold tracking-widest uppercase leading-none whitespace-nowrap ${sizeClasses.text}`}
          >
            VELOCITY<span className="text-brand-gold">MAID</span>
          </span>
          {showTagline && (
            <span
              className={`font-sans font-bold uppercase tracking-[0.2em] leading-none mt-0.5 ${
                isForest ? "text-brand-slate/60" : "text-brand-ivory/60"
              } ${sizeClasses.sub}`}
            >
              Premium Property Care
            </span>
          )}
        </div>
      )}
    </div>
  );
}
