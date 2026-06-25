import React from "react";

/**
 * Tabs — underline-style segmented navigation. Active tab carries cyan underline.
 */
export function Tabs({ tabs = [], value, defaultValue, onChange, style = {} }) {
  const [internal, setInternal] = React.useState(defaultValue ?? tabs[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = (v) => { if (value === undefined) setInternal(v); onChange?.(v); };
  return (
    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border-default)", ...style }}>
      {tabs.map((t) => {
        const on = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => select(t.value)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 14px", marginBottom: -1,
              fontFamily: "var(--font-body)", fontSize: "var(--text-sm)",
              fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
              color: on ? "var(--vm-navy)" : "var(--vm-muted)",
              borderBottom: `2px solid ${on ? "var(--vm-cyan)" : "transparent"}`,
              transition: "color var(--duration-fast), border-color var(--duration-fast)",
            }}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span style={{ fontSize: "11px", fontWeight: "var(--fw-semibold)", background: on ? "var(--vm-cyan-tint)" : "var(--vm-surface)", color: on ? "var(--vm-navy)" : "var(--vm-muted)", borderRadius: "var(--radius-pill)", padding: "1px 7px" }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
