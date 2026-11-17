import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusPillTone = "info" | "warning" | "danger" | "success";

const toneClass: Record<StatusPillTone, string> = {
  info: "bg-vm-cyan-tint text-vm-cyan-ink border-vm-cyan-border",
  warning: "bg-vm-warning-bg text-vm-warning border-vm-warning-border",
  danger: "bg-vm-danger-bg text-vm-danger border-vm-danger/20",
  success: "bg-vm-success/10 text-vm-success border-vm-success/20",
};

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusPillTone;
}

/** Tag / StatusPill — info · warning · danger · success */
export function StatusPill({
  tone = "info",
  className,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 font-body text-xs font-semibold tracking-wide",
        toneClass[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Alias per handoff naming */
export const Tag = StatusPill;

export default StatusPill;
