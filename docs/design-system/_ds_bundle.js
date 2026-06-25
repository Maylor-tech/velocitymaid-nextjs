/* @ds-bundle: {"format":3,"namespace":"VelocityMaidDesignSystem_2d9dc2","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"BrandLogo","sourcePath":"components/brand/BrandLogo.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"CardTitle","sourcePath":"components/data-display/Card.jsx"},{"name":"CardDescription","sourcePath":"components/data-display/Card.jsx"},{"name":"KpiCard","sourcePath":"components/data-display/KpiCard.jsx"},{"name":"StatusBadge","sourcePath":"components/data-display/StatusBadge.jsx"},{"name":"Table","sourcePath":"components/data-display/Table.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"FormRow","sourcePath":"components/forms/FormRow.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"8401083ff2be","components/actions/IconButton.jsx":"66a31d42d77b","components/brand/BrandLogo.jsx":"fed6d963044e","components/data-display/Avatar.jsx":"48c3c3af637f","components/data-display/Badge.jsx":"566745000e4d","components/data-display/Card.jsx":"f28bfc9b14c9","components/data-display/KpiCard.jsx":"f448ca0d5b1e","components/data-display/StatusBadge.jsx":"3e440b1bb93a","components/data-display/Table.jsx":"5a765fb33962","components/feedback/Alert.jsx":"424aa9238d86","components/feedback/Toast.jsx":"d3b83c946478","components/forms/Checkbox.jsx":"fc4525026740","components/forms/FormRow.jsx":"fd161b87b489","components/forms/Input.jsx":"e6a5ab14769b","components/forms/Select.jsx":"696cb5854298","components/forms/Switch.jsx":"cc8d033f11ef","components/navigation/Tabs.jsx":"d9bb4e3d8cf3","migration/phase-0-1/changed/tailwind.vm-tokens.js":"0ed594c5c5fe","ui_kits/admin/admin.jsx":"b6949c59368b","ui_kits/booking/booking.jsx":"48f84099d150","ui_kits/customer-portal/portal-screens.jsx":"cce85a590cbb","ui_kits/customer-portal/portal.jsx":"895ece51f1a1","ui_kits/icons.js":"165a0b8b3e34","ui_kits/marketing/sections.jsx":"5a5f9f967317","ui_kits/mobile/mobile.jsx":"7b83c46ebc4d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VelocityMaidDesignSystem_2d9dc2 = window.VelocityMaidDesignSystem_2d9dc2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * VelocityMaid Button — the approved CTA system (lib/brand/buttons.ts).
 * Variants map to the brand's three button tokens plus quiet ghost/link.
 */
function Button({
  children,
  variant = "navy",
  size = "md",
  fullWidth = false,
  pill = false,
  iconLeft,
  iconRight,
  disabled = false,
  type = "button",
  className = "",
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: "0 14px",
      height: 36,
      fontSize: "var(--text-xs)"
    },
    md: {
      padding: "0 20px",
      height: 44,
      fontSize: "var(--text-xs)"
    },
    lg: {
      padding: "0 32px",
      height: 52,
      fontSize: "var(--text-sm)"
    }
  };
  const variants = {
    navy: {
      background: "var(--vm-navy)",
      color: "var(--vm-white)",
      border: "1px solid var(--vm-navy)",
      boxShadow: "var(--shadow-md)"
    },
    cyan: {
      background: "var(--vm-cyan)",
      color: "var(--vm-navy)",
      border: "1px solid var(--vm-cyan)",
      boxShadow: "var(--shadow-md)"
    },
    navyOutline: {
      background: "transparent",
      color: "var(--vm-navy)",
      border: "1px solid var(--border-strong)",
      boxShadow: "none"
    },
    ghost: {
      background: "transparent",
      color: "var(--vm-navy)",
      border: "1px solid transparent",
      boxShadow: "none",
      textTransform: "none",
      letterSpacing: "0",
      fontWeight: "var(--fw-semibold)"
    },
    link: {
      background: "transparent",
      color: "var(--vm-cyan)",
      border: "none",
      boxShadow: "none",
      textTransform: "none",
      letterSpacing: "0",
      padding: 0,
      height: "auto",
      fontWeight: "var(--fw-semibold)"
    }
  };
  const v = variants[variant] || variants.navy;
  const s = sizes[size] || sizes.md;
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "var(--font-heading)",
    fontWeight: "var(--fw-bold)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wide)",
    fontSize: s.fontSize,
    height: variant === "link" ? "auto" : s.height,
    padding: variant === "link" ? 0 : s.padding,
    borderRadius: pill ? "var(--radius-pill)" : "var(--radius-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? "100%" : "auto",
    whiteSpace: "nowrap",
    transition: "transform var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
    ...v,
    ...style
  };
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const hoverBg = {
    navy: "rgba(15,28,46,0.9)",
    cyan: "var(--vm-cyan-dark)",
    navyOutline: "transparent"
  }[variant];
  const composed = {
    ...base,
    ...(hover && !disabled && hoverBg ? {
      background: hoverBg
    } : {}),
    ...(hover && !disabled && variant === "navyOutline" ? {
      borderColor: "var(--vm-navy)"
    } : {}),
    ...(hover && !disabled && variant === "ghost" ? {
      background: "var(--vm-surface)"
    } : {}),
    ...(hover && !disabled && variant === "link" ? {
      textDecoration: "underline"
    } : {}),
    ...(active && !disabled && variant !== "link" ? {
      transform: "translateY(1px) scale(0.99)"
    } : {})
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    className: className,
    style: composed,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false)
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — square, icon-only control. Matches Button's tactile feel.
 */
function IconButton({
  children,
  variant = "ghost",
  size = "md",
  "aria-label": ariaLabel,
  disabled = false,
  className = "",
  style = {},
  ...rest
}) {
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  }[size] || 40;
  const variants = {
    navy: {
      background: "var(--vm-navy)",
      color: "var(--vm-white)",
      border: "1px solid var(--vm-navy)"
    },
    cyan: {
      background: "var(--vm-cyan)",
      color: "var(--vm-navy)",
      border: "1px solid var(--vm-cyan)"
    },
    outline: {
      background: "var(--vm-white)",
      color: "var(--vm-navy)",
      border: "1px solid var(--border-default)"
    },
    ghost: {
      background: "transparent",
      color: "var(--vm-navy)",
      border: "1px solid transparent"
    }
  };
  const v = variants[variant] || variants.ghost;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": ariaLabel,
    disabled: disabled,
    className: className,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dims,
      height: dims,
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background-color var(--duration-fast) var(--ease-standard)",
      ...v,
      ...(hover && !disabled ? {
        background: variant === "ghost" || variant === "outline" ? "var(--vm-surface)" : v.background,
        filter: variant === "navy" || variant === "cyan" ? "brightness(0.94)" : "none"
      } : {}),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/brand/BrandLogo.jsx
try { (() => {
/**
 * BrandLogo — the approved VelocityMaid lockup (velocitymaid-logo-system-v1).
 * House + sparkle mark with optional wordmark and "COME HOME TO CLEAN." tagline.
 * `theme="light"` = navy mark for light backgrounds; `theme="dark"` = cyan mark
 * for navy/dark backgrounds. Sparkle is dropped at <=32px icon size per §2.3.
 * Never recolor, restretch, or substitute the mark.
 */
const HOUSE = "M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z";
const SPARKLE = "M74,14 L75.56,18.44 L80,20 L75.56,21.56 L74,26 L72.44,21.56 L68,20 L72.44,18.44 Z";
function BrandLogo({
  theme = "light",
  iconOnly = false,
  showTagline = true,
  iconSize = 28,
  style = {}
}) {
  const isLight = theme === "light";
  const houseFill = isLight ? "var(--vm-navy)" : "var(--vm-cyan)";
  const sparkleFill = isLight ? "var(--vm-cyan)" : "var(--vm-white)";
  const dotFill = isLight ? "var(--vm-white)" : "var(--vm-navy)";
  const textColor = isLight ? "var(--vm-navy)" : "var(--vm-white)";
  const subColor = isLight ? "var(--vm-muted)" : "rgba(255,255,255,0.45)";
  const showSparkle = iconSize > 32;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: Math.round(iconSize * 0.35),
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: iconSize,
    height: iconSize,
    viewBox: "0 0 100 100",
    style: {
      flexShrink: 0,
      overflow: "visible"
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: HOUSE,
    fill: houseFill
  }), showSparkle && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: SPARKLE,
    fill: sparkleFill
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "74",
    cy: "20",
    r: "1.5",
    fill: dotFill
  }))), !iconOnly && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      lineHeight: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: "var(--fw-bold)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      fontSize: Math.round(iconSize * 0.64),
      color: textColor,
      whiteSpace: "nowrap"
    }
  }, "VelocityMaid"), showTagline && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: "var(--fw-bold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-widest)",
      fontSize: Math.max(7, Math.round(iconSize * 0.26)),
      color: subColor,
      marginTop: 3,
      whiteSpace: "nowrap"
    }
  }, "Come home to clean.")));
}
Object.assign(__ds_scope, { BrandLogo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/BrandLogo.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
/**
 * Avatar — cleaner / customer identity chip. Falls back to initials on navy.
 */
function Avatar({
  name = "",
  src,
  size = "md",
  className = "",
  style = {}
}) {
  const dims = {
    sm: 32,
    md: 40,
    lg: 56
  }[size] || 40;
  const fontSize = {
    sm: "12px",
    md: "14px",
    lg: "18px"
  }[size] || "14px";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("");
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      width: dims,
      height: dims,
      borderRadius: "var(--radius-pill)",
      background: src ? "transparent" : "var(--vm-navy)",
      color: "var(--vm-white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-heading)",
      fontWeight: "var(--fw-bold)",
      fontSize,
      overflow: "hidden",
      flexShrink: 0,
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials || "?");
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge / Tag — small status or category label. Rounded-pill, calm semantic tints.
 */
function Badge({
  children,
  variant = "neutral",
  size = "md",
  icon,
  className = "",
  style = {},
  ...rest
}) {
  const variants = {
    neutral: {
      background: "var(--vm-surface)",
      color: "var(--vm-text)",
      border: "1px solid var(--border-default)"
    },
    navy: {
      background: "var(--vm-navy)",
      color: "var(--vm-white)",
      border: "1px solid var(--vm-navy)"
    },
    cyan: {
      background: "var(--vm-cyan-tint)",
      color: "var(--vm-navy)",
      border: "1px solid rgba(0,194,203,0.35)"
    },
    cyanSolid: {
      background: "var(--vm-cyan)",
      color: "var(--vm-navy)",
      border: "1px solid var(--vm-cyan)"
    },
    success: {
      background: "var(--vm-success-bg)",
      color: "var(--vm-success)",
      border: "1px solid rgba(31,138,91,0.25)"
    },
    warning: {
      background: "var(--vm-warning-bg)",
      color: "var(--vm-warning)",
      border: "1px solid rgba(183,121,31,0.25)"
    },
    danger: {
      background: "var(--vm-danger-bg)",
      color: "var(--vm-danger)",
      border: "1px solid rgba(192,57,43,0.25)"
    }
  };
  const v = variants[variant] || variants.neutral;
  const sizes = {
    sm: {
      padding: "1px 8px",
      fontSize: "11px"
    },
    md: {
      padding: "3px 12px",
      fontSize: "var(--text-xs)"
    }
  };
  const s = sizes[size] || sizes.md;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: className,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      fontFamily: "var(--font-body)",
      fontWeight: "var(--fw-semibold)",
      borderRadius: "var(--radius-pill)",
      lineHeight: 1.4,
      ...s,
      ...v,
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — the surface primitive. `elevation` picks the shadow/radius pairing:
 * flat (hairline border), raised (soft shadow), feature (pill-radius marketing card).
 */
function Card({
  children,
  elevation = "raised",
  interactive = false,
  highlight = false,
  padding = "lg",
  className = "",
  style = {},
  ...rest
}) {
  const pads = {
    none: 0,
    sm: "var(--space-4)",
    md: "var(--space-6)",
    lg: "var(--space-8)"
  };
  const elevations = {
    flat: {
      border: "1px solid var(--border-default)",
      boxShadow: "none",
      borderRadius: "var(--radius-lg)"
    },
    raised: {
      border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--radius-lg)"
    },
    feature: {
      border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-lg)",
      borderRadius: "var(--radius-xl)"
    }
  };
  const e = elevations[elevation] || elevations.raised;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className,
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: "var(--color-surface)",
      padding: pads[padding] ?? pads.lg,
      ...e,
      ...(highlight ? {
        boxShadow: `0 0 0 2px var(--vm-cyan), ${e.boxShadow}`
      } : {}),
      transition: "box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard)",
      ...(hover ? {
        boxShadow: "var(--shadow-lg)",
        transform: "translateY(-2px)"
      } : {}),
      ...style
    }
  }, rest), children);
}
function CardTitle({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("h3", _extends({
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: "var(--fw-bold)",
      color: "var(--text-heading)",
      fontSize: "var(--text-xl)",
      margin: 0,
      ...style
    }
  }, rest), children);
}
function CardDescription({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    style: {
      fontFamily: "var(--font-body)",
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-relaxed)",
      marginTop: "var(--space-2)",
      marginBottom: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card, CardTitle, CardDescription });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/KpiCard.jsx
