import React from "react";

/**
 * Badge / Tag — small status or category label. Rounded-pill, calm semantic tints.
 */
export function Badge({ children, variant = "neutral", size = "md", icon, className = "", style = {}, ...rest }) {
  const variants = {
    neutral: { background: "var(--vm-surface)", color: "var(--vm-text)", border: "1px solid var(--border-default)" },
    navy: { background: "var(--vm-navy)", color: "var(--vm-white)", border: "1px solid var(--vm-navy)" },
    cyan: { background: "var(--vm-cyan-tint)", color: "var(--vm-navy)", border: "1px solid rgba(0,194,203,0.35)" },
    cyanSolid: { background: "var(--vm-cyan)", color: "var(--vm-navy)", border: "1px solid var(--vm-cyan)" },
    success: { background: "var(--vm-success-bg)", color: "var(--vm-success)", border: "1px solid rgba(31,138,91,0.25)" },
    warning: { background: "var(--vm-warning-bg)", color: "var(--vm-warning)", border: "1px solid rgba(183,121,31,0.25)" },
    danger: { background: "var(--vm-danger-bg)", color: "var(--vm-danger)", border: "1px solid rgba(192,57,43,0.25)" },
  };
  const v = variants[variant] || variants.neutral;
  const sizes = { sm: { padding: "1px 8px", fontSize: "11px" }, md: { padding: "3px 12px", fontSize: "var(--text-xs)" } };
  const s = sizes[size] || sizes.md;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        fontFamily: "var(--font-body)", fontWeight: "var(--fw-semibold)",
        borderRadius: "var(--radius-pill)", lineHeight: 1.4,
        ...s, ...v, ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
