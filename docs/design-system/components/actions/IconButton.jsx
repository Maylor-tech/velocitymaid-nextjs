import React from "react";

/**
 * IconButton — square, icon-only control. Matches Button's tactile feel.
 */
export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  "aria-label": ariaLabel,
  disabled = false,
  className = "",
  style = {},
  ...rest
}) {
  const dims = { sm: 32, md: 40, lg: 48 }[size] || 40;
  const variants = {
    navy: { background: "var(--vm-navy)", color: "var(--vm-white)", border: "1px solid var(--vm-navy)" },
    cyan: { background: "var(--vm-cyan)", color: "var(--vm-navy)", border: "1px solid var(--vm-cyan)" },
    outline: { background: "var(--vm-white)", color: "var(--vm-navy)", border: "1px solid var(--border-default)" },
    ghost: { background: "transparent", color: "var(--vm-navy)", border: "1px solid transparent" },
  };
  const v = variants[variant] || variants.ghost;
  const [hover, setHover] = React.useState(false);
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: dims, height: dims, borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "background-color var(--duration-fast) var(--ease-standard)",
        ...v,
        ...(hover && !disabled ? { background: variant === "ghost" || variant === "outline" ? "var(--vm-surface)" : v.background, filter: variant === "navy" || variant === "cyan" ? "brightness(0.94)" : "none" } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
