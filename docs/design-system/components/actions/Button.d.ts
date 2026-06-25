import * as React from "react";

export type ButtonVariant = "navy" | "cyan" | "navyOutline" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * VelocityMaid primary action control. `navy` = primary CTA, `cyan` = accent CTA,
 * `navyOutline` = secondary. Labels render uppercase in Space Grotesk.
 *
 * @startingPoint section="Actions" subtitle="Approved CTA button system" viewport="700x180"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Fully rounded pill shape (used for marketing CTAs). */
  pill?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
