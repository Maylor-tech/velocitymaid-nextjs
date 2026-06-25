import React from "react";

/**
 * Avatar — cleaner / customer identity chip. Falls back to initials on navy.
 */
export function Avatar({ name = "", src, size = "md", className = "", style = {} }) {
  const dims = { sm: 32, md: 40, lg: 56 }[size] || 40;
  const fontSize = { sm: "12px", md: "14px", lg: "18px" }[size] || "14px";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
  return (
    <div
      className={className}
      style={{
        width: dims, height: dims, borderRadius: "var(--radius-pill)",
        background: src ? "transparent" : "var(--vm-navy)", color: "var(--vm-white)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-heading)", fontWeight: "var(--fw-bold)", fontSize,
        overflow: "hidden", flexShrink: 0, ...style,
      }}
    >
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials || "?"}
    </div>
  );
}
