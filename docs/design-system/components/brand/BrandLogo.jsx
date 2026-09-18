import React from "react";

/**
 * BrandLogo — approved Final Approval Pack lockups (PNG masters).
 * Do not recreate with SVG/HTML/CSS. Canonical files live in
 * `/public/brand/velocitymaid/` (referenced relatively from this docs tree).
 *
 * theme="light" → primary / mark on light backgrounds
 * theme="dark"  → reversed / mark-white on navy backgrounds
 */
const ASSET_BASE = "../../../public/brand/velocitymaid";

export function BrandLogo({
  theme = "light",
  iconOnly = false,
  showTagline = true,
  iconSize = 28,
  style = {},
}) {
  const isDark = theme === "dark";
  const markSrc = isDark
    ? `${ASSET_BASE}/velocitymaid-mark-white.png`
    : `${ASSET_BASE}/velocitymaid-mark.png`;
  const wordmarkSrc = isDark
    ? showTagline
      ? `${ASSET_BASE}/velocitymaid-reversed-clear.png`
      : `${ASSET_BASE}/velocitymaid-reversed-notag.png`
    : showTagline
      ? `${ASSET_BASE}/velocitymaid-primary.png`
      : `${ASSET_BASE}/velocitymaid-primary-notag.png`;

  const alt = showTagline
    ? "VelocityMaid — COME HOME TO CLEAN"
    : "VelocityMaid";

  if (iconOnly) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: iconSize,
          width: iconSize,
          flexShrink: 0,
          ...style,
        }}
      >
        <img
          src={markSrc}
          alt="VelocityMaid"
          width={iconSize}
          height={iconSize}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
        />
      </span>
    );
  }

  const wordHeight = Math.round(iconSize * 1.15);
  const wordWidth = Math.round(wordHeight * (showTagline ? 1024 / 352 : 1024 / 246));

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: wordHeight,
        maxWidth: wordWidth,
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={wordmarkSrc}
        alt={alt}
        width={wordWidth}
        height={wordHeight}
        style={{
          display: "block",
          height: "100%",
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: "left center",
        }}
      />
    </span>
  );
}
