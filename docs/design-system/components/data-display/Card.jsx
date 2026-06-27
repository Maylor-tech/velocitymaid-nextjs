import React from "react";

/**
 * Card — the surface primitive. `elevation` picks the shadow/radius pairing:
 * flat (hairline border), raised (soft shadow), feature (pill-radius marketing card).
 */
export function Card({
  children,
  elevation = "raised",
  interactive = false,
  highlight = false,
  padding = "lg",
  className = "",
  style = {},
  ...rest
}) {
  const pads = { none: 0, sm: "var(--space-4)", md: "var(--space-6)", lg: "var(--space-8)" };
  const elevations = {
    flat: { border: "1px solid var(--border-default)", boxShadow: "none", borderRadius: "var(--radius-lg)" },
    raised: { border: "1px solid var(--border-default)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--radius-lg)" },
    feature: { border: "1px solid var(--border-default)", boxShadow: "var(--shadow-lg)", borderRadius: "var(--radius-xl)" },
  };
  const e = elevations[elevation] || elevations.raised;
  const [hover, setHover] = React.useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: "var(--color-surface)",
        padding: pads[padding] ?? pads.lg,
        ...e,
        ...(highlight ? { boxShadow: `0 0 0 2px var(--vm-cyan), ${e.boxShadow}` } : {}),
        transition: "box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard)",
        ...(hover ? { boxShadow: "var(--shadow-lg)", transform: "translateY(-2px)" } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, style = {}, ...rest }) {
  return (
    <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--fw-bold)", color: "var(--text-heading)", fontSize: "var(--text-xl)", margin: 0, ...style }} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, style = {}, ...rest }) {
  return (
    <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", marginTop: "var(--space-2)", marginBottom: 0, ...style }} {...rest}>
      {children}
    </p>
  );
}
