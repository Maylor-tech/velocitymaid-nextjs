import React from "react";

/**
 * Table — data table for admin/ops views. Pass `columns` and `rows`.
 * Each column: { key, header, align?, width?, render?(value,row) }.
 */
export function Table({ columns = [], rows = [], zebra = false, onRowClick, getRowKey, style = {} }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-default)", background: "var(--vm-white)", ...style }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{
                textAlign: c.align || "left", padding: "12px 16px",
                fontFamily: "var(--font-heading)", fontSize: "var(--text-xs)", fontWeight: "var(--fw-bold)",
                textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", color: "var(--vm-muted)",
                borderBottom: "1px solid var(--border-default)", whiteSpace: "nowrap", width: c.width,
              }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={getRowKey ? getRowKey(row, i) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                cursor: onRowClick ? "pointer" : "default",
                background: zebra && i % 2 ? "var(--vm-surface)" : "transparent",
                transition: "background var(--duration-fast)",
              }}
              onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.background = "var(--vm-cyan-tint)"; }}
              onMouseLeave={(e) => { if (onRowClick) e.currentTarget.style.background = zebra && i % 2 ? "var(--vm-surface)" : "transparent"; }}
            >
              {columns.map((c) => (
                <td key={c.key} style={{
                  textAlign: c.align || "left", padding: "14px 16px",
                  fontSize: "var(--text-sm)", color: "var(--text-primary)",
                  borderBottom: i < rows.length - 1 ? "1px solid var(--border-default)" : "none",
                }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