try { (() => {
/**
 * KpiCard — admin/ops metric tile. Label, large value, optional delta + icon.
 */
function KpiCard({
  label,
  value,
  subtitle,
  delta,
  icon,
  className = "",
  style = {}
}) {
  const deltaColor = delta && delta.direction === "down" ? "var(--vm-danger)" : "var(--vm-success)";
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      background: "var(--color-surface)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-sm)",
      padding: "var(--space-6)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-muted)"
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontFamily: "var(--font-heading)",
      fontSize: "var(--text-3xl)",
      fontWeight: "var(--fw-bold)",
      color: "var(--text-heading)",
      lineHeight: 1
    }
  }, value), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, subtitle), delta && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px 0 0",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--fw-semibold)",
      color: deltaColor
    }
  }, delta.direction === "down" ? "▾" : "▴", " ", delta.value)), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: "var(--radius-md)",
      background: "var(--vm-cyan-tint)",
      color: "var(--vm-cyan-dark)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, icon)));
}
Object.assign(__ds_scope, { KpiCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/KpiCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatusBadge.jsx
try { (() => {
/**
 * StatusBadge — job lifecycle status pill. Maps the operational job statuses
 * used across customer, cleaner, and admin surfaces to calm semantic tints.
 */
const STATUS = {
  pending: {
    label: "Pending",
    bg: "var(--vm-warning-bg)",
    fg: "var(--vm-warning)"
  },
  scheduled: {
    label: "Scheduled",
    bg: "var(--vm-cyan-tint)",
    fg: "var(--vm-navy)"
  },
  assigned: {
    label: "Assigned",
    bg: "var(--vm-cyan-tint)",
    fg: "var(--vm-navy)"
  },
  in_progress: {
    label: "In Progress",
    bg: "var(--vm-progress-bg)",
    fg: "var(--vm-progress)"
  },
  completed: {
    label: "Completed",
    bg: "var(--vm-success-bg)",
    fg: "var(--vm-success)"
  },
  cancelled: {
    label: "Cancelled",
    bg: "var(--vm-danger-bg)",
    fg: "var(--vm-danger)"
  },
  reschedule_requested: {
    label: "Reschedule Requested",
    bg: "var(--vm-warning-bg)",
    fg: "var(--vm-warning)"
  },
  cancel_requested: {
    label: "Cancel Requested",
    bg: "var(--vm-danger-bg)",
    fg: "var(--vm-danger)"
  }
};
function StatusBadge({
  status = "pending",
  icon,
  className = "",
  style = {}
}) {
  const c = STATUS[String(status).toLowerCase()] || {
    label: status,
    bg: "var(--vm-surface)",
    fg: "var(--vm-text)"
  };
  return /*#__PURE__*/React.createElement("span", {
    className: className,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      fontFamily: "var(--font-body)",
      fontWeight: "var(--fw-medium)",
      fontSize: "var(--text-sm)",
      padding: "4px 12px",
      borderRadius: "var(--radius-pill)",
      background: c.bg,
      color: c.fg,
      ...style
    }
  }, icon, c.label);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Table.jsx
try { (() => {
/**
 * Table — data table for admin/ops views. Pass `columns` and `rows`.
 * Each column: { key, header, align?, width?, render?(value,row) }.
 */
function Table({
  columns = [],
  rows = [],
  zebra = false,
  onRowClick,
  getRowKey,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-default)",
      background: "var(--vm-white)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontFamily: "var(--font-body)"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || "left",
      padding: "12px 16px",
      fontFamily: "var(--font-heading)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--fw-bold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-wide)",
      color: "var(--vm-muted)",
      borderBottom: "1px solid var(--border-default)",
      whiteSpace: "nowrap",
      width: c.width
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, i) => /*#__PURE__*/React.createElement("tr", {
    key: getRowKey ? getRowKey(row, i) : i,
    onClick: onRowClick ? () => onRowClick(row) : undefined,
    style: {
      cursor: onRowClick ? "pointer" : "default",
      background: zebra && i % 2 ? "var(--vm-surface)" : "transparent",
      transition: "background var(--duration-fast)"
    },
    onMouseEnter: e => {
      if (onRowClick) e.currentTarget.style.background = "var(--vm-cyan-tint)";
    },
    onMouseLeave: e => {
      if (onRowClick) e.currentTarget.style.background = zebra && i % 2 ? "var(--vm-surface)" : "transparent";
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      textAlign: c.align || "left",
      padding: "14px 16px",
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)",
      borderBottom: i < rows.length - 1 ? "1px solid var(--border-default)" : "none"
    }
  }, c.render ? c.render(row[c.key], row) : row[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
/**
 * Alert — hospitality-style inline message. Calm tints, not harsh warning yellow.
 */
function Alert({
  children,
  variant = "info",
  title,
  icon,
  className = "",
  style = {}
}) {
  const variants = {
    info: {
      bg: "var(--vm-cyan-tint)",
      border: "rgba(0,194,203,0.30)",
      accent: "var(--vm-cyan-dark)"
    },
    success: {
      bg: "var(--vm-success-bg)",
      border: "rgba(31,138,91,0.25)",
      accent: "var(--vm-success)"
    },
    warning: {
      bg: "var(--vm-warning-bg)",
      border: "rgba(183,121,31,0.25)",
      accent: "var(--vm-warning)"
    },
    danger: {
      bg: "var(--vm-danger-bg)",
      border: "rgba(192,57,43,0.25)",
      accent: "var(--vm-danger)"
    },
    neutral: {
      bg: "var(--vm-surface)",
      border: "var(--border-default)",
      accent: "var(--vm-navy)"
    }
  };
  const v = variants[variant] || variants.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: className,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: "var(--radius-md)",
      padding: "var(--space-4)",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: v.accent,
      flexShrink: 0,
      marginTop: 1,
      display: "inline-flex"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 2px",
      fontFamily: "var(--font-heading)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--text-sm)",
      color: "var(--text-heading)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)",
      lineHeight: "var(--leading-relaxed)"
    }
  }, children)));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
/**
 * Toast — transient notification. Navy surface, cyan/semantic accent bar.
 */
function Toast({
  message,
  title,
  type = "info",
  icon,
  onClose,
  style = {}
}) {
  const accents = {
    info: "var(--vm-cyan)",
    success: "var(--vm-success)",
    error: "var(--vm-danger)",
    warning: "var(--vm-warning)"
  };
  const accent = accents[type] || accents.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      minWidth: 280,
      maxWidth: 400,
      padding: "14px 16px",
      background: "var(--vm-navy)",
      color: "var(--vm-white)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      borderLeft: `3px solid ${accent}`,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: accent,
      flexShrink: 0,
      marginTop: 1,
      display: "inline-flex"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 2px",
      fontFamily: "var(--font-heading)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--text-sm)"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: "rgba(255,255,255,0.85)"
    }
  }, message)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      background: "none",
      border: "none",
      color: "rgba(255,255,255,0.6)",
      cursor: "pointer",
      fontSize: 18,
      lineHeight: 1,
      padding: 0
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/**
 * Checkbox — cyan-filled when checked. Pass a `label` or use as a control.
 */
function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled = false,
  id,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: toggle,
    role: "checkbox",
    "aria-checked": on,
    tabIndex: 0,
    onKeyDown: e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggle();
      }
    },
    style: {
      width: 20,
      height: 20,
      borderRadius: "var(--radius-sm)",
      flexShrink: 0,
      background: on ? "var(--vm-cyan)" : "var(--vm-white)",
      border: `1px solid ${on ? "var(--vm-cyan)" : "var(--border-default)"}`,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background var(--duration-fast), border-color var(--duration-fast)"
    }
  }, on && /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--vm-navy)",
    strokeWidth: "3"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 13l4 4L19 7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/FormRow.jsx
