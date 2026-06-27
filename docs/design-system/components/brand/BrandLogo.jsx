import React from "react";

/**
 * BrandLogo — the approved VelocityMaid lockup (velocitymaid-logo-system-v1).
 * House + sparkle mark with optional wordmark and "COME HOME TO CLEAN." tagline.
 * `theme="light"` = navy mark for light backgrounds; `theme="dark"` = cyan mark
 * for navy/dark backgrounds. Sparkle is dropped at <=32px icon size per §2.3.
 * Never recolor, restretch, or substitute the mark.
 */
const HOUSE = "M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z";
const SPARKLE = "M74,14 L75.56,18.44 L80,20 L75.56,21.56 L74,26 L72.44,21.56 L68,20 L72.44,18.44 Z";

export function BrandLogo({ theme = "light", iconOnly = false, showTagline = true, iconSize = 28, style = {} }) {
  const isLight = theme === "light";
  const houseFill = isLight ? "var(--vm-navy)" : "var(--vm-cyan)";
  const sparkleFill = isLight ? "var(--vm-cyan)" : "var(--vm-white)";
  const dotFill = isLight ? "var(--vm-white)" : "var(--vm-navy)";
  const textColor = isLight ? "var(--vm-navy)" : "var(--vm-white)";
  const subColor = isLight ? "var(--vm-muted)" : "rgba(255,255,255,0.45)";
  const showSparkle = iconSize > 32;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: Math.round(iconSize * 0.35), ...style }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" style={{ flexShrink: 0, overflow: "visible" }} aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d={HOUSE} fill={houseFill} />
        {showSparkle && (
          <>
            <path d={SPARKLE} fill={sparkleFill} />
            <circle cx="74" cy="20" r="1.5" fill={dotFill} />
          </>
        )}
      </svg>
      {!iconOnly && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: "var(--font-heading)", fontWeight: "var(--fw-bold)",
            textTransform: "uppercase", letterSpacing: "0.04em",
            fontSize: Math.round(iconSize * 0.64), color: textColor, whiteSpace: "nowrap",
          }}>
            VelocityMaid
          </span>
          {showTagline && (
            <span style={{
              fontFamily: "var(--font-body)", fontWeight: "var(--fw-bold)",
              textTransform: "uppercase", letterSpacing: "var(--tracking-widest)",
              fontSize: Math.max(7, Math.round(iconSize * 0.26)), color: subColor, marginTop: 3, whiteSpace: "nowrap",
            }}>
              Come home to clean.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
