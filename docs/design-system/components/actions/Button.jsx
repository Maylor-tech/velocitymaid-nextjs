import React from "react";

/**
 * VelocityMaid Button — the approved CTA system (lib/brand/buttons.ts).
 * Variants map to the brand's three button tokens plus quiet ghost/link.
 */
export function Button({
  children,
  variant = "navy",
  size = "md",
  fullWidth = false,
  pill = false,
  iconLeft,
  iconRight,
  disabled = false,
  type = "button",
  className = "",
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: "0 14px", height: 36, fontSize: "var(--text-xs)" },
    md: { padding: "0 20px", height: 44, fontSize: "var(--text-xs)" },
    lg: { padding: "0 32px", height: 52, fontSize: "var(--text-sm)" },
  };

  const variants = {
    navy: { background: "var(--vm-navy)", color: "var(--vm-white)", border: "1px solid var(--vm-navy)", boxShadow: "var(--shadow-md)" },
    cyan: { background: "var(--vm-cyan)", color: "var(--vm-navy)", border: "1px solid var(--vm-cyan)", boxShadow: "var(--shadow-md)" },
    navyOutline: { background: "transparent", color: "var(--vm-navy)", border: "1px solid var(--border-strong)", boxShadow: "none" },
    ghost: { background: "transparent", color: "var(--vm-navy)", border: "1px solid transparent", boxShadow: "none", textTransform: "none", letterSpacing: "0", fontWeight: "var(--fw-semibold)" },
    link: { background: "transparent", color: "var(--vm-cyan)", border: "none", boxShadow: "none", textTransform: "none", letterSpacing: "0", padding: 0, height: "auto", fontWeight: "var(--fw-semibold)" },
  };

  const v = variants[variant] || variants.navy;
  const s = sizes[size] || sizes.md;

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-heading)",
    fontWeight: "var(--fw-bold)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wide)",
    fontSize: s.fontSize,
    height: variant === "link" ? "auto" : s.height,
    padding: variant === "link" ? 0 : s.padding,
    borderRadius: pill ? "var(--radius-pill)" : "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? "100%" : "auto",
    whiteSpace: "nowrap",
    transition: "transform var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
    ...v,
    ...style,
  };

  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const hoverBg = { navy: "rgba(15,28,46,0.9)", cyan: "var(--vm-cyan-dark)", navyOutline: "transparent" }[variant];
  const composed = {
    ...base,
    ...(hover && !disabled && hoverBg ? { background: hoverBg } : {}),
    ...(hover && !disabled && variant === "navyOutline" ? { borderColor: "var(--vm-navy)" } : {}),
    ...(hover && !disabled && variant === "ghost" ? { background: "var(--vm-surface)" } : {}),
    ...(hover && !disabled && variant === "link" ? { textDecoration: "underline" } : {}),
    ...(active && !disabled && variant !== "link" ? { transform: "translateY(1px) scale(0.99)" } : {}),
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={className}
      style={composed}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
