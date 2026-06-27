import React from "react";

/**
 * Select — native dropdown styled to match Input.
 */
export function Select({ children, invalid = false, className = "", style = {}, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <select
        className={className}
        onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
        style={{
          width: "100%", height: 44, padding: "0 38px 0 14px",
          fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--text-primary)",
          background: "var(--vm-white)", borderRadius: "var(--radius-sm)",
          border: `1px solid ${invalid ? "var(--vm-danger)" : focus ? "var(--vm-cyan)" : "var(--border-default)"}`,
          boxShadow: focus ? "0 0 0 3px rgba(0,194,203,0.18)" : "none",
          outline: "none", appearance: "none", WebkitAppearance: "none", cursor: "pointer",
          transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--vm-muted)" strokeWidth="2"
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
