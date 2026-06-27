import React from "react";

/**
 * Checkbox — cyan-filled when checked. Pass a `label` or use as a control.
 */
export function Checkbox({ checked, defaultChecked, onChange, label, disabled = false, id, style = {} }) {
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on);
  };
  return (
    <label htmlFor={id} style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        onClick={toggle}
        role="checkbox" aria-checked={on} tabIndex={0}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } }}
        style={{
          width: 20, height: 20, borderRadius: "var(--radius-sm)", flexShrink: 0,
          background: on ? "var(--vm-cyan)" : "var(--vm-white)",
          border: `1px solid ${on ? "var(--vm-cyan)" : "var(--border-default)"}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          transition: "background var(--duration-fast), border-color var(--duration-fast)",
        }}
      >
        {on && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--vm-navy)" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label && <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
