import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    /** Approved primary CTA — Navy fill, White text (lib/brand/buttons.ts) */
    | "navy"
    /** Approved accent CTA — Cyan fill, Navy text (lib/brand/buttons.ts) */
    | "cyan"
    /** Approved outline — Navy border/text (lib/brand/buttons.ts) */
    | "navyOutline"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "navy" ||
            variant === "cyan" ||
            variant === "navyOutline"
            ? "btn-tactile transition-[transform,background-color,border-color] duration-150"
            : "transition-colors",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            // Approved — Navy primary CTA (lib/brand/buttons.ts → buttonTokens.primary)
            "bg-vm-navy text-vm-white font-heading font-bold uppercase tracking-wider text-xs hover:bg-vm-navy/90 shadow-md":
              variant === "navy",
            // Approved — Cyan accent CTA (lib/brand/buttons.ts → buttonTokens.accent)
            "bg-vm-cyan text-vm-navy font-heading font-bold uppercase tracking-wider text-xs hover:bg-vm-cyan-dark shadow-md":
              variant === "cyan",
            // Approved — Navy outline (lib/brand/buttons.ts → buttonTokens.outline)
            "border border-vm-navy/20 hover:border-vm-navy text-vm-navy font-heading font-bold uppercase tracking-wider text-xs bg-transparent":
              variant === "navyOutline",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
