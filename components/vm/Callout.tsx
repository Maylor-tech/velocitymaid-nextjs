import * as React from "react";
import { cn } from "@/lib/utils";

export type CalloutTone = "note" | "warning";

const toneClass: Record<CalloutTone, string> = {
  note: "bg-vm-cyan-tint border-vm-cyan-border text-vm-text",
  warning: "bg-vm-warning-bg border-vm-warning-border text-vm-warning",
};

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CalloutTone;
  title?: string;
}

/** Callout — note | warning */
export function Callout({
  tone = "note",
  title,
  className,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-vm-lg border px-4 py-3 font-body text-sm leading-relaxed",
        toneClass[tone],
        className
      )}
      {...props}
    >
      {title ? (
        <p className="mb-1 font-heading text-sm font-bold tracking-tight text-vm-navy">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export default Callout;
