import React from "react";

/**
 * FormRow — label + control wrapper with required marker, help text, and error.
 */
export function FormRow({ label, required = false, children, error, helpText, htmlFor, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {label && (
        <label htmlFor={htmlFor} style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-primary)" }}>
          {label}
          {required && <span style={{ color: "var(--vm-danger)", marginLeft: 4 }}>*</span>}
        </label>
      )}
      {children}
      {error
        ? <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--vm-danger)" }}>{error}</p>
        : helpText && <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{helpText}</p>}
    </div>
  );
}
