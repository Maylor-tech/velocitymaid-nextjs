import React from "react";

/**
 * BrandLogo — approved logo v2.3 SVG masters.
 * Do not recreate with HTML/CSS. Canonical files live in
 * `/public/brand/velocitymaid/` (referenced relatively from this docs tree).
 *
 * theme="light" → primary / mark on light backgrounds
 * theme="dark"  → reversed / servicemark-dark on navy backgrounds
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
    ? `${ASSET_BASE}/vm-servicemark-dark.svg`
    : `${ASSET_BASE}/vm-servicemark-transparent.svg`;
  const wordmarkSrc = isDark
    ? showTagline
      ? `${ASSET_BASE}/vm-reversed-dark.svg`
      : `${ASSET_BASE}/vm-compact-reversed.svg`
    : showTagline
      ? `${ASSET_BASE}/vm-primary-horizontal.svg`
      : `${ASSET_BASE}/vm-compact-light.svg`;

  const alt = showTagline
    ? "VelocityMaid — COME HOME TO CLEAN"
    : "VelocityMaid";

  if (iconOnly) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          width: iconSize,
          height: iconSize,
          ...style,
        }}
      >
        <img
          src={markSrc}
          alt="VelocityMaid"
          width={iconSize}
          height={iconSize}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", ...style }}>
      <img
        src={wordmarkSrc}
        alt={alt}
        height={iconSize}
        style={{ height: iconSize, width: "auto", objectFit: "contain" }}
      />
    </span>
  );
}
