import React from "react";

/**
 * Input — text field with the brand's calm focus ring (cyan).
 */
export function Input({ invalid = false, className = "", style = {}, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <input
      className={className}
      onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
      style={{
        width: "100%", height: 44, padding: "0 14px",
        fontFamily: "var(--font-body)", fontSize: "var(--text-base)", color: "var(--text-primary)",
        background: "var(--vm-white)", borderRadius: "var(--radius-sm)",
        border: `1px solid ${invalid ? "var(--vm-danger)" : focus ? "var(--vm-cyan)" : "var(--border-default)"}`,
        boxShadow: focus ? `0 0 0 3px ${invalid ? "rgba(192,57,43,0.15)" : "rgba(0,194,203,0.18)"}` : "none",
        outline: "none", transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
        ...style,
      }}
      {...rest}
    />
  );
}
