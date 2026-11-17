import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

/** MetricCard — cyan 36×4 accent bar (handoff admin metrics). */
export function MetricCard({
  label,
  value,
  hint,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-vm-lg border border-vm-line bg-vm-surface p-5 shadow-vm-card",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-1 w-9 bg-vm-cyan"
        style={{ width: 36, height: 4 }}
      />
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-vm-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-bold tracking-tight text-vm-navy">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 font-body text-xs text-vm-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export default MetricCard;
