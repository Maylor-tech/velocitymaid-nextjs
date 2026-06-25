import React from "react";

/**
 * Toast — transient notification. Navy surface, cyan/semantic accent bar.
 */
export function Toast({ message, title, type = "info", icon, onClose, style = {} }) {
  const accents = { info: "var(--vm-cyan)", success: "var(--vm-success)", error: "var(--vm-danger)", warning: "var(--vm-warning)" };
  const accent = accents[type] || accents.info;
  return (
    <div
      role="alert"
      style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        minWidth: 280, maxWidth: 400, padding: "14px 16px",
        background: "var(--vm-navy)", color: "var(--vm-white)",
        borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
        borderLeft: `3px solid ${accent}`, ...style,
      }}
    >
      {icon && <span style={{ color: accent, flexShrink: 0, marginTop: 1, display: "inline-flex" }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <p style={{ margin: "0 0 2px", fontFamily: "var(--font-heading)", fontWeight: "var(--fw-semibold)", fontSize: "var(--text-sm)" }}>{title}</p>}
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.85)" }}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
      )}
    </div>
  );
}
