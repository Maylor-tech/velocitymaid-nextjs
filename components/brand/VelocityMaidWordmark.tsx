import React from "react";

export type VelocityMaidWordmarkVariant = "homepage" | "market";
export type VelocityMaidMarketTagline = "vermont" | "new-jersey";

export interface VelocityMaidWordmarkProps {
  /** Homepage: compact, no market tagline. Market: full wordmark + tagline. */
  variant?: VelocityMaidWordmarkVariant;
  market?: VelocityMaidMarketTagline;
  /** Wordmark text fill — use dark on light headers, white on navy. */
  wordmarkFill?: string;
  className?: string;
}

const MARKET_TAGLINE: Record<VelocityMaidMarketTagline, string> = {
  vermont: "VERMONT",
  "new-jersey": "NEW JERSEY",
};

export default function VelocityMaidWordmark({
  variant = "homepage",
  market = "vermont",
  wordmarkFill = "#0F1C2E",
  className = "",
}: VelocityMaidWordmarkProps) {
  if (variant === "homepage") {
    return (
      <svg
        width="185"
        height="36"
        viewBox="0 0 200 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="VelocityMaid"
        role="img"
        className={className}
      >
        <polygon points="0,2 12,38 24,2 18,2 12,25 6,2" fill="#22D3EE" />
        <line
          x1="0"
          y1="39"
          x2="24"
          y2="39"
          stroke="#22D3EE"
          strokeWidth="1.5"
          opacity="0.35"
        />
        <text
          x="33"
          y="26"
          fontFamily="Space Grotesk, Arial, sans-serif"
          fontWeight="700"
          fontSize="19"
          fill={wordmarkFill}
          letterSpacing="-0.4"
        >
          VelocityMaid
        </text>
      </svg>
    );
  }

  return (
    <svg
      width="185"
      height="44"
      viewBox="0 0 220 52"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="VelocityMaid"
      role="img"
      className={className}
    >
      <polygon points="0,2 14,46 28,2 21,2 14,30 7,2" fill="#22D3EE" />
      <line
        x1="0"
        y1="47"
        x2="28"
        y2="47"
        stroke="#22D3EE"
        strokeWidth="2"
        opacity="0.35"
      />
      <text
        x="38"
        y="28"
        fontFamily="Space Grotesk, Arial, sans-serif"
        fontWeight="700"
        fontSize="20"
        fill={wordmarkFill}
        letterSpacing="-0.4"
      >
        VelocityMaid
      </text>
      <text
        x="39"
        y="44"
        fontFamily="Arial, sans-serif"
        fontWeight="400"
        fontSize="9"
        fill="#22D3EE"
        letterSpacing="3"
      >
        {MARKET_TAGLINE[market]}
      </text>
    </svg>
  );
}