try { (() => {
/**
 * FormRow — label + control wrapper with required marker, help text, and error.
 */
function FormRow({
  label,
  required = false,
  children,
  error,
  helpText,
  htmlFor,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-primary)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vm-danger)",
      marginLeft: 4
    }
  }, "*")), children, error ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-xs)",
      color: "var(--vm-danger)"
    }
  }, error) : helpText && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-xs)",
      color: "var(--text-muted)"
    }
  }, helpText));
}
Object.assign(__ds_scope, { FormRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FormRow.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field with the brand's calm focus ring (cyan).
 */
function Input({
  invalid = false,
  className = "",
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("input", _extends({
    className: className,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      width: "100%",
      height: 44,
      padding: "0 14px",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-base)",
      color: "var(--text-primary)",
      background: "var(--vm-white)",
      borderRadius: "var(--radius-sm)",
      border: `1px solid ${invalid ? "var(--vm-danger)" : focus ? "var(--vm-cyan)" : "var(--border-default)"}`,
      boxShadow: focus ? `0 0 0 3px ${invalid ? "rgba(192,57,43,0.15)" : "rgba(0,194,203,0.18)"}` : "none",
      outline: "none",
      transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Select — native dropdown styled to match Input.
 */
function Select({
  children,
  invalid = false,
  className = "",
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    className: className,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      width: "100%",
      height: 44,
      padding: "0 38px 0 14px",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-base)",
      color: "var(--text-primary)",
      background: "var(--vm-white)",
      borderRadius: "var(--radius-sm)",
      border: `1px solid ${invalid ? "var(--vm-danger)" : focus ? "var(--vm-cyan)" : "var(--border-default)"}`,
      boxShadow: focus ? "0 0 0 3px rgba(0,194,203,0.18)" : "none",
      outline: "none",
      appearance: "none",
      WebkitAppearance: "none",
      cursor: "pointer",
      transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
      ...style
    }
  }, rest), children), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--vm-muted)",
    strokeWidth: "2",
    style: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * Switch — on/off toggle. Cyan track when on.
 */
function Switch({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  label,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "switch",
    "aria-checked": on,
    tabIndex: 0,
    onClick: toggle,
    onKeyDown: e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggle();
      }
    },
    style: {
      width: 44,
      height: 26,
      borderRadius: "var(--radius-pill)",
      flexShrink: 0,
      background: on ? "var(--vm-cyan)" : "#CBD5E1",
      position: "relative",
      transition: "background var(--duration-fast) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: on ? 21 : 3,
      width: 20,
      height: 20,
      borderRadius: "var(--radius-pill)",
      background: "var(--vm-white)",
      boxShadow: "var(--shadow-sm)",
      transition: "left var(--duration-fast) var(--ease-standard)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-sm)",
      color: "var(--text-primary)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Tabs — underline-style segmented navigation. Active tab carries cyan underline.
 */
function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? tabs[0]?.value);
  const active = value !== undefined ? value : internal;
  const select = v => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "4px",
      borderBottom: "1px solid var(--border-default)",
      ...style
    }
  }, tabs.map(t => {
    const on = t.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      type: "button",
      onClick: () => select(t.value),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "10px 14px",
        marginBottom: -1,
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
        color: on ? "var(--vm-navy)" : "var(--vm-muted)",
        borderBottom: `2px solid ${on ? "var(--vm-cyan)" : "transparent"}`,
        transition: "color var(--duration-fast), border-color var(--duration-fast)"
      }
    }, t.icon, t.label, t.count !== undefined && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "11px",
        fontWeight: "var(--fw-semibold)",
        background: on ? "var(--vm-cyan-tint)" : "var(--vm-surface)",
        color: on ? "var(--vm-navy)" : "var(--vm-muted)",
        borderRadius: "var(--radius-pill)",
        padding: "1px 7px"
      }
    }, t.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// migration/phase-0-1/changed/tailwind.vm-tokens.js
try { (() => {
/**
 * VelocityMaid Design System — Phase 0 token foundation (Tailwind).
 *
 * MERGE this into the app's existing `tailwind.config.{js,ts}` under
 * `theme.extend`. Do NOT replace the whole config. The real config was not
 * in the read-only mount, so this is the TARGET shape — reconcile by hand.
 *
 * Goal: the `vm-*` utility classes already used across the codebase
 * (bg-vm-navy, text-vm-muted, …) should resolve to the design-system CSS
 * custom properties — making the DS the single source of truth for color.
 * Values are identical to the approved palette, so this is a NON-VISUAL change.
 *
 * Prereq: the DS tokens must be loaded at runtime so the vars exist — see
 * globals.tokens.css in this folder.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Approved brand palette — now sourced from DS CSS variables.
        "vm-navy": "var(--vm-navy)",
        // #0F1C2E
        "vm-cyan": "var(--vm-cyan)",
        // #00C2CB
        "vm-cyan-dark": "var(--vm-cyan-dark)",
        // #00A8B0
        "vm-surface": "var(--vm-surface)",
        // #F4F6F9
        "vm-text": "var(--vm-text)",
        // #1A1A2E
        "vm-muted": "var(--vm-muted)",
        // #6B7280
        "vm-white": "var(--vm-white)",
        // #FFFFFF
        "vm-border": "var(--vm-border)" // #E2E8F0
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "ui-sans-serif", "sans-serif"],
        body: ["var(--font-body)", "Inter", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "ui-sans-serif", "sans-serif"]
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        // 6px — buttons/inputs
        md: "var(--radius-md)",
        // 8px — cards
        lg: "var(--radius-lg)",
        // 12px — tiles
        xl: "var(--radius-xl)" // 16px — feature/pricing cards
      },
      maxWidth: {
        marketing: "var(--container-marketing)" // 1200px
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      }
    }
  }

  /**
   * @deprecated — DELETE in Phase 5. Kept defined elsewhere in the real config
   * so the still-live forest/gold components (CalmAlert, BrandPhotoPlaceholder,
   * CareChecklist, …) keep building until Phases 2–4 migrate them. Do NOT add
   * new usages. Tracked: brand-forest, brand-gold, brand-gold-hover,
   * brand-ivory, brand-slate, primary-*.
   */
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "migration/phase-0-1/changed/tailwind.vm-tokens.js", error: String((e && e.message) || e) }); }

