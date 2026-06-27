import React from "react";

/**
 * StatusBadge — job lifecycle status pill. Maps the operational job statuses
 * used across customer, cleaner, and admin surfaces to calm semantic tints.
 */
const STATUS = {
  pending:               { label: "Pending",               bg: "var(--vm-warning-bg)", fg: "var(--vm-warning)" },
  scheduled:             { label: "Scheduled",             bg: "var(--vm-cyan-tint)",  fg: "var(--vm-navy)" },
  assigned:              { label: "Assigned",              bg: "var(--vm-cyan-tint)",  fg: "var(--vm-navy)" },
  in_progress:           { label: "In Progress",           bg: "var(--vm-progress-bg)", fg: "var(--vm-progress)" },
  completed:             { label: "Completed",             bg: "var(--vm-success-bg)", fg: "var(--vm-success)" },
  cancelled:             { label: "Cancelled",             bg: "var(--vm-danger-bg)",  fg: "var(--vm-danger)" },
  reschedule_requested:  { label: "Reschedule Requested",  bg: "var(--vm-warning-bg)", fg: "var(--vm-warning)" },
  cancel_requested:      { label: "Cancel Requested",      bg: "var(--vm-danger-bg)",  fg: "var(--vm-danger)" },
};

export function StatusBadge({ status = "pending", icon, className = "", style = {} }) {
  const c = STATUS[String(status).toLowerCase()] || { label: status, bg: "var(--vm-surface)", fg: "var(--vm-text)" };
  return (
    <span
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        fontFamily: "var(--font-body)", fontWeight: "var(--fw-medium)",
        fontSize: "var(--text-sm)", padding: "4px 12px",
        borderRadius: "var(--radius-pill)", background: c.bg, color: c.fg,
        ...style,
      }}
    >
      {icon}
      {c.label}
    </span>
  );
}
