import * as React from "react";
import { cn } from "@/lib/utils";
import { vmFocusRing } from "./focus";

export type VmButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "danger"
  | "link";

export interface VmButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VmButtonVariant;
}

const variantClass: Record<VmButtonVariant, string> = {
  primary:
    "bg-vm-navy text-vm-white hover:bg-vm-navy/90 shadow-vm-card border border-transparent",
  accent:
    "bg-vm-cyan text-vm-navy hover:bg-vm-cyan/90 shadow-vm-card border border-transparent",
  secondary:
    "bg-vm-surface text-vm-text border border-vm-field-border hover:border-vm-navy/40",
  danger:
    "bg-vm-danger text-vm-white hover:bg-vm-danger/90 border border-transparent",
  link: "bg-transparent text-vm-cyan-dark underline-offset-4 hover:underline px-0 shadow-none border-0",
};

/**
 * VelocityMaid shared Button (Prompt 2).
 * primary navy · accent cyan+navy text · secondary white · danger · link
 * Sentence case. Min 44px touch. Never white text on cyan.
 */
export const Button = React.forwardRef<HTMLButtonElement, VmButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-vm-md px-5 font-heading text-sm font-bold tracking-tight transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-touch",
          vmFocusRing,
          variantClass[variant],
          variant === "link" ? "min-h-0 py-1" : "py-2.5",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "VmButton";

export default Button;