// ui_kits/admin/admin.jsx
try { (() => {
/* VelocityMaid — Admin / Operations dashboard (UI kit). */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const {
  Button,
  BrandLogo,
  Card,
  CardTitle,
  KpiCard,
  Table,
  StatusBadge,
  Avatar,
  Badge,
  Tabs
} = VM;
const ic = (name, color, size = 18) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: name === "star" ? color : "none",
  stroke: color,
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    flexShrink: 0,
    display: "inline-block",
    verticalAlign: "middle"
  },
  dangerouslySetInnerHTML: {
    __html: window.VM_ICON_PATHS && window.VM_ICON_PATHS[name] || ""
  }
});
const NAV = [["layout-dashboard", "Dashboard", true], ["calendar", "Jobs", false], ["users", "Cleaners", false], ["map-pin", "Branches", false], ["dollar-sign", "Finance", false], ["settings", "Settings", false]];
const JOBS = [{
  id: "VM-2041",
  customer: "Sarah Mitchell",
  service: "Deep clean",
  cleaner: "Mike Rivera",
  branch: "Newark, NJ",
  status: "scheduled",
  total: "$220"
}, {
  id: "VM-2052",
  customer: "James Okonkwo",
  service: "STR turnover",
  cleaner: "Ana Lopez",
  branch: "Ludlow, VT",
  status: "in_progress",
  total: "$225"
}, {
  id: "VM-2033",
  customer: "Priya Shah",
  service: "Standard clean",
  cleaner: "Devon King",
  branch: "Jersey City, NJ",
  status: "assigned",
  total: "$120"
}, {
  id: "VM-2018",
  customer: "Marcus Bell",
  service: "Move-out clean",
  cleaner: "Unassigned",
  branch: "Newark, NJ",
  status: "pending",
  total: "$320"
}, {
  id: "VM-1990",
  customer: "Elena Torres",
  service: "Deep clean",
  cleaner: "Mike Rivera",
  branch: "Middlebury, VT",
  status: "completed",
  total: "$220"
}];
function Sidebar() {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 232,
      background: "var(--vm-navy)",
      minHeight: "100vh",
      padding: "20px 14px",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 10px 22px"
    }
  }, /*#__PURE__*/React.createElement(BrandLogo, {
    theme: "dark",
    iconSize: 24,
    showTagline: false
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, NAV.map(([icon, label, active]) => /*#__PURE__*/React.createElement("a", {
    key: label,
    href: "#",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "10px 12px",
      borderRadius: "var(--radius-sm)",
      textDecoration: "none",
      fontFamily: "var(--font-body)",
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      color: active ? "var(--vm-navy)" : "rgba(255,255,255,0.7)",
      background: active ? "var(--vm-cyan)" : "transparent"
    }
  }, ic(icon, active ? "var(--vm-navy)" : "rgba(255,255,255,0.7)", 18), label))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      padding: "14px",
      background: "rgba(255,255,255,0.06)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 12.5,
      color: "rgba(255,255,255,0.7)",
      margin: 0,
      lineHeight: 1.5
    }
  }, "3 jobs need a specialist assigned."), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 12.5,
      color: "var(--vm-cyan)",
      fontWeight: 600
    }
  }, "Assign now \u2192")));
}
function AdminApp() {
  const [tab, setTab] = React.useState("all");
  const rows = tab === "all" ? JOBS : JOBS.filter(j => tab === "needs" ? j.cleaner === "Unassigned" : j.status === tab);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      minHeight: "100vh",
      background: "var(--vm-surface)"
    }
  }, /*#__PURE__*/React.createElement(Sidebar, null), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      background: "var(--vm-white)",
      borderBottom: "1px solid var(--border-default)",
      padding: "16px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 20,
      color: "var(--vm-navy)",
      margin: 0
    }
  }, "Operations Dashboard"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 13,
      color: "var(--vm-muted)",
      margin: "3px 0 0"
    }
  }, "Tuesday, June 24 \xB7 NJ & Vermont")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "navyOutline",
    size: "sm",
    iconLeft: ic("download", "var(--vm-navy)", 16)
  }, "Export"), /*#__PURE__*/React.createElement(Button, {
    variant: "navy",
    size: "sm",
    iconLeft: ic("plus", "var(--vm-white)", 16)
  }, "New job"), /*#__PURE__*/React.createElement(Avatar, {
    name: "Admin User",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 18,
      marginBottom: 26
    }
  }, /*#__PURE__*/React.createElement(KpiCard, {
    label: "Jobs this week",
    value: "128",
    delta: {
      value: "12% vs last",
      direction: "up"
    },
    icon: ic("calendar", "var(--vm-cyan-dark)", 20)
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Revenue (wk)",
    value: "$24.6k",
    delta: {
      value: "8% vs last",
      direction: "up"
    },
    icon: ic("dollar-sign", "var(--vm-cyan-dark)", 20)
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Active cleaners",
    value: "34",
    subtitle: "6 onboarding",
    icon: ic("users", "var(--vm-cyan-dark)", 20)
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Avg. rating",
    value: "4.9",
    delta: {
      value: "0.1 vs last",
      direction: "up"
    },
    icon: ic("star", "var(--vm-cyan-dark)", 20)
  })), /*#__PURE__*/React.createElement(Card, {
    elevation: "raised",
    padding: "none",
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 20px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(CardTitle, {
    style: {
      fontSize: 17
    }
  }, "Recent jobs"), /*#__PURE__*/React.createElement(Badge, {
    variant: "cyan"
  }, JOBS.length, " this view")), /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: "all",
      label: "All"
    }, {
      value: "pending",
      label: "Pending"
    }, {
      value: "in_progress",
      label: "In progress"
    }, {
      value: "needs",
      label: "Needs assignment"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20
    }
  }, /*#__PURE__*/React.createElement(Table, {
    onRowClick: () => {},
    columns: [{
      key: "id",
      header: "Job"
    }, {
      key: "customer",
      header: "Customer"
    }, {
      key: "service",
      header: "Service"
    }, {
      key: "cleaner",
      header: "Specialist",
      render: v => v === "Unassigned" ? /*#__PURE__*/React.createElement(Badge, {
        variant: "warning"
      }, "Unassigned") : /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: v,
        size: "sm"
      }), v)
    }, {
      key: "branch",
      header: "Branch"
    }, {
      key: "status",
      header: "Status",
      render: v => /*#__PURE__*/React.createElement(StatusBadge, {
        status: v
      })
    }, {
      key: "total",
      header: "Total",
      align: "right"
    }],
    rows: rows,
    getRowKey: r => r.id
  }))))));
}
Object.assign(window, {
  AdminApp
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/admin.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking/booking.jsx
try { (() => {
/* VelocityMaid — Booking wizard (UI kit). */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const {
  Button,
  BrandLogo,
  Card,
  Badge,
  Input,
  Select,
  FormRow,
  Checkbox
} = VM;
const ic = (name, color, size = 22) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: name === "star" ? color : "none",
  stroke: color,
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    flexShrink: 0,
    display: "inline-block",
    verticalAlign: "middle"
  },
  dangerouslySetInnerHTML: {
    __html: window.VM_ICON_PATHS && window.VM_ICON_PATHS[name] || ""
  }
});
const STEPS = ["Service", "Home", "Schedule", "Confirm"];
function Stepper({
  step
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 0,
      marginBottom: 36
    }
  }, STEPS.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 14,
      background: i <= step ? "var(--vm-cyan)" : "var(--vm-surface)",
      color: i <= step ? "var(--vm-navy)" : "var(--vm-muted)",
      border: i <= step ? "none" : "1px solid var(--border-default)"
    }
  }, i < step ? "✓" : i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: i === step ? 600 : 500,
      fontSize: 14,
      color: i === step ? "var(--vm-navy)" : "var(--vm-muted)"
    }
  }, s)), i < STEPS.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 2,
      background: i < step ? "var(--vm-cyan)" : "var(--border-default)",
      margin: "0 14px"
    }
  }))));
}
function OptionCard({
  selected,
  onClick,
  icon,
  title,
  desc,
  price
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      textAlign: "left",
      cursor: "pointer",
      padding: 20,
      borderRadius: "var(--radius-md)",
      background: selected ? "var(--vm-cyan-tint)" : "var(--vm-white)",
      border: selected ? "2px solid var(--vm-cyan)" : "1px solid var(--border-default)",
      boxShadow: selected ? "var(--shadow-md)" : "none",
      transition: "all 150ms"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, ic(icon, selected ? "var(--vm-cyan-dark)" : "var(--vm-muted)", 24), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 600,
      fontSize: 16,
      color: "var(--vm-navy)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 13,
      color: "var(--vm-muted)",
      marginTop: 2
    }
  }, desc))), price && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      color: "var(--vm-navy)"
    }
  }, price)));
}
function BookingApp() {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    service: "Deep clean",
    price: 220,
    beds: "3",
    baths: "2",
    date: "",
    time: "9:00 AM",
    name: "",
    email: "",
    recurring: false
  });
  const up = p => setData(d => ({
    ...d,
    ...p
  }));
  const services = [{
    id: "Standard clean",
    icon: "sparkles",
    desc: "Regular maintenance",
    price: 120
  }, {
    id: "Deep clean",
    icon: "home",
    desc: "Top-to-bottom reset",
    price: 220
  }, {
    id: "Move in / out",
    icon: "truck",
    desc: "Full property reset",
    price: 320
  }, {
    id: "STR turnover",
    icon: "bed-double",
    desc: "Between-guest reset",
    price: 225
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--vm-surface)"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      background: "var(--vm-navy)",
      padding: "14px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(BrandLogo, {
    theme: "dark",
    iconSize: 26,
    showTagline: false
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: "0 auto",
      padding: "40px 24px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 30,
      color: "var(--vm-navy)",
      margin: "0 0 6px"
    }
  }, "Book your clean"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      color: "var(--vm-muted)",
      margin: "0 0 30px"
    }
  }, "Takes about two minutes \u2014 no account required."), /*#__PURE__*/React.createElement(Card, {
    elevation: "feature",
    padding: "lg"
  }, /*#__PURE__*/React.createElement(Stepper, {
    step: step
  }), step === 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 20,
      color: "var(--vm-navy)",
      margin: "0 0 16px"
    }
  }, "Select your service"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, services.map(s => /*#__PURE__*/React.createElement(OptionCard, {
    key: s.id,
    selected: data.service === s.id,
    onClick: () => up({
      service: s.id,
      price: s.price
    }),
    icon: s.icon,
    title: s.id,
    desc: s.desc,
    price: `$${s.price}`
  })))), step === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 20,
      color: "var(--vm-navy)",
      margin: "0 0 16px"
    }
  }, "Tell us about your home"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Bedrooms",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    value: data.beds,
    onChange: e => up({
      beds: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "1"), /*#__PURE__*/React.createElement("option", null, "2"), /*#__PURE__*/React.createElement("option", null, "3"), /*#__PURE__*/React.createElement("option", null, "4"), /*#__PURE__*/React.createElement("option", null, "5+"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Bathrooms",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    value: data.baths,
    onChange: e => up({
      baths: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "1"), /*#__PURE__*/React.createElement("option", null, "2"), /*#__PURE__*/React.createElement("option", null, "3"), /*#__PURE__*/React.createElement("option", null, "4+"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Street address",
    required: true,
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "123 Maple St"
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "City"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Newark"
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "ZIP"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "07102"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "This is a short-term rental (Airbnb / VRBO)"
  }))), step === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 20,
      color: "var(--vm-navy)",
      margin: "0 0 16px"
    }
  }, "Pick a date & time"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Preferred date",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "date",
    value: data.date,
    onChange: e => up({
      date: e.target.value
    })
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Arrival window",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    value: data.time,
    onChange: e => up({
      time: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "9:00 AM"), /*#__PURE__*/React.createElement("option", null, "11:00 AM"), /*#__PURE__*/React.createElement("option", null, "1:00 PM"), /*#__PURE__*/React.createElement("option", null, "3:00 PM")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Make this a recurring weekly clean (save 10%)",
    checked: data.recurring,
    onChange: v => up({
      recurring: v
    })
  }))), step === 3 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 20,
      color: "var(--vm-navy)",
      margin: "0 0 16px"
    }
  }, "Review & confirm"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(FormRow, {
    label: "Full name",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    value: data.name,
    onChange: e => up({
      name: e.target.value
    }),
    placeholder: "Jordan Avery"
  })), /*#__PURE__*/React.createElement(FormRow, {
    label: "Email",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    value: data.email,
    onChange: e => up({
      email: e.target.value
    }),
    placeholder: "you@home.com"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--vm-surface)",
      borderRadius: "var(--radius-md)",
      padding: 20
    }
  }, [["Service", data.service], ["Home", `${data.beds} bed · ${data.baths} bath`], ["Schedule", data.date ? `${data.date} · ${data.time}` : `Soonest · ${data.time}`], ["Recurring", data.recurring ? "Weekly (−10%)" : "One-time"]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      fontFamily: "var(--font-body)",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vm-muted)"
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vm-navy)",
      fontWeight: 500
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      borderTop: "1px solid var(--border-default)",
      marginTop: 8,
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      color: "var(--vm-navy)"
    }
  }, "Estimated total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 22,
      color: "var(--vm-cyan-dark)"
    }
  }, "$", data.recurring ? Math.round(data.price * 0.9) : data.price)))), step === 4 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "20px 0 10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: "var(--vm-success-bg)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18
    }
  }, ic("check", "var(--vm-success)", 32)), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 24,
      color: "var(--vm-navy)",
      margin: 0
    }
  }, "You're booked!"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      color: "var(--vm-muted)",
      marginTop: 10
    }
  }, "A confirmation is on its way", data.email ? ` to ${data.email}` : "", ". We'll text you when your specialist is on the way."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "navyOutline",
    pill: true,
    onClick: () => {
      setStep(0);
    }
  }, "Book another"))), step < 4 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => setStep(s => Math.max(0, s - 1)),
    disabled: step === 0
  }, "Back"), /*#__PURE__*/React.createElement(Button, {
    variant: "navy",
    onClick: () => setStep(s => s + 1)
  }, step === 3 ? "Confirm booking" : "Continue")))));
}
Object.assign(window, {
  BookingApp
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking/booking.jsx", error: String((e && e.message) || e) }); }

// ui_kits/customer-portal/portal-screens.jsx
try { (() => {
/* VelocityMaid — Customer Portal: deeper screens.
 * PaymentBalanceCard, PaymentsScreen, ProfileScreen, TipFlow. */
(function () {
  const VMs = window.VelocityMaidDesignSystem_2d9dc2;
  const {
    Button,
    Card,
    CardTitle,
    CardDescription,
    Badge,
    StatusBadge,
    Avatar,
    Alert,
    Input,
    Select,
    FormRow,
    Switch,
    Table
  } = VMs;
  const sic = (name, color, size = 18) => /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: name === "star" ? color : "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0,
      display: "inline-block",
      verticalAlign: "middle"
    },
    dangerouslySetInnerHTML: {
      __html: window.VM_ICON_PATHS && window.VM_ICON_PATHS[name] || ""
    }
  });

  /* ---------------- Payment balance card (reusable) ---------------- */
  function PaymentBalanceCard({
    job,
    onPay,
    paid
  }) {
    const lines = job.lines || [["Service", job.total]];
    return /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16
      }
    }, "Payment"), paid ? /*#__PURE__*/React.createElement(Badge, {
      variant: "success",
      icon: sic("check", "currentColor", 13)
    }, "Paid in full") : /*#__PURE__*/React.createElement(Badge, {
      variant: "warning"
    }, "Balance due")), lines.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        color: "var(--vm-muted)"
      }
    }, /*#__PURE__*/React.createElement("span", null, k), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--vm-navy)"
      }
    }, v))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        borderTop: "1px solid var(--border-default)",
        marginTop: 8,
        paddingTop: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: 14,
        color: "var(--vm-muted)"
      }
    }, paid ? "Paid" : "Balance due"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 22,
        color: paid ? "var(--vm-success)" : "var(--vm-navy)"
      }
    }, paid ? "$0.00" : job.balance || job.total)), !paid && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)"
      }
    }, sic("credit-card", "var(--vm-muted)", 18), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: 14,
        color: "var(--vm-text)"
      }
    }, "Visa ending 4242"), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontSize: 12.5,
        color: "var(--vm-cyan-dark)",
        fontWeight: 600,
        cursor: "pointer"
      }
    }, "Change")), /*#__PURE__*/React.createElement(Button, {
      variant: "navy",
      fullWidth: true,
      onClick: onPay
    }, "Pay ", job.balance || job.total), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: 12,
        color: "var(--vm-muted)",
        textAlign: "center"
      }
    }, "Securely processed. A receipt is emailed on payment.")));
  }

  /* ---------------- Payments screen ---------------- */
  function PaymentsScreen() {
    const invoices = [{
      id: "INV-2052",
      date: "Jun 30",
      service: "Standard clean",
      amount: "$120.00",
      status: "pending"
    }, {
      id: "INV-1990",
      date: "Jun 12",
      service: "Deep clean",
      amount: "$220.00",
      status: "completed"
    }, {
      id: "INV-1944",
      date: "Jun 5",
      service: "Standard clean",
      amount: "$120.00",
      status: "completed"
    }, {
      id: "INV-1900",
      date: "May 28",
      service: "Move-out clean",
      amount: "$320.00",
      status: "cancelled"
    }];
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 26,
        color: "var(--vm-navy)",
        margin: "0 0 6px"
      }
    }, "Payments"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-body)",
        color: "var(--vm-muted)",
        margin: "0 0 24px"
      }
    }, "Balances, receipts, and payment methods."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: 20,
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 18
      }
    }, /*#__PURE__*/React.createElement(Alert, {
      variant: "warning",
      title: "One balance due",
      icon: sic("alert-circle", "currentColor", 16)
    }, "Your Jun 30 standard clean has a ", /*#__PURE__*/React.createElement("strong", null, "$120.00"), " balance. It will auto-charge your Visa \xB74242 on the service date."), /*#__PURE__*/React.createElement(Card, {
      elevation: "raised",
      padding: "none",
      style: {
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "16px 20px 4px"
      }
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16
      }
    }, "Billing history")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 16px 16px"
      }
    }, /*#__PURE__*/React.createElement(Table, {
      columns: [{
        key: "id",
        header: "Invoice"
      }, {
        key: "date",
        header: "Date"
      }, {
        key: "service",
        header: "Service"
      }, {
        key: "status",
        header: "Status",
        render: v => /*#__PURE__*/React.createElement(StatusBadge, {
          status: v
        })
      }, {
        key: "amount",
        header: "Amount",
        align: "right"
      }],
      rows: invoices,
      getRowKey: r => r.id
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16,
        marginBottom: 4
      }
    }, "Payment methods"), /*#__PURE__*/React.createElement(CardDescription, {
      style: {
        marginBottom: 14
      }
    }, "Used for bookings and balances."), [["Visa", "4242", true], ["Mastercard", "8810", false]].map(([brand, last, dflt]) => /*#__PURE__*/React.createElement("div", {
      key: last,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderTop: "1px solid var(--border-default)"
      }
    }, sic("credit-card", "var(--vm-navy)", 20), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--vm-navy)"
      }
    }, brand, " \xB7", last), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--vm-muted)"
      }
    }, "Expires 08/27")), dflt && /*#__PURE__*/React.createElement(Badge, {
      variant: "cyan"
    }, "Default"))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "navyOutline",
      size: "sm",
      fullWidth: true,
      iconLeft: sic("plus", "var(--vm-navy)", 16)
    }, "Add card"))), /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16,
        marginBottom: 4
      }
    }, "Auto-pay"), /*#__PURE__*/React.createElement(CardDescription, {
      style: {
        marginBottom: 12
      }
    }, "Charge the default card when a clean completes."), /*#__PURE__*/React.createElement(Switch, {
      label: "Auto-pay enabled",
      defaultChecked: true
    })))));
  }

  /* ---------------- Tip / thank-you QR flow ---------------- */
  function FauxQR({
    size = 132,
    fg = "var(--vm-navy)"
  }) {
    // Deterministic faux-QR matrix (placeholder for a real generated code).
    const N = 21;
    const cells = [];
    const finder = (r, c) => r < 7 && c < 7 || r < 7 && c >= N - 7 || r >= N - 7 && c < 7;
    const inFinder = (r, c) => {
      const local = (rr, cc) => rr === 0 || rr === 6 || cc === 0 || cc === 6 || rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
      if (r < 7 && c < 7) return local(r, c);
      if (r < 7 && c >= N - 7) return local(r, c - (N - 7));
      if (r >= N - 7 && c < 7) return local(r - (N - 7), c);
      return false;
    };
    let seed = 7;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      seed = seed * 1103515245 + 12345 & 0x7fffffff;
      const on = finder(r, c) ? inFinder(r, c) : seed % 100 > 55;
      if (on) cells.push(/*#__PURE__*/React.createElement("rect", {
        key: r + "-" + c,
        x: c,
        y: r,
        width: "1",
        height: "1",
        fill: fg
      }));
    }
    return /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: `-1 -1 ${N + 2} ${N + 2}`,
      style: {
        background: "#fff",
        borderRadius: 10,
        padding: 6
      }
    }, cells);
  }
  function TipFlow({
    cleaner = "Mike Rivera",
    onClose
  }) {
    const [stage, setStage] = React.useState("amount"); // amount → method → done
    const [amount, setAmount] = React.useState(10);
    const [custom, setCustom] = React.useState("");
    const presets = [5, 10, 15, 20];
    const value = custom ? Number(custom) || 0 : amount;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 460,
        margin: "0 auto"
      }
    }, /*#__PURE__*/React.createElement(Card, {
      elevation: "feature"
    }, stage !== "done" && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: cleaner,
      size: "lg",
      style: {
        margin: "0 auto 12px"
      }
    }), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 22,
        color: "var(--vm-navy)",
        margin: 0
      }
    }, "Say thanks to ", cleaner.split(" ")[0]), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-body)",
        color: "var(--vm-muted)",
        margin: "6px 0 0",
        fontSize: 14
      }
    }, "100% of your tip goes directly to your specialist.")), stage === "amount" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 10,
        marginBottom: 14
      }
    }, presets.map(p => /*#__PURE__*/React.createElement("button", {
      key: p,
      onClick: () => {
        setAmount(p);
        setCustom("");
      },
      style: {
        cursor: "pointer",
        padding: "14px 0",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 18,
        background: !custom && amount === p ? "var(--vm-cyan-tint)" : "var(--vm-white)",
        border: !custom && amount === p ? "2px solid var(--vm-cyan)" : "1px solid var(--border-default)",
        color: "var(--vm-navy)"
      }
    }, "$", p))), /*#__PURE__*/React.createElement(FormRow, {
      label: "Custom amount"
    }, /*#__PURE__*/React.createElement(Input, {
      type: "number",
      placeholder: "Enter amount",
      value: custom,
      onChange: e => setCustom(e.target.value)
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "navy",
      fullWidth: true,
      disabled: value <= 0,
      onClick: () => setStage("method")
    }, "Continue \xB7 $", value)), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      style: {
        width: "100%",
        marginTop: 10,
        background: "none",
        border: "none",
        color: "var(--vm-muted)",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        cursor: "pointer"
      }
    }, "Maybe later")), stage === "method" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--vm-surface)",
        borderRadius: "var(--radius-md)",
        padding: 18,
        textAlign: "center",
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-heading)",
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        fontSize: 11,
        color: "var(--vm-muted)",
        margin: "0 0 12px"
      }
    }, "Scan to tip $", value), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement(FauxQR, null)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: 12.5,
        color: "var(--vm-muted)",
        margin: "12px 0 0"
      }
    }, "Open your camera, or pay with a saved card below.")), /*#__PURE__*/React.createElement(Button, {
      variant: "cyan",
      fullWidth: true,
      pill: true,
      onClick: () => setStage("done")
    }, "Tip $", value, " with Visa \xB74242"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setStage("amount"),
      style: {
        width: "100%",
        marginTop: 10,
        background: "none",
        border: "none",
        color: "var(--vm-muted)",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        cursor: "pointer"
      }
    }, "Back")), stage === "done" && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        padding: "10px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "var(--vm-success-bg)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16
      }
    }, sic("check", "var(--vm-success)", 32)), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 24,
        color: "var(--vm-navy)",
        margin: 0
      }
    }, "Thank you!"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-body)",
        color: "var(--vm-muted)",
        marginTop: 10
      }
    }, "Your $", value, " tip is on its way to ", cleaner, ". They'll be delighted."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        justifyContent: "center",
        margin: "16px 0"
      }
    }, [0, 1, 2, 3, 4].map(i => sic("star", "#F5B301", 20))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "navyOutline",
      pill: true,
      onClick: onClose
    }, "Done")))));
  }

  /* ---------------- Profile screen ---------------- */
  function ProfileScreen() {
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 26,
        color: "var(--vm-navy)",
        margin: "0 0 6px"
      }
    }, "Profile"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-body)",
        color: "var(--vm-muted)",
        margin: "0 0 24px"
      }
    }, "Your details, homes, and preferences."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 20,
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 18
      }
    }, /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Jordan Avery",
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 18,
        color: "var(--vm-navy)"
      }
    }, "Jordan Avery"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--vm-muted)",
        marginTop: 2
      }
    }, "Member since 2024 \xB7 Newark, NJ")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: "auto"
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      variant: "cyan",
      icon: sic("star", "var(--vm-cyan-dark)", 13)
    }, "VIP host"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(FormRow, {
      label: "Full name"
    }, /*#__PURE__*/React.createElement(Input, {
      defaultValue: "Jordan Avery"
    })), /*#__PURE__*/React.createElement(FormRow, {
      label: "Phone"
    }, /*#__PURE__*/React.createElement(Input, {
      type: "tel",
      defaultValue: "(973) 555-0142"
    })), /*#__PURE__*/React.createElement(FormRow, {
      label: "Email",
      style: {
        gridColumn: "1 / -1"
      }
    }, /*#__PURE__*/React.createElement(Input, {
      type: "email",
      defaultValue: "jordan@home.com"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18,
        display: "flex",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "navy",
      size: "sm"
    }, "Save changes"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm"
    }, "Cancel"))), /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16
      }
    }, "Saved homes"), /*#__PURE__*/React.createElement(Button, {
      variant: "link",
      iconLeft: sic("plus", "var(--vm-cyan-dark)", 15)
    }, "Add home")), [["Home", "412 Maple St, Newark NJ 07102", "3 bed · 2 bath", true], ["Rental", "9 Birch Ave, Jersey City NJ", "STR · 2 bed", false]].map(([label, addr, meta, dflt]) => /*#__PURE__*/React.createElement("div", {
      key: addr,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderTop: "1px solid var(--border-default)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 10,
        background: "var(--vm-cyan-tint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, sic("map-pin", "var(--vm-cyan-dark)", 18)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 14,
        color: "var(--vm-navy)"
      }
    }, label, " \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 400,
        color: "var(--vm-muted)"
      }
    }, meta)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--vm-muted)",
        marginTop: 2
      }
    }, addr)), dflt && /*#__PURE__*/React.createElement(Badge, {
      variant: "neutral"
    }, "Primary"))))), /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16,
        marginBottom: 14
      }
    }, "Notifications"), [["Booking confirmations", true], ["Specialist on the way (SMS)", true], ["Photo report ready", true], ["Promotions & offers", false]].map(([label, on]) => /*#__PURE__*/React.createElement("div", {
      key: label,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderTop: "1px solid var(--border-default)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: 14,
        color: "var(--vm-text)"
      }
    }, label), /*#__PURE__*/React.createElement(Switch, {
      defaultChecked: on
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16,
        paddingTop: 14,
        borderTop: "1px solid var(--border-default)"
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        color: "var(--vm-danger)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        cursor: "pointer",
        padding: 0
      }
    }, sic("log-out", "var(--vm-danger)", 16), " Sign out")))));
  }
  Object.assign(window, {
    PaymentBalanceCard,
    PaymentsScreen,
    TipFlow,
    ProfileScreen,
    FauxQR
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/customer-portal/portal-screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/customer-portal/portal.jsx
try { (() => {
/* VelocityMaid — Customer Portal shell + bookings + job detail (UI kit). */
(function () {
  const VM = window.VelocityMaidDesignSystem_2d9dc2;
  const {
    Button,
    BrandLogo,
    Card,
    CardTitle,
    Badge,
    StatusBadge,
    Avatar,
    Tabs,
    Alert
  } = VM;
  const {
    PaymentBalanceCard,
    PaymentsScreen,
    TipFlow,
    ProfileScreen
  } = window;
  const ic = (name, color, size = 18) => /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: name === "star" ? color : "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0,
      display: "inline-block",
      verticalAlign: "middle"
    },
    dangerouslySetInnerHTML: {
      __html: window.VM_ICON_PATHS && window.VM_ICON_PATHS[name] || ""
    }
  });
  const JOBS = {
    upcoming: [{
      id: "VM-2041",
      service: "Deep clean",
      date: "Thu, Jun 26 · 9:00 AM",
      cleaner: "Mike Rivera",
      status: "scheduled",
      total: "$220",
      balance: "$220.00",
      address: "412 Maple St, Newark NJ",
      lines: [["Deep clean · 3 bed", "$200.00"], ["Inside oven & fridge", "$20.00"]]
    }, {
      id: "VM-2052",
      service: "Standard clean",
      date: "Mon, Jun 30 · 1:00 PM",
      cleaner: "Ana Lopez",
      status: "assigned",
      total: "$120",
      balance: "$120.00",
      address: "412 Maple St, Newark NJ",
      lines: [["Standard clean · 3 bed", "$120.00"]]
    }],
    past: [{
      id: "VM-1990",
      service: "Deep clean",
      date: "Jun 12 · 9:00 AM",
      cleaner: "Mike Rivera",
      status: "completed",
      total: "$220",
      paid: true,
      tipped: false,
      address: "412 Maple St, Newark NJ",
      lines: [["Deep clean · 3 bed", "$220.00"]]
    }, {
      id: "VM-1944",
      service: "Standard clean",
      date: "Jun 5 · 10:30 AM",
      cleaner: "Devon King",
      status: "completed",
      total: "$120",
      paid: true,
      tipped: true,
      address: "412 Maple St, Newark NJ",
      lines: [["Standard clean · 3 bed", "$120.00"]]
    }, {
      id: "VM-1900",
      service: "Move-out clean",
      date: "May 28 · 9:00 AM",
      cleaner: "Ana Lopez",
      status: "cancelled",
      total: "$320",
      paid: false,
      address: "9 Birch Ave, Jersey City NJ",
      lines: [["Move-out clean", "$320.00"]]
    }]
  };
  function JobRow({
    job,
    onClick
  }) {
    const balanceDue = job.status === "scheduled" || job.status === "assigned";
    const canTip = job.status === "completed" && !job.tipped;
    return /*#__PURE__*/React.createElement("button", {
      onClick: () => onClick(job),
      style: {
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: "var(--vm-white)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        transition: "box-shadow 150ms, transform 150ms"
      },
      onMouseEnter: e => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      },
      onMouseLeave: e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "var(--vm-cyan-tint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, ic("home", "var(--vm-cyan-dark)", 22)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        color: "var(--vm-navy)",
        fontSize: 16
      }
    }, job.service), /*#__PURE__*/React.createElement(StatusBadge, {
      status: job.status
    }), job.tipped && /*#__PURE__*/React.createElement(Badge, {
      variant: "cyan",
      icon: ic("star", "var(--vm-cyan-dark)", 12)
    }, "Tipped")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 5,
        fontFamily: "var(--font-body)",
        fontSize: 13.5,
        color: "var(--vm-muted)"
      }
    }, ic("calendar", "var(--vm-muted)", 14), job.date, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--border-default)"
      }
    }, "\xB7"), job.cleaner))), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        color: "var(--vm-navy)"
      }
    }, job.total), balanceDue ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--vm-warning)",
        fontWeight: 600,
        marginTop: 4
      }
    }, "Balance due") : canTip ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--vm-cyan-dark)",
        fontWeight: 600,
        marginTop: 4
      }
    }, "Leave a tip \u2192") : /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: 12.5,
        color: "var(--vm-muted)",
        marginTop: 4
      }
    }, job.id)));
  }
  function JobDetail({
    job,
    onBack,
    onTip
  }) {
    const upcoming = job.status === "scheduled" || job.status === "assigned";
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
      onClick: onBack,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--vm-muted)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        padding: 0,
        marginBottom: 18
      }
    }, ic("arrow-left", "var(--vm-muted)", 16), " Back to bookings"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 26,
        color: "var(--vm-navy)",
        margin: 0
      }
    }, job.service), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-body)",
        color: "var(--vm-muted)",
        margin: "6px 0 0"
      }
    }, job.id, " \xB7 ", job.date)), /*#__PURE__*/React.createElement(StatusBadge, {
      status: job.status,
      icon: ic("clock", "currentColor", 14)
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: 20,
        alignItems: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16,
        marginBottom: 14
      }
    }, "Service details"), [["Address", job.address], ["Arrival window", job.date], ["Plan", job.service], ["Booking", job.id]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border-default)",
        fontFamily: "var(--font-body)",
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--vm-muted)"
      }
    }, k), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--vm-navy)",
        fontWeight: 500
      }
    }, v))), job.status === "completed" && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(Alert, {
      variant: "success",
      icon: ic("camera", "currentColor", 16)
    }, "Photo report available \u2014 14 photos from your clean."))), job.status === "completed" && !job.tipped && /*#__PURE__*/React.createElement(Card, {
      elevation: "raised",
      style: {
        background: "linear-gradient(180deg, var(--vm-cyan-tint), var(--vm-white))"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: job.cleaner,
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        color: "var(--vm-navy)"
      }
    }, "Loved your clean?"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: "var(--vm-muted)",
        marginTop: 2
      }
    }, "Send ", job.cleaner.split(" ")[0], " a thank-you tip \u2014 100% goes to them.")), /*#__PURE__*/React.createElement(Button, {
      variant: "cyan",
      pill: true,
      onClick: () => onTip(job)
    }, "Leave a tip")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      elevation: "raised"
    }, /*#__PURE__*/React.createElement(CardTitle, {
      style: {
        fontSize: 16,
        marginBottom: 14
      }
    }, "Your specialist"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: job.cleaner,
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 600,
        color: "var(--vm-navy)"
      }
    }, job.cleaner), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 13,
        color: "var(--vm-muted)",
        marginTop: 3
      }
    }, ic("star", "#F5B301", 14), " 4.9 \xB7 240 cleans")))), /*#__PURE__*/React.createElement(PaymentBalanceCard, {
      job: job,
      paid: job.paid,
      onPay: () => {}
    }), upcoming && /*#__PURE__*/React.createElement(Card, {
      elevation: "raised",
      padding: "md"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "navy",
      fullWidth: true
    }, "Reschedule"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      fullWidth: true
    }, "Cancel booking"))))));
  }
  function BookingsScreen({
    onSelect
  }) {
    const [tab, setTab] = React.useState("upcoming");
    const list = JOBS[tab];
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: 28,
        color: "var(--vm-navy)",
        margin: 0
      }
    }, "Welcome back, Jordan"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontFamily: "var(--font-body)",
        color: "var(--vm-muted)",
        margin: "6px 0 0"
      }
    }, "Manage your bookings and rebook in a tap.")), /*#__PURE__*/React.createElement(Button, {
      variant: "cyan",
      pill: true,
      iconRight: ic("plus", "var(--vm-navy)", 16)
    }, "New booking")), /*#__PURE__*/React.createElement("div", {
      style: {
        margin: "24px 0 22px"
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      tabs: [{
        value: "upcoming",
        label: "Upcoming",
        count: JOBS.upcoming.length
      }, {
        value: "past",
        label: "Past",
        count: JOBS.past.length
      }]
    })), list.length ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, list.map(j => /*#__PURE__*/React.createElement(JobRow, {
      key: j.id,
      job: j,
      onClick: onSelect
    }))) : /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        padding: "60px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "var(--vm-surface)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14
      }
    }, ic("calendar", "var(--vm-muted)", 26)), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: "var(--font-heading)",
        color: "var(--vm-navy)",
        margin: 0
      }
    }, "No bookings yet"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: "var(--vm-muted)",
        margin: "6px 0 0"
      }
    }, "Book your first clean to see it here.")));
  }
  function PortalApp() {
    const [section, setSection] = React.useState("bookings");
    const [selected, setSelected] = React.useState(null);
    const [tipJob, setTipJob] = React.useState(null);
    const nav = [["bookings", "Bookings"], ["payments", "Payments"], ["profile", "Profile"]];
    const go = s => {
      setSection(s);
      setSelected(null);
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        background: "var(--vm-surface)"
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        background: "var(--vm-navy)",
        padding: "0 24px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 980,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 32
      }
    }, /*#__PURE__*/React.createElement(BrandLogo, {
      theme: "dark",
      iconSize: 26,
      showTagline: false
    }), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: "flex",
        gap: 4
      }
    }, nav.map(([k, label]) => /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => go(k),
      style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        fontWeight: section === k ? 600 : 500,
        color: section === k ? "var(--vm-cyan)" : "rgba(255,255,255,0.75)"
      }
    }, label)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        display: "inline-flex"
      }
    }, ic("bell", "rgba(255,255,255,0.8)", 20), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--vm-cyan)"
      }
    })), /*#__PURE__*/React.createElement(Avatar, {
      name: "Jordan Avery",
      size: "sm"
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 980,
        margin: "0 auto",
        padding: "36px 24px"
      }
    }, tipJob ? /*#__PURE__*/React.createElement(TipFlow, {
      cleaner: tipJob.cleaner,
      onClose: () => setTipJob(null)
    }) : section === "bookings" ? selected ? /*#__PURE__*/React.createElement(JobDetail, {
      job: selected,
      onBack: () => setSelected(null),
      onTip: setTipJob
    }) : /*#__PURE__*/React.createElement(BookingsScreen, {
      onSelect: setSelected
    }) : section === "payments" ? /*#__PURE__*/React.createElement(PaymentsScreen, null) : /*#__PURE__*/React.createElement(ProfileScreen, null)));
  }
  Object.assign(window, {
    PortalApp
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/customer-portal/portal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/icons.js
try { (() => {
/* VelocityMaid — inline Lucide icon path data (self-contained, no CDN).
 * Stroke-based, 24×24, 2px, rounded caps. Kits read window.VM_ICON_PATHS[name]. */
window.VM_ICON_PATHS = {
  "home": '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  "calendar": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "truck": '<path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/>',
  "bed-double": '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  "bell": '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  "leaf": '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  "dollar-sign": '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  "repeat": '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  "headphones": '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  "camera": '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  "credit-card": '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  "alert-circle": '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>'
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/icons.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing/sections.jsx
try { (() => {
/* VelocityMaid — Marketing website sections (UI kit).
 * Composes design-system primitives from the bundle namespace. */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const {
  Button,
  BrandLogo,
  Card,
  CardTitle,
  CardDescription,
  Badge
} = VM;
const I = (name, color = "var(--vm-navy)", size = 20) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: name === "star" ? color : "none",
  stroke: color,
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    flexShrink: 0,
    display: "inline-block",
    verticalAlign: "middle"
  },
  dangerouslySetInnerHTML: {
    __html: window.VM_ICON_PATHS && window.VM_ICON_PATHS[name] || ""
  }
});
function MarketingHeader({
  onBook
}) {
  const links = ["Services", "Why Us", "Reviews", "Pricing", "FAQ"];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "var(--vm-navy)",
      borderBottom: "1px solid rgba(255,255,255,0.1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-marketing)",
      margin: "0 auto",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(BrandLogo, {
    theme: "dark",
    iconSize: 28,
    showTagline: false
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 26
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      color: "var(--vm-white)",
      fontFamily: "var(--font-body)",
      fontSize: 14,
      textDecoration: "none"
    },
    onMouseEnter: e => e.target.style.color = "var(--vm-cyan)",
    onMouseLeave: e => e.target.style.color = "var(--vm-white)"
  }, l)), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "rgba(255,255,255,0.85)",
      fontFamily: "var(--font-body)",
      fontSize: 14
    }
  }, "Customer Portal"), /*#__PURE__*/React.createElement(Button, {
    variant: "cyan",
    size: "sm",
    onClick: onBook
  }, "Book Now"))));
}
function MarketingHero({
  onBook
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "linear-gradient(180deg, var(--vm-navy) 0%, #13243b 100%)",
      color: "var(--vm-white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-marketing)",
      margin: "0 auto",
      padding: "84px 24px",
      display: "grid",
      gridTemplateColumns: "1.1fr 0.9fr",
      gap: 56,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "rgba(0,194,203,0.12)",
      border: "1px solid rgba(0,194,203,0.3)",
      borderRadius: "var(--radius-pill)",
      padding: "6px 14px",
      marginBottom: 22
    }
  }, I("star", "var(--vm-cyan)", 15), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: 13,
      color: "var(--vm-cyan)"
    }
  }, "100+ five-star cleans across NJ & Vermont")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 56,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      margin: 0,
      color: "var(--vm-white)"
    }
  }, "Come home", /*#__PURE__*/React.createElement("br", null), "to clean."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 19,
      lineHeight: 1.6,
      color: "rgba(255,255,255,0.75)",
      maxWidth: 460,
      marginTop: 22
    }
  }, "Premium residential cleaning and short-term rental turnovers \u2014 with hospitality-level attention to every detail."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "cyan",
    size: "lg",
    pill: true,
    iconRight: I("arrow-right", "var(--vm-navy)", 18),
    onClick: onBook
  }, "Book a clean"), /*#__PURE__*/React.createElement(Button, {
    variant: "navyOutline",
    size: "lg",
    pill: true,
    style: {
      color: "var(--vm-white)",
      borderColor: "rgba(255,255,255,0.3)"
    }
  }, "See pricing")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 28,
      marginTop: 40
    }
  }, [["Insured & vetted", "shield-check"], ["Photo reports", "camera"], ["Eco-friendly", "leaf"]].map(([t, ic]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, I(ic, "var(--vm-cyan)", 18), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "rgba(255,255,255,0.8)"
    }
  }, t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--vm-white)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-lg)",
      padding: 26
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 17,
      color: "var(--vm-navy)"
    }
  }, "Next available"), /*#__PURE__*/React.createElement(Badge, {
    variant: "success"
  }, "3 slots today")), [["Tomorrow · 9:00 AM", "Deep clean · 3 bed", "$220"], ["Thu · 1:00 PM", "Turnover · STR", "$225"], ["Fri · 10:30 AM", "Standard · 2 bed", "$120"]].map(([d, s, p], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 0",
      borderTop: i ? "1px solid var(--border-default)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: "var(--vm-cyan-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, I("calendar", "var(--vm-cyan-dark)", 18)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: 14,
      color: "var(--vm-navy)"
    }
  }, d), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--vm-muted)"
    }
  }, s))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      color: "var(--vm-navy)"
    }
  }, p)))))));
}
function ServicesStrip() {
  const items = [["sparkles", "Standard cleaning", "Regular maintenance that keeps every room guest-ready."], ["home", "Deep clean", "Top-to-bottom reset — ovens, baseboards, and the details."], ["truck", "Move in / out", "Deposit-ready finish for an empty home."], ["bed-double", "STR turnovers", "Between-guest resets with a photo report every time."]];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--vm-white)",
      padding: "80px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-marketing)",
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "vm-eyebrow",
    style: {
      color: "var(--vm-cyan-dark)",
      textAlign: "center"
    }
  }, "What we do"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 38,
      color: "var(--vm-navy)",
      textAlign: "center",
      margin: "8px 0 0"
    }
  }, "Services for every home"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 22,
      marginTop: 44
    }
  }, items.map(([ic, t, d]) => /*#__PURE__*/React.createElement(Card, {
    key: t,
    elevation: "raised",
    interactive: true
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 12,
      background: "var(--vm-cyan-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16
    }
  }, I(ic, "var(--vm-cyan-dark)", 22)), /*#__PURE__*/React.createElement(CardTitle, null, t), /*#__PURE__*/React.createElement(CardDescription, null, d))))));
}
function PricingSection({
  onBook
}) {
  const [market, setMarket] = React.useState("nj");
  const nj = [{
    name: "Basic clean",
    price: "$120",
    per: "per service",
    desc: "Perfect for regular maintenance",
    features: ["Kitchen cleaning", "Bathroom cleaning", "Dusting & vacuuming", "Floor mopping"],
    highlight: false
  }, {
    name: "Deep clean",
    price: "$220",
    per: "per service",
    desc: "Thorough top-to-bottom clean",
    features: ["Everything in Basic", "Inside oven & fridge", "Cabinet fronts", "Baseboards & edges"],
    highlight: true
  }, {
    name: "Move-in / out",
    price: "$320",
    per: "per service",
    desc: "Full property reset",
    features: ["Everything in Deep", "Inside all cabinets", "Walls spot-cleaned", "Deposit-ready finish"],
    highlight: false
  }];
  const vt = [{
    name: "Turnover clean",
    price: "$225",
    per: "per turn",
    desc: "Between-guest reset for STRs",
    features: ["Full kitchen reset", "All bathrooms cleaned", "Beds stripped & remade", "Photo report included"],
    highlight: false
  }, {
    name: "Large property",
    price: "$275",
    per: "per turn",
    desc: "4+ bed homes & extended area",
    features: ["Everything in Turnover", "Travel premium included", "Linen change add-on", "Priority scheduling"],
    highlight: true
  }, {
    name: "Deep clean",
    price: "$375",
    per: "per visit",
    desc: "First visit or post-season reset",
    features: ["Full-day service", "Inside oven & fridge", "Baseboards & sills", "Detailed photo report"],
    highlight: false
  }];
  const plans = market === "nj" ? nj : vt;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--vm-surface)",
      padding: "80px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-marketing)",
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 38,
      color: "var(--vm-navy)",
      textAlign: "center",
      margin: 0
    }
  }, "Transparent pricing"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 19,
      color: "var(--vm-muted)",
      textAlign: "center",
      marginTop: 10
    }
  }, "No hidden fees, just clean homes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 8,
      margin: "30px 0 40px"
    }
  }, [["nj", "New Jersey"], ["vermont", "Vermont"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setMarket(k),
    style: {
      padding: "9px 22px",
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-heading)",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      border: market === k ? "1px solid var(--vm-navy)" : "1px solid var(--border-default)",
      background: market === k ? "var(--vm-navy)" : "var(--vm-white)",
      color: market === k ? "var(--vm-white)" : "var(--vm-muted)"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 24,
      alignItems: "start"
    }
  }, plans.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    elevation: "feature",
    highlight: p.highlight,
    style: {
      position: "relative"
    }
  }, p.highlight && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -14,
      left: "50%",
      transform: "translateX(-50%)"
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "navy"
  }, "Most Popular")), /*#__PURE__*/React.createElement(CardTitle, {
    style: {
      fontSize: 22
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "8px 0 4px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 38,
      color: "var(--vm-cyan-dark)"
    }
  }, p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--vm-muted)"
    }
  }, " ", p.per)), /*#__PURE__*/React.createElement(CardDescription, {
    style: {
      marginBottom: 18
    }
  }, p.desc), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: "0 0 22px",
      display: "flex",
      flexDirection: "column",
      gap: 11
    }
  }, p.features.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "var(--vm-text)"
    }
  }, I("check", "var(--vm-cyan-dark)", 17), f))), /*#__PURE__*/React.createElement(Button, {
    variant: p.highlight ? "navy" : "navyOutline",
    pill: true,
    fullWidth: true,
    onClick: onBook
  }, "Book Now"))))));
}
function Testimonials() {
  const data = [{
    name: "Sarah M.",
    location: "Newark, NJ",
    text: "VelocityMaid transformed our home! The team was professional, thorough, and left everything spotless."
  }, {
    name: "Michael R.",
    location: "Jersey City, NJ",
    text: "As an Airbnb host, I need reliable turnovers. VelocityMaid never disappoints — my guests always notice."
  }, {
    name: "Jennifer L.",
    location: "Newark, NJ",
    text: "Best cleaning service I've used. They pay attention to every detail and use eco-friendly products."
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--vm-white)",
      padding: "80px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-marketing)",
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 38,
      color: "var(--vm-navy)",
      textAlign: "center",
      margin: 0
    }
  }, "What our customers say"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 24,
      marginTop: 44
    }
  }, data.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.name,
    elevation: "raised"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      marginBottom: 14
    }
  }, [0, 1, 2, 3, 4].map(i => I("star", "#F5B301", 18))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 15,
      lineHeight: 1.65,
      color: "var(--vm-text)",
      margin: "0 0 18px"
    }
  }, "\"", t.text, "\""), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border-default)",
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      color: "var(--vm-navy)"
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--vm-muted)"
    }
  }, t.location)))))));
}
function CtaBand({
  onBook
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--vm-navy)",
      padding: "64px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 820,
      margin: "0 auto",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 38,
      color: "var(--vm-white)",
      margin: 0
    }
  }, "Ready for a spotless home?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 18,
      color: "rgba(255,255,255,0.7)",
      marginTop: 14
    }
  }, "Book online in under two minutes. We handle the rest."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "cyan",
    size: "lg",
    pill: true,
    onClick: onBook
  }, "Book a clean"))));
}
function MarketingFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--vm-navy)",
      borderTop: "1px solid rgba(0,194,203,0.1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-marketing)",
      margin: "0 auto",
      padding: "48px 24px",
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr 1fr",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(BrandLogo, {
    theme: "dark",
    iconSize: 24,
    showTagline: false
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-heading)",
      textTransform: "uppercase",
      letterSpacing: "0.2em",
      fontSize: 11,
      color: "var(--vm-cyan)",
      marginTop: 12
    }
  }, "Come home to clean."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "rgba(255,255,255,0.6)",
      marginTop: 12,
      lineHeight: 1.6
    }
  }, "Serving New Jersey and Vermont. Trusted since 2024.")), [["Resources", ["Partners", "Investor Materials", "Pricing"]], ["Contact", ["New Jersey — (973) 280-9190", "Vermont — (802) 733-5348", "hello@velocitymaid.com"]]].map(([h, items]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: "var(--font-heading)",
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      fontSize: 12,
      color: "rgba(255,255,255,0.5)",
      margin: "0 0 14px"
    }
  }, h), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, items.map(it => /*#__PURE__*/React.createElement("li", {
    key: it
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "rgba(255,255,255,0.7)",
      textDecoration: "none"
    }
  }, it))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(0,194,203,0.1)",
      padding: "22px",
      textAlign: "center",
      fontFamily: "var(--font-body)",
      fontSize: 13,
      color: "rgba(255,255,255,0.35)"
    }
  }, "\xA9 2026 VelocityMaid. All rights reserved."));
}
Object.assign(window, {
  MarketingHeader,
  MarketingHero,
  ServicesStrip,
  PricingSection,
  Testimonials,
  CtaBand,
  MarketingFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/mobile.jsx
try { (() => {
/* VelocityMaid — Mobile app (UI kit). 390px design width, multi-screen. */
const VM = window.VelocityMaidDesignSystem_2d9dc2;
const {
  Button,
  BrandLogo,
  StatusBadge,
  Avatar,
  Badge,
  Input,
  FormRow,
  Switch
} = VM;
const ic = (name, color, size = 22) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: name === "star" ? color : "none",
  stroke: color,
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    flexShrink: 0,
    display: "inline-block",
    verticalAlign: "middle"
  },
  dangerouslySetInnerHTML: {
    __html: window.VM_ICON_PATHS && window.VM_ICON_PATHS[name] || ""
  }
});
const UPCOMING = [{
  service: "Deep clean",
  date: "Thu, Jun 26 · 9:00 AM",
  cleaner: "Mike Rivera",
  status: "scheduled"
}, {
  service: "Standard clean",
  date: "Mon, Jun 30 · 1:00 PM",
  cleaner: "Ana Lopez",
  status: "assigned"
}];
const PAST = [{
  service: "Standard clean",
  date: "Jun 5",
  status: "completed",
  tip: true
}, {
  service: "Deep clean",
  date: "May 22",
  status: "completed",
  tip: false
}];
function HomeScreen({
  onTip
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 22,
      color: "var(--vm-navy)",
      margin: "0 0 4px"
    }
  }, "Hi, Jordan \uD83D\uDC4B"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "var(--vm-muted)",
      margin: "0 0 18px"
    }
  }, "Your home is in good hands."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--vm-navy)",
      borderRadius: "var(--radius-xl)",
      padding: 20,
      color: "var(--vm-white)",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-heading)",
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      fontSize: 11,
      color: "var(--vm-cyan)"
    }
  }, "Next clean"), /*#__PURE__*/React.createElement(Badge, {
    variant: "cyanSolid"
  }, "In 2 days")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 20
    }
  }, "Deep clean"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "rgba(255,255,255,0.7)",
      marginTop: 4
    }
  }, "Thu, Jun 26 \xB7 9:00 AM"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 16,
      paddingTop: 16,
      borderTop: "1px solid rgba(255,255,255,0.12)"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Mike Rivera",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: 14
    }
  }, "Mike Rivera"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)"
    }
  }, "Your specialist \xB7 \u2605 4.9")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "var(--vm-cyan)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, ic("message-circle", "var(--vm-navy)", 18)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 18
    }
  }, [["plus", "Book a clean"], ["repeat", "Rebook last"], ["star", "Leave a tip"], ["headphones", "Get help"]].map(([icon, label]) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: label === "Leave a tip" ? onTip : undefined,
    style: {
      textAlign: "left",
      cursor: "pointer",
      background: "var(--vm-white)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: "var(--vm-cyan-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, ic(icon, "var(--vm-cyan-dark)", 19)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: 14,
      color: "var(--vm-navy)"
    }
  }, label)))));
}
function BookingsScreenM({
  onTip
}) {
  const [seg, setSeg] = React.useState("upcoming");
  const list = seg === "upcoming" ? UPCOMING : PAST;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 22,
      color: "var(--vm-navy)",
      margin: "0 0 14px"
    }
  }, "Bookings"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      background: "var(--vm-surface)",
      borderRadius: "var(--radius-pill)",
      padding: 4,
      marginBottom: 16
    }
  }, [["upcoming", "Upcoming"], ["past", "Past"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setSeg(k),
    style: {
      flex: 1,
      padding: "8px 0",
      borderRadius: "var(--radius-pill)",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: 13.5,
      background: seg === k ? "var(--vm-white)" : "transparent",
      color: seg === k ? "var(--vm-navy)" : "var(--vm-muted)",
      boxShadow: seg === k ? "var(--shadow-sm)" : "none"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, list.map((j, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--vm-white)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: "var(--vm-cyan-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, ic("home", "var(--vm-cyan-dark)", 18)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: 14,
      color: "var(--vm-navy)"
    }
  }, j.service), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--vm-muted)",
      marginTop: 2
    }
  }, j.date))), /*#__PURE__*/React.createElement(StatusBadge, {
    status: j.status
  })), seg === "past" && j.status === "completed" && !j.tip && /*#__PURE__*/React.createElement("button", {
    onClick: onTip,
    style: {
      marginTop: 12,
      width: "100%",
      padding: "9px 0",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--vm-cyan)",
      background: "var(--vm-cyan-tint)",
      color: "var(--vm-navy)",
      fontFamily: "var(--font-heading)",
      fontWeight: 600,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      cursor: "pointer"
    }
  }, "Leave a tip"), j.tip && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "cyan",
    icon: ic("star", "var(--vm-cyan-dark)", 12)
  }, "Tipped \u2014 thank you!"))))));
}
function AccountScreenM() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Jordan Avery",
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-heading)",
      fontWeight: 700,
      fontSize: 18,
      color: "var(--vm-navy)"
    }
  }, "Jordan Avery"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--vm-muted)"
    }
  }, "Newark, NJ \xB7 VIP host"))), /*#__PURE__*/React.createElement(FormRow, {
    label: "Phone",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    type: "tel",
    defaultValue: "(973) 555-0142"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--vm-white)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: 4,
      marginBottom: 16
    }
  }, [["Booking confirmations", true], ["Specialist on the way", true], ["Promotions & offers", false]].map(([l, on], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 12px",
      borderTop: i ? "1px solid var(--border-default)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      color: "var(--vm-text)"
    }
  }, l), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: on
  })))), /*#__PURE__*/React.createElement(Button, {
    variant: "navyOutline",
    fullWidth: true
  }, "Manage payment methods"));
}
function TipSheet({
  onClose
}) {
  const {
    TipFlow
  } = window;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(15,28,46,0.5)",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 20
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      background: "var(--vm-surface)",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: "18px 14px 24px",
      maxHeight: "88%",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: "var(--border-default)",
      margin: "0 auto 16px"
    }
  }), TipFlow ? /*#__PURE__*/React.createElement(TipFlow, {
    cleaner: "Mike Rivera",
    onClose: onClose
  }) : null));
}
function MobileScreen() {
  const [tab, setTab] = React.useState("home");
  const [tip, setTip] = React.useState(false);
  const tabs = [["home", "Home"], ["calendar", "Bookings"], ["plus", "Book"], ["message-circle", "Chat"], ["user", "Account"]];
  const openTip = () => setTip(true);
  const body = tab === "calendar" ? /*#__PURE__*/React.createElement(BookingsScreenM, {
    onTip: openTip
  }) : tab === "user" ? /*#__PURE__*/React.createElement(AccountScreenM, null) : /*#__PURE__*/React.createElement(HomeScreen, {
    onTip: openTip
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 800,
      background: "var(--vm-surface)",
      borderRadius: 40,
      border: "10px solid #0a121d",
      overflow: "hidden",
      position: "relative",
      boxShadow: "var(--shadow-lg)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--vm-navy)",
      color: "var(--vm-white)",
      padding: "10px 22px 0",
      fontFamily: "var(--font-body)",
      fontSize: 13,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", null, "\u25CF\u25CF\u25CF 5G \u23FB")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--vm-navy)",
      padding: "10px 18px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(BrandLogo, {
    theme: "dark",
    iconSize: 24,
    showTagline: false
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, ic("bell", "rgba(255,255,255,0.85)", 22), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: -1,
      right: -1,
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--vm-cyan)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, body), tip && /*#__PURE__*/React.createElement(TipSheet, {
    onClose: () => setTip(false)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--vm-white)",
      borderTop: "1px solid var(--border-default)",
      display: "flex",
      justifyContent: "space-around",
      padding: "10px 8px 20px"
    }
  }, tabs.map(([icon, label]) => {
    const active = tab === icon;
    if (label === "Book") return /*#__PURE__*/React.createElement("button", {
      key: label,
      onClick: () => setTab("home"),
      style: {
        background: "var(--vm-cyan)",
        border: "none",
        width: 48,
        height: 48,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: -16,
        boxShadow: "var(--shadow-cyan)",
        cursor: "pointer"
      }
    }, ic("plus", "var(--vm-navy)", 24));
    return /*#__PURE__*/React.createElement("button", {
      key: label,
      onClick: () => setTab(icon),
      style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        flex: 1
      }
    }, ic(icon, active ? "var(--vm-cyan-dark)" : "var(--vm-muted)", 22), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: 10.5,
        fontWeight: active ? 600 : 500,
        color: active ? "var(--vm-navy)" : "var(--vm-muted)"
      }
    }, label));
  })));
}
function MobileKit() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--vm-surface)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 30
    }
  }, /*#__PURE__*/React.createElement(MobileScreen, null));
}
Object.assign(window, {
  MobileKit
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/mobile.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.BrandLogo = __ds_scope.BrandLogo;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.CardDescription = __ds_scope.CardDescription;

__ds_ns.KpiCard = __ds_scope.KpiCard;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FormRow = __ds_scope.FormRow;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
