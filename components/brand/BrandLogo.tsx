import React from "react";

export interface BrandLogoProps {
  variant?: "forest" | "ivory";
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  className?: string;
}

export default function BrandLogo({
  variant = "forest",
  size = "md",
  iconOnly = false,
  className = "",
}: BrandLogoProps) {
  const isForest = variant === "forest";
  const logoColor = isForest ? "text-brand-forest" : "text-brand-ivory";

  const sizeClasses = {
    sm: { icon: "h-5 w-5", text: "text-sm", sub: "text-[8px]" },
    md: { icon: "h-7 w-7", text: "text-lg", sub: "text-[9px]" },
    lg: { icon: "h-10 w-10", text: "text-2xl", sub: "text-[11px]" },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${logoColor} ${className}`}>
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
        <div className="flex flex-col text-left">
          <span
            className={`font-serif font-bold tracking-widest uppercase leading-none ${sizeClasses.text}`}
          >
            VELOCITY<span className="text-brand-gold">MAID</span>
          </span>
          <span
            className={`font-sans font-bold uppercase tracking-[0.22em] leading-none mt-1 ${
              isForest ? "text-brand-slate/60" : "text-brand-ivory/60"
            } ${sizeClasses.sub}`}
          >
            Premium Property Care
          </span>
        </div>
      )}
    </div>
  );
}
