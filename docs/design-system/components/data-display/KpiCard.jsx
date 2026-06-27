import React from "react";

/**
 * KpiCard — admin/ops metric tile. Label, large value, optional delta + icon.
 */
export function KpiCard({ label, value, subtitle, delta, icon, className = "", style = {} }) {
  const deltaColor = delta && delta.direction === "down" ? "var(--vm-danger)" : "var(--vm-success)";
  return (
    <div
      className={className}
      style={{
        background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)",
        padding: "var(--space-6)", ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" }}>{label}</p>
          <p style={{ margin: "6px 0 0", fontFamily: "var(--font-heading)", fontSize: "var(--text-3xl)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", lineHeight: 1 }}>{value}</p>
          {subtitle && <p style={{ margin: "6px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{subtitle}</p>}
          {delta && (
            <p style={{ margin: "8px 0 0", fontSize: "var(--text-xs)", fontWeight: "var(--fw-semibold)", color: deltaColor }}>
              {delta.direction === "down" ? "▾" : "▴"} {delta.value}
            </p>
          )}
        </div>
        {icon && (
          <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--vm-cyan-tint)", color: "var(--vm-cyan-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
