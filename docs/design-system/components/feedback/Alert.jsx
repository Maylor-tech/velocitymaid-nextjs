import React from "react";

/**
 * Alert — hospitality-style inline message. Calm tints, not harsh warning yellow.
 */
export function Alert({ children, variant = "info", title, icon, className = "", style = {} }) {
  const variants = {
    info:    { bg: "var(--vm-cyan-tint)",  border: "rgba(0,194,203,0.30)", accent: "var(--vm-cyan-dark)" },
    success: { bg: "var(--vm-success-bg)", border: "rgba(31,138,91,0.25)", accent: "var(--vm-success)" },
    warning: { bg: "var(--vm-warning-bg)", border: "rgba(183,121,31,0.25)", accent: "var(--vm-warning)" },
    danger:  { bg: "var(--vm-danger-bg)",  border: "rgba(192,57,43,0.25)",  accent: "var(--vm-danger)" },
    neutral: { bg: "var(--vm-surface)",    border: "var(--border-default)", accent: "var(--vm-navy)" },
  };
  const v = variants[variant] || variants.info;
  return (
    <div
      role="status"
      className={className}
      style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        background: v.bg, border: `1px solid ${v.border}`,
        borderRadius: "var(--radius-md)", padding: "var(--space-4)", ...style,
      }}
    >
      {icon && <span style={{ color: v.accent, flexShrink: 0, marginTop: 1, display: "inline-flex" }}>{icon}</span>}
      <div style={{ minWidth: 0 }}>
        {title && <p style={{ margin: "0 0 2px", fontFamily: "var(--font-heading)", fontWeight: "var(--fw-semibold)", fontSize: "var(--text-sm)", color: "var(--text-heading)" }}>{title}</p>}
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-primary)", lineHeight: "var(--leading-relaxed)" }}>{children}</div>
      </div>
    </div>
  );
}
