import React from "react";

/**
 * Switch — on/off toggle. Cyan track when on.
 */
export function Switch({ checked, defaultChecked, onChange, disabled = false, label, style = {} }) {
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on);
  };
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        role="switch" aria-checked={on} tabIndex={0} onClick={toggle}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } }}
        style={{
          width: 44, height: 26, borderRadius: "var(--radius-pill)", flexShrink: 0,
          background: on ? "var(--vm-cyan)" : "#CBD5E1", position: "relative",
          transition: "background var(--duration-fast) var(--ease-standard)",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20,
          borderRadius: "var(--radius-pill)", background: "var(--vm-white)", boxShadow: "var(--shadow-sm)",
          transition: "left var(--duration-fast) var(--ease-standard)",
        }} />
      </span>
      {label && <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
