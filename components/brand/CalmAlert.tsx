import { ReactNode } from "react";

interface CalmAlertProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Hospitality-style alert — forest tint + gold accent, not harsh warning yellow */
export function CalmAlert({ children, icon, className = "" }: CalmAlertProps) {
  return (
    <div
      className={`flex items-start gap-3 bg-brand-forest/5 p-4 rounded border border-brand-forest/10 ${className}`}
      role="status"
    >
      {icon && <span className="text-brand-gold shrink-0 mt-0.5">{icon}</span>}
      <div className="text-sm font-sans font-medium text-brand-slate/90">{children}</div>
    </div>
  );
}
