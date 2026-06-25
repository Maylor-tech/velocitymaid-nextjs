import { ReactNode } from "react";

interface CalmAlertProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Hospitality-style alert — calm cyan info tint, not harsh warning yellow */
export function CalmAlert({ children, icon, className = "" }: CalmAlertProps) {
  return (
    <div
      className={`flex items-start gap-3 bg-vm-cyan-tint p-4 rounded border border-vm-border ${className}`}
      role="status"
    >
      {icon && <span className="text-vm-cyan-dark shrink-0 mt-0.5">{icon}</span>}
      <div className="text-sm font-body font-medium text-vm-text">{children}</div>
    </div>
  );
}
